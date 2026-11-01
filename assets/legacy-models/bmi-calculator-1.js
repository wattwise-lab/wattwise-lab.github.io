(() => {
  'use strict';
  const num = (n, digits = 2) =>
    Number(n).toLocaleString(window.CMI18n?.formatLocale || 'en-US', {
      maximumFractionDigits: digits,
    });
  const $ = (id) => document.getElementById(id);
  const pick = (en, zh) => (window.CMI18n ? window.CMI18n.pick(en + '|' + zh) : en);
  function invalid(message) {
    for (const id of [
      'result',
      'chipCat',
      'chipPrime',
      'chipRange',
      'cBmi',
      'cCat',
      'cPrime',
      'cPond',
      'cRange',
      'cMetric',
      'barYouVal',
    ])
      $(id).textContent = '—';
    $('barYou').style.width = '0%';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = message;
    window.__summary = '';
  }
  function calcBMI(height, weight) {
    const square = height * height;
    const bmi = weight / square;
    return {
      bmi,
      prime: bmi / 25,
      ponderal: weight / (square * height),
      loKg: 18.5 * square,
      hiKg: 25 * square,
      cat:
        bmi < 18.5
          ? 'Underweight'
          : bmi < 25
            ? 'Healthy weight'
            : bmi < 30
              ? 'Overweight'
              : 'Obesity',
    };
  }
  function render() {
    const metric = $('unit').value === 'metric';
    for (const id of ['feet', 'inches', 'lb']) $(id).parentElement.hidden = metric;
    for (const id of ['cm', 'kg']) $(id).parentElement.hidden = !metric;
    const value = (id) => ($(id).value.trim() ? Number($(id).value) : NaN);
    let height, weight;
    if (metric) {
      height = value('cm') / 100;
      weight = value('kg');
    } else {
      const feet = value('feet'),
        inches = value('inches');
      if (
        !Number.isInteger(feet) ||
        feet < 0 ||
        !Number.isFinite(inches) ||
        inches < 0 ||
        inches >= 12
      ) {
        invalid(
          pick(
            'Feet must be a nonnegative whole number. Inches may include decimals and must be at least 0 and less than 12.',
            '英尺请填非负整数，英寸请填大于等于 0 且小于 12 的数。',
          ),
        );
        return;
      }
      height = (feet * 12 + inches) * 0.0254;
      weight = value('lb') * 0.45359237;
    }
    if (!(Number.isFinite(height) && Number.isFinite(weight) && height > 0 && weight > 0)) {
      invalid(
        pick(
          'Enter finite height and weight values above zero.',
          '身高和体重须为大于零的有限数值。',
        ),
      );
      return;
    }
    const r = calcBMI(height, weight);
    if (![r.bmi, r.prime, r.ponderal, r.loKg, r.hiKg].every((n) => Number.isFinite(n) && n > 0)) {
      invalid(
        pick(
          'These values are outside the supported numeric range.',
          '这些数值超出支持的计算范围。',
        ),
      );
      return;
    }
    const range = (factor = 1) => num(r.loKg / factor, 1) + '–<' + num(r.hiKg / factor, 1);
    $('result').textContent = num(r.bmi, 2);
    $('chipCat').textContent = r.cat;
    $('chipPrime').textContent = num(r.prime);
    $('chipRange').textContent = metric ? range() + ' kg' : range(0.45359237) + ' lb';
    $('cBmi').textContent = num(r.bmi, 2);
    $('cCat').textContent = r.cat;
    $('cPrime').textContent = num(r.prime);
    $('cPond').textContent = num(r.ponderal, 1) + ' kg/m³';
    $('cRange').textContent = range() + ' kg (' + range(0.45359237) + ' lb)';
    $('cMetric').textContent = num(height * 100, 1) + ' cm · ' + num(weight, 1) + ' kg';
    $('barYou').style.width = Math.min((r.bmi / 40) * 100, 100) + '%';
    $('barYouVal').textContent = num(r.bmi, 2);
    $('verdict').className = 'verdict' + (r.cat === 'Healthy weight' ? '' : ' warn');
    $('verdictText').textContent = pick(
      'The category uses unrounded BMI. This adult screening result is not a diagnosis or a direct body-fat measurement.',
      '分类依据未四舍五入的 BMI。本结果仅作成人筛查参考，不是诊断或体脂直接测量。',
    );
    window.__summary =
      'BMI ' +
      num(r.bmi, 2) +
      ' (' +
      r.cat +
      '), BMI Prime ' +
      num(r.prime) +
      ', rounded weight thresholds ' +
      range() +
      ' kg for ' +
      num(height * 100, 1) +
      ' cm.';
  }
  document.querySelectorAll('input,select').forEach((e) => {
    e.addEventListener('input', render);
    e.addEventListener('change', render);
  });
  render();
})();
