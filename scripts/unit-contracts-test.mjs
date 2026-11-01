import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-unit-contracts.js', import.meta.url), 'utf8'),
  c,
);
const U = c.CMUnits,
  near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)));
let count = 0;
const test = (name, fn) => {
  try {
    fn();
    count++;
  } catch (e) {
    throw Error(name + ': ' + e.message, { cause: e });
  }
};
for (const [a, b, n, want] of [
  ['km', 'm', 1.23, 1230],
  ['in', 'cm', 10, 25.4],
  ['acre', 'm²', 1, 4046.8564224],
  ['lb', 'kg', 10, 4.5359237],
  ['mph', 'km/h', 60, 96.56064],
  ['kWh', 'J', 2, 7200000],
  ['°F', '°C', 32, 0],
  ['°C', '°F', 100, 212],
  ['USD/month', 'USD/year', 100, 1200],
  ['years', 'months', 2, 24],
])
  test(a + ' to ' + b, () => near(U.convert(n, a, b), want));
test('unknown units require an explicit one-time copy', () =>
  assert.equal(U.contract('', 'USD').state, 'unknown'));
test('currencies cannot be converted without an FX rate', () =>
  assert.equal(U.contract('USD', 'EUR').state, 'incompatible'));
test('calendar months are not a fixed number of days', () =>
  assert.equal(U.contract('months', 'days').state, 'incompatible'));
test('a payment rate cannot be sent to principal', () =>
  assert.equal(U.contract('USD/month', 'USD').state, 'incompatible'));
test('percent is not automatically interpreted as a unitless fraction', () =>
  assert.equal(U.contract('%', 'ratio').state, 'incompatible'));
test('nonfinite results are never transferred', () =>
  assert.equal(U.convert(Infinity, 'kg', 'g'), null));
console.log('Unit contracts: ' + count + ' conversion and incompatibility cases PASS');
