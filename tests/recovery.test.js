import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {RepairDesk} from '../src/domain.js';
import {createApp} from '../src/server.js';
const initial='2026-10-17T06:00:00Z';
const setup=d=>{const t=d.report({description:'The kitchen sink is leaking.'});return d.plan({taskId:t.id,version:t.version,maxTotal:150}).task;};

test('SDK validation failures remain actionable HTTP 400 responses without task mutation',async t=>{
  const {app,desk}=createApp({dataFile:null,clock:()=>new Date(initial)});
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(r=>server.close(r)));
  const task=desk.report({description:'The kitchen sink is leaking.'});
  const url=`http://127.0.0.1:${server.address().port}/api/plan`;
  for(const maxTotal of [null,'abc',-1,5001]){
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:task.id,version:task.version,maxTotal})});
    assert.equal(response.status,400,await response.clone().text());
    const error=await response.json();assert.equal(error.code,'INVALID_TOOL_ARGUMENTS');assert.match(error.error,/budget|arguments/i);
    assert.deepEqual(desk.get(task.id),task);
  }
});

test('an expired review renews the exact scope and time with a new proposal and fresh secret',()=>{
  let now=new Date(initial);const d=new RepairDesk(null,()=>now),first=setup(d),old=d.review(first.id);
  now=new Date(now.getTime()+16*60_000);
  assert.throws(()=>d.review(first.id),{code:'EXPIRED_APPROVAL'});
  const renewed=d.renewReview({taskId:first.id,version:first.version});
  assert.notEqual(renewed.proposal.id,first.proposal.id);assert.equal(renewed.proposal.quoteId,first.proposal.quoteId);assert.equal(renewed.proposal.slotId,first.proposal.slotId);
  assert.equal(renewed.planReasoning.maxTotal,150);assert.equal(renewed.previousPlans.at(-1).proposalId,first.proposal.id);
  assert.ok(!JSON.stringify(renewed).includes(old.confirmationToken));
  const fresh=d.review(first.id);assert.notEqual(fresh.confirmationToken,old.confirmationToken);
  const approve={taskId:first.id,version:renewed.version,proposalId:renewed.proposal.id,token:old.confirmationToken,confirmed:true,member:'Sam'};
  assert.throws(()=>d.approve(approve),{code:'INVALID_CONFIRMATION'});
  assert.equal(d.approve({...approve,token:fresh.confirmationToken}).status,'approved');
});

test('renewal cannot replace an active review, use a stale version or revive a cancelled plan',()=>{
  let now=new Date(initial);const d=new RepairDesk(null,()=>now),first=setup(d);
  assert.throws(()=>d.renewReview({taskId:first.id,version:first.version}),{code:'REVIEW_ACTIVE'});assert.deepEqual(d.get(first.id),first);
  now=new Date(now.getTime()+16*60_000);
  assert.throws(()=>d.renewReview({taskId:first.id,version:0}),{code:'STALE_TASK'});
  const cancelled=d.cancel({taskId:first.id,version:first.version});
  assert.throws(()=>d.renewReview({taskId:first.id,version:cancelled.version}),{code:'INVALID_STATE'});
});

test('approval and review renewal reject a past appointment without changing the saved plan',()=>{
  let now=new Date(initial);const d=new RepairDesk(null,()=>now),task=d.report({description:'The kitchen sink is leaking.'});
  now=new Date('2026-10-19T05:55:00Z');const first=d.plan({taskId:task.id,version:task.version,maxTotal:150}).task,review=d.review(task.id);
  now=new Date('2026-10-19T06:01:00Z');
  assert.throws(()=>d.approve({taskId:task.id,version:first.version,proposalId:first.proposal.id,token:review.confirmationToken,member:'Sam',confirmed:true}),{code:'PAST_SLOT'});
  now=new Date('2026-10-19T06:11:00Z');
  assert.throws(()=>d.renewReview({taskId:task.id,version:first.version}),{code:'PAST_SLOT'});assert.deepEqual(d.get(task.id),first);
});
