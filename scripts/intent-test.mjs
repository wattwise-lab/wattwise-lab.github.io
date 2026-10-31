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
test('Displayed English workspace example', () => {
  const result = P.parse('mortgage home price 300000 down payment 90000 rate 3.5% term 30');
  assert.equal(result.slug, 'mortgage-calculator');
  assert.equal(result.values.price, 300000);
  assert.equal(result.values.down, 90000);
  assert.equal(result.values.rate, 3.5);
  assert.equal(result.values.term, 30);
});
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
test('conflicting aliases are not silently ignored', () =>
  assert.ok(P.parse('loan rate 5 annual rate 6').error));
test('matching aliases keep one reviewed value', () => {
  const result = P.parse('loan rate 5 annual rate 5 principal 100');
  assert.equal(result.values.rate, 5);
  assert.equal(result.matched.filter((x) => x.id === 'rate').length, 1);
});
test('labels are not matched inside English words', () => {
  const result = P.parse('loan corporate5 principal 10');
  assert.equal(result.values.prin, 10);
  assert.equal(result.values.rate, undefined);
});
test('scientific notation is parsed completely', () => {
  const result = P.parse('LOAN PRINCIPAL 1e5 RATE 5e-1 TERM 2e1');
  assert.equal(result.values.prin, 100000);
  assert.equal(result.values.rate, 0.5);
  assert.equal(result.values.term, 20);
});
for (const value of [
  '1e',
  '1e+',
  '1e-3.5',
  '1e309',
  '1e-999',
  'NaN',
  'Infinity',
  '-Infinity',
  '1/2',
  '1+2',
])
  test('invalid number stops the entire preview: ' + value, () =>
    assert.ok(P.parse('loan principal ' + value + ' rate 5 term 20').error),
  );
test('zero with a large exponent remains zero', () =>
  assert.equal(P.parse('loan rate 0e-999').values.rate, 0));
test('minimum representable nonzero number is preserved', () =>
  assert.equal(P.parse('loan principal 5e-324').values.prin, 5e-324));
test('mixed absolute and percent down payments are rejected', () =>
  assert.ok(P.parse('mortgage home price 300000 down payment 30% 首付30').error));
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

test('Bengali digits match the shared numeric parser', () =>
  assert.equal(P.parse('loan principal ২০ rate ৫').values.prin, 20));
test('Telugu digits match the shared numeric parser', () =>
  assert.equal(P.parse('loan principal ౨౦ rate ౫').values.rate, 5));
test('Arabic percent principal is rejected as a mismatched unit', () =>
  assert.ok(P.parse('loan principal ٢٠٪').error));
test('Arabic percent down payment is converted with the home price', () =>
  assert.equal(P.parse('mortgage home price 300000 down payment ٣٠٪').values.down, 90000));

console.log('Local intent rules:', count, 'cases PASS');
