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
  const inputs = [$('kg'), $('ex'), $('extra')];
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
    $('chipBase').textContent = '—';
    $('chipEx').textContent = '—';
    $('chipL').textContent = '—';
    $('cBase').textContent = '—';
    $('cEx').textContent = '—';
    $('cExtra').textContent = '—';
    $('cTotal').textContent = '—';
    $('cL').textContent = '—';
    $('cCups').textContent = '—';
    $('barBaseVal').textContent = '—';
    $('barExVal').textContent = '—';
    $('barTotVal').textContent = '—';
    $('barBase').style.width = '0%';
    $('barEx').style.width = '0%';
    $('barTot').style.width = '0%';
    setVerdict('warn', window.CMI18n?.pick ? window.CMI18n.pick(msg) : msg.split('|')[0]);
    window.__summary = '';
  }

  function calcWater(w, exMin, extra) {
    const base = w * 35,
      exAdd = (350 * exMin) / 30;
    return { base: base, exAdd: exAdd, total: base + exAdd + extra };
  }
  function render() {
    const v = get();
    if (![v.kg, v.ex, v.extra].every(Number.isFinite) || v.kg <= 0 || v.ex < 0 || v.extra < 0) {
      invalid(
        'Enter finite values: weight above zero, with exercise minutes and extra water at zero or above.|请输入有限数值：体重大于零，运动分钟数及额外水量不小于零。',
      );
      return;
    }
    const r = calcWater(v.kg, v.ex, v.extra);
    if (![r.base, r.exAdd, r.total].every(Number.isFinite)) {
      invalid(
        'These inputs exceed the supported numeric range. Reduce the values.|这些输入超出可表示的数值范围，请减小数值。',
      );
      return;
    }
    $('result').textContent = num0(r.total) + ' ml/day';
    $('chipBase').textContent = num0(r.base) + ' ml';
    $('chipEx').textContent = num0(r.exAdd) + ' ml';
    $('chipL').textContent = num(r.total / 1000) + ' L';
    $('cBase').textContent = num0(r.base) + ' ml';
    $('cEx').textContent = num0(r.exAdd) + ' ml';
    $('cExtra').textContent = num0(v.extra) + ' ml';
    $('cTotal').textContent = num0(r.total) + ' ml';
    $('cL').textContent = num(r.total / 1000) + ' L';
    $('cCups').textContent = num(r.total / 237) + ' cups (8 oz)';
    const mx = Math.max(r.total, 1);
    $('barBase').style.width = (r.base / mx) * 100 + '%';
    $('barBaseVal').textContent = num0(r.base) + ' ml';
    $('barEx').style.width = (r.exAdd / mx) * 100 + '%';
    $('barExVal').textContent = num0(r.exAdd) + ' ml';
    $('barTot').style.width = '100%';
    $('barTotVal').textContent = num0(r.total) + ' ml';
    setVerdict(
      'warn',
      'This is a simple weight-based planning figure. Medical conditions, diet, climate, and medications can change fluid needs, so it is not a personal prescription — follow clinical advice when it applies.',
    );
    window.__summary =
      'Estimated water ' +
      num0(r.total) +
      ' ml/day (base ' +
      num0(r.base) +
      ' ml + exercise ' +
      num0(r.exAdd) +
      ' ml + extra ' +
      num0(v.extra) +
      ' ml) for ' +
      v.kg +
      ' kg.';
  }

  inputs.forEach((e) => e.addEventListener('input', render));
  render();
})();
