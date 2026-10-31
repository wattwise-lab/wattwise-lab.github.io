(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const num = (n) =>
    Number(n).toLocaleString(I?.formatLocale || 'en-US', { maximumFractionDigits: 2 });
  const money = (n) =>
    I ? I.currency(n, 'USD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + num(n);
  const numeric = (id) => {
    const raw = $(id).value.trim();
    return raw === '' ? NaN : Number(raw);
  };
  function invalid() {
    for (const id of [
      'result',
      'chipDebts',
      'chipHousing',
      'bHousing',
      'bHousingPct',
      'bAuto',
      'bAutoPct',
      'bOther',
      'bOtherPct',
      'bTotal',
      'bTotalPct',
    ])
      $(id).textContent = '—';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent =
      'Enter a finite monthly income above zero and finite monthly payments at zero or above.';
  }
  function render() {
    const [income, housing, auto, other] = ['income', 'housing', 'auto', 'other'].map(numeric);
    if (
      ![income, housing, auto, other].every(Number.isFinite) ||
      income <= 0 ||
      Math.min(housing, auto, other) < 0
    )
      return invalid();
    const total = housing + auto + other;
    const ratios = [housing, auto, other, total].map((n) => (n / income) * 100);
    if (!Number.isFinite(total) || !ratios.every(Number.isFinite)) return invalid();
    $('result').textContent = num(ratios[3]) + '%';
    $('chipDebts').textContent = money(total) + '/mo';
    $('chipHousing').textContent = num(ratios[0]) + '%';
    ['Housing', 'Auto', 'Other', 'Total'].forEach((key, i) => {
      $('b' + key).textContent = money([housing, auto, other, total][i]);
      $('b' + key + 'Pct').textContent = num(ratios[i]) + '%';
    });
    $('verdict').className = 'verdict';
    $('verdictText').textContent =
      I?.message(
        'Your entered monthly payments use {0}% of gross income. This ratio does not predict loan approval or show your full living budget.|所填月付款占税前收入的 {0}%。此比率不预测贷款审批，也不代表完整生活预算。',
        [num(ratios[3])],
      ) ||
      'Your entered monthly payments use ' +
        num(ratios[3]) +
        '% of gross income. This ratio does not predict loan approval or show your full living budget.';
  }
  document.querySelectorAll('input').forEach((e) => e.addEventListener('input', render));
  render();
})();
