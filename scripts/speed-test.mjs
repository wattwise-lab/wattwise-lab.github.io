import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/velocity-calculator-1.js', import.meta.url),
  'utf8',
);
const cases = [
  [100, 2, '50 km/h', '13.89 m/s', '1.2 min/km'],
  [0, 2, '0 km/h', '0 m/s', '—'],
  [3, 0.25, '12 km/h', '3.33 m/s', '5 min/km'],
  [-1, 1, '—'],
  [1, 0, '—'],
  [1, -1, '—'],
  ['', 1, '—'],
  ['12x', 1, '—'],
  [Infinity, 1, '—'],
  [1, Infinity, '—'],
  [1e300, 1e-300, '—'],
  [1e-300, 1e300, '—'],
];
for (const [dist, time, result, ms, pace] of cases) {
  const nodes = Object.fromEntries(
    ['result', 'chipMs', 'chipPace', 'verdict', 'verdictText'].map((id) => [
      id,
      { textContent: '', className: '' },
    ]),
  );
  const inputs = [
    { id: 'dist', value: String(dist), addEventListener() {} },
    { id: 'time', value: String(time), addEventListener() {} },
  ];
  vm.runInNewContext(source, {
    window: {},
    document: { getElementById: (id) => nodes[id], querySelectorAll: () => inputs },
  });
  assert.equal(nodes.result.textContent, result, `${dist}/${time}`);
  assert.equal(nodes.chipMs.textContent, ms || '—');
  assert.equal(nodes.chipPace.textContent, pace || '—');
}
console.log(
  'Average speed: 3 independent speed/pace/zero references and 9 invalid/numeric-range cases PASS',
);
