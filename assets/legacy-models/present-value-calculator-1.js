(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    out = ['result', 'chipDisc', 'chip5'],
    num = (n) =>
      n.toLocaleString(I?.formatLocale || 'en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]);
  function invalid(pair) {
    out.forEach((id) => {
      $(id).textContent = '—';
    });
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(pair);
    window.__summary = '';
  }
  function render() {
    const values = ['fv', 'rate', 'years'].map((id) => {
        const raw = $(id).value.trim();
        return raw === '' ? NaN : Number(raw);
      }),
      [fv, rate, n] = values;
    if (!values.every(Number.isFinite) || fv < 0 || rate < 0 || n < 0) {
      invalid(
        'Enter a finite, non-negative future amount, discount rate and number of years.|请输入有限且非负的未来金额、折现率和年数。',
      );
      return;
    }
    const r = rate / 100,
      log = Math.log1p(r),
      factor = Math.exp(-n * log),
      factor5 = Math.exp(-5 * log),
      pv = fv * factor,
      pv5 = fv * factor5,
      discount = fv * -Math.expm1(-n * log);
    if (
      ![factor, factor5, pv, pv5, discount].every(Number.isFinite) ||
      (fv > 0 && (pv === 0 || pv5 === 0))
    ) {
      invalid(
        'The discounted result is outside the supported numeric range. Reduce the amount, rate or time span.|折现结果超出可表示的数值范围，请减小金额、利率或时间跨度。',
      );
      return;
    }
    $('result').textContent = '$' + num(pv);
    $('chipDisc').textContent = '$' + num(discount);
    $('chip5').textContent = '$' + num(pv5);
    $('verdict').className = 'verdict';
    $('verdictText').textContent = say(
      'Discounting {0} years at {1}% gives a present value of ${2}; the discount is ${3}.|按 {1}% 折现 {0} 年，现值为 ${2}，折现金额为 ${3}。',
      [num(n), num(rate), num(pv), num(discount)],
    );
    window.__summary = say(
      'Present value: ${0}; future amount: ${1}; discount: ${2}.|现值：${0}；未来金额：${1}；折现金额：${2}。',
      [num(pv), num(fv), num(discount)],
    );
  }
  ['fv', 'rate', 'years'].forEach((id) => $(id).addEventListener('input', render));
  render();
})();
