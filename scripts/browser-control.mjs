// Invoke the installed OpenCLI Browser Bridge without cmd.exe argument rewriting.
// Only run explicit, reviewed job files. Never include cookies or credentials.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
const cli = process.env.OPENCLI_ENTRY ?? join(homedir(), 'AppData/Roaming/npm/node_modules/@jackwener/opencli/dist/src/main.js');
const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const job of jobs) {
  console.log(`Browser ${job.session}: ${job.command}`);
  const result = spawnSync(process.execPath, [cli, 'browser', job.session, job.command, ...(job.args ?? [])], { encoding: 'utf8', windowsHide: true, timeout: 90000, maxBuffer: 2_000_000 });
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
