(function (root) {
  'use strict';
  const locales = [
    'en',
    'zh-CN',
    'hi',
    'es',
    'ar',
    'fr',
    'bn',
    'pt',
    'id',
    'ur',
    'ru',
    'de',
    'ja',
    'pcm',
    'mr',
    'vi',
    'te',
    'sw',
    'ha',
    'tr',
  ];
  function normalize(value) {
    return (
      locales.find((locale) => locale.toLowerCase() === String(value || '').toLowerCase()) || null
    );
  }
  function sourcePath(pathname) {
    const bits = pathname.split('/').filter(Boolean);
    if (normalize(bits[0])) bits.shift();
    if (bits.at(-1) === 'index.html') bits.pop();
    const result = '/' + bits.join('/');
    return result.replace(/\.html$/, '') || '/';
  }
  function path(pathname, locale) {
    const source = sourcePath(pathname),
      prefix = normalize(locale) || 'en';
    return (prefix === 'en' ? '' : '/' + prefix.toLowerCase()) + (source === '/' ? '/' : source);
  }
  function url(input, locale, origin) {
    const value = new URL(input, origin);
    if (value.origin !== origin || !/^https?:$/.test(value.protocol)) return input;
    const source = sourcePath(value.pathname);
    if (/^\/(?:assets|_next)(?:\/|$)/.test(source) || /\.[a-z0-9]+$/i.test(source))
      return value.pathname + value.search + value.hash;
    const embedded = source.startsWith('/embed/') || value.searchParams.has('embed');
    value.pathname = embedded ? source : path(source, locale);
    value.searchParams.delete('lang');
    if (embedded && locale !== 'en') value.searchParams.set('lang', normalize(locale) || 'en');
    return value.pathname + value.search + value.hash;
  }
  root.CMLocaleRoutes = { locales, normalize, sourcePath, path, url };
})(typeof window === 'undefined' ? globalThis : window);
