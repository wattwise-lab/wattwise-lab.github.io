import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(
  new URL('../assets/legacy-models/acceleration-calculator-1.js', import.meta.url),
  'utf8',
);
let count = 0;
for (const [v0, v1, t, acceleration, displacement, distance] of [
  [0, 30, 5, 6, 75, 75],
  [10, 0, 2, -5, 10, 10],
  [-10, -20, 2, -5, -30, 30],
  [-10, 10, 4, 5, 0, 20],
  [10, -10, 4, -5, 0, 20],
  [-5, -5, 2, 0, -10, 10],
]) {
  const nodes = Object.fromEntries(
    ['v0', 'v1', 't', 'result', 'chipDist', 'chipDv', 'chipTravel', 'verdict', 'verdictText'].map(
      (id) => [id, { value: '', textContent: '', className: '', addEventListener() {} }],
    ),
  );
  [nodes.v0.value, nodes.v1.value, nodes.t.value] = [String(v0), String(v1), String(t)];
  const document = {
    getElementById: (id) => nodes[id],
    querySelectorAll: () => [nodes.v0, nodes.v1, nodes.t],
  };
  vm.runInNewContext(source, { document });
  const number = (id) => Number(nodes[id].textContent.split(' ')[0].replaceAll(',', ''));
  assert.equal(number('result'), acceleration);
  assert.equal(number('chipDist'), displacement);
  assert.equal(number('chipTravel'), distance);
  if (v0 < 0 && v1 < v0) assert(nodes.verdictText.textContent.startsWith('Speed increases'));
  if (v0 * v1 < 0) assert(nodes.verdictText.textContent.startsWith('Direction reverses'));
  count++;
}
console.log(
  'PASS:',
  count,
  'signed acceleration, reversal, displacement and travelled-distance cases.',
);
