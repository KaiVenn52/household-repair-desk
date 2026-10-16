import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export class DeskError extends Error {
  constructor(code, message, status = 409) { super(message); this.code = code; this.status = status; }
}
export const quotes = [
  { id: 'q-clear', provider: 'Clear Pipe (fictional)', source: 'fixtures/quotes/clear-pipe.txt', currency: 'USD', callout: 35, labor: 95, total: 130, partsIncluded: false, warrantyDays: 14, scope: 'Replace the kitchen sink trap seal. Parts cost is additional and unknown.' },
  { id: 'q-home', provider: 'Homekind Plumbing (fictional)', source: 'fixtures/quotes/homekind.txt', currency: 'USD', callout: 0, labor: 145, total: 145, partsIncluded: true, warrantyDays: 60, scope: 'Replace the kitchen sink trap seal; standard seal and labor included. Additional faults need a new quote.' }
];
const legacySlots = [
  { id: 'mon-am', label: 'Monday, October 19 · 09:00–10:00', start: '2026-10-19T09:00:00+08:00', end: '2026-10-19T10:00:00+08:00', householdAvailable: false, reason: 'Alex and Sam are both away.', providers: ['q-clear', 'q-home'] },
  { id: 'mon-pm', label: 'Monday, October 19 · 14:00–15:00', start: '2026-10-19T14:00:00+08:00', end: '2026-10-19T15:00:00+08:00', householdAvailable: true, reason: 'Sam is home; Alex has agreed to Sam supervising.', providers: ['q-home'] },
  { id: 'tue-am', label: 'Tuesday, October 20 · 10:00–11:00', start: '2026-10-20T10:00:00+08:00', end: '2026-10-20T11:00:00+08:00', householdAvailable: true, reason: 'Alex is home.', providers: ['q-clear', 'q-home'] }
];
export function createSlots(now) {
  // Use the next Monday in UTC+08 and freeze these dates on each task. This
  // keeps fresh demos usable during judging without shifting an existing plan.
  const monday = new Date(now.getTime() + 8 * 60 * 60_000);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() + ((1 - monday.getUTCDay() + 7) % 7 || 7));
  const tuesday = new Date(monday.getTime() + 24 * 60 * 60_000);
  const dates = [monday, monday, tuesday];
  return legacySlots.map((slot, index) => {
    const date = dates[index].toISOString().slice(0, 10);
    const day = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }).format(dates[index]);
    return { ...structuredClone(slot), host: index === 1 ? 'Sam' : index === 2 ? 'Alex' : null, label: `${day} · ${slot.start.slice(11,16)}–${slot.end.slice(11,16)}`, start: `${date}${slot.start.slice(10)}`, end: `${date}${slot.end.slice(10)}` };
  });
}
const fail = (code, message, status) => { throw new DeskError(code, message, status); };
export class RepairDesk {
  constructor(file, clock = () => new Date()) {
    this.file = file; this.clock = clock;
    this.tasks = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
    for (const task of this.tasks) {
      task.calendar ??= structuredClone(legacySlots);
      for (const slot of task.calendar) slot.host ??= slot.id === 'mon-pm' ? 'Sam' : slot.id === 'tue-am' ? 'Alex' : null;
    }
  }
  save() {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(`${this.file}.tmp`, JSON.stringify(this.tasks, null, 2));
    renameSync(`${this.file}.tmp`, this.file);
  }
  event(task, type, detail) { task.events.push({ type, detail, at: this.clock().toISOString() }); task.version++; }
  task(id) { return this.tasks.find(t => t.id === id) ?? fail('NOT_FOUND', 'Repair task not found.', 404); }
  publicTask(task) { const copy = structuredClone(task); if (copy.proposal) delete copy.proposal.token; return copy; }
  list() { return this.tasks.map(t => this.publicTask(t)); }
  get(id) { return this.publicTask(this.task(id)); }
  report({ description, member = 'Alex' }) {
    if (typeof description !== 'string' || description.trim().length < 8 || description.length > 1000) fail('INVALID_REPORT', 'Describe the repair in 8–1,000 characters.', 400);
    if (!['Alex', 'Sam'].includes(member)) fail('INVALID_MEMBER', 'Choose a demo household member.', 400);
    // Only this fixture-backed repair is supported; do not apply plumbing prices to arbitrary problems.
    if (!/kitchen\s+sink/i.test(description) || !/leak|drip/i.test(description)) fail('UNSUPPORTED_REPAIR', 'This demo supports a leaking kitchen sink. Other repairs need their own quotes.', 400);
    if (/gas|fire|smoke|electric|shock|flood|sewage/i.test(description)) fail('URGENT_REPAIR', 'This demo cannot handle hazards. Stop this workflow and seek qualified local help.', 400);
    const task = { id: randomUUID(), description: description.trim(), member, status: 'reported', version: 0, proposal: null, calendar: createSlots(this.clock()), events: [] };
    this.event(task, 'reported', `${member} reported: ${task.description}`);
    this.tasks.push(task); this.save(); return this.publicTask(task);
  }
  compare({ taskId }) {
    const task = this.task(taskId);
    if (!['reported', 'compared', 'needs_replan', 'planning_blocked'].includes(task.status)) fail('INVALID_STATE', 'Compare quotes before proposing a time. A pending or approved plan must be withdrawn before replacing it.');
    if (task.status !== 'compared') { task.status = 'compared'; this.event(task, 'quotes_compared', 'Compared two fictional quotes against their source documents.'); this.save(); }
    return { task: this.publicTask(task), quotes, slots: task.calendar, recommendation: 'Homekind is $15 more upfront, includes the standard seal, and offers 60 rather than 14 warranty days. Clear Pipe is $130 before parts, so its final cost is unknown. No claim that Homekind is always cheaper.', evidence: quotes.map(q => q.source), timezone: 'Asia/Kuala_Lumpur', simulated: true };
  }
  propose({ taskId, quoteId, slotId, version }) {
    const task = this.task(taskId);
    if (task.version !== version) fail('STALE_TASK', 'The task changed. Refresh it before proposing a time.');
    if (task.status !== 'compared') fail('INVALID_STATE', 'Compare both quotes before proposing a time.');
    const quote = quotes.find(q => q.id === quoteId) ?? fail('INVALID_QUOTE', 'Select one of the two source-backed quotes.', 400);
    if (task.planReasoning && (!quote.partsIncluded || quote.total > task.planReasoning.maxTotal)) fail('BUDGET_UNVERIFIED', 'This quote cannot guarantee the current budget. Change the budget explicitly or obtain a complete quote.');
    const slot = task.calendar.find(s => s.id === slotId) ?? fail('INVALID_SLOT', 'Choose a listed time.', 400);
    if (!slot.householdAvailable || !slot.providers.includes(quoteId)) fail('UNAVAILABLE_SLOT', 'That time does not work for both the household and this provider.');
    if (new Date(slot.start) <= this.clock()) fail('PAST_SLOT', 'This sample appointment is in the past. Open a new repair task for fresh sample dates.');
    task.status = 'awaiting_approval';
    task.proposal = { id: randomUUID(), quoteId, slotId, amount: quote.total, currency: quote.currency, partsIncluded: quote.partsIncluded, token: randomUUID(), expiresAt: new Date(this.clock().getTime() + 15 * 60_000).toISOString() };
    this.event(task, 'approval_requested', `${quote.provider}; ${slot.label}; USD ${quote.total}${quote.partsIncluded ? ' including standard seal' : ' plus unknown parts'}. No provider contacted.`);
    this.save(); return this.publicTask(task);
  }
  review(id) {
    const task = this.task(id);
    if (task.status !== 'awaiting_approval') fail('INVALID_STATE', 'There is no pending request to review.');
    return { task: this.publicTask(task), confirmationToken: task.proposal.token };
  }
  plan({ taskId, version, maxTotal = 150 }) {
    const task = this.task(taskId);
    if (task.version !== version) fail('STALE_TASK', 'The household changed. Refresh before planning.');
    if (!Number.isFinite(maxTotal) || maxTotal <= 0 || maxTotal > 5000) fail('INVALID_BUDGET', 'Set a USD budget above zero and at most 5,000.', 400);
    this.compare({ taskId });
    const quoteChecks = quotes.map(q => ({ quoteId: q.id, source: q.source, knownTotal: q.partsIncluded, amount: q.total, eligible: q.partsIncluded && q.total <= maxTotal, reason: !q.partsIncluded ? 'Parts are extra and unknown; the subtotal cannot guarantee this budget.' : q.total > maxTotal ? `The known total exceeds the USD ${maxTotal} budget.` : 'Known total fits the budget, including the standard seal.' }));
    const options = quotes.filter(q => quoteChecks.find(c => c.quoteId === q.id).eligible).flatMap(q => task.calendar.filter(s => s.householdAvailable && s.providers.includes(q.id) && new Date(s.start) > this.clock()).map(s => ({ quoteId: q.id, slotId: s.id, start: s.start, label: s.label, host: s.host, amount: q.total })));
    options.sort((a,b) => a.start.localeCompare(b.start) || a.amount - b.amount);
    task.planReasoning = { maxTotal, currency: 'USD', quoteChecks, excludedSlots: task.calendar.filter(s => !s.householdAvailable).map(s => ({ slotId: s.id, label: s.label, reason: s.reason })), alternatives: options.slice(1), policy: 'Earliest future slot with someone home and a known total within budget. A cheaper subtotal is not treated as a guaranteed total.' };
    if (!options.length) {
      task.status = 'planning_blocked';
      this.event(task, 'plan_blocked', `No known total and available household slot fits the USD ${maxTotal} budget. No review request created.`); this.save();
      return { task: this.publicTask(task), blocked: true, message: `No plan fits your $${maxTotal} cap with a known total. Clear Pipe still needs a parts quote. Homekind is $145. Your budget has not been raised.`, transport: 'MCP Streamable HTTP', simulated: true };
    }
    const choice = options[0];
    const planned = this.propose({ taskId, quoteId: choice.quoteId, slotId: choice.slotId, version: task.version });
    return { task: planned, blocked: false, message: `$${choice.amount}, standard seal included. ${choice.host} can be home for ${choice.label}. Clear Pipe's unknown parts cost cannot guarantee your $${maxTotal} cap. This is a review request, not a booking.`, transport: 'MCP Streamable HTTP', simulated: true };
  }
  availability({ taskId, version, slotId, member, available, reason }) {
    const task = this.task(taskId);
    if (task.version !== version) fail('STALE_TASK', 'The household changed. Refresh before updating availability.');
    if (task.status === 'cancelled') fail('INVALID_STATE', 'A cancelled task cannot be changed.');
    const slot = task.calendar.find(s => s.id === slotId) ?? fail('INVALID_SLOT', 'Choose a listed time.', 400);
    if (!['Alex','Sam'].includes(member) || slot.host !== member) fail('NOT_SLOT_HOST', 'Only the demo member assigned to this slot can update it.', 403);
    if (typeof available !== 'boolean' || typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 240) fail('INVALID_AVAILABILITY', 'Provide availability and a short reason, up to 240 characters.', 400);
    if (slot.householdAvailable === available) return { task: this.publicTask(task), changed: false };
    slot.householdAvailable = available; slot.reason = `${member}: ${reason.trim()}`;
    this.event(task, 'availability_changed', `${member} ${available ? 'can' : 'cannot'} supervise ${slot.label}. ${reason.trim()}`);
    const active = task.proposal;
    if (active && active.slotId === slotId && !available && ['awaiting_approval','approved'].includes(task.status)) {
      task.previousPlans ??= [];
      task.previousPlans.push({ proposalId: active.id, quoteId: active.quoteId, slotId: active.slotId, label: slot.label, amount: active.amount, approvedBy: active.approvedBy ?? null, withdrawnAt: this.clock().toISOString(), reason: `${member} is no longer available.` });
      task.proposal = null; task.status = 'needs_replan';
      this.event(task, 'plan_withdrawn', 'The old review and any household approval are no longer valid. Find a new time and obtain fresh consent. No contractor was contacted.');
    }
    this.save(); return { task: this.publicTask(task), changed: true };
  }
  approve({ taskId, proposalId, version, token, confirmed, member }) {
    const task = this.task(taskId);
    if (task.version !== version) fail('STALE_TASK', 'The task changed. Review it again.');
    if (task.status !== 'awaiting_approval') fail('INVALID_STATE', 'This request is no longer awaiting approval.');
    if (task.proposal.id !== proposalId) fail('STALE_PROPOSAL', 'The proposal changed. Review it again.');
    if (new Date(task.proposal.expiresAt) <= this.clock()) fail('EXPIRED_APPROVAL', 'The review expired. Cancel and create a fresh proposal.');
    if (confirmed !== true || !['Alex', 'Sam'].includes(member)) fail('CONFIRMATION_REQUIRED', 'A demo household member must explicitly confirm the review.', 400);
    const actual = Buffer.from(task.proposal.token); const supplied = Buffer.from(typeof token === 'string' ? token : '');
    if (actual.length !== supplied.length || !timingSafeEqual(actual, supplied)) fail('INVALID_CONFIRMATION', 'Open the review screen before confirming.', 403);
    task.status = 'approved'; task.proposal.approvedBy = member; delete task.proposal.token;
    this.event(task, 'household_approved', `${member} approved the simulated repair plan. This is a household record, not a contractor booking or payment.`);
    this.save(); return this.publicTask(task);
  }
  cancel({ taskId, version }) {
    const task = this.task(taskId);
    if (task.version !== version) fail('STALE_TASK', 'The task changed. Refresh before cancelling.');
    if (task.status === 'cancelled') return this.publicTask(task);
    task.status = 'cancelled'; if (task.proposal) delete task.proposal.token;
    this.event(task, 'cancelled', 'Household task cancelled locally. No external booking existed.'); this.save(); return this.publicTask(task);
  }
}
