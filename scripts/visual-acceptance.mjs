/* CI-only actual viewport evidence. No local browser launch; images require personal review. */
/* global document, location, innerWidth, innerHeight, scrollY, requestAnimationFrame */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const production = 'https://calcmintly.com';
const local = 'http://127.0.0.1:4173';
const locales = [
  'en',
  'zh-CN',
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
const layout =
  '#desk=' +
  encodeURIComponent(
    JSON.stringify({
      v: 1,
      tools: [
        'pressure-converter',
        'pressure-converter',
        'mechanical-power-calculator',
        'solar-energy-production-calculator',
      ],
    }),
  );
const sharedChoices = (tools) => '#desk=' + encodeURIComponent(JSON.stringify({ v: 1, tools }));
function actualNumber(source, locale) {
  const parts = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).formatToParts(
    1234567.89,
  );
  let text = source.replace(/[\u061c\u200e\u200f]/g, '');
  const group = parts.find((part) => part.type === 'group')?.value;
  const decimal = parts.find((part) => part.type === 'decimal')?.value;
  if (group) text = text.replaceAll(group, '');
  if (decimal) text = text.replaceAll(decimal, '.');
  text = text.replace(/[٠-٩۰-۹०-९০-৯౦-౯]/g, (char) => {
    for (const zero of [0x660, 0x6f0, 0x966, 0x9e6, 0xc66]) {
      const value = char.codePointAt(0) - zero;
      if (value >= 0 && value <= 9) return String(value);
    }
    return char;
  });
  const matches = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
  assert.equal(matches.length, 1, 'One actual result number required: ' + source);
  return Number(matches[0]);
}
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, actual + ' != ' + expected);

export function parseOptions(args) {
  const options = { origin: local, out: null, waitMs: 0, selfTest: false };
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === '--self-test') options.selfTest = true;
    else if (key === '--origin') options.origin = args[++index];
    else if (key === '--out') options.out = args[++index];
    else if (key === '--wait-ms') options.waitMs = Number(args[++index]);
    else throw Error('Unknown argument: ' + key);
  }
  assert.ok(
    [local, production].includes(options.origin),
    'Only the CI preview and formal domain are allowed.',
  );
  assert.ok(Number.isInteger(options.waitMs) && options.waitMs >= 0 && options.waitMs <= 300000);
  options.out ||= path.join(
    root,
    'visual-evidence',
    options.origin === production ? 'production' : 'local',
  );
  return options;
}

export function fileForPath(pathname, routes) {
  const known = routes.find((record) => record.path === pathname);
  if (known) return known.file;
  const decoded = decodeURIComponent(pathname);
  assert.ok(decoded.startsWith('/') && !decoded.split('/').some((part) => part === '..'));
  if (decoded.startsWith('/assets/')) return decoded.slice(1);
  if (decoded === '/favicon.ico') return null;
  throw Error('Unexpected same-origin response path: ' + pathname);
}

async function settled(page) {
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        let lastY = scrollY,
          lastHeight = document.documentElement.scrollHeight,
          stable = 0,
          ticks = 0;
        function check() {
          const height = document.documentElement.scrollHeight;
          stable = scrollY === lastY && height === lastHeight ? stable + 1 : 0;
          lastY = scrollY;
          lastHeight = height;
          ticks++;
          if (stable >= 4) resolve();
          else if (ticks >= 90)
            reject(Error('Scroll/layout did not settle for an actual viewport capture.'));
          else requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
      }),
  );
}

async function geometry(page) {
  return page.evaluate(() => ({
    url: location.href,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    width: innerWidth,
    height: innerHeight,
    y: scrollY,
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    fullHeight: document.documentElement.scrollHeight,
  }));
}

async function mainState(page) {
  return page.evaluate(() => {
    const visible = (element) =>
      element.getClientRects().length &&
      globalThis.getComputedStyle(element).visibility === 'visible';
    const targets = [
      ...document.querySelectorAll(
        'main button,main summary,main input,main select,main textarea,main a',
      ),
    ]
      .filter(
        (element) => visible(element) && !['hidden', 'radio', 'checkbox'].includes(element.type),
      )
      .map((element) => ({
        name: element.getAttribute('aria-label') || element.innerText || element.id,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      }));
    return {
      heading: document.querySelector('h1')?.innerText,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      selected: document.querySelector('#cm-site-language')?.value,
      options: document.querySelector('#cm-site-language')?.options.length,
      booting: document.documentElement.hasAttribute('data-cm-workspace-booting'),
      busy: document.body.getAttribute('aria-busy'),
      scripts: [...document.querySelectorAll('script[src]')].map((element) =>
        element.getAttribute('src'),
      ),
      styles: [...document.querySelectorAll('link[rel=stylesheet]')].map((element) =>
        element.getAttribute('href'),
      ),
      targets,
      inputs: [...document.querySelectorAll('main input,main select')].map((input) => ({
        id: input.id,
        value: input.value,
        labels: [...(input.labels || [])].map((label) => label.innerText),
        options:
          input.tagName === 'SELECT'
            ? [...input.options].map((option) => ({
                value: option.value,
                text: option.textContent,
              }))
            : [],
      })),
      text: document.querySelector('main')?.innerText,
    };
  });
}

async function screenshot(page, directory, name) {
  const position = await geometry(page);
  const file = name + '.png';
  const bytes = await page.screenshot({ path: path.join(directory, file), fullPage: false });
  assert.equal(bytes.readUInt32BE(16), position.width);
  assert.equal(bytes.readUInt32BE(20), position.height);
  assert.equal(
    (await geometry(page)).y,
    position.y,
    'Viewport moved while the screenshot was taken.',
  );
  return { ...position, file, sha256: digest(bytes), personallyViewed: false };
}

async function entirePage(page, directory, name) {
  await page.locator('.cm-site-header__brand').press('Home');
  await settled(page);
  assert.equal((await geometry(page)).y, 0, 'Capture must begin at the top.');
  const segments = [];
  for (let index = 0; index < 22; index++) {
    const position = await geometry(page);
    assert.ok(
      position.scroll <= position.client + 1,
      'Horizontal document overflow: ' + JSON.stringify(position),
    );
    segments.push(await screenshot(page, directory, name + '-' + String(index).padStart(2, '0')));
    if (position.y + position.height >= position.fullHeight - 1) return segments;
    await page.keyboard.press('PageDown');
    await settled(page);
    let next = (await geometry(page)).y;
    for (
      let correction = 0;
      next > position.y + position.height - 160 && correction < 8;
      correction++
    ) {
      await page.keyboard.press('ArrowUp');
      await settled(page);
      next = (await geometry(page)).y;
    }
    assert.ok(
      next > position.y && next <= position.y + position.height - 160,
      'No gaps under the sticky navigator.',
    );
  }
  throw Error('Page was not completely captured: ' + name);
}

async function run(config) {
  assert.equal(process.env.CI, 'true', 'Real browser execution is CI-only.');
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use the repository Actions runner.');
  const gitSHA = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(
    gitSHA,
    process.env.GITHUB_SHA,
    'Checkout must match the reported workflow artifact.',
  );
  const routes = JSON.parse(await fs.readFile(path.join(root, 'src/locale-routes.json'), 'utf8'));
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, 'src/asset-manifest.json'), 'utf8'),
  );
  const common = manifest['assets/cm-common.js'];
  assert.ok(common);
  const formal = config.origin === production;
  const sourceBytes = new Map();
  async function expectedBytes(file) {
    if (!sourceBytes.has(file))
      sourceBytes.set(
        file,
        formal
          ? execFileSync('git', ['show', gitSHA + ':' + file], {
              cwd: root,
              maxBuffer: 12 * 1024 * 1024,
            })
          : await fs.readFile(path.join(root, file)),
      );
    return sourceBytes.get(file);
  }
  await fs.mkdir(config.out, { recursive: true });
  const expectedHome = await expectedBytes('index.html');
  const readiness = [];
  const end = Date.now() + config.waitMs;
  let originReady = false;
  do {
    try {
      const response = await fetch(config.origin + '/', {
        headers: {
          'User-Agent': 'CalcMintly-Public-Release-QA/20261101',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(20000),
      });
      const body = Buffer.from(await response.arrayBuffer());
      readiness.push({
        at: new Date().toISOString(),
        status: response.status,
        sha256: digest(body),
        expected: digest(expectedHome),
      });
      if (response.status === 200 && body.equals(expectedHome)) {
        originReady = true;
        break;
      }
    } catch (error) {
      readiness.push({ at: new Date().toISOString(), error: String(error) });
    }
    await fs.writeFile(
      path.join(config.out, 'readiness.json'),
      JSON.stringify({ gitSHA, origin: config.origin, readiness }, null, 2) + '\n',
    );
    if (Date.now() >= end)
      throw Error(
        'The origin did not serve the checked-out artifact before the deadline: ' +
          JSON.stringify(readiness),
      );
    await new Promise((resolve) => setTimeout(resolve, Math.min(15000, end - Date.now())));
  } while (!originReady);
  const { chromium } = await import('playwright');
  const report = {
    source: {
      gitSHA,
      githubSHA: process.env.GITHUB_SHA,
      runID: process.env.GITHUB_RUN_ID,
      manifestSHA256: digest(await fs.readFile(path.join(root, 'src/asset-manifest.json'))),
      expectedCommon: common,
      artifactComparison: formal
        ? 'Every observed HTML/asset response against git HEAD blobs, not mutable worktree.'
        : 'Every observed HTML/asset response against generated CI files.',
    },
    conditions: {
      origin: config.origin,
      browser: 'Chromium',
      userAgent: 'CalcMintly-Public-Release-QA/20261101',
      colorScheme: 'light',
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
      systemFonts: true,
      performanceMeasurement: false,
      actualViewportScreenshots: true,
    },
    readiness,
    pages: [],
    responses: [],
    externalRequests: [],
    failures: [],
    personallyViewed: false,
  };
  report.conditions.fontMatches = Object.fromEntries(
    [
      'sans-serif',
      'Noto Sans CJK SC',
      'Noto Sans Arabic',
      'Noto Sans Bengali',
      'Noto Sans Devanagari',
      'Noto Sans Telugu',
    ].map((family) => [
      family,
      execFileSync('fc-match', ['--format', '%{family}|%{file}\n', family], {
        encoding: 'utf8',
      }).trim(),
    ]),
  );
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    userAgent: report.conditions.userAgent,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const pending = new Set();
  const responseFailures = [];
  page.on('response', (response) => {
    const work = (async () => {
      const url = new URL(response.url());
      if (url.origin !== config.origin) {
        report.externalRequests.push({ url: response.url(), status: response.status() });
        return;
      }
      if (response.status() >= 300 && response.status() < 400) return;
      const file = fileForPath(url.pathname, routes);
      if (!file) return;
      const bytes = await response.body(),
        expected = await expectedBytes(file);
      const record = {
        url: response.url(),
        file,
        status: response.status(),
        contentType: response.headers()['content-type'],
        sha256: digest(bytes),
        expectedSHA256: digest(expected),
        exact: bytes.equals(expected),
      };
      report.responses.push(record);
      assert.equal(record.status, 200, 'Failed response ' + response.url());
      assert.ok(record.exact, 'Response bytes differ from the artifact: ' + response.url());
    })()
      .catch((error) => responseFailures.push(String(error)))
      .finally(() => pending.delete(work));
    pending.add(work);
  });
  page.on('pageerror', (error) => responseFailures.push('Uncaught page error: ' + error));
  async function drain() {
    while (pending.size) await Promise.all([...pending]);
    const errors = responseFailures.splice(0);
    assert.equal(errors.length, 0, errors.join('\n'));
  }
  async function navigate(url, locale) {
    const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    assert.equal(response.status(), 200);
    await page.waitForFunction(
      (language) =>
        document.documentElement.lang === language &&
        document.querySelector('#cm-site-language')?.value === language,
      locale,
    );
    await page.waitForFunction(
      (language) => language === 'en' || Boolean(globalThis.CMTranslations?.[language]),
      locale,
      { timeout: 20000 },
    );
    await settled(page);
    const state = await mainState(page);
    assert.equal(state.lang, locale);
    assert.equal(state.selected, locale);
    assert.equal(state.options, 20);
    assert.equal(
      state.scripts.filter((src) => src === common).length,
      1,
      'Current common bundle must occur once.',
    );
    await drain();
    return state;
  }
  const routeFor = (locale, slug) => {
    const record = routes.find(
      (r) =>
        r.locale === locale &&
        r.file === (locale === 'en' ? '' : locale.toLowerCase() + '/') + slug + '.html',
    );
    assert.ok(record, 'Missing actual native route: ' + locale + '/' + slug);
    return new URL(record.path, config.origin).href;
  };
  async function recordCase(name, action) {
    const record = { name, personallyViewed: false };
    report.pages.push(record);
    try {
      Object.assign(record, await action());
      await drain();
      record.passed = true;
    } catch (error) {
      record.passed = false;
      record.error = String(error);
      report.failures.push({ name, error: String(error) });
      try {
        record.failureScreenshot = await screenshot(page, config.out, name + '-FAILED');
      } catch (screenshotError) {
        record.screenshotError = String(screenshotError);
      }
    }
    await fs.writeFile(
      path.join(config.out, 'summary.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  async function workspace(
    locale,
    name = 'workspace-' + locale,
    viewport = { width: 375, height: 1000 },
    dark = false,
  ) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' });
    await navigate(routeFor(locale, 'workspace') + layout, locale);
    await page.waitForFunction(
      () =>
        !document.documentElement.hasAttribute('data-cm-workspace-booting') &&
        document.querySelectorAll('#desk .ws-card iframe:not([data-ws-loading])').length === 4,
    );
    await settled(page);
    const state = await mainState(page);
    assert.equal(state.booting, false);
    assert.equal(state.busy, null);
    for (const source of ['assets/cm-initial-layout.js', 'assets/cm-workspace.js'])
      assert.equal(state.scripts.filter((src) => src === manifest[source]).length, 1);
    for (const source of ['assets/cm-workspace.css', 'assets/cm-workspace-tools.css'])
      assert.ok(state.styles.includes(manifest[source]));
    for (const target of state.targets)
      assert.ok(
        target.width >= 43.8 && target.height >= 43.8,
        'Parent target below44: ' + JSON.stringify(target),
      );
    const frames = [];
    for (const handle of await page.locator('#desk iframe').elementHandles()) {
      const frame = await handle.contentFrame();
      assert.ok(frame);
      const child = await frame.evaluate(() => ({
        lang: document.documentElement.lang,
        classes: document.body.className,
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        text: document.querySelector('main')?.innerText,
        inputs: [...document.querySelectorAll('main input,main select')].map((input) => ({
          id: input.id,
          value: input.value,
          labels: [...(input.labels || [])].map((label) => label.innerText),
          options:
            input.tagName === 'SELECT'
              ? [...input.options].map((option) => ({
                  value: option.value,
                  text: option.textContent,
                }))
              : [],
        })),
      }));
      child.url = frame.url();
      assert.equal(child.lang, locale);
      assert.ok(
        child.classes.includes('cm-unified--embedded') && child.classes.includes('cm-embedded'),
      );
      assert.ok(child.scroll <= child.client + 1);
      child.result = await frame.locator('#result').innerText();
      child.numericResult = actualNumber(child.result, locale);
      near(child.numericResult, [101.325, 101.325, 200, 480][frames.length]);
      if (child.url.includes('/pressure-converter'))
        for (const input of child.inputs.filter((input) => input.options.length))
          for (const option of input.options)
            assert.equal(
              option.text,
              option.value,
              'Literal pressure symbol must remain notation.',
            );
      if (locale === 'ur' && child.url.includes('/mechanical-power-calculator'))
        assert.ok(
          child.inputs
            .find((input) => input.id === 't')
            .labels.join(' ')
            .includes('(s)'),
        );
      frames.push(child);
    }
    assert.equal(frames.length, 4);
    if (locale === 'ar')
      assert.equal(await page.locator('#desk .ws-card h2').first().innerText(), 'محول الضغط');
    const segments = await entirePage(page, config.out, name);
    return {
      locale,
      viewport,
      colorScheme: dark ? 'dark' : 'light',
      state,
      frames,
      segments,
      scope:
        'All real vertical viewports: launcher, four native cards, current results, closed goal/link/intent summaries and footer. Sticky navigator retained in every actual view.',
    };
  }
  try {
    for (const locale of locales) {
      await recordCase('workspace-' + locale, () => workspace(locale));
      await recordCase('home-' + locale, async () => {
        await page.setViewportSize({ width: 320, height: 1000 });
        const home = routes.find(
          (r) =>
            r.locale === locale &&
            r.file === (locale === 'en' ? '' : locale.toLowerCase() + '/') + 'index.html',
        );
        assert.ok(home);
        const state = await navigate(new URL(home.path, config.origin).href, locale);
        const top = await screenshot(page, config.out, 'home-' + locale + '-top');
        assert.ok(top.scroll <= top.client + 1);
        const promo = page.locator('.cm-home__promo');
        await promo.scrollIntoViewIfNeeded();
        await settled(page);
        const bounds = await promo.boundingBox();
        const view = await geometry(page);
        assert.ok(
          bounds.y >= -1 && bounds.y + bounds.height <= view.height + 1,
          'Full promo must be visible.',
        );
        return {
          locale,
          state,
          segments: [top, await screenshot(page, config.out, 'home-' + locale + '-promo')],
          promoBounds: bounds,
          scope:
            'Actual320 top/header/hero/pinned region and complete workspace promo; not the full directory body.',
        };
      });
    }
    const followups = [
      ['de', 'area-converter'],
      ['id', 'area-converter'],
      ['tr', 'area-converter'],
      ['es', 'area-converter'],
      ['zh-CN', 'area-converter'],
      ['ar', 'area-converter'],
      ['sw', 'unit-converter'],
      ['ur', 'ramp-gradient-calculator'],
      ['ur', 'law-of-cosines-calculator'],
      ['ur', 'angular-acceleration-calculator'],
      ['ur', 'battery-runtime-calculator'],
      ['ar', 'battery-runtime-calculator'],
    ];
    for (const [locale, slug] of followups)
      await recordCase(locale + '-' + slug, async () => {
        await page.setViewportSize({ width: 375, height: 1000 });
        const state = await navigate(routeFor(locale, slug), locale);
        await page.locator('#result').waitFor({ state: 'visible' });
        await settled(page);
        const finalState = await mainState(page);
        if (slug === 'battery-runtime-calculator')
          assert.ok(
            finalState.inputs
              .find((input) => input.id === 'a')
              .labels.join(' ')
              .includes('(Ah)'),
          );
        return {
          locale,
          slug,
          state,
          finalState,
          segments: await entirePage(page, config.out, locale + '-' + slug),
          scope: 'Complete final375 native page for the recorded unit-language corrections.',
        };
      });
    for (const [locale, name, viewport, dark] of [
      ['zh-CN', 'workspace-zh-desktop', { width: 1365, height: 1000 }, false],
      ['ar', 'workspace-ar-tablet', { width: 768, height: 1000 }, false],
      ['en', 'workspace-en-4k', { width: 3840, height: 1200 }, false],
      ['zh-CN', 'workspace-zh-dark', { width: 375, height: 1000 }, true],
    ])
      await recordCase(name, () => workspace(locale, name, viewport, dark));
    await recordCase('zh-CN-pocket-memory-history', async () => {
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 375, height: 1000 });
      const state = await navigate(routeFor('zh-CN', 'basic-calculator'), 'zh-CN');
      for (const key of ['2', '0', '0', '+', '1', '0', '%', '=', 'M+', 'AC', 'MR'])
        await page.locator('[data-key="' + key + '"]').click();
      const result = await page.locator('#kp-result').innerText();
      near(actualNumber(result, 'zh-CN'), 220);
      const history = await page.locator('#kp-history-list').innerText();
      assert.ok(history.includes('220'));
      return {
        locale: 'zh-CN',
        state,
        result,
        history,
        segments: await entirePage(page, config.out, 'zh-CN-pocket-memory-history'),
        scope:
          'Actual physical buttons200+10%=220, memory add/clear/recall and visible calculation history.',
      };
    });
    await recordCase('zh-CN-scientific-angles', async () => {
      const state = await navigate(routeFor('zh-CN', 'scientific-calculator'), 'zh-CN');
      await page.locator('#kp-deg').check();
      await page.locator('#kp-input').fill('sin(30)');
      await page.locator('#kp-input').press('Enter');
      const degrees = await page.locator('#kp-result').innerText();
      near(actualNumber(degrees, 'zh-CN'), 0.5);
      const images = [await screenshot(page, config.out, 'zh-CN-scientific-degrees')];
      await page.locator('#kp-rad').check();
      await page.locator('#kp-input').fill('sin(pi/2)');
      await page.locator('#kp-input').press('Enter');
      const radians = await page.locator('#kp-result').innerText();
      near(actualNumber(radians, 'zh-CN'), 1);
      images.push(await screenshot(page, config.out, 'zh-CN-scientific-radians'));
      const history = await page.locator('#kp-history-list').innerText();
      assert.ok(history.includes('sin(30)') && history.includes('sin(pi÷2)'));
      return {
        locale: 'zh-CN',
        state,
        degrees,
        radians,
        history,
        segments: images,
        scope:
          'Actual expression field/Enter and degree/radian radio controls, with visible history.',
      };
    });
    await recordCase('zh-CN-workspace-search-add', async () => {
      await navigate(routeFor('zh-CN', 'workspace') + sharedChoices([]), 'zh-CN');
      await page.waitForFunction(
        () => !document.documentElement.hasAttribute('data-cm-workspace-booting'),
      );
      assert.equal(await page.locator('#desk .ws-card').count(), 0);
      await page.locator('#ws-direct-search').fill('普通');
      const matching = page
        .locator('#ws-direct-results button')
        .filter({ hasText: '普通计算器' })
        .first();
      await matching.waitFor({ state: 'visible' });
      const search = await screenshot(page, config.out, 'zh-CN-workspace-search');
      await matching.click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll('#desk .ws-card iframe:not([data-ws-loading])').length === 1,
      );
      assert.equal(await page.locator('#desk iframe[src*="basic-calculator"]').count(), 1);
      await page.locator('#desk').scrollIntoViewIfNeeded();
      await settled(page);
      return {
        locale: 'zh-CN',
        state: await mainState(page),
        segments: [search, await screenshot(page, config.out, 'zh-CN-workspace-added')],
        scope:
          'Real Chinese search across the500 catalog followed by an actual add click and loaded pocket calculator.',
      };
    });
    await recordCase('workspace-live-link-native-undo', async () => {
      await page.setViewportSize({ width: 1365, height: 1000 });
      await navigate(
        routeFor('en', 'workspace') +
          sharedChoices(['mechanical-power-calculator', 'solar-energy-production-calculator']),
        'en',
      );
      const ready = () =>
        page.waitForFunction(
          () =>
            document.querySelectorAll('#desk iframe:not([data-ws-loading])').length === 2 &&
            !document.documentElement.hasAttribute('data-cm-workspace-booting'),
        );
      await ready();
      const mechanical = page.frameLocator('#desk-1 iframe'),
        solar = page.frameLocator('#desk-2 iframe');
      await mechanical.locator('#w').fill('2000');
      await mechanical.locator('#t').fill('5');
      await page.locator('.ws-links summary').click();
      await page.locator('#ws-link-source').selectOption('1');
      await page.locator('#ws-link-result').selectOption('0');
      await page.locator('#ws-link-destination').selectOption('2');
      await page.locator('#ws-link-field').selectOption('p');
      await page.locator('.ws-links__form button[type="submit"]').click();
      const linked = (expected) =>
        page.waitForFunction((value) => {
          const input = document
            .querySelector('#desk-2 iframe')
            ?.contentDocument?.getElementById('p');
          return Boolean(input && input.readOnly && Number(input.value) === value);
        }, expected);
      await linked(0.4);
      await page.locator('#cm-site-language').selectOption('zh-CN');
      await page.waitForFunction(() => {
        const doc = document.querySelector('#desk-1 iframe')?.contentDocument;
        return (
          document.documentElement.lang === 'zh-CN' &&
          doc?.documentElement.lang === 'zh-CN' &&
          doc.querySelector('label[for="w"]')?.textContent === '功（J）' &&
          doc.querySelector('label[for="t"]')?.textContent === '用时（s）'
        );
      });
      const steps = [],
        images = [];
      const recordStep = async (name, expectedWork, expectedPower, expectedEnergy) => {
        await ready();
        await linked(expectedPower);
        await settled(page);
        const fields = await mechanical.getByRole('main').evaluate((main) => ({
          lang: main.ownerDocument.documentElement.lang,
          work: main.ownerDocument.getElementById('w').value,
          labels: [...main.querySelectorAll('label')].map((label) => label.textContent),
        }));
        const target = await solar.locator('#p').evaluate((input) => ({
          value: input.value,
          readOnly: input.readOnly,
          lang: input.ownerDocument.documentElement.lang,
        }));
        const power = await mechanical.locator('#result').innerText(),
          energy = await solar.locator('#result').innerText();
        assert.equal(fields.lang, 'zh-CN');
        assert.equal(fields.work, expectedWork);
        assert.ok(fields.labels.includes('功（J）') && fields.labels.includes('用时（s）'));
        assert.equal(target.lang, 'zh-CN');
        assert.equal(target.readOnly, true);
        near(Number(target.value), expectedPower);
        near(actualNumber(power, 'zh-CN'), Number(expectedWork) / 5);
        near(actualNumber(energy, 'zh-CN'), expectedEnergy);
        assert.equal(await page.locator('.ws-links__item').count(), 1);
        await page.locator('#desk').scrollIntoViewIfNeeded();
        await settled(page);
        images.push(await screenshot(page, config.out, name));
        steps.push({ name, fields, target, power, energy });
      };
      await recordStep('workspace-link-before-undo', '2000', 0.4, 38.4);
      await page.locator('#desk-1 .ws-card-actions button').nth(3).click();
      assert.equal(await page.locator('.ws-links__item').count(), 0);
      await page.locator('#ws-message button').click();
      await recordStep('workspace-source-native-undo', '2000', 0.4, 38.4);
      await mechanical.locator('#w').fill('4500');
      await linked(0.9);
      await recordStep('workspace-link-after-edit', '4500', 0.9, 86.4);
      await page.locator('#desk-2 .ws-card-actions button').nth(3).click();
      await page.locator('#ws-message button').click();
      await recordStep('workspace-target-native-undo', '4500', 0.9, 86.4);
      return {
        locale: 'zh-CN',
        steps,
        segments: images,
        scope:
          'Actual500 catalog UI/link form, EN-to-CN language switch, source and target remove/Undo with raw values preserved and continued W-to-kW live transfer.',
      };
    });
    await drain();
  } catch (error) {
    report.failures.push({ name: 'fatal-run', error: String(error) });
    throw error;
  } finally {
    await drain().catch((error) =>
      report.failures.push({ name: 'response-provenance', error: String(error) }),
    );
    await browser.close();
    report.finishedAt = new Date().toISOString();
    report.passed = report.failures.length === 0;
    await fs.writeFile(
      path.join(config.out, 'summary.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  console.log(
    JSON.stringify({
      source: gitSHA,
      origin: config.origin,
      pages: report.pages.length,
      screenshots: report.pages.reduce((sum, entry) => sum + (entry.segments?.length || 0), 0),
      responses: report.responses.length,
      failures: report.failures,
    }),
  );
  assert.equal(report.failures.length, 0, 'Actual visual capture or artifact checks failed.');
}

async function selfTest() {
  assert.equal(parseOptions([]).origin, local);
  assert.equal(parseOptions(['--origin', production, '--wait-ms', '300000']).waitMs, 300000);
  for (const origin of [
    'https://example.com',
    'http://localhost:4173',
    'https://calcmintly.com.evil.test',
  ])
    assert.throws(() => parseOptions(['--origin', origin]));
  assert.throws(() => parseOptions(['--wait-ms', '300001']));
  assert.throws(() => parseOptions(['--anything']));
  const routes = [
    { path: '/', file: 'index.html' },
    { path: '/zh-cn/workspace', file: 'zh-cn/workspace.html' },
  ];
  assert.equal(fileForPath('/', routes), 'index.html');
  assert.equal(fileForPath('/zh-cn/workspace', routes), 'zh-cn/workspace.html');
  assert.equal(fileForPath('/assets/dist/example.js', routes), 'assets/dist/example.js');
  assert.throws(() => fileForPath('/assets/%2e%2e/private', routes));
  assert.throws(() => fileForPath('/not-an-observed-route', routes));
  const decoded = JSON.parse(decodeURIComponent(layout.slice('#desk='.length)));
  assert.deepEqual(decoded.tools, [
    'pressure-converter',
    'pressure-converter',
    'mechanical-power-calculator',
    'solar-energy-production-calculator',
  ]);
  assert.equal(locales.length, 20);
  for (const locale of locales) {
    const text = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).format(101.325);
    near(actualNumber(text + ' kPa', locale), 101.325);
  }
  assert.throws(() => actualNumber('1 and 2', 'en'));
  assert.throws(() => actualNumber('—', 'en'));
  const keypadSource = await fs.readFile(path.join(root, 'assets/cm-keypad-app.js'), 'utf8');
  const renderer = keypadSource.match(/const symbols = (.+);/);
  assert.ok(renderer, 'Read the real history display formatter.');
  const historySymbols = vm.runInNewContext('(' + renderer[1] + ')');
  assert.equal(historySymbols('sin(30) ='), 'sin(30) =');
  assert.equal(historySymbols('sin(pi/2) ='), 'sin(pi÷2) =');
  assert.equal(historySymbols('pi*-2/3 ='), 'pi×−2÷3 =');
  console.log(
    'PASS origin/CLI/native-path boundaries and choices-only layout; browser launches0, HTTP requests0.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseOptions(process.argv.slice(2));
  if (options.selfTest) await selfTest();
  else await run(options);
}
