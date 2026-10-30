window.CMI18n = (() => {
  'use strict';
  const languages = {
    en: 'English',
    'zh-CN': '简体中文',
    hi: 'हिन्दी',
    es: 'Español',
    ar: 'العربية',
    fr: 'Français',
    bn: 'বাংলা',
    pt: 'Português',
    id: 'Bahasa Indonesia',
    ur: 'اردو',
    ru: 'Русский',
    de: 'Deutsch',
    ja: '日本語',
    pcm: 'Nigerian Pidgin',
    mr: 'मराठी',
    vi: 'Tiếng Việt',
    te: 'తెలుగు',
    sw: 'Kiswahili',
    ha: 'Hausa',
    tr: 'Türkçe',
  };
  const supported = Object.keys(languages),
    normalize = (x) =>
      supported.includes(x)
        ? x
        : /^zh/i.test(x || '')
          ? 'zh-CN'
          : supported.includes(String(x || '').split('-')[0])
            ? x.split('-')[0]
            : null;
  let stored;
  try {
    stored = localStorage.getItem('calcmintly-language-v2');
  } catch {}
  const params = new URLSearchParams(location.search),
    pathLocale = location.pathname.split('/')[1];
  let lang =
    normalize(params.get('lang')) ||
    normalize(pathLocale) ||
    (document.documentElement.hasAttribute('data-cm-localized-routes') &&
      normalize(document.documentElement.lang)) ||
    normalize(stored) ||
    normalize(navigator.language) ||
    'en';
  const originalText = new WeakMap(),
    appliedText = new WeakMap(),
    originalAttrs = new WeakMap(),
    missing = new Set(),
    loads = new Map(),
    compiled = new Map(),
    memo = new Map();
  const oldEn = window.CMLegacyCopy?.en || {},
    reverse = new Map(Object.entries(oldEn).map(([zh, en]) => [en, zh]));
  const explicitKeys = new Map(
    Object.entries(window.CMUiCopy?.en || {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [value, key]),
  );
  function ensureTranslations(locale = lang) {
    if (locale === 'en' || window.CMTranslations?.[locale]) return Promise.resolve();
    if (loads.has(locale)) return loads.get(locale);
    const path = window.CMTranslationAssets?.[locale];
    if (!path) return Promise.resolve();
    const promise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = true;
      script.onload = () => {
        compiled.delete(locale);
        memo.delete(locale);
        if (lang === locale) {
          apply();
          translateTree(document.body);
          document.dispatchEvent(
            new CustomEvent('cm:translations', { detail: { language: locale } }),
          );
        }
        resolve();
      };
      script.onerror = () => resolve();
      document.head.append(script);
    });
    loads.set(locale, promise);
    return promise;
  }
  function dictionary() {
    const raw = window.CMTranslations?.[lang];
    if (!raw) return null;
    if (!compiled.has(lang))
      compiled.set(lang, {
        messages: raw.messages,
        templates: (raw.templates || []).map((x) => ({ ...x, regex: new RegExp(x.pattern, 'u') })),
      });
    return compiled.get(lang);
  }
  function t(key, values = {}) {
    const resolved = key === 'count' && Number(values.count) === 1 ? 'countOne' : key;
    let s =
      window.CMUiCopy?.[lang]?.[resolved] ??
      window.CMHomeCopy?.[lang]?.[resolved] ??
      window.CMUiCopy?.en?.[resolved] ??
      window.CMHomeCopy?.en?.[resolved] ??
      key;
    for (const [k, v] of Object.entries(values)) s = s.replaceAll('{' + k + '}', String(v));
    return s;
  }
  function translate(source) {
    if (!source || !source.trim()) return source;
    if (/^(?:https?:\/\/\S+|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(source.trim())) return source;
    const text = source.trim().replace(/\s+/g, ' '),
      pad = source.match(/^\s*/)[0],
      tail = source.match(/\s*$/)[0];
    let value;
    const explicit = explicitKeys.get(text);
    if (explicit) value = window.CMUiCopy?.[lang]?.[explicit];
    const data = dictionary();
    if (!value && data) {
      value = data.messages[text];
      if (!value && lang !== 'en') {
        if (!memo.has(lang)) memo.set(lang, new Map());
        const cache = memo.get(lang);
        if (cache.has(text)) value = cache.get(text);
        else {
          for (const template of data.templates) {
            const match = template.regex.exec(text);
            if (!match) continue;
            const parts = Object.fromEntries(
              template.indices.map((index, k) => [index, match[k + 1]]),
            );
            value = template.target.replace(/\{(\d+)\}/g, (whole, index) => parts[index] ?? whole);
            break;
          }
          if (cache.size > 5000) cache.clear();
          cache.set(text, value || null);
        }
      }
    }
    if (!value && lang === 'zh-CN' && /[\u3400-\u9fff]/.test(source)) return source;
    if (!value) {
      const key = reverse.get(text) || text;
      value = window.CMLegacyCopy?.[lang]?.[key];
    }
    if (!value && window.CMFieldCopy) value = window.CMFieldCopy[lang]?.[text];
    if (!value && lang !== 'en' && /[A-Za-z]{3}/.test(text)) missing.add(text);
    return pad + (value || text) + tail;
  }
  function pick(pair) {
    const [en, zh] = String(pair).split('|');
    return lang === 'zh-CN' ? zh || en : translate(en);
  }
  function message(source, values) {
    return pick(source).replace(/\{(\d+)\}/g, (whole, index) =>
      values[index] === undefined ? whole : String(values[index]),
    );
  }
  function number(value, options = {}) {
    const small = Number.isFinite(value) && value !== 0 && Math.abs(value) < 0.000001,
      large = Number.isFinite(value) && Math.abs(value) >= 1e16;
    return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
      ...(small || large ? { notation: 'scientific' } : {}),
      ...options,
    }).format(Object.is(value, -0) ? 0 : value);
  }
  function currency(value, code = 'USD', options = {}) {
    try {
      return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
        style: 'currency',
        currency: code,
        ...options,
      }).format(value);
    } catch {
      return String(value) + ' ' + code;
    }
  }
  function toolName(tool) {
    return tool?.names?.[lang] || translate(tool?.name || '');
  }
  function toolDescription(tool) {
    return tool?.descriptions?.[lang] || translate(tool?.description || '');
  }
  function searchText(tool) {
    return [
      toolName(tool),
      toolDescription(tool),
      tool.name,
      tool.description,
      ...Object.values(tool.names || {}),
      ...Object.values(tool.descriptions || {}),
      tool.keywords,
      tool.slug,
    ]
      .filter(Boolean)
      .join(' ');
  }
  function unit(source, value = 2) {
    const rateTime = (key) =>
      lang === 'zh-CN'
        ? { month: '月', year: '年', hour: '小时' }[key] || unit(key, 1)
        : lang === 'ja'
          ? { month: '月', year: '年', hour: '時間' }[key] || unit(key, 1)
          : unit(key, 1);
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
        return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
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
  function url(path, locale = lang) {
    if (document.documentElement.hasAttribute('data-cm-localized-routes') && window.CMLocaleRoutes)
      return window.CMLocaleRoutes.url(path, locale, location.origin);
    const u = new URL(path, location.origin);
    if (u.origin !== location.origin || /^(mailto|tel):/.test(path)) return path;
    const bits = u.pathname.split('/').filter(Boolean);
    if (bits.length === 0 || (bits.length === 1 && supported.includes(bits[0]))) {
      u.pathname = locale === 'en' ? '/' : '/' + locale + '/';
      u.searchParams.delete('lang');
    } else u.searchParams.set('lang', locale);
    return u.pathname + u.search + u.hash;
  }
  function updateMetadata() {
    const body = document.body;
    if (!body?.hasAttribute('data-cm-page-name') || !window.CMMetadata) return;
    const preferredName = window.CMCatalog?.find((tool) => tool.name === body.dataset.cmPageName)
      ?.names?.[lang];
    const metadata =
      lang === 'en'
        ? { title: body.dataset.cmTitleEn, description: body.dataset.cmDescriptionEn }
        : body.dataset.cmPageKind === 'info'
          ? {
              title: translate(body.dataset.cmTitleEn),
              description: translate(body.dataset.cmDescriptionEn),
            }
          : window.CMMetadata.forPage(
              preferredName || translate(body.dataset.cmPageName),
              translate(body.dataset.cmPagePurpose),
              translate,
              lang,
            );
    if (metadata.title) document.title = metadata.title;
    for (const element of document.querySelectorAll(
      'meta[property="og:title"],meta[name="twitter:title"]',
    ))
      element.content = metadata.title;
    if (metadata.description)
      for (const element of document.querySelectorAll(
        'meta[name=description],meta[property="og:description"],meta[name="twitter:description"]',
      ))
        element.content = metadata.description;
    const canonicalPath = body.dataset.cmCanonicalPath || location.pathname;
    const canonical = 'https://calcmintly.com' + url(canonicalPath, lang).split('?')[0];
    const canonicalLink = document.querySelector('link[rel=canonical]');
    if (canonicalLink) canonicalLink.href = canonical;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonical;
    for (const link of document.querySelectorAll('link[rel=alternate][hreflang]')) {
      const alternate = link.getAttribute('hreflang');
      link.href =
        'https://calcmintly.com' +
        url(location.pathname, alternate === 'x-default' ? 'en' : alternate).split('?')[0];
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = lang.replace('-', '_');
    for (const script of document.querySelectorAll('script[data-cm-schema-source]')) {
      const schema = JSON.parse(script.dataset.cmSchemaSource);
      function localize(value, key) {
        if (Array.isArray(value)) return value.map((x) => localize(x, key));
        if (value && typeof value === 'object')
          return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, k)]));
        if (typeof value !== 'string' || key.startsWith('@')) return value;
        if (
          ['url', 'item', 'mainEntityOfPage'].includes(key) &&
          value.startsWith('https://calcmintly.com')
        )
          return (
            'https://calcmintly.com' +
            url(value.replace('https://calcmintly.com', location.origin), lang)
          );
        return ['name', 'description', 'text'].includes(key) ? translate(value) : value;
      }
      const localized = localize(schema, '');
      if (['WebApplication', 'SoftwareApplication', 'WebSite'].includes(schema['@type']))
        localized.inLanguage = lang;
      const result = JSON.stringify(localized).replaceAll('<', '\\u003c');
      if (script.textContent !== result) script.textContent = result;
    }
  }
  function options(select) {
    select.replaceChildren(...supported.map((l) => new Option(languages[l], l)));
    select.value = lang;
    select.setAttribute('aria-label', t('language'));
  }
  function apply(root = document) {
    document.documentElement.lang = lang;
    document.documentElement.dir = ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr';
    const tools = new Map((window.CMCatalog || []).map((tool) => [tool.slug, tool]));
    root.querySelectorAll?.('[data-cm-tool-slug]').forEach((element) => {
      const tool = tools.get(element.dataset.cmToolSlug);
      if (tool) element.textContent = toolName(tool);
    });
    root.querySelectorAll?.('[data-cm-i18n]').forEach((e) => (e.textContent = t(e.dataset.cmI18n)));
    root
      .querySelectorAll?.('[data-cm-pair]')
      .forEach((e) => (e.textContent = pick(e.dataset.cmPair)));
    root
      .querySelectorAll?.('[data-cm-placeholder]')
      .forEach((e) => (e.placeholder = t(e.dataset.cmPlaceholder)));
    root
      .querySelectorAll?.('[data-cm-label]')
      .forEach((e) => e.setAttribute('aria-label', t(e.dataset.cmLabel)));
    root.querySelectorAll?.('[data-cm-href]').forEach((a) => (a.href = url(a.dataset.cmHref)));
    if (document.documentElement.hasAttribute('data-cm-localized-routes'))
      root.querySelectorAll?.('a[href]:not([data-cm-href]):not([download])').forEach((a) => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#')) a.href = url(href);
      });
    root.querySelectorAll?.('[data-cm-language]').forEach(options);
    root.querySelectorAll?.('[data-cm-value]').forEach((element) => {
      const value = Number(element.dataset.cmValue);
      if (Number.isFinite(value))
        element.textContent =
          number(value, { maximumSignificantDigits: 12 }) +
          (element.dataset.cmUnit ? ' ' + unit(element.dataset.cmUnit, value) : '');
    });
  }
  function translateTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          'script,style,noscript,code,pre,textarea,[data-cm-no-translate],[data-cm-tool-slug],[data-cm-i18n],[data-cm-pair],[data-t],.kp-value,.kp-expression,.metric strong',
        )
      )
        continue;
      let original = originalText.get(node);
      if (!original || (appliedText.has(node) && appliedText.get(node) !== node.textContent)) {
        original = parent.hasAttribute('data-cm-source')
          ? parent.getAttribute('data-cm-source')
          : node.textContent;
        originalText.set(node, original);
      }
      const value = translate(original);
      if (node.textContent !== value) node.textContent = value;
      appliedText.set(node, value);
    }
    root.querySelectorAll?.('[placeholder],[aria-label],[alt]').forEach((el) => {
      if (el.matches('[data-cm-language],[data-cm-placeholder],[data-cm-label],[data-aria]'))
        return;
      let originals = originalAttrs.get(el);
      if (!originals) {
        originals = {
          placeholder:
            el.getAttribute('data-cm-source-placeholder') ?? el.getAttribute('placeholder'),
          'aria-label':
            el.getAttribute('data-cm-source-aria-label') ?? el.getAttribute('aria-label'),
          alt: el.getAttribute('data-cm-source-alt') ?? el.getAttribute('alt'),
        };
        originalAttrs.set(el, originals);
      }
      for (const [k, v] of Object.entries(originals))
        if (v !== null) el.setAttribute(k, translate(v));
    });
  }
  function setLanguage(value, { navigate = false } = {}) {
    const next = normalize(value);
    if (!next) return;
    lang = next;
    try {
      localStorage.setItem('calcmintly-language-v2', lang);
    } catch {}
    if (navigate) {
      location.assign(url(location.href, lang));
      return;
    }
    const u = new URL(location.href);
    if (document.documentElement.hasAttribute('data-cm-localized-routes')) {
      const path = url(location.href, lang);
      history.replaceState(history.state, '', path);
    } else if (!supported.includes(u.pathname.split('/')[1])) {
      u.searchParams.set('lang', lang);
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    }
    apply();
    document.dispatchEvent(new CustomEvent('cm:language', { detail: { language: lang } }));
    ensureTranslations(lang);
  }
  function observe() {
    const root = document.querySelector('main,.wrap') || document.body;
    let queued = false;
    const observer = new MutationObserver((records) => {
      if (
        queued ||
        !records.some((record) => {
          const node =
            record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target;
          return !node.closest?.(
            'script,style,code,pre,textarea,input,[data-cm-no-translate],[data-cm-i18n],[data-cm-pair],[data-cm-value],.kp-value,.kp-expression',
          );
        })
      )
        return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        translateTree(root);
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    translateTree(root);
  }
  apply();
  ensureTranslations(lang);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
  return {
    languages,
    supported,
    normalize,
    get language() {
      return lang;
    },
    get formatLocale() {
      return lang === 'pcm' ? 'en-NG' : lang;
    },
    currency,
    toolName,
    toolDescription,
    searchText,
    t,
    translate,
    pick,
    message,
    number,
    unit,
    url,
    options,
    updateMetadata,
    apply,
    translateTree,
    setLanguage,
    ensureTranslations,
    missing,
  };
})();
