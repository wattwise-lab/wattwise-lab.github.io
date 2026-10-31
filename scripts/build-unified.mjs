import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { transform } from 'esbuild';
import { renderExpanded } from './render-expanded.mjs';
import { renderRanking } from './render-ranking.mjs';
import { localizeSite } from './localize-site.mjs';
import { renderEmbeds } from './render-embeds.mjs';
import { compileTranslations } from './compile-translations.mjs';
import { finishMetadata, secureMarkup } from './site-metadata.mjs';
import { upgradeCorePage } from './upgrade-core-pages.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => fs.readFile(new URL(p, root), 'utf8');
const write = (p, text) => fs.writeFile(new URL(p, root), text);
const exists = async (p) =>
  fs.access(new URL(p, root)).then(
    () => true,
    () => false,
  );
const previousManifest = (await exists('src/asset-manifest.json'))
  ? JSON.parse(await read('src/asset-manifest.json'))
  : {};
const previousSources = new Map(
  Object.entries(previousManifest).map(([source, output]) => [output.replace(/^\//, ''), source]),
);
const sourceFor = (p) => previousSources.get(p) || p;
await fs.mkdir(new URL('src/', root), { recursive: true });
for (const name of ['cm-unit-contracts', 'cm-form-state'])
  await write(
    'assets/' + name + '.js',
    (
      await transform(await read('src/' + name + '.ts'), {
        loader: 'ts',
        target: 'es2022',
        legalComments: 'inline',
      })
    ).code,
  );
await fs.mkdir(new URL('assets/dist/', root), { recursive: true });
await fs.mkdir(new URL('assets/legacy-models/', root), { recursive: true });
const context = { window: {} };
for (const file of [
  'cm-home-copy-v3.js',
  'cm-legacy-copy.js',
  'cm-ui-copy.js',
  'cm-keypad-copy.js',
])
  vm.runInNewContext(await read('assets/' + file), context);
vm.runInNewContext(await read('assets/merchant-i18n/en.js'), context);
const C = context.window.CMHomeCopy,
  U = context.window.CMUiCopy,
  L = context.window.CMLegacyCopy;
const locales = Object.keys(U),
  names = {
    en: 'English',
    'zh-CN': '简体中文',
    hi: 'हिन्दी',
    es: 'Español',
    ar: 'العربية',
    fr: 'Français',
    bn: 'বাংলা',
    pt: 'Português',
    id: 'Bahasa Indonesia',
    ur: 'اردو',
    ru: 'Русский',
    de: 'Deutsch',
    ja: '日本語',
    pcm: 'Nigerian Pidgin',
    mr: 'मराठी',
    vi: 'Tiếng Việt',
    te: 'తెలుగు',
    sw: 'Kiswahili',
    ha: 'Hausa',
    tr: 'Türkçe',
  };
const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const t = (lang, key) => U[lang]?.[key] || C[lang]?.[key] || U.en[key] || C.en[key] || key;
const tr = (lang, zh) => (lang === 'zh-CN' ? zh : L[lang]?.[zh] || L.en[zh] || zh);
const href = (p, lang) =>
  p === '/'
    ? lang === 'en'
      ? '/'
      : '/' + lang.toLowerCase() + '/'
    : p + (p.includes('?') ? '&' : '?') + 'lang=' + lang;
if (!(await exists('src/catalog-base.json'))) {
  const s = await read('assets/cm-catalog-v3.js');
  await write(
    'src/catalog-base.json',
    JSON.stringify(
      JSON.parse(
        s
          .slice(s.indexOf('=') + 1)
          .trim()
          .replace(/;$/, ''),
      ),
      null,
      2,
    ) + '\n',
  );
}
const base = JSON.parse(await read('src/catalog-base.json'));
const pinned = [
  ['basic-calculator', 'basic', '▦'],
  ['scientific-calculator', 'scientific', 'ƒ'],
  ['percentage-calculator', 'percentage', '%'],
  ['loan-calculator', 'loan', '$'],
  ['mortgage-calculator', 'mortgage', '⌂'],
  ['bmi-calculator', 'bmi', '+'],
  ['age-calculator', 'age', '◷'],
  ['unit-converter', 'unit', '⇄'],
];
const keypadCatalog = pinned.slice(0, 2).map(([slug, key]) => ({
  slug,
  name: U.en[key],
  names: Object.fromEntries(locales.map((l) => [l, U[l][key]])),
  domain: 'Math and Time',
  keywords:
    key === 'basic'
      ? 'basic standard normal pocket handheld arithmetic add subtract multiply divide 普通 实体 四则 按键'
      : 'scientific expression parentheses sine cosine logarithm square root 科学 函数 括号',
  new: true,
  description:
    key === 'basic'
      ? 'A real pocket keypad with exact decimal arithmetic, contextual percentages, memory and calculation history.'
      : 'Evaluate expressions with parentheses, powers, roots, trigonometry, degrees or radians, and calculation history.',
  descriptions: {
    'zh-CN':
      key === 'basic'
        ? '像实体计算器一样按键计算，支持加减乘除、百分比、正负号、记忆和计算历史。'
        : '输入带括号的算式，计算乘方、开方、三角函数和对数，支持角度与弧度。',
  },
  priority: key === 'basic' ? 1 : 2,
}));
let expanded = [];
if (await exists('assets/models/core.js')) {
  const mctx = {};
  vm.createContext(mctx);
  vm.runInContext(await read('assets/cm-data-core.js'), mctx);
  vm.runInContext(await read('assets/models/core.js'), mctx);
  for (const file of (await fs.readdir(new URL('assets/models/', root)))
    .filter((x) => x !== 'core.js' && x.endsWith('.js'))
    .sort()) {
    const before = mctx.CMModels.models.length;
    vm.runInContext(await read('assets/models/' + file), mctx);
    for (const model of mctx.CMModels.models.slice(before)) {
      model.source = file;
      model.sourceHash = createHash('sha256')
        .update(
          (await read('assets/cm-data-core.js')) +
            (await read('assets/models/core.js')) +
            (await read('assets/models/' + file)),
        )
        .digest('hex');
    }
  }
  expanded = mctx.CMModels.models;
}
let original = [];
if (await exists('src/original-catalog.json'))
  original = JSON.parse(await read('src/original-catalog.json'));
const additions = expanded.map((m) => ({
  slug: m.slug,
  name: m.name.split('|')[0],
  names: { 'zh-CN': m.name.split('|')[1] },
  domain: m.domain,
  keywords: m.name.replaceAll('|', ' ') + ' ' + m.slug,
  new: true,
  description: m.purpose.split('|')[0],
  descriptions: { 'zh-CN': m.purpose.split('|')[1] },
}));
const catalog = [...keypadCatalog, ...base, ...additions, ...original];
if (new Set(catalog.map((x) => x.slug)).size !== catalog.length)
  throw Error('Duplicate catalog slug');
const early = [
  ...pinned.map((x) => x[0]),
  'discount-calculator',
  'tip-calculator',
  'compound-interest-calculator',
  'date-difference-calculator',
  'bmr-calculator',
  'tdee-calculator',
  'calories-burned-calculator',
  'currency-converter',
  'temperature-converter',
  'weight-converter',
  'area-converter',
  'volume-converter',
  'fuel-cost-calculator',
  'fuel-economy-calculator',
  'sales-tax-calculator',
  'gross-margin-calculator',
  'profit-calculator',
  'break-even-calculator',
  'savings-goal-calculator',
  'credit-card-payoff-calculator',
  'early-loan-payoff-calculator',
  'refinance-calculator',
  'rent-vs-buy-calculator',
  'fraction-calculator',
  'mean-median-mode-calculator',
  'standard-deviation-calculator',
  'quadratic-equation-calculator',
  'right-triangle-calculator',
  'circle-calculator',
  'gpa-calculator',
  'workday-calculator',
  'pace-calculator',
  'concrete-calculator',
  'paint-calculator',
  'electricity-cost-calculator',
  'merchant-profit-planner',
  'freelance-real-rate',
  'plan-collision-calculator',
  'life-single-point-failure-calculator',
  'future-commitment-lock-calculator',
];
const selected = [...early, ...catalog.map((x) => x.slug).filter((slug) => !early.includes(slug))];
for (const x of catalog) x.priority = selected.indexOf(x.slug) + 1;
await write('src/selection-priority.json', JSON.stringify(selected, null, 2) + '\n');
for (const lang of locales) C[lang].intro = C[lang].intro.replace(/\d+/g, String(catalog.length));
C['zh-CN'].workspace = '工作台';
await write('assets/cm-home-copy-v3.js', 'window.CMHomeCopy = ' + JSON.stringify(C) + ';\n');
await write('assets/cm-catalog-v3.js', 'window.CMCatalog = ' + JSON.stringify(catalog) + ';\n');
const manifest = {};
async function asset(p) {
  if (manifest[p]) return manifest[p];
  let text = await read(p);
  if (p.endsWith('.js') || p.endsWith('.css')) {
    const result = await transform(text, {
      loader: p.endsWith('.css') ? 'css' : 'js',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
      legalComments: 'eof',
      target: 'es2022',
    });
    text = result.code;
  }
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 12),
    name = path.basename(p),
    dot = name.lastIndexOf('.'),
    output = 'assets/dist/' + name.slice(0, dot) + '.' + hash + name.slice(dot);
  await write(output, text);
  manifest[p] = '/' + output;
  return manifest[p];
}
await compileTranslations(root, locales);
const translationAssets = {};
for (const locale of locales.filter((l) => l !== 'en'))
  translationAssets[locale] = await asset('assets/translations/' + locale + '.js');
await write(
  'assets/cm-translation-index.js',
  'window.CMTranslationAssets=' + JSON.stringify(translationAssets) + ';\n',
);
const commonSourceScripts = [
  'assets/cm-catalog-v3.js',
  'assets/cm-data-core.js',
  'assets/cm-form-state.js',
  'assets/cm-locale-core.js',
  'assets/cm-metadata-core.js',
  'assets/cm-info-metadata.js',
  'assets/cm-home-copy-v3.js',
  'assets/cm-legacy-copy.js',
  'assets/cm-ui-copy.js',
  'assets/cm-keypad-copy.js',
  'assets/cm-translation-index.js',
  'assets/cm-i18n.js',
  'assets/cm-usage.js',
];
await fs.mkdir(new URL('assets/catalog-slices/', root), { recursive: true });
for (const tool of catalog)
  await write(
    'assets/catalog-slices/' + tool.slug + '.js',
    'window.CMCatalog=' + JSON.stringify([tool]) + ';\n',
  );
await write(
  'assets/cm-common.js',
  (
    await Promise.all(commonSourceScripts.filter((f) => f !== 'assets/cm-catalog-v3.js').map(read))
  ).join('\n;\n'),
);
const commonScripts = ['assets/cm-catalog-v3.js', 'assets/cm-common.js'];
const isCommon = (file) =>
  commonSourceScripts.includes(file) ||
  commonScripts.includes(file) ||
  file.startsWith('assets/catalog-slices/');
async function scriptTags(files, catalogSlug = '') {
  const scoped = files.map((f) =>
    f === 'assets/cm-catalog-v3.js' && catalog.some((x) => x.slug === catalogSlug)
      ? 'assets/catalog-slices/' + catalogSlug + '.js'
      : f,
  );
  return (
    await Promise.all(
      [...new Set(scoped)].map(
        async (f) => '<script defer src="' + (await asset(f)) + '"></script>',
      ),
    )
  ).join('');
}
function shellHeader(lang) {
  const link = (p, key) =>
    `<a href="${href(p, lang)}" data-cm-href="${p}" data-cm-i18n="${key}">${esc(t(lang, key))}</a>`;
  const links =
    link('/directory', 'all') +
    link('/ranking', 'ranking') +
    link('/workspace', 'workspace') +
    link('/methodology', 'methods');
  return `<a class="cm-site-skip" href="#main-content" data-cm-i18n="skip">${esc(t(lang, 'skip'))}</a><header class="cm-site-header"><div class="cm-site-header__inner"><a class="cm-site-header__brand" data-cm-href="/" href="${href('/', lang)}" aria-label="CalcMintly"><img src="/assets/cm-mark-v3.svg" alt="" width="32" height="32"><span>calc<b>mintly</b></span></a><nav class="cm-site-header__nav" data-cm-label="menu" aria-label="${esc(t(lang, 'menu'))}">${links}</nav><div class="cm-site-header__end"><label class="cm-sr-only" for="cm-site-language" data-cm-i18n="language">${esc(t(lang, 'language'))}</label><select class="cm-site-header__language" id="cm-site-language" data-cm-language>${locales.map((l) => `<option value="${l}"${l === lang ? ' selected' : ''}>${names[l]}</option>`).join('')}</select><details class="cm-site-header__mobile"><summary data-cm-label="menu" aria-label="${esc(t(lang, 'menu'))}"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></summary><nav aria-label="${esc(t(lang, 'menu'))}">${links + link('/basic-calculator', 'basic') + link('/scientific-calculator', 'scientific') + link('/about', 'about')}</nav></details></div></div></header>`;
}
function shellFooter(lang) {
  return `<footer class="cm-site-footer"><div><p>© CalcMintly</p><p data-cm-i18n="note">${esc(t(lang, 'note'))}</p></div><nav>${[
    ['/methodology', 'methods'],
    ['/about', 'about'],
    ['/privacy', 'privacy'],
    ['/terms', 'terms'],
    ['/contact', 'contact'],
  ]
    .map(
      ([p, k]) =>
        `<a data-cm-href="${p}" data-cm-i18n="${k}" href="${href(p, lang)}">${esc(t(lang, k))}</a>`,
    )
    .join('')}</nav></footer>`;
}
function schemas(title, slug) {
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      url: 'https://calcmintly.com/' + slug,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      browserRequirements: 'Requires JavaScript for interactive calculations.',
    }).replaceAll('<', '\\u003c') +
    '</script>'
  );
}
async function head({
  title,
  description,
  canonical,
  lang = 'en',
  styles = [],
  scripts = [],
  alternates = '',
  schema = '',
}) {
  return `<!doctype html><html lang="${lang}" dir="${['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#126756"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="https://calcmintly.com${canonical}">${alternates}<meta property="og:type" content="website"><meta property="og:site_name" content="CalcMintly"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://calcmintly.com${canonical}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">${(await Promise.all([...styles, 'assets/cm-shell.css'].map(async (f) => '<link rel="stylesheet" href="' + (await asset(f)) + '">'))).join('')}${await scriptTags([...commonScripts, ...scripts, 'assets/cm-shell.js'], canonical.split('/').filter(Boolean).at(-1))}${schema}</head>`;
}
const toolName = (tool, lang) => tool.names?.[lang] || tool.name;
const icons = {
  Finance: '$',
  Business: '%',
  Health: '+',
  Converters: '⇄',
  'Math and Time': '÷',
  'Home and Everyday': '⌂',
  'AI and Work-life': 'AI',
  'Digital and Technology': '01',
  Science: 'Ω',
};
const originalSlugs = [
  'plan-collision-calculator',
  'life-single-point-failure-calculator',
  'future-commitment-lock-calculator',
];
function originalCards(lang) {
  return originalSlugs
    .map((slug, k) => {
      const x = catalog.find((x) => x.slug === slug);
      return `<a class="cm-originals__tool" data-cm-href="/${slug}" href="${href('/' + slug, lang)}"><span class="cm-originals__index" aria-hidden="true">0${k + 1}</span><h3>${esc(toolName(x, lang))}</h3><p>${esc(x.descriptions?.[lang] || x.description)}</p><span class="cm-originals__open">${esc(t(lang, 'calculate'))} →</span></a>`;
    })
    .join('');
}
const svgIcon = (key) => {
  const paths = {
    basic:
      'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 4h8M8 11h1m3 0h1m3 0h.1M8 15h1m3 0h1m3 0h.1M8 18h1m3 0h1m3 0h.1',
    scientific: 'M6 20l5-16h7M8 11h9',
    percentage: 'M5 19 19 5M8 6a2 2 0 1 0 0 .1M17 16a2 2 0 1 0 0 .1',
    loan: 'M4 6h16v13H4ZM4 10h16M7 15h3M16 3v5',
    mortgage: 'm3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7',
    bmi: 'M4 8h16v13H4ZM8 3h8v5M10 13h4M12 11v6',
    age: 'M4 6h16v15H4ZM8 3v6M16 3v6M4 11h16M8 15h2M14 15h2',
    unit: 'M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4',
  };
  return `<svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[key] || paths.basic}"/></svg>`;
};
function homeCards(lang) {
  return [...catalog]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 12)
    .map(
      (x) =>
        `<a class="cm-directory__tool" href="${href('/' + x.slug, lang)}"><span aria-hidden="true">${icons[x.domain]}</span><small>${esc(C[lang].domains[x.domain] || x.domain)}</small><h3>${esc(toolName(x, lang))}</h3><p>${esc(x.descriptions?.[lang] || x.description)}</p><span>${esc(t(lang, 'calculate'))} →</span></a>`,
    )
    .join('');
}
const homeKeys = {
  intro: '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。',
  headline: '答案不该藏在',
  em: '复杂公式',
  workTitle: '把多个计算器放在同一工作台',
  workIntro: '最多组合四个计算器，保留各自输入，按需把结果带入下一项计算。',
};
for (const lang of locales) {
  const seo = `Free Online Calculators for Everyday Life | CalcMintly`,
    desc = `Explore ${catalog.length} free calculators for everyday maths, finance, health and conversions. Use a real keypad, compare tools in one workspace and check the formulas.`;
  const alternatives =
    locales
      .map(
        (l) =>
          `<link rel="alternate" hreflang="${l}" href="https://calcmintly.com${l === 'en' ? '/' : '/' + l.toLowerCase() + '/'}">`,
      )
      .join('') + '<link rel="alternate" hreflang="x-default" href="https://calcmintly.com/">';
  const main = `<main class="cm-home" id="main-content" data-cm-home><section class="cm-home__hero"><span class="cm-home__eyebrow">${esc(tr(lang, '一个入口，解决日常计算'))}</span><h1>${esc(tr(lang, homeKeys.headline))}<br><em>${esc(tr(lang, homeKeys.em))}</em>${lang === 'zh-CN' ? '里。' : '.'}</h1><p>${esc(tr(lang, homeKeys.intro))}</p><label class="cm-home__search" for="cm-home-search"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5"></path></svg><span class="cm-sr-only">${esc(t(lang, 'searchLabel'))}</span><input type="search" id="cm-home-search" autocomplete="off" maxlength="120" placeholder="${esc(t(lang, 'search'))}"></label></section><section class="cm-pinned" aria-labelledby="cm-pinned-heading"><div class="cm-pinned__heading"><h2 id="cm-pinned-heading">${esc(t(lang, 'pinnedTitle'))}</h2><p>${esc(t(lang, 'pinnedHint'))}</p></div><div class="cm-pinned__grid">${pinned.map(([slug, key]) => `<a class="cm-pinned__tool" href="${href('/' + slug, lang)}"><span aria-hidden="true">${svgIcon(key)}</span><strong>${esc(t(lang, key))}</strong></a>`).join('')}</div></section><section class="cm-home__promo"><div><h2>${esc(tr(lang, homeKeys.workTitle))}</h2><p>${esc(tr(lang, homeKeys.workIntro))}</p></div><a href="${href('/workspace', lang)}">${esc(t(lang, 'workspace'))} →</a></section><section class="cm-originals" aria-labelledby="cm-originals-title"><div class="cm-originals__heading"><h2 id="cm-originals-title" data-cm-i18n="originalsTitle">${esc(t(lang, 'originalsTitle'))}</h2><p data-cm-i18n="originalsHint">${esc(t(lang, 'originalsHint'))}</p></div><div class="cm-originals__grid">${originalCards(lang)}</div></section><section class="cm-directory" id="calculators"><div class="cm-directory__heading"><div><span class="cm-home__eyebrow">${esc(tr(lang, '计算器目录'))}</span><h2 tabindex="-1" id="cm-home-heading">${esc(tr(lang, '从问题出发，不从公式出发'))}</h2></div><p>${esc(tr(lang, '选择一个工具，修改任何数值，结果都会立即更新。'))}</p></div><div class="cm-directory__tabs" role="tablist" aria-label="${esc(t(lang, 'categories'))}">${[['all', t(lang, 'all')], ...Object.keys(C.en.domains).map((d) => [d, C[lang].domains[d] || d])].map(([d, n], i) => `<button type="button" role="tab" data-cm-category="${d}" aria-selected="${i === 0}">${esc(n)}</button>`).join('')}</div><div class="cm-directory__grid" id="cm-home-grid">${homeCards(lang)}</div><nav class="cm-directory__pager" aria-label="${esc(t(lang, 'ranking'))}"><button type="button" id="cm-home-prev" data-cm-i18n="previous" disabled>${esc(t(lang, 'previous'))}</button><span id="cm-home-position" role="status" aria-live="polite">1–12 / ${catalog.length}</span><button type="button" id="cm-home-next" data-cm-i18n="next">${esc(t(lang, 'next'))}</button><a href="${href('/directory', lang)}">${esc(t(lang, 'all'))} · ${catalog.length}</a></nav></section><section class="cm-home__standards"><span class="cm-home__eyebrow">CALCMINTLY</span><h2>${esc(tr(lang, '不只给一个数字，还告诉你数字怎么来的。'))}</h2><div class="cm-home__principles">${[
    ['实时反馈', '没有“计算”按钮。输入变化，结果、图表和提示同步更新。'],
    ['公式透明', '显示计算方法、默认值和适用限制，方便检查和复算。'],
    ['情境解释', '把结果转换成可行动的区间和提示，而不是制造伪精确。'],
  ]
    .map(([h, p]) => `<article><h3>${esc(tr(lang, h))}</h3><p>${esc(tr(lang, p))}</p></article>`)
    .join(
      '',
    )}</div></section><section class="cm-home__faq"><h2>${esc(tr(lang, '使用前，你可能想知道'))}</h2>${[
    ['这些计算器免费吗？', '是。首发工具无需注册即可使用。'],
    ['数据会被上传吗？', '当前工具主要在浏览器端计算，我们不会接收你输入的数值。'],
    [
      '结果能替代专业意见吗？',
      '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。',
    ],
  ]
    .map(
      ([q, a]) =>
        `<details><summary>${esc(tr(lang, q))}</summary><p>${esc(tr(lang, a))}</p></details>`,
    )
    .join('')}</section></main>`;
  const html =
    (await head({
      title: seo,
      description: desc,
      canonical: lang === 'en' ? '/' : '/' + lang.toLowerCase() + '/',
      lang,
      styles: ['assets/cm-home.css'],
      scripts: ['assets/cm-home-app.js'],
      alternates: alternatives,
      schema:
        '<script type="application/ld+json">' +
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'CalcMintly',
          url: 'https://calcmintly.com/',
        }).replaceAll('<', '\\u003c') +
        '</script>',
    })) + `<body class="cm-unified">${shellHeader(lang)}${main}${shellFooter(lang)}</body></html>`;
  await fs.mkdir(new URL(lang.toLowerCase() + '/', root), { recursive: true });
  await write(lang.toLowerCase() + '/index.html', html);
  if (lang === 'en')
    await write(
      'index.html',
      html.replace(
        '<link rel="canonical" href="https://calcmintly.com/en/">',
        '<link rel="canonical" href="https://calcmintly.com/">',
      ),
    );
}
for (const [slug, key] of pinned.slice(0, 2)) {
  const science = key === 'scientific';
  const b = (symbol, value, cls = '', label = '') =>
    `<button type="button" data-cm-no-translate data-key="${esc(value)}" class="${cls}"${label ? ' data-cm-label="' + label + '" aria-label="' + esc(U.en[label]) + '"' : ''}>${symbol}</button>`;
  const keys = [
    ['CE', 'CE', 'clear', 'clearEntry'],
    ['AC', 'AC', 'clear', 'allClear'],
    ['⌫', 'back', '', 'backspace'],
    ['÷', '/', 'operator', ''],
    ['7', '7', '', ''],
    ['8', '8', '', ''],
    ['9', '9', '', ''],
    ['×', '*', 'operator', ''],
    ['4', '4', '', ''],
    ['5', '5', '', ''],
    ['6', '6', '', ''],
    ['−', '-', 'operator', ''],
    ['1', '1', '', ''],
    ['2', '2', '', ''],
    ['3', '3', '', ''],
    ['+', '+', 'operator', ''],
    ['±', 'sign', '', 'sign'],
    ['0', '0', '', ''],
    ['.', '.', '', ''],
    ['=', '=', 'equals', 'calculate'],
  ];
  const scientificKeys = [
    ['(', '('],
    [')', ')'],
    ['xʸ', '^'],
    ['√', 'sqrt('],
    ['x²', '^2'],
    ['sin', 'sin('],
    ['cos', 'cos('],
    ['tan', 'tan('],
    ['ln', 'ln('],
    ['log', 'log('],
    ['asin', 'asin('],
    ['acos', 'acos('],
    ['atan', 'atan('],
    ['π', 'pi'],
    ['e', 'e'],
    ['|x|', 'abs('],
    ['∛', 'cbrt('],
    ['n!', '!'],
    ['%', '%'],
    ['Ans', 'Ans'],
  ];
  const main = `<main class="kp-wrap" id="main-content"><div class="kp-intro"><span>CALCMINTLY</span><h1 data-cm-i18n="${key}">${U.en[key]}</h1><p data-cm-i18n="${science ? 'scientificDescription' : 'basicDescription'}">${esc(U.en[science ? 'scientificDescription' : 'basicDescription'])}</p><a data-cm-href="/workspace?add=${slug}" href="/workspace?add=${slug}" data-cm-i18n="addWorkspace">${U.en.addWorkspace}</a></div><div class="kp-layout"><section class="kp-machine${science ? ' kp-scientific' : ''}" data-cm-label="${key}" aria-label="${U.en[key]}"><div class="kp-top"><strong>CALCMINTLY</strong><span class="kp-mode" data-cm-i18n="${key}">${U.en[key]}</span></div><div class="kp-screen" dir="ltr"><span class="kp-memory" id="kp-memory" hidden>M</span>${science ? '<label for="kp-input" class="cm-sr-only" data-cm-i18n="expression">Expression</label><input class="kp-input" id="kp-input" type="text" inputmode="text" dir="ltr" autocomplete="off" spellcheck="false" maxlength="500" aria-describedby="kp-error" placeholder="(2 + 3) × 4">' : '<div class="kp-expression" id="kp-expression"></div>'}<output class="kp-value big" id="kp-result" role="status" aria-live="polite" aria-atomic="true">0</output></div><div class="kp-memory-keys">${[
    ['MC', 'MC', 'memoryClear'],
    ['MR', 'MR', 'memoryRecall'],
    ['M+', 'M+', 'memoryAdd'],
    ['M−', 'M-', 'memorySubtract'],
  ]
    .map(([s, k, l]) => b(s, k, '', l))
    .join(
      '',
    )}</div>${science ? `<fieldset class="kp-angle"><legend class="cm-sr-only">° / rad</legend><label><input type="radio" name="kp-angle" id="kp-deg" checked><span data-cm-i18n="degree">Degrees</span></label><label><input type="radio" name="kp-angle" id="kp-rad"><span data-cm-i18n="radian">Radians</span></label></fieldset><div class="kp-science">${scientificKeys.map(([s, k]) => b(s, k)).join('')}</div>` : `<div class="kp-memory-keys">${b('%', '%', '', 'percentKey') + b('√', 'sqrt', '', 'squareRoot') + b('1/x', 'reciprocal', '', 'reciprocal') + b('±', 'sign', '', 'sign')}</div>`}<div class="kp-keys">${keys.map(([s, k, c, l]) => b(s, k, c, l)).join('')}</div><p class="kp-note" id="kp-error" role="status"></p><div class="kp-copy"><button id="kp-copy" type="button" data-cm-i18n="copyResult">Copy result</button><span id="kp-copy-status" role="status"></span></div><p class="kp-note" data-cm-i18n="note">${esc(t('en', 'note'))}</p></section><aside class="kp-history"><div class="kp-history-head"><h2 data-cm-i18n="history">History</h2><button class="kp-clear-history" id="kp-clear-history" type="button" data-cm-i18n="clearHistory">Clear history</button></div><p class="kp-empty" id="kp-empty" data-cm-i18n="emptyHistory">${U.en.emptyHistory}</p><ol class="kp-history-list" id="kp-history-list"></ol></aside></div><section class="kp-guide"><h2 data-cm-i18n="help">${U.en.help}</h2><p>⌨ 0–9 · + − * / · Enter = · Backspace ⌫ · Escape AC · Delete CE</p><h2 data-cm-i18n="formula">Formula</h2>${science ? '<p><code>2 + 3 × 4 = 14</code> · <code>(2 + 3) × 4 = 20</code></p><p><code>-2^2 = -4</code> · <code>(-2)^2 = 4</code> · <code>2^3^2 = 512</code></p><p><code>sin(30°) = 0.5</code> · <code>sin(π/2 rad) = 1</code> · <code>10% = 0.1</code></p>' : '<p><code>2 + 3 × 4 → (2 + 3) × 4 = 20</code></p><p><code>200 + 10% = 220</code> · <code>200 × 10% = 20</code></p><p><code>0.1 + 0.2 = 0.3</code> · <code>5 + 2 = = → 9</code></p>'}<h2 data-cm-i18n="scope">Scope and limitations</h2><p data-cm-i18n="${science ? 'scientificScope' : 'basicScope'}">${esc(U.en[science ? 'scientificScope' : 'basicScope'])}</p><p><a href="/${science ? 'basic' : 'scientific'}-calculator" data-cm-href="/${science ? 'basic' : 'scientific'}-calculator" data-cm-i18n="${science ? 'basic' : 'scientific'}">${U.en[science ? 'basic' : 'scientific']}</a></p></section></main>`;
  const desc = keypadCatalog.find((x) => x.slug === slug).description;
  await write(
    slug + '.html',
    (await head({
      title: U.en[key] + ' with Keypad, Memory & History | CalcMintly',
      description: desc,
      canonical: '/' + slug,
      styles: ['assets/cm-keypad.css'],
      scripts: ['assets/cm-keypad-core.js', 'assets/cm-keypad-app.js'],
      schema: schemas(U.en[key], slug),
    })) +
      `<body class="cm-unified" data-keypad="${science ? 'scientific' : 'basic'}">${shellHeader('en')}${main}${shellFooter('en')}</body></html>`,
  );
}

for (const model of expanded)
  await write(
    model.slug + '.html',
    await renderExpanded(model, {
      head,
      header: shellHeader,
      footer: shellFooter,
      asset,
      schemas,
      catalog,
    }),
  );

// Upgrade the retained calculator models, preserving separately verified formula fixes.
for (const tool of base) {
  const slug = tool.slug,
    $ = load(await read(slug + '.html'));
  upgradeCorePage($, slug);
  const mainHeading = $('.wrap h1').first();
  mainHeading.removeAttr('data-cm-pair').text(tool.name);
  $('.wrap>.card').each((_, element) => {
    const heading = $(element).find('h2').first().text().trim(),
      key = {
        Formula: 'formula',
        'Worked example': 'example',
        'Scope and limitations': 'scope',
        FAQ: 'faq',
        'Related tools': 'related',
      }[heading];
    if (key) $(element).attr('data-cm-section', key);
  });
  $('a[href]').each((_, element) => {
    const e = $(element),
      raw = e.attr('href');
    try {
      const u = new URL(raw, 'https://calcmintly.com');
      if (u.hostname === 'calcmintly.com' && !raw.startsWith('#'))
        e.attr('href', u.pathname + u.search + u.hash).attr(
          'data-cm-href',
          u.pathname + u.search + u.hash,
        );
    } catch {}
  });
  $('[data-cm-section=related] a[href]').each((_, element) => {
    const href = $(element).attr('href'),
      related = catalog.find((item) => '/' + item.slug === href?.split(/[?#]/)[0]);
    if (related) $(element).text(related.name);
  });
  const purpose = $('.wrap>.sub').first();
  if (purpose.length) {
    purpose.text(tool.description);
    if (tool.descriptions?.['zh-CN'])
      purpose.attr('data-cm-pair', tool.description + '|' + tool.descriptions['zh-CN']);
  }
  $('.hero input[type=number]').each((_, element) => {
    const input = $(element);
    if (!input.attr('max'))
      input.attr('max', ['years', 'term'].includes(input.attr('id')) ? '1000' : '1000000000000000');
    if (slug !== 'gpa-calculator') input.attr('required', '');
  });
  $('.hero input[type=date],.hero input[type=time]').each((_, element) => {
    const input = $(element),
      optional =
        (slug === 'age-calculator' && input.attr('id') === 'ref') ||
        (slug === 'countdown-calculator' && input.attr('id') === 'from');
    if (optional) input.removeAttr('required').attr('data-cm-optional', '');
    else input.attr('required', '');
  });
  const merchant = slug === 'merchant-profit-planner';
  if (merchant) {
    $('body').addClass('cm-merchant');
    $('noscript')
      .attr(
        'data-cm-pair',
        'JavaScript is required for local calculations. Input values are not uploaded.|需要启用 JavaScript 才能在本地计算，输入值不会上传。',
      )
      .text('JavaScript is required for local calculations. Input values are not uploaded.');
    $('h1[data-t=heading]').attr('data-t', 'title');
    $('[data-t]').each((_, element) => {
      const key = $(element).attr('data-t'),
        value = context.window.CMMerchantCopy.en[key];
      if (typeof value === 'string') $(element).text(value);
    });
    $('[data-aria]').each((_, element) => {
      const value = context.window.CMMerchantCopy.en[$(element).attr('data-aria')];
      if (typeof value === 'string') $(element).attr('aria-label', value);
    });
  }
  $('header.sitehead,.cm-site-header,.cm-site-skip,footer').remove();
  if (merchant && !$('#language').length)
    $('body').append('<div hidden><select id="language" aria-label="Language"></select></div>');
  $(
    'script[src*="cm-data-core"],script[src*="cm-shell"],script[src*="cm-i18n"],script[src*="cm-ui-copy"],script[src*="cm-legacy-copy"],script[src*="cm-translation-index"],script[src*="cm-home-copy"],script[src*="cm-catalog"]',
  ).remove();
  $('link[href*="cm-shell"],link[href*="cm-decisions"]').remove();
  const own = [];
  $('script').each((index, element) => {
    const e = $(element),
      src = e.attr('src');
    if (src?.includes('/_next/') || e.html()?.includes('vinext.navigationRuntime')) {
      e.remove();
      return;
    }
    if (e.attr('type') === 'application/ld+json') return;
    if (!src && e.html()?.trim()) {
      const file = 'assets/legacy-models/' + slug + '-' + index + '.js';
      own.push({ file, code: "(()=>{'use strict';\n" + e.html() + '\n})();\n' });
      e.attr('src', '/' + file)
        .attr('defer', '')
        .text('');
    }
  });
  for (const { file, code } of own) await write(file, code);
  $('script[src]').each((_, e) => $(e).attr('defer', ''));
  $('button[onclick]').each((_, element) => {
    const e = $(element);
    e.attr('data-cm-action', e.attr('onclick').includes('reset') ? 'reset' : 'copy').removeAttr(
      'onclick',
    );
  });
  if (!merchant)
    $('.hero>.card').first().find('h2').first().attr('data-cm-i18n', 'inputs').text(U.en.inputs);
  let css = '';
  $('style').each((_, element) => {
    css += '\n' + $(element).html();
    $(element).remove();
  });
  if (css.trim()) {
    const file = 'assets/legacy-models/' + slug + '.css';
    await write(file, css);
    $('head').append('<link rel="stylesheet" href="/' + file + '">');
  }
  const styles = $('link[rel=stylesheet]')
    .map((_, e) => $(e).attr('href'))
    .get()
    .filter(Boolean);
  $('link[rel=stylesheet]').remove();
  for (const file of styles) {
    const clean = sourceFor(file.split('?')[0].replace(/^\//, ''));
    $('head').append('<link rel="stylesheet" href="' + (await asset(clean)) + '">');
  }
  $('head').append('<link rel="stylesheet" href="' + (await asset('assets/cm-shell.css')) + '">');
  const scripts = [
    ...new Set(
      $('script[src]')
        .map((_, e) => sourceFor($(e).attr('src').split('?')[0].replace(/^\//, '')))
        .get(),
    ),
  ]
    .filter((file) => !isCommon(file))
    .sort((a, b) => (a.includes('cm-tool-page') ? 1 : 0) - (b.includes('cm-tool-page') ? 1 : 0));
  $('script[src]').remove();
  $('head').append(await scriptTags(commonScripts, slug));
  if (
    [
      'mortgage-calculator',
      'loan-calculator',
      'early-loan-payoff-calculator',
      'rent-vs-buy-calculator',
      'freelance-real-rate',
      'ai-inference-cost',
    ].includes(slug)
  )
    $('head').append(await scriptTags(['assets/cm-finance-core.js']));
  if (
    [
      'age-calculator',
      'date-difference-calculator',
      'countdown-calculator',
      'workday-calculator',
      'pregnancy-due-date-calculator',
    ].includes(slug)
  )
    $('head').append(await scriptTags(['assets/cm-calendar-core.js']));
  for (const src of scripts.filter(
    (src) =>
      src !== 'assets/cm-finance-core.js' &&
      src !== 'assets/cm-calendar-core.js' &&
      src !== 'assets/cm-core-decisions.js',
  )) {
    const clean = sourceFor(src.split('?')[0].replace(/^\//, ''));
    $('head').append('<script defer src="' + (await asset(clean)) + '"></script>');
  }
  if (
    [
      'mortgage-calculator',
      'loan-calculator',
      'early-loan-payoff-calculator',
      'rent-vs-buy-calculator',
      'freelance-real-rate',
      'ai-inference-cost',
    ].includes(slug)
  ) {
    $('head').append(await scriptTags(['assets/cm-core-decisions.js']));
    $('head').append(
      '<link rel="stylesheet" href="' + (await asset('assets/cm-decisions.css')) + '">',
    );
  }
  $('head').append(await scriptTags(['assets/cm-shell.js']));
  $('body').addClass('cm-unified').prepend(shellHeader('en')).append(shellFooter('en'));
  if (!$('main').length) {
    const wrap = $('body>.wrap');
    if (!wrap.length) throw Error('Missing main content: ' + slug);
    wrap.get(0).name = 'main';
    wrap.attr('id', 'main-content').removeAttr('role');
  } else $('main').first().attr('id', 'main-content');
  const hasAppSchema = $('script[type="application/ld+json"]')
    .toArray()
    .some((element) => {
      try {
        const schema = JSON.parse($(element).html());
        return [schema, ...(schema['@graph'] || [])].some((s) =>
          ['WebApplication', 'SoftwareApplication'].includes(s['@type']),
        );
      } catch {
        return false;
      }
    });
  if (!hasAppSchema) $('head').append(schemas(tool.name, slug));
  $('html').attr('lang', 'en');
  $('head meta[charset]').attr('charset', 'utf-8');
  await write(slug + '.html', $.html());
}

const intentContext = {};
vm.runInNewContext(await read('assets/cm-intent-core.js'), intentContext);
const intentSchema = {};
for (const definition of intentContext.CMIntent.definitions) {
  const $ = load(await read(definition.slug + '.html'));
  intentSchema[definition.slug] = Object.fromEntries(
    $('input[type=number][id]')
      .map((_, element) => {
        const e = $(element);
        return [
          [
            e.attr('id'),
            {
              min: e.attr('min') || '',
              max: e.attr('max') || '',
              step: e.attr('step') || '',
              value: e.attr('value') || '',
            },
          ],
        ];
      })
      .get(),
  );
}
await write(
  'assets/cm-intent-schema.js',
  'window.CMIntentSchema=' + JSON.stringify(intentSchema) + ';\n',
);
await write(
  'ranking.html',
  await renderRanking({ head, header: shellHeader, footer: shellFooter, catalog }),
);

// Static info pages no longer ship any React/RSC routing or hydration code.
if (!(await exists('src/info-pages.json'))) {
  const info = {};
  for (const name of ['about', 'methodology', 'privacy', 'terms', 'contact', 'updates', '404']) {
    const $ = load(await read(name + '.html'));
    $('header,footer,script,link').remove();
    info[name] = {
      title: $('title').text() || name,
      description: $('meta[name=description]').attr('content') || '',
      html: $('.text-page').first().html() || $('main').html() || $('body').html(),
    };
  }
  await write('src/info-pages.json', JSON.stringify(info, null, 2) + '\n');
}
for (const [slug, page] of Object.entries(JSON.parse(await read('src/info-pages.json')))) {
  const $ = load('<main class="cm-info" id="main-content">' + page.html + '</main>');
  $('header,footer,script,link').remove();
  if (slug === 'privacy')
    $('main').append(
      '<section><h2>Local data controls</h2><p>Saved layouts, language preferences and optional device-only usage history are stored in this browser. Use this button to remove CalcMintly local data.</p><button type="button" id="cm-clear-local">Clear CalcMintly local data</button><p id="cm-local-status" role="status"></p></section>',
    );
  await write(
    slug + '.html',
    (await head({
      title: page.title,
      description: page.description,
      canonical: '/' + slug,
      styles: ['assets/cm-home.css'],
    })) +
      '<body class="cm-unified">' +
      shellHeader('en') +
      $('body').html() +
      shellFooter('en') +
      '</body></html>',
  );
}

// Upgrade the existing directory and four-card workspace to the same public shell.
for (const page of ['directory', 'workspace']) {
  const $ = load(await read(page + '.html'));
  $('header,footer,.cm-site-header,.cm-site-footer,.cm-site-skip').remove();
  $(
    'script[src*="cm-data-core"],script[src*="cm-shell"],script[src*="cm-i18n"],script[src*="cm-ui-copy"],script[src*="cm-legacy-copy"],script[src*="cm-translation-index"],script[src*="cm-home-copy"],script[src*="cm-catalog"]',
  ).remove();
  $('link[href*="cm-shell"]').remove();
  const oldScripts = [
    ...new Set(
      $('script[src]')
        .map((_, e) => sourceFor($(e).attr('src').split('?')[0].replace(/^\//, '')))
        .get(),
    ),
  ].filter((file) => !isCommon(file));
  $('script[src]').remove();
  $('head').append(await scriptTags(commonScripts));
  for (const src of oldScripts) {
    const clean = sourceFor(src.split('?')[0].replace(/^\//, ''));
    $('head').append('<script defer src="' + (await asset(clean)) + '"></script>');
  }
  $('head').append(await scriptTags(['assets/cm-shell.js']));
  if (page === 'workspace') {
    $(
      'script[src*="cm-workspace-tools"],script[src*="cm-intent-core"],script[src*="cm-intent-schema"],script[src*="cm-workspace-intent"],script[src*="cm-workspace-links"],script[src*="cm-unit-contracts"]',
    ).remove();
    $('link[href*="cm-workspace-tools"]').remove();
    $('head').append(
      await scriptTags([
        'assets/cm-workspace-tools.js',
        'assets/cm-intent-schema.js',
        'assets/cm-intent-core.js',
        'assets/cm-workspace-intent.js',
        'assets/cm-unit-contracts.js',
        'assets/cm-workspace-links.js',
      ]),
    );
  }
  const styles = $('link[rel=stylesheet]')
    .map((_, e) => $(e).attr('href'))
    .get();
  $('link[rel=stylesheet]').remove();
  for (const src of styles) {
    const clean = sourceFor(src.split('?')[0].replace(/^\//, ''));
    $('head').append('<link rel="stylesheet" href="' + (await asset(clean)) + '">');
  }
  $('head').append('<link rel="stylesheet" href="' + (await asset('assets/cm-shell.css')) + '">');
  $('body').addClass('cm-unified').prepend(shellHeader('en')).append(shellFooter('en'));
  $('main').first().attr('id', 'main-content');
  if (page === 'directory') {
    $('[data-t=intro]').text(C.en.intro);
    const directoryDomains = [
      'all',
      ...Object.keys(C.en.domains).filter((domain) =>
        catalog.some((tool) => tool.domain === domain),
      ),
    ];
    $('nav.categories').html(
      directoryDomains
        .map(
          (domain) =>
            `<button type="button" class="category" data-domain="${esc(domain)}" aria-pressed="${domain === 'all'}"><span data-cm-no-translate>${esc(domain === 'all' ? C.en.all : C.en.domains[domain])}</span><small data-cm-no-translate>${domain === 'all' ? catalog.length : catalog.filter((tool) => tool.domain === domain).length}</small></button>`,
        )
        .join(''),
    );
    $('#category-mobile')
      .attr('data-cm-no-translate', '')
      .html(
        directoryDomains
          .map(
            (domain) =>
              `<option value="${esc(domain)}">${esc(domain === 'all' ? C.en.all : C.en.domains[domain])} · ${domain === 'all' ? catalog.length : catalog.filter((tool) => tool.domain === domain).length}</option>`,
          )
          .join(''),
      );
    const ordered = [...catalog].sort((a, b) => a.priority - b.priority);
    const formatCopy = (key, values) =>
      Object.entries(values).reduce(
        (s, [k, v]) => s.replaceAll('{' + k + '}', String(v)),
        C.en[key],
      );
    $('#tool-grid').html(
      ordered
        .slice(0, 12)
        .map(
          (tool) =>
            `<a class="tool${tool.new ? ' new' : ''}" href="/${tool.slug}"><span class="tool-icon" aria-hidden="true">${icons[tool.domain]}</span><span class="tool-text"><span class="tool-name"><span data-cm-tool-slug="${tool.slug}">${esc(tool.name)}</span>${tool.new ? `<span class="new-tag">${esc(C.en.new)}</span>` : ''}</span><span class="tool-domain">${esc(C.en.domains[tool.domain] || tool.domain)}</span><span class="tool-description">${esc(tool.description)}</span></span></a>`,
        )
        .join(''),
    );
    $('#result-count').text(formatCopy('count', { start: 1, end: 12, count: catalog.length }));
    $('#page-position').text(
      formatCopy('page', { page: 1, pages: Math.ceil(catalog.length / 12) }),
    );
    $('#cm-directory-all').remove();
    $('#results').append(
      `<details class="cm-directory-all" id="cm-directory-all"><summary data-cm-pair="Browse all calculator links|查看全部计算器链接">Browse all calculator links</summary><ul>${ordered.map((tool) => `<li><a href="/${tool.slug}" data-cm-href="/${tool.slug}" data-cm-tool-slug="${tool.slug}">${esc(tool.name)}</a></li>`).join('')}</ul></details>`,
    );
    $('.category').each((_, e) => {
      const d = $(e).attr('data-domain');
      $(e)
        .find('small')
        .text(d === 'all' ? catalog.length : catalog.filter((x) => x.domain === d).length);
    });
    $('#category-mobile option').each((_, e) => {
      const d = $(e).attr('value');
      $(e).text(
        (d === 'all' ? C.en.all : C.en.domains[d]) +
          ' · ' +
          (d === 'all' ? catalog.length : catalog.filter((x) => x.domain === d).length),
      );
    });
  }
  if (page === 'workspace')
    $('head').append(
      '<link rel="stylesheet" href="' + (await asset('assets/cm-workspace-tools.css')) + '">',
    );
  await write(page + '.html', $.html());
}

const metadataPages = await finishMetadata(root, catalog);
await secureMarkup(root, [
  ...metadataPages.map((p) => p.file),
  ...locales.map((l) => l.toLowerCase() + '/index.html'),
  'embed/merchant-profit.html',
]);

await write(
  'release-version.json',
  JSON.stringify(
    {
      release: 'calcmintly-unified-500',
      catalogTools: catalog.length,
      workspaceTools: catalog.length,
      locales: locales.length,
      sharedShell: true,
      legacyRouter: false,
    },
    null,
    2,
  ) + '\n',
);
await write(
  'src/asset-manifest.json',
  JSON.stringify(
    Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b, 'en'))),
    null,
    2,
  ) + '\n',
);
const localized = await localizeSite(root, catalog, metadataPages);
const embedFiles = await renderEmbeds(root, catalog);

// Retain every asset referenced by the generated pages, then remove obsolete fingerprints.
const referenced = new Set(Object.values(manifest).map((p) => p.replace(/^\//, '')));
const htmlFiles = [
  ...(await fs.readdir(root)).filter((f) => f.endsWith('.html') && !f.startsWith('._')),
  ...localized.routeRecords.map((r) => r.file),
  ...embedFiles,
  ...locales.map((l) => l.toLowerCase() + '/index.html'),
  'embed/merchant-profit.html',
];
for (const file of htmlFiles) {
  const html = await read(file);
  for (const match of html.matchAll(/(?:src|href)="\/(assets\/dist\/[^"?#]+)/g))
    referenced.add(match[1]);
}
let cleanedAssets = 0;
for (const file of await fs.readdir(new URL('assets/dist/', root))) {
  if (!referenced.has('assets/dist/' + file)) {
    await fs.unlink(new URL('assets/dist/' + file, root));
    cleanedAssets++;
  }
}
console.log(
  'Built unified site:',
  catalog.length,
  'calculators,',
  locales.length,
  'locales with native tool/info routes;',
  embedFiles.length,
  'calculator embeds. Removed',
  cleanedAssets,
  'obsolete asset fingerprints.',
);
