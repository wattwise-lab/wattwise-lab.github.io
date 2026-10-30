import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const root = new URL('../', import.meta.url),
  read = (f) => fs.readFile(new URL(f, root), 'utf8'),
  ctx = { window: {} };
vm.runInNewContext(await read('assets/cm-catalog-v3.js'), ctx);
const catalog = ctx.window.CMCatalog;
assert.equal(catalog.length, 500);
assert.equal(new Set(catalog.map((t) => t.slug)).size, 500);
assert.deepEqual(
  [...catalog.map((t) => t.priority)].sort((a, b) => a - b),
  Array.from({ length: 500 }, (_, k) => k + 1),
);
const manifest = JSON.parse(await read('src/asset-manifest.json')),
  mapped = new Map(Object.entries(manifest).map(([source, path]) => [path, source])),
  files = [
    ...catalog.map((t) => t.slug + '.html'),
    ...[
      'index',
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
    ].map((x) => x + '.html'),
  ],
  failures = [],
  titles = new Set(),
  descriptions = new Set();
let scriptCount = 0;
for (const file of files) {
  try {
    const html = await read(file),
      $ = load(html),
      slug = file === 'index.html' ? '' : file.slice(0, -5);
    assert.equal($('h1').length, 1, 'one h1');
    assert.equal($('main#main-content').length, 1, 'one semantic main');
    assert.equal($('meta[charset]').attr('charset'), 'utf-8');
    assert.ok(html.indexOf('charset=') < 1024, 'early encoding declaration');
    assert.equal($('meta[name=viewport]').length, 1);
    assert.equal($('link[rel=canonical]').attr('href'), 'https://calcmintly.com/' + slug);
    assert.equal($('.cm-site-header').length, 1, 'one header');
    assert.equal($('.cm-site-footer').length, 1, 'one footer');
    assert.equal($('[data-cm-language] option').length, 20);
    assert.equal(
      $('[onclick],[oninput],[onchange],a[href^="javascript:"]').length,
      0,
      'no inline handlers',
    );
    assert.equal($('script[src*="_next"],link[href*="_next"]').length, 0, 'no old router');
    assert.ok(
      $('meta[data-cm-csp]').attr('content').includes("'strict-dynamic'"),
      'hashed script policy',
    );
    const title = $('title').text(),
      description = $('meta[name=description]').attr('content');
    assert.ok(
      title.length >= 50 && title.length <= 60,
      'title length ' + title.length + ' ' + title,
    );
    assert.ok(
      description.length >= 150 && description.length <= 160,
      'description length ' + description.length,
    );
    assert.ok(!titles.has(title), 'unique title');
    assert.ok(!descriptions.has(description), 'unique description');
    titles.add(title);
    descriptions.add(description);
    const metaKeys = $('meta[name],meta[property]')
      .map((_, e) => $(e).attr('name') || $(e).attr('property'))
      .get();
    assert.equal(new Set(metaKeys).size, metaKeys.length, 'deduplicated metadata');
    const ids = $('[id]')
      .map((_, e) => $(e).attr('id'))
      .get();
    assert.equal(new Set(ids).size, ids.length, 'unique element IDs');
    const sources = $('script[src]')
        .map((_, e) => $(e).attr('src'))
        .get(),
      styles = $('link[rel=stylesheet]')
        .map((_, e) => $(e).attr('href'))
        .get();
    assert.equal(new Set(sources).size, sources.length, 'deduplicated scripts');
    assert.equal(new Set(styles).size, styles.length, 'deduplicated styles');
    for (const element of $('script[src],link[rel=stylesheet],img[src]').toArray()) {
      const e = $(element),
        path = (e.attr('src') || e.attr('href')).split('?')[0];
      assert.ok(path.startsWith('/'), 'self-hosted asset');
      const bytes = await fs.readFile(new URL(path.slice(1), root));
      if (element.tagName === 'script') {
        assert.equal(
          e.attr('integrity'),
          'sha256-' + createHash('sha256').update(bytes).digest('base64'),
          'script integrity',
        );
        scriptCount++;
      }
      if (mapped.has(path))
        assert.match(path, /\.[a-f0-9]{12}\.(?:js|css)$/, 'fingerprinted output');
    }
    for (const script of $('script[type="application/ld+json"]').toArray()) {
      const schema = JSON.parse($(script).html());
      assert.equal(schema['@context'], 'https://schema.org');
    }
    if (catalog.some((t) => t.slug === slug)) {
      assert.ok(
        $('script[type="application/ld+json"]')
          .toArray()
          .some((e) =>
            ['WebApplication', 'SoftwareApplication'].includes(JSON.parse($(e).html())['@type']),
          ),
        'calculator schema',
      );
      assert.equal($('.wrap,.kp-wrap').length, 1, 'one calculator wrapper');
    }
  } catch (error) {
    failures.push({ file, error: error.message });
  }
}
const home = load(await read('index.html'));
assert.equal(home('.cm-pinned__tool').length, 8);
assert.equal(home('.cm-originals__tool').length, 3);
for (const [key, path] of Object.entries(manifest))
  assert.ok((await fs.stat(new URL(path.slice(1), root))).size > 0, key);
const version = JSON.parse(await read('release-version.json'));
assert.equal(version.catalogTools, 500);
assert.equal(version.locales, 20);
if (process.argv.includes('--strict-i18n')) {
  const coverage = JSON.parse(await read('src/translation-coverage.json'));
  for (const [lang, value] of Object.entries(coverage))
    assert.equal(value.missing, 0, lang + ' translation coverage');
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else
  console.log(
    'Release structure PASS: ' +
      files.length +
      ' English pages; 500 unique tools; 20 locale controls; metadata, schemas, assets and ' +
      scriptCount +
      ' integrity references checked.',
  );
