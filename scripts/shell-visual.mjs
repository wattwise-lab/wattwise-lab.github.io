/* CI-only component captures, separate from calculator acceptance. */
/* global document, getComputedStyle, window */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const origin = option('--origin', 'http://127.0.0.1:4173');
assert.ok(['https://calcmintly.com', 'http://127.0.0.1:4173'].includes(origin));
const baseline = args.includes('--baseline');
const out = path.resolve(root, option('--out', 'visual-evidence/shell-local'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const routes = JSON.parse(await fs.readFile(path.join(root, 'src/locale-routes.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/asset-manifest.json'), 'utf8'));
const fileFor = (pathname) => {
  if (pathname.startsWith('/assets/')) return decodeURIComponent(pathname.slice(1));
  const route = routes.find((r) => r.path === pathname);
  assert.ok(route, 'Known document path: ' + pathname);
  return route.file;
};
const cache = new Map();
const expected = (file) => {
  if (!cache.has(file))
    cache.set(
      file,
      execFileSync('git', ['show', commit + ':' + file], { cwd: root, maxBuffer: 8 * 1024 * 1024 }),
    );
  return cache.get(file);
};
await fs.mkdir(out, { recursive: true });
const report = {
  commit,
  githubSHA: process.env.GITHUB_SHA || null,
  origin,
  baseline,
  cases: [],
  responses: [],
  errors: [],
  screenshots: [],
  passed: false,
  personallyViewed: false,
  scope:
    'Actual Chromium header/footer component and selected viewport captures;20locale/RTL/keyboard/links/overflow coverage as explicitly listed. Not allcalculator numerical behavior.',
};
const browser = await chromium.launch({ headless: true });
const locales = baseline
  ? ['en', 'zh-CN', 'ar', 'de']
  : [
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
const cases = locales.flatMap((lang) =>
  [375, 1365].map((width) => ({
    lang,
    width: lang === 'zh-CN' && width === 375 ? 320 : width,
    route: '/',
    theme: 'system',
    scheme: 'light',
  })),
);
if (!baseline) {
  for (const route of ['/basic-calculator', '/scientific-calculator', '/workspace', '/privacy'])
    for (const width of [320, 1365])
      cases.push({ lang: 'zh-CN', width, route, theme: 'system', scheme: 'light' });
  for (const width of [768, 1024, 3840])
    for (const lang of ['en', 'ar'])
      cases.push({ lang, width, route: '/', theme: 'system', scheme: 'light' });
  for (const theme of ['system', 'ocean', 'sand', 'graphite', 'violet', 'rose'])
    for (const scheme of ['light', 'dark'])
      for (const mode of ['auto', 'light', 'dark'])
        cases.push({ lang: 'zh-CN', width: 375, route: '/', theme, scheme, mode });
}
try {
  for (let index = 0; index < cases.length; index++) {
    const config = cases[index],
      prefix =
        String(index + 1).padStart(3, '0') +
        '-' +
        config.lang +
        '-' +
        config.width +
        '-' +
        config.route.replaceAll('/', '') +
        '-' +
        config.theme +
        '-' +
        config.scheme;
    const nativePath =
      config.lang === 'en'
        ? config.route
        : '/' + config.lang.toLowerCase() + (config.route === '/' ? '/' : config.route);
    const route = routes.find((r) => r.path === nativePath);
    assert.ok(route, 'Locale route ' + JSON.stringify(config));
    const context = await browser.newContext({
      viewport: { width: config.width, height: 1000 },
      colorScheme: config.scheme,
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    });
    await context.addInitScript((value) => {
      localStorage.setItem('calcmintly.theme.v1', value.theme);
      localStorage.setItem('calcmintly.color-mode.v1', value.mode || 'auto');
    }, config);
    const page = await context.newPage(),
      pending = [];
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    page.on('pageerror', (error) => report.errors.push({ case: prefix, error: String(error) }));
    page.on('response', (response) =>
      pending.push(
        (async () => {
          const url = new URL(response.url());
          if (url.origin !== origin) {
            report.errors.push({ case: prefix, external: url.href });
            return;
          }
          try {
            const file = fileFor(url.pathname),
              body = await response.body(),
              sha256 = digest(body),
              expectedSHA256 = digest(expected(file));
            report.responses.push({
              case: prefix,
              url: url.href,
              file,
              status: response.status(),
              sha256,
              expectedSHA256,
              exact: sha256 === expectedSHA256,
            });
          } catch (error) {
            report.errors.push({ case: prefix, url: url.href, error: String(error) });
          }
        })(),
      ),
    );
    try {
      await page.goto(origin + route.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#cm-site-language').waitFor();
      await page.locator('.cm-site-footer').waitFor({ state: 'visible' });
      const record = await page.evaluate(() => {
        const header = document.querySelector('.cm-site-header'),
          footer = document.querySelector('.cm-site-footer');
        const links = [...document.querySelectorAll('.cm-site-header a,.cm-site-footer a')].map(
          (a) => ({
            text: a.textContent.trim() || a.getAttribute('aria-label'),
            href: a.getAttribute('href'),
          }),
        );
        const small = [
          ...document.querySelectorAll(
            '.cm-site-header a,.cm-site-header select,.cm-site-header summary,.cm-site-header button,.cm-site-footer a',
          ),
        ]
          .filter(
            (e) =>
              e.getClientRects().length && !e.closest('.cm-site-header__mobile:not([open]) nav'),
          )
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width < 43.8 || r.height < 43.8;
          })
          .map((e) => e.textContent.trim());
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          theme: document.documentElement.dataset.cmTheme,
          mode: document.documentElement.dataset.cmMode || 'auto',
          ink: getComputedStyle(document.body).color,
          page: getComputedStyle(document.body).backgroundColor,
          headerHeight: header.getBoundingClientRect().height,
          footerHeight: footer.getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          languageOptions: document.querySelectorAll('#cm-site-language option').length,
          links,
          small,
          footerDisplay: getComputedStyle(footer).display,
          localeBadge: document.querySelector('.cm-site-header__locale-name')?.textContent,
          innerBounds: ['.cm-site-header__inner', '.cm-site-footer__inner'].map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const { x, width } = element.getBoundingClientRect();
            return { x, width };
          }),
          focusOrder: [...header.querySelectorAll('a,button,select,summary')]
            .filter(
              (e) =>
                e.getClientRects().length && !e.closest('.cm-site-header__mobile:not([open]) nav'),
            )
            .map((e) => {
              const r = e.getBoundingClientRect();
              return {
                name: e.getAttribute('aria-label') || e.id || e.textContent.trim(),
                x: r.x + r.width / 2,
                y: r.y + r.height / 2,
              };
            }),
        };
      });
      assert.equal(record.languageOptions, 20);
      assert.equal(record.lang, config.lang);
      assert.equal(record.theme, config.theme);
      assert.equal(record.mode, config.mode || 'auto');
      const dark =
        config.mode === 'dark' ||
        ((!config.mode || config.mode === 'auto') && config.scheme === 'dark');
      const expectedPages = {
        system: ['rgb(244, 248, 245)', 'rgb(20, 37, 29)'],
        ocean: ['rgb(241, 246, 251)', 'rgb(20, 35, 49)'],
        sand: ['rgb(250, 246, 239)', 'rgb(41, 35, 28)'],
        graphite: ['rgb(244, 245, 247)', 'rgb(30, 33, 41)'],
        violet: ['rgb(246, 243, 252)', 'rgb(37, 28, 48)'],
        rose: ['rgb(255, 244, 246)', 'rgb(48, 29, 37)'],
      };
      assert.equal(
        record.page,
        expectedPages[config.theme][dark ? 1 : 0],
        'Actual page palette follows explicit mode independently of the OS',
      );
      assert.equal(record.overflow, false);
      assert.deepEqual(record.small, []);
      for (const link of record.links)
        if (!link.href.startsWith('#'))
          assert.ok(
            routes.some((r) => r.path === new URL(link.href, origin).pathname),
            'Native destination ' + link.href,
          );
      const shot = async (name, locator) => {
        const filename = prefix + '-' + name + '.png';
        const bytes = await locator.screenshot({ animations: 'disabled' });
        await fs.writeFile(path.join(out, filename), bytes);
        report.screenshots.push({
          case: prefix,
          file: filename,
          sha256: digest(bytes),
          bytes: bytes.length,
        });
      };
      await shot('header', page.locator('.cm-site-header'));
      await shot('footer', page.locator('.cm-site-footer'));
      if (!baseline) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('.cm-appearance-trigger').click();
        assert.equal(await page.locator('[data-cm-theme-choice]').count(), 6);
        assert.equal(
          await page
            .locator('[data-cm-theme-choice="' + config.theme + '"]')
            .getAttribute('aria-pressed'),
          'true',
        );
        assert.equal(
          await page
            .locator('[data-cm-mode-choice="' + (config.mode || 'auto') + '"]')
            .getAttribute('aria-pressed'),
          'true',
        );
        const panelBounds = await page.locator('.cm-appearance-panel').boundingBox();
        assert.ok(
          panelBounds.x >= 0 && panelBounds.x + panelBounds.width <= config.width + 1,
          'Theme popup fits viewport',
        );
        await shot('theme-viewport', page);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.cm-appearance-menu').getAttribute('open'), null);
        assert.equal(
          await page
            .locator('.cm-appearance-trigger')
            .evaluate((e) => e === document.activeElement),
          true,
        );
        await page.locator('[data-cm-command-open]').click();
        await page.locator('#cm-command-query').fill('mortgage');
        await page.locator('.cm-command-results a[href*="mortgage-calculator"]').waitFor();
        await shot('search-viewport', page);
        await page.keyboard.press('Escape');
        assert.equal(
          await page
            .locator('[data-cm-command-open]')
            .evaluate((e) => e === document.activeElement),
          true,
        );
      }

      if (
        config.lang === 'zh-CN' &&
        config.route === '/' &&
        config.theme === 'system' &&
        config.scheme === 'light'
      ) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await shot('top-viewport', page);
        await page.locator('.cm-site-footer').scrollIntoViewIfNeeded();
        await shot('bottom-viewport', page);
      }
      if (
        ['en', 'zh-CN', 'ar', 'de'].includes(config.lang) &&
        config.route === '/' &&
        config.theme === 'system' &&
        config.scheme === 'light'
      ) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const summary = page.locator('.cm-site-header__mobile > summary');
        await summary.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.cm-site-header__mobile').getAttribute('open'), '');
        await shot('menu-viewport', page);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.cm-site-header__mobile').getAttribute('open'), null);
        assert.equal(await summary.evaluate((e) => e === document.activeElement), true);
      }
      if (!baseline) {
        assert.equal(
          record.localeBadge,
          config.lang === 'zh-CN' ? '中文' : config.lang.toUpperCase(),
        );
        assert.ok(
          record.headerHeight >= (config.width <= 700 ? 112 : 80) &&
            record.headerHeight <= (config.width <= 700 ? 160 : 100),
          'Responsive header keeps primary actions visible without clipping',
        );
        assert.equal(record.footerDisplay, 'block');
        const [headerBounds, footerBounds] = record.innerBounds;
        assert.ok(headerBounds && footerBounds, 'Shared content containers exist');
        assert.ok(
          Math.abs(headerBounds.x - footerBounds.x) < 1,
          'Header/footer share horizontal alignment',
        );
        assert.ok(
          Math.abs(headerBounds.width - footerBounds.width) < 1,
          'Header/footer share content width',
        );
        assert.equal(await page.locator('.cm-site-footer__group').count(), 2);
        assert.equal(await page.locator('.cm-site-header__nav a').count(), 3);
        for (let i = 1; i < record.focusOrder.length; i++) {
          const previous = record.focusOrder[i - 1],
            current = record.focusOrder[i];
          if (Math.abs(current.y - previous.y) < 12)
            assert.ok(
              record.dir === 'rtl' ? current.x < previous.x : current.x > previous.x,
              'Focus follows horizontal visual order',
            );
          else assert.ok(current.y > previous.y, 'Focus follows vertical visual order');
        }
        if (
          ['en', 'zh-CN', 'ar', 'de'].includes(config.lang) &&
          config.route === '/' &&
          config.theme === 'system' &&
          config.scheme === 'light'
        ) {
          const controls = page
            .locator('.cm-site-header')
            .locator(
              '.cm-site-header__brand,.cm-site-header__nav a,.cm-header-search,.cm-appearance-trigger,.cm-header-mode,#cm-site-language,.cm-site-header__mobile > summary',
            )
            .filter({ visible: true });
          await controls.first().focus();
          for (let i = 0; i < (await controls.count()); i++) {
            if (i) await page.keyboard.press('Tab');
            assert.equal(
              await controls.nth(i).evaluate((e) => e === document.activeElement),
              true,
              'Actual header Tab order',
            );
          }
          record.actualTabOrderPassed = true;
        }
        if (config.lang === 'zh-CN' && config.width === 320 && config.route === '/') {
          const language = page.locator('#cm-site-language');
          await language.focus();
          await page.setViewportSize({ width: 1365, height: 1000 });
          await page.waitForFunction(
            () =>
              getComputedStyle(document.querySelector('.cm-site-header__nav')).display !== 'none',
          );
          assert.equal(
            await language.evaluate((e) => e === document.activeElement),
            true,
            'Language focus survives wide breakpoint',
          );
          await page.setViewportSize({ width: 320, height: 1000 });
          await page.waitForFunction(
            () =>
              getComputedStyle(document.querySelector('.cm-site-header__nav a')).display === 'none',
          );
          assert.equal(
            await language.evaluate((e) => e === document.activeElement),
            true,
            'Language focus survives narrow breakpoint',
          );
          record.breakpointFocusPreserved = true;
        }
      }
      report.cases.push({ name: prefix, ...config, record, passed: true });
    } catch (error) {
      report.errors.push({ case: prefix, error: String(error), stack: error.stack });
      report.cases.push({ name: prefix, ...config, passed: false });
    }
    await page.waitForTimeout(50);
    await Promise.allSettled(pending);
    await context.close();
  }
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.passed =
    report.cases.length === cases.length &&
    report.cases.every((c) => c.passed) &&
    report.responses.length > 0 &&
    report.responses.every((r) => r.status === 200 && r.exact) &&
    report.errors.length === 0;
  report.manifest = digest(await fs.readFile(path.join(root, 'src/asset-manifest.json')));
  report.expectedCommon = manifest['assets/cm-common.js'];
  await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(
  JSON.stringify({
    commit,
    origin,
    baseline,
    cases: report.cases.length,
    screenshots: report.screenshots.length,
    responses: report.responses.length,
    errors: report.errors,
    passed: report.passed,
  }),
);
if (!report.passed) process.exitCode = 1;
