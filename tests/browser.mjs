import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createApp } from '../src/server.js';
const { app } = createApp({ dataFile: null, clock: () => new Date('2026-10-16T06:00:00Z') });
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const url = `http://127.0.0.1:${server.address().port}`;
let browser; const errors = []; const checks = [];
mkdirSync('evidence', { recursive: true });
try {
  const installedChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser = await chromium.launch({ headless: true, ...(existsSync(installedChrome) ? { executablePath: installedChrome } : {}) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 980 } }); const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error' && !/Failed to load resource: the server responded with a status of 400/.test(msg.text())) errors.push(msg.text()); });
  await page.goto(url); await page.getByText('No repairs yet.', { exact: false }).waitFor(); assert.equal(await page.title(), 'Household Repair Desk');
  await page.screenshot({ path: 'evidence/desktop-initial.png', fullPage: true });
  await page.getByLabel('What needs fixing?').fill('The kitchen sink is leaking under the cabinet.'); await page.getByRole('button', { name: 'Report repair' }).click();
  await page.getByRole('button', { name: 'Compare sample quotes' }).click(); await page.getByRole('button', { name: 'Choose Homekind' }).click();
  assert.equal(await page.getByRole('button', { name: /Monday, October 19 · 09:00/ }).isDisabled(), true);
  await page.screenshot({ path: 'evidence/desktop-quotes.png', fullPage: true });
  await page.getByRole('button', { name: /Monday, October 19 · 14:00/ }).click(); await page.getByRole('button', { name: 'Review & confirm' }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', { name: 'Approve household plan' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Confirming as').selectOption('Sam'); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Approve household plan' }).click();
  await page.getByText('Approved by Sam.', { exact: false }).waitFor(); await page.reload(); await page.getByText('Approved by Sam.', { exact: false }).waitFor(); checks.push('report → compare → reject unavailable slot → review → explicit Sam approval → reload persistence');
  await page.screenshot({ path: 'evidence/desktop-approved.png', fullPage: true });
  let axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); assert.deepEqual(axe.violations.map(v => ({ id:v.id, impact:v.impact, nodes:v.nodes.map(n => n.target) })), []); checks.push('axe WCAG A/AA scan: approved desktop');
  for (const width of [375, 768, 1280]) { await page.setViewportSize({ width, height: 960 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${width}`); await page.screenshot({ path: `evidence/viewport-${width}.png`, fullPage: true }); }
  checks.push('375 / 768 / 1280 px: no horizontal overflow');
  await page.getByRole('button', { name: 'Cancel this task' }).click(); await page.getByText('Cancelled locally. No provider was contacted.', { exact: false }).waitFor(); checks.push('cancel approved local plan');
  await page.getByLabel('What needs fixing?').fill('Please repair my broken roof.'); await page.getByRole('button', { name: 'Report repair' }).click(); await page.getByRole('alert').filter({ hasText: /leaking kitchen sink/ }).waitFor(); checks.push('unsupported repair error preserves report');
  await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement !== document.body)); checks.push('keyboard focus reaches interactive control');
  assert.deepEqual(errors, []); checks.push('no page or console errors');
  const report = { status: 'PASS', browser: 'Playwright controlling installed Google Chrome; Browser plugin not available', url, checks, consoleErrors: errors, expectedNetworkErrors: ['HTTP 400 for intentionally unsupported repair'], externalAlexa: false, externalBooking: false, publicDeployment: false };
  writeFileSync('evidence/browser-report.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
