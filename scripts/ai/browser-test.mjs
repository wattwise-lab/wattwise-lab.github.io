/* CI browser regression with explicit provider fixtures; real AI acceptance is separate. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { interpret, recompute } from '../../services/ai/engine.mjs';
const engine = process.env.BROWSER || 'chromium';
const browser = await { chromium, firefox, webkit }[engine].launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const failures = [],
  requests = [];
page.on('pageerror', (e) => failures.push(e.message));
const out = new URL('../../browser-evidence/ai/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const text = '10 kg; 2 m/s²; 0.01 m²';
const chain = interpret(
  {
    steps: [
      {
        id: 'f',
        tool: 'force-calculator',
        inputs: {
          m: { value: 10, unit: 'kg', source: '10 kg' },
          a: { value: 2, unit: 'm/s²', source: '2 m/s²' },
        },
      },
      {
        id: 'p',
        tool: 'pressure-calculator',
        inputs: {
          f: { ref: { step: 'f', row: 0 } },
          a: { value: 0.01, unit: 'm²', source: '0.01 m²' },
        },
      },
    ],
    questions: [],
  },
  text,
);
const shoppingText = '西红柿2kg6CNY/kg；鸡蛋3盒12CNY/盒；运费5CNY';
const shopping = interpret(
  {
    steps: [
      {
        id: 'shop',
        tool: 'shopping-total',
        inputs: {
          items: {
            value: [
              {
                name: '西红柿',
                quantity: 2,
                unit: 'kg',
                price: 6,
                perUnit: 'kg',
                currency: 'CNY',
                source: '西红柿2kg6CNY/kg',
              },
              {
                name: '鸡蛋',
                quantity: 3,
                unit: '盒',
                price: 12,
                perUnit: '盒',
                currency: 'CNY',
                source: '鸡蛋3盒12CNY/盒',
              },
            ],
          },
          shipping: { value: 5, unit: 'CNY', source: '运费5CNY' },
        },
      },
    ],
  },
  shoppingText,
  'zh-CN',
);
let fixture = chain,
  serviceFailure = false;
await page.route('https://calcmintly-ai.pages.dev/**', async (route) => {
  const req = route.request();
  requests.push(new URL(req.url()).pathname);
  if (req.method() === 'OPTIONS') {
    await route.fulfill({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
    });
    return;
  }
  if (serviceFailure) {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'ai_unavailable' }),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
    return;
  }
  const data = req.postDataJSON();
  const body =
    new URL(req.url()).pathname === '/recalculate'
      ? { steps: recompute(data.steps, data.locale) }
      : { plan: fixture };
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
});
const base = 'http://127.0.0.1:4173';
const routes = [
  'en',
  'zh-cn',
  'hi',
  'es',
  'ar',
  'fr',
  'bn',
  'pt',
  'id',
  'ur',
  'ru',
  'de',
  'ja',
  'pcm',
  'mr',
  'vi',
  'te',
  'sw',
  'ha',
  'tr',
];
let checked = 0;
try {
  for (const lang of routes) {
    await page.goto(`${base}/${lang === 'en' ? '' : lang + '/'}ai`, { waitUntil: 'networkidle' });
    assert.ok((await page.locator('h1').innerText()).trim());
    assert.equal(await page.locator('h1').count(), 1);
    if (lang !== 'en')
      assert.ok((await page.title()).includes(await page.locator('h1').innerText()));
    assert.equal(await page.locator('[data-ai-example]').count(), 4);
    assert.ok((await page.locator('#cm-ai-question').getAttribute('placeholder')).trim());
    assert.equal(
      await page.locator('html').getAttribute('lang'),
      lang === 'zh-cn' ? 'zh-CN' : lang,
    );
    assert.equal(
      await page.locator('html').getAttribute('dir'),
      ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr',
    );
    await page.locator('[data-ai-example="0"]').click();
    assert.ok((await page.locator('#cm-ai-question').inputValue()).length > 10);
    checked++;
  }
  assert.equal(requests.length, 0, 'Browsing and selecting examples must not transmit text');
  await page.goto(base + '/zh-cn/workspace');
  assert.equal(await page.locator('main .cm-ai-entry').count(), 1);
  assert.ok(await page.locator('main .cm-ai-entry').isVisible());
  await page.locator('main .cm-ai-entry').click();
  assert.equal(new URL(page.url()).pathname, '/zh-cn/ai');
  await page.goto(base + '/zh-cn/');
  await page.locator('main .cm-ai-entry').click();
  assert.equal(new URL(page.url()).pathname, '/zh-cn/ai');
  await page.goto(base + '/zh-cn/ai');
  await page.locator('#cm-ai-question').fill(text);
  await page.locator('#cm-ai-send').click();
  await page.locator('[data-ai-step="p"] .cm-ai-results').waitFor();
  assert.ok(
    (await page.locator('[data-ai-step="p"] .cm-ai-results').innerText()).includes('2,000'),
  );
  await page.locator('[data-ai-step="f"] summary').click();
  await page.locator('#ai-f-m').fill('20');
  await page.locator('[data-ai-step="f"] form button[type="submit"]').click();
  await page.waitForFunction(() =>
    globalThis.document
      .querySelector('[data-ai-step="p"] .cm-ai-results')
      ?.textContent.includes('4,000'),
  );
  assert.ok(await page.locator('#ai-p-f').isDisabled());
  assert.equal(
    await page.evaluate(() => globalThis.document.activeElement?.textContent),
    '1. 质量加速度求力',
  );
  await page.locator('[data-ai-step="p"] summary').click();
  await page.locator('#ai-p-a').fill('0.005');
  await page.locator('#ai-f-m').fill('30');
  await page.locator('[data-ai-step="f"] form button[type="submit"]').click();
  await page.waitForFunction(() =>
    globalThis.document
      .querySelector('[data-ai-step="p"] .cm-ai-results')
      ?.textContent.includes('12,000'),
  );
  assert.equal(await page.locator('#ai-p-a').inputValue(), '0.005');
  await page.locator('h1').click();
  await page.screenshot({ path: new URL('chain-desktop.png', out).pathname, fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  assert.ok(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  );
  await page.locator('h1').click();
  await page.screenshot({ path: new URL('chain-phone.png', out).pathname, fullPage: true });
  await page.locator('#cm-ai-clear').click();
  assert.equal(await page.locator('#cm-ai-question').inputValue(), '');
  assert.equal(await page.locator('[data-ai-step]').count(), 0);
  fixture = interpret(
    { steps: [{ id: 's', tool: 'pipe-flow-speed-calculator', inputs: {} }], questions: [] },
    'water flow',
  );
  await page.locator('#cm-ai-question').fill('water flow');
  await page.locator('#cm-ai-send').click();
  await page.locator('#ai-s-q').waitFor();
  assert.equal(await page.locator('.cm-ai-results').count(), 0);
  await page.locator('#ai-s-q').fill('12');
  await page.locator('#ai-s-d').fill('20');
  await page.locator('[data-ai-step="s"] form button[type="submit"]').click();
  await page.locator('.cm-ai-results').waitFor();
  assert.ok((await page.locator('.cm-ai-results').innerText()).includes('0.63662'));
  await page.setViewportSize({ width: 320, height: 740 });
  assert.ok(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载结果', exact: true }).click();
  const content = await fs.readFile(await (await download).path(), 'utf8');
  assert.ok(content.includes('0.636619772'));
  await page.goto(base + '/ar/ai');
  await page.locator('#cm-ai-question').fill('water flow');
  await page.locator('#cm-ai-send').click();
  await page.locator('#ai-s-q').waitFor();
  assert.ok(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  );
  await page.locator('h1').click();
  await page.screenshot({
    path: new URL('missing-arabic-phone.png', out).pathname,
    fullPage: true,
  });
  fixture = shopping;
  await page.goto(base + '/zh-cn/ai');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#cm-ai-question').fill(shoppingText);
  await page.locator('#cm-ai-send').click();
  await page.locator('.cm-ai-results').waitFor();
  assert.ok((await page.locator('.cm-ai-results').innerText()).includes('53.00'));
  await page.locator('.cm-ai-card summary').click();
  await page.locator('#ai-shop-item-0-price').fill('7');
  await page.locator('.cm-ai-card form button[type=submit]').click();
  await page.waitForFunction(() =>
    globalThis.document.querySelector('.cm-ai-results')?.textContent.includes('55.00'),
  );
  assert.ok((await page.locator('.cm-ai-card details').getAttribute('open')) !== null);
  await page.locator('[data-ai-add-item]').click();
  assert.equal(await page.locator('.cm-ai-item').count(), 3);
  assert.equal(await page.locator('.cm-ai-results').count(), 0);
  assert.equal(await page.locator('#ai-shop-item-0-price').inputValue(), '7');
  assert.equal(
    await page.evaluate(() => globalThis.document.activeElement?.id),
    'ai-shop-item-2-name',
  );
  for (const [key, value] of Object.entries({
    name: 'SKU' + 'x'.repeat(90),
    quantity: '1',
    unit: 'kg',
    price: '2',
    perUnit: 'kg',
  }))
    await page.locator('#ai-shop-item-2-' + key).fill(value);
  await page.locator('.cm-ai-card form button[type=submit]').click();
  await page.waitForFunction(() =>
    globalThis.document.querySelector('.cm-ai-results')?.textContent.includes('57.00'),
  );
  await page.locator('[data-ai-remove-item="1"]').click();
  assert.equal(await page.locator('.cm-ai-item').count(), 2);
  assert.equal(await page.locator('.cm-ai-results').count(), 0);
  assert.equal(await page.locator('#ai-shop-item-0-price').inputValue(), '7');
  await page.locator('.cm-ai-card form button[type=submit]').click();
  await page.waitForFunction(() =>
    globalThis.document.querySelector('.cm-ai-results')?.textContent.includes('21.00'),
  );
  await page.locator('#ai-shop-item-0-quantity').fill('3');
  await page.locator('#cm-site-language').selectOption('fr');
  assert.equal(await page.locator('#ai-shop-item-0-quantity').inputValue(), '3');
  assert.ok((await page.locator('.cm-ai-card details').getAttribute('open')) !== null);
  await page.locator('.cm-ai-card form button[type=submit]').click();
  await page.waitForFunction(() =>
    globalThis.document.querySelector('.cm-ai-results')?.textContent.includes('28,00'),
  );
  assert.ok(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  );
  await page.locator('h1').click();
  await page.screenshot({ path: new URL('shopping-phone.png', out).pathname, fullPage: true });
  fixture = {
    questions: [],
    steps: recompute([
      {
        id: 'math',
        index: 1,
        tool: 'arithmetic',
        values: { expression: '2+3', mode: 'deg' },
        sources: {},
      },
      {
        id: 'shop',
        index: 2,
        tool: 'shopping-total',
        values: {
          items: [
            { name: '苹果', quantity: 2, unit: 'kg', price: null, perUnit: 'kg', currency: 'CNY' },
          ],
          shipping: null,
        },
        sources: {},
      },
    ]),
  };
  await page.goto(base + '/zh-cn/ai');
  await page.locator('#cm-ai-question').fill('部分条件未知');
  await page.locator('#cm-ai-send').click();
  await page.locator('#ai-shop-shipping').waitFor();
  await page.locator('[data-ai-step="math"] summary').click();
  await page.locator('#ai-math-expression').fill('3+4');
  await page.locator('[data-ai-step="math"] form button[type="submit"]').click();
  await page.waitForFunction(() =>
    globalThis.document
      .querySelector('[data-ai-step="math"] .cm-ai-results')
      ?.textContent.includes('7'),
  );
  assert.equal(await page.locator('[data-ai-step="shop"] .cm-ai-results').count(), 0);
  assert.equal(await page.locator('#ai-shop-shipping').inputValue(), '');
  await page.locator('#ai-shop-item-0-price').fill('3');
  await page.locator('#ai-shop-shipping').fill('2');
  await page.locator('[data-ai-step="shop"] form button[type="submit"]').click();
  await page.waitForFunction(() =>
    globalThis.document
      .querySelector('[data-ai-step="shop"] .cm-ai-results')
      ?.textContent.includes('8.00'),
  );
  await page.locator('h1').click();
  await page.screenshot({ path: new URL('partial-desktop.png', out).pathname, fullPage: true });
  fixture = {
    title: '住房支出',
    questions: [],
    steps: recompute([
      {
        id: 'home',
        index: 1,
        tool: 'mortgage-calculator',
        currency: 'NGN',
        sources: {},
        values: {
          price: 120000,
          down: 24000,
          rate: 0,
          term: 8,
          tax: 1200,
          ins: 120,
          pmirate: 1,
          hoa: 20,
          extra: 50,
        },
      },
    ]),
  };
  await page.goto(base + '/zh-cn/ai');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('#cm-ai-question').fill('每月住房支出');
  await page.locator('#cm-ai-send').click();
  await page.locator('.cm-ai-results').waitFor();
  assert.ok((await page.locator('.cm-ai-results').innerText()).includes('1,180.00'));
  assert.equal(await page.locator('.cm-ai-card h2').innerText(), '1. 房贷计算器');
  await page.locator('.cm-ai-card summary').click();
  assert.equal(await page.locator('#ai-home-extra').inputValue(), '50');
  await page.locator('h1').click();
  await page.screenshot({ path: new URL('mortgage-desktop.png', out).pathname, fullPage: true });
  fixture = interpret(
    {
      steps: [
        {
          id: 'math',
          tool: 'arithmetic',
          inputs: {
            expression: { value: 'sin(pi/2)', unit: '', source: 'sin(pi/2)' },
            mode: { value: 'rad', unit: '', source: 'rad' },
          },
        },
      ],
    },
    'sin(pi/2) rad',
    'zh-CN',
  );
  await page.goto(base + '/zh-cn/ai');
  await page.locator('#cm-ai-question').fill('sin(pi/2) rad');
  await page.locator('#cm-ai-send').click();
  await page.locator('.cm-ai-results').waitFor();
  await page.locator('.cm-ai-card summary').click();
  assert.equal(await page.locator('label[for=ai-math-mode]').innerText(), '单位');
  await page.locator('#ai-math-mode').selectOption('deg');
  await page.locator('.cm-ai-card form button[type=submit]').click();
  await page.waitForFunction(() =>
    globalThis.document.querySelector('.cm-ai-results')?.textContent.includes('0.027412'),
  );
  serviceFailure = true;
  await page.goto(base + '/zh-cn/ai');
  await page.locator('#cm-ai-question').fill('保留这段输入');
  await page.locator('#cm-ai-send').click();
  await page.waitForFunction(
    () =>
      globalThis.document.querySelector('#cm-ai-status')?.dataset.errorCode === 'ai_unavailable',
  );
  assert.equal(await page.locator('#cm-ai-question').inputValue(), '保留这段输入');
  assert.ok(await page.locator('#cm-ai-send').isEnabled());
  assert.equal(await page.locator('.cm-ai-results').count(), 0);
  await page.locator('#cm-ai-clear').click();
  assert.equal(await page.locator('#cm-ai-status').innerText(), '');
  assert.deepEqual(failures, []);
  await fs.writeFile(
    new URL('report.json', out),
    JSON.stringify(
      {
        engine,
        passed: true,
        locales: checked,
        requests,
        failures,
        scope: 'Provider fixtures for UI and graph recalculation; not live model accuracy.',
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
