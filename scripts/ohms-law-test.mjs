import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/ohms-law-calculator-1.js', import.meta.url),
  'utf8',
);
let count = 0;
for (const [mode, x, y, expected] of [
  ['I', 9, 3, 3],
  ['V', 3, 4, 12],
  ['R', 12, 3, 4],
  ['P', 12, 3, 36],
  ['P', 12, 0, 0],
  ['P', 0, 0, 0],
  ['I', 0, 3, 0],
  ['I', 9, 0, null],
  ['R', 12, 0, null],
  ['P', -1, 2, null],
  ['P', '', 2, null],
  ['P', '1e999', 2, null],
]) {
  const nodes = Object.fromEntries(
    [
      'mode',
      'in1',
      'in2',
      'lab1',
      'lab2',
      'resultLabel',
      'result',
      'chipPower',
      'chipCheck',
      'verdict',
      'verdictText',
    ].map((id) => [id, { value: '', textContent: '', className: '', addEventListener() {} }]),
  );
  nodes.mode.value = mode;
  nodes.in1.value = String(x);
  nodes.in2.value = String(y);
  vm.runInNewContext(source, {
    window: { CMI18n: { formatLocale: 'en-US' } },
    document: { getElementById: (id) => nodes[id], querySelectorAll: () => [nodes.in1, nodes.in2] },
  });
  if (expected === null) assert.equal(nodes.result.textContent, '—');
  else assert.equal(Number(nodes.result.textContent.replace(/[^\d.-]/g, '')), expected);
  if (mode === 'P' && Number(y) === 0 && expected !== null)
    assert.equal(nodes.chipCheck.textContent, 'Resistance is undefined at zero current');
  count++;
}
console.log('Ohm’s law: ' + count + ' target, zero, invalid and finite-boundary cases PASS');
