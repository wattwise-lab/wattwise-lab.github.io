import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-calendar-core.js', import.meta.url), 'utf8'),
  c,
);
const C = c.CMCalendar,
  parse = C.parse;
let count = 0;
function test(name, fn) {
  try {
    fn();
    count++;
  } catch (error) {
    throw Error(name + ': ' + error.message, { cause: error });
  }
}
const eq = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
test('valid leap day', () => assert.ok(parse('2024-02-29')));
test('invalid leap day', () => assert.equal(parse('2023-02-29'), null));
test('century 1900 not leap', () => assert.equal(parse('1900-02-29'), null));
test('century 2000 leap', () => assert.ok(parse('2000-02-29')));
test('year 0001 retained', () => assert.equal(C.iso(parse('0001-01-01')), '0001-01-01'));
test('year 0099 retained', () => assert.equal(C.iso(parse('0099-12-31')), '0099-12-31'));
test('year 0000 rejected', () => assert.equal(parse('0000-01-01'), null));
test('invalid day rejected', () => assert.equal(parse('2026-04-31'), null));
test('noncanonical date rejected', () => assert.equal(parse('2026-2-3'), null));
test('year 0099 to 0100 exact day', () =>
  assert.equal(C.dayDiff(parse('0099-12-31'), parse('0100-01-01')), 1));
test('DST spring transition has two calendar days', () =>
  assert.equal(C.dayDiff(parse('2026-03-07'), parse('2026-03-09')), 2));
test('DST autumn transition has two calendar days', () =>
  assert.equal(C.dayDiff(parse('2026-10-31'), parse('2026-11-02')), 2));
test('historically skipped local date is still a Gregorian date', () =>
  assert.equal(C.iso(parse('1994-12-31')), '1994-12-31'));
test('January31 to March1 never yields negative days', () =>
  eq(C.breakdown(parse('2026-01-31'), parse('2026-03-01')), { y: 0, m: 1, d: 1 }));
test('January31 to February28 uses clamped month', () =>
  eq(C.breakdown(parse('2026-01-31'), parse('2026-02-28')), { y: 0, m: 1, d: 0 }));
test('leap birthday nonleap anniversary', () =>
  eq(C.breakdown(parse('2024-02-29'), parse('2025-02-28')), { y: 1, m: 0, d: 0 }));
test('leap anniversary does not drift into twelve months', () =>
  eq(C.breakdown(parse('2024-02-29'), parse('2028-02-28')), { y: 3, m: 11, d: 30 }));
test('same-day breakdown', () =>
  eq(C.breakdown(parse('2026-10-30'), parse('2026-10-30')), { y: 0, m: 0, d: 0 }));
test('negative breakdown rejected', () =>
  assert.throws(() => C.breakdown(parse('2026-10-30'), parse('2026-10-29'))));
test('birthday today is zero days away', () =>
  assert.equal(C.age(parse('1990-05-10'), parse('2026-05-10')).nextDays, 0));
test('age components remain nonnegative around month ends', () => {
  const a = C.age(parse('1990-01-31'), parse('2026-03-01'));
  eq({ y: a.y, m: a.m, d: a.d }, { y: 36, m: 1, d: 1 });
});
test('Monday to Sunday inclusive', () =>
  eq(C.workdays(parse('2026-11-02'), parse('2026-11-08')), { wd: 5, we: 2, cal: 7 }));
test('Saturday only', () =>
  eq(C.workdays(parse('2026-11-07'), parse('2026-11-07')), { wd: 0, we: 1, cal: 1 }));
test('Friday-Saturday weekend supported', () =>
  eq(C.workdays(parse('2026-11-06'), parse('2026-11-08'), [5, 6]), { wd: 1, we: 2, cal: 3 }));
test('wide calendar span remains exact without day iteration', () => {
  const a = C.workdays(parse('0001-01-01'), parse('9999-12-31'));
  assert.equal(a.cal, 3652059);
  assert.equal(a.wd, 2608615);
});
test('calendar components recompose over representative month ends', () => {
  for (const start of ['2024-02-29', '2025-01-31', '2026-08-31', '1999-12-31'])
    for (const end of ['2026-09-01', '2027-02-28', '2030-03-01']) {
      const a = parse(start),
        b = parse(end),
        parts = C.breakdown(a, b),
        anchor = C.addMonths(a, parts.y * 12 + parts.m);
      assert.equal(C.dayDiff(anchor, b), parts.d);
      assert.ok(parts.m >= 0 && parts.m < 12 && parts.d >= 0 && parts.d <= 31);
    }
});
console.log('Calendar:', count, 'date-only reference/boundary cases PASS; TZ=' + process.env.TZ);
