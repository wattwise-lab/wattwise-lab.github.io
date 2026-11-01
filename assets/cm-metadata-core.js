(function (root) {
  'use strict';
  const titleParts = [
    'Free online calculator',
    'Results and formulas',
    'Worked examples',
    'Local calculation',
    'Editable inputs',
    'No account required',
  ];
  const descriptionParts = [
    'Calculate directly in your browser.',
    'No account is required.',
    'Check your inputs and units.',
    'Review the formula and limitations.',
    'See a worked example.',
    'Compare editable assumptions.',
    'Use this tool on a phone, tablet or desktop.',
    'Explore the full calculator library.',
    'Free to use.',
    'Local calculation.',
    'Available free of charge.',
  ];
  function shorten(value, limit) {
    if (value.length <= limit) return value;
    const clipped = value.slice(0, limit - 1);
    const space = clipped.lastIndexOf(' ');
    return (space > limit * 0.7 ? clipped.slice(0, space) : clipped).trimEnd() + '…';
  }
  function fit(base, additions, minimum, maximum, separator) {
    let states = new Map([[base.length, base]]);
    for (const addition of additions) {
      for (const [, text] of [...states]) {
        const next = text + separator + addition;
        if (next.length <= maximum && !states.has(next.length)) states.set(next.length, next);
      }
    }
    const found = [...states]
      .filter(([length]) => length >= minimum && length <= maximum)
      .sort(
        ([a], [b]) => Math.abs(a - (minimum + maximum) / 2) - Math.abs(b - (minimum + maximum) / 2),
      );
    return found[0]?.[1] || base;
  }
  function forPage(name, purpose, translate = (value) => value, locale = 'en') {
    const brand = ' | CalcMintly',
      limit = 60 - brand.length;
    const shortName = shorten(name, limit);
    const title =
      fit(shortName, titleParts.map(translate), 50 - brand.length, limit, ' · ') + brand;
    const cleanPurpose = purpose.trim().replace(/[。.!]+$/, '');
    const east = ['zh-CN', 'ja'].includes(locale);
    let base = name + (east ? '。' : '. ') + cleanPurpose + (east ? '。' : '.');
    if (base.length > 160)
      base =
        cleanPurpose.length <= 155
          ? cleanPurpose + (east ? '。' : '.')
          : name + (east ? '。' : '.');
    base = shorten(base, 155);
    const description = fit(base, descriptionParts.map(translate), 150, 160, east ? '' : ' ');
    return { title, description };
  }
  root.CMMetadata = { forPage, titleParts, descriptionParts };
})(typeof window === 'undefined' ? globalThis : window);
