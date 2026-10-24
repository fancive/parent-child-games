// PLAYWRIGHT_MODULE=/path/to/playwright BROWSER_CHANNEL=chrome node tests/english-game.e2e.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const base = process.env.ENGLISH_BASE_URL || 'http://127.0.0.1:8104';
const artifacts = mkdtempSync(join(tmpdir(), 'english-qa-'));
const storageKey = 'english-rainbow-island-v1';
const legacy = {
  version: 1,
  ranges: { theme: 5, phonics: 5 },
  parentReading: true,
  missed: ['theme-1-hen', 'theme-2-kitchen', 'phonics-1-cat', 'phonics-4-pig'],
  stickers: ['theme-2', 'phonics-4'],
  completed: ['old-round-a', 'old-round-b'],
  totalRounds: 2,
};

async function position(page, index) {
  await page.waitForFunction(
    (number) =>
      document.querySelector('.round-position')?.textContent.includes(`第 ${number} / 6 题`),
    index,
  );
}

async function correctOption(page, book) {
  const value =
    book === 'theme'
      ? await page.locator('#word-hint small').textContent()
      : (await page.locator('#word-hint span').textContent())[0];
  return page.getByRole('button', { name: value, exact: true });
}

async function answer(page, book, input = 'click') {
  const option = await correctOption(page, book);
  if (input === 'keyboard') {
    await option.focus();
    await option.press('Enter');
  } else await option[input]();
}

async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
}

async function noOverflow(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    `horizontal overflow at ${page.viewportSize().width}px`,
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL });
  const results = [];
  try {
    for (const [width, height] of process.env.ENGLISH_VIEWPORTS
      ? JSON.parse(process.env.ENGLISH_VIEWPORTS)
      : [
          [320, 568],
          [390, 844],
          [1365, 1000],
        ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 1000,
        hasTouch: true,
      });
      await context.addInitScript(
        ({ key, value }) => {
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
        },
        { key: storageKey, value: legacy },
      );
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/english-game/`);
      await page.locator('#map-nodes button').first().waitFor();
      assert.equal(await page.locator('#map-nodes button').count(), 5);
      assert.equal(await page.locator('#sticker-count').textContent(), '2');
      await noOverflow(page);
      await page.locator('#start-round').click();
      await position(page, 1);
      assert.equal(await page.locator('#next-question').count(), 0);
      const correct = await correctOption(page, 'theme');
      const label = await correct.getAttribute('aria-label');
      const wrong = page.locator('[data-answer]').filter({ hasNotText: label }).first();
      await wrong.click();
      assert.equal(await wrong.isDisabled(), true);
      assert.match(await page.locator('#answer-feedback').textContent(), /差一点点/);
      await page.waitForTimeout(1200);
      await position(page, 1);
      await correct.dblclick();
      assert.equal(await page.locator('[data-answer]:enabled').count(), 0);
      assert.match(await page.locator('#answer-feedback').textContent(), /找到了/);
      await page.screenshot({ path: join(artifacts, `feedback-${width}.png`), fullPage: true });
      await position(page, 2);
      await noOverflow(page);

      // Leaving during the feedback must not advance the next round.
      await answer(page, 'theme');
      await page.locator('#exit-round').click();
      await page.locator('#start-round').click();
      await page.waitForTimeout(1200);
      await position(page, 1);
      assert.equal((await saved(page)).totalRounds, 2);
      for (let index = 1; index <= 6; index++) {
        await position(page, index);
        await answer(page, 'theme', index === 1 ? 'keyboard' : width < 1000 ? 'tap' : 'click');
      }
      await page.locator('.finish-card').waitFor();
      assert.match(await page.locator('#question-title').textContent(), /六小步/);
      let progress = await saved(page);
      assert.equal(progress.totalRounds, 3);
      assert.ok(progress.stickers.includes('theme-1'));
      assert.ok(progress.stickers.includes('theme-2'));
      assert.ok(progress.stickers.includes('phonics-4'));
      assert.ok(progress.missed.includes('theme-2-kitchen'));
      assert.ok(progress.missed.includes('phonics-4-pig'));
      await page.waitForTimeout(1200);
      assert.equal((await saved(page)).totalRounds, 3);
      await page.screenshot({ path: join(artifacts, `finish-${width}.png`), fullPage: true });
      await page.reload();
      await page.locator('#map-nodes button').first().waitFor();
      assert.equal(await page.locator('#sticker-count').textContent(), '3');
      await page.locator('#tab-theme').focus();
      await page.locator('#tab-theme').press('ArrowRight');
      assert.equal(await page.locator('#tab-phonics').getAttribute('aria-selected'), 'true');
      await page.locator('#start-round').click();
      for (let index = 1; index <= 6; index++) {
        await position(page, index);
        await answer(page, 'phonics', width < 1000 ? 'tap' : 'click');
      }
      await page.locator('.finish-card').waitFor();
      progress = await saved(page);
      assert.equal(progress.totalRounds, 4);
      assert.ok(progress.stickers.includes('phonics-1'));
      assert.equal(progress.completed.length, 4);
      await page.locator('#finish-home').click();
      await page.locator('#review-missed').click();
      await position(page, 1);
      assert.match(await page.locator('.question-card .eyebrow').textContent(), /错题重练/);
      await answer(page, 'phonics');
      await position(page, 2);
      await page.locator('#exit-round').click();
      progress = await saved(page);
      assert.equal(progress.missed.includes('phonics-1-cat'), false);
      assert.ok(progress.missed.includes('phonics-4-pig'));
      assert.ok(progress.missed.includes('theme-2-kitchen'));

      for (const book of ['theme', 'phonics']) {
        await page.locator(`#tab-${book}`).click();
        for (let unit = 1; unit <= 5; unit++) {
          await page.locator(`[data-unit="${unit}"]`).click();
          assert.match(
            await page.locator('#selection-description').textContent(),
            new RegExp(`第 ${unit} 单元`),
          );
        }
      }
      await noOverflow(page);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await page.locator('#map-nodes button').first().waitFor();
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await context.setOffline(true);
      await page.reload();
      await page.locator('#start-round').click();
      await position(page, 1);
      await answer(page, 'theme');
      await position(page, 2);
      await context.setOffline(false);
      await page.locator('#exit-round').click();
      assert.deepEqual(errors, []);
      results.push({
        viewport: [width, height],
        automaticAnswers: 'PASS',
        retry: 'PASS',
        legacySave: 'PASS',
        offline: 'PASS',
        errors,
      });
      await context.close();
    }

    // This scenario controls only the OS speech boundary; choices and navigation use the UI.
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () => [{ name: 'Samantha', lang: 'en-US', default: true }],
          cancel() {},
          addEventListener() {},
          speak(utterance) {
            window.testUtterance = utterance;
            utterance.onstart();
          },
        },
      });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: class {
          constructor(text) {
            this.text = text;
          }
        },
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.goto(`${base}/english-game/`);
    await page.locator('#start-round').click();
    await answer(page, 'theme');
    await page.locator('#speak-sentence').click();
    await page.waitForTimeout(1200);
    await position(page, 1);
    await page.evaluate(() => window.testUtterance.onend());
    await position(page, 2);
    await answer(page, 'theme');
    await page.locator('#speak-sentence').click();
    await page.evaluate(() => window.testUtterance.onerror());
    await position(page, 3);
    // Headless Chrome keeps background tabs visible, so control its lifecycle signals here.
    await page.evaluate(() => {
      window.testPageHidden = false;
      Object.defineProperty(document, 'hidden', { get: () => window.testPageHidden });
    });
    await answer(page, 'theme');
    await page.evaluate(() => {
      window.testPageHidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(1200);
    await position(page, 3);
    await page.evaluate(() => {
      window.testPageHidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await position(page, 4);
    await answer(page, 'theme');
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.waitForTimeout(1200);
    await position(page, 4);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await position(page, 5);
    await context.close();
    results.push({
      controlledSpeechBoundary: 'PASS',
      controlledPageLifecycle: 'PASS',
      actualAudio: 'not tested',
    });
    writeFileSync(join(artifacts, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ status: 'PASS', artifacts, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
