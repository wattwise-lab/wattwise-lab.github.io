/* CalcMintly Merchant Profit Lab — model v1.1.0.
   A planning estimate per originally placed/paid order, not accounting profit.
   No rates, tax rules, exchange rates, demand response, or merchant data fetched. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CMMerchant = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MODEL_VERSION = '1.1.0';
  const COMPATIBLE_VERSIONS = Object.freeze(['1.0.0', '1.1.0']);
  const FIELDS = Object.freeze({
    price: [0, 1e9],
    discount: [0, 100],
    goods: [0, 1e9],
    packaging: [0, 1e9],
    shippingCost: [0, 1e9],
    shippingCharged: [0, 1e9],
    feeRate: [0, 100],
    feeFixed: [0, 1e9],
    refundRate: [0, 100],
    refundProduct: [0, 100],
    refundShipping: [0, 100],
    recovery: [0, 100],
    returnCost: [0, 1e9],
    feeRecovery: [0, 100],
    otherCost: [0, 1e9],
    taxCollected: [0, 1e9],
    adCost: [0, 1e9],
    unitGoal: [0, 1e9],
    monthlyOrders: [0, 1e7],
    fixedCost: [0, 1e9],
    monthlyGoal: [0, 1e9],
  });
  const DEFAULTS = Object.freeze({
    price: 100,
    discount: 0,
    goods: 35,
    packaging: 2,
    shippingCost: 8,
    shippingCharged: 5,
    feeRate: 3,
    feeFixed: 0.3,
    refundRate: 5,
    refundProduct: 100,
    refundShipping: 100,
    recovery: 80,
    returnCost: 4,
    feeRecovery: 0,
    otherCost: 1,
    taxCollected: 0,
    adCost: 18,
    unitGoal: 15,
    monthlyOrders: 100,
    fixedCost: 300,
    monthlyGoal: 2000,
  });
  const CURRENCIES = Object.freeze(['USD', 'JPY', 'TWD', 'EUR']);
  function validate(x) {
    if (!x || typeof x !== 'object' || Array.isArray(x))
      return [{ field: 'scenario', code: 'invalid' }];
    return Object.entries(FIELDS).flatMap(([k, [lo, hi]]) => {
      const v = x[k];
      if (typeof v !== 'number' || !Number.isFinite(v)) return [{ field: k, code: 'number' }];
      if (v < lo || v > hi) return [{ field: k, code: 'range', lo, hi }];
      if (k === 'monthlyOrders' && !Number.isInteger(v)) return [{ field: k, code: 'integer' }];
      return [];
    });
  }
  function raw(x) {
    const productRevenue = x.price * (1 - x.discount / 100);
    const grossRevenue = productRevenue + x.shippingCharged;
    const processing = ((grossRevenue + x.taxCollected) * x.feeRate) / 100 + x.feeFixed;
    const r = x.refundRate / 100;
    const refundRevenue =
      r * ((productRevenue * x.refundProduct) / 100 + (x.shippingCharged * x.refundShipping) / 100);
    const recoveredGoods = (r * x.goods * x.recovery) / 100;
    const returnedFees = (r * processing * x.feeRecovery) / 100;
    const returnHandling = r * x.returnCost;
    const beforeAd =
      grossRevenue -
      refundRevenue -
      x.goods +
      recoveredGoods -
      x.packaging -
      x.shippingCost -
      x.otherCost -
      processing +
      returnedFees -
      returnHandling;
    return {
      productRevenue,
      grossRevenue,
      processing,
      refundRevenue,
      recoveredGoods,
      returnedFees,
      returnHandling,
      netRevenue: grossRevenue - refundRevenue,
      beforeAd,
      afterAd: beforeAd - x.adCost,
    };
  }
  function ordersForTarget(contribution, fixed, target) {
    const need = fixed + target;
    if (need === 0) return 0;
    if (!(contribution > 0)) return null;
    let orders = Math.ceil(need / contribution);
    // Never report an order count whose full-precision result misses the target.
    if (orders * contribution < need) orders++;
    if (!Number.isSafeInteger(orders)) return null;
    return orders;
  }
  function calculate(x) {
    const errors = validate(x);
    if (errors.length) return { ok: false, errors };
    const v = raw(x),
      allocated = x.monthlyOrders > 0 ? x.fixedCost / x.monthlyOrders : null;
    const breakEvenAd = allocated === null ? null : v.beforeAd - allocated;
    const targetAd = breakEvenAd === null ? null : breakEvenAd - x.unitGoal;
    const atZero = raw({ ...x, price: 0 }).beforeAd;
    // Analytic slope avoids subtracting two large and nearly equal contributions.
    const slope =
      (1 - x.discount / 100) *
      (1 -
        (x.refundRate * x.refundProduct) / 10000 -
        (x.feeRate / 100) * (1 - (x.refundRate * x.feeRecovery) / 10000));
    let requiredPrice = null,
      priceReason = null;
    if (allocated === null) priceReason = 'orders';
    else {
      const need = x.adCost + allocated + x.unitGoal;
      if (atZero >= need) requiredPrice = 0;
      else if (slope > 0) requiredPrice = (need - atZero) / slope;
      else priceReason = 'slope';
      if (
        requiredPrice !== null &&
        (!Number.isFinite(requiredPrice) || requiredPrice > FIELDS.price[1])
      ) {
        requiredPrice = null;
        priceReason = 'range';
      }
    }
    return {
      ok: true,
      ...v,
      allocated,
      perOrderAfterFixed: allocated === null ? null : v.afterAd - allocated,
      monthlyProfit: v.afterAd * x.monthlyOrders - x.fixedCost,
      monthlyTargetAd:
        allocated === null ? null : v.beforeAd - (x.fixedCost + x.monthlyGoal) / x.monthlyOrders,
      breakEvenAd,
      targetAd,
      adHeadroom: targetAd === null ? null : targetAd - x.adCost,
      targetOrders: ordersForTarget(v.afterAd, x.fixedCost, x.monthlyGoal),
      breakEvenOrders: ordersForTarget(v.afterAd, x.fixedCost, 0),
      requiredPrice,
      priceReason,
      slope,
      margin: v.netRevenue > 0 ? (v.afterAd / v.netRevenue) * 100 : null,
    };
  }
  function minorDigits(currency) {
    return currency === 'JPY' ? 0 : 2;
  }
  function floorMoney(value, currency) {
    if (value === null || !Number.isFinite(value)) return null;
    const factor = 10 ** minorDigits(currency);
    const scaled = value * factor;
    return Math.floor(scaled + Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4) / factor;
  }
  function actionablePrice(x, currency) {
    const r = calculate(x);
    if (!r.ok || r.requiredPrice === null) return null;
    const factor = 10 ** minorDigits(currency);
    let p = Math.ceil(r.requiredPrice * factor) / factor;
    if (p > FIELDS.price[1]) return null;
    if (raw({ ...x, price: p }).afterAd - r.allocated < x.unitGoal) p += 1 / factor;
    return p > FIELDS.price[1] ? null : p;
  }
  function sensitivity(x) {
    const base = calculate(x);
    if (!base.ok) return [];
    return [
      ['shippingCost', 2, { ...x, shippingCost: x.shippingCost + 2 }],
      [
        'refundRate',
        Math.min(5, 100 - x.refundRate),
        { ...x, refundRate: Math.min(100, x.refundRate + 5) },
      ],
      ['adCost', x.adCost * 0.1, { ...x, adCost: x.adCost * 1.1 }],
    ].map(([field, change, next]) => {
      const r = calculate(next);
      return { field, change, delta: r.ok ? r.monthlyProfit - base.monthlyProfit : null };
    });
  }
  /** Compare the alternative with a baseline monthly profit, not with its revenue.
   * Quantity includes refunded original orders. Costs and acquisition cost stay fixed.
   * Loss-making orders are never represented as a route to growth. */
  function matchScenario(baseline, alternative) {
    const a = calculate(baseline),
      b = calculate(alternative);
    if (!a.ok || !b.ok) return { ok: false, reason: 'inputs' };
    const meetsAtCurrentVolume = b.monthlyProfit >= a.monthlyProfit;
    const common = {
      ok: true,
      baselineProfit: a.monthlyProfit,
      baselineOrders: baseline.monthlyOrders,
      alternativeProfit: b.monthlyProfit,
      contribution: b.afterAd,
      meetsAtCurrentVolume,
    };
    if (!(b.afterAd > 0))
      return { ...common, kind: 'nonpositive', orders: null, delta: null, uplift: null };
    const needed = Math.max(0, a.monthlyProfit + alternative.fixedCost);
    const orders = ordersForTarget(b.afterAd, needed, 0);
    if (orders === null || orders > FIELDS.monthlyOrders[1])
      return { ...common, kind: 'range', orders: null, delta: null, uplift: null };
    return {
      ...common,
      kind: 'minimum',
      orders,
      delta: orders - baseline.monthlyOrders,
      uplift: baseline.monthlyOrders > 0 ? (orders / baseline.monthlyOrders - 1) * 100 : null,
      profitAtThreshold: orders * b.afterAd - alternative.fixedCost,
    };
  }
  /** Price and order-volume grid. No implied conversion-rate response to price. */
  function scenarioGrid(x) {
    if (validate(x).length) return [];
    const prices = [0.9, 1, 1.1].map((f) => x.price * f);
    const volumes = [0.8, 1, 1.2].map((f) => Math.round(x.monthlyOrders * f));
    return prices.map((price) => ({
      price,
      cells: volumes.map((orders) => {
        const r = calculate({ ...x, price, monthlyOrders: orders });
        return { orders, profit: r.ok ? r.monthlyProfit : null, ok: r.ok };
      }),
    }));
  }
  function validDate(value) {
    return (
      typeof value === 'string' &&
      (value === '' ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          Number.isFinite(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value))
    );
  }
  /** Public links accept presentation preferences only, never business inputs. */
  function parsePreferences(search, locales, defaultLanguage = 'en') {
    const fallback = locales.includes(defaultLanguage) ? defaultLanguage : 'en';
    try {
      const p = new URLSearchParams(typeof search === 'string' ? search : '');
      return {
        language: locales.includes(p.get('lang')) ? p.get('lang') : fallback,
        currency: CURRENCIES.includes(p.get('currency')) ? p.get('currency') : 'USD',
      };
    } catch {
      return { language: fallback, currency: 'USD' };
    }
  }
  function validatePlan(p) {
    const err = [];
    if (
      !p ||
      typeof p !== 'object' ||
      Array.isArray(p) ||
      p.version !== 1 ||
      !COMPATIBLE_VERSIONS.includes(p.modelVersion)
    )
      return ['version'];
    if (!CURRENCIES.includes(p.currency)) err.push('currency');
    if (!Array.isArray(p.scenarios) || p.scenarios.length < 1 || p.scenarios.length > 3)
      return [...err, 'scenarios'];
    if (!Number.isInteger(p.active) || p.active < 0 || p.active >= p.scenarios.length)
      err.push('active');
    for (const s of p.scenarios) {
      if (!s || typeof s !== 'object' || Array.isArray(s)) {
        err.push('scenario');
        continue;
      }
      if (
        !s ||
        typeof s !== 'object' ||
        typeof s.name !== 'string' ||
        !s.name.trim() ||
        s.name.length > 60
      )
        err.push('name');
      if (validate(s).length) err.push('inputs');
      if (typeof s.source !== 'string' || s.source.length > 500) err.push('source');
      if (!validDate(s.checked)) err.push('date');
    }
    return err;
  }
  function cleanPlan(p) {
    if (validatePlan(p).length) throw new Error('Invalid plan');
    return {
      version: 1,
      modelVersion: MODEL_VERSION,
      currency: p.currency,
      active: p.active,
      scenarios: p.scenarios.map((s) =>
        Object.fromEntries([
          ['name', s.name.trim()],
          ['source', s.source],
          ['checked', s.checked],
          ...Object.keys(FIELDS).map((k) => [k, s[k]]),
        ]),
      ),
    };
  }
  return Object.freeze({
    MODEL_VERSION,
    FIELDS,
    DEFAULTS,
    CURRENCIES,
    validate,
    calculate,
    ordersForTarget,
    minorDigits,
    floorMoney,
    actionablePrice,
    sensitivity,
    matchScenario,
    scenarioGrid,
    validDate,
    parsePreferences,
    validatePlan,
    cleanPlan,
  });
});
