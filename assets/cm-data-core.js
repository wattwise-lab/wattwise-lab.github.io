/* Strict list parsing shared by old and new statistics tools. */
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
  return { digits, list, displayNumber, expression };
})();
