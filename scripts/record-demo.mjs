// Continuous capture of the real app, driven through its actual visible controls.
import { chromium } from '@playwright/test';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createApp } from '../src/server.js';
const scenes = JSON.parse(readFileSync('video/timeline.json', 'utf8'));
mkdirSync('video/raw', { recursive: true });
const { app } = createApp({ dataFile: null });
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(executablePath) ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: 'video/raw', size: { width: 1600, height: 900 } }, reducedMotion: 'reduce' });
const page = await context.newPage(); page.setDefaultTimeout(15000);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let sceneStart;
const at = async (seconds, fn) => { const left = sceneStart + seconds * 1000 - performance.now(); if (left > 0) await wait(left); if (fn) await fn(); };
const workspace = () => page.evaluate(() => window.scrollTo({ top: document.querySelector('.workspace').offsetTop - 20, behavior: 'smooth' }));
const actions = {
  intro: async () => { await at(7, workspace); },
  report: async () => {
    await at(0.8, () => page.getByLabel('What needs fixing?').pressSequentially('The kitchen sink is leaking under the cabinet.', { delay: 45 }));
    await at(5, () => page.getByRole('button', { name: 'Report repair' }).click());
    await page.getByRole('button', { name: 'Compare sample quotes' }).waitFor();
  },
  compare: async () => {
    await at(0.6, () => page.getByRole('button', { name: 'Compare sample quotes' }).click()); await workspace();
    await at(6, () => page.locator('.quote').first().hover());
    await at(11, () => page.locator('.quote').nth(1).hover());
  },
  source: async () => {
    const href = await page.getByRole('link', { name: /Read source quote/ }).first().getAttribute('href');
    await at(0.5, () => page.goto(`${base}${href}`));
    await page.locator('pre').evaluate(el => { el.style.fontSize = '23px'; el.style.lineHeight = '1.7'; el.style.padding = '35px'; el.style.whiteSpace = 'pre-wrap'; });
    await at(10, () => page.goBack()); await page.getByRole('button', { name: 'Choose Homekind' }).waitFor(); await workspace();
  },
  calendar: async () => {
    await at(0.6, () => page.getByRole('button', { name: 'Choose Homekind' }).click());
    await page.locator('#slots').scrollIntoViewIfNeeded();
    await at(3, () => page.getByRole('button', { name: /Monday, October 19 · 09:00/ }).hover());
    await at(8, () => page.getByRole('button', { name: /Monday, October 19 · 14:00/ }).click());
    await page.getByRole('button', { name: 'Review & confirm' }).waitFor(); await workspace();
  },
  review: async () => {
    await at(0.5, () => page.getByRole('button', { name: 'Review & confirm' }).click());
    await at(4, () => page.getByLabel('Confirming as').selectOption('Sam'));
    await at(10, () => page.getByRole('checkbox').check());
    await at(14, () => page.getByRole('button', { name: 'Approve household plan' }).click());
    await page.getByText('Approved by Sam.', { exact: false }).waitFor();
  },
  persist: async () => {
    await at(2, () => page.reload()); await page.getByText('Approved by Sam.', { exact: false }).waitFor(); await workspace();
    await at(10, () => page.getByRole('button', { name: 'Cancel this task' }).click());
    await page.getByText('Cancelled locally. No provider was contacted.', { exact: false }).waitFor();
  },
  finish: async () => { await workspace(); await at(6, () => page.locator('.timeline').scrollIntoViewIfNeeded()); }
};
try {
  await page.goto(base); await page.getByText('No repairs yet.', { exact: false }).waitFor();
  const first = performance.now(); const marks = [];
  for (const scene of scenes) {
    sceneStart = performance.now(); marks.push({ id: scene.id, start: (sceneStart - first) / 1000, duration: scene.duration });
    console.log(`Recording ${scene.id}: ${scene.duration.toFixed(2)}s`);
    await actions[scene.id](); await at(scene.duration);
  }
  await page.screenshot({ path: 'video/recording-final-state.png', fullPage: true });
  const recording = page.video(); await context.close();
  const source = await recording.path();
  writeFileSync('video/recording.json', JSON.stringify({ source, marks, duration: (performance.now() - first) / 1000, mode: 'continuous-real-ui-recording', modelConnected: false, householdData: 'fictional fixtures only' }, null, 2));
  console.log('Recording saved:', source);
} finally { await browser.close(); await new Promise(r => server.close(r)); }
