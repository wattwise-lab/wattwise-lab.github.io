/* CI-only touch regression. Local visual acceptance uses CUA. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
const engine = process.env.BROWSER || 'chromium';
const browser = await { chromium, firefox, webkit }[engine].launch();
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const out = new URL('../browser-evidence/workspace-mobile/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  hasTouch: true,
  ...(engine === 'firefox' ? {} : { isMobile: true }),
});
const page = await context.newPage();
const failures = [];
page.on('pageerror', (error) => failures.push(error.stack || error.message));
async function pick(query) {
  await page.locator('#picker-search').fill(query);
  await page.locator('#picker-results button').first().tap();
}
async function ready(count) {
  await page.waitForFunction((expected) => {
    const cards = globalThis.CMWorkspace?.cards();
    return cards?.length === expected && cards.every((card) => card.ready);
  }, count);
}
try {
  await page.goto(base + '/zh-cn/');
  await page.locator('.cm-site-header__nav > .cm-site-header__workspace').tap();
  await page.waitForURL('**/zh-cn/workspace');
  await page.locator('#add-tool').tap();
  await pick('普通计算器');
  await ready(1);
  const first = page.frameLocator('#desk-1 iframe');
  await first.locator('[data-key="7"]').tap();
  await page.locator('.empty-slot button').tap();
  await pick('科学计算器');
  await ready(2);
  await page.locator('#ws-direct-search').fill('百分比');
  await page.locator('#ws-direct-results button').first().tap();
  await ready(3);
  await page.locator('#add-tool').tap();
  await pick('贷款月供');
  await ready(4);
  assert.equal(await page.locator('#add-tool').isEnabled(), true);
  assert.equal(await page.locator('#add-tool').innerText(), '替换');
  assert.equal(await first.locator('#kp-result').innerText(), '7');
  await page.locator('#add-tool').tap();
  await pick('年龄计算器');
  await page.locator('#ws-tool-choice').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#ws-replace-target').inputValue(), '');
  assert.equal(await page.locator('#ws-tool-choice button[type=submit]').isEnabled(), false);
  await page.getByRole('button', { name: '取消', exact: true }).tap();
  assert.equal(await page.locator('.ws-card:not(.empty-slot)').count(), 4);
  assert.equal(await first.locator('#kp-result').innerText(), '7');
  assert.equal(
    await page.locator('#add-tool').evaluate((node) => node === globalThis.document.activeElement),
    true,
  );
  await page.locator('#add-tool').tap();
  await pick('年龄计算器');
  await page.locator('#ws-replace-target').selectOption('4');
  await page.locator('#ws-tool-choice button[type=submit]').tap();
  await ready(4);
  await page.waitForFunction(() => {
    const card = globalThis.document.getElementById('desk-5');
    return (
      card && globalThis.document.activeElement === card && card.getBoundingClientRect().top < 150
    );
  });
  assert.equal(await first.locator('#kp-result').innerText(), '7');
  assert.equal(await page.locator('#desk-5 h2').first().innerText(), '年龄计算器');
  await page.locator('#add-tool').tap();
  await page.locator('#picker-search').fill('普通计算器');
  await page.screenshot({ path: new URL('picker-phone.png', out).pathname });
  await page.locator('#picker-results button').first().tap();
  // Close the modal before using background navigation.
  await page.locator('#ws-tool-choice button').first().tap();
  await page.locator('#cm-site-language').selectOption('ar');
  await page.locator('#add-tool').tap();
  await pick('basic-calculator');
  await page.locator('#ws-tool-choice').waitFor({ state: 'visible' });
  await page.screenshot({ path: new URL('replacement-arabic-phone.png', out).pathname });
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  assert.equal(await page.locator('#ws-tool-choice button[type=submit]').isEnabled(), false);
  assert.deepEqual(failures, []);
  await fs.writeFile(
    new URL('report.json', out),
    JSON.stringify(
      {
        engine,
        passed: true,
        touch: true,
        cases: [
          'home header entry',
          'header add',
          'empty-slot add',
          'search add',
          'full workspace picker',
          'explicit replacement target',
          'cancel preserves input and focus',
          'replace preserves other inputs',
          'new card in view',
          'Arabic replacement dialog',
        ],
        failures,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
