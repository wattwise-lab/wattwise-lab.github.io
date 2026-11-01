import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const root = new URL('../', import.meta.url),
  read = (path) => fs.readFile(new URL(path, root), 'utf8'),
  context = { window: {} };
vm.runInNewContext(await read('assets/cm-ui-copy.js'), context);
vm.runInNewContext(await read('assets/cm-preferences-core.js'), context);
vm.runInNewContext(await read('assets/cm-preferences-copy.js'), context);
const { policies } = context.window.CMPreferenceStore,
  copy = context.window.CMPreferenceCopy,
  routes = JSON.parse(await read('src/locale-routes.json')),
  manifest = JSON.parse(await read('src/asset-manifest.json')),
  style = manifest['assets/cm-preferences.css'];
assert.ok(style, 'Preference stylesheet is in the final asset manifest');
let tools = 0,
  privacy = 0;
for (const route of routes) {
  const slug = route.path.split('/').at(-1);
  if (!Object.hasOwn(policies, slug) && slug !== 'privacy') continue;
  const $ = load(await read(route.file)),
    native = copy[route.locale];
  if (slug === 'privacy') {
    assert.equal($('[data-cm-i18n="preferencePrivacy"]').length, 1);
    assert.equal($('[data-cm-i18n="preferencePrivacy"]').text(), native.preferencePrivacy);
    assert.equal($('#cm-clear-local').length, 1, 'Existing clear-all action covers preferences');
    privacy++;
    continue;
  }
  const panel = $('main details.cm-preferences'),
    hint = Object.hasOwn(policies[slug], 'currency') ? 'preferenceCurrencyHint' : 'preferenceHint';
  assert.equal(panel.length, 1, route.path + ': exactly one SSR preference disclosure');
  assert.equal($('body').attr('data-cm-preference-tool'), slug);
  assert.equal(panel.attr('open'), undefined, 'Native disclosure starts closed');
  assert.equal(panel.find('summary').text(), native.preferenceTitle);
  assert.equal(panel.find('[data-cm-i18n="' + hint + '"]').text(), native[hint]);
  assert.equal(
    panel.find('button[data-cm-preference-action="remember"]').text(),
    native.preferenceRemember,
  );
  assert.equal(
    panel.find('button[data-cm-preference-action="forget"]').text(),
    native.preferenceForget,
  );
  assert.equal(panel.find('[data-cm-preference-status][role=status]').length, 1);
  assert.equal(
    $('link[rel=stylesheet]').filter((_, element) => $(element).attr('href') === style).length,
    1,
    'No repeated preference styles after rebuild',
  );
  for (const id of Object.keys(policies[slug])) assert.equal($('#' + id).length, 1);
  tools++;
}
assert.equal(tools, 33 * 20, 'All eligible tools in every locale');
assert.equal(privacy, 20, 'Native preference privacy disclosure in every locale');
console.log(
  'Preference release PASS: 660 native tool disclosures, 20 native privacy disclosures, real controls and one fingerprinted stylesheet per eligible page.',
);
