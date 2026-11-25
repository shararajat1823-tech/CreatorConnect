/**
 * Browser smoke test for the marketplace public site.
 *
 * Boots the built Angular SSR server and drives it with the pre-installed
 * Playwright Chromium to verify server rendering, client hydration, routing and
 * the 404 response. Runs WITHOUT a Supabase backend (empty/graceful states),
 * so it exercises the UI shell and navigation, not live data.
 *
 * Usage: npm run build:marketplace && node e2e/public-smoke.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

// Resolve Playwright from the workspace (it's a devDependency). If the browser
// binary isn't installed yet, point the user at the one-time install command.
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Run:\n  npm install\n  npx playwright install chromium');
  process.exit(1);
}

const PORT = 4199;
const BASE = `http://localhost:${PORT}`;
const SERVER = 'apps/marketplace/dist/marketplace/server/server.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};
const ok = (msg) => {
  passed++;
  console.log(`✓ ${msg}`);
};
async function expectText(page, text) {
  const found = await page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
  if (found) ok(`sees "${text}"`);
  else fail(`expected to see "${text}"`);
}

if (!existsSync(SERVER)) {
  console.error(`Build first: ${SERVER} not found. Run "npm run build:marketplace".`);
  process.exit(1);
}

const server = spawn('node', [SERVER], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error('SSR server did not start in time');
}

let browser;
try {
  await waitReady();
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 1. Homepage renders the hero headline.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await expectText(page, 'creator collab');

  // 2. Guest header shows the sign-in affordance after hydration.
  await expectText(page, 'Sign in');

  // 3. Primary CTA navigates to the directory (client routing).
  await page.getByRole('link', { name: 'Find Creators' }).first().click();
  await page.waitForURL('**/directory');
  await expectText(page, 'Find creators');

  // 4. Filters live in the URL and the empty state renders.
  await page.goto(`${BASE}/directory?niche=gaming`, { waitUntil: 'networkidle' });
  const nicheValue = await page.locator('#f-niche').inputValue();
  if (nicheValue === 'gaming') ok('niche filter is driven by the URL');
  else fail(`expected niche select = gaming, got "${nicheValue}"`);
  await expectText(page, 'No creators match your filters');

  // 5. Unknown profile returns a real 404.
  const resp = await page.goto(`${BASE}/creators/does-not-exist`);
  if (resp && resp.status() === 404) ok('unpublished profile returns HTTP 404');
  else fail(`expected 404 for missing profile, got ${resp && resp.status()}`);
  await expectText(page, 'Profile not found');

  console.log(`\n${passed} checks passed.`);
} catch (e) {
  if (/Executable doesn't exist|install/i.test(e.message)) {
    console.error('Chromium is not installed for Playwright. Run:\n  npx playwright install chromium');
  }
  fail(e.message);
} finally {
  await browser?.close();
  server.kill();
}

process.exit(process.exitCode ?? 0);
