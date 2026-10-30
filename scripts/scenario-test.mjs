import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx = vm.createContext({});
for (const file of ['core.js', 'original-scenarios.js'])
  vm.runInContext(
    await fs.readFile(new URL('../assets/models/' + file, import.meta.url), 'utf8'),
    ctx,
  );
const models = ctx.CMModels.models;
let assertions = 0;
const get = (slug) => models.find((x) => x.slug === slug + '-calculator');
const input = (m) => Object.fromEntries(m.fields.map((f) => [f.id, f.value]));
function test(name, fn) {
  try {
    fn();
    assertions++;
  } catch (error) {
    throw new Error(name + ': ' + error.message, { cause: error });
  }
}
const plan = get('plan-collision'),
  base = input(plan),
  life = get('life-single-point-failure'),
  graph = input(life),
  lock = get('future-commitment-lock'),
  commit = input(lock);
test('plan default first collision', () => assert.equal(plan.calculate(base)[0].value, 3));
test('plan cash deficit happens before time conflict', () =>
  assert.equal(plan.calculate({ ...base, cash: 0, income: 0 })[0].value, 1));
test('capacity increase removes time conflicts', () =>
  assert.equal(plan.calculate({ ...base, hours: 50 })[1].value, 0));
test('only active start weeks incur upfront cost', () =>
  assert.equal(plan.calculate(base)[4].value, 1140));
test('removing course releases its exact cost', () =>
  assert.equal(plan.detail(base)[1].rows[0][4], 1580));
test('delaying side project resolves overlap without dropping cost', () => {
  const row = plan.detail(base)[1].rows[3];
  assert.equal(row[2], 0);
  assert.equal(row[4], 1140);
});
test('week dates cross the year correctly', () =>
  assert.equal(plan.detail({ ...base, anchor: '2026-12-28' })[0].rows[1][1], '2027-01-04'));
test('impossible date rejected', () =>
  assert.throws(() => plan.calculate({ ...base, anchor: '2026-02-30' })));
test('reversed dates rejected', () =>
  assert.throws(() => plan.calculate({ ...base, plans: 'A;1;2;0;4;1' })));
test('duplicate plan names rejected', () =>
  assert.throws(() => plan.calculate({ ...base, plans: 'A;1;2;0;1;4\nA;2;2;0;1;4' })));
test('empty numeric cells rejected', () =>
  assert.throws(() => plan.calculate({ ...base, plans: 'A;;2;0;1;4' })));
test('fractional weeks rejected', () =>
  assert.throws(() => plan.calculate({ ...base, plans: 'A;1;2;0;1.5;4' })));
test('over 20 plans rejected', () =>
  assert.throws(() =>
    plan.calculate({
      ...base,
      plans: Array.from({ length: 21 }, (_, k) => 'A' + k + ';1;2;0;1;4').join('\n'),
    }),
  ));
test('cascading restart delays count in loss', () =>
  assert.equal(life.calculate(graph)[2].value, 940));
test('root backup benefits propagate downstream', () =>
  assert.equal(life.calculate(graph)[3].value, 270));
test('dependency cycles rejected', () =>
  assert.throws(() =>
    life.calculate({
      ...graph,
      resources: 'Internet;8;0;20;1;30;Shipping\nShipping;1;1;2;1;2;Internet',
    }),
  ));
test('unknown dependency rejected', () =>
  assert.throws(() => life.calculate({ ...graph, resources: 'Internet;8;0;20;1;30;Unknown' })));
test('unknown failed resource rejected', () =>
  assert.throws(() => life.calculate({ ...graph, failed: 'Unknown' })));
test('zero-time root backup still incurs cost', () =>
  assert.equal(life.calculate({ ...graph, resources: 'Internet;8;0;20;0;30;' })[3].value, 30));
test('unaffected backup is not activated or charged', () => {
  const v = { ...graph, resources: graph.resources + '\nUnrelated;4;0;20;0;999;' };
  const row = life.detail(v)[1].rows.find((x) => x[0] === 'Unrelated');
  assert.equal(row[1], 940);
});
test('slower backup is not activated', () =>
  assert.equal(life.calculate({ ...graph, resources: 'Internet;8;0;20;10;30;' })[3].value, 160));
test('all dependencies required, slowest controls restart', () => {
  const v = { failed: 'A', resources: 'A;8;0;10;1;0;\nB;0;4;10;-1;0;A\nC;0;1;10;-1;0;A,B' };
  assert.equal(life.calculate(v)[1].value, 13);
});
test('commitment fees reduce cancellation savings', () =>
  assert.equal(lock.calculate(commit)[4].value, 870));
test('negative saving is retained in detailed comparison', () =>
  assert.equal(lock.detail(commit)[1].rows[2][2], -50));
test('notice and minimum lock set effective calendar date', () =>
  assert.equal(lock.detail(commit)[1].rows[0][1], '2027-02'));
test('monthly calendar crosses year', () =>
  assert.equal(lock.detail(commit)[0].rows[2][1], '2027-01'));
test('invalid calendar month rejected', () =>
  assert.throws(() => lock.calculate({ ...commit, anchor: '2026-13' })));
test('stop after natural end does not incur fee', () => {
  const v = { ...commit, commitments: 'A;100;1;1;2;3;0;999', cancel: 3 };
  assert.equal(lock.detail(v)[1].rows[0][2], 0);
});
test('zero notice cancellation stops current-month charge', () => {
  const v = { ...commit, commitments: 'A;100;1;1;12;1;0;0', cancel: 1 };
  assert.equal(lock.detail(v)[1].rows[0][2], 1200);
});
test('time and money shortages remain visible', () => {
  const out = lock.calculate({ ...commit, income: 1000, hours: 10 });
  assert.ok(out[2].value < 0 && out[3].value < 0);
});
console.log('Original scenarios:', assertions, 'meaningful boundary and comparison cases PASS');
