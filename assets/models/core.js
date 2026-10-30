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
  const row = (label, value, unit = '') => ({ label, value, unit });
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
