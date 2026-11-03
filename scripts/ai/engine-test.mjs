import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {
  tools,
  calculate,
  convert,
  interpret,
  recompute,
  InputError,
} from '../../services/ai/engine.mjs';
import worker, { planQuestion } from '../../services/ai/worker.mjs';
let checks = 0;
const test = (name, fn) => {
  try {
    fn();
    checks++;
  } catch (e) {
    throw Error(name + ': ' + e.message, { cause: e });
  }
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
for (const m of tools.filter((t) => t.fields.every((f) => f.value !== undefined)))
  test(m.slug, () => {
    const r = calculate(m.slug, Object.fromEntries(m.fields.map((f) => [f.id, f.value])));
    assert.ok(r.rows.length);
    assert.doesNotThrow(() => JSON.stringify(r));
  });
test('loan with currency', () => {
  const r = calculate('loan-calculator', { prin: 12000, rate: 0, term: 1 }, 'CNY');
  near(r.rows[0].value, 1000);
  assert.ok(r.rows.some((x) => x.unit.includes('CNY')));
});
test('mortgage includes entered extra payments and PMI boundary', () => {
  const r = calculate(
    'mortgage-calculator',
    {
      price: 120000,
      down: 24000,
      rate: 0,
      term: 8,
      tax: 1200,
      ins: 120,
      pmirate: 1,
      hoa: 20,
      extra: 50,
    },
    'EUR',
  );
  near(r.rows[0].value, 1180);
  near(r.rows[1].value, 1000);
  near(r.rows[2].value, 96000);
  near(r.rows[4].value, 92);
  assert.equal(r.rows[0].unit, 'EUR/month');
});
test('energy daily use', () =>
  near(calculate('electricity-usage', { power: 1500, hours: 2, days: 30 }).rows[0].value, 90));
test('SI prefix case', () => near(convert(1, 'mW', 'MW'), 1e-9));
test('temperature offset', () => near(convert(20, '°C', 'K'), 293.15));
test('pipe reference', () =>
  near(calculate('pipe-flow-speed-calculator', { q: 12, d: 20 }).rows[0].value, 2 / Math.PI));
test('SI flow conversion', () => near(convert(0.0002, 'm3/s', 'L/min'), 12));
test('length conversion', () => near(convert(2, 'cm', 'mm'), 20));
test('wrong dimension', () => assert.throws(() => convert(3, 'kg', 'mm'), InputError));
test('zero pipe diameter', () =>
  assert.throws(() => calculate('pipe-flow-speed-calculator', { q: 12, d: 0 }), InputError));
test('no code expression', () =>
  assert.throws(
    () => calculate('arithmetic', { expression: 'globalThis.process.exit()' }),
    InputError,
  ));
test('real expression', () =>
  near(calculate('arithmetic', { expression: '(2+3)*4' }).rows[0].value, 20));
test('shopping exact decimals', () => {
  const r = calculate('shopping-total', {
    items: [
      { name: 'A', quantity: 3, unit: 'kg', price: 0.1, perUnit: 'kg', currency: 'CNY' },
      { name: 'B', quantity: 1, unit: 'kg', price: 0.2, perUnit: 'kg', currency: 'CNY' },
    ],
  });
  near(r.rows[0].value, 0.5);
});
test('shopping quantity conversion and charges', () => {
  const r = calculate('shopping-total', {
    items: [{ name: 'rice', quantity: 500, unit: 'g', price: 20, perUnit: 'kg', currency: 'CNY' }],
    discount: 10,
    tax: 10,
    shipping: 2,
  });
  near(r.rows[0].value, 11.9);
});
test('mixed currencies rejected', () =>
  assert.throws(
    () =>
      calculate('shopping-total', {
        items: [
          { name: 'A', quantity: 1, unit: 'kg', price: 2, perUnit: 'kg', currency: 'USD' },
          { name: 'B', quantity: 1, unit: 'kg', price: 2, perUnit: 'kg', currency: 'CNY' },
        ],
      }),
    InputError,
  ));
test('missing field is question', () => {
  const r = interpret(
    { steps: [{ id: 's1', tool: 'pipe-flow-speed-calculator', inputs: {} }], questions: [] },
    '水流速度',
  );
  assert.equal(r.questions.length, 2);
  assert.equal(r.steps[0].result, null);
});
test('validated source and server conversion', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's1',
          tool: 'pipe-flow-speed-calculator',
          inputs: {
            q: { value: 12, unit: 'L/min', source: '12 L/min' },
            d: { value: 2, unit: 'cm', source: '2 cm' },
          },
        },
      ],
      questions: [],
    },
    '12 L/min, 2 cm',
  );
  near(r.steps[0].result.rows[0].value, 2 / Math.PI);
});
test('invented source rejected', () =>
  assert.throws(
    () =>
      interpret(
        {
          steps: [
            {
              id: 's1',
              tool: 'pipe-flow-speed-calculator',
              inputs: { q: { value: 12, unit: 'L/min', source: '12 L/min' } },
            },
          ],
          questions: [],
        },
        '水流速度',
      ),
    InputError,
  ));
test('invented number rejected', () =>
  assert.throws(
    () =>
      interpret(
        {
          steps: [
            {
              id: 's1',
              tool: 'pipe-flow-speed-calculator',
              inputs: { q: { value: 120, unit: 'L/min', source: '12 L/min' } },
            },
          ],
          questions: [],
        },
        '12 L/min',
      ),
    InputError,
  ));
test('forward reference rejected', () =>
  assert.throws(
    () =>
      interpret(
        {
          steps: [
            {
              id: 's1',
              tool: 'pipe-flow-speed-calculator',
              inputs: { q: { ref: { step: 's2', row: 0 } } },
            },
          ],
          questions: [],
        },
        'x',
      ),
    InputError,
  ));
const request = (path, body, origin = 'http://127.0.0.1:4173') =>
  new Request('https://example.com' + path, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
assert.equal(
  (
    await worker.fetch(
      request('/calculate', { tool: 'arithmetic', values: { expression: '1+2' } }),
      {},
    )
  ).status,
  200,
);
checks++;
assert.equal(
  (await worker.fetch(request('/calculate', {}, 'https://evil.example'), {})).status,
  403,
);
checks++;
assert.equal(
  (await worker.fetch(request('/plan', { text: 'flow', locale: 'en' }), {})).status,
  503,
);
checks++;
test('arithmetic explicit radians', () =>
  near(calculate('arithmetic', { expression: 'sin(pi/2)', mode: 'rad' }).rows[0].value, 1));
test('incomplete shopping asks without inventing price', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's',
          tool: 'shopping-total',
          inputs: {
            items: {
              value: [
                {
                  name: 'Apples',
                  quantity: 3,
                  unit: 'each',
                  perUnit: 'each',
                  price: null,
                  currency: 'CNY',
                  source: '3 apples',
                },
              ],
            },
          },
        },
      ],
      questions: [],
    },
    '3 apples',
  );
  assert.equal(r.steps[0].result, null);
  assert.ok(r.steps[0].missing.includes('items'));
});
test('explicit unknown optional fee is not zero', () => {
  const r = interpret(
    { steps: [{ id: 's', tool: 'shopping-total', inputs: { shipping: null } }], questions: [] },
    'shipping unknown',
  );
  assert.ok(r.steps[0].missing.includes('shipping'));
  assert.equal(r.steps[0].values.shipping, undefined);
});
test('shopping half-cent rounds up', () =>
  near(
    calculate('shopping-total', {
      items: [
        { name: 'A', quantity: 1, unit: 'each', price: 0.005, perUnit: 'each', currency: 'CNY' },
      ],
    }).rows[0].value,
    0.01,
  ));
test('dependency cascade', () => {
  const steps = [
    { id: 'f', tool: 'force-calculator', values: { m: 10, a: 2 } },
    {
      id: 'p',
      tool: 'pressure-calculator',
      values: { a: 0.01 },
      sources: { f: { ref: { step: 'f', row: 0 } } },
    },
  ];
  let r = recompute(steps);
  near(r[1].result.rows[0].value, 2000);
  steps[0].values.m = 20;
  r = recompute(steps);
  near(r[1].result.rows[0].value, 4000);
});
test('missing parent is deferred', () => {
  const r = recompute([
    { id: 'f', tool: 'force-calculator', values: { m: 10 } },
    {
      id: 'p',
      tool: 'pressure-calculator',
      values: { a: 0.01 },
      sources: { f: { ref: { step: 'f', row: 0 } } },
    },
  ]);
  assert.equal(r[0].result, null);
  assert.equal(r[1].result, null);
});
test('Chinese magnitude source', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's',
          tool: 'loan-calculator',
          inputs: { prin: { value: 300000, unit: 'CNY', source: '30万' } },
        },
      ],
      questions: [],
    },
    '贷款30万',
  );
  near(r.steps[0].values.prin, 300000);
});
test('French decimal source', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's',
          tool: 'pipe-flow-speed-calculator',
          inputs: { q: { value: 1.5, unit: 'L/min', source: '1,5 L/min' } },
        },
      ],
      questions: [],
    },
    '1,5 L/min',
    'fr',
  );
  near(r.steps[0].values.q, 1.5);
});
test('nested unknown is missing, not zero', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's',
          tool: 'pipe-flow-speed-calculator',
          inputs: { q: { value: null, source: null, unit: 'L/min' } },
        },
      ],
    },
    'water flow',
  );
  assert.ok(r.steps[0].missing.includes('q'));
  assert.equal(r.steps[0].result, null);
});
test('typographic spaces recover exact original quote', () => {
  const r = interpret(
    {
      steps: [
        {
          id: 's',
          tool: 'force-calculator',
          inputs: { a: { value: 2, unit: 'm/s²', source: '加速度 2 m/s²' } },
        },
      ],
    },
    '加速度2 m/s²',
  );
  assert.equal(r.steps[0].sources.a.source, '加速度2 m/s²');
});
test('money links retain currency and reject implicit exchange', () => {
  const steps = [
    {
      id: 's',
      tool: 'shopping-total',
      values: {
        items: [
          { name: 'A', quantity: 1, unit: 'each', price: 12000, perUnit: 'each', currency: 'CNY' },
        ],
      },
    },
    {
      id: 'l',
      tool: 'loan-calculator',
      values: { rate: 0, term: 1 },
      sources: { prin: { ref: { step: 's', row: 0 } } },
    },
  ];
  const r = recompute(steps);
  near(r[1].result.rows[0].value, 1000);
  assert.equal(r[0].currency, 'CNY');
  assert.equal(r[1].currency, 'CNY');
  assert.equal(r[1].result.currency, 'CNY');
  steps[1].currency = 'USD';
  assert.throws(() => recompute(steps), InputError);
});
test('shopping charges cannot silently change currency', () => {
  assert.throws(
    () =>
      calculate(
        'shopping-total',
        {
          items: [
            { name: 'A', quantity: 1, unit: 'each', price: 5, perUnit: 'each', currency: 'USD' },
          ],
          shipping: 2,
        },
        'CNY',
      ),
    InputError,
  );
});
const fake = { AI: { run: async () => ({ response: 'malformed' }) } };
await assert.rejects(planQuestion(fake, 'x', 'en'), InputError);
checks++;
const copyContext = { window: {} };
for (const file of ['cm-ai-copy.js', 'cm-ai-examples.js', 'cm-ai-notes.js'])
  vm.runInNewContext(
    await fs.readFile(new URL('../../assets/' + file, import.meta.url), 'utf8'),
    copyContext,
  );
const locales = 'en zh-CN hi es ar fr bn pt id ur ru de ja pcm mr vi te sw ha tr'.split(' ');
for (const locale of locales)
  test('AI copy and examples ' + locale, () => {
    const { CMAICopy, CMAIExamples, CMAINotes } = copyContext.window;
    assert.deepEqual(Object.keys(CMAICopy[locale]), Object.keys(CMAICopy.en));
    assert.ok(Object.values(CMAICopy[locale]).every((v) => typeof v === 'string' && v.trim()));
    assert.equal(CMAIExamples[locale].length, 4);
    assert.equal(CMAINotes[locale].length, 4);
    assert.ok([...CMAIExamples[locale], ...CMAINotes[locale]].every((v) => v.trim()));
  });
let repairCalls = 0;
const repairEnv = {
  AI: {
    run: async () => {
      const responses = [
        { tools: ['pipe-flow-speed-calculator'] },
        {
          steps: [
            {
              id: 's1',
              tool: 'pipe-flow-speed-calculator',
              inputs: { q: { value: 12, unit: 'L/min', source: '120 L/min' } },
            },
          ],
          questions: [],
        },
        {
          steps: [
            {
              id: 's1',
              tool: 'pipe-flow-speed-calculator',
              inputs: {
                q: { value: 12, unit: 'L/min', source: '12 L/min' },
                d: { value: 20, unit: 'mm', source: '20 mm' },
              },
            },
          ],
          questions: [],
        },
      ];
      return { response: JSON.stringify(responses[repairCalls++]) };
    },
  },
};
const repaired = await planQuestion(repairEnv, '20 mm; 12 L/min', 'en');
near(repaired.steps[0].result.rows[0].value, 2 / Math.PI);
assert.equal(repairCalls, 3);
checks++;
let formatCalls = 0;
const correctPlan = {
  steps: [
    {
      id: 's',
      tool: 'arithmetic',
      inputs: { expression: { value: '(2+3)*4', unit: '', source: '(2+3)*4' } },
    },
  ],
};
const formatResponses = [
  { tools: ['not-registered'] },
  { tools: ['arithmetic'] },
  { steps: [{ id: 's', tool: 'not-registered', inputs: {} }] },
  correctPlan,
];
const formatResult = await planQuestion(
  { AI: { run: async () => ({ response: JSON.stringify(formatResponses[formatCalls++]) }) } },
  '(2+3)*4',
  'en',
);
near(formatResult.steps[0].result.rows[0].value, 20);
assert.equal(formatCalls, 4);
checks++;
console.log(
  JSON.stringify({
    checks,
    models: tools.length - 2,
    passed: true,
    scope:
      'Pure computation, schema, provenance, units, validation, CORS and failure handling. Mock AI failure is not an actual AI end-to-end test.',
  }),
);
