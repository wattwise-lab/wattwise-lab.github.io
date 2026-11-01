import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const root = new URL('../', import.meta.url),
  coreSource = await fs.readFile(new URL('assets/cm-preferences-core.js', root), 'utf8'),
  runtimeSource = await fs.readFile(new URL('assets/cm-preferences.js', root), 'utf8'),
  copySource = await fs.readFile(new URL('assets/cm-preferences-copy.js', root), 'utf8'),
  context = { window: {}, URLSearchParams };
vm.runInNewContext(coreSource, context);
const S = context.window.CMPreferenceStore,
  memory = (deny = false) => {
    const data = new Map();
    return {
      data,
      getItem: (key) => data.get(key) ?? null,
      setItem(key, value) {
        if (deny) throw Error('storage unavailable');
        data.set(key, value);
      },
      removeItem(key) {
        if (deny) throw Error('storage unavailable');
        data.delete(key);
      },
    };
  };
assert.equal(S.toolLimit, 33);
let controlsChecked = 0;
for (const [slug, policy] of Object.entries(S.policies)) {
  const $ = load(await fs.readFile(new URL(slug + '.html', root), 'utf8'));
  for (const [id, choices] of Object.entries(policy)) {
    const actual = $('#' + id + ' option')
      .toArray()
      .map((option) => $(option).attr('value'));
    assert.deepEqual(actual, Array.from(choices), slug + ': enum policy must match real controls');
    controlsChecked++;
  }
  const saved = Object.fromEntries(Object.entries(policy).map(([id, choices]) => [id, choices[0]])),
    storage = memory();
  assert.ok(S.remember(storage, slug, { ...saved, privateInput: 'do not persist' }));
  assert.deepEqual(JSON.parse(JSON.stringify(S.read(storage).tools[slug])), saved);
  assert.doesNotMatch(storage.getItem(S.key), /privateInput|do not persist/);
  const firstId = Object.keys(saved)[0];
  assert.equal(S.remember(storage, slug, { ...saved, [firstId]: 'not-an-allowed-code' }), false);
  assert.ok(S.forget(storage, slug));
  assert.equal(storage.getItem(S.key), null);
}
assert.equal(controlsChecked, 65);
const data = memory();
data.setItem(S.key, '{broken JSON');
assert.equal(Object.keys(S.read(data).tools).length, 0);
data.setItem(S.key, 'x'.repeat(12289));
assert.equal(Object.keys(S.read(data).tools).length, 0);
data.setItem(
  S.key,
  JSON.stringify({ version: 2, tools: { 'bmi-calculator': { unit: 'metric' } } }),
);
assert.equal(Object.keys(S.read(data).tools).length, 0);
data.setItem(
  S.key,
  '{"version":1,"tools":{"__proto__":{"polluted":"yes"},"bmi-calculator":{"unit":"metric","kg":65,"sex":"female"}}}',
);
assert.deepEqual(JSON.parse(JSON.stringify(S.read(data))), {
  version: 1,
  tools: { 'bmi-calculator': { unit: 'metric' } },
});
assert.equal({}.polluted, undefined);
assert.equal(S.remember(memory(true), 'bmi-calculator', { unit: 'metric' }), false);
assert.equal(S.forget(memory(true), 'bmi-calculator'), false);
assert.ok(S.mayRestore({ search: '?lang=fr' }));
for (const state of [
  { embedded: true },
  { hash: '#cm=state' },
  { hash: '#existing-anchor' },
  { changed: true },
  { search: '?currency=EUR' },
  { search: '?lang=fr&input=50' },
  { search: '?embed=1' },
])
  assert.equal(S.mayRestore(state), false, JSON.stringify(state));

// Exercise the actual browser runtime's lifecycle without a browser or any numeric persistence.
function runtime({
  saved = true,
  search = '',
  hash = '',
  changed = false,
  embedded = false,
  returning = false,
  reloading = false,
  deny = false,
} = {}) {
  class Element {
    constructor() {
      this.events = {};
      this.attributes = {};
      this.disabled = true;
      this.textContent = '';
    }
    addEventListener(name, callback) {
      this.events[name] = callback;
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  }
  class Select extends Element {
    constructor(id, values, current) {
      super();
      this.id = id;
      this.value = current;
      this.type = 'select-one';
      this.options = values.map((value) => ({ value, defaultSelected: value === current }));
    }
  }
  const from = new Select('from', ['m', 'km', 'cm', 'mm', 'in', 'ft', 'mi'], 'm'),
    to = new Select('to', ['m', 'km', 'cm', 'mm', 'in', 'ft', 'mi'], 'ft'),
    number = { id: 'val', type: 'number', defaultValue: '1', value: changed ? '739.005' : '1' },
    remember = new Element(),
    forget = new Element(),
    status = new Element(),
    panel = {
      hidden: false,
      querySelector: (query) =>
        query.includes('"remember"') ? remember : query.includes('"forget"') ? forget : status,
    },
    events = {},
    storage = memory(deny),
    document = {
      body: { dataset: { cmPreferenceTool: 'unit-converter' } },
      querySelector: () => panel,
      querySelectorAll: () => [from, to, number],
      getElementById: (id) => ({ from, to })[id],
      addEventListener: (name, callback) => (events[name] = callback),
    },
    window = {
      CMI18n: { t: (key) => 'native:' + key },
      addEventListener: (name, callback) => (events[name] = callback),
      performance: {
        getEntriesByType: () => [
          { type: returning ? 'back_forward' : reloading ? 'reload' : 'navigate' },
        ],
      },
    };
  window.self = window;
  window.top = embedded ? {} : window;
  if (saved)
    storage.data.set(
      S.key,
      JSON.stringify({ version: 1, tools: { 'unit-converter': { from: 'cm', to: 'm' } } }),
    );
  const ctx = {
    window,
    document,
    localStorage: storage,
    HTMLSelectElement: Select,
    URLSearchParams,
    location: { pathname: '/unit-converter', search, hash },
  };
  vm.runInNewContext(coreSource, ctx);
  vm.runInNewContext(runtimeSource, ctx);
  return { window, from, to, number, remember, forget, status, events, panel, storage };
}
const fresh = runtime();
assert.equal(fresh.from.value, 'cm');
assert.equal(fresh.to.value, 'm');
assert.equal(fresh.number.value, '1');
assert.equal(fresh.window.CMPreferences.initialChoice('unit-converter', 'from'), 'cm');
assert.equal(fresh.window.CMPreferences.initialChoice('other-tool', 'from'), undefined);
fresh.from.value = 'km';
fresh.number.value = 'private-not-stored';
fresh.events['cm:language']();
fresh.events['cm:translations']();
assert.equal(fresh.from.value, 'km', 'Language rendering never reapplies saved choices');
assert.equal(fresh.number.value, 'private-not-stored');
fresh.events.change({ target: fresh.from, isTrusted: false });
assert.equal(
  S.read(fresh.storage).tools['unit-converter'].from,
  'cm',
  'Raw-state restoration never writes preferences',
);
fresh.events.change({ target: fresh.from, isTrusted: true });
assert.equal(S.read(fresh.storage).tools['unit-converter'].from, 'km');
assert.doesNotMatch(fresh.storage.getItem(S.key), /private-not-stored/);
fresh.forget.events.click();
assert.equal(fresh.storage.getItem(S.key), null);
assert.equal(fresh.from.value, 'km');
assert.equal(fresh.number.value, 'private-not-stored');
assert.equal(fresh.remember.attributes['aria-pressed'], 'false');
const otherTabClear = runtime();
otherTabClear.number.value = 'do-not-change-this-value';
otherTabClear.storage.removeItem(S.key);
otherTabClear.events.storage({ key: S.key });
assert.equal(otherTabClear.remember.attributes['aria-pressed'], 'false');
assert.equal(otherTabClear.number.value, 'do-not-change-this-value');
otherTabClear.from.value = 'km';
otherTabClear.events.change({ target: otherTabClear.from, isTrusted: true });
assert.equal(
  otherTabClear.storage.getItem(S.key),
  null,
  'Clearing from another tab does not silently opt back in',
);
for (const state of [
  { search: '?currency=EUR' },
  { hash: '#cm=example' },
  { changed: true },
  { returning: true },
  { reloading: true },
]) {
  const r = runtime(state);
  assert.equal(
    r.from.value,
    'm',
    'Explicit or existing state takes precedence: ' + JSON.stringify(state),
  );
  assert.equal(r.to.value, 'ft');
  assert.equal(r.status.textContent, 'native:preferenceSkipped');
}
const frame = runtime({ embedded: true });
assert.equal(frame.panel.hidden, true);
assert.equal(frame.from.value, 'm');
const optIn = runtime({ saved: false });
optIn.from.value = 'ft';
optIn.events.change({ target: optIn.from, isTrusted: true });
assert.equal(optIn.storage.getItem(S.key), null, 'No automatic opt-in');
optIn.remember.events.click();
assert.equal(S.read(optIn.storage).tools['unit-converter'].from, 'ft');
optIn.storage.removeItem(S.key);
optIn.events['cm:local-data-cleared']();
assert.equal(optIn.from.value, 'ft');
assert.equal(optIn.remember.attributes['aria-pressed'], 'false');
const denied = runtime({ saved: false, deny: true });
denied.remember.events.click();
assert.equal(denied.status.textContent, 'native:preferenceFailure');

const locales = [
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
    'pcm',
    'mr',
    'vi',
    'te',
    'sw',
    'ha',
    'tr',
  ],
  copyContext = { window: { CMUiCopy: Object.fromEntries(locales.map((locale) => [locale, {}])) } };
vm.runInNewContext(copySource, copyContext);
const copy = copyContext.window.CMPreferenceCopy,
  keys = Object.keys(copy.en).sort();
assert.equal(Object.keys(copy).length, 20);
assert.equal(keys.length, 11);
for (const locale of locales) {
  assert.deepEqual(Object.keys(copy[locale]).sort(), keys);
  for (const key of keys) {
    assert.ok(copy[locale][key].trim(), locale + ': native ' + key);
    assert.equal(copyContext.window.CMUiCopy[locale][key], copy[locale][key]);
    if (!['en', 'pcm'].includes(locale)) assert.notEqual(copy[locale][key], copy.en[key]);
  }
}
console.log(
  'Preferences PASS: 33 explicit tools/65 enum controls; bounded private-input exclusion, storage failure, fresh-only restore, shared/workspace/current-state precedence, language/raw-state preservation, opt-in/forget/clear lifecycle, 20 native locales/220 messages.',
);
