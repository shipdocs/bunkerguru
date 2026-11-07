const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const artifacts = process.env.BUNKER_ARTIFACTS || '/tmp/bunkerguru-graphics';
const url = process.env.BUNKER_TEST_URL || 'http://127.0.0.1:8000';
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [];
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktop.on('pageerror', e => errors.push(e.message));
    await desktop.goto(url, { waitUntil: 'networkidle' });
    await desktop.click('[data-l="nl"]');
    await desktop.click('#skipTraining');
    for (const id of ['europoort', 'rotterdam', 'amsterdam', 'antwerpen']) {
      await desktop.keyboard.press('Escape');
      await desktop.locator(`.mapcard[data-id="${id}"]`).click();
      await desktop.click('#skipTraining');
      await desktop.waitForTimeout(300);
      await desktop.screenshot({ path: path.join(artifacts, `${id}.png`) });
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    mobile.on('pageerror', e => errors.push(e.message));
    await mobile.goto(url, { waitUntil: 'networkidle' });
    await mobile.click('#skipTraining');
    assert.deepEqual(await mobile.locator('#c').evaluate(c => ({ width: c.width, height: c.height, cssWidth: c.getBoundingClientRect().width })), { width: 780, height: 1688, cssWidth: 390 });
    // A sharper backing store must not change CSS-space map hit targets.
    await mobile.touchscreen.tap(320, 80);
    await mobile.waitForFunction(() => document.body.classList.contains('bigmap'));
    await mobile.touchscreen.tap(160, 250);
    await mobile.waitForFunction(() => !document.body.classList.contains('bigmap'));
    await mobile.screenshot({ path: path.join(artifacts, 'mobile-dpr3.png') });
    await mobile.setViewportSize({ width: 844, height: 390 });
    await mobile.waitForFunction(() => document.getElementById('c').width === 1688);
    assert.equal(await mobile.locator('#c').evaluate(c => c.height), 780);
    await mobile.screenshot({ path: path.join(artifacts, 'landscape-dpr3.png') });
    const fallback = await browser.newPage();
    fallback.on('pageerror', e => errors.push(e.message));
    await fallback.route('**/art/*', route => route.abort());
    await fallback.goto(url, { waitUntil: 'networkidle' });
    await fallback.click('#skipTraining');
    await fallback.waitForTimeout(500);
    assert(await fallback.locator('#hud').innerText());
    assert.deepEqual(errors, []);
    console.log('PASS: all four harbours, DPR3 canvas sharpness, CSS-space map taps, rotation and missing-image fallback; no page errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
