import { models, Decimal, scientific, finance, data } from './library.mjs';

export class InputError extends Error {
  constructor(code, details = '') {
    super(code);
    this.code = code;
    this.details = details;
  }
}
const bad = (code, details) => {
  throw new InputError(code, details);
};
const safe = (s, max = 1000) => typeof s === 'string' && s.length <= max;
const finite = (x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1e100;
const units = new Map();
function group(dimension, entries) {
  for (const [factor, ...names] of entries)
    for (const name of names) units.set(norm(name), { dimension, factor });
}
const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replaceAll('³', '3')
    .replaceAll('²', '2')
    .replace(/[\s·^]/g, '')
    .replaceAll('per', '/');
group('length', [
  [1, 'm', 'metre', 'meter', '米'],
  [0.001, 'mm', '毫米'],
  [0.01, 'cm', '厘米'],
  [1000, 'km', '千米', '公里'],
  [0.3048, 'ft', 'feet', 'foot', '英尺'],
  [0.0254, 'in', 'inch', '英寸'],
  [0.9144, 'yd'],
  [1609.344, 'mi', 'mile'],
]);
group('area', [
  [1, 'm2', 'm^2', '平方米'],
  [0.0001, 'cm2', 'cm^2'],
  [0.000001, 'mm2', 'mm^2'],
  [0.09290304, 'ft2', 'ft^2', '平方英尺'],
  [10000, 'ha', '公顷'],
]);
group('volume', [
  [1, 'm3', 'm^3', '立方米'],
  [0.001, 'L', 'litre', 'liter', '升'],
  [0.000001, 'mL', '毫升', 'cm3'],
  [0.003785411784, 'US gal', 'US gallon'],
]);
group('flow', [
  [1, 'm3/s', 'm³/s'],
  [1 / 60000, 'L/min', '升/分钟', '升/分'],
  [0.001, 'L/s', '升/秒'],
  [1 / 3600, 'm3/h', 'm³/h', '立方米/小时'],
]);
group('velocity', [
  [1, 'm/s', '米/秒'],
  [1 / 3.6, 'km/h', 'kph', '公里/小时'],
  [0.3048, 'ft/s'],
  [0.44704, 'mph'],
]);
group('mass', [
  [1, 'kg', '公斤', '千克'],
  [0.001, 'g', '克'],
  [0.000001, 'mg', '毫克'],
  [0.45359237, 'lb', 'lbs', '磅'],
  [1000, 't', 'tonne', '吨'],
]);
group('time', [
  [1, 's', 'sec', 'seconds', '秒'],
  [60, 'min', 'minute', 'minutes', '分钟'],
  [3600, 'h', 'hour', 'hours', '小时'],
  [86400, 'day', 'days', '天'],
  [604800, 'week', 'weeks', '周'],
]);
group('calendar-year', [
  [1, 'year', 'years', '年'],
  [1 / 12, 'month', 'months', '月'],
]);
group('pressure', [
  [1, 'Pa'],
  [1000, 'kPa'],
  [1e6, 'MPa'],
  [1e5, 'bar'],
  [6894.757293168, 'psi'],
]);
group('energy', [
  [1, 'J'],
  [1000, 'kJ'],
  [3600000, 'kWh'],
  [4184, 'kcal'],
]);
group('power', [
  [0.001, 'mW'],
  [1, 'W', 'watt', 'watts'],
  [1000, 'kW'],
  [1e6, 'MW'],
]);
group('ratio', [
  [1, '%', 'percent', '百分比'],
  [100, 'ratio', 'fraction'],
]);
group('boxes', [[1, 'box', 'boxes', '盒']]);
group('pieces', [[1, 'each', 'piece', 'pieces', '个', '件']]);
function numbersIn(source, locale = 'en') {
  const text = data.expression(source, locale).replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, '');
  const values = (text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi) || []).map(Number);
  for (const match of text.matchAll(/([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([万亿千百])/g))
    values.push(Number(match[1]) * { 万: 1e4, 亿: 1e8, 千: 1e3, 百: 100 }[match[2]]);
  for (const match of text.matchAll(/[零〇一二两三四五六七八九十百千万亿]+/g)) {
    const digits = {
        零: 0,
        〇: 0,
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
      },
      scale = { 十: 10, 百: 100, 千: 1000, 万: 1e4, 亿: 1e8 };
    let result = 0,
      section = 0,
      n = 0;
    for (const ch of match[0]) {
      if (ch in digits) n = digits[ch];
      else if (scale[ch] < 1e4) {
        section += (n || 1) * scale[ch];
        n = 0;
      } else {
        result += (section + n || 1) * scale[ch];
        section = n = 0;
      }
    }
    values.push(result + section + n);
  }
  return values;
}
const matchesNumber = (values, value) =>
  values.some((n) => Math.abs(n - value) <= Math.max(1, Math.abs(value)) * 1e-12);
export function convert(value, from, to) {
  if (!finite(value)) bad('invalid_number');
  if (to === 'currency' && /^(?:currency|USD|CNY|EUR|GBP|JPY|INR|IDR|RUB|BRL|TRY|NGN)$/i.test(from))
    return value;
  if (norm(from) === norm(to)) return value;
  const temperatures = new Map([
    ['°C', 'C'],
    ['celsius', 'C'],
    ['K', 'K'],
    ['kelvin', 'K'],
    ['°F', 'F'],
    ['fahrenheit', 'F'],
  ]);
  const tf = temperatures.get(norm(from)),
    tt = temperatures.get(norm(to));
  if (tf && tt) {
    const k = tf === 'K' ? value : tf === 'C' ? value + 273.15 : ((value - 32) * 5) / 9 + 273.15;
    return tt === 'K' ? k : tt === 'C' ? k - 273.15 : ((k - 273.15) * 9) / 5 + 32;
  }
  const a = units.get(norm(from)),
    b = units.get(norm(to));
  if (!a || !b || a.dimension !== b.dimension) bad('unit_mismatch', `${from} → ${to}`);
  const out = (value * a.factor) / b.factor;
  if (!finite(out)) bad('invalid_number');
  return out;
}
export const fieldUnit = (f) => f.label.split('|')[0].match(/\(([^()]*)\)\s*$/)?.[1] || '';
const arithmetic = {
  slug: 'arithmetic',
  name: 'Arithmetic expression|四则与科学算式',
  domain: 'Math',
  purpose: 'Calculate an explicit expression from the supplied numbers.',
  fields: [
    { id: 'expression', label: 'Expression|算式', type: 'text' },
    {
      id: 'mode',
      label: 'Angle mode|角度模式',
      type: 'select',
      options: [
        ['deg', 'Degrees|角度制'],
        ['rad', 'Radians|弧度制'],
      ],
      optional: 'deg',
    },
  ],
  formula: 'Expression evaluated by the scientific calculator parser; no code execution.',
  note: 'Check that the expression represents your question. Units are not inferred for arithmetic expressions. Trigonometry uses degrees unless radians is explicitly selected.|请核对算式是否表达了你的问题；算式不自动处理单位，三角函数默认角度制，可明确选择弧度制。',
  calculate: (v) => [
    {
      label: 'Result|结果',
      value: scientific(data.expression(v.expression), v.mode === 'deg'),
      unit: '',
    },
  ],
};
const shopping = {
  slug: 'shopping-total',
  name: 'Shopping and procurement totals|购物与采购核算',
  domain: 'Business',
  purpose: 'Item quantities, quoted prices, discount, tax and shipping; no price lookup.',
  fields: [
    { id: 'items', label: 'Items|明细', type: 'items' },
    {
      id: 'discount',
      label: 'Discount (%)|折扣减免（%）',
      type: 'number',
      min: 0,
      max: 100,
      optional: 0,
    },
    { id: 'tax', label: 'Tax (%)|税率（%）', type: 'number', min: 0, max: 100, optional: 0 },
    {
      id: 'shipping',
      label: 'Shipping (currency)|运费（货币）',
      type: 'number',
      min: 0,
      max: 1e12,
      optional: 0,
    },
  ],
  formula:
    'Σ(quantity × price per unit); subtract discount, add tax on discounted subtotal, then shipping. Round each line and each tax/discount adjustment half-up to 2 decimals.',
  note: 'Unstated discounts, taxes and shipping are excluded (0). All item prices must use the same currency. No current prices or exchange rates are invented.',
};
const nf = (id, label, min = 0, max = 1e15, optional) => ({
  id,
  label,
  type: 'number',
  min,
  max,
  optional,
});
const financeTools = [
  {
    slug: 'loan-calculator',
    name: 'Loan Payment|贷款月供',
    domain: 'Finance',
    purpose: 'Fixed-rate amortizing loan payment.',
    fields: [
      nf('prin', 'Principal (currency)|本金（货币）'),
      nf('rate', 'Annual interest (%)|年利率（%）', 0, 1000),
      nf('term', 'Term (years)|期限（年）', 1 / 12, 100),
      nf('extra', 'Extra monthly payment (currency)|每月额外还款（货币）', 0, 1e15, 0),
    ],
    formula:
      'M = P × r / (1 − (1+r)^−n); r = annual rate /1200, n = years×12. At zero interest, M = P/n.',
    note: 'Fixed-rate estimate; bank fees and local tax rules excluded. Unstated extra monthly payment is excluded (0). Currency is preserved without exchange.',
    calculate: (v) => finance.loan(v).rows,
  },
  {
    slug: 'mortgage-calculator',
    name: 'Mortgage Payment|房贷月供',
    domain: 'Finance',
    purpose: 'Mortgage principal and interest plus entered recurring costs.',
    fields: [
      nf('price', 'Home price (currency)|房价（货币）', 0.000001),
      nf('down', 'Down payment (currency)|首付（货币）'),
      nf('rate', 'Annual interest (%)|年利率（%）', 0, 1000),
      nf('term', 'Term (years)|期限（年）', 1 / 12, 100),
      nf('tax', 'Annual property tax (currency)|年房产税（货币）', 0, 1e15, 0),
      nf('ins', 'Annual insurance (currency)|年保险费（货币）', 0, 1e15, 0),
      nf('pmirate', 'Annual PMI (%)|年按揭保险费率（%）', 0, 100, 0),
      nf('hoa', 'Monthly HOA (currency)|每月物业费（货币）', 0, 1e15, 0),
      nf('extra', 'Extra monthly payment (currency)|每月额外还款（货币）', 0, 1e15, 0),
    ],
    formula:
      'Fixed-rate principal and interest plus annual property tax /12, insurance /12, applicable PMI and monthly HOA.',
    note: 'Unstated tax, insurance, PMI, HOA and extra payments are excluded (0), not estimated. Currency is preserved without exchange. PMI uses the linked calculator’s 80% LTV convention.',
    calculate: (v) => finance.mortgage(v).rows,
  },
];
const energy = {
  slug: 'electricity-usage',
  name: 'Electricity Use from Power and Daily Hours|功率与每日时长求用电量',
  domain: 'Science',
  purpose: 'Calculate energy for a constant load over repeated daily operating hours.',
  fields: [
    nf('power', 'Rated power (W)|额定功率（W）', 0, 1e15),
    nf('hours', 'Daily operating time (hours)|每日运行时长（小时）', 0, 24),
    nf('days', 'Period (days)|使用天数（天）', 0, 1e6),
  ],
  formula: 'E = P × daily hours × days /1000 (kWh)',
  note: 'Constant rated load, repeated daily schedule; excludes standby power and changing duty cycles.|假设恒定额定功率和每天相同运行时长，不包含待机耗电及变化的负载。',
  calculate: (v) => [
    { label: 'Energy used|耗电量', value: (v.power * v.hours * v.days) / 1000, unit: 'kWh' },
    { label: 'Total operating time|总运行时长', value: v.hours * v.days, unit: 'hours' },
  ],
};
export const tools = [...models, ...financeTools, energy, arithmetic, shopping];
const bySlug = new Map(tools.map((m) => [m.slug, m]));
export function schema(slug) {
  const m = bySlug.get(slug);
  if (!m) bad('unknown_tool', slug);
  return {
    slug: m.slug,
    name: m.name,
    domain: m.domain,
    formula: m.formula,
    note: m.note,
    fields: m.fields.map(({ id, label, type, min, max, step, options, optional }) => ({
      id,
      label,
      type,
      min,
      max,
      step,
      options,
      optional,
      unit: fieldUnit({ label }),
    })),
  };
}
const cents = (d) => {
  if (d.n < 0n) bad('invalid_number');
  return (d.n * 200n + d.d) / (d.d * 2n);
};
function shoppingRows(v) {
  if (!Array.isArray(v.items) || !v.items.length || v.items.length > 60) bad('invalid_items');
  let subtotal = 0n,
    currency = null;
  const rows = [];
  for (const item of v.items) {
    if (
      !safe(item.name, 100) ||
      !item.name.trim() ||
      !finite(item.quantity) ||
      item.quantity <= 0 ||
      !finite(item.price) ||
      item.price < 0 ||
      !safe(item.unit, 30) ||
      !safe(item.perUnit, 30) ||
      !safe(item.currency, 12) ||
      !item.currency.trim()
    )
      bad(
        'invalid_items',
        'Invalid item fields: ' +
          ['name', 'quantity', 'unit', 'price', 'perUnit', 'currency']
            .map((k) => k + ':' + typeof item[k])
            .join(', '),
      );
    if (currency && currency !== item.currency) bad('mixed_currency');
    currency = item.currency;
    const quantity = convert(item.quantity, item.unit, item.perUnit),
      a = units.get(norm(item.unit)),
      b = units.get(norm(item.perUnit)),
      exact =
        a && b
          ? Decimal.from(item.quantity).mul(Decimal.from(a.factor)).div(Decimal.from(b.factor))
          : Decimal.from(item.quantity),
      total = cents(exact.mul(Decimal.from(item.price)));
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) bad('invalid_number');
    subtotal += total;
    rows.push({
      label: item.name,
      value: Number(total) / 100,
      unit: currency,
      working: `${item.quantity} ${item.unit} = ${quantity} ${item.perUnit}; × ${item.price} ${currency}/${item.perUnit}`,
    });
  }
  const dec = Decimal.from,
    discount = cents(new Decimal(subtotal, 100n).mul(dec(v.discount)).div(dec(100))),
    discounted = subtotal - discount,
    tax = cents(new Decimal(discounted, 100n).mul(dec(v.tax)).div(dec(100))),
    shipping = cents(dec(v.shipping));
  if (
    subtotal > BigInt(Number.MAX_SAFE_INTEGER) ||
    discounted + tax + shipping > BigInt(Number.MAX_SAFE_INTEGER)
  )
    bad('invalid_number');
  return [
    { label: 'Total|合计', value: Number(discounted + tax + shipping) / 100, unit: currency },
    { label: 'Subtotal|小计', value: Number(subtotal) / 100, unit: currency },
    { label: 'Discount|减免', value: Number(discount) / 100, unit: currency },
    { label: 'Tax|税费', value: Number(tax) / 100, unit: currency },
    { label: 'Shipping|运费', value: Number(shipping) / 100, unit: currency },
    ...rows,
  ];
}
export function calculate(slug, values, currency = 'currency', locale = 'en') {
  const m = bySlug.get(slug);
  if (!m) bad('unknown_tool', slug);
  if (!values || typeof values !== 'object' || Array.isArray(values)) bad('invalid_inputs');
  const v = {};
  for (const f of m.fields) {
    let x = values[f.id];
    if (x === undefined && f.optional !== undefined) x = f.optional;
    if (x === undefined || x === null || x === '') bad('missing_field', f.id);
    if (f.type === 'number') {
      if (
        !finite(x) ||
        (f.min !== undefined && x < Number(f.min)) ||
        (f.max !== undefined && x > Number(f.max)) ||
        (Number(f.step) === 1 && !Number.isInteger(x))
      )
        bad('invalid_field', f.id);
    } else if (f.type === 'select') {
      if (!f.options.some((o) => o[0] === x)) bad('invalid_field', f.id);
    } else if (f.type !== 'items' && (!safe(x, f.type === 'textarea' ? 8000 : 300) || !x.trim()))
      bad('invalid_field', f.id);
    v[f.id] = slug === 'arithmetic' && f.id === 'expression' ? data.expression(x, locale) : x;
  }
  let rows;
  try {
    rows = slug === 'shopping-total' ? shoppingRows(v) : m.calculate(v);
  } catch (e) {
    if (e instanceof InputError) throw e;
    bad('calculation_error', String(e.message).slice(0, 400));
  }
  if (!Array.isArray(rows) || !rows.length || rows.length > 1000) bad('invalid_result');
  for (const r of rows)
    if (typeof r.value === 'number' && !Number.isFinite(r.value)) bad('invalid_result');
  if (!/^(?:currency|USD|CNY|EUR|GBP|JPY|INR|IDR|RUB|BRL|TRY|NGN)$/.test(currency))
    bad('mixed_currency');
  if (financeTools.includes(m))
    rows = rows.map((r) => ({ ...r, unit: (r.unit || '').replaceAll('USD', currency) }));
  return {
    tool: slug,
    name: m.name,
    formula: m.formula,
    note: m.note,
    currency,
    inputs: v,
    fields: schema(slug).fields,
    totalRows: rows.length,
    rows: rows.slice(0, 100),
    truncated: rows.length > 100,
  };
}
function exactQuote(text, candidate) {
  if (!safe(candidate, 1200) || !candidate.trim()) return null;
  if (text.includes(candidate)) return candidate;
  // Models sometimes insert typographic spaces. Match characters without whitespace,
  // then recover the actual contiguous original substring rather than inventing a quote.
  const positions = [],
    chars = [];
  for (let i = 0; i < text.length; i++)
    if (!/\s/.test(text[i])) {
      positions.push(i);
      chars.push(text[i]);
    }
  const compact = candidate.replace(/\s/g, ''),
    start = chars.join('').indexOf(compact);
  if (!compact || start < 0) return null;
  const quote = text.slice(positions[start], positions[start + compact.length - 1] + 1);
  return quote.length <= 1200 ? quote : null;
}
export function interpret(plan, text, locale = 'en') {
  if (
    !plan ||
    !Array.isArray(plan.steps) ||
    plan.steps.length > 4 ||
    (plan.questions !== undefined && (!Array.isArray(plan.questions) || plan.questions.length > 12))
  )
    bad('invalid_plan', 'Expected up to four steps and an optional questions array');
  const results = [],
    questions = [],
    seen = new Set();
  for (const [k, s] of plan.steps.entries()) {
    if (!s || !safe(s.id, 30) || seen.has(s.id) || !bySlug.has(s.tool))
      bad(
        'invalid_plan',
        'Each step needs a unique string id and known tool: ' +
          JSON.stringify({ id: s?.id, tool: s?.tool }),
      );
    seen.add(s.id);
    const values = {},
      sources = {},
      missing = [],
      normalized = [];
    let currency = 'currency';
    for (const f of schema(s.tool).fields) {
      let input = s.inputs?.[f.id];
      if (f.type === 'items' && Array.isArray(input)) input = { value: input };
      if (f.type === 'items' && input?.value === undefined && Array.isArray(input?.items))
        input = { value: input.items };
      if (input && typeof input === 'object' && !input.ref && input.value === null) input = null;
      if (input === undefined || input === null) {
        if (input === null && Object.hasOwn(s.inputs || {}, f.id)) {
          missing.push(f.id);
          continue;
        }
        if (f.optional !== undefined) {
          values[f.id] = f.optional;
          sources[f.id] = { assumption: true };
        } else missing.push(f.id);
        continue;
      }
      if (typeof input === 'object' && input.source)
        input = { ...input, source: exactQuote(text, input.source) || input.source };
      if (input.ref) {
        const earlier = results.find((r) => r.id === input.ref.step),
          row = earlier?.result?.rows?.[input.ref.row];
        if (earlier && !earlier.result) {
          missing.push(f.id);
          sources[f.id] = { ref: input.ref };
          continue;
        }
        if (!row || typeof row.value !== 'number') bad('invalid_reference');
        values[f.id] = convert(row.value, row.unit || '', f.unit);
        sources[f.id] = { ref: input.ref };
      } else {
        if (
          f.type !== 'items' &&
          (!safe(input.source, 1200) || !input.source.trim() || !text.includes(input.source))
        )
          bad('missing_evidence', f.id + ': input=' + JSON.stringify(input));
        let value = input.value;
        if (
          f.type === 'number' &&
          typeof value === 'string' &&
          /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)
        )
          value = Number(value);
        if (f.type === 'number') {
          if (!finite(value)) bad('invalid_field', f.id);
          // Preserve extraction evidence; numeric normalization and conversion are visible.
          if (!matchesNumber(numbersIn(input.source, locale), value))
            bad('numeric_evidence_mismatch', f.id);
          if (!safe(input.unit || '', 40)) bad('unit_mismatch');
          if (f.unit === 'currency' && input.unit && input.unit !== 'currency') {
            const next = input.unit.toUpperCase();
            if (currency !== 'currency' && currency !== next) bad('mixed_currency');
            currency = next;
          }
          value =
            s.tool === 'shopping-total' && f.id === 'discount' && input.unit === '折'
              ? 100 - value * 10
              : convert(value, input.unit || '', f.unit);
          normalized.push({
            field: f.id,
            value,
            unit: f.unit,
            originalValue: input.value,
            originalUnit: input.unit || '',
          });
        }
        if (f.type === 'items') {
          if (!Array.isArray(value) || value.length > 60)
            bad('invalid_items', 'Expected an item array');
          const currencies = [
            ...new Set(text.match(/\b(?:CNY|USD|EUR|GBP|JPY|INR|IDR|RUB|BRL|TRY|NGN)\b/g) || []),
          ];
          value = value.map((item) => {
            const v = { ...item };
            v.quantity ??= item.qty;
            v.price ??= item.unit_price;
            v.perUnit ??= item.priceUnit;
            for (const k of ['quantity', 'price'])
              if (
                typeof v[k] === 'string' &&
                /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v[k])
              )
                v[k] = Number(v[k]);
            if (!v.currency && currencies.length === 1) v.currency = currencies[0];
            return v;
          });
          for (const item of value) {
            item.source = exactQuote(text, item.source) || item.source;
            if (!safe(item.source, 1200) || !text.includes(item.source) || !item.source.trim())
              bad('missing_evidence', 'items');
            const nums = numbersIn(item.source, locale);
            if (
              (item.quantity !== undefined &&
                item.quantity !== null &&
                !matchesNumber(nums, item.quantity)) ||
              (item.price !== undefined && item.price !== null && !matchesNumber(nums, item.price))
            )
              bad('numeric_evidence_mismatch', 'items');
            if (
              !finite(item.quantity) ||
              !finite(item.price) ||
              !item.unit ||
              !item.perUnit ||
              !item.currency
            )
              if (!missing.includes('items')) missing.push('items');
          }
        }
        if (
          ['text', 'textarea', 'date', 'month'].includes(f.type) &&
          typeof value === 'string' &&
          s.tool !== 'arithmetic'
        ) {
          const extracted = numbersIn(value, 'en'),
            original = numbersIn(input.source, locale);
          if (
            extracted.some(
              (n) =>
                !matchesNumber(original, n) &&
                !(['date', 'month'].includes(f.type) && matchesNumber(original, Math.abs(n))),
            )
          )
            bad('numeric_evidence_mismatch', f.id);
        }
        if (s.tool === 'arithmetic' && f.id === 'expression') {
          const nums = value?.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi) || [];
          const original =
            data.expression(text, locale).match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi) || [];
          if (nums.some((n) => !original.some((o) => Number(o) === Number(n))))
            bad('numeric_evidence_mismatch', 'expression');
        }
        values[f.id] = value;
        sources[f.id] = {
          source: input.source || (f.type === 'items' ? value.map((x) => x.source).join('\n') : ''),
        };
      }
    }
    let result = null;
    if (!missing.length) result = calculate(s.tool, values, currency, locale);
    for (const field of missing)
      questions.push({
        step: s.id,
        field,
        label: schema(s.tool).fields.find((f) => f.id === field).label,
      });
    results.push({
      id: s.id,
      index: k + 1,
      tool: s.tool,
      currency,
      schema: schema(s.tool),
      values,
      sources,
      normalized,
      missing,
      result,
    });
  }
  return {
    title: safe(plan.title, 160) ? plan.title : '',
    steps: results,
    questions,
    explanation: safe(plan.explanation, 1200) ? plan.explanation : '',
    unsupported: !results.length,
  };
}

export function recompute(steps, locale = 'en') {
  if (!Array.isArray(steps) || steps.length > 4) bad('invalid_plan');
  const out = [];
  for (const s of steps) {
    if (
      !safe(s.id, 30) ||
      out.some((x) => x.id === s.id) ||
      !s.values ||
      typeof s.values !== 'object'
    )
      bad('invalid_plan');
    const spec = schema(s.tool),
      values = { ...s.values },
      missing = [];
    for (const f of spec.fields) {
      const ref = s.sources?.[f.id]?.ref;
      if (ref) {
        const parent = out.find((x) => x.id === ref.step);
        if (!parent) bad('invalid_reference');
        if (!parent.result) {
          delete values[f.id];
          missing.push(f.id);
          continue;
        }
        const row = parent.result.rows[ref.row];
        if (!row || typeof row.value !== 'number') bad('invalid_reference');
        values[f.id] = convert(row.value, row.unit || '', f.unit);
      }
      if (values[f.id] === undefined || values[f.id] === null || values[f.id] === '') {
        if (f.optional !== undefined) values[f.id] = f.optional;
        else missing.push(f.id);
      }
    }
    out.push({
      ...s,
      schema: spec,
      values,
      missing,
      result: missing.length ? null : calculate(s.tool, values, s.currency, locale),
    });
  }
  return out;
}
