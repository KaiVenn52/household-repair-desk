import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import worker from '../dist/server/index.js';
export function startHostedPreview(port=0){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0000_repair_sessions.sql','utf8').replaceAll('--> statement-breakpoint',''));
 const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){return db.prepare(sql).get(...values)??null;},async run(){const r=db.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};}};
 const server=createServer(async(req,res)=>{try{
  const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);
  const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
  const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);res.writeHead(500);res.end('Preview adapter error');}});
 server.listen(port,'127.0.0.1');server.on('close',()=>db.close());return server;
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){const server=startHostedPreview(4320);server.on('listening',()=>console.log('Hosted Worker preview: http://127.0.0.1:4320'));}
