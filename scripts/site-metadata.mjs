import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import vm from 'node:vm';
export function titleFor(name) {
  const candidates = [];
  for (const prefix of ['', 'Free ', 'Online ', 'Free Online '])
    for (const suffix of [
      ' | CalcMintly',
      ': Formula & Examples | CalcMintly',
      ': Results, Formula & Examples | CalcMintly',
      ': Clear Results & Guide | CalcMintly',
    ])
      candidates.push(prefix + name + suffix);
  return (
    candidates
      .filter((s) => s.length >= 50 && s.length <= 60)
      .sort((a, b) => Math.abs(a.length - 55) - Math.abs(b.length - 55))[0] ||
    name + ' | CalcMintly'
  );
}
export function descriptionFor(name, purpose = '') {
  let base = name + '. ' + purpose.replace(/[.。]$/, '') + '.';
  if (base.length > 155) base = purpose;
  if (base.length > 155 || base.length < 20) base = name + '.';
  const additions = [
    'Free.',
    'Local.',
    'No login.',
    'Free to use.',
    'No signup is needed.',
    'Review the formula and limits.',
    'See a worked example.',
    'Check input units.',
    'Use editable inputs.',
    'Calculates in your browser.',
    'Compare your assumptions.',
  ];
  let best = null;
  for (let mask = 0; mask < 1 << additions.length; mask++) {
    const chosen = additions.filter((_, k) => mask & (1 << k)),
      text = [base, ...chosen].join(' ');
    if (
      text.length >= 150 &&
      text.length <= 160 &&
      (!best ||
        chosen.length < best.count ||
        (chosen.length === best.count &&
          Math.abs(text.length - 155) < Math.abs(best.text.length - 155)))
    )
      best = { text, count: chosen.length };
  }
  return best?.text || base;
}
export async function finishMetadata(root, catalog) {
  const read = (f) => fs.readFile(new URL(f, root), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(await read('assets/cm-info-metadata.js'), context);
  const info = context.window.CMInfoMetadata;
  const pages = [
    ...catalog.map((t) => ({
      file: t.slug + '.html',
      path: '/' + t.slug,
      name: t.name,
      purpose: t.description,
    })),
    ...[
      'directory',
      'workspace',
      'ranking',
      'about',
      'methodology',
      'privacy',
      'terms',
      'contact',
      'updates',
      '404',
    ].map((slug) => ({ file: slug + '.html', path: '/' + slug })),
    { file: 'index.html', path: '/' },
  ];
  for (const page of pages) {
    if (info[page.path])
      Object.assign(page, info[page.path], {
        name: info[page.path].title.replace(/ \| CalcMintly$/, ''),
        purpose: info[page.path].description,
      });
    const $ = load(await read(page.file)),
      name = page.name || $('h1').first().text().trim(),
      title = page.title || titleFor(name),
      description =
        page.description ||
        descriptionFor(
          page.name || name,
          page.purpose || $('meta[name=description]').attr('content') || '',
        );
    function meta(key, value, property = false) {
      const attr = property ? 'property' : 'name';
      $('meta[' + attr + '="' + key + '"]').remove();
      $('head').append($('<meta>').attr(attr, key).attr('content', value));
    }
    for (const [key, value] of [
      ['description', description],
      ['twitter:title', title],
      ['twitter:description', description],
      ['twitter:card', 'summary_large_image'],
      ['robots', page.path === '/404' ? 'noindex,follow' : 'index,follow'],
    ])
      meta(key, value);
    for (const [key, value] of [
      ['og:title', title],
      ['og:description', description],
      ['og:url', 'https://calcmintly.com' + page.path],
      ['og:type', 'website'],
      ['og:locale', 'en'],
    ])
      meta(key, value, true);
    $('link[rel=canonical]').remove();
    $('head').append(
      $('<link rel="canonical">').attr('href', 'https://calcmintly.com' + page.path),
    );
    $('title').text(title);
    $('body').attr('data-cm-title-en', title);
    $(
      'meta[name=description],meta[property="og:description"],meta[name="twitter:description"]',
    ).attr('content', description);
    $('meta[property="og:title"],meta[name="twitter:title"]').attr('content', title);
    $('link[rel=canonical]').attr('href', 'https://calcmintly.com' + page.path);
    $('meta[property="og:url"]').attr('content', 'https://calcmintly.com' + page.path);
    $('meta[property^="og:image"],meta[name="twitter:image"]').remove();
    $('head').append(
      '<meta property="og:image" content="https://calcmintly.com/assets/share-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="CalcMintly calculator library"><meta name="twitter:image" content="https://calcmintly.com/assets/share-card.png">',
    );
    if (page.path !== '/' && page.path !== '/404') {
      $('script[data-cm-breadcrumb]').remove();
      $('head').append(
        '<script type="application/ld+json" data-cm-breadcrumb>' +
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'CalcMintly',
                item: 'https://calcmintly.com/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name,
                item: 'https://calcmintly.com' + page.path,
              },
            ],
          }).replaceAll('<', '\\u003c') +
          '</script>',
      );
    }
    if (page.path === '/') {
      $('script[data-cm-organization]').remove();
      $('head').append(
        '<script type="application/ld+json" data-cm-organization>' +
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'CalcMintly',
            url: 'https://calcmintly.com/',
            logo: 'https://calcmintly.com/assets/cm-mark-v3.svg',
          }) +
          '</script>',
      );
    }
    if (page.path === '/404') {
      $('meta[name=robots]').remove();
      $('head').append('<meta name="robots" content="noindex,follow">');
    }
    await fs.writeFile(new URL(page.file, root), $.html());
  }
  return pages;
}
export async function secureMarkup(root, files) {
  const cache = new Map();
  const context = { window: {} };
  vm.runInNewContext(await fs.readFile(new URL('assets/cm-ui-copy.js', root), 'utf8'), context);
  for (const file of files) {
    const $ = load(await fs.readFile(new URL(file, root), 'utf8')),
      hashes = [];
    const noScript =
      context.window.CMUiCopy[$('html').attr('lang')]?.jsRequired ||
      context.window.CMUiCopy.en.jsRequired;
    $('noscript').remove();
    $('body').prepend(
      '<noscript><p class="cm-no-script">' +
        String(noScript).replaceAll('&', '&amp;').replaceAll('<', '&lt;') +
        '</p></noscript>',
    );
    for (const script of $('script').toArray()) {
      const e = $(script),
        src = e.attr('src');
      let content;
      if (src) {
        if (!src.startsWith('/')) throw Error('Script must be self-hosted: ' + file + ' ' + src);
        const path = src.split('?')[0].slice(1);
        if (!cache.has(path)) cache.set(path, await fs.readFile(new URL(path, root)));
        content = cache.get(path);
      } else content = Buffer.from(e.html() || '');
      const hash = 'sha256-' + createHash('sha256').update(content).digest('base64');
      hashes.push("'" + hash + "'");
      if (src) e.attr('integrity', hash);
    }
    $('meta[http-equiv]')
      .filter((_, e) => $(e).attr('http-equiv').toLowerCase() === 'content-security-policy')
      .remove();
    const csp =
      "default-src 'self'; script-src " +
      [...new Set(hashes)].join(' ') +
      " 'strict-dynamic' 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'";
    $('head meta[charset]').after(
      '<meta data-cm-csp http-equiv="Content-Security-Policy" content="' +
        csp.replaceAll('&', '&amp;').replaceAll('"', '&quot;') +
        '">',
    );
    await fs.writeFile(new URL(file, root), $.html());
  }
}
