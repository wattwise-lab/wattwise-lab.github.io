import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/molar-mass-calculator-1.js', import.meta.url),
  'utf8',
);
let count = 0;
for (const [formula, expected] of [
  ['H2O', 18.015],
  ['Ca(OH)2', 74.092],
  ['Al2(SO4)3', 342.132],
  ['((H)2O)3', 54.045],
  ['NaCl', 58.44],
  ['C6H12O6', 180.156],
  ['CH3COOH', 60.052],
  ['', null],
  ['H0', null],
  ['H01', null],
  ['H2O0', null],
  ['()', null],
  ['()2H', null],
  ['(H())2', null],
  ['(H2O', null],
  ['H2O)', null],
  ['2H2O', null],
  ['H-2', null],
  ['h2O', null],
  ['Xx2', null],
  ['H1.5', null],
  ['H9007199254740992', null],
  ['(H9007199254740991)2', null],
  ['H9007199254740991H', null],
  ['('.repeat(33) + 'H' + ')'.repeat(33), null],
  ['H'.repeat(201), null],
]) {
  const nodes = Object.fromEntries(
    ['formula', 'result', 'chipComp', 'verdict', 'verdictText'].map((id) => [
      id,
      { value: '', textContent: '', className: '', addEventListener() {} },
    ]),
  );
  nodes.formula.value = formula;
  vm.runInNewContext(source, {
    window: {
      CMI18n: {
        formatLocale: 'en-US',
        number: (value, options) => new Intl.NumberFormat('en-US', options).format(value),
      },
    },
    document: { getElementById: (id) => nodes[id], querySelectorAll: () => [nodes.formula] },
  });
  if (expected === null) {
    assert.equal(nodes.result.textContent, '—', formula);
    assert.equal(nodes.chipComp.textContent, '—', formula);
  } else {
    assert.ok(
      Math.abs(Number(nodes.result.textContent.replace(' g/mol', '')) - expected) < 1e-6,
      formula,
    );
    assert.ok(!/NaN|Infinity/.test(nodes.chipComp.textContent), formula);
  }
  count++;
}
console.log(
  'Molar mass: ' + count + ' reference, grammar, zero-count, overflow and nesting-limit cases PASS',
);
