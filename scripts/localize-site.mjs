import fs from 'node:fs/promises';
import vm from 'node:vm';
import { load } from 'cheerio';
import { secureMarkup } from './site-metadata.mjs';

const origin = 'https://calcmintly.com';
const escapeXml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export async function localizeSite(root, catalog, pages, selected) {
  const context = { window: {}, URL };
  for (const file of [
    'cm-data-core.js',
    'cm-locale-core.js',
    'cm-metadata-core.js',
    'cm-info-metadata.js',
    'cm-ui-copy.js',
    'cm-keypad-copy.js',
    'cm-home-copy-v3.js',
    'cm-legacy-copy.js',
  ])
    vm.runInNewContext(await fs.readFile(new URL('assets/' + file, root), 'utf8'), context);
  for (const locale of context.window.CMLocaleRoutes.locales)
    vm.runInNewContext(
      await fs.readFile(new URL('assets/merchant-i18n/' + locale + '.js', root), 'utf8'),
      context,
    );
  const routes = context.window.CMLocaleRoutes;
  const locales = routes.locales;
  const dictionaries = {};
  const manifest = JSON.parse(await fs.readFile(new URL('src/asset-manifest.json', root), 'utf8'));
  for (const locale of locales.filter((x) => x !== 'en'))
    dictionaries[locale] = JSON.parse(
      await fs.readFile(new URL('src/translations/' + locale + '.json', root), 'utf8'),
    );
  const explicit = new Map(
    Object.entries(context.window.CMUiCopy.en)
      .filter(([, v]) => typeof v === 'string')
      .map(([k, v]) => [v, k]),
  );
  const translate = (source, locale) => {
    const text = source.trim().replace(/\s+/g, ' ');
    if (!text || locale === 'en' || /^(?:https?:\/\/\S+|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(text))
      return source;
    const key = explicit.get(text);
    const target = (key && context.window.CMUiCopy[locale]?.[key]) || dictionaries[locale][text];
    return target ? source.match(/^\s*/)[0] + target + source.match(/\s*$/)[0] : source;
  };
  const output = [],
    routeRecords = [];
  for (const page of pages) {
    const source = await fs.readFile(new URL(page.file, root), 'utf8');
    const sourceDocument = load(source);
    const sourceName = page.name || sourceDocument('h1').text().trim();
    const sourcePurpose =
      page.purpose || sourceDocument('meta[name=description]').attr('content') || '';
    const sourceTitle = sourceDocument('title').text();
    for (const locale of locales.filter((x) => !selected || selected.includes(x))) {
      const $ = load(source),
        canonical = origin + routes.path(page.path, locale);
      if (page.path === '/directory') {
        const copy = context.window.CMHomeCopy[locale],
          categoryName = (domain) => (domain === 'all' ? copy.all : copy.domains[domain]),
          categoryCount = (domain) =>
            domain === 'all'
              ? catalog.length
              : catalog.filter((tool) => tool.domain === domain).length;
        $('.category[data-domain]').each((_, element) => {
          const domain = $(element).attr('data-domain');
          $(element).find('span').text(categoryName(domain));
          $(element).find('small').text(categoryCount(domain));
        });
        $('#category-mobile option').each((_, element) => {
          const domain = $(element).attr('value');
          $(element).text(categoryName(domain) + ' · ' + categoryCount(domain));
        });
      }
      $('script[data-cm-locale-dictionary]').remove();
      $('script[data-cm-merchant-dictionary]').remove();
      if (page.path === '/merchant-profit-planner') {
        if (locale !== 'en')
          $('script[defer]')
            .first()
            .before(
              $('<script>')
                .attr('defer', '')
                .attr('data-cm-merchant-dictionary', locale)
                .attr('src', '/assets/merchant-i18n/' + locale + '.js'),
            );
        const copy = context.window.CMMerchantCopy[locale];
        $('[data-t]').each((_, e) => {
          const value = copy[$(e).attr('data-t')];
          if (typeof value === 'string') $(e).text(value);
        });
        $('[data-aria]').each((_, e) => {
          const value = copy[$(e).attr('data-aria')];
          if (typeof value === 'string') $(e).attr('aria-label', value);
        });
      }
      if (locale !== 'en')
        $('script[defer]')
          .first()
          .before(
            $('<script>')
              .attr('defer', '')
              .attr('data-cm-locale-dictionary', locale)
              .attr('src', manifest['assets/translations/' + locale + '.js']),
          );
      $('html')
        .attr('lang', locale)
        .attr('dir', ['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr')
        .attr('data-cm-localized-routes', '');
      // Each translated text node keeps its exact source. A surrounding element can
      // still replace its contents normally; that also removes the obsolete source.
      const nodes = [];
      function walk(node) {
        if (node.type === 'text') nodes.push(node);
        for (const child of node.children || []) walk(child);
      }
      $('body').each((_, element) => walk(element));
      for (const node of nodes) {
        const parent = $(node.parent);
        if (
          parent.closest(
            'script,style,code,pre,textarea,svg,[data-cm-no-translate],[data-cm-tool-slug],[data-cm-i18n],[data-cm-pair],[data-cm-language],[data-t],.kp-value,.kp-expression,.metric strong',
          ).length
        )
          continue;
        const target = translate(node.data, locale);
        if (target === node.data) continue;
        const span = $('<span>').attr('data-cm-source', node.data).text(target);
        $(node).replaceWith(span);
      }
      $('[data-cm-i18n]').each((_, element) => {
        const key = $(element).attr('data-cm-i18n');
        $(element).text(
          context.window.CMUiCopy[locale]?.[key] ??
            context.window.CMHomeCopy[locale]?.[key] ??
            context.window.CMUiCopy.en[key] ??
            context.window.CMHomeCopy.en[key] ??
            key,
        );
      });
      $('[data-cm-pair]').each((_, element) => {
        const [en, zh] = $(element).attr('data-cm-pair').split('|');
        $(element).text(locale === 'zh-CN' ? zh || en : translate(en, locale));
      });
      $('[data-cm-value]').each((_, element) => {
        const e = $(element),
          value = Number(e.attr('data-cm-value')),
          digits = Number(e.attr('data-cm-significant-digits'));
        if (!Number.isFinite(value)) return;
        const options = {
          maximumSignificantDigits:
            Number.isInteger(digits) && digits >= 1 && digits <= 21 ? digits : 12,
          ...(e.attr('data-cm-notation') === 'scientific' ? { notation: 'scientific' } : {}),
        };
        const number = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, options).format(
            Object.is(value, -0) ? 0 : value,
          ),
          sourceUnit = e.attr('data-cm-unit'),
          unit = sourceUnit
            ? context.CMData.unit(
                sourceUnit,
                value,
                locale,
                (source) => translate(source, locale),
                (key) =>
                  context.window.CMUiCopy[locale]?.[key] ?? context.window.CMUiCopy.en[key] ?? key,
              )
            : '';
        e.text(number + (unit ? ' ' + unit : ''));
      });
      $('[placeholder],[aria-label],[alt]').each((_, element) => {
        const e = $(element);
        if (e.closest('[data-cm-no-translate],[data-cm-language],[data-aria]').length) return;
        for (const attribute of ['placeholder', 'aria-label', 'alt']) {
          const value = e.attr(attribute);
          if (value == null) continue;
          const translated = translate(value, locale);
          if (value !== translated)
            e.attr('data-cm-source-' + attribute, value).attr(attribute, translated);
        }
      });
      $('[data-cm-language] option')
        .removeAttr('selected')
        .filter((_, element) => $(element).attr('value') === locale)
        .attr('selected', '');
      $('a[href]').each((_, element) => {
        const e = $(element),
          href = e.attr('href');
        if (!href || href.startsWith('#') || e.is('[download]')) return;
        e.attr('href', routes.url(e.attr('data-cm-href') || href, locale, origin));
      });
      const tool = catalog.find((x) => page.path === '/' + x.slug);
      if (page.path === '/directory') {
        const copy = context.window.CMHomeCopy[locale],
          number = (n) => new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).format(n);
        const format = (key, values) =>
          Object.entries(values).reduce(
            (s, [k, v]) => s.replaceAll('{' + k + '}', number(v)),
            copy[key],
          );
        $('[data-t]').each((_, element) => {
          const value = copy[$(element).attr('data-t')];
          if (typeof value === 'string') $(element).text(value);
        });
        $('#result-count')
          .attr('data-cm-no-translate', '')
          .text(format('count', { start: 1, end: 12, count: catalog.length }));
        $('#page-position')
          .attr('data-cm-no-translate', '')
          .text(format('page', { page: 1, pages: Math.ceil(catalog.length / 12) }));
        $('.category').each((_, element) => {
          const domain = $(element).attr('data-domain');
          $(element)
            .find('span')
            .text(domain === 'all' ? copy.all : copy.domains[domain]);
        });
        $('#category-mobile option').each((_, element) => {
          const domain = $(element).attr('value');
          $(element).text(
            (domain === 'all' ? copy.all : copy.domains[domain]) +
              ' · ' +
              number(
                domain === 'all'
                  ? catalog.length
                  : catalog.filter((x) => x.domain === domain).length,
              ),
          );
        });
        $('#search').attr('placeholder', copy.search).attr('aria-label', copy.searchLabel);
        $('#sort').attr('aria-label', copy.sort);
      }
      $('[data-cm-tool-slug]').each((_, element) => {
        const item = catalog.find((x) => x.slug === $(element).attr('data-cm-tool-slug'));
        if (item)
          $(element).text(
            locale === 'en' ? item.name : item.names?.[locale] || translate(item.name, locale),
          );
      });
      if (tool)
        $('h1').text(
          locale === 'en' ? tool.name : tool.names?.[locale] || translate(tool.name, locale),
        );
      const name =
        locale === 'en'
          ? page.name || $('h1').text().trim()
          : tool?.names?.[locale] || translate(sourceName, locale);
      const purpose = sourcePurpose;
      const metadata = context.window.CMMetadata.forPage(
        name,
        translate(purpose, locale),
        (value) => translate(value, locale),
        locale,
      );
      const title =
        locale === 'en'
          ? sourceTitle
          : context.window.CMInfoMetadata[page.path]
            ? translate(context.window.CMInfoMetadata[page.path].title, locale)
            : metadata.title;
      const description =
        locale === 'en'
          ? $('meta[name=description]').attr('content')
          : context.window.CMInfoMetadata[page.path]
            ? translate(context.window.CMInfoMetadata[page.path].description, locale)
            : metadata.description;
      $('title').text(title);
      $('body')
        .attr('data-cm-title-en', sourceTitle)
        .attr('data-cm-page-name', sourceName)
        .attr('data-cm-page-purpose', purpose)
        .attr('data-cm-description-en', sourceDocument('meta[name=description]').attr('content'))
        .attr('data-cm-page-kind', tool ? 'calculator' : 'info');
      $(
        'meta[name=description],meta[property="og:description"],meta[name="twitter:description"]',
      ).attr('content', description);
      $('meta[property="og:title"],meta[name="twitter:title"]').attr('content', title);
      $('link[rel=canonical]').attr('href', canonical);
      $('meta[property="og:url"]').attr('content', canonical);
      $('meta[property="og:locale"]').remove();
      $('head').append(
        $('<meta>').attr('property', 'og:locale').attr('content', locale.replace('-', '_')),
      );
      $('link[rel=alternate][hreflang]').remove();
      if (page.path !== '/404') {
        for (const alternate of locales)
          $('head').append(
            $('<link>')
              .attr('rel', 'alternate')
              .attr('hreflang', alternate)
              .attr('href', origin + routes.path(page.path, alternate)),
          );
        $('head').append(
          $('<link>')
            .attr('rel', 'alternate')
            .attr('hreflang', 'x-default')
            .attr('href', origin + page.path),
        );
      }
      $('script[type="application/ld+json"]').each((_, element) => {
        const e = $(element),
          schema = JSON.parse(e.html());
        e.attr('data-cm-schema-source', e.html());
        function localize(value, key) {
          if (Array.isArray(value)) return value.map((x) => localize(x, key));
          if (value && typeof value === 'object')
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, k)]));
          if (typeof value !== 'string' || key.startsWith('@')) return value;
          if (['url', 'item', 'mainEntityOfPage'].includes(key) && value.startsWith(origin))
            return origin + routes.url(value, locale, origin);
          if (['name', 'description', 'text'].includes(key)) return translate(value, locale);
          return value;
        }
        const localized = localize(schema, '');
        if (['WebApplication', 'SoftwareApplication', 'WebSite'].includes(schema['@type']))
          localized.inLanguage = locale;
        e.text(JSON.stringify(localized).replaceAll('<', '\\u003c'));
      });
      const file =
        locale === 'en'
          ? page.file
          : locale.toLowerCase() + '/' + (page.path === '/' ? 'index.html' : page.file);
      await fs.mkdir(new URL(file.slice(0, file.lastIndexOf('/') + 1) || './', root), {
        recursive: true,
      });
      await fs.writeFile(new URL(file, root), $.html());
      output.push(file);
      routeRecords.push({
        file,
        path: routes.path(page.path, locale),
        locale,
        indexable: page.path !== '/404',
      });
    }
  }
  await secureMarkup(root, output);
  if (!selected) {
    const groups = pages
      .filter((page) => page.path !== '/404')
      .map((page) =>
        locales
          .map(
            (locale) =>
              '<url><loc>' +
              origin +
              routes.path(page.path, locale) +
              '</loc>' +
              locales
                .map(
                  (alternate) =>
                    '<xhtml:link rel="alternate" hreflang="' +
                    alternate +
                    '" href="' +
                    origin +
                    routes.path(page.path, alternate) +
                    '"/>',
                )
                .join('') +
              '<xhtml:link rel="alternate" hreflang="x-default" href="' +
              origin +
              page.path +
              '"/></url>',
          )
          .join(''),
      );
    await fs.writeFile(
      new URL('sitemap.xml', root),
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
        groups.join('') +
        '</urlset>\n',
    );
    await fs.writeFile(
      new URL('robots.txt', root),
      'User-agent: *\nAllow: /\nDisallow: /embed/\n\nSitemap: ' + origin + '/sitemap.xml\n',
    );
    await fs.writeFile(
      new URL('_redirects', root),
      '/en / 301\n/en/ / 301\n/en/* /:splat 301\n/zh-CN /zh-cn/ 301\n/zh-CN/ /zh-cn/ 301\n/zh-CN/* /zh-cn/:splat 301\n',
    );
    await fs.writeFile(
      new URL('src/locale-routes.json', root),
      JSON.stringify(routeRecords, null, 2) + '\n',
    );
  }
  return { files: output.length, locales: selected || locales, routeRecords };
}

// XML escaping is exported for the route/sitemap integrity checks.
export { escapeXml };
