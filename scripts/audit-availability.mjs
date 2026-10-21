// Isolated fixture arrangement, followed by an actual rendered browser capture.
import {chromium} from '@playwright/test';
import {once} from 'node:events';
import {existsSync,writeFileSync} from 'node:fs';
import {createApp} from '../src/server.js';
const now=new Date('2026-10-21T06:00:00Z');
const {app,desk}=createApp({dataFile:null,clock:()=>now});
let t=desk.report({description:'The kitchen sink is leaking.'});
for(const [slotId,member] of [['mon-pm','Sam'],['tue-am','Alex']]) t=desk.availability({taskId:t.id,version:t.version,slotId,member,available:false,reason:'I cannot be home.'}).task;
const planned=desk.plan({taskId:t.id,version:t.version,maxTotal:150});
if(process.argv[2]==='before' && planned.task.planReasoning.blockedReason!==undefined) throw new Error('Refusing to overwrite the pre-fix baseline with the corrected implementation.');
const server=app.listen(0,'127.0.0.1');await once(server,'listening');
let browser;
try{
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
  const page=await browser.newPage({viewport:{width:1280,height:960}});await page.clock.setFixedTime(now);
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('.status').waitFor();
  const name=process.argv[2]==='before'?'availability-before':'availability-after';
  const text=await page.locator('#task').innerText();writeFileSync(`evidence/${name}.txt`,text);
  await page.screenshot({path:`evidence/${name}.png`,fullPage:true});console.log(text);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
