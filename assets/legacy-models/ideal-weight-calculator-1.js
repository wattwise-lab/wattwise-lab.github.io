(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const I = window.CMI18n;
  const num = (n) => n.toLocaleString(I?.formatLocale || 'en-US', { maximumFractionDigits: 1 });
  const message = (pair, values = []) => I?.message
    ? I.message(pair, values)
    : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, i) => values[i]);
  const outputs = ['result', 'chipH', 'chipOther', 'chipBmi', 'cIdeal', 'cOther', 'cInch', 'cBmi', 'cLb', 'barYouVal', 'barOtherVal'];
  function invalid(pair) {
    outputs.forEach((id) => { $(id).textContent = '—'; });
    ['barYou', 'barOther'].forEach((id) => { $(id).style.width = '0%'; });
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = message(pair);
    window.__summary = '';
  }
  function render() {
    const height = $('cm').value.trim() === '' ? NaN : Number($('cm').value);
    const sex = $('sex').value;
    if (!Number.isFinite(height) || height < 152.4 || !['male', 'female'].includes(sex)) {
      invalid('Enter an adult height of at least 152.4 cm and select a formula sex. No estimate is provided below this height.|请填写至少 152.4 厘米的成人身高并选择公式性别；低于此身高不提供估值。');
      return;
    }
    const inch = height / 2.54;
    const over = inch - 60;
    const ideal = (sex === 'male' ? 50 : 45.5) + 2.3 * over;
    const other = (sex === 'male' ? 45.5 : 50) + 2.3 * over;
    const bmi = ideal / (height / 100) ** 2;
    const pounds = ideal / 0.45359237;
    if (![inch, ideal, other, bmi, pounds].every(Number.isFinite) || bmi <= 0) {
      invalid('These values exceed the supported numerical range. Enter a realistic adult height.|数值超出支持的计算范围，请填写实际成人身高。');
      return;
    }
    $('result').textContent = $('cIdeal').textContent = num(ideal) + ' kg';
    $('chipH').textContent = num(inch) + ' in';
    $('chipOther').textContent = $('cOther').textContent = num(other) + ' kg';
    $('chipBmi').textContent = $('cBmi').textContent = num(bmi);
    $('cInch').textContent = message('{0} in ({1} in above 5 ft)|{0} 英寸（高于 5 英尺 {1} 英寸）', [num(inch), num(over)]);
    $('cLb').textContent = num(pounds) + ' lb';
    const maximum = Math.max(ideal, other);
    $('barYou').style.width = ideal / maximum * 100 + '%';
    $('barOther').style.width = other / maximum * 100 + '%';
    $('barYouVal').textContent = num(ideal) + ' kg';
    $('barOtherVal').textContent = num(other) + ' kg';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = message('Historical reference only: this formula does not establish a healthy target or select a medication dose. Body composition and individual clinical factors are not modeled.|仅为历史公式参考，不用于设定健康目标或选择用药剂量；模型不包含身体成分及个体临床因素。');
    window.__summary = message('Devine reference: {0} kg at {1} cm; other formula sex: {2} kg.|Devine 参考值：身高 {1} 厘米时 {0} 千克；另一公式性别为 {2} 千克。', [num(ideal), num(height), num(other)]);
  }
  [$('cm'), $('sex')].forEach((node) => node.addEventListener('input', render));
  render();
})();
