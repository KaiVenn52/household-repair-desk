import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {once} from 'node:events';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {startHostedPreview} from '../scripts/preview-hosted.mjs';
const external=process.env.HOSTED_TEST_URL;
const server=external?null:startHostedPreview();if(server)await once(server,'listening');const base=external??`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const errors=[],checks=[];mkdirSync('evidence/hosted',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource: the server responded with a status of (400|409)/.test(m.text()))errors.push(m.text());});
 await page.goto(base);await page.getByLabel('What needs fixing?').fill('The kitchen sink is leaking under the cabinet.');await page.getByRole('button',{name:'Report repair'}).click();await page.getByRole('button',{name:'Find a plan'}).waitFor();
 const cookies=await context.cookies();assert.ok(cookies.some(c=>c.name==='__Host-repair-demo'&&c.httpOnly&&c.secure&&c.sameSite==='Strict'));
 await page.getByLabel('Keep the known total under').fill('140');await page.getByRole('button',{name:'Find a plan'}).click();await page.getByText('No complete quote fits that cap.',{exact:false}).waitFor();
 await page.getByLabel('Keep the known total under').fill('150');await page.getByRole('button',{name:'Find a plan'}).click();await page.getByRole('button',{name:'Review & confirm'}).click();await page.getByLabel('Confirming as').selectOption('Sam');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Approve household plan'}).click();await page.getByText('Approved by Sam.',{exact:false}).waitFor();
 checks.push('Hosted Worker: report → hard budget rejection → real HTTP MCP plan → explicit approval');
 await page.getByRole('button',{name:"Sam can't cover Monday"}).click();await page.getByRole('button',{name:'Find another time'}).click();await page.getByRole('button',{name:"Alex can't cover Tuesday"}).waitFor();
 await page.getByRole('button',{name:'Review & confirm'}).click();await page.getByLabel('Confirming as').selectOption('Alex');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Approve household plan'}).click();await page.getByText('Approved by Alex.',{exact:false}).waitFor();await page.reload();await page.getByText('Approved by Alex.',{exact:false}).waitFor();
 checks.push('Actual HTTP MCP availability change → old approval withdrawn → replan → fresh Alex approval → D1 adapter reload');
 const desk=await page.request.get(base+'/api/desk').then(r=>r.json());assert.equal(desk.tasks.length,1);assert.ok(!JSON.stringify(desk).includes('"token"'));
 const receipt=await page.request.get(base+'/api/mcp-activity').then(r=>r.json());assert.ok(receipt.calls.filter(c=>c.transport==='Streamable HTTP').length>=4);
 const other=await browser.newContext(),otherPage=await other.newPage();await otherPage.goto(base);const isolated=await otherPage.request.get(base+'/api/desk').then(r=>r.json());assert.deepEqual(isolated.tasks,[]);
 const denied=await otherPage.request.post(base+'/api/cancel',{data:{taskId:desk.tasks[0].id,version:desk.tasks[0].version}});assert.equal(denied.status(),404);checks.push('Two independent browser sessions cannot read or mutate each other; public tasks omit approval secret');
 const originDenied=await page.request.post(base+'/api/report',{headers:{Origin:'https://untrusted.example'},data:{description:'The kitchen sink is leaking.'}});assert.equal(originDenied.status(),403);
 const invalid=await page.request.post(base+'/api/report',{data:'not-json',headers:{'Content-Type':'application/json'}});assert.equal(invalid.status(),400);checks.push('Cross-origin writes and malformed JSON rejected');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);
 for(const width of [375,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`evidence/hosted/worker-${width}.png`,fullPage:true});}
 checks.push('Hosted rendered UI: axe A/AA passed; 375 / 768 / 1280 px no overflow');assert.deepEqual(errors,[]);
 const report={status:'PASS',url:base,scope:external?'Anonymous real Chrome on deployed HTTPS Worker with hosted D1 storage':'Bundled production Worker on Node Web Standards preview, real SQLite-backed D1 adapter; not yet a public deployment',checks,consoleErrors:errors,mcpReceipts:receipt.calls};writeFileSync(`evidence/hosted/${external?'public':'worker'}-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
