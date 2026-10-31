/* Numeric input and output shared by calculators and generated pages. */
var CMData = (() => {
  'use strict';
  function digits(value) {
    return String(value)
      .replace(/[٠-٩۰-۹०-९০-৯౦-౯]/g, (char) => {
        for (const zero of [0x660, 0x6f0, 0x966, 0x9e6, 0xc66]) {
          const n = char.codePointAt(0) - zero;
          if (n >= 0 && n <= 9) return String(n);
        }
        return char;
      })
      .replaceAll('٫', '.')
      .replaceAll('٬', '')
      .replaceAll('−', '-');
  }
  function list(source) {
    const tokens = digits(source)
      .trim()
      .split(/[\s,;，；]+/)
      .filter(Boolean);
    if (tokens.length < 1 || tokens.length > 1000)
      throw Error('Enter 1–1000 numbers.|请输入 1–1000 个数。');
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    if (!tokens.every((token) => decimal.test(token)))
      throw Error(
        'Every item must be a complete decimal number. Separate values with spaces, commas or semicolons.|每一项须为完整十进制数，以空格、逗号或分号分隔。',
      );
    const values = tokens.map(Number);
    if (!values.every(Number.isFinite))
      throw Error('Every number must be finite.|所有数值须为有限数字。');
    return values;
  }
  function displayNumber(source, locale = 'en') {
    let text = String(source).replace(/[\u061c\u200e\u200f]/g, '');
    const parts = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).formatToParts(
        1234567.89,
      ),
      group = parts.find((p) => p.type === 'group')?.value,
      decimal = parts.find((p) => p.type === 'decimal')?.value;
    if (group) text = text.replaceAll(group, '');
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    text = digits(text);
    const matches = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
    if (matches.length !== 1 || /NaN|Infinity|∞/.test(text)) return null;
    const value = Number(matches[0]);
    return Number.isFinite(value) ? value : null;
  }
  function expression(source, locale = 'en') {
    let text = digits(source);
    const decimal = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale)
      .formatToParts(1.1)
      .find((p) => p.type === 'decimal')?.value;
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    return text;
  }
  function resultNumberOptions(value, domain) {
    if (value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e12))
      return { maximumSignificantDigits: 8, notation: 'scientific' };
    const measured = domain === 'Health' || domain === 'Home and Everyday';
    return { maximumSignificantDigits: measured && !Number.isInteger(value) ? 6 : 12 };
  }
  function unit(source, value = 2, locale = 'en', translate = (s) => s, t = (s) => s) {
    const rateTime = (key) =>
      locale === 'zh-CN'
        ? { month: '月', year: '年', hour: '小时' }[key] || unit(key, 1, locale, translate, t)
        : locale === 'ja'
          ? { month: '月', year: '年', hour: '時間' }[key] || unit(key, 1, locale, translate, t)
          : unit(key, 1, locale, translate, t);
    const composite = String(source).match(/^([A-Z]{3})\/(month|year|hour|call|order)$/);
    if (composite)
      return (
        composite[1] +
        '/' +
        (composite[2] === 'call'
          ? t('unitCall')
          : composite[2] === 'order'
            ? t('unitOrder')
            : rateTime(composite[2]))
      );
    const count = String(source).match(/^(calls|orders)\/(month|year)$/);
    if (count)
      return (
        t(
          count[1] === 'calls'
            ? Number(value) === 1
              ? 'unitCall'
              : 'unitCalls'
            : Number(value) === 1
              ? 'unitOrder'
              : 'unitOrders',
        ) +
        '/' +
        rateTime(count[2])
      );
    const units = {
      weeks: 'week',
      week: 'week',
      years: 'year',
      year: 'year',
      months: 'month',
      month: 'month',
      days: 'day',
      day: 'day',
      hours: 'hour',
      hour: 'hour',
      minutes: 'minute',
      minute: 'minute',
      seconds: 'second',
      second: 'second',
      bits: 'bit',
      bytes: 'byte',
    };
    if (units[source])
      try {
        return new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, {
          style: 'unit',
          unit: units[source],
          unitDisplay: 'long',
        })
          .formatToParts(Math.abs(Number(value) || 0))
          .filter((x) => x.type === 'unit')
          .map((x) => x.value)
          .join(' ');
      } catch {}
    return translate(source);
  }
  return { digits, list, displayNumber, expression, resultNumberOptions, unit };
})();
