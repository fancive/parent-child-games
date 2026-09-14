const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const artifacts = mkdtempSync(join(tmpdir(), 'coloring-qa-'));
const base = process.env.COLORING_BASE_URL || 'http://127.0.0.1:8099';
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/`);
  await page.locator('a[href="coloring-game/index.html"]').click();
  assert.equal(await page.locator('#pages button').count(), 7);
  await page.getByRole('button', { name: '小恐龙', exact: true }).click();
  await page.getByRole('button', { name: '嫩芽绿', exact: true }).click();
  await page.getByRole('button', { name: '恐龙脑袋', exact: true }).click();
  assert.equal(await page.locator('[data-region="dinosaur-head"]').getAttribute('fill'), '#a5cc65');
  await page.getByRole('button', { name: '海底世界', exact: true }).click();
  await page.getByRole('button', { name: '天空蓝', exact: true }).click();
  await page.getByRole('button', { name: '大鱼身体', exact: true }).click();
  assert.equal(await page.locator('[data-region="fish"]').getAttribute('fill'), '#79c8e6');
  await page.getByRole('button', { name: '童话城堡', exact: true }).click();
  await page.getByRole('button', { name: '可可棕', exact: true }).click();
  await page.getByRole('button', { name: '城堡大门', exact: true }).click();
  assert.equal(await page.locator('[data-region="castle-door"]').getAttribute('fill'), '#ad8064');
  await page.getByRole('button', { name: '小花园', exact: true }).click();
  await page.getByRole('button', { name: '太阳黄', exact: true }).click();
  await page.getByRole('button', { name: '太阳', exact: true }).click();
  assert.equal(await page.locator('[data-region="sun"]').getAttribute('fill'), '#f5d65b');
  await page.getByRole('button', { name: '↶ 撤销', exact: true }).click();
  assert.equal(await page.locator('[data-region="sun"]').getAttribute('fill'), '#ffffff');
  await page.getByRole('button', { name: '↷ 重做', exact: true }).click();
  await page.reload();
  assert.equal(await page.locator('[data-region="sun"]').getAttribute('fill'), '#f5d65b');
  await page.getByRole('button', { name: '小猫咪', exact: true }).click();
  await page.getByRole('button', { name: '猫咪身体', exact: true }).click();
  await page.getByRole('button', { name: '小花园', exact: true }).click();
  assert.equal(await page.locator('[data-region="sun"]').getAttribute('fill'), '#f5d65b');
  await page.screenshot({ path: join(artifacts, 'desktop.png'), fullPage: true });
  await page.getByRole('button', { name: '自由画', exact: true }).click();
  const box = await page.locator('#drawing').boundingBox();
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 260, box.y + 200, { steps: 12 });
  await page.mouse.up();
  assert.equal(await page.locator('#strokes path').count(), 1);
  await page.getByRole('button', { name: '重新画', exact: true }).click();
  await page.getByRole('button', { name: '继续画', exact: true }).click();
  assert.equal(await page.locator('#strokes path').count(), 1);
  await page.getByRole('button', { name: '重新画', exact: true }).click();
  await page.getByRole('button', { name: '清空这张', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('#strokes path').length === 0);
  assert.equal(await page.locator('#strokes path').count(), 0);
  await page.getByRole('button', { name: '↶ 撤销', exact: true }).click();
  assert.equal(await page.locator('#strokes path').count(), 1);
  await page.getByRole('button', { name: '▱ 橡皮擦', exact: true }).click();
  await page.locator('#strokes path').click();
  assert.equal(await page.locator('#strokes path').count(), 0);
  await page.getByRole('button', { name: '↶ 撤销', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '↓ 保存图片', exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs(join(artifacts, 'drawing.png'));
  assert.equal(await download.failure(), null);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: '自由画', exact: true }).click();
  assert.equal(await page.locator('#strokes path').count(), 1);
  assert.equal(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), true);
  await context.setOffline(false);
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', (e) => errors.push(e.message));
  await phone.goto(`${base}/coloring-game/index.html`);
  assert.equal(await phone.locator('#pages button').count(), 7);
  await phone.getByRole('button', { name: '海底世界', exact: true }).tap();
  await phone.getByRole('button', { name: '大鱼身体', exact: true }).tap();
  assert.equal(await phone.locator('[data-region="fish"]').getAttribute('fill'), '#ef6b70');
  await phone.getByRole('button', { name: '小花园', exact: true }).tap();
  await phone.getByRole('button', { name: '天空蓝', exact: true }).tap();
  await phone.getByRole('button', { name: '云朵', exact: true }).tap();
  assert.equal(await phone.locator('[data-region="cloud"]').getAttribute('fill'), '#79c8e6');
  assert.equal(await phone.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), true);
  await phone.screenshot({ path: join(artifacts, 'mobile.png'), fullPage: true });
  await phone.getByRole('button', { name: '自由画', exact: true }).tap();
  await phone.locator('#drawing').scrollIntoViewIfNeeded();
  const mb = await phone.locator('#drawing').boundingBox();
  const cdp = await mobile.newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: mb.x + 40, y: mb.y + 40 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: mb.x + 150, y: mb.y + 100 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await phone.locator('#strokes path').count(), 1);
  await phone.reload();
  await phone.getByRole('button', { name: '自由画', exact: true }).tap();
  assert.equal(await phone.locator('#strokes path').count(), 1);
  assert.deepEqual(errors, []);
  console.log(
    'PASS desktop fill/undo/redo/page isolation/reload/brush/clear cancel/clear undo/erase/PNG download/offline; mobile touch fill/draw/reload/layout; no page errors',
  );
  console.log('Screenshots and PNG:', artifacts);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
