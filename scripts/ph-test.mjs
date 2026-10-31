import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/ph-calculator-1.js', import.meta.url),
  'utf8',
);
for (const [value, ph, poh, oh] of [
  ['1e-7', 7, 7, 1e-7],
  ['0.0001', 4, 10, 1e-10],
  ['1e-10', 10, 4, 1e-4],
  ['10', -1, 15, 1e-15],
  ['0', null],
  ['-1', null],
  ['', null],
  ['1e-7abc', null],
  ['Infinity', null],
  ['5e-324', null],
]) {
  const ids = ['result', 'chipPoh', 'chipOh', 'verdict', 'verdictText'],
    nodes = Object.fromEntries(ids.map((id) => [id, { textContent: '', className: '' }]));
  nodes.h = { value, addEventListener() {} };
  const document = { getElementById: (id) => nodes[id], querySelectorAll: () => [nodes.h] };
  vm.runInNewContext(source, { document, window: {} });
  if (ph === null) {
    assert.equal(nodes.result.textContent, '—', value);
    assert.equal(nodes.chipOh.textContent, '—');
  } else {
    assert.equal(Number(nodes.result.textContent), ph);
    assert.equal(Number(nodes.chipPoh.textContent), poh);
    const m = nodes.chipOh.textContent.match(/^([\d.]+) × 10\^(-?\d+) mol\/L$/);
    assert.ok(m, value);
    assert.ok(Math.abs((Number(m[1]) * 10 ** Number(m[2])) / oh - 1) < 1e-12, value);
  }
}
console.log('pH: 4 concentration-based reference cases and 6 invalid/numeric-boundary cases PASS');
