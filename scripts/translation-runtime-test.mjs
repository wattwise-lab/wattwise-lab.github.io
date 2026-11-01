import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const source =
  (await fs.readFile(new URL('../assets/cm-locale-core.js', import.meta.url), 'utf8')) +
  '\n' +
  (await fs.readFile(new URL('../assets/cm-data-core.js', import.meta.url), 'utf8')) +
  '\n' +
  (await fs.readFile(new URL('../assets/cm-i18n.js', import.meta.url), 'utf8'));
const corpus = JSON.parse(
  await fs.readFile(new URL('../src/i18n-corpus.json', import.meta.url), 'utf8'),
);
for (const fragment of ['The discriminant D = b²', "It is the parabola's turning point:"])
  assert.ok(
    corpus.some((row) => row.active && row.source.includes(fragment)),
    'Explanations containing both inequality signs must remain translatable: ' + fragment,
  );
for (const source of [
  'use strict',
  '[data-w]',
  'input,select,textarea',
  'call',
  'order',
  'hour',
  'minute',
  'second',
  'bit',
  'byte',
  'complete',
  '?embed=1',
  'cm:workspace-results',
  'cm:workspace-change',
  'cm:translations',
  'thead',
  'tbody',
  'decimal',
  'mortgage',
  'home price',
  'NFKC',
  'giu',
  'deg',
  'series',
  'parallel',
])
  assert.ok(
    !corpus.some((row) => row.active && row.source === source),
    'Implementation syntax must not count as public translation copy: ' + source,
  );
assert.ok(corpus.some((row) => row.active && row.source === 'Remove calculator'));
for (const source of [
  'Input or result',
  'Coordinates',
  'Home price',
  'Loan principal',
  'Degrees',
  'All must work',
  'At least one must work',
  'At least two observations are required.',
  'Probability must be strictly between 0 and 1.',
  'The probability calculation did not converge within the supported numeric range.',
  'Beta-distribution parameters are outside the supported numeric range.',
  'This browser could not save the preference.',
  'mortgage · loan · compound · rent vs buy · freelance · AI cost',
  'Value is outside the calculator’s allowed range or step.',
  'Review these values. Other fields keep their example defaults. Currency is not inferred or converted; check tax, insurance and local assumptions in the card.',
  'Input preview is unavailable. Open the calculator to enter values.',
])
  assert.ok(
    corpus.some((row) => row.active && row.source === source),
    'Human-readable labels must remain translatable: ' + source,
  );
function runtime(
  locale,
  {
    assets = {},
    scripts = [],
    search = '?lang=' + locale,
    pathname = '/countdown-calculator',
    localized = false,
    fixture = null,
    translations = {},
    legacyCopy = {},
  } = {},
) {
  const document = fixture?.document || {
    documentElement: { lang: locale, hasAttribute: () => localized },
    body: {},
    readyState: 'loading',
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => ({ remove() {} }),
    head: { append: (script) => scripts.push(script) },
  };
  const window = {
    CMTranslationAssets: assets,
    CMTranslations: {
      [locale]: {
        messages: {
          'Fixed text': '固定文案',
          Annulus: locale === 'fr' ? 'Couronne circulaire' : '环形',
          'Area from two radii.':
            locale === 'fr' ? 'Aire à partir des deux rayons.' : '由两个半径计算面积。',
        },
        templates: [
          {
            pattern: '^([\\s\\S]+?) days until ([\\s\\S]+?)\\.$',
            target: '距离 {1} 还有 {0} 天。',
            indices: [0, 1],
          },
        ],
      },
    },
    CMLegacyCopy: {
      en: { '身体质量指数 BMI': 'Body mass index' },
      'zh-CN': { '身体质量指数 BMI': '错误旧文案' },
    },
    CMUiCopy: {
      en: { unitCall: 'call', unitCalls: 'calls', unitOrder: 'order', unitOrders: 'orders' },
      'zh-CN': { unitCall: '次调用', unitCalls: '次调用', unitOrder: '订单', unitOrders: '订单' },
    },
  };
  Object.assign(window.CMTranslations, translations);
  for (const [language, messages] of Object.entries(legacyCopy))
    window.CMLegacyCopy[language] = { ...window.CMLegacyCopy[language], ...messages };
  const location = {
    search,
    pathname,
    origin: 'https://example.test',
    href: 'https://example.test' + pathname + search,
  };
  const runtimeSource = fixture
    ? source.replace('    translateTree,\n', '    translateTree,\n    bidiParts,\n')
    : source;
  vm.runInNewContext(runtimeSource, {
    window,
    document,
    localStorage: { getItem: () => null },
    location,
    history: {
      state: null,
      replaceState: (_, __, value) => {
        const next = new URL(value, location.origin);
        location.href = next.href;
        location.pathname = next.pathname;
        location.search = next.search;
      },
    },
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    },
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    NodeFilter: { SHOW_TEXT: 4 },
    navigator: { language: locale },
    URLSearchParams,
    URL,
    Intl,
    ...fixture?.globals,
  });
  return window.CMI18n;
}
function domFixture(markup) {
  const $ = load(markup),
    adapted = new WeakSet(),
    observers = [],
    records = [],
    raf = [],
    listeners = new Map();
  const stats = { mutations: 0, renderCalls: 0, observerRounds: 0 };
  const connected = (node) => {
    for (let current = node; current; current = current.parent)
      if (current === $.root()[0]) return true;
    return false;
  };
  const inside = (node, root) => {
    for (let current = node; current; current = current.parent) if (current === root) return true;
    return false;
  };
  function changed(target, type) {
    if (!connected(target)) return;
    stats.mutations++;
    if (observers.some((observer) => inside(target, observer.root)))
      records.push({ target: adapt(target), type });
  }
  function adapt(node) {
    if (!node || adapted.has(node)) return node;
    adapted.add(node);
    Object.defineProperties(node, {
      nodeType: { get: () => (node.type === 'text' ? 3 : node.type === 'root' ? 9 : 1) },
      tagName: { get: () => String(node.name || '').toUpperCase() },
      parentElement: {
        get: () => (node.parent && node.parent.type !== 'root' ? adapt(node.parent) : null),
      },
      childNodes: { get: () => (node.children || []).map(adapt) },
      firstChild: { get: () => adapt(node.children?.[0]) || null },
      textContent: {
        get: () =>
          node.type === 'text'
            ? node.data
            : (node.children || []).map((child) => adapt(child).textContent).join(''),
        set: (value) => {
          if (node.type === 'text') {
            node.data = String(value);
            changed(node, 'characterData');
          } else {
            $(node).text(String(value));
            (node.children || []).forEach(adapt);
            changed(node, 'childList');
          }
        },
      },
      lang: {
        get: () => node.attribs?.lang || '',
        set: (value) => {
          node.attribs.lang = value;
        },
      },
      dir: {
        get: () => node.attribs?.dir || '',
        set: (value) => {
          node.attribs.dir = value;
        },
      },
      value: {
        get: () => node.attribs?.value || '',
        set: (value) => {
          node.attribs.value = value;
        },
      },
      dataset: {
        get: () =>
          new Proxy(
            {},
            {
              get: (_, key) =>
                node.attribs?.[
                  'data-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())
                ],
            },
          ),
      },
    });
    node.hasAttribute = (name) => Object.hasOwn(node.attribs || {}, name);
    node.getAttribute = (name) => node.attribs?.[name] ?? null;
    node.setAttribute = (name, value) => {
      node.attribs[name] = String(value);
    };
    node.matches = (selector) => $(node).is(selector);
    node.closest = (selector) => adapt($(node).closest(selector).get(0)) || null;
    node.querySelectorAll = (selector) => $(node).find(selector).toArray().map(adapt);
    node.querySelector = (selector) => node.querySelectorAll(selector)[0] || null;
    node.replaceChildren = (...children) => {
      stats.renderCalls++;
      $(node).empty();
      for (const child of children) $(node).append(child);
      (node.children || []).forEach(adapt);
      changed(node, 'childList');
    };
    node.replaceWith = (replacement) => {
      const parent = node.parent;
      $(node).replaceWith(replacement);
      adapt(replacement);
      changed(parent, 'childList');
    };
    return node;
  }
  const document = {
    documentElement: adapt($('html')[0]),
    body: adapt($('body')[0]),
    readyState: 'loading',
    querySelectorAll: (selector) => $(selector).toArray().map(adapt),
    querySelector: (selector) => adapt($(selector)[0]) || null,
    addEventListener: (name, callback) => {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    dispatchEvent: (event) => {
      for (const listener of listeners.get(event.type) || []) listener(event);
    },
    createElement: (tag) => adapt($('<' + tag + '></' + tag + '>')[0]),
    createTextNode: (value) => {
      const holder = $('<span></span>').text(value),
        node = holder[0].children[0];
      if (!node) return adapt({ type: 'text', data: '', parent: null, prev: null, next: null });
      $(node).remove();
      return adapt(node);
    },
    createTreeWalker: (root) => {
      const nodes = [];
      const visit = (node) => {
        for (const child of node.children || []) {
          if (child.type === 'text') nodes.push(adapt(child));
          else visit(child);
        }
      };
      visit(root);
      let cursor = 0;
      return { nextNode: () => nodes[cursor++] || null };
    },
    head: {
      append: () => {
        throw Error('The DOM lifecycle fixture must not request language scripts.');
      },
    },
  };
  const globals = {
    requestAnimationFrame: (callback) => {
      raf.push(callback);
      return raf.length;
    },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(root) {
        this.root = root;
        observers.push(this);
      }
    },
  };
  return {
    document,
    globals,
    stats,
    element: (selector) => document.querySelector(selector),
    all: (selector) => document.querySelectorAll(selector),
    flush: () => {
      let rounds = 0;
      while (records.length || raf.length) {
        assert.ok(++rounds <= 12, 'Real observer/translation lifecycle must converge.');
        if (records.length) {
          const batch = records.splice(0);
          for (const observer of observers)
            observer.callback(batch.filter((record) => inside(record.target, observer.root)));
        }
        for (const callback of raf.splice(0)) callback();
      }
      stats.observerRounds += rounds;
      return rounds;
    },
  };
}
const cn = runtime('zh-CN');
assert.equal(cn.translate('62 days until 2027年1月1日.'), '距离 2027年1月1日 还有 62 天。');
assert.equal(cn.translate('身体质量指数 BMI'), '身体质量指数 BMI');
assert.equal(cn.translate('Fixed text'), '固定文案');
assert.equal(cn.translate('hello@calcmintly.com'), 'hello@calcmintly.com');
assert.equal(cn.unit('USD/month'), 'USD/月');
assert.equal(cn.unit('calls/month'), '次调用/月');
assert.equal(cn.unit('USD/year'), 'USD/年');
assert.equal(cn.number(-0), '0');
const tool = {
  slug: 'annulus-calculator',
  name: 'Annulus',
  description: 'Area from two radii.',
  names: { 'zh-CN': '圆环' },
  keywords: 'ring',
};
assert.equal(cn.toolName(tool), '圆环');
assert.ok(cn.searchText(tool).includes('两个半径'));
assert.ok(cn.searchText(tool).includes('Annulus'));
const fr = runtime('fr');
assert.equal(fr.toolName(tool), 'Couronne circulaire');
assert.ok(fr.searchText(tool).includes('rayons'));
const ja = runtime('ja');
assert.equal(ja.unit('USD/month'), 'USD/月');
assert.equal(ja.unit('USD/hour'), 'USD/時間');
const languageScripts = [],
  retry = runtime('en', { assets: { de: '/assets/dist/de.test.js' }, scripts: languageScripts });
const failedLoad = retry.ensureTranslations('de');
assert.equal(languageScripts.length, 1);
languageScripts[0].onerror();
await failedLoad;
const secondLoad = retry.ensureTranslations('de');
assert.equal(languageScripts.length, 2, 'Failed language loads must be retryable');
languageScripts[1].onload();
await secondLoad;

for (const pathname of ['/de-broglie-wavelength-calculator', '/fr-test', '/id-example'])
  assert.equal(
    runtime('en', { search: '', pathname, localized: true }).language,
    'en',
    'A tool slug is not a language route',
  );
assert.equal(
  runtime('en', { search: '', pathname: '/de/de-broglie-wavelength-calculator', localized: true })
    .language,
  'de',
);
assert.equal(
  runtime('en', {
    search: '',
    pathname: '/zh-cn/de-broglie-wavelength-calculator',
    localized: true,
  }).language,
  'zh-CN',
);

const arMessages = JSON.parse(
    await fs.readFile(new URL('../src/translations/ar.json', import.meta.url), 'utf8'),
  ),
  urMessages = JSON.parse(
    await fs.readFile(new URL('../src/translations/ur.json', import.meta.url), 'utf8'),
  ),
  areaExample = Object.keys(arMessages).find((key) => key.startsWith('100 m² ÷ 0.09290304')),
  areaFaq = '1 m² = 10.76391041671 ft², because 1 ft² = 0.09290304 m² exactly.',
  chineseSource = '面积示例：20 m² = 215 ft²。',
  chineseEnglish = 'Area example: 20 m² = 215 ft².',
  chineseArabic = 'مثال المساحة: 20 m² = 215 ft².',
  followingSource = 'Second paragraph: 10 m² = 107.639 ft².',
  followingArabic = 'الفقرة التالية: 10 m² = 107.639 ft².';
assert.ok(areaExample && arMessages[areaFaq] && urMessages[areaFaq]);
const escape = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  fixture =
    domFixture(`<html lang="ar" dir="rtl" data-cm-localized-routes><body class="cm-tool"><main class="wrap">
<div class="hero"><form><input id="raw-input" value="123.45"><p id="form-math">100 m² = 1,076 ft²</p></form><output id="result">100 m² = 1,076 ft²</output></div>
<section data-cm-section="example"><p id="example"><span data-cm-source="${escape(areaExample)}">${arMessages[areaExample]}</span></p>
<p id="following"><span data-cm-source="${escape(followingSource)}">${followingArabic}</span></p>
<p id="chinese"><span data-cm-source="${escape(chineseSource)}">${chineseArabic}</span></p>
<p id="plain">رقم 7 فقط؛ هامش [1] بتاريخ 2026-10-31.</p><code id="code">100 m² = 1,076 ft²</code><pre id="pre">100 m² = 1,076 ft²</pre>
<p id="protected" data-cm-no-translate>100 m² = 1,076 ft²</p><p><bdi id="already" dir="ltr">1 m² = 10 ft²</bdi></p><p id="already-ltr" dir="ltr">1 m² = 10 ft²</p>
</section><section data-cm-section="faq"><p id="faq"><span data-cm-source="${escape(areaFaq)}">${arMessages[areaFaq]}</span></p></section>
</main></body></html>`),
  rtl = runtime('ar', {
    fixture,
    pathname: '/ar/area-converter',
    search: '',
    translations: {
      ar: { messages: { ...arMessages, [followingSource]: followingArabic }, templates: [] },
      ur: { messages: urMessages, templates: [] },
    },
    legacyCopy: { en: { [chineseSource]: chineseEnglish }, ar: { [chineseSource]: chineseArabic } },
  });
const parts = rtl.bidiParts(arMessages[areaExample]);
assert.equal(
  parts.map((part) => part.text).join(''),
  arMessages[areaExample],
  'Splitting must preserve every character in memory order.',
);
assert.ok(
  parts.some((part) => part.ltr && part.text === '100 m² ÷ 0.09290304 m²/ft² = 1,076.391042 ft²'),
);
for (const part of parts.filter((part) => part.ltr))
  assert.ok(
    !/[\p{Script=Arabic}]/u.test(part.text),
    'Ordinary Arabic remains outside the LTR isolate.',
  );
for (const text of ['7', '[1]', '2026-10-31', 'رقم 7 فقط', 'word 100 people'])
  assert.ok(!rtl.bidiParts(text).some((part) => part.ltr), text);
for (const text of [
  '1 m² = 10.7639 ft²',
  '(100 + 20) ÷ 3',
  '١٠٠ m² ÷ ٢ = ٥٠ m²',
  '12 m²',
  '4,046.8564224 m²',
]) {
  const split = rtl.bidiParts(text);
  assert.equal(split.map((part) => part.text).join(''), text);
  assert.ok(
    split.some((part) => part.ltr),
    text,
  );
}
assert.deepEqual(
  JSON.parse(JSON.stringify(rtl.bidiParts('100 m²/2 = 50 m²'))),
  [{ text: '100 m²/2 = 50 m²', ltr: true }],
  'A numeric divisor must not be consumed as part of a unit token.',
);
fixture.document.addEventListener('cm:language', () => rtl.translateTree(fixture.element('main')));
fixture.document.dispatchEvent({ type: 'DOMContentLoaded' });
assert.ok(fixture.flush() <= 3, 'Initial wrapping and observer follow-up must converge.');
assert.equal(fixture.element('#example').textContent, arMessages[areaExample]);
assert.equal(
  fixture.element('#following').textContent,
  followingArabic,
  'Do not skip the next paragraph after replacing a text node.',
);
assert.equal(fixture.element('#chinese').textContent, chineseArabic);
assert.equal(fixture.element('#faq').textContent, arMessages[areaFaq]);
for (const selector of ['#example', '#following', '#chinese', '#faq'])
  assert.ok(fixture.all(selector + ' bdi[dir="ltr"]').length > 0);
for (const selector of [
  '.hero',
  '#plain',
  '#code',
  '#pre',
  '#protected',
  '#already',
  '#already-ltr',
])
  assert.equal(
    fixture.all(selector + ' [data-cm-bidi-source]').length,
    0,
    'Excluded region: ' + selector,
  );
assert.equal(fixture.element('#raw-input').value, '123.45');
const initialSources = fixture
    .all('[data-cm-bidi-source]')
    .map((node) => node.getAttribute('data-cm-bidi-source')),
  initialBdi = fixture.all('[data-cm-bidi-source] bdi').length,
  stableMutations = fixture.stats.mutations,
  stableRenders = fixture.stats.renderCalls;
for (let repeat = 0; repeat < 3; repeat++) {
  rtl.apply();
  rtl.translateTree(fixture.element('main'));
  fixture.flush();
}
assert.equal(
  fixture.stats.mutations,
  stableMutations,
  'Same text/structure must not mutate on repeated apply.',
);
assert.equal(
  fixture.stats.renderCalls,
  stableRenders,
  'No repeated replaceChildren on already-rendered isolates.',
);
rtl.setLanguage('en');
fixture.flush();
assert.equal(fixture.element('#example').textContent, areaExample);
assert.equal(fixture.element('#faq').textContent, areaFaq);
assert.equal(
  fixture.element('#chinese').textContent,
  chineseEnglish,
  'Preserve the original authored Chinese source for later English translation.',
);
assert.equal(fixture.all('[data-cm-bidi-source] bdi').length, 0);
assert.ok(!/[\p{Script=Arabic}]/u.test(fixture.element('#example').textContent));
rtl.setLanguage('ar');
assert.ok(fixture.flush() <= 3);
assert.equal(fixture.element('#example').textContent, arMessages[areaExample]);
assert.equal(fixture.element('#faq').textContent, arMessages[areaFaq]);
assert.equal(fixture.element('#chinese').textContent, chineseArabic);
assert.deepEqual(
  fixture.all('[data-cm-bidi-source]').map((node) => node.getAttribute('data-cm-bidi-source')),
  initialSources,
);
assert.equal(
  fixture.all('[data-cm-bidi-source] bdi').length,
  initialBdi,
  'No duplicate isolates after ar-en-ar.',
);
assert.equal(fixture.all('[data-cm-bidi-source] [data-cm-bidi-source]').length, 0);
assert.equal(fixture.element('#raw-input').value, '123.45');
rtl.setLanguage('ur');
fixture.flush();
assert.equal(fixture.element('#example').textContent, urMessages[areaExample]);
assert.ok(fixture.all('#example bdi[dir="ltr"]').length > 0);

console.log(
  'Translation runtime PASS: dates/authored Chinese/email/rate units/negative zero; real RTL guide splitting, full-source ar-en-ar/ur lifecycle, unchanged input, exclusions, repeat no-op and observer convergence.',
);
