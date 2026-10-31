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
    const legacyPositions = [];
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        javaScriptEnabled,
      });
      try {
        const page = await context.newPage();
        await page.goto(base + '/blood-pressure-calculator', { waitUntil: 'load' });
        assert.match(await page.locator('body').getAttribute('class'), /cm-tool/);
        assert.equal(await page.locator('main .cm-workspace-entry').count(), 1);
        assert.equal(
          await page.locator('main .cm-workspace-entry svg[aria-hidden=true]').count(),
          1,
        );
        assert.equal(await page.locator('.cm-guide').count(), 1);
        assert.equal(await page.locator('[data-cm-action=copy]').count(), 1);
        for (const link of await page.locator('.cm-workspace-entry,.cm-guide a').all()) {
          const box = await link.boundingBox();
          assert.ok(box?.height >= 44, 'Usable legacy navigation before and after scripts');
        }
        const entry = await page.locator('.cm-workspace-entry').boundingBox(),
          hero = await page.locator('.hero').boundingBox(),
          form = await page.locator('.hero .card').first().boundingBox();
        legacyPositions.push({ gap: hero.y - entry.y - entry.height, formHeight: form.height });
      } finally {
        await context.close();
      }
    }
    near(legacyPositions[0].gap, legacyPositions[1].gap, 1);
    near(legacyPositions[0].formHeight, legacyPositions[1].formHeight, 1);
    results.push({
      test: 'Legacy layout and workspace entry are ready before scripts',
      engine,
      passed: true,
    });
    const entryContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const entryPage = await entryContext.newPage();
    await entryPage.goto(base + '/fr/gravel-base-calculator', { waitUntil: 'load' });
    await entryPage.locator('.cm-expanded__standalone > a').click();
    await entryPage.waitForLoadState('load');
    await entryPage.waitForFunction(() => {
      const card = document.querySelector('.ws-card');
      const rect = card?.getBoundingClientRect();
      return card && document.activeElement === card && rect.top >= 0 && rect.top < 140;
    });
    assert.equal(await entryPage.locator('.ws-card:not(.empty-slot)').count(), 1);
    assert.equal(
      await entryPage.locator('[data-w="eyebrow"]').innerText(),
      'VOTRE ESPACE DE CALCULATRICES',
    );
    await entryPage.goto(base + '/fr/sales-tax-calculator', { waitUntil: 'load' });
    await entryPage.locator('#subtotal').fill('250');
    await entryPage.locator('#rate').fill('12');
    await entryPage.waitForFunction(() =>
      document.querySelector('#verdictText').textContent.includes('250 $'),
    );
    const taxVerdict = await entryPage.locator('#verdictText').innerText();
    assert.match(taxVerdict, /sous-total de 250 \$/);
    assert.match(taxVerdict, /taux de 12%/);
    assert.match(taxVerdict, /est de 30,00/);
    assert.match(taxVerdict, /total TTC de 280,00/);
    results.push({
      test: 'French calculator entry reveals its new card and tax explanation assigns each amount correctly',
      engine,
      passed: true,
    });
    await entryPage.goto(base + '/fr/workspace', { waitUntil: 'load' });
    await entryPage.locator('.ws-intent summary').click();
    const intentRequest = 'loan principal 100000 rate 5 term 20';
    await entryPage.locator('#ws-intent-input').fill(intentRequest);
    await entryPage.locator('#cm-site-language').selectOption('zh-CN');
    await entryPage.waitForURL(/\/zh-cn\/workspace$/);
    assert.match(await entryPage.locator('#ws-intent-input').getAttribute('placeholder'), /房贷/);
    await entryPage.locator('#cm-site-language').selectOption('fr');
    await entryPage.waitForURL(/\/fr\/workspace$/);
    assert.match(
      await entryPage.locator('#ws-intent-input').getAttribute('placeholder'),
      /^mortgage /,
    );
    assert.equal(await entryPage.locator('#ws-intent-input').inputValue(), intentRequest);
    assert.equal(
      await entryPage.locator('.ws-intent__supported').innerText(),
      'mortgage · loan · compound · rent vs buy · freelance · AI cost',
    );
    await entryPage.getByRole('button', { name: 'Prévisualiser les valeurs', exact: true }).click();
    const intentPreview = await entryPage.locator('dialog[open]').innerText();
    assert.equal(
      await entryPage.getByRole('dialog', { name: 'Calculateur de prêt', exact: true }).count(),
      1,
    );
    assert.match(intentPreview, /Vérifiez ces valeurs/);
    assert.doesNotMatch(intentPreview, /Review these values|请核对/);
    await entryPage.keyboard.press('Escape');
    assert.equal(
      await entryPage.locator('#ws-intent-input').evaluate((e) => e === document.activeElement),
      true,
    );
    await entryPage.locator('#ws-intent-input').fill('loan principal 1e5 rate 5 term 20');
    await entryPage.getByRole('button', { name: 'Prévisualiser les valeurs', exact: true }).click();
    assert.match(
      await entryPage.locator('#ws-intent-preview dl').innerText(),
      /100[\s\u00a0\u202f]?000/,
    );
    await entryPage.keyboard.press('Escape');
    await entryPage.locator('#ws-intent-input').fill('loan principal 1e rate 5 term 20');
    await entryPage.getByRole('button', { name: 'Prévisualiser les valeurs', exact: true }).click();
    assert.equal(await entryPage.locator('dialog[open]').count(), 0);
    assert.match(
      await entryPage.locator('.ws-intent [role=status]').innerText(),
      /nombres complets/,
    );
    results.push({
      test: 'Intent preview keeps inputs and follows the selected language',
      engine,
      passed: true,
    });
    await entryContext.close();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const [slug, id] of [
      ['apr-calculator', 'cm-apr-source'],
      ['debt-to-income-calculator', 'cm-dti-source'],
      ['velocity-calculator', 'cm-speed-source'],
      ['bmi-calculator', 'cm-bmi-source'],
    ]) {
      await page.goto(base + '/' + slug + '?lang=en', { waitUntil: 'load' });
      assert.equal(await page.locator('#' + id).count(), 1);
      assert.equal(
        await page.getByRole('heading', { name: 'Primary references', exact: true }).count(),
        1,
      );
    }
    await page.goto(base + '/weighted-bill-split-calculator?lang=en', { waitUntil: 'load' });
    await page.locator('#a').fill('1.005');
    await page.locator('#w').fill('1');
    await page.waitForFunction(() => document.querySelector('#result').textContent === '1.01');
    await page.locator('#a').fill('100');
    await page.locator('#w').fill('1e308,1e308');
    await page.waitForFunction(() => document.querySelector('#result').textContent === '50.00');
    await page.locator('#a').fill('100000.01');
    await page.locator('#w').fill('1');
    await page.waitForFunction(
      () => document.querySelector('#result').textContent === '100,000.01',
    );
    await page.locator('#cm-site-language').selectOption('fr');
    await page.waitForFunction(() =>
      /100[\s\u00a0\u202f]000,01/.test(document.querySelector('#result').textContent),
    );
    assert.equal(await page.locator('#a').inputValue(), '100000.01');
    assert.ok((await page.locator('.cm-expanded__example dd').allTextContents()).includes('25,00'));
    await page.locator('#cm-site-language').selectOption('en');
    assert.match(await page.locator('#cm-model-note').innerText(), /halfway amounts rounded up/);
    results.push({
      test: 'Bill splitting rounds decimal halves and preserves large-weight ratios',
      engine,
      passed: true,
    });
    for (const [slug, inputs, expected] of [
      ['sagitta', { r: '100000000', c: '1' }, 1.25e-9],
      ['law-of-cosines', { b: '1', c: '1', A: '0.000001' }, 1.7453292519943295e-8],
      ['herons-formula', { a: '1e-12', b: '1e15', c: '1e15' }, 500],
      ['triangle-angles', { a: '1e-8', b: '1', c: '1' }, 5.729577951308232e-7],
      ['matrix-eigenvalues', { a: '1e8', b: '0', c: '0', d: '1e-8' }, 1e8],
    ]) {
      await page.goto(base + '/' + slug + '-calculator?lang=en', { waitUntil: 'load' });
      for (const [id, value] of Object.entries(inputs)) await page.locator('#' + id).fill(value);
      await page.waitForFunction(() => !document.body.classList.contains('cm-invalid'));
      const displayed = (await page.locator('#result').innerText()).replaceAll(',', '');
      const first = slug === 'matrix-eigenvalues' ? displayed.match(/λ₁ = ([^;]+)/)[1] : displayed;
      assert.ok(
        Math.abs(Number.parseFloat(first) / expected - 1) < 1e-7,
        slug + ': displayed precision',
      );
      if (slug === 'matrix-eigenvalues') {
        const second = Number.parseFloat(displayed.match(/λ₂ = (.+)/)[1]);
        assert.ok(Math.abs(second / 1e-8 - 1) < 1e-7, 'Small eigenvalue remains nonzero');
      }
    }
    results.push({
      test: 'Stable small geometry results and separated eigenvalues',
      engine,
      passed: true,
    });
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
    await page.goto(base + '/quadratic-equation-calculator?lang=en', { waitUntil: 'load' });
    await page.locator('#b').fill('0');
    await page.locator('#c').fill('-2');
    assert.match(await page.locator('.big').innerText(), /1\.41421356237/);
    await page.locator('#cm-site-language').selectOption('de');
    assert.equal(await page.locator('#c').inputValue(), '-2');
    assert.match(await page.locator('.big').innerText(), /1,41421356237/);
    const germanGuide = await page.locator('.cm-guide').getAttribute('aria-label');
    await page.locator('#cm-site-language').selectOption('en');
    assert.match(await page.locator('.big').innerText(), /1\.41421356237/);
    assert.notEqual(await page.locator('.cm-guide').getAttribute('aria-label'), germanGuide);
    await page.locator('#b').fill('');
    await page.locator('#cm-site-language').selectOption('de');
    assert.equal(await page.locator('#b').inputValue(), '');
    assert.equal(await page.locator('#c').inputValue(), '-2');
    assert.equal(await page.locator('.big').isVisible(), false);
    assert.equal(await page.locator('body.cm-invalid').count(), 1);
    await page.locator('#b').fill('0');
    assert.match(await page.locator('.big').innerText(), /1,41421356237/);
    await page.goto(base + '/ipv6-subnet-count-calculator?lang=en', { waitUntil: 'load' });
    const integerBoxes = await page.locator('.cm-expanded__exact-integer').evaluateAll((elements) =>
      elements.map((element) => ({
        text: element.textContent,
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(globalThis.getComputedStyle(element).lineHeight),
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })),
    );
    assert.equal(integerBoxes.length, 2);
    for (const box of integerBoxes) {
      assert.equal(box.text, '18446744073709551616');
      assert.ok(box.height <= box.lineHeight + 1, 'Exact IPv6 count must fit on one line');
      assert.ok(box.scrollWidth <= box.width + 1, 'Exact IPv6 count must remain fully visible');
    }
    await page.goto(base + '/hash-collision-probability-calculator?lang=en', { waitUntil: 'load' });
    assert.match(await page.locator('#result').innerText(), /2\.7105027E-6/);
    const compactProbability = await page.locator('#result').evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      availableWidth: element.parentElement.clientWidth,
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(globalThis.getComputedStyle(element).lineHeight),
    }));
    assert.ok(compactProbability.width <= compactProbability.availableWidth + 1);
    assert.ok(compactProbability.height <= compactProbability.lineHeight + 1);
    await page.locator('#n').fill('2');
    await page.locator('#b').fill('1');
    await page.waitForFunction(
      () => document.querySelector('#result').textContent.replace(/\s/g, '') === '50%',
    );
    assert.equal((await page.locator('#result').innerText()).replace(/\s/g, ''), '50%');
    await page.locator('#n').fill('3');
    await page.waitForFunction(
      () => document.querySelector('#result').textContent.replace(/\s/g, '') === '100%',
    );
    assert.equal((await page.locator('#result').innerText()).replace(/\s/g, ''), '100%');
    await page.locator('#n').fill('1.5');
    await page.waitForFunction(() => document.querySelector('#cm-copy').disabled);
    assert.equal(await page.locator('#cm-copy').isEnabled(), false);
    assert.doesNotMatch(await page.locator('#result').innerText(), /100%/);
    await page.locator('#n').fill('2');
    await page.locator('#b').fill('1024');
    await page.waitForFunction(() =>
      document.querySelector('#result').textContent.includes('5.5626846E-307'),
    );
    assert.match(await page.locator('#result').innerText(), /5\.5626846E-307/);
    await page.locator('#cm-site-language').selectOption('de');
    await page.waitForFunction(() =>
      document.querySelector('#result').textContent.includes('5,5626846E-307'),
    );
    assert.match(await page.locator('#result').innerText(), /5,5626846E-307/);
    assert.equal(await page.locator('#n').inputValue(), '2');
    assert.equal(await page.locator('#b').inputValue(), '1024');
    await page.goto(base + '/scientific-notation-calculator?lang=en', { waitUntil: 'load' });
    for (const [raw, coefficient, exponent] of [
      ['5e-324', '5', '-324'],
      ['-5e-324', '-5', '-324'],
      ['0', '0', '0'],
    ]) {
      await page.locator('#a').fill(raw);
      await page.waitForFunction(
        ([c, e]) =>
          document.querySelector('#result').firstChild.textContent === c + ' × 10' &&
          document.querySelector('#result sup')?.textContent === e,
        [coefficient, exponent],
      );
      assert.equal(await page.locator('#a').inputValue(), raw);
      assert.equal(await page.locator('#cm-copy').isEnabled(), true);
    }
    await page.goto(base + '/carpet-roll-length-calculator?lang=en', { waitUntil: 'load' });
    await page.locator('#a').fill('1');
    await page.waitForFunction(
      () => document.querySelector('#result').textContent.replace(/\s/g, '') === '6m',
    );
    assert.match(await page.locator('#cm-model-guide').innerText(), /L₁ = ceil\(W\/R\)\(L\+t\)/);
    assert.match(await page.locator('#cm-model-guide').innerText(), /L₂ = ceil\(L\/R\)\(W\+t\)/);
    const workspaceEntry = page.getByRole('link', { name: 'Add to workspace', exact: true });
    const entrySize = await workspaceEntry.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }));
    assert.ok(entrySize.width >= 44 && entrySize.height >= 44, 'Usable workspace entry target');
    assert.equal(await workspaceEntry.locator('svg[aria-hidden="true"]').count(), 1);
    for (const slug of [
      'internal-rate-of-return-calculator',
      'modified-internal-rate-calculator',
      'bond-yield-calculator',
    ]) {
      await page.goto(base + '/' + slug + '?lang=en', { waitUntil: 'load' });
      assert.match(await page.locator('#result').innerText(), /%/);
      assert.match(await page.locator('.cm-expanded__example').innerText(), /%/);
      if (slug !== 'bond-yield-calculator') {
        const cashFlowExample = page.locator('.cm-expanded__example-list dd');
        assert.equal(await cashFlowExample.innerText(), '-1000, 400, 400, 400');
        const tokens = await cashFlowExample.evaluate((element) =>
          [...element.firstChild.textContent.matchAll(/-?\d+/g)].map((match) => {
            const range = document.createRange();
            range.setStart(element.firstChild, match.index);
            range.setEnd(element.firstChild, match.index + match[0].length);
            return {
              height: range.getBoundingClientRect().height,
              lineHeight: Number.parseFloat(globalThis.getComputedStyle(element).lineHeight),
            };
          }),
        );
        for (const token of tokens) assert.ok(token.height <= token.lineHeight + 1);
      }
    }
    await page.goto(base + '/random-search-time-calculator?lang=en', { waitUntil: 'load' });
    assert.equal(await page.locator('.cm-expanded__unit').count(), 1);
    for (const whitespace of await page
      .locator('.cm-expanded__unit')
      .evaluateAll((elements) =>
        elements.map((element) => globalThis.getComputedStyle(element).whiteSpace),
      ))
      assert.equal(whitespace, 'nowrap');
    await page.goto(base + '/fluid-typography-calculator?lang=en', { waitUntil: 'load' });
    const fluidLocales = await page
      .locator('#cm-site-language option')
      .evaluateAll((options) => options.map((option) => option.value));
    assert.equal(fluidLocales.length, 20);
    for (const locale of fluidLocales) {
      await page.locator('#cm-site-language').selectOption(locale);
      await page.waitForFunction((lang) => document.documentElement.lang === lang, locale);
      const cssValue = await page.locator('#result').innerText();
      assert.equal(cssValue, 'clamp(16px, calc(12px + 1vw), 24px)', locale);
      assert.equal(
        await page.locator('.cm-expanded__example dd[data-cm-no-translate]').innerText(),
        cssValue,
        'Literal worked example in ' + locale,
      );
      assert.ok(await page.evaluate((css) => globalThis.CSS.supports('font-size', css), cssValue));
    }
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(base + '/continuous-compounding-calculator?lang=en', { waitUntil: 'load' });
    await page.locator('#a').fill('1000000000000000');
    await page.locator('#r').fill('0');
    await page.waitForFunction(() => document.querySelector('#result').textContent === '1E15');
    assert.equal(await page.locator('#a').inputValue(), '1000000000000000');
    await page.locator('#a').fill('123456789012');
    await page.waitForFunction(
      () => document.querySelector('#result').textContent === '123,456,789,012',
    );
    const largeNumberBox = await page.locator('#result').evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(globalThis.getComputedStyle(element).lineHeight),
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    assert.ok(largeNumberBox.height <= largeNumberBox.lineHeight + 1);
    assert.ok(largeNumberBox.pageWidth <= largeNumberBox.viewportWidth + 1);
    for (const slug of ['loan-term-calculator', 'flat-versus-reducing-loan-calculator']) {
      await page.goto(base + '/' + slug + '?lang=en', { waitUntil: 'load' });
      await page.locator('#cm-result-rows dd').first().waitFor({ state: 'visible' });
      const values = await page
        .locator('#cm-result-rows dd,.cm-expanded__example dd')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            text: element.textContent,
            height: element.getBoundingClientRect().height,
            lineHeight: Number.parseFloat(globalThis.getComputedStyle(element).lineHeight),
          })),
        );
      assert.ok(values.length > 0);
      for (const value of values)
        assert.ok(value.height <= value.lineHeight + 1, slug + ': split value ' + value.text);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
      );
    }
    await page.goto(base + '/directory?lang=en', { waitUntil: 'load' });
    await page.locator('#category-mobile').selectOption('Digital and Technology');
    for (const locale of ['en', 'zh-CN', 'fr', 'ar']) {
      await page.locator('#cm-site-language').selectOption(locale);
      await page.waitForFunction((lang) => document.documentElement.lang === lang, locale);
      assert.equal(await page.locator('#category-mobile').inputValue(), 'Digital and Technology');
      assert.equal(await page.locator('#tool-grid .tool').count(), 6);
      assert.match(
        await page.locator('#tool-grid .tool').first().getAttribute('href'),
        /download-time/,
      );
      const count = await page.locator('#result-count').innerText();
      const expectedCount = await page.evaluate(
        (lang) => new Intl.NumberFormat(lang).format(25),
        locale,
      );
      assert.ok(count.includes(expectedCount), count);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/workspace?lang=en', { waitUntil: 'load' });
    await page.locator('#ws-direct-search').fill('download');
    await page.locator('#ws-direct-results button').first().click();
    await page.frameLocator('#desk-1 iframe').locator('#result').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const card = document.querySelector('#desk-1');
      const top = card.getBoundingClientRect().top;
      return document.activeElement === card && top >= 0 && top < 150;
    });
    assert.equal(await page.locator('#ws-direct-status').isVisible(), false);
    assert.equal(await page.locator('#ws-direct-results').isVisible(), false);
    await page.frameLocator('#desk-1 iframe').locator('#s').fill('001.5000');
    for (let index = 0; index < 3; index++) {
      await page.locator('#ws-direct-search').fill('download');
      await page.locator('#ws-direct-results button').first().click();
    }
    assert.equal(await page.locator('#ws-direct-results button').count(), 8);
    assert.ok(await page.locator('#ws-direct-status').isVisible());
    await page.locator('#ws-direct-search').fill('fluid');
    await page.locator('#ws-direct-results button').first().click();
    await page.locator('#ws-replace-target').selectOption('4');
    await page.getByRole('button', { name: 'Replace selected card', exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('#desk-5 iframe')?.contentDocument?.readyState === 'complete',
    );
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() =>
            globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
          ),
        ),
    );
    const replacedPosition = await page.locator('#desk-5').boundingBox();
    assert.ok(replacedPosition.y >= 0 && replacedPosition.y < 150);
    assert.equal(
      await page.locator('#desk-5').evaluate((card) => document.activeElement === card),
      true,
    );
    assert.equal(await page.frameLocator('#desk-1 iframe').locator('#s').inputValue(), '001.5000');
    assert.equal(
      await page.frameLocator('#desk-5 iframe').locator('#result').innerText(),
      'clamp(16px, calc(12px + 1vw), 24px)',
    );
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
    const helpLayout = encodeURIComponent(
      JSON.stringify({ v: 1, tools: ['loan-calculator', 'percentage-calculator'] }),
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(base + '/workspace?lang=en#desk=' + helpLayout, { waitUntil: 'load' });
    await page.locator('#help-toggle').click();
    assert.match(await page.locator('[data-w="step3"]').innerText(), /Send result/);
    await page.waitForFunction(() => {
      const buttons = [...document.querySelectorAll('.ws-card-footer button')];
      return buttons.length === 2 && buttons.every((button) => !button.disabled);
    });
    await page.locator('.ws-card-footer button').first().click();
    assert.match(await page.locator('[data-w="transferHelp"]').innerText(), /copies a number once/);
    const transferControls = await page.locator('#transfer select').evaluateAll((elements) => {
      const luminance = (color) =>
        color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
      return elements.map((element) => {
        const style = globalThis.getComputedStyle(element),
          foreground = luminance(style.color),
          background = luminance(style.backgroundColor);
        return {
          contrast:
            (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
          fontSize: Number.parseFloat(style.fontSize),
          height: element.getBoundingClientRect().height,
        };
      });
    });
    assert.equal(transferControls.length, 3);
    for (const control of transferControls) {
      assert.ok(control.contrast >= 4.5, 'Dark transfer select text contrast');
      assert.ok(control.fontSize >= 16, 'Phone transfer fields must not trigger iOS text zoom');
      assert.ok(control.height >= 44, 'Phone transfer field target size');
    }
    assert.doesNotMatch(await page.locator('#transfer-preview').innerText(), /1896\.204070478/);
    assert.match(await page.locator('#transfer-preview').innerText(), /Scheduled monthly payment/);
    await page.locator('#transfer [data-close]').click();
    await page.locator('#cm-site-language').selectOption('zh-CN');
    assert.match(await page.locator('[data-w="step3"]').innerText(), /传递结果/);
    await page.locator('.ws-card-footer button').first().click();
    assert.match(await page.locator('[data-w="transferHelp"]').innerText(), /一次性/);
    await page.locator('#transfer [data-close]').click();
    const nativeNames = JSON.parse(
      await fs.readFile(new URL('../src/translations/fr.json', import.meta.url), 'utf8'),
    );
    const annulusTool = catalog.find((tool) => tool.slug === 'annulus-calculator');
    const annulus = nativeNames[annulusTool.name];
    assert.ok(annulus && annulus !== annulusTool.name);
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
