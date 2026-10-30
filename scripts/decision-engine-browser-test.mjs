/* CI-only real-engine regression suite. Interactive local acceptance uses CUA. */
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const engine = process.env.BROWSER || 'chromium';
const shard = Number(process.env.SHARD || 0),
  shards = Number(process.env.SHARDS || 1);
assert.ok(Number.isInteger(shard) && Number.isInteger(shards) && shard >= 0 && shard < shards);
const type = { chromium, firefox, webkit }[engine];
assert.ok(type, 'Unknown engine');
const c = { window: {} };
vm.runInNewContext(
  await fs.readFile(new URL('../assets/cm-catalog-v3.js', import.meta.url), 'utf8'),
  c,
);
const catalog = c.window.CMCatalog;
assert.equal(catalog.length, 500);
const out = new URL('../browser-evidence/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await type.launch({ headless: true });
const results = [],
  failures = [];
const near = (value, expected, tolerance = 0.02) =>
  assert.ok(Math.abs(value - expected) <= tolerance, `${value} != ${expected}`);
async function validPage(page, tool) {
  const visible = page.locator('#result,#main,.kp-value,#result-contribution').first();
  await visible.waitFor({ state: 'visible' });
  const text = (await visible.innerText()).trim();
  assert.ok(
    text && !/^(?:—|NaN|Infinity|-Infinity)$|not defined|is not a function/i.test(text),
    tool.slug + ': invalid result ' + text,
  );
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('#cm-site-language option').count(), 20);
  assert.ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    tool.slug + ': page overflow',
  );
}
try {
  for (const size of [
    { width: 1365, height: 900 },
    { width: 375, height: 812 },
  ]) {
    const context = await browser.newContext({ viewport: size, colorScheme: 'dark' });
    for (const [index, tool] of catalog.entries()) {
      if (index % shards !== shard) continue;
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        const response = await page.goto(base + '/' + tool.slug + '?lang=en', {
          waitUntil: 'load',
        });
        assert.equal(response.status(), 200);
        await validPage(page, tool);
        assert.deepEqual(errors, [], 'Unhandled page error');
        results.push({ slug: tool.slug, width: size.width, engine, passed: true });
      } catch (error) {
        failures.push({ slug: tool.slug, width: size.width, engine, error: error.message, errors });
        await page.screenshot({
          path: new URL(`${engine}-${size.width}-${tool.slug}.png`, out).pathname,
          fullPage: true,
        });
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
  if (shard === 0) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base + '/loan-calculator?lang=en', { waitUntil: 'load' });
    near(Number((await page.locator('#main').innerText()).replace(/[^0-9.-]/g, '')), 1896.2);
    await page.locator('#cm-decision-goal').fill('1000');
    await page
      .locator('.cm-decisions')
      .getByRole('button', { name: 'Fill this value into the calculator', exact: true })
      .click();
    near(Number((await page.locator('#main').innerText()).replace(/[^0-9.-]/g, '')), 1000, 0.05);
    await page.locator('#cm-site-language').selectOption('zh-CN');
    assert.ok(Number(await page.locator('#prin').inputValue()) > 0);
    near(Number((await page.locator('#main').innerText()).replace(/[^0-9.-]/g, '')), 1000, 0.05);
    for (const [slug, field] of [
      ['age-calculator', 'ref'],
      ['countdown-calculator', 'from'],
    ]) {
      await page.goto(base + '/' + slug + '?lang=en', { waitUntil: 'load' });
      if (slug === 'age-calculator') {
        await page.locator('#dob').fill('2025-01-01');
        await page.locator('#ref').fill('2026-01-01');
        assert.equal(await page.locator('#result').innerText(), '1 year');
      }
      await page.locator('[data-cm-today]').click();
      const expected = await page.locator('#result').innerText();
      await page.locator('#' + field).fill('');
      assert.equal(await page.locator('#' + field).inputValue(), '');
      assert.equal(await page.locator('#result').innerText(), expected);
      assert.equal(await page.locator('body.cm-invalid').count(), 0);
      assert.ok(await page.locator('#result').isVisible());
    }
    for (const locale of ['ar', 'ur']) {
      await page.goto(base + '/' + locale + '/basic-calculator', { waitUntil: 'load' });
      const positions = await page.evaluate(() =>
        ['7', '8', '9', '*'].map(
          (key) =>
            document.querySelector('.kp-keys [data-key="' + key + '"]').getBoundingClientRect()
              .left,
        ),
      );
      assert.ok(
        positions.every((x, k) => k === 0 || positions[k - 1] < x),
        'stable physical keypad in ' + locale,
      );
      assert.equal(
        await page
          .locator('[data-key="M+"]')
          .evaluate((e) => globalThis.getComputedStyle(e).direction),
        'ltr',
      );
    }
    for (let repeat = 0; repeat < 3; repeat++) {
      const layout = encodeURIComponent(JSON.stringify({ v: 1, tools: ['loan-calculator'] }));
      await page.goto(base + '/workspace?lang=en#desk=' + layout, { waitUntil: 'load' });
      const loan = page.frameLocator('iframe[src*="loan-calculator"]');
      await loan.locator('#main').waitFor({ state: 'visible' });
      near(Number((await loan.locator('#main').innerText()).replace(/[^0-9.-]/g, '')), 1896.2);
      await loan.locator('#prin').fill('400000');
      near(Number((await loan.locator('#main').innerText()).replace(/[^0-9.-]/g, '')), 2528.27);
      await page.reload({ waitUntil: 'load' });
    }
    const nativeNames = JSON.parse(
      await fs.readFile(new URL('../src/translations/fr.json', import.meta.url), 'utf8'),
    );
    const annulus = nativeNames.Annulus;
    assert.ok(annulus && annulus !== 'Annulus');
    for (const path of ['/fr/', '/fr/directory']) {
      await page.goto(base + path, { waitUntil: 'load' });
      const input = page.locator(path === '/fr/' ? '#cm-home-search' : '#search');
      await input.fill(annulus);
      const grid = page.locator(path === '/fr/' ? '#cm-home-grid' : '#tool-grid');
      await grid.locator('a[href*="annulus-calculator"]').waitFor({ state: 'visible' });
    }
    await page.goto(base + '/fr/workspace', { waitUntil: 'load' });
    await page.locator('#add-tool').click();
    await page.locator('#picker-search').fill(annulus);
    await page.locator('.pick-tool').filter({ hasText: annulus }).first().click();
    await page
      .frameLocator('iframe[src*="annulus-calculator"]')
      .locator('#result')
      .waitFor({ state: 'visible' });
    await context.addInitScript(() => {
      Object.defineProperty(globalThis.Element.prototype, 'moveBefore', {
        value: undefined,
        configurable: true,
      });
    });
    const memoryLayout = encodeURIComponent(
      JSON.stringify({ v: 1, tools: ['loan-calculator', 'basic-calculator'] }),
    );
    await page.goto(base + '/workspace?lang=en#desk=' + memoryLayout, { waitUntil: 'load' });
    const pocket = page.frameLocator('iframe[src*="basic-calculator"]');
    for (const key of ['2', '0', '0', '+', '1', '0', '%', '=', 'M+', 'AC'])
      await pocket.locator('[data-key="' + key + '"]').click();
    await page
      .locator('.ws-card')
      .filter({ has: page.locator('iframe[src*="basic-calculator"]') })
      .locator('.ws-card-actions button')
      .nth(1)
      .click();
    await page.waitForFunction(
      () => !document.querySelector('.ws-card .ws-card-footer button').disabled,
    );
    await pocket.locator('[data-key="MR"]').click();
    near(Number((await pocket.locator('#kp-result').innerText()).replace(/[^0-9.-]/g, '')), 220);
    await page
      .locator('.ws-card')
      .filter({ has: page.locator('iframe[src*="basic-calculator"]') })
      .locator('.ws-card-actions button')
      .nth(3)
      .click();
    await page.locator('#ws-message button').click();
    await page.waitForFunction(
      () => !document.querySelector('.ws-card .ws-card-footer button').disabled,
    );
    await pocket.locator('[data-key="MR"]').click();
    near(Number((await pocket.locator('#kp-result').innerText()).replace(/[^0-9.-]/g, '')), 220);
    results.push({
      test: 'loan goal round trip, locale state, three fresh workspace documents and editable embedded results',
      engine,
      passed: true,
    });
    await context.close();
  }
} catch (error) {
  failures.push({ engine, error: error.message });
} finally {
  await browser.close();
  await fs.writeFile(
    new URL(`${engine}-${shard}.json`, out),
    JSON.stringify({ results, failures }, null, 2),
  );
}
console.log(
  `${engine} shard ${shard + 1}/${shards}: ${results.length} checks, ${failures.length} failures`,
);
assert.equal(failures.length, 0, JSON.stringify(failures.slice(0, 8)));
