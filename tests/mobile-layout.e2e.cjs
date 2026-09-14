// PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_CHANNEL=chrome node tests/mobile-layout.e2e.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const base = process.env.MOBILE_BASE_URL || 'http://127.0.0.1:8104';
const artifacts = mkdtempSync(join(tmpdir(), 'pcg-mobile-qa-'));
async function fits(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const { width, height } = page.viewportSize();
  assert.ok(
    box &&
      box.x >= -1 &&
      box.y >= -1 &&
      box.x + box.width <= width + 1 &&
      box.y + box.height <= height + 1,
    `${selector} outside ${width}x${height}: ${JSON.stringify(box)}`,
  );
}
async function noOverflow(page) {
  // Navigation animates the page from x=30px; measure after it settles.
  await page.locator('.page').evaluateAll(async (elements) => {
    await Promise.all(
      elements
        .flatMap((el) => el.getAnimations())
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    `horizontal overflow: ${page.url()}`,
  );
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL });
  try {
    for (const [width, height] of process.env.MOBILE_VIEWPORTS
      ? JSON.parse(process.env.MOBILE_VIEWPORTS)
      : [
          [320, 568],
          [390, 844],
          [844, 390],
          [1365, 1000],
        ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: true,
        isMobile: width < 1000,
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy/.test(m.text())) errors.push(m.text());
      });
      await page.goto(base);
      await noOverflow(page);
      for (const game of [
        'bee-game',
        'coloring-game',
        'bear-supermarket',
        'kitchen-game',
        'princess-dressup',
      ]) {
        assert.equal(await page.locator(`a[href="${game}/index.html"]`).count(), 1);
      }
      await page.locator('a[href="bee-game/index.html"]').tap();
      if (width < 1000)
        for (const selector of ['#start', '#left', '#right', '#pause']) await fits(page, selector);
      await page.locator('#start').tap();
      await page.waitForFunction(() => document.querySelector('#overlay').hidden);
      await page.locator('#right').tap();
      const canvas = await page.locator('#game').boundingBox();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 }],
      });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: canvas.x + canvas.width * 0.75, y: canvas.y + canvas.height / 2 }],
      });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.locator('#pause').tap();
      await page.waitForFunction(() => !document.querySelector('#overlay').hidden);
      await noOverflow(page);
      await page.screenshot({ path: join(artifacts, `bee-${width}.png`) });
      if (width === 390) {
        await page.setViewportSize({ width: 844, height: 390 });
        for (const selector of ['#start', '#left', '#right']) await fits(page, selector);
        await page.setViewportSize({ width, height });
      }

      await page.goto(`${base}/coloring-game/`);
      for (const button of await page.locator('#colors button').all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, 'crayons must be at least 44x44');
      }
      await page.getByRole('button', { name: '天空蓝', exact: true }).tap();
      await page.getByRole('button', { name: '云朵', exact: true }).tap();
      assert.equal(await page.locator('[data-region="cloud"]').getAttribute('fill'), '#79c8e6');
      await page.reload();
      assert.equal(await page.locator('[data-region="cloud"]').getAttribute('fill'), '#79c8e6');
      await page.getByRole('button', { name: '童话城堡', exact: true }).tap();
      await noOverflow(page);
      await page.screenshot({ path: join(artifacts, `coloring-${width}.png`), fullPage: true });

      await page.goto(`${base}/bear-supermarket/`);
      await page.locator('#btn-start').tap();
      await page.locator('[data-action="next-customer"]').tap();
      await page.locator('[data-action="price-down"]').waitFor();
      for (const selector of ['.price-setter', '[data-action="confirm-price"]'])
        await fits(page, selector);
      while ((await page.locator('.price-display').innerText()) !== '1元') {
        await page.locator('[data-action="price-down"]').tap();
        await page.waitForTimeout(100); // The game debounces price changes for 80 ms.
      }
      await page.locator('[data-action="confirm-price"]').tap();
      await page.waitForFunction(
        () => document.querySelector('#hdr-customers').textContent === '1',
      );
      await page.locator('[data-action="idle"]').tap();
      await page.locator('[data-action="end-day"]').tap();
      await page.locator('#summary.active').waitFor();
      await noOverflow(page);

      await page.goto(`${base}/kitchen-game/`);
      await page.locator('#btn-recipe').tap();
      await page.locator('.recipe-book').evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((animation) => animation.finished));
      });
      await fits(page, '#btn-rb-close');
      const close = await page.locator('#btn-rb-close').boundingBox();
      assert.ok(close.width >= 44 && close.height >= 44);
      await page.locator('#btn-rb-close').tap();
      await page.locator('.shop-item[data-id="rice"]').tap();
      await page.waitForTimeout(250); // Shared shop handler debounces purchases for 200 ms.
      await page.locator('.shop-item[data-id="egg"]').tap();
      await page.waitForFunction(() => document.querySelectorAll('.shop-item.bought').length === 2);
      await fits(page, '#btn-go-home');
      await page.locator('#btn-go-home').tap();
      await page.waitForURL('**/ride.html');
      await page.locator('.page').evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((animation) => animation.finished));
      });
      await noOverflow(page);
      await page.waitForURL('**/kitchen.html', { timeout: 20000 });
      await page.locator('.recipe-card.available').tap();
      await page.locator('.pot-item[data-id="rice"]').tap();
      await page.locator('.pot-item[data-id="egg"]').tap();
      await page.locator('#stir-pot').waitFor();
      await page.locator('#stir-pot').scrollIntoViewIfNeeded();
      const stir = await page.locator('#stir-pot').boundingBox();
      for (let i = 0; i < 20; i++) {
        await page.touchscreen.tap(stir.x + stir.width / 2, stir.y + stir.height / 2);
        await page.waitForTimeout(50);
      }
      await page.locator('#celebration-overlay.active').waitFor();
      await page.locator('#btn-restart').tap();
      await page.waitForURL('**/index.html');
      await noOverflow(page);

      await page.goto(`${base}/princess-dressup/`);
      await page.locator('#btn-start-dressup').tap();
      await fits(page, '#btn-done');
      await fits(page, '.wardrobe');
      const before = await page.locator('#doll').innerHTML();
      await page.locator('#tray button').nth(1).tap();
      assert.notEqual(await page.locator('#doll').innerHTML(), before);
      await page.locator('#btn-done').tap();
      await page.locator('#celebrate:not([hidden])').waitFor();
      await page.locator('#btn-continue').tap();
      await page.waitForFunction(() => document.querySelector('#celebrate').hidden);
      await noOverflow(page);
      await page.screenshot({ path: join(artifacts, `princess-${width}.png`) });
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        `PASS ${width}x${height}: home, bee touch/pause, coloring fill/persistence, bear sale, kitchen meal, princess dress/finish`,
      );
    }
    console.log('Artifacts:', artifacts);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
