import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(new URL('../assets/cm-i18n.js', import.meta.url), 'utf8');
const corpus = JSON.parse(
  await fs.readFile(new URL('../src/i18n-corpus.json', import.meta.url), 'utf8'),
);
for (const fragment of ['The discriminant D = b²', "It is the parabola's turning point:"])
  assert.ok(
    corpus.some((row) => row.active && row.source.includes(fragment)),
    'Explanations containing both inequality signs must remain translatable: ' + fragment,
  );
for (const source of ['use strict', '[data-w]', 'input,select,textarea'])
  assert.ok(
    !corpus.some((row) => row.active && row.source === source),
    'Implementation syntax must not count as public translation copy: ' + source,
  );
assert.ok(corpus.some((row) => row.active && row.source === 'Remove calculator'));
function runtime(locale) {
  const document = {
    documentElement: { lang: locale, hasAttribute: () => false },
    body: {},
    readyState: 'loading',
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const window = {
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
  vm.runInNewContext(source, {
    window,
    document,
    localStorage: { getItem: () => null },
    location: {
      search: '?lang=' + locale,
      pathname: '/countdown-calculator',
      origin: 'https://example.test',
    },
    navigator: { language: locale },
    URLSearchParams,
    URL,
    Intl,
  });
  return window.CMI18n;
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
console.log(
  'Translation runtime: mixed localized dates, authored Chinese preservation, literal email, rate-unit denominators and negative zero PASS',
);
