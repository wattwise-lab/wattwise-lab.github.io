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
  await page.screenshot({ path: new URL('chain-desktop.png', out).pathname, fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  assert.ok(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  );
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
  await page.screenshot({
    path: new URL('missing-arabic-phone.png', out).pathname,
    fullPage: true,
  });
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
