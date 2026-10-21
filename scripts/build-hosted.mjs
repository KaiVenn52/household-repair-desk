import { build } from 'esbuild';
import { readFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const assets={};
for(const path of ['public/index.html','public/style.css','public/app.js','fixtures/quotes/clear-pipe.txt','fixtures/quotes/homekind.txt']) {
 let text=await readFile(path,'utf8');
 if(path==='public/index.html') text=text.replace('LOCAL DEMO','HOSTED DEMO').replace('PRIVATE · LOCAL','YOUR DEMO').replace('SAVED ON THIS COMPUTER','SAVED IN YOUR DEMO SESSION').replace('No microphone or household data leaves this local app.','Use sample details only. Demo notes are stored on the server; this private browser session expires after 48 hours.').replace('Local working prototype','Hosted simulation');
 if(path==='public/app.js') text=text.replaceAll('Saved locally;','Saved in this demo session;').replaceAll('Saved locally.','Saved in this demo session.').replaceAll('Saved on this computer','Saved in your demo session');
 assets[path.startsWith('public/')?'/'+path.slice(7):'/'+path]=text;
}
await mkdir('dist/server',{recursive:true});
await build({entryPoints:['hosted/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,define:{__REPAIR_ASSETS__:JSON.stringify(assets)},plugins:[{name:'domain-web-compat',setup(b){b.onResolve({filter:/^node:(crypto|fs|path)$/},()=>({path:resolve('hosted/compat.js')}));b.onLoad({filter:/[\\/]src[\\/]domain\.js$/},async a=>({contents:(await readFile(a.path,'utf8')).replaceAll('Buffer.from(', 'new TextEncoder().encode('),loader:'js'}));}}]});
await mkdir('dist/.openai',{recursive:true});await cp('.openai/hosting.json','dist/.openai/hosting.json');await cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built bundled Web Standards Worker, exact UI assets and D1 migrations.');
