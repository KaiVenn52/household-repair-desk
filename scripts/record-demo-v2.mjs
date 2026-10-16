import {chromium} from '@playwright/test';
import {once} from 'node:events';
import {performance} from 'node:perf_hooks';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createApp} from '../src/server.js';
const out='video/v2';mkdirSync(`${out}/raw`,{recursive:true});
const scenes=JSON.parse(readFileSync(`${out}/timeline.json`,'utf8'));
const {app}=createApp({dataFile:null});const server=app.listen(0,'127.0.0.1');await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}`;
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
const viewport={width:1280,height:720};
let context;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
  // Start with the already reported repair, prepared through the actual UI.
  const setup=await browser.newContext({viewport});const prep=await setup.newPage();
  await prep.goto(base);await prep.getByLabel('What needs fixing?').fill('The kitchen sink is leaking under the cabinet.');await prep.getByRole('button',{name:'Report repair'}).click();await prep.getByRole('button',{name:'Compare sample quotes'}).click();await prep.getByRole('button',{name:'Choose Homekind'}).waitFor();await setup.close();
  context=await browser.newContext({viewport,recordVideo:{dir:`${out}/raw`,size:viewport},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  await page.addInitScript(()=>{
    document.addEventListener('mousemove',e=>{let p=document.getElementById('recording-pointer');if(!p){p=document.createElement('div');p.id='recording-pointer';p.setAttribute('aria-hidden','true');Object.assign(p.style,{position:'fixed',width:'14px',height:'14px',border:'2px solid #345744',background:'#ffffffcc',borderRadius:'50%',pointerEvents:'none',zIndex:'2147483647',boxShadow:'0 1px 4px #0005'});document.documentElement.append(p);}p.style.left=(e.clientX-7)+'px';p.style.top=(e.clientY-7)+'px';},true);
  });
  await page.goto(base);await page.getByRole('button',{name:'Choose Homekind'}).waitFor();await page.locator('.quotes').scrollIntoViewIfNeeded();
  // A discarded magenta sync slate marks the actual encoded timeline, independent
  // of browser startup and encoder tail padding. It never appears in the final.
  await page.evaluate(()=>{const e=document.createElement('div');e.id='sync-slate';Object.assign(e.style,{position:'fixed',inset:'0',background:'#ff00ff',zIndex:'2147483647'});document.documentElement.append(e);});
  await wait(700);
  await page.evaluate(()=>document.getElementById('sync-slate').remove());
  let start;
  const at=async(seconds,fn)=>{const remaining=start+seconds*1000-performance.now();if(remaining>0)await wait(remaining);if(fn)await fn();};
  const focusPlan=()=>page.locator('#task').scrollIntoViewIfNeeded();
  const actions={
    trap:async()=>{await at(1,()=>page.locator('.quote').first().hover());await at(6,()=>page.locator('.quote').nth(1).hover());},
    source:async()=>{const href=await page.getByRole('link',{name:/Read source quote/}).first().getAttribute('href');await at(.4,()=>page.goto(base+href));await page.locator('pre').evaluate(e=>{Object.assign(e.style,{fontSize:'18px',lineHeight:'1.6',padding:'24px',whiteSpace:'pre-wrap'});});await at(5.5,()=>page.goBack());await page.getByRole('button',{name:'Find a plan'}).waitFor();await page.locator('.quotes').scrollIntoViewIfNeeded();},
    budget:async()=>{await at(.4,()=>page.getByLabel('Keep the known total under').fill('140'));await at(1.8,()=>page.getByRole('button',{name:'Find a plan'}).click());await page.getByText('No complete quote fits that cap.',{exact:false}).waitFor();await at(8,()=>page.getByLabel('Keep the known total under').fill('150'));await at(10,()=>page.getByRole('button',{name:'Find a plan'}).click());await page.getByRole('button',{name:"Sam can't cover Monday"}).waitFor();await focusPlan();},
    plan:async()=>{await at(1,()=>page.getByRole('button',{name:'Review & confirm'}).click());await page.getByRole('dialog').waitFor();await at(3,()=>page.getByLabel('Confirming as').selectOption('Sam'));await at(6,()=>page.getByRole('checkbox').check());await at(8,()=>page.getByRole('button',{name:'Approve household plan'}).click());await page.getByText('Approved by Sam.',{exact:false}).waitFor();},
    change:async()=>{await at(1.4,()=>page.getByRole('button',{name:"Sam can't cover Monday"}).click());await page.getByText('We need another time.',{exact:true}).waitFor();await page.locator('.withdrawn').scrollIntoViewIfNeeded();await at(6,()=>page.getByRole('button',{name:'Find another time'}).hover());},
    replan:async()=>{await at(.7,()=>page.getByRole('button',{name:'Find another time'}).click());await page.getByRole('button',{name:"Alex can't cover Tuesday"}).waitFor();await focusPlan();await at(7,()=>page.getByRole('button',{name:'Review & confirm'}).click());await page.getByRole('dialog').waitFor();await page.getByLabel('Confirming as').selectOption('Alex');},
    consent:async()=>{await at(1,()=>page.getByRole('checkbox').check());await at(2.8,()=>page.getByRole('button',{name:'Approve household plan'}).click());await page.getByText('Approved by Alex.',{exact:false}).waitFor();await at(5.5,()=>page.reload());await page.getByText('Approved by Alex.',{exact:false}).waitFor();await focusPlan();},
    proof:async()=>{await at(.5,()=>page.goto(`${base}/api/mcp-activity`));await page.locator('pre').evaluate(e=>{const pre=e.cloneNode(true);pre.textContent=JSON.stringify(JSON.parse(e.textContent),null,2);Object.assign(pre.style,{fontSize:'15px',lineHeight:'1.4',padding:'20px'});document.body.replaceChildren(pre);});await at(6.5,()=>page.goto(base));await page.getByText('Approved by Alex.',{exact:false}).waitFor();await focusPlan();}
  };
  const first=performance.now();const marks=[];
  for(const scene of scenes){start=performance.now();marks.push({id:scene.id,start:(start-first)/1000,duration:scene.duration});console.log(`Recording ${scene.id}: ${scene.duration.toFixed(2)}s`);await actions[scene.id]();await at(scene.duration);}
  const captureDuration=(performance.now()-first)/1000;const recording=page.video();
  const finalState=await page.request.get(`${base}/api/desk`).then(r=>r.json());const receipts=await page.request.get(`${base}/api/mcp-activity`).then(r=>r.json());
  await context.close();context=null;
  writeFileSync(`${out}/recording.json`,JSON.stringify({source:await recording.path(),marks,captureDuration,mode:'continuous real UI, including actual MCP planning and household replanning'},null,2));
  writeFileSync(`${out}/runtime-receipts.json`,JSON.stringify(receipts,null,2));
  if(finalState.tasks[0].status!=='approved'||finalState.tasks[0].proposal.approvedBy!=='Alex')throw new Error('Final recorded approval missing');
  console.log('Actual UI recording and MCP receipts saved.');
} finally {await context?.close();await browser.close();await new Promise(r=>server.close(r));}
