import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-keypad-core.js', import.meta.url), 'utf8'),
  context,
);
const { Pocket, scientific, Decimal } = context.CMKeypad;
let cases = 0;
function pocket(keys, expected) {
  const p = new Pocket();
  for (const k of keys.split(' ')) p.input(k);
  assert.equal(p.error, null, keys);
  assert.equal(p.entry, expected, keys);
  cases++;
  return p;
}
pocket('0 . 1 + 0 . 2 =', '0.3');
pocket('2 + 3 * 4 =', '20');
pocket('2 0 0 + 1 0 % =', '220');
pocket('2 0 0 - 1 0 % =', '180');
pocket('2 0 0 * 1 0 % =', '20');
pocket('2 0 0 / 1 0 % =', '2000');
pocket('5 + 2 = =', '9');
pocket('5 * 2 = =', '20');
pocket('9 / 3 = =', '1');
pocket('9 - 3 = =', '3');
pocket('9 + - 2 =', '7');
pocket('5 + =', '10');
pocket('sign 5 + 2 =', '-3');
pocket('5 sign * 2 =', '-10');
pocket('1 2 back + 3 =', '4');
pocket('5 + 9 CE 2 =', '7');
pocket('5 + 9 AC 2 =', '2');
pocket('1 / 3 =', '0.333333333333333');
pocket('9 sqrt', '3');
pocket('4 reciprocal', '0.25');
pocket('5 M+ AC 2 M+ MR', '7');
pocket('5 M+ AC 2 M- MR', '3');
pocket('5 M+ AC MC MR', '0');
pocket('1 . 2 0', '1.20');
for (const keys of ['1 / 0 =', '0 reciprocal', '9 sign sqrt']) {
  const p = new Pocket();
  keys.split(' ').forEach((k) => p.input(k));
  assert(p.error, keys);
  p.input('2');
  assert.equal(p.entry, '2');
  assert.equal(p.error, null);
  cases++;
}
assert.equal(Decimal.from('0.0000001').add(Decimal.from('0.0000002')).display(), '3e-7');
cases++;
const vectors = [
  ['2+3*4', 14],
  ['(2+3)*4', 20],
  ['-2^2', -4],
  ['(-2)^2', 4],
  ['2^3^2', 512],
  ['2^-3', 0.125],
  ['sin(30)', 0.5],
  ['cos(90)', 0],
  ['tan(45)', 1],
  ['asin(0.5)', 30],
  ['acos(0)', 90],
  ['atan(1)', 45],
  ['sqrt(81)', 9],
  ['cbrt(-8)', -2],
  ['ln(e)', 1],
  ['log(1000)', 3],
  ['5!', 120],
  ['0!', 1],
  ['10%', 0.1],
  ['200*(1+10%)', 220],
  ['2(3+4)', 14],
  ['2pi', 2 * Math.PI],
  ['1e-9+2e-9', 3e-9],
  ['abs(-5)', 5],
  ['exp(0)', 1],
  ['Ans+2', 9],
];
for (const [expression, expected] of vectors) {
  const actual = scientific(expression, true, 7);
  assert(
    Math.abs(actual - expected) < 1e-10 * Math.max(1, Math.abs(expected)),
    expression + ' ' + actual,
  );
  cases++;
}
assert.equal(scientific('sin(pi/2)', false), 1);
cases++;
assert(Math.abs(scientific('atan(1)', false) - Math.PI / 4) < 1e-12);
cases++;
for (const bad of [
  '1/0',
  'sqrt(-1)',
  'log(0)',
  'tan(90)',
  'asin(2)',
  '2.5!',
  '70!',
  '(2+3',
  '2+',
  'alert(1)',
  'globalThis.process.exit()',
  '2**3',
  '1,2',
  '0^0',
]) {
  assert.throws(() => scientific(bad), undefined, bad);
  cases++;
}
{
  const p = new Pocket();
  for (const key of '2 0 0 + 1 0 %'.split(' ')) p.input(key);
  const q = new Pocket();
  q.restore(JSON.parse(JSON.stringify(p.snapshot())));
  q.input('=');
  assert.equal(q.entry, '220');
  q.input('=');
  assert.equal(q.entry, '240');
  cases++;
}
{
  const p = new Pocket();
  for (const key of '0 . 1 + 0 . 2 = M+'.split(' ')) p.input(key);
  const q = new Pocket();
  q.restore(JSON.parse(JSON.stringify(p.snapshot())));
  q.input('AC');
  q.input('MR');
  assert.equal(q.entry, '0.3');
  assert.equal(q.history[0].result, '0.3');
  cases++;
}
{
  const p = new Pocket();
  for (const key of ['1', '2', '.']) p.input(key);
  const q = new Pocket();
  q.restore(p.snapshot());
  q.input('5');
  assert.equal(q.entry, '12.5');
  cases++;
}
{
  const p = new Pocket();
  for (const key of '1 / 0 ='.split(' ')) p.input(key);
  const q = new Pocket();
  q.restore(p.snapshot());
  assert.equal(q.error, 'division');
  assert.throws(() => q.restore({ ...p.snapshot(), entry: 'not-a-number' }));
  assert.equal(q.error, 'division');
  q.input('AC');
  assert.equal(q.error, null);
  cases++;
}
console.log(
  'PASS:',
  cases,
  'keypad arithmetic, memory, percentages, precedence, trigonometry and invalid-input cases.',
);
