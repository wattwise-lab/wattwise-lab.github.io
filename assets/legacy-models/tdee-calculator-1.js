(() => {
  'use strict';

  const num = (n) =>
    Number(n).toLocaleString(
      typeof window !== 'undefined' && window.CMI18n ? window.CMI18n.formatLocale : 'en-US',
      { maximumFractionDigits: 2 },
    );
  const num1 = (n) =>
    Number(n).toLocaleString(
      typeof window !== 'undefined' && window.CMI18n ? window.CMI18n.formatLocale : 'en-US',
      { maximumFractionDigits: 1 },
    );
  const num0 = (n) =>
    Number(n).toLocaleString(
      typeof window !== 'undefined' && window.CMI18n ? window.CMI18n.formatLocale : 'en-US',
      { maximumFractionDigits: 0 },
    );
  const $ = (id) => document.getElementById(id);
  const inputs = [$('kg'), $('cm'), $('age'), $('sex'), $('act')];
  function get() {
    return Object.fromEntries(
      inputs.map((e) => [
        e.id,
        e.type === 'select-one' ? e.value : e.value.trim() === '' ? NaN : Number(e.value),
      ]),
    );
  }
  function setVerdict(cls, txt) {
    const vd = $('verdict');
    vd.className = 'verdict' + (cls ? ' ' + cls : '');
    $('verdictText').textContent = txt;
  }
  function invalid(msg) {
    $('result').textContent = '—';
    $('chipBmr').textContent = '—';
    $('chipWeek').textContent = '—';
    $('chipAct').textContent = '—';
    $('barSedVal').textContent = '—';
    $('barYouVal').textContent = '—';
    $('barExtVal').textContent = '—';
    $('barSed').style.width = '0%';
    $('barYou').style.width = '0%';
    $('barExt').style.width = '0%';
    $('lvlRows').innerHTML = '';
    setVerdict('warn', window.CMI18n?.pick ? window.CMI18n.pick(msg) : msg.split('|')[0]);
    window.__summary = '';
  }

  function calcBMR2(w, h, a, sex) {
    return 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
  }
  function calcTDEE(w, h, a, sex, act) {
    const b = calcBMR2(w, h, a, sex);
    return { bmr: b, tdee: b * act, actCal: b * act - b };
  }
  function render() {
    const v = get();
    if (
      ![v.kg, v.cm, v.age].every(Number.isFinite) ||
      !(v.kg > 0) ||
      !(v.cm > 0) ||
      v.age < 18 ||
      !['male', 'female'].includes($('sex').value)
    ) {
      invalid(
        'Enter finite positive weight and height and an adult age of at least 18 years. This resting-energy equation is not a child model.|请输入有限且大于零的体重、身高，以及至少 18 岁的成人年龄。本静息能量公式不适用于儿童。',
      );
      return;
    }
    const r = calcTDEE(v.kg, v.cm, v.age, $('sex').value, Number($('act').value));
    if (
      ![1.2, 1.375, 1.55, 1.725, 1.9].includes(Number($('act').value)) ||
      ![r.bmr, r.tdee, r.actCal, r.tdee * 7, r.bmr * 1.9].every(Number.isFinite) ||
      r.bmr <= 0
    ) {
      invalid(
        'These inputs produce no positive finite energy estimate. Check the measurements and choose a listed activity factor.|这些输入无法得到有限且大于零的能量估算，请检查测量值并选择列表中的活动系数。',
      );
      return;
    }
    $('result').textContent = num1(r.tdee) + ' kcal/day';
    $('chipBmr').textContent = num1(r.bmr) + ' kcal/day';
    $('chipWeek').textContent = num0(r.tdee * 7) + ' kcal';
    $('chipAct').textContent = num1(r.actCal) + ' kcal/day';
    let rows = '';
    [
      [1.2, 'Sedentary'],
      [1.375, 'Lightly active'],
      [1.55, 'Moderately active'],
      [1.725, 'Very active'],
      [1.9, 'Extremely active'],
    ].forEach((l) => {
      rows +=
        '<tr><td>' +
        l[1] +
        ' (' +
        l[0] +
        ")</td><td class='num'>" +
        num1(r.bmr * l[0]) +
        ' kcal/day</td></tr>';
    });
    $('lvlRows').innerHTML = rows;
    const mx = r.bmr * 1.9;
    $('barSed').style.width = ((r.bmr * 1.2) / mx) * 100 + '%';
    $('barSedVal').textContent = num1(r.bmr * 1.2);
    $('barYou').style.width = (r.tdee / mx) * 100 + '%';
    $('barYouVal').textContent = num1(r.tdee);
    $('barExt').style.width = '100%';
    $('barExtVal').textContent = num1(r.bmr * 1.9);
    setVerdict(
      '',
      'Your estimated total daily expenditure is ' +
        num1(r.tdee) +
        ' kcal/day: a BMR of ' +
        num1(r.bmr) +
        ' kcal/day multiplied by ' +
        Number($('act').value) +
        '. Both parts are estimates — the BMR equation varies between individuals, and the activity factor is a coarse category, not a measurement of your days.',
    );
    window.__summary =
      'TDEE ' +
      num1(r.tdee) +
      ' kcal/day (BMR ' +
      num1(r.bmr) +
      ' × ' +
      Number($('act').value) +
      ') for ' +
      v.kg +
      ' kg, ' +
      v.cm +
      ' cm, age ' +
      v.age +
      ', ' +
      $('sex').value +
      '.';
  }

  inputs.forEach((e) => e.addEventListener('input', render));
  render();
})();
