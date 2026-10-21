import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RepairDesk} from '../src/domain.js';
const start='2026-10-21T06:00:00Z';
const report=d=>d.report({description:'The kitchen sink is leaking.'});
function away(d,t,slotId,member){return d.availability({taskId:t.id,version:t.version,slotId,member,available:false,reason:'I cannot be home.'}).task;}

test('no household availability is not misreported as an insufficient budget',()=>{
  const d=new RepairDesk(null,()=>new Date(start));let t=report(d);t=away(d,t,'mon-pm','Sam');t=away(d,t,'tue-am','Alex');
  const result=d.plan({taskId:t.id,version:t.version,maxTotal:150});
  assert.equal(result.blocked,true);assert.equal(result.task.planReasoning.blockedReason,'availability');
  assert.match(result.message,/known price fits/i);assert.equal(result.task.planReasoning.maxTotal,150);
  assert.equal(result.task.proposal,null);assert.match(result.task.planReasoning.blockedMessage,/availability/i);
});

test('restoring a host permits a new plan without restoring old consent',()=>{
  const d=new RepairDesk(null,()=>new Date(start));let t=report(d);t=d.plan({taskId:t.id,version:t.version,maxTotal:150}).task;
  const original=d.review(t.id);t=away(d,t,'mon-pm','Sam');t=d.plan({taskId:t.id,version:t.version,maxTotal:150}).task;t=away(d,t,'tue-am','Alex');t=d.plan({taskId:t.id,version:t.version,maxTotal:150}).task;
  t=d.availability({taskId:t.id,version:t.version,slotId:'mon-pm',member:'Sam',available:true,reason:'I can be home again.'}).task;
  assert.equal(t.status,'planning_blocked');assert.equal(t.proposal,null);
  t=d.plan({taskId:t.id,version:t.version,maxTotal:150}).task;
  assert.equal(t.proposal.slotId,'mon-pm');assert.notEqual(t.proposal.id,original.task.proposal.id);
  assert.equal(t.planReasoning.blockedReason,null);
  assert.throws(()=>d.approve({taskId:t.id,version:t.version,proposalId:t.proposal.id,token:original.confirmationToken,confirmed:true,member:'Sam'}),{code:'INVALID_CONFIRMATION'});
});

test('expired calendar explains the date issue while preserving the original task dates',()=>{
  let now=new Date(start);const d=new RepairDesk(null,()=>now),t=report(d),calendar=structuredClone(t.calendar);
  now=new Date('2026-10-29T06:00:00Z');const result=d.plan({taskId:t.id,version:t.version,maxTotal:150});
  assert.equal(result.task.planReasoning.blockedReason,'calendar_expired');assert.match(result.message,/dates.*past/i);
  assert.deepEqual(result.task.calendar,calendar);assert.ok(result.task.planReasoning.slotChecks.every(s=>s.reason==='This time has passed.'));
  const fresh=report(d);assert.ok(new Date(fresh.calendar[1].start)>now);
});

test('planning trace separates price exclusions and actual calendar checks',()=>{
  const d=new RepairDesk(null,()=>new Date(start)),t=report(d);
  const blocked=d.plan({taskId:t.id,version:t.version,maxTotal:140});assert.equal(blocked.task.planReasoning.blockedReason,'budget');
  const planned=d.plan({taskId:t.id,version:blocked.task.version,maxTotal:150}).task;
  const checks=planned.planReasoning.slotChecks;
  assert.equal(checks.length,3);assert.equal(checks.find(s=>s.slotId==='mon-am').eligible,false);
  assert.match(checks.find(s=>s.slotId==='mon-am').reason,/away/);
  assert.equal(checks.find(s=>s.slotId==='mon-pm').eligible,true);assert.equal(checks.find(s=>s.slotId==='mon-pm').host,'Sam');
  assert.equal(planned.planReasoning.quoteChecks.find(q=>q.quoteId==='q-clear').eligible,false);
});
