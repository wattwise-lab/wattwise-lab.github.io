import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context = vm.createContext({});
for (const file of ['cm-data-core.js', 'models/core.js', 'models/statistics-a.js'])
  vm.runInContext(
    await fs.readFile(new URL('../assets/' + file, import.meta.url), 'utf8'),
    context,
  );
const calculate = (slug, input) =>
  context.CMModels.models.find((model) => model.slug === slug + '-calculator').calculate(input);
let checks = 0;
function near(actual, expected, label) {
  assert.ok(Number.isFinite(actual), label + ': finite result');
  if (expected === 0 || Math.abs(expected) < 1e-308) assert.equal(actual, expected, label);
  else assert.ok(Math.abs(actual / expected - 1) < 2e-14, label + ': ' + actual);
  checks++;
}

// Independent analytic cases: a constant list has that same mean; signs do not
// affect RMS; the 3-4 pair has RMS sqrt(12.5), and rates 30/60 have HM 40.
for (const [values, expected] of [
  ['0,0,0', 0],
  ['3,4', Math.sqrt(12.5)],
  ['-3,4', Math.sqrt(12.5)],
  ['1e200,-1e200', 1e200],
  ['1e-200,-1e-200', 1e-200],
  ['1e308,1e308', 1e308],
  ['5e-324,-5e-324', 5e-324],
  ['1e308,0,0,0', 5e307],
])
  near(calculate('root-mean-square', { values })[0].value, expected, 'RMS ' + values);
for (const [values, expected] of [
  ['30,60', 40],
  ['1e-310,1e-310', 1e-310],
  ['5e-324,5e-324', 5e-324],
  ['1e308,1e308', 1e308],
  ['1e200,1e200,1e200', 1e200],
  ['3e-200,6e-200', 4e-200],
])
  near(calculate('harmonic-mean', { values })[0].value, expected, 'HM ' + values);
for (const values of ['0,1', '-1,2']) {
  assert.throws(() => calculate('harmonic-mean', { values }));
  checks++;
}

for (const [values, weights, expected] of [
  ['10,20', '1,3', 17.5],
  ['1e308,1e308', '1,3', 1e308],
  ['1e308,-1e308', '1,1', 0],
  ['1e308,1,-1e308', '1,1,1', 1 / 3],
  ['1e308,0', '1e-308,1e308', 1e-308],
  ['1e-308,0', '1e308,1', 1e-308],
  ['3,7', '0,1', 7],
  ['0,0', '1,3', 0],
  [Array(11).fill(Number.MAX_VALUE).join(','), Array(11).fill('1').join(','), Number.MAX_VALUE],
  ['1e308,1e-308,-1e308', '1,1,1', 1e-308 / 3],
])
  near(calculate('weighted-average', { values, weights })[0].value, expected, 'Weighted ' + values);

// A two-point type-7 percentile is a straight segment. Symmetric +/-a has
// quartiles -a/2, 0, a/2, with exact extrema at 0% and 100%.
for (const scale of [1, 1e200, 1e308]) {
  const values = `${-scale},${scale}`;
  const quartiles = calculate('quartiles', { values });
  [-scale / 2, 0, scale / 2].forEach((expected, index) =>
    near(quartiles[index].value, expected, 'Quartile ' + index + ' at ' + scale),
  );
  for (const p of [0, 25, 50, 75, 100])
    near(
      calculate('percentile', { values, p })[0].value,
      (p / 50 - 1) * scale,
      'Percentile ' + p + ' at ' + scale,
    );
}
for (const [values, p, expected] of [
  ['1e308,1.5e308', 50, 1.25e308],
  ['-1.5e308,-1e308', 50, -1.25e308],
  ['1e308', 75, 1e308],
  ['1,2,3,4,5,6,7,8,9', 25, 3],
  ['5e-324,5e-324', 50, 5e-324],
])
  near(calculate('percentile', { values, p })[0].value, expected, 'Percentile ' + values);

console.log(
  `Statistics extremes: ${checks} analytic normal, large, tiny, endpoint and invalid-input checks PASS`,
);
