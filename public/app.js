const $ = s => document.querySelector(s);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let data, activeId, review, busy = false;
async function api(path, body) {
  const response = await fetch(`/api/${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Request failed. Retry.'); return result;
}
function message(text, role = 'assistant') { const el = document.createElement('div'); el.className = `message ${role}`; el.textContent = text; $('#messages').append(el); el.scrollIntoView({ block: 'nearest' }); }
async function action(fn) {
  if (busy) return; busy = true; $('#error').hidden = true; document.querySelector('main').setAttribute('aria-busy', 'true');
  document.querySelectorAll('main button').forEach(b => b.disabled = true);
  try { await fn(); } catch (error) { $('#error').textContent = `${error.message} Use Refresh to recover the latest saved state.`; $('#error').hidden = false; }
  finally { busy = false; document.querySelector('main').removeAttribute('aria-busy'); document.querySelectorAll('main button').forEach(b => b.disabled = false); render(); }
}
async function load() { data = await api('desk'); if (!activeId && data.tasks.length) activeId = data.tasks.at(-1).id; render(); }
function render() {
  if (!data) return;
  $('#history').innerHTML = data.tasks.length ? data.tasks.map(t => `<button data-open="${t.id}">${escape(t.description.slice(0,60))} · ${escape(t.status.replaceAll('_',' '))}</button>`).join('') : '<p class="footnote">No repairs yet. Report the kitchen sink leak to begin.</p>';
  const t = data.tasks.find(t => t.id === activeId); if (!t) return;
  let content = `<span class="status">${escape(t.status.replaceAll('_',' '))}</span><h3 class="task-heading">${escape(t.description)}</h3><div class="task-meta">Reported by ${escape(t.member)} · Task ${t.id.slice(0,8)} · Asia/Kuala_Lumpur</div>`;
  if (t.status === 'reported') content += '<p class="recommendation">Two sample quotes are ready. Compare the total scope before choosing a time.</p><button data-action="compare">Compare sample quotes</button>';
  if (t.status === 'compared') {
    content += `<div class="quotes">${data.quotes.map(q => `<article class="quote ${q.partsIncluded ? 'recommended' : ''}"><span class="small">${q.partsIncluded ? 'MORE CERTAIN SCOPE' : 'LOWER SUBTOTAL'}</span><h3>${escape(q.provider)}</h3><div class="price">$${q.total}</div><p>USD · ${q.partsIncluded ? 'standard seal included' : 'plus unknown parts cost'}<br>${q.warrantyDays}-day warranty</p><a href="/${q.source}" target="_blank" rel="noopener">Read source quote ↗</a><button class="secondary" data-quote="${q.id}">Choose ${q.id === 'q-home' ? 'Homekind' : 'Clear Pipe'}</button></article>`).join('')}</div><p class="recommendation">Homekind costs $15 more upfront, includes the standard seal, and offers 46 more warranty days. Clear Pipe's final price depends on parts. A lower subtotal isn't a lower final bill.</p><div id="slots"></div>`;
  }
  if (t.proposal) {
    const q = data.quotes.find(q => q.id === t.proposal.quoteId), s = data.slots.find(s => s.id === t.proposal.slotId);
    content += `<div class="notice"><strong>${escape(q.provider)}</strong><br>${escape(s.label)}<br>USD $${q.total} ${q.partsIncluded ? 'including standard seal' : '+ unknown parts'}<br>${t.status === 'approved' ? `Approved by ${escape(t.proposal.approvedBy)}. Saved locally; no contractor booking or payment.` : t.status === 'cancelled' ? 'Cancelled locally. No provider was contacted.' : 'Waiting for household review. No provider contacted.'}</div>`;
    if (t.status === 'awaiting_approval') content += '<div class="task-actions"><button data-action="review">Review & confirm</button></div>';
  }
  if (t.status !== 'cancelled') content += '<div class="task-actions"><button class="text-button" data-action="cancel">Cancel this task</button></div>';
  content += `<div class="timeline" aria-label="Task timeline">${t.events.map(e => `<div class="event"><time>${new Date(e.at).toLocaleString('en-GB',{timeZone:'Asia/Kuala_Lumpur'})}</time>${escape(e.detail)}</div>`).join('')}</div>`;
  $('#task').innerHTML = content;
}
$('#report-form').addEventListener('submit', event => { event.preventDefault(); action(async () => { const description = $('#description').value; const task = await api('report', { description, member: 'Alex' }); activeId = task.id; message(description, 'user'); message('Repair noted. I have two fictional quotes to compare. The cheaper-looking one excludes parts.'); $('#description').value = ''; await load(); }); });
$('#refresh').addEventListener('click', () => action(load));
$('#history').addEventListener('click', event => { const id = event.target.closest('[data-open]')?.dataset.open; if (id) { activeId = id; render(); } });
$('#task').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || busy) return;
  const t = data.tasks.find(t => t.id === activeId);
  if (button.dataset.quote) {
    const quoteId = button.dataset.quote;
    $('#slots').innerHTML = `<h3>When is someone home?</h3><p class="footnote">Sample household and provider calendars · October 2026 · UTC+08</p>${data.slots.map(s => { const available = s.householdAvailable && s.providers.includes(quoteId); return `<button class="slot" data-slot="${s.id}" data-provider="${quoteId}" ${available ? '' : 'disabled'}>${escape(s.label)}<span>${escape(available ? s.reason : !s.householdAvailable ? s.reason : 'Provider unavailable at this time.')}</span></button>`; }).join('')}`;
    return;
  }
  action(async () => {
    if (button.dataset.action === 'compare') { const result = await api('compare', { taskId: t.id }); message(result.recommendation); await load(); }
    if (button.dataset.slot) { await api('propose', { taskId: t.id, version: t.version, quoteId: button.dataset.provider, slotId: button.dataset.slot }); message('That time works with the sample calendars. Review the exact provider, scope, and cost before confirming. Nothing has been booked.'); await load(); }
    if (button.dataset.action === 'cancel') { await api('cancel', { taskId: t.id, version: t.version }); message('Cancelled locally. No booking or payment took place.'); await load(); }
    if (button.dataset.action === 'review') {
      review = await api(`review/${t.id}`); const q = data.quotes.find(q => q.id === t.proposal.quoteId), s = data.slots.find(s => s.id === t.proposal.slotId);
      $('#review-details').innerHTML = `<strong>${escape(q.provider)}</strong><br>${escape(s.label)} · UTC+08<br>USD $${q.total} ${q.partsIncluded ? 'including standard seal' : '+ unknown parts cost'}<br>${q.warrantyDays}-day warranty<br><small>Review expires ${new Date(t.proposal.expiresAt).toLocaleTimeString('en-GB',{timeZone:'Asia/Kuala_Lumpur'})}. Demo identities have no authentication.</small>`;
      $('#confirm').checked = false; $('#review-error').textContent = ''; $('#review').showModal();
    }
  });
});
$('#approval-form').addEventListener('submit', async event => {
  event.preventDefault(); const submit = event.submitter; submit.disabled = true;
  try { await api('approve', { taskId: review.task.id, proposalId: review.task.proposal.id, version: review.task.version, token: review.confirmationToken, confirmed: $('#confirm').checked, member: $('#member').value }); $('#review').close(); message('Household plan approved and saved. This is your local record; a real contractor has not been contacted.'); await load(); }
  catch (error) { $('#review-error').textContent = error.message; } finally { submit.disabled = false; }
});
action(load);
