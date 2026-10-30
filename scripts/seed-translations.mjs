import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as espree from 'espree';
const root = new URL('../', import.meta.url),
  read = (f) => fs.readFile(new URL(f, root), 'utf8'),
  context = { window: {} };
for (const file of [
  'cm-home-copy-v3.js',
  'cm-legacy-copy.js',
  'cm-ui-copy.js',
  'cm-keypad-copy.js',
])
  vm.runInNewContext(await read('assets/' + file), context);
for (const lang of Object.keys(context.window.CMUiCopy))
  vm.runInNewContext(await read('assets/merchant-i18n/' + lang + '.js'), context);
const U = context.window.CMUiCopy,
  L = context.window.CMLegacyCopy,
  H = context.window.CMHomeCopy,
  pairs = new Map();
const files = [
  'assets/cm-workspace.js',
  'assets/cm-shell.js',
  'assets/cm-data-core.js',
  'assets/cm-workspace-links.js',
  'assets/cm-core-decisions.js',
  'assets/cm-finance-core.js',
  'assets/cm-calendar-core.js',
  'assets/cm-expanded.js',
  'assets/cm-ranking.js',
  'assets/cm-scenario-editor.js',
  'assets/cm-workspace-tools.js',
  'assets/cm-workspace-intent.js',
  'assets/cm-intent-core.js',
  ...(await fs.readdir(new URL('assets/models/', root)))
    .filter((f) => f.endsWith('.js'))
    .map((f) => 'assets/models/' + f),
];
function pair(value) {
  if (typeof value !== 'string' || !value.includes('|')) return;
  const [en, zh, ...extra] = value.split('|');
  if (!extra.length && en.trim() && /[\u3400-\u9fff]/.test(zh)) pairs.set(en.trim(), zh.trim());
}
for (const file of files) {
  const tree = espree.parse(await read(file), { ecmaVersion: 'latest', sourceType: 'script' });
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Literal') pair(node.value);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(tree);
}
for (const file of (await fs.readdir(root)).filter(
  (f) => f.endsWith('.html') && !f.startsWith('._'),
))
  for (const match of (await read(file)).matchAll(/data-cm-pair="([^"]+)"/g))
    pair(
      match[1]
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>'),
    );
function seed(dst, en, translation) {
  for (const [k, value] of Object.entries(en || {})) {
    if (typeof value === 'string' && typeof translation?.[k] === 'string' && translation[k])
      dst[value] = translation[k];
    else if (value && typeof value === 'object') seed(dst, value, translation?.[k]);
  }
}
await fs.mkdir(new URL('src/translations/', root), { recursive: true });
const report = [];
const authoredIndex = {};
for (const lang of Object.keys(U).filter((l) => l !== 'en')) {
  let dict = {};
  try {
    dict = JSON.parse(await read('src/translations/' + lang + '.json'));
  } catch {}
  const overlay = {};
  seed(overlay, U.en, U[lang]);
  seed(overlay, H.en, H[lang]);
  seed(overlay, context.window.CMMerchantCopy.en, context.window.CMMerchantCopy[lang]);
  for (const [zh, en] of Object.entries(L.en)) if (L[lang]?.[zh]) overlay[en] = L[lang][zh];
  if (lang === 'zh-CN') {
    for (const tool of JSON.parse(await read('src/catalog-base.json'))) {
      if (tool.names?.[lang]) overlay[tool.name] = tool.names[lang];
      if (tool.descriptions?.[lang]) overlay[tool.description] = tool.descriptions[lang];
    }
    for (const [en, zh] of pairs) overlay[en] = zh;
    Object.assign(overlay, {
      CalcMintly: 'CalcMintly',
      Breakdown: '明细',
      'Calls per month': '每月调用次数',
      'Your motion': '运动参数',
      'Formula version': '公式版本',
      'Example checked': '示例核查日期',
    });
  }
  try {
    Object.assign(overlay, JSON.parse(await read('src/translation-overrides/' + lang + '.json')));
  } catch {}
  overlay.CalcMintly = 'CalcMintly';
  Object.assign(dict, overlay);
  authoredIndex[lang] = Object.keys(overlay);
  await fs.writeFile(
    new URL('src/translations/' + lang + '.json', root),
    JSON.stringify(dict, null, 2) + '\n',
  );
  report.push({
    lang,
    seeded: Object.keys(dict).length,
    existingOrWritten: Object.keys(overlay).length,
  });
}
await fs.writeFile(
  new URL('src/translation-authored-keys.json', root),
  JSON.stringify(authoredIndex, null, 2) + '\n',
);
console.log(JSON.stringify({ authoredPairs: pairs.size, locales: report }, null, 2));
