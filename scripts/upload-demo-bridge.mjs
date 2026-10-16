// File upload through the same connected Browser Bridge; no cookie access.
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
const entry = join(homedir(), 'AppData/Roaming/npm/node_modules/@jackwener/opencli/dist/src/browser/page.js');
const { Page } = await import(pathToFileURL(entry).href);
const page = new Page('alexa-video');
const before = await page.evaluate("Array.from(document.querySelectorAll('input[type=file]')).map(e=>({name:e.name,files:e.files.length}))");
if (before.length !== 1 || before[0].files !== 0) throw new Error('Expected one empty upload input; inspect the current page before retrying.');
// Some YouTube uploaders ignore programmatic clicks on a hidden input. Use
// the permitted file chooser operation, then the actual visible chooser button.
// Do not call blocked raw CDP file methods or copy browser credentials.
const pending = page.setFileInput([resolve('video/household-repair-desk-demo.mp4')], 'input[name=Filedata]');
await new Promise(resolve => setTimeout(resolve, 800));
await page.click('button[aria-label="选择文件"]');
await pending;
console.log(await page.evaluate("Array.from(document.querySelectorAll('input[type=file]')).map(e=>({name:e.name,files:Array.from(e.files).map(f=>f.name)}))"));
