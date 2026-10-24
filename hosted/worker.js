import { RepairDesk, quotes, createSlots } from '../src/domain.js';
import { createMcpServer } from '../src/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const assets=__REPAIR_ASSETS__;
const SESSION='__Host-repair-demo';
const TTL=48*60*60*1000;
const security={ 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
const json=(v,status=200)=>Response.json(v,{status});
async function session(request,env){
 const cookie=(request.headers.get('cookie')??'').split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION+'='))?.slice(SESSION.length+1);
 const valid=/^[a-f0-9-]{36}$/.test(cookie??'');
 const row=valid?await env.DB.prepare('SELECT revision, payload FROM repair_sessions WHERE session_id = ? AND expires_at > ?').bind(cookie,Date.now()).first():null;
 if(row)return {id:cookie,revision:row.revision,...JSON.parse(row.payload),fresh:false};
 const state={id:crypto.randomUUID(),revision:0,tasks:[],activity:[],fresh:true};
 await env.DB.prepare('INSERT INTO repair_sessions (session_id, revision, payload, expires_at) VALUES (?, 0, ?, ?)').bind(state.id,JSON.stringify({tasks:[],activity:[]}),Date.now()+TTL).run();
 return state;
}
async function save(env,s,desk){
 const payload=JSON.stringify({tasks:desk.tasks,activity:s.activity});
 if(payload.length>150000)throw Object.assign(new Error('This demo session is full. Start a new browser session.'),{status:409,code:'DEMO_LIMIT'});
 const result=await env.DB.prepare('UPDATE repair_sessions SET payload = ?, revision = revision + 1 WHERE session_id = ? AND revision = ? AND expires_at > ?').bind(payload,s.id,s.revision,Date.now()).run();
 if(result.meta.changes!==1)throw Object.assign(new Error('This demo changed in another tab. Refresh before trying again.'),{status:409,code:'STALE_SESSION'});
}
async function bodyOf(request){
 const tooLarge=()=>Object.assign(new Error('Request too large.'),{status:413});
 if(Number(request.headers.get('content-length')??0)>16384)throw tooLarge();
 const reader=request.body?.getReader();let size=0;const chunks=[];
 if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw tooLarge();}chunks.push(value);}}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}const text=new TextDecoder().decode(bytes);
 try{return JSON.parse(text);}catch{throw Object.assign(new Error('Send a valid JSON request.'),{status:400});}
}
function attach(response,s){
 const headers=new Headers(response.headers);for(const [k,v] of Object.entries(security))if(k!=='Content-Security-Policy'||!headers.has(k))headers.set(k,v);
 if(s?.fresh)headers.append('Set-Cookie',`${SESSION}=${s.id}; Path=/; Max-Age=172800; HttpOnly; Secure; SameSite=Strict`);
 return new Response(response.body,{status:response.status,headers});
}
async function route(request,env){
 const url=new URL(request.url),path=url.pathname;
 // Public documents and bundled assets must be reachable from external links.
 // Serve only read-only static requests before the session/API origin checks.
 if(['GET','HEAD'].includes(request.method) && (path==='/'||assets[path]!==undefined)){
  const key=path==='/'?'/index.html':path;
  const headers={'Content-Type':key.endsWith('.html')?'text/html; charset=utf-8':key.endsWith('.css')?'text/css; charset=utf-8':key.endsWith('.js')?'text/javascript; charset=utf-8':'text/plain; charset=utf-8'};
  let content=assets[key];
  if(key.endsWith('.html')){const nonce=crypto.randomUUID();headers['Content-Security-Policy']=security['Content-Security-Policy'].replace("script-src 'self'",`script-src 'self' 'nonce-${nonce}'`);content=content.replace('<script type="module"',`<script nonce="${nonce}" type="module"`);}
  return new Response(request.method==='HEAD'?null:content,{headers});
 }
 if(request.headers.get('origin') && request.headers.get('origin')!==url.origin)return json({error:'Origin not allowed.'},403);
 if(['cross-site'].includes(request.headers.get('sec-fetch-site')))return json({error:'Cross-site access is not allowed.'},403);
 if(path==='/api/health')return json({ok:true,mode:'hosted-fixture-simulation',mcp:'2025-11-25',storage:'D1 per-browser session, 48-hour expiry',externalBooking:false,modelConnected:false});
 if(!path.startsWith('/api/')&&path!=='/mcp')return json({error:'Not found.'},404);
 const s=await session(request,env);const desk=new RepairDesk(null);desk.tasks=s.tasks;
 let response;
 try{
  if(path==='/mcp'||path==='/api/mcp'){
   if(request.method!=='POST')return attach(new Response(null,{status:405,headers:{Allow:'POST'}}),s);
   const body=await bodyOf(request);
   const version=request.headers.get('mcp-protocol-version');
   if((version&&version!=='2025-11-25')||(body.method==='initialize'&&body.params?.protocolVersion!=='2025-11-25'))return attach(json({error:'Use MCP 2025-11-25.'},400),s);
   const server=createMcpServer(desk),transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
   await server.connect(transport);
   try{
    response=await transport.handleRequest(new Request(request,{body:JSON.stringify(body)}));
    // Consume the JSON response before closing the per-request stateless server.
    const text=await response.text();response=new Response(text,{status:response.status,headers:response.headers});
    if(body.method==='tools/call'){
     const result=JSON.parse(text).result;
     s.activity.push({tool:body.params?.name,protocol:'2025-11-25',transport:'Streamable HTTP',outcome:result?.isError?'rejected':'completed',at:new Date().toISOString()});
     s.activity=s.activity.slice(-50);
    }
    if(desk.tasks.length>12)throw Object.assign(new Error('This demo supports up to 12 repairs per browser session.'),{status:409,code:'DEMO_LIMIT'});
    if(body.method==='tools/call')await save(env,s,desk);
   }finally{await transport.close();await server.close();}
  }else if(path==='/api/desk'&&request.method==='GET')response=json({tasks:desk.list(),quotes,slots:createSlots(desk.clock()),timezone:'Asia/Kuala_Lumpur'});
  else if(path==='/api/mcp-activity'&&request.method==='GET')response=json({mode:'hosted fictional household; isolated browser session',calls:s.activity,runtimeModelConnected:false});
  else if(path.startsWith('/api/review/')&&request.method==='GET')response=json(desk.review(decodeURIComponent(path.slice('/api/review/'.length))));
  else if(request.method==='POST'){
   const body=await bodyOf(request);const name=path.slice(5);
   if(name==='plan'||name==='availability'){
    // The browser route calls the real public HTTP MCP endpoint, retaining only
    // this visitor's HttpOnly demo cookie. No user-controlled URL is accepted.
    const client=new Client({name:'household-hosted-experience',version:'0.3.0'});
    try{
     await client.connect(new StreamableHTTPClientTransport(new URL('/api/mcp',url.origin),{requestInit:{headers:{Cookie:`${SESSION}=${s.id}`}}}));
     const tool=name==='plan'?'plan_repair':'update_household_availability';
     const result=await client.callTool({name:tool,arguments:body});
     if(result.isError){let detail;try{detail=JSON.parse(result.content?.find(c=>c.type==='text')?.text??'');}catch{}
      response=json(detail?.code?detail:{code:'INVALID_TOOL_ARGUMENTS',error:'Check the planning arguments and refresh the task.'},detail?.code?409:400);
     }else response=json({...result.structuredContent,toolReceipt:{name:tool,protocol:'2025-11-25',transport:'Streamable HTTP',executed:true}});
    }finally{await client.close();}
   }else{
    const methods={report:'report',compare:'compare',propose:'propose','renew-review':'renewReview',approve:'approve',cancel:'cancel'};
    if(!methods[name])response=json({error:'Not found.'},404);
    else{
     if(name==='report'&&desk.tasks.length>=12)throw Object.assign(new Error('This demo supports up to 12 repairs per browser session.'),{status:409,code:'DEMO_LIMIT'});
     response=json(desk[methods[name]](body));await save(env,s,desk);
    }
   }
  }else response=json({error:'Method not allowed.'},405);
 }catch(e){response=json({code:e.code??'REQUEST_ERROR',error:e.status&&e.status<500?e.message:'The demo could not save this change. Refresh and retry.'},e.status??500);}
 return attach(response,s);
}
export default {async fetch(request,env){try{return attach(await route(request,env));}catch(e){console.error('Hosted request failed:',e.message);return attach(json({error:'The demo is temporarily unavailable. Please retry.'},503));}}};
