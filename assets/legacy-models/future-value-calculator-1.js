(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const locale = I?.formatLocale || 'en-US';
  const money = (n) =>
    I
      ? I.currency(n, 'USD', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
      : new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);
  const num = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(n);
  const numeric = (id) => ($(id).value.trim() === '' ? NaN : Number($(id).value));
  const duration = (years) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'year',
      unitDisplay: 'long',
      maximumFractionDigits: 6,
    }).format(years);
  function invalid() {
    for (const id of ['result', 'chipInt', 'chipMult']) $(id).textContent = '—';
    $('yearRows').innerHTML = '';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent =
      'Enter finite nonnegative principal, rate and years, and a positive whole number of compounding periods. Results must fit the supported numeric range.';
  }
  function render() {
    const [pv, rate, years, n] = ['pv', 'rate', 'years', 'n'].map(numeric);
    if (
      ![pv, rate, years, n].every(Number.isFinite) ||
      Math.min(pv, rate, years) < 0 ||
      !Number.isSafeInteger(n) ||
      n < 1
    )
      return invalid();
    const growth = (t) => n * t * Math.log1p(rate / 100 / n);
    const exponent = growth(years),
      factor = Math.exp(exponent),
      future = pv * factor,
      earned = pv * Math.expm1(exponent);
    if (![exponent, factor, future, earned].every(Number.isFinite)) return invalid();
    $('result').textContent = money(future);
    $('chipInt').textContent = money(earned);
    $('chipMult').textContent = num(factor) + '×';
    const dates = [...new Set([1, 5, 10, 20, 30, years].filter((y) => y <= years))].sort(
      (a, b) => a - b,
    );
    $('yearRows').innerHTML = dates
      .map((y) => {
        const e = growth(y),
          value = pv * Math.exp(e),
          interest = pv * Math.expm1(e);
        return (
          '<tr><td>' +
          duration(y) +
          '</td><td class="num">' +
          money(value) +
          '</td><td class="num">' +
          money(interest) +
          '</td></tr>'
        );
      })
      .join('');
    $('verdict').className = 'verdict';
    $('verdictText').textContent =
      I?.message(
        'The modeled future value is {0}, with {1} interest over {2}. Every table row uses the entered compounding frequency.|模型未来值为 {0}，在 {2} 内的利息为 {1}。表格每一行均采用所填复利频率。',
        [money(future), money(earned), duration(years)],
      ) ||
      'The modeled future value is ' +
        money(future) +
        ', with ' +
        money(earned) +
        ' interest over ' +
        duration(years) +
        '. Every table row uses the entered compounding frequency.';
  }
  document.querySelectorAll('input').forEach((e) => e.addEventListener('input', render));
  render();
})();
