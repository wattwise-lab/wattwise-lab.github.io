import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/bmi-calculator-1.js', import.meta.url),
  'utf8',
);
const ids = [
  'result',
  'chipCat',
  'chipPrime',
  'chipRange',
  'cBmi',
  'cCat',
  'cPrime',
  'cPond',
  'cRange',
  'cMetric',
  'barYouVal',
  'barYou',
  'verdict',
  'verdictText',
];
function setup() {
  const nodes = Object.fromEntries(
    ids.map((id) => [id, { textContent: '', style: {}, className: '' }]),
  );
  for (const [id, value] of Object.entries({
    unit: 'metric',
    feet: '5',
    inches: '8.9',
    lb: '160.1',
    cm: '200',
    kg: '80',
  }))
    nodes[id] = {
      id,
      value,
      parentElement: {},
      listeners: {},
      addEventListener(type, fn) {
        this.listeners[type] = fn;
      },
    };
  const inputs = ['unit', 'feet', 'inches', 'lb', 'cm', 'kg'].map((id) => nodes[id]);
  const window = {};
  vm.runInNewContext(source, {
    window,
    document: { getElementById: (id) => nodes[id], querySelectorAll: () => inputs },
  });
  return { nodes, window, render: () => nodes.kg.listeners.input() };
}
const cases = [
  [73.999, 'Underweight'],
  [74, 'Healthy weight'],
  [99.6, 'Healthy weight'],
  [99.8, 'Healthy weight'],
  [99.9999, 'Healthy weight'],
  [100, 'Overweight'],
  [119.9999, 'Overweight'],
  [120, 'Obesity'],
];
for (const [kg, category] of cases) {
  const { nodes: n, render } = setup();
  n.kg.value = String(kg);
  render();
  assert.equal(n.chipCat.textContent, category, `kg=${kg}`);
  assert.equal(n.cRange.textContent, '74–<100 kg (163.1–<220.5 lb)');
}
const imperial = setup();
imperial.nodes.unit.value = 'us';
imperial.render();
assert.equal(imperial.nodes.result.textContent, '23.71');
assert.equal(imperial.nodes.chipCat.textContent, 'Healthy weight');
assert.match(imperial.nodes.cMetric.textContent, /175 cm · 72.6 kg/);
const invalid = [
  { cm: '0' },
  { kg: '0' },
  { cm: '-1' },
  { kg: '-1' },
  { cm: 'Infinity' },
  { kg: 'Infinity' },
  { cm: '170abc' },
  { cm: '' },
  { cm: '1e300' },
  { cm: '1e-300' },
  { unit: 'us', feet: '-1' },
  { unit: 'us', feet: '5.5' },
  { unit: 'us', inches: '12' },
  { unit: 'us', inches: '' },
];
for (const changed of invalid) {
  const { nodes: n, window, render } = setup();
  assert.notEqual(n.cBmi.textContent, '—');
  for (const [id, value] of Object.entries(changed)) n[id].value = value;
  render();
  for (const id of ids.filter((id) => !['barYou', 'verdict', 'verdictText'].includes(id)))
    assert.equal(n[id].textContent, '—', `${JSON.stringify(changed)} ${id}`);
  assert.equal(n.barYou.style.width, '0%');
  assert.equal(window.__summary, '');
  n.unit.value = 'metric';
  n.cm.value = '200';
  n.kg.value = '80';
  render();
  assert.equal(n.chipCat.textContent, 'Healthy weight');
}
console.log(
  `BMI: ${cases.length} independent CDC category boundaries, exact US conversions, excluded upper threshold and ${invalid.length} invalid/recovery states PASS`,
);
