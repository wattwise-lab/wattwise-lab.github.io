(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    inputs = [$('a'), $('b'), $('c')],
    num = (n, digits = 12) =>
      (n === 0 ? 0 : n).toLocaleString(I?.formatLocale || 'en-US', {
        maximumSignificantDigits: digits,
        useGrouping: false,
        ...(n !== 0 && (Math.abs(n) < 1e-7 || Math.abs(n) >= 1e12)
          ? { notation: 'scientific' }
          : {}),
      }),
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]);
  function decimal(raw) {
    if (raw.length > 200) return null;
    const m = raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
    if (!m) return null;
    const fraction = m[3] ?? m[4] ?? '',
      n = BigInt((m[2] || '0') + fraction) * (m[1] === '-' ? -1n : 1n),
      value = Number(raw);
    if (!Number.isFinite(value) || (n !== 0n && value === 0)) return null;
    return { n, e: n === 0n ? 0 : Number(m[5] || 0) - fraction.length, value };
  }
  function discriminant(a, b, c) {
    const p = b.n * b.n,
      q = 4n * a.n * c.n,
      ep = p === 0n ? 0 : 2 * b.e,
      eq = q === 0n ? 0 : a.e + c.e,
      e = Math.min(ep, eq),
      n = p * 10n ** BigInt(ep - e) - q * 10n ** BigInt(eq - e),
      value = Number(n.toString() + 'e' + e);
    return n !== 0n && value === 0 ? NaN : value;
  }
  function invalid(pair) {
    for (const id of ['result', 'chipDisc', 'chipVertex']) $(id).textContent = '—';
    $('verdict').className = 'verdict warn';
    $('verdictText').textContent = say(pair);
    window.__summary = '';
  }
  const halfRatio = (n, d) => (n / 2 !== 0 ? n / 2 / d : n / d / 2);
  function render() {
    const coefficients = inputs.map((e) => decimal(e.value.trim()));
    if (coefficients.some((x) => !x)) {
      invalid(
        'Enter finite decimal coefficients, using at most 200 characters per value.|请输入有限十进制系数，每个值最多 200 个字符。',
      );
      return;
    }
    const [a, b, c] = coefficients.map((x) => x.value);
    if (a === 0) {
      const root = b !== 0 ? -c / b : 0;
      if (!Number.isFinite(root) || (c !== 0 && b !== 0 && root === 0)) {
        invalid(
          'The result is outside the supported numeric range. Rescale the coefficients.|结果超出可表示数值范围，请对系数进行缩放。',
        );
        return;
      }
      $('result').textContent =
        b !== 0
          ? say('Linear: x = {0}|一次方程：x = {0}', [num(root)])
          : say(c === 0 ? 'Every real x|任意实数 x' : 'No solution|无解');
      $('chipDisc').textContent = '—';
      $('chipVertex').textContent = '—';
      $('verdict').className = 'verdict warn';
      $('verdictText').textContent = say(
        'With a = 0, this is a linear or constant equation, not a quadratic.|当 a = 0 时，这是一次方程或常数等式，不是二次方程。',
      );
      window.__summary = $('result').textContent;
      return;
    }
    const d = discriminant(...coefficients),
      vertex = -halfRatio(b, a);
    if (!Number.isFinite(d) || !Number.isFinite(vertex) || (b !== 0 && vertex === 0)) {
      invalid(
        'The discriminant or vertex is outside the supported numeric range. Rescale the coefficients.|判别式或顶点超出可表示数值范围，请对系数进行缩放。',
      );
      return;
    }
    let result, verdict;
    if (d > 0) {
      const q = -b / 2 - ((b < 0 ? -1 : 1) * Math.sqrt(d)) / 2,
        r1 = q / a,
        r2 = c === 0 ? 0 : c / q;
      if (![r1, r2].every(Number.isFinite) || (q !== 0 && r1 === 0) || (c !== 0 && r2 === 0)) {
        invalid(
          'A root is outside the supported numeric range. Rescale the coefficients.|某个根超出可表示数值范围，请对系数进行缩放。',
        );
        return;
      }
      if (r1 === r2) {
        invalid(
          'The roots are too close to distinguish at the supported precision. Use a higher-precision method.|两个根过于接近，超出当前精度的区分能力，请使用更高精度方法。',
        );
        return;
      }
      const roots = [r1, r2].sort((x, y) => y - x),
        digits = num(r1) === num(r2) ? 17 : 12;
      result = 'x = ' + num(roots[0], digits) + ', ' + num(roots[1], digits);
      verdict =
        'Two distinct real roots: the parabola crosses the x-axis twice.|两个不同实根：抛物线与 x 轴相交两次。';
    } else if (d === 0) {
      result = 'x = ' + num(vertex);
      verdict =
        'One repeated root: the parabola just touches the x-axis at its vertex.|一个重根：抛物线在顶点与 x 轴相切。';
    } else {
      const imaginary = halfRatio(Math.sqrt(-d), Math.abs(a));
      if (!Number.isFinite(imaginary) || imaginary === 0) {
        invalid(
          'A complex component is outside the supported numeric range. Rescale the coefficients.|复数分量超出可表示数值范围，请对系数进行缩放。',
        );
        return;
      }
      result = 'x = ' + num(vertex) + ' ± ' + num(imaginary) + 'i';
      verdict =
        'No real roots: the parabola never crosses the x-axis. The two roots are complex conjugates.|没有实根：抛物线不与 x 轴相交，两个根为共轭复数。';
    }
    $('result').textContent = result;
    $('chipDisc').textContent = num(d);
    $('chipVertex').textContent = num(vertex);
    $('verdict').className = 'verdict';
    $('verdictText').textContent = say(verdict);
    window.__summary = result;
  }
  inputs.forEach((e) => e.addEventListener('input', render));
  render();
})();
