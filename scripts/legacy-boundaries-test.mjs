import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
async function setup(slug, values, outputs) {
  const nodes = Object.fromEntries(
    [...Object.keys(values), ...outputs, 'verdict', 'verdictText', 'barYou', 'barOther'].map(
      (id) => [
        id,
        {
          id,
          type: ['sex', 'act'].includes(id) ? 'select-one' : 'number',
          value: String(values[id] ?? ''),
          textContent: '',
          style: {},
          addEventListener(_, fn) {
            this.render = fn;
          },
        },
      ],
    ),
  );
  const window = {
    CMI18n: {
      formatLocale: 'en-US',
      message(pair, values) {
        assert.ok(Array.isArray(values));
        return pair.split('|')[0].replace(/\{(\d+)\}/g, (_, i) => values[i]);
      },
    },
  };
  vm.runInNewContext(
    await fs.readFile(
      new URL('../assets/legacy-models/' + slug + '-1.js', import.meta.url),
      'utf8',
    ),
    { window, document: { getElementById: (id) => nodes[id] } },
  );
  return { nodes, window, render: () => nodes[Object.keys(values)[0]].render() };
}
const idealOut = [
  'result',
  'chipH',
  'chipOther',
  'chipBmi',
  'cIdeal',
  'cOther',
  'cInch',
  'cBmi',
  'cLb',
  'barYouVal',
  'barOtherVal',
];
for (const [cm, sex, expected] of [
  [152.4, 'female', '45.5 kg'],
  [152.4, 'male', '50 kg'],
  [182.88, 'male', '77.6 kg'],
  [182.88, 'female', '73.1 kg'],
  [170, 'female', '61.4 kg'],
]) {
  const { nodes } = await setup('ideal-weight-calculator', { cm, sex }, idealOut);
  assert.equal(nodes.result.textContent, expected);
  assert.equal(nodes.cIdeal.textContent, expected);
}
for (const changed of [
  { cm: 152.399 },
  { cm: 0 },
  { cm: '' },
  { cm: '170x' },
  { cm: Infinity },
  { cm: 1e308 },
  { sex: 'unknown' },
]) {
  const { nodes, window, render } = await setup(
    'ideal-weight-calculator',
    { cm: 170, sex: 'female' },
    idealOut,
  );
  Object.entries(changed).forEach(([id, value]) => {
    nodes[id].value = String(value);
  });
  render();
  idealOut.forEach((id) => assert.equal(nodes[id].textContent, '—', id));
  assert.equal(nodes.barYou.style.width, '0%');
  assert.equal(nodes.barOther.style.width, '0%');
  assert.equal(window.__summary, '');
  nodes.cm.value = '170';
  nodes.sex.value = 'female';
  render();
  assert.equal(nodes.result.textContent, '61.4 kg');
}
const infOut = ['result', 'chipFac', 'chipBack'];
for (const [amt, inf, first, last, expected, reverse] of [
  [100, 3, 2000, 2026, '$215.66', '$46.37'],
  [100, -20, 2000, 2002, '$64.00', '$156.25'],
  [100, 0, 2000, 2002, '$100.00', '$100.00'],
  [0, 3, 2000, 2026, '$0.00', '$46.37'],
  [100, (Math.sqrt(1.5) - 1) * 100, 2020, 2022, '$150.00', '$66.67'],
]) {
  const { nodes } = await setup('inflation-calculator', { amt, y1: first, y2: last, inf }, infOut);
  assert.equal(nodes.result.textContent, expected);
  assert.equal(nodes.chipBack.textContent, reverse);
  assert.doesNotMatch(nodes.verdictText.textContent, /Prices rose -/);
}
for (const changed of [
  { amt: '' },
  { amt: -1 },
  { inf: '' },
  { inf: -100 },
  { inf: Infinity },
  { inf: '3x' },
  { y1: 2000.5 },
  { y2: 2000 },
  { y1: 0 },
  { y2: 10000 },
  { inf: 1e308 },
  { amt: 1e308 },
  { inf: -99.999, y1: 1, y2: 9999 },
]) {
  const { nodes, window, render } = await setup(
    'inflation-calculator',
    { amt: 100, y1: 2000, y2: 2026, inf: 3 },
    infOut,
  );
  Object.entries(changed).forEach(([id, value]) => {
    nodes[id].value = String(value);
  });
  render();
  infOut.forEach((id) => assert.equal(nodes[id].textContent, '—', id));
  assert.equal(window.__summary, '');
}
const linearOut = ['result', 'chipLine', 'chipXint', 'chipYint'];
for (const [a, b, m, c, root, intercept] of [
  [3, 6, 2, 3, 'x = -2.00', '-1.50'],
  [0, 0, 0, 0, 'Every x', 'Every x (the x-axis)'],
  [0, 3, 0, 5, 'No solution', 'None (horizontal line)'],
  [2, -8, -2, -4, 'x = 4.00', '-2.00'],
]) {
  const { nodes } = await setup('linear-equation-calculator', { a, b, m, c }, linearOut);
  assert.equal(nodes.result.textContent, root);
  assert.equal(nodes.chipXint.textContent, intercept);
  assert.doesNotMatch(nodes.chipLine.textContent, /\+ -/);
}
for (const changed of [
  { a: '' },
  { b: Infinity },
  { m: '2x' },
  { c: NaN },
  { a: 1e-320, b: 1 },
  { m: 1e-320, c: 1 },
]) {
  const { nodes, window, render } = await setup(
    'linear-equation-calculator',
    { a: 3, b: 6, m: 2, c: 3 },
    linearOut,
  );
  Object.entries(changed).forEach(([id, value]) => {
    nodes[id].value = String(value);
  });
  render();
  linearOut.forEach((id) => assert.equal(nodes[id].textContent, '—', id));
  assert.equal(window.__summary, '');
}
const pvOut = ['result', 'chipDisc', 'chip5'];
for (const [fv, rate, years, expected, discount] of [
  [10000, 5, 10, '$6,139.13', '$3,860.87'],
  [10000, 5, 5, '$7,835.26', '$2,164.74'],
  [0, 5, 10, '$0.00', '$0.00'],
  [10000, 0, 10, '$10,000.00', '$0.00'],
  [10000, 5, 0, '$10,000.00', '$0.00'],
  [10000, 5, 0.5, '$9,759.00', '$241.00'],
]) {
  const { nodes } = await setup('present-value-calculator', { fv, rate, years }, pvOut);
  assert.equal(nodes.result.textContent, expected);
  assert.equal(nodes.chipDisc.textContent, discount);
  assert.doesNotMatch(nodes.verdictText.textContent, /Infinity|NaN/);
}
for (const changed of [
  { fv: '' },
  { rate: '' },
  { years: '' },
  { fv: -1 },
  { rate: -1 },
  { years: -1 },
  { fv: Infinity },
  { rate: NaN },
  { years: '2x' },
  { rate: 1e308, years: 1000 },
]) {
  const { nodes, window, render } = await setup(
    'present-value-calculator',
    { fv: 10000, rate: 5, years: 10 },
    pvOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  pvOut.forEach((id) => assert.equal(nodes[id].textContent, '—', id));
  assert.equal(window.__summary, '');
  nodes.fv.value = '10000';
  nodes.rate.value = '5';
  nodes.years.value = '10';
  render();
  assert.equal(nodes.result.textContent, '$6,139.13');
}
const subOut = ['result', 'chips', 'compRows', 'bars', 'cumRows'];
for (const [fee, uses, alt, idle, expected, compared] of [
  [68, 2, 12, 4, '$624.00', '$192.00'],
  [68, 2, 12, 0, '$528.00', '$288.00'],
  [68, 2, 12, 12, '$816.00', '$0.00'],
  [68, 100, 12, 0, '$0.00', '$14,400.00'],
  [0, 2, 12, 4, '$0.00', '$192.00'],
  [68, 0, 12, 4, '$816.00', '$0.00'],
  [68, 2, 0, 4, '$816.00', '$0.00'],
  [68, 2, 12, 4.5, '$636.00', '$180.00'],
]) {
  const { nodes } = await setup('subscription-waste', { fee, uses, alt, idle }, subOut);
  assert.equal(nodes.result.textContent, expected);
  assert.ok(nodes.chips.innerHTML.includes(compared));
  for (const id of ['chips', 'compRows', 'bars', 'cumRows'])
    assert.doesNotMatch(nodes[id].innerHTML, /Infinity|NaN/);
  assert.doesNotMatch(nodes.verdictText.textContent, /penalty|overlap/);
}
for (const changed of [
  { fee: '' },
  { uses: '' },
  { alt: '' },
  { idle: '' },
  { fee: -1 },
  { uses: -1 },
  { alt: -1 },
  { idle: -1 },
  { idle: 12.01 },
  { fee: Infinity },
  { uses: '2x' },
  { alt: 1e308, uses: 1e308 },
  { fee: 1e308 },
]) {
  const { nodes, window, render } = await setup(
    'subscription-waste',
    { fee: 68, uses: 2, alt: 12, idle: 4 },
    subOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  assert.equal(nodes.result.textContent, '—');
  ['chips', 'compRows', 'bars', 'cumRows'].forEach((id) => assert.equal(nodes[id].innerHTML, ''));
  assert.equal(window.__summary, '');
  nodes.fee.value = '68';
  nodes.uses.value = '2';
  nodes.alt.value = '12';
  nodes.idle.value = '4';
  render();
  assert.equal(nodes.result.textContent, '$624.00');
}
const bfOut = [
  'result',
  'chipBmi',
  'chipFat',
  'chipLean',
  'cBmi',
  'cBf',
  'cFat',
  'cLean',
  'cOther',
  'barYouVal',
  'barOtherVal',
];
for (const [kg, cm, age, sex, expected, other] of [
  [65, 170, 30, 'female', '28.5 %', '17.7 %'],
  [65, 170, 30, 'male', '17.7 %', '28.5 %'],
  [65, 170, 18, 'female', '25.7 %', '14.9 %'],
  [10, 200, 40, 'female', '6.8 %', '—'],
  [336, 200, 20, 'female', '100 %', '89.2 %'],
]) {
  const { nodes } = await setup('body-fat-calculator', { kg, cm, age, sex }, bfOut);
  assert.equal(nodes.result.textContent, expected);
  assert.equal(nodes.cOther.textContent, other);
  if (other === '—') assert.equal(nodes.barOther.style.width, '0%');
}
for (const changed of [
  { kg: '' },
  { cm: '' },
  { age: '' },
  { kg: 0 },
  { cm: 0 },
  { age: 17.999 },
  { age: -1 },
  { kg: -1 },
  { kg: Infinity },
  { cm: NaN },
  { age: '30x' },
  { sex: 'unknown' },
  { kg: 1e308 },
  { kg: 10, cm: 200, sex: 'male' },
  { kg: 336.001, cm: 200, age: 20, sex: 'female' },
]) {
  const { nodes, window, render } = await setup(
    'body-fat-calculator',
    { kg: 65, cm: 170, age: 30, sex: 'female' },
    bfOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  bfOut.forEach((id) => assert.equal(nodes[id].textContent, '—'));
  assert.equal(nodes.barYou.style.width, '0%');
  assert.equal(nodes.barOther.style.width, '0%');
  assert.equal(window.__summary, '');
  nodes.kg.value = '65';
  nodes.cm.value = '170';
  nodes.age.value = '30';
  nodes.sex.value = 'female';
  render();
  assert.equal(nodes.result.textContent, '28.5 %');
}
const bmrOut = [
  'result',
  'chipWeek',
  'chipMonth',
  'chipOther',
  'cDay',
  'cWeek',
  'cMonth',
  'cOther',
  'barYouVal',
  'barOtherVal',
];
const tdeeOut = [
  'result',
  'chipBmr',
  'chipWeek',
  'chipAct',
  'barSedVal',
  'barYouVal',
  'barExtVal',
  'lvlRows',
  'barSed',
  'barExt',
];
const waterOut = [
  'result',
  'chipBase',
  'chipEx',
  'chipL',
  'cBase',
  'cEx',
  'cExtra',
  'cTotal',
  'cL',
  'cCups',
  'barBaseVal',
  'barExVal',
  'barTotVal',
  'barBase',
  'barEx',
  'barTot',
];
for (const [kg, cm, age, sex, expected] of [
  [65, 170, 30, 'female', '1,401.5 kcal/day'],
  [65, 170, 30, 'male', '1,567.5 kcal/day'],
  [65, 170, 18, 'female', '1,461.5 kcal/day'],
  [100, 200, 40, 'male', '2,055 kcal/day'],
  [100, 200, 40, 'female', '1,889 kcal/day'],
]) {
  const { nodes } = await setup('bmr-calculator', { kg, cm, age, sex }, bmrOut);
  assert.equal(nodes.result.textContent, expected);
}
for (const [act, expected] of [
  [1.2, '1,681.8 kcal/day'],
  [1.375, '1,927.1 kcal/day'],
  [1.55, '2,172.3 kcal/day'],
  [1.725, '2,417.6 kcal/day'],
  [1.9, '2,662.9 kcal/day'],
]) {
  const { nodes } = await setup(
    'tdee-calculator',
    { kg: 65, cm: 170, age: 30, sex: 'female', act },
    tdeeOut,
  );
  assert.equal(nodes.result.textContent, expected);
  assert.equal((nodes.lvlRows.innerHTML.match(/<tr>/g) || []).length, 5);
}
for (const slug of ['bmr-calculator', 'tdee-calculator']) {
  const outputs = slug === 'bmr-calculator' ? bmrOut : tdeeOut;
  for (const changed of [
    { kg: '' },
    { cm: '' },
    { age: '' },
    { kg: 0 },
    { cm: 0 },
    { age: 17.999 },
    { kg: Infinity },
    { cm: NaN },
    { age: '30x' },
    { sex: 'unknown' },
    { kg: 1e308 },
    { kg: 1, cm: 1 },
    ...(slug === 'tdee-calculator' ? [{ act: '1.375x' }, { act: 0 }, { act: 2 }] : []),
  ]) {
    const { nodes, window, render } = await setup(
      slug,
      {
        kg: 65,
        cm: 170,
        age: 30,
        sex: 'female',
        ...(slug === 'tdee-calculator' ? { act: 1.375 } : {}),
      },
      outputs,
    );
    Object.entries(changed).forEach(([id, v]) => {
      nodes[id].value = String(v);
    });
    render();
    assert.equal(nodes.result.textContent, '—');
    assert.equal(window.__summary, '');
    if (slug === 'tdee-calculator') assert.equal(nodes.lvlRows.innerHTML, '');
    else bmrOut.forEach((id) => assert.equal(nodes[id].textContent, '—'));
    nodes.kg.value = '65';
    nodes.cm.value = '170';
    nodes.age.value = '30';
    nodes.sex.value = 'female';
    if (nodes.act) nodes.act.value = '1.375';
    render();
    assert.equal(
      nodes.result.textContent,
      slug === 'bmr-calculator' ? '1,401.5 kcal/day' : '1,927.1 kcal/day',
    );
  }
}
for (const [kg, ex, extra, expected] of [
  [65, 30, 0, '2,625 ml/day'],
  [65, 0, 0, '2,275 ml/day'],
  [65, 15, 0, '2,450 ml/day'],
  [70, 60, 500, '3,650 ml/day'],
]) {
  const { nodes } = await setup('water-intake-calculator', { kg, ex, extra }, waterOut);
  assert.equal(nodes.result.textContent, expected);
}
for (const changed of [
  { kg: '' },
  { ex: '' },
  { extra: '' },
  { kg: 0 },
  { kg: -1 },
  { ex: -1 },
  { extra: -1 },
  { kg: Infinity },
  { ex: '30x' },
  { extra: NaN },
  { kg: 1e308 },
  { ex: 1e308 },
]) {
  const { nodes, window, render } = await setup(
    'water-intake-calculator',
    { kg: 65, ex: 30, extra: 0 },
    waterOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  assert.equal(nodes.result.textContent, '—');
  assert.equal(nodes.cTotal.textContent, '—');
  assert.equal(window.__summary, '');
  for (const id of ['barBase', 'barEx', 'barTot']) assert.equal(nodes[id].style.width, '0%');
  nodes.kg.value = '65';
  nodes.ex.value = '30';
  nodes.extra.value = '0';
  render();
  assert.equal(nodes.result.textContent, '2,625 ml/day');
}
const systemOut = ['result', 'chipDet', 'chipC1', 'chipC2'];
for (const [a1, b1, c1, a2, b2, c2, result] of [
  [2, 1, 7, 1, -1, 2, 'x = 3, y = 1'],
  [0, 1, 2, 1, 0, 3, 'x = 3, y = 2'],
  [2, 4, 6, 1, 2, 3, 'Infinitely many solutions'],
  [2, 4, 6, 1, 2, 4, 'No solution'],
  [0, 0, 0, 1, 2, 3, 'Infinitely many solutions'],
  [0, 0, 1, 1, 2, 3, 'No solution'],
  [1, 2, 3, 0, 0, 1, 'No solution'],
  [0, 0, 0, 0, 0, 0, 'Infinitely many solutions'],
  [0, 0, 1, 0, 0, 0, 'No solution'],
  [
    100000000000001,
    100000000000000,
    200000000000001,
    100000000000000,
    99999999999999,
    199999999999999,
    'x = 1, y = 1',
  ],
]) {
  const { nodes } = await setup(
    'system-of-equations-calculator',
    { a1, b1, c1, a2, b2, c2 },
    systemOut,
  );
  assert.equal(nodes.result.textContent, result);
}
for (const changed of [
  { a1: '' },
  { b1: '2x' },
  { c1: Infinity },
  { a2: NaN },
  { b2: '0x10' },
  { a1: 1e308, b1: 0, c1: 1, a2: 0, b2: 1e308, c2: 1 },
  { a1: 1e-200, b1: 0, c1: 1e-200, a2: 0, b2: 1e-200, c2: 1e-200 },
  { a1: '1e-10000' },
  { a1: '0'.repeat(201) },
]) {
  const { nodes, window, render } = await setup(
    'system-of-equations-calculator',
    { a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 },
    systemOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  systemOut.forEach((id) => assert.equal(nodes[id].textContent, '—'));
  assert.equal(window.__summary, '');
  for (const [id, v] of Object.entries({ a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 }))
    nodes[id].value = String(v);
  render();
  assert.equal(nodes.result.textContent, 'x = 3, y = 1');
}
const tempOut = ['result', 'chipBase', 'chipInv', 'tblRows'];
for (const [val, from, to, expected] of [
  [25, 'c', 'f', '77°F'],
  [32, 'f', 'c', '0°C'],
  [0, 'k', 'c', '-273.15°C'],
  [-273.15, 'c', 'k', '0K'],
  [-459.67, 'f', 'k', '0K'],
  [273.15, 'k', 'f', '32°F'],
  [-40, 'f', 'c', '-40°C'],
  [0, 'c', 'c', '0°C'],
]) {
  const { nodes } = await setup('temperature-converter', { val, from, to }, tempOut);
  assert.equal(nodes.result.textContent, expected);
  assert.doesNotMatch(nodes.tblRows.innerHTML, /Infinity|NaN|-0(?:<|\s)/);
}
for (const changed of [
  { val: '' },
  { val: Infinity },
  { val: '25x' },
  { from: 'x' },
  { to: 'x' },
  { val: -273.1500000001, from: 'c' },
  { val: -459.6700000001, from: 'f' },
  { val: -1e-300, from: 'k' },
  { val: 1e308, from: 'c' },
]) {
  const { nodes, window, render } = await setup(
    'temperature-converter',
    { val: 25, from: 'c', to: 'f' },
    tempOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  assert.equal(nodes.result.textContent, '—');
  assert.equal(nodes.tblRows.innerHTML, '');
  assert.equal(window.__summary, '');
  nodes.val.value = '25';
  nodes.from.value = 'c';
  nodes.to.value = 'f';
  render();
  assert.equal(nodes.result.textContent, '77°F');
}
const quadOut = ['result', 'chipDisc', 'chipVertex'];
for (const [a, b, c, expectedRoots] of [
  [10.27, -59.22, 85.37, ['2.88772192381677062274', '2.87858771591059062361']],
  [10.28, -59.24, 85.34, ['2.90289987647161365207', '2.85974603792527350747']],
]) {
  const { nodes } = await setup('quadratic-equation-calculator', { a, b, c }, quadOut);
  const roots = nodes.result.textContent.replace('x = ', '').split(', ').map(Number);
  roots.forEach((root, index) => assert.ok(Math.abs(root - Number(expectedRoots[index])) < 5e-12));
}
for (const [a, b, c, expected, disc] of [
  [1, -5, 6, 'x = 3, 2', '1'],
  [1, -2, 1, 'x = 1', '0'],
  [1, 2, 5, 'x = -1 ± 2i', '-16'],
  [-1, -2, -5, 'x = -1 ± 2i', '-16'],
  [1, 0, -1, 'x = 1, -1', '4'],
  [1, 0, 0, 'x = 0', '0'],
  [0, 2, -8, 'Linear: x = 4', '—'],
  [0, 0, 0, 'Every real x', '—'],
  [0, 0, 1, 'No solution', '—'],
  [1, 1e15, 1, 'x = -1E-15, -1E15', '1E30'],
  [1e150, -2e150, 1e150, 'x = 1', '0'],
]) {
  const { nodes } = await setup('quadratic-equation-calculator', { a, b, c }, quadOut);
  assert.equal(nodes.result.textContent, expected);
  assert.equal(nodes.chipDisc.textContent, disc);
}
{
  const { nodes } = await setup(
    'quadratic-equation-calculator',
    { a: 100000000000000, b: 199999999999999, c: 99999999999999 },
    quadOut,
  );
  assert.equal(nodes.chipDisc.textContent, '1');
  assert.notEqual(nodes.result.textContent, 'x = -1, -1');
}
for (const changed of [
  { a: '' },
  { b: '' },
  { c: '' },
  { a: Infinity },
  { b: '2x' },
  { c: '0x10' },
  { a: '1e-10000' },
  { a: 1, b: 2, c: '0.9999999999999999999999999999999999999999' },
  { a: 1e-200, b: 0, c: -1e-200 },
  { a: 1e308, b: 0, c: 1e308 },
  { a: 0, b: 1e-308, c: 1e308 },
]) {
  const { nodes, window, render } = await setup(
    'quadratic-equation-calculator',
    { a: 1, b: -5, c: 6 },
    quadOut,
  );
  Object.entries(changed).forEach(([id, v]) => {
    nodes[id].value = String(v);
  });
  render();
  quadOut.forEach((id) => assert.equal(nodes[id].textContent, '—'));
  assert.equal(window.__summary, '');
  nodes.a.value = '1';
  nodes.b.value = '-5';
  nodes.c.value = '6';
  render();
  assert.equal(nodes.result.textContent, 'x = 3, 2');
}
console.log(
  'Legacy boundaries: 5 Devine references/7 invalid recovery, 5 inflation references/13 invalid, 4 linear cases/6 invalid PASS.',
  'Present value: 6 references/10 invalid recovery PASS.',
  'Subscription: 8 references/13 invalid recovery PASS.',
  'Body fat: 5 references/15 invalid recovery PASS.',
  'BMR/TDEE: 10 references/27 invalid recovery; water: 4 references/12 invalid recovery PASS.',
  'Linear system: 10 references/9 invalid recovery; temperature: 8 references/9 invalid recovery; quadratic: 12 references/11 invalid recovery PASS.',
);
