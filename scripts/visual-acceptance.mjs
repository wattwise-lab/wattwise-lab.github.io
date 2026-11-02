/* CI-only actual viewport evidence. No local browser launch; images require personal review. */
/* global document, location, innerWidth, innerHeight, scrollY, requestAnimationFrame, getComputedStyle */
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
const merchantCompatFiles = Object.freeze({
  '/embed/merchant-profit': 'embed/merchant-profit.html',
  '/embed/merchant-profit-planner': 'embed/merchant-profit-planner.html',
});
const fingerprintedRuntimePath = (pathname) =>
  /^\/assets\/dist\/[^/]+\.[a-f0-9]{12}\.(?:js|css)$/.test(pathname);
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
  if (Object.hasOwn(merchantCompatFiles, decoded)) return merchantCompatFiles[decoded];
  if (decoded.startsWith('/assets/')) return decoded.slice(1);
  if (decoded === '/favicon.ico') return null;
  throw Error('Unexpected same-origin response path: ' + pathname);
}

async function disableBrowserCache(context, page) {
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled', { cacheDisabled: true });
  return {
    disabled: true,
    method: 'Chromium CDP Network.setCacheDisabled',
    target: 'The capture page target, configured before its first navigation.',
    performanceMeasurement: false,
  };
}

async function inspectResponse(response, config, routes, expectedBytes, report) {
  const url = new URL(response.url());
  if (url.origin !== config.origin) {
    report.externalRequests.push({ url: response.url(), status: response.status() });
    return;
  }
  if (response.status() >= 300 && response.status() < 400) return;
  if (url.pathname === '/favicon.ico') return;
  const request = response.request();
  const record = {
    url: response.url(),
    file: null,
    status: response.status(),
    contentType: response.headers()['content-type'],
    headers: response.headers(),
    resourceType: request.resourceType(),
    method: request.method(),
    frameURL: null,
    parentFrameURL: null,
    frameDetached: null,
    bodyRetrieved: false,
    sha256: null,
    expectedSHA256: null,
    exact: null,
  };
  // Keep the real response identity even when Chromium cannot expose its body.
  report.responses.push(record);
  let stage = 'frame-metadata';
  try {
    const frame = request.frame();
    record.frameURL = frame.url();
    record.parentFrameURL = frame.parentFrame()?.url() || null;
    record.frameDetached = frame.isDetached();
    stage = 'artifact-route';
    record.file = fileForPath(url.pathname, routes);
    assert.ok(record.file);
    stage = 'browser-response-body';
    const bytes = await response.body();
    record.bodyRetrieved = true;
    record.bodyBytes = bytes.length;
    record.sha256 = digest(bytes);
    stage = 'expected-artifact';
    const expected = await expectedBytes(record.file);
    record.expectedSHA256 = digest(expected);
    record.exact = bytes.equals(expected);
    stage = 'runtime-fingerprint';
    if (
      /\.(?:js|css)$/i.test(url.pathname) ||
      /^(?:text\/css|(?:application|text)\/(?:javascript|ecmascript))(?:[; ]|$)/i.test(
        record.contentType || '',
      )
    )
      assert.ok(
        fingerprintedRuntimePath(url.pathname),
        'Runtime JS/CSS response must use its fingerprinted asset URL: ' + response.url(),
      );
    stage = 'response-status';
    assert.equal(record.status, 200, 'Failed response ' + response.url());
    stage = 'artifact-bytes';
    assert.ok(record.exact, 'Response bytes differ from the artifact: ' + response.url());
  } catch (error) {
    record.failureStage = stage;
    record.error = String(error);
    record.stack = error.stack || String(error);
    throw error;
  }
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

function assertUniqueDocumentResources(state, documentURL) {
  for (const kind of ['scripts', 'styles']) {
    const seen = new Set();
    for (const reference of state[kind]) {
      const url = new URL(reference, documentURL);
      url.hash = '';
      assert.ok(
        !seen.has(url.href),
        'Duplicate ' + kind + ' URL in ' + documentURL + ': ' + url.href,
      );
      seen.add(url.href);
    }
  }
}

async function mainState(page) {
  const state = await page.evaluate(() => {
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
  assertUniqueDocumentResources(state, page.url());
  return state;
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

async function entirePage(page, directory, name, topControl = '.cm-site-header__brand') {
  await page.locator(topControl).press('Home');
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
      browserCache: {
        disabled: false,
        method: 'Chromium CDP Network.setCacheDisabled; setup is pending.',
        performanceMeasurement: false,
      },
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
    const work = inspectResponse(response, config, routes, expectedBytes, report)
      .catch((error) =>
        responseFailures.push(response.url() + '\n' + (error.stack || String(error))),
      )
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
      Object.assign(record, await action(record));
      await drain();
      record.passed = true;
    } catch (error) {
      record.passed = false;
      record.error = String(error);
      record.stack = error.stack || String(error);
      report.failures.push({ name, error: String(error), stack: record.stack });
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
    report.conditions.browserCache = await disableBrowserCache(context, page);
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
    await recordCase('native-home-language-roundtrip', async () => {
      await page.setViewportSize({ width: 320, height: 1000 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      const homes = Object.fromEntries(
        ['en', 'ja'].map((locale) => {
          const file = (locale === 'en' ? '' : locale + '/') + 'index.html';
          const record = routes.find((route) => route.locale === locale && route.file === file);
          assert.ok(record, 'Observed native home route: ' + locale);
          return [locale, new URL(record.path, config.origin).href];
        }),
      );
      const normalizeHeading = (value) => value.replace(/\s+/gu, '');
      const japaneseHeading = '複雑な数式に、答えを隠さない。';
      const stages = [],
        images = [];
      const captureStage = async (name, locale, expectedHeading, response) => {
        await page.waitForFunction(
          (language) =>
            document.documentElement.lang === language &&
            document.querySelector('#cm-site-language')?.value === language &&
            (language === 'en' || Boolean(globalThis.CMTranslations?.[language])),
          locale,
        );
        await settled(page);
        await drain();
        const state = await mainState(page);
        const heading = await page.locator('h1').innerText();
        const normalizedHeading = normalizeHeading(heading);
        assert.equal(page.url(), homes[locale], 'The header selection must load the native URL.');
        assert.equal(normalizedHeading, expectedHeading);
        assert.equal(state.selected, locale);
        assert.equal(state.options, 20);
        assert.equal(state.scripts.filter((src) => src === common).length, 1);
        if (response) {
          assert.equal(response.status(), 200);
          assert.equal(response.url(), homes[locale]);
        }
        const observed = report.responses.findLast(
          (entry) => entry.url === homes[locale] && entry.exact,
        );
        assert.ok(observed, 'The actual native HTML response must match its artifact bytes.');
        stages.push({
          name,
          locale,
          url: page.url(),
          heading,
          normalizedHeading,
          responseSHA256: observed.sha256,
          state,
        });
        images.push(await screenshot(page, config.out, name));
      };
      // Drain completed response bodies before leaving a document; do not cancel provenance reads.
      await drain();
      await navigate(homes.en, 'en');
      const englishHeading = normalizeHeading(await page.locator('h1').innerText());
      await captureStage('native-home-en-baseline', 'en', englishHeading);
      await drain();
      await navigate(homes.ja, 'ja');
      await captureStage('native-home-ja-before', 'ja', japaneseHeading);
      for (const [locale, expected, name] of [
        ['en', englishHeading, 'native-home-en-return'],
        ['ja', japaneseHeading, 'native-home-ja-return'],
      ]) {
        await drain();
        const [response] = await Promise.all([
          page.waitForNavigation({ url: homes[locale], waitUntil: 'load', timeout: 45000 }),
          page.locator('#cm-site-language').selectOption(locale),
        ]);
        assert.ok(response, 'Home language selection must perform a real document navigation.');
        await captureStage(name, locale, expected, response);
      }
      return {
        stages,
        segments: images,
        scope:
          'Real header-select JA-to-EN-to-JA native document navigation; exact responses and complete native Japanese heading, with direct English heading baseline. No runtime heading replacement or fake navigation.',
      };
    });
    const followups = [
      ['de', 'area-converter'],
      ['id', 'area-converter'],
      ['tr', 'area-converter'],
      ['es', 'area-converter'],
      ['zh-CN', 'area-converter'],
      ['zh-CN', 'weight-converter'],
      ['zh-CN', 'speed-converter'],
      ['zh-CN', 'volume-converter'],
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
    await recordCase('rtl-area-guide-language-roundtrip', async (record) => {
      await page.setViewportSize({ width: 375, height: 1000 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
      await drain();
      await navigate(routeFor('ar', 'area-converter'), 'ar');
      await page.locator('#val').fill('123.45');
      await page.locator('#from').selectOption('acre');
      await page.locator('#to').selectOption('sqft');
      const originalInput = await page.locator('#val').elementHandle();
      const readGuide = () =>
        page.evaluate(() => {
          const sections = [...document.querySelectorAll('.cm-tool [data-cm-section]')];
          return {
            url: location.href,
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            values: Object.fromEntries(
              ['val', 'from', 'to'].map((id) => [id, document.getElementById(id).value]),
            ),
            sections: sections.map((section) => ({
              key: section.dataset.cmSection,
              text: section.textContent,
            })),
            managed: [...document.querySelectorAll('[data-cm-bidi-source]')].map((wrapper) => ({
              source: wrapper.getAttribute('data-cm-bidi-source'),
              text: wrapper.textContent,
              isolates: [...wrapper.querySelectorAll('bdi')].map((bdi) => ({
                text: bdi.textContent,
                dir: bdi.getAttribute('dir'),
                direction: globalThis.getComputedStyle(bdi).direction,
                unicodeBidi: globalThis.getComputedStyle(bdi).unicodeBidi,
              })),
              paragraphDirection: globalThis.getComputedStyle(
                wrapper.closest('p') || wrapper.parentElement,
              ).direction,
            })),
            nestedManaged: document.querySelectorAll('[data-cm-bidi-source] [data-cm-bidi-source]')
              .length,
            heroManaged: document.querySelectorAll('.hero [data-cm-bidi-source]').length,
          };
        });
      const expectedInputs = { val: '123.45', from: 'acre', to: 'sqft' },
        stages = [],
        images = [];
      record.stages = stages;
      record.diagnostics = [];
      const captureGuide = async (name, locale) => {
        await page.waitForFunction((language) => {
          const managed = [...document.querySelectorAll('[data-cm-bidi-source]')];
          return (
            document.documentElement.lang === language &&
            managed.length > 0 &&
            (language === 'en'
              ? managed.every(
                  (wrapper) =>
                    wrapper.textContent === wrapper.getAttribute('data-cm-bidi-source') &&
                    wrapper.querySelectorAll('bdi').length === 0,
                )
              : document
                  .querySelector('[data-cm-section="example"] bdi[dir="ltr"]')
                  ?.textContent.startsWith('100 m² ÷'))
          );
        }, locale);
        await settled(page);
        await drain();
        const state = await readGuide();
        const result = await page.locator('#result').innerText();
        const originalInputConnected = await originalInput.evaluate((input) => input.isConnected);
        const evidence = { name, locale, result, state, originalInputConnected };
        stages.push(evidence);
        const diagnosticFile = name + '-state.json';
        const diagnosticBytes =
          JSON.stringify({ source: gitSHA, origin: config.origin, ...evidence }, null, 2) + '\n';
        await fs.writeFile(path.join(config.out, diagnosticFile), diagnosticBytes);
        record.diagnostics.push({ file: diagnosticFile, sha256: digest(diagnosticBytes) });
        assert.ok(
          originalInputConnected,
          'Calculator language changes must keep the original input document.',
        );
        assert.equal(state.url, routeFor(locale, 'area-converter'));
        assert.deepEqual(state.values, expectedInputs);
        assert.equal(state.nestedManaged, 0);
        assert.equal(state.heroManaged, 0);
        near(actualNumber(result, locale), 123.45 * 43560);
        const isolates = state.managed.flatMap((wrapper) => wrapper.isolates);
        if (locale === 'en') {
          assert.equal(isolates.length, 0);
          assert.ok(
            state.sections.every(
              (section) =>
                ![...section.text].some(
                  (char) => /\p{Script=Arabic}/u.test(char) && /\p{L}/u.test(char),
                ),
            ),
            'The complete English guide must not retain Arabic prose.',
          );
        } else {
          assert.equal(state.dir, 'rtl');
          assert.ok(isolates.some((isolate) => /[=÷×]/.test(isolate.text)));
          assert.ok(
            isolates.every(
              (isolate) =>
                isolate.dir === 'ltr' &&
                isolate.direction === 'ltr' &&
                isolate.unicodeBidi.includes('isolate'),
            ),
            'Numeric BDI phrases must retain computed LTR isolation: ' + JSON.stringify(isolates),
          );
          assert.ok(
            state.managed.every((wrapper) => wrapper.paragraphDirection === 'rtl'),
            'Arabic paragraphs remain RTL around their numeric phrases.',
          );
        }
        for (const [region, locator] of [
          ['example', page.locator('[data-cm-section="example"]')],
          ['faq-equation', page.locator('[data-cm-section="faq"] p').nth(1)],
        ]) {
          await locator.scrollIntoViewIfNeeded();
          await settled(page);
          images.push(await screenshot(page, config.out, name + '-' + region));
        }
        return state;
      };
      const initial = await captureGuide('rtl-area-ar-before', 'ar');
      await drain();
      await page.locator('#cm-site-language').selectOption('en');
      await captureGuide('rtl-area-en-in-place', 'en');
      await drain();
      await page.locator('#cm-site-language').selectOption('ar');
      const restored = await captureGuide('rtl-area-ar-return', 'ar');
      assert.deepEqual(
        restored.sections,
        initial.sections,
        'Every Arabic guide section must return to its original full text.',
      );
      assert.deepEqual(
        restored.managed,
        initial.managed,
        'No duplicate or stale isolates after ar-en-ar.',
      );
      return {
        stages,
        segments: images,
        scope:
          'Actual Arabic area guide numeric BDI isolation and ar-to-en-to-ar in-place translation; all guide text/source/isolate structure recorded, original raw input/unit choices/result preserved, six actual equation views.',
      };
    });
    for (const [locale, name, viewport, dark] of [
      ['de', 'workspace-de-narrow', { width: 320, height: 1000 }, false],
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
      const emptyState = {
        tools: await page.locator('#desk .ws-card:not(.empty-slot)').count(),
        placeholders: await page.locator('#desk .ws-card.empty-slot').count(),
        frames: await page.locator('#desk iframe').count(),
      };
      assert.equal(emptyState.tools, 0);
      assert.equal(emptyState.placeholders, 1);
      assert.equal(emptyState.frames, 0);
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
      assert.equal(await page.locator('#desk .ws-card:not(.empty-slot)').count(), 1);
      await page.locator('#desk').scrollIntoViewIfNeeded();
      await settled(page);
      return {
        locale: 'zh-CN',
        emptyState,
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
    for (const specification of [
      { name: 'merchant-native-en-desktop', locale: 'en', width: 1365 },
      { name: 'merchant-native-zh-phone', locale: 'zh-CN', width: 375 },
      {
        name: 'merchant-compatible-en-phone',
        locale: 'en',
        width: 375,
        compatibilityPath: '/embed/merchant-profit',
      },
      {
        name: 'merchant-compatible-zh-desktop',
        locale: 'zh-CN',
        width: 1365,
        compatibilityPath: '/embed/merchant-profit-planner',
      },
    ])
      await recordCase(specification.name, async () => {
        const { name, locale, width, compatibilityPath } = specification;
        const embedded = Boolean(compatibilityPath);
        if (embedded) assert.ok(Object.hasOwn(merchantCompatFiles, compatibilityPath));
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
        await drain();
        if (embedded) {
          const response = await page.goto(
            config.origin + compatibilityPath + '?lang=' + locale + '&currency=USD',
            { waitUntil: 'load', timeout: 45000 },
          );
          assert.equal(response.status(), 200);
        } else
          await navigate(routeFor(locale, 'merchant-profit-planner') + '?currency=USD', locale);
        const input = embedded ? '#w-price' : '#input-price';
        const resultIDs = embedded
          ? ['contribution', 'adcap', 'monthly']
          : ['result-contribution', 'result-cap', 'result-monthly'];
        const languageControl = embedded ? '#language' : '#cm-site-language';
        await page.locator(input).waitFor({ state: 'visible' });
        await page.waitForFunction(
          (language) =>
            document.documentElement.lang === language &&
            document.querySelector('#language')?.options.length === 20,
          locale,
        );
        await settled(page);
        await drain();
        const assetReferences = await page.evaluate(() =>
          [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map((element) => ({
            kind: element.tagName,
            url: new URL(element.getAttribute('src') || element.getAttribute('href'), location.href)
              .pathname,
            integrity: element.getAttribute('integrity'),
          })),
        );
        assert.ok(
          assetReferences.every(
            (reference) =>
              !/^\/assets\/(?:merchant-i18n\/|cm-merchant-widget-v2\.(?:js|css)$)/.test(
                reference.url,
              ),
          ),
          'Merchant runtime references must use their current fingerprinted assets.',
        );
        const merchantSources = [
          'assets/cm-merchant-model-v2.js',
          ...(embedded
            ? ['assets/cm-merchant-widget-v2.js', 'assets/cm-merchant-widget-v2.css']
            : ['assets/cm-merchant-app-v2.js']),
          ...locales.map((language) => 'assets/merchant-i18n/' + language + '.js'),
        ];
        for (const source of merchantSources) {
          const fingerprint = manifest[source];
          assert.ok(fingerprint?.startsWith('/assets/dist/'), 'Merchant asset manifest: ' + source);
          const reference = assetReferences.find((entry) => entry.url === fingerprint);
          assert.ok(reference, 'Current merchant asset is loaded: ' + source);
          if (source.endsWith('.js'))
            assert.equal(
              reference.integrity,
              'sha256-' +
                createHash('sha256')
                  .update(await expectedBytes(fingerprint.slice(1)))
                  .digest('base64'),
              'Merchant script SRI: ' + source,
            );
        }
        if (embedded)
          assert.equal(await page.locator('.cm-site-header,.cm-site-footer').count(), 0);
        const stages = [],
          images = [];
        const readStage = async (stage, language, price, expected) => {
          await page.waitForFunction(
            ({ language, selector, price }) =>
              document.documentElement.lang === language &&
              document.querySelector(selector)?.value === price &&
              document.querySelector('#language')?.value === language,
            { language, selector: input, price },
          );
          await settled(page);
          await drain();
          assert.equal(await page.locator(languageControl).inputValue(), language);
          assert.equal(await page.locator('#language option').count(), 20);
          assert.equal(await page.locator('#currency').inputValue(), 'USD');
          const results = await Promise.all(
            resultIDs.map((id) => page.locator('#' + id).innerText()),
          );
          results.forEach((text, index) => near(actualNumber(text, language), expected[index]));
          const state = await mainState(page);
          assert.ok((await geometry(page)).scroll <= (await geometry(page)).client + 1);
          stages.push({ stage, locale: language, price, currency: 'USD', results, state });
        };
        await readStage('defaults', locale, '100', [33.5, 33.5, 3050]);
        await page.locator(input).fill('200');
        await readStage('price-200', locale, '200', [125.5, 125.5, 12250]);
        await page.locator('#' + resultIDs[0]).scrollIntoViewIfNeeded();
        await settled(page);
        images.push(await screenshot(page, config.out, name + '-edited-result'));
        const otherLocale = locale === 'en' ? 'zh-CN' : 'en';
        await page.locator(languageControl).selectOption(otherLocale);
        await readStage('language-switched', otherLocale, '200', [125.5, 125.5, 12250]);
        await page.locator('#' + resultIDs[0]).scrollIntoViewIfNeeded();
        await settled(page);
        images.push(await screenshot(page, config.out, name + '-translated-result'));
        await page.locator(languageControl).selectOption(locale);
        await readStage('language-returned', locale, '200', [125.5, 125.5, 12250]);
        images.push(
          ...(await entirePage(
            page,
            config.out,
            name,
            embedded ? '#full-tool' : '.cm-site-header__brand',
          )),
        );
        if (embedded) {
          await page.locator('#reset').click();
          await readStage('reset', locale, '100', [33.5, 33.5, 3050]);
          await page.locator('#' + resultIDs[0]).scrollIntoViewIfNeeded();
          await settled(page);
          images.push(await screenshot(page, config.out, name + '-reset-result'));
        }
        return {
          locale,
          embedded,
          compatibilityPath,
          assetReferences,
          stages,
          segments: images,
          scope:
            'Actual merchant price input, EN/CN language roundtrip with USD and values preserved, hand-derived contribution/ad cap/monthly profit, widget reset, full original-width page captures and fingerprinted merchant script SRI. Existing66 cases remain unchanged.',
        };
      });
    for (const dark of [false, true]) {
      for (const theme of ['system', 'ocean', 'sand', 'graphite']) {
        const name = 'appearance-' + theme + (dark ? '-dark' : '-light');
        await recordCase(name, async () => {
          await page.setViewportSize({ width: 375, height: 1000 });
          await page.emulateMedia({
            colorScheme: dark ? 'dark' : 'light',
            reducedMotion: 'reduce',
          });
          await navigate(routeFor('zh-CN', 'basic-calculator'), 'zh-CN');
          const input = page.locator('#kp-input');
          await input.fill('12345');
          const menu = page.locator('.cm-site-header__mobile');
          await menu.locator('summary').click();
          await page.locator('#cm-site-theme').selectOption(theme);
          assert.equal(
            await input.inputValue(),
            '12345',
            'Appearance must preserve the calculation.',
          );
          const open = await screenshot(page, config.out, name + '-menu');
          await page.keyboard.press('Escape');
          assert.equal(await menu.getAttribute('open'), null);
          assert.equal(
            await page
              .locator('.cm-site-header__mobile > summary')
              .evaluate((e) => e === document.activeElement),
            true,
          );
          const state = await mainState(page);
          const palette = await page.evaluate(() => ({
            theme: document.documentElement.dataset.cmTheme,
            ink: getComputedStyle(document.body).color,
            page: getComputedStyle(document.body).backgroundColor,
            storage: localStorage.getItem('calcmintly.theme.v1'),
            width: document.documentElement.scrollWidth,
            viewport: innerWidth,
          }));
          assert.equal(palette.theme, theme);
          assert.equal(palette.storage, theme);
          assert.ok(palette.width <= palette.viewport, 'Theme must not overflow.');
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(
            await page.locator('#cm-site-theme').inputValue(),
            theme,
            'Theme survives reload.',
          );
          await settled(page);
          return {
            state,
            palette,
            segments: [open, await screenshot(page, config.out, name + '-restored')],
            scope:
              'Actual appearance selection, input preserved, Escape focus returned, stored choice restored, original viewport. No performance claim.',
          };
        });
      }
    }
    await page.locator('.cm-site-header__mobile > summary').click();
    await page.locator('#cm-site-theme').selectOption('system');
    await page.keyboard.press('Escape');
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
  assert.equal(fileForPath('/embed/merchant-profit', routes), 'embed/merchant-profit.html');
  assert.equal(
    fileForPath('/embed/merchant-profit-planner', routes),
    'embed/merchant-profit-planner.html',
  );
  assert.throws(() => fileForPath('/embed/another-widget', routes));
  assert.ok(fingerprintedRuntimePath('/assets/dist/zh-CN.0123456789ab.js'));
  assert.ok(fingerprintedRuntimePath('/assets/dist/cm-merchant-widget-v2.0123456789ab.css'));
  for (const pathname of [
    '/assets/merchant-i18n/zh-CN.js',
    '/assets/cm-merchant-widget-v2.css',
    '/assets/dist/name.0123456789a.js',
    '/assets/dist/nested/name.0123456789ab.js',
  ])
    assert.equal(fingerprintedRuntimePath(pathname), false);
  const documentAssets = {
    scripts: ['/assets/dist/example.0123456789ab.js'],
    styles: ['/assets/dist/example.0123456789ab.css'],
  };
  assertUniqueDocumentResources(documentAssets, local + '/workspace');
  assertUniqueDocumentResources(documentAssets, local + '/another-frame');
  for (const kind of ['scripts', 'styles']) {
    for (const duplicate of [documentAssets[kind][0], local + documentAssets[kind][0] + '#again']) {
      assert.throws(
        () =>
          assertUniqueDocumentResources(
            { ...documentAssets, [kind]: [...documentAssets[kind], duplicate] },
            local + '/workspace',
          ),
        new RegExp('Duplicate ' + kind + ' URL'),
      );
    }
  }
  const capturePage = {};
  const commands = [];
  const cache = await disableBrowserCache(
    {
      newCDPSession: async (target) => {
        assert.equal(target, capturePage);
        return { send: async (...command) => commands.push(command) };
      },
    },
    capturePage,
  );
  assert.deepEqual(commands, [
    ['Network.enable'],
    ['Network.setCacheDisabled', { cacheDisabled: true }],
  ]);
  assert.equal(cache.disabled, true);
  assert.equal(cache.performanceMeasurement, false);
  await assert.rejects(
    disableBrowserCache(
      {
        newCDPSession: async () => ({
          send: async () => {
            throw Error('CDP unavailable');
          },
        }),
      },
      capturePage,
    ),
    /CDP unavailable/,
  );
  const responseURL = local + '/assets/dist/example.0123456789ab.js';
  const bodyBytes = Buffer.from('actual browser response');
  const frame = {
    url: () => local + '/pcm/workspace',
    parentFrame: () => ({ url: () => local + '/workspace' }),
    isDetached: () => false,
  };
  const responseFixture = (body, changes = {}) => ({
    url: () => responseURL,
    status: () => 200,
    headers: () => ({
      'content-type': 'text/javascript',
      'content-length': String(bodyBytes.length),
    }),
    request: () => ({ resourceType: () => 'script', method: () => 'GET', frame: () => frame }),
    body,
    ...changes,
  });
  const responseReport = () => ({ responses: [], externalRequests: [] });
  let completeBody;
  const actual = responseReport();
  const pendingBody = inspectResponse(
    responseFixture(
      () =>
        new Promise((resolve) => {
          completeBody = resolve;
        }),
    ),
    { origin: local },
    routes,
    async () => bodyBytes,
    actual,
  );
  assert.equal(actual.responses.length, 1);
  assert.equal(actual.responses[0].url, responseURL);
  assert.equal(actual.responses[0].bodyRetrieved, false);
  completeBody(bodyBytes);
  await pendingBody;
  assert.equal(actual.responses[0].exact, true);
  const failedBody = responseReport();
  await assert.rejects(
    inspectResponse(
      responseFixture(async () => {
        throw Error('simulated Chromium body unavailable');
      }),
      { origin: local },
      routes,
      async () => {
        assert.fail('No substitute request or expected body may mask a failed browser body.');
      },
      failedBody,
    ),
    /simulated Chromium body unavailable/,
  );
  const failed = failedBody.responses[0];
  assert.equal(failedBody.responses.length, 1);
  assert.equal(failed.url, responseURL);
  assert.equal(failed.file, 'assets/dist/example.0123456789ab.js');
  assert.equal(failed.status, 200);
  assert.equal(failed.headers['content-length'], String(bodyBytes.length));
  assert.equal(failed.contentType, 'text/javascript');
  assert.equal(failed.resourceType, 'script');
  assert.equal(failed.method, 'GET');
  assert.equal(failed.frameURL, frame.url());
  assert.equal(failed.parentFrameURL, frame.parentFrame().url());
  assert.equal(failed.frameDetached, false);
  assert.equal(failed.bodyRetrieved, false);
  assert.equal(failed.exact, null);
  assert.equal(failed.failureStage, 'browser-response-body');
  assert.match(failed.error, /simulated Chromium body unavailable/);
  assert.match(failed.stack, /simulated Chromium body unavailable/);
  for (const [changes, expected, pattern] of [
    [{}, Buffer.from('different artifact'), /Response bytes differ/],
    [{ url: () => local + '/assets/unversioned.js' }, bodyBytes, /fingerprinted asset URL/],
    [{ status: () => 500 }, bodyBytes, /Failed response/],
  ]) {
    const rejected = responseReport();
    await assert.rejects(
      inspectResponse(
        responseFixture(async () => bodyBytes, changes),
        { origin: local },
        routes,
        async () => expected,
        rejected,
      ),
      pattern,
    );
    assert.equal(rejected.responses.length, 1);
    assert.equal(rejected.responses[0].bodyRetrieved, true);
    assert.match(rejected.responses[0].error, pattern);
  }
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
  const merchantContext = {};
  vm.runInNewContext(
    await fs.readFile(path.join(root, 'assets/cm-merchant-model-v2.js'), 'utf8'),
    merchantContext,
  );
  const merchant = merchantContext.CMMerchant;
  // Independent arithmetic with the authored default refund/fee/cost assumptions.
  const beforeAd100 = 105 - 5.25 - 35 + 1.4 - 2 - 8 - 1 - 3.45 - 0.2;
  const beforeAd200 = 205 - 10.25 - 35 + 1.4 - 2 - 8 - 1 - 6.45 - 0.2;
  for (const [price, beforeAd, contribution, monthly] of [
    [100, beforeAd100, 33.5, 3050],
    [200, beforeAd200, 125.5, 12250],
  ]) {
    const result = merchant.calculate({ ...merchant.DEFAULTS, price });
    assert.equal(result.ok, true);
    near(result.beforeAd, beforeAd);
    near(result.afterAd, contribution);
    near(result.monthlyProfit, monthly);
    near(merchant.floorMoney(result.targetAd, 'USD'), contribution);
  }
  const keypadSource = await fs.readFile(path.join(root, 'assets/cm-keypad-app.js'), 'utf8');
  const renderer = keypadSource.match(/const symbols = (.+);/);
  assert.ok(renderer, 'Read the real history display formatter.');
  const historySymbols = vm.runInNewContext('(' + renderer[1] + ')');
  assert.equal(historySymbols('sin(30) ='), 'sin(30) =');
  assert.equal(historySymbols('sin(pi/2) ='), 'sin(pi÷2) =');
  assert.equal(historySymbols('pi*-2/3 ='), 'pi×−2÷3 =');
  const shellSource = await fs.readFile(path.join(root, 'assets/cm-shell.js'), 'utf8');
  const start = shellSource.indexOf("  document\n    .querySelectorAll('[data-cm-language]')");
  const end = shellSource.indexOf("  document.addEventListener('click'", start);
  assert.ok(start >= 0 && end > start, 'Extract the actual shared-shell language handler.');
  const handlerSource = shellSource.slice(start, end);
  for (const isHome of [true, false]) {
    let callback;
    const calls = [];
    const select = {
      value: 'ja',
      addEventListener: (event, listener) => {
        assert.equal(event, 'change');
        callback = listener;
      },
    };
    const mock = {
      I: { setLanguage: (value, options) => calls.push({ value, navigate: options.navigate }) },
      document: {
        querySelectorAll: (selector) => {
          assert.equal(selector, '[data-cm-language]');
          return [select];
        },
        querySelector: (selector) => {
          assert.equal(selector, '[data-cm-home]');
          return isHome ? {} : null;
        },
      },
    };
    vm.runInNewContext(handlerSource, mock);
    assert.equal(typeof callback, 'function');
    callback();
    select.value = 'en';
    callback();
    assert.deepEqual(calls, [
      { value: 'ja', navigate: isHome },
      { value: 'en', navigate: isHome },
    ]);
  }
  console.log(
    'PASS origin/CLI/native paths, choices-only layout, per-document unique assets, CDP cold-cache ordering and retained strict response failures; mocked DOM/protocol/body checks only, browser launches0, HTTP requests0.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseOptions(process.argv.slice(2));
  if (options.selfTest) await selfTest();
  else await run(options);
}
