import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { secureMarkup } from './site-metadata.mjs';

export async function renderEmbeds(root, catalog, { manifest, sourceFor }) {
  const files = [];
  await fs.mkdir(new URL('embed/', root), { recursive: true });
  for (const tool of catalog) {
    const file = 'embed/' + tool.slug + '.html';
    if (tool.slug === 'merchant-profit-planner') {
      const template = 'embed/merchant-profit.html',
        $ = load(await fs.readFile(new URL(template, root), 'utf8'));
      $('script[src],link[rel=stylesheet]').each((_, element) => {
        const el = $(element),
          attribute = element.tagName === 'script' ? 'src' : 'href',
          source = sourceFor(el.attr(attribute).split(/[?#]/)[0].replace(/^\//, '')),
          fingerprint = manifest[source];
        if (!fingerprint?.startsWith('/assets/dist/'))
          throw new Error('Missing fingerprinted merchant embed asset: ' + source);
        el.attr(attribute, fingerprint);
      });
      const html = $.html();
      await fs.writeFile(new URL(template, root), html);
      await fs.writeFile(new URL(file, root), html);
    } else {
      const $ = load(await fs.readFile(new URL(tool.slug + '.html', root), 'utf8'));
      $('html').addClass('cm-embed-document');
      $('.cm-site-header,.cm-site-footer,.cm-site-skip').remove();
      $('link[rel=alternate]').remove();
      $('meta[name=robots]').remove();
      $('head').append('<meta name="robots" content="noindex,follow">');
      $('body')
        .addClass('cm-embedded cm-unified--embedded')
        .attr('data-cm-canonical-path', '/' + tool.slug);
      if (['basic-calculator', 'scientific-calculator'].includes(tool.slug))
        $('body').addClass('kp-embedded');
      const link = $('<a class="cm-embed-full" target="_blank" rel="noopener noreferrer">')
        .attr('href', '/' + tool.slug)
        .attr('data-cm-href', '/' + tool.slug)
        .attr('data-cm-pair', 'Full calculator & guide ↗|完整计算器与说明 ↗')
        .text('Full calculator & guide ↗');
      $('body').append(link);
      await fs.writeFile(new URL(file, root), $.html());
    }
    files.push(file);
  }
  await secureMarkup(root, [...files, 'embed/merchant-profit.html']);
  return files;
}
