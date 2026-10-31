import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(new URL('../assets/cm-usage.js', import.meta.url), 'utf8');
const preference = 'calcmintly-usage-opt-in-v1',
  key = 'calcmintly-local-usage-v1';
const store = new Map([
  [preference, 'yes'],
  [key, JSON.stringify({ 'previous-calculator': 3 })],
  ['unrelated-note', 'keep'],
]);
const storage = {
  getItem: (name) => store.get(name) ?? null,
  setItem: (name, value) => store.set(name, value),
  removeItem: (name) => store.delete(name),
};
function page(slug, localStorage = storage) {
  const handlers = {},
    windowHandlers = {},
    scheduled = new Map(),
    events = [];
  const window = {
    CMCatalog: [{ slug }],
    addEventListener: (type, handler) => (windowHandlers[type] = handler),
  };
  vm.runInNewContext(source, {
    window,
    localStorage,
    Event,
    document: {
      body: { dataset: { model: slug }, classList: { contains: () => false } },
      querySelector: () => null,
      addEventListener: (type, handler) => (handlers[type] = handler),
      dispatchEvent: (event) => events.push(event.type),
    },
    location: { pathname: '/' + slug },
    setTimeout: (callback) => {
      const id = scheduled.size + 1;
      scheduled.set(id, callback);
      return id;
    },
    clearTimeout: (id) => scheduled.delete(id),
  });
  return {
    api: window.CMLocalUsage,
    windowHandlers,
    events,
    use() {
      handlers.input({
        isTrusted: true,
        type: 'input',
        target: { closest: () => ({}), matches: () => false },
      });
      for (const callback of scheduled.values()) callback();
      scheduled.clear();
    },
  };
}
const first = page('basic-calculator');
first.use();
assert.deepEqual(
  JSON.parse(store.get(key)),
  { 'previous-calculator': 3, 'basic-calculator': 1 },
  'one-tool catalog must preserve other calculator counts',
);
first.use();
assert.equal(JSON.parse(store.get(key))['basic-calculator'], 1, 'at most one count per page load');
const second = page('scientific-calculator');
second.use();
assert.deepEqual(JSON.parse(store.get(key)), {
  'previous-calculator': 3,
  'basic-calculator': 1,
  'scientific-calculator': 1,
});
second.windowHandlers.storage({ key: preference });
assert.equal(second.events.at(-1), 'cm:usage', 'other-tab consent changes notify visible ranking');
second.api.set(false);
assert.equal(store.has(preference), false);
assert.equal(store.has(key), false);
assert.equal(store.get('unrelated-note'), 'keep');
page('basic-calculator').use();
assert.equal(store.has(key), false, 'usage is off until explicitly enabled');
store.set(
  key,
  JSON.stringify({
    'valid-calculator': 2,
    'bad/slug': 1,
    'negative-count': -1,
    'fractional-count': 1.5,
    'overflow-count': Number.MAX_SAFE_INTEGER + 1,
  }),
);
assert.deepEqual(
  JSON.parse(JSON.stringify(page('basic-calculator').api.read())),
  { 'valid-calculator': 2 },
  'reject malformed slugs and nonpositive or unsafe counts',
);
const denied = page('basic-calculator', {
  getItem() {
    throw Error('denied');
  },
  setItem() {
    throw Error('denied');
  },
  removeItem() {
    throw Error('denied');
  },
});
assert.equal(denied.api.enabled(), false);
assert.equal(denied.api.set(true), false);
assert.deepEqual(JSON.parse(JSON.stringify(denied.api.read())), {});
console.log(
  'Local usage: cross-calculator preservation, one count per load, cross-tab updates, opt-out, validation and denied storage PASS',
);
