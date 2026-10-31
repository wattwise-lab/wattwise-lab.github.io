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
  if (parent?.type === 'MemberExpression' && parent.computed && parent.property === node)
    return true;
  if (node.type === 'Literal' && typeof node.value === 'string' && /^cm:[a-z-]+$/.test(node.value))
    return true;
  if (parent?.type === 'ExpressionStatement' && parent.directive) return true;
  if (parent?.type === 'Property' && parent.key === node && !parent.computed) return true;
  // Comparison operands, event names and DOM configuration are program data.
  // A matching string used as visible copy elsewhere is still extracted there.
  if (
    parent?.type === 'BinaryExpression' &&
    ['===', '!==', '==', '!=', '<', '>', '<=', '>='].includes(parent.operator)
  )
    return true;
  if (
    parent?.type === 'NewExpression' &&
    (parent.callee?.name === 'RegExp' ||
      (['Event', 'CustomEvent'].includes(parent.callee?.name || parent.callee?.property?.name) &&
        parent.arguments[0] === node))
  )
    return true;
  const implementationProperties = [
    'type',
    'className',
    'id',
    'dir',
    'inputMode',
    'htmlFor',
    'role',
    'scope',
    'autocomplete',
    'step',
    'hash',
    'download',
    'rel',
    'target',
    'transform',
    'calendar',
    'timeZone',
    'dateStyle',
    'timeStyle',
    'weekday',
    'year',
    'month',
    'day',
    'hour',
    'minute',
    'second',
    'sensitivity',
    'block',
    'inline',
    'behavior',
    'vclass',
    'style',
    'unitDisplay',
    'numeric',
    'kind',
    'reason',
    'field',
    'src',
    'href',
    'class',
    'cmAction',
  ];
  if (
    parent?.type === 'AssignmentExpression' &&
    parent.right === node &&
    parent.left.type === 'MemberExpression' &&
    implementationProperties.includes(parent.left.property.name || parent.left.property.value)
  )
    return true;
  if (
    parent?.type === 'Property' &&
    parent.value === node &&
    implementationProperties.includes(parent.key.name || parent.key.value)
  )
    return true;
  if (parent?.type !== 'CallExpression') return false;
  const method = parent.callee?.property?.name || parent.callee?.name;
  const first = parent.arguments[0] === node;
  if (
    first &&
    [
      '$',
      'el',
      'shape',
      't',
      'matchMedia',
      'normalize',
      'startsWith',
      'endsWith',
      'get',
      'set',
      'delete',
      'has',
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
      'insertAdjacentHTML',
    ].includes(method)
  )
    return true;
  if (
    parent?.type === 'NewExpression' &&
    parent.callee?.name === 'Option' &&
    parent.arguments[1] === node
  )
    return true;
  if (
    (method === 'createElementNS' && parent.arguments[1] === node) ||
    (method === 'getOwnPropertyDescriptor' && parent.arguments[1] === node)
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
    /^https?:\/\/\S+$/.test(source) ||
    /^[?&][\w-]+=[^\s]*$/.test(source) ||
    /^[.#][\w-]+(?:\[|\s*[>+,])/.test(source) ||
    source.includes('document.') ||
    source.includes('querySelector') ||
    /^['"]?\s*(?:style|class|id|data-[\w-]+)=/.test(source) ||
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
    // This shared formatter's strings are Intl unit identifiers and authored
    // CMUiCopy keys; they are not additional untranslated interface messages.
    if (
      file === 'assets/cm-data-core.js' &&
      node.type === 'FunctionDeclaration' &&
      node.id?.name === 'unit'
    )
      return;
    if (implementationLiteral(node, parent)) return;
    if (
      parent?.type === 'CallExpression' &&
      ((parent.callee?.name === 'pair' &&
        ['assets/cm-core-decisions.js', 'assets/cm-workspace-links.js'].includes(file) &&
        parent.arguments[0] === node) ||
        (parent.callee?.name === 'el' &&
          [
            'assets/cm-workspace.js',
            'assets/cm-workspace-links.js',
            'assets/cm-core-decisions.js',
            'assets/cm-workspace-tools.js',
          ].includes(file) &&
          parent.arguments[1] === node))
    )
      return;
    if (
      (node.type === 'ArrayExpression' &&
        parent?.type === 'ForOfStatement' &&
        ['attribute', 'type'].includes(parent.left?.declarations?.[0]?.id?.name)) ||
      (node.type === 'Literal' &&
        ((['assets/cm-home-v3.js', 'assets/cm-home-app.js', 'assets/cm-workspace.js'].includes(
          file,
        ) &&
          node.value === 'all') ||
          (file === 'assets/cm-home-v3.js' &&
            ['recommended', 'name', 'domain', 'page', 'sort', 'category'].includes(node.value)) ||
          (file === 'assets/cm-keypad-app.js' && ['back', 'sqrt('].includes(node.value)))) ||
      (parent?.type === 'CallExpression' &&
        parent.callee?.name === 'Error' &&
        parent.arguments[0] === node &&
        node.value === 'state') ||
      (file === 'assets/cm-finance-core.js' &&
        node.type === 'VariableDeclarator' &&
        node.id?.name === 'taxbase') ||
      (file === 'assets/models/core.js' &&
        ((node.type === 'VariableDeclarator' && node.id?.name === 'canonical') ||
          (parent?.type === 'CallExpression' &&
            parent.callee?.name === 'check' &&
            parent.arguments[1] === node &&
            node.type === 'BinaryExpression' &&
            node.left?.value?.startsWith('Duplicate model:'))))
    )
      return;
    if (
      (node.type === 'AssignmentPattern' && ['type', 'step'].includes(node.left?.name)) ||
      (file.startsWith('assets/legacy-models/') &&
        ((node.type === 'ArrayExpression' &&
          node.elements.length &&
          node.elements.every(
            (item) => item?.type === 'Literal' && /^[a-z][\w-]*$/.test(item.value),
          ) &&
          ((parent?.type === 'MemberExpression' &&
            ['forEach', 'map'].includes(parent.property?.name)) ||
            parent?.type === 'ForOfStatement' ||
            (parent?.type === 'VariableDeclarator' &&
              ['out', 'UNITS'].includes(parent.id?.name)))) ||
          (parent?.type === 'CallExpression' &&
            ((parent.callee?.name === 'barRow' && parent.arguments[4] === node) ||
              (parent.callee?.name === 'setVerdict' && parent.arguments[0] === node))))) ||
      (file === 'assets/cm-calendar-core.js' &&
        node.type === 'FunctionDeclaration' &&
        ['duration', 'relativeDays'].includes(node.id?.name)) ||
      (file === 'assets/models/core.js' && node.type === 'ThrowStatement') ||
      (file === 'assets/cm-workspace.js' &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'button' &&
        parent.arguments[0] === node) ||
      (file.startsWith('assets/models/') &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'pct' &&
        parent.arguments[0] === node)
    )
      return;
    if (
      (file === 'assets/cm-workspace.js' &&
        node.type === 'VariableDeclarator' &&
        node.id?.name === 'commonKeys') ||
      (file === 'assets/legacy-models/molar-mass-calculator-1.js' &&
        node.type === 'ThrowStatement') ||
      (file === 'assets/models/original-scenarios.js' &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'col' &&
        parent.arguments[2] === node) ||
      (file === 'assets/legacy-models/ai-workflow-savings-1.js' &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'barRow' &&
        parent.arguments[4] === node)
    )
      return;
    if (
      (file === 'assets/cm-finance-core.js' &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'numeric' &&
        parent.arguments[1] === node) ||
      (file === 'assets/cm-core-decisions.js' &&
        ((node.type === 'Property' && (node.key.name || node.key.value) === 'axis') ||
          (node.type === 'AssignmentExpression' && node.left?.name === 'id'))) ||
      (file === 'assets/cm-ranking.js' &&
        node.type === 'AssignmentExpression' &&
        node.left?.property?.name === 'value') ||
      (file === 'assets/models/finance-b.js' &&
        parent?.type === 'CallExpression' &&
        parent.callee?.name === 'run' &&
        parent.arguments[0] === node)
    )
      return;
    if (
      (file === 'assets/cm-expanded.js' &&
        node.type === 'VariableDeclarator' &&
        node.id?.name === 'presentations') ||
      (file === 'assets/cm-intent-core.js' &&
        node.type === 'Property' &&
        (node.key.name || node.key.value) === 'words') ||
      (node.type === 'ArrayExpression' &&
        parent?.type === 'MemberExpression' &&
        parent.object === node &&
        parent.property?.name === 'includes')
    )
      return;
    // Intent aliases and select/converter values are stable program identifiers;
    // retain the separate human-readable label in each definition.
    if (
      node.type === 'ArrayExpression' &&
      node.elements[0]?.type === 'Literal' &&
      typeof node.elements[0]?.value === 'string' &&
      node.elements[1]?.type === 'Literal' &&
      typeof node.elements[1]?.value === 'string' &&
      ((file === 'assets/cm-intent-core.js' &&
        node.elements.length === 3 &&
        node.elements[2]?.type === 'ArrayExpression') ||
        (file.startsWith('assets/models/') &&
          ((node.elements.length === 2 && /\|[^|]*[\u3400-\u9fff]/.test(node.elements[1].value)) ||
            file === 'assets/models/converters.js')))
    ) {
      walk(node.elements[1], node);
      for (const child of node.elements.slice(2))
        if (file !== 'assets/cm-intent-core.js') walk(child, node);
      return;
    }
    if (file.startsWith('assets/models/') && parent?.type === 'CallExpression') {
      const callee = parent.callee?.name;
      if (
        (callee === 'select' && parent.arguments[2] === node) ||
        (file === 'assets/models/converters.js' &&
          callee === 'C' &&
          [parent.arguments[4], parent.arguments[5]].includes(node))
      )
        return;
      // Expected vectors and explicitly literal result values are data, not UI copy.
      if (
        (node.type === 'ArrayExpression' &&
          ((callee === 'D' && parent.arguments[6] === node) ||
            (callee === 'add' && parent.arguments[7] === node))) ||
        (['R', 'row'].includes(callee) &&
          parent.arguments[1] === node &&
          parent.arguments[3]?.properties?.some(
            (property) =>
              (property.key.name || property.key.value) === 'literal' &&
              property.value.value === true,
          ))
      )
        return;
    }
    if (
      file.startsWith('assets/models/') &&
      parent?.type === 'CallExpression' &&
      parent.arguments[0] === node &&
      ['n', 'p', 'u', 'i', 'text', 'select', 'add', 'C', 'D', 'col'].includes(parent.callee?.name)
    )
      return;
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const formula =
        file.startsWith('assets/models/') &&
        !/\|[^|]*[\u3400-\u9fff]/.test(node.value) &&
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
