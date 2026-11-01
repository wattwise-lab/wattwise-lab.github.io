import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = { window: {}, URL };
vm.runInNewContext(
  await fs.readFile(new URL('../assets/cm-locale-core.js', import.meta.url), 'utf8'),
  context,
);
const R = context.window.CMLocaleRoutes,
  origin = 'https://calcmintly.com';
let count = 0;
for (const [input, locale, expected] of [
  ['/', 'en', '/'],
  ['/', 'zh-CN', '/zh-cn/'],
  ['/en/', 'fr', '/fr/'],
  ['/zh-CN/', 'en', '/'],
  ['/zh-cn/scientific-calculator', 'fr', '/fr/scientific-calculator'],
  [
    '/fr/mortgage-calculator?lang=fr&add=loan-calculator#cm=%7B%7D',
    'zh-CN',
    '/zh-cn/mortgage-calculator?add=loan-calculator#cm=%7B%7D',
  ],
  [
    '/zh-cn/workspace?add=basic-calculator#desk=abc',
    'en',
    '/workspace?add=basic-calculator#desk=abc',
  ],
  ['/de/index.html', 'en', '/'],
  ['/en/loan-calculator.html', 'ja', '/ja/loan-calculator'],
  ['/assets/dist/cm-common.abcdef123456.js', 'ar', '/assets/dist/cm-common.abcdef123456.js'],
  ['/manifest.webmanifest', 'ar', '/manifest.webmanifest'],
  ['/favicon.svg', 'fr', '/favicon.svg'],
  ['/robots.txt', 'es', '/robots.txt'],
  ['/embed/loan-calculator?lang=fr', 'en', '/embed/loan-calculator'],
  ['/embed/loan-calculator', 'fr', '/embed/loan-calculator?lang=fr'],
  ['/de/loan-calculator?embed=1&lang=de#cm=test', 'ja', '/loan-calculator?embed=1&lang=ja#cm=test'],
  ['mailto:hello@example.com', 'zh-CN', 'mailto:hello@example.com'],
  ['tel:+12345', 'fr', 'tel:+12345'],
  ['https://example.com/guide', 'ja', 'https://example.com/guide'],
]) {
  assert.equal(R.url(input, locale, origin), expected, input);
  count++;
}
for (const locale of R.locales) {
  assert.equal(R.sourcePath(R.path('/mortgage-calculator', locale)), '/mortgage-calculator');
  assert.equal(R.path(R.path('/mortgage-calculator', locale), 'en'), '/mortgage-calculator');
  count += 2;
}
console.log(
  'Locale routes: ' +
    count +
    ' native-path, alias, query, fragment, embed and external-link cases PASS',
);
