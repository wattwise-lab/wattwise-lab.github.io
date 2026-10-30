import fs from 'node:fs/promises';
import { load } from 'cheerio';
import * as espree from 'espree';
const root = new URL('../', import.meta.url),
  read = (p) => fs.readFile(new URL(p, root), 'utf8');
const target = new URL('src/i18n-corpus.json', root);
let corpus = [];
try {
  corpus = JSON.parse(await fs.readFile(target, 'utf8'));
} catch {}
const unique = new Map();
for (const row of corpus) {
  const first = unique.get(row.source);
  if (!first) unique.set(row.source, row);
  else if (row.parts && !first.parts) first.parts = row.parts;
}
corpus = [...unique.values()];
let nextId = Math.max(0, ...corpus.map((x) => Number(x.id))) + 1;
const existing = new Map(corpus.map((x) => [x.source, x]));
for (const row of corpus) row.active = false;
const seen = new Set(corpus.map((x) => x.source));
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
function implementationLiteral(node, parent) {
  if (parent?.type === 'ExpressionStatement' && parent.directive) return true;
  if (parent?.type === 'Property' && parent.key === node && !parent.computed) return true;
  if (parent?.type !== 'CallExpression') return false;
  const method = parent.callee?.property?.name || parent.callee?.name;
  const first = parent.arguments[0] === node;
  if (
    first &&
    [
      '$',
      't',
      'querySelector',
      'querySelectorAll',
      'getElementById',
      'getElementsByClassName',
      'getElementsByTagName',
      'matches',
      'closest',
      'createElement',
      'createElementNS',
      'getAttribute',
      'hasAttribute',
      'removeAttribute',
      'addEventListener',
      'removeEventListener',
      'getItem',
      'setItem',
      'removeItem',
    ].includes(method)
  )
    return true;
  if (method === 'setAttribute') {
    if (first) return true;
    const attribute = parent.arguments[0]?.value;
    return (
      typeof attribute === 'string' &&
      !['title', 'aria-label', 'alt', 'placeholder', 'data-cm-pair'].includes(attribute)
    );
  }
  return (
    parent.callee?.object?.type === 'MemberExpression' &&
    parent.callee.object.property?.name === 'classList'
  );
}
function add(value, origin, parts) {
  let source = normalize(String(value));
  if (/\|[^|]*[\u3400-\u9fff]/.test(source)) source = source.split('|')[0].trim();
  if (
    !/[A-Za-z]{3}/.test(source) ||
    !source ||
    /[\u3400-\u9fff]/.test(source) ||
    /^[a-z]+[A-Z][A-Za-z]*$/.test(source) ||
    /^cm-[a-z-]+\{\d+\}$/.test(source) ||
    source.length > 4500 ||
    source.startsWith('/') ||
    /^[.#][\w-]+(?:\[|\s*[>+,])/.test(source) ||
    source.includes('document.') ||
    source.includes('querySelector') ||
    /<\/?[A-Za-z][^>]*>/.test(source) ||
    (/^[-.#\w]+$/.test(source) && (/[_.#]/.test(source) || source.includes('-')))
  )
    return;
  if (existing.has(source)) {
    existing.get(source).active = true;
    return;
  }
  if (seen.has(source)) return;
  seen.add(source);
  corpus.push({
    active: true,
    id: String(nextId++).padStart(5, '0'),
    source,
    origin,
    ...(parts ? { parts } : {}),
  });
}
function concatParts(node) {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const a = concatParts(node.left),
      b = concatParts(node.right);
    return [...a, ...b];
  }
  if (node.type === 'Literal' && typeof node.value === 'string') return [node.value];
  return [null];
}
function addParts(pieces, file) {
  if (!pieces.some((x) => typeof x === 'string' && /[A-Za-z]{3}/.test(x)) || !pieces.includes(null))
    return;
  let source = '',
    index = 0;
  for (const x of pieces) source += x === null ? '{' + index++ + '}' : x;
  if (/<\/?[A-Za-z][^>]*>/.test(source)) source = load(source).text();
  const matches = [...source.matchAll(/\{(\d+)\}/g)];
  if (!matches.length) return;
  const parts = source.split(/\{\d+\}/);
  add(source, file, { literals: parts, indices: matches.map((m) => Number(m[1])) });
}
for (const file of (await fs.readdir(root)).filter(
  (f) => f.endsWith('.html') && !f.startsWith('._') && !f.startsWith('google'),
)) {
  const $ = load(await read(file));
  $(
    'script,style,svg,code,pre,header,footer,[data-cm-no-translate],[data-cm-language],[data-cm-value]',
  ).remove();
  const walk = (n) => {
    if (n.type === 'text') add(n.data, file);
    for (const child of n.children || []) walk(child);
  };
  $('body').each((_, e) => walk(e));
  $('input,select,textarea,[aria-label],[placeholder]').each((_, e) => {
    for (const key of ['aria-label', 'placeholder']) if ($(e).attr(key)) add($(e).attr(key), file);
  });
}
const files = [
  'assets/cm-metadata-core.js',
  'assets/cm-info-metadata.js',
  'assets/cm-data-core.js',
  'assets/cm-workspace-links.js',
  'assets/cm-core-decisions.js',
  'assets/cm-finance-core.js',
  'assets/cm-calendar-core.js',
  'assets/cm-workspace.js',
  'assets/cm-shell.js',
  'assets/cm-keypad-app.js',
  'assets/cm-tool-page.js',
  'assets/cm-home-v3.js',
  'assets/cm-home-app.js',
  'assets/cm-expanded.js',
  'assets/cm-ranking.js',
  'assets/cm-scenario-editor.js',
  'assets/cm-workspace-tools.js',
  'assets/cm-workspace-intent.js',
  'assets/cm-intent-core.js',
];
for (const dir of ['assets/legacy-models', 'assets/models'])
  try {
    for (const f of await fs.readdir(new URL(dir + '/', root)))
      if (f.endsWith('.js')) files.push(dir + '/' + f);
  } catch {}
for (const file of files) {
  const source = await read(file);
  let tree;
  try {
    tree = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  } catch (e) {
    throw Error(file + ': ' + e.message, { cause: e });
  }
  const walk = (node, parent) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const formula =
        file.startsWith('assets/models/') &&
        parent?.type === 'CallExpression' &&
        ((parent.callee?.name === 'D' && parent.arguments[5] === node) ||
          (parent.callee?.name === 'add' && parent.arguments[6] === node));
      const shellImplementation =
        file === 'assets/cm-shell.js' && !/\|[^|]*[\u3400-\u9fff]/.test(node.value);
      const notationOption =
        parent?.type === 'Property' &&
        parent.value === node &&
        (parent.key.name || parent.key.value) === 'notation';
      if (
        !formula &&
        !shellImplementation &&
        !notationOption &&
        !implementationLiteral(node, parent)
      )
        add(node.value, file);
    }
    if (node.type === 'TemplateLiteral') {
      const parts = node.quasis.map((q) => q.value.cooked || q.value.raw);
      addParts(
        parts.flatMap((p, i) => (i < parts.length - 1 ? [p, null] : [p])),
        file,
      );
    }
    if (
      node.type === 'BinaryExpression' &&
      node.operator === '+' &&
      !(parent?.type === 'BinaryExpression' && parent.operator === '+')
    )
      addParts(concatParts(node), file);
    for (const [k, v] of Object.entries(node))
      if (k !== 'parent' && k !== 'loc' && k !== 'range') {
        if (Array.isArray(v)) v.forEach((x) => walk(x, node));
        else if (v && typeof v === 'object') walk(v, node);
      }
  };
  walk(tree);
}
await fs.writeFile(target, JSON.stringify(corpus, null, 2) + '\n');
let batches = [],
  current = [],
  length = 0;
for (const row of corpus.filter((x) => x.active)) {
  const line = '[' + row.id + '] ' + row.source;
  if (length + line.length + 1 > 4700) {
    batches.push(current);
    current = [];
    length = 0;
  }
  current.push(row);
  length += line.length + 1;
}
if (current.length) batches.push(current);
await fs.writeFile(new URL('../i18n-batches.json', root), JSON.stringify(batches, null, 2) + '\n');
console.log(
  JSON.stringify({
    strings: corpus.length,
    active: corpus.filter((x) => x.active).length,
    characters: corpus.reduce((n, x) => n + x.source.length, 0),
    batches: batches.length,
    templates: corpus.filter((x) => x.parts).length,
    largest: Math.max(...batches.map((a) => a.reduce((n, x) => n + x.source.length + 9, 0))),
  }),
);
