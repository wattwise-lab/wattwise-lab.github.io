const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const pair = (en, zh) => `data-cm-pair="${esc(en + '|' + zh)}"`;
export async function renderRanking({ head, header, footer, catalog }) {
  const top = [...catalog].sort((a, b) => a.priority - b.priority).slice(0, 25);
  const main = `<main class="cm-ranking" id="main-content"><h1 ${pair('500 calculators, useful tasks first', '500 个计算器，常用任务优先')}>500 calculators, useful tasks first</h1><p class="cm-ranking__intro" ${pair('Search the complete collection by question or category. The default order is an editorial selection priority, not a worldwide usage ranking.', '按问题或分类查找完整目录。默认顺序是编选优先级，不是全球使用量排行。')}>Search the complete collection by question or category. The default order is an editorial selection priority, not a worldwide usage ranking.</p><div class="cm-ranking__controls"><div><label for="cm-ranking-search" data-cm-i18n="searchLabel">Find a calculator</label><input id="cm-ranking-search" type="search" maxlength="120" autocomplete="off" data-cm-placeholder="search"></div><div><label for="cm-ranking-category" data-cm-i18n="categories">Category</label><select id="cm-ranking-category"><option value="all">All calculators</option></select></div><div><label for="cm-ranking-mode" ${pair('Order by', '排序依据')}>Order by</label><select id="cm-ranking-mode"><option value="editorial" ${pair('Selection priority', '编选优先级')}>Selection priority</option><option value="local" disabled ${pair('My device usage', '本机使用记录')}>My device usage</option></select></div></div><section class="cm-ranking__privacy"><label><input type="checkbox" id="cm-usage-toggle"><span ${pair('Remember calculator use on this device', '在本机记录计算器使用')}>Remember calculator use on this device</span></label><p ${pair('Optional and off by default. Counts one visit after an input interaction and a valid result. No values, dates or identifiers are saved or uploaded. Turning this off clears the counts.', '可选，默认关闭。一次访问在修改输入且结果有效后计数一次；不保存或上传输入值、日期或标识信息。关闭即清除计数。')}>Optional and off by default. Counts one visit after an input interaction and a valid result. No values, dates or identifiers are saved or uploaded. Turning this off clears the counts.</p><p id="cm-usage-status" role="status"></p></section><ol class="cm-ranking__list" id="cm-ranking-list" tabindex="-1">${top.map((x) => `<li><span class="cm-ranking__number">${x.priority}</span><div><small>${esc(x.domain)}</small><a href="/${x.slug}" data-cm-href="/${x.slug}">${esc(x.name)}</a><p>${esc(x.description)}</p></div><a class="cm-ranking__add" href="/workspace?add=${x.slug}" data-cm-href="/workspace?add=${x.slug}" data-cm-i18n="addWorkspace">Add to workspace</a></li>`).join('')}</ol><p id="cm-ranking-empty" hidden ${pair('No matching tools or no device usage yet. Try another search or the selection order.', '没有匹配工具或尚无本机记录，请更换关键词或切回编选顺序。')}>No matching tools or no device usage yet. Try another search or the selection order.</p><nav class="cm-ranking__pager" aria-label="Pagination"><button type="button" id="cm-ranking-prev" disabled data-cm-i18n="previous">Previous</button><span id="cm-ranking-position" role="status">1–25 / 500</span><button type="button" id="cm-ranking-next" data-cm-i18n="next">Next</button></nav><section class="cm-ranking__method"><h2 ${pair('How this order works', '这个顺序如何确定')}>How this order works</h2><p ${pair('The first eight are fixed everyday shortcuts. The remaining tools prioritize broadly useful tasks, then category coverage and distinct calculations. All 500 entries are real tools; examples and translated routes do not count as additional calculators.', '前八项为固定常用入口，其余优先安排广泛适用的任务，再考虑分类覆盖与计算差异。500 项均为实际工具，示例与翻译路由不重复计数。')}>The first eight are fixed everyday shortcuts. The remaining tools prioritize broadly useful tasks, then category coverage and distinct calculations. All 500 entries are real tools; examples and translated routes do not count as additional calculators.</p><p ${pair('We do not have an audited dataset establishing the worldwide top 500 calculators by use. We do not publish invented monthly visits or search volumes. Device usage reflects only interactions saved in this browser after you opt in.', '我们尚未取得可核实的全球计算器使用量数据，因此不发布虚构月访问量或搜索量。本机记录仅反映你开启后在此浏览器保存的交互。')}>We do not have an audited dataset establishing the worldwide top 500 calculators by use. We do not publish invented monthly visits or search volumes. Device usage reflects only interactions saved in this browser after you opt in.</p></section></main>`;
  const schema =
    '<script type="application/ld+json">' +
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '500 calculators by task',
      url: 'https://calcmintly.com/ranking',
      mainEntity: {
        '@type': 'ItemList',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: 500,
        itemListElement: [...catalog]
          .sort((a, b) => a.priority - b.priority)
          .map((x) => ({
            '@type': 'ListItem',
            position: x.priority,
            name: x.name,
            url: 'https://calcmintly.com/' + x.slug,
          })),
      },
    }).replaceAll('<', '\u003c') +
    '</script>';
  return (
    (await head({
      title: '500 Calculators by Task and Selection Order | CalcMintly',
      description:
        'Find all 500 free calculators by task and category. See our transparent selection order, add tools to your workspace, or sort by optional device-only use history.',
      canonical: '/ranking',
      styles: ['assets/cm-ranking.css'],
      scripts: ['assets/cm-ranking.js'],
      schema,
    })) +
    '<body class="cm-unified">' +
    header('en') +
    main +
    footer('en') +
    '</body></html>'
  );
}
