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
  const inputs = [$('kg'), $('cm'), $('age'), $('sex')];
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
    $('chipWeek').textContent = '—';
    $('chipMonth').textContent = '—';
    $('chipOther').textContent = '—';
    $('cDay').textContent = '—';
    $('cWeek').textContent = '—';
    $('cMonth').textContent = '—';
    $('cOther').textContent = '—';
    $('barYouVal').textContent = '—';
    $('barOtherVal').textContent = '—';
    $('barYou').style.width = '0%';
    $('barOther').style.width = '0%';
    setVerdict('warn', window.CMI18n?.pick ? window.CMI18n.pick(msg) : msg.split('|')[0]);
    window.__summary = '';
  }

  function calcBMR(w, h, a, sex) {
    return 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
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
    const b = calcBMR(v.kg, v.cm, v.age, $('sex').value);
    const other = calcBMR(v.kg, v.cm, v.age, $('sex').value === 'male' ? 'female' : 'male');
    if (!Number.isFinite(b) || b <= 0 || !Number.isFinite(b * 30)) {
      invalid(
        'These inputs produce no positive finite resting-energy estimate. Check the measurements and equation limits.|这些输入无法得到有限且大于零的静息能量估算，请检查测量值及公式适用范围。',
      );
      return;
    }
    const otherValid = Number.isFinite(other) && other > 0;
    $('result').textContent = num1(b) + ' kcal/day';
    $('chipWeek').textContent = num0(b * 7) + ' kcal';
    $('chipMonth').textContent = num0(b * 30) + ' kcal';
    $('chipOther').textContent = otherValid ? num1(other) + ' kcal/day' : '—';
    $('cDay').textContent = num1(b) + ' kcal';
    $('cWeek').textContent = num0(b * 7) + ' kcal';
    $('cMonth').textContent = num0(b * 30) + ' kcal';
    $('cOther').textContent = otherValid ? num1(other) + ' kcal/day' : '—';
    const mx = Math.max(b, other);
    $('barYou').style.width = (b / mx) * 100 + '%';
    $('barYouVal').textContent = num1(b) + ' kcal/day';
    $('barOther').style.width = otherValid ? (other / mx) * 100 + '%' : '0%';
    $('barOtherVal').textContent = otherValid ? num1(other) + ' kcal/day' : '—';
    setVerdict(
      '',
      'Your estimated resting expenditure is ' +
        num1(b) +
        ' kcal/day. This is a population equation, not a metabolic test: body composition, illness, medications, and other personal factors can move the true value, so treat it as a starting estimate.',
    );
    window.__summary =
      'BMR ' +
      num1(b) +
      ' kcal/day (Mifflin–St Jeor) for ' +
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
