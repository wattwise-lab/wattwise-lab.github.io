import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-data-core.js', import.meta.url), 'utf8'),
  c,
);
const D = c.CMData,
  eq = (actual, expected) => assert.equal(JSON.stringify(actual), JSON.stringify(expected));
eq(D.list('1, 2;3\n4，5；6'), [1, 2, 3, 4, 5, 6]);
eq(D.list('١٫٥ ۲ ३ ৪ ౫'), [1.5, 2, 3, 4, 5]);
eq(D.list('-1e3 +.25 2E-2'), [-1000, 0.25, 0.02]);
eq(D.list('١٬٢٣٤'), [1234]);
for (const bad of [
  '',
  '1,2abc,3',
  '0x10',
  'Infinity',
  '1e999',
  'NaN',
  '--1',
  '1/2',
  '1 . 2',
  Array(1001).fill('1').join(','),
])
  assert.throws(() => D.list(bad), undefined, bad);
assert.equal(D.list(Array(1000).fill('1').join(',')).length, 1000);
for (const [value, places, expected] of [
  [100000.01, 2, '100,000.01'],
  [50, 2, '50.00'],
  [1.005, 4, '1.0050'],
  [50, 0, '50'],
])
  assert.equal(
    new Intl.NumberFormat('en', D.resultNumberOptions(value, 'Home and Everyday', places)).format(
      value,
    ),
    expected,
  );
console.log(
  'Data parser: complete decimal tokens, 5 native digit sets, finite limits and 10 invalid-list cases PASS',
);
for (const locale of [
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
  'mr',
  'vi',
  'te',
  'sw',
  'ha',
  'tr',
]) {
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    1234567.89,
  );
  assert.ok(
    Math.abs(D.displayNumber(formatted, locale) - 1234567.89) < 1e-9,
    locale + ' displayed currency',
  );
}
for (const text of ['1 / 2', '1–2', '1 year 2 months', '∞', 'NaN'])
  assert.equal(D.displayNumber(text, 'en'), null, text + ' must not become one number');
assert.equal(D.displayNumber('1.2e-8 kg', 'en'), 1.2e-8);
console.log(
  'Displayed-number transfer: 19 native currency formats and ambiguous multi-value results PASS',
);

assert.equal(D.expression('sin(٣٠)+१٫५', 'ar'), 'sin(30)+1.5');
assert.equal(D.expression('1,5+2', 'de'), '1.5+2');
assert.equal(D.expression('1,000', 'en'), '1,000');
console.log('Localized scientific input: native digits and locale decimal normalization PASS');

for (const [value, domain, expected] of [
  [250 / 75, 'Health', '3.33333'],
  [3.46789530438, 'Home and Everyday', '3.4679'],
  [123456789012, 'Home and Everyday', '123,456,789,012'],
  [1e-8, 'Health', '1E-8'],
  [1e15, 'Home and Everyday', '1E15'],
  [1 / 3, 'Math and Time', '0.333333333333'],
])
  assert.equal(
    new Intl.NumberFormat('en', D.resultNumberOptions(value, domain)).format(value),
    expected,
  );
assert.equal(D.unit('minutes', 5, 'zh-CN'), '分钟');
assert.equal(D.unit('USD/month', 2, 'ja'), 'USD/月');
assert.equal(
  D.unit('tonnes', 3.84, 'zh-CN', (source) => (source === 'tonnes' ? '吨' : source)),
  '吨',
);
console.log(
  'Measured-result precision: readable estimates, intact integers/tiny values, math precision and shared native units PASS',
);
