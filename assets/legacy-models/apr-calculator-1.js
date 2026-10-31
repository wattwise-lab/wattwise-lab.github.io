(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const num = (n) =>
    Number(n).toLocaleString(I?.formatLocale || 'en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  const money = (n) =>
    I ? I.currency(n, 'USD', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '$' + num(n);
  const numeric = (id) => ($(id).value.trim() === '' ? NaN : Number($(id).value));
  const annuity = (r, n) => (r === 0 ? n : -Math.expm1(-n * Math.log1p(r)) / r);
  function invalid() {
    for (const id of ['result', 'chipEff', 'chipPmt', 'chipTot']) $(id).textContent = '—';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent =
      'Use a finite positive loan amount, a rate from 0% to 1,000%, a whole term of 1–1,200 months, and nonnegative fees below the loan amount.';
  }
  function render() {
    const [principal, rate, months, fees] = ['amt', 'rate', 'months', 'fees'].map(numeric);
    if (
      ![principal, rate, months, fees].every(Number.isFinite) ||
      principal <= 0 ||
      rate < 0 ||
      rate > 1000 ||
      !Number.isInteger(months) ||
      months < 1 ||
      months > 1200 ||
      fees < 0 ||
      fees >= principal
    )
      return invalid();
    const nominal = rate / 1200;
    const payment = principal / annuity(nominal, months);
    const received = principal - fees;
    let monthly = nominal;
    if (received !== principal) {
      let lo = nominal;
      // PV(payment, r, months) <= payment/r, so this upper bound brackets the root.
      let hi = Math.max(nominal, payment / received);
      if (!Number.isFinite(hi)) return invalid();
      for (let k = 0; k < 100; k++) {
        const mid = lo + (hi - lo) / 2;
        if (payment * annuity(mid, months) > received) lo = mid;
        else hi = mid;
      }
      monthly = lo + (hi - lo) / 2;
    }
    const annual = monthly * 1200;
    const effective = Math.expm1(12 * Math.log1p(monthly)) * 100;
    const total = payment * months;
    if (![payment, annual, effective, total].every(Number.isFinite)) return invalid();
    $('result').textContent = num(annual) + '%';
    $('chipEff').textContent = num(effective) + '%';
    $('chipPmt').textContent = money(payment);
    $('chipTot').textContent = money(total);
    $('verdict').className = 'verdict';
    $('verdictText').textContent =
      I?.message(
        'The modeled annualized rate is {0}%. It discounts the scheduled payments to the loan proceeds after upfront fees. Statutory APR rules can differ.|模型年化利率为 {0}%，使计划还款的现值等于扣除前期费用后的贷款到账额。法定 APR 规则可能不同。',
        [num(annual)],
      ) ||
      'The modeled annualized rate is ' +
        num(annual) +
        '%. It discounts the scheduled payments to the loan proceeds after upfront fees. Statutory APR rules can differ.';
  }
  document.querySelectorAll('input').forEach((e) => e.addEventListener('input', render));
  render();
})();
