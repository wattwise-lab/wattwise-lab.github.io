import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { secureMarkup } from './site-metadata.mjs';

export async function renderEmbeds(root, catalog) {
  const files = [];
  await fs.mkdir(new URL('embed/', root), { recursive: true });
  for (const tool of catalog) {
    const file = 'embed/' + tool.slug + '.html';
    if (tool.slug === 'merchant-profit-planner') {
      await fs.copyFile(new URL('embed/merchant-profit.html', root), new URL(file, root));
    } else {
      const $ = load(await fs.readFile(new URL(tool.slug + '.html', root), 'utf8'));
      $('html').addClass('cm-embed-document');
      $('.cm-site-header,.cm-site-footer,.cm-site-skip').remove();
      $('link[rel=alternate]').remove();
      $('meta[name=robots]').remove();
      $('head').append('<meta name="robots" content="noindex,follow">');
      $('body')
        .addClass('cm-embedded')
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
  await secureMarkup(root, files);
  return files;
}
