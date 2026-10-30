import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-intent-core.js', import.meta.url), 'utf8'),
  c,
);
const P = c.CMIntent;
let count = 0;
function test(name, fn) {
  try {
    fn();
    count++;
  } catch (e) {
    throw Error(name + ': ' + e.message, { cause: e });
  }
}
test('Chinese mortgage units', () => {
  const p = P.parse('房贷 房价300万 首付90万 利率3.5% 期限30年');
  assert.equal(p.slug, 'mortgage-calculator');
  assert.equal(p.values.price, 3000000);
  assert.equal(p.values.down, 900000);
  assert.equal(p.values.rate, 3.5);
  assert.equal(p.values.term, 30);
});
test('English loan labels', () =>
  assert.equal(P.parse('loan principal 100000 rate 5 term 20').values.prin, 100000));
test('Latin k suffix', () => assert.equal(P.parse('loan principal 100k').values.prin, 100000));
test('Latin m suffix', () => assert.equal(P.parse('loan principal 1.2m').values.prin, 1200000));
test('Chinese ten-million suffix', () =>
  assert.equal(P.parse('房贷 房价2千万').values.price, 20000000));
test('Chinese million suffix', () => assert.equal(P.parse('房贷 房价2百万').values.price, 2000000));
test('months is not million suffix', () => assert.ok(P.parse('loan principal 12 months').error));
test('months not interpreted as years', () => assert.ok(P.parse('loan term 12 months').error));
test('percentage down payment converted explicitly', () =>
  assert.equal(P.parse('房贷 房价300万 首付30%').values.down, 900000));
test('percentage down payment requires price', () => assert.ok(P.parse('房贷 首付30%').error));
test('percentage principal rejected', () => assert.ok(P.parse('loan principal 30%').error));
test('grouped number rejected', () => assert.ok(P.parse('loan principal 100,000').error));
test('decimal comma rejected', () => assert.ok(P.parse('loan rate 3,5').error));
test('malformed decimal rejected', () => assert.ok(P.parse('loan rate 3.5.6').error));
test('conflicting field rejected', () => assert.ok(P.parse('loan rate 3 rate 5').error));
test('unlabelled amounts rejected', () => assert.ok(P.parse('loan 100000 5 20').error));
test('unknown intent rejected', () => assert.ok(P.parse('give me anything').error));
test('long request rejected', () => assert.ok(P.parse('loan ' + 'a'.repeat(2001)).error));
test('Persian digits normalized', () =>
  assert.equal(P.parse('loan principal ۱۰۰۰۰۰').values.prin, 100000));
test('Hindi digits normalized', () =>
  assert.equal(P.parse('loan principal १०००००').values.prin, 100000));
test('translated field labels', () =>
  assert.equal(
    P.parse('loan capital 123', { translate: (s) => (s === 'Loan principal' ? 'capital' : s) })
      .values.prin,
    123,
  ));
test('template does not execute content', () =>
  assert.ok(P.parse('loan <script>alert(1)</script>').error));
console.log('Local intent rules:', count, 'cases PASS');
