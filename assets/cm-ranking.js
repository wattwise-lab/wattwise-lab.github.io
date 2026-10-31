(() => {
  'use strict';
  const I = window.CMI18n,
    $ = (id) => document.getElementById(id),
    catalog = window.CMCatalog || [];
  let page = 1;
  const size = 25;
  const pair = (value) => I.pick(value),
    name = (x) => x.names?.[I.language] || I.translate(x.name),
    domain = (x) => window.CMHomeCopy?.[I.language]?.domains?.[x.domain] || I.translate(x.domain);
  function draw() {
    const query = $('cm-ranking-search').value.trim().toLocaleLowerCase(),
      category = $('cm-ranking-category').value,
      mode = $('cm-ranking-mode').value,
      counts = window.CMLocalUsage.read();
    let rows = catalog.filter(
      (x) =>
        (category === 'all' || x.domain === category) &&
        (!query ||
          [x.name, ...Object.values(x.names || {}), name(x), x.keywords, x.description, domain(x)]
            .join(' ')
            .toLocaleLowerCase()
            .includes(query)),
    );
    rows.sort((a, b) =>
      mode === 'local'
        ? (counts[b.slug] || 0) - (counts[a.slug] || 0) || a.priority - b.priority
        : a.priority - b.priority,
    );
    if (mode === 'local') rows = rows.filter((x) => counts[x.slug]);
    const pages = Math.max(1, Math.ceil(rows.length / size));
    page = Math.min(page, pages);
    const list = $('cm-ranking-list');
    list.replaceChildren();
    for (const x of rows.slice((page - 1) * size, page * size)) {
      const li = document.createElement('li'),
        rank = document.createElement('span'),
        body = document.createElement('div'),
        link = document.createElement('a'),
        p = document.createElement('p'),
        small = document.createElement('small'),
        add = document.createElement('a');
      rank.className = 'cm-ranking__number';
      rank.textContent = mode === 'local' ? String(counts[x.slug]) : String(x.priority);
      rank.setAttribute(
        'aria-label',
        pair(
          mode === 'local' ? 'Device visits|本机使用访问次数' : 'Selection priority|编选优先级',
        ) +
          ' ' +
          rank.textContent,
      );
      link.href = I.url('/' + x.slug);
      link.textContent = name(x);
      p.textContent = x.descriptions?.[I.language] || I.translate(x.description);
      small.textContent = domain(x);
      add.className = 'cm-ranking__add';
      add.href = I.url('/workspace?add=' + x.slug);
      add.textContent = I.t('addWorkspace');
      body.append(small, link, p);
      li.append(rank, body, add);
      list.append(li);
    }
    $('cm-ranking-empty').hidden = rows.length > 0;
    $('cm-ranking-position').textContent =
      (rows.length ? (page - 1) * size + 1 : 0) +
      '–' +
      Math.min(page * size, rows.length) +
      ' / ' +
      rows.length;
    $('cm-ranking-prev').disabled = page === 1;
    $('cm-ranking-next').disabled = page === pages;
    $('cm-usage-toggle').checked = window.CMLocalUsage.enabled();
    $('cm-ranking-mode').querySelector('[value=local]').disabled = !window.CMLocalUsage.enabled();
    if (!window.CMLocalUsage.enabled() && mode === 'local') {
      $('cm-ranking-mode').value = 'editorial';
      draw();
    }
  }
  $('cm-ranking-search').addEventListener('input', () => {
    page = 1;
    draw();
  });
  for (const id of ['cm-ranking-category', 'cm-ranking-mode'])
    $(id).addEventListener('change', () => {
      page = 1;
      draw();
    });
  $('cm-ranking-prev').addEventListener('click', () => {
    page--;
    draw();
    $('cm-ranking-list').focus();
  });
  $('cm-ranking-next').addEventListener('click', () => {
    page++;
    draw();
    $('cm-ranking-list').focus();
  });
  $('cm-usage-toggle').addEventListener('change', () => {
    if (!window.CMLocalUsage.set($('cm-usage-toggle').checked))
      $('cm-usage-status').textContent = pair(
        'This browser could not save the preference.|此浏览器无法保存该偏好。',
      );
    draw();
  });
  function localize() {
    I.apply();
    const category = $('cm-ranking-category'),
      current = category.value;
    category.replaceChildren(
      new Option(I.t('all'), 'all'),
      ...[...new Set(catalog.map((x) => x.domain))].map(
        (d) => new Option(window.CMHomeCopy?.[I.language]?.domains?.[d] || I.translate(d), d),
      ),
    );
    category.value = current || 'all';
    I.translateTree(document.querySelector('main'));
    draw();
  }
  document.addEventListener('cm:language', localize);
  document.addEventListener('cm:translations', localize);
  document.addEventListener('cm:usage', draw);
  localize();
})();
