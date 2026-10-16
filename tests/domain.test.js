import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RepairDesk } from '../src/domain.js';
const clock = () => new Date('2026-10-16T06:00:00Z');
function ready(desk) { const t = desk.report({ description: 'The kitchen sink is leaking.' }); return desk.compare({ taskId: t.id }).task; }
function propose(desk, t) { return desk.propose({ taskId: t.id, quoteId: 'q-home', slotId: 'mon-pm', version: t.version }); }
test('quote comparison preserves the unknown final price and scope', () => {
  const d = new RepairDesk(null, clock); const t = ready(d); const result = d.compare({ taskId: t.id });
  assert.equal(result.quotes[0].total, 130); assert.equal(result.quotes[0].partsIncluded, false); assert.match(result.recommendation, /unknown/); assert.equal(result.quotes[1].warrantyDays, 60);
});
test('invalid repairs and household identities cannot reuse plumbing prices', () => {
  const d = new RepairDesk(null, clock);
  for (const description of ['', 'Fix the broken roof', 'The sink is leaking with smoke']) assert.throws(() => d.report({ description }));
  assert.throws(() => d.report({ description: 'The sink is leaking.', member: 'stranger' })); assert.equal(d.list().length, 0);
});
test('unavailable household/provider slots and stale versions are rejected', () => {
  const d = new RepairDesk(null, clock), t = ready(d);
  assert.throws(() => d.propose({ taskId: t.id, quoteId: 'q-home', slotId: 'mon-am', version: t.version }), { code: 'UNAVAILABLE_SLOT' });
  assert.throws(() => d.propose({ taskId: t.id, quoteId: 'q-clear', slotId: 'mon-pm', version: t.version }), { code: 'UNAVAILABLE_SLOT' });
  assert.throws(() => propose(d, { ...t, version: 0 }), { code: 'STALE_TASK' });
  assert.equal(d.get(t.id).status, 'compared');
});
test('approval needs exact current proposal, explicit consent and review secret; replay fails', () => {
  const d = new RepairDesk(null, clock), t = propose(d, ready(d)), review = d.review(t.id);
  assert.equal(t.proposal.token, undefined); assert.equal(d.list()[0].proposal.token, undefined);
  const input = { taskId: t.id, version: t.version, proposalId: t.proposal.id, token: review.confirmationToken, confirmed: true, member: 'Sam' };
  assert.throws(() => d.approve({ ...input, confirmed: false }), { code: 'CONFIRMATION_REQUIRED' });
  assert.throws(() => d.approve({ ...input, token: 'bad' }), { code: 'INVALID_CONFIRMATION' });
  assert.throws(() => d.approve({ ...input, proposalId: 'old' }), { code: 'STALE_PROPOSAL' });
  const approved = d.approve(input); assert.equal(approved.status, 'approved'); assert.match(approved.events.at(-1).detail, /not a contractor booking/);
  assert.throws(() => d.approve(input));
});
test('expired and cancelled reviews cannot approve', () => {
  let now = clock(); const d = new RepairDesk(null, () => now), t = propose(d, ready(d)), review = d.review(t.id);
  const input = { taskId: t.id, version: t.version, proposalId: t.proposal.id, token: review.confirmationToken, confirmed: true, member: 'Alex' };
  now = new Date(now.getTime() + 16 * 60_000); assert.throws(() => d.approve(input), { code: 'EXPIRED_APPROVAL' });
  const cancelled = d.cancel({ taskId: t.id, version: t.version }); assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.proposal.token, undefined);
  assert.throws(() => d.approve({ ...input, version: cancelled.version }));
});
test('persistent state survives process recreation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'household-')); try {
    const file = join(dir, 'tasks.json'); const d = new RepairDesk(file, clock); const t = propose(d, ready(d));
    const reopened = new RepairDesk(file, clock); assert.deepEqual(reopened.get(t.id), d.get(t.id)); assert.ok(reopened.review(t.id).confirmationToken);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('past fixture times and unknown IDs fail explicitly', () => {
  const d = new RepairDesk(null, () => new Date('2026-10-25T00:00:00Z')); const t = ready(d);
  assert.throws(() => propose(d, t), { code: 'PAST_SLOT' }); assert.throws(() => d.get('missing'), { code: 'NOT_FOUND' });
});
