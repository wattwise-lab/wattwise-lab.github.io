(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    inputs = [$('kg'), $('cm'), $('age'), $('sex')],
    out = [
      'result',
      'chipBmi',
      'chipFat',
      'chipLean',
      'cBmi',
      'cBf',
      'cFat',
      'cLean',
      'cOther',
      'barYouVal',
      'barOtherVal',
    ],
    num = (n) => n.toLocaleString(I?.formatLocale || 'en-US', { maximumFractionDigits: 1 }),
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]);
  function invalid(pair) {
    out.forEach((id) => {
      $(id).textContent = '—';
    });
    $('barYou').style.width = '0%';
    $('barOther').style.width = '0%';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(pair);
    window.__summary = '';
  }
  function render() {
    const [kg, cm, age] = inputs
        .slice(0, 3)
        .map((input) => (input.value.trim() === '' ? NaN : Number(input.value))),
      sex = $('sex').value;
    if (
      ![kg, cm, age].every(Number.isFinite) ||
      kg <= 0 ||
      cm <= 0 ||
      age < 18 ||
      !['male', 'female'].includes(sex)
    ) {
      invalid(
        'Enter a finite positive weight and height, and an adult age of at least 18 years. This equation is not a child body-fat model.|请输入有限且大于零的体重、身高，以及至少 18 岁的成人年龄。本公式不适用于儿童体脂估算。',
      );
      return;
    }
    const bmi = kg / (cm / 100) ** 2,
      bf = 1.2 * bmi + 0.23 * age - (sex === 'male' ? 10.8 : 0) - 5.4,
      other = bf + (sex === 'male' ? 10.8 : -10.8),
      fat = kg * (bf / 100),
      lean = kg * (1 - bf / 100);
    if (![bmi, bf, fat, lean].every(Number.isFinite) || bf < 0 || bf > 100) {
      invalid(
        'This input gives an estimate outside the physical 0–100% range or supported numeric range. No body-composition estimate is shown.|该输入使估算超出 0–100% 的物理范围或可表示数值范围，因此不显示身体成分估算。',
      );
      return;
    }
    $('result').textContent = num(bf) + ' %';
    for (const id of ['chipBmi', 'cBmi']) $(id).textContent = num(bmi);
    for (const id of ['chipFat', 'cFat']) $(id).textContent = num(fat) + ' kg';
    for (const id of ['chipLean', 'cLean']) $(id).textContent = num(lean) + ' kg';
    for (const id of ['cBf', 'barYouVal']) $(id).textContent = num(bf) + ' %';
    const otherValid = Number.isFinite(other) && other >= 0 && other <= 100;
    for (const id of ['cOther', 'barOtherVal'])
      $(id).textContent = otherValid ? num(other) + ' %' : '—';
    const mx = Math.max(bf, otherValid ? other : 0, 1);
    $('barYou').style.width = (bf / mx) * 100 + '%';
    $('barOther').style.width = otherValid ? (other / mx) * 100 + '%' : '0%';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(
      'This is a population-equation estimate, not a direct body-composition measurement. It can be inaccurate for athletes, older adults, and many body types — treat the percentage as a rough guide, not a measured value.|这是人群方程估算，不是直接的身体成分测量。对运动员、老年人及多种体型可能不准确，请将百分比视为粗略参考，而不是实测值。',
    );
    window.__summary = say(
      'Estimated adult body fat {0}%; BMI {1}; estimated fat mass {2} kg and lean mass {3} kg.|成人体脂估算 {0}%；BMI {1}；估算脂肪量 {2} kg、瘦体重 {3} kg。',
      [num(bf), num(bmi), num(fat), num(lean)],
    );
  }
  inputs.forEach((input) => input.addEventListener('input', render));
  render();
})();
