import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/blood-pressure-calculator-1.js', import.meta.url),
  'utf8',
);
const cases = [
  [119, 79, 'Normal'],
  [120, 79, 'Elevated'],
  [129, 79, 'Elevated'],
  [129, 80, 'Stage 1 hypertension'],
  [130, 79, 'Stage 1 hypertension'],
  [139, 89, 'Stage 1 hypertension'],
  [140, 79, 'Stage 2 hypertension'],
  [139, 90, 'Stage 2 hypertension'],
  [180, 120, 'Stage 2 hypertension'],
  [181, 120, 'Very high reading'],
  [180, 121, 'Very high reading'],
  [70, 50, 'Normal'],
  [0, 80, '—'],
  [120, 0, '—'],
  [80, 90, '—'],
  [80, 80, '—'],
  [Infinity, 80, '—'],
  ['135abc', 80, '—'],
];
for (const [sys, dia, expected] of cases) {
  const nodes = Object.fromEntries(
    ['result', 'chipPulse', 'verdict', 'verdictText'].map((id) => [
      id,
      { textContent: '', className: '' },
    ]),
  );
  const inputs = [
    { id: 'sys', value: String(sys), addEventListener() {} },
    { id: 'dia', value: String(dia), addEventListener() {} },
  ];
  const document = { getElementById: (id) => nodes[id], querySelectorAll: () => inputs };
  vm.runInNewContext(source, { document, window: {} });
  assert.equal(nodes.result.textContent, expected, `${sys}/${dia}`);
  if (expected === 'Very high reading') {
    assert.match(nodes.verdictText.textContent, /Without these symptoms/);
    assert.match(nodes.verdictText.textContent, /emergency help immediately/);
  }
  if (expected === 'Normal')
    assert.match(nodes.verdictText.textContent, /does not assess low blood pressure/);
  if (expected !== '—')
    assert.equal(nodes.chipPulse.textContent, `${Number(sys) - Number(dia)} mmHg`);
}
console.log(
  'Adult blood pressure: 18 AHA category boundaries, reversed/invalid readings, pulse differences and symptom distinction PASS',
);
