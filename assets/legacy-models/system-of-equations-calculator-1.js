(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    inputs = [$('a1'), $('b1'), $('c1'), $('a2'), $('b2'), $('c2')],
    num = (n) =>
      n.toLocaleString(I?.formatLocale || 'en-US', {
        maximumSignificantDigits: 12,
        useGrouping: false,
        ...(n !== 0 && (Math.abs(n) < 1e-7 || Math.abs(n) >= 1e12)
          ? { notation: 'scientific' }
          : {}),
      }),
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]);
  function invalid(pair) {
    for (const id of ['result', 'chipDet', 'chipC1', 'chipC2']) $(id).textContent = '—';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(pair);
    window.__summary = '';
  }
  function classification(consistent, pair) {
    $('result').textContent = say(
      consistent ? 'Infinitely many solutions|无穷多解' : 'No solution|无解',
    );
    $('chipDet').textContent = num(0);
    $('chipC1').textContent = '—';
    $('chipC2').textContent = '—';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(pair);
    window.__summary = $('result').textContent + '. ' + $('verdictText').textContent;
  }
  function decimal(raw) {
    if (raw.length > 200) return null;
    const m = raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
    if (!m) return null;
    const fraction = m[3] ?? m[4] ?? '',
      n = BigInt((m[2] || '0') + fraction) * (m[1] === '-' ? -1n : 1n),
      value = Number(raw);
    if (!Number.isFinite(value) || (n !== 0n && value === 0)) return null;
    return { n, e: n === 0n ? 0 : Number(m[5] || 0) - fraction.length };
  }
  function determinant(a, b, c, d) {
    const p = a.n * b.n,
      q = c.n * d.n,
      ep = p === 0n ? 0 : a.e + b.e,
      eq = q === 0n ? 0 : c.e + d.e,
      e = Math.min(ep, eq),
      n = p * 10n ** BigInt(ep - e) - q * 10n ** BigInt(eq - e),
      value = Number(n.toString() + 'e' + e);
    return { n, value: n !== 0n && value === 0 ? NaN : value };
  }
  function render() {
    const raw = inputs.map((e) => e.value.trim()),
      exact = raw.map(decimal),
      values = raw.map(Number),
      [a1, b1, c1, a2, b2, c2] = values;
    if (exact.some((x) => !x)) {
      invalid(
        'Enter finite decimal coefficients in all six fields, using at most 200 characters per value.|请在六个框中填写有限十进制系数，每个值最多 200 个字符。',
      );
      return;
    }
    const zero1 = a1 === 0 && b1 === 0,
      zero2 = a2 === 0 && b2 === 0;
    if ((zero1 && c1 !== 0) || (zero2 && c2 !== 0)) {
      classification(
        false,
        'An equation has zero coefficients but a nonzero constant, so the constraints contradict each other.|某个方程的系数全为零，但常数不为零，因此条件矛盾。',
      );
      return;
    }
    if (zero1 || zero2) {
      classification(
        true,
        'A zero equation adds no constraint. The remaining consistent constraints do not determine a unique pair.|零方程不增加约束，其余相容条件无法确定唯一数对。',
      );
      return;
    }
    const determinants = [
        determinant(exact[0], exact[4], exact[3], exact[1]),
        determinant(exact[2], exact[4], exact[5], exact[1]),
        determinant(exact[0], exact[5], exact[3], exact[2]),
      ],
      [d, dx, dy] = determinants.map((x) => x.value);
    if (![d, dx, dy].every(Number.isFinite)) {
      invalid(
        'The determinants exceed the supported numeric range. Rescale the equations.|行列式超出可表示的数值范围，请对方程进行缩放。',
      );
      return;
    }
    if (d === 0) {
      classification(
        dx === 0 && dy === 0,
        dx === 0 && dy === 0
          ? 'The equations are dependent and consistent, so infinitely many pairs satisfy them.|两个方程相关且相容，因此有无穷多数对满足条件。'
          : 'The equations are inconsistent, so no pair satisfies both.|两个方程不相容，没有数对同时满足二者。',
      );
      return;
    }
    const x = dx / d,
      y = dy / d,
      lhs1 = a1 * x + b1 * y,
      lhs2 = a2 * x + b2 * y;
    if (![x, y, lhs1, lhs2].every(Number.isFinite)) {
      invalid(
        'The solution exceeds the supported numeric range. Rescale the equations.|解超出可表示的数值范围，请对方程进行缩放。',
      );
      return;
    }
    $('result').textContent = 'x = ' + num(x) + ', y = ' + num(y);
    $('chipDet').textContent = num(d);
    $('chipC1').textContent = num(lhs1) + ' = ' + num(c1);
    $('chipC2').textContent = num(lhs2) + ' = ' + num(c2);
    $('verdict').className = 'verdict';
    $('verdictText').textContent = say(
      'Computed pair: x = {0}, y = {1}. Check both equations; displayed values are rounded.|计算得到数对：x = {0}，y = {1}。请核对两个方程，显示值已作舍入。',
      [num(x), num(y)],
    );
    window.__summary = $('result').textContent;
  }
  inputs.forEach((e) => e.addEventListener('input', render));
  render();
})();
