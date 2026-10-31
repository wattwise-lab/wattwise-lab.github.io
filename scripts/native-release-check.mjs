import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const root = new URL('../', import.meta.url),
  read = (f) => fs.readFile(new URL(f, root), 'utf8');
const routes = JSON.parse(await read('src/locale-routes.json'));
assert.equal(routes.length, 10220);
assert.equal(new Set(routes.map((r) => r.path)).size, routes.length);
const known = new Set(routes.map((r) => r.path)),
  hashes = new Map(),
  failures = [],
  titles = new Map(),
  descriptions = new Map();
const byPath = new Map(routes.map((r) => [r.path, r]));
const priorities = JSON.parse(await read('src/selection-priority.json'));
let pages = 0,
  integrity = 0;
async function checkAssets($) {
  for (const e of $('script[src],link[rel=stylesheet],img[src]').toArray()) {
    const el = $(e),
      path = (el.attr('src') || el.attr('href')).split('?')[0];
    assert.ok(path.startsWith('/'), 'self-hosted asset ' + path);
    if (!hashes.has(path)) {
      const bytes = await fs.readFile(new URL(path.slice(1), root));
      hashes.set(path, 'sha256-' + createHash('sha256').update(bytes).digest('base64'));
    }
    if (e.tagName === 'script') {
      assert.equal(el.attr('integrity'), hashes.get(path), 'SRI ' + path);
      integrity++;
    }
  }
}
for (const r of routes) {
  try {
    const $ = load(await read(r.file));
    assert.equal($('html').attr('lang'), r.locale);
    assert.equal($('html').attr('dir'), ['ar', 'ur'].includes(r.locale) ? 'rtl' : 'ltr');
    assert.equal($('h1').length, 1);
    assert.equal($('main#main-content').length, 1);
    assert.ok($('h1').text().trim());
    for (const element of $('a[href]').toArray()) {
      const href = $(element).attr('href');
      if (!href || href.startsWith('#') || /^(?:mailto:|tel:|data:)/.test(href)) continue;
      const u = new URL(href, 'https://calcmintly.com' + r.path);
      if (
        u.origin !== 'https://calcmintly.com' ||
        /^\/(?:assets|embed|scripts|src)\//.test(u.pathname) ||
        (/\.[a-z0-9]+$/i.test(u.pathname) && !u.pathname.endsWith('.html'))
      )
        continue;
      const path = u.pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
      assert.ok(known.has(path), 'internal target ' + path);
      assert.equal(byPath.get(path).locale, r.locale, 'locale-preserving target ' + path);
    }
    if (r.path.endsWith('/directory')) {
      const links = $('#cm-directory-all a[data-cm-tool-slug]');
      assert.equal(links.length, 500, 'complete static catalog');
      assert.equal(new Set(links.map((_, e) => $(e).attr('data-cm-tool-slug')).get()).size, 500);
      assert.deepEqual(
        $('#tool-grid [data-cm-tool-slug]')
          .map((_, e) => $(e).attr('data-cm-tool-slug'))
          .get(),
        priorities.slice(0, 12),
        'initial catalog follows editorial priority',
      );
    }
    if (/\/(?:age|countdown)-calculator$/.test(r.path)) {
      const optional = r.path.endsWith('/age-calculator') ? 'ref' : 'from';
      assert.equal($('#' + optional).attr('required'), undefined, 'today reference is optional');
      assert.ok($('#' + optional).is('[data-cm-optional]'));
    }
    if (r.locale === 'zh-CN' && r.path.endsWith('/gravel-base-calculator'))
      assert.equal(
        $('[data-cm-value][data-cm-unit="tonnes"]').text(),
        '3.84 吨',
        'Native unit before JavaScript',
      );
    if (r.locale === 'zh-CN' && r.path.endsWith('/run-walk-interval-calculator'))
      assert.equal(
        $('[data-cm-value="40"][data-cm-unit="minutes"]').text(),
        '40 分钟',
        'Native time unit before JavaScript',
      );
    if (r.locale === 'en' && r.path.endsWith('/tile-grout-calculator'))
      assert.equal(
        $('[data-cm-value][data-cm-unit="kg"]').text(),
        '3.4679 kg',
        'Readable measured example before JavaScript',
      );
    for (const element of $('[data-cm-i18n]').toArray()) {
      const key = $(element).attr('data-cm-i18n');
      assert.notEqual($(element).text().trim(), key, 'Unresolved UI key: ' + key);
    }
    assert.equal($('.cm-site-header').length, 1);
    assert.equal($('.cm-site-footer').length, 1);
    assert.equal($('#cm-site-language option').length, 20);
    assert.equal($('link[rel=canonical]').attr('href'), 'https://calcmintly.com' + r.path);
    assert.equal($('meta[property="og:url"]').attr('content'), 'https://calcmintly.com' + r.path);
    assert.equal($('link[rel=alternate][hreflang]').length, r.indexable ? 21 : 0);
    for (const a of $('link[rel=alternate][hreflang]').toArray()) {
      const u = new URL($(a).attr('href'));
      assert.ok(known.has(u.pathname), 'alternate target ' + u.pathname);
    }
    const title = $('title').text(),
      description = $('meta[name=description]').attr('content');
    assert.ok(title && description && title.includes('CalcMintly'));
    assert.ok(!/undefined|\{u\d+\}|\[\d{5}\]/.test(title + description));
    const titleKey = r.locale + ':' + title,
      descKey = r.locale + ':' + description;
    assert.ok(!titles.has(titleKey), 'duplicate title with ' + titles.get(titleKey));
    assert.ok(
      !descriptions.has(descKey),
      'duplicate description with ' + descriptions.get(descKey),
    );
    titles.set(titleKey, r.file);
    descriptions.set(descKey, r.file);
    for (const e of $('script[type="application/ld+json"]').toArray()) JSON.parse($(e).text());
    await checkAssets($);
    pages++;
  } catch (error) {
    failures.push({ file: r.file, error: error.message });
  }
}
const embedFiles = (await fs.readdir(new URL('embed/', root))).filter((f) => f.endsWith('.html'));
assert.equal(embedFiles.length, 501);
for (const file of embedFiles) {
  try {
    const $ = load(await read('embed/' + file));
    assert.ok($('meta[name=robots]').attr('content').includes('noindex'));
    assert.equal($('.cm-site-header,.cm-site-footer').length, 0);
    await checkAssets($);
  } catch (error) {
    failures.push({ file: 'embed/' + file, error: error.message });
  }
}
const sitemap = load(await read('sitemap.xml'), { xmlMode: true }),
  indexed = routes.filter((r) => r.indexable);
assert.equal(sitemap('url').length, indexed.length);
for (const e of sitemap('loc').toArray()) assert.ok(known.has(new URL(sitemap(e).text()).pathname));
const report = {
  routes: routes.length,
  passedPages: pages,
  embeds: embedFiles.length,
  integrityReferences: integrity,
  indexedRoutes: indexed.length,
  failures,
};
await fs.writeFile(
  new URL('src/native-structure-report.json', root),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify({ ...report, failures: failures.slice(0, 25) }, null, 2));
assert.equal(
  failures.length,
  0,
  'Native route/asset failures; see src/native-structure-report.json',
);
