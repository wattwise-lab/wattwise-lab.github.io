/* CI-only QA instrumentation. Never imported by product pages; local browser acceptance uses CUA. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const TYPES = ['largest-contentful-paint', 'layout-shift'];
const WORKSPACE_TOOLS = [
  'basic-calculator',
  'percentage-calculator',
  'loan-calculator',
  'bmi-calculator',
];
export const SCENARIOS = [
  {
    id: 'home-en-phone',
    route: '/',
    lang: 'en',
    viewport: { width: 375, height: 812 },
  },
  {
    id: 'home-zh-cn-phone',
    route: '/zh-cn/',
    lang: 'zh-CN',
    viewport: { width: 375, height: 812 },
  },
  {
    id: 'pocket-320',
    route: '/basic-calculator',
    lang: 'en',
    viewport: { width: 320, height: 812 },
  },
  {
    id: 'workspace-four-cards-desktop',
    route:
      '/workspace#desk=' + encodeURIComponent(JSON.stringify({ v: 1, tools: WORKSPACE_TOOLS })),
    lang: 'en',
    viewport: { width: 1365, height: 1000 },
    tools: WORKSPACE_TOOLS,
  },
];

// This function is installed only by this CI harness in its disposable browser contexts.
// It is self-contained because Playwright serializes it into every document/frame.
export function installProbe() {
  const g = globalThis;
  const state = {
    version: 1,
    installedAt: g.performance.now(),
    initialVisibility: g.document.visibilityState,
    supportedEntryTypes: [...(g.PerformanceObserver?.supportedEntryTypes || [])],
    enabled: [],
    errors: [],
    observations: [],
    visibility: [],
    inputs: [],
  };
  const observers = [];
  const rect = (r) => (r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null);
  const node = (n) => (n ? { tag: n.tagName || '', id: n.id || '' } : null);
  const record = (entries) => {
    for (const entry of entries) {
      const row = {
        entryType: entry.entryType,
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        deliveredAt: g.performance.now(),
      };
      if (entry.entryType === 'largest-contentful-paint')
        Object.assign(row, {
          size: entry.size,
          renderTime: entry.renderTime,
          loadTime: entry.loadTime,
          id: entry.id,
          url: entry.url,
          element: node(entry.element),
        });
      if (entry.entryType === 'layout-shift')
        Object.assign(row, {
          value: entry.value,
          hadRecentInput: entry.hadRecentInput,
          lastInputTime: entry.lastInputTime,
          sources: [...(entry.sources || [])].map((s) => ({
            node: node(s.node),
            previousRect: rect(s.previousRect),
            currentRect: rect(s.currentRect),
          })),
        });
      state.observations.push(row);
    }
  };
  for (const type of ['largest-contentful-paint', 'layout-shift']) {
    if (!state.supportedEntryTypes.includes(type)) {
      state.errors.push({
        type,
        error: 'Unsupported PerformanceObserver entry type',
      });
      continue;
    }
    try {
      const observer = new g.PerformanceObserver((list) => {
        try {
          record(list.getEntries());
        } catch (error) {
          state.errors.push({ type, error: String(error) });
        }
      });
      observer.observe({ type, buffered: true });
      observers.push(observer);
      state.enabled.push(type);
    } catch (error) {
      state.errors.push({ type, error: String(error) });
    }
  }
  g.document.addEventListener('visibilitychange', () =>
    state.visibility.push({
      at: g.performance.now(),
      state: g.document.visibilityState,
    }),
  );
  for (const type of ['pointerdown', 'keydown', 'touchstart'])
    g.addEventListener(
      type,
      (event) => {
        if (event.isTrusted) state.inputs.push({ at: g.performance.now(), type });
      },
      { capture: true, passive: true },
    );
  g.__cmPerformanceLab = {
    finish() {
      for (const observer of observers) {
        try {
          record(observer.takeRecords());
          observer.disconnect();
        } catch (error) {
          state.errors.push({ type: 'drain', error: String(error) });
        }
      }
      return {
        ...state,
        timeOrigin: g.performance.timeOrigin,
        observedAt: g.performance.now(),
        navigation: g.performance.getEntriesByType('navigation').map((entry) => entry.toJSON()),
        url: g.document.URL,
        lang: g.document.documentElement.lang,
        title: g.document.title,
        finalVisibility: g.document.visibilityState,
        viewport: {
          width: g.innerWidth,
          height: g.innerHeight,
          devicePixelRatio: g.devicePixelRatio,
        },
        scripts: [...g.document.querySelectorAll('script[src]')].map((script) => script.src),
        styles: [...g.document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href),
      };
    },
  };
}

export function summarizeFrame(raw) {
  const invalidReasons = [];
  if (!raw || raw.version !== 1) invalidReasons.push('QA probe missing or wrong version.');
  const nav = raw?.navigation?.length === 1 ? raw.navigation[0] : null;
  if (
    !nav ||
    !['navigate', 'reload'].includes(nav.type) ||
    nav.startTime !== 0 ||
    !finite(raw?.timeOrigin) ||
    !finite(raw?.observedAt) ||
    raw.observedAt <= 0 ||
    (nav.activationStart || 0) > 0
  )
    invalidReasons.push('Ordinary fresh document navigation and clocks were not verified.');
  if (
    raw?.initialVisibility !== 'visible' ||
    raw?.finalVisibility !== 'visible' ||
    raw?.visibility?.some((row) => row.state !== 'visible')
  )
    invalidReasons.push('Document was not continuously visible in this observed window.');
  if (raw?.inputs?.length) invalidReasons.push('Trusted input ended the quiet initial-load scope.');
  const entries = raw?.observations || [];
  const validRows = entries.filter(
    (row) => finite(row.startTime) && row.startTime >= 0 && row.startTime <= raw.observedAt,
  );
  if (validRows.length !== entries.length)
    invalidReasons.push('Invalid or out-of-window observer entry.');
  const healthy = (type) =>
    !invalidReasons.length &&
    raw?.enabled?.includes(type) &&
    !raw?.errors?.some((row) => row.type === type || row.type === 'drain');
  const lcpRows = validRows
    .filter((row) => row.entryType === TYPES[0])
    .sort((a, b) => a.startTime - b.startTime);
  const lcpMalformed = lcpRows.some(
    (row) => !finite(row.size) || row.size <= 0 || row.startTime <= 0,
  );
  const lcp =
    healthy(TYPES[0]) && !lcpMalformed && lcpRows.length ? lcpRows.at(-1).startTime : null;
  const shifts = validRows
    .filter((row) => row.entryType === TYPES[1])
    .sort((a, b) => a.startTime - b.startTime);
  const clsMalformed = shifts.some(
    (row) => !finite(row.value) || row.value < 0 || typeof row.hadRecentInput !== 'boolean',
  );
  const windows = [];
  for (const row of shifts.filter((entry) => !entry.hadRecentInput)) {
    let current = windows.at(-1);
    if (
      !current ||
      row.startTime - current.endMs >= 1000 ||
      row.startTime - current.startMs >= 5000
    ) {
      current = {
        startMs: row.startTime,
        endMs: row.startTime,
        score: 0,
        entries: [],
      };
      windows.push(current);
    }
    current.endMs = row.startTime;
    current.score += row.value;
    current.entries.push(row.startTime);
  }
  const cls =
    healthy(TYPES[1]) && !clsMalformed
      ? Math.max(0, ...windows.map((window) => window.score))
      : null;
  const ttfb =
    !invalidReasons.length && finite(nav?.responseStart) && nav.responseStart > 0
      ? nav.responseStart - nav.startTime
      : null;
  return {
    invalidReasons,
    lcp: {
      valueMs: lcp,
      status: lcp === null ? 'UNMEASURED_OR_INVALID' : 'PROVISIONAL_LAST_DOCUMENT_CANDIDATE',
      candidateCount: lcpRows.length,
    },
    cls: {
      value: cls,
      status: cls === null ? 'UNMEASURED_OR_INVALID' : 'INITIAL_DOCUMENT_SESSION_WINDOW_ONLY',
      windows,
      recentInputShiftCount: shifts.filter((row) => row.hadRecentInput).length,
    },
    ttfb: {
      valueMs: ttfb,
      method:
        'NavigationTiming.responseStart - startTime; may include103 Early Hints; not server-only time',
      finalResponseHeadersMs:
        !invalidReasons.length &&
        finite(nav?.finalResponseHeadersStart) &&
        nav.finalResponseHeadersStart > 0
          ? nav.finalResponseHeadersStart - nav.startTime
          : null,
    },
    comparison: {
      lcpUnder2500: lcp === null ? null : lcp < 2500,
      clsUnderPoint1: cls === null ? null : cls < 0.1,
    },
    inp: null,
    fieldP75: { lcp: null, cls: null, inp: null },
  };
}

export function parseOptions(args, env) {
  assert.ok(
    args.every((arg) => arg === '--self-test'),
    'Only --self-test is accepted.',
  );
  if (args.includes('--self-test')) return { selfTest: true };
  assert.equal(env.CI, 'true', 'Browser measurement is CI-only; local acceptance uses CUA.');
  assert.equal(env.GITHUB_ACTIONS, 'true', 'Run this lab in its GitHub Actions workflow.');
  const base = new URL(env.BASE_URL || 'http://127.0.0.1:4173');
  assert.ok(
    base.protocol === 'http:' &&
      ['127.0.0.1', 'localhost'].includes(base.hostname) &&
      base.port === '4173' &&
      base.pathname === '/' &&
      !base.search &&
      !base.hash &&
      !base.username &&
      !base.password,
    'Only the existing local preview origin on port4173 is permitted.',
  );
  return { base: base.origin, repetitions: 3, quietMs: 5000 };
}

async function fileForURL(root, url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const candidate = path.resolve(root, '.' + pathname);
  assert.ok(
    candidate === root || candidate.startsWith(root + path.sep),
    'Path outside generated site.',
  );
  const stat = await fs.stat(candidate).catch(() => null);
  if (stat?.isDirectory()) return path.join(candidate, 'index.html');
  if (stat?.isFile()) return candidate;
  const html = candidate + '.html';
  assert.ok((await fs.stat(html)).isFile(), 'No exact local response source: ' + pathname);
  return html;
}

export async function runLab(config) {
  assert.deepEqual(
    config,
    parseOptions([], process.env),
    'Only fixed CI lab configuration is accepted.',
  );
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const out = path.join(root, 'browser-evidence', 'performance-lab');
  await fs.mkdir(out, { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const sourceSHA = git('rev-parse', 'HEAD');
  assert.match(sourceSHA, /^[a-f0-9]{40}$/);
  assert.equal(process.env.GITHUB_SHA, sourceSHA, 'Checkout SHA must match actual CI source SHA.');
  const manifestBytes = await fs.readFile(path.join(root, 'src/asset-manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  const routesBytes = await fs.readFile(path.join(root, 'src/locale-routes.json'));
  const routes = JSON.parse(routesBytes);
  for (const scenario of SCENARIOS) {
    const route = new URL(scenario.route, config.base).pathname;
    assert.ok(
      routes.some(
        (entry) => entry.indexable && entry.locale === scenario.lang && entry.path === route,
      ),
      'Scenario must be an actual indexed source route: ' + route,
    );
    for (const slug of scenario.tools || [])
      assert.ok(
        routes.some(
          (entry) => entry.indexable && entry.locale === 'en' && entry.path === '/' + slug,
        ),
      );
  }
  const expectedCommon = new URL(manifest['assets/cm-common.js'], config.base).href;
  const { chromium } = await import('playwright');
  const report = {
    schemaVersion: 1,
    status: 'COLLECTION_IN_PROGRESS',
    scope:
      'Local generated static artifact; twelve fixed-order fresh-context Chromium initial-load lab observations. Not production, field data or all-site coverage.',
    source: {
      gitSHA: sourceSHA,
      trackedWorkingTreeChangesAfterBuild: git('diff', '--name-only').split('\n').filter(Boolean),
      githubSHA: process.env.GITHUB_SHA,
      ref: process.env.GITHUB_REF,
      runID: process.env.GITHUB_RUN_ID,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT,
      manifestSHA256: sha256(manifestBytes),
      localeRoutesSHA256: sha256(routesBytes),
      expectedCommon,
      instrumentSHA256: sha256(installProbe.toString()),
      scriptSHA256: sha256(await fs.readFile(fileURLToPath(import.meta.url))),
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      osRelease: os.release(),
      cpuModels: [...new Set(os.cpus().map((cpu) => cpu.model))],
      logicalCPUs: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      playwright: JSON.parse(
        await fs.readFile(path.join(root, 'node_modules/playwright/package.json')),
      ).version,
      chromium: null,
      headless: true,
    },
    conditions: {
      origin: config.base,
      repetitions: config.repetitions,
      quietIntervalAfterReadyMs: config.quietMs,
      freshContextPerSample: true,
      order: SCENARIOS.map((s) => s.id),
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: 'en-US',
      networkEmulation: null,
      cpuEmulation: null,
      cache:
        'Fresh context; request routing disables HTTP cache. Browser/OS/network caches are not claimed cold.',
      serviceWorkers: 'blocked',
      externalRequests: 'aborted and invalidate sample; no production requests permitted',
    },
    samples: [],
    fatalErrors: [],
    limits: [
      'QA PerformanceObserver instrumentation runs only in disposable CI documents, including frames; adds small measurement overhead and is absent from product bundles.',
      'Five-second quiet interval after readiness plus navigation/ready time; later candidates and shifts are outside this finite window.',
      'Thresholds apply only to each main document. Iframe observations are retained separately with their own time origins; they are never summed or mislabeled as whole-page LCP/CLS.',
      'No trusted user interaction is generated. INP and all fieldp75 values are null.',
      'Local uncompressed static server with runner hardware and no CPU/network throttling does not model production CDN, compression, users or devices.',
      'CI exit success means every scheduled sample was collected validly, not that thresholds passed. Every sample comparison and all failures are retained. No fastest-run filtering.',
    ],
    primarySources: [
      'https://playwright.dev/docs/api/class-browsercontext#browser-context-add-init-script',
      'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe',
      'https://web.dev/articles/lcp',
      'https://web.dev/articles/cls',
      'https://web.dev/articles/ttfb',
      'https://web.dev/articles/inp',
    ],
  };
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    report.environment.chromium = browser.version();
    for (const scenario of SCENARIOS)
      for (let repetition = 1; repetition <= config.repetitions; repetition++) {
        const sample = {
          scenario: scenario.id,
          repetition,
          viewport: scenario.viewport,
          url: config.base + scenario.route,
          startedAt: new Date().toISOString(),
          collectionErrors: [],
          pageErrors: [],
          blockedExternalRequests: [],
          requestFailures: [],
          responses: [],
          frames: [],
          valid: false,
        };
        let context;
        const pending = [];
        try {
          context = await browser.newContext({
            viewport: scenario.viewport,
            deviceScaleFactor: 1,
            colorScheme: 'light',
            reducedMotion: 'reduce',
            locale: 'en-US',
            serviceWorkers: 'block',
          });
          await context.addInitScript(installProbe);
          await context.route('**/*', async (route) => {
            const requestURL = new URL(route.request().url());
            if (requestURL.origin === config.base) await route.continue();
            else {
              sample.blockedExternalRequests.push(route.request().url());
              await route.abort('blockedbyclient');
            }
          });
          const page = await context.newPage();
          page.on('pageerror', (error) => sample.pageErrors.push(String(error)));
          page.on('requestfailed', (request) =>
            sample.requestFailures.push({
              url: request.url(),
              error: request.failure()?.errorText,
            }),
          );
          page.on('response', (response) => {
            pending.push(
              (async () => {
                const url = response.url();
                if (new URL(url).origin !== config.base)
                  throw Error('Unexpected nonlocal response: ' + url);
                const bytes = await response.body(),
                  file = await fileForURL(root, url),
                  expected = await fs.readFile(file);
                sample.responses.push({
                  url,
                  status: response.status(),
                  resourceType: response.request().resourceType(),
                  contentType: response.headers()['content-type'] || null,
                  file: path.relative(root, file),
                  bytes: bytes.length,
                  sha256: sha256(bytes),
                  sourceSHA256: sha256(expected),
                  exactSourceBytes: bytes.equals(expected),
                });
              })().catch((error) => sample.collectionErrors.push(String(error))),
            );
          });
          const response = await page.goto(sample.url, {
            waitUntil: 'load',
            timeout: 30000,
          });
          assert.equal(response?.status(), 200, 'Main document must be served successfully.');
          if (scenario.tools)
            await page.waitForFunction(
              () => {
                const cards = [
                  ...globalThis.document.querySelectorAll('#desk .ws-card:not(.empty-slot)'),
                ];
                return (
                  cards.length === 4 &&
                  cards.every((card) => !card.querySelector('.ws-card-footer button')?.disabled)
                );
              },
              undefined,
              { timeout: 15000 },
            );
          else await page.locator('h1').waitFor({ state: 'visible' });
          sample.readyAtNodeISO = new Date().toISOString();
          await page.waitForTimeout(config.quietMs);
          for (const frame of page.frames()) {
            const main = frame === page.mainFrame();
            const raw = await frame.evaluate(() => globalThis.__cmPerformanceLab?.finish() || null);
            sample.frames.push({
              isMainFrame: main,
              url: frame.url(),
              raw,
              metrics: summarizeFrame(raw),
            });
          }
          await Promise.all(pending);
          const main = sample.frames.filter((frame) => frame.isMainFrame);
          assert.equal(main.length, 1, 'Exactly one main-frame measurement required.');
          assert.equal(main[0].raw?.url, sample.url);
          assert.equal(main[0].raw?.lang, scenario.lang);
          assert.equal(
            main[0].raw.scripts.filter((src) =>
              /\/cm-common\.[a-f0-9]{12}\.js$/.test(new URL(src).pathname),
            ).length,
            1,
          );
          assert.ok(
            main[0].raw.scripts.includes(expectedCommon),
            'Exact built common bundle required.',
          );
          assert.equal(main[0].raw.viewport.width, scenario.viewport.width);
          assert.equal(main[0].raw.viewport.height, scenario.viewport.height);
          if (scenario.tools) {
            assert.equal(sample.frames.filter((frame) => !frame.isMainFrame).length, 4);
            for (const slug of scenario.tools)
              assert.equal(
                sample.frames.filter(
                  (frame) => !frame.isMainFrame && new URL(frame.url).pathname.endsWith('/' + slug),
                ).length,
                1,
              );
          }
          assert.ok(
            !sample.pageErrors.length &&
              !sample.requestFailures.length &&
              !sample.blockedExternalRequests.length &&
              !sample.collectionErrors.length,
            'Runtime/network/collection error; retained raw evidence.',
          );
          assert.ok(
            sample.responses.length &&
              sample.responses.every((row) => row.status === 200 && row.exactSourceBytes),
            'Every observed local response must match generated bytes.',
          );
          assert.ok(
            main[0].metrics.lcp.valueMs !== null &&
              main[0].metrics.cls.value !== null &&
              !main[0].metrics.invalidReasons.length,
            'Main-frame LCP/CLS collection must be supported, nonmissing and valid.',
          );
          sample.valid = true;
        } catch (error) {
          sample.collectionErrors.push(String(error));
        } finally {
          if (context)
            try {
              await context.close();
            } catch (error) {
              sample.collectionErrors.push('Context cleanup: ' + String(error));
            }
          await Promise.all(pending);
          if (
            sample.collectionErrors.length ||
            sample.requestFailures.length ||
            sample.pageErrors.length
          )
            sample.valid = false;
          sample.finishedAt = new Date().toISOString();
          sample.mainFrameComparison = sample.frames.find((frame) => frame.isMainFrame)?.metrics
            .comparison || { lcpUnder2500: null, clsUnderPoint1: null };
          report.samples.push(sample);
          await fs.writeFile(
            path.join(out, `${scenario.id}-${repetition}.json`),
            JSON.stringify(sample, null, 2) + '\n',
          );
        }
      }
  } catch (error) {
    report.fatalErrors.push(String(error));
  } finally {
    if (browser)
      try {
        await browser.close();
      } catch (error) {
        report.fatalErrors.push('Browser cleanup: ' + String(error));
      }
    report.collection = {
      scheduledSamples: SCENARIOS.length * config.repetitions,
      recordedSamples: report.samples.length,
      validSamples: report.samples.filter((sample) => sample.valid).length,
    };
    report.thresholds = {
      meaning:
        'Strict per-sample main-frame comparisons only; collection CI success does not enforce or certify thresholds.',
      lcpMilliseconds: { operator: '<', limit: 2500 },
      cls: { operator: '<', limit: 0.1 },
      samples: report.samples.map((sample) => ({
        scenario: sample.scenario,
        repetition: sample.repetition,
        collectionValid: sample.valid,
        ...sample.mainFrameComparison,
      })),
    };
    report.status =
      !report.fatalErrors.length &&
      report.collection.recordedSamples === report.collection.scheduledSamples &&
      report.collection.validSamples === report.collection.scheduledSamples
        ? 'VALID_LOCAL_LAB_COLLECTION_ONLY'
        : 'COLLECTION_INVALID_OR_INCOMPLETE';
    await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(
    JSON.stringify(
      {
        status: report.status,
        sourceSHA,
        collection: report.collection,
        thresholds: report.thresholds,
      },
      null,
      2,
    ),
  );
  assert.equal(
    report.status,
    'VALID_LOCAL_LAB_COLLECTION_ONLY',
    'See all retained samples and raw evidence.',
  );
}

async function selfTest() {
  assert.throws(() => parseOptions([], {}), /CI-only/);
  assert.throws(
    () =>
      parseOptions([], {
        CI: 'true',
        GITHUB_ACTIONS: 'true',
        BASE_URL: 'https://calcmintly.com',
      }),
    /local preview/,
  );
  assert.equal(parseOptions(['--self-test'], {}).selfTest, true);
  assert.equal(parseOptions([], { CI: 'true', GITHUB_ACTIONS: 'true' }).repetitions, 3);
  const observers = [],
    listeners = new Map();
  let now = 0;
  class Observer {
    static supportedEntryTypes = TYPES;
    constructor(callback) {
      this.callback = callback;
      this.pending = [];
      observers.push(this);
    }
    observe(options) {
      assert.equal(options.buffered, true);
      this.type = options.type;
    }
    takeRecords() {
      return this.pending.splice(0);
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  const document = {
    visibilityState: 'visible',
    URL: 'http://127.0.0.1:4173/',
    title: 'Synthetic QA fixture',
    documentElement: { lang: 'en' },
    querySelectorAll: () => [],
    addEventListener: (type, callback) => listeners.set(type, callback),
  };
  const scope = vm.createContext({
    PerformanceObserver: Observer,
    document,
    performance: {
      now: () => now,
      timeOrigin: 1793491200000,
      getEntriesByType: () => [
        {
          toJSON: () => ({
            type: 'navigate',
            startTime: 0,
            responseStart: 200,
            activationStart: 0,
          }),
        },
      ],
    },
    addEventListener: (type, callback) => listeners.set(type, callback),
    innerWidth: 375,
    innerHeight: 812,
    devicePixelRatio: 1,
  });
  vm.runInContext('(' + installProbe.toString() + ')()', scope);
  const lcpObserver = observers.find((observer) => observer.type === TYPES[0]);
  lcpObserver.callback({
    getEntries: () => [
      {
        entryType: TYPES[0],
        name: '',
        startTime: 1000,
        duration: 0,
        size: 100,
        renderTime: 1000,
        loadTime: 0,
      },
    ],
  });
  lcpObserver.pending.push({
    entryType: TYPES[0],
    name: '',
    startTime: 2400,
    duration: 0,
    size: 200,
    renderTime: 2400,
    loadTime: 0,
  });
  const shiftObserver = observers.find((observer) => observer.type === TYPES[1]);
  shiftObserver.pending.push(
    ...[
      [100, 0.1, false],
      [1099, 0.2, false],
      [2099, 0.05, false],
      [2500, 0.3, false],
      [2700, 0.9, true],
      [6000, 0.12, false],
    ].map(([startTime, value, hadRecentInput]) => ({
      entryType: TYPES[1],
      startTime,
      value,
      hadRecentInput,
      sources: [],
    })),
  );
  now = 9000;
  const raw = scope.__cmPerformanceLab.finish(),
    metrics = summarizeFrame(raw);
  assert.equal(metrics.lcp.valueMs, 2400);
  assert.ok(Math.abs(metrics.cls.value - 0.35) < 1e-10);
  assert.equal(raw.observations.length, 8, 'Callback and takeRecords entries all retained.');
  assert.ok(observers.every((observer) => observer.disconnected));
  assert.equal(metrics.comparison.lcpUnder2500, true);
  assert.equal(metrics.comparison.clsUnderPoint1, false);
  assert.equal(metrics.inp, null);
  assert.equal(metrics.fieldP75.lcp, null);
  assert.equal(summarizeFrame(null).lcp.valueMs, null);
  const malformed = structuredClone(raw);
  malformed.observations.push({
    entryType: TYPES[1],
    startTime: 100,
    value: NaN,
    hadRecentInput: false,
  });
  assert.equal(summarizeFrame(malformed).cls.value, null);
  const none = structuredClone(raw);
  none.observations = [];
  assert.equal(summarizeFrame(none).lcp.valueMs, null, 'No LCP must never become zero.');
  assert.equal(
    summarizeFrame(none).cls.value,
    0,
    'Enabled healthy empty shift list is observed zero.',
  );
  const missing = structuredClone(none);
  missing.enabled = [];
  assert.equal(summarizeFrame(missing).cls.value, null, 'Unsupported is not observed zero.');
  const hidden = structuredClone(raw);
  hidden.visibility.push({ at: 1, state: 'hidden' });
  assert.equal(summarizeFrame(hidden).lcp.valueMs, null);
  const input = structuredClone(raw);
  input.inputs.push({ at: 3, type: 'keydown' });
  assert.equal(summarizeFrame(input).cls.value, null);
  const exact = structuredClone(raw);
  exact.observations = [
    { entryType: TYPES[0], startTime: 2500, size: 20 },
    { entryType: TYPES[1], startTime: 1, value: 0.1, hadRecentInput: false },
  ];
  assert.deepEqual(summarizeFrame(exact).comparison, {
    lcpUnder2500: false,
    clsUnderPoint1: false,
  });
  const five = structuredClone(raw);
  five.observations = Array.from({ length: 7 }, (_, i) => ({
    entryType: TYPES[1],
    startTime: i * 900,
    value: 0.1,
    hadRecentInput: false,
  }));
  assert.ok(Math.abs(summarizeFrame(five).cls.value - 0.6) < 1e-10);
  assert.equal(SCENARIOS.length * 3, 12);
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'calcmintly-performance-parser-'));
  try {
    await fs.mkdir(path.join(temporaryRoot, 'zh-cn'));
    await fs.mkdir(path.join(temporaryRoot, 'assets'));
    await fs.writeFile(path.join(temporaryRoot, 'index.html'), 'fixture home');
    await fs.writeFile(path.join(temporaryRoot, 'zh-cn/index.html'), 'fixture native home');
    await fs.writeFile(path.join(temporaryRoot, 'basic-calculator.html'), 'fixture calculator');
    await fs.writeFile(path.join(temporaryRoot, 'assets/test.js'), 'fixture asset');
    for (const [url, expected] of [
      ['/', 'index.html'],
      ['/zh-cn/', 'zh-cn/index.html'],
      ['/basic-calculator?embed=1', 'basic-calculator.html'],
      ['/assets/test.js', 'assets/test.js'],
    ])
      assert.equal(
        path.relative(
          temporaryRoot,
          await fileForURL(temporaryRoot, 'http://127.0.0.1:4173' + url),
        ),
        expected,
      );
    await assert.rejects(
      fileForURL(temporaryRoot, 'http://127.0.0.1:4173/%2e%2e%2foutside'),
      /outside/,
    );
    assert.equal(
      sha256(Buffer.from('fixture home')),
      sha256(await fs.readFile(path.join(temporaryRoot, 'index.html'))),
    );
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
  console.log(
    'PASS actual observer in VM, missing/threshold/session semantics, CI/local-only parsing and isolated route/hash fixtures; browser launches0, HTTP requests0.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseOptions(process.argv.slice(2), process.env);
  if (options.selfTest) await selfTest();
  else await runLab(options);
}
