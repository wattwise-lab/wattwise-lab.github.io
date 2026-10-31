// Reference probabilities independently computed with Python Decimal(60 digits),
// Poisson recurrence and math.erfc. These include tails and the largest supported Poisson mean.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(await fs.readFile(new URL('../assets/models/core.js', import.meta.url), 'utf8'), c);
const M = c.CMModels;
const gamma = [
  [1, 1, 0.6321205588285577],
  [10, 10, 0.5420702855281478],
  [100, 100, 0.5132987982791487],
  [1000, 1000, 0.5042052441802155],
  [10000, 10000, 0.5013298083399552],
  [10000, 9950, 0.3094178848611826],
  [10000, 10100, 0.8413487504471796],
  [10001, 10000, 0.4973404187809924],
];
for (const [a, x, expected] of gamma) {
  assert.ok(Math.abs(M.gammaP(a, x) - expected) < 3e-11, `P(${a},${x})`);
  assert.ok(Math.abs(M.gammaP(a, x) + M.gammaQ(a, x) - 1) < 1e-14);
}
for (const [x, expected] of [
  [-10, 7.619853024160593e-24],
  [-5, 2.866515718791945e-7],
  [-3, 0.0013498980316300957],
  [-1, 0.15865525393145705],
  [0, 0.5],
  [1, 0.8413447460685429],
  [3, 0.9986501019683699],
  [5, 0.9999997133484281],
])
  assert.ok(
    Math.abs(M.normal(x) - expected) < 2e-13 * Math.abs(expected),
    `Φ(${x}): ${M.normal(x)}`,
  );
assert.ok(M.gammaQ(0.5, 50) > 0, 'Chi-square tail remains positive');
assert.ok(Math.abs(M.gammaQ(0.5, 50) - 1.5239706048321186e-23) < 1e-34);
for (const p of [1e-12, 1e-6, 0.01, 0.5, 0.99, 0.999999])
  assert.ok(Math.abs(M.normal(M.invNormal(p)) - p) < Math.min(p, 1 - p) * 2e-5);
console.log(
  'Probability: 8 gamma references, 8 normal references, tail preservation and 6 inverse round trips PASS',
);

// Independent identities: symmetry, beta(1,b) closed form, binomial n fair coins,
// and the Cauchy (Student t with one degree of freedom) survival probability.
for (const a of [1, 1000, 100000, 1000000]) assert.equal(M.beta(0.5, a, a), 0.5);
for (const [x, b] of [
  [0.1, 1],
  [0.1, 8],
  [0.001, 100000],
]) {
  const expected = -Math.expm1(b * Math.log1p(-x));
  assert.ok(Math.abs(M.beta(x, 1, b) - expected) < 1e-9, `beta closed form ${x},${b}`);
}
for (const t of [0, 1, 10, 10000]) {
  const expected = t === 0 ? 1 : (2 * Math.atan(1 / t)) / Math.PI;
  assert.ok(Math.abs(M.tP(t, 1) - expected) < Math.max(1e-14, expected * 1e-10), `Cauchy t=${t}`);
}
assert.throws(() => M.beta(0.5, 1e8, 1e8), /supported numeric range/);
assert.throws(() => M.beta(0.5, -1, 1), /supported numeric range/);
vm.runInContext(
  await fs.readFile(new URL('../assets/models/statistics-b.js', import.meta.url), 'utf8'),
  c,
);
const binomialCdf = M.models.find((m) => m.slug === 'binomial-cumulative-calculator');
for (const [n, k, p, tail] of [
  [100, 99, 50, 0.5 ** 100],
  [100, 0, 50, 1 - 0.5 ** 100],
  [100, 100, 50, 0],
  [10, 0, 0, 0],
  [10, 9, 100, 1],
]) {
  const rows = binomialCdf.calculate({ n, k, p });
  assert.ok(
    Math.abs(rows[1].value / 100 - tail) <= Math.max(1e-45, Math.abs(tail) * 1e-10),
    `binomial upper ${n},${k},${p}`,
  );
  assert.ok(Math.abs((rows[0].value + rows[1].value) / 100 - 1) < 1e-12);
}
console.log(
  'Beta/binomial: symmetry, closed forms, Cauchy tails, supported-range rejection and tiny upper tails PASS',
);
