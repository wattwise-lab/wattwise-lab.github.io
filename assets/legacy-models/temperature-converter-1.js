(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    inputs = [$('val'), $('from'), $('to')],
    unit = (id) => ({ c: '°C', f: '°F', k: 'K' })[id],
    fmt = (n) =>
      (Math.abs(n) < 0.0000005 ? 0 : n).toLocaleString(I?.formatLocale || 'en-US', {
        maximumFractionDigits: 6,
      }),
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]);
  function invalid(pair) {
    for (const id of ['result', 'chipBase', 'chipInv']) $(id).textContent = '—';
    $('tblRows').innerHTML = '';
    $('verdict').className = 'verdict bad';
    $('verdictText').textContent = say(pair);
    window.__summary = '';
  }
  function render() {
    const raw = $('val').value.trim(),
      v = raw === '' ? NaN : Number(raw),
      from = $('from').value,
      to = $('to').value;
    if (!Number.isFinite(v) || !unit(from) || !unit(to)) {
      invalid(
        'Enter a finite temperature and select valid source and target scales.|请输入有限温度，并选择有效的原温标与目标温标。',
      );
      return;
    }
    if (v < { c: -273.15, f: -459.67, k: 0 }[from]) {
      invalid(
        'The entered temperature is below absolute zero in its source scale. No physical conversion is shown.|输入温度低于原温标的绝对零度，不显示物理温度换算。',
      );
      return;
    }
    const k = from === 'k' ? v : from === 'c' ? v + 273.15 : (v + 459.67) * (5 / 9),
      c = k - 273.15,
      scales = { c: from === 'c' ? v : c, f: from === 'f' ? v : c * 1.8 + 32, k };
    if (!Object.values(scales).every(Number.isFinite)) {
      invalid(
        'A converted scale exceeds the supported numeric range. Reduce the magnitude.|换算后的某个温标超出可表示数值范围，请减小数值幅度。',
      );
      return;
    }
    $('result').textContent = fmt(scales[to]) + unit(to);
    $('chipBase').textContent = fmt(scales.c) + ' °C';
    $('chipInv').textContent = fmt(k) + ' K';
    $('tblRows').innerHTML = ['c', 'f', 'k']
      .map((id) => '<tr><td>' + unit(id) + '</td><td class="num">' + fmt(scales[id]) + '</td></tr>')
      .join('');
    $('verdict').className = 'verdict';
    $('verdictText').textContent = say(
      'Valid temperature: {0} K is at or above absolute zero.|有效温度：{0} K 不低于绝对零度。',
      [fmt(k)],
    );
    window.__summary = say(
      'Temperature: {0} = {1}; {2} °C, {3} K.|温度：{0} = {1}；{2} °C，{3} K。',
      [fmt(v) + unit(from), fmt(scales[to]) + unit(to), fmt(scales.c), fmt(k)],
    );
  }
  inputs.forEach((e) => e.addEventListener('input', render));
  render();
})();
