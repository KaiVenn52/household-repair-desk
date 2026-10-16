import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { RepairDesk } from '../src/domain.js';
import { createApp } from '../src/server.js';
const clock = () => new Date('2026-10-16T06:00:00Z');
function report(d) { return d.report({ description: 'The kitchen sink is leaking.' }); }
test('planner respects scope and budget, then chooses the first feasible household slot', () => {
  const d = new RepairDesk(null, clock), t = report(d);
  const result = d.plan({ taskId:t.id, version:t.version, maxTotal:150 });
  assert.equal(result.task.proposal.quoteId, 'q-home'); assert.equal(result.task.proposal.slotId, 'mon-pm');
  assert.equal(result.task.planReasoning.quoteChecks.find(q=>q.quoteId==='q-clear').eligible, false);
  assert.match(result.task.planReasoning.quoteChecks[0].reason, /unknown/);
  assert.equal(result.task.planReasoning.alternatives[0].slotId, 'tue-am');
});
test('a lower cap blocks planning without secretly raising it or accepting unknown parts', () => {
  const d = new RepairDesk(null, clock), t = report(d);
  const result = d.plan({ taskId:t.id, version:t.version, maxTotal:140 });
  assert.equal(result.blocked,true); assert.equal(result.task.status,'planning_blocked'); assert.equal(result.task.proposal,null); assert.equal(result.task.planReasoning.maxTotal,140);
  const compared = d.compare({taskId:t.id}).task;
  assert.throws(()=>d.propose({taskId:t.id,version:compared.version,quoteId:'q-clear',slotId:'tue-am'}),{code:'BUDGET_UNVERIFIED'});
});
test('a household conflict withdraws pending consent and replans with a different host', () => {
  const d = new RepairDesk(null, clock), t = report(d);
  const first = d.plan({taskId:t.id,version:t.version,maxTotal:150}).task, old = d.review(t.id);
  const changed = d.availability({taskId:t.id,version:first.version,slotId:'mon-pm',member:'Sam',available:false,reason:'I have to go to work.'}).task;
  assert.equal(changed.status,'needs_replan'); assert.equal(changed.proposal,null); assert.equal(changed.previousPlans[0].proposalId,first.proposal.id);
  assert.ok(!JSON.stringify(changed).includes(old.confirmationToken));
  assert.throws(()=>d.approve({taskId:t.id,version:changed.version,proposalId:first.proposal.id,token:old.confirmationToken,confirmed:true,member:'Sam'}),{code:'INVALID_STATE'});
  const next = d.plan({taskId:t.id,version:changed.version,maxTotal:150}).task;
  assert.equal(next.proposal.slotId,'tue-am'); assert.notEqual(next.proposal.id,first.proposal.id); assert.equal(next.calendar.find(s=>s.id==='tue-am').host,'Alex');
  assert.throws(()=>d.approve({taskId:t.id,version:next.version,proposalId:first.proposal.id,token:old.confirmationToken,confirmed:true,member:'Sam'}),{code:'STALE_PROPOSAL'});
});
test('an approved plan is also withdrawn; another member cannot change the assigned host', () => {
  const d = new RepairDesk(null, clock), t = report(d);
  const first = d.plan({taskId:t.id,version:t.version,maxTotal:150}).task, review = d.review(t.id);
  assert.throws(()=>d.availability({taskId:t.id,version:first.version,slotId:'mon-pm',member:'Alex',available:false,reason:'Not my slot.'}),{code:'NOT_SLOT_HOST'});
  const approved = d.approve({taskId:t.id,version:first.version,proposalId:first.proposal.id,token:review.confirmationToken,confirmed:true,member:'Sam'});
  const changed = d.availability({taskId:t.id,version:approved.version,slotId:'mon-pm',member:'Sam',available:false,reason:'Plans have changed.'}).task;
  assert.equal(changed.status,'needs_replan'); assert.equal(changed.previousPlans[0].approvedBy,'Sam'); assert.equal(changed.proposal,null);
});
test('visible web planning and replanning execute through the actual MCP transport', async t => {
  const {app} = createApp({dataFile:null,clock}); const server=app.listen(0,'127.0.0.1'); await once(server,'listening'); t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post = async (path,body) => { const r=await fetch(`${base}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); assert.equal(r.status,200,await r.clone().text());return r.json(); };
  const task=await post('report',{description:'The kitchen sink is leaking.'});
  const first=await post('plan',{taskId:task.id,version:task.version,maxTotal:150}); assert.equal(first.toolReceipt.name,'plan_repair'); assert.equal(first.toolReceipt.executed,true);
  const changed=await post('availability',{taskId:task.id,version:first.task.version,slotId:'mon-pm',member:'Sam',available:false,reason:'I cannot be home.'}); assert.equal(changed.toolReceipt.name,'update_household_availability');
  const next=await post('plan',{taskId:task.id,version:changed.task.version,maxTotal:150}); assert.equal(next.task.proposal.slotId,'tue-am'); assert.equal(next.toolReceipt.protocol,'2025-11-25');
});
