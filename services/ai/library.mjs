/* Numeric input and output shared by calculators and generated pages. */
var CMData = (() => {
  'use strict';
  // Unit symbols are notation, even when a dictionary also contains the same ordinary word.
  // Keep this boundary in unit contexts; descriptive unit names still use normal localization.
  const unitSymbols = new Set(
    (
      'A Ah AU Bq C Ci F GBq GHz Gal Gy GΩ H Hz J L L/h L/min L/mol L/s MB MB/s MBq MHz MJ MP MPa MV MW MΩ Mbps N N/C N·cm N·m N·s PPI Pa Pa·s TB Torr V W W/(cm·K) W/(m·K) W/cm² W/ft² W/kg W/m² W/m²·K Wh ' +
      'atm bar bpm cm dB dyn eV ft/s² ft³/min g g/cm³ g/mL kA kBq kHz kJ kN kPa kV kW kW/m² kWh kcal kg kg/L kg/m² kg/m³ kgf kgf·m kg·m/s kg·m² km km/h kΩ lb/ft³ lbf lbf·ft lbf·in ' +
      'm m/s m/s² mA mAh mC mCi mF mGy mH mPa·s mV mW/(m·K) min/km mm mm²/s ms m² m²/s m²·K/W m³ m³/h m³/s mΩ nA nC nF nH nm pF psi px rad rad/s rad/s² rpm s vw µA µC µCi µF µGy µH µV µΩ Ω ° °C % × 1/h lm lx'
    ).split(' '),
  );
  function isUnitSymbol(source) {
    return unitSymbols.has(source);
  }
  function digits(value) {
    return String(value)
      .replace(/[٠-٩۰-۹०-९০-৯౦-౯]/g, (char) => {
        for (const zero of [0x660, 0x6f0, 0x966, 0x9e6, 0xc66]) {
          const n = char.codePointAt(0) - zero;
          if (n >= 0 && n <= 9) return String(n);
        }
        return char;
      })
      .replaceAll('٫', '.')
      .replaceAll('٬', '')
      .replaceAll('−', '-');
  }
  function list(source) {
    const tokens = digits(source)
      .trim()
      .split(/[\s,;，；]+/)
      .filter(Boolean);
    if (tokens.length < 1 || tokens.length > 1000)
      throw Error('Enter 1–1000 numbers.|请输入 1–1000 个数。');
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    if (!tokens.every((token) => decimal.test(token)))
      throw Error(
        'Every item must be a complete decimal number. Separate values with spaces, commas or semicolons.|每一项须为完整十进制数，以空格、逗号或分号分隔。',
      );
    const values = tokens.map(Number);
    if (!values.every(Number.isFinite))
      throw Error('Every number must be finite.|所有数值须为有限数字。');
    return values;
  }
  function displayNumber(source, locale = 'en') {
    let text = String(source).replace(/[\u061c\u200e\u200f]/g, '');
    const parts = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).formatToParts(
        1234567.89,
      ),
      group = parts.find((p) => p.type === 'group')?.value,
      decimal = parts.find((p) => p.type === 'decimal')?.value;
    if (group) text = text.replaceAll(group, '');
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    text = digits(text);
    const matches = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
    if (matches.length !== 1 || /NaN|Infinity|∞/.test(text)) return null;
    const value = Number(matches[0]);
    return Number.isFinite(value) ? value : null;
  }
  function expression(source, locale = 'en') {
    let text = digits(source);
    const decimal = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale)
      .formatToParts(1.1)
      .find((p) => p.type === 'decimal')?.value;
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    return text;
  }
  function resultNumberOptions(value, domain, fractionDigits) {
    if (Number.isInteger(fractionDigits) && fractionDigits >= 0 && fractionDigits <= 4)
      return { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits };
    if (value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e12))
      return { maximumSignificantDigits: 8, notation: 'scientific' };
    const measured = domain === 'Health' || domain === 'Home and Everyday';
    return { maximumSignificantDigits: measured && !Number.isInteger(value) ? 6 : 12 };
  }
  function unit(source, value = 2, locale = 'en', translate = (s) => s, t = (s) => s) {
    if (isUnitSymbol(source)) return source;
    const rateTime = (key) =>
      locale === 'zh-CN'
        ? { month: '月', year: '年', hour: '小时' }[key] || unit(key, 1, locale, translate, t)
        : locale === 'ja'
          ? { month: '月', year: '年', hour: '時間' }[key] || unit(key, 1, locale, translate, t)
          : unit(key, 1, locale, translate, t);
    const composite = String(source).match(/^([A-Z]{3})\/(month|year|hour|call|order)$/);
    if (composite)
      return (
        composite[1] +
        '/' +
        (composite[2] === 'call'
          ? t('unitCall')
          : composite[2] === 'order'
            ? t('unitOrder')
            : rateTime(composite[2]))
      );
    const count = String(source).match(/^(calls|orders)\/(month|year)$/);
    if (count)
      return (
        t(
          count[1] === 'calls'
            ? Number(value) === 1
              ? 'unitCall'
              : 'unitCalls'
            : Number(value) === 1
              ? 'unitOrder'
              : 'unitOrders',
        ) +
        '/' +
        rateTime(count[2])
      );
    const units = {
      weeks: 'week',
      week: 'week',
      years: 'year',
      year: 'year',
      months: 'month',
      month: 'month',
      days: 'day',
      day: 'day',
      hours: 'hour',
      hour: 'hour',
      minutes: 'minute',
      minute: 'minute',
      seconds: 'second',
      second: 'second',
      bits: 'bit',
      bytes: 'byte',
    };
    if (units[source])
      try {
        return new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, {
          style: 'unit',
          unit: units[source],
          unitDisplay: 'long',
        })
          .formatToParts(Math.abs(Number(value) || 0))
          .filter((x) => x.type === 'unit')
          .map((x) => x.value)
          .join(' ');
      } catch {}
    return translate(source);
  }
  return { digits, list, displayNumber, expression, resultNumberOptions, isUnitSymbol, unit };
})();

;
/* CalcMintly model library. Pure functions, also executed by release verification. */
var CMModels = (() => {
  'use strict';
  const models = [];
  const fail = (message) => {
    throw new Error(message);
  };
  const check = (condition, message) => {
    if (!condition) fail(message);
  };
  const n = (id, label, value, min = 0, max = 1e15, step = 'any') => ({
    id,
    label,
    value,
    min,
    max,
    step,
    type: 'number',
  });
  const p = (id, label, value) => n(id, label, value, 1e-12);
  const u = (id, label, value) => n(id, label, value, -1e15);
  const i = (id, label, value, min = 0, max = 10000) => n(id, label, value, min, max, 1);
  const text = (id, label, value) => ({ id, label, value, type: 'textarea' });
  const select = (id, label, value, options) => ({ id, label, value, options, type: 'select' });
  const row = (label, value, unit = '', options = {}) => ({ ...options, label, value, unit });
  const add = (
    slug,
    name,
    domain,
    purpose,
    fields,
    calculate,
    formula,
    expected,
    note = 'Use consistent units. The result follows the assumptions you enter.|请使用一致单位，结果取决于你输入的假设。',
  ) => {
    const canonical =
      slug.endsWith('-calculator') || slug.endsWith('-converter') ? slug : slug + '-calculator';
    check(!models.some((m) => m.slug === canonical), 'Duplicate model: ' + canonical);
    models.push({
      slug: canonical,
      name,
      domain,
      purpose,
      fields,
      calculate,
      formula,
      expected,
      note,
    });
  };
  const nums = (value) => CMData.list(value);
  const sum = (a) => a.reduce((s, x) => s + x, 0),
    mean = (a) => sum(a) / a.length;
  const variance = (a, sample = true) => {
    check(
      a.length > (sample ? 1 : 0),
      'At least two observations are required.|至少需要两个观测值。',
    );
    const m = mean(a);
    return sum(a.map((x) => (x - m) ** 2)) / (a.length - (sample ? 1 : 0));
  };
  const quantile = (a, q) => {
    const b = [...a].sort((x, y) => x - y),
      j = (b.length - 1) * q,
      k = Math.floor(j);
    return b[k] + (b[Math.min(k + 1, b.length - 1)] - b[k]) * (j - k);
  };
  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const r = a % b;
      a = b;
      b = r;
    }
    return a;
  };
  const factorial = (n) => {
    check(
      Number.isInteger(n) && n >= 0 && n <= 170,
      'Use a whole number from 0 to 170.|请输入 0–170 的整数。',
    );
    let r = 1;
    for (let k = 2; k <= n; k++) r *= k;
    return r;
  };
  const logGamma = (z) => {
    const c = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
    ];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z--;
    let x = 0.99999999999980993;
    for (let k = 0; k < c.length; k++) x += c[k] / (z + k + 1);
    const t = z + c.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };
  const choose = (n, k) => {
    check(
      Number.isInteger(n) && Number.isInteger(k) && k >= 0 && k <= n && n <= 10000,
      'Require whole numbers with 0 ≤ k ≤ n ≤ 10,000.|需满足整数 0 ≤ k ≤ n ≤ 10,000。',
    );
    return Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1));
  };
  const normal = (x) =>
    x === 0 ? 0.5 : x > 0 ? 1 - gammaQ(0.5, (x * x) / 2) / 2 : gammaQ(0.5, (x * x) / 2) / 2;
  const invNormal = (p) => {
    if (p === 0.5) return 0;
    check(
      p > 0 && p < 1,
      'Probability must be strictly between 0 and 1.|概率必须大于 0 且小于 1。',
    );
    let lo = -9,
      hi = 9;
    for (let k = 0; k < 80; k++) {
      const m = (lo + hi) / 2;
      if (normal(m) < p) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  function betaFraction(a, b, x) {
    let c = 1,
      d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d,
      converged = false;
    for (let m = 1; m <= 20000; m++) {
      let aa = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-13) {
        converged = true;
        break;
      }
    }
    check(
      converged && Number.isFinite(h),
      'The probability calculation did not converge within the supported numeric range.|概率计算在支持的数值范围内未收敛。',
    );
    return h;
  }
  const beta = (x, a, b) => {
    check(
      Number.isFinite(a) &&
        Number.isFinite(b) &&
        a > 0 &&
        b > 0 &&
        a + b <= 1e7 &&
        typeof x === 'number' &&
        !Number.isNaN(x),
      'Beta-distribution parameters are outside the supported numeric range.|贝塔分布参数超出支持的数值范围。',
    );
    if (x === 0.5 && a === b) return 0.5;
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(
      logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x),
    );
    return x < (a + 1) / (a + b + 2)
      ? (bt * betaFraction(a, b, x)) / a
      : 1 - (bt * betaFraction(b, a, 1 - x)) / b;
  };
  const tP = (t, df) => beta(df / (df + t * t), df / 2, 0.5);
  function gammaPair(a, x) {
    check(
      Number.isFinite(a) && a > 0 && x >= 0 && !Number.isNaN(x),
      'Invalid gamma-distribution parameters.|伽马分布参数无效。',
    );
    if (x === 0) return [0, 1];
    if (x === Infinity) return [1, 0];
    const factor = Math.exp(-x + a * Math.log(x) - logGamma(a)),
      clamp = (n) => Math.max(0, Math.min(1, n));
    if (x < a + 1) {
      let d = 1 / a,
        s = d,
        converged = false;
      for (let k = 1; k <= 20000; k++) {
        d *= x / (a + k);
        s += d;
        if (Math.abs(d) < Math.abs(s) * 1e-14) {
          converged = true;
          break;
        }
      }
      check(converged, 'Probability calculation did not converge.|概率计算未收敛。');
      const p = clamp(s * factor);
      return [p, 1 - p];
    }
    let b = x + 1 - a,
      c = 1e30,
      d = 1 / b,
      h = d,
      converged = false;
    for (let k = 1; k <= 20000; k++) {
      const an = -k * (k - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) {
        converged = true;
        break;
      }
    }
    check(converged, 'Probability calculation did not converge.|概率计算未收敛。');
    const q = clamp(factor * h);
    return [1 - q, q];
  }
  function gammaP(a, x) {
    return gammaPair(a, x)[0];
  }
  function gammaQ(a, x) {
    return gammaPair(a, x)[1];
  }
  const annuity = (r, t) => (r === 0 ? t : -Math.expm1(-t * Math.log1p(r)) / r);
  const payment = (principal, rate, months) => principal / annuity(rate, months);
  const bisect = (fn, lo, hi) => {
    let a = fn(lo),
      b = fn(hi);
    check(a * b <= 0, 'No solution in the supported interval.|支持区间内没有解。');
    for (let k = 0; k < 120; k++) {
      const m = (lo + hi) / 2,
        v = fn(m);
      if (Math.abs(v) < 1e-11) return m;
      if (a * v <= 0) {
        hi = m;
      } else {
        lo = m;
        a = v;
      }
    }
    return (lo + hi) / 2;
  };
  const PI = Math.PI,
    rad = (x) => (x * PI) / 180,
    deg = (x) => (x * 180) / PI;
  return {
    models,
    add,
    n,
    p,
    u,
    i,
    text,
    select,
    row,
    fail,
    check,
    nums,
    sum,
    mean,
    variance,
    quantile,
    gcd,
    factorial,
    choose,
    logGamma,
    normal,
    invNormal,
    beta,
    tP,
    gammaP,
    gammaQ,
    annuity,
    payment,
    bisect,
    PI,
    rad,
    deg,
  };
})();

;
(() => {
  'use strict';
  const { add, u, i, text, select, row: R, check, PI } = CMModels;
  function C(
    slug,
    name,
    purpose,
    units,
    from,
    to,
    x,
    expected,
    note = 'Conversion factors are defined relative to the displayed base unit. Input precision limits meaningful output precision; this does not change a physical quantity or perform a safety assessment.|换算系数相对于所示基本单位定义；输入精度决定有意义的输出精度，不改变物理量，也不进行安全评估。',
  ) {
    const options = units.map(([id, label]) => [id, label]),
      factor = (id) => units.find((x) => x[0] === id)[2];
    add(
      slug + '-converter',
      name,
      'Converters',
      purpose,
      [
        u('x', 'Value to convert|待换算数值', x),
        select('a', 'From unit|原单位', from, options),
        select('b', 'To unit|目标单位', to, options),
      ],
      (v) => [
        R(
          'Converted value|换算值',
          (v.x * factor(v.a)) / factor(v.b),
          units.find((x) => x[0] === v.b)[0],
        ),
        R('Value in base unit|基本单位数值', v.x * factor(v.a), units[0][0]),
      ],
      'y = x × a ÷ b',
      [expected],
      note,
    );
    CMModels.models.at(-1).referenceTable = {
      baseUnit: units[0][0],
      units,
    };
  }
  C(
    'pressure',
    'Pressure Converter|压强单位换算',
    'Convert absolute or gauge pressure values without changing their reference.|换算绝对压强或表压数值，保持压力参考基准。',
    [
      ['Pa', 'Pa', 1],
      ['kPa', 'kPa', 1000],
      ['MPa', 'MPa', 1e6],
      ['bar', 'bar', 1e5],
      ['atm', 'atm', 101325],
      ['psi', 'psi', 6894.757293168361],
      ['Torr', 'Torr', 101325 / 760],
    ],
    'atm',
    'kPa',
    1,
    101.325,
  );
  C(
    'energy',
    'Energy Converter|能量单位换算',
    'Convert work, heat and electrical energy units.|换算功、热与电能单位。',
    [
      ['J', 'J', 1],
      ['kJ', 'kJ', 1000],
      ['MJ', 'MJ', 1e6],
      ['Wh', 'Wh', 3600],
      ['kWh', 'kWh', 3.6e6],
      ['cal-th', 'Calorie, thermochemical|热化学卡', 4.184],
      ['kcal-th', 'Kilocalorie, thermochemical|热化学千卡', 4184],
      ['eV', 'eV', 1.602176634e-19],
    ],
    'kWh',
    'MJ',
    1,
    3.6,
  );
  C(
    'power',
    'Power Converter|功率单位换算',
    'Convert power, including explicitly defined horsepower.|换算功率，并明确马力定义。',
    [
      ['W', 'W', 1],
      ['kW', 'kW', 1000],
      ['MW', 'MW', 1e6],
      ['hp-mech', 'Mechanical horsepower|机械马力', 745.6998715822702],
      ['PS', 'Metric horsepower|公制马力', 735.49875],
    ],
    'hp-mech',
    'W',
    1,
    745.6998715822702,
  );
  C(
    'force',
    'Force Converter|力单位换算',
    'Convert force independently of mass.|换算力单位，区别于质量。',
    [
      ['N', 'N', 1],
      ['kN', 'kN', 1000],
      ['dyn', 'dyn', 1e-5],
      ['lbf', 'lbf', 4.4482216152605],
      ['kgf', 'kgf', 9.80665],
    ],
    'kgf',
    'N',
    1,
    9.80665,
  );
  C(
    'angle',
    'Angle Converter|角度单位换算',
    'Convert plane angles, turns and angular minutes.|换算平面角、整周和角分角秒。',
    [
      ['rad', 'rad', 1],
      ['deg', 'Degrees|度', PI / 180],
      ['turn', 'Turns|周', 2 * PI],
      ['grad', 'Gradians|百分度', PI / 200],
      ['arcmin', 'Arcminutes|角分', PI / 10800],
      ['arcsec', 'Arcseconds|角秒', PI / 648000],
    ],
    'deg',
    'rad',
    180,
    PI,
  );
  C(
    'frequency',
    'Frequency Converter|频率单位换算',
    'Convert cycles per second and revolutions per minute.|换算每秒周期与每分钟转数。',
    [
      ['Hz', 'Hz', 1],
      ['kHz', 'kHz', 1000],
      ['MHz', 'MHz', 1e6],
      ['GHz', 'GHz', 1e9],
      ['rpm', 'rpm', 1 / 60],
    ],
    'rpm',
    'Hz',
    60,
    1,
  );
  C(
    'electric-charge',
    'Electric Charge Converter|电荷单位换算',
    'Convert coulombs, ampere hours and elementary charges.|换算库仑、安时与元电荷。',
    [
      ['C', 'C', 1],
      ['mC', 'mC', 0.001],
      ['µC', 'µC', 1e-6],
      ['nC', 'nC', 1e-9],
      ['Ah', 'Ah', 3600],
      ['mAh', 'mAh', 3.6],
      ['e', 'Elementary charges|元电荷', 1.602176634e-19],
    ],
    'Ah',
    'C',
    1,
    3600,
  );
  C(
    'voltage',
    'Voltage Converter|电压单位换算',
    'Convert electric potential differences with SI prefixes.|用 SI 前缀换算电势差。',
    [
      ['V', 'V', 1],
      ['mV', 'mV', 0.001],
      ['µV', 'µV', 1e-6],
      ['kV', 'kV', 1000],
      ['MV', 'MV', 1e6],
    ],
    'mV',
    'V',
    1000,
    1,
  );
  C(
    'electric-current',
    'Electric Current Converter|电流单位换算',
    'Convert electric-current scales with SI prefixes.|用 SI 前缀换算电流量级。',
    [
      ['A', 'A', 1],
      ['mA', 'mA', 0.001],
      ['µA', 'µA', 1e-6],
      ['nA', 'nA', 1e-9],
      ['kA', 'kA', 1000],
    ],
    'mA',
    'A',
    250,
    0.25,
  );
  C(
    'resistance',
    'Resistance Converter|电阻单位换算',
    'Convert ohms and their decimal multiples.|换算欧姆及其十进制倍数。',
    [
      ['Ω', 'Ω', 1],
      ['mΩ', 'mΩ', 0.001],
      ['µΩ', 'µΩ', 1e-6],
      ['kΩ', 'kΩ', 1000],
      ['MΩ', 'MΩ', 1e6],
      ['GΩ', 'GΩ', 1e9],
    ],
    'kΩ',
    'Ω',
    4.7,
    4700,
  );
  C(
    'capacitance',
    'Capacitance Converter|电容单位换算',
    'Convert farads, microfarads, nanofarads and picofarads.|换算法拉、微法、纳法与皮法。',
    [
      ['F', 'F', 1],
      ['mF', 'mF', 1e-3],
      ['µF', 'µF', 1e-6],
      ['nF', 'nF', 1e-9],
      ['pF', 'pF', 1e-12],
    ],
    'µF',
    'nF',
    1,
    1000,
  );
  C(
    'inductance',
    'Inductance Converter|电感单位换算',
    'Convert henrys and their decimal submultiples.|换算亨利及其十进制分数单位。',
    [
      ['H', 'H', 1],
      ['mH', 'mH', 1e-3],
      ['µH', 'µH', 1e-6],
      ['nH', 'nH', 1e-9],
    ],
    'mH',
    'µH',
    1,
    1000,
  );
  C(
    'density',
    'Density Converter|密度单位换算',
    'Convert mass per volume across metric and customary units.|换算公制与英制质量密度。',
    [
      ['kg/m³', 'kg/m³', 1],
      ['g/cm³', 'g/cm³', 1000],
      ['g/mL', 'g/mL', 1000],
      ['kg/L', 'kg/L', 1000],
      ['lb/ft³', 'lb/ft³', 0.45359237 / 0.028316846592],
      ['lb/US-gal', 'Pounds per US gallon|磅/美制加仑', 0.45359237 / 0.003785411784],
    ],
    'g/cm³',
    'kg/m³',
    1,
    1000,
  );
  C(
    'volume-flow',
    'Volume Flow Converter|体积流量单位换算',
    'Convert volumetric flow with explicit US and imperial gallons.|换算体积流量，明确美制与英制加仑。',
    [
      ['m³/s', 'm³/s', 1],
      ['m³/h', 'm³/h', 1 / 3600],
      ['L/s', 'L/s', 0.001],
      ['L/min', 'L/min', 0.001 / 60],
      ['US-gal/min', 'US gallons/min|美制加仑/分钟', 0.003785411784 / 60],
      ['imp-gal/min', 'Imperial gallons/min|英制加仑/分钟', 0.00454609 / 60],
      ['ft³/min', 'ft³/min', 0.028316846592 / 60],
    ],
    'L/min',
    'm³/h',
    60,
    3.6,
  );
  C(
    'torque',
    'Torque Converter|力矩单位换算',
    'Convert turning moments without treating them as energy.|换算转动力矩，保持其与能量的物理区别。',
    [
      ['N·m', 'N·m', 1],
      ['N·cm', 'N·cm', 0.01],
      ['lbf·ft', 'lbf·ft', 4.4482216152605 * 0.3048],
      ['lbf·in', 'lbf·in', 4.4482216152605 * 0.0254],
      ['kgf·m', 'kgf·m', 9.80665],
    ],
    'lbf·ft',
    'N·m',
    1,
    1.3558179483314003,
  );
  C(
    'acceleration',
    'Acceleration Converter|加速度单位换算',
    'Convert acceleration and standard gravity units.|换算加速度及标准重力倍数。',
    [
      ['m/s²', 'm/s²', 1],
      ['ft/s²', 'ft/s²', 0.3048],
      ['g0', 'Standard gravity|标准重力', 9.80665],
      ['Gal', 'Gal', 0.01],
    ],
    'g0',
    'm/s²',
    1,
    9.80665,
  );
  C(
    'dynamic-viscosity',
    'Dynamic Viscosity Converter|动力黏度单位换算',
    'Convert dynamic viscosity, including poise and centipoise.|换算动力黏度，包括泊与厘泊。',
    [
      ['Pa·s', 'Pa·s', 1],
      ['mPa·s', 'mPa·s', 0.001],
      ['P', 'Poise|泊', 0.1],
      ['cP', 'Centipoise|厘泊', 0.001],
    ],
    'cP',
    'Pa·s',
    1,
    0.001,
  );
  C(
    'kinematic-viscosity',
    'Kinematic Viscosity Converter|运动黏度单位换算',
    'Convert kinematic viscosity, including stokes and centistokes.|换算运动黏度，包括斯托克斯与厘斯。',
    [
      ['m²/s', 'm²/s', 1],
      ['mm²/s', 'mm²/s', 1e-6],
      ['St', 'Stokes|斯托克斯', 1e-4],
      ['cSt', 'Centistokes|厘斯', 1e-6],
    ],
    'cSt',
    'mm²/s',
    10,
    10,
  );
  C(
    'thermal-conductivity',
    'Thermal Conductivity Converter|导热系数单位换算',
    'Convert thermal conductivity with clearly defined heat units.|换算导热系数并明确热量单位定义。',
    [
      ['W/(m·K)', 'W/(m·K)', 1],
      ['mW/(m·K)', 'mW/(m·K)', 0.001],
      ['W/(cm·K)', 'W/(cm·K)', 100],
      ['cal-th/(s·cm·K)', 'Thermochemical cal/(s·cm·K)|热化学卡/(秒·厘米·K)', 418.4],
    ],
    'W/(cm·K)',
    'W/(m·K)',
    1,
    100,
  );
  C(
    'heat-flux',
    'Heat Flux Converter|热流密度单位换算',
    'Convert heat flow per unit area.|换算单位面积热流。',
    [
      ['W/m²', 'W/m²', 1],
      ['kW/m²', 'kW/m²', 1000],
      ['W/cm²', 'W/cm²', 10000],
      ['W/ft²', 'W/ft²', 1 / 0.09290304],
    ],
    'W/cm²',
    'kW/m²',
    1,
    10,
  );
  C(
    'illuminance',
    'Illuminance Converter|照度单位换算',
    'Convert lux, foot-candles and phot.|换算勒克斯、英尺烛光与辐透。',
    [
      ['lx', 'Lux|勒克斯', 1],
      ['fc', 'Foot-candles|英尺烛光', 1 / 0.09290304],
      ['ph', 'Phot|辐透', 10000],
    ],
    'fc',
    'lx',
    1,
    10.763910416709722,
  );
  C(
    'radioactivity',
    'Radioactivity Converter|放射性活度单位换算',
    'Convert decay activity units independently of absorbed dose.|换算衰变活度，保持其与吸收剂量的区别。',
    [
      ['Bq', 'Bq', 1],
      ['kBq', 'kBq', 1000],
      ['MBq', 'MBq', 1e6],
      ['GBq', 'GBq', 1e9],
      ['Ci', 'Ci', 3.7e10],
      ['mCi', 'mCi', 3.7e7],
      ['µCi', 'µCi', 3.7e4],
    ],
    'mCi',
    'MBq',
    1,
    37,
    'Activity is decays per second, not dose or health risk. No conversion to gray or sievert is performed.|活度表示每秒衰变次数，不是剂量或健康风险，不换算至戈瑞或希沃特。',
  );
  C(
    'absorbed-dose',
    'Absorbed Dose Converter|吸收剂量单位换算',
    'Convert gray and rad without assuming biological weighting.|换算戈瑞与拉德，不假定生物权重。',
    [
      ['Gy', 'Gy', 1],
      ['mGy', 'mGy', 0.001],
      ['µGy', 'µGy', 1e-6],
      ['rad', 'rad', 0.01],
    ],
    'rad',
    'mGy',
    1,
    10,
    'Absorbed energy per mass only. Gray is not interchangeable with sievert without radiation and tissue weighting. Not a medical dose calculation.|仅换算单位质量吸收能量，未经辐射与组织加权，戈瑞不能与希沃特互换；不用于医疗剂量计算。',
  );
  add(
    'number-base-converter',
    'Integer Number Base Converter|整数进制换算',
    'Converters',
    'Convert exact signed integers between bases 2 and 36.|在 2–36 进制间精确换算带符号整数。',
    [
      text('x', 'Integer digits, optional minus sign|整数数字，可带负号', 'FF'),
      i('a', 'Input base|原进制', 16, 2, 36),
      i('b', 'Output base|目标进制', 10, 2, 36),
    ],
    (v) => {
      let s = String(v.x).trim().toUpperCase(),
        negative = s.startsWith('-');
      if (negative) s = s.slice(1);
      check(
        s.length > 0 && s.length <= 1000 && /^[0-9A-Z]+$/.test(s),
        'Use 1–1,000 valid integer digits, without prefixes or separators.|请输入 1–1,000 位合法整数数字，不加前缀或分隔符。',
      );
      let value = 0n;
      for (const ch of s) {
        const d = parseInt(ch, 36);
        check(d < v.a, 'A digit is not valid in the input base.|某个数字不适用于原进制。');
        value = value * BigInt(v.a) + BigInt(d);
      }
      if (negative) value = -value;
      return [R('Converted integer|换算后的整数', value.toString(v.b).toUpperCase())];
    },
    'Accumulate value=value×inputBase+digit using exact integers, then divide by outputBase|用精确整数逐位累积 value=value×inputBase+digit，再反复除以 outputBase 生成目标进制数字。',
    ['255'],
    'Integer-only exact conversion. Letters A–Z represent digits 10–35; fractions and two’s-complement encodings are excluded.|仅精确换算整数，字母 A–Z 表示 10–35；不含小数与补码编码。',
  );
  add(
    'roman-numeral-converter',
    'Roman Numeral Converter|罗马数字换算',
    'Converters',
    'Convert integers into conventional subtractive Roman numerals.|将整数转换为常见减法式罗马数字。',
    [i('x', 'Integer from 1 to 3,999|1–3,999 的整数', 2026, 1, 3999)],
    (v) => {
      let x = v.x,
        out = '';
      for (const [a, s] of [
        [1000, 'M'],
        [900, 'CM'],
        [500, 'D'],
        [400, 'CD'],
        [100, 'C'],
        [90, 'XC'],
        [50, 'L'],
        [40, 'XL'],
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
      ])
        while (x >= a) {
          out += s;
          x -= a;
        }
      return [R('Roman numeral|罗马数字', out)];
    },
    'Greedy subtractive symbols: M, CM, D, CD, C, XC, L, XL, X, IX, V, IV, I|按从大到小的贪心减法顺序使用符号：M, CM, D, CD, C, XC, L, XL, X, IX, V, IV, I。',
    ['MMXXVI'],
    'Modern conventional notation for 1–3,999 only; historical variants and overbar notation are excluded.|仅支持 1–3,999 的现代常见写法，不含历史变体与上划线记数。',
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, i, text, select, row: R, check, nums, sum, gcd } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Planning estimate using your entered parameters. No external service, device, live tariff or network is contacted.|根据自填参数进行规划估算，不访问外部服务、设备、实时价目或网络。',
  ) => add(s, name, 'Digital and Technology', purpose, f, calc, formula, e, note);
  const eff = n('e', 'Transfer efficiency (%)|传输效率（%）', 80, 0.0001, 100);
  D(
    'download-time',
    'Download Time|下载时间',
    'Estimate transfer time with decimal bytes and network bit rates.|用十进制字节与网络比特率估计传输时间。',
    [
      n('s', 'File size (GB, decimal)|文件大小（GB，十进制）', 1),
      p('b', 'Link speed (Mbps)|链路速度（Mbps）', 100),
      eff,
    ],
    (v) => [
      R('Estimated duration|估计用时', (v.s * 8000) / ((v.b * v.e) / 100), 'seconds'),
      R('Effective transfer speed|有效传输速度', (v.b * v.e) / 100 / 8, 'MB/s'),
    ],
    'Use t = 8000G/(vη). G is the file size in decimal GB, v is the link speed in Mbps, η is the efficiency fraction, and t is seconds.|使用 t = 8000G/(vη)。G 为十进制 GB 文件大小，v 为 Mbps 链路速率，η 为效率比例，t 为秒数。',
    [100, 10],
  );
  D(
    'video-file-size',
    'Video File Size|视频文件大小',
    'Combine video and audio bitrates over a running time.|按播放时长合并视频与音频码率。',
    [
      n('v', 'Video bitrate (Mbps)|视频码率（Mbps）', 8),
      n('a', 'Audio bitrate (kbps)|音频码率（kbps）', 128),
      n('t', 'Duration (minutes)|时长（分钟）', 10),
      n('o', 'Container overhead (%)|封装额外开销（%）', 0, 0, 100),
    ],
    (v) => [
      R(
        'Estimated file size|估计文件大小',
        (((v.v + v.a / 1000) * v.t * 60) / 8) * (1 + v.o / 100),
        'MB',
      ),
    ],
    'Use S = (v+a/1000)t(1+h)/8. v is video Mbps, a is audio kbps, t is duration in seconds, h is the overhead fraction, and S is decimal MB.|使用 S = (v+a/1000)t(1+h)/8。v 为视频 Mbps，a 为音频 kbps，t 为秒数，h 为额外开销比例，S 为十进制 MB。',
    [609.6],
  );
  D(
    'audio-file-size',
    'Audio File Size|音频文件大小',
    'Estimate encoded audio size from total stream bitrate.|由编码后总音频码率估计大小。',
    [
      n('b', 'Total encoded bitrate (kbps)|编码总码率（kbps）', 320),
      n('t', 'Duration (minutes)|时长（分钟）', 5),
    ],
    (v) => [R('Encoded size|编码大小', (v.b * v.t * 60) / 8000, 'MB')],
    'Use S = bt/8000. b is the audio bitrate in kbps, t is duration in seconds, and S is decimal MB.|使用 S = bt/8000。b 为音频码率 kbps，t 为秒数，S 为十进制 MB。',
    [12],
    'Bitrate is the whole encoded stream; do not multiply it by channel count. Tags and container overhead are excluded.|码率指完整编码流，不再乘声道数；不含标签及封装开销。',
  );
  D(
    'uncompressed-image-size',
    'Uncompressed Image Size|未压缩图像大小',
    'Measure raw pixel storage before compression and metadata.|计算压缩及元数据之前的原始像素存储量。',
    [
      i('w', 'Pixel width|像素宽度', 1920, 1, 1000000),
      i('h', 'Pixel height|像素高度', 1080, 1, 1000000),
      i('b', 'Bits per pixel, all channels|每像素总位数（含全部通道）', 24, 1, 256),
    ],
    (v) => [
      R('Raw pixel bytes|原始像素字节', Math.ceil((v.w * v.h * v.b) / 8), 'bytes'),
      R('Megapixels|百万像素', (v.w * v.h) / 1e6, 'MP'),
    ],
    'Use B = ceil(WHd/8). W and H are pixel dimensions, d is bits per pixel, B is bytes, and ceil rounds up to a whole byte.|使用 B = ceil(WHd/8)。W、H 为像素宽高，d 为每像素位数，B 为字节数；ceil 表示向上取整到完整字节。',
    [6220800, 2.0736],
  );
  D(
    'aspect-ratio',
    'Aspect Ratio|宽高比',
    'Simplify integer dimensions and scale to a new width.|化简整数尺寸比例并缩放至新宽度。',
    [
      i('w', 'Original width|原宽度', 1920, 1, 1000000),
      i('h', 'Original height|原高度', 1080, 1, 1000000),
      n('n', 'Target width|目标宽度', 1280),
    ],
    (v) => {
      const g = gcd(v.w, v.h);
      return [
        R('Simplified ratio|化简比例', v.w / g + ':' + v.h / g),
        R('Target height|目标高度', (v.n * v.h) / v.w),
      ];
    },
    'Reduce W:H by dividing both dimensions by gcd(W,H). For a new width w, the proportional height is h = wH/W. gcd is the greatest common divisor.|将 W:H 的两边同时除以 gcd(W,H) 约简比例。新宽度为 w 时，等比例高度为 h = wH/W；gcd 为最大公约数。',
    ['16:9', 720],
  );
  D(
    'pixel-density',
    'Screen Pixel Density|屏幕像素密度',
    'Convert resolution and diagonal size into pixels per inch.|由分辨率与对角线长度计算每英寸像素。',
    [
      i('w', 'Horizontal pixels|横向像素', 1920, 1, 1000000),
      i('h', 'Vertical pixels|纵向像素', 1080, 1, 1000000),
      p('d', 'Screen diagonal (inches)|屏幕对角线（英寸）', 24),
    ],
    (v) => [
      R('Pixel density|像素密度', Math.hypot(v.w, v.h) / v.d, 'PPI'),
      R('Pixel pitch|像素间距', (25.4 * v.d) / Math.hypot(v.w, v.h), 'mm'),
    ],
    'Use PPI = √(W²+H²)/d. W and H are pixel dimensions and d is the screen diagonal in inches.|使用 PPI = √(W²+H²)/d。W、H 为像素宽高，d 为屏幕对角线长度（英寸）。',
    [91.7877987534291, 0.2767252330370444],
  );
  D(
    'photo-print-size',
    'Photo Print Size|照片打印尺寸',
    'Convert pixel dimensions and a chosen print density into physical size.|由像素尺寸与自选打印密度换算实际尺寸。',
    [
      i('w', 'Pixel width|像素宽度', 3000, 1, 1000000),
      i('h', 'Pixel height|像素高度', 2400, 1, 1000000),
      p('p', 'Pixels per printed inch|每打印英寸像素数', 300),
    ],
    (v) => [
      R('Print width|打印宽度', (v.w / v.p) * 2.54, 'cm'),
      R('Print height|打印高度', (v.h / v.p) * 2.54, 'cm'),
    ],
    'For each dimension, use c = p×2.54/PPI. p is the pixel count, c is centimetres, and PPI is pixels per inch.|每个方向均使用 c = p×2.54/PPI。p 为像素数，c 为厘米数，PPI 为每英寸像素数。',
    [25.4, 20.32],
  );
  D(
    'fluid-typography',
    'Fluid Typography Clamp|流式字号 clamp',
    'Generate a linear CSS font scale between two viewport widths.|在两个视口宽度间生成线性 CSS 字号变化。',
    [
      n('a', 'Minimum font size (px)|最小字号（px）', 16, 1, 200),
      n('b', 'Maximum font size (px)|最大字号（px）', 24, 1, 200),
      p('x', 'Minimum viewport width (px)|最小视口宽度（px）', 400),
      p('y', 'Maximum viewport width (px)|最大视口宽度（px）', 1200),
    ],
    (v) => {
      check(
        v.b >= v.a && v.y > v.x,
        'Font sizes must increase or stay equal, and viewport width must increase.|字号应递增或相等，视口宽度应递增。',
      );
      const slope = (100 * (v.b - v.a)) / (v.y - v.x),
        intercept = v.a - (slope * v.x) / 100;
      return [
        R(
          'CSS clamp expression|CSS clamp 表达式',
          `clamp(${v.a}px, calc(${intercept.toFixed(6).replace(/\.?0+$/, '')}px + ${slope.toFixed(6).replace(/\.?0+$/, '')}vw), ${v.b}px)`,
          '',
          { literal: true },
        ),
        R('Viewport coefficient|视口系数', slope, 'vw'),
        R('Pixel intercept|像素截距', intercept, 'px'),
      ];
    },
    'Use m = 100(f₁−f₀)/(v₁−v₀) and b = f₀−mv₀/100. The fluid size is clamp(f₀, b + m×vw, f₁); f denotes font sizes and v denotes viewport widths.|使用 m = 100(f₁−f₀)/(v₁−v₀) 和 b = f₀−mv₀/100。流式字号为 clamp(f₀, b + m×vw, f₁)；f 表示字号，v 表示视口宽度。',
    ['clamp(16px, calc(12px + 1vw), 24px)', 1, 12],
    'Generated CSS is a starting value. Prefer relative text units where appropriate and test zoom, text scaling and overflow.|生成 CSS 仅供起步，适当时优先相对文字单位，并测试缩放、系统字号与溢出。',
  );
  const parseIP = (s) => {
    const a = String(s).trim().split('.');
    check(
      a.length === 4 && a.every((x) => /^(0|[1-9]\d{0,2})$/.test(x) && Number(x) <= 255),
      'Enter a four-octet IPv4 address without leading zeros.|请输入四段 IPv4 地址，不使用前导零。',
    );
    return a.reduce((v, x) => v * 256 + Number(x), 0);
  };
  const showIP = (x) => [24, 16, 8, 0].map((b) => Math.floor(x / 2 ** b) % 256).join('.');
  D(
    'ipv4-subnet',
    'IPv4 Subnet|IPv4 子网',
    'Find a network, broadcast address and conventional host range.|计算网络地址、广播地址与常规主机范围。',
    [
      text('ip', 'IPv4 address|IPv4 地址', '192.168.1.10'),
      i('p', 'Prefix length|前缀长度', 24, 0, 32),
    ],
    (v) => {
      const ip = parseIP(v.ip),
        size = 2 ** (32 - v.p),
        base = Math.floor(ip / size) * size,
        last = base + size - 1,
        hosts = v.p === 32 ? 1 : v.p === 31 ? 2 : size - 2;
      return [
        R('Network|网络地址', showIP(base) + '/' + v.p),
        R('Subnet mask|子网掩码', showIP(2 ** 32 - size)),
        R('Last address|最后地址', showIP(last)),
        R('Address count|地址总数', size),
        R('Conventional usable hosts|常规可用主机数', hosts),
        R('First host|首个主机', showIP(base + (v.p < 31 ? 1 : 0))),
        R('Last host|最后主机', showIP(last - (v.p < 31 ? 1 : 0))),
      ];
    },
    'Use B = 2^(32−p) and N = floor(A/B)×B. p is the prefix length, A is the integer address, B is the address block size, and N is the network address.|使用 B = 2^(32−p) 和 N = floor(A/B)×B。p 为前缀长度，A 为地址的整数值，B 为地址块大小，N 为网络地址。',
    ['192.168.1.0/24', '255.255.255.0', '192.168.1.255', 256, 254],
    'For /31 point-to-point both addresses are shown as hosts; /32 has one address. Does not determine routability or provider-reserved addresses.|/31 点对点两地址均计为主机，/32 为单地址；不判断可路由性或服务商保留地址。',
  );
  D(
    'ipv4-vlsm',
    'IPv4 VLSM Allocation|IPv4 VLSM 分配',
    'Allocate conventional host subnets largest-first inside one parent.|在一个父网内优先为最大需求分配常规主机子网。',
    [
      text('ip', 'Parent network address|父网络地址', '192.168.0.0'),
      i('p', 'Parent prefix|父前缀', 24, 0, 30),
      text('h', 'Required host counts|各子网所需主机数', '100,50'),
    ],
    (v) => {
      const ip = parseIP(v.ip),
        size = 2 ** (32 - v.p),
        start = Math.floor(ip / size) * size;
      check(
        ip === start,
        'Enter the parent network address, not a host address.|请输入父网络地址而非主机地址。',
      );
      const needs = nums(v.h);
      check(
        needs.length <= 32 && needs.every((x) => Number.isInteger(x) && x >= 1 && x <= 2 ** 32 - 2),
        'Use up to 32 positive integer host requirements.|最多 32 个正整数主机需求。',
      );
      const items = needs
        .map((h, k) => ({ h, k, size: 2 ** Math.ceil(Math.log2(h + 2)) }))
        .sort((a, b) => b.size - a.size || a.k - b.k);
      let next = start;
      const rows = [];
      for (const item of items) {
        check(
          next + item.size <= start + size,
          'The parent block is too small for these requirements.|父地址块不足以容纳这些需求。',
        );
        rows.push(
          R(
            'Request ' + (item.k + 1) + '|需求 ' + (item.k + 1),
            showIP(next) + '/' + (32 - Math.log2(item.size)),
          ),
        );
        next += item.size;
      }
      return [...rows, R('Unallocated addresses|未分配地址数', start + size - next)];
    },
    'For each requirement choose 2^ceil(log₂(hosts+2)); allocate largest blocks first|为每项主机需求选择大小为 2^ceil(log₂(hosts+2)) 的地址块，再从最大的块开始分配。',
    ['192.168.0.0/25', '192.168.0.128/26', 64],
    'Uses conventional network and broadcast reservations; /31 and /32 allocations are not used.|使用常规网络与广播地址保留规则，不采用 /31 或 /32 分配。',
  );
  D(
    'ipv6-subnet-count',
    'IPv6 Subnet Count|IPv6 子网数量',
    'Count equal-length IPv6 child prefixes using exact integers.|以精确整数计算等长 IPv6 子前缀数量。',
    [
      i('a', 'Parent prefix length|父前缀长度', 48, 0, 128),
      i('b', 'Child prefix length|子前缀长度', 64, 0, 128),
    ],
    (v) => {
      check(
        v.b >= v.a,
        'Child prefix must be at least as long as parent prefix.|子前缀长度不得短于父前缀。',
      );
      return [
        R('Child subnets|子网数量', (2n ** BigInt(v.b - v.a)).toString()),
        R('Addresses per child subnet|每子网地址数', (2n ** BigInt(128 - v.b)).toString()),
      ];
    },
    'Use S = 2^(c−p) and A = 2^(128−c). p is the parent prefix, c is the child prefix, S is the number of child subnets, and A is addresses per child subnet.|使用 S = 2^(c−p) 和 A = 2^(128−c)。p 为父前缀长度，c 为子前缀长度，S 为子网数量，A 为每个子网的地址数量。',
    ['65536', '18446744073709551616'],
  );
  D(
    'raid-capacity',
    'RAID Capacity|RAID 可用容量',
    'Estimate conventional RAID usable capacity with equal-size disks.|估算等容量磁盘的常规 RAID 可用容量。',
    [
      i('n', 'Disk count|磁盘数', 4, 1, 1000),
      p('s', 'Smallest disk capacity (TB, decimal)|最小磁盘容量（TB，十进制）', 4),
      select('r', 'RAID level|RAID 级别', '5', [
        ['0', 'RAID 0'],
        ['1', 'RAID 1'],
        ['5', 'RAID 5'],
        ['6', 'RAID 6'],
        ['10', 'RAID 10'],
      ]),
    ],
    (v) => {
      check(
        v.r === '0' ||
          (v.r === '1' && v.n >= 2) ||
          (v.r === '5' && v.n >= 3) ||
          (v.r === '6' && v.n >= 4) ||
          (v.r === '10' && v.n >= 4 && v.n % 2 === 0),
        'Disk count does not support this RAID level.|磁盘数量不支持该 RAID 级别。',
      );
      const count =
        v.r === '0'
          ? v.n
          : v.r === '1'
            ? 1
            : v.r === '5'
              ? v.n - 1
              : v.r === '6'
                ? v.n - 2
                : v.n / 2;
      return [
        R('Usable nominal capacity|标称可用容量', count * v.s, 'TB'),
        R('Raw nominal capacity|标称原始容量', v.n * v.s, 'TB'),
      ];
    },
    'With N equal-size disks of S TB, usable capacity is NS for RAID0, S for RAID1, (N−1)S for RAID5, (N−2)S for RAID6, and NS/2 for RAID10. Redundancy does not replace a backup.|N 个等容量磁盘、每个容量为 S TB 时，RAID0 可用容量为 NS，RAID1 为 S，RAID5 为 (N−1)S，RAID6 为 (N−2)S，RAID10 为 NS/2。冗余不能替代备份。',
    [12, 16],
    'Before filesystem, controller metadata, spare disks and reserved capacity. RAID is not a backup.|未计文件系统、控制器元数据、热备盘与保留空间；RAID 不是备份。',
  );
  D(
    'storage-retention',
    'Storage Retention Time|存储保留时长',
    'Compare usable storage with daily generated data and replicas.|比较可用存储与每日产生数据及副本数。',
    [
      n('s', 'Usable capacity (TB, decimal)|可用容量（TB，十进制）', 10),
      p('d', 'New data per day (GB)|每日新增数据（GB）', 100),
      i('r', 'Stored copies|保存副本数', 2, 1, 1000),
      n('e', 'Reserved capacity (%)|保留空间（%）', 20, 0, 99.999),
    ],
    (v) => [
      R('Estimated retention|估计保留时长', (v.s * 1000 * (1 - v.e / 100)) / (v.d * v.r), 'days'),
    ],
    'Use D = 1000T(1−r)/(gc). T is capacity in decimal TB, r is the reserve fraction, g is new GB per day, c is the copy count, and D is retention days.|使用 D = 1000T(1−r)/(gc)。T 为十进制 TB 容量，r 为预留比例，g 为每日新增 GB，c 为副本数量，D 为保留天数。',
    [40],
  );
  D(
    'backup-window-bandwidth',
    'Backup Window Bandwidth|备份窗口所需带宽',
    'Reverse a data volume and deadline into required link speed.|由数据量与备份时限反推所需链路速度。',
    [
      n('s', 'Changed source data (GB)|发生变化的源数据（GB）', 100),
      n('c', 'Transferred size after compression (%)|压缩后传输比例（%）', 50, 0, 100),
      p('t', 'Available window (hours)|可用窗口（小时）', 2),
      eff,
    ],
    (v) => [
      R(
        'Required nominal bandwidth|所需标称带宽',
        (((v.s * v.c) / 100) * 8000) / (v.t * 3600 * (v.e / 100)),
        'Mbps',
      ),
    ],
    'Use v = 8000Gc/(3600hη). G is source GB, c is the compressed-size fraction, h is available hours, η is efficiency, and v is required Mbps.|使用 v = 8000Gc/(3600hη)。G 为源数据 GB，c 为压缩后大小比例，h 为可用小时数，η 为效率比例，v 为所需 Mbps。',
    [625 / 9],
  );
  D(
    'random-password-entropy',
    'Random Password Entropy|随机密码熵',
    'Count uncertainty for independent uniformly random character choices.|计算字符独立等概率随机生成时的不确定性。',
    [
      i('l', 'Random character count|随机字符数', 12, 1, 1000),
      i('a', 'Alphabet size|字符集大小', 64, 2, 1000000),
    ],
    (v) => [R('Generation entropy|生成过程熵', v.l * Math.log2(v.a), 'bits')],
    'Use H = L×log₂(A). L is the independently sampled password length, A is the alphabet size, and H is entropy in bits.|使用 H = L×log₂(A)。L 为独立随机采样的密码长度，A 为字符集大小，H 为以位表示的熵。',
    [72],
    'Applies only to independent uniform random generation, not human-chosen passwords. Do not enter an actual password; no password field exists.|仅适用于独立均匀随机生成，不适用于人为选取密码。无需输入真实密码，本页没有密码输入框。',
  );
  D(
    'random-search-time',
    'Random Search Time Model|随机搜索耗时模型',
    'Estimate average exhaustive-search time from an assumed random search space.|由假定随机空间估计穷举平均耗时。',
    [
      n('b', 'Random search-space entropy (bits)|随机空间熵（bits）', 40, 1, 1000),
      p('r', 'Assumed guesses per second|假定每秒尝试次数', 1000000),
    ],
    (v) => [
      R('Expected time at entered rate|所填速率下平均用时', 2 ** (v.b - 1) / v.r, 'seconds'),
      R('Worst-case exhaustive time|最坏穷举用时', 2 ** v.b / v.r, 'seconds'),
    ],
    'Use t ≈ 2^(b−1)/g. b is search-space entropy in bits, g is assumed guesses per second, and t is expected search time in seconds.|使用 t ≈ 2^(b−1)/g。b 为搜索空间熵（位），g 为假设的每秒猜测次数，t 为期望搜索秒数。',
    [549755.813888, 1099511.627776],
    'Uniform search-space model only. Real password guessing, online rate limits, hashing cost, parallelism and compromise risk can differ greatly.|仅均匀搜索空间模型；实际密码猜测、在线限速、哈希成本、并行与泄露风险可能大不相同。',
  );
  D(
    'hash-collision-probability',
    'Hash Collision Probability|哈希碰撞概率',
    'Estimate birthday collisions in a uniformly random hash space.|估计均匀随机哈希空间中的生日碰撞。',
    [
      i('n', 'Generated independent hashes|独立生成哈希数', 1000000, 0, 1e15),
      i('b', 'Hash width (bits)|哈希位数', 64, 1, 1024),
    ],
    (v) => {
      check(
        Number.isSafeInteger(v.n) &&
          v.n >= 0 &&
          v.n <= 1e15 &&
          Number.isInteger(v.b) &&
          v.b >= 1 &&
          v.b <= 1024,
        'Enter a whole-number hash count within the shown range and a whole-number width from 1 to 1024 bits.|请输入所示范围内的整数哈希数及 1 到 1024 位的整数位宽。',
      );
      const inverseSpace = 2 ** -v.b;
      let logNoCollision;
      if (v.b <= 49 && v.n > 2 ** v.b) logNoCollision = -Infinity;
      else if (v.n <= 10000) {
        logNoCollision = 0;
        for (let k = 1; k < v.n; k++) logNoCollision += Math.log1p(-k * inverseSpace);
      } else logNoCollision = -((v.n * (v.n - 1)) / 2) * inverseSpace;
      return [
        R(
          'Approximate collision probability|近似碰撞概率',
          Math.max(0, -100 * Math.expm1(logNoCollision)),
          '%',
        ),
      ];
    },
    'n is the hash count and b is the width in bits. For n ≤ 10,000, P = 1 − ∏(1 − k/2^b), k = 0…n−1. Larger counts use P ≈ 1 − exp[−n(n−1)/(2×2^b)]. If n > 2^b, P = 1.|n 是哈希数，b 是位宽。n ≤ 10,000 时，P = 1 − ∏(1 − k/2^b)，k = 0…n−1；更多时使用 P ≈ 1 − exp[−n(n−1)/(2×2^b)]。若 n > 2^b，则 P = 1。',
    [0.0000027105026839742054],
    'Uniform independent hashes only. Up to 10,000 hashes use the no-collision product in log space; larger counts use the birthday approximation. More hashes than possible outputs guarantee a collision. This is not a cryptographic security proof or a model of adversarial collisions.|仅适用于均匀独立哈希。最多 10,000 个哈希时在对数空间计算无碰撞概率的连乘积；更多时采用生日近似。哈希数超过可能输出数时必然碰撞；本工具不是密码学安全证明，也不模拟对抗性碰撞。',
  );
  D(
    'sla-downtime',
    'SLA Downtime Budget|SLA 停机预算',
    'Translate availability percentage into allowed downtime.|将可用性比例换算为停机时间预算。',
    [
      n('a', 'Availability target (%)|可用性目标（%）', 99.9, 0, 100),
      p('d', 'Days in reporting period|统计期间天数', 30),
    ],
    (v) => [
      R('Allowed downtime|允许停机时间', v.d * 24 * 60 * (1 - v.a / 100), 'minutes'),
      R('Allowed downtime in seconds|允许停机秒数', v.d * 86400 * (1 - v.a / 100), 'seconds'),
    ],
    'Use d = T(1−a). T is the reporting-period duration, a is availability as a fraction, and d is allowed downtime in the same time unit.|使用 d = T(1−a)。T 为统计周期时长，a 为可用率比例，d 为相同时间单位下允许的停机时长。',
    [43.2, 2592],
    'Arithmetic budget only. Contract exclusions, maintenance windows and measurement methods are not applied.|仅计算时间预算，不应用合同排除项、维护窗口或测量方法。',
  );
  D(
    'component-availability',
    'Component Availability|组件组合可用性',
    'Combine independent component availabilities in series or parallel.|按串联或并联组合独立组件可用率。',
    [
      text('x', 'Component availabilities (%)|各组件可用率（%）', '99,99'),
      select('m', 'Dependency layout|依赖方式', 'series', [
        ['series', 'All must work|全部必须工作'],
        ['parallel', 'At least one must work|至少一个工作'],
      ]),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x >= 0 && x <= 100),
        'Availability must lie between 0% and 100%.|可用率应在 0% 到 100% 之间。',
      );
      return [
        R(
          'Combined availability|组合可用率',
          100 *
            (v.m === 'series'
              ? a.reduce((p, x) => (p * x) / 100, 1)
              : 1 - a.reduce((p, x) => p * (1 - x / 100), 1)),
          '%',
        ),
      ];
    },
    'For a series system use A = ∏Aᵢ. For ideal parallel redundancy use A = 1−∏(1−Aᵢ). Each Aᵢ is an independent component availability as a fraction.|串联系统使用 A = ∏Aᵢ，理想并联冗余使用 A = 1−∏(1−Aᵢ)。每个 Aᵢ 为独立组件的可用率比例。',
    [98.01],
    'Assumes independence and ideal failover. Shared power, software, region and recovery dependencies can invalidate multiplication.|假设独立且切换理想；共享电源、软件、地域与恢复依赖可能使相乘模型失效。',
  );
  D(
    'latency-budget',
    'Sequential Latency Budget|串行延迟预算',
    'Add sequential stages and compare them with a target.|合计串行阶段延迟并与目标比较。',
    [
      text('x', 'Sequential stage times (ms)|各串行阶段用时（ms）', '20,50,30'),
      n('t', 'Target end-to-end latency (ms)|端到端目标延迟（ms）', 200),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x >= 0),
        'Stage times cannot be negative.|各阶段用时不能为负。',
      );
      const t = sum(a);
      return [
        R('Total serial latency|串行总延迟', t, 'ms'),
        R('Remaining budget|剩余预算', v.t - t, 'ms'),
        R('Largest stage|最大阶段', Math.max(...a), 'ms'),
      ];
    },
    'Use T = Σtᵢ and R = B−T. Each tᵢ is a sequential stage duration, B is the target, T is total latency, and R is the remaining budget.|使用 T = Σtᵢ 和 R = B−T。每个 tᵢ 为顺序阶段耗时，B 为目标时限，T 为总延迟，R 为剩余预算。',
    [100, 100, 50],
    'For sequential work only. Concurrent branches require a dependency graph; percentile latencies cannot generally be added as if they were means.|仅适用于串行工作；并发分支需依赖图，分位数延迟通常不能像均值一样直接相加。',
  );
  D(
    'littles-law',
    'Little’s Law Capacity|利特尔定律容量',
    'Relate stable throughput, time in system and work in progress.|联系稳定系统的吞吐率、停留时间与在途工作量。',
    [
      n('r', 'Average arrivals per second|平均每秒到达数', 100),
      n('t', 'Average time in system (seconds)|平均系统停留时间（秒）', 0.2),
    ],
    (v) => [R('Average concurrent work|平均在途工作量', v.r * v.t)],
    'L=λW',
    [20],
    'Requires stable long-run averages and consistent system boundaries. This is not a maximum concurrency or queueing-tail guarantee.|要求稳定长期平均与一致系统边界，不保证最大并发或排队尾延迟。',
  );
  D(
    'server-hosting-cost',
    'Server Hosting Cost|服务器托管费用',
    'Combine instance hours with traffic and fixed charges.|合并实例小时、流量及固定费用。',
    [
      i('n', 'Instance count|实例数', 2, 0, 100000),
      n('h', 'Billable hours per instance|每实例计费小时', 720),
      n('r', 'Price per instance-hour|每实例小时价格', 0.05),
      n('t', 'Billable traffic (GB)|计费流量（GB）', 100),
      n('p', 'Traffic price per GB|每 GB 流量价格', 0.1),
      n('f', 'Other fixed charges|其他固定费用', 5),
    ],
    (v) => [
      R('Estimated period cost|估计期间费用', v.n * v.h * v.r + v.t * v.p + v.f),
      R('Compute portion|计算实例费用', v.n * v.h * v.r),
      R('Traffic portion|流量费用', v.t * v.p),
    ],
    'Use C = Nhr+Gp+F. N is instance count, h is hours per instance, r is hourly price, G is billable traffic GB, p is price per GB, and F is fixed charges.|使用 C = Nhr+Gp+F。N 为实例数，h 为每个实例计费小时数，r 为小时单价，G 为计费流量 GB，p 为每 GB 单价，F 为固定费用。',
    [87, 72, 10],
    'All prices entered manually. Excludes taxes, tiered discounts, minimum billing and services not listed.|所有价格手动填写，不含税费、阶梯折扣、最低计费与未列服务。',
  );
  D(
    'cloud-storage-cost',
    'Cloud Storage and Requests Cost|云存储与请求费用',
    'Separate storage, request and egress cost assumptions.|分开计算存储、请求与出站流量成本。',
    [
      n('s', 'Average stored GB-months|平均存储 GB·月', 1000),
      n('p', 'Price per GB-month|每 GB·月价格', 0.02),
      n('r', 'Request count|请求次数', 1000000),
      n('q', 'Price per million requests|每百万请求价格', 0.4),
      n('e', 'Billable egress (GB)|计费出站流量（GB）', 100),
      n('f', 'Price per egress GB|每 GB 出站价格', 0.1),
    ],
    (v) => [
      R('Estimated monthly cost|估计月费用', v.s * v.p + (v.r / 1e6) * v.q + v.e * v.f),
      R('Storage portion|存储费用', v.s * v.p),
      R('Requests portion|请求费用', (v.r / 1e6) * v.q),
      R('Egress portion|出站费用', v.e * v.f),
    ],
    'Use C = Gr+Nq/10^6+Ep. G is stored GB-months, r is storage price, N is requests, q is price per million requests, E is egress GB, and p is egress price per GB.|使用 C = Gr+Nq/10^6+Ep。G 为存储 GB 月，r 为存储单价，N 为请求数，q 为每百万请求单价，E 为出站 GB，p 为每 GB 出站单价。',
    [30.4, 20, 0.4, 10],
  );
  D(
    'context-token-budget',
    'Context Token Budget|上下文 Token 预算',
    'Reserve output space and calculate remaining input capacity.|预留输出空间并计算剩余输入容量。',
    [
      i('w', 'Model context window (tokens)|模型上下文窗口（tokens）', 32000, 1, 100000000),
      i('s', 'System and tool tokens|系统与工具 tokens', 2000, 0, 100000000),
      i('h', 'Existing history tokens|已有历史 tokens', 10000, 0, 100000000),
      i('r', 'Reserved output tokens|预留输出 tokens', 4000, 0, 100000000),
      i('p', 'Tokens per new document chunk|每个新文档块 tokens', 2000, 1, 100000000),
    ],
    (v) => {
      const available = v.w - v.s - v.h - v.r;
      return [
        R('Remaining input budget|剩余输入预算', available, 'tokens'),
        R('Whole new chunks that fit|可容纳完整新块数', Math.max(0, Math.floor(available / v.p))),
        R('Over budget|超出预算', Math.max(0, -available), 'tokens'),
      ];
    },
    'Use A = W−S−H−O. W is context capacity, S is system and tool tokens, H is existing history, O is reserved output, and A is remaining input capacity. All terms are token counts.|使用 A = W−S−H−O。W 为上下文容量，S 为系统及工具词元数，H 为已有历史词元数，O 为预留输出词元数，A 为剩余输入容量。各项单位均为词元。',
    [16000, 8, 0],
    'Use the actual tokenizer and provider limits. Context windows, output caps, hidden overhead and prices are not fetched or verified here.|请使用实际分词器与提供商限制；此处不获取或核实上下文窗口、输出上限、隐藏开销或价格。',
  );
  D(
    'api-throughput-limit',
    'API Throughput Limit|API 吞吐限制',
    'Compare a request-rate quota with concurrency and service time.|比较请求速率配额与并发及服务时长限制。',
    [
      p('r', 'Requests allowed per minute|每分钟允许请求数', 600),
      i('c', 'Concurrent request slots|并发请求槽位', 5, 1, 100000),
      p('t', 'Average service time (seconds)|平均服务时间（秒）', 1),
      i('n', 'Requests to process|待处理请求数', 1000, 1, 1000000000),
    ],
    (v) => {
      const q = Math.min(v.r / 60, v.c / v.t);
      return [
        R('Steady-state throughput ceiling|稳态吞吐上限', q, 'requests/s'),
        R('Ideal steady-flow batch duration|理想稳态流批次用时', v.n / q, 'seconds'),
        R('Concurrency-limited throughput|并发限制吞吐', v.c / v.t, 'requests/s'),
      ];
    },
    'Use q ≤ min(R/60,c/s) and t ≈ N/q. R is requests allowed per minute, c is concurrent slots, s is average service seconds, N is batch requests, q is requests per second, and t is ideal batch seconds.|使用 q ≤ min(R/60,c/s) 和 t ≈ N/q。R 为每分钟请求额度，c 为并发槽位，s 为平均服务秒数，N 为批次请求数，q 为每秒请求数，t 为理想批次秒数。',
    [5, 200, 5],
    'Steady-state upper bound, not a scheduler. Burst windows, retries, token quotas, queue delays and provider-specific enforcement are excluded.|稳态上界，不是调度器；不含突发窗口、重试、token 配额、排队及提供商执行规则。',
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, annuity, bisect } = CMModels;
  const note =
    'Educational estimate using your assumptions; no live rates, tax rules or investment recommendations. Returns can be negative and are not guaranteed.|按自填假设进行教育性估算，不提供实时利率、税法或投资建议；收益可能为负，且不保证。';
  const D = (s, name, purpose, f, calc, formula, e, extra = '') =>
    add(
      s,
      name,
      'Finance',
      purpose,
      f,
      calc,
      formula,
      e,
      note
        .split('|')
        .map((part, k) => part + (extra ? ' ' + (extra.split('|')[k] || extra.split('|')[0]) : ''))
        .join('|'),
    );
  const cash = (id, label, value) => n(id, label, value),
    rate = (id, label, value) => n(id, label, value, -99, 1000),
    years = i('t', 'Years|年数', 5, 1, 1000),
    periods = i('m', 'Compounding periods per year|每年复利次数', 12, 1, 366);
  const stream = text(
    'c',
    'Cash flows at equally spaced period ends, starting at time 0|等间隔现金流（从时点 0 开始）',
    '-1000,400,400,400',
  );
  const npv = (a, r) => sum(a.map((c, k) => c / (1 + r) ** k));
  D(
    'effective-annual-rate',
    'Effective Annual Rate|有效年利率',
    'Convert a nominal annual rate and compounding frequency into an effective rate.|将名义年利率和复利频率换算为有效年利率。',
    [rate('r', 'Nominal annual rate (%)|名义年利率（%）', 12), periods],
    (v) => [
      R(
        'Effective annual rate|有效年利率',
        100 * Math.expm1(v.m * Math.log1p(v.r / 100 / v.m)),
        '%',
      ),
    ],
    'Use EAR = (1+j/m)^m−1. j is the nominal annual rate as a fraction, m is compounding periods per year, and EAR is the effective annual rate as a fraction.|使用 EAR = (1+j/m)^m−1。j 为名义年利率比例，m 为每年复利次数，EAR 为有效年利率比例。',
    [12.68250301319698],
  );
  D(
    'nominal-interest-rate',
    'Nominal Interest Rate|名义年利率换算',
    'Recover a nominal rate from an effective annual rate.|由有效年利率反推名义年利率。',
    [rate('r', 'Effective annual rate (%)|有效年利率（%）', 12.68250301319698), periods],
    (v) => [
      R('Nominal annual rate|名义年利率', 100 * v.m * Math.expm1(Math.log1p(v.r / 100) / v.m), '%'),
    ],
    'Use j = m[(1+EAR)^(1/m)−1]. EAR is the effective annual rate as a fraction, m is compounding periods per year, and j is the equivalent nominal annual rate as a fraction.|使用 j = m[(1+EAR)^(1/m)−1]。EAR 为有效年利率比例，m 为每年复利次数，j 为等效名义年利率比例。',
    [12],
  );
  D(
    'continuous-compounding',
    'Continuous Compounding|连续复利',
    'Project a lump sum with continuous compounding.|用连续复利计算一笔本金的终值。',
    [
      cash('a', 'Principal|本金', 1000),
      rate('r', 'Continuous annual rate (%)|连续年利率（%）', 5),
      years,
    ],
    (v) => {
      const f = v.a * Math.exp((v.r / 100) * v.t);
      return [R('Future balance|未来余额', f), R('Growth|增长额', f - v.a)];
    },
    'FV=Peʳᵗ',
    [1284.0254166877414, 284.0254166877414],
  );
  D(
    'annuity-present-value',
    'Annuity Present Value|年金现值',
    'Discount equal end-of-period payments to today.|将等额期末付款折现至现在。',
    [
      cash('a', 'Payment each period|每期金额', 100),
      rate('r', 'Rate per period (%)|每期利率（%）', 5),
      i('t', 'Number of payments|付款期数', 10, 1, 10000),
    ],
    (v) => [
      R('Present value|现值', v.a * annuity(v.r / 100, v.t)),
      R('Undiscounted payments|未折现总额', v.a * v.t),
    ],
    'PV=A[1−(1+r)⁻ⁿ]/r; PV=An at r=0',
    [772.1734929184817, 1000],
  );
  D(
    'annuity-future-value',
    'Annuity Future Value|年金终值',
    'Accumulate equal end-of-period deposits.|计算等额期末存入款项的终值。',
    [
      cash('a', 'Deposit each period|每期存入', 100),
      rate('r', 'Rate per period (%)|每期利率（%）', 5),
      i('t', 'Number of deposits|存入期数', 10, 1, 10000),
    ],
    (v) => {
      const r = v.r / 100,
        q = r === 0 ? v.t : Math.expm1(v.t * Math.log1p(r)) / r;
      return [R('Future value|终值', v.a * q), R('Total deposited|累计存入', v.a * v.t)];
    },
    'FV=A[(1+r)ⁿ−1]/r; FV=An at r=0',
    [1257.789253554884, 1000],
  );
  D(
    'growing-annuity',
    'Growing Annuity Present Value|增长年金现值',
    'Value a finite sequence of growing end-of-period payments.|计算有限期、逐期增长付款的现值。',
    [
      cash('a', 'First payment|首期付款', 100),
      rate('r', 'Discount rate per period (%)|每期折现率（%）', 5),
      rate('g', 'Payment growth per period (%)|每期付款增长率（%）', 2),
      i('t', 'Payments|付款期数', 10, 1, 10000),
    ],
    (v) => {
      const r = v.r / 100,
        g = v.g / 100,
        q = (1 + g) / (1 + r);
      return [
        R(
          'Present value|现值',
          (v.a / (1 + r)) *
            (Math.abs(q - 1) < 1e-12 ? v.t : -Math.expm1(v.t * Math.log(q)) / (1 - q)),
        ),
      ];
    },
    'PV=A₁[1−((1+g)/(1+r))ⁿ]/(r−g)',
    [838.810565252133],
  );
  D(
    'perpetuity',
    'Perpetuity Present Value|永续年金现值',
    'Value a level payment continuing indefinitely.|计算无限期等额付款的理论现值。',
    [
      cash('a', 'Payment per period|每期付款', 100),
      p('r', 'Discount rate per period (%)|每期折现率（%）', 5),
    ],
    (v) => [R('Present value|现值', v.a / (v.r / 100))],
    'PV=A/r',
    [2000],
  );
  D(
    'growing-perpetuity',
    'Growing Perpetuity|增长永续年金',
    'Value perpetual payments growing below the discount rate.|计算增长率低于折现率的永续付款现值。',
    [
      cash('a', 'Next payment|下一期付款', 100),
      p('r', 'Discount rate (%)|折现率（%）', 8),
      rate('g', 'Payment growth (%)|付款增长率（%）', 3),
    ],
    (v) => {
      check(v.r > v.g, 'Discount rate must exceed growth rate.|折现率必须大于增长率。');
      return [R('Present value|现值', v.a / ((v.r - v.g) / 100))];
    },
    'PV=A₁/(r−g)',
    [2000],
  );
  D(
    'net-present-value',
    'Net Present Value|净现值 NPV',
    'Discount a complete dated-by-period cash-flow series.|折现包含初始投入的等间隔现金流。',
    [stream, rate('r', 'Discount rate per period (%)|每期折现率（%）', 10)],
    (v) => [R('Net present value|净现值', npv(nums(v.c), v.r / 100))],
    'Use NPV = Σ Cₜ/(1+r)^t, including the cash flow at time zero. Cₜ is cash flow at period t and r is the discount rate per period as a fraction. Cash flows use equal time intervals.|使用 NPV = Σ Cₜ/(1+r)^t，包含零时点现金流。Cₜ 为第 t 期现金流，r 为每期折现率比例；各期时间间隔相等。',
    [-5.25920360631115],
  );
  D(
    'internal-rate-of-return',
    'Internal Rate of Return|内部收益率 IRR',
    'Solve the return of a conventional investment cash-flow sequence.|求常规投资现金流的内部收益率。',
    [stream],
    (v) => {
      const a = nums(v.c);
      check(
        a.length >= 2 &&
          a[0] < 0 &&
          a.slice(1).every((x) => x >= 0) &&
          a.slice(1).some((x) => x > 0),
        'Use an initial outflow followed only by nonnegative inflows; this avoids multiple-IRR ambiguity.|使用初始支出及后续非负收入，以避免多解 IRR 歧义。',
      );
      return [R('IRR per period|每期 IRR', 100 * bisect((r) => npv(a, r), -0.9999, 1000), '%')];
    },
    'Find a supported r satisfying Σ Cₜ/(1+r)^t = 0. Cₜ is the equally spaced cash flow at period t, starting at time zero. r is the return per cash-flow period; a cash-flow series can have no root or multiple roots.|在支持区间内求满足 Σ Cₜ/(1+r)^t = 0 的 r。Cₜ 为从零时点开始、等间隔的第 t 期现金流；r 为每期收益率比例。现金流序列可能无解或有多个解。',
    [9.7010257403],
  );
  D(
    'modified-internal-rate',
    'Modified Internal Rate of Return|修正内部收益率 MIRR',
    'Separate financing and reinvestment assumptions for cash flows.|分别设置融资率与再投资率计算现金流收益。',
    [
      stream,
      rate('f', 'Financing rate per period (%)|每期融资率（%）', 5),
      rate('r', 'Reinvestment rate per period (%)|每期再投资率（%）', 8),
    ],
    (v) => {
      const a = nums(v.c),
        t = a.length - 1;
      check(
        t > 0 && a.some((x) => x < 0) && a.some((x) => x > 0),
        'Need at least two periods including inflows and outflows.|至少两个时点，且同时包含收入和支出。',
      );
      const pv = -sum(a.map((x, k) => Math.min(x, 0) / (1 + v.f / 100) ** k)),
        fv = sum(a.map((x, k) => Math.max(x, 0) * (1 + v.r / 100) ** (t - k)));
      return [R('MIRR per period|每期 MIRR', 100 * ((fv / pv) ** (1 / t) - 1), '%')];
    },
    'Use MIRR = (F/abs(P))^(1/n)−1. F is positive cash flows accumulated to the final period at the reinvestment rate, P is negative cash flows discounted to time zero at the financing rate, and n is the number of intervals. abs means absolute value.|使用 MIRR = (F/abs(P))^(1/n)−1。F 为正现金流按再投资利率累计至末期的终值，P 为负现金流按融资利率折现至零时点的现值，n 为期间数；abs 表示绝对值。',
    [9.098975834465172],
  );
  D(
    'discounted-payback',
    'Discounted Payback Period|折现回收期',
    'Find when discounted inflows recover an initial investment.|计算折现后收入何时收回初始投入。',
    [stream, rate('r', 'Discount rate per period (%)|每期折现率（%）', 0)],
    (v) => {
      const a = nums(v.c);
      check(
        a[0] < 0 && a.slice(1).every((x) => x >= 0),
        'Use an initial outflow followed by nonnegative inflows.|使用初始支出及后续非负收入。',
      );
      let total = a[0],
        answer = null;
      for (let k = 1; k < a.length; k++) {
        const q = a[k] / (1 + v.r / 100) ** k;
        if (total < 0 && total + q >= 0) answer = k - 1 - total / q;
        total += q;
      }
      return [
        R(
          'Discounted payback|折现回收期',
          answer === null ? 'Not recovered in entered horizon|所填期限内未回收' : answer,
          'periods',
        ),
        R('Discounted net balance|折现净余额', total),
      ];
    },
    'Accumulate discounted inflows; interpolate within the recovery period|累加折现后的现金流入；在回收投资的期间内进行插值。',
    [2.5, 200],
  );
  D(
    'profitability-index',
    'Profitability Index|获利指数',
    'Compare discounted future inflows against an initial cost.|比较未来收入现值与初始成本。',
    [
      p('a', 'Initial cost|初始成本', 1000),
      text('c', 'Future inflows, period 1 onward|未来收入（从第 1 期开始）', '400,400,400'),
      rate('r', 'Discount rate per period (%)|每期折现率（%）', 0),
    ],
    (v) => {
      const a = nums(v.c);
      check(
        a.every((x) => x >= 0),
        'Future inflows must be nonnegative.|未来收入应非负。',
      );
      const q = sum(a.map((x, k) => x / (1 + v.r / 100) ** (k + 1)));
      return [R('Profitability index|获利指数', q / v.a), R('Net present value|净现值', q - v.a)];
    },
    'Use PI = Σ Cₜ/(1+r)^t / I for periods after the initial investment. Cₜ is a future inflow, r is the discount rate per period as a fraction, and I is the initial cost. The ratio compares discounted inflows with that cost.|对初始投资之后的各期使用 PI = Σ Cₜ/(1+r)^t / I。Cₜ 为未来流入，r 为每期折现率比例，I 为初始成本；该比率比较折现后的流入与初始成本。',
    [1.2, 200],
  );
  D(
    'equivalent-annual-cost',
    'Equivalent Annual Cost|等额年成本',
    'Annualize a purchase and recurring costs at a chosen discount rate.|按折现率将购置与维护费用换算为等额年成本。',
    [
      cash('a', 'Initial purchase|初始购置成本', 1000),
      cash('c', 'Annual operating cost|每年运行成本', 100),
      cash('s', 'End-of-life resale|期末残值', 0),
      rate('r', 'Annual discount rate (%)|年折现率（%）', 0),
      years,
    ],
    (v) => {
      const r = v.r / 100,
        pv = v.a - v.s / (1 + r) ** v.t;
      return [R('Equivalent annual cost|等额年成本', pv / annuity(r, v.t) + v.c)];
    },
    'Use EAC = [P−S/(1+r)^n]/a(r,n)+C. P is purchase cost, S is final resale value, C is annual operating cost, r is the annual discount fraction, and n is years. a(r,n) is the sum of the end-of-year discount factors.|使用 EAC = [P−S/(1+r)^n]/a(r,n)+C。P 为购置成本，S 为期末转售额，C 为年度运营成本，r 为年折现率比例，n 为年数；a(r,n) 为各年年末折现因子之和。',
    [300],
  );
  const bondFields = [
    p('f', 'Face value|面值', 1000),
    n('c', 'Annual coupon rate (%)|年票息率（%）', 5, 0, 100),
    n('y', 'Nominal annual yield (%)|名义年收益率（%）', 5, 0, 100),
    i('t', 'Whole years to maturity|到期整年数', 5, 1, 100),
    i('m', 'Coupon payments per year|每年付息次数', 2, 1, 12),
  ];
  const bond = (v, y = v.y / 100) => {
    const r = y / v.m,
      t = v.t * v.m,
      c = (v.f * v.c) / 100 / v.m;
    return c * annuity(r, t) + v.f / (1 + r) ** t;
  };
  D(
    'bond-price',
    'Fixed Coupon Bond Price|固定票息债券价格',
    'Discount fixed coupons and principal on coupon dates.|在付息日折现固定票息与本金。',
    bondFields,
    (v) => [
      R('Theoretical clean price|理论净价', bond(v)),
      R('Price per 100 face value|每百元面值价格', (100 * bond(v)) / v.f),
    ],
    'P=ΣC/(1+y/m)ᵏ+F/(1+y/m)ᴺ',
    [1000, 100],
    'Assumes settlement on a coupon date, no default, no call option and no accrued interest.|假设在付息日结算，无违约、赎回权及应计利息。',
  );
  D(
    'bond-yield',
    'Bond Yield to Maturity|债券到期收益率',
    'Solve a fixed-coupon bond yield from its coupon-date price.|根据付息日价格反求固定票息债券到期收益率。',
    [...bondFields.filter((f) => f.id !== 'y'), p('p', 'Market price|市场价格', 1000)],
    (v) => [
      R(
        'Nominal annual yield|名义年到期收益率',
        100 * bisect((y) => bond(v, y) - v.p, -0.99, 100),
        '%',
      ),
    ],
    'Solve P = Σ C/(1+y/m)^k + F/(1+y/m)^N for y. P is market price, F is face value, C is each coupon payment, m is payments per year, and N is total coupon periods. y is the nominal annual yield fraction.|求使 P = Σ C/(1+y/m)^k + F/(1+y/m)^N 成立的 y。P 为市场价格，F 为面值，C 为每期票息，m 为每年付息次数，N 为总付息期数；y 为名义年到期收益率比例。',
    [5],
    'Uses equal coupon periods and settlement on a coupon date; excludes default and accrued interest.|使用等长付息期，假设在付息日结算；不含违约与应计利息。',
  );
  D(
    'current-bond-yield',
    'Bond Current Yield|债券当期收益率',
    'Compare annual coupon income with the bond purchase price.|比较债券每年票息收入与买入价。',
    [cash('c', 'Annual coupon income|年票息收入', 50), p('p', 'Purchase price|买入价', 1000)],
    (v) => [R('Current yield|当期收益率', (100 * v.c) / v.p, '%')],
    'Use Y = C/P. C is annual coupon income, P is the purchase price, and Y is current yield as a fraction. This ratio excludes capital gains and time to maturity.|使用 Y = C/P。C 为年度票息收入，P 为购入价格，Y 为当期收益率比例；该比率不含资本损益与到期时间的影响。',
    [5],
    'This omits capital gains, reinvestment and time to maturity.|不含资本利得、再投资和到期时间。',
  );
  D(
    'bond-duration',
    'Bond Duration|债券久期',
    'Estimate interest-rate sensitivity using discounted cash-flow timing.|用折现现金流时间估计利率敏感度。',
    bondFields,
    (v) => {
      const r = v.y / 100 / v.m,
        t = v.t * v.m,
        c = (v.f * v.c) / 100 / v.m;
      let s = 0;
      for (let k = 1; k <= t; k++) s += ((k / v.m) * (c + (k === t ? v.f : 0))) / (1 + r) ** k;
      const d = s / bond(v);
      return [
        R('Macaulay duration|麦考利久期', d, 'years'),
        R('Modified duration|修正久期', d / (1 + r), 'years'),
      ];
    },
    'Use PVₖ = CFₖ/(1+y/m)^k, tₖ = k/m, D = Σ(tₖPVₖ)/P and Dₘ = D/(1+y/m). CFₖ is the payment in coupon period k, including principal when due; m is payments per year, y is the annual yield fraction, and P is the sum of discounted payments. Both durations are in years.|使用 PVₖ = CFₖ/(1+y/m)^k、tₖ = k/m、D = Σ(tₖPVₖ)/P 和 Dₘ = D/(1+y/m)。CFₖ 为第 k 个付息期的款项，包含该期到期应付的本金；m 为每年付息次数，y 为年收益率比例，P 为各笔款项折现后的总价。两种久期均以年表示。',
    [4.485432762, 4.376031963],
    'Local sensitivity estimate for small yield changes, with no embedded options.|适用于小幅利率变化且无内嵌期权的局部敏感度估计。',
  );
  D(
    'bond-convexity',
    'Bond Convexity|债券凸性',
    'Measure curvature in a fixed bond’s price-yield relationship.|衡量固定票息债券价格与收益率关系的曲率。',
    bondFields,
    (v) => {
      const r = v.y / 100 / v.m,
        t = v.t * v.m,
        c = (v.f * v.c) / 100 / v.m;
      let q = 0;
      for (let k = 1; k <= t; k++)
        q += (k * (k + 1) * (c + (k === t ? v.f : 0))) / (1 + r) ** (k + 2);
      return [R('Annualized convexity|年化凸性', q / (bond(v) * v.m * v.m))];
    },
    'Use K = Σ[k(k+1)CFₖ/(1+y/m)^(k+2)]/(Pm²). CFₖ is the payment in coupon period k, P is bond price, y is the nominal annual yield fraction, and m is payments per year. K estimates local price curvature with respect to yield.|使用 K = Σ[k(k+1)CFₖ/(1+y/m)^(k+2)]/(Pm²)。CFₖ 为第 k 个付息期的付款额，P 为债券价格，y 为名义年收益率比例，m 为每年付息次数；K 估计债券价格随收益率变化的局部曲率。',
    [22.612322],
    'Assumes equal coupon periods and no embedded options.|假设付息期相等，且无内嵌期权。',
  );
  D(
    'dividend-discount',
    'Dividend Discount Value|股利折现估值',
    'Model constant-growth dividends below a required return.|在必要回报率高于增长率时估算股利折现价值。',
    [
      cash('d', 'Next annual dividend|下一年股利', 3),
      p('r', 'Required annual return (%)|必要年回报率（%）', 8),
      rate('g', 'Annual dividend growth (%)|年股利增长率（%）', 2),
    ],
    (v) => {
      check(
        v.r > v.g,
        'Required return must exceed dividend growth.|必要回报率必须高于股利增长率。',
      );
      return [R('Model value per share|每股模型价值', v.d / ((v.r - v.g) / 100))];
    },
    'P=D₁/(r−g)',
    [50],
  );
  D(
    'dividend-yield',
    'Dividend Yield|股息率',
    'Compare annual dividends with the current share price.|比较年度股息与当前股价。',
    [cash('d', 'Annual dividend per share|每股年度股息', 3), p('p', 'Share price|股价', 60)],
    (v) => [R('Dividend yield|股息率', (100 * v.d) / v.p, '%')],
    'Use Y = D/P. D is annual dividend per share, P is share price, and Y is dividend yield as a fraction. Price changes and dividend reinvestment are excluded.|使用 Y = D/P。D 为每股年度股息，P 为股价，Y 为股息收益率比例；不含股价变动与股息再投资。',
    [5],
  );
  D(
    'earnings-per-share',
    'Earnings per Share|每股收益 EPS',
    'Allocate earnings available to common shareholders.|将归属于普通股股东的收益分摊至股份。',
    [
      u('a', 'Net earnings|净收益', 1000000),
      cash('d', 'Preferred dividends|优先股股息', 100000),
      p('s', 'Weighted average common shares|加权平均普通股数', 300000),
    ],
    (v) => [R('Basic earnings per share|基本每股收益', (v.a - v.d) / v.s)],
    'Use EPS = (E−D)/S. E is net earnings, D is preferred dividends, and S is weighted average common shares. This is basic earnings per share.|使用 EPS = (E−D)/S。E 为净利润，D 为优先股股息，S 为普通股加权平均股数；结果为基本每股收益。',
    [3],
    'Basic EPS only; diluted shares, reporting standards and accounting adjustments are not modeled.|仅为基本 EPS；不模拟稀释股份、会计准则及调整项。',
  );
  D(
    'price-earnings-ratio',
    'Price to Earnings Ratio|市盈率',
    'Compare share price with positive earnings per share.|比较股价与正的每股收益。',
    [cash('p', 'Share price|股价', 60), p('e', 'Annual earnings per share|年每股收益', 3)],
    (v) => [
      R('Price / earnings|市盈率', v.p / v.e),
      R(
        'Earnings yield|盈利收益率',
        v.p > 0 ? (100 * v.e) / v.p : 'Undefined at zero price|股价为零时无定义',
        '%',
      ),
    ],
    'Use PE = P/E. P is share price and E is annual earnings per share. The ratio compares share price with the entered annual earnings.|使用 PE = P/E。P 为股价，E 为年度每股收益；该比率比较股价与所填年度每股收益。',
    [20, 5],
  );
  D(
    'price-book-ratio',
    'Price to Book Ratio|市净率',
    'Compare share price with positive book value per share.|比较股价与正的每股账面价值。',
    [cash('p', 'Share price|股价', 40), p('b', 'Book value per share|每股账面价值', 20)],
    (v) => [R('Price / book|市净率', v.p / v.b)],
    'Use PB = P/B. P is share price and B is book value per share. The ratio compares share price with the entered book value.|使用 PB = P/B。P 为股价，B 为每股账面价值；该比率比较股价与所填每股账面价值。',
    [2],
  );
  D(
    'capm',
    'Capital Asset Pricing Model|资本资产定价模型',
    'Estimate a required return from market beta and a risk premium.|按市场贝塔与风险溢价估计必要回报率。',
    [
      rate('f', 'Risk-free rate (%)|无风险利率（%）', 3),
      rate('m', 'Expected market return (%)|预期市场回报率（%）', 8),
      u('b', 'Market beta|市场贝塔', 1.2),
    ],
    (v) => [
      R('Model required return|模型必要回报率', v.f + v.b * (v.m - v.f), '%'),
      R('Market risk premium|市场风险溢价', v.m - v.f, 'percentage points'),
    ],
    'E[R]=Rf+β(E[Rm]−Rf)',
    [9, 5],
  );
  D(
    'weighted-average-cost-capital',
    'Weighted Average Cost of Capital|加权平均资本成本',
    'Blend debt and equity financing costs with an entered tax rate.|按自填税率合并债务与权益融资成本。',
    [
      cash('e', 'Equity market value|权益市场价值', 600),
      cash('d', 'Debt market value|债务市场价值', 400),
      rate('r', 'Equity cost (%)|权益成本（%）', 10),
      n('c', 'Debt cost (%)|债务成本（%）', 5, 0, 100),
      n('t', 'Effective tax rate (%)|有效税率（%）', 25, 0, 100),
    ],
    (v) => {
      check(v.e + v.d > 0, 'Total capital must be positive.|总资本应大于零。');
      return [
        R('WACC|加权平均资本成本', (v.e * v.r + v.d * v.c * (1 - v.t / 100)) / (v.e + v.d), '%'),
      ];
    },
    'Use WACC = E×rₑ/(D+E)+D×r_d×(1−τ)/(D+E). E and D are equity and debt market values. rₑ, r_d and τ are equity cost, debt cost and effective tax rate, each as a fraction.|使用 WACC = E×rₑ/(D+E)+D×r_d×(1−τ)/(D+E)。E、D 分别为股权和债务市场价值；rₑ、r_d、τ 分别为股权成本、债务成本和有效税率比例。',
    [7.5],
  );
  D(
    'portfolio-expected-return',
    'Portfolio Expected Return|投资组合预期回报',
    'Weight asset-return assumptions by portfolio shares.|按组合占比加权各资产回报假设。',
    [
      text('r', 'Expected asset returns (%)|各资产预期回报（%）', '5,10,15'),
      text('w', 'Portfolio weights (%) summing to 100|组合权重（%，合计 100）', '20,50,30'),
    ],
    (v) => {
      const r = nums(v.r),
        w = nums(v.w);
      check(
        r.length === w.length && w.every((x) => x >= 0) && Math.abs(sum(w) - 100) < 1e-8,
        'Use matching lists and nonnegative weights totaling 100%.|两列应等长，权重非负且合计 100%。',
      );
      return [
        R('Weighted expected return|加权预期回报', sum(r.map((x, k) => (x * w[k]) / 100)), '%'),
      ];
    },
    'E[Rp]=ΣwᵢE[Rᵢ]',
    [10.5],
  );
  D(
    'two-asset-volatility',
    'Two Asset Portfolio Volatility|双资产组合波动率',
    'Combine two asset volatilities and their correlation.|合并两项资产的波动率及相关性。',
    [
      n('a', 'Asset A volatility (%)|A 资产波动率（%）', 10, 0, 1000),
      n('b', 'Asset B volatility (%)|B 资产波动率（%）', 20, 0, 1000),
      n('w', 'Asset A weight (%)|A 资产权重（%）', 50, 0, 100),
      n('c', 'Correlation|相关系数', 0, -1, 1),
    ],
    (v) => {
      const w = v.w / 100;
      return [
        R(
          'Portfolio volatility|组合波动率',
          Math.sqrt(
            Math.max(0, (w * v.a) ** 2 + ((1 - w) * v.b) ** 2 + 2 * w * (1 - w) * v.a * v.b * v.c),
          ),
          '%',
        ),
      ];
    },
    'σp=√[w²σA²+(1−w)²σB²+2w(1−w)σAσBρ]',
    [Math.sqrt(125)],
  );
  D(
    'sharpe-ratio',
    'Sharpe Ratio|夏普比率',
    'Compare excess return with total return volatility.|比较超额回报与总回报波动。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('f', 'Same-period risk-free return (%)|同期无风险回报（%）', 2),
      p('s', 'Same-period volatility (%)|同期波动率（%）', 16),
    ],
    (v) => [R('Sharpe ratio|夏普比率', (v.r - v.f) / v.s)],
    'Use S = (R−F)/σ. R is period return, F is the risk-free return, and σ is volatility. All three inputs must use the same period and consistent rate units.|使用 S = (R−F)/σ。R 为期间收益率，F 为无风险收益率，σ 为波动率；三项输入须采用相同期间和一致的利率单位。',
    [0.5],
    'Use matching return periods. This does not annualize or estimate volatility from prices.|请使用相同期间；不自动年化，也不从价格估算波动率。',
  );
  D(
    'sortino-ratio',
    'Sortino Ratio|索提诺比率',
    'Compare return above a target with downside deviation.|比较超过目标的回报与下行偏差。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('t', 'Same-period target return (%)|同期目标回报（%）', 2),
      p('d', 'Same-period downside deviation (%)|同期下行偏差（%）', 8),
    ],
    (v) => [R('Sortino ratio|索提诺比率', (v.r - v.t) / v.d)],
    'Use S = (R−T)/d. R is period return, T is the same-period target return, and d is downside deviation measured consistently with that target and period.|使用 S = (R−T)/d。R 为期间收益率，T 为同期间目标收益率，d 为按该目标和期间一致衡量的下行偏差。',
    [1],
  );
  D(
    'treynor-ratio',
    'Treynor Ratio|特雷诺比率',
    'Compare excess return per unit of market beta.|比较每单位市场贝塔的超额回报。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('f', 'Same-period risk-free return (%)|同期无风险回报（%）', 2),
      p('b', 'Positive market beta|正市场贝塔', 1),
    ],
    (v) => [R('Treynor ratio (decimal return)|特雷诺比率（小数回报）', (v.r - v.f) / 100 / v.b)],
    'Use T = (R−F)/β. R and F are the period return and same-period risk-free return as fractions; β is the entered positive market beta. The result uses decimal return per unit of beta.|使用 T = (R−F)/β。R 与 F 分别为同期间的收益率比例和无风险收益率比例，β 为所填正市场贝塔值；结果为每单位贝塔对应的小数回报。',
    [0.08],
  );
  D(
    'information-ratio',
    'Information Ratio|信息比率',
    'Compare active return with tracking error.|比较相对基准的超额回报与跟踪误差。',
    [
      rate('r', 'Portfolio return (%)|组合回报（%）', 10),
      rate('b', 'Benchmark return (%)|基准回报（%）', 7),
      p('s', 'Tracking error (%)|跟踪误差（%）', 6),
    ],
    (v) => [R('Information ratio|信息比率', (v.r - v.b) / v.s)],
    'Use IR = (R−B)/e. R is portfolio return, B is benchmark return, and e is tracking error. All inputs must refer to the same period and rate units.|使用 IR = (R−B)/e。R 为组合收益率，B 为基准收益率，e 为跟踪误差；三项输入须采用相同期间和利率单位。',
    [0.5],
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, i, text, row: R, check, nums, sum, annuity, payment } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Educational estimate using your entered assumptions; no live prices, tax rules or guaranteed returns.|按自填假设进行教育性估算，不提供实时价格、税法或保证收益。',
    domain = 'Finance',
  ) => add(s, name, domain, purpose, f, calc, formula, e, note);
  const cash = (id, label, value) => n(id, label, value),
    pct = (id, label, value) => n(id, label, value, 0, 100),
    rate = n('r', 'Nominal annual interest rate (%)|名义年利率（%）', 6, 0, 100),
    months = i('t', 'Term in months|期限（月）', 12, 1, 1200);
  D(
    'maximum-drawdown',
    'Maximum Drawdown|最大回撤',
    'Measure the largest peak-to-trough loss in a value series.|计算价值序列中从峰值到后续谷值的最大跌幅。',
    [
      text(
        'x',
        'Positive portfolio values in time order|按时间顺序的正组合价值',
        '100,120,90,110,80,130',
      ),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x > 0),
        'Portfolio values must be positive.|组合价值必须大于零。',
      );
      let peak = a[0],
        d = 0,
        pi = 0,
        start = 0,
        end = 0;
      for (let k = 0; k < a.length; k++) {
        if (a[k] > peak) {
          peak = a[k];
          pi = k;
        }
        const q = 1 - a[k] / peak;
        if (q > d) {
          d = q;
          start = pi;
          end = k;
        }
      }
      return [
        R('Maximum drawdown|最大回撤', 100 * d, '%'),
        R('Peak observation number|峰值观测序号', start + 1),
        R('Trough observation number|谷值观测序号', end + 1),
      ];
    },
    'At each time, compare portfolio value with the highest value reached so far. The drawdown is 1−Vₜ/Hₜ; maximum drawdown is the largest such fraction. Vₜ is current value and Hₜ is the running peak.|逐时点比较组合价值与此前达到的最高价值。回撤比例为 1−Vₜ/Hₜ，最大回撤为这些比例的最大值；Vₜ 为当前价值，Hₜ 为截至该时点的峰值。',
    [100 / 3, 2, 5],
  );
  D(
    'average-purchase-price',
    'Average Purchase Price|分批买入均价',
    'Combine purchases by cash spent and unit price, with fees.|合并分批买入金额、单价与费用，计算持仓均价。',
    [
      text('a', 'Purchase amounts excluding fees|各笔买入金额（不含费用）', '100,100,100'),
      text('p', 'Price per unit for each purchase|各笔买入单价', '10,20,25'),
      cash('f', 'Total fees|总费用', 8),
    ],
    (v) => {
      const a = nums(v.a),
        p = nums(v.p);
      check(
        a.length === p.length && a.every((x) => x >= 0) && p.every((x) => x > 0),
        'Provide matching nonnegative amounts and positive prices.|金额与单价应等长，金额非负且单价为正。',
      );
      const units = sum(a.map((x, k) => x / p[k]));
      check(units > 0, 'Buy at least one positive amount.|至少一笔买入金额应大于零。');
      return [
        R('Average all-in price|含费均价', (sum(a) + v.f) / units),
        R('Total units|总份额', units),
        R('Total cost|总成本', sum(a) + v.f),
      ];
    },
    'Use U = Σ(Aᵢ/Pᵢ) and P̄ = (ΣAᵢ+F)/U. Aᵢ is each purchase amount excluding fees, Pᵢ is its unit price, F is total fees, and U is total units bought. P̄ includes fees.|使用 U = Σ(Aᵢ/Pᵢ) 和 P̄ = (ΣAᵢ+F)/U。Aᵢ 为每笔不含手续费的购买金额，Pᵢ 为对应单价，F 为总手续费，U 为总购买数量；P̄ 将手续费计入平均成本。',
    [308 / 19, 19, 308],
  );
  D(
    'capital-gains-tax-estimate',
    'Capital Gains Tax Estimate|资本利得税自填估算',
    'Apply an entered effective tax rate to a realized gain.|按自填有效税率估算已实现资本利得税。',
    [
      cash('b', 'Purchase cost basis|买入成本基础', 1000),
      cash('s', 'Sale proceeds|卖出收入', 1500),
      cash('f', 'Sale fees|卖出费用', 50),
      pct('r', 'Effective gains tax rate (%)|有效资本利得税率（%）', 20),
    ],
    (v) => {
      const gain = v.s - v.f - v.b,
        tax = (Math.max(0, gain) * v.r) / 100;
      return [
        R('Estimated tax|估算税额', tax),
        R('After-tax gain|税后收益', gain - tax),
        R('Net sale proceeds|税后卖出净收入', v.s - v.f - tax),
      ];
    },
    'Use G = S−F−B and T = max(G,0)r. S is sale proceeds, F is sale fees, B is purchase cost basis, and r is the entered gains tax fraction. G is modeled gain and T is estimated tax; no jurisdiction rules are applied.|使用 G = S−F−B 和 T = max(G,0)r。S 为出售所得，F 为出售费用，B 为购入成本基础，r 为所填资本利得税率比例；G 为模型损益，T 为税额估算，不套用任何司法辖区税法。',
    [90, 360, 1360],
    'No country-specific rules, allowances, holding-period rules or loss offsets are applied. Use the rate and basis confirmed for your situation.|不应用任何特定国家规则、免税额、持有期规则或亏损抵扣；请使用经核实适用于你的税率和成本基础。',
  );
  D(
    'real-investment-return',
    'Real Investment Return|实际投资回报率',
    'Remove inflation from a nominal investment return.|从名义投资回报中剔除通胀影响。',
    [
      n('r', 'Nominal return (%)|名义回报（%）', 10, -99.99, 10000),
      n('f', 'Inflation (%)|通胀（%）', 5, -99.99, 10000),
    ],
    (v) => [R('Real return|实际回报率', 100 * ((1 + v.r / 100) / (1 + v.f / 100) - 1), '%')],
    'Use R = (1+r)/(1+f)−1. r is nominal return, f is inflation, and R is real return. Rates in the equation are fractions over the same period.|使用 R = (1+r)/(1+f)−1。r 为名义收益率，f 为通胀率，R 为实际收益率；公式中的利率均为相同期间的比例。',
    [100 / 21],
  );
  D(
    'rule-of-72',
    'Rule of 72|72 法则',
    'Compare the quick doubling-time rule with exact compound growth.|比较快速翻倍估算与精确复利翻倍时间。',
    [p('r', 'Annual growth rate (%)|年增长率（%）', 6)],
    (v) => [
      R('Rule-of-72 estimate|72 法则估算', 72 / v.r, 'years'),
      R('Exact annual compounding|精确年度复利', Math.LN2 / Math.log1p(v.r / 100), 'years'),
    ],
    'The rule gives t ≈ 72/p, while constant compound growth gives t = ln(2)/ln(1+p/100). p is the positive annual percentage rate and t is years. The rule is an approximation.|经验法则为 t ≈ 72/p；恒定复利增长的精确年数为 t = ln(2)/ln(1+p/100)。p 为正年增长百分率，t 为年数；该经验法则仅为近似。',
    [12, 11.89566104594],
  );
  D(
    'investment-doubling-time',
    'Investment Target Time|投资增长倍数时间',
    'Solve the time to grow by a chosen multiple at a constant rate.|求固定增长率下达到目标倍数的时间。',
    [
      p('m', 'Target growth multiple|目标增长倍数', 3),
      p('r', 'Annual effective growth (%)|有效年增长率（%）', 10),
    ],
    (v) => {
      check(v.m >= 1, 'Target multiple must be at least one.|目标倍数不得小于 1。');
      return [R('Time to target|达到目标所需时间', Math.log(v.m) / Math.log1p(v.r / 100), 'years')];
    },
    'Use t = ln(M)/ln(1+r). M is the target growth multiple, r is the annual effective growth fraction, and t is years. This generalizes doubling to the multiple you enter.|使用 t = ln(M)/ln(1+r)。M 为目标增长倍数，r 为有效年增长率比例，t 为年数；可计算所填倍数，不限于翻倍。',
    [11.5267046072476],
  );
  D(
    'savings-withdrawal',
    'Savings Withdrawal Duration|储蓄定额提取期限',
    'Estimate how long a balance lasts with fixed monthly withdrawals.|估算储蓄按固定金额逐月提取可维持多久。',
    [
      cash('b', 'Starting balance|初始余额', 12000),
      p('w', 'Monthly withdrawal|每月提取', 1000),
      n('r', 'Nominal annual return (%)|名义年回报（%）', 0, 0, 100),
    ],
    (v) => {
      const r = v.r / 1200;
      if (v.b === 0) return [R('Withdrawal duration|提取期限', 0, 'months')];
      if (r > 0 && v.w <= v.b * r)
        return [
          R(
            'Withdrawal duration|提取期限',
            'Not depleted under fixed assumptions|固定假设下不会耗尽',
            'months',
          ),
        ];
      return [
        R(
          'Withdrawal duration|提取期限',
          r === 0 ? v.b / v.w : -Math.log1p((-v.b * r) / v.w) / Math.log1p(r),
          'months',
        ),
      ];
    },
    'n=−ln(1−Br/W)/ln(1+r); n=B/W at r=0',
    [12],
    'Withdrawals occur at month end. Rates are constant; taxes, fees and market sequence risk are omitted. Fractional months interpolate the model.|按月末提取、利率固定；不含税费与市场收益顺序风险，小数月份为模型插值。',
  );
  D(
    'lease-payment',
    'Lease Payment Estimate|租赁月供估算',
    'Separate depreciation and financing portions of a vehicle lease.|分开估算车辆租赁的折旧和融资月供。',
    [
      cash('c', 'Adjusted capitalized cost|调整后资本化成本', 30000),
      cash('s', 'Residual value|残值', 18000),
      months,
      n('f', 'Money factor|租赁货币因子', 0.002, 0, 0.1),
      pct('tax', 'Payment tax rate (%)|月供税率（%）', 0),
    ],
    (v) => {
      check(
        v.s <= v.c,
        'Residual cannot exceed capitalized cost in this model.|本模型残值不得超过资本化成本。',
      );
      const dep = (v.c - v.s) / v.t,
        fin = (v.c + v.s) * v.f;
      return [
        R('Estimated monthly payment|估算月供', (dep + fin) * (1 + v.tax / 100)),
        R('Monthly depreciation|月折旧', dep),
        R('Monthly financing charge|月融资费用', fin),
      ];
    },
    'Use A = [(C−S)/n+(C+S)f](1+τ). C is adjusted capitalized cost, S is residual value, n is months, f is the money factor, and τ is the payment tax fraction. The two terms are depreciation and financing charges.|使用 A = [(C−S)/n+(C+S)f](1+τ)。C 为调整后资本化成本，S 为残值，n 为月数，f 为租赁资金因子，τ 为付款税率比例；括号内两项分别为折旧和融资费用。',
    [1096, 1000, 96],
    'Common money-factor lease estimate. Contracts may apply taxes and fees differently; mileage and end-of-lease charges are excluded.|常见货币因子租赁估算；合同税费方式可能不同，不含里程与期末费用。',
  );
  D(
    'balloon-loan',
    'Balloon Loan Payment|尾款贷款月供',
    'Calculate equal payments leaving a chosen final balance.|计算保留指定期末尾款的等额月供。',
    [
      p('a', 'Principal|本金', 12000),
      cash('b', 'Final balloon balance|期末尾款', 6000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
    ],
    (v) => {
      check(v.b <= v.a, 'Balloon cannot exceed principal in this model.|本模型尾款不得超过本金。');
      const r = v.r / 1200,
        a = (v.a - v.b / (1 + r) ** v.t) / annuity(r, v.t);
      return [
        R('Monthly payment|每月还款', a),
        R('Total interest|总利息', a * v.t + v.b - v.a),
        R('Final balloon|期末尾款', v.b),
      ];
    },
    'Use A = [P−B/(1+r)^n]/a(r,n). P is principal, B is the balloon balance, r is the monthly interest fraction, and n is months. a(r,n) sums the end-of-month discount factors; the balloon is paid at the end.|使用 A = [P−B/(1+r)^n]/a(r,n)。P 为本金，B 为期末气球尾款，r 为月利率比例，n 为月数；a(r,n) 为各月月末折现因子之和，尾款在期末支付。',
    [500, 0, 6000],
  );
  D(
    'interest-only-loan',
    'Interest Only Loan|先息后本贷款',
    'Calculate interest-only payments and the final principal obligation.|计算仅付息期间月供及到期应归还本金。',
    [p('a', 'Principal|本金', 100000), rate, months],
    (v) => [
      R('Monthly interest-only payment|每月付息', (v.a * v.r) / 1200),
      R('Interest over entered term|所填期限利息', ((v.a * v.r) / 1200) * v.t),
      R('Principal still due|仍应归还本金', v.a),
    ],
    'Monthly interest is I = Pr/12 and term interest is nI. P is principal, r is the nominal annual interest fraction, and n is months. Interest-only payments leave the principal due.|每月利息为 I = Pr/12，整个期间利息为 nI。P 为本金，r 为名义年利率比例，n 为月数；只付利息不会偿还应付本金。',
    [500, 6000, 100000],
  );
  D(
    'remaining-loan-balance',
    'Remaining Loan Balance|贷款剩余本金',
    'Find the balance after a chosen number of equal payments.|计算等额还款若干期后的剩余本金。',
    [
      p('a', 'Original principal|原始本金', 12000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
      i('k', 'Payments already made|已还期数', 5, 0, 1200),
    ],
    (v) => {
      check(v.k <= v.t, 'Payments made cannot exceed the term.|已还期数不得超过总期限。');
      const r = v.r / 1200,
        a = payment(v.a, r, v.t),
        b =
          r === 0
            ? v.a - a * v.k
            : v.a * (1 + r) ** v.k - (a * Math.expm1(v.k * Math.log1p(r))) / r;
      return [
        R('Remaining principal|剩余本金', Math.max(0, b)),
        R('Scheduled monthly payment|计划月供', a),
      ];
    },
    'r=R/1200; r>0: Bₖ=P(1+r)ᵏ−A[(1+r)ᵏ−1]/r; r=0: Bₖ=P−kA',
    [7000, 1000],
  );
  D(
    'affordable-loan-amount',
    'Loan Amount from Payment|月供反推可借本金',
    'Reverse a payment budget into a principal amount.|由月供预算反推等额还款本金。',
    [
      cash('a', 'Monthly payment budget|月供预算', 1000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
    ],
    (v) => [
      R('Principal supported by payment|该月供对应本金', v.a * annuity(v.r / 1200, v.t)),
      R('Total scheduled payments|计划总还款', v.a * v.t),
    ],
    'Use P = A×a(r,n). A is the monthly payment budget, r is the monthly interest fraction, and n is months. a(r,n) is the sum of end-of-month discount factors. The result is payment arithmetic only.|使用 P = A×a(r,n)。A 为每月还款预算，r 为月利率比例，n 为月数；a(r,n) 为各月月末折现因子之和。结果仅为还款金额推算。',
    [12000, 12000],
    'This is payment arithmetic, not a lending approval or affordability assessment. Other costs and obligations are excluded.|仅为还款数学，不代表贷款审批或负担能力评估；不含其他成本与义务。',
  );
  D(
    'loan-term',
    'Loan Term from Payment|月供反推还清期限',
    'Solve repayment duration from balance, rate and payment.|由本金、利率与月供反推还清期限。',
    [
      cash('b', 'Loan balance|贷款余额', 12000),
      p('a', 'Monthly payment|每月还款', 1000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
    ],
    (v) => {
      const r = v.r / 1200;
      check(
        v.b === 0 || v.a > v.b * r,
        'Payment must exceed monthly interest.|月供必须超过当月利息。',
      );
      const t = r === 0 ? v.b / v.a : -Math.log1p((-v.b * r) / v.a) / Math.log1p(r);
      return [
        R('Modeled repayment time|模型还清期限', t, 'months'),
        R(
          'Number of payments, final payment may be smaller|还款次数（末期可能较少）',
          Math.ceil(t),
          'payments',
        ),
      ];
    },
    'r=R/1200; r>0: n=−ln(1−Pr/A)/ln(1+r); r=0: n=P/A',
    [12, 12],
  );
  D(
    'flat-versus-reducing-loan',
    'Flat vs Reducing Interest|平息与递减余额利息',
    'Compare flat interest with amortization at the same stated rate.|比较同一名义利率下的平息与余额递减等额还款。',
    [p('a', 'Principal|本金', 12000), rate, months],
    (v) => {
      const flat = (((v.a * v.r) / 100) * v.t) / 12,
        am = payment(v.a, v.r / 1200, v.t);
      return [
        R('Flat-interest monthly payment|平息月供', (v.a + flat) / v.t),
        R('Reducing-balance monthly payment|递减余额月供', am),
        R('Flat total interest|平息总利息', flat),
        R('Reducing total interest|递减余额总利息', am * v.t - v.a),
      ];
    },
    'Flat interest is I = Pjn/12; reducing-balance payment is A = P/a(j/12,n). P is principal, j is the nominal annual interest fraction, and n is months. a(r,n) sums the monthly discount factors at rate r.|平息利息为 I = Pjn/12，递减余额法月供为 A = P/a(j/12,n)。P 为本金，j 为名义年利率比例，n 为月数；a(r,n) 为按月利率 r 计算的各月折现因子之和。',
    [1060, 1032.797156485, 720, 393.56587782],
    'Same quoted rates do not mean equal borrowing costs. Fees and lender rounding are omitted.|相同报价利率不等于相同借款成本；不含费用与放款机构舍入规则。',
  );
  D(
    'debt-snowball-avalanche',
    'Debt Snowball vs Avalanche|雪球与雪崩还债比较',
    'Compare smallest-balance-first and highest-rate-first repayment.|比较优先还小额债务与优先还高息债务。',
    [
      text('b', 'Debt balances in matching order|各笔债务余额（顺序对应）', '1000,2000'),
      text('r', 'Nominal annual rates (%)|各笔名义年利率（%）', '0,0'),
      text('m', 'Minimum monthly payments|各笔最低月供', '50,50'),
      p('budget', 'Total monthly budget|每月总还款预算', 500),
    ],
    (v) => {
      const b = nums(v.b),
        r = nums(v.r),
        m = nums(v.m);
      check(
        b.length === r.length &&
          b.length === m.length &&
          b.length <= 30 &&
          b.every((x) => x >= 0) &&
          r.every((x) => x >= 0 && x <= 100) &&
          m.every((x) => x >= 0) &&
          v.budget >= sum(m),
        'Use up to 30 matching debts; budget must cover all entered minimums.|最多 30 笔对应债务，预算应覆盖所填最低月供。',
      );
      const run = (mode) => {
        const balances = [...b];
        let interest = 0,
          k = 0;
        while (sum(balances) > 0.0000001 && k < 1200) {
          k++;
          for (let j = 0; j < b.length; j++) {
            const q = (balances[j] * r[j]) / 1200;
            balances[j] += q;
            interest += q;
          }
          let left = v.budget;
          for (let j = 0; j < b.length; j++) {
            const pay = Math.min(balances[j], m[j], left);
            balances[j] -= pay;
            left -= pay;
          }
          const order = balances
            .map((_, j) => j)
            .filter((j) => balances[j] > 1e-8)
            .sort((a, c) =>
              mode === 'snow' ? balances[a] - balances[c] || a - c : r[c] - r[a] || a - c,
            );
          for (const j of order) {
            const pay = Math.min(left, balances[j]);
            balances[j] -= pay;
            left -= pay;
          }
        }
        check(
          sum(balances) <= 1e-7,
          'At least one strategy does not repay within 1,200 months; increase the budget.|至少一种方案无法在 1,200 个月内还清，请提高预算。',
        );
        return [k, interest];
      };
      const a = run('snow'),
        b2 = run('avalanche');
      return [
        R('Snowball repayment months|雪球法还清月数', a[0], 'months'),
        R('Avalanche repayment months|雪崩法还清月数', b2[0], 'months'),
        R('Snowball interest|雪球法利息', a[1]),
        R('Avalanche interest|雪崩法利息', b2[1]),
        R('Interest saved by avalanche|雪崩法节省利息', a[1] - b2[1]),
      ];
    },
    'Accrue monthly interest → pay minimums → allocate remaining budget by selected order|计入当月利息 → 支付最低还款 → 按所选顺序分配剩余预算。',
    [6, 6, 0, 0, 0],
    'Fixed rates, fixed entered minimums and no new borrowing. Payments occur after monthly interest. Actual statement rules can differ.|利率及自填最低月供固定，无新增借款；先计月息再还款，实际账单规则可能不同。',
  );
  const B = (s, name, purpose, f, calc, formula, e, note) =>
    D(
      s,
      name,
      purpose,
      f,
      calc,
      formula,
      e,
      note ||
        'Business ratio based on your consistent-period inputs. Accounting definitions and industry comparisons may differ.|根据同一期间输入计算商业比率，会计口径与行业比较可能不同。',
      'Business',
    );
  B(
    'cash-conversion-cycle',
    'Cash Conversion Cycle|现金周转周期',
    'Combine inventory, collection and supplier-payment days.|合并存货、收款与付款天数。',
    [
      n('i', 'Inventory days|存货周转天数', 45),
      n('r', 'Receivable days|应收账款天数', 30),
      n('p', 'Payable days|应付账款天数', 20),
    ],
    (v) => [R('Cash conversion cycle|现金周转周期', v.i + v.r - v.p, 'days')],
    'Use CCC = DIO+DSO−DPO. DIO is inventory days, DSO is receivable days, and DPO is payable days. The result is the modeled cash conversion cycle in days.|使用 CCC = DIO+DSO−DPO。DIO 为存货天数，DSO 为应收账款天数，DPO 为应付账款天数；结果为模型中的现金转换周期天数。',
    [55],
  );
  B(
    'current-ratio',
    'Current Ratio|流动比率',
    'Compare current assets with current liabilities.|比较流动资产与流动负债。',
    [cash('a', 'Current assets|流动资产', 200000), p('l', 'Current liabilities|流动负债', 100000)],
    (v) => [R('Current ratio|流动比率', v.a / v.l)],
    'Use R = A/L. A is current assets and L is current liabilities. The current ratio is a dimensionless comparison of those entered amounts.|使用 R = A/L。A 为流动资产，L 为流动负债；流动比率为所填两项金额之间的无量纲比值。',
    [2],
  );
  B(
    'quick-ratio',
    'Quick Ratio|速动比率',
    'Exclude inventory and prepayments from short-term coverage.|从短期偿债资产中扣除存货及预付项。',
    [
      cash('a', 'Current assets|流动资产', 200000),
      cash('i', 'Inventory|存货', 50000),
      cash('p', 'Prepayments|预付款', 10000),
      p('l', 'Current liabilities|流动负债', 100000),
    ],
    (v) => {
      check(
        v.i + v.p <= v.a,
        'Inventory plus prepayments cannot exceed current assets.|存货与预付款合计不能超过流动资产。',
      );
      return [R('Quick ratio|速动比率', (v.a - v.i - v.p) / v.l)];
    },
    'Use Q = (A−I−P)/L. A is current assets, I is inventory, P is prepayments, and L is current liabilities. The quick ratio excludes inventory and prepayments from the numerator.|使用 Q = (A−I−P)/L。A 为流动资产，I 为存货，P 为预付款，L 为流动负债；速动比率的分子扣除存货和预付款。',
    [1.4],
  );
  B(
    'inventory-turnover',
    'Inventory Turnover|存货周转率',
    'Compare cost of goods sold with average inventory.|比较销售成本与平均存货。',
    [
      cash('c', 'Cost of goods sold in period|期间销售成本', 600000),
      p('i', 'Average inventory|平均存货', 100000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Inventory turnover|存货周转率', v.c / v.i, 'times'),
      R(
        'Inventory days|存货天数',
        v.c > 0 ? (v.d * v.i) / v.c : 'Undefined with zero sales cost|销售成本为零时无定义',
        'days',
      ),
    ],
    'Use T = C/I and D = d/T. C is cost of goods sold for the period, I is average inventory, and d is days in that period. T is turnover and D is inventory days.|使用 T = C/I 和 D = d/T。C 为该期间销售成本，I 为平均存货，d 为该期间天数；T 为存货周转次数，D 为存货周转天数。',
    [6, 365 / 6],
  );
  B(
    'receivables-turnover',
    'Receivables Turnover|应收账款周转率',
    'Compare credit sales with average receivables.|比较赊销额与平均应收账款。',
    [
      cash('s', 'Net credit sales|赊销净额', 600000),
      p('a', 'Average receivables|平均应收账款', 50000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Receivables turnover|应收账款周转率', v.s / v.a, 'times'),
      R(
        'Collection days|收款天数',
        v.s > 0 ? (v.d * v.a) / v.s : 'Undefined with zero credit sales|赊销为零时无定义',
        'days',
      ),
    ],
    'Use T = S/A and D = d/T. S is net credit sales, A is average receivables, and d is days in the same period. T is receivables turnover and D is collection days.|使用 T = S/A 和 D = d/T。S 为赊销净额，A 为平均应收账款，d 为同一期间天数；T 为应收账款周转次数，D 为收款周转天数。',
    [12, 365 / 12],
  );
  B(
    'payables-turnover',
    'Payables Turnover|应付账款周转率',
    'Compare credit purchases with average trade payables.|比较赊购额与平均贸易应付账款。',
    [
      cash('s', 'Net credit purchases|赊购净额', 360000),
      p('a', 'Average trade payables|平均贸易应付账款', 30000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Payables turnover|应付账款周转率', v.s / v.a, 'times'),
      R(
        'Payment days|付款天数',
        v.s > 0 ? (v.d * v.a) / v.s : 'Undefined with zero purchases|购入为零时无定义',
        'days',
      ),
    ],
    'Use T = S/A and D = d/T. S is net credit purchases, A is average trade payables, and d is days in the same period. T is payables turnover and D is payment days.|使用 T = S/A 和 D = d/T。S 为赊购净额，A 为平均贸易应付款，d 为同一期间天数；T 为应付账款周转次数，D 为付款周转天数。',
    [12, 365 / 12],
  );
  B(
    'working-capital',
    'Working Capital|营运资本',
    'Calculate net short-term operating funding.|计算净短期资金与营运资本占收入比例。',
    [
      cash('a', 'Current assets|流动资产', 200000),
      cash('l', 'Current liabilities|流动负债', 120000),
      p('s', 'Annual revenue|年收入', 1000000),
    ],
    (v) => [
      R('Net working capital|净营运资本', v.a - v.l),
      R('Working capital / revenue|营运资本占收入', (100 * (v.a - v.l)) / v.s, '%'),
    ],
    'Use NWC = A−L. A is current assets and L is current liabilities. Dividing NWC by the entered annual revenue gives the working-capital-to-revenue fraction.|使用 NWC = A−L。A 为流动资产，L 为流动负债；将 NWC 除以所填年度收入，可得营运资金占收入的比例。',
    [80000, 8],
  );
  B(
    'operating-leverage',
    'Degree of Operating Leverage|经营杠杆系数',
    'Estimate local operating-profit sensitivity to sales volume.|估计经营利润对销量的局部敏感度。',
    [
      p('q', 'Units sold|销售数量', 1000),
      p('p', 'Selling price per unit|单位售价', 20),
      cash('c', 'Variable cost per unit|单位变动成本', 10),
      cash('f', 'Fixed operating costs|固定经营成本', 5000),
    ],
    (v) => {
      const contribution = v.q * (v.p - v.c),
        profit = contribution - v.f;
      check(
        profit !== 0,
        'Operating leverage is undefined at zero operating profit.|经营利润为零时，经营杠杆无定义。',
      );
      return [
        R('Operating leverage|经营杠杆系数', contribution / profit),
        R('Operating profit|经营利润', profit),
      ];
    },
    'Use DOL = Q(P−V)/[Q(P−V)−F]. Q is units sold, P is selling price per unit, V is variable cost per unit, and F is fixed operating costs. The denominator is modeled operating profit.|使用 DOL = Q(P−V)/[Q(P−V)−F]。Q 为销量，P 为单位售价，V 为单位变动成本，F 为固定运营成本；分母为模型中的营业利润。',
    [2, 5000],
  );
  B(
    'economic-order-quantity',
    'Economic Order Quantity|经济订货批量 EOQ',
    'Balance ordering and inventory holding costs.|权衡订货与存货持有成本。',
    [
      p('d', 'Annual demand units|年需求数量', 10000),
      p('s', 'Cost per order|每次订货成本', 50),
      p('h', 'Annual holding cost per unit|每单位年持有成本', 2),
    ],
    (v) => {
      const q = Math.sqrt((2 * v.d * v.s) / v.h);
      return [
        R('Economic order quantity|经济订货批量', q, 'units'),
        R('Orders per year|每年订货次数', v.d / q),
        R('Annual ordering plus holding cost|年订货与持有成本', (v.d / q) * v.s + (q / 2) * v.h),
      ];
    },
    'Use EOQ = √(2DS/H). D is annual demand in units, S is cost per order, and H is annual holding cost per unit. The result balances modeled ordering and holding costs.|使用 EOQ = √(2DS/H)。D 为年度需求数量，S 为每次订货成本，H 为每单位年度持有成本；结果平衡模型中的订货成本与持有成本。',
    [Math.sqrt(500000), Math.sqrt(200), Math.sqrt(2000000)],
    'Assumes constant demand, instant replenishment, no shortages, no bulk discounts and an unlimited shelf life.|假设需求稳定、即时补货、无缺货、无批量折扣且保质期不受限。',
  );
  B(
    'reorder-point',
    'Inventory Reorder Point|库存再订货点',
    'Combine lead-time demand with a safety buffer.|合并交货期需求与安全库存。',
    [
      n('d', 'Average daily demand|平均每日需求', 50),
      n('l', 'Lead time in days|交货期天数', 7),
      n('s', 'Safety stock units|安全库存数量', 100),
    ],
    (v) => [R('Reorder point|再订货点', v.d * v.l + v.s, 'units')],
    'Use ROP = dL+S. d is average daily demand, L is lead time in days, and S is safety stock. The reorder point combines lead-time demand with that stock allowance.|使用 ROP = dL+S。d 为平均每日需求，L 为以天表示的交货提前期，S 为安全库存；再订货点将提前期需求与安全库存相加。',
    [450],
  );
  B(
    'inventory-safety-stock',
    'Inventory Safety Stock|库存安全量',
    'Estimate a demand-variation buffer for fixed lead time.|在交货期固定时估计需求波动缓冲。',
    [
      n('z', 'Service-factor z|服务水平系数 z', 1.65, 0, 6),
      n('s', 'Daily demand standard deviation|日需求标准差', 10),
      n('l', 'Fixed lead time in days|固定交货期天数', 9),
    ],
    (v) => [R('Safety stock|安全库存', v.z * v.s * Math.sqrt(v.l), 'units')],
    'Use SS = zσ√L. z is the chosen service factor, σ is the standard deviation of daily demand, and L is fixed lead time in days. Daily demand is assumed independent with stable variance.|使用 SS = zσ√L。z 为自选服务系数，σ 为每日需求标准差，L 为固定交货提前期天数；假设各日需求相互独立且方差稳定。',
    [49.5],
    'Independent daily demand with stable variance and fixed lead time. Choose the service factor separately; this is not a guaranteed fill rate.|假设每日需求独立、方差稳定且交货期固定；服务系数需另行确定，不代表保证满足率。',
  );
  B(
    'customer-lifetime-value',
    'Customer Lifetime Value|客户生命周期价值',
    'Estimate contribution from a stable recurring customer relationship.|估算稳定周期客户关系的贡献价值。',
    [
      cash('a', 'Monthly revenue per customer|每客户月收入', 50),
      pct('m', 'Contribution margin (%)|贡献利润率（%）', 60),
      n('c', 'Monthly customer churn (%)|月客户流失率（%）', 5, 0.000001, 100),
      cash('s', 'One-time servicing cost|一次性服务成本', 0),
    ],
    (v) => [
      R('Undiscounted contribution lifetime value|未折现贡献生命周期价值', (v.a * v.m) / v.c - v.s),
      R('Expected customer lifetime|预期客户存续期', 100 / v.c, 'months'),
    ],
    'Use LTV = Rm/c−S. R is monthly revenue per customer, m is the contribution-margin fraction, c is the monthly churn fraction, and S is one-time servicing cost. Constant churn gives an expected lifetime of 1/c months; this model does not discount future contributions.|使用 LTV = Rm/c−S。R 为每位客户月收入，m 为贡献毛利率比例，c 为月流失率比例，S 为一次性服务成本；在流失率恒定时，预期客户存续期为 1/c 个月。模型不对未来贡献折现。',
    [600, 20],
    'Assumes constant churn and margin, no expansion and no discounting. Small churn changes can produce large value changes.|假设流失率与利润率固定，无增购且不折现；小幅流失变化可能显著改变价值。',
  );
  B(
    'customer-acquisition-cost',
    'Customer Acquisition Cost|客户获取成本 CAC',
    'Divide attributable acquisition spending by new customers.|将可归属获客支出分摊至新增客户。',
    [
      cash('a', 'Acquisition spending|获客支出', 10000),
      i('n', 'New paying customers|新增付费客户', 100, 1, 100000000),
    ],
    (v) => [R('Cost per acquired customer|每新增客户成本', v.a / v.n)],
    'Use CAC = A/N. A is the acquisition spending attributed to the same period and customer group, and N is the number of newly acquired paying customers.|使用 CAC = A/N。A 为归属于相同期间与客户群的获客支出，N 为新获取的付费客户数量。',
    [100],
  );
  B(
    'customer-churn-rate',
    'Customer Churn Rate|客户流失率',
    'Measure customers lost from the starting customer cohort.|衡量期初客户群在本期的流失比例。',
    [
      i('a', 'Starting customers|期初客户数', 1000, 1, 100000000),
      i('l', 'Starting-cohort customers lost|期初群体流失人数', 50, 0, 100000000),
    ],
    (v) => {
      check(
        v.l <= v.a,
        'Lost customers cannot exceed the starting cohort.|流失人数不得超过期初群体。',
      );
      return [
        R('Customer churn|客户流失率', (100 * v.l) / v.a, '%'),
        R('Cohort retention|群体留存率', 100 * (1 - v.l / v.a), '%'),
      ];
    },
    'Use c = L/S and r = 1−c. S is starting customers and L is customers lost from that starting group. c is the churn fraction and r is the retained fraction; new customers do not enter either numerator.|使用 c = L/S 和 r = 1−c。S 为期初客户数，L 为该期初客户群中的流失客户数；c 为流失比例，r 为留存比例，两项分子均不计新客户。',
    [5, 95],
  );
  B(
    'net-revenue-retention',
    'Net Revenue Retention|净收入留存率 NRR',
    'Track existing-customer recurring revenue after expansion and losses.|追踪原有客户收入经增购、降购及流失后的留存。',
    [
      p('s', 'Starting recurring revenue|期初经常性收入', 10000),
      cash('e', 'Expansion revenue|增购收入', 2000),
      cash('d', 'Contraction revenue|降购减少收入', 500),
      cash('c', 'Churned revenue|流失收入', 500),
    ],
    (v) => {
      check(
        v.d + v.c <= v.s,
        'Contraction plus churn cannot exceed starting revenue.|降购与流失减少额合计不能超过期初收入。',
      );
      return [
        R('Net revenue retention|净收入留存率', (100 * (v.s + v.e - v.d - v.c)) / v.s, '%'),
        R('Gross revenue retention|毛收入留存率', (100 * (v.s - v.d - v.c)) / v.s, '%'),
      ];
    },
    'Use NRR = (S+E−D−C)/S. S is starting recurring revenue, E is expansion, D is contraction, and C is churned revenue from the same starting customer group. NRR is a fraction; all new-customer revenue is excluded.|使用 NRR = (S+E−D−C)/S。S 为期初经常性收入，E 为扩张收入，D 为收缩收入，C 为相同期初客户群的流失收入；NRR 为比例，排除全部新客户收入。',
    [110, 90],
    'Exclude all new-customer revenue; use the same starting cohort and recurring-revenue period.|排除所有新客户收入，使用同一期初群体与经常性收入期间。',
  );
  B(
    'return-on-ad-spend',
    'Return on Ad Spend|广告支出回报 ROAS',
    'Compare attributed revenue with advertising spend and margin.|比较归因收入与广告投入，并计入贡献利润率。',
    [
      cash('r', 'Attributed revenue|归因收入', 10000),
      p('s', 'Ad spend|广告支出', 2000),
      pct('m', 'Pre-ad contribution margin (%)|广告前贡献利润率（%）', 40),
    ],
    (v) => [
      R('ROAS|广告支出回报', v.r / v.s, '×'),
      R('Contribution after advertising|扣广告后贡献', (v.r * v.m) / 100 - v.s),
      R(
        'Break-even ROAS|保本 ROAS',
        v.m > 0 ? 100 / v.m : 'No finite break-even at zero margin|零利润率时不存在有限保本值',
        '×',
      ),
    ],
    'Use ROAS = R/A and break-even ROAS = 1/m. R is attributed revenue, A is advertising spend, and m is the pre-ad contribution-margin fraction. Modeled contribution after advertising is Rm−A.|使用 ROAS = R/A，保本时 ROAS = 1/m。R 为归因收入，A 为广告支出，m 为广告前贡献毛利率比例；模型中的广告后贡献为 Rm−A。',
    [5, 2000, 2.5],
    'Attribution is your assumption and does not establish incremental sales. Excludes costs outside entered margin.|归因为自填假设，不能证明增量销量；不含所填利润率之外的成本。',
  );
  B(
    'contribution-margin',
    'Contribution Margin|贡献毛益',
    'Measure revenue remaining after variable costs.|计算收入扣除变动成本后可覆盖固定成本的金额。',
    [
      p('p', 'Price per unit|单位售价', 20),
      cash('v', 'Variable cost per unit|单位变动成本', 12),
      n('q', 'Units|数量', 1000),
    ],
    (v) => [
      R('Contribution per unit|单位贡献毛益', v.p - v.v),
      R('Contribution ratio|贡献毛益率', (100 * (v.p - v.v)) / v.p, '%'),
      R('Total contribution|总贡献毛益', (v.p - v.v) * v.q),
    ],
    'Use C = P−V, M = C/P and T = QC. P is unit price, V is unit variable cost, and Q is units sold. C is contribution per unit, M is the contribution fraction, and T is total contribution.|使用 C = P−V、M = C/P 和 T = QC。P 为单位售价，V 为单位变动成本，Q 为销量；C 为单位贡献，M 为贡献比例，T 为总贡献。',
    [8, 40, 8000],
  );
  B(
    'target-margin-price',
    'Target Margin Selling Price|目标利润率反推售价',
    'Reverse a target margin and percentage fees into a selling price.|由目标利润率及按收入计费比例反推售价。',
    [
      cash('c', 'Unit cost including fixed per-sale fees|单位成本（含每单固定费用）', 60),
      n('m', 'Target profit margin (%)|目标利润率（%）', 25, 0, 99.999),
      n('f', 'Revenue-based fee rate (%)|按收入计费比例（%）', 5, 0, 99.999),
    ],
    (v) => {
      check(
        v.m + v.f < 100,
        'Margin plus percentage fees must be below 100%.|利润率与比例费用合计必须低于 100%。',
      );
      const p = v.c / (1 - (v.m + v.f) / 100);
      return [
        R('Required selling price|所需售价', p),
        R('Profit per unit|单位利润', (p * v.m) / 100),
        R('Percentage fees per unit|单位比例费用', (p * v.f) / 100),
      ];
    },
    'Use P = C/(1−m−f). C is unit cost including fixed per-sale fees, m is the target profit-margin fraction, and f is the revenue-based fee fraction. The combined fractions must leave a positive denominator.|使用 P = C/(1−m−f)。C 为包含每笔固定费用的单位成本，m 为目标利润率比例，f 为按收入计费的比例；两项比例合计后须使分母保持为正。',
    [600 / 7, 150 / 7, 30 / 7],
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, i, text, row: R, check, nums, sum, mean, variance } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'For personal measurement and planning, not diagnosis, treatment or a training prescription. Measurement error and individual differences affect results.|用于个人测量与规划，不用于诊断、治疗或训练处方；测量误差与个体差异会影响结果。',
  ) => add(s, name, 'Health', purpose, f, calc, formula, e, note);
  const weight = p('w', 'Body mass (kg)|体重（kg）', 75),
    height = p('h', 'Height (cm)|身高（cm）', 180),
    fat = n('f', 'Measured body fat (%)|测量体脂率（%）', 20, 0, 99.9);
  D(
    'waist-height-ratio',
    'Waist to Height Ratio|腰围身高比',
    'Compare waist circumference with measured height.|比较实测腰围与身高。',
    [p('w', 'Waist circumference (cm)|腰围（cm）', 80), height],
    (v) => [R('Waist / height|腰围身高比', v.w / v.h)],
    'Use R = W/H. W is measured waist circumference and H is measured height in the same unit. The ratio has no unit.|使用 R = W/H。W 为实测腰围，H 为实测身高，两者单位必须相同；所得比值无单位。',
    [4 / 9],
  );
  D(
    'waist-hip-ratio',
    'Waist to Hip Ratio|腰臀比',
    'Compare waist and hip circumference in the same unit.|用相同单位比较腰围与臀围。',
    [
      p('w', 'Waist circumference (cm)|腰围（cm）', 80),
      p('h', 'Hip circumference (cm)|臀围（cm）', 100),
    ],
    (v) => [R('Waist / hip|腰臀比', v.w / v.h)],
    'Use WHR = W/H. W is waist circumference and H is hip circumference, measured in the same unit.|使用 WHR = W/H。W 为腰围，H 为臀围，两者使用相同的测量单位。',
    [0.8],
  );
  D(
    'body-surface-area',
    'Body Surface Area|体表面积',
    'Estimate body surface area with the Mosteller formula.|用 Mosteller 公式估算体表面积。',
    [weight, height],
    (v) => [R('Estimated surface area|估算体表面积', Math.sqrt((v.w * v.h) / 3600), 'm²')],
    'Use BSA = √(HW/3600). H is height in cm and W is body mass in kg. The Mosteller estimate is in m².|使用 BSA = √(HW/3600)。H 为身高（cm），W 为体重（kg）；Mosteller 体表面积估算结果的单位为 m²。',
    [Math.sqrt(3.75)],
    'Mosteller approximation for educational comparison. Never use this page to determine medication or chemotherapy doses.|Mosteller 近似，仅供教育性比较；不得据此确定药物或化疗剂量。',
  );
  D(
    'fat-free-mass-index',
    'Fat Free Mass Index|去脂体重指数 FFMI',
    'Scale measured fat-free mass by height squared.|将测量推算的去脂体重按身高平方标准化。',
    [weight, height, fat],
    (v) => {
      const lean = v.w * (1 - v.f / 100);
      return [
        R('FFMI|去脂体重指数', lean / (v.h / 100) ** 2, 'kg/m²'),
        R('Fat-free mass|去脂体重', lean, 'kg'),
      ];
    },
    'Use FFMI = W(1−f)/h². W is body mass in kg, f is measured body fat as a fraction, and h is height converted to m. The index is in kg/m².|使用 FFMI = W(1−f)/h²。W 为体重（kg），f 为测量体脂率换成的小数比例，h 为换算成 m 的身高；指数单位为 kg/m²。',
    [60 / 3.24, 60],
  );
  D(
    'fat-mass-index',
    'Fat Mass Index|脂肪质量指数 FMI',
    'Scale measured fat mass by height squared.|将测量推算的脂肪质量按身高平方标准化。',
    [weight, height, fat],
    (v) => [
      R('FMI|脂肪质量指数', (v.w * v.f) / 100 / (v.h / 100) ** 2, 'kg/m²'),
      R('Fat mass|脂肪质量', (v.w * v.f) / 100, 'kg'),
    ],
    'Use FMI = Wf/h². W is body mass in kg, f is measured body fat as a fraction, and h is height converted to m. The index is in kg/m².|使用 FMI = Wf/h²。W 为体重（kg），f 为测量体脂率换成的小数比例，h 为换算成 m 的身高；指数单位为 kg/m²。',
    [15 / 3.24, 15],
  );
  D(
    'heart-rate-reserve',
    'Heart Rate Reserve Target|心率储备目标',
    'Apply an entered intensity to measured heart-rate reserve.|将自填强度应用于实测心率储备。',
    [
      n('m', 'Measured maximum heart rate (bpm)|实测最大心率（bpm）', 190, 30, 250),
      n('r', 'Resting heart rate (bpm)|静息心率（bpm）', 60, 20, 200),
      n('p', 'Chosen reserve intensity (%)|自选储备强度（%）', 60, 0, 100),
    ],
    (v) => {
      check(
        v.m > v.r,
        'Maximum heart rate must exceed resting heart rate.|最大心率必须高于静息心率。',
      );
      return [
        R('Target at entered intensity|自填强度对应心率', v.r + ((v.m - v.r) * v.p) / 100, 'bpm'),
        R('Heart-rate reserve|心率储备', v.m - v.r, 'bpm'),
      ];
    },
    'Use T = R+(M−R)i. R is resting heart rate, M is measured maximum heart rate, and i is your chosen reserve intensity as a fraction. T uses the same heart-rate unit.|使用 T = R+(M−R)i。R 为静息心率，M 为实测最大心率，i 为自选储备强度的小数比例；T 与输入心率的单位相同。',
    [138, 130],
    'Enter an intensity approved for your circumstances. Medicines and health conditions can change heart-rate responses; this does not set a safe exercise zone.|请填写适合自身情况且经确认的强度；药物和健康状况可能改变心率反应，本工具不确定安全运动区间。',
  );
  D(
    'maximum-heart-rate-percentage',
    'Heart Rate Intensity Percentage|心率强度百分比',
    'Compare an observed heart rate with a measured maximum.|比较观测心率与实测最大心率。',
    [
      p('h', 'Observed heart rate (bpm)|观测心率（bpm）', 150),
      p('m', 'Measured maximum heart rate (bpm)|实测最大心率（bpm）', 200),
    ],
    (v) => [R('Percentage of entered maximum|占所填最大心率', (100 * v.h) / v.m, '%')],
    'Use I = 100H/M. H is observed heart rate and M is the entered measured maximum, in the same unit. I is the percentage of that maximum.|使用 I = 100H/M。H 为观测心率，M 为自填实测最大心率，两者单位相同；I 为观测心率占该最大值的百分数。',
    [75],
  );
  D(
    'one-rep-max',
    'One Rep Max Estimate|一次最大重量估算',
    'Compare Epley and Brzycki estimates from a submaximal set.|由次最大组比较 Epley 与 Brzycki 重量估算。',
    [
      p('w', 'Lifted weight (kg)|举起重量（kg）', 60),
      i('r', 'Completed repetitions|完成次数', 5, 1, 10),
    ],
    (v) => [
      R('Epley estimate|Epley 估算', v.r === 1 ? v.w : v.w * (1 + v.r / 30), 'kg'),
      R('Brzycki estimate|Brzycki 估算', (v.w * 36) / (37 - v.r), 'kg'),
    ],
    'For r > 1, use Epley E = w(1+r/30); at r = 1 use E = w. Brzycki uses B = 36w/(37−r). w is lifted weight and r is completed repetitions. Both results use the weight unit.|当 r > 1 时，Epley 估算为 E = w(1+r/30)；r = 1 时使用 E = w。Brzycki 估算为 B = 36w/(37−r)。w 为举起重量，r 为完成次数；两个结果均使用输入重量的单位。',
    [70, 67.5],
    'Prediction only, not a recommendation to attempt the weight. Limited to 1–10 technically sound repetitions; fatigue, exercise type and training history affect accuracy.|仅为预测，不建议据此尝试该重量。限 1–10 次动作规范的重复；疲劳、动作类型与训练经历影响准确度。',
  );
  D(
    'session-training-load',
    'Session Training Load|单次训练负荷',
    'Multiply session duration by a perceived-exertion rating.|将训练时长乘以主观用力评分。',
    [
      n('t', 'Session duration (minutes)|训练时长（分钟）', 60),
      n('r', 'Session RPE from 0 to 10|单次 RPE（0–10）', 5, 0, 10),
    ],
    (v) => [R('Session load|单次训练负荷', v.t * v.r, 'AU')],
    'Use L = tR. t is session duration in minutes and R is the entered session rating of perceived exertion. L is a load score in arbitrary units, not energy expenditure.|使用 L = tR。t 为训练时长（分钟），R 为自填单次训练主观用力评分；L 为任意单位的负荷分数，并非能量消耗。',
    [300],
  );
  D(
    'barbell-plate-loading',
    'Barbell Plate Loading|杠铃配片',
    'Find balanced plate pairs from an available set of denominations.|根据可用片重组合找到左右平衡的配片方案。',
    [
      n('t', 'Target total weight (kg)|目标总重量（kg）', 100),
      n('b', 'Bar weight (kg)|空杆重量（kg）', 20),
      text(
        'p',
        'Available plate sizes (kg), unlimited pairs|可用片重（kg，每种视为足量）',
        '20,10,5,2.5,1.25',
      ),
    ],
    (v) => {
      check(v.t >= v.b, 'Target must be at least the bar weight.|目标重量不得低于空杆重量。');
      const sizes = [...new Set(nums(v.p))].sort((a, b) => b - a);
      check(
        sizes.length <= 20 && sizes.every((x) => x > 0 && Number.isInteger(x * 100)),
        'Use up to 20 positive plate sizes with at most two decimal places.|最多 20 种正片重，且最多两位小数。',
      );
      const target = Math.round((v.t - v.b) * 50);
      check(
        Math.abs(target - (v.t - v.b) * 50) < 1e-7 && target <= 100000,
        'Target must fit 0.02 kg total increments and at most 2,000 kg added load.|总增量应为 0.02 kg 的整数倍，且加片不超过 2,000 kg。',
      );
      const dp = new Int32Array(target + 1).fill(1000000),
        prev = new Int32Array(target + 1).fill(-1);
      dp[0] = 0;
      for (let a = 1; a <= target; a++)
        for (let j = 0; j < sizes.length; j++) {
          const s = Math.round(sizes[j] * 100);
          if (a >= s && dp[a - s] + 1 < dp[a]) {
            dp[a] = dp[a - s] + 1;
            prev[a] = j;
          }
        }
      check(
        dp[target] < 1000000,
        'The exact target cannot be made with these plate sizes.|这些片重无法组成精确目标。',
      );
      const count = sizes.map(() => 0);
      for (let a = target; a > 0;) {
        const j = prev[a];
        count[j]++;
        a -= Math.round(sizes[j] * 100);
      }
      return [
        R(
          'Plates on each side|每侧配片',
          count
            .map((c, k) => (c ? c + ' × ' + sizes[k] + ' kg' : ''))
            .filter(Boolean)
            .join(' + ') || 'None|无需加片',
        ),
        R('Plate count per side|每侧片数', dp[target]),
        R('Total weight|总重量', v.t, 'kg'),
      ];
    },
    'Each side needs S = (T−B)/2. T is target total weight and B is bar weight in the same unit. Choose matching plate pairs to reach S on each side with the fewest plates. Each entered plate size is assumed to have enough matching pairs.|每侧需要 S = (T−B)/2。T 为目标总重量，B 为同单位空杆重量；选择成对杠铃片，使每侧达到 S 且片数最少，假设每种自填片重都有足够成对片。',
    ['2 × 20 kg', 2, 100],
    'Assumes enough matching pairs of each size. Collars are excluded; include their mass in bar weight if needed.|假设每种片重有足够成对片；不含卡扣，必要时将其质量计入空杆。',
  );
  D(
    'strength-bodyweight-ratio',
    'Strength to Bodyweight Ratio|力量体重比',
    'Express a lifted load as a multiple of body mass.|将举起重量表示为体重倍数。',
    [n('l', 'Lifted load (kg)|举起负荷（kg）', 100), weight],
    (v) => [R('Load / body mass|负荷体重比', v.l / v.w, '×')],
    'Use S = L/W. L is lifted load and W is body mass in the same weight unit. The result is the load as a multiple of body mass.|使用 S = L/W。L 为举起负荷，W 为体重，两者重量单位相同；结果表示负荷是体重的多少倍。',
    [4 / 3],
  );
  D(
    'race-time-prediction',
    'Race Time Projection|比赛时间推算',
    'Project another distance using an editable endurance exponent.|使用可编辑耐力指数推算另一距离用时。',
    [
      p('d', 'Known distance (km)|已知距离（km）', 5),
      p('t', 'Known finish time (minutes)|已知完成时间（分钟）', 25),
      p('n', 'Target distance (km)|目标距离（km）', 10),
      n('e', 'Endurance exponent|耐力指数', 1.06, 0.5, 2),
    ],
    (v) => [
      R('Projected finish time|推算完成时间', v.t * (v.n / v.d) ** v.e, 'minutes'),
      R('Projected pace|推算配速', (v.t * (v.n / v.d) ** v.e) / v.n, 'min/km'),
    ],
    'Use T₂ = T₁(D₂/D₁)^e. T₁ is known finish time, D₁ is known distance, D₂ is target distance in the same unit, and e is the editable endurance exponent. Projected time T₂ uses the original time unit.|使用 T₂ = T₁(D₂/D₁)^e。T₁ 为已知完成时间，D₁ 为已知距离，D₂ 为同单位目标距离，e 为可编辑耐力指数；推算时间 T₂ 使用原时间单位。',
    [25 * 2 ** 1.06, 2.5 * 2 ** 1.06],
    'Empirical power-law projection; exponent 1.06 is only a starting assumption. Fitness, terrain, weather and distance affect accuracy.|经验幂律推算，1.06 仅为初始假设；体能、地形、天气及距离影响准确度。',
  );
  D(
    'running-splits',
    'Even Pace Running Splits|匀速跑步分段',
    'Calculate split duration and the final partial split.|计算匀速分段用时及最后不足一段的时间。',
    [
      p('d', 'Total distance (km)|总距离（km）', 10),
      p('t', 'Target finish time (minutes)|目标完成时间（分钟）', 50),
      p('s', 'Split length (km)|分段长度（km）', 1),
    ],
    (v) => {
      const count = Math.floor(v.d / v.s + 1e-12),
        rem = Math.max(0, v.d - count * v.s);
      return [
        R('Full split time|完整分段用时', (v.t / v.d) * v.s, 'minutes'),
        R('Full split count|完整段数', count),
        R('Final partial distance|最后不足一段距离', rem, 'km'),
        R('Final partial time|最后不足一段用时', (v.t / v.d) * rem, 'minutes'),
      ];
    },
    'Use t = Ts/D. T is total finish time in minutes, s is split length, and D is total distance in the same distance unit. t is full-split time in minutes under an even-pace assumption.|使用 t = Ts/D。T 为总完成时间（分钟），s 为分段长度，D 为总距离，两个距离使用相同单位；t 为匀速假设下完整分段的用时（分钟）。',
    [5, 10, 0, 0],
  );
  D(
    'run-walk-interval',
    'Run Walk Intervals|跑走间歇',
    'Combine running and walking intervals into a session plan.|将跑步与步行间歇组合成训练时长与距离。',
    [
      p('r', 'Run minutes per cycle|每轮跑步分钟', 3),
      n('w', 'Walk minutes per cycle|每轮步行分钟', 1),
      i('n', 'Cycles|轮数', 10, 1, 10000),
      n('rs', 'Running speed (km/h)|跑步速度（km/h）', 10),
      n('ws', 'Walking speed (km/h)|步行速度（km/h）', 5),
    ],
    (v) => [
      R('Session duration|总时长', (v.r + v.w) * v.n, 'minutes'),
      R('Estimated distance|估计距离', ((v.r * v.rs + v.w * v.ws) * v.n) / 60, 'km'),
    ],
    'Use T = n(r+w) and D = n(ra+wb)/60. n is cycles; r and w are running and walking minutes per cycle. a and b are the corresponding speeds in km/h. T is minutes and D is km.|使用 T = n(r+w) 及 D = n(ra+wb)/60。n 为轮数，r 与 w 为每轮跑步及步行分钟数，a 与 b 为对应速度（km/h）；T 的单位为分钟，D 的单位为 km。',
    [40, 35 / 6],
  );
  D(
    'swimming-pace',
    'Swimming Pace|游泳配速',
    'Calculate pace per 100 metres and lengths in a pool.|计算每百米配速与泳池趟数。',
    [
      p('d', 'Swim distance (m)|游泳距离（m）', 1000),
      p('t', 'Elapsed time (minutes)|用时（分钟）', 20),
      p('l', 'Pool length (m)|泳池长度（m）', 25),
    ],
    (v) => [
      R('Pace per 100 m|每百米配速', (100 * v.t) / v.d, 'minutes'),
      R('Pool lengths|泳池趟数', v.d / v.l),
      R('Average speed|平均速度', v.d / v.t / 60, 'm/s'),
    ],
    'Use P = 100t/d. t is elapsed time in minutes and d is distance in m. P is minutes per 100 m. Pool lengths equal distance divided by pool length.|使用 P = 100t/d。t 为用时（分钟），d 为距离（m），P 为每 100 m 的分钟数；泳池趟数为总距离除以泳池长度。',
    [2, 40, 5 / 6],
  );
  D(
    'cycling-power-weight',
    'Cycling Power to Weight|骑行功率体重比',
    'Compare cycling power with rider mass.|比较骑行功率与骑手体重。',
    [n('p', 'Measured power (W)|实测功率（W）', 250), weight],
    (v) => [R('Power to body mass|功率体重比', v.p / v.w, 'W/kg')],
    'Use R = P/m. P is measured power in W and m is body mass in kg. Relative power is in W/kg.|使用 R = P/m。P 为实测功率，单位为 W；m 为体重，单位为 kg。功率体重比的单位为 W/kg。',
    [10 / 3],
  );
  D(
    'cycling-gearing-speed',
    'Cycling Gearing Speed|自行车齿比速度',
    'Convert cadence and gear ratio into theoretical road speed.|由踏频与齿比计算理论行驶速度。',
    [
      n('c', 'Cadence (rpm)|踏频（rpm）', 90),
      i('f', 'Front chainring teeth|前齿盘齿数', 50, 1, 200),
      i('r', 'Rear sprocket teeth|后飞轮齿数', 25, 1, 200),
      p('w', 'Wheel rollout circumference (m)|车轮实测周长（m）', 2.1),
    ],
    (v) => [
      R('Theoretical speed|理论速度', ((v.c * v.f) / v.r) * v.w * 0.06, 'km/h'),
      R('Distance per crank revolution|每转曲柄行进距离', (v.f / v.r) * v.w, 'm'),
    ],
    'Use v = c(F/R)C×0.06. c is cadence in revolutions per minute, F and R are front and rear tooth counts, and C is loaded wheel circumference in m. Speed v is in km/h.|使用 v = c(F/R)C×0.06。c 为每分钟踏频，F 与 R 为前后齿数，C 为负载轮周（m）；速度 v 的单位为 km/h。',
    [22.68, 4.2],
    'Assumes no wheel slip and accurate loaded wheel circumference; wind and gradients affect the power required.|假设车轮不打滑且负载轮周测量准确；风与坡度影响所需功率。',
  );
  D(
    'running-cadence-speed',
    'Running Cadence and Step Length|跑步步频步长',
    'Combine steps per minute and length per step.|结合每分钟步数与单步步长。',
    [
      n('c', 'Cadence (steps/min)|步频（步/分钟）', 180),
      p('s', 'Length per single step (m)|单步长度（m）', 1),
    ],
    (v) => [
      R('Running speed|跑步速度', v.c * v.s * 0.06, 'km/h'),
      R('Distance in one minute|一分钟距离', v.c * v.s, 'm'),
    ],
    'Use v = cs×0.06. c is cadence in steps per minute and s is the length of a single step in m. Speed v is in km/h.|使用 v = cs×0.06。c 为每分钟步数，s 为单步长度（m）；速度 v 的单位为 km/h。',
    [10.8, 180],
    'A step is one foot contact, not a full two-step stride.|这里一步指一次脚触地，不是左右两步的完整步幅。',
  );
  D(
    'jump-height-flight-time',
    'Jump Height from Flight Time|腾空时间估计跳高',
    'Estimate vertical rise from a measured flight interval.|由测量腾空时间估计竖直上升高度。',
    [
      n('t', 'Flight time (seconds)|腾空时间（秒）', 0.5, 0, 3),
      p('g', 'Local gravity (m/s²)|当地重力加速度（m/s²）', 9.80665),
    ],
    (v) => [
      R('Estimated centre-of-mass rise|估计重心上升高度', ((v.g * v.t * v.t) / 8) * 100, 'cm'),
    ],
    'h=gt²/8',
    [30.64578125],
    'Assumes takeoff and landing centre-of-mass heights are equal, symmetric flight and no air resistance. Landing posture can bias this estimate.|假设起跳与落地重心等高、飞行对称且忽略空气阻力；落地姿势可能造成偏差。',
  );
  D(
    'training-monotony',
    'Weekly Training Monotony|周训练单调度',
    'Summarize seven daily load values, including rest days.|汇总含休息日在内的七天负荷。',
    [
      text(
        'x',
        'Exactly seven daily loads, include zeros for rest|恰好七天负荷（休息日填 0）',
        '100,200,300,0,100,200,500',
      ),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.length === 7 && a.every((x) => x >= 0),
        'Enter exactly seven nonnegative daily loads.|请输入恰好七个非负日负荷。',
      );
      const m = mean(a),
        sd = Math.sqrt(variance(a, false));
      return [
        R('Weekly total load|周总负荷', sum(a), 'AU'),
        R(
          'Monotony, population SD convention|单调度（总体标准差口径）',
          sd > 0 ? m / sd : 'Undefined at zero variability|无变化时无定义',
        ),
        R(
          'Training strain|训练应激',
          sd > 0 ? (sum(a) * m) / sd : 'Undefined at zero variability|无变化时无定义',
        ),
      ];
    },
    'Use M = μ/σ and S = LM. μ is mean daily load, σ is population standard deviation of the seven entered daily loads, and L is their sum. Monotony M and strain S are undefined when daily variation is zero.|使用 M = μ/σ 及 S = LM。μ 为日均负荷，σ 为所填七天负荷的总体标准差，L 为七天负荷之和；日负荷无变化时，单调度 M 和训练应激 S 均无定义。',
    [1400, Math.sqrt(7 / 4)],
    'Uses population SD of all seven days. Monitoring summary only; no injury prediction or safe-load threshold is inferred.|采用七天总体标准差，仅作监测汇总；不推断伤病概率或安全负荷阈值。',
  );
  D(
    'exercise-sweat-rate',
    'Exercise Sweat Rate Estimate|运动出汗率估计',
    'Estimate fluid loss from mass change, drinking and urine.|由体重变化、饮水与排尿估算体液损失。',
    [
      p('a', 'Pre-exercise mass (kg)|运动前体重（kg）', 75),
      p('b', 'Post-exercise mass (kg)|运动后体重（kg）', 74.5),
      n('d', 'Fluid consumed (L)|饮入液体（L）', 0.5),
      n('u', 'Urine produced (L)|排尿量（L）', 0),
      p('t', 'Exercise duration (hours)|运动时长（小时）', 1),
    ],
    (v) => {
      const loss = v.a - v.b + v.d - v.u;
      check(
        loss >= 0,
        'These measurements imply negative sweat loss; check mass, intake and urine.|这些测量推算为负出汗量，请核对体重、饮入与排尿。',
      );
      return [
        R('Estimated sweat rate|估计出汗率', loss / v.t, 'L/h'),
        R('Estimated sweat loss|估计出汗量', loss, 'L'),
      ];
    },
    'Estimate L = A−B+D−U and R = L/t. A and B are pre- and post-exercise mass in kg; D and U are drink and urine volumes in L; t is hours. The approximation treats a kilogram of mass change as a litre of fluid; R is in L/h.|估算 L = A−B+D−U 及 R = L/t。A 与 B 为运动前后体重（kg），D 与 U 为饮入及排尿体积（L），t 为小时数；近似将一千克体重变化视为一升体液，R 的单位为 L/h。',
    [1, 1],
    'Approximation treats 1 kg mass change as 1 L and omits respiratory/metabolic changes. This is not a fluid or sodium intake prescription.|近似将 1 kg 质量变化视为 1 L，忽略呼吸与代谢变化；不构成补液或补钠处方。',
  );
  D(
    'macronutrient-energy',
    'Macronutrient Energy|三大营养素能量',
    'Convert entered protein, carbohydrate and fat grams to label-style energy.|将自填蛋白质、碳水与脂肪克数换算为常见标签能量。',
    [
      n('p', 'Protein (g)|蛋白质（g）', 30),
      n('c', 'Available carbohydrate (g)|可利用碳水（g）', 50),
      n('f', 'Fat (g)|脂肪（g）', 10),
    ],
    (v) => [
      R('Estimated energy|估计能量', 4 * v.p + 4 * v.c + 9 * v.f, 'kcal'),
      R('Protein energy|蛋白质能量', 4 * v.p, 'kcal'),
      R('Carbohydrate energy|碳水能量', 4 * v.c, 'kcal'),
      R('Fat energy|脂肪能量', 9 * v.f, 'kcal'),
    ],
    'Use E = 4P+4C+9F. P, C and F are grams of protein, available carbohydrate and fat. Estimated energy E is in kcal, using general food-label factors.|使用 E = 4P+4C+9F。P、C、F 分别为蛋白质、可利用碳水和脂肪的克数；使用通用食品标签系数，能量估算值 E 的单位为 kcal。',
    [410, 120, 200, 90],
    'General 4/4/9 factors; fibre, sugar alcohols, organic acids and food-specific factors can differ. This does not recommend macro targets.|使用通用 4/4/9 系数；纤维、糖醇、有机酸及食物特定系数可能不同，不建议营养素目标。',
  );
  D(
    'food-energy-density',
    'Food Energy Density|食物能量密度',
    'Scale a serving’s energy to 100 grams or another serving weight.|将一份食物能量换算至每百克或其他份量。',
    [
      n('e', 'Energy in measured portion (kcal)|测量份能量（kcal）', 250),
      p('w', 'Measured portion mass (g)|测量份质量（g）', 100),
      n('s', 'Target serving mass (g)|目标份量（g）', 60),
    ],
    (v) => [
      R('Energy per 100 g|每百克能量', (100 * v.e) / v.w, 'kcal'),
      R('Target serving energy|目标份能量', (v.e * v.s) / v.w, 'kcal'),
    ],
    'Use d = E/W and Q = ds. E is measured-portion energy in kcal, W is its mass in g, and s is target serving mass in g. d is energy per gram and Q is target serving energy in kcal.|使用 d = E/W 及 Q = ds。E 为测量份能量（kcal），W 为该份质量（g），s 为目标份质量（g）；d 为每克能量，Q 为目标份能量（kcal）。',
    [250, 150],
  );
  D(
    'alcohol-content',
    'Alcohol Content in Grams|饮品纯酒精含量',
    'Convert drink volume and ABV to an estimated ethanol mass.|由饮品体积与酒精体积比估计纯酒精质量。',
    [
      n('v', 'Drink volume (mL)|饮品体积（mL）', 500),
      n('a', 'Alcohol by volume (%)|酒精体积比（%）', 5, 0, 100),
      p('s', 'Grams in your local standard drink|当地一标准杯酒精克数', 10),
    ],
    (v) => {
      const g = ((v.v * v.a) / 100) * 0.789;
      return [
        R('Pure alcohol mass|纯酒精质量', g, 'g'),
        R('Entered standard-drink equivalents|按自填标准杯折算', g / v.s),
      ];
    },
    'Use G = Va×0.789. V is drink volume in mL and a is alcohol by volume as a fraction. G is estimated ethanol mass in g. Divide by your entered grams per standard drink for standard-drink equivalents.|使用 G = Va×0.789。V 为饮品体积（mL），a 为酒精体积比的小数比例，G 为估计纯酒精质量（g）；除以自填每标准杯酒精克数，即得标准杯折算数。',
    [19.725, 1.9725],
    'Approximate ethanol density at room temperature. Standard-drink definitions vary; this does not estimate blood alcohol, driving fitness or a safe consumption limit.|使用室温近似酒精密度；标准杯定义因地区而异，不估计血液酒精、驾驶能力或安全饮用上限。',
  );
  D(
    'sleep-efficiency',
    'Sleep Efficiency|睡眠效率',
    'Compare estimated time asleep with time spent in bed.|比较估计睡着时长与在床时长。',
    [
      p('b', 'Time in bed (minutes)|在床时长（分钟）', 480),
      n('l', 'Sleep onset latency (minutes)|入睡等待（分钟）', 20),
      n('w', 'Awake after sleep onset (minutes)|入睡后清醒（分钟）', 40),
    ],
    (v) => {
      check(v.l + v.w <= v.b, 'Awake time cannot exceed time in bed.|清醒时间不得超过在床时长。');
      const t = v.b - v.l - v.w;
      return [
        R('Sleep efficiency|睡眠效率', (100 * t) / v.b, '%'),
        R('Estimated time asleep|估计睡着时长', t, 'minutes'),
      ];
    },
    'Use E = (B−L−W)/B. B is time in bed, L is sleep-onset latency, and W is later awake time, all in minutes. Sleep efficiency E is a fraction, displayed as a percentage.|使用 E = (B−L−W)/B。B 为在床时长，L 为入睡等待，W 为入睡后清醒时长，均使用分钟；睡眠效率 E 为比例，结果以百分比显示。',
    [87.5, 420],
    'Self-reported estimate; not a sleep-disorder diagnosis or a replacement for a sleep study.|自我报告估算，不用于睡眠障碍诊断，也不能替代睡眠检查。',
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, i, text, select, row: R, check, nums, PI, deg } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Planning estimate from your measurements and assumptions. Confirm dimensions, product coverage and local installation requirements before buying.|按自填测量与假设进行规划估算；采购前请核实尺寸、产品覆盖率及当地安装要求。',
  ) => add(s, name, 'Home and Everyday', purpose, f, calc, formula, e, note);
  const area = p('a', 'Net area (m²)|净面积（m²）', 20),
    waste = n('w', 'Waste allowance (%)|损耗余量（%）', 10, 0, 100);
  D(
    'tile-quantity',
    'Tile Quantity|瓷砖数量',
    'Convert a floor area into tiles, boxes and waste allowance.|将铺设面积换算为瓷砖、箱数与损耗余量。',
    [
      area,
      p('l', 'Tile length (cm)|瓷砖长度（cm）', 50),
      p('b', 'Tile width (cm)|瓷砖宽度（cm）', 50),
      i('q', 'Tiles per box|每箱片数', 8, 1, 1000),
      waste,
    ],
    (v) => {
      const q = Math.ceil((v.a * (1 + v.w / 100)) / ((v.l * v.b) / 10000) - 1e-10);
      return [
        R('Tiles needed|所需片数', q),
        R('Boxes to buy|应购箱数', Math.ceil(q / v.q)),
        R('Area including waste|含损耗面积', v.a * (1 + v.w / 100), 'm²'),
      ];
    },
    'Use N = ceil[A(1+w)/(lb)]. A is net area in m², l and b are tile dimensions converted to m, and w is waste allowance as a fraction. ceil rounds up to whole tiles; boxes are rounded up separately.|使用 N = ceil[A(1+w)/(lb)]。A 为净面积（m²），l 与 b 为换算成 m 的瓷砖长宽，w 为损耗比例；ceil 表示向上取整为片数，箱数另外向上取整。',
    [88, 11, 22],
  );
  D(
    'brick-quantity',
    'Brick Quantity|砖块用量',
    'Estimate one-layer wall bricks allowing for mortar joints and openings.|考虑灰缝及洞口估计单层墙砖数。',
    [
      p('a', 'Gross wall area (m²)|墙体总面积（m²）', 10),
      n('o', 'Opening area (m²)|洞口面积（m²）', 0),
      p('l', 'Brick face length (mm)|砖面长度（mm）', 190),
      p('h', 'Brick face height (mm)|砖面高度（mm）', 90),
      n('j', 'Mortar joint (mm)|灰缝（mm）', 10),
      waste,
    ],
    (v) => {
      check(v.o < v.a, 'Openings must be smaller than gross wall area.|洞口应小于墙体总面积。');
      return [
        R(
          'Estimated bricks|估计砖数',
          Math.ceil((((v.a - v.o) * 1e6) / ((v.l + v.j) * (v.h + v.j))) * (1 + v.w / 100) - 1e-10),
        ),
      ];
    },
    'Use N = ceil[(A−O)(1+w)/((l+j)(h+j))]. A and O are wall and opening areas in m²; brick face dimensions l, h and joint width j are converted to m. w is the waste fraction and ceil rounds up.|使用 N = ceil[(A−O)(1+w)/((l+j)(h+j))]。A 与 O 为墙体及洞口面积（m²）；砖面长高 l、h 与灰缝宽 j 均换算为 m。w 为损耗比例，ceil 表示向上取整。',
    [550],
    'Single face layer only; bonding pattern, corners and structural wall thickness require a separate takeoff.|仅单面一层；砌筑方式、转角与结构墙厚需另行算量。',
  );
  D(
    'wallpaper-rolls',
    'Wallpaper Rolls|壁纸卷数',
    'Calculate full-height strips with repeat-pattern matching.|按完整高度条带和图案重复匹配计算卷数。',
    [
      p('p', 'Wall perimeter to cover (m)|待贴墙面周长（m）', 10),
      p('h', 'Wall height (m)|墙高（m）', 2.5),
      p('w', 'Roll width (m)|每卷宽度（m）', 0.5),
      p('l', 'Roll length (m)|每卷长度（m）', 10),
      n('r', 'Pattern repeat (m), zero for none|图案重复长度（m，无则 0）', 0),
      n('t', 'Trim allowance per strip (m)|每条修边余量（m）', 0),
    ],
    (v) => {
      const length = v.r > 0 ? Math.ceil((v.h + v.t) / v.r - 1e-10) * v.r : v.h + v.t,
        count = Math.floor(v.l / length + 1e-10),
        strips = Math.ceil(v.p / v.w - 1e-10);
      check(count >= 1, 'A roll must fit at least one full strip.|每卷至少应能裁出一条完整条带。');
      return [
        R('Rolls needed|所需卷数', Math.ceil(strips / count)),
        R('Strips required|所需条数', strips),
        R('Usable strips per roll|每卷可用条数', count),
        R('Cut length per strip|每条裁切长度', length, 'm'),
      ];
    },
    'For r = 0, cut length is c = h+t; for r > 0, use c = r ceil((h+t)/r). Rolls are N = ceil[ceil(P/w)/floor(L/c)]. h is wall height, t is trim, r is pattern repeat, P is wall perimeter, w is roll width, and L is roll length, all in m. ceil rounds up and floor rounds down.|当 r = 0 时，裁切长度为 c = h+t；当 r > 0 时，使用 c = r ceil((h+t)/r)。卷数为 N = ceil[ceil(P/w)/floor(L/c)]。h 为墙高，t 为修边余量，r 为花纹重复长度，P 为墙面周长，w 为卷宽，L 为卷长，均使用 m；ceil 表示向上取整，floor 表示向下取整。',
    [5, 20, 4, 2.5],
  );
  D(
    'flooring-packs',
    'Flooring Packs|地板包数',
    'Calculate whole packs and total area bought.|计算整包地板及采购总覆盖面积。',
    [
      area,
      p('p', 'Coverage per pack (m²)|每包覆盖面积（m²）', 2),
      waste,
      n('c', 'Price per pack|每包价格', 50),
    ],
    (v) => {
      const q = Math.ceil((v.a * (1 + v.w / 100)) / v.p - 1e-10);
      return [
        R('Packs to buy|应购包数', q),
        R('Purchased coverage|采购覆盖面积', q * v.p, 'm²'),
        R('Material cost|材料成本', q * v.c),
      ];
    },
    'Use N = ceil[A(1+w)/C]. A is net area and C is coverage per pack in the same area unit. w is the waste fraction. ceil rounds up to whole packs.|使用 N = ceil[A(1+w)/C]。A 为净面积，C 为每包覆盖面积，使用相同面积单位；w 为损耗比例，ceil 表示向上取整为整包数。',
    [11, 22, 550],
  );
  D(
    'carpet-roll-length',
    'Carpet Roll Length|地毯卷长',
    'Compare two rectangular orientations using fixed-width carpet.|比较固定卷宽地毯的两种铺设方向。',
    [
      p('l', 'Room length (m)|房间长度（m）', 5),
      p('w', 'Room width (m)|房间宽度（m）', 4),
      p('r', 'Carpet roll width (m)|地毯卷宽（m）', 4),
      n('a', 'Extra trim on each strip (m)|每条额外修边（m）', 0),
    ],
    (v) => {
      const a = Math.ceil(v.w / v.r) * (v.l + v.a),
        b = Math.ceil(v.l / v.r) * (v.w + v.a);
      return [
        R('Lower roll-length requirement|较少所需卷长', Math.min(a, b), 'm'),
        R('Lengthwise roll requirement|顺长铺卷长', a, 'm'),
        R('Widthwise roll requirement|顺宽铺卷长', b, 'm'),
        R('Purchased carpet area|购买地毯面积', Math.min(a, b) * v.r, 'm²'),
      ];
    },
    'Compare L₁ = ceil(W/R)(L+t) and L₂ = ceil(L/R)(W+t), then choose the smaller requirement. L and W are room length and width, R is carpet roll width, and t is extra trim on each strip, all in m. ceil rounds the strip count up.|比较 L₁ = ceil(W/R)(L+t) 与 L₂ = ceil(L/R)(W+t)，取较小用量。L 与 W 为房间长宽，R 为地毯卷宽，t 为每条额外修边余量，均使用 m；ceil 表示将条数向上取整。',
    [5, 5, 8, 20],
    'Rectangular room, joined parallel strips and no pattern matching. Confirm seam placement and pile direction with the installer.|矩形房间、平行拼接条带且不匹配图案；请与安装者确认接缝位置及绒毛方向。',
  );
  D(
    'tile-grout',
    'Tile Grout Quantity|瓷砖填缝剂',
    'Estimate joint volume and grout mass from a repeating tile grid.|由重复瓷砖网格估计灰缝体积与填缝剂质量。',
    [
      area,
      p('l', 'Tile length (mm)|瓷砖长（mm）', 300),
      p('b', 'Tile width (mm)|瓷砖宽（mm）', 300),
      n('j', 'Joint width (mm)|缝宽（mm）', 3),
      n('d', 'Joint depth (mm)|缝深（mm）', 5),
      p('rho', 'Mixed grout density (kg/L)|混合填缝剂密度（kg/L）', 1.6),
      waste,
    ],
    (v) => {
      const l = v.a * (1 - (v.l * v.b) / ((v.l + v.j) * (v.b + v.j))) * v.d;
      return [
        R('Grout mass including waste|含损耗填缝剂质量', l * v.rho * (1 + v.w / 100), 'kg'),
        R('Joint volume|缝体积', l, 'L'),
      ];
    },
    'Use f = 1−lb/[(l+j)(b+j)] and V = Afd. l, b and j are tile length, width and joint width in the same unit; A is area in m² and d is joint depth in mm. V is litres; mass also includes entered density and waste.|使用 f = 1−lb/[(l+j)(b+j)] 及 V = Afd。l、b、j 为同单位的砖长、砖宽与缝宽；A 为面积（m²），d 为缝深（mm）；V 的单位为升，质量还计入自填密度与损耗。',
    [(180900 / 91809) * 1.76, 180900 / 91809],
  );
  D(
    'gravel-base',
    'Compacted Gravel Base|压实碎石基层',
    'Allow for compaction and convert loose volume into delivery mass.|考虑压实并将松散体积换算为配送质量。',
    [
      area,
      p('d', 'Compacted depth (cm)|压实厚度（cm）', 10),
      n('c', 'Extra loose volume for compaction (%)|压实所需额外松散体积（%）', 20, 0, 200),
      p('rho', 'Loose bulk density (kg/m³)|松散堆积密度（kg/m³）', 1600),
    ],
    (v) => {
      const loose = ((v.a * v.d) / 100) * (1 + v.c / 100);
      return [
        R('Loose volume to order|应订松散体积', loose, 'm³'),
        R('Estimated delivered mass|估计配送质量', (loose * v.rho) / 1000, 'tonnes'),
      ];
    },
    'Use V = Ad(1+c). A is area in m², d is finished depth converted to m, and c is the extra loose-volume fraction for compaction. Loose volume V is in m³.|使用 V = Ad(1+c)。A 为面积（m²），d 为换算成 m 的压实厚度，c 为压实所需额外松散体积比例；松散体积 V 的单位为 m³。',
    [2.4, 3.84],
  );
  D(
    'mulch-bags',
    'Mulch Bags|覆盖物袋数',
    'Convert garden area and layer depth into whole bags.|将花园面积及覆盖厚度换算为整袋数量。',
    [
      area,
      n('d', 'Layer depth (cm)|覆盖厚度（cm）', 5),
      p('b', 'Volume per bag (L)|每袋体积（L）', 50),
    ],
    (v) => {
      const litres = v.a * v.d * 10;
      return [
        R('Bags needed|所需袋数', Math.ceil(litres / v.b - 1e-10)),
        R('Total coverage volume|总覆盖体积', litres, 'L'),
      ];
    },
    'Use V = 10Ad and N = ceil(V/B). A is area in m², d is depth in cm, and B is litres per bag. V is litres and ceil rounds up to whole bags.|使用 V = 10Ad 及 N = ceil(V/B)。A 为面积（m²），d 为厚度（cm），B 为每袋升数；V 的单位为升，ceil 表示向上取整为整袋数。',
    [20, 1000],
  );
  D(
    'wall-stud-layout',
    'Wall Stud Layout|墙柱间距布置',
    'Estimate equally spaced stud positions including both wall ends.|估计包含墙两端的等间距墙柱位置数。',
    [
      p('l', 'Wall length (m)|墙长（m）', 4.8),
      p('s', 'Maximum centre spacing (mm)|最大中心间距（mm）', 600),
    ],
    (v) => [
      R('Basic stud positions|基本墙柱位置数', Math.ceil((v.l * 1000) / v.s - 1e-10) + 1),
      R('Equalized spacing|等分间距', (v.l * 1000) / Math.ceil((v.l * 1000) / v.s - 1e-10), 'mm'),
    ],
    'Use N = ceil(L/s)+1. L is wall length and s is maximum centre spacing, converted to the same unit. ceil rounds up the number of intervals; the extra position includes both ends.|使用 N = ceil(L/s)+1。L 为墙长，s 为最大中心间距，两者换算至同一单位；ceil 将间隔数向上取整，再增加一个位置以包含两端。',
    [9, 600],
    'Layout count only. Doors, corners, double studs, loads, bracing and code compliance require a construction plan.|仅计算布置数量；门洞、转角、双柱、荷载、支撑与规范合规需施工图确认。',
  );
  D(
    'asphalt-quantity',
    'Asphalt Quantity|沥青用量',
    'Convert area and compacted thickness into material mass.|由面积与压实厚度计算材料质量。',
    [
      area,
      p('d', 'Compacted thickness (cm)|压实厚度（cm）', 5),
      p('rho', 'Compacted density (kg/m³)|压实密度（kg/m³）', 2400),
      waste,
    ],
    (v) => [
      R(
        'Material including allowance|含余量材料质量',
        (((v.a * v.d) / 100) * v.rho * (1 + v.w / 100)) / 1000,
        'tonnes',
      ),
    ],
    'Use M = Adρ(1+w). A is area in m², d is compacted thickness converted to m, ρ is density in kg/m³, and w is the waste fraction. M is kilograms before conversion to tonnes.|使用 M = Adρ(1+w)。A 为面积（m²），d 为换算成 m 的压实厚度，ρ 为密度（kg/m³），w 为损耗比例；M 为千克数，随后换算成吨显示。',
    [2.64],
  );
  D(
    'roof-pitch',
    'Roof Pitch and Area|屋顶坡度与面积',
    'Convert rise and run to pitch angle and sloping area.|由升高与水平距离求坡角及斜面面积。',
    [
      n('r', 'Roof rise (m)|屋顶升高（m）', 3),
      p('l', 'Horizontal run (m)|水平距离（m）', 4),
      p('a', 'Horizontal projected roof area (m²)|屋顶水平投影面积（m²）', 80),
    ],
    (v) => [
      R('Roof angle|屋顶坡角', deg(Math.atan(v.r / v.l)), '°'),
      R('Slope rise per 12 run|水平 12 对应升高', (12 * v.r) / v.l),
      R('Sloping area|斜面面积', (v.a * Math.hypot(v.r, v.l)) / v.l, 'm²'),
    ],
    'Use θ = atan(r/l) and S = A√(1+(r/l)²). r is roof rise and l is horizontal run in the same unit. A is horizontal projected area and S is sloping area in the same area unit. The angle is displayed in degrees.|使用 θ = atan(r/l) 及 S = A√(1+(r/l)²)。r 为屋顶升高，l 为同单位水平距离；A 为水平投影面积，S 为同面积单位的斜面面积，坡角以度显示。',
    [36.86989764584402, 9, 100],
  );
  D(
    'stair-layout',
    'Stair Layout|楼梯踏步布置',
    'Divide total rise into equal risers under an entered height limit.|按自填高度上限将总升高分为等高踏步。',
    [
      p('h', 'Total rise (mm)|总升高（mm）', 2800),
      p('r', 'Maximum preferred riser (mm)|偏好最大踢面高度（mm）', 180),
      p('g', 'Tread going (mm)|踏面进深（mm）', 250),
    ],
    (v) => {
      const k = Math.ceil(v.h / v.r);
      return [
        R('Riser count|踢面数', k),
        R('Actual riser height|实际踢面高度', v.h / k, 'mm'),
        R('Treads before upper landing|上平台前踏面数', k - 1),
        R('Straight horizontal run|直梯水平长度', (k - 1) * v.g, 'mm'),
      ];
    },
    'Use N = ceil(H/r) and T = N−1. H is total rise and r is the preferred maximum riser height in the same unit. ceil rounds up; T counts treads before the upper landing. Actual riser height is H/N.|使用 N = ceil(H/r) 及 T = N−1。H 为总升高，r 为同单位的偏好最大踢面高度；ceil 表示向上取整，T 为上平台前踏面数，实际踢面高度为 H/N。',
    [16, 175, 15, 3750],
    'Geometry sketch only; not a building-code check. Headroom, landings, guards and local accessibility rules are excluded.|仅几何草算，不检查建筑规范；不含净空、平台、护栏与当地无障碍规定。',
  );
  D(
    'ramp-gradient',
    'Ramp Gradient|坡道坡度',
    'Compare rise and horizontal run with actual ramp length.|比较升高、水平距离与实际坡长。',
    [n('h', 'Rise (m)|升高（m）', 0.5), p('l', 'Horizontal run (m)|水平距离（m）', 6)],
    (v) => [
      R('Gradient|坡度', (100 * v.h) / v.l, '%'),
      R('Ramp length|坡长', Math.hypot(v.h, v.l), 'm'),
      R('Angle|坡角', deg(Math.atan(v.h / v.l)), '°'),
    ],
    'Use g = h/l and s = √(h²+l²). h is rise and l is horizontal run in the same unit. Gradient g is displayed as a percentage; ramp length s keeps the distance unit.|使用 g = h/l 及 s = √(h²+l²)。h 为升高，l 为同单位水平距离；坡度 g 以百分比显示，坡长 s 使用原距离单位。',
    [25 / 3, Math.sqrt(36.25), 4.763641690726178],
    'Describes geometry; does not certify wheelchair access or compliance with local ramp standards.|仅描述几何形状，不认证轮椅通行或当地坡道规范合规。',
  );
  D(
    'fence-posts',
    'Fence Post Count|围栏立柱数量',
    'Count posts for a straight run or a closed loop.|计算直线或闭合围栏所需立柱。',
    [
      p('l', 'Fence length (m)|围栏长度（m）', 30),
      p('s', 'Maximum post spacing (m)|最大柱距（m）', 2.5),
      select('loop', 'Fence shape|围栏形状', 'open', [
        ['open', 'Open straight run|开放直线'],
        ['closed', 'Closed loop|闭合环线'],
      ]),
    ],
    (v) => [
      R('Posts needed|所需立柱', Math.ceil(v.l / v.s - 1e-10) + (v.loop === 'open' ? 1 : 0)),
      R('Equal spacing|等分柱距', v.l / Math.ceil(v.l / v.s - 1e-10), 'm'),
    ],
    'Let n = ceil(L/s), where L is fence length and s is maximum post spacing in the same unit. Open-run post count is n+1; a closed loop uses n posts. ceil rounds up.|设 n = ceil(L/s)，其中 L 为围栏长度，s 为同单位的最大柱距；开放直线需 n+1 根立柱，闭合环线需 n 根。ceil 表示向上取整。',
    [13, 2.5],
    'No gates, corners, intermediate bracing or terrain changes are included.|不含门、转角、中间支撑或地形变化。',
  );
  D(
    'decking-boards',
    'Decking Board Layout|露台板布置',
    'Estimate board rows with a specified gap and stock length.|按留缝与库存板长估计板排和用量。',
    [
      p('l', 'Deck length along boards (m)|沿板方向长度（m）', 5),
      p('w', 'Deck width (m)|露台宽度（m）', 3),
      p('b', 'Board width (mm)|板宽（mm）', 140),
      n('g', 'Gap between boards (mm)|板间缝（mm）', 10),
      p('s', 'Stock board length (m)|库存板长（m）', 5),
    ],
    (v) => {
      const rows = Math.ceil((v.w * 1000 + v.g) / (v.b + v.g) - 1e-10),
        pieces = rows * Math.ceil(v.l / v.s - 1e-10);
      return [
        R('Board rows|板排数', rows),
        R('Stock boards without cut reuse|不复用裁片的库存板数', pieces),
        R('Installed linear board length|安装板材延米', rows * v.l, 'm'),
      ];
    },
    'Use N = ceil[(W+g)/(b+g)]. W is deck width, b is board width, and g is the gap, all in the same unit. ceil rounds up to board rows. Stock board count also accounts for length without reusing cut pieces.|使用 N = ceil[(W+g)/(b+g)]。W 为露台宽，b 为板宽，g 为板间缝，均使用同一单位；ceil 表示向上取整为板排数，库存板数还计入长度且不复用裁片。',
    [21, 21, 105],
  );
  D(
    'board-feet',
    'Lumber Board Feet|木材板英尺',
    'Measure lumber volume using nominal inch dimensions.|用英寸标称尺寸计算板英尺。',
    [
      p('t', 'Thickness (in)|厚度（in）', 2),
      p('w', 'Width (in)|宽度（in）', 6),
      p('l', 'Length (ft)|长度（ft）', 8),
      i('q', 'Piece count|件数', 10, 1, 100000),
    ],
    (v) => [
      R('Total board feet|总板英尺', (v.t * v.w * v.l * v.q) / 12, 'board ft'),
      R('Physical volume|体积', ((v.t * v.w * v.l * v.q) / 12) * 0.002359737216, 'm³'),
    ],
    'Use B = twLq/12. t and w are thickness and width in in, L is length in ft, and q is piece count. B is total board feet.|使用 B = twLq/12。t 与 w 为厚度及宽度（in），L 为长度（ft），q 为件数；B 为总板英尺。',
    [80, 0.18877897728],
  );
  D(
    'linear-cut-yield',
    'Linear Cut Yield|直料裁切利用率',
    'Account for blade kerf when cutting repeated equal pieces.|裁切等长材料时计入锯缝。',
    [
      p('l', 'Stock length (mm)|原料长度（mm）', 2400),
      p('p', 'Finished piece length (mm)|成品长度（mm）', 500),
      n('k', 'Saw kerf per cut (mm)|每刀锯缝（mm）', 3),
    ],
    (v) => {
      const q = Math.floor((v.l + v.k) / (v.p + v.k) + 1e-10),
        used = q * v.p + Math.max(0, q - 1) * v.k;
      return [
        R('Whole pieces|完整件数', q),
        R(
          'Remaining length before any final separation cut|未计末次分离刀的余长',
          v.l - used,
          'mm',
        ),
        R('Finished material yield|成品材料利用率', (100 * q * v.p) / v.l, '%'),
      ];
    },
    'Use N = floor[(L+k)/(p+k)]. L is stock length, p is finished piece length, and k is saw kerf in the same unit. floor rounds down. This counts kerf between pieces; a final separation cut may need another kerf.|使用 N = floor[(L+k)/(p+k)]。L 为原料长，p 为成品长，k 为同单位锯缝；floor 表示向下取整。仅计成品间锯缝，末次切离余料可能还需一刀锯缝。',
    [4, 391, 250 / 3],
    'Counts kerf between pieces only; if separating leftover stock requires an extra cut, subtract that kerf from the remainder and check fit.|仅计成品间锯缝；若需切离余料，余长还应扣一刀锯缝并检查是否足够。',
  );
  D(
    'horizontal-tank-fill',
    'Horizontal Cylinder Tank Fill|卧式圆柱罐液量',
    'Find liquid volume from fill depth in a horizontal round tank.|由液深计算卧式圆柱罐存液体积。',
    [
      p('r', 'Inner radius (m)|内半径（m）', 1),
      p('l', 'Straight cylinder length (m)|直筒长度（m）', 2),
      n('h', 'Fill depth from bottom (m)|底部起液深（m）', 1),
    ],
    (v) => {
      check(v.h <= 2 * v.r, 'Fill depth cannot exceed the diameter.|液深不能超过直径。');
      const a =
        v.r * v.r * Math.acos((v.r - v.h) / v.r) -
        (v.r - v.h) * Math.sqrt(Math.max(0, 2 * v.r * v.h - v.h * v.h));
      return [
        R('Liquid volume|液体体积', a * v.l, 'm³'),
        R('Fill fraction|充填比例', (100 * a) / (PI * v.r * v.r), '%'),
      ];
    },
    'Use A = r²acos((r−h)/r)−(r−h)√(2rh−h²) and V = AL. r is inner radius, h is liquid depth from the bottom, and L is cylinder length, all in m. acos uses radians; V is in m³.|使用 A = r²acos((r−h)/r)−(r−h)√(2rh−h²) 及 V = AL。r 为内半径，h 为底部起液深，L 为直筒长度，均使用 m；acos 按弧度计算，V 的单位为 m³。',
    [PI, 50],
    'Straight circular cylinder with flat ends. Dished end caps, tilt and wall thickness are excluded.|直圆柱平底端盖模型，不含封头、倾斜与壁厚。',
  );
  D(
    'pool-volume',
    'Swimming Pool Volume|泳池容积',
    'Estimate rectangular pool volume with a uniformly sloping floor.|估算底面均匀倾斜矩形泳池容积。',
    [
      p('l', 'Pool length (m)|泳池长（m）', 10),
      p('w', 'Pool width (m)|泳池宽（m）', 4),
      n('a', 'Shallow depth (m)|浅端深度（m）', 1),
      n('b', 'Deep depth (m)|深端深度（m）', 2),
    ],
    (v) => [
      R('Pool volume|泳池容积', (v.l * v.w * (v.a + v.b)) / 2, 'm³'),
      R('Water volume|水量', (1000 * v.l * v.w * (v.a + v.b)) / 2, 'L'),
    ],
    'Use V = lw(a+b)/2. l and w are rectangular pool length and width; a and b are shallow and deep depths, all in m. V is in m³, assuming a uniformly sloping floor.|使用 V = lw(a+b)/2。l 与 w 为矩形泳池长宽，a 与 b 为浅深两端深度，均使用 m；假设池底均匀倾斜，V 的单位为 m³。',
    [60, 60000],
    'Uses internal rectangular dimensions and a uniformly sloping floor. Steps, benches, curved walls and changes in water level are not modeled.|使用池内矩形尺寸，假设池底均匀倾斜；不建模台阶、座台、曲面池壁及水位变化。',
  );
  D(
    'rainwater-harvesting',
    'Rainwater Harvesting|雨水收集量',
    'Estimate roof runoff captured from a rainfall event.|估计一次降雨可收集的屋面径流。',
    [
      p('a', 'Roof catchment area (m²)|集雨屋面面积（m²）', 100),
      n('r', 'Rainfall depth (mm)|降雨深度（mm）', 20),
      n('e', 'Collection efficiency (%)|收集效率（%）', 80, 0, 100),
      n('s', 'Available tank capacity (L)|水箱可用容量（L）', 1000),
    ],
    (v) => {
      const q = (v.a * v.r * v.e) / 100;
      return [
        R('Potential collected water|潜在集水量', q, 'L'),
        R('Stored with entered spare capacity|按所填剩余容量存水', Math.min(q, v.s), 'L'),
        R('Overflow|溢流量', Math.max(0, q - v.s), 'L'),
      ];
    },
    'Use V = Are. A is roof catchment area in m², r is rainfall in mm, and e is collection efficiency as a fraction. V is potential collected litres; actual storage is capped by entered spare tank capacity.|使用 V = Are。A 为集雨屋面面积（m²），r 为降雨量（mm），e 为收集效率的小数比例；V 为潜在集水升数，实际存水受自填水箱剩余容量限制。',
    [1600, 1000, 600],
    'Estimates collected water from one rainfall event using your collection efficiency and remaining tank space. Does not forecast rainfall or assess water quality and drinking safety.|按自填收集效率和水箱剩余容量估算单次降雨可收集的水量，不预测降雨，也不评估水质或饮用安全。',
  );
  D(
    'irrigation-runtime',
    'Irrigation Runtime|灌溉运行时间',
    'Convert a chosen water depth and emitter flow into runtime.|将自选水深及出水流量换算为运行时长。',
    [
      area,
      n('d', 'Chosen water depth (mm)|自选灌水深度（mm）', 10),
      p('f', 'Total emitter flow (L/min)|所有滴头总流量（L/min）', 20),
      n('e', 'Application efficiency (%)|施用效率（%）', 80, 0.0001, 100),
    ],
    (v) => {
      const q = (v.a * v.d) / (v.e / 100);
      return [
        R('Required runtime|所需运行时长', q / v.f, 'minutes'),
        R('Supply water volume|供水量', q, 'L'),
      ];
    },
    'Use V = Ad/e and t = V/q. A is area in m², d is chosen water depth in mm, e is application efficiency as a fraction, and q is total emitter flow in L/min. V is litres and t is minutes.|使用 V = Ad/e 及 t = V/q。A 为面积（m²），d 为自选灌水深度（mm），e 为施用效率的小数比例，q 为滴头总流量（L/min）；V 为升数，t 为分钟数。',
    [12.5, 250],
    'Assumes constant total emitter flow and the entered application efficiency. The water-depth target is chosen by you; crop needs, soil behavior and weather are not assessed.|假设滴头总流量和自填施用效率保持不变；灌水深度由你选定，不评估作物需求、土壤特性或天气。',
  );
  D(
    'grass-seed-quantity',
    'Grass Seed Quantity|草籽用量',
    'Apply a product’s labelled sowing rate to an area.|将产品标签播种率应用于面积。',
    [
      area,
      n('r', 'Labelled seed rate (g/m²)|标签播种率（g/m²）', 30),
      waste,
      p('b', 'Pack mass (kg)|每包质量（kg）', 1),
    ],
    (v) => {
      const kg = ((v.a * v.r) / 1000) * (1 + v.w / 100);
      return [
        R('Seed including allowance|含余量草籽', kg, 'kg'),
        R('Packs needed|所需包数', Math.ceil(kg / v.b - 1e-10)),
      ];
    },
    'Use M = Ar(1+w). A is area in m², r is labelled sowing rate in g/m², and w is the waste fraction. M is grams before conversion to kilograms; packs are rounded up using entered pack mass.|使用 M = Ar(1+w)。A 为面积（m²），r 为标签播种率（g/m²），w 为损耗比例；M 为克数，随后换算为千克，并按自填每包质量向上取整为包数。',
    [0.66, 1],
    'Uses the product seed rate and pack mass you enter, with an optional waste allowance. Does not choose a seed variety, sowing season or agronomic application rate.|按自填产品播种率、包装质量和可选损耗余量换算，不代选草籽品种、播种季节或农艺施用率。',
  );
  D(
    'fertilizer-nitrogen-amount',
    'Fertilizer from Chosen Nitrogen Target|自选氮目标换算肥料量',
    'Convert a separately confirmed nitrogen target into product mass.|将另行确认的氮目标换算为肥料产品质量。',
    [
      area,
      n('n', 'Confirmed nitrogen target (g/m²)|已确认施氮目标（g/m²）', 2),
      n('p', 'Product nitrogen by mass (%)|产品氮质量分数（%）', 10, 0.0001, 100),
    ],
    (v) => [R('Fertilizer product mass|肥料产品质量', (v.a * v.n) / (v.p / 100) / 1000, 'kg')],
    'Use M = An/f. A is area in m², n is the separately confirmed nitrogen target in g/m², and f is product nitrogen by mass as a fraction. M is product grams before conversion to kilograms.|使用 M = An/f。A 为面积（m²），n 为另行确认的施氮目标（g/m²），f 为产品氮质量分数的小数比例；M 为产品克数，随后换算为千克。',
    [0.4],
    'Does not recommend an application rate. Follow soil testing, product labels, runoff controls and local restrictions; other nutrients are not evaluated.|不建议施用率；应遵守土壤检测、产品标签、径流控制及当地限制，未评估其他养分。',
  );
  D(
    'room-lighting-lumens',
    'Room Lighting Lumens|房间照明流明',
    'Translate a chosen illuminance target into fixture quantity.|将自选照度目标换算为灯具数量。',
    [
      area,
      p('lux', 'Chosen illuminance target (lux)|自选照度目标（lux）', 300),
      p('l', 'Lumens per fixture|每灯具流明', 1000),
      n('u', 'Utilization factor|利用系数', 0.6, 0.0001, 1),
      n('m', 'Maintenance factor|维护系数', 0.8, 0.0001, 1),
    ],
    (v) => [
      R('Fixture count|灯具数量', Math.ceil((v.a * v.lux) / (v.l * v.u * v.m) - 1e-10)),
      R('Required installed lumens|所需安装流明', (v.a * v.lux) / (v.u * v.m), 'lm'),
    ],
    'Use N = ceil(AE/(Φum)). A is area in m², E is chosen illuminance in lux, Φ is lumens per fixture, and u and m are utilization and maintenance factors. ceil rounds up to whole fixtures.|使用 N = ceil(AE/(Φum))。A 为面积（m²），E 为自选照度（lux），Φ 为每灯具流明，u 与 m 为利用及维护系数；ceil 表示向上取整为灯具数量。',
    [13, 12500],
    'Lumen-method estimate, not a lighting simulation. Glare, daylight, task placement and electrical design require separate review.|流明法估算，不是照明仿真；眩光、日光、任务位置与电气设计需另行审核。',
  );
  D(
    'air-changes-per-hour',
    'Air Changes per Hour|每小时换气次数',
    'Compare ventilation flow with room volume.|比较通风量与房间体积。',
    [
      p('v', 'Room volume (m³)|房间体积（m³）', 60),
      n('q', 'Measured airflow (m³/h)|实测风量（m³/h）', 300),
    ],
    (v) => [
      R('Air changes per hour|每小时换气次数', v.q / v.v, '1/h'),
      R(
        'Ideal single-volume replacement time|理想单体积置换时间',
        v.q > 0 ? (60 * v.v) / v.q : 'No replacement flow|无置换风量',
        'minutes',
      ),
    ],
    'Use ACH = Q/V. Q is measured airflow in m³/h and V is room volume in m³. ACH is air changes per hour; it is a flow-to-volume ratio, not a contaminant-removal guarantee.|使用 ACH = Q/V。Q 为实测风量（m³/h），V 为房间体积（m³）；ACH 为每小时换气次数，是风量与体积之比，不保证污染物清除效果。',
    [5, 12],
    'Perfect mixing is not assumed to guarantee contaminant removal. No ventilation safety or infection-risk assessment is made.|换气数不保证污染物清除效果；不进行通风安全或感染风险评估。',
  );
  D(
    'solar-energy-production',
    'Solar Energy Production|光伏发电估算',
    'Estimate production using entered peak sun hours and system losses.|按自填峰值日照与系统损耗估计发电量。',
    [
      n('p', 'Array peak capacity (kW)|组件峰值容量（kW）', 5),
      n('h', 'Average peak sun hours per day|日均峰值日照小时', 4, 0, 24),
      n('l', 'System losses (%)|系统损耗（%）', 20, 0, 100),
      i('d', 'Days in period|期间天数', 30, 1, 366),
    ],
    (v) => [
      R('Period energy|期间发电量', v.p * v.h * (1 - v.l / 100) * v.d, 'kWh'),
      R('Average daily energy|日均发电量', v.p * v.h * (1 - v.l / 100), 'kWh'),
    ],
    'Use E = Ph(1−l)d. P is peak array capacity in kW, h is average peak sun hours per day, l is system loss as a fraction, and d is days. Period energy E is in kWh.|使用 E = Ph(1−l)d。P 为组件峰值容量（kW），h 为日均峰值日照小时，l 为系统损耗的小数比例，d 为天数；期间发电量 E 的单位为 kWh。',
    [480, 16],
    'Sun hours are an input assumption, not a live local forecast. Shading, orientation and seasonal variation require site-specific modeling.|日照为自填假设，不是当地实时预测；遮挡、朝向及季节变化需场址模型。',
  );
  D(
    'insulation-payback',
    'Insulation Savings Payback|保温节省回收期',
    'Estimate conduction savings and simple installation payback.|估计导热节省与简单安装成本回收期。',
    [
      p('a', 'Envelope area (m²)|围护面积（m²）', 100),
      p('o', 'Old U value (W/m²·K)|旧 U 值（W/m²·K）', 1),
      p('b', 'New U value (W/m²·K)|新 U 值（W/m²·K）', 0.5),
      n('d', 'Annual heating degree days (K·day)|年采暖度日（K·天）', 2000),
      p('e', 'Heating system efficiency|供暖系统效率', 1),
      n('p', 'Energy price per kWh|每 kWh 能源价格', 0.2),
      n('c', 'Installation cost|安装成本', 1000),
    ],
    (v) => {
      check(v.b < v.o, 'New U value must be lower than old U value.|新 U 值必须低于旧 U 值。');
      const energy = (v.a * (v.o - v.b) * v.d * 24) / 1000 / v.e,
        s = energy * v.p;
      return [
        R('Annual energy saving|年能源节省', energy, 'kWh'),
        R('Annual bill saving|年账单节省', s),
        R(
          'Simple payback|简单回收期',
          s > 0 ? v.c / s : 'No bill saving at zero price|能源价格为零时无账单节省',
          'years',
        ),
      ];
    },
    'Use E = A(Uₒ−Uₙ)D×24/(1000η). A is area in m²; Uₒ and Uₙ are old and new transmittance in W/m²·K; D is annual heating degree days in K·day; η is system efficiency. E is annual energy saving in kWh.|使用 E = A(Uₒ−Uₙ)D×24/(1000η)。A 为面积（m²），Uₒ 与 Uₙ 分别为旧、新传热系数（W/m²·K），D 为年采暖度日（K·day），η 为系统效率；E 为年能源节省（kWh）。',
    [2400, 480, 25 / 12],
    'Steady degree-day estimate; excludes air leakage, cooling changes, rebound, finance and energy-price changes.|稳态度日估算，不含漏风、制冷变化、反弹效应、融资与能源价格变化。',
  );
  D(
    'appliance-replacement-payback',
    'Appliance Replacement Payback|电器更换回收期',
    'Compare annual consumption savings with an added purchase cost.|比较年耗电节省与额外购置成本。',
    [
      n('a', 'Old annual consumption (kWh)|旧电器年耗电（kWh）', 500),
      n('b', 'New annual consumption (kWh)|新电器年耗电（kWh）', 300),
      n('p', 'Electricity price per kWh|每 kWh 电价', 0.25),
      n('c', 'Net replacement cost|净更换成本', 400),
    ],
    (v) => {
      const s = (v.a - v.b) * v.p;
      return [
        R('Annual bill saving|年电费节省', s),
        R(
          'Simple payback|简单回收期',
          s > 0 ? v.c / s : 'No positive bill saving|无正向电费节省',
          'years',
        ),
      ];
    },
    'Use S = (Eₒ−Eₙ)p. Eₒ and Eₙ are old and new annual energy use in kWh, and p is price per kWh. S is annual bill saving; simple payback divides net replacement cost by a positive saving.|使用 S = (Eₒ−Eₙ)p。Eₒ 与 Eₙ 为旧、新电器年耗电（kWh），p 为每 kWh 电价；S 为年电费节省，简单回收期为净更换成本除以正向节省。',
    [50, 8],
    'Assumes constant annual consumption and electricity price. Payback includes energy savings only; maintenance, financing, resale and appliance lifetime are excluded.|假设年耗电和电价保持不变；回收期只计能源费节省，不含维护、融资、转售及电器使用寿命。',
  );
  D(
    'ev-fuel-cost-comparison',
    'EV vs Fuel Energy Cost|电车燃油车能耗费用比较',
    'Compare per-distance energy costs and purchase-price payback.|比较单位里程能源费与购车差价回收。',
    [
      n('f', 'Fuel consumption (L/100 km)|油耗（L/100 km）', 7),
      n('p', 'Fuel price per litre|每升燃油价格', 1.5),
      n(
        'e',
        'Charging electricity from supply (kWh/100 km)|充电侧取电量（含损耗，kWh/100 km）',
        18,
      ),
      n('q', 'Electricity price per kWh|每 kWh 电价', 0.25),
      n('d', 'Annual distance (km)|年里程（km）', 10000),
      n('c', 'Extra EV purchase cost|电车额外购置成本', 6000),
    ],
    (v) => {
      const f = v.f * v.p,
        e = v.e * v.q,
        s = ((f - e) * v.d) / 100;
      return [
        R('Fuel cost per 100 km|燃油车每百公里费用', f),
        R('EV cost per 100 km|电车每百公里费用', e),
        R('Annual energy saving|年能源费节省', s),
        R(
          'Energy-only payback|仅能源费回收期',
          s > 0 ? v.c / s : 'No positive energy saving|无正向能源费节省',
          'years',
        ),
      ];
    },
    'Use S = (fp−eq)D/100. f is fuel litres and e is EV wall energy in kWh per 100 km; p is fuel price per litre, q is electricity price per kWh, and D is annual distance in km. S is annual energy-cost saving.|使用 S = (fp−eq)D/100。f 为每 100 km 油耗升数，e 为同里程充电时从电网取用的电量（kWh，包含充电损耗），p 为每升油价，q 为每 kWh 电价，D 为年里程（km）；S 为年能源费节省。',
    [10.5, 4.5, 600, 10],
    'Enter electricity drawn from the supply, including charging losses. Excludes maintenance, insurance, taxes, depreciation and incentives.|填写充电时从电网取用的电量（包含充电损耗）；不含维护、保险、税费、折旧与补贴。',
  );
  D(
    'travel-time',
    'Travel Time with Stops|含停留出行时间',
    'Combine distance, moving speed and stop duration.|结合距离、行驶速度与停留时长。',
    [
      n('d', 'Distance (km)|距离（km）', 300),
      p('v', 'Average moving speed (km/h)|平均行驶速度（km/h）', 100),
      n('s', 'Total stops (minutes)|总停留（分钟）', 30),
    ],
    (v) => [
      R('Total travel time|总出行时间', v.d / v.v + v.s / 60, 'hours'),
      R('Moving time|行驶时间', v.d / v.v, 'hours'),
    ],
    'Use T = D/v+s/60. D is distance in km, v is average moving speed in km/h, and s is total stop time in minutes. Total travel time T is in hours.|使用 T = D/v+s/60。D 为距离（km），v 为平均行驶速度（km/h），s 为总停留分钟数；总出行时间 T 的单位为小时。',
    [3.5, 3],
    'Assumes the entered average moving speed and total stop time. Does not include live traffic, weather delays or route planning.|按自填平均行驶速度和总停留时间估算；不包含实时路况、天气延误或路线规划。',
  );
  D(
    'trip-budget',
    'Trip Budget|旅行预算',
    'Combine shared transport, nightly stays and per-person daily spending.|合并共享交通、每晚住宿与每人每日支出。',
    [
      i('p', 'Travellers|人数', 2, 1, 1000),
      i('d', 'Days|天数', 5, 1, 10000),
      i('n', 'Nights|晚数', 4, 0, 10000),
      n('t', 'Total group transport|全组交通总费', 300),
      n('h', 'Total accommodation per night|全组每晚住宿费', 100),
      n('f', 'Daily spending per person|每人每日支出', 40),
      n('w', 'Budget buffer (%)|预算余量（%）', 10, 0, 100),
    ],
    (v) => {
      const b = v.t + v.h * v.n + v.f * v.p * v.d,
        total = b * (1 + v.w / 100);
      return [
        R('Group budget with buffer|含余量全组预算', total),
        R('Per-person budget|每人预算', total / v.p),
        R('Base group cost|全组基础费用', b),
      ];
    },
    'Use B = (T+nH+pdF)(1+w). T is group transport cost, n is nights, H is group lodging cost per night, p is people, d is days, F is daily spending per person, and w is the buffer fraction. Costs use the same currency.|使用 B = (T+nH+pdF)(1+w)。T 为全组交通费，n 为晚数，H 为全组每晚住宿费，p 为人数，d 为天数，F 为每人每日支出，w 为预算余量比例；所有费用使用同一货币。',
    [1210, 605, 1100],
    'Transport and accommodation are group costs; daily spending is per person. Use one currency throughout. No exchange rates or live travel prices are supplied.|交通和住宿按全组费用计，每日支出按每人计；全部金额使用同一货币，不提供汇率或实时旅行报价。',
  );
  D(
    'weighted-bill-split',
    'Weighted Bill Split|按权重分账',
    'Split a total by chosen shares and reconcile currency rounding.|按自选权重分账，并对齐货币舍入尾差。',
    [
      n('a', 'Total bill|总账单', 100),
      text('w', 'Nonnegative participant weights|各参与者非负权重', '1,1,2'),
      i('d', 'Currency decimal places|货币小数位', 2, 0, 4),
    ],
    (v) => {
      const a = nums(v.w);
      check(
        a.length <= 100 && a.every((x) => x >= 0) && a.some((x) => x > 0),
        'Use up to 100 nonnegative weights with a positive sum.|最多 100 个非负权重，合计应大于零。',
      );
      // Canonical decimal coefficients avoid floating-point ties and overflowing weight products.
      const parts = (value) => {
        const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e'),
          [whole, fraction = ''] = mantissa.split('.');
        return {
          coefficient: BigInt(whole + fraction),
          exponent: Number(exponent) - fraction.length,
        };
      };
      const scale = 10 ** v.d,
        bill = parts(v.a),
        billExponent = bill.exponent + v.d,
        divisor = billExponent < 0 ? 10n ** BigInt(-billExponent) : 1n,
        cents =
          billExponent < 0
            ? (bill.coefficient + divisor / 2n) / divisor
            : bill.coefficient * 10n ** BigInt(billExponent);
      check(
        cents >= 0n && cents <= BigInt(Number.MAX_SAFE_INTEGER),
        'Total is too large for exact currency splitting.|总额过大，无法进行精确货币分账。',
      );
      const weights = a.map(parts),
        exponent = Math.min(...weights.map((x) => x.exponent)),
        integers = weights.map((x) => x.coefficient * 10n ** BigInt(x.exponent - exponent)),
        total = integers.reduce((a, b) => a + b, 0n),
        numerators = integers.map((x) => cents * x),
        q = numerators.map((x) => x / total),
        remainders = numerators.map((x) => x % total),
        order = a
          .map((_, k) => k)
          .sort((a, b) =>
            remainders[a] > remainders[b] ? -1 : remainders[a] < remainders[b] ? 1 : a - b,
          ),
        left = Number(cents - q.reduce((a, b) => a + b, 0n));
      for (let k = 0; k < left; k++) q[order[k]]++;
      return q.map((x, k) => ({
        ...R('Participant ' + (k + 1) + '|参与者 ' + (k + 1), Number(x) / scale),
        fractionDigits: v.d,
      }));
    },
    'Allocate integer minor units by largest remainder|以整数最小货币单位计算，按最大余数法分配。',
    [25, 25, 50],
    'Enter one nonnegative weight per participant, in result order. The total is rounded to the selected currency precision, with halfway amounts rounded up. Largest remainders receive the remaining minor units; ties go to earlier participants. This computes shares only; no money is transferred.|按结果顺序为每位参与者填写一个非负权重。总额先按所选货币小数位四舍五入，再按最大余数分配剩余最小货币单位；余数相同时优先分给靠前的参与者。仅计算分账份额，不转移资金。',
  );
  D(
    'recipe-scaling',
    'Recipe Scaling|食谱份量缩放',
    'Scale ingredient amounts from original servings to target servings.|按原份数与目标份数同比缩放原料。',
    [
      p('a', 'Original servings|原份数', 4),
      n('b', 'Target servings|目标份数', 6),
      text(
        'x',
        'Ingredient amounts in their own unchanged units|各原料数量（各自单位保持不变）',
        '200,100,2',
      ),
    ],
    (v) => [
      R('Scale factor|缩放倍数', v.b / v.a),
      ...nums(v.x).map((x, k) => {
        check(x >= 0, 'Ingredient amounts cannot be negative.|原料数量不能为负。');
        return R('Ingredient ' + (k + 1) + '|原料 ' + (k + 1), (x * v.b) / v.a);
      }),
    ],
    "Use q = xB/A. x is an original ingredient amount, A is original servings, and B is target servings. Each scaled amount q retains that ingredient's original unit.|使用 q = xB/A。x 为原原料数量，A 为原份数，B 为目标份数；每项缩放后数量 q 保留该原料原来的单位。",
    [1.5, 300, 150, 3],
    'Units remain unchanged. Cooking time, seasoning and leavening may not scale linearly.|单位保持不变；烹饪时间、调味及膨松剂可能不按线性比例缩放。',
  );
  D(
    'coffee-brew-ratio',
    'Coffee Brew Ratio|咖啡冲煮比例',
    'Calculate brew water from coffee dose and a chosen water ratio.|由咖啡粉量和自选水粉比求用水量。',
    [
      n('c', 'Coffee dose (g)|咖啡粉量（g）', 20),
      p('r', 'Water grams per gram of coffee|每克咖啡对应水克数', 15),
    ],
    (v) => [
      R('Brew water|冲煮用水', v.c * v.r, 'g'),
      R('Combined starting mass|总初始质量', v.c * (1 + v.r), 'g'),
    ],
    'Use W = Cr. C is coffee mass in g and r is water grams per gram of coffee. W is required water mass in g; the ratio compares water with coffee.|使用 W = Cr。C 为咖啡粉质量（g），r 为每克咖啡对应的水克数；W 为所需水质量（g），比例方向为水比咖啡。',
    [300, 320],
    'Water input, not final beverage yield; retention and evaporation are excluded.|计算投入用水，不等于最终饮品量；未计吸水滞留与蒸发。',
  );
  D(
    'bakers-hydration',
    'Baker’s Hydration|烘焙含水率',
    'Include preferment flour and water in total dough hydration.|将酵种中的面粉与水计入面团总水粉比。',
    [
      n('f', 'Main dough flour (g)|主面团面粉（g）', 450),
      n('w', 'Main dough water (g)|主面团水（g）', 300),
      n('s', 'Preferment total mass (g)|酵种总质量（g）', 100),
      n('h', 'Preferment hydration (%)|酵种水粉比（%）', 100, 0, 1000),
    ],
    (v) => {
      const sf = v.s / (1 + v.h / 100),
        sw = v.s - sf,
        total = v.f + sf;
      check(total > 0, 'Total flour must be positive.|总面粉量应大于零。');
      return [
        R('Total hydration|总含水率', (100 * (v.w + sw)) / total, '%'),
        R('Total flour|总面粉', total, 'g'),
        R('Total water|总水', v.w + sw, 'g'),
      ];
    },
    'Use Fₚ = S/(1+h), Wₚ = S−Fₚ and H = (W+Wₚ)/(F+Fₚ). S is preferment mass, h is its hydration fraction, and F and W are main-dough flour and water, all masses in g. Total hydration H is displayed as a percentage.|使用 Fₚ = S/(1+h)、Wₚ = S−Fₚ 及 H = (W+Wₚ)/(F+Fₚ)。S 为酵种质量，h 为酵种含水率的小数比例，F 与 W 为主面团面粉及水，所有质量均使用 g；总含水率 H 以百分比显示。',
    [70, 500, 350],
    'Preferment is treated as flour and water only. Water from eggs, milk and other ingredients is not included. Hydration compares total water mass with total flour mass.|酵种按仅含面粉和水处理，不计鸡蛋、牛奶等其他原料带入的水；含水率比较总水质量与总面粉质量。',
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, PI, rad, deg } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const radius = p('r', 'Radius (m)|半径（m）', 3),
    height = p('h', 'Height (m)|高（m）', 4);
  const matrix = [
    u('a', 'Row 1, column 1|第 1 行第 1 列', 1),
    u('b', 'Row 1, column 2|第 1 行第 2 列', 2),
    u('c', 'Row 2, column 1|第 2 行第 1 列', 3),
    u('d', 'Row 2, column 2|第 2 行第 2 列', 4),
  ];
  // Sorted, parenthesized Heron formula preserves needle-shaped triangles.
  // W. Kahan: https://people.eecs.berkeley.edu/~wkahan/Triangle.pdf
  const triangleArea = (a, b, c) => {
    const [x, y, z] = [a, b, c].sort((left, right) => right - left);
    check(z > x - y, 'The sides must form a nondegenerate triangle.|三边需构成非退化三角形。');
    return Math.sqrt((x + (y + z)) * (z - (x - y)) * (z + (x - y)) * (x + (y - z))) / 4;
  };
  // 48–79: distinct plane and solid geometry tasks.
  D(
    'rectangle',
    'Rectangle Area and Diagonal|矩形面积与对角线',
    'Calculate rectangle area, perimeter and diagonal from two side lengths.|由两边长度计算矩形面积、周长和对角线。',
    [p('a', 'Length (m)|长（m）', 3), p('b', 'Width (m)|宽（m）', 4)],
    (v) => [
      R('Area|面积', v.a * v.b, 'm²'),
      R('Perimeter|周长', 2 * (v.a + v.b), 'm'),
      R('Diagonal|对角线', Math.hypot(v.a, v.b), 'm'),
    ],
    'A=lw; P=2(l+w); d=√(l²+w²)',
    [12, 14, 5],
  );
  D(
    'parallelogram',
    'Parallelogram Calculator|平行四边形',
    'Calculate area using perpendicular height and perimeter using side lengths.|用垂直高求面积，用两邻边求周长。',
    [
      p('a', 'Base (m)|底（m）', 6),
      p('h', 'Perpendicular height (m)|垂直高（m）', 4),
      p('b', 'Adjacent side (m)|邻边（m）', 5),
    ],
    (v) => {
      check(
        v.h <= v.b,
        'Perpendicular height cannot exceed its adjacent side.|垂直高不能大于对应邻边。',
      );
      return [R('Area|面积', v.a * v.h, 'm²'), R('Perimeter|周长', 2 * (v.a + v.b), 'm')];
    },
    'Use A = bh and P = 2(b+s). b is base, h is perpendicular height, and s is the adjacent side, all in the same length unit. A is area and P is perimeter.|使用 A = bh 及 P = 2(b+s)。b 为底，h 为垂直高，s 为邻边，均使用同一长度单位；A 为面积，P 为周长。',
    [24, 22],
  );
  D(
    'trapezoid',
    'Trapezoid Area|梯形面积',
    'Find trapezoid area and the length of its midline.|求梯形面积及中位线长度。',
    [
      p('a', 'First parallel side (m)|第一条平行边（m）', 8),
      p('b', 'Second parallel side (m)|第二条平行边（m）', 5),
      height,
    ],
    (v) => [
      R('Area|面积', ((v.a + v.b) * v.h) / 2, 'm²'),
      R('Midline|中位线', (v.a + v.b) / 2, 'm'),
    ],
    'Use A = (a+b)h/2 and m = (a+b)/2. a and b are parallel side lengths and h is perpendicular height in the same unit. m is midline length.|使用 A = (a+b)h/2 及 m = (a+b)/2。a 与 b 为两条平行边长度，h 为同单位垂直高，m 为中位线长度。',
    [26, 6.5],
  );
  D(
    'rhombus',
    'Rhombus from Diagonals|菱形对角线计算',
    'Find area, side length and perimeter from perpendicular diagonals.|由两条对角线求菱形面积、边长和周长。',
    [
      p('a', 'First diagonal (m)|第一条对角线（m）', 6),
      p('b', 'Second diagonal (m)|第二条对角线（m）', 8),
    ],
    (v) => {
      const s = Math.hypot(v.a, v.b) / 2;
      return [
        R('Area|面积', (v.a * v.b) / 2, 'm²'),
        R('Side length|边长', s, 'm'),
        R('Perimeter|周长', 4 * s, 'm'),
      ];
    },
    'Use A = d₁d₂/2 and s = √(d₁²+d₂²)/2. d₁ and d₂ are the rhombus diagonals in the same length unit. A is area and s is side length.|使用 A = d₁d₂/2 及 s = √(d₁²+d₂²)/2。d₁ 与 d₂ 为同长度单位的菱形对角线，A 为面积，s 为边长。',
    [24, 5, 20],
  );
  D(
    'point-to-line-distance',
    'Point to Line Distance|点到直线距离',
    'Find perpendicular distance and the projection onto Ax+By+C=0.|求点到一般式直线的垂直距离及垂足。',
    [
      u('a', 'Line coefficient A|直线系数 A', 3),
      u('b', 'Line coefficient B|直线系数 B', 4),
      u('c', 'Line coefficient C|直线系数 C', -5),
      u('x', 'Point x|点 x', 1),
      u('y', 'Point y|点 y', 2),
    ],
    (v) => {
      const d = v.a * v.a + v.b * v.b;
      check(d > 0, 'A and B cannot both be zero.|A 和 B 不能同时为零。');
      const q = v.a * v.x + v.b * v.y + v.c;
      return [
        R('Perpendicular distance|垂直距离', Math.abs(q) / Math.sqrt(d)),
        R('Projection x|垂足 x', v.x - (v.a * q) / d),
        R('Projection y|垂足 y', v.y - (v.b * q) / d),
      ];
    },
    'Use d = abs(Ax+By+C)/√(A²+B²) for the line Ax+By+C = 0 and point (x,y). abs means absolute value. The line coefficients A and B cannot both be zero.|对直线 Ax+By+C = 0 与点 (x,y)，使用 d = abs(Ax+By+C)/√(A²+B²)。abs 表示绝对值，直线系数 A 与 B 不能同时为零。',
    [1.2, 0.28, 1.04],
  );
  D(
    'ellipse',
    'Ellipse Area and Perimeter|椭圆面积与周长',
    'Find ellipse area and approximate perimeter from its semiaxes.|由半轴计算椭圆面积和近似周长。',
    [
      p('a', 'First semiaxis (m)|第一条半轴（m）', 3),
      p('b', 'Second semiaxis (m)|第二条半轴（m）', 2),
    ],
    (v) => {
      const h = ((v.a - v.b) / (v.a + v.b)) ** 2;
      return [
        R('Area|面积', PI * v.a * v.b, 'm²'),
        R(
          'Approximate perimeter|近似周长',
          PI * (v.a + v.b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))),
          'm',
        ),
      ];
    },
    'A=πab; perimeter uses Ramanujan’s second approximation.|A=πab；周长采用拉马努金第二近似公式。',
    [18.84955592153876, 15.865439589251233],
    'Inputs are semiaxes, half the full axis lengths. Perimeter is approximate.|输入是完整轴长的一半；椭圆周长采用近似式。',
  );
  D(
    'sector',
    'Circular Sector|扇形面积',
    'Find the area, arc and boundary length of a circular sector.|由半径和圆心角求扇形面积、弧长及边界长度。',
    [radius, n('a', 'Central angle (degrees)|圆心角（度）', 60, 0, 360)],
    (v) => {
      const angle = rad(v.a),
        arc = v.r * angle;
      return [
        R('Sector area|扇形面积', (v.r * v.r * angle) / 2, 'm²'),
        R('Arc length|弧长', arc, 'm'),
        R('Boundary length|边界长度', arc + 2 * v.r, 'm'),
      ];
    },
    'Convert the entered angle a in degrees to θ = πa/180 radians. Use A = r²θ/2 and s = rθ. r is radius, A is sector area, and s is arc length.|将自填角度 a 从度换算为弧度 θ = πa/180，再使用 A = r²θ/2 及 s = rθ。r 为半径，A 为扇形面积，s 为弧长。',
    [4.71238898038469, PI, 9.141592653589793],
  );
  D(
    'circular-segment',
    'Circular Segment|圆弓形面积',
    'Find the area enclosed by a chord and its selected circular arc.|求弦与所选圆弧围成的弓形面积。',
    [p('r', 'Radius (m)|半径（m）', 2), n('a', 'Arc angle (degrees)|圆弧对应角（度）', 60, 0, 360)],
    (v) => {
      const a = rad(v.a);
      return [
        R('Segment area|弓形面积', (v.r * v.r * (a - Math.sin(a))) / 2, 'm²'),
        R('Chord|弦长', 2 * v.r * Math.sin(a / 2), 'm'),
      ];
    },
    'Convert the entered angle a in degrees to θ = πa/180 radians. Use A = r²(θ−sinθ)/2 and c = 2r sin(θ/2). r is radius, A is segment area, and c is chord length.|将自填角度 a 从度换算为弧度 θ = πa/180，再使用 A = r²(θ−sinθ)/2 及 c = 2r sin(θ/2)。r 为半径，A 为圆弓形面积，c 为弦长。',
    [0.3623442948243183, 2],
  );
  D(
    'annulus',
    'Annulus Calculator|圆环面积',
    'Find area and total inner-plus-outer boundary of a circular ring.|求圆环面积及内外边界总长。',
    [p('a', 'Outer radius (m)|外半径（m）', 5), n('b', 'Inner radius (m)|内半径（m）', 2)],
    (v) => {
      check(v.a > v.b, 'Outer radius must exceed inner radius.|外半径必须大于内半径。');
      return [
        R('Ring area|圆环面积', PI * (v.a * v.a - v.b * v.b), 'm²'),
        R('Total boundary|边界总长', 2 * PI * (v.a + v.b), 'm'),
      ];
    },
    'Use A = π(R²−r²) and P = 2π(R+r). R and r are outer and inner radii in the same unit. A is annular area; P includes both boundary circles.|使用 A = π(R²−r²) 及 P = 2π(R+r)。R 与 r 为同单位外、内半径；A 为圆环面积，P 包含内外两条圆周。',
    [65.97344572538566, 43.982297150257104],
  );
  D(
    'regular-polygon',
    'Regular Polygon|正多边形',
    'Find area, perimeter, apothem and circumradius for a regular polygon.|由边数和边长求正多边形面积、周长、边心距和外接圆半径。',
    [i('n', 'Number of sides|边数', 6, 3, 10000), p('s', 'Side length (m)|边长（m）', 2)],
    (v) => [
      R('Area|面积', (v.n * v.s * v.s) / (4 * Math.tan(PI / v.n)), 'm²'),
      R('Perimeter|周长', v.n * v.s, 'm'),
      R('Apothem|边心距', v.s / (2 * Math.tan(PI / v.n)), 'm'),
      R('Circumradius|外接圆半径', v.s / (2 * Math.sin(PI / v.n)), 'm'),
    ],
    'Use A = ns²/[4tan(π/n)] and P = ns. n is the number of equal sides and s is side length. The tangent uses radians. A is area and P is perimeter.|使用 A = ns²/[4tan(π/n)] 及 P = ns。n 为等长边数，s 为边长，正切按弧度计算；A 为面积，P 为周长。',
    [10.392304845413264, 12, Math.sqrt(3), 2],
  );
  D(
    'polygon-area',
    'Polygon Area from Coordinates|坐标多边形面积',
    'Use ordered vertices to find a simple polygon’s area and perimeter.|按顺序输入顶点，求简单多边形面积和周长。',
    [text('values', 'Ordered x,y coordinate pairs (m)|顺序排列的 x,y 坐标（m）', '0,0 4,0 0,3')],
    (v) => {
      const a = nums(v.values);
      check(
        a.length >= 6 && a.length % 2 === 0,
        'Enter at least three x,y pairs.|至少输入三组 x,y 坐标。',
      );
      let area = 0,
        perimeter = 0;
      for (let k = 0; k < a.length; k += 2) {
        const j = (k + 2) % a.length;
        area += a[k] * a[j + 1] - a[j] * a[k + 1];
        perimeter += Math.hypot(a[j] - a[k], a[j + 1] - a[k + 1]);
      }
      return [R('Area|面积', Math.abs(area) / 2, 'm²'), R('Perimeter|周长', perimeter, 'm')];
    },
    'Use A = abs[Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)]/2. (xᵢ,yᵢ) are vertices in boundary order; the last vertex connects back to the first. abs means absolute value. Coordinates must use the same length unit.|使用 A = abs[Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)]/2。(xᵢ,yᵢ) 为沿边界顺序排列的顶点，末点连接回首点；abs 表示绝对值，坐标使用相同长度单位。',
    [6, 12],
    'Vertices must follow the boundary of a non-self-intersecting polygon. Self-intersections are not interpreted as filled unions.|顶点需沿不自交的多边形边界排列；自交图形不按区域并集求面积。',
  );
  D(
    'herons-formula',
    'Heron’s Triangle Formula|海伦公式',
    'Find triangle area and inscribed and circumscribed radii from three sides.|由三边求三角形面积及内、外接圆半径。',
    [
      p('a', 'Side a (m)|边 a（m）', 3),
      p('b', 'Side b (m)|边 b（m）', 4),
      p('c', 'Side c (m)|边 c（m）', 5),
    ],
    (v) => {
      const s = (v.a + v.b + v.c) / 2;
      const area = triangleArea(v.a, v.b, v.c);
      return [
        R('Area|面积', area, 'm²'),
        R('Inradius|内接圆半径', area / s, 'm'),
        R('Circumradius|外接圆半径', (v.a * v.b * v.c) / (4 * area), 'm'),
      ];
    },
    's=(a+b+c)/2; A=√(s(s−a)(s−b)(s−c))',
    [6, 1, 2.5],
  );
  D(
    'law-of-sines',
    'Law of Sines|正弦定理',
    'Solve a triangle from two angles and the side opposite the first.|由两个角及第一角的对边解三角形。',
    [
      p('a', 'Side opposite A (m)|角 A 的对边（m）', 5),
      n('A', 'Angle A (degrees)|角 A（度）', 30, 0.000001, 179.999999),
      n('B', 'Angle B (degrees)|角 B（度）', 60, 0.000001, 179.999999),
    ],
    (v) => {
      check(
        v.A + v.B < 180,
        'Angles A and B must sum to less than 180 degrees.|角 A、B 之和必须小于 180 度。',
      );
      const c = 180 - v.A - v.B;
      return [
        R('Side opposite B|角 B 的对边', (v.a * Math.sin(rad(v.B))) / Math.sin(rad(v.A)), 'm'),
        R('Side opposite C|角 C 的对边', (v.a * Math.sin(rad(c))) / Math.sin(rad(v.A)), 'm'),
        R('Angle C|角 C', c, '°'),
      ];
    },
    'Use a/sin(A) = b/sin(B) = c/sin(C) and C = 180°−A−B. Each lowercase side is opposite its matching uppercase angle. Input angles are in degrees and side lengths share a unit.|使用 a/sin(A) = b/sin(B) = c/sin(C) 及 C = 180°−A−B。每个小写边长均为对应大写角的对边；输入角度使用度，所有边长使用相同单位。',
    [8.660254037844387, 10, 90],
  );
  D(
    'law-of-cosines',
    'Law of Cosines|余弦定理',
    'Find the missing side and area from two sides and their included angle.|由两边及夹角求第三边和三角形面积。',
    [
      p('b', 'First side (m)|第一边（m）', 3),
      p('c', 'Second side (m)|第二边（m）', 4),
      n('A', 'Included angle (degrees)|夹角（度）', 90, 0.000001, 179.999999),
    ],
    (v) => [
      R(
        'Opposite side|夹角对边',
        Math.hypot(v.b - v.c, 2 * Math.sqrt(v.b * v.c) * Math.sin(rad(v.A) / 2)),
        'm',
      ),
      R('Area|面积', (v.b * v.c * Math.sin(rad(v.A))) / 2, 'm²'),
    ],
    'Use a² = b²+c²−2bc cos(A) and K = bc sin(A)/2. b and c are the entered sides and A is their included angle in degrees. a is the opposite side and K is triangle area.|使用 a² = b²+c²−2bc cos(A) 及 K = bc sin(A)/2。b 与 c 为自填两边，A 为其夹角（度），a 为对边，K 为三角形面积。',
    [5, 6],
  );
  D(
    'triangle-centroid',
    'Triangle Centroid|三角形重心',
    'Average the three vertex coordinates to locate the triangle centroid.|根据三个顶点坐标求三角形重心。',
    [
      u('a', 'Vertex A: x|顶点 A：x', 0),
      u('b', 'Vertex A: y|顶点 A：y', 0),
      u('c', 'Vertex B: x|顶点 B：x', 6),
      u('d', 'Vertex B: y|顶点 B：y', 0),
      u('e', 'Vertex C: x|顶点 C：x', 0),
      u('f', 'Vertex C: y|顶点 C：y', 9),
    ],
    (v) => {
      check(
        (v.c - v.a) * (v.f - v.b) !== (v.e - v.a) * (v.d - v.b),
        'Vertices must not lie on one line.|三个顶点不能共线。',
      );
      return [
        R('Centroid x|重心 x', (v.a + v.c + v.e) / 3),
        R('Centroid y|重心 y', (v.b + v.d + v.f) / 3),
      ];
    },
    'G=((x₁+x₂+x₃)/3,(y₁+y₂+y₃)/3)',
    [2, 3],
  );
  D(
    'circle-equation',
    'Circle Equation|圆的方程',
    'Write a circle equation from its centre and radius.|根据圆心和半径写出圆的标准方程。',
    [u('a', 'Centre x|圆心 x', 1), u('b', 'Centre y|圆心 y', 2), p('r', 'Radius|半径', 3)],
    (v) => {
      const term = (name, x) => '(' + name + (x < 0 ? ' + ' : ' - ') + Math.abs(x) + ')²';
      return [
        R('Circle equation|圆的方程', term('x', v.a) + ' + ' + term('y', v.b) + ' = ' + v.r * v.r),
        R('Radius squared|半径平方', v.r * v.r),
      ];
    },
    '(x−h)²+(y−k)²=r²',
    ['(x - 1)² + (y - 2)² = 9', 9],
  );
  D(
    'tangent-length',
    'Tangent Length to Circle|圆外切线长度',
    'Find tangent length from an external point to a circle.|由圆外点到圆心的距离和半径求切线长。',
    [p('d', 'Distance to centre (m)|到圆心的距离（m）', 5), radius],
    (v) => {
      check(v.d >= v.r, 'The point must be on or outside the circle.|该点必须位于圆上或圆外。');
      return [R('Tangent length|切线长度', Math.sqrt(v.d * v.d - v.r * v.r), 'm')];
    },
    't=√(d²−r²)',
    [4],
  );
  D(
    'chord-length',
    'Chord Length from Centre Offset|弦长计算器',
    'Find chord length from radius and perpendicular distance to the centre.|由半径及圆心到弦的垂直距离求弦长。',
    [
      p('r', 'Radius (m)|半径（m）', 5),
      n('d', 'Centre-to-chord offset (m)|圆心到弦的距离（m）', 3),
    ],
    (v) => {
      check(v.d <= v.r, 'Offset cannot exceed the radius.|圆心到弦的距离不能大于半径。');
      return [
        R('Chord length|弦长', 2 * Math.sqrt(v.r * v.r - v.d * v.d), 'm'),
        R('Minor central angle|较小圆心角', 2 * deg(Math.acos(v.d / v.r)), '°'),
      ];
    },
    'Use c = 2√(r²−d²). r is radius and d is perpendicular distance from the centre to the chord in the same unit. Chord length c uses that length unit.|使用 c = 2√(r²−d²)。r 为半径，d 为圆心到弦的同单位垂直距离；弦长 c 使用该长度单位。',
    [8, 106.26020470831196],
  );
  D(
    'arc-central-angle',
    'Central Angle from Arc Length|弧长反求圆心角',
    'Find a circle’s central angle and chord from a measured arc length.|由弧长和半径反求圆心角及弦长。',
    [radius, n('s', 'Arc length (m)|弧长（m）', PI)],
    (v) => {
      check(
        v.s <= 2 * PI * v.r,
        'Arc length must not exceed one circumference.|弧长不能超过一整圈周长。',
      );
      const a = v.s / v.r;
      return [
        R('Central angle|圆心角', deg(a), '°'),
        R('Chord length|弦长', 2 * v.r * Math.sin(a / 2), 'm'),
      ];
    },
    'Use θ = s/r and c = 2r sin(θ/2). s is arc length and r is radius in the same unit. θ is radians before conversion to displayed degrees; c is chord length.|使用 θ = s/r 及 c = 2r sin(θ/2)。s 为弧长，r 为同单位半径；θ 为弧度，随后换算成度显示，c 为弦长。',
    [60, 3],
  );
  D(
    'sagitta',
    'Sagitta of a Circular Arc|圆弧弓高',
    'Find the minor-arc height above a chord.|由半径和弦长求较小圆弧的弓高。',
    [p('r', 'Radius (m)|半径（m）', 5), n('c', 'Chord length (m)|弦长（m）', 8)],
    (v) => {
      check(v.c <= 2 * v.r, 'Chord cannot exceed the diameter.|弦长不能大于直径。');
      const half = v.c / 2;
      return [
        R('Sagitta|弓高', (half * half) / (v.r + Math.sqrt((v.r - half) * (v.r + half))), 'm'),
      ];
    },
    'h=r−√(r²−c²/4)',
    [2],
  );
  D(
    'cube',
    'Cube Volume and Surface|正方体体积与表面积',
    'Find cube volume, surface area and space diagonal.|求正方体体积、表面积和体对角线。',
    [p('a', 'Edge length (m)|棱长（m）', 3)],
    (v) => [
      R('Physical volume|体积', v.a ** 3, 'm³'),
      R('Surface area|表面积', 6 * v.a * v.a, 'm²'),
      R('Space diagonal|体对角线', v.a * Math.sqrt(3), 'm'),
    ],
    'V=a³; S=6a²; d=a√3',
    [27, 54, 5.196152422706632],
  );
  D(
    'cuboid',
    'Cuboid Calculator|长方体计算器',
    'Find a rectangular box’s volume, surface and space diagonal.|求长方体体积、表面积和体对角线。',
    [
      p('a', 'Length (m)|长（m）', 3),
      p('b', 'Width (m)|宽（m）', 4),
      p('c', 'Height (m)|高（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', v.a * v.b * v.c, 'm³'),
      R('Surface area|表面积', 2 * (v.a * v.b + v.b * v.c + v.a * v.c), 'm²'),
      R('Space diagonal|体对角线', Math.hypot(v.a, v.b, v.c), 'm'),
    ],
    'Use V = lwh and S = 2(lw+lh+wh). l, w and h are cuboid length, width and height in the same unit. V is volume and S is total surface area.|使用 V = lwh 及 S = 2(lw+lh+wh)。l、w、h 为同单位长方体长、宽、高；V 为体积，S 为总表面积。',
    [60, 94, 7.0710678118654755],
  );
  D(
    'sphere',
    'Sphere Volume and Surface|球体体积与表面积',
    'Find volume, surface area and diameter from a sphere’s radius.|由半径求球体积、表面积和直径。',
    [p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Physical volume|体积', (4 * PI * v.r ** 3) / 3, 'm³'),
      R('Surface area|表面积', 4 * PI * v.r * v.r, 'm²'),
      R('Diameter|直径', 2 * v.r, 'm'),
    ],
    'V=4πr³/3; S=4πr²',
    [33.510321638291124, 50.26548245743669, 4],
  );
  D(
    'cylinder',
    'Cylinder Volume and Surface|圆柱体计算器',
    'Find right-cylinder volume and total surface including both ends.|求直圆柱体积及包含两底面的总表面积。',
    [radius, p('h', 'Height (m)|高（m）', 5)],
    (v) => [
      R('Physical volume|体积', PI * v.r * v.r * v.h, 'm³'),
      R('Total surface|总表面积', 2 * PI * v.r * (v.r + v.h), 'm²'),
      R('Lateral surface|侧面积', 2 * PI * v.r * v.h, 'm²'),
    ],
    'V=πr²h; S=2πr(r+h)',
    [141.3716694115407, 150.79644737231007, 94.24777960769379],
  );
  D(
    'cone',
    'Cone Volume and Surface|圆锥体计算器',
    'Find a right circular cone’s volume, slant height and total surface.|求直圆锥体积、母线长和总表面积。',
    [radius, height],
    (v) => {
      const l = Math.hypot(v.r, v.h);
      return [
        R('Physical volume|体积', (PI * v.r * v.r * v.h) / 3, 'm³'),
        R('Total surface|总表面积', PI * v.r * (v.r + l), 'm²'),
        R('Slant height|母线长', l, 'm'),
      ];
    },
    'V=πr²h/3; l=√(r²+h²); S=πr(r+l)',
    [37.69911184307752, 75.39822368615503, 5],
  );
  D(
    'conical-frustum',
    'Conical Frustum|圆台体积与表面积',
    'Calculate a conical frustum from two circular radii and vertical height.|由两个底面半径和垂直高求圆台体积与表面积。',
    [
      p('a', 'Larger radius (m)|大底半径（m）', 3),
      n('b', 'Smaller radius (m)|小底半径（m）', 1),
      height,
    ],
    (v) => {
      check(v.a >= v.b, 'Larger radius must not be smaller.|大底半径不得小于小底半径。');
      const l = Math.hypot(v.a - v.b, v.h);
      return [
        R('Physical volume|体积', (PI * v.h * (v.a * v.a + v.a * v.b + v.b * v.b)) / 3, 'm³'),
        R('Slant height|母线长', l, 'm'),
        R('Total surface|总表面积', PI * (v.a * v.a + v.b * v.b + (v.a + v.b) * l), 'm²'),
      ];
    },
    'V=πh(R²+Rr+r²)/3; S=π(R²+r²+(R+r)l)',
    [54.454272662223076, 4.47213595499958],
  );
  D(
    'rectangular-pyramid',
    'Right Rectangular Pyramid|直四棱锥计算器',
    'Find volume and surface of a pyramid centred over a rectangular base.|求顶点位于矩形底面中心正上方的四棱锥体积与表面积。',
    [p('a', 'Base length (m)|底面长（m）', 6), p('b', 'Base width (m)|底面宽（m）', 6), height],
    (v) => [
      R('Physical volume|体积', (v.a * v.b * v.h) / 3, 'm³'),
      R(
        'Surface area|表面积',
        v.a * v.b + v.a * Math.hypot(v.h, v.b / 2) + v.b * Math.hypot(v.h, v.a / 2),
        'm²',
      ),
    ],
    'Use V = lwh/3 and S = lw+l√(h²+(w/2)²)+w√(h²+(l/2)²). l and w are rectangular base dimensions and h is perpendicular height, all in the same unit. S includes the base.|使用 V = lwh/3 及 S = lw+l√(h²+(w/2)²)+w√(h²+(l/2)²)。l 与 w 为矩形底面长宽，h 为垂直高，均使用同一单位；S 包含底面积。',
    [48, 96],
  );
  D(
    'prism',
    'Right Prism|直棱柱计算器',
    'Find volume and surface from base area, base perimeter and length.|由底面积、底面周长及柱高求直棱柱体积和表面积。',
    [
      p('a', 'Base area (m²)|底面积（m²）', 12),
      p('p', 'Base perimeter (m)|底面周长（m）', 14),
      p('h', 'Prism height (m)|柱高（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', v.a * v.h, 'm³'),
      R('Total surface|总表面积', 2 * v.a + v.p * v.h, 'm²'),
    ],
    'V=Ah; S=2A+Ph',
    [60, 94],
  );
  D(
    'torus',
    'Torus Volume and Surface|圆环体体积与表面积',
    'Find a ring torus’s volume and surface from major and tube radii.|由中心圆半径和管截面半径求圆环体体积与表面积。',
    [p('a', 'Major radius (m)|中心圆半径（m）', 3), p('b', 'Tube radius (m)|管半径（m）', 1)],
    (v) => {
      check(
        v.a > v.b,
        'A ring torus requires major radius greater than tube radius.|圆环体中心圆半径需大于管半径。',
      );
      return [
        R('Physical volume|体积', 2 * PI * PI * v.a * v.b * v.b, 'm³'),
        R('Surface area|表面积', 4 * PI * PI * v.a * v.b, 'm²'),
      ];
    },
    'V=2π²Rr²; S=4π²Rr',
    [59.21762640653615, 118.4352528130723],
  );
  D(
    'ellipsoid-volume',
    'Ellipsoid Volume|椭球体积',
    'Find ellipsoid volume from its three perpendicular semiaxes.|由三条互相垂直的半轴求椭球体积。',
    [
      p('a', 'Semiaxis a (m)|半轴 a（m）', 3),
      p('b', 'Semiaxis b (m)|半轴 b（m）', 2),
      p('c', 'Semiaxis c (m)|半轴 c（m）', 1),
    ],
    (v) => [R('Physical volume|体积', (4 * PI * v.a * v.b * v.c) / 3, 'm³')],
    'Use V = 4πabc/3. a, b and c are the ellipsoid semiaxes in the same unit, not full diameters. Volume V uses the cubed length unit.|使用 V = 4πabc/3。a、b、c 为同单位椭球半轴，并非完整直径；体积 V 使用该长度单位的立方。',
    [25.132741228718345],
  );
  D(
    'capsule',
    'Capsule Volume and Surface|胶囊体计算器',
    'Find a cylinder-plus-two-hemispheres capsule’s volume and surface.|求圆柱加两端半球组成的胶囊体体积和表面积。',
    [
      p('r', 'Radius (m)|半径（m）', 2),
      n('h', 'Straight cylinder length (m)|直圆柱段长度（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', PI * v.r * v.r * v.h + (4 * PI * v.r ** 3) / 3, 'm³'),
      R('Surface area|表面积', 2 * PI * v.r * v.h + 4 * PI * v.r * v.r, 'm²'),
      R('Total end-to-end length|整体长度', v.h + 2 * v.r, 'm'),
    ],
    'V=πr²h+4πr³/3; S=2πrh+4πr²',
    [96.34217471008699, 113.09733552923255, 9],
  );
  D(
    'hemisphere',
    'Hemisphere Calculator|半球体计算器',
    'Find a hemisphere’s volume, curved area and total area including its base.|求半球体积、曲面面积及包含底面的总面积。',
    [p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Physical volume|体积', (2 * PI * v.r ** 3) / 3, 'm³'),
      R('Curved area|曲面面积', 2 * PI * v.r * v.r, 'm²'),
      R('Total area with base|含底面总面积', 3 * PI * v.r * v.r, 'm²'),
    ],
    'Use V = 2πr³/3, C = 2πr² and S = 3πr². r is radius, V is hemisphere volume, C is curved area, and S includes the circular base.|使用 V = 2πr³/3、C = 2πr² 及 S = 3πr²。r 为半径，V 为半球体积，C 为曲面面积，S 包含圆形底面。',
    [16.755160819145562, 25.132741228718345, 37.69911184307752],
  );
  // 80–88: trigonometry and numerical algebra.
  D(
    'trigonometry',
    'Trigonometric Functions|三角函数值',
    'Calculate sine, cosine and tangent for an angle in degrees.|计算角度对应的正弦、余弦和正切值。',
    [u('a', 'Angle (degrees)|角度（度）', 30)],
    (v) => {
      const q = v.a / 90,
        whole = Number.isInteger(q),
        idx = ((q % 4) + 4) % 4;
      return [
        R('Sine|正弦', whole ? [0, 1, 0, -1][idx] : Math.sin(rad(v.a))),
        R('Cosine|余弦', whole ? [1, 0, -1, 0][idx] : Math.cos(rad(v.a))),
        R(
          'Tangent|正切',
          whole && Math.abs(q % 2) === 1 ? 'Undefined|未定义' : whole ? 0 : Math.tan(rad(v.a)),
        ),
      ];
    },
    'sinθ, cosθ, tanθ=sinθ/cosθ; tangent undefined at odd multiples of 90°.|sinθ, cosθ, tanθ=sinθ/cosθ；角度为 90° 的奇数倍时，正切没有定义。',
    [0.5, 0.8660254037844386, 0.5773502691896257],
  );
  D(
    'hyperbolic-functions',
    'Hyperbolic Functions|双曲函数值',
    'Calculate hyperbolic sine, cosine and tangent for a real argument.|计算实数对应的双曲正弦、余弦和正切。',
    [n('a', 'Real argument|实数自变量', 1, -100, 100)],
    (v) => [
      R('Hyperbolic sine|双曲正弦', Math.sinh(v.a)),
      R('Hyperbolic cosine|双曲余弦', Math.cosh(v.a)),
      R('Hyperbolic tangent|双曲正切', Math.tanh(v.a)),
    ],
    "Use sinh(x) = (e^x−e^(−x))/2, cosh(x) = (e^x+e^(−x))/2 and tanh(x) = sinh(x)/cosh(x). x is the real argument and e is Euler's number.|使用 sinh(x) = (e^x−e^(−x))/2、cosh(x) = (e^x+e^(−x))/2 及 tanh(x) = sinh(x)/cosh(x)。x 为实数自变量，e 为自然常数。",
    [1.1752011936438014, 1.5430806348152437, 0.7615941559557649],
  );
  D(
    'triangle-angles',
    'Triangle Angles from Sides|三边求三角形内角',
    'Find all three angles opposite the supplied side lengths.|根据三边计算其各自对角。',
    [p('a', 'Side a|边 a', 3), p('b', 'Side b|边 b', 4), p('c', 'Side c|边 c', 5)],
    (v) => {
      const area = triangleArea(v.a, v.b, v.c);
      const angle = (a, b, c) => {
        const cosineNumerator = b >= c ? (b - a) * (b + a) + c * c : (c - a) * (c + a) + b * b;
        return deg(Math.atan2(4 * area, cosineNumerator));
      };
      return [
        R('Angle A|角 A', angle(v.a, v.b, v.c), '°'),
        R('Angle B|角 B', angle(v.b, v.a, v.c), '°'),
        R('Angle C|角 C', angle(v.c, v.a, v.b), '°'),
      ];
    },
    'A=acos((b²+c²−a²)/(2bc)); similarly for B and C.|A=acos((b²+c²−a²)/(2bc))；B 和 C 的计算方式类似。',
    [36.86989764584401, 53.13010235415598, 90],
  );
  D(
    'matrix-eigenvalues',
    '2 × 2 Matrix Eigenvalues|二阶矩阵特征值',
    'Find real or conjugate-complex eigenvalues of a two-by-two matrix.|求二阶矩阵的实特征值或共轭复特征值。',
    matrix.map((f, k) => ({ ...f, value: [2, 1, 1, 2][k] })),
    (v) => {
      const tr = v.a + v.d,
        disc = (v.a - v.d) ** 2 + 4 * v.b * v.c;
      if (disc >= 0) {
        // Recover the smaller root from the product instead of subtracting near-equals.
        const q = (tr + (tr < 0 ? -1 : 1) * Math.sqrt(disc)) / 2;
        const other = q === 0 ? 0 : (v.a * v.d - v.b * v.c) / q;
        return [
          R('First real part|第一特征值实部', Math.max(q, other)),
          R('First imaginary part|第一特征值虚部', 0),
          R('Second real part|第二特征值实部', Math.min(q, other)),
          R('Second imaginary part|第二特征值虚部', 0),
        ];
      }
      return [
        R('First real part|第一特征值实部', tr / 2),
        R('First imaginary part|第一特征值虚部', Math.sqrt(-disc) / 2),
        R('Second real part|第二特征值实部', tr / 2),
        R('Second imaginary part|第二特征值虚部', -Math.sqrt(-disc) / 2),
      ];
    },
    'For the matrix [[a,b],[c,d]], use λ = (a+d±√((a−d)²+4bc))/2. A negative discriminant gives conjugate complex eigenvalues; the result lists real and imaginary parts separately.|对矩阵 [[a,b],[c,d]]，使用 λ = (a+d±√((a−d)²+4bc))/2。判别式为负时得到共轭复特征值，结果分别列出实部与虚部。',
    [3, 0, 1, 0],
  );
  D(
    'matrix-rank',
    '2 × 2 Matrix Rank|二阶矩阵的秩',
    'Determine rank with a floating-point tolerance tied to determinant products.|以和行列式乘积尺度相关的容差判断二阶矩阵的秩。',
    matrix,
    (v) => {
      const det = v.a * v.d - v.b * v.c,
        tol = 8 * Number.EPSILON * Math.max(Math.abs(v.a * v.d), Math.abs(v.b * v.c));
      const rank = Math.abs(det) > tol ? 2 : [v.a, v.b, v.c, v.d].some((x) => x !== 0) ? 1 : 0;
      return [R('Numerical rank|数值秩', rank), R('Determinant|行列式', det)];
    },
    'Rank 2 if determinant is numerically nonzero, rank 1 for a nonzero singular matrix, otherwise 0.|行列式在数值判断中不为零时秩为 2；非零奇异矩阵的秩为 1；否则为 0。',
    [2, -2],
    'Near-singular floating-point matrices can be numerically ambiguous. Exact symbolic rank is outside this tool.|接近奇异的浮点矩阵可能存在数值歧义；本工具不计算符号精确秩。',
  );
  D(
    'linear-interpolation',
    'Linear Interpolation|线性插值',
    'Estimate a value between two known coordinate pairs.|根据两个已知点线性插值。',
    [
      u('a', 'First x|第一个 x', 0),
      u('b', 'First y|第一个 y', 10),
      u('c', 'Second x|第二个 x', 100),
      u('d', 'Second y|第二个 y', 30),
      u('x', 'Target x|目标 x', 50),
    ],
    (v) => {
      check(v.a !== v.c, 'The x coordinates must differ.|两个 x 坐标必须不同。');
      return [R('Interpolated y|插值 y', v.b + ((v.x - v.a) * (v.d - v.b)) / (v.c - v.a))];
    },
    'y=y₁+(x−x₁)(y₂−y₁)/(x₂−x₁)',
    [20],
    'Values outside the two input x coordinates are linear extrapolations, not measured observations.|目标 x 在两已知点之外时属于线性外推，而非实测值。',
  );
  D(
    'quadratic-interpolation',
    'Quadratic Interpolation|二次插值',
    'Use three points with distinct x values to evaluate a quadratic interpolant.|用三个横坐标不同的点求二次插值。',
    [
      u('a', 'Point 1: x|点 1：x', 0),
      u('b', 'Point 1: y|点 1：y', 0),
      u('c', 'Point 2: x|点 2：x', 1),
      u('d', 'Point 2: y|点 2：y', 1),
      u('e', 'Point 3: x|点 3：x', 2),
      u('f', 'Point 3: y|点 3：y', 4),
      u('x', 'Target x|目标 x', 1.5),
    ],
    (v) => {
      check(
        v.a !== v.c && v.a !== v.e && v.c !== v.e,
        'All three x coordinates must differ.|三个 x 坐标必须互不相同。',
      );
      return [
        R(
          'Interpolated y|插值 y',
          (v.b * (v.x - v.c) * (v.x - v.e)) / ((v.a - v.c) * (v.a - v.e)) +
            (v.d * (v.x - v.a) * (v.x - v.e)) / ((v.c - v.a) * (v.c - v.e)) +
            (v.f * (v.x - v.a) * (v.x - v.c)) / ((v.e - v.a) * (v.e - v.c)),
        ),
      ];
    },
    'Use y = Σ yᵢ ∏ⱼ≠ᵢ (x−xⱼ)/(xᵢ−xⱼ) over the three entered points (xᵢ,yᵢ). x is the target coordinate. The input horizontal coordinates must be distinct; outside them, the polynomial is an extrapolation.|对三个自填点 (xᵢ,yᵢ)，使用 y = Σ yᵢ ∏ⱼ≠ᵢ (x−xⱼ)/(xᵢ−xⱼ)。x 为目标横坐标，输入横坐标必须互不相同；目标位于其范围外时属于多项式外推。',
    [2.25],
  );
  D(
    'polynomial-derivative',
    'Polynomial Derivative|多项式求导',
    'Differentiate coefficient-form polynomials and evaluate the derivative at x.|对按系数输入的多项式求导，并计算指定 x 处的导数。',
    [
      text('values', 'Coefficients, highest power first|系数（从最高次到常数项）', '3,2,1'),
      u('x', 'Evaluate at x|求值点 x', 2),
    ],
    (v) => {
      const a = nums(v.values);
      check(a.length <= 21, 'Maximum polynomial degree is 20.|多项式最高支持 20 次。');
      const degree = a.length - 1,
        d = a.slice(0, -1).map((c, k) => c * (degree - k));
      return [
        R(
          'Derivative at x|该点导数',
          d.reduce((value, c) => value * v.x + c, 0),
        ),
        R(
          'Derivative coefficients, descending powers|导数系数（降幂）',
          d.length ? d.join(', ') : '0',
        ),
      ];
    },
    'd(aₙxⁿ)/dx = n aₙ x^(n−1)',
    [14, '6, 2'],
  );
  D(
    'polynomial-integral',
    'Definite Polynomial Integral|多项式定积分',
    'Integrate a coefficient-form polynomial between two limits.|计算按系数输入的多项式在两界限间的定积分。',
    [
      text('values', 'Coefficients, highest power first|系数（从最高次到常数项）', '3,2,1'),
      u('a', 'Lower limit|下限', 0),
      u('b', 'Upper limit|上限', 1),
    ],
    (v) => {
      const a = nums(v.values);
      check(a.length <= 21, 'Maximum polynomial degree is 20.|多项式最高支持 20 次。');
      const degree = a.length - 1;
      return [
        R(
          'Definite integral|定积分',
          sum(
            a.map((c, k) => {
              const p = degree - k + 1;
              return (c * (v.b ** p - v.a ** p)) / p;
            }),
          ),
        ),
      ];
    },
    'Integrate each polynomial term with ∫ aₙxⁿ dx = aₙx^(n+1)/(n+1), then evaluate F(b)−F(a). aₙ is a coefficient, n is its nonnegative integer power, and a and b are lower and upper limits. F is the summed antiderivative.|逐项使用 ∫ aₙxⁿ dx = aₙx^(n+1)/(n+1) 积分，再求 F(b)−F(a)。aₙ 为系数，n 为其非负整数幂，a 与 b 为积分下、上限，F 为各项相加所得原函数。',
    [3],
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, u, i, text, select, row: R, check, nums, gcd, choose, PI, deg } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const integers = (s) => {
    const a = nums(s);
    check(a.every(Number.isSafeInteger), 'Enter safe whole numbers.|请输入安全范围内的整数。');
    return a;
  };
  const bigGcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a || 1n;
  };
  const fraction = (value) => {
    const [m, e = '0'] = String(value).toLowerCase().split('e'),
      places = (m.split('.')[1] || '').length - Number(e);
    let a = BigInt(m.replace('.', '')),
      b = 1n;
    if (places > 0) b = 10n ** BigInt(places);
    else a *= 10n ** BigInt(-places);
    const g = bigGcd(a, b);
    return [a / g, b / g];
  };
  const points = [
    u('x1', 'First x|起点 x', 0),
    u('y1', 'First y|起点 y', 0),
    u('x2', 'Second x|终点 x', 6),
    u('y2', 'Second y|终点 y', 8),
  ];
  const matrix = [
    u('a', 'Row 1, column 1|第 1 行第 1 列', 1),
    u('b', 'Row 1, column 2|第 1 行第 2 列', 2),
    u('c', 'Row 2, column 1|第 2 行第 1 列', 3),
    u('d', 'Row 2, column 2|第 2 行第 2 列', 4),
  ];
  const vectors = [
    u('a', 'Vector A: x|向量 A：x', 1),
    u('b', 'Vector A: y|向量 A：y', 2),
    u('c', 'Vector A: z|向量 A：z', 3),
    u('d', 'Vector B: x|向量 B：x', 4),
    u('e', 'Vector B: y|向量 B：y', 5),
    u('f', 'Vector B: z|向量 B：z', 6),
  ];
  // 1–21: arithmetic and number representation.
  D(
    'ratio-simplifier',
    'Ratio Simplifier|比例化简',
    'Reduce two whole-number quantities to their smallest ratio.|把两个整数数量约成最简比例。',
    [i('a', 'First quantity|第一项', 12, 0, 1e12), i('b', 'Second quantity|第二项', 18, 0, 1e12)],
    (v) => {
      check(v.a || v.b, 'The two quantities cannot both be zero.|两项不能同时为零。');
      const g = gcd(v.a, v.b);
      return [
        R('First reduced term|化简后第一项', v.a / g),
        R('Second reduced term|化简后第二项', v.b / g),
      ];
    },
    'Use a:b = (a/g):(b/g), where g = gcd(a,b) is the greatest common divisor of the entered nonnegative integers. The quantities cannot both be zero.|使用 a:b = (a/g):(b/g)，其中 g = gcd(a,b) 为自填非负整数的最大公约数；两项不能同时为零。',
    [2, 3],
  );
  D(
    'proportion',
    'Proportion Calculator|比例方程',
    'Solve the missing fourth term when a/b = c/x.|已知 a/b = c/x，求第四项 x。',
    [p('a', 'a|a', 3), p('b', 'b|b', 4), u('c', 'c|c', 6)],
    (v) => [R('Missing value x|未知项 x', (v.b * v.c) / v.a)],
    'x = b × c ÷ a',
    [8],
  );
  D(
    'percent-error',
    'Percent Error|百分误差',
    'Compare a measurement with a nonzero reference value.|比较测量值与非零参考值的误差。',
    [u('a', 'Measured value|测量值', 98), u('b', 'Reference value|参考值', 100)],
    (v) => {
      check(v.b !== 0, 'Reference cannot be zero.|参考值不能为零。');
      return [
        R('Absolute percent error|绝对百分误差', Math.abs((v.a - v.b) / v.b) * 100, '%'),
        R('Signed relative error|带符号相对误差', ((v.a - v.b) / Math.abs(v.b)) * 100, '%'),
      ];
    },
    'Use E = 100abs(m−r)/abs(r). m is measured value, r is the nonzero reference in the same unit, and abs means absolute value. E is percent error.|使用 E = 100abs(m−r)/abs(r)。m 为测量值，r 为同单位非零参考值，abs 表示绝对值；E 为百分误差。',
    [2, -2],
  );
  D(
    'percent-difference',
    'Percent Difference|百分差异',
    'Compare two nonnegative values symmetrically using their average.|以两数均值为基准，对称比较两个非负数。',
    [n('a', 'First value|第一个值', 80), n('b', 'Second value|第二个值', 100)],
    (v) => {
      check(v.a + v.b > 0, 'At least one value must be positive.|至少一个值应大于零。');
      return [R('Percent difference|百分差异', (200 * Math.abs(v.a - v.b)) / (v.a + v.b), '%')];
    },
    '100 × |a − b| ÷ ((a + b) ÷ 2)',
    [22.22222222222222],
  );
  D(
    'decimal-to-fraction',
    'Decimal to Fraction|小数转分数',
    'Convert the entered finite decimal into a reduced fraction.|将输入的有限小数转为约分后的分数。',
    [u('a', 'Decimal|小数', 0.125)],
    (v) => {
      const [a, b] = fraction(v.a);
      return [
        R('Reduced fraction|最简分数', a + '/' + b),
        R('Numerator|分子', a.toString()),
        R('Denominator|分母', b.toString()),
      ];
    },
    'Remove the decimal point, divide by 10ⁿ, then reduce by gcd.|移除小数点，以 10ⁿ 为分母，再用 gcd（最大公约数）约分。',
    ['1/8', '1', '8'],
    'The decimal is interpreted as the JavaScript numeric input, with up to about 15 significant digits.|按数值输入解析小数，精度约为 15 位有效数字。',
  );
  D(
    'mixed-number',
    'Mixed Number to Improper Fraction|带分数转假分数',
    'Convert a signed whole part and fractional part into one fraction.|将带符号的带分数转为假分数。',
    [
      select('sign', 'Sign|符号', '+', [
        ['+', 'Positive|正'],
        ['-', 'Negative|负'],
      ]),
      i('a', 'Whole part|整数部分', 2, 0, 1e12),
      i('b', 'Fraction numerator|分数部分的分子', 1, 0, 1e12),
      i('c', 'Fraction denominator|分母', 3, 1, 1e12),
    ],
    (v) => {
      const a = BigInt(v.a) * BigInt(v.c) + BigInt(v.b),
        b = BigInt(v.c),
        g = bigGcd(a, b),
        num = (v.sign === '-' ? -a : a) / g;
      return [
        R('Improper fraction|假分数', num + '/' + b / g),
        R('Decimal|小数', Number(num) / Number(b / g)),
      ];
    },
    'Use s(wd+n)/d. w is the whole part, n is fractional numerator, d is denominator, and s is the selected sign. The resulting fraction is reduced by its greatest common divisor.|使用 s(wd+n)/d。w 为整数部分，n 为分数部分的分子，d 为分母，s 为自选正负号；所得分数再按最大公约数约分。',
    ['7/3', 7 / 3],
  );
  D(
    'integer-division',
    'Integer Division with Remainder|整数除法与余数',
    'Find the quotient rounded toward zero and the remaining signed amount.|求向零取整的商及带符号余数。',
    [i('a', 'Dividend|被除数', 17, -1e12, 1e12), i('b', 'Divisor|除数', 5, -1e12, 1e12)],
    (v) => {
      check(v.b !== 0, 'Divisor cannot be zero.|除数不能为零。');
      const q = Math.trunc(v.a / v.b);
      return [R('Quotient|商', q), R('Remainder|余数', v.a - v.b * q)];
    },
    'Use q = trunc(a/b) and r = a−bq. a is dividend and b is nonzero divisor. trunc rounds toward zero; q is quotient and r is the signed remainder.|使用 q = trunc(a/b) 及 r = a−bq。a 为被除数，b 为非零除数；trunc 表示向零取整，q 为商，r 为带符号余数。',
    [3, 2],
  );
  D(
    'modular-arithmetic',
    'Modular Arithmetic|模运算',
    'Add, multiply or exponentiate integers under a positive modulus.|在正模数下进行整数加法、乘法或乘方。',
    [
      i('a', 'First integer|第一个整数', 17, -1e12, 1e12),
      i('b', 'Second integer or exponent|第二个整数或指数', 5, 0, 1e9),
      i('m', 'Modulus|模数', 7, 1, 1e12),
      select('op', 'Operation|运算', 'multiply', [
        ['add', 'Addition|加法'],
        ['multiply', 'Multiplication|乘法'],
        ['power', 'Exponentiation|乘方'],
      ]),
    ],
    (v) => {
      const m = BigInt(v.m),
        norm = (x) => ((x % m) + m) % m;
      let a = norm(BigInt(v.a)),
        b = BigInt(v.b),
        r;
      if (v.op === 'add') r = norm(a + b);
      else if (v.op === 'multiply') r = norm(a * b);
      else {
        r = 1n % m;
        while (b) {
          if (b & 1n) r = norm(r * a);
          a = norm(a * a);
          b >>= 1n;
        }
      }
      return [R('Residue|模余数', Number(r))];
    },
    '0 ≤ result < modulus; modular exponentiation uses repeated squaring.|0 ≤ result < modulus；模幂采用重复平方法。',
    [1],
  );
  D(
    'greatest-common-factor',
    'Greatest Common Factor|最大公因数',
    'Find the largest factor shared by a list of integers.|求一组整数共有的最大因数。',
    [text('values', 'Whole numbers|整数列表', '12, 18, 30')],
    (v) => {
      const a = integers(v.values);
      check(
        a.some((x) => x !== 0),
        'Not all integers may be zero.|整数不能全部为零。',
      );
      return [R('Greatest common factor|最大公因数', a.reduce(gcd))];
    },
    'Euclidean algorithm, applied across the list.|对整个数列依次应用欧几里得算法。',
    [6],
  );
  D(
    'least-common-multiple',
    'Least Common Multiple|最小公倍数',
    'Find the smallest positive common multiple of nonzero integers.|求非零整数的最小正公倍数。',
    [text('values', 'Nonzero whole numbers|非零整数列表', '12, 18, 30')],
    (v) => {
      const a = integers(v.values);
      check(
        a.every((x) => x !== 0),
        'Every input must be nonzero.|各输入都应非零。',
      );
      let r = 1n;
      for (const x of a) {
        const z = BigInt(Math.abs(x));
        r = (r / bigGcd(r, z)) * z;
      }
      return [R('Least common multiple|最小公倍数', r.toString())];
    },
    'Use lcm(a,b) = abs(ab)/gcd(a,b) repeatedly across the entered nonzero integers. gcd is greatest common divisor and abs means absolute value. The result is the least positive common multiple.|对自填非零整数依次使用 lcm(a,b) = abs(ab)/gcd(a,b)。gcd 为最大公约数，abs 表示绝对值；结果为最小正公倍数。',
    ['180'],
  );
  D(
    'prime-factorization',
    'Prime Factorization|质因数分解',
    'Write a positive integer as a product of prime powers.|把正整数写成质数幂的乘积。',
    [i('a', 'Integer|整数', 360, 2, 1e12)],
    (v) => {
      let x = v.a;
      const a = [];
      for (let d = 2; d * d <= x; d += d === 2 ? 1 : 2) {
        if (x % d) continue;
        let c = 0;
        while (x % d === 0) {
          x /= d;
          c++;
        }
        a.push(c === 1 ? String(d) : d + '^' + c);
      }
      if (x > 1) a.push(String(x));
      return [
        R('Prime factors|质因数', a.join(' × ')),
        R('Distinct prime factors|不同质因数数量', a.length),
      ];
    },
    'Repeatedly divide by prime candidates up to √n.|用不超过 √n 的候选质因数反复试除。',
    ['2^3 × 3^2 × 5', 3],
  );
  D(
    'prime-number',
    'Prime Number Check|质数判断',
    'Check whether an integer has any divisor other than one and itself.|判断整数是否只有 1 和自身两个正因数。',
    [i('a', 'Integer|整数', 97, 0, 1e12)],
    (v) => {
      let prime = v.a >= 2,
        divisor = 0;
      if (prime)
        for (let d = 2; d * d <= v.a; d += d === 2 ? 1 : 2)
          if (v.a % d === 0) {
            prime = false;
            divisor = d;
            break;
          }
      return [
        R('Classification|分类', prime ? 'Prime number|质数' : 'Not a prime number|非质数'),
        R('Smallest nontrivial divisor, zero if none|最小非平凡因数（没有则为零）', divisor),
      ];
    },
    'A prime integer n ≥ 2 has no divisor between 2 and √n.|质数 n ≥ 2 在 2 到 √n 之间没有整数因数。',
    ['Prime number|质数', 0],
  );
  D(
    'square-root',
    'Square Root|平方根',
    'Find the nonnegative principal square root and its opposite.|求非负主平方根及其相反数。',
    [n('a', 'Radicand|被开方数', 81)],
    (v) => [
      R('Principal square root|主平方根', Math.sqrt(v.a)),
      R('Negative root|负平方根', -Math.sqrt(v.a)),
    ],
    'Use r = √x with r ≥ 0. x is the nonnegative radicand and r is its principal square root. The other displayed root is its opposite.|使用 r = √x，且 r ≥ 0。x 为非负被开方数，r 为主平方根；另一个显示值为其相反数。',
    [9, -9],
  );
  D(
    'cube-root',
    'Cube Root|立方根',
    'Find the real cube root of a positive or negative value.|求正数或负数的实数立方根。',
    [u('a', 'Radicand|被开方数', -27)],
    (v) => [R('Real cube root|实数立方根', Math.cbrt(v.a))],
    'r³ = x',
    [-3],
  );
  D(
    'nth-root',
    'Nth Root|n 次方根',
    'Find a real nth root with explicit handling of negative inputs.|求 n 次实数根，并检查负数的根次数。',
    [u('a', 'Radicand|被开方数', 32), i('b', 'Root degree|根次数', 5, 1, 1000)],
    (v) => {
      check(
        v.a >= 0 || v.b % 2 === 1,
        'A negative number needs an odd root degree.|负数的实数根要求奇数根次数。',
      );
      return [R('Real root|实数根', Math.sign(v.a) * Math.abs(v.a) ** (1 / v.b))];
    },
    'Use r = sign(x)abs(x)^(1/n). x is the radicand, n is a positive integer root degree, abs means absolute value, and sign gives the sign of the input. Negative inputs require an odd root degree.|使用 r = sign(x)abs(x)^(1/n)。x 为被开方数，n 为正整数根次数，abs 表示绝对值，sign 返回输入的符号；负数的实数根要求奇数根次数。',
    [2],
  );
  D(
    'exponent',
    'Exponent Calculator|乘方计算器',
    'Raise a real base to an exponent within the real-number domain.|计算实数底数的乘方，检查实数定义域。',
    [u('a', 'Base|底数', 2), u('b', 'Exponent|指数', 10)],
    (v) => {
      check(
        !(v.a === 0 && v.b <= 0) && !(v.a < 0 && !Number.isInteger(v.b)),
        'This power is outside the supported real-number domain.|此乘方不在支持的实数定义域内。',
      );
      return [R('Exponentiation result|乘方结果', v.a ** v.b)];
    },
    'Use y = b^e. b is the real base and e is the entered exponent. This tool requires an integer exponent for a negative base and a positive exponent for a zero base.|使用 y = b^e。b 为实数底数，e 为自填指数；本工具对负底数要求整数指数，对零底数要求正指数。',
    [1024],
  );
  D(
    'logarithm',
    'Logarithm Calculator|对数计算器',
    'Find the logarithm of a positive value in a valid chosen base.|计算正数在指定合法底数下的对数。',
    [p('a', 'Value|数值', 1000), p('b', 'Base|底数', 10)],
    (v) => {
      check(v.b !== 1, 'Logarithm base cannot be one.|对数底数不能为 1。');
      return [R('Logarithm|对数', Math.log(v.a) / Math.log(v.b))];
    },
    'Use log_b(x) = ln(x)/ln(b). x is a positive value and b is a positive base other than unity. ln is the natural logarithm.|使用 log_b(x) = ln(x)/ln(b)。x 为正数，b 为大于零且不等于一的底数，ln 为自然对数。',
    [3],
  );
  D(
    'scientific-notation',
    'Scientific Notation|科学计数法',
    'Separate a finite number into its decimal coefficient and power of ten.|把有限数拆成十进制系数和 10 的指数。',
    [u('a', 'Value|数值', 12345)],
    (v) => {
      const [coefficient, exponent] = v.a.toExponential().split('e'),
        m = Number(coefficient),
        e = Number(exponent);
      return [R('Coefficient|系数', m), R('Power of ten|10 的指数', e)];
    },
    'Write x = m×10^e. x is the entered value, m is the coefficient, and e is an integer exponent. For nonzero input, 1 ≤ abs(m) < 10; abs means absolute value. Zero uses zero coefficient and exponent.|写成 x = m×10^e。x 为输入值，m 为系数，e 为整数指数；输入非零时满足 1 ≤ abs(m) < 10，abs 表示绝对值；零使用零系数和零指数。',
    [1.2345, 4],
  );
  D(
    'rounding',
    'Rounding Calculator|四舍五入',
    'Round a value to decimal places using ties away from zero.|按指定位数取整，恰好一半时向远离零的方向舍入。',
    [
      u('a', 'Value|数值', 123.456),
      i('b', 'Decimal places; negative rounds tens|小数位数（负数舍入到十位等）', 2, -12, 12),
    ],
    (v) => {
      const f = 10 ** v.b;
      return [
        R(
          'Rounded value|舍入结果',
          (Math.sign(v.a) * Math.round((Math.abs(v.a) + Number.EPSILON) * f)) / f,
        ),
      ];
    },
    'Use R = sign(x)round(abs(x)×10^p)/10^p. x is the value and p is decimal places. abs means absolute value; sign restores the sign. Halfway cases round away from zero; negative places round to larger place values.|使用 R = sign(x)round(abs(x)×10^p)/10^p。x 为数值，p 为小数位数；abs 表示绝对值，sign 恢复正负号；恰好一半时向远离零的方向舍入，负位数舍入到更高数位。',
    [123.46],
  );
  D(
    'significant-figures',
    'Significant Figures Rounding|有效数字舍入',
    'Round a numeric value to the selected count of significant figures.|把数值舍入到指定的有效数字位数。',
    [u('a', 'Value|数值', 1.23456), i('b', 'Significant figures|有效数字位数', 3, 1, 15)],
    (v) => [R('Rounded value|舍入结果', Number(v.a.toPrecision(v.b)))],
    'Keep the first n significant digits; trailing display zeros are not measurement precision.|保留前 n 位有效数字；显示时补在末尾的零不代表测量精度。',
    [1.23],
  );
  D(
    'absolute-value',
    'Absolute Value|绝对值',
    'Find a number’s distance from zero and its sign.|计算数到零的距离并判断正负号。',
    [u('a', 'Value|数值', -12.5)],
    (v) => [R('Absolute value|绝对值', Math.abs(v.a)), R('Sign|符号', Math.sign(v.a))],
    'Use A = abs(x). x is the entered real number and abs means its distance from zero. The absolute value is nonnegative; the separate sign result identifies positive, negative or zero input.|使用 A = abs(x)。x 为自填实数，abs 表示到零的距离；绝对值非负，单独列出的符号结果区分正数、负数或零。',
    [12.5, -1],
  );
  // 22–47: coordinates, algebra, matrices and vectors.
  D(
    'slope',
    'Slope between Two Points|两点斜率',
    'Find rise divided by run and identify vertical lines.|求两点间的纵向变化与横向变化之比。',
    points,
    (v) => {
      const dx = v.x2 - v.x1,
        dy = v.y2 - v.y1;
      check(dx || dy, 'The points must be distinct.|两点不能重合。');
      return [
        R('Slope|斜率', dx === 0 ? 'Undefined: vertical line|未定义：垂直直线' : dy / dx),
        R('Rise|纵向变化', dy),
        R('Run|横向变化', dx),
      ];
    },
    'Use m = (y₂−y₁)/(x₂−x₁) for points (x₁,y₁) and (x₂,y₂). m is slope. The points must differ; equal horizontal coordinates produce a vertical line with undefined slope.|对点 (x₁,y₁) 与 (x₂,y₂)，使用 m = (y₂−y₁)/(x₂−x₁)，其中 m 为斜率；两点必须不同，横坐标相等时为垂直直线，斜率无定义。',
    [4 / 3, 8, 6],
  );
  D(
    'line-equation',
    'Line through Two Points|两点确定直线',
    'Calculate the coefficients of Ax + By + C = 0, including vertical lines.|根据两点求直线一般式，支持垂直直线。',
    points,
    (v) => {
      check(v.x1 !== v.x2 || v.y1 !== v.y2, 'The points must be distinct.|两点不能重合。');
      return [R('A|A', v.y1 - v.y2), R('B|B', v.x2 - v.x1), R('C|C', v.x1 * v.y2 - v.x2 * v.y1)];
    },
    'A = y₁ − y₂; B = x₂ − x₁; C = x₁y₂ − x₂y₁; Ax + By + C = 0',
    [-8, 6, 0],
  );
  D(
    'midpoint',
    'Midpoint Calculator|中点计算器',
    'Find the coordinate halfway between two points.|求两点之间的中点坐标。',
    points,
    (v) => [R('Midpoint x|中点 x', (v.x1 + v.x2) / 2), R('Midpoint y|中点 y', (v.y1 + v.y2) / 2)],
    'M = ((x₁+x₂)/2, (y₁+y₂)/2)',
    [3, 4],
  );
  D(
    'distance-between-points',
    'Distance between Points|两点距离',
    'Find straight-line Euclidean distance in two dimensions.|计算二维坐标中两点的直线距离。',
    points,
    (v) => [R('Distance|距离', Math.hypot(v.x2 - v.x1, v.y2 - v.y1))],
    'd = √((x₂−x₁)² + (y₂−y₁)²)',
    [10],
  );
  D(
    'section-formula',
    'Internal Division Point|内分点计算器',
    'Locate a point dividing a line segment in a positive ratio.|按正比例求线段的内分点。',
    [
      ...points,
      p('m', 'First ratio term|第一段比例', 1),
      p('n', 'Second ratio term|第二段比例', 2),
    ],
    (v) => [
      R('Division point x|内分点 x', (v.n * v.x1 + v.m * v.x2) / (v.m + v.n)),
      R('Division point y|内分点 y', (v.n * v.y1 + v.m * v.y2) / (v.m + v.n)),
    ],
    'P = (nA + mB) ÷ (m+n), AP:PB = m:n',
    [2, 8 / 3],
  );
  D(
    'perpendicular-bisector',
    'Perpendicular Bisector|垂直平分线',
    'Find coefficients of the perpendicular bisector of a segment.|求线段垂直平分线的一般式系数。',
    points,
    (v) => {
      const a = v.x2 - v.x1,
        b = v.y2 - v.y1;
      check(a || b, 'The points must be distinct.|两点不能重合。');
      return [R('A|A', a), R('B|B', b), R('C|C', -(a * (v.x1 + v.x2) + b * (v.y1 + v.y2)) / 2)];
    },
    'A=x₂−x₁; B=y₂−y₁; C=−A(x₁+x₂)/2−B(y₁+y₂)/2',
    [6, 8, -50],
  );
  D(
    'discriminant',
    'Quadratic Discriminant|二次方程判别式',
    'Classify the real roots of ax² + bx + c using the discriminant.|用判别式判断二次方程的实根情况。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', -5), u('c', 'c|c', 6)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      const d = v.b * v.b - 4 * v.a * v.c;
      return [
        R('Discriminant|判别式', d),
        R('Distinct real roots|不同实根数量', d > 0 ? 2 : d === 0 ? 1 : 0),
      ];
    },
    'Δ = b² − 4ac',
    [1, 2],
  );
  D(
    'completing-square',
    'Completing the Square|配方法',
    'Rewrite ax² + bx + c as a(x + h)² + k.|把二次式写成 a(x+h)²+k 的形式。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', 6), u('c', 'c|c', 5)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      return [
        R('Inside shift h|括号内平移量 h', v.b / (2 * v.a)),
        R('Outside constant k|括号外常数 k', v.c - (v.b * v.b) / (4 * v.a)),
      ];
    },
    'h=b/(2a); k=c−b²/(4a)',
    [3, -4],
  );
  D(
    'cubic-real-roots',
    'Cubic Real Roots|一元三次方程实根',
    'Find the real roots of a cubic polynomial using its depressed form.|用降幂形式求一元三次方程的实根。',
    [
      u('a', 'Cubic coefficient a|三次项系数 a', 1),
      u('b', 'Quadratic coefficient b|二次项系数 b', -6),
      u('c', 'Linear coefficient c|一次项系数 c', 11),
      u('d', 'Constant d|常数 d', -6),
    ],
    (v) => {
      check(v.a !== 0, 'Cubic coefficient cannot be zero.|三次项系数不能为零。');
      const b = v.b / v.a,
        c = v.c / v.a,
        d = v.d / v.a,
        p = c - (b * b) / 3,
        q = (2 * b ** 3) / 27 - (b * c) / 3 + d,
        disc = (q * q) / 4 + p ** 3 / 27;
      let roots;
      if (Math.abs(disc) < 1e-12) {
        const z = Math.cbrt(-q / 2);
        roots = [2 * z - b / 3, -z - b / 3];
      } else if (disc > 0)
        roots = [Math.cbrt(-q / 2 + Math.sqrt(disc)) + Math.cbrt(-q / 2 - Math.sqrt(disc)) - b / 3];
      else {
        const angle = Math.acos(Math.max(-1, Math.min(1, ((3 * q) / (2 * p)) * Math.sqrt(-3 / p))));
        roots = [0, 1, 2].map(
          (k) => 2 * Math.sqrt(-p / 3) * Math.cos((angle - 2 * PI * k) / 3) - b / 3,
        );
      }
      roots = [...new Set(roots.sort((a, b) => a - b).map((x) => Number(x.toPrecision(10))))];
      return [
        R('Real roots|实根', roots.join(', ')),
        R('Distinct real roots|不同实根数量', roots.length),
      ];
    },
    'x=y−b/(3a); solve y³+py+q=0 with Cardano/trigonometric formulas.|x=y−b/(3a)；用卡尔达诺公式或三角公式求解 y³+py+q=0。',
    ['1, 2, 3', 3],
    'Numerical real roots, rounded to 10 significant digits. Near repeated roots, rescaling coefficients improves reliability.|数值实根显示 10 位有效数字；接近重根时应缩放系数并复核。',
  );
  D(
    'arithmetic-sequence',
    'Arithmetic Sequence|等差数列',
    'Find the nth term and sum of an arithmetic progression.|计算等差数列的第 n 项及前 n 项和。',
    [
      u('a', 'First term|首项', 3),
      u('d', 'Common difference|公差', 2),
      i('n', 'Number of terms|项数', 10, 1, 1e9),
    ],
    (v) => [
      R('Nth term|第 n 项', v.a + (v.n - 1) * v.d),
      R('Sum|前 n 项和', (v.n * (2 * v.a + (v.n - 1) * v.d)) / 2),
    ],
    'aₙ=a₁+(n−1)d; Sₙ=n(2a₁+(n−1)d)/2',
    [21, 120],
  );
  D(
    'geometric-sequence',
    'Geometric Sequence|等比数列',
    'Find the nth term and finite sum with an editable common ratio.|按公比计算等比数列的第 n 项及有限和。',
    [
      u('a', 'First term|首项', 2),
      u('r', 'Common ratio|公比', 3),
      i('n', 'Number of terms|项数', 5, 1, 1000),
    ],
    (v) => [
      R('Nth term|第 n 项', v.a * v.r ** (v.n - 1)),
      R('Finite sum|前 n 项和', v.r === 1 ? v.a * v.n : (v.a * (1 - v.r ** v.n)) / (1 - v.r)),
    ],
    'aₙ=a₁r^(n−1); Sₙ=a₁(1−rⁿ)/(1−r), with r=1 handled separately.|aₙ=a₁r^(n−1); Sₙ=a₁(1−rⁿ)/(1−r)，其中 r=1 的情况单独处理。',
    [162, 242],
  );
  D(
    'fibonacci',
    'Fibonacci Number|斐波那契数',
    'Calculate an exact Fibonacci number with F₀=0 and F₁=1.|以 F₀=0、F₁=1 为约定，计算精确斐波那契数。',
    [i('n', 'Index n|下标 n', 20, 0, 1000)],
    (v) => {
      let a = 0n,
        b = 1n;
      for (let k = 0; k < v.n; k++) [a, b] = [b, a + b];
      return [
        R('Fibonacci number|斐波那契数', a.toString()),
        R('Next number|下一项', b.toString()),
      ];
    },
    'Fₙ = Fₙ₋₁ + Fₙ₋₂',
    ['6765', '10946'],
  );
  D(
    'sum-of-integers',
    'Sum of Consecutive Integers|连续整数求和',
    'Sum all positive integers from one through n.|计算从 1 到 n 的正整数之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 1e7)],
    (v) => [R('Sum|总和', (v.n * (v.n + 1)) / 2)],
    '1+2+…+n = n(n+1)/2',
    [5050],
  );
  D(
    'sum-of-squares',
    'Sum of Squares|平方和',
    'Sum the squares of positive integers from one through n.|计算 1 到 n 各整数的平方之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 1e6)],
    (v) => [R('Sum of squares|平方和', (v.n * (v.n + 1) * (2 * v.n + 1)) / 6)],
    '1²+2²+…+n² = n(n+1)(2n+1)/6',
    [338350],
  );
  D(
    'sum-of-cubes',
    'Sum of Cubes|立方和',
    'Sum the cubes of positive integers from one through n.|计算 1 到 n 各整数的立方之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 100000)],
    (v) => [R('Sum of cubes|立方和', ((v.n * (v.n + 1)) / 2) ** 2)],
    '1³+2³+…+n³ = [n(n+1)/2]²',
    [25502500],
  );
  D(
    'binomial-expansion',
    'Binomial Expansion Coefficients|二项式展开系数',
    'Generate coefficients of (ax+b)ⁿ from highest to lowest power.|按幂次从高到低列出 (ax+b)ⁿ 的展开系数。',
    [
      u('a', 'Coefficient a|系数 a', 1),
      u('b', 'Constant b|常数 b', 1),
      i('n', 'Power n|幂次 n', 3, 0, 20),
    ],
    (v) => [
      R(
        'Coefficients, descending powers|系数（幂次降序）',
        Array.from({ length: v.n + 1 }, (_, k) =>
          Number((Math.round(choose(v.n, k)) * v.a ** (v.n - k) * v.b ** k).toPrecision(12)),
        ).join(', '),
      ),
    ],
    'In (ax+b)^n, the coefficient of x^(n−k) is C(n,k)a^(n−k)b^k. a and b are entered constants, n is the nonnegative integer power, and k runs from zero through that power. C(n,k) is a binomial coefficient.|在 (ax+b)^n 中，x^(n−k) 的系数为 C(n,k)a^(n−k)b^k。a 与 b 为自填常数，n 为非负整数幂，k 从零取到该幂次，C(n,k) 为二项式系数。',
    ['1, 3, 3, 1'],
  );
  D(
    'quadratic-vertex',
    'Quadratic Vertex|抛物线顶点',
    'Find the vertex, axis and opening direction of a quadratic.|求二次函数的顶点、对称轴和开口方向。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', -4), u('c', 'c|c', 3)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      const x = -v.b / (2 * v.a);
      return [
        R('Vertex x|顶点 x', x),
        R('Vertex y|顶点 y', v.a * x * x + v.b * x + v.c),
        R('Opening|开口', v.a > 0 ? 'Upward|向上' : 'Downward|向下'),
      ];
    },
    'xᵥ=−b/(2a); yᵥ=axᵥ²+bxᵥ+c',
    [2, -1, 'Upward|向上'],
  );
  D(
    'matrix-determinant',
    '2 × 2 Matrix Determinant|二阶矩阵行列式',
    'Calculate determinant and identify singular two-by-two matrices.|计算二阶矩阵的行列式，判断是否奇异。',
    matrix,
    (v) => [R('Determinant|行列式', v.a * v.d - v.b * v.c)],
    'For matrix [[a,b],[c,d]], use det = ad−bc. The letters give entries in row order. A zero determinant identifies a singular matrix.|对矩阵 [[a,b],[c,d]]，使用 det = ad−bc。字母按行表示矩阵元素，行列式为零表示矩阵奇异。',
    [-2],
  );
  D(
    'matrix-inverse',
    '2 × 2 Matrix Inverse|二阶矩阵求逆',
    'Find the four entries of a nonsingular matrix inverse.|求非奇异二阶矩阵的逆矩阵四个元素。',
    matrix,
    (v) => {
      const d = v.a * v.d - v.b * v.c;
      check(d !== 0, 'A singular matrix has no inverse.|奇异矩阵没有逆矩阵。');
      return [
        R('Inverse row 1, column 1|逆矩阵第 1 行第 1 列', v.d / d),
        R('Inverse row 1, column 2|逆矩阵第 1 行第 2 列', -v.b / d),
        R('Inverse row 2, column 1|逆矩阵第 2 行第 1 列', -v.c / d),
        R('Inverse row 2, column 2|逆矩阵第 2 行第 2 列', v.a / d),
      ];
    },
    'A⁻¹ = [[d,−b],[−c,a]] ÷ (ad−bc)',
    [-2, 1, 1.5, -0.5],
  );
  D(
    'matrix-multiplication',
    '2 × 2 Matrix Multiplication|二阶矩阵乘法',
    'Multiply two two-by-two matrices in the stated order.|按指定顺序计算两个二阶矩阵的乘积。',
    [
      ...matrix,
      u('e', 'B: row 1, column 1|B：第 1 行第 1 列', 5),
      u('f', 'B: row 1, column 2|B：第 1 行第 2 列', 6),
      u('g', 'B: row 2, column 1|B：第 2 行第 1 列', 7),
      u('h', 'B: row 2, column 2|B：第 2 行第 2 列', 8),
    ],
    (v) => [
      R('Product row 1, column 1|积第 1 行第 1 列', v.a * v.e + v.b * v.g),
      R('Product row 1, column 2|积第 1 行第 2 列', v.a * v.f + v.b * v.h),
      R('Product row 2, column 1|积第 2 行第 1 列', v.c * v.e + v.d * v.g),
      R('Product row 2, column 2|积第 2 行第 2 列', v.c * v.f + v.d * v.h),
    ],
    'Cᵢⱼ = Σ Aᵢₖ Bₖⱼ',
    [19, 22, 43, 50],
  );
  D(
    'complex-number',
    'Complex Arithmetic|复数运算',
    'Add, subtract, multiply or divide two complex numbers.|对两个复数进行加减乘除。',
    [
      u('a', 'A real part|A 实部', 2),
      u('b', 'A imaginary part|A 虚部', 3),
      u('c', 'B real part|B 实部', 4),
      u('d', 'B imaginary part|B 虚部', -5),
      select('op', 'Operation|运算', 'add', [
        ['add', 'Add|相加'],
        ['subtract', 'Subtract|相减'],
        ['multiply', 'Multiply|相乘'],
        ['divide', 'Divide|相除'],
      ]),
    ],
    (v) => {
      let a, b;
      if (v.op === 'add') {
        a = v.a + v.c;
        b = v.b + v.d;
      } else if (v.op === 'subtract') {
        a = v.a - v.c;
        b = v.b - v.d;
      } else if (v.op === 'multiply') {
        a = v.a * v.c - v.b * v.d;
        b = v.a * v.d + v.b * v.c;
      } else {
        const den = v.c * v.c + v.d * v.d;
        check(den > 0, 'Cannot divide by zero.|不能除以零。');
        a = (v.a * v.c + v.b * v.d) / den;
        b = (v.b * v.c - v.a * v.d) / den;
      }
      return [R('Result real part|结果实部', a), R('Result imaginary part|结果虚部', b)];
    },
    '(a+bi)(c+di)=(ac−bd)+(ad+bc)i; division uses the conjugate.|(a+bi)(c+di)=(ac−bd)+(ad+bc)i；除法使用共轭复数。',
    [6, -2],
  );
  D(
    'polar-coordinates',
    'Cartesian to Polar Coordinates|直角坐标转极坐标',
    'Convert a point into radius and signed angle using atan2.|用 atan2 将平面坐标转为半径和带符号角度。',
    [u('x', 'x coordinate|x 坐标', 3), u('y', 'y coordinate|y 坐标', 4)],
    (v) => [
      R('Radius|半径', Math.hypot(v.x, v.y)),
      R('Angle|角度', deg(Math.atan2(v.y, v.x)), '°'),
    ],
    'Use r = √(x²+y²) and θ = atan2(y,x). x and y are Cartesian coordinates in the same unit. Radius r keeps that unit; the signed angle θ is converted from radians to degrees for display.|使用 r = √(x²+y²) 及 θ = atan2(y,x)。x 与 y 为同单位直角坐标，半径 r 使用该单位，带符号角 θ 从弧度换算成度显示。',
    [5, 53.13010235415598],
  );
  D(
    'vector-dot-product',
    'Vector Dot Product|向量点积',
    'Find the scalar product of two three-dimensional vectors.|求两个三维向量的数量积。',
    vectors,
    (v) => [R('Dot product|点积', v.a * v.d + v.b * v.e + v.c * v.f)],
    'A·B = aₓbₓ+aᵧbᵧ+a_zb_z',
    [32],
  );
  D(
    'vector-cross-product',
    'Vector Cross Product|向量叉积',
    'Find the three coordinates of the cross product in right-hand order.|按右手系求两个三维向量的叉积坐标。',
    vectors,
    (v) => [
      R('Cross product x|叉积 x', v.b * v.f - v.c * v.e),
      R('Cross product y|叉积 y', v.c * v.d - v.a * v.f),
      R('Cross product z|叉积 z', v.a * v.e - v.b * v.d),
    ],
    'A×B = (aᵧb_z−a_zbᵧ, a_zbₓ−aₓb_z, aₓbᵧ−aᵧbₓ)',
    [-3, 6, -3],
  );
  D(
    'vector-magnitude',
    'Vector Magnitude and Unit Vector|向量模与单位向量',
    'Find vector length and the normalized direction of a nonzero vector.|求非零三维向量的模及归一化方向。',
    [
      u('a', 'x component|x 分量', 3),
      u('b', 'y component|y 分量', 4),
      u('c', 'z component|z 分量', 0),
    ],
    (v) => {
      const m = Math.hypot(v.a, v.b, v.c);
      check(m > 0, 'The zero vector has no unit direction.|零向量没有单位方向。');
      return [
        R('Magnitude|模', m),
        R('Unit vector x|单位向量 x', v.a / m),
        R('Unit vector y|单位向量 y', v.b / m),
        R('Unit vector z|单位向量 z', v.c / m),
      ];
    },
    'Use M = √(x²+y²+z²) and u = (x/M,y/M,z/M). x, y and z are vector components, M is magnitude, and u is the unit direction. The vector must be nonzero.|使用 M = √(x²+y²+z²) 及 u = (x/M,y/M,z/M)。x、y、z 为向量分量，M 为向量模，u 为单位方向；向量必须非零。',
    [5, 0.6, 0.8, 0],
  );
  D(
    'angle-between-vectors',
    'Angle between Vectors|向量夹角',
    'Find the smaller angle between two nonzero vectors.|求两个非零三维向量之间的较小夹角。',
    [...vectors.map((f) => ({ ...f, value: ['a', 'e'].includes(f.id) ? 1 : 0 }))],
    (v) => {
      const unit = (components) => {
        const scale = Math.max(...components.map(Math.abs));
        check(scale > 0, 'Both vectors must be nonzero.|两个向量都应非零。');
        const scaled = components.map((component) => component / scale);
        const length = Math.hypot(...scaled);
        return scaled.map((component) => component / length);
      };
      const a = unit([v.a, v.b, v.c]),
        b = unit([v.d, v.e, v.f]);
      const difference = Math.hypot(...a.map((component, index) => component - b[index]));
      const combined = Math.hypot(...a.map((component, index) => component + b[index]));
      return [R('Angle|夹角', deg(2 * Math.atan2(difference, combined)), '°')];
    },
    'Use θ = acos[(A·B)/(norm(A)norm(B))]. A and B are nonzero vectors, the dot denotes their dot product, and norm means Euclidean magnitude. The angle is displayed in degrees.|使用 θ = acos[(A·B)/(norm(A)norm(B))]。A 与 B 为非零向量，点号表示点积，norm 表示欧几里得模；夹角以度显示。',
    [90],
  );
})();

;
(() => {
  'use strict';
  const { add, n, i, text, row: R, check, sum } = CMModels;
  const weekDate = (anchor, week) => {
    check(
      /^\d{4}-\d{2}-\d{2}$/.test(anchor),
      'Use a valid first-week date in YYYY-MM-DD format.|首周日期须为有效 YYYY-MM-DD 格式。',
    );
    const d = new Date(anchor + 'T00:00:00Z');
    check(
      Number.isFinite(d.getTime()) &&
        d.toISOString().slice(0, 10) === anchor &&
        Number(anchor.slice(0, 4)) >= 1900 &&
        Number(anchor.slice(0, 4)) <= 9900,
      'Use a real calendar date between years 1900 and 9900.|请输入 1900 至 9900 年内的真实日历日期。',
    );
    d.setUTCDate(d.getUTCDate() + 7 * (week - 1));
    return d.toISOString().slice(0, 10);
  };
  const monthDate = (anchor, index) => {
    check(
      /^\d{4}-(0[1-9]|1[0-2])$/.test(anchor) &&
        Number(anchor.slice(0, 4)) >= 1900 &&
        Number(anchor.slice(0, 4)) <= 9900,
      'Use a planning month in YYYY-MM format, between years 1900 and 9900.|规划首月须为 1900 至 9900 年内的 YYYY-MM 格式。',
    );
    const d = new Date(anchor + '-01T00:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + index - 1);
    return d.toISOString().slice(0, 7);
  };
  const error =
    'Check the item table: names must be unique, all numbers valid, and dates within the displayed range.|请检查项目表：名称须唯一，数值须有效，日期须处于所示范围。';
  function records(value, count) {
    const lines = String(value)
      .trim()
      .split(/\n/)
      .filter((x) => x.trim());
    check(lines.length > 0 && lines.length <= 20, 'Use 1–20 items.|请填写 1–20 个项目。');
    const rows = lines.map((line) => line.split(';').map((x) => x.trim()));
    check(
      rows.every((r) => r.length === count && r[0] && r[0].length <= 60) &&
        new Set(rows.map((r) => r[0])).size === rows.length,
      error,
    );
    return rows;
  }
  const number = (s, min = 0, max = 1e9, integer = false) => {
    const x = Number(s);
    check(
      String(s).trim() !== '' &&
        Number.isFinite(x) &&
        x >= min &&
        x <= max &&
        (!integer || Number.isInteger(x)),
      error,
    );
    return x;
  };
  const col = (key, label, type = 'number', min = 0, max = 1e9) => ({ key, label, type, min, max });
  function collision(v, drop = -1, shiftIndex = -1, shift = 0) {
    weekDate(v.anchor, 1);
    const items = records(v.plans, 6).map((r, k) => ({
      name: r[0],
      hours: number(r[1], 0, 168),
      cost: number(r[2]),
      upfront: number(r[3]),
      start: number(r[4], 1, 104, true) + (k === shiftIndex ? shift : 0),
      end: number(r[5], 1, 104, true) + (k === shiftIndex ? shift : 0),
    }));
    check(
      items.every((x) => x.end >= x.start),
      error,
    );
    let balance = v.cash;
    const timeline = [];
    for (let week = 1; week <= v.horizon; week++) {
      const active = items.filter((x, k) => k !== drop && week >= x.start && week <= x.end),
        hours = v.fixed + sum(active.map((x) => x.hours)),
        cost = v.living + sum(active.map((x) => x.cost + (week === x.start ? x.upfront : 0)));
      balance += v.income - cost;
      timeline.push({
        period: week,
        hours,
        freeHours: v.hours - hours,
        spending: cost,
        balance,
        conflict: hours > v.hours + 1e-9 || balance < -0.0000001,
      });
    }
    return {
      items,
      timeline,
      conflicts: timeline.filter((x) => x.conflict).length,
      first: timeline.find((x) => x.conflict)?.period || 0,
      maxHours: Math.max(0, ...timeline.map((x) => -x.freeHours)),
      funding: Math.max(0, ...timeline.map((x) => -x.balance)),
      end: balance,
    };
  }
  add(
    'plan-collision',
    'Plan Collision|计划撞车',
    'AI and Work-life',
    'Find the first week your plans exceed shared time or cash, then compare delays and removals.|找出多个计划首次超出共同时间或资金的周，并比较延期与移除。',
    [
      {
        ...text(
          'anchor',
          'First planning week starts (YYYY-MM-DD)|首周起始日期（YYYY-MM-DD）',
          '2026-11-02',
        ),
        type: 'date',
        min: '1900-01-01',
        max: '9900-12-31',
      },
      i('horizon', 'Planning horizon (weeks)|规划期限（周）', 8, 1, 104),
      n('hours', 'Total available hours each week|每周可用总小时', 40, 0, 168),
      n('fixed', 'Existing fixed hours each week|每周原有固定小时', 30, 0, 168),
      n('cash', 'Starting available cash|初始可用现金', 1000),
      n('income', 'Cash income each week|每周现金收入', 600),
      n('living', 'Essential cash spending each week|每周必要现金支出', 500),
      text(
        'plans',
        'Plans: name; hours/week; cost/week; upfront cost; start week; end week|计划：名称；每周小时；每周费用；初始费用；起始周；结束周',
        'Course;8;60;200;1;4\nSide project;6;30;100;3;6',
      ),
      i('shift', 'Delay each plan for comparison (weeks)|逐项比较延期周数', 2, 1, 52),
    ],
    (v) => {
      const a = collision(v);
      return [
        R('First collision week|首次撞车周', a.first || 'No collision in horizon|期限内无撞车'),
        R('Weeks with a time or cash shortfall|时间或资金不足周数', a.conflicts, 'weeks'),
        R('Largest weekly time shortfall|最大每周时间缺口', a.maxHours, 'hours'),
        R('Largest cumulative cash shortfall|最大累计现金缺口', a.funding),
        R('Cash at horizon end|期末现金', a.end),
      ];
    },
    "Each week, update cash with C = C+I−E−A−U and free hours with H = T−F−P. I is income, E is essential spending, A is active-plan recurring costs, and U is newly starting plans' upfront costs. T is available hours, F is fixed hours, and P is active-plan hours.|每周用 C = C+I−E−A−U 更新现金，用 H = T−F−P 求自由小时。I 为收入，E 为必要支出，A 为有效计划的经常费用，U 为当周新开始计划的初始费用；T 为可用小时，F 为固定小时，P 为有效计划小时。",
    [3, 2, 4, 0, 1140],
    'A planning simulation, not a prediction. Weekly income and capacity are constant; upfront costs occur at each plan’s start. Plans outside the horizon are excluded. Time cannot be borrowed from another week; cash carries forward.|这是规划模拟，不是预测；每周收入与容量固定，初始费用在计划起始周发生，期限外项目不计；时间不跨周借用，现金余额结转。',
  );
  let model = CMModels.models.at(-1);
  model.editor = {
    field: 'plans',
    title: 'Plans to fit together|一起安排的计划',
    columns: [
      col('name', 'Plan name|计划名称', 'text'),
      col('hours', 'Hours/week|小时/周', 'number', 0, 168),
      col('cost', 'Cost/week|费用/周'),
      col('upfront', 'Upfront cost|初始费用'),
      col('start', 'Start week|起始周', 'number', 1, 104),
      col('end', 'End week|结束周', 'number', 1, 104),
    ],
    sample: ['New plan', 2, 20, 0, 1, 4],
  };
  model.detail = (v) => {
    const a = collision(v);
    return [
      {
        title: 'Weekly capacity and cash|每周容量与现金',
        headers: [
          'Week|周',
          'Week starts|本周起始',
          'Committed hours|已安排小时',
          'Free hours|空余小时',
          'Cash spending|现金支出',
          'Ending cash|期末现金',
          'State|状态',
        ],
        rows: a.timeline.map((x) => [
          x.period,
          weekDate(v.anchor, x.period),
          x.hours,
          x.freeHours,
          x.spending,
          x.balance,
          x.conflict ? 'Shortfall|有缺口' : 'Fits|可容纳',
        ]),
      },
      {
        title: 'Change one plan at a time|每次只调整一个计划',
        headers: [
          'Plan|计划',
          'Change|调整',
          'First collision week (0 = none)|首次撞车周（0 为无）',
          'Shortfall weeks|不足周数',
          'Ending cash|期末现金',
        ],
        rows: a.items.flatMap((x, k) => {
          const remove = collision(v, k),
            delay = collision(v, -1, k, v.shift);
          return [
            [x.name, 'Remove|移除', remove.first, remove.conflicts, remove.end],
            [x.name, 'Delay|延期', delay.first, delay.conflicts, delay.end],
          ];
        }),
      },
    ];
  };
  function dependencies(v, backup = -1) {
    const rows = records(v.resources, 7),
      items = rows.map((r) => ({
        name: r[0],
        restore: number(r[1], 0, 8760),
        restart: number(r[2], 0, 8760),
        loss: number(r[3]),
        backup: number(r[4], -1, 8760),
        cost: number(r[5]),
        needs: r[6]
          ? r[6]
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      }));
    check(
      items.every((x) => !x.name.includes(',')),
      'Resource names cannot contain commas, which separate dependencies.|资源名称不能含逗号，逗号用于分隔依赖。',
    );
    const names = items.map((x) => x.name),
      root = names.indexOf(String(v.failed).trim());
    check(
      root >= 0,
      'The failed resource must match an item name.|故障资源必须与某一项目名称相同。',
    );
    check(
      items.every(
        (x) =>
          new Set(x.needs).size === x.needs.length && x.needs.every((name) => names.includes(name)),
      ),
      'Dependencies must name existing resources without duplicates.|依赖须填写现有资源名称，且不能重复。',
    );
    const visiting = new Set(),
      done = new Set(),
      durations = items.map(() => 0);
    let activated = false;
    function visit(k) {
      if (done.has(k)) return durations[k];
      check(
        !visiting.has(k),
        'A dependency cycle exists. Remove the circular dependency before calculating.|依赖存在环路，请先移除循环依赖。',
      );
      visiting.add(k);
      const item = items[k],
        upstream = Math.max(0, ...item.needs.map((name) => visit(names.indexOf(name))));
      let t =
        k === root
          ? Math.max(item.restore, upstream > 0 ? upstream + item.restart : 0)
          : upstream > 0
            ? upstream + item.restart
            : 0;
      if (k === backup && t > 0 && item.backup >= 0 && item.backup < t) {
        t = item.backup;
        activated = true;
      }
      durations[k] = t;
      visiting.delete(k);
      done.add(k);
      return t;
    }
    for (let k = 0; k < items.length; k++) visit(k);
    const direct = durations.map((h, k) => h * items[k].loss),
      backupCost = activated ? items[backup].cost : 0;
    return {
      items,
      root,
      durations,
      direct,
      total: sum(direct) + backupCost,
      backupCost,
      affected: durations.filter((x) => x > 0).length,
      max: Math.max(...durations),
    };
  }
  add(
    'life-single-point-failure',
    'Life Single Point of Failure|生活单点故障',
    'AI and Work-life',
    'Trace how a failed resource interrupts dependent activities and compare one backup at a time.|追踪故障资源如何中断依赖活动，并逐项比较备用方案。',
    [
      {
        ...text('failed', 'Initially failed resource name|初始故障资源名称', 'Internet'),
        type: 'text',
        maxLength: 60,
      },
      text(
        'resources',
        'Resources: name; direct restore hours; restart delay; loss/hour; backup restore hours (-1 = none); backup cost; dependencies separated by commas|资源：名称；直接修复小时；重启延迟；每小时损失；备用恢复小时（-1 为无）；备用成本；依赖名（逗号分隔）',
        'Internet;8;0;20;1;30;\nPayments;4;1;50;2;20;Internet\nShipping;6;2;30;3;40;Payments',
      ),
    ],
    (v) => {
      const a = dependencies(v),
        b = dependencies(v, a.root);
      return [
        R('Affected resources|受影响资源数', a.affected),
        R('Longest interruption|最长中断', a.max, 'hours'),
        R('Loss without backup|无备用总损失', a.total),
        R('Loss plus cost with failed-resource backup|故障资源备用的损失加成本', b.total),
        R('Net benefit of failed-resource backup|故障资源备用净收益', a.total - b.total),
      ];
    },
    'For an affected downstream resource, use dᵢ = max(dⱼ)+rᵢ over its dependencies. d is interruption hours and r is restart delay; the initial failure uses direct repair time. A backup can shorten one interruption. Total modeled loss is L = Σ(ℓᵢdᵢ)+B, where ℓ is independent hourly loss and B is activated backup cost.|对受影响的下游资源，按其依赖使用 dᵢ = max(dⱼ)+rᵢ。d 为中断小时，r 为重启延迟，初始故障使用直接修复时间；备用方案可缩短一项中断。总模型损失为 L = Σ(ℓᵢdᵢ)+B，其中 ℓ 为互不重复的每小时损失，B 为实际启用的备用成本。',
    [3, 11, 940, 270, 670],
    'Deterministic what-if graph, not a failure probability estimate. Every named dependency is required. Loss rates must represent separate losses to avoid counting the same revenue twice. Backups bypass that resource’s dependencies at the entered recovery time; each comparison activates one backup only.|确定性情景依赖图，不估算故障概率；所有列出的依赖均为必要条件。各项损失率须独立，避免重复计算同一收入；备用按所填恢复时间绕过该资源依赖，每次比较只启用一个备用。',
  );
  model = CMModels.models.at(-1);
  model.graph = (v) => {
    const a = dependencies(v);
    return a.items.map((x, k) => ({
      name: x.name,
      needs: x.needs,
      hours: a.durations[k],
      failed: k === a.root,
    }));
  };
  model.editor = {
    field: 'resources',
    title: 'Resources and dependencies|资源与依赖',
    columns: [
      col('name', 'Resource name|资源名称', 'text'),
      col('restore', 'Direct repair (h)|直接修复（小时）', 'number', 0, 8760),
      col('restart', 'Restart delay (h)|重启延迟（小时）', 'number', 0, 8760),
      col('loss', 'Loss/hour|损失/小时'),
      col('backup', 'Backup time (h), -1 none|备用小时，-1 无', 'number', -1, 8760),
      col('cost', 'Backup cost|备用成本'),
      col('needs', 'Required resources, comma-separated|必要资源（逗号分隔）', 'text'),
    ],
    sample: ['New resource', 4, 1, 10, -1, 0, 'Internet'],
  };
  model.detail = (v) => {
    const a = dependencies(v);
    return [
      {
        title: 'Interruption path|中断路径',
        rawColumns: [0, 1],
        headers: [
          'Resource|资源',
          'Requires|依赖',
          'Interruption hours|中断小时',
          'Independent loss|独立损失',
        ],
        rows: a.items.map((x, k) => [
          x.name,
          x.needs.join(', ') || '—',
          a.durations[k],
          a.direct[k],
        ]),
      },
      {
        title: 'Activate one backup at a time|每次启用一个备用',
        headers: [
          'Backup for|备用资源',
          'Total loss and cost|总损失与成本',
          'Net benefit|净收益',
          'Longest interruption (h)|最长中断（小时）',
        ],
        rows: a.items.flatMap((x, k) =>
          x.backup >= 0
            ? [
                [
                  x.name,
                  dependencies(v, k).total,
                  a.total - dependencies(v, k).total,
                  dependencies(v, k).max,
                ],
              ]
            : [],
        ),
      },
    ];
  };
  function commitments(v, cancel = -1) {
    monthDate(v.anchor, 1);
    const rows = records(v.commitments, 8),
      items = rows.map((r) => ({
        name: r[0],
        cost: number(r[1]),
        hours: number(r[2], 0, 744),
        start: number(r[3], 1, 120, true),
        end: number(r[4], 1, 120, true),
        earliest: number(r[5], 1, 120, true),
        notice: number(r[6], 0, 120, true),
        fee: number(r[7]),
      }));
    check(
      items.every((x) => x.end >= x.start),
      error,
    );
    const timeline = [];
    for (let month = 1; month <= v.horizon; month++) {
      let money = 0,
        hours = 0,
        fees = 0;
      for (let k = 0; k < items.length; k++) {
        const x = items[k],
          effective = Math.max(x.start, x.earliest, v.cancel + x.notice),
          stopped = k === cancel && effective <= x.end;
        const active = month >= x.start && month <= x.end && (!stopped || month < effective);
        if (active) {
          money += x.cost;
          hours += x.hours;
        }
        if (stopped && month === effective) fees += x.fee;
      }
      timeline.push({
        month,
        money: money + fees,
        hours,
        freeMoney: v.income - v.essential - money - fees,
        freeHours: v.hours - v.fixed - hours,
        fees,
      });
    }
    return {
      items,
      timeline,
      total: sum(timeline.map((x) => x.money)),
      hours: sum(timeline.map((x) => x.hours)),
      minMoney: Math.min(...timeline.map((x) => x.freeMoney)),
      minHours: Math.min(...timeline.map((x) => x.freeHours)),
    };
  }
  add(
    'future-commitment-lock',
    'Future Commitment Lock|承诺锁定',
    'AI and Work-life',
    'See future money and time already promised, including notice periods, lock dates and exit fees.|查看未来已承诺的金钱与时间，并计入通知期、锁定日期和退出费用。',
    [
      {
        ...text('anchor', 'First planning month (YYYY-MM)|规划首月（YYYY-MM）', '2026-11'),
        type: 'month',
        min: '1900-01',
        max: '9900-12',
      },
      i('horizon', 'Planning horizon (months)|规划期限（月）', 12, 1, 120),
      n('income', 'Monthly available income|每月可用收入', 5000),
      n('essential', 'Monthly essential spending|每月必要支出', 3000),
      n('hours', 'Monthly available hours|每月可用小时', 80, 0, 744),
      n('fixed', 'Other fixed monthly hours|其他固定月小时', 20, 0, 744),
      i(
        'cancel',
        'Request cancellation at start of month number|在第几个月月初申请取消',
        3,
        1,
        120,
      ),
      text(
        'commitments',
        'Items: name; monthly cost; monthly hours; start month; end month; earliest stop month; notice months; exit fee|项目：名称；月费用；月小时；起始月；结束月；最早停止月；通知月数；退出费',
        'Gym;100;12;1;12;4;1;30\nCourse;200;16;2;8;5;1;50\nMachine;150;0;1;12;12;2;200',
      ),
    ],
    (v) => {
      const a = commitments(v),
        savings = a.items.map((x, k) => a.total - commitments(v, k).total);
      return [
        R('Committed cost within horizon|期限内承诺费用', a.total),
        R('Committed time within horizon|期限内承诺时间', a.hours, 'hours'),
        R('Lowest monthly free money|最低单月自由金额', a.minMoney),
        R('Lowest monthly free time|最低单月自由时间', a.minHours, 'hours'),
        R('Largest net saving from one cancellation|单项取消最大净节省', Math.max(0, ...savings)),
      ];
    },
    "Use S = max(a,e,c+n). a is start month, e is earliest stop month, c is cancellation-request month, and n is notice months. If S is within the item's end month, charge active months before it and the exit fee in the stop month; otherwise the original end remains.|使用 S = max(a,e,c+n)。a 为起始月，e 为最早停止月，c 为申请取消月，n 为通知月数；若 S 不晚于项目结束月，则计算此前有效月份费用，并在停止月计入退出费，否则仍按原结束月计算。",
    [4400, 256, 1550, 32, 870],
    'Month 1 is your first planning month. Costs and time are uniform within each active month; cancellation takes effect at the start of the stop month. Comparisons include only the horizon, and each cancels one item. Contract terms must be checked separately.|第 1 月为你的首个规划月；有效月份内费用与时间固定，取消在停止月月初生效；仅比较期限内结果，每次取消一项，合同条款须另行核实。',
  );
  model = CMModels.models.at(-1);
  model.editor = {
    field: 'commitments',
    title: 'Money and time commitments|金钱与时间承诺',
    columns: [
      col('name', 'Commitment name|承诺名称', 'text'),
      col('cost', 'Cost/month|费用/月'),
      col('hours', 'Hours/month|小时/月', 'number', 0, 744),
      col('start', 'Start month|起始月', 'number', 1, 120),
      col('end', 'End month|结束月', 'number', 1, 120),
      col('earliest', 'Earliest stop month|最早停止月', 'number', 1, 120),
      col('notice', 'Notice months|通知月数', 'number', 0, 120),
      col('fee', 'Exit fee|退出费'),
    ],
    sample: ['New commitment', 50, 4, 1, 12, 1, 1, 0],
  };
  model.detail = (v) => {
    const a = commitments(v);
    return [
      {
        title: 'Monthly free capacity|每月自由容量',
        headers: [
          'Month|月',
          'Calendar month|日历月份',
          'Committed spending|承诺支出',
          'Exit fees|退出费',
          'Committed hours|承诺小时',
          'Free money|自由金额',
          'Free hours|自由小时',
        ],
        rows: a.timeline.map((x) => [
          x.month,
          monthDate(v.anchor, x.month),
          x.money,
          x.fees,
          x.hours,
          x.freeMoney,
          x.freeHours,
        ]),
      },
      {
        title: 'Cancel one commitment at a time|每次取消一项承诺',
        headers: [
          'Commitment|承诺',
          'Stop month start|停止月月初',
          'Net saving in horizon|期限内净节省',
          'Hours released|释放小时',
          'Total cost after cancellation|取消后总费用',
        ],
        rows: a.items.map((x, k) => {
          const b = commitments(v, k);
          return [
            x.name,
            monthDate(v.anchor, Math.max(x.start, x.earliest, v.cancel + x.notice)),
            a.total - b.total,
            a.hours - b.hours,
            b.total,
          ];
        }),
      },
    ];
  };

  const relatedTools = {
    'plan-collision-calculator': [
      'future-commitment-lock-calculator',
      'meeting-cost',
      'habit-compound',
      'emergency-runway',
    ],
    'life-single-point-failure-calculator': [
      'plan-collision-calculator',
      'future-commitment-lock-calculator',
      'emergency-runway',
      'electricity-cost-calculator',
    ],
    'future-commitment-lock-calculator': [
      'plan-collision-calculator',
      'life-single-point-failure-calculator',
      'subscription-waste',
      'emergency-runway',
    ],
  };
  for (const entry of CMModels.models)
    if (relatedTools[entry.slug]) entry.related = relatedTools[entry.slug];
})();

;
(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, PI, rad, deg } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized SI-unit educational model. Real components, tolerances, losses and safe operating limits require separate verification.|使用 SI 单位的理想教育模型；实际元件、容差、损耗与安全工作界限需要另行核实。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const hz = n('f', 'Frequency (Hz)|频率（Hz）', 50),
    ke = 8.9875517923e9,
    h = 6.62607015e-34,
    c = 299792458,
    eV = 1.602176634e-19;
  const positiveList = (s) => {
    const a = nums(s);
    check(
      a.every((x) => x > 0),
      'All component values must be positive.|所有元件值应大于零。',
    );
    return a;
  };
  D(
    'electric-power',
    'DC Electric Power|直流电功率',
    'Calculate electrical power and energy from voltage and current.|由电压与电流计算电功率和耗能。',
    [
      n('v', 'Voltage (V)|电压（V）', 12),
      n('i', 'Current (A)|电流（A）', 2),
      n('t', 'Operating time (hours)|工作时长（小时）', 5),
    ],
    (v) => [
      R('Physical power|功率', v.v * v.i, 'W'),
      R('Energy consumed|耗电量', (v.v * v.i * v.t) / 1000, 'kWh'),
    ],
    'Use P = VI and E = Pt/1000. V is voltage in V, I is current in A, and t is operating hours. Power P is in W and consumed energy E is in kWh.|使用 P = VI 及 E = Pt/1000。变量 V 为电压（V），I 为电流（A），t 为工作小时；功率 P 的单位为 W，耗电量 E 的单位为 kWh。',
    [24, 0.12],
  );
  D(
    'series-resistance',
    'Series Resistance|串联电阻',
    'Add ideal resistors carrying the same current.|合并承载相同电流的理想串联电阻。',
    [text('x', 'Resistor values (Ω)|各电阻（Ω）', '1,2,3')],
    (v) => [R('Equivalent resistance|等效电阻', sum(positiveList(v.x)), 'Ω')],
    'Use Rₑ = ΣRᵢ. Each Rᵢ is a positive series resistor value in Ω. The equivalent resistance Rₑ uses the same unit; the sum covers every entered resistor.|使用 Rₑ = ΣRᵢ。每个 Rᵢ 为正的串联电阻值（Ω）；等效电阻 Rₑ 使用相同单位，对所有自填电阻求和。',
    [6],
  );
  D(
    'parallel-resistance',
    'Parallel Resistance|并联电阻',
    'Combine ideal resistors sharing the same voltage.|合并承受相同电压的理想并联电阻。',
    [text('x', 'Resistor values (Ω)|各电阻（Ω）', '10,20')],
    (v) => [R('Equivalent resistance|等效电阻', 1 / sum(positiveList(v.x).map((x) => 1 / x)), 'Ω')],
    'Use Rₑ = 1/Σ(1/Rᵢ). Each Rᵢ is a positive parallel resistor value in Ω. Sum their reciprocals, then take the reciprocal again for equivalent resistance Rₑ.|使用 Rₑ = 1/Σ(1/Rᵢ)。每个 Rᵢ 为正的并联电阻值（Ω）；先将倒数相加，再取倒数，得到等效电阻 Rₑ。',
    [20 / 3],
  );
  D(
    'voltage-divider',
    'Voltage Divider|电阻分压',
    'Find unloaded output voltage across the lower divider resistor.|求无负载分压器下侧电阻电压。',
    [
      u('v', 'Input voltage (V)|输入电压（V）', 12),
      p('a', 'Upper resistor R1 (Ω)|上侧电阻 R1（Ω）', 1000),
      p('b', 'Lower resistor R2 (Ω)|下侧电阻 R2（Ω）', 2000),
    ],
    (v) => [R('Unloaded output voltage|无负载输出电压', (v.v * v.b) / (v.a + v.b), 'V')],
    'Use Vₒ = VᵢR₂/(R₁+R₂). Vᵢ is input voltage, R₁ is the upper resistor, and R₂ is the lower resistor in the same resistance unit. Output Vₒ is measured across the lower resistor without a load.|使用 Vₒ = VᵢR₂/(R₁+R₂)。Vᵢ 为输入电压，R₁ 为上侧电阻，R₂ 为同电阻单位的下侧电阻；输出 Vₒ 为无负载时下侧电阻两端电压。',
    [8],
    'Assumes no output load. A load changes the lower equivalent resistance and output.|假设输出无负载；负载会改变下侧等效电阻与输出。',
  );
  D(
    'current-divider',
    'Current Divider|电流分流',
    'Split total current between two parallel resistors.|计算两个并联电阻的支路电流。',
    [
      u('i', 'Total current (A)|总电流（A）', 3),
      p('a', 'Branch A resistance (Ω)|A 支路电阻（Ω）', 10),
      p('b', 'Branch B resistance (Ω)|B 支路电阻（Ω）', 20),
    ],
    (v) => [
      R('Branch A current|A 支路电流', (v.i * v.b) / (v.a + v.b), 'A'),
      R('Branch B current|B 支路电流', (v.i * v.a) / (v.a + v.b), 'A'),
    ],
    'Use Iₐ = IRᵦ/(Rₐ+Rᵦ) and Iᵦ = IRₐ/(Rₐ+Rᵦ). I is total current. Rₐ and Rᵦ are the parallel branch resistances in the same unit; each current result uses the input current unit.|使用 Iₐ = IRᵦ/(Rₐ+Rᵦ) 及 Iᵦ = IRₐ/(Rₐ+Rᵦ)。I 为总电流，Rₐ 与 Rᵦ 为同单位并联支路电阻；各支路电流使用输入电流的单位。',
    [2, 1],
  );
  D(
    'capacitor-energy',
    'Capacitor Energy|电容储能',
    'Calculate charge and stored energy in an ideal capacitor.|计算理想电容的电荷与储能。',
    [n('c', 'Capacitance (µF)|电容量（µF）', 1000), u('v', 'Voltage (V)|电压（V）', 12)],
    (v) => [
      R('Stored energy|储存能量', 0.5 * v.c * 1e-6 * v.v * v.v, 'J'),
      R('Charge|电荷量', v.c * 1e-6 * v.v, 'C'),
    ],
    'E=½CV²; Q=CV',
    [0.072, 0.012],
  );
  D(
    'series-capacitance',
    'Series Capacitance|串联电容',
    'Combine ideal capacitors in series.|合并理想串联电容。',
    [text('x', 'Capacitor values (µF)|各电容（µF）', '10,20')],
    (v) => [
      R('Equivalent capacitance|等效电容', 1 / sum(positiveList(v.x).map((x) => 1 / x)), 'µF'),
    ],
    'Use Cₑ = 1/Σ(1/Cᵢ). Each Cᵢ is a positive series capacitance in µF. Sum reciprocals and take the reciprocal again; equivalent capacitance Cₑ remains in µF.|使用 Cₑ = 1/Σ(1/Cᵢ)。每个 Cᵢ 为正的串联电容值（µF）；先将倒数相加再取倒数，等效电容 Cₑ 仍使用 µF。',
    [20 / 3],
  );
  D(
    'parallel-capacitance',
    'Parallel Capacitance|并联电容',
    'Combine ideal capacitors in parallel.|合并理想并联电容。',
    [text('x', 'Capacitor values (µF)|各电容（µF）', '10,20')],
    (v) => [R('Equivalent capacitance|等效电容', sum(positiveList(v.x)), 'µF')],
    'Use Cₑ = ΣCᵢ. Each Cᵢ is a positive parallel capacitance in µF. Sum all entered values for equivalent capacitance Cₑ in the same unit.|使用 Cₑ = ΣCᵢ。每个 Cᵢ 为正的并联电容值（µF）；将所有输入值相加，得到相同单位的等效电容 Cₑ。',
    [30],
  );
  D(
    'rc-time-constant',
    'RC Time Constant|RC 时间常数',
    'Find capacitor charging time scales for an ideal RC circuit.|求理想 RC 电路电容充电的时间尺度。',
    [n('r', 'Resistance (Ω)|电阻（Ω）', 1000), n('c', 'Capacitance (µF)|电容（µF）', 100)],
    (v) => [
      R('Time constant|时间常数', v.r * v.c * 1e-6, 's'),
      R(
        'Time to 99% of step voltage|达到阶跃电压 99% 用时',
        -Math.log(0.01) * v.r * v.c * 1e-6,
        's',
      ),
    ],
    'τ=RC; t99=−τln(0.01)',
    [0.1, 0.460517018598809],
  );
  D(
    'rl-time-constant',
    'RL Time Constant|RL 时间常数',
    'Find current rise time scales in an ideal series RL circuit.|求理想串联 RL 电路电流上升时间尺度。',
    [
      n('l', 'Inductance (mH)|电感（mH）', 100),
      p('r', 'Total series resistance (Ω)|总串联电阻（Ω）', 10),
    ],
    (v) => [
      R('Time constant|时间常数', v.l / 1000 / v.r, 's'),
      R(
        'Time to 99% of final current|达到最终电流 99% 用时',
        (-Math.log(0.01) * v.l) / 1000 / v.r,
        's',
      ),
    ],
    'τ=L/R',
    [0.01, 0.0460517018598809],
  );
  D(
    'lc-resonance',
    'LC Resonant Frequency|LC 谐振频率',
    'Find natural resonance of ideal inductance and capacitance.|求理想电感电容的固有谐振频率。',
    [p('l', 'Inductance (mH)|电感（mH）', 10), p('c', 'Capacitance (nF)|电容（nF）', 100)],
    (v) => [
      R('Resonant frequency|谐振频率', 1 / (2 * PI * Math.sqrt(v.l * 1e-3 * v.c * 1e-9)), 'Hz'),
    ],
    'f₀=1/(2π√LC)',
    [5032.921210448704],
  );
  D(
    'inductive-reactance',
    'Inductive Reactance|感抗',
    'Calculate frequency-dependent ideal inductor reactance.|计算理想电感随频率变化的感抗。',
    [hz, n('l', 'Inductance (mH)|电感（mH）', 100)],
    (v) => [R('Inductive reactance|感抗', (2 * PI * v.f * v.l) / 1000, 'Ω')],
    'XL=2πfL',
    [10 * PI],
  );
  D(
    'capacitive-reactance',
    'Capacitive Reactance|容抗',
    'Calculate ideal capacitor reactance at a positive frequency.|计算正频率下理想电容的容抗。',
    [p('f', 'Frequency (Hz)|频率（Hz）', 50), p('c', 'Capacitance (µF)|电容（µF）', 100)],
    (v) => [R('Capacitive reactance magnitude|容抗大小', 1 / (2 * PI * v.f * v.c * 1e-6), 'Ω')],
    '|XC|=1/(2πfC)',
    [100 / PI],
  );
  D(
    'ac-series-impedance',
    'AC Series Impedance|交流串联阻抗',
    'Combine resistance and opposing series reactances.|合并电阻及相反方向的串联电抗。',
    [
      n('r', 'Resistance (Ω)|电阻（Ω）', 30),
      n('l', 'Inductive reactance (Ω)|感抗（Ω）', 40),
      n('c', 'Capacitive reactance magnitude (Ω)|容抗大小（Ω）', 0),
    ],
    (v) => {
      const x = v.l - v.c,
        z = Math.hypot(v.r, x);
      check(z > 0, 'Zero impedance has no defined phase angle.|零阻抗没有确定相位角。');
      return [
        R('Impedance magnitude|阻抗大小', z, 'Ω'),
        R('Impedance phase|阻抗相位', deg(Math.atan2(x, v.r)), '°'),
        R('Power factor magnitude|功率因数大小', v.r / z),
      ];
    },
    'Z=R+j(XL−XC); |Z|=√[R²+(XL−XC)²]',
    [50, 53.13010235415598, 0.6],
  );
  D(
    'electric-charge-flow',
    'Electric Charge from Current|电流电荷量',
    'Integrate a constant or average electric current over time.|将恒定或平均电流乘以持续时间。',
    [u('i', 'Average current (A)|平均电流（A）', 2), n('t', 'Duration (s)|持续时间（s）', 60)],
    (v) => [
      R('Charge transferred|通过电荷量', v.i * v.t, 'C'),
      R('Charge in ampere hours|安时电量', (v.i * v.t) / 3600, 'Ah'),
    ],
    'Q=It',
    [120, 1 / 30],
  );
  D(
    'coulomb-force',
    'Coulomb Force|库仑力',
    'Find electrostatic force magnitude between point charges in vacuum.|求真空中点电荷间的静电力大小。',
    [
      u('a', 'Charge A (µC)|电荷 A（µC）', 2),
      u('b', 'Charge B (µC)|电荷 B（µC）', 3),
      p('r', 'Separation (m)|距离（m）', 0.1),
    ],
    (v) => [
      R('Force magnitude|力大小', (ke * Math.abs(v.a * v.b) * 1e-12) / v.r ** 2, 'N'),
      R(
        'Interaction|相互作用',
        v.a * v.b > 0
          ? 'Repulsive|排斥'
          : v.a * v.b < 0
            ? 'Attractive|吸引'
            : 'No electrostatic interaction|无静电相互作用',
      ),
    ],
    '|F|=ke|q₁q₂|/r²',
    [5.39253107538, 'Repulsive|排斥'],
  );
  D(
    'point-charge-field',
    'Point Charge Electric Field|点电荷电场',
    'Find the radial electric field of a point charge in vacuum.|求真空点电荷的径向电场。',
    [u('q', 'Charge (nC)|电荷（nC）', 1), p('r', 'Radial distance (m)|径向距离（m）', 0.1)],
    (v) => [R('Outward signed electric field|向外为正的电场', (ke * v.q * 1e-9) / v.r ** 2, 'N/C')],
    'Er=ke q/r²',
    [898.75517923],
  );
  D(
    'magnetic-charge-force',
    'Magnetic Force on a Charge|运动电荷磁力',
    'Find magnetic force magnitude from velocity and field angle.|由速度与磁场夹角求磁力大小。',
    [
      u('q', 'Charge (µC)|电荷（µC）', 2),
      n('v', 'Speed (m/s)|速率（m/s）', 1000),
      n('b', 'Magnetic flux density (T)|磁感应强度（T）', 0.5),
      n('a', 'Velocity-field angle (degrees)|速度与磁场夹角（度）', 90, 0, 180),
    ],
    (v) => [
      R(
        'Magnetic force magnitude|磁力大小',
        Math.abs(v.q) * 1e-6 * v.v * v.b * Math.sin(rad(v.a)),
        'N',
      ),
    ],
    'Use F = abs(q)vB sinθ. q is charge converted from µC to C, v is speed in m/s, B is magnetic flux density in T, and θ is the velocity-field angle in degrees. abs means absolute value; force magnitude is in N.|使用 F = abs(q)vB sinθ。q 为从 µC 换算成 C 的电荷，v 为速率（m/s），B 为磁感应强度（T），θ 为速度与磁场夹角（度）；abs 表示绝对值，力大小的单位为 N。',
    [0.001],
  );
  D(
    'ideal-transformer',
    'Ideal Transformer Ratio|理想变压器变比',
    'Convert AC voltage by primary and secondary winding counts.|按初次级匝数换算交流电压。',
    [
      n('v', 'Primary RMS voltage (V)|初级有效电压（V）', 230),
      i('p', 'Primary turns|初级匝数', 1000, 1, 1000000),
      i('s', 'Secondary turns|次级匝数', 100, 1, 1000000),
    ],
    (v) => [
      R('Secondary RMS voltage|次级有效电压', (v.v * v.s) / v.p, 'V'),
      R('Primary / secondary turns|初次级匝数比', v.p / v.s),
    ],
    'Vs/Vp=Ns/Np',
    [23, 10],
    'Ideal AC transformer; excludes losses, saturation, insulation and current ratings. Not applicable to steady DC.|理想交流变压器，忽略损耗、饱和、绝缘与额定电流，不适用于稳态直流。',
  );
  D(
    'battery-runtime',
    'Battery Runtime Estimate|电池续航估算',
    'Estimate usable energy and constant-load runtime.|估计可用电量与恒定负载续航。',
    [
      p('v', 'Nominal battery voltage (V)|电池标称电压（V）', 12),
      n('a', 'Capacity (Ah)|容量（Ah）', 100),
      n('d', 'Usable depth of discharge (%)|可用放电深度（%）', 80, 0, 100),
      n('e', 'Conversion efficiency (%)|转换效率（%）', 90, 0, 100),
      p('p', 'Constant load power (W)|恒定负载功率（W）', 100),
    ],
    (v) => {
      const e = (((v.v * v.a * v.d) / 100) * v.e) / 100;
      return [
        R('Estimated runtime|估计续航', e / v.p, 'hours'),
        R('Delivered usable energy|输出可用能量', e, 'Wh'),
      ];
    },
    'Use t = VCfη/P. V is nominal voltage in V, C is capacity in Ah, f is usable discharge fraction, η is conversion efficiency as a fraction, and P is constant load in W. Runtime t is in hours.|使用 t = VCfη/P。变量 V 为标称电压（V），C 为容量（Ah），f 为可用放电比例，η 为转换效率的小数比例，P 为恒定负载（W）；续航 t 的单位为小时。',
    [8.64, 864],
    'Ignores rate-dependent capacity, ageing, temperature, voltage sag, standby losses and battery management limits.|忽略倍率容量变化、老化、温度、压降、待机损耗与电池管理限制。',
  );
  D(
    'wave-speed',
    'Wave Speed|波速',
    'Combine frequency and wavelength.|结合频率与波长求波速。',
    [n('f', 'Frequency (Hz)|频率（Hz）', 50), n('l', 'Wavelength (m)|波长（m）', 2)],
    (v) => [R('Wave speed|波速', v.f * v.l, 'm/s')],
    'v=fλ',
    [100],
  );
  D(
    'doppler-frequency',
    'Doppler Observed Frequency|多普勒观测频率',
    'Estimate a sound-frequency shift along one line.|估计一条直线上的声频变化。',
    [
      p('f', 'Emitted frequency (Hz)|发射频率（Hz）', 1000),
      p('c', 'Sound speed in medium (m/s)|介质声速（m/s）', 343),
      u('o', 'Observer speed toward source (m/s)|观察者朝向声源速度（m/s）', 0),
      u('s', 'Source speed toward observer (m/s)|声源朝向观察者速度（m/s）', 34.3),
    ],
    (v) => {
      check(
        Math.abs(v.o) < v.c && Math.abs(v.s) < v.c,
        'Use subsonic speeds relative to the medium.|相对介质速度应低于声速。',
      );
      return [R('Observed frequency|观测频率', (v.f * (v.c + v.o)) / (v.c - v.s), 'Hz')];
    },
    'Use fₒ = fₛ(c+vₒ)/(c−vₛ). fₛ is emitted frequency, c is sound speed in the medium, vₒ is observer velocity toward the source, and vₛ is source velocity toward the observer. Velocities share a unit; both moving speeds must be subsonic.|使用 fₒ = fₛ(c+vₒ)/(c−vₛ)。fₛ 为发射频率，c 为介质声速，vₒ 为观察者朝向声源速度，vₛ 为声源朝向观察者速度；速度使用相同单位，两个运动速率均须低于声速。',
    [10000 / 9],
    'Collinear classical sound model in a stationary medium; positive velocities approach. Not relativistic light Doppler.|静止介质中共线经典声学模型，接近速度为正；不是光的相对论多普勒模型。',
  );
  D(
    'sound-intensity-level',
    'Sound Intensity Level|声强级',
    'Convert sound intensity to a reference-relative decibel level.|将声强换算为相对参考值的分贝级。',
    [
      p('x', 'Sound intensity (W/m²)|声强（W/m²）', 1e-6),
      n('r', 'Reference intensity (W/m²)|参考声强（W/m²）', 1e-12, 1e-30, 1e15),
    ],
    (v) => [R('Sound intensity level|声强级', 10 * Math.log10(v.x / v.r), 'dB')],
    'Use L = 10log₁₀(I/Iᵣ). I is sound intensity and Iᵣ is reference intensity in the same unit. Sound intensity level L is in dB.|使用 L = 10log₁₀(I/Iᵣ)。I 为声强，Iᵣ 为同单位参考声强；声强级 L 的单位为 dB。',
    [60],
    'Intensity level is not automatically A-weighted sound pressure or a hearing-exposure assessment.|声强级不自动等于 A 计权声压级，也不是听力暴露评估。',
  );
  D(
    'combined-decibel-level',
    'Combined Decibel Level|分贝声级叠加',
    'Add independent incoherent levels measured on the same basis.|叠加使用相同口径测量的独立非相干声级。',
    [text('x', 'Independent levels (dB)|各独立声级（dB）', '60,60')],
    (v) => {
      const a = nums(v.x),
        m = Math.max(...a);
      return [
        R(
          'Combined level|合计声级',
          m + 10 * Math.log10(sum(a.map((x) => 10 ** ((x - m) / 10)))),
          'dB',
        ),
      ];
    },
    'Use L = 10log₁₀[Σ10^(Lᵢ/10)]. Lᵢ are independent incoherent levels in dB, sharing the same reference, weighting and location. The combined level L uses the same basis.|使用 L = 10log₁₀[Σ10^(Lᵢ/10)]。Lᵢ 为独立非相干声级（dB），须使用相同参考、计权与位置；合计声级 L 使用同一口径。',
    [63.01029995663981],
    'All levels must use the same reference, weighting and observation location. Coherent sources require phase information.|所有声级应使用相同参考、计权与观测位置；相干声源还需相位信息。',
  );
  D(
    'thin-lens',
    'Thin Lens Image|薄透镜成像',
    'Solve image distance and magnification using signed distances.|用带符号距离求像距与放大率。',
    [
      u('f', 'Focal length (cm), converging positive|焦距（cm，凸透镜为正）', 10),
      u('d', 'Object distance (cm), real object positive|物距（cm，实物为正）', 30),
    ],
    (v) => {
      check(
        v.f !== 0 && v.d !== 0 && Math.abs(v.d - v.f) > 1e-12,
        'Focal and object distances must be nonzero; an object at the focal plane forms an image at infinity.|焦距与物距非零；物体在焦平面时像在无穷远。',
      );
      const d = (v.f * v.d) / (v.d - v.f);
      return [
        R('Signed image distance|带符号像距', d, 'cm'),
        R('Lateral magnification|横向放大率', -d / v.d),
      ];
    },
    'Use 1/f = 1/dₒ+1/dᵢ and m = −dᵢ/dₒ. f is focal length, dₒ is object distance, and dᵢ is image distance in the same unit. A converging focal length and real object distance are positive; m is lateral magnification.|使用 1/f = 1/dₒ+1/dᵢ 及 m = −dᵢ/dₒ。f 为焦距，dₒ 为物距，dᵢ 为同单位像距；会聚透镜焦距和实物物距为正，m 为横向放大率。',
    [15, -0.5],
    'Paraxial thin lens in air; positive image distance is real, negative is virtual. Aberrations and lens thickness excluded.|空气中近轴薄透镜模型，像距正为实像、负为虚像；忽略像差与厚度。',
  );
  D(
    'snells-law',
    'Snell Refraction Angle|斯涅尔折射角',
    'Apply refraction at a flat interface between two media.|计算两介质平面界面的折射角。',
    [
      p('a', 'Incident refractive index|入射介质折射率', 1),
      p('b', 'Transmitted refractive index|透射介质折射率', 1.5),
      n('t', 'Incident angle from normal (degrees)|与法线夹角（度）', 30, 0, 90),
    ],
    (v) => {
      const s = (v.a / v.b) * Math.sin(rad(v.t));
      return [
        R(
          'Refraction angle|折射角',
          s > 1 ? 'Total internal reflection|全内反射' : deg(Math.asin(s)),
          '°',
        ),
      ];
    },
    'Use n₁sinθ₁ = n₂sinθ₂. n₁ and n₂ are incident and transmitted refractive indices; θ₁ and θ₂ are angles from the normal. Angles are entered and displayed in degrees. If refraction has no real angle, the result identifies total internal reflection.|使用 n₁sinθ₁ = n₂sinθ₂。n₁ 与 n₂ 为入射及透射介质折射率，θ₁ 与 θ₂ 为相对法线的夹角；输入和显示角度均使用度，若不存在实数折射角，结果标示全内反射。',
    [19.47122063449069],
  );
  D(
    'critical-angle',
    'Critical Angle|全反射临界角',
    'Find the critical angle from a denser optical medium.|求由高折射率介质射出的全反射临界角。',
    [
      p('a', 'Incident refractive index|入射介质折射率', 1.5),
      p('b', 'Transmitted refractive index|透射介质折射率', 1),
    ],
    (v) => {
      check(
        v.a > v.b,
        'Critical angle requires incident index greater than transmitted index.|临界角要求入射介质折射率大于透射介质。',
      );
      return [R('Critical angle from normal|与法线临界夹角', deg(Math.asin(v.b / v.a)), '°')];
    },
    'Use θ = asin(n₂/n₁). n₁ is incident refractive index and n₂ is transmitted refractive index, with n₁ > n₂. The critical angle is measured from the normal and displayed in degrees.|使用 θ = asin(n₂/n₁)。n₁ 为入射介质折射率，n₂ 为透射介质折射率，并要求 n₁ > n₂；临界角相对法线测量，以度显示。',
    [41.810314895778596],
  );
  D(
    'photon-energy',
    'Photon Energy|光子能量',
    'Convert vacuum wavelength into single-photon energy.|将真空波长换算为单光子能量。',
    [p('l', 'Vacuum wavelength (nm)|真空波长（nm）', 500)],
    (v) => {
      const energy = (h * c) / (v.l * 1e-9);
      return [
        R('Photon energy|光子能量', energy, 'J'),
        R('Photon energy in electronvolts|电子伏能量', energy / eV, 'eV'),
        R('Frequency|频率', c / (v.l * 1e-9), 'Hz'),
      ];
    },
    'E=hc/λ; f=c/λ',
    [3.972891714297857e-19, 2.479683968664005, 5.99584916e14],
  );
  D(
    'de-broglie-wavelength',
    'De Broglie Wavelength|德布罗意波长',
    'Estimate nonrelativistic matter wavelength from mass and speed.|由质量与速率估计非相对论物质波长。',
    [
      p('m', 'Mass in units of 10⁻³⁰ kg|质量（10⁻³⁰ kg）', 0.91093837015),
      p('v', 'Speed (m/s)|速率（m/s）', 1000000),
    ],
    (v) => {
      check(
        v.v < c * 0.1,
        'Use speed below 0.1c for this nonrelativistic approximation.|此非相对论近似要求速率低于 0.1c。',
      );
      return [R('Matter wavelength|物质波长', (h / (v.m * 1e-30 * v.v)) * 1e9, 'nm')];
    },
    'λ=h/(mv)',
    [0.727389510325698],
  );
  D(
    'diffraction-grating',
    'Diffraction Grating Angle|光栅衍射角',
    'Find the angle of a diffraction order at normal incidence.|求垂直入射光栅的指定级次衍射角。',
    [
      p('d', 'Slit spacing (µm)|缝距（µm）', 1),
      p('l', 'Wavelength (nm)|波长（nm）', 500),
      i('m', 'Diffraction order|衍射级次', 1, -1000, 1000),
    ],
    (v) => {
      const s = (v.m * v.l) / (1000 * v.d);
      check(
        Math.abs(s) <= 1,
        'This order cannot propagate: |mλ/d| exceeds 1.|该级次不能传播：|mλ/d| 大于 1。',
      );
      return [R('Diffraction angle|衍射角', deg(Math.asin(s)), '°')];
    },
    'Use d sinθ = mλ. d is slit spacing, λ is wavelength converted to the same length unit, and m is diffraction order. The angle is displayed in degrees; an order beyond the real-angle range is rejected.|使用 d sinθ = mλ。d 为缝距，λ 为换算至相同长度单位的波长，m 为衍射级次；角度以度显示，超出实数角度范围的级次会被拒绝。',
    [30],
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, u, row: R, check, PI } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized SI-unit model for educational estimates. Confirm material properties, boundary conditions and applicability before engineering use.|使用 SI 单位的理想化教育估算模型；工程使用前应确认材料参数、边界条件与适用范围。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const density = p('d', 'Density (kg/m³)|密度（kg/m³）', 1000),
    gravity = p('g', 'Gravity (m/s²)|重力加速度（m/s²）', 9.80665),
    area = p('a', 'Cross-sectional area (m²)|截面积（m²）', 0.01),
    radius = p('r', 'Pipe inner radius (m)|管内半径（m）', 0.01),
    temp = p('t', 'Absolute temperature (K)|绝对温度（K）', 300),
    Rgas = 8.31446261815324;
  D(
    'density',
    'Density from Mass and Volume|质量体积求密度',
    'Calculate average mass per unit volume.|计算平均单位体积质量。',
    [n('m', 'Mass (kg)|质量（kg）', 10), p('v', 'Volume (m³)|体积（m³）', 0.002)],
    (v) => [R('Average density|平均密度', v.m / v.v, 'kg/m³')],
    'ρ=m/V',
    [5000],
  );
  D(
    'pressure',
    'Pressure from Force|受力压强',
    'Distribute perpendicular force over an area.|将垂直作用力分摊至面积。',
    [n('f', 'Normal force (N)|垂直作用力（N）', 100), area],
    (v) => [R('Average pressure|平均压强', v.f / v.a, 'Pa')],
    'P=F/A',
    [10000],
  );
  D(
    'hydrostatic-pressure',
    'Hydrostatic Pressure|静水压强',
    'Calculate fluid pressure with depth and surface pressure.|由深度与表面压力计算静止流体压强。',
    [
      density,
      gravity,
      n('h', 'Depth below surface (m)|液面下深度（m）', 10),
      n('s', 'Absolute surface pressure (Pa)|液面绝对压强（Pa）', 101325),
    ],
    (v) => [
      R('Gauge pressure increase|表压增量', v.d * v.g * v.h, 'Pa'),
      R('Absolute pressure|绝对压强', v.s + v.d * v.g * v.h, 'Pa'),
    ],
    'Use P = Pₛ+ρgh. Pₛ is absolute surface pressure in Pa, ρ is fluid density in kg/m³, g is gravity in m/s², and h is depth in m. Absolute pressure P is in Pa.|使用 P = Pₛ+ρgh。Pₛ 为液面绝对压强（Pa），ρ 为流体密度（kg/m³），g 为重力加速度（m/s²），h 为深度（m）；绝对压强 P 的单位为 Pa。',
    [98066.5, 199391.5],
  );
  D(
    'buoyant-force',
    'Buoyant Force|浮力',
    'Apply displaced-fluid volume to Archimedes’ principle.|用排开流体体积应用阿基米德原理。',
    [density, n('v', 'Displaced volume (m³)|排开体积（m³）', 0.01), gravity],
    (v) => [R('Buoyant force|浮力', v.d * v.v * v.g, 'N')],
    'Use F = ρVg. ρ is fluid density in kg/m³, V is displaced fluid volume in m³, and g is gravity in m/s². Buoyant force F is in N.|使用 F = ρVg。ρ 为流体密度（kg/m³），V 为排开流体体积（m³），g 为重力加速度（m/s²）；浮力 F 的单位为 N。',
    [98.0665],
  );
  D(
    'volumetric-flow-rate',
    'Volumetric Flow Rate|体积流量',
    'Combine section area and mean flow speed.|结合截面积与平均流速。',
    [area, u('v', 'Mean signed velocity (m/s)|平均带符号流速（m/s）', 2)],
    (v) => [
      R('Volume flow rate|体积流量', v.a * v.v, 'm³/s'),
      R('Flow in litres per minute|每分钟升数', v.a * v.v * 60000, 'L/min'),
    ],
    'Q=Av',
    [0.02, 1200],
  );
  D(
    'pipe-flow-speed',
    'Pipe Flow Speed|管内流速',
    'Convert pipe flow rate and bore into average speed.|由管流量与内径求平均流速。',
    [
      n('q', 'Volume flow (L/min)|体积流量（L/min）', 60),
      p('d', 'Inner diameter (mm)|内径（mm）', 20),
    ],
    (v) => [R('Average speed|平均流速', v.q / 60000 / (PI * (v.d / 2000) ** 2), 'm/s')],
    'v=Q/[π(d/2)²]',
    [10 / PI],
  );
  D(
    'continuity-equation',
    'Flow Continuity|流动连续性',
    'Find downstream velocity for incompressible steady flow.|求不可压缩稳态流的下游流速。',
    [
      p('a', 'Upstream area (m²)|上游面积（m²）', 0.02),
      u('v', 'Upstream velocity (m/s)|上游流速（m/s）', 2),
      p('b', 'Downstream area (m²)|下游面积（m²）', 0.01),
    ],
    (v) => [
      R('Downstream velocity|下游流速', (v.a * v.v) / v.b, 'm/s'),
      R('Volume flow|体积流量', v.a * v.v, 'm³/s'),
    ],
    'A₁v₁=A₂v₂',
    [4, 0.04],
  );
  D(
    'bernoulli-pressure',
    'Bernoulli Pressure Change|伯努利压强变化',
    'Estimate downstream pressure from speed and elevation changes.|由流速与高度变化估算下游压强。',
    [
      density,
      n('p', 'Upstream absolute pressure (Pa)|上游绝对压强（Pa）', 200000),
      n('a', 'Upstream speed (m/s)|上游速率（m/s）', 2),
      n('b', 'Downstream speed (m/s)|下游速率（m/s）', 4),
      u('h', 'Downstream elevation minus upstream (m)|下游减上游高度（m）', 1),
      gravity,
    ],
    (v) => {
      const p = v.p + 0.5 * v.d * (v.a * v.a - v.b * v.b) - v.d * v.g * v.h;
      check(
        p >= 0,
        'The ideal model implies negative absolute pressure; these conditions are physically inconsistent.|理想模型得到负绝对压强，条件在物理上不一致。',
      );
      return [R('Downstream pressure|下游压强', p, 'Pa')];
    },
    'P₂=P₁+½ρ(v₁²−v₂²)−ρg(h₂−h₁)',
    [184193.35],
    'Steady, incompressible, inviscid flow along one streamline; no pump, turbine or pipe loss. Does not check cavitation.|沿同一流线稳态、不可压、无黏流；无泵、涡轮或管损，不检查气蚀。',
  );
  D(
    'reynolds-number',
    'Reynolds Number|雷诺数',
    'Compare inertia and viscosity in an entered flow scale.|比较所填流动尺度下的惯性与黏性。',
    [
      density,
      n('v', 'Mean speed (m/s)|平均速率（m/s）', 1),
      p('l', 'Characteristic length (m)|特征长度（m）', 0.01),
      p('mu', 'Dynamic viscosity (Pa·s)|动力黏度（Pa·s）', 0.001),
    ],
    (v) => [R('Reynolds number|雷诺数', (v.d * v.v * v.l) / v.mu)],
    'Re=ρvL/μ',
    [10000],
    'Characteristic length and transition thresholds depend on geometry; this tool does not classify every flow with a pipe-only threshold.|特征长度与转捩阈值取决于几何形状，本工具不将圆管阈值用于所有流动。',
  );
  D(
    'poiseuille-flow',
    'Laminar Pipe Flow|层流圆管流量',
    'Estimate viscous flow through a fully developed circular pipe.|估算充分发展圆管层流的黏性流量。',
    [
      radius,
      p('l', 'Pipe length (m)|管长（m）', 1),
      n('p', 'Pressure drop (Pa)|压降（Pa）', 100),
      p('mu', 'Dynamic viscosity (Pa·s)|动力黏度（Pa·s）', 0.001),
    ],
    (v) => [R('Volume flow rate|体积流量', (PI * v.r ** 4 * v.p) / (8 * v.mu * v.l), 'm³/s')],
    'Q=πr⁴ΔP/(8μL)',
    [PI * 0.000125],
    'Hagen–Poiseuille law: Newtonian incompressible fluid, rigid straight circular pipe, steady fully developed laminar flow; entrance losses excluded.|Hagen–Poiseuille 定律：牛顿不可压流体、刚性直圆管、稳态充分发展层流，不含入口损失。',
  );
  D(
    'drag-force',
    'Drag Force|阻力',
    'Estimate aerodynamic or hydrodynamic drag from an entered coefficient.|用自填阻力系数估计气动或水动阻力。',
    [
      p('d', 'Fluid density (kg/m³)|流体密度（kg/m³）', 1.225),
      n('v', 'Relative speed (m/s)|相对速率（m/s）', 10),
      n('c', 'Drag coefficient|阻力系数', 0.5),
      n('a', 'Reference frontal area (m²)|参考迎风面积（m²）', 1),
    ],
    (v) => [R('Drag force magnitude|阻力大小', 0.5 * v.d * v.v * v.v * v.c * v.a, 'N')],
    'Use F = ρv²C_dA/2. ρ is fluid density in kg/m³, v is relative speed in m/s, C_d is the entered drag coefficient, and A is reference frontal area in m². Drag magnitude F is in N.|使用 F = ρv²C_dA/2。ρ 为流体密度（kg/m³），v 为相对速率（m/s），C_d 为自填阻力系数，A 为参考迎风面积（m²）；阻力大小 F 的单位为 N。',
    [30.625],
  );
  D(
    'mach-number',
    'Mach Number|马赫数',
    'Compare flow speed with local sound speed.|比较流速与当地声速。',
    [
      n('v', 'Flow speed (m/s)|流动速率（m/s）', 340),
      p('c', 'Local speed of sound (m/s)|当地声速（m/s）', 340),
    ],
    (v) => [R('Mach number|马赫数', v.v / v.c)],
    'M=v/c',
    [1],
  );
  D(
    'sensible-heat',
    'Sensible Heat Energy|显热能量',
    'Calculate energy for a temperature change without a phase transition.|计算无相变温度变化所需能量。',
    [
      n('m', 'Mass (kg)|质量（kg）', 2),
      p('c', 'Specific heat (J/kg·K)|比热容（J/kg·K）', 4184),
      u('d', 'Temperature change (K)|温差（K）', 10),
    ],
    (v) => [R('Heat transferred|传递热量', v.m * v.c * v.d, 'J')],
    'Q=mcΔT',
    [83680],
  );
  D(
    'linear-thermal-expansion',
    'Linear Thermal Expansion|线性热膨胀',
    'Estimate length change with constant expansion coefficient.|按恒定膨胀系数估计长度变化。',
    [
      n('l', 'Original length (m)|原始长度（m）', 2),
      u('a', 'Expansion coefficient (10⁻⁶/K)|膨胀系数（10⁻⁶/K）', 12),
      u('t', 'Temperature change (K)|温差（K）', 50),
    ],
    (v) => {
      const d = v.l * v.a * 1e-6 * v.t;
      check(
        v.l + d >= 0,
        'Resulting length cannot be negative; the linear approximation is outside its range.|结果长度不能为负，线性近似已超出范围。',
      );
      return [R('Length change|长度变化', d, 'm'), R('Final length|最终长度', v.l + d, 'm')];
    },
    'ΔL=αL₀ΔT',
    [0.0012, 2.0012],
  );
  D(
    'ideal-gas-pressure',
    'Ideal Gas Pressure|理想气体压强',
    'Apply the ideal gas equation in absolute temperature.|以绝对温度应用理想气体状态方程。',
    [
      n('n', 'Amount of substance (mol)|物质的量（mol）', 1),
      temp,
      p('v', 'Volume (m³)|体积（m³）', 0.025),
    ],
    (v) => [R('Absolute pressure|绝对压强', (v.n * Rgas * v.t) / v.v, 'Pa')],
    'Use P = nRT/V with R = 8.31446261815324 J/(mol·K). n is amount in mol, T is absolute temperature in K, and V is volume in m³. Pressure P is in Pa.|使用 P = nRT/V，其中 R = 8.31446261815324 J/(mol·K)。n 为物质的量（mol），T 为绝对温度（K），V 为体积（m³）；压强 P 的单位为 Pa。',
    [99773.5514178389],
  );
  D(
    'combined-gas-law',
    'Combined Gas Law|综合气体定律',
    'Find a final volume when pressure and temperature change.|在气体量固定时由压强与温度变化求末体积。',
    [
      p('p', 'Initial absolute pressure (Pa)|初始绝对压强（Pa）', 100000),
      p('v', 'Initial volume (L)|初始体积（L）', 10),
      p('t', 'Initial temperature (K)|初始温度（K）', 300),
      p('q', 'Final absolute pressure (Pa)|最终绝对压强（Pa）', 200000),
      p('s', 'Final temperature (K)|最终温度（K）', 300),
    ],
    (v) => [R('Final volume|最终体积', (v.p * v.v * v.s) / (v.q * v.t), 'L')],
    'P₁V₁/T₁=P₂V₂/T₂',
    [5],
  );
  D(
    'thermal-conduction',
    'Steady Thermal Conduction|稳态导热',
    'Estimate one-dimensional heat flow across a flat material layer.|估计平板材料层的一维热传导。',
    [
      n('k', 'Thermal conductivity (W/m·K)|导热系数（W/m·K）', 0.04),
      n('a', 'Layer area (m²)|层面积（m²）', 10),
      p('l', 'Layer thickness (m)|层厚（m）', 0.1),
      u('d', 'Hot minus cold temperature (K)|热侧减冷侧温差（K）', 20),
    ],
    (v) => [R('Heat flow rate|热流率', (v.k * v.a * v.d) / v.l, 'W')],
    'Use P = kAΔT/L. k is conductivity in W/m·K, A is area in m², ΔT is the signed hot-minus-cold temperature difference in K, and L is thickness in m. Heat flow rate P is in W.|使用 P = kAΔT/L。k 为导热系数（W/m·K），A 为面积（m²），ΔT 为热侧减冷侧的带符号温差（K），L 为厚度（m）；热流率 P 的单位为 W。',
    [80],
  );
  D(
    'convective-heat-transfer',
    'Convective Heat Transfer|对流换热',
    'Estimate heat flow between a surface and a fluid.|估计表面与流体间的换热。',
    [
      n('h', 'Convection coefficient (W/m²·K)|对流换热系数（W/m²·K）', 10),
      n('a', 'Surface area (m²)|表面积（m²）', 2),
      u('d', 'Surface minus fluid temperature (K)|表面减流体温差（K）', 20),
    ],
    (v) => [R('Heat flow rate|热流率', v.h * v.a * v.d, 'W')],
    'Use P = hAΔT. h is convection coefficient in W/m²·K, A is surface area in m², and ΔT is signed surface-minus-fluid temperature difference in K. Heat flow rate P is in W.|使用 P = hAΔT。h 为对流换热系数（W/m²·K），A 为表面积（m²），ΔT 为表面减流体的带符号温差（K）；热流率 P 的单位为 W。',
    [400],
  );
  D(
    'thermal-radiation',
    'Thermal Radiation|热辐射净功率',
    'Estimate radiation exchange with large surrounding surfaces.|估计与大环境表面间的辐射换热。',
    [
      n('e', 'Surface emissivity|表面发射率', 0.9, 0, 1),
      n('a', 'Area (m²)|面积（m²）', 1),
      p('t', 'Surface absolute temperature (K)|表面绝对温度（K）', 400),
      p('s', 'Surrounding absolute temperature (K)|环境绝对温度（K）', 300),
    ],
    (v) => [
      R(
        'Net outward radiation|向外净辐射功率',
        v.e * 5.670374419e-8 * v.a * (v.t ** 4 - v.s ** 4),
        'W',
      ),
    ],
    'Use P = εσA(T⁴−Tₛ⁴). ε is emissivity, σ is the Stefan–Boltzmann constant, A is area in m², and T and Tₛ are surface and surrounding temperatures in K. Positive P means net outward power in W.|使用 P = εσA(T⁴−Tₛ⁴)。ε 为发射率，σ 为斯特藩–玻尔兹曼常数，A 为面积（m²），T 与 Tₛ 为表面及环境温度（K）；P 为正表示向外净功率，单位为 W。',
    [893.0839709925],
    'Gray diffuse surface in a large isothermal enclosure, view factor 1; convection and conduction excluded.|灰体漫反射表面处于大型等温包围环境，视角因子为 1；不含对流与导热。',
  );
  D(
    'carnot-efficiency',
    'Carnot Efficiency Limit|卡诺效率极限',
    'Find the theoretical heat-engine efficiency limit.|求热机理论最高效率。',
    [
      p('h', 'Hot reservoir temperature (K)|高温热源（K）', 600),
      p('c', 'Cold reservoir temperature (K)|低温热源（K）', 300),
    ],
    (v) => {
      check(
        v.h > v.c,
        'Hot reservoir must be hotter than cold reservoir.|高温热源温度必须高于低温热源。',
      );
      return [R('Theoretical maximum efficiency|理论最高效率', 100 * (1 - v.c / v.h), '%')];
    },
    'Use η = 1−T_c/T_h. T_c and T_h are cold and hot reservoir absolute temperatures in K. The theoretical efficiency fraction η is displayed as a percentage; the hot reservoir must be hotter.|使用 η = 1−T_c/T_h。T_c 与 T_h 为低温及高温热源绝对温度（K）；理论效率比例 η 以百分比显示，高温热源必须更热。',
    [50],
    'Absolute temperatures required. Real engines have additional losses and lower efficiency.|必须使用绝对温度；实际热机还存在其他损失，效率更低。',
  );
  D(
    'mixture-equilibrium-temperature',
    'Mixture Equilibrium Temperature|混合平衡温度',
    'Mix two masses with constant heat capacities and no heat loss.|计算两种恒定比热材料无热损混合温度。',
    [
      p('a', 'Mass A (kg)|A 质量（kg）', 1),
      p('c', 'Specific heat A (J/kg·K)|A 比热容（J/kg·K）', 4184),
      u('t', 'Initial A temperature (°C)|A 初温（°C）', 80),
      p('b', 'Mass B (kg)|B 质量（kg）', 3),
      p('d', 'Specific heat B (J/kg·K)|B 比热容（J/kg·K）', 4184),
      u('s', 'Initial B temperature (°C)|B 初温（°C）', 20),
    ],
    (v) => {
      check(
        v.t >= -273.15 && v.s >= -273.15,
        'Temperatures cannot be below absolute zero.|温度不能低于绝对零度。',
      );
      return [
        R(
          'Equilibrium temperature|平衡温度',
          (v.a * v.c * v.t + v.b * v.d * v.s) / (v.a * v.c + v.b * v.d),
          '°C',
        ),
      ];
    },
    'Use T = (mₐcₐTₐ+mᵦcᵦTᵦ)/(mₐcₐ+mᵦcᵦ). m denotes mass, c specific heat, and subscripts identify the materials. Tₐ and Tᵦ are initial temperatures in °C; equilibrium temperature T uses the same scale. Assume no heat loss or phase change.|使用 T = (mₐcₐTₐ+mᵦcᵦTᵦ)/(mₐcₐ+mᵦcᵦ)。m 表示质量，c 表示比热容，下标区分材料；Tₐ 与 Tᵦ 为初始温度（°C），平衡温度 T 使用相同温标，假设无热损和相变。',
    [35],
    'Insulated mixture, constant heat capacities, no container heat, no reaction and no phase change.|绝热混合、比热恒定，忽略容器吸热、反应及相变。',
  );
  D(
    'latent-heat',
    'Latent Heat|相变潜热',
    'Estimate energy for a phase change at constant temperature.|估计恒温相变所需热量。',
    [
      n('m', 'Mass transformed (kg)|相变质量（kg）', 2),
      n('l', 'Specific latent heat (J/kg)|比潜热（J/kg）', 334000),
    ],
    (v) => [R('Phase-change energy magnitude|相变能量大小', v.m * v.l, 'J')],
    'Q=mL',
    [668000],
  );
  D(
    'ideal-gas-density',
    'Ideal Gas Density|理想气体密度',
    'Find ideal gas density from molar mass, pressure and temperature.|由摩尔质量、压强与温度求理想气体密度。',
    [
      p('p', 'Absolute pressure (Pa)|绝对压强（Pa）', 101325),
      p('m', 'Molar mass (g/mol)|摩尔质量（g/mol）', 28.97),
      temp,
    ],
    (v) => [R('Ideal gas density|理想气体密度', (v.p * v.m) / 1000 / (Rgas * v.t), 'kg/m³')],
    'Use ρ = PM/(RT). P is absolute pressure in Pa, M is molar mass converted to kg/mol, T is absolute temperature in K, and R is the gas constant. Density ρ is in kg/m³.|使用 ρ = PM/(RT)。P 为绝对压强（Pa），M 为换算成 kg/mol 的摩尔质量，T 为绝对温度（K），R 为气体常数；密度 ρ 的单位为 kg/m³。',
    [1.1768189899],
  );
  D(
    'thermal-resistance',
    'Thermal Resistance of Layers|多层热阻',
    'Combine layer thicknesses and conductivities into area-normalized resistance.|合并材料层厚度与导热系数，求单位面积热阻。',
    [
      textField('l', 'Layer thicknesses (m)|各层厚度（m）', '0.1,0.2'),
      textField('k', 'Conductivities (W/m·K)|各层导热系数（W/m·K）', '0.04,0.2'),
    ],
    (v) => {
      const a = CMModels.nums(v.l),
        b = CMModels.nums(v.k);
      check(
        a.length === b.length && a.every((x) => x >= 0) && b.every((x) => x > 0),
        'Use equal lists, nonnegative thickness and positive conductivity.|两列应等长，厚度非负，导热系数为正。',
      );
      const r = CMModels.sum(a.map((x, k) => x / b[k]));
      check(r > 0, 'Total thermal resistance must be positive.|总热阻应大于零。');
      return [
        R('Area-normalized resistance|单位面积热阻', r, 'm²·K/W'),
        R('Conductance U without surface films|不含表面热阻的 U 值', 1 / r, 'W/m²·K'),
      ];
    },
    'R=ΣLᵢ/kᵢ; U=1/R',
    [3.5, 2 / 7],
    'One-dimensional steady layers with perfect contact. Surface films, thermal bridges and moisture effects are excluded.|一维稳态层状材料、接触理想；不含表面热阻、热桥与水分影响。',
  );
  function textField(id, label, value) {
    return CMModels.text(id, label, value);
  }
  D(
    'ideal-gas-molar-volume',
    'Ideal Gas Molar Volume|理想气体摩尔体积',
    'Calculate volume occupied per mole under chosen conditions.|计算指定温压下每摩尔理想气体占据体积。',
    [temp, p('p', 'Absolute pressure (Pa)|绝对压强（Pa）', 100000)],
    (v) => [R('Molar volume|摩尔体积', ((Rgas * v.t) / v.p) * 1000, 'L/mol')],
    'Vm=RT/P',
    [24.9433878544597],
  );
})();

;
(() => {
  'use strict';
  const { add, n, p, u, row: R, PI, rad } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized classical model in SI units. Check sign conventions and assumptions; not a certified engineering design calculation.|使用 SI 单位的理想经典模型；请检查符号约定与假设，不是经认证的工程设计计算。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const mass = n('m', 'Mass (kg)|质量（kg）', 10),
    gravity = p('g', 'Gravity (m/s²)|重力加速度（m/s²）', 9.80665),
    speed = u('v', 'Velocity (m/s)|速度（m/s）', 5),
    angle = n('a', 'Angle (degrees)|夹角（度）', 0, -360, 360);
  D(
    'force',
    'Force from Mass and Acceleration|质量加速度求力',
    'Apply Newton’s second law on one axis.|在单一轴向应用牛顿第二定律。',
    [mass, u('a', 'Acceleration (m/s²)|加速度（m/s²）', 2)],
    (v) => [R('Net force|合力', v.m * v.a, 'N')],
    'F=ma',
    [20],
  );
  D(
    'weight-force',
    'Weight Force|重力大小',
    'Convert mass to weight under an entered gravitational field.|按自填重力场将质量转换为重力。',
    [mass, gravity],
    (v) => [R('Weight force|重力', v.m * v.g, 'N')],
    'W=mg',
    [98.0665],
  );
  D(
    'momentum',
    'Linear Momentum|线动量',
    'Calculate signed momentum along a single axis.|计算单一轴向带符号动量。',
    [mass, speed],
    (v) => [R('Momentum|动量', v.m * v.v, 'kg·m/s')],
    'p=mv',
    [50],
  );
  D(
    'impulse',
    'Impulse|冲量',
    'Calculate momentum change from a constant or average force.|由恒力或平均力计算动量变化。',
    [
      u('f', 'Average signed force (N)|平均带符号力（N）', 20),
      n('t', 'Duration (s)|持续时间（s）', 3),
    ],
    (v) => [R('Impulse|冲量', v.f * v.t, 'N·s')],
    'Use J = FΔt. F is average signed force in N and Δt is duration in s. Impulse J has units N·s and equals the modeled signed change in momentum.|使用 J = FΔt。F 为平均带符号力（N），Δt 为持续时间（s）；冲量 J 的单位为 N·s，等于模型中的带符号动量变化。',
    [60],
  );
  D(
    'kinetic-energy',
    'Kinetic Energy|动能',
    'Find translational kinetic energy at nonrelativistic speed.|计算非相对论速度下的平动动能。',
    [mass, speed],
    (v) => [R('Kinetic energy|动能', 0.5 * v.m * v.v * v.v, 'J')],
    'Ek=½mv²',
    [125],
  );
  D(
    'gravitational-potential-energy',
    'Gravitational Potential Energy|重力势能变化',
    'Calculate potential-energy change in a uniform gravitational field.|计算均匀重力场中的势能变化。',
    [mass, gravity, u('h', 'Height change (m)|高度变化（m）', 5)],
    (v) => [R('Potential energy change|势能变化', v.m * v.g * v.h, 'J')],
    'ΔU=mgΔh',
    [490.3325],
  );
  D(
    'mechanical-work',
    'Work by a Constant Force|恒力做功',
    'Find the component of constant force along displacement.|计算恒力沿位移方向所做的功。',
    [
      n('f', 'Force magnitude (N)|力大小（N）', 20),
      n('s', 'Displacement magnitude (m)|位移大小（m）', 5),
      angle,
    ],
    (v) => [R('Work|功', v.f * v.s * Math.cos(rad(v.a)), 'J')],
    'Use W = Fs cosθ. F is force magnitude in N, s is displacement magnitude in m, and θ is the angle between them in degrees. Signed work W is in J.|使用 W = Fs cosθ。F 为力大小（N），s 为位移大小（m），θ 为两者夹角（度）；带符号功 W 的单位为 J。',
    [100],
  );
  D(
    'mechanical-power',
    'Mechanical Power|机械功率',
    'Convert work over time to average mechanical power.|由做功与用时计算平均机械功率。',
    [u('w', 'Work (J)|功（J）', 1000), p('t', 'Duration (s)|用时（s）', 5)],
    (v) => [R('Average power|平均功率', v.w / v.t, 'W')],
    'P=W/t',
    [200],
  );
  D(
    'torque',
    'Torque|力矩',
    'Find torque magnitude from force, lever arm and included angle.|由力、力臂长度与夹角计算力矩大小。',
    [
      n('f', 'Force magnitude (N)|力大小（N）', 20),
      n('r', 'Radius to application point (m)|施力点半径（m）', 0.5),
      n('a', 'Included angle (degrees)|夹角（度）', 90, 0, 180),
    ],
    (v) => [R('Torque magnitude|力矩大小', v.f * v.r * Math.sin(rad(v.a)), 'N·m')],
    'Use τ = rF sinθ. r is distance to the force application point in m, F is force magnitude in N, and θ is their included angle in degrees. Torque magnitude τ is in N·m.|使用 τ = rF sinθ。r 为施力点到轴心距离（m），F 为力大小（N），θ 为两者夹角（度）；力矩大小 τ 的单位为 N·m。',
    [10],
  );
  D(
    'lever-equilibrium',
    'Lever Equilibrium|杠杆平衡',
    'Solve a perpendicular balancing force around a pivot.|求支点两侧垂直施力的平衡力。',
    [
      n('f', 'Known force (N)|已知力（N）', 100),
      p('a', 'Known lever arm (m)|已知力臂（m）', 0.5),
      p('b', 'Opposite lever arm (m)|另一力臂（m）', 2),
    ],
    (v) => [R('Balancing force|平衡力', (v.f * v.a) / v.b, 'N')],
    'F₁L₁=F₂L₂',
    [25],
  );
  D(
    'hookes-law',
    'Hooke’s Law Spring Force|胡克定律弹簧力',
    'Calculate restoring force for a linear elastic spring.|计算线性弹性弹簧的回复力。',
    [
      n('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200),
      u('x', 'Displacement from equilibrium (m)|相对平衡位置位移（m）', 0.1),
    ],
    (v) => [R('Restoring force|回复力', -v.k * v.x, 'N')],
    'F=−kx',
    [-20],
    'Linear elastic range only; sign is opposite displacement. Plastic deformation and spring mass are omitted.|仅限线弹性范围，力方向与位移相反；忽略塑性变形与弹簧质量。',
  );
  D(
    'spring-energy',
    'Elastic Spring Energy|弹簧弹性势能',
    'Find stored energy in an ideal linear spring.|计算理想线性弹簧的储能。',
    [
      n('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200),
      u('x', 'Extension or compression (m)|伸长或压缩量（m）', 0.1),
    ],
    (v) => [R('Stored elastic energy|储存弹性势能', 0.5 * v.k * v.x * v.x, 'J')],
    'U=½kx²',
    [1],
  );
  D(
    'friction-force',
    'Friction Force|摩擦力',
    'Compare kinetic friction with the maximum static-friction limit.|比较动摩擦力与最大静摩擦界限。',
    [
      n('n', 'Normal force (N)|法向力（N）', 100),
      n('k', 'Kinetic coefficient|动摩擦系数', 0.3, 0, 10),
      n('s', 'Static coefficient|静摩擦系数', 0.5, 0, 10),
    ],
    (v) => [
      R('Kinetic friction magnitude|动摩擦力大小', v.n * v.k, 'N'),
      R('Maximum static friction|最大静摩擦力', v.n * v.s, 'N'),
    ],
    'Fk=μkN; |Fs|≤μsN',
    [30, 50],
    'Static friction adjusts up to its limit; the maximum is not automatically the actual force.|静摩擦力会调整至所需值，但不超过上限；最大值不自动等于实际力。',
  );
  D(
    'centripetal-force',
    'Centripetal Force|向心力',
    'Find inward force and acceleration for circular motion.|求圆周运动的向心力与向心加速度。',
    [mass, n('v', 'Tangential speed (m/s)|切向速率（m/s）', 5), p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Inward net force|向心合力', (v.m * v.v * v.v) / v.r, 'N'),
      R('Centripetal acceleration|向心加速度', (v.v * v.v) / v.r, 'm/s²'),
    ],
    'F=mv²/r; a=v²/r',
    [125, 12.5],
  );
  D(
    'angular-velocity',
    'Angular Velocity|角速度',
    'Convert rotation frequency into angular and rim speed.|由转动频率求角速度与边缘线速度。',
    [u('f', 'Rotations per minute|每分钟转数', 60), n('r', 'Radius (m)|半径（m）', 0.5)],
    (v) => [
      R('Angular velocity|角速度', (v.f * 2 * PI) / 60, 'rad/s'),
      R('Rim velocity|边缘线速度', ((v.f * 2 * PI) / 60) * v.r, 'm/s'),
    ],
    'Use ω = 2πn/60 and v = ωr. n is rotations per minute and r is radius in m. Angular speed ω is in rad/s and tangential speed v is in m/s.|使用 ω = 2πn/60 及 v = ωr。n 为每分钟转数，r 为半径（m）；角速率 ω 的单位为 rad/s，切向速率 v 的单位为 m/s。',
    [2 * PI, PI],
  );
  D(
    'angular-acceleration',
    'Angular Acceleration|角加速度',
    'Find average angular acceleration between two velocities.|由两个角速度求平均角加速度。',
    [
      u('a', 'Initial angular velocity (rad/s)|初始角速度（rad/s）', 2),
      u('b', 'Final angular velocity (rad/s)|最终角速度（rad/s）', 10),
      p('t', 'Elapsed time (s)|经过时间（s）', 4),
    ],
    (v) => [R('Average angular acceleration|平均角加速度', (v.b - v.a) / v.t, 'rad/s²')],
    'α=(ω₁−ω₀)/Δt',
    [2],
  );
  D(
    'rotational-energy',
    'Rotational Kinetic Energy|转动动能',
    'Calculate rotation energy from moment of inertia and angular velocity.|由转动惯量与角速度计算转动动能。',
    [
      n('i', 'Moment of inertia (kg·m²)|转动惯量（kg·m²）', 2),
      u('w', 'Angular velocity (rad/s)|角速度（rad/s）', 10),
    ],
    (v) => [R('Rotational energy|转动动能', 0.5 * v.i * v.w * v.w, 'J')],
    'E=½Iω²',
    [100],
  );
  D(
    'disk-moment-of-inertia',
    'Disk Moment of Inertia|圆盘转动惯量',
    'Find inertia of a uniform solid disk about its central normal axis.|计算均匀实心圆盘绕中心垂直轴的转动惯量。',
    [mass, n('r', 'Disk radius (m)|圆盘半径（m）', 0.5)],
    (v) => [R('Moment of inertia|转动惯量', 0.5 * v.m * v.r * v.r, 'kg·m²')],
    'I=½mr²',
    [1.25],
  );
  D(
    'projectile-range',
    'Projectile Range|抛体射程',
    'Model ideal flight landing at the launch height.|计算落点与起点等高的理想抛体运动。',
    [
      n('v', 'Launch speed (m/s)|发射速率（m/s）', 20),
      n('a', 'Launch elevation (degrees)|仰角（度）', 45, 0, 90),
      gravity,
    ],
    (v) => [
      R('Horizontal range|水平射程', (v.v * v.v * Math.sin(2 * rad(v.a))) / v.g, 'm'),
      R('Flight time|飞行时间', (2 * v.v * Math.sin(rad(v.a))) / v.g, 's'),
      R('Maximum rise|最高上升高度', (v.v * Math.sin(rad(v.a))) ** 2 / (2 * v.g), 'm'),
    ],
    'Use R = v²sin(2θ)/g and t = 2v sinθ/g. v is launch speed in m/s, θ is elevation in degrees, and g is gravity in m/s². Range R is in m and flight time t is in s, with equal launch and landing heights and no air resistance.|使用 R = v²sin(2θ)/g 及 t = 2v sinθ/g。v 为发射速率（m/s），θ 为仰角（度），g 为重力加速度（m/s²）；射程 R 的单位为 m，飞行时间 t 的单位为 s，假设起落等高且无空气阻力。',
    [400 / 9.80665, (20 * Math.SQRT2) / 9.80665, 100 / 9.80665],
    'Same launch and landing height, constant gravity, no drag, wind or Earth curvature.|起落等高、重力恒定，忽略阻力、风与地球曲率。',
  );
  D(
    'free-fall',
    'Free Fall from Rest|静止自由落体',
    'Estimate fall time and impact speed from a release height.|由释放高度估计自由落体时间与触地速率。',
    [n('h', 'Release height (m)|释放高度（m）', 20), gravity],
    (v) => [
      R('Fall time|下落时间', Math.sqrt((2 * v.h) / v.g), 's'),
      R('Impact speed magnitude|触地速率', Math.sqrt(2 * v.g * v.h), 'm/s'),
    ],
    'Use t = √(2h/g) and v = √(2gh). h is release height in m and g is gravity in m/s². Time t is in s and speed v is in m/s, starting from rest without air resistance.|使用 t = √(2h/g) 及 v = √(2gh)。h 为释放高度（m），g 为重力加速度（m/s²）；时间 t 的单位为 s，速率 v 的单位为 m/s，假设由静止释放且无空气阻力。',
    [Math.sqrt(40 / 9.80665), Math.sqrt(40 * 9.80665)],
    'Released from rest in uniform gravity, without drag. Not a fall-safety assessment.|均匀重力下从静止释放且忽略阻力，不用于坠落安全评估。',
  );
  D(
    'escape-velocity',
    'Escape Velocity|逃逸速度',
    'Estimate escape speed from a spherical gravitating body.|估算球形天体表面的逃逸速度。',
    [
      n('m', 'Central mass (kg)|中心天体质量（kg）', 5.972e24, 1, 1e40),
      p('r', 'Distance from centre (m)|距中心距离（m）', 6371000),
    ],
    (v) => [R('Escape speed|逃逸速度', Math.sqrt((2 * 6.6743e-11 * v.m) / v.r), 'm/s')],
    'v=√(2GM/r)',
    [Math.sqrt((2 * 6.6743e-11 * 5.972e24) / 6371000)],
    'Newtonian isolated spherical body; excludes atmosphere, rotation and other bodies. G=6.67430×10⁻¹¹ SI.|牛顿孤立球形天体模型，忽略大气、自转与其他天体；G=6.67430×10⁻¹¹（SI）。',
  );
  D(
    'universal-gravitation',
    'Universal Gravitation|万有引力',
    'Calculate mutual gravitational attraction between point masses.|计算点质量间的万有引力。',
    [
      n('a', 'Mass A (kg)|质量 A（kg）', 1000),
      n('b', 'Mass B (kg)|质量 B（kg）', 1000),
      p('r', 'Centre-to-centre separation (m)|质心间距离（m）', 1),
    ],
    (v) => [R('Attractive force|引力大小', (6.6743e-11 * v.a * v.b) / v.r ** 2, 'N')],
    'F=Gm₁m₂/r²',
    [0.000066743],
  );
  D(
    'pendulum-period',
    'Simple Pendulum Period|单摆周期',
    'Estimate the small-angle period of an ideal pendulum.|估计理想单摆的小角度周期。',
    [n('l', 'Pendulum length (m)|摆长（m）', 1), gravity],
    (v) => [R('Small-angle period|小角度周期', 2 * PI * Math.sqrt(v.l / v.g), 's')],
    'T=2π√(L/g)',
    [(2 * PI) / Math.sqrt(9.80665)],
    'Small amplitude, massless string, point bob, fixed pivot and no friction.|小振幅、无质量细绳、质点摆球、固定支点且无摩擦。',
  );
  D(
    'spring-oscillation-period',
    'Spring Oscillation Period|弹簧振子周期',
    'Find an ideal mass-spring system’s natural period.|计算理想质点弹簧系统的固有周期。',
    [mass, p('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200)],
    (v) => [
      R('Natural period|固有周期', 2 * PI * Math.sqrt(v.m / v.k), 's'),
      R('Natural frequency|固有频率', Math.sqrt(v.k / v.m) / (2 * PI), 'Hz'),
    ],
    'T=2π√(m/k)',
    [(2 * PI) / Math.sqrt(20), Math.sqrt(20) / (2 * PI)],
  );
  D(
    'elastic-collision',
    'One Dimensional Elastic Collision|一维弹性碰撞',
    'Solve final velocities for an isolated perfectly elastic collision.|求孤立系统完全弹性碰撞后的速度。',
    [
      p('a', 'Mass A (kg)|质量 A（kg）', 2),
      p('b', 'Mass B (kg)|质量 B（kg）', 2),
      u('u', 'Initial A velocity (m/s)|A 初速度（m/s）', 5),
      u('v', 'Initial B velocity (m/s)|B 初速度（m/s）', 0),
    ],
    (v) => [
      R('Final A velocity|A 末速度', ((v.a - v.b) * v.u + 2 * v.b * v.v) / (v.a + v.b), 'm/s'),
      R('Final B velocity|B 末速度', (2 * v.a * v.u + (v.b - v.a) * v.v) / (v.a + v.b), 'm/s'),
    ],
    'Use vₐ = [(mₐ−mᵦ)uₐ+2mᵦuᵦ]/(mₐ+mᵦ) and vᵦ = [2mₐuₐ+(mᵦ−mₐ)uᵦ]/(mₐ+mᵦ). m denotes mass, u initial signed velocity, and v final signed velocity; subscripts distinguish the bodies. Use consistent mass and velocity units.|使用 vₐ = [(mₐ−mᵦ)uₐ+2mᵦuᵦ]/(mₐ+mᵦ) 及 vᵦ = [2mₐuₐ+(mᵦ−mₐ)uᵦ]/(mₐ+mᵦ)。m 表示质量，u 表示初始带符号速度，v 表示最终带符号速度，下标区分物体；质量和速度分别使用一致单位。',
    [0, 5],
  );
})();

;
(() => {
  'use strict';
  const {
    add,
    n,
    p,
    u,
    i,
    text,
    select,
    row: R,
    check,
    nums,
    sum,
    mean,
    variance,
    quantile,
    invNormal,
    tP,
    gammaQ,
    logGamma,
  } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const list = text('values', 'Observations, separated by commas|观测值（逗号分隔）', '1,2,3,4,5');
  const confidence = n('c', 'Confidence level (%)|置信水平（%）', 95, 50, 99.999);
  const pairs = (x, y) => {
    const a = nums(x),
      b = nums(y);
    check(
      a.length === b.length && a.length >= 2,
      'The two lists need the same length and at least two values.|两组数据应等长，且各至少两个值。',
    );
    return [a, b];
  };
  const studentCritical = (c, df) => {
    let a = 0,
      b = 1e7;
    for (let k = 0; k < 90; k++) {
      const x = (a + b) / 2;
      if (tP(x, df) > 1 - c) a = x;
      else b = x;
    }
    return (a + b) / 2;
  };
  const moments = (x, y) => {
    const [a, b] = pairs(x, y),
      ma = mean(a),
      mb = mean(b),
      xx = sum(a.map((x) => (x - ma) ** 2)),
      yy = sum(b.map((x) => (x - mb) ** 2)),
      xy = sum(a.map((x, k) => (x - ma) * (b[k] - mb)));
    return { a, b, ma, mb, xx, yy, xy };
  };
  // 1–17: descriptive statistics and interval design.
  D(
    'weighted-average',
    'Weighted Average|加权平均数',
    'Combine values with explicit nonnegative weights.|按非负权重计算一组数的加权平均。',
    [text('values', 'Values|数值', '10,20'), text('weights', 'Weights|权重', '1,3')],
    (v) => {
      const [a, w] = pairs(v.values, v.weights);
      check(
        w.every((x) => x >= 0) && sum(w) > 0,
        'Weights must be nonnegative and have a positive sum.|权重应非负且总和大于零。',
      );
      return [
        R('Weighted average|加权平均数', sum(a.map((x, k) => x * w[k])) / sum(w)),
        R('Total weight|权重总和', sum(w)),
      ];
    },
    'Σ(wᵢxᵢ) / Σwᵢ',
    [17.5, 4],
  );
  D(
    'geometric-mean',
    'Geometric Mean|几何平均数',
    'Average positive multiplicative values using logarithms.|用对数计算正数数据的几何平均。',
    [text('values', 'Positive observations|正数观测值', '2,8')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x > 0),
        'Every observation must be positive.|所有观测值都需大于零。',
      );
      return [R('Geometric mean|几何平均数', Math.exp(mean(a.map(Math.log))))];
    },
    "Use G = exp[Σln(xᵢ)/n]. xᵢ are positive observations, n is their count, ln is natural logarithm, and exp is its inverse. Geometric mean G has the observations' unit.|使用 G = exp[Σln(xᵢ)/n]。xᵢ 为正数观测值，n 为数量，ln 为自然对数，exp 为其反函数；几何平均数 G 与观测值单位相同。",
    [4],
  );
  D(
    'harmonic-mean',
    'Harmonic Mean|调和平均数',
    'Average positive rates when their numerators carry equal weight.|在分子等权的条件下计算正比率的调和平均。',
    [text('values', 'Positive rates|正比率', '30,60')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x > 0),
        'Every rate must be positive.|所有比率都需大于零。',
      );
      return [R('Harmonic mean|调和平均数', a.length / sum(a.map((x) => 1 / x)))];
    },
    'HM = n / Σ(1/xᵢ)',
    [40],
    'For travel speeds this applies to equal distances, not equal time intervals.|用于速度时对应等距离路段，而不是等时间路段。',
  );
  D(
    'root-mean-square',
    'Root Mean Square|均方根',
    'Find the quadratic mean of signed observations.|计算可含正负数的观测值的均方根。',
    [text('values', 'Observations|观测值', '3,4')],
    (v) => {
      const a = nums(v.values);
      return [R('Root mean square|均方根', Math.sqrt(mean(a.map((x) => x * x))))];
    },
    "Use R = √[Σxᵢ²/n]. xᵢ are observations and n is their count. The root mean square R is nonnegative and uses the observations' unit.|使用 R = √[Σxᵢ²/n]。xᵢ 为观测值，n 为数量；均方根 R 非负，使用观测值的单位。",
    [3.5355339059327378],
  );
  D(
    'data-range',
    'Data Statistical range|极差计算器',
    'Find the spread between the largest and smallest observations.|计算最大值、最小值及其差值。',
    [text('values', 'Observations|观测值', '-2,1,5')],
    (v) => {
      const a = nums(v.values),
        lo = Math.min(...a),
        hi = Math.max(...a);
      return [
        R('Statistical range|极差', hi - lo),
        R('Minimum|最小值', lo),
        R('Maximum|最大值', hi),
      ];
    },
    "Use R = max(x)−min(x). x is the entered observation list; max and min select its largest and smallest values. The range R uses the observations' unit.|使用 R = max(x)−min(x)。x 为自填观测值列表，max 与 min 分别选择最大及最小值；极差 R 使用观测值的单位。",
    [7, -2, 5],
  );
  D(
    'quartiles',
    'Quartiles|四分位数',
    'Find the lower quartile, median and upper quartile by linear interpolation.|用线性插值法求下四分位数、中位数和上四分位数。',
    [text('values', 'Observations|观测值', '1,2,3,4,5,6,7,8,9')],
    (v) => {
      const a = nums(v.values);
      return [
        R('Lower quartile Q1|下四分位数 Q1', quantile(a, 0.25)),
        R('Median Q2|中位数 Q2', quantile(a, 0.5)),
        R('Upper quartile Q3|上四分位数 Q3', quantile(a, 0.75)),
      ];
    },
    'Sorted position h=(n−1)p, with linear interpolation (type 7).|排序后的位置 h=(n−1)p，采用线性插值（第 7 类方法）。',
    [3, 5, 7],
    'Quartile conventions differ between software. This tool uses type-7 linear interpolation.|不同软件的四分位数约定不同，本工具采用第 7 型线性插值。',
  );
  D(
    'percentile',
    'Percentile Value|百分位数',
    'Find the value at an editable percentile of a data set.|求一组数据在指定百分位上的数值。',
    [list, n('p', 'Percentile (%)|百分位（%）', 75, 0, 100)],
    (v) => [R('Percentile value|百分位数', quantile(nums(v.values), v.p / 100))],
    'h=(n−1)p; interpolate between neighbouring sorted observations.|h=(n−1)p；在相邻的已排序观测值之间进行插值。',
    [4],
    'Uses type-7 interpolation, including minimum at 0% and maximum at 100%.|采用第 7 型插值；0% 为最小值，100% 为最大值。',
  );
  D(
    'percentile-rank',
    'Percentile Rank|百分位排名',
    'Find a value’s position using below, inclusive or midrank conventions.|按低于、低于等于或中秩约定计算数值的百分位排名。',
    [
      text('values', 'Observations|观测值', '1,2,3,3,4'),
      u('x', 'Target value|目标值', 3),
      select('method', 'Rank convention|排名约定', 'mid', [
        ['mid', 'Midrank|中秩'],
        ['below', 'Strictly below|严格低于'],
        ['inclusive', 'At or below|低于等于'],
      ]),
    ],
    (v) => {
      const a = nums(v.values),
        below = a.filter((x) => x < v.x).length,
        equal = a.filter((x) => x === v.x).length,
        r = below + (v.method === 'mid' ? equal / 2 : v.method === 'inclusive' ? equal : 0);
      return [
        R('Percentile rank|百分位排名', (100 * r) / a.length, '%'),
        R('Equal observations|相等的观测数量', equal),
      ];
    },
    'Use R = 100(B+wE)/n. B counts observations below the target, E counts equal observations, and n is sample count. Convention weight w is 0 for strictly below, 0.5 for midrank, or 1 for inclusive rank.|使用 R = 100(B+wE)/n。B 为低于目标的观测数，E 为相等观测数，n 为样本数；约定权重 w 在严格低于、中秩、低于等于三种口径下分别为 0、0.5、1。',
    [60, 2],
  );
  D(
    'interquartile-range',
    'Interquartile Range and Outliers|四分位距与异常值',
    'Find IQR and the conventional 1.5-IQR outlier fences.|求四分位距及常用的 1.5 倍四分位距异常值界限。',
    [text('values', 'Observations|观测值', '1,2,3,4,5,100')],
    (v) => {
      const a = nums(v.values),
        q1 = quantile(a, 0.25),
        q3 = quantile(a, 0.75),
        d = q3 - q1,
        lo = q1 - 1.5 * d,
        hi = q3 + 1.5 * d;
      return [
        R('Interquartile range|四分位距', d),
        R('Lower fence|下界', lo),
        R('Upper fence|上界', hi),
        R('Observations outside fences|界限外观测数', a.filter((x) => x < lo || x > hi).length),
      ];
    },
    'Use IQR = Q₃−Q₁ with fences Q₁−1.5IQR and Q₃+1.5IQR. Q₁ and Q₃ are lower and upper quartiles using linear interpolation. Values beyond the fences are flagged, not automatically treated as errors.|使用 IQR = Q₃−Q₁，界限为 Q₁−1.5IQR 与 Q₃+1.5IQR。Q₁ 与 Q₃ 为采用线性插值的下、上四分位数；界外值仅被标示，不自动视为错误。',
    [2.5, -1.5, 8.5, 1],
    'Fences are descriptive screening rules, not proof that a value is erroneous.|界限只是描述性筛查规则，不能证明某个观测值错误。',
  );
  D(
    'z-score',
    'Z-Score|标准分数 Z',
    'Express a value’s distance from a reference mean in standard deviations.|用标准差表示数值偏离参考均值的程度。',
    [
      u('x', 'Observed value|观测值', 85),
      u('m', 'Reference mean|参考均值', 70),
      p('s', 'Reference standard deviation|参考标准差', 5),
    ],
    (v) => [R('Z-score|Z 分数', (v.x - v.m) / v.s)],
    'z=(x−μ)/σ',
    [3],
  );
  D(
    'coefficient-of-variation',
    'Coefficient of Variation|变异系数',
    'Compare sample standard deviation with a positive mean.|比较样本标准差与正均值的相对大小。',
    [text('values', 'Nonnegative observations|非负观测值', '10,20,30')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x >= 0) && mean(a) > 0,
        'Use nonnegative ratio-scale data with a positive mean.|需使用均值大于零的非负比率尺度数据。',
      );
      const s = Math.sqrt(variance(a));
      return [
        R('Coefficient of variation|变异系数', (100 * s) / mean(a), '%'),
        R('Sample standard deviation|样本标准差', s),
        R('Mean|均值', mean(a)),
      ];
    },
    'Use CV = 100s/μ. s is sample standard deviation and μ is the positive arithmetic mean of the entered nonnegative observations. The coefficient of variation is displayed as a percentage.|使用 CV = 100s/μ。s 为样本标准差，μ 为所填非负观测值的大于零的算术均值；变异系数以百分数显示。',
    [50, 10, 20],
    'Not suitable for arbitrary zero scales such as Celsius temperatures or means close to zero.|不适合摄氏温度等零点任意的尺度，也不宜用于接近零的均值。',
  );
  D(
    'standard-error',
    'Standard Error of the Mean|均值标准误',
    'Estimate the standard error from independent sample observations.|根据独立样本观测值估算均值标准误。',
    [text('values', 'Sample observations|样本观测值', '10,20,30')],
    (v) => {
      const a = nums(v.values),
        s = Math.sqrt(variance(a));
      return [
        R('Standard error|标准误', s / Math.sqrt(a.length)),
        R('Sample standard deviation|样本标准差', s),
        R('Sample size|样本量', a.length),
      ];
    },
    'Use SE = s/√n. s is sample standard deviation and n is the number of independent observations. Standard error describes variability of a sample mean, not the spread of individual observations.|使用 SE = s/√n。s 为样本标准差，n 为独立观测数；标准误描述样本均值的变动，而非单个观测值的离散程度。',
    [5.773502691896258, 10, 3],
  );
  D(
    'mean-confidence-interval',
    'Mean Confidence Interval|均值置信区间',
    'Build a two-sided t interval from sample mean, sample deviation and size.|由样本均值、样本标准差和样本量构造双侧 t 置信区间。',
    [
      u('m', 'Sample mean|样本均值', 10),
      n('s', 'Sample standard deviation|样本标准差', 4),
      i('n', 'Sample size|样本量', 16, 2, 1e7),
      confidence,
    ],
    (v) => {
      const se = v.s / Math.sqrt(v.n),
        critical = studentCritical(v.c / 100, v.n - 1),
        margin = critical * se;
      return [
        R('Lower confidence limit|置信下限', v.m - margin),
        R('Upper confidence limit|置信上限', v.m + margin),
        R('Margin of error|误差界限', margin),
        R('Degrees of freedom|自由度', v.n - 1),
      ];
    },
    'Use m±t_c s/√n. m is sample mean, s is sample standard deviation, n is sample size, and t_c is the two-sided Student critical value for the chosen confidence and n−1 degrees of freedom.|使用 m±t_c s/√n。m 为样本均值，s 为样本标准差，n 为样本量，t_c 为按自选双侧置信水平及 n−1 个自由度取得的 Student 临界值。',
    [7.868550454440677, 12.131449545559324],
    'Assumes independent observations and a suitable sampling model; small samples need approximately normal observations.|假设观测独立且抽样模型适用；小样本需要观测近似正态。',
  );
  D(
    'proportion-confidence-interval',
    'Wilson Proportion Interval|比例置信区间',
    'Use the Wilson score interval for a binary success count.|用 Wilson 得分法计算二项成功率的置信区间。',
    [i('k', 'Successes|成功次数', 50, 0, 1e9), i('n', 'Trials|试验次数', 100, 1, 1e9), confidence],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const p = v.k / v.n,
        z = invNormal((1 + v.c / 100) / 2),
        den = 1 + (z * z) / v.n,
        centre = (p + (z * z) / (2 * v.n)) / den,
        margin = (z * Math.sqrt((p * (1 - p)) / v.n + (z * z) / (4 * v.n * v.n))) / den;
      return [
        R('Lower confidence limit|置信下限', 100 * (centre - margin), '%'),
        R('Upper confidence limit|置信上限', 100 * (centre + margin), '%'),
        R('Observed proportion|观测比例', 100 * p, '%'),
      ];
    },
    'Use Wilson centre C = (p+z²/(2n))/(1+z²/n) and half-width H = z√[p(1−p)/n+z²/(4n²)]/(1+z²/n). p is successes divided by trials, n is trials, and z is the two-sided standard-normal critical value. Bounds are C−H and C+H, displayed as percentages.|使用 Wilson 中心 C = (p+z²/(2n))/(1+z²/n) 及半宽 H = z√[p(1−p)/n+z²/(4n²)]/(1+z²/n)。p 为成功次数除以试验次数，n 为试验次数，z 为双侧标准正态临界值；上下界为 C−H 与 C+H，以百分比显示。',
    [40.38315302709716, 59.61684697290284, 50],
    'Independent binary trials; confidence describes the method’s repeated-sample coverage, not a probability assigned to a fixed true proportion.|假设独立二项试验；置信水平描述方法在重复抽样中的覆盖率，不是固定真实比例的概率。',
  );
  D(
    'sample-size-mean',
    'Sample Size for a Mean|均值估计所需样本量',
    'Plan sample size from assumed population deviation and desired error.|按假设总体标准差和目标误差规划样本量。',
    [
      p('s', 'Assumed population standard deviation|假设总体标准差', 10),
      p('e', 'Desired half-width|目标半宽误差', 2),
      confidence,
      i('N', 'Finite population, zero for unlimited|有限总体大小（0 表示不限定）', 0, 0, 1e12),
    ],
    (v) => {
      const z = invNormal((1 + v.c / 100) / 2),
        n0 = ((z * v.s) / v.e) ** 2,
        needed = v.N > 0 ? n0 / (1 + (n0 - 1) / v.N) : n0;
      return [R('Required sample size|所需样本量', Math.max(1, Math.ceil(needed)))];
    },
    'Use n₀ = (zσ/E)². σ is assumed population deviation, E is desired half-width, and z is the two-sided normal critical value. For finite population N, use n = n₀/[1+(n₀−1)/N]; otherwise keep the uncorrected value. Round up to a whole sample count.|使用 n₀ = (zσ/E)²。σ 为假设总体标准差，E 为目标半宽误差，z 为双侧正态临界值；有限总体大小为 N 时使用 n = n₀/[1+(n₀−1)/N]，否则保留未修正值，再向上取整为样本数。',
    [97],
    'Normal approximation for simple random sampling. The assumed deviation must come from relevant evidence.|用于简单随机抽样的正态近似；假设标准差需要相关依据。',
  );
  D(
    'sample-size-proportion',
    'Sample Size for a Proportion|比例估计所需样本量',
    'Plan binary-trial sample size using expected proportion and margin.|按预期比例和误差界限规划二项试验样本量。',
    [
      n('p', 'Expected proportion (%)|预期比例（%）', 50, 0.000001, 99.999999),
      p('e', 'Desired margin (percentage points)|目标误差（百分点）', 5),
      confidence,
      i('N', 'Finite population, zero for unlimited|有限总体大小（0 表示不限定）', 0, 0, 1e12),
    ],
    (v) => {
      const p = v.p / 100,
        e = v.e / 100,
        z = invNormal((1 + v.c / 100) / 2),
        n0 = (z * z * p * (1 - p)) / (e * e),
        needed = v.N > 0 ? n0 / (1 + (n0 - 1) / v.N) : n0;
      return [R('Required sample size|所需样本量', Math.max(1, Math.ceil(needed)))];
    },
    'n₀=z²p(1−p)/E²; optionally apply finite-population correction.|n₀=z²p(1−p)/E²；可选应用有限总体修正。',
    [385],
    'Normal approximation; 50% is conservative when the proportion is unknown. Cluster sampling needs a separate design adjustment.|采用正态近似；未知比例时 50% 较保守，整群抽样还需设计效应调整。',
  );
  D(
    'margin-of-error',
    'Proportion Margin of Error|比例误差界限',
    'Estimate a normal-approximation margin from sample size and proportion.|由样本量和比例估算正态近似误差界限。',
    [
      n('p', 'Proportion (%)|比例（%）', 50, 0, 100),
      i('n', 'Sample size|样本量', 400, 1, 1e9),
      confidence,
    ],
    (v) => {
      const p = v.p / 100,
        z = invNormal((1 + v.c / 100) / 2);
      return [
        R(
          'Margin of error|误差界限',
          100 * z * Math.sqrt((p * (1 - p)) / v.n),
          'percentage points',
        ),
      ];
    },
    'E = z√(p(1−p)/n)',
    [4.899909961350134],
    'This Wald approximation is unreliable for small samples or proportions near zero or one; use Wilson or exact intervals instead.|小样本或比例接近 0、1 时 Wald 近似不可靠，应查看 Wilson 或精确区间。',
  );
  // 18–25: tests, correlation and regression.
  D(
    'one-sample-t-test',
    'One-Sample t Test|单样本 t 检验',
    'Compare a sample mean with a stated reference using a two-sided t test.|用双侧 t 检验比较样本均值与给定参考值。',
    [
      text('values', 'Sample observations|样本观测值', '2,4,6,8,10'),
      u('m', 'Null-hypothesis mean|原假设均值', 5),
    ],
    (v) => {
      const a = nums(v.values),
        se = Math.sqrt(variance(a) / a.length);
      check(se > 0, 'Sample standard deviation must be positive.|样本标准差必须大于零。');
      const t = (mean(a) - v.m) / se;
      return [
        R('t statistic|t 统计量', t),
        R('Degrees of freedom|自由度', a.length - 1),
        R('Two-sided p-value|双侧 p 值', tP(t, a.length - 1)),
      ];
    },
    'Use t = (m−μ₀)/(s/√n) with df = n−1. m is sample mean, μ₀ is the null-hypothesis mean, s is sample standard deviation, and n is sample size. The displayed p-value is two-sided.|使用 t = (m−μ₀)/(s/√n)，自由度为 df = n−1。m 为样本均值，μ₀ 为原假设均值，s 为样本标准差，n 为样本量；显示的 p 值为双侧。',
    [0.7071067811865475, 4, 0.5185185185185185],
    'Requires an appropriate independent-sampling model. A p-value does not measure the probability that the null hypothesis is true.|需要适当的独立抽样模型；p 值不是原假设为真的概率。',
  );
  D(
    'welch-t-test',
    'Welch Two-Sample t Test|Welch 双样本 t 检验',
    'Compare two independent sample means without assuming equal variances.|比较两个独立样本均值，不要求两组方差相等。',
    [text('x', 'Sample A|样本 A', '8,9,10,11,12'), text('y', 'Sample B|样本 B', '6,7,8,9,10')],
    (v) => {
      const a = nums(v.x),
        b = nums(v.y),
        va = variance(a) / a.length,
        vb = variance(b) / b.length;
      check(
        va + vb > 0,
        'The combined sampling variance must be positive.|合并抽样方差必须大于零。',
      );
      const t = (mean(a) - mean(b)) / Math.sqrt(va + vb),
        df = (va + vb) ** 2 / ((va * va) / (a.length - 1) + (vb * vb) / (b.length - 1));
      return [
        R('t statistic|t 统计量', t),
        R('Welch degrees of freedom|Welch 自由度', df),
        R('Two-sided p-value|双侧 p 值', tP(t, df)),
      ];
    },
    "Use t = (m₁−m₂)/√(s₁²/n₁+s₂²/n₂). m, s and n are each sample's mean, sample standard deviation and size; subscripts distinguish the samples. The two-sided p-value uses Welch–Satterthwaite degrees of freedom, without assuming equal variances.|使用 t = (m₁−m₂)/√(s₁²/n₁+s₂²/n₂)。m、s、n 分别为各组均值、样本标准差和样本量，下标区分样本；双侧 p 值采用 Welch–Satterthwaite 自由度，不假设两组方差相等。",
    [2, 8, 0.08051623795726259],
    'For independent samples. Paired measurements require a paired test.|用于独立样本；配对测量应使用配对检验。',
  );
  D(
    'paired-t-test',
    'Paired t Test|配对 t 检验',
    'Test whether the mean within-pair difference is zero.|检验同一配对内差值的均值是否为零。',
    [
      text('x', 'First measurement|第一次测量', '8,9,10,11,12'),
      text('y', 'Paired second measurement|配对的第二次测量', '7,7,8,9,9'),
    ],
    (v) => {
      const [a, b] = pairs(v.x, v.y),
        d = a.map((x, k) => x - b[k]),
        se = Math.sqrt(variance(d) / d.length);
      check(
        se > 0,
        'Paired differences must have positive sample variance.|配对差值的样本方差需大于零。',
      );
      const t = mean(d) / se;
      return [
        R('t statistic|t 统计量', t),
        R('Degrees of freedom|自由度', d.length - 1),
        R('Two-sided p-value|双侧 p 值', tP(t, d.length - 1)),
        R('Mean first-minus-second difference|第一次减第二次的平均差', mean(d)),
      ];
    },
    'Apply a one-sample t test to the paired differences.|对每对数据的差值执行单样本 t 检验。',
    [6.324555320336758, 4],
    'Pair positions must correspond to the same unit or person; observations between pairs must be independent.|两列同一位置需对应同一对象；不同配对之间应独立。',
  );
  D(
    'chi-square-independence',
    '2 × 2 Chi-Square Test|二乘二卡方独立性检验',
    'Test independence in a two-by-two count table without continuity correction.|对二乘二计数表进行无连续性校正的独立性检验。',
    [
      i('a', 'Row 1, column 1 count|第 1 行第 1 列计数', 10, 0, 1e9),
      i('b', 'Row 1, column 2 count|第 1 行第 2 列计数', 20, 0, 1e9),
      i('c', 'Row 2, column 1 count|第 2 行第 1 列计数', 30, 0, 1e9),
      i('d', 'Row 2, column 2 count|第 2 行第 2 列计数', 40, 0, 1e9),
    ],
    (v) => {
      const N = v.a + v.b + v.c + v.d,
        den = (v.a + v.b) * (v.c + v.d) * (v.a + v.c) * (v.b + v.d);
      check(den > 0, 'Every row and column total must be positive.|各行、列总数都应大于零。');
      const stat = (N * (v.a * v.d - v.b * v.c) ** 2) / den,
        expected = [
          ((v.a + v.b) * (v.a + v.c)) / N,
          ((v.a + v.b) * (v.b + v.d)) / N,
          ((v.c + v.d) * (v.a + v.c)) / N,
          ((v.c + v.d) * (v.b + v.d)) / N,
        ];
      return [
        R('Chi-square statistic|卡方统计量', stat),
        R('Degrees of freedom|自由度', 1),
        R('p-value|p 值', gammaQ(0.5, stat / 2)),
        R('Smallest expected count|最小期望计数', Math.min(...expected)),
      ];
    },
    'χ²=N(ad−bc)²/((a+b)(c+d)(a+c)(b+d)); df=1',
    [0.7936507936507936, 1],
    'The chi-square approximation can be unreliable with small expected counts. No Yates correction is applied.|期望计数较小时卡方近似可能不可靠；本工具不做 Yates 校正。',
  );
  D(
    'chi-square-goodness-of-fit',
    'Chi-Square Goodness of Fit|卡方拟合优度检验',
    'Compare observed category counts with positive expected counts.|比较分类观测计数与正的期望计数。',
    [
      text('x', 'Observed counts|观测计数', '10,20,30'),
      text('y', 'Expected counts|期望计数', '20,20,20'),
      i('k', 'Parameters estimated from the same data|由同一数据估计的参数数量', 0, 0, 100),
    ],
    (v) => {
      const [a, b] = pairs(v.x, v.y);
      check(
        a.every((x) => x >= 0) && b.every((x) => x > 0),
        'Observed counts must be nonnegative and expected counts positive.|观测计数需非负，期望计数需为正。',
      );
      check(
        Math.abs(sum(a) - sum(b)) <= 1e-8 * Math.max(1, sum(a)),
        'Observed and expected totals must agree.|观测与期望总计应一致。',
      );
      const df = a.length - 1 - v.k;
      check(df > 0, 'Degrees of freedom must be positive.|自由度必须大于零。');
      const stat = sum(a.map((x, k) => (x - b[k]) ** 2 / b[k]));
      return [
        R('Chi-square statistic|卡方统计量', stat),
        R('Degrees of freedom|自由度', df),
        R('p-value|p 值', gammaQ(df / 2, stat / 2)),
      ];
    },
    'Use χ² = Σ(Oᵢ−Eᵢ)²/Eᵢ and df = k−1−p. Oᵢ and Eᵢ are observed and expected counts, k is category count, and p is parameters estimated from the same data. The p-value is the upper chi-square tail.|使用 χ² = Σ(Oᵢ−Eᵢ)²/Eᵢ，自由度为 df = k−1−p。Oᵢ 与 Eᵢ 为观测和期望计数，k 为类别数，p 为从同一数据估计的参数数；p 值采用卡方分布上尾。',
    [10, 2, 0.006737946999085467],
  );
  D(
    'pearson-correlation',
    'Pearson Correlation|皮尔逊相关系数',
    'Measure linear association between paired numeric observations.|衡量两组配对数值的线性相关程度。',
    [
      text('x', 'x observations|x 观测值', '1,2,3,4,5'),
      text('y', 'y observations|y 观测值', '2,4,6,8,10'),
    ],
    (v) => {
      const m = moments(v.x, v.y);
      check(m.xx * m.yy > 0, 'Both variables must vary.|两个变量都必须有变化。');
      return [
        R('Pearson r|皮尔逊 r', Math.max(-1, Math.min(1, m.xy / Math.sqrt(m.xx * m.yy)))),
        R('Sample covariance|样本协方差', m.xy / (m.a.length - 1)),
        R('Paired observations|配对观测数', m.a.length),
      ];
    },
    'r=Σ(x−x̄)(y−ȳ)/√(Σ(x−x̄)²Σ(y−ȳ)²)',
    [1, 5, 5],
    'Correlation measures linear association and does not establish causation.|相关系数衡量线性联系，不能证明因果关系。',
  );
  D(
    'linear-regression',
    'Simple Linear Regression|一元线性回归',
    'Fit y=intercept+slope×x and predict y at an editable x.|拟合一元线性回归，并在指定 x 处求预测值。',
    [
      text('x', 'x observations|x 观测值', '1,2,3,4'),
      text('y', 'y observations|y 观测值', '2,4,5,4'),
      u('target', 'Prediction x|预测点 x', 5),
    ],
    (v) => {
      const m = moments(v.x, v.y);
      check(m.xx > 0, 'The x values must vary.|x 值必须有变化。');
      const slope = m.xy / m.xx,
        intercept = m.mb - slope * m.ma;
      return [
        R('Slope|斜率', slope),
        R('Intercept|截距', intercept),
        R('Predicted y|预测 y', intercept + slope * v.target),
      ];
    },
    'Use b = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)² and a = ȳ−bx̄. xᵢ and yᵢ are paired observations, bars denote means, b is slope, and a is intercept. Prediction at the entered target is a+bx.|使用 b = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)² 及 a = ȳ−bx̄。xᵢ 与 yᵢ 为成对观测值，横线表示均值，b 为斜率，a 为截距；目标点的预测值为 a+bx。',
    [0.7, 2, 5.5],
    'Ordinary least squares with an intercept. Extrapolation beyond the observed x range can be unreliable.|采用带截距的普通最小二乘法；超出观测 x 范围的外推可能不可靠。',
  );
  D(
    'r-squared',
    'R-Squared and Prediction Error|决定系数与预测误差',
    'Compare predictions with observations using R² and root mean squared error.|用 R² 和均方根误差比较预测值与观测值。',
    [text('x', 'Observed values|观测值', '2,4,6'), text('y', 'Predicted values|预测值', '2,3,5')],
    (v) => {
      const [a, b] = pairs(v.x, v.y),
        sse = sum(a.map((x, k) => (x - b[k]) ** 2)),
        sst = sum(a.map((x) => (x - mean(a)) ** 2));
      check(sst > 0, 'Observed values must vary.|观测值必须有变化。');
      return [
        R('R-squared|决定系数 R²', 1 - sse / sst),
        R('Root mean squared error|均方根误差', Math.sqrt(sse / a.length)),
      ];
    },
    'Use R² = 1−SSE/SST and RMSE = √(SSE/n). SSE is summed squared prediction error, SST is summed squared deviation of observations from their mean, and n is count. A constant observed series has undefined explained-variation ratio.|使用 R² = 1−SSE/SST 及 RMSE = √(SSE/n)。SSE 为预测误差平方和，SST 为观测值相对均值的离差平方和，n 为数量；观测值全部相同时，解释变异比例无定义。',
    [0.75, 0.816496580927726],
    'R² can be negative for poor predictions. This does not adjust for fitted parameter count.|预测较差时 R² 可以为负；本工具不按拟合参数数目做调整。',
  );
  // 26–30: probability operations and the binomial probability mass.
  D(
    'bayes-theorem',
    'Bayes’ Theorem|贝叶斯定理',
    'Update a prior probability from true-signal and false-signal rates.|根据真实信号率和误报率更新先验概率。',
    [
      n('a', 'Prior probability (%)|先验概率（%）', 1, 0, 100),
      n('b', 'Signal rate when true (%)|条件为真时的信号率（%）', 99, 0, 100),
      n('c', 'Signal rate when false (%)|条件为假时的信号率（%）', 5, 0, 100),
    ],
    (v) => {
      const a = v.a / 100,
        b = v.b / 100,
        c = v.c / 100,
        e = a * b + (1 - a) * c;
      check(e > 0, 'The signal must have positive probability.|信号发生概率必须大于零。');
      return [
        R('Posterior probability|后验概率', (100 * a * b) / e, '%'),
        R('Overall signal probability|信号总体概率', 100 * e, '%'),
      ];
    },
    'P(A|B)=P(B|A)P(A)/(P(B|A)P(A)+P(B|¬A)P(¬A))',
    [100 / 6, 5.94],
    'Inputs are probabilities you supply; this tool does not infer them from a diagnosis or a real-world population.|概率由你提供，本工具不根据诊断或现实人群自行推断。',
  );
  D(
    'conditional-probability',
    'Conditional Probability|条件概率',
    'Calculate P(A given B) from joint probability and the probability of B.|由联合概率及 B 的概率计算条件概率 P(A|B)。',
    [
      n('a', 'Joint probability P(A and B) (%)|联合概率 P(A 且 B)（%）', 20, 0, 100),
      n('b', 'Probability P(B) (%)|概率 P(B)（%）', 40, 0.000001, 100),
    ],
    (v) => {
      check(v.a <= v.b, 'Joint probability cannot exceed P(B).|联合概率不能大于 P(B)。');
      return [R('Conditional probability|条件概率', (100 * v.a) / v.b, '%')];
    },
    'P(A|B)=P(A∩B)/P(B)',
    [50],
  );
  D(
    'union-probability',
    'Union Probability|事件并集概率',
    'Find the probability that at least one of two events occurs.|求两个事件至少一个发生的概率。',
    [
      n('a', 'P(A) (%)|P(A)（%）', 30, 0, 100),
      n('b', 'P(B) (%)|P(B)（%）', 40, 0, 100),
      n('c', 'P(A and B) (%)|P(A 且 B)（%）', 10, 0, 100),
    ],
    (v) => {
      check(
        v.c <= Math.min(v.a, v.b) && v.c >= Math.max(0, v.a + v.b - 100),
        'The intersection must satisfy the probability bounds.|交集概率必须满足概率界限。',
      );
      return [R('Probability of A or B|A 或 B 的概率', v.a + v.b - v.c, '%')];
    },
    'P(A∪B)=P(A)+P(B)−P(A∩B)',
    [60],
  );
  D(
    'independent-events',
    'Independent Events Probability|独立事件联合概率',
    'Multiply probabilities of independent events and find the complement.|求独立事件全部发生及其补事件的概率。',
    [text('values', 'Probabilities from 0 to 1|0–1 之间的概率', '0.5,0.2,0.8')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x >= 0 && x <= 1),
        'Probabilities must lie between zero and one.|概率必须在 0 到 1 之间。',
      );
      const p = a.reduce((r, x) => r * x, 1);
      return [
        R('Probability all occur|全部发生的概率', 100 * p, '%'),
        R('Probability at least one fails|至少一个未发生的概率', 100 * (1 - p), '%'),
      ];
    },
    'For independent events, use P = ∏pᵢ for all events occurring and 1−P for not all occurring. pᵢ are entered probability fractions. The complement means at least one event fails, not that every event fails.|对独立事件，全部发生的概率为 P = ∏pᵢ，并非全部发生的概率为 1−P。pᵢ 为自填概率比例；补事件表示至少一项不发生，并非每项都不发生。',
    [8, 92],
    'Multiplication requires independence. Related events need a joint or conditional model.|相乘要求事件独立；有关联的事件需要联合或条件模型。',
  );
  D(
    'binomial-probability',
    'Binomial Probability|二项分布点概率',
    'Find the chance of exactly k successes in n independent trials.|求 n 次独立二项试验中恰好成功 k 次的概率。',
    [
      i('n', 'Trials n|试验次数 n', 10, 0, 100000),
      i('k', 'Successes k|成功次数 k', 3, 0, 100000),
      n('p', 'Success probability (%)|每次成功概率（%）', 50, 0, 100),
    ],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const p = v.p / 100,
        prob =
          p === 0
            ? v.k === 0
              ? 1
              : 0
            : p === 1
              ? v.k === v.n
                ? 1
                : 0
              : Math.exp(
                  logGamma(v.n + 1) -
                    logGamma(v.k + 1) -
                    logGamma(v.n - v.k + 1) +
                    v.k * Math.log(p) +
                    (v.n - v.k) * Math.log1p(-p),
                );
      return [R('Exactly k successes|恰好成功 k 次', 100 * prob, '%')];
    },
    'P(X=k)=C(n,k)pᵏ(1−p)ⁿ⁻ᵏ',
    [11.71875],
  );
})();

;
(() => {
  'use strict';
  const {
    add,
    n,
    p,
    u,
    i,
    text,
    row: R,
    check,
    nums,
    sum,
    mean,
    variance,
    quantile,
    normal,
    invNormal,
    beta,
    gammaP,
    gammaQ,
    logGamma,
    choose,
    factorial,
  } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const confidence = n('c', 'Confidence level (%)|置信水平（%）', 95, 50, 99.999);
  const probability = (id = 'p', value = 50) =>
    n(id, 'Success probability (%)|成功概率（%）', value, 0, 100);
  const inverseBeta = (q, a, b) => {
    let lo = 0,
      hi = 1;
    for (let k = 0; k < 90; k++) {
      const x = (lo + hi) / 2;
      if (beta(x, a, b) < q) lo = x;
      else hi = x;
    }
    return (lo + hi) / 2;
  };
  D(
    'binomial-cumulative',
    'Binomial Cumulative Probability|二项分布累积概率',
    'Find the probability of at most k successes.|求最多成功 k 次的概率。',
    [
      i('n', 'Trials n|试验次数 n', 10, 0, 100000),
      i('k', 'Maximum successes k|最多成功次数 k', 3, 0, 100000),
      probability(),
    ],
    (v) => {
      check(v.k <= v.n, 'Require k ≤ n.|需满足 k ≤ n。');
      const p = v.p / 100,
        r = v.k === v.n || p === 0 ? 1 : p === 1 ? 0 : beta(1 - p, v.n - v.k, v.k + 1),
        upper = v.k === v.n || p === 0 ? 0 : p === 1 ? 1 : beta(p, v.k + 1, v.n - v.k);
      return [
        R('At most k successes|最多成功 k 次', 100 * r, '%'),
        R('More than k successes|成功超过 k 次', 100 * upper, '%'),
      ];
    },
    'P(X≤k)=I₍₁₋ₚ₎(n−k,k+1)',
    [17.1875, 82.8125],
  );
  D(
    'poisson-probability',
    'Poisson Point Probability|泊松分布点概率',
    'Estimate the chance of exactly k events at a constant average rate.|在平均发生率固定时，求恰好发生 k 次的概率。',
    [
      n('l', 'Expected events λ|预期次数 λ', 3, 0, 100000),
      i('k', 'Event count k|事件次数 k', 2, 0, 100000),
    ],
    (v) => [
      R(
        'Exactly k events|恰好发生 k 次',
        100 *
          (v.l === 0
            ? v.k === 0
              ? 1
              : 0
            : Math.exp(-v.l + v.k * Math.log(v.l) - logGamma(v.k + 1))),
        '%',
      ),
    ],
    'P(X=k)=e⁻λ λᵏ/k!',
    [22.4041807655388],
    'Assumes independent events and a constant rate over a fixed interval.|假设事件独立，且固定区间内平均发生率不变。',
  );
  D(
    'poisson-cumulative',
    'Poisson Cumulative Probability|泊松分布累积概率',
    'Find the probability of at most k Poisson events.|求泊松事件发生次数不超过 k 的概率。',
    [
      n('l', 'Expected events λ|预期次数 λ', 3, 0, 10000),
      i('k', 'Maximum count k|最大次数 k', 2, 0, 10000),
    ],
    (v) => {
      const q = gammaQ(v.k + 1, v.l);
      return [
        R('At most k events|最多发生 k 次', 100 * q, '%'),
        R('More than k events|发生超过 k 次', 100 * gammaP(v.k + 1, v.l), '%'),
      ];
    },
    'P(X≤k)=1−P(k+1,λ)',
    [42.3190081126844],
  );
  D(
    'normal-distribution',
    'Normal Cumulative Probability|正态分布累积概率',
    'Convert a normal-distribution threshold into a percentile.|将正态分布阈值转换为累积百分位。',
    [
      u('m', 'Mean μ|均值 μ', 100),
      p('s', 'Standard deviation σ|标准差 σ', 15),
      u('x', 'Threshold x|阈值 x', 115),
    ],
    (v) => {
      const z = (v.x - v.m) / v.s,
        q = normal(z);
      return [
        R('Probability below threshold|小于阈值的概率', 100 * q, '%'),
        R('Probability above threshold|大于阈值的概率', 100 * normal(-z), '%'),
        R('Standard score|标准分数', z),
      ];
    },
    'z=(x−μ)/σ; P(X≤x)=Φ(z)',
    [84.1344746068543, 15.8655253931457, 1],
  );
  D(
    'normal-quantile',
    'Normal Quantile|正态分布分位数',
    'Find a value from its normal-distribution percentile.|由正态分布累积百分位求对应数值。',
    [
      u('m', 'Mean μ|均值 μ', 0),
      p('s', 'Standard deviation σ|标准差 σ', 1),
      n('q', 'Cumulative percentile (%)|累积百分位（%）', 97.5, 0.000001, 99.999999),
    ],
    (v) => {
      const z = invNormal(v.q / 100);
      return [R('Quantile value|分位数值', v.m + v.s * z), R('Standard score|标准分数', z)];
    },
    'x=μ+σΦ⁻¹(p)',
    [1.95996398454005, 1.95996398454005],
  );
  D(
    'exponential-distribution',
    'Exponential Waiting Time|指数分布等待时间',
    'Estimate the probability an event arrives within a waiting interval.|估算事件在给定等待时间内发生的概率。',
    [p('m', 'Mean waiting time|平均等待时间', 10), n('t', 'Waiting threshold|等待阈值', 5)],
    (v) => [
      R('Arrival by threshold|阈值前发生', -100 * Math.expm1(-v.t / v.m), '%'),
      R('Still waiting at threshold|阈值时仍等待', 100 * Math.exp(-v.t / v.m), '%'),
    ],
    'P(T≤t)=1−e⁻ᵗᐟᵐ',
    [39.3469340287367, 60.6530659712633],
    'The exponential model assumes a constant hazard and memoryless waiting.|指数模型假设发生率固定，且等待时间无记忆性。',
  );
  D(
    'uniform-distribution',
    'Uniform Interval Probability|均匀分布区间概率',
    'Find the probability of a range within a continuous uniform distribution.|求连续均匀分布落入指定区间的概率。',
    [
      u('a', 'Distribution lower bound|分布下界', 2),
      u('b', 'Distribution upper bound|分布上界', 10),
      u('l', 'Query lower bound|查询下界', 4),
      u('h', 'Query upper bound|查询上界', 8),
    ],
    (v) => {
      check(
        v.b > v.a && v.h >= v.l,
        'Upper bounds must not be below lower bounds; the distribution needs positive width.|上界不得低于下界，且分布宽度应大于零。',
      );
      return [
        R(
          'Interval probability|区间概率',
          (100 * Math.max(0, Math.min(v.b, v.h) - Math.max(v.a, v.l))) / (v.b - v.a),
          '%',
        ),
        R('Mean|均值', (v.a + v.b) / 2),
        R('Variance|方差', (v.b - v.a) ** 2 / 12),
      ];
    },
    'Use P = max(0,min(b,h)−max(a,l))/(b−a). a and b are continuous uniform distribution bounds, and l and h are query bounds. The formula measures the overlap divided by the distribution width; the result is displayed as a percentage.|使用 P = max(0,min(b,h)−max(a,l))/(b−a)。a 与 b 为连续均匀分布下、上界，l 与 h 为查询下、上界；公式为重叠宽度除以分布宽度，结果以百分比显示。',
    [50, 6, 64 / 12],
  );
  D(
    'geometric-distribution',
    'Geometric First Success|几何分布首次成功',
    'Find the chance that the first success occurs on a chosen trial.|求首次成功恰好出现在某次试验的概率。',
    [
      n('p', 'Success probability (%)|成功概率（%）', 20, 0.000001, 100),
      i('k', 'First successful trial|首次成功的试验序号', 3, 1, 100000),
    ],
    (v) => {
      const p = v.p / 100;
      return [
        R('First success on trial k|第 k 次首次成功', 100 * p * (1 - p) ** (v.k - 1), '%'),
        R('Expected trials|预期试验次数', 1 / p),
      ];
    },
    'P(T=k)=(1−p)ᵏ⁻¹p; E[T]=1/p',
    [12.8, 5],
  );
  D(
    'negative-binomial',
    'Negative Binomial Trials|负二项分布试验次数',
    'Find the chance the rth success occurs on trial n.|求第 r 次成功恰好出现在第 n 次试验的概率。',
    [
      i('r', 'Required successes r|所需成功次数 r', 3, 1, 10000),
      i('n', 'Total trials n|试验总次数 n', 5, 1, 10000),
      n('p', 'Success probability (%)|成功概率（%）', 50, 0.000001, 100),
    ],
    (v) => {
      check(
        v.n >= v.r,
        'Trials must be at least required successes.|试验次数不得少于所需成功次数。',
      );
      const p = v.p / 100,
        q =
          p === 1
            ? v.n === v.r
              ? 1
              : 0
            : Math.exp(
                logGamma(v.n) -
                  logGamma(v.r) -
                  logGamma(v.n - v.r + 1) +
                  v.r * Math.log(p) +
                  (v.n - v.r) * Math.log1p(-p),
              );
      return [R('Probability|概率', 100 * q, '%'), R('Expected trials|预期试验次数', v.r / p)];
    },
    'P(T=n)=C(n−1,r−1)pʳ(1−p)ⁿ⁻ʳ',
    [18.75, 6],
  );
  D(
    'hypergeometric-distribution',
    'Hypergeometric Probability|超几何分布概率',
    'Calculate sampling success counts without replacement.|计算不放回抽样时恰好抽到指定成功个数的概率。',
    [
      i('n', 'Population size N|总体大小 N', 20, 1, 10000),
      i('k', 'Successes in population K|总体成功个数 K', 7, 0, 10000),
      i('d', 'Draws n|抽样个数 n', 5, 0, 10000),
      i('x', 'Drawn successes k|抽中成功个数 k', 2, 0, 10000),
    ],
    (v) => {
      check(
        v.k <= v.n && v.d <= v.n && v.x <= v.d,
        'Population and sample counts are inconsistent.|总体或样本个数不一致。',
      );
      const feasible = v.x <= v.k && v.d - v.x <= v.n - v.k;
      return [
        R(
          'Exactly k successes|恰好抽中 k 个',
          feasible
            ? 100 *
                Math.exp(
                  logGamma(v.k + 1) -
                    logGamma(v.x + 1) -
                    logGamma(v.k - v.x + 1) +
                    logGamma(v.n - v.k + 1) -
                    logGamma(v.d - v.x + 1) -
                    logGamma(v.n - v.k - v.d + v.x + 1) -
                    logGamma(v.n + 1) +
                    logGamma(v.d + 1) +
                    logGamma(v.n - v.d + 1),
                )
            : 0,
          '%',
        ),
        R('Expected successes|预期成功个数', (v.d * v.k) / v.n),
      ];
    },
    'P(X=k)=C(K,k)C(N−K,n−k)/C(N,n)',
    [(100 * 6006) / 15504, 1.75],
  );
  D(
    'birthday-probability',
    'Birthday Collision Probability|生日碰撞概率',
    'Find the chance that at least two people share a birthday.|求至少两人生日相同的概率。',
    [
      i('n', 'People|人数', 23, 0, 100000),
      i('d', 'Equally likely days|等概率日期数', 365, 1, 100000),
    ],
    (v) => {
      let log = 0;
      if (v.n > v.d) return [R('At least one shared birthday|至少一组生日相同', 100, '%')];
      for (let k = 0; k < v.n; k++) log += Math.log1p(-k / v.d);
      return [R('At least one shared birthday|至少一组生日相同', -100 * Math.expm1(log), '%')];
    },
    'Use P = 1−∏ᵢ₌₀ⁿ⁻¹(1−i/d). n is people and d is equally likely days; the product is the no-match probability. If people outnumber days, a match is certain. The result assumes independent birthdays.|使用 P = 1−∏ᵢ₌₀ⁿ⁻¹(1−i/d)。n 为人数，d 为等概率日期数，连乘积为无重复概率；人数多于日期数时必定有重复，结果假设生日独立。',
    [50.7297234323985],
    'Assumes independent and equally likely birthdays; actual birth dates are not uniform.|假设生日独立且等概率；实际出生日期并非均匀分布。',
  );
  D(
    'permutations',
    'Permutations|排列数',
    'Count ordered selections without repetition.|计算不重复、有顺序的选取方式数。',
    [
      i('n', 'Available items n|可选项目 n', 10, 0, 170),
      i('r', 'Selected items r|选取项目 r', 3, 0, 170),
    ],
    (v) => {
      check(v.r <= v.n, 'Require r ≤ n.|需满足 r ≤ n。');
      let q = 1;
      for (let k = 0; k < v.r; k++) q *= v.n - k;
      return [R('Ordered selections|有序选法', q)];
    },
    'P(n,r)=n!/(n−r)!',
    [720],
    'Very large counts are floating-point approximations.|极大计数使用浮点近似。',
  );
  D(
    'combinations',
    'Combinations|组合数',
    'Count unordered selections without repetition.|计算不重复、无顺序的选取方式数。',
    [
      i('n', 'Available items n|可选项目 n', 10, 0, 1000),
      i('r', 'Selected items r|选取项目 r', 3, 0, 1000),
    ],
    (v) => [R('Unordered selections|无序选法', choose(v.n, v.r))],
    'C(n,r)=n!/[r!(n−r)!]',
    [120],
    'Very large counts are floating-point approximations.|极大计数使用浮点近似。',
  );
  D(
    'factorial',
    'Factorial|阶乘',
    'Multiply all positive integers up to n, with 0! defined as 1.|计算从 1 到 n 的整数乘积，并规定 0! 为 1。',
    [i('n', 'Nonnegative integer n|非负整数 n', 10, 0, 170)],
    (v) => [R('Factorial|阶乘', factorial(v.n))],
    'n!=1×2×…×n; 0!=1',
    [3628800],
  );
  D(
    'expected-value',
    'Expected Value and Risk|期望值与波动',
    'Combine discrete outcomes with their probabilities.|按概率汇总离散结果的期望值和波动。',
    [
      text('x', 'Outcome values|各结果数值', '0,10,20'),
      text('p', 'Probabilities summing to 1|各概率（合计为 1）', '0.2,0.5,0.3'),
    ],
    (v) => {
      const x = nums(v.x),
        p = nums(v.p);
      check(
        x.length === p.length && p.every((t) => t >= 0 && t <= 1) && Math.abs(sum(p) - 1) < 1e-9,
        'Provide matching outcomes and nonnegative probabilities totaling 1.|结果与概率应等长，概率非负且合计为 1。',
      );
      const m = sum(x.map((t, k) => t * p[k])),
        s = sum(x.map((t, k) => (t - m) ** 2 * p[k]));
      return [
        R('Expected value|期望值', m),
        R('Variance|方差', s),
        R('Standard deviation|标准差', Math.sqrt(s)),
      ];
    },
    'Use μ = Σpᵢxᵢ and V = Σpᵢ(xᵢ−μ)². xᵢ are outcome values and pᵢ are matching probability fractions totaling unity. μ is expected value and V is variance; standard deviation is its square root.|使用 μ = Σpᵢxᵢ 及 V = Σpᵢ(xᵢ−μ)²。xᵢ 为各结果数值，pᵢ 为对应概率比例且合计为一；μ 为期望值，V 为方差，标准差为方差的平方根。',
    [11, 49, 7],
  );
  D(
    'weighted-variance',
    'Weighted Population Variance|加权总体方差',
    'Measure population spread with nonnegative observation weights.|用非负观测权重衡量总体离散程度。',
    [text('x', 'Values|数据', '1,2,3'), text('w', 'Nonnegative weights|非负权重', '1,2,1')],
    (v) => {
      const x = nums(v.x),
        w = nums(v.w);
      check(
        x.length === w.length && w.every((t) => t >= 0) && sum(w) > 0,
        'Use matching lists with nonnegative weights and a positive total.|两列应等长，权重非负且总权重大于零。',
      );
      const sw = sum(w),
        m = sum(x.map((t, k) => t * w[k])) / sw,
        s = sum(x.map((t, k) => (t - m) ** 2 * w[k])) / sw;
      return [
        R('Population variance|总体方差', s),
        R('Standard deviation|标准差', Math.sqrt(s)),
        R('Weighted mean|加权均值', m),
      ];
    },
    'μ=Σwx/Σw; σ²=Σw(x−μ)²/Σw',
    [0.5, Math.SQRT1_2, 2],
    'This is population variance; it does not apply a sample-weight bias correction.|这是总体方差，不应用样本权重偏差修正。',
  );
  D(
    'sample-skewness',
    'Adjusted Sample Skewness|校正样本偏度',
    'Measure sample asymmetry with the adjusted Fisher–Pearson coefficient.|使用校正 Fisher–Pearson 系数衡量样本偏斜。',
    [text('x', 'Observations|观测值', '1,2,3,4,5')],
    (v) => {
      const a = nums(v.x),
        n = a.length,
        m = mean(a),
        s = Math.sqrt(variance(a));
      check(
        n >= 3 && s > 0,
        'Need at least three observations with nonzero variance.|至少需要三个观测值，且方差不为零。',
      );
      return [
        R(
          'Adjusted skewness|校正偏度',
          (n / ((n - 1) * (n - 2))) * sum(a.map((x) => ((x - m) / s) ** 3)),
        ),
      ];
    },
    'G₁=nΣ[(x−x̄)/s]³/[(n−1)(n−2)]',
    [0],
  );
  D(
    'sample-kurtosis',
    'Unbiased Excess Kurtosis|无偏超额峰度',
    'Measure sample tail weight relative to a normal distribution.|衡量样本尾部相对正态分布的厚重程度。',
    [text('x', 'Observations|观测值', '1,2,3,4,5')],
    (v) => {
      const a = nums(v.x),
        n = a.length,
        m = mean(a),
        s = variance(a);
      check(
        n >= 4 && s > 0,
        'Need at least four observations with nonzero variance.|至少需要四个观测值，且方差不为零。',
      );
      return [
        R(
          'Excess kurtosis|超额峰度',
          (((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum(a.map((x) => (x - m) ** 4))) /
            (s * s) -
            (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)),
        ),
      ];
    },
    'G₂=n(n+1)Σ[(x−x̄)/s]⁴/[(n−1)(n−2)(n−3)]−3(n−1)²/[(n−2)(n−3)]',
    [-1.2],
  );
  D(
    'cohens-d',
    'Cohen’s d and Hedges’ g|Cohen d 与 Hedges g',
    'Compare two means on a pooled standard-deviation scale.|用合并标准差比较两组均值差异。',
    [
      u('a', 'Group A mean|A 组均值', 10),
      u('b', 'Group B mean|B 组均值', 8),
      p('s', 'Group A sample SD|A 组样本标准差', 2),
      p('t', 'Group B sample SD|B 组样本标准差', 2),
      i('n', 'Group A sample size|A 组样本量', 20, 2, 1000000),
      i('m', 'Group B sample size|B 组样本量', 20, 2, 1000000),
    ],
    (v) => {
      const df = v.n + v.m - 2,
        s = Math.sqrt(((v.n - 1) * v.s * v.s + (v.m - 1) * v.t * v.t) / df),
        d = (v.a - v.b) / s;
      return [
        R('Cohen’s d|Cohen’s d 效应量', d),
        R('Hedges’ g (approximate correction)|Hedges g（近似修正）', d * (1 - 3 / (4 * df - 1))),
        R('Pooled sample SD|合并样本标准差', s),
      ];
    },
    'd=(μA−μB)/sp; g≈d[1−3/(4df−1)]',
    [1, 1 - 3 / 151, 2],
  );
  D(
    'odds-ratio',
    'Odds Ratio|比值比',
    'Compare event odds across two independent groups.|比较两个独立群体的事件优势比。',
    [
      p('a', 'A events|A 组发生数', 20),
      p('b', 'A non-events|A 组未发生数', 80),
      p('c', 'B events|B 组发生数', 10),
      p('d', 'B non-events|B 组未发生数', 90),
    ],
    (v) => {
      const r = (v.a * v.d) / (v.b * v.c),
        s = Math.sqrt(1 / v.a + 1 / v.b + 1 / v.c + 1 / v.d),
        z = invNormal(0.975);
      return [
        R('Odds ratio|比值比', r),
        R('Approximate 95% lower bound|近似 95% 下界', Math.exp(Math.log(r) - z * s)),
        R('Approximate 95% upper bound|近似 95% 上界', Math.exp(Math.log(r) + z * s)),
      ];
    },
    'Use OR = ad/(bc) and bounds exp[ln(OR)±1.96√(1/a+1/b+1/c+1/d)]. a and b are group A event and non-event counts; c and d are group B counts. The logarithmic interval uses a normal approximation and requires positive counts.|使用 OR = ad/(bc)，区间界为 exp[ln(OR)±1.96√(1/a+1/b+1/c+1/d)]。a 与 b 为 A 组发生及未发生数，c 与 d 为 B 组相应计数；对数区间采用正态近似，要求计数均为正。',
    [2.25],
    'Use positive cell counts. The large-sample interval can be unreliable for small samples; no continuity correction is applied.|各格计数应为正。小样本时大样本区间可能不可靠；未使用连续性修正。',
  );
  D(
    'risk-ratio',
    'Risk Ratio and Difference|风险比与概率差',
    'Compare observed event proportions between groups.|比较两组观测事件比例。',
    [
      i('a', 'A events|A 组发生数', 20, 0, 100000000),
      i('n', 'A total|A 组总数', 100, 1, 100000000),
      i('b', 'B events|B 组发生数', 10, 1, 100000000),
      i('m', 'B total|B 组总数', 100, 1, 100000000),
    ],
    (v) => {
      check(
        v.a <= v.n && v.b <= v.m,
        'Events cannot exceed group totals.|发生数不能超过该组总数。',
      );
      return [
        R('Risk ratio|风险比', v.a / v.n / (v.b / v.m)),
        R('Absolute difference|绝对差', 100 * (v.a / v.n - v.b / v.m), 'percentage points'),
        R('A event proportion|A 组发生比例', (100 * v.a) / v.n, '%'),
        R('B event proportion|B 组发生比例', (100 * v.b) / v.m, '%'),
      ];
    },
    'Use RR = (a/n)/(b/m) and D = a/n−b/m. a and b are event counts for groups A and B; n and m are their totals. D is the probability difference, displayed in percentage points.|使用 RR = (a/n)/(b/m) 及 D = a/n−b/m。a 与 b 为 A、B 组发生数，n 与 m 为对应总数；D 为概率差，以百分点显示。',
    [2, 10, 20, 10],
    'Association does not establish causation. A zero reference proportion makes the ratio undefined.|关联不能证明因果。参照组比例为零时，比值无定义。',
  );
  D(
    'ab-proportion-test',
    'A/B Proportion Test|A/B 比例检验',
    'Compare two independent conversion rates using a two-sided pooled z test.|用双侧合并 z 检验比较两个独立转化率。',
    [
      i('a', 'A conversions|A 组转化数', 100, 0, 100000000),
      i('n', 'A visitors|A 组人数', 1000, 1, 100000000),
      i('b', 'B conversions|B 组转化数', 130, 0, 100000000),
      i('m', 'B visitors|B 组人数', 1000, 1, 100000000),
    ],
    (v) => {
      check(v.a <= v.n && v.b <= v.m, 'Conversions cannot exceed visitors.|转化数不能超过人数。');
      const a = v.a / v.n,
        b = v.b / v.m,
        q = (v.a + v.b) / (v.n + v.m),
        se = Math.sqrt(q * (1 - q) * (1 / v.n + 1 / v.m));
      check(
        se > 0,
        'Both groups together must contain events and non-events.|两组合计应同时有发生和未发生。',
      );
      const z = (b - a) / se;
      return [
        R('B minus A|B 减 A', 100 * (b - a), 'percentage points'),
        R('Two-sided p-value|双侧 p 值', 2 * normal(-Math.abs(z))),
        R('z statistic|z 统计量', z),
        R(
          'Relative lift|相对提升',
          a > 0 ? 100 * (b / a - 1) : 'Undefined at zero baseline|基线为零时无定义',
          '%',
        ),
      ];
    },
    'z=(pB−pA)/√[p̂(1−p̂)(1/nA+1/nB)]',
    [3],
    'Requires independent fixed-horizon samples and sufficiently large expected cell counts. Repeated peeking changes error rates.|要求样本独立、预先固定观察周期，且期望格数足够大；反复查看并择时停止会改变错误率。',
  );
  D(
    'exact-binomial-interval',
    'Exact Binomial Confidence Interval|二项分布精确置信区间',
    'Compute a conservative Clopper–Pearson interval for a success proportion.|计算成功比例的保守 Clopper–Pearson 区间。',
    [
      i('k', 'Successes|成功次数', 5, 0, 100000),
      i('n', 'Trials|试验次数', 10, 1, 100000),
      confidence,
    ],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const a = (1 - v.c / 100) / 2;
      return [
        R('Lower bound|下界', 100 * (v.k === 0 ? 0 : inverseBeta(a, v.k, v.n - v.k + 1)), '%'),
        R(
          'Upper bound|上界',
          100 * (v.k === v.n ? 1 : inverseBeta(1 - a, v.k + 1, v.n - v.k)),
          '%',
        ),
        R('Observed proportion|观测比例', (100 * v.k) / v.n, '%'),
      ];
    },
    'Use L = B⁻¹(α/2;k,n−k+1) and U = B⁻¹(1−α/2;k+1,n−k). k is successes and n is trials. For confidence-level fraction c, set α = 1−c; B⁻¹ is the beta quantile. Handle boundaries k = 0 → L = 0 and k = n → U = 1.|使用 L = B⁻¹(α/2;k,n−k+1) 及 U = B⁻¹(1−α/2;k+1,n−k)。k 为成功次数，n 为试验次数；置信水平的小数比例为 c，使用 α = 1−c，B⁻¹ 为贝塔分位函数；边界按 k = 0 → L = 0 及 k = n → U = 1 处理。',
    [18.7086028447208, 81.2913971552792, 50],
  );
  D(
    'correlation-confidence-interval',
    'Correlation Confidence Interval|相关系数置信区间',
    'Estimate a Pearson correlation interval with Fisher’s z transform.|用 Fisher z 变换估计 Pearson 相关系数区间。',
    [
      n('r', 'Sample correlation r|样本相关系数 r', 0, -0.999999999, 0.999999999),
      i('n', 'Paired observations|成对观测数', 30, 4, 10000000),
      confidence,
    ],
    (v) => {
      const z = Math.atanh(v.r),
        d = invNormal((1 + v.c / 100) / 2) / Math.sqrt(v.n - 3);
      return [
        R('Lower correlation bound|相关系数下界', Math.tanh(z - d)),
        R('Upper correlation bound|相关系数上界', Math.tanh(z + d)),
      ];
    },
    "Use tanh[atanh(r)±z/√(n−3)]. r is sample Pearson correlation, n is paired observation count, and z is the two-sided standard-normal critical value for the chosen confidence. The transforms convert between correlation and Fisher's scale.|使用 tanh[atanh(r)±z/√(n−3)]。r 为样本 Pearson 相关系数，n 为成对观测数，z 为自选置信水平的双侧标准正态临界值；变换在相关系数与 Fisher 尺度之间转换。",
    [-0.3602692225955644, 0.3602692225955644],
    'Approximation assumes independent paired observations and approximately bivariate-normal data.|近似方法假设成对观测相互独立，且数据近似二元正态分布。',
  );
  D(
    'shannon-entropy',
    'Shannon Entropy|香农信息熵',
    'Measure uncertainty in a discrete probability distribution.|衡量离散概率分布的不确定性。',
    [text('p', 'Probabilities summing to 1|概率（合计为 1）', '0.5,0.5')],
    (v) => {
      const a = nums(v.p);
      check(
        a.every((x) => x >= 0 && x <= 1) && Math.abs(sum(a) - 1) < 1e-9,
        'Probabilities must be nonnegative and total 1.|概率应非负且合计为 1。',
      );
      const h = -sum(a.filter((x) => x > 0).map((x) => x * Math.log2(x)));
      return [
        R('Entropy|信息熵', h, 'bits'),
        R('Effective equally likely outcomes|等概率有效结果数', 2 ** h),
      ];
    },
    'Use H = −Σpᵢlog₂(pᵢ). pᵢ are probability fractions totaling unity. Zero-probability terms contribute zero. The logarithm base makes entropy H measured in bits.|使用 H = −Σpᵢlog₂(pᵢ)。pᵢ 为合计等于一的概率比例，零概率项贡献零；对数底数使信息熵 H 的单位为比特。',
    [1, 2],
  );
  D(
    'shannon-diversity',
    'Shannon Diversity Index|香农多样性指数',
    'Compare abundance diversity and evenness from category counts.|根据类别计数比较多样性与均匀度。',
    [text('x', 'Positive category counts|各类别正计数', '10,10,10')],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x > 0),
        'Counts must be positive.|计数应大于零。',
      );
      const total = sum(a),
        h = -sum(a.map((x) => (x / total) * Math.log(x / total)));
      return [
        R('Shannon diversity H|香农多样性 H', h),
        R('Evenness|均匀度', a.length > 1 ? h / Math.log(a.length) : 1),
        R('Effective categories|有效类别数', Math.exp(h)),
      ];
    },
    'Use H = −Σpᵢln(pᵢ) and J = H/ln(S). pᵢ is each positive category count divided by total count, and S is category count. ln is natural logarithm. A single category uses the convention J = 1.|使用 H = −Σpᵢln(pᵢ) 及 J = H/ln(S)。pᵢ 为各正类别计数除以总计数，S 为类别数，ln 为自然对数；仅一类时按约定使用 J = 1。',
    [Math.log(3), 1, 3],
  );
  D(
    'simpson-diversity',
    'Simpson Diversity Index|辛普森多样性指数',
    'Find the chance that two different sampled items belong to different categories.|求不放回抽取两个项目属于不同类别的概率。',
    [text('x', 'Category integer counts|各类别整数计数', '10,10,10')],
    (v) => {
      const a = nums(v.x),
        total = sum(a);
      check(
        a.every((x) => Number.isInteger(x) && x >= 0) && total >= 2,
        'Use nonnegative integer counts totaling at least two.|使用非负整数计数，且总数至少为 2。',
      );
      return [
        R(
          'Gini–Simpson diversity|Gini–Simpson 多样性',
          1 - sum(a.map((x) => x * (x - 1))) / (total * (total - 1)),
        ),
      ];
    },
    'D=1−Σnᵢ(nᵢ−1)/[N(N−1)]',
    [20 / 29],
  );
  D(
    'mean-absolute-deviation',
    'Mean Absolute Deviation|平均绝对偏差',
    'Measure average absolute distance from the arithmetic mean.|计算各数值与算术均值的平均绝对距离。',
    [text('x', 'Observations|观测值', '2,4,6,8')],
    (v) => {
      const a = nums(v.x),
        m = mean(a);
      return [
        R('Mean absolute deviation|平均绝对偏差', mean(a.map((x) => Math.abs(x - m)))),
        R('Arithmetic mean|算术均值', m),
      ];
    },
    'Use D = Σabs(xᵢ−μ)/n. xᵢ are observations, μ is their arithmetic mean, n is count, and abs means absolute value. D measures mean absolute distance from the mean.|使用 D = Σabs(xᵢ−μ)/n。xᵢ 为观测值，μ 为算术均值，n 为数量，abs 表示绝对值；D 为相对均值的平均绝对距离。',
    [2, 5],
  );
  D(
    'median-absolute-deviation',
    'Median Absolute Deviation|中位数绝对偏差',
    'Estimate robust spread around the sample median.|估计围绕样本中位数的稳健离散程度。',
    [text('x', 'Observations|观测值', '1,1,2,2,4,6,9')],
    (v) => {
      const a = nums(v.x),
        m = quantile(a, 0.5),
        d = quantile(
          a.map((x) => Math.abs(x - m)),
          0.5,
        );
      return [
        R('Median absolute deviation|中位数绝对偏差', d),
        R('Normal-consistent scaled MAD|正态一致性缩放 MAD', d * 1.482602218505602),
        R('Median|中位数', m),
      ];
    },
    'Use D = median(abs(xᵢ−median(x))) and scaled value 1.482602218505602D. xᵢ are observations, median selects the middle of sorted values, and abs means absolute value. Scaling gives a normal-consistent spread estimate.|使用 D = median(abs(xᵢ−median(x))) 及缩放值 1.482602218505602D。xᵢ 为观测值，median 为排序后的中位数，abs 表示绝对值；缩放后得到正态一致性离散程度估计。',
    [1, 1.482602218505602, 2],
  );
  D(
    'chebyshev-bound',
    'Chebyshev Probability Bound|切比雪夫概率界',
    'Bound the share of a distribution within k standard deviations.|给出分布落在 k 个标准差内的比例下界。',
    [n('k', 'Standard deviations k|标准差倍数 k', 2, 1, 1000000)],
    (v) => [
      R(
        'At least within k standard deviations|至少落在 k 个标准差内',
        100 * (1 - 1 / v.k ** 2),
        '%',
      ),
      R('At most outside the interval|区间外比例至多', 100 / v.k ** 2, '%'),
    ],
    'P(|X−μ|<kσ)≥1−1/k²',
    [75, 25],
    'Requires a finite mean and variance. This is a universal bound, not the exact probability of a particular distribution.|要求均值与方差有限。这是通用界限，不是特定分布的精确概率。',
  );
})();

;
/* Exact rational arithmetic for the pocket calculator; no expression eval. */
var CMKeypad = (() => {
  'use strict';
  const gcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a || 1n;
  };
  class Decimal {
    constructor(n, d = 1n) {
      if (d === 0n) throw Error('division');
      if (d < 0n) {
        n = -n;
        d = -d;
      }
      const g = gcd(n, d);
      this.n = n / g;
      this.d = d / g;
    }
    static from(value) {
      const s = String(value);
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) throw Error('number');
      const [m, e = '0'] = s.toLowerCase().split('e'),
        places = (m.split('.')[1] || '').length - Number(e);
      if (Math.abs(places) > 310) throw Error('overflow');
      let n = BigInt(m.replace('.', '')),
        d = 1n;
      if (places > 0) d = 10n ** BigInt(places);
      else n *= 10n ** BigInt(-places);
      return new Decimal(n, d);
    }
    add(v) {
      return new Decimal(this.n * v.d + v.n * this.d, this.d * v.d);
    }
    sub(v) {
      return new Decimal(this.n * v.d - v.n * this.d, this.d * v.d);
    }
    mul(v) {
      return new Decimal(this.n * v.n, this.d * v.d);
    }
    div(v) {
      return new Decimal(this.n * v.d, this.d * v.n);
    }
    neg() {
      return new Decimal(-this.n, this.d);
    }
    value() {
      const x = Number(this.n) / Number(this.d);
      if (!Number.isFinite(x) || Math.abs(x) > 1e100) throw Error('overflow');
      return x;
    }
    display() {
      return Number(this.value().toPrecision(15)).toString();
    }
  }
  const apply = (a, op, b) =>
    op === '+' ? a.add(b) : op === '-' ? a.sub(b) : op === '*' ? a.mul(b) : a.div(b);
  class Pocket {
    constructor() {
      this.memory = Decimal.from('0');
      this.history = [];
      this.clear();
    }
    snapshot() {
      const decimal = (v) => (v ? { n: String(v.n), d: String(v.d) } : null);
      return {
        version: 1,
        entry: this.entry,
        acc: decimal(this.acc),
        op: this.op,
        lastOp: this.lastOp,
        lastOperand: decimal(this.lastOperand),
        memory: decimal(this.memory),
        replace: this.replace,
        expression: this.expression,
        error: this.error,
        history: this.history.map((x) => ({ ...x })),
      };
    }
    restore(state) {
      if (
        state?.version !== 1 ||
        typeof state.entry !== 'string' ||
        !Array.isArray(state.history) ||
        state.history.length > 20
      )
        throw Error('state');
      Decimal.from(state.entry);
      const decimal = (value) =>
          value === null ? null : new Decimal(BigInt(value.n), BigInt(value.d)),
        acc = decimal(state.acc),
        lastOperand = decimal(state.lastOperand),
        memory = decimal(state.memory);
      if (
        !memory ||
        ![null, '+', '-', '*', '/'].includes(state.op) ||
        ![null, '+', '-', '*', '/'].includes(state.lastOp)
      )
        throw Error('state');
      this.entry = state.entry;
      this.acc = acc;
      this.lastOperand = lastOperand;
      this.memory = memory;
      this.op = state.op;
      this.lastOp = state.lastOp;
      this.replace = Boolean(state.replace);
      this.expression = String(state.expression);
      this.error = state.error;
      this.history = state.history.map((x) => ({ ...x }));
    }
    clear() {
      this.entry = '0';
      this.acc = null;
      this.op = null;
      this.lastOp = null;
      this.lastOperand = null;
      this.replace = true;
      this.expression = '';
      this.error = null;
    }
    input(key) {
      try {
        if (key === 'AC') {
          this.clear();
          return;
        }
        if (this.error) {
          this.clear();
          if (!/^[0-9.]$/.test(key)) return;
        }
        if (/^[0-9.]$/.test(key)) {
          if (this.replace) {
            if (!this.op) this.expression = '';
            this.entry = key === '.' ? '0.' : key;
            this.replace = false;
          } else if (key === '.' && !this.entry.includes('.')) this.entry += '.';
          else if (key !== '.' && this.entry.replace(/[-.]/g, '').length < 15)
            this.entry =
              this.entry === '0' ? key : this.entry === '-0' ? '-' + key : this.entry + key;
          return;
        }
        if (key === 'CE') {
          this.entry = '0';
          this.replace = false;
          return;
        }
        if (key === 'back') {
          if (!this.replace) this.entry = this.entry.slice(0, -1);
          if (!this.entry || this.entry === '-') this.entry = '0';
          return;
        }
        if (key === 'sign') {
          this.entry = this.entry.startsWith('-') ? this.entry.slice(1) : '-' + this.entry;
          this.replace = false;
          return;
        }
        if (key === 'MC') {
          this.memory = Decimal.from('0');
          return;
        }
        if (key === 'MR') {
          this.entry = this.memory.display();
          this.replace = true;
          return;
        }
        let value = Decimal.from(this.entry);
        if (key === 'M+' || key === 'M-') {
          this.memory = key === 'M+' ? this.memory.add(value) : this.memory.sub(value);
          return;
        }
        if (key === '%') {
          value =
            this.acc && ['+', '-'].includes(this.op)
              ? this.acc.mul(value).div(Decimal.from(100))
              : value.div(Decimal.from(100));
          this.entry = value.display();
          return;
        }
        if (key === 'sqrt') {
          if (value.n < 0n) throw Error('domain');
          this.entry = Decimal.from(Math.sqrt(value.value())).display();
          this.replace = true;
          return;
        }
        if (key === 'reciprocal') {
          this.entry = Decimal.from(1).div(value).display();
          this.replace = true;
          return;
        }
        if (['+', '-', '*', '/'].includes(key)) {
          if (this.op && !this.replace) {
            this.acc = apply(this.acc, this.op, value);
            this.entry = this.acc.display();
          } else if (!this.op) this.acc = value;
          this.op = key;
          this.expression = this.acc.display() + ' ' + key;
          this.replace = true;
          this.lastOp = null;
          return;
        }
        if (key === '=') {
          const operation = this.op || this.lastOp;
          if (!operation) return;
          const right = this.op ? value : this.lastOperand,
            left = this.op ? this.acc : value;
          const result = apply(left, operation, right);
          this.expression = left.display() + ' ' + operation + ' ' + right.display() + ' =';
          this.entry = result.display();
          this.history.unshift({ expression: this.expression, result: this.entry });
          this.history = this.history.slice(0, 20);
          this.lastOp = operation;
          this.lastOperand = right;
          this.acc = null;
          this.op = null;
          this.replace = true;
        }
      } catch (e) {
        this.error = e.message;
        this.entry = '0';
        this.replace = true;
      }
    }
  }
  function scientific(source, degrees = true, ans = 0) {
    const input = String(source)
      .replace(/[×]/g, '*')
      .replace(/[÷]/g, '/')
      .replace(/[−]/g, '-')
      .replace(/π/g, 'pi');
    if (input.length > 500) throw Error('length');
    const tokens =
      input.match(/(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[+\-*/^()%!,]/g) || [];
    if (tokens.join('') !== input.replace(/\s/g, '')) throw Error('syntax');
    let pos = 0,
      depth = 0;
    const finite = (x) => {
      if (!Number.isFinite(x) || Math.abs(x) > 1e100) throw Error('domain');
      return x;
    };
    const factorial = (x) => {
      if (!Number.isInteger(x) || x < 0 || x > 69) throw Error('domain');
      let r = 1;
      for (let k = 2; k <= x; k++) r *= k;
      return r;
    };
    const trig = (x) => (degrees ? (x * Math.PI) / 180 : x),
      inv = (x) => (degrees ? (x * 180) / Math.PI : x);
    const quarter = (x) => (degrees ? x / 90 : x / (Math.PI / 2)),
      qindex = (q) => ((q % 4) + 4) % 4;
    const funcs = {
      sin: (x) =>
        Number.isInteger(quarter(x)) ? [0, 1, 0, -1][qindex(quarter(x))] : Math.sin(trig(x)),
      cos: (x) =>
        Number.isInteger(quarter(x)) ? [1, 0, -1, 0][qindex(quarter(x))] : Math.cos(trig(x)),
      tan: (x) => {
        const q = quarter(x);
        if (Number.isInteger(q) && Math.abs(q % 2) === 1) throw Error('domain');
        return Number.isInteger(q) ? 0 : Math.tan(trig(x));
      },
      asin: (x) => inv(Math.asin(x)),
      acos: (x) => inv(Math.acos(x)),
      atan: (x) => inv(Math.atan(x)),
      sqrt: Math.sqrt,
      cbrt: Math.cbrt,
      ln: Math.log,
      log: Math.log10,
      exp: Math.exp,
      abs: Math.abs,
    };
    function atom() {
      if (++depth > 60) throw Error('length');
      let t = tokens[pos++],
        v;
      if (t === '(') {
        v = expression();
        if (tokens[pos++] !== ')') throw Error('syntax');
      } else if (t === 'pi') v = Math.PI;
      else if (t === 'e') v = Math.E;
      else if (t === 'Ans' || t === 'ans') v = ans;
      else if (Object.hasOwn(funcs, t)) {
        if (tokens[pos++] !== '(') throw Error('syntax');
        const a = expression();
        if (tokens[pos++] !== ')') throw Error('syntax');
        v = funcs[t](a);
      } else if (t && /^(?:\d|\.)/.test(t)) v = Number(t);
      else throw Error('syntax');
      while (tokens[pos] === '!' || tokens[pos] === '%') {
        v = tokens[pos++] === '!' ? factorial(v) : v / 100;
      }
      depth--;
      return finite(v);
    }
    function power() {
      let a = atom();
      if (tokens[pos] === '^') {
        pos++;
        const exponent = unary();
        if (a === 0 && exponent <= 0) throw Error('domain');
        a = finite(a ** exponent);
      }
      return a;
    }
    function unary() {
      if (tokens[pos] === '+') {
        pos++;
        return unary();
      }
      if (tokens[pos] === '-') {
        pos++;
        return -unary();
      }
      return power();
    }
    function product() {
      let a = unary();
      while (true) {
        const t = tokens[pos],
          implicit =
            t === '(' ||
            t === 'pi' ||
            t === 'e' ||
            t === 'Ans' ||
            t === 'ans' ||
            Object.hasOwn(funcs, t || '');
        if (t === '*' || t === '/') {
          pos++;
          const b = unary();
          if (t === '/' && b === 0) throw Error('division');
          a = finite(t === '*' ? a * b : a / b);
        } else if (implicit) a = finite(a * unary());
        else break;
      }
      return a;
    }
    function expression() {
      let a = product();
      while (tokens[pos] === '+' || tokens[pos] === '-') {
        const t = tokens[pos++],
          b = product();
        a = finite(t === '+' ? a + b : a - b);
      }
      return a;
    }
    if (!tokens.length) return 0;
    const result = expression();
    if (pos !== tokens.length) throw Error('syntax');
    return finite(result);
  }
  return { Decimal, Pocket, scientific };
})();

;
/* Shared numerical contracts for the core decision tools. No DOM, network or price feed. */
var CMCoreFinance = (() => {
  'use strict';
  const check = (ok, message) => {
      if (!ok) throw Error(message);
    },
    R = (label, value, unit = '') => ({ label, value, unit }),
    sum = (a) => a.reduce((s, x) => s + x, 0);
  const numeric = (v, ids) =>
    check(
      ids.every((id) => Number.isFinite(v[id])),
      'Fill every numeric input with a finite number.|请为每个数值输入填写有限数字。',
    );
  const payment = (principal, r, months) =>
    principal / (r === 0 ? months : -Math.expm1(-months * Math.log1p(r)) / r);
  function schedule(principal, annualRate, pay, maxMonths = 1200) {
    const r = annualRate / 1200;
    if (principal === 0)
      return { months: 0, interest: 0, total: 0, finalPayment: 0, paidOff: true };
    if (pay <= principal * r)
      return {
        months: Infinity,
        interest: Infinity,
        total: Infinity,
        paidOff: false,
        reason: 'interest',
      };
    const exact = r === 0 ? principal / pay : -Math.log1p((-principal * r) / pay) / Math.log1p(r);
    if (!Number.isFinite(exact) || exact > maxMonths + 1e-7)
      return { months: Math.ceil(exact), paidOff: false, reason: 'horizon' };
    const months = Math.max(1, Math.ceil(exact - 1e-8));
    let balance = principal,
      interest = 0,
      total = 0,
      finalPayment = 0;
    for (let k = 1; k <= months; k++) {
      const cost = balance * r;
      interest += cost;
      const paid = k === months ? balance + cost : Math.min(pay, balance + cost);
      balance = Math.max(0, balance + cost - paid);
      total += paid;
      finalPayment = paid;
    }
    return { months, interest, total, finalPayment, paidOff: true };
  }
  function mortgage(v) {
    numeric(v, ['price', 'down', 'rate', 'term', 'tax', 'ins', 'pmirate', 'hoa', 'extra']);
    check(
      v.price > 0 &&
        v.down >= 0 &&
        v.down < v.price &&
        v.rate >= 0 &&
        v.rate <= 1000 &&
        v.term >= 1 / 12 &&
        v.term <= 100 &&
        [v.tax, v.ins, v.pmirate, v.hoa, v.extra].every((x) => x >= 0),
      'Use a positive home price, a smaller down payment, a term of 1–1,200 months, and nonnegative costs.|房价须为正，首付低于房价，期限为 1–1,200 个月，费用非负。',
    );
    const loan = v.price - v.down,
      ltv = loan / v.price,
      months = Math.round(v.term * 12),
      pi = payment(loan, v.rate / 1200, months),
      tax = v.tax / 12,
      insurance = v.ins / 12,
      pmi = ltv > 0.8 ? (loan * v.pmirate) / 1200 : 0,
      total = pi + tax + insurance + pmi + v.hoa;
    return {
      loan,
      ltv,
      months,
      pi,
      tax,
      insurance,
      pmi,
      total,
      rows: [
        R('Monthly housing payment|月住房支出', total, 'USD/month'),
        R('Principal and interest|本金与利息月供', pi, 'USD/month'),
        R('Loan principal|贷款本金', loan, 'USD'),
        R('Loan to value|贷款价值比', 100 * ltv, '%'),
      ],
    };
  }
  function loan(v) {
    numeric(v, ['prin', 'rate', 'term', 'extra']);
    check(
      v.prin > 0 &&
        v.rate >= 0 &&
        v.rate <= 1000 &&
        v.term >= 1 / 12 &&
        v.term <= 100 &&
        v.extra >= 0,
      'Use positive principal, a term of 1–1,200 months, and nonnegative rate and extra payment.|本金为正，期限为 1–1,200 个月，利率与额外还款非负。',
    );
    const months = Math.round(v.term * 12),
      pay = payment(v.prin, v.rate / 1200, months),
      base = schedule(v.prin, v.rate, pay),
      extra = schedule(v.prin, v.rate, pay + v.extra);
    return {
      months,
      pay,
      base,
      extra,
      interest: pay * months - v.prin,
      total: pay * months,
      rows: [
        R('Scheduled monthly payment|计划月供', pay, 'USD/month'),
        R('Scheduled total interest|计划总利息', pay * months - v.prin, 'USD'),
        R('Payoff with extra|额外还款后还清月数', extra.months, 'months'),
        R('Interest saving|节省利息', base.interest - extra.interest, 'USD'),
      ],
    };
  }
  function early(v) {
    numeric(v, ['bal', 'rate', 'pay', 'extra']);
    check(
      v.bal > 0 && v.rate >= 0 && v.rate <= 1000 && v.pay > 0 && v.extra >= 0,
      'Use positive balance and payment, with nonnegative rate and extra payment.|余额及月供为正，利率与额外还款非负。',
    );
    const base = schedule(v.bal, v.rate, v.pay),
      extra = schedule(v.bal, v.rate, v.pay + v.extra);
    check(
      base.paidOff,
      base.reason === 'interest'
        ? 'Payment must exceed first-month interest.|月供必须高于首月利息。'
        : 'Payment covers interest but does not clear the debt within 1,200 months. Increase the payment.|月供覆盖利息，但无法在 1,200 个月内还清，请提高月供。',
    );
    return {
      base,
      extra,
      saved: base.interest - extra.interest,
      monthsSaved: base.months - extra.months,
      rows: [
        R('Months saved|提前月数', base.months - extra.months, 'months'),
        R('Interest saved|节省利息', base.interest - extra.interest, 'USD'),
        R('Baseline payoff|原还清月数', base.months, 'months'),
        R('Payoff with extra|额外还款后月数', extra.months, 'months'),
      ],
    };
  }
  function freelance(v) {
    const weeks = v.weeks ?? 48,
      taxbase = v.taxbase ?? 'gross';
    numeric(v, ['income', 'tax', 'exp', 'hours', 'bill']);
    check(
      v.income >= 0 &&
        v.exp >= 0 &&
        v.tax >= 0 &&
        v.tax < 100 &&
        v.hours > 0 &&
        v.hours <= 168 &&
        v.bill > 0 &&
        v.bill <= 100 &&
        weeks > 0 &&
        weeks <= 53 &&
        ['gross', 'profit'].includes(taxbase),
      'Use positive working time and billable share, a tax rate below 100%, and nonnegative income and expenses.|工作时间与可计费比例为正，税率低于 100%，收入与费用非负。',
    );
    const ret = 1 - v.tax / 100,
      billHrs = (v.hours * weeks * v.bill) / 100,
      rev = taxbase === 'gross' ? (v.income + v.exp) / ret : v.income / ret + v.exp,
      rate = rev / billHrs;
    return {
      ret,
      billHrs,
      rev,
      rate,
      weeks,
      taxbase,
      num: taxbase === 'gross' ? v.income + v.exp : v.income,
      rows: [
        R('Required billable hourly rate|所需可计费时薪', rate, 'USD/hour'),
        R('Annual required revenue|所需年收入流水', rev, 'USD/year'),
        R('Annual billable time|每年可计费时间', billHrs, 'hours'),
      ],
    };
  }
  function ai(v) {
    numeric(v, ['itok', 'otok', 'calls2', 'iprice', 'oprice']);
    check(
      [v.itok, v.otok, v.calls2, v.iprice, v.oprice].every((x) => x >= 0) &&
        [v.itok, v.otok, v.calls2].every(Number.isInteger),
      'Token and call counts must be nonnegative whole numbers; prices must be nonnegative.|Token 与调用次数须为非负整数，价格非负。',
    );
    const perCall = (v.itok * v.iprice + v.otok * v.oprice) / 1e6,
      ic = (v.calls2 * v.itok * v.iprice) / 1e6,
      oc = (v.calls2 * v.otok * v.oprice) / 1e6,
      total = ic + oc;
    return {
      ic,
      oc,
      total,
      perCall,
      per1000: 1000 * perCall,
      rows: [
        R('Monthly inference cost|每月推理成本', total, 'USD/month'),
        R('Input token cost|输入 Token 成本', ic, 'USD/month'),
        R('Output token cost|输出 Token 成本', oc, 'USD/month'),
        R('Cost per call|每次调用成本', perCall, 'USD/call'),
      ],
    };
  }
  function rent(v) {
    const q = { loanYears: 30, buyfee: 0, sellfee: 0, ownrate: 0, rentgrowth: 0, invest: 0, ...v };
    numeric(q, [
      'price',
      'downp',
      'mrate',
      'rent',
      'years',
      'appr',
      'loanYears',
      'buyfee',
      'sellfee',
      'ownrate',
      'rentgrowth',
      'invest',
    ]);
    check(
      q.price > 0 &&
        q.rent >= 0 &&
        q.years >= 1 / 12 &&
        q.years <= 100 &&
        q.downp >= 0 &&
        q.downp <= 100 &&
        q.mrate >= 0 &&
        q.mrate <= 1000 &&
        q.loanYears >= 1 / 12 &&
        q.loanYears <= 100 &&
        [q.appr, q.rentgrowth, q.invest].every((x) => x > -100 && x <= 1000) &&
        [q.buyfee, q.sellfee, q.ownrate].every((x) => x >= 0 && x <= 100),
      'Check prices, percentages and terms. Growth rates must exceed −100%; holding and loan terms are 1–1,200 months.|请核对价格、比例与期限；增长率须高于 −100%，持有与贷款期限为 1–1,200 个月。',
    );
    const months = Math.round(q.years * 12),
      loanMonths = Math.round(q.loanYears * 12),
      down = (q.price * q.downp) / 100,
      loan = q.price - down,
      buyFee = (q.price * q.buyfee) / 100,
      pay = loan === 0 ? 0 : payment(loan, q.mrate / 1200, loanMonths),
      houseGrowth = Math.exp(Math.log1p(q.appr / 100) / 12),
      rentGrowth = Math.exp(Math.log1p(q.rentgrowth / 100) / 12),
      investmentGrowth = Math.exp(Math.log1p(q.invest / 100) / 12);
    let balance = loan,
      home = q.price,
      rentAmount = q.rent,
      renterPortfolio = down + buyFee,
      ownerPortfolio = 0,
      totalRent = 0,
      totalMortgage = 0,
      totalOwn = 0;
    const path = [];
    for (let month = 1; month <= months; month++) {
      renterPortfolio *= investmentGrowth;
      ownerPortfolio *= investmentGrowth;
      const ownership = (home * q.ownrate) / 1200,
        interest = (balance * q.mrate) / 1200,
        mortgage =
          month <= loanMonths
            ? month === loanMonths
              ? balance + interest
              : Math.min(pay, balance + interest)
            : 0;
      balance = Math.max(0, balance + interest - mortgage);
      const difference = mortgage + ownership - rentAmount;
      if (difference >= 0) renterPortfolio += difference;
      else ownerPortfolio -= difference;
      totalRent += rentAmount;
      totalMortgage += mortgage;
      totalOwn += ownership;
      home *= houseGrowth;
      rentAmount *= rentGrowth;
      if (month % 12 === 0 || month === months) {
        const equity = home * (1 - q.sellfee / 100) - balance;
        path.push({
          month,
          balance,
          home,
          equity,
          renterWealth: renterPortfolio,
          ownerWealth: equity + ownerPortfolio,
          advantage: equity + ownerPortfolio - renterPortfolio,
        });
      }
    }
    const ending = path.at(-1),
      ownerCash = down + buyFee + totalMortgage + totalOwn,
      netBuy = ownerCash - ending.equity;
    return {
      months,
      loanMonths,
      down,
      loan,
      buyFee,
      pay,
      balance,
      home,
      totalRent,
      totalMortgage,
      totalOwn,
      ownerCash,
      netBuy,
      renterPortfolio,
      ownerPortfolio,
      ending,
      path,
      rows: [
        R('Buying minus renting ending wealth|买房减租房期末净值', ending.advantage, 'USD'),
        R('Owner ending wealth|买房期末净值', ending.ownerWealth, 'USD'),
        R('Renter ending wealth|租房期末净值', ending.renterWealth, 'USD'),
        R('Monthly mortgage payment|房贷月供', pay, 'USD/month'),
        R('Remaining mortgage balance|剩余房贷本金', balance, 'USD'),
      ],
    };
  }
  const functions = {
    'mortgage-calculator': mortgage,
    'loan-calculator': loan,
    'early-loan-payoff-calculator': early,
    'rent-vs-buy-calculator': rent,
    'freelance-real-rate': freelance,
    'ai-inference-cost': ai,
  };
  function evaluate(slug, v) {
    check(functions[slug], 'Unknown finance model.|未知金融模型。');
    const result = functions[slug](v);
    check(
      result.rows.every((row) => Number.isFinite(row.value)),
      'Result is outside the finite numeric range.|结果超出有限数值范围。',
    );
    return result;
  }
  function solve(fn, target, lo, hi) {
    let a = fn(lo) - target,
      b = fn(hi) - target;
    if (!Number.isFinite(a) || !Number.isFinite(b) || a * b > 0) return null;
    for (let k = 0; k < 90; k++) {
      const mid = (lo + hi) / 2,
        value = fn(mid) - target;
      if (Math.abs(value) < 1e-8) return mid;
      if (a * value <= 0) hi = mid;
      else {
        lo = mid;
        a = value;
      }
    }
    return (lo + hi) / 2;
  }
  function goalValue(slug, v, budget) {
    const r = evaluate(slug, v);
    check(
      Number.isFinite(budget) && budget >= 0,
      'Goal must be nonnegative and finite.|目标必须为有限非负数。',
    );
    if (slug === 'mortgage-calculator') {
      const fixed = v.tax / 12 + v.ins / 12 + v.hoa;
      if (budget <= fixed) return null;
      let lo = v.down,
        hi = v.down + budget * r.months + 1;
      for (let k = 0; k < 90; k++) {
        const price = (lo + hi) / 2,
          total = price <= v.down ? fixed : mortgage({ ...v, price }).total;
        if (total <= budget) lo = price;
        else hi = price;
      }
      return lo;
    }
    if (slug === 'loan-calculator') return budget / payment(1, v.rate / 1200, r.months);
    if (slug === 'early-loan-payoff-calculator') {
      check(
        Number.isInteger(budget) && budget >= 1 && budget <= 1200,
        'Target months must be a whole number from 1 to 1,200.|目标月数须为 1 至 1,200 的整数。',
      );
      return Math.max(0, payment(v.bal, v.rate / 1200, budget) - v.pay);
    }
    if (slug === 'freelance-real-rate')
      return budget > 0 ? (100 * r.rev) / (v.hours * r.weeks * budget) : null;
    if (slug === 'ai-inference-cost') {
      const n = r.perCall > 0 ? Math.floor(budget / r.perCall) : null;
      return Number.isSafeInteger(n) ? n : null;
    }
    if (slug === 'rent-vs-buy-calculator') {
      const zero = rent({ ...v, rent: 0 }),
        lr = Math.log1p(v.rentgrowth / 100) / 12,
        li = Math.log1p(v.invest / 100) / 12;
      let coefficient = 0;
      for (let k = 1; k <= r.months; k++)
        coefficient += Math.exp((k - 1) * lr + (r.months - k) * li);
      const root = coefficient > 0 ? -zero.ending.advantage / coefficient : null;
      return root !== null && root >= 0 && Number.isFinite(root) ? root : null;
    }
    return null;
  }
  return {
    payment,
    schedule,
    mortgage,
    loan,
    early,
    freelance,
    ai,
    rent,
    evaluate,
    solve,
    sum,
    goalValue,
  };
})();

export const models=CMModels.models; export const Decimal=CMKeypad.Decimal; export const scientific=CMKeypad.scientific; export const finance=CMCoreFinance; export const data=CMData;
