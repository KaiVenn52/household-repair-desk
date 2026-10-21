const $ = s => document.querySelector(s);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let data, activeId, review, busy = false;
try{activeId=localStorage.getItem('repairdesk.activeTask');}catch{}
function rememberTask(id){activeId=id;try{localStorage.setItem('repairdesk.activeTask',id);}catch{}}
const budgetDrafts=new Map();
const mobileLayout=matchMedia('(max-width:800px)');
function orderWorkspace(){if(document.body.classList.contains('has-task')) document.querySelector('.workspace').prepend(document.querySelector(mobileLayout.matches?'.task-panel':'.conversation'));}
mobileLayout.addEventListener('change',orderWorkspace);
async function api(path, body) {
  const response = await fetch(`/api/${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json(); if (!response.ok) {const error=new Error(result.error ?? 'Request failed. Retry.');error.code=result.code;throw error;} return result;
}
function message(text, role = 'assistant') { const el = document.createElement('div'); el.className = `message ${role}`; el.textContent = text; $('#messages').append(el); $('#messages').scrollTop = $('#messages').scrollHeight; }
async function action(fn) {
  if (busy) return; busy = true; $('#error').hidden = true; document.querySelector('main').setAttribute('aria-busy', 'true');
  document.querySelectorAll('main button').forEach(b => b.disabled = true);
  try { await fn(); } catch (error) { $('#error').textContent = `${error.message} Use Refresh to recover the latest saved state.`; $('#error').hidden = false; }
  finally { busy = false; document.querySelector('main').removeAttribute('aria-busy'); document.querySelectorAll('main button').forEach(b => b.disabled = false); render(); }
}
async function load() { data = await api('desk'); if (!data.tasks.some(t=>t.id===activeId) && data.tasks.length) rememberTask(data.tasks.at(-1).id); render(); }
function render() {
  if (!data) return;
  $('#history').innerHTML = data.tasks.length ? data.tasks.map(t => `<button data-open="${t.id}">${escape(t.description.slice(0,60))} · ${escape(t.status.replaceAll('_',' '))}</button>`).join('') : '<p class="footnote">No repairs yet. Report the kitchen sink leak to begin.</p>';
  const t = data.tasks.find(t => t.id === activeId); if (!t) return;
  document.body.classList.add('has-task');
  orderWorkspace();
  $('#messages').replaceChildren();
  for (const event of t.events.slice(-3)) {
    const copy = event.type === 'reported' ? t.description : event.type === 'quotes_compared' ? "$130 excludes parts. $145 includes the standard seal. The scope matters more than the subtotal." : event.type === 'approval_requested' ? "There's a plan ready to review. Nothing is booked." : event.type === 'household_approved' ? `${t.proposal?.approvedBy ?? 'The household'} has confirmed this plan. No contractor has been contacted.` : event.type === 'plan_withdrawn' ? "That plan no longer works. Its approval is withdrawn. Let's find another time." : event.detail;
    message(copy, event.type === 'reported' ? 'user' : 'assistant');
  }
  let content = `<span class="status">${escape(t.status.replaceAll('_',' '))}</span><h3 class="task-heading">${escape(t.description)}</h3><div class="task-meta">Reported by ${escape(t.member)} · Task ${t.id.slice(0,8)} · Asia/Kuala_Lumpur</div>`;
  if (['reported','planning_blocked','compared'].includes(t.status)) content += `<p class="recommendation">${t.status === 'planning_blocked' ? "No complete quote fits that cap. Get a parts quote or explicitly change your budget." : "I can check both quote scopes and find the first time someone can be home."}</p><div class="budget"><label for="max-total">Keep the known total under</label><div class="budget-input"><span>USD $</span><input id="max-total" type="text" inputmode="decimal" value="${t.planReasoning?.maxTotal ?? 150}" aria-describedby="budget-hint"></div><p id="budget-hint" class="footnote">Unknown extra costs never count as staying within budget.</p></div><div class="task-actions"><button data-action="plan">Find a plan</button>${t.status === 'reported' ? '<button class="text-button" data-action="compare">Compare sample quotes</button>' : ''}</div>`;
  if (t.status === 'compared') {
    content += `<div class="quotes">${data.quotes.map(q => `<article class="quote ${q.partsIncluded ? 'recommended' : ''}"><span class="small">${q.partsIncluded ? 'MORE CERTAIN SCOPE' : 'LOWER SUBTOTAL'}</span><h3>${escape(q.provider)}</h3><div class="price">$${q.total}</div><p>USD · ${q.partsIncluded ? 'standard seal included' : 'plus unknown parts cost'}<br>${q.warrantyDays}-day warranty</p><a href="/${q.source}" target="_blank" rel="noopener">Read source quote ↗</a><button class="secondary" data-quote="${q.id}">Choose ${q.id === 'q-home' ? 'Homekind' : 'Clear Pipe'}</button></article>`).join('')}</div><p class="recommendation">Homekind costs $15 more upfront, includes the standard seal, and offers 46 more warranty days. Clear Pipe's final price depends on parts. A lower subtotal isn't a lower final bill.</p><div id="slots"></div>`;
  }
  if (t.proposal) {
    const q = data.quotes.find(q => q.id === t.proposal.quoteId), s = (t.calendar ?? data.slots).find(s => s.id === t.proposal.slotId);
    content += `<section class="notice appointment" aria-label="Proposed repair visit"><span class="small">${t.status === 'approved' ? 'HOUSEHOLD CONFIRMED' : t.status === 'cancelled' ? 'CANCELLED PLAN' : 'PROPOSED VISIT'}</span><strong>${escape(q.provider)}</strong><dl><div><dt>Visit</dt><dd>${escape(s.label)}</dd></div><div><dt>Known total</dt><dd>USD $${q.total} <span>${q.partsIncluded ? 'including standard seal' : '+ unknown parts'}</span></dd></div></dl><p class="approval-state">${t.status === 'approved' ? `Approved by ${escape(t.proposal.approvedBy)}. Saved locally; no contractor booking or payment.` : t.status === 'cancelled' ? 'Cancelled locally. No provider was contacted.' : 'Waiting for household review. No provider contacted.'}</p></section>`;
    if (t.status === 'awaiting_approval') content += new Date(s.start)<=new Date() ? '<div class="notice" role="status">That appointment has passed. Start a fresh repair for upcoming dates. The old task remains in history.</div><div class="task-actions"><button data-action="fresh-report">Start a fresh repair</button></div>' : new Date(t.proposal.expiresAt)<=new Date() ? '<div class="notice" role="status">This review expired. Renew it to keep the same scope and time with a fresh approval request.</div><div class="task-actions"><button data-action="renew">Renew review</button></div>' : '<div class="task-actions"><button data-action="review">Review & confirm</button></div>';
    if (['awaiting_approval','approved'].includes(t.status) && s.host) {
      const day = new Date(s.start).toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long' });
      content += `<div class="handoff"><span class="small">IF PLANS CHANGE</span><button class="secondary" data-action="availability" data-slot="${s.id}" data-member="${s.host}">${s.host} can't cover ${day}</button><p class="footnote">Updates the fictional household calendar and withdraws this plan.</p></div>`;
    }
  }
  if (t.status === 'needs_replan') {
    const old = t.previousPlans.at(-1);
    content += `<div class="withdrawn" role="status"><span class="small">OLD REVIEW WITHDRAWN</span><h3>We need another time.</h3><p>${escape(old.reason)} The ${escape(old.label)} plan is no longer valid.</p><p>Any previous household approval stays in the history, but it cannot approve the next plan.</p></div><div class="task-actions"><button data-action="replan">Find another time</button></div>`;
  }
  if (t.planReasoning && ['awaiting_approval','approved'].includes(t.status)) {
    content += `<details class="scope-review"><summary>Why $145 instead of the $130 quote?</summary><p>Your cap is $${t.planReasoning.maxTotal}. Clear Pipe quotes $130 before parts, so its final cost is unknown. Homekind includes the standard seal for $145.</p><div class="source-pair">${data.quotes.map(q => `<a href="/${q.source}" target="_blank" rel="noopener">${escape(q.provider)} · source quote ↗</a>`).join('')}</div><p>Then we choose the earliest future slot with someone home and the provider available. No extra budget is silently approved.</p></details>`;
  }
  if (t.status !== 'cancelled') content += '<div class="task-actions"><button class="text-button" data-action="cancel">Cancel this task</button></div>';
  content += `<details class="audit"><summary>Decision history · ${t.events.length} updates</summary><div class="timeline" tabindex="0" role="region" aria-label="Task timeline">${t.events.map(e => `<div class="event"><time>${new Date(e.at).toLocaleString('en-GB',{timeZone:'Asia/Kuala_Lumpur'})}</time>${escape(e.detail)}</div>`).join('')}</div></details>`;
  $('#task').innerHTML = content;
  if(t.status==='planning_blocked' && t.planReasoning?.blockedReason && t.planReasoning.blockedReason!=='budget'){
    const expired=t.planReasoning.blockedReason==='calendar_expired';
    $('#task .recommendation').remove();
    const panel=document.createElement('section');panel.className='availability-recovery';panel.setAttribute('aria-label','Planning recovery');
    panel.innerHTML=`<h4>${expired ? 'These sample dates have passed.' : 'Known price fits. We need someone at home.'}</h4><p>${escape(t.planReasoning.blockedMessage)}</p>`+(expired ? '<button class="secondary" data-action="fresh-report">Start a fresh repair</button>' : `<h4>Who can be home again?</h4>${t.calendar.filter(s=>s.host && !s.householdAvailable && new Date(s.start)>new Date()).map(s=>`<button class="secondary" data-action="availability" data-available="true" data-slot="${s.id}" data-member="${s.host}">${s.host} can cover ${new Date(s.start).toLocaleDateString('en-US',{timeZone:'Asia/Kuala_Lumpur',weekday:'long'})} again</button><p class="footnote">${escape(s.label)} · explicit demo calendar update</p>`).join('')}<p class="footnote">After changing availability, select Find a plan. Every new proposal needs fresh approval.</p>`);
    $('#task .task-meta').after(panel);
    if(expired){$('#task .budget')?.remove();$('#task [data-action="plan"]')?.closest('.task-actions').remove();}
  }
  if(t.planReasoning?.slotChecks?.length){
    const trace=document.createElement('details');trace.className='scope-review planning-checks';
    trace.innerHTML=`<summary>Planning checks · why this time?</summary><p>These are the actual fixture checks used by the planner.</p><ul>${t.planReasoning.slotChecks.map(s=>`<li><strong>${escape(s.label)}</strong><br>${escape(s.reason)}</li>`).join('')}</ul>`;
    const actions=$('#task .task-actions');if(actions)actions.before(trace);else $('#task').append(trace);
  }
  if($('#max-total') && budgetDrafts.has(t.id)) $('#max-total').value=budgetDrafts.get(t.id);
}
$('#task').addEventListener('input',event=>{if(event.target.id==='max-total') budgetDrafts.set(activeId,event.target.value);});
$('#report-form').addEventListener('submit', event => { event.preventDefault(); action(async () => { const description = $('#description').value; const task = await api('report', { description, member: 'Alex' }); rememberTask(task.id); message(description, 'user'); message('Repair noted. I have two fictional quotes to compare. The cheaper-looking one excludes parts.'); $('#description').value = ''; await load(); }); });
$('#refresh').addEventListener('click', () => action(load));
$('#history').addEventListener('click', event => { const id = event.target.closest('[data-open]')?.dataset.open; if (id) { rememberTask(id); $('#error').hidden=true; render(); } });
$('#task').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || busy) return;
  const t = data.tasks.find(t => t.id === activeId);
  if(button.dataset.action==='fresh-report'){$('#description').value=t.description;$('#description').focus();$('#report-form').scrollIntoView({block:'center'});return;}
  if (button.dataset.quote) {
    const quoteId = button.dataset.quote;
    const calendar = t.calendar ?? data.slots;
    const month = new Date(calendar[0].start).toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur', month: 'long', year: 'numeric' });
    $('#slots').innerHTML = `<h3>When is someone home?</h3><p class="footnote">Sample household and provider calendars · ${escape(month)} · UTC+08</p>${calendar.map(s => { const available = s.householdAvailable && s.providers.includes(quoteId); return `<button class="slot" data-slot="${s.id}" data-provider="${quoteId}" ${available ? '' : 'disabled'}>${escape(s.label)}<span>${escape(available ? s.reason : !s.householdAvailable ? s.reason : 'Provider unavailable at this time.')}</span></button>`; }).join('')}`;
    return;
  }
  action(async () => {
    if (button.dataset.action === 'plan' || button.dataset.action === 'replan') { const maxTotal = button.dataset.action === 'plan' ? Number($('#max-total').value.trim()) : t.planReasoning?.maxTotal ?? 150; if(!Number.isFinite(maxTotal) || maxTotal<=0 || maxTotal>5000) throw new Error('Enter a USD budget above zero and at most 5,000.'); const result = await api('plan', { taskId: t.id, version: t.version, maxTotal }); budgetDrafts.delete(t.id); await load(); if (result.blocked && (!result.task.planReasoning?.blockedReason || result.task.planReasoning.blockedReason==='budget')) { $('#error').textContent = result.message; $('#error').hidden = false; } }
    if (button.dataset.action === 'renew') {await api('renew-review',{taskId:t.id,version:t.version});await load();}
    if (button.dataset.action === 'availability') { const available=button.dataset.available==='true'; await api('availability', { taskId: t.id, version: t.version, slotId: button.dataset.slot, member: button.dataset.member, available, reason: available ? 'My schedule changed. I can be home again.' : 'My schedule changed. I cannot be home for this repair.' }); await load(); }
    if (button.dataset.action === 'compare') { const result = await api('compare', { taskId: t.id }); message(result.recommendation); await load(); }
    if (button.dataset.slot && button.dataset.provider) { await api('propose', { taskId: t.id, version: t.version, quoteId: button.dataset.provider, slotId: button.dataset.slot }); message('That time works with the sample calendars. Review the exact provider, scope, and cost before confirming. Nothing has been booked.'); await load(); }
    if (button.dataset.action === 'cancel') { await api('cancel', { taskId: t.id, version: t.version }); message('Cancelled locally. No booking or payment took place.'); await load(); }
    if (button.dataset.action === 'review') {
      review = await api(`review/${t.id}`); const current=review.task; const q = data.quotes.find(q => q.id === current.proposal.quoteId), s = (current.calendar ?? data.slots).find(s => s.id === current.proposal.slotId);
      $('#review-details').innerHTML = `<strong>${escape(q.provider)}</strong><br>${escape(s.label)} · UTC+08<br>USD $${q.total} ${q.partsIncluded ? 'including standard seal' : '+ unknown parts cost'}<br>${q.warrantyDays}-day warranty<br><small>Review expires ${new Date(current.proposal.expiresAt).toLocaleTimeString('en-GB',{timeZone:'Asia/Kuala_Lumpur'})}. Demo identities have no authentication.</small>`;
      $('#confirm').checked = false; $('#review-error').textContent = ''; $('#review').showModal();
    }
  });
});
$('#approval-form').addEventListener('submit', async event => {
  event.preventDefault(); const submit = event.submitter; submit.disabled = true;
  try { await api('approve', { taskId: review.task.id, proposalId: review.task.proposal.id, version: review.task.version, token: review.confirmationToken, confirmed: $('#confirm').checked, member: $('#member').value }); $('#review').close(); message('Household plan approved and saved. This is your local record; a real contractor has not been contacted.'); await load(); }
  catch (error) { if(['EXPIRED_APPROVAL','STALE_TASK','STALE_PROPOSAL','INVALID_STATE','PAST_SLOT','UNAVAILABLE_SLOT'].includes(error.code)) {$('#review').close();await load();$('#error').textContent=error.message;$('#error').hidden=false;} else $('#review-error').textContent = error.message; } finally { submit.disabled = false; }
});
action(load);
