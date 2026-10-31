import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url),
  ctx = vm.createContext({ console });
const files = (await fs.readdir(new URL('assets/models/', root)))
  .filter((f) => f.endsWith('.js') && f !== 'core.js')
  .sort();
vm.runInContext(await fs.readFile(new URL('assets/cm-data-core.js', root), 'utf8'), ctx);
for (const file of ['core.js', ...files])
  vm.runInContext(await fs.readFile(new URL('assets/models/' + file, root), 'utf8'), ctx, {
    filename: file,
  });
const models = ctx.CMModels.models;
const scientificNotation = models.find((m) => m.slug === 'scientific-notation-calculator');
const carpet = models.find((m) => m.slug === 'carpet-roll-length-calculator');
const billSplit = models.find((m) => m.slug === 'weighted-bill-split-calculator');
for (const [input, expected] of [
  [{ a: 1.005, w: '1', d: 2 }, [1.01]],
  [{ a: 1.0049, w: '1', d: 2 }, [1]],
  [{ a: 100, w: '1e308,1e308', d: 2 }, [50, 50]],
  [{ a: 100, w: '1e308,1e-308', d: 2 }, [100, 0]],
  [{ a: 0.05, w: '1,1,1', d: 2 }, [0.02, 0.02, 0.01]],
  [{ a: 0.01, w: '0,1,1', d: 2 }, [0, 0.01, 0]],
  [{ a: 0, w: '1,2', d: 4 }, [0, 0]],
  [{ a: 10, w: '0.1,0.2,0.7', d: 2 }, [1, 2, 7]],
  [{ a: 9007199254740991, w: '1', d: 0 }, [9007199254740991]],
]) {
  const result = billSplit.calculate(input).map((x) => x.value);
  assert.deepEqual(Array.from(result), expected, 'Exact bill splitting: ' + JSON.stringify(input));
}
assert.throws(() => billSplit.calculate({ a: 100, w: '0,0', d: 2 }));
assert.throws(() => billSplit.calculate({ a: 100, w: '-1,2', d: 2 }));
assert.throws(() => billSplit.calculate({ a: 1e15, w: '1,1', d: 4 }));
for (const [input, expected] of [
  [{ l: 5, w: 4, r: 4, a: 1 }, [6, 6, 10, 24]],
  [{ l: 3, w: 5, r: 4, a: 0.2 }, [5.2, 6.4, 5.2, 20.8]],
]) {
  const result = carpet.calculate(input);
  expected.forEach((value, index) =>
    assert.ok(Math.abs(result[index].value - value) < 1e-10, 'Carpet trim/orientation result'),
  );
}
assert.ok(carpet.formula.includes('(L+t)') && carpet.formula.includes('(W+t)'));
for (const [input, coefficient, exponent] of [
  [0, 0, 0],
  [-0, 0, 0],
  [5e-324, 5, -324],
  [-5e-324, -5, -324],
  [1e-323, 1, -323],
  [3.2e-200, 3.2, -200],
  [1e-7, 1, -7],
  [1e-6, 1, -6],
  [12345, 1.2345, 4],
  [1.25e12, 1.25, 12],
  [1e15, 1, 15],
]) {
  const result = scientificNotation.calculate({ a: input });
  assert.equal(result[0].value, coefficient, 'Scientific coefficient for ' + input);
  assert.equal(result[1].value, exponent, 'Scientific exponent for ' + input);
  assert.ok(
    input === 0 || (Math.abs(result[0].value) >= 1 && Math.abs(result[0].value) < 10),
    'Normalized scientific coefficient',
  );
  assert.equal(Number(result[0].value + 'e' + result[1].value), input || 0);
}
let cases = 0;
const failures = [];
for (const model of models) {
  try {
    assert.ok(
      Array.isArray(model.expected) && model.expected.length > 0,
      'Missing independent expected vector',
    );
    for (const f of model.fields) {
      if (f.type === 'number') {
        assert.ok(
          Number.isFinite(f.value) && f.value >= f.min && f.value <= f.max,
          'Default outside field range: ' + f.id,
        );
        if (f.step === 1) assert.ok(Number.isInteger(f.value), 'Noninteger default: ' + f.id);
      }
      if (f.type === 'select')
        assert.ok(
          f.options.some((o) => o[0] === f.value),
          'Invalid selected default',
        );
    }
    const input = Object.fromEntries(model.fields.map((f) => [f.id, f.value]));
    const rows = model.calculate(input);
    assert.ok(rows.length > 0, 'No result');
    if (model.slug === 'fluid-typography-calculator') {
      assert.equal(rows[0].literal, true, 'CSS result is code, not translated interface copy');
      assert.equal(rows[0].value, 'clamp(16px, calc(12px + 1vw), 24px)');
    }
    if (
      [
        'internal-rate-of-return-calculator',
        'modified-internal-rate-calculator',
        'bond-yield-calculator',
      ].includes(model.slug)
    )
      assert.equal(rows[0].unit, '%', 'Percentage-valued yield requires a visible percent unit');
    rows.forEach((r) =>
      assert.ok(typeof r.value === 'string' || Number.isFinite(r.value), 'Nonfinite ' + r.label),
    );
    model.expected.forEach((expected, i) => {
      const actual = rows[i]?.value;
      if (typeof expected === 'number')
        assert.ok(
          Math.abs(actual - expected) <= (expected === 0 ? 1e-10 : Math.abs(expected) * 1e-7),
          `${i}: ${actual} ≠ ${expected}`,
        );
      else assert.equal(actual, expected);
      cases++;
    });
  } catch (error) {
    failures.push({ slug: model.slug, error: error.message });
  }
}
console.log(JSON.stringify({ models: models.length, defaultAssertions: cases, failures }, null, 2));
if (failures.length) process.exitCode = 1;
