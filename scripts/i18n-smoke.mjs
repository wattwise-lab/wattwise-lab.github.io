import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import * as espree from 'espree';
const root = new URL('../', import.meta.url),
  c = { window: {} };
for (const f of ['cm-ui-copy', 'cm-home-copy-v3', 'cm-keypad-copy'])
  vm.runInNewContext(await fs.readFile(new URL('assets/' + f + '.js', root), 'utf8'), c);
const locales = Object.keys(c.window.CMUiCopy);
const workspaceSource = await fs.readFile(new URL('assets/cm-workspace.js', root), 'utf8'),
  declarations = new Map();
function findDeclarations(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && ['copy', 'commonKeys'].includes(node.id.name))
    declarations.set(node.id.name, node.init);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(findDeclarations);
    else if (value && typeof value === 'object') findDeclarations(value);
  }
}
findDeclarations(espree.parse(workspaceSource, { ecmaVersion: 'latest' }));
const workspaceCopy = declarations.get('copy'),
  commonWorkspaceKeys = new Set(declarations.get('commonKeys').properties.map((p) => p.key.name)),
  workspaceKeys = (language) =>
    new Set(
      workspaceCopy.properties
        .find((p) => (p.key.name || p.key.value) === language)
        .value.properties.map((p) => p.key.name || p.key.value),
    ),
  workspaceMarkup = load(await fs.readFile(new URL('workspace.html', root), 'utf8'));
for (const language of ['en', 'zh-CN'])
  workspaceMarkup('[data-w]').each((_, element) => {
    const key = workspaceMarkup(element).attr('data-w');
    assert.ok(
      commonWorkspaceKeys.has(key) || workspaceKeys(language).has(key),
      language + ' workspace data-w needs a copy value: ' + key,
    );
  });
assert.equal(locales.length, 20);
const keys = Object.keys(c.window.CMUiCopy.en).sort();
for (const lang of locales) {
  assert.deepEqual(Object.keys(c.window.CMUiCopy[lang]).sort(), keys, lang + ' shared UI keys');
  for (const text of Object.values(c.window.CMUiCopy[lang]))
    assert.ok(typeof text === 'string' && text.trim(), lang + ' nonempty copy');
  const $ = load(await fs.readFile(new URL(lang.toLowerCase() + '/index.html', root), 'utf8'));
  assert.equal($('html').attr('lang'), lang);
  assert.equal($('html').attr('dir'), ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr');
  assert.equal($('h1').length, 1);
  assert.equal($('.cm-pinned__tool').length, 8);
  assert.equal($('.cm-originals__tool').length, 3);
  assert.equal($('[data-cm-language] option').length, 20);
  assert.equal($('[hreflang]').length, 21);
}
console.log(
  'I18n shell PASS: 20 homepages, equal shared UI keys, lang/RTL, eight shortcuts and three original entries. Full content coverage is a separate strict release check.',
);
