(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const num = (n) => n.toLocaleString(I?.formatLocale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const message = (pair, values = []) => I?.message
    ? I.message(pair, values)
    : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, i) => values[i]);
  function invalid(pair) {
    ['result', 'chipFac', 'chipBack'].forEach((id) => { $(id).textContent = '—'; });
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = message(pair);
    window.__summary = '';
  }
  function render() {
    const values = ['amt', 'y1', 'y2', 'inf'].map((id) => $(id).value.trim() === '' ? NaN : Number($(id).value));
    const [amount, first, last, percent] = values;
    if (!values.every(Number.isFinite) || amount < 0 || percent <= -100 || ![first, last].every((n) => Number.isInteger(n) && n >= 1 && n <= 9999) || last <= first) {
      invalid('Enter a nonnegative amount, whole years from 1 to 9999 with the later year after the earlier year, and an annual rate above −100%.|请填写非负金额、1 至 9999 范围内先后有序的整数年份，以及高于 −100% 的年率。');
      return;
    }
    const years = last - first;
    const exponent = years * Math.log1p(percent / 100);
    const factor = Math.exp(exponent);
    const adjusted = amount * factor;
    const reverse = 100 / factor;
    const change = Math.expm1(exponent) * 100;
    if (![factor, adjusted, reverse, change].every(Number.isFinite) || factor <= 0) {
      invalid('These assumptions exceed the supported numerical range. Reduce the amount, rate or time span.|这些假设超出支持的数值范围，请减小金额、年率或时间跨度。');
      return;
    }
    $('result').textContent = '$' + num(adjusted);
    $('chipFac').textContent = num(factor) + '×';
    $('chipBack').textContent = '$' + num(reverse);
    $('verdict').className = 'verdict';
    $('verdictText').textContent = message('Modeled price-level change: {0}% over {1} years at an assumed {2}% per year. No historical CPI data is fetched.|按假设年率 {2}% 计算，{1} 年内物价水平变化为 {0}%；本工具不获取历史 CPI 数据。', [num(change), years, num(percent)]);
    window.__summary = $('result').textContent + '. ' + $('verdictText').textContent;
  }
  ['amt', 'y1', 'y2', 'inf'].forEach((id) => $(id).addEventListener('input', render));
  render();
})();
