import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Run the actual link runtime with a small DOM adapter; no browser/build is required.
class Element extends EventTarget {
  constructor(tag, doc) {
    super();
    this.tagName = tag;
    this.ownerDocument = doc;
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.value = '';
    this.readOnly = false;
    this.validationMessage = '';
  }
  append(...items) {
    this.children.push(...items);
  }
  replaceChildren(...items) {
    this.children = [];
    this.append(...items);
  }
  before() {}
  after() {}
  get textContent() {
    return this.children.map((item) => item.textContent ?? String(item)).join('');
  }
  set textContent(value) {
    this.replaceChildren(String(value));
  }
  setAttribute(key, value) {
    this.attributes.set(key, String(value));
  }
  getAttribute(key) {
    if (key.startsWith('data-')) {
      const name = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (this.dataset[name] !== undefined) return this.dataset[name];
    }
    return this.attributes.get(key) ?? null;
  }
  hasAttribute(key) {
    return this.getAttribute(key) !== null;
  }
  removeAttribute(key) {
    this.attributes.delete(key);
    if (key.startsWith('data-'))
      delete this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())];
  }
  getClientRects() {
    return [{}];
  }
  setCustomValidity(message) {
    this.validationMessage = message;
  }
  get validity() {
    return { valid: !this.validationMessage, customError: !!this.validationMessage };
  }
}
class Document extends EventTarget {
  constructor() {
    super();
    this.elements = [];
    this.main = this.createElement('main');
  }
  createElement(tag) {
    const element = new Element(tag, this);
    this.elements.push(element);
    return element;
  }
  getElementById(id) {
    return this.elements.find((element) => element.id === id);
  }
  querySelector(selector) {
    return selector === 'main' ? this.main : null;
  }
}
const document = new Document(),
  tasks = [],
  cards = [],
  make = (id) => {
    const element = document.createElement('div');
    element.id = id;
    return element;
  };
make('desk');
make('save-layout');
const window = {
  CMI18n: {
    language: 'en',
    number: String,
    translate: (s) => s,
    pick: (s) => s.split('|')[0],
    apply() {},
  },
  CMCatalog: [],
  CMWorkspace: {
    cards: () => cards,
    results: (card) => card.results(),
  },
};
const context = vm.createContext({
  window,
  document,
  Event,
  requestAnimationFrame: (callback) => tasks.push(callback),
  Option: class {
    constructor(text, value) {
      this.textContent = text;
      this.value = String(value);
    }
  },
});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-unit-contracts.js', import.meta.url), 'utf8'),
  context,
);
window.CMUnits = vm.runInContext('CMUnits', context);
function card(id, slug, unit, value) {
  const doc = new Document(),
    input = doc.createElement('input'),
    frame = new EventTarget();
  input.id = 'power';
  input.type = 'number';
  input.value = String(value);
  frame.contentDocument = doc;
  frame.contentWindow = {
    Event,
    CMCalculatorBridge: { inputs: () => [{ id: 'power', unit, label: 'Power' }] },
  };
  const c = {
    id,
    slug,
    ready: true,
    frame,
    input,
    results: () => [{ key: '0', unit, label: 'Power', value: Number(input.value) }],
  };
  cards.push(c);
  window.CMCatalog.push({ slug, name: slug });
  return c;
}
const source = card(1, 'source', 'W', 400),
  target = card(2, 'target', 'kW', 5);
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-workspace-links.js', import.meta.url), 'utf8'),
  context,
);
const api = window.CMWorkspaceLinks,
  list = document.elements.find((element) => element.className === 'ws-links__list'),
  status = document.elements.find((element) => element.className === 'ws-links__status'),
  form = document.elements.find((element) => element.className === 'ws-links__form');
function flush() {
  let count = 0;
  while (tasks.length) {
    assert.ok(count++ < 100, 'The link runtime must settle.');
    tasks.shift()();
  }
}
function refresh() {
  document.dispatchEvent(new Event('cm:workspace-change'));
  flush();
}
function link(from, to) {
  for (const [id, value] of [
    ['source', from.id],
    ['result', '0'],
    ['destination', to.id],
    ['field', 'power'],
  ]) {
    const input = document.getElementById('ws-link-' + id);
    input.value = String(value);
    input.dispatchEvent(new Event('change'));
  }
  form.dispatchEvent(new Event('submit'));
  flush();
}
flush();
link(source, target);
assert.equal(list.children.length, 1);
assert.equal(target.input.value, '0.4');
assert.equal(target.input.readOnly, true);
assert.match(status.textContent, /Live link created/);
const saved = api.snapshotForCard(source.id);
cards.splice(cards.indexOf(source), 1);
refresh();
assert.equal(list.children.length, 0);
assert.equal(target.input.readOnly, false);
assert.equal(status.textContent, '', 'Removing a linked card clears the stale creation status.');
source.ready = false;
cards.unshift(source);
refresh();
api.restore(saved);
flush();
assert.equal(target.input.readOnly, true, 'A restored link stays locked while its source loads.');
assert.equal(target.input.validity.valid, false);
source.ready = true;
source.frame.dispatchEvent(new Event('load'));
flush();
assert.equal(target.input.value, '0.4');
assert.equal(target.input.validity.valid, true);
assert.equal(target.input.hasAttribute('data-ws-linked'), true);
source.input.value = '600';
source.frame.contentDocument.dispatchEvent(new Event('input'));
flush();
assert.equal(target.input.value, '0.6', 'Undo must restore propagation, not just the old number.');
api.restore(saved);
flush();
assert.equal(list.children.length, 1, 'Restoring a snapshot twice must not duplicate the link.');

const targetSaved = api.snapshotForCard(target.id);
cards.splice(cards.indexOf(target), 1);
refresh();
source.input.value = '700';
cards.push(target);
refresh();
api.restore(targetSaved);
flush();
assert.ok(
  Math.abs(Number(target.input.value) - 0.7) < 1e-12,
  'Undoing destination removal follows the current source.',
);

const conflictSaved = api.snapshotForCard(source.id);
cards.splice(cards.indexOf(source), 1);
refresh();
const replacement = card(3, 'replacement', 'W', 800);
refresh();
link(replacement, target);
cards.unshift(source);
refresh();
api.restore(conflictSaved);
flush();
assert.equal(list.children.length, 1, 'Undo must not overwrite a newly linked destination.');
assert.equal(target.input.value, '0.8');
assert.equal(api.snapshotForCard(source.id).length, 0);

const reverseSaved = api.snapshotForCard(replacement.id);
cards.splice(cards.indexOf(replacement), 1);
refresh();
cards.push(replacement);
refresh();
link(target, replacement);
api.restore(reverseSaved);
flush();
assert.equal(list.children.length, 1, 'Undo must not introduce a cycle after an intervening edit.');
assert.equal(api.snapshotForCard(target.id)[0].source, target.id);

const stale = api.snapshotForCard(target.id);
cards.splice(cards.indexOf(target), 1);
refresh();
const changed = card(target.id, 'different-tool', 'kW', 2);
refresh();
api.restore(stale);
flush();
assert.equal(
  list.children.length,
  0,
  'A snapshot must not attach to a different tool with an old id.',
);
assert.equal(changed.input.readOnly, false);
assert.equal(status.textContent, '');
console.log(
  'workspace links: source/destination Undo, loading pause/recovery, propagation, duplicate, conflict, cycle and stale-id checks passed',
);
