import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'data', 'delivery', '.git', '.local-browser', 'raw', 'render-frames', 'audio'].includes(entry.name)) continue;
    if (/\.(mp4|webm|wav|mp3)$/i.test(entry.name) || entry.name === 'recording.json') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else { const body = readFileSync(path); files.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') }); }
  }
}
walk(root); files.sort((a,b) => a.path.localeCompare(b.path)); mkdirSync(join(root, 'delivery'), { recursive: true });
writeFileSync(join(root, 'delivery', 'manifest.json'), JSON.stringify({ scope: 'Local source, fixtures, preparation and verification evidence; excludes dependencies and runtime household data.', files }, null, 2));
console.log(`Manifest: ${files.length} files, ${files.reduce((n,f) => n + f.bytes, 0)} bytes.`);
