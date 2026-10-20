// PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_CHANNEL=chrome node tests/number-game.e2e.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const base = process.env.NUMBER_BASE_URL || 'http://127.0.0.1:8104';
const artifacts = mkdtempSync(join(tmpdir(), 'pcg-number-qa-'));
const key = 'pcg-number-adventure-v1';

async function progress(page) {
  return page.evaluate((name) => JSON.parse(localStorage.getItem(name)), key);
}
async function fits(page) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    `horizontal overflow: ${await page.locator('#stage-name').textContent()}`,
  );
}
async function answer(page) {
  // Solve the displayed equation independently of the game's answer generator.
  const equation = await page.locator('#equation').textContent();
  const match = equation.match(/^(\d+|□) ([+−]) (\d+|□) = (\d+|\?)$/);
  assert.ok(match, `unexpected equation: ${equation}`);
  const [, a, operation, b, result] = match;
  if (a === '□') return operation === '+' ? Number(result) - Number(b) : Number(result) + Number(b);
  if (b === '□') return operation === '+' ? Number(result) - Number(a) : Number(a) - Number(result);
  return operation === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL });
  try {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1365, 1000],
    ]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          // The static dev server has no favicon.ico; retain all game-resource errors.
          if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico'))
            errors.push(message.text());
        });
        await page.goto(`${base}/number-game/index.html`);
        assert.equal(await page.locator('.stage').count(), 12);
        assert.equal(await page.locator('.stage:enabled').count(), 1);
        await fits(page);

        // A published v5 question must survive with its exact equation and choices.
        await page.evaluate(
          ({ name, saved }) => localStorage.setItem(name, JSON.stringify(saved)),
          {
            name: key,
            saved: {
              version: 5,
              completed: 7,
              round: { stage: 7, index: 2, seed: 42, solved: false },
            },
          },
        );
        await page.reload();
        await page.locator('#resume').click();
        assert.equal(await page.locator('#equation').textContent(), '□ + 9 = 75');
        assert.deepEqual(await page.locator('.answer').allTextContents(), ['75', '59', '66']);
        assert.equal((await progress(page)).version, 6);

        await page.evaluate(
          (name) =>
            localStorage.setItem(name, JSON.stringify({ version: 5, completed: 8, round: null })),
          key,
        );
        await page.reload();
        assert.equal(await page.locator('.stage:enabled').count(), 9);
        assert.match(await page.locator('#collection').textContent(), /8 \/ 12/);
        await page.locator('[data-stage="8"]').click();
        for (let stage = 8; stage < 12; stage++) {
          assert.match(
            await page.locator('#stage-name').textContent(),
            new RegExp(`第 ${stage + 1} 关`),
          );
          for (let index = 0; index < 5; index++) {
            const expected = await answer(page);
            const correct = page.getByRole('button', { name: `答案 ${expected}`, exact: true });
            await fits(page);
            if (index === 0) {
              const saved = await progress(page);
              const equation = await page.locator('#equation').textContent();
              const choices = await page.locator('.answer').allTextContents();
              const wrong = (await page.locator('.answer').allTextContents()).find(
                (value) => Number(value) !== expected,
              );
              await page.getByRole('button', { name: `答案 ${wrong}`, exact: true }).tap();
              assert.match(await page.locator('#feedback').textContent(), /再试试|再数一数/);
              assert.deepEqual(await progress(page), saved);
              await page.reload();
              await page.locator('#resume').click();
              assert.equal(await page.locator('#equation').textContent(), equation);
              assert.deepEqual(await page.locator('.answer').allTextContents(), choices);
              const token = page.locator('.token[aria-pressed]').first();
              await token.tap();
              assert.equal(await token.getAttribute('aria-pressed'), 'true');
              assert.match(await page.locator('#count-help').textContent(), /数到/);
              if (stage === 11)
                assert.equal(await page.locator('#hidden-number').textContent(), '?');
            }
            if (index === 1) {
              await correct.focus();
              await page.keyboard.press('Enter');
              assert.equal(
                await page.locator('#next').evaluate((node) => node === document.activeElement),
                true,
              );
            } else await correct.tap();
            assert.match(await page.locator('#feedback').textContent(), /✓/);
            assert.equal(await page.locator('.answer:enabled').count(), 0);
            if (index === 0) {
              const saved = await progress(page);
              await page.reload();
              await page.locator('#resume').click();
              assert.deepEqual(await progress(page), saved);
              assert.equal(await page.locator('.answer:enabled').count(), 0);
              assert.equal(await page.locator('#next').isVisible(), true);
            }
            await page.locator('#next').click();
          }
          assert.equal((await progress(page)).completed, stage + 1);
          assert.equal(await page.locator('.badge').count(), stage + 1);
          await fits(page);
          if (stage < 11) await page.locator('#continue').click();
        }
        assert.match(await page.locator('#reward-description').textContent(), /12 枚徽章/);
        await page.screenshot({ path: join(artifacts, `complete-${width}.png`), fullPage: true });
        await page.locator('#continue').click();
        assert.equal(await page.locator('.stage:enabled').count(), 12);
        assert.match(await page.locator('#collection').textContent(), /12 枚徽章集齐/);
        await page.locator('[data-stage="11"]').click();
        assert.equal((await progress(page)).completed, 12);
        await fits(page);
        await page.screenshot({ path: join(artifacts, `missing-${width}.png`), fullPage: true });
        assert.deepEqual(errors, []);
        console.log(
          `PASS ${width}x${height}: v5 migration, four stages, retries, counting, reload, keyboard, rewards, replay`,
        );
      } finally {
        await context.close();
      }
    }
    console.log(`Artifacts: ${artifacts}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
