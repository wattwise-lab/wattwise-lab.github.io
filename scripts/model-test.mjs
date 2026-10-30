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
