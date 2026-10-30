(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const num = (n) => n.toLocaleString(I?.formatLocale || 'en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const message = (pair, values = []) => I?.message ? I.message(pair, values) : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, i) => values[i]);
  function render() {
    const values = ['a', 'b', 'm', 'c'].map((id) => $(id).value.trim() === '' ? NaN : Number($(id).value));
    const [a, b, m, c] = values;
    const root = a === 0 ? 0 : -b / a;
    const intercept = m === 0 ? 0 : -c / m;
    if (!values.every(Number.isFinite) || ![root, intercept].every(Number.isFinite)) {
      ['result', 'chipLine', 'chipXint', 'chipYint'].forEach((id) => { $(id).textContent = '—'; });
      $('verdict').className = 'verdict warn';
      $('verdictText').textContent = message('Enter finite numbers in all four fields, within the supported numerical range.|请在四个输入框中填写支持范围内的有限数值。');
      window.__summary = '';
      return;
    }
    $('result').textContent = a === 0 ? message(b === 0 ? 'Every x|任意 x' : 'No solution|无解') : 'x = ' + num(root);
    $('chipLine').textContent = 'y = ' + num(m) + 'x ' + (c < 0 ? '− ' : '+ ') + num(Math.abs(c));
    $('chipXint').textContent = m === 0 ? message(c === 0 ? 'Every x (the x-axis)|任意 x（整条 x 轴）' : 'None (horizontal line)|无（水平直线）') : num(intercept);
    $('chipYint').textContent = num(c);
    $('verdict').className = 'verdict';
    $('verdictText').textContent = a === 0
      ? message(b === 0 ? '0·x + 0 = 0 is true for every x.|0·x + 0 = 0 对任意 x 都成立。' : 'With a zero coefficient and a nonzero constant, the equation has no solution.|系数为零、常数非零时，方程无解。')
      : message('Solution x = {0}. The displayed root is rounded; use the original coefficients for further calculations.|解为 x = {0}。显示值经过舍入；后续计算请保留原始系数。', [num(root)]);
    window.__summary = $('result').textContent + '; ' + $('chipLine').textContent;
  }
  ['a', 'b', 'm', 'c'].forEach((id) => $(id).addEventListener('input', render));
  render();
})();
