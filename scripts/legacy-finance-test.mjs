import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
async function setup(slug, values, outputs) {
  const nodes = Object.fromEntries(
    [...outputs, 'verdict', 'verdictText'].map((id) => [id, { textContent: '', className: '' }]),
  );
  for (const [id, value] of Object.entries(values))
    nodes[id] = {
      value: String(value),
      addEventListener(_, fn) {
        this.render = fn;
      },
    };
  vm.runInNewContext(
    await fs.readFile(
      new URL('../assets/legacy-models/' + slug + '-1.js', import.meta.url),
      'utf8',
    ),
    {
      window: {
        CMI18n: {
          formatLocale: 'en-US',
          currency: (n, code, options) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: code,
              ...options,
            }).format(n),
          message: (pair, values) => {
            assert.ok(Array.isArray(values), 'Localized message arguments must be an array');
            return pair.split('|')[0].replace(/\{(\d+)\}/g, (_, i) => String(values[i]));
          },
        },
      },
      document: {
        getElementById: (id) => nodes[id],
        querySelectorAll: () => Object.keys(values).map((id) => nodes[id]),
      },
    },
  );
  return { nodes, render: () => nodes[Object.keys(values)[0]].render() };
}
const aprOut = ['result', 'chipEff', 'chipPmt', 'chipTot'];
const read = (s) => Number(s.replace(/[^0-9.-]/g, ''));
for (const [values, annual, effective] of [
  [{ amt: 10000, rate: 6, months: 36, fees: 300 }, 8.06, 8.36],
  [{ amt: 10000, rate: 0, months: 36, fees: 0 }, 0, 0],
  [{ amt: 10000, rate: 6, months: 36, fees: 0 }, 6, 6.17],
  // Independent one-payment closed forms: monthly rate = payment/proceeds - 1.
  [{ amt: 100, rate: 0, months: 1, fees: 90 }, 10800, (10 ** 12 - 1) * 100],
  [{ amt: 100, rate: 0, months: 1, fees: 20 }, 300, (1.25 ** 12 - 1) * 100],
  [{ amt: 100, rate: 12, months: 1, fees: 0 }, 12, (1.01 ** 12 - 1) * 100],
]) {
  const { nodes: n } = await setup('apr-calculator', values, aprOut);
  assert.ok(Math.abs(read(n.result.textContent) - annual) < 0.006, JSON.stringify(values));
  assert.ok(
    Math.abs(read(n.chipEff.textContent) - effective) <
      Math.max(0.006, Math.abs(effective) * 1e-12),
    JSON.stringify(values),
  );
  assert.doesNotMatch(n.verdictText.textContent, /true cost|will approve/);
  assert.ok(
    n.verdictText.textContent.includes(n.result.textContent),
    'APR summary must retain the complete displayed rate',
  );
}
const aprBad = [
  { rate: -1 },
  { rate: Infinity },
  { rate: '12abc' },
  { amt: 0 },
  { amt: '' },
  { fees: -1 },
  { fees: 10000 },
  { months: 0 },
  { months: 1.5 },
  { months: 1201 },
  { months: '' },
  { amt: 1e308, rate: 1000, months: 1200 },
];
for (const bad of aprBad) {
  const { nodes: n, render } = await setup(
    'apr-calculator',
    { amt: 10000, rate: 6, months: 36, fees: 300 },
    aprOut,
  );
  Object.entries(bad).forEach(([id, value]) => (n[id].value = String(value)));
  render();
  for (const id of aprOut) assert.equal(n[id].textContent, '—', JSON.stringify(bad));
  Object.entries({ amt: 10000, rate: 0, months: 36, fees: 0 }).forEach(
    ([id, value]) => (n[id].value = String(value)),
  );
  render();
  assert.equal(n.result.textContent, '0.00%');
}
const dtiOut = [
  'result',
  'chipDebts',
  'chipHousing',
  'bHousing',
  'bHousingPct',
  'bAuto',
  'bAutoPct',
  'bOther',
  'bOtherPct',
  'bTotal',
  'bTotalPct',
];
for (const [values, expected] of [
  [{ income: 6000, housing: 1500, auto: 300, other: 200 }, 33.33],
  [{ income: 100, housing: 36, auto: 0, other: 0 }, 36],
  [{ income: 100, housing: 43, auto: 0, other: 0 }, 43],
  [{ income: 100, housing: 150, auto: 0, other: 0 }, 150],
  [{ income: 100, housing: 0, auto: 0, other: 0 }, 0],
]) {
  const { nodes: n } = await setup('debt-to-income-calculator', values, dtiOut);
  assert.equal(read(n.result.textContent), expected);
  assert.equal(n.verdict.className, 'verdict');
  assert.match(n.verdictText.textContent, /does not predict loan approval/);
  assert.ok(
    n.verdictText.textContent.includes(n.result.textContent),
    'DTI summary must retain the complete displayed ratio',
  );
}
const dtiBad = [
  { income: 0 },
  { income: '' },
  { income: Infinity },
  { housing: '' },
  { auto: -1 },
  { other: '20oops' },
  { housing: 1e308, auto: 1e308 },
];
for (const bad of dtiBad) {
  const { nodes: n, render } = await setup(
    'debt-to-income-calculator',
    { income: 6000, housing: 1500, auto: 300, other: 200 },
    dtiOut,
  );
  Object.entries(bad).forEach(([id, value]) => (n[id].value = String(value)));
  render();
  for (const id of dtiOut) assert.equal(n[id].textContent, '—', JSON.stringify(bad));
}
const fvOut = ['result', 'chipInt', 'chipMult', 'yearRows'];
for (const [values, expected, interest, factor] of [
  [{ pv: 10000, rate: 5, years: 10, n: 1 }, 16288.95, 6288.95, 1.628895],
  [{ pv: 10000, rate: 5, years: 10, n: 12 }, 16470.09, 6470.09, 1.647009],
  [{ pv: 10000, rate: 0, years: 10, n: 12 }, 10000, 0, 1],
  [{ pv: 10000, rate: 5, years: 0, n: 12 }, 10000, 0, 1],
  [{ pv: 0, rate: 5, years: 10, n: 12 }, 0, 0, 1.647009],
  [{ pv: 100, rate: 100, years: 2, n: 1 }, 400, 300, 4],
]) {
  const { nodes: n } = await setup('future-value-calculator', values, fvOut);
  assert.ok(Math.abs(read(n.result.textContent) - expected) < 0.006);
  assert.ok(Math.abs(read(n.chipInt.textContent) - interest) < 0.006);
  assert.ok(Math.abs(read(n.chipMult.textContent) - factor) < 0.000001);
  assert.ok(
    n.yearRows.innerHTML.includes(n.result.textContent),
    'Final row agrees with the primary result for the same horizon',
  );
}
const horizon = await setup(
  'future-value-calculator',
  { pv: 100, rate: 0, years: 7.5, n: 12 },
  fvOut,
);
assert.match(horizon.nodes.yearRows.innerHTML, /7.5 years/);
const fvBad = [
  { pv: '' },
  { pv: -1 },
  { rate: '5bad' },
  { rate: Infinity },
  { years: -1 },
  { n: 0 },
  { n: 1.5 },
  { n: '' },
  { pv: 1e308, rate: 100, years: 1000 },
];
for (const bad of fvBad) {
  const { nodes: n, render } = await setup(
    'future-value-calculator',
    { pv: 10000, rate: 5, years: 10, n: 12 },
    fvOut,
  );
  Object.entries(bad).forEach(([id, value]) => (n[id].value = String(value)));
  render();
  for (const id of fvOut.filter((id) => id !== 'yearRows')) assert.equal(n[id].textContent, '—');
  assert.equal(n.yearRows.innerHTML, '');
}
console.log(
  'Future value: 6 independent annual/monthly/zero-principal/zero-horizon references, fractional final horizon and 9 invalid states PASS',
);
console.log(
  'Legacy finance: 6 independent APR references (zero rate and high-fee roots), 12 invalid/recovery cases, 5 DTI ratios without approval categories and 7 invalid states PASS',
);
