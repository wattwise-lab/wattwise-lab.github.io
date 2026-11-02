import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import postcss from 'postcss';
import { colorModeCSS } from './color-mode-css.mjs';

const source = `:root {color-scheme:light dark} @media (prefers-color-scheme: dark) { :root {--ink:white} html[data-cm-theme="rose"] .card, .field:focus {color:white} } @media (prefers-reduced-motion: reduce) {.card {transition:none}}`;
const output = postcss.parse(colorModeCSS(source));
const automatic = [],
  explicit = [];
output.walkRules((rule) => {
  if (rule.parent.type === 'atrule' && rule.parent.params.includes('prefers-color-scheme'))
    automatic.push(...rule.selectors);
  else if (rule.selector.includes('data-cm-mode="dark"')) explicit.push(...rule.selectors);
});
assert.deepEqual(automatic, [
  ':root:not([data-cm-mode="light"])',
  'html:not([data-cm-mode="light"])[data-cm-theme="rose"] .card',
  ':root:not([data-cm-mode="light"]) .field:focus',
]);
assert.deepEqual(explicit, [
  ':root[data-cm-mode="dark"]',
  'html[data-cm-mode="dark"][data-cm-theme="rose"] .card',
  ':root[data-cm-mode="dark"] .field:focus',
]);
assert.match(output.toString(), /prefers-reduced-motion: reduce/);
assert.match(
  colorModeCSS('@media screen and (prefers-color-scheme: dark) {.metric {color:white}}'),
  /@media screen[^{]*\{\s*:root\[data-cm-mode="dark"\]/,
);
assert.equal(colorModeCSS('.card {color:red}'), '.card {color:red}');
const boot = await fs.readFile(new URL('../assets/cm-initial-layout.js', import.meta.url), 'utf8');
for (const theme of ['system', 'ocean', 'sand', 'graphite', 'violet', 'rose']) {
  for (const mode of ['auto', 'light', 'dark', 'invalid']) {
    const document = { documentElement: { dataset: {} }, body: null };
    vm.runInNewContext(boot, {
      document,
      localStorage: { getItem: (key) => (key.includes('color-mode') ? mode : theme) },
    });
    assert.equal(document.documentElement.dataset.cmTheme, theme);
    assert.equal(
      document.documentElement.dataset.cmMode,
      ['light', 'dark'].includes(mode) ? mode : undefined,
    );
  }
}
const document = { documentElement: { dataset: {} }, body: null };
vm.runInNewContext(boot, {
  document,
  localStorage: {
    getItem: () => {
      throw Error('Storage denied');
    },
  },
});
assert.deepEqual(document.documentElement.dataset, {});
console.log(
  'Color mode PASS: OS/explicit selector isolation, root/palette selectors, 24 first-paint preferences and denied storage.',
);
