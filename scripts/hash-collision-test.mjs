import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url),
  context = vm.createContext({ console });
for (const path of ['assets/cm-data-core.js', 'assets/models/core.js', 'assets/models/digital.js'])
  vm.runInContext(await fs.readFile(new URL(path, root), 'utf8'), context);
const model = context.CMModels.models.find(
  (m) => m.slug === 'hash-collision-probability-calculator',
);
assert.ok(model);
// Independently generated with Python Decimal at 420-digit precision: product for small
// counts, exp of the Poisson exponent for large counts, and the pigeonhole boundary.
const references = [
  [0, 1, 0],
  [1, 1, 0],
  [2, 1, 50],
  [3, 1, 100],
  [2, 2, 25],
  [4, 2, 90.625],
  [5, 2, 100],
  [10000, 64, 2.7102343806669675e-10],
  [10001, 64, 2.710776481753208e-10],
  [1000000, 64, 2.710502683974205e-6],
  [2, 1024, 5.5626846462680035e-307],
  [10000, 1024, 2.7810641889016883e-299],
  [10001, 1024, 2.781620457366315e-299],
  [1000000, 1024, 2.7813395417916786e-295],
];
for (const [n, b, expected] of references) {
  const value = model.calculate({ n, b })[0].value;
  if (expected === 0) assert.equal(value, 0);
  else
    assert.ok(
      Math.abs(value - expected) <= Math.max(Number.MIN_VALUE, Math.abs(expected) * 2e-12),
      JSON.stringify({ n, b, value, expected }),
    );
}
const invalid = [
  { n: -1, b: 64 },
  { n: 1.5, b: 64 },
  { n: 1e15 + 1, b: 64 },
  { n: Infinity, b: 64 },
  { n: NaN, b: 64 },
  { n: 2, b: 0 },
  { n: 2, b: 1025 },
  { n: 2, b: 1.5 },
  { n: 2, b: Infinity },
  { n: 2, b: NaN },
];
for (const values of invalid) assert.throws(() => model.calculate(values));
assert.equal(model.calculate({ n: 2, b: 1 })[0].value, 50);
console.log(
  'Hash collision: 14 independent references including exact small spaces, pigeonhole certainty and 1024-bit tiny probabilities; 10 invalid states and recovery PASS',
);
