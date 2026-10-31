(() => {
  'use strict';
  const I = window.CMI18n,
    C = window.CMHomeCopy,
    data = window.CMCatalog,
    $ = (id) => document.getElementById(id);
  if (!I || !data || !$('cm-home-grid')) return;
  const priority = [
    'basic-calculator',
    'scientific-calculator',
    'percentage-calculator',
    'loan-calculator',
    'mortgage-calculator',
    'bmi-calculator',
    'age-calculator',
    'unit-converter',
  ];
  const icons = {
    Finance: '$',
    Business: '%',
    Health: '+',
    Converters: '⇄',
    'Math and Time': '÷',
    'Home and Everyday': '⌂',
    'AI and Work-life': 'AI',
    'Digital and Technology': '01',
    Science: 'Ω',
  };
  const clean = (s) =>
    String(s)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’'−‐–-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const name = (x) => x.names?.[I.language] || I.translate(x.name),
    domain = (d) => C[I.language]?.domains[d] || C.en.domains[d] || d;
  let page = 1,
    selected = 'all',
    query = $('cm-home-search').value;
  const size = () => (matchMedia('(max-width:639px)').matches ? 6 : 12);
  const all = [...data].sort(
    (a, b) =>
      (priority.includes(a.slug) ? priority.indexOf(a.slug) : a.priority || 999) -
      (priority.includes(b.slug) ? priority.indexOf(b.slug) : b.priority || 999),
  );
  function match(x) {
    if (selected === 'all') return true;
    if (selected === 'Dates') return /date|time|age-calculator|countdown|workday/.test(x.slug);
    if (selected === 'Home')
      return (
        [
          'paint-calculator',
          'concrete-calculator',
          'square-area-calculator',
          'rent-vs-buy-calculator',
        ].includes(x.slug) || x.domain === 'Home and Everyday'
      );
    return x.domain === selected;
  }
  function draw() {
    const words = clean(query).split(' ').filter(Boolean),
      rows = all.filter(
        (x) =>
          match(x) &&
          words.every((w) => clean([I.searchText(x), domain(x.domain)].join(' ')).includes(w)),
      );
    const n = size(),
      pages = Math.max(1, Math.ceil(rows.length / n));
    page = Math.min(pages, Math.max(1, page));
    const start = (page - 1) * n,
      frag = document.createDocumentFragment();
    for (const x of rows.slice(start, start + n)) {
      const a = document.createElement('a');
      a.className = 'cm-directory__tool';
      a.href = I.url('/' + x.slug);
      const icon = document.createElement('span');
      icon.textContent = icons[x.domain] || '∑';
      icon.setAttribute('aria-hidden', 'true');
      const d = document.createElement('small');
      d.textContent = domain(x.domain);
      const h = document.createElement('h3');
      h.textContent = name(x);
      h.lang = I.language;
      const p = document.createElement('p');
      p.textContent = x.descriptions?.[I.language] || I.translate(x.description);
      const link = document.createElement('span');
      link.textContent = I.t('calculate') + ' →';
      a.append(icon, d, h, p, link);
      frag.append(a);
    }
    if (!rows.length) {
      const p = document.createElement('p');
      p.textContent = I.t('none');
      frag.append(p);
    }
    $('cm-home-grid').replaceChildren(frag);
    $('cm-home-position').textContent =
      I.t(rows.length === 1 ? 'countOne' : 'count', {
        start: I.number(rows.length ? start + 1 : 0),
        end: I.number(Math.min(start + n, rows.length)),
        count: I.number(rows.length),
      }) +
      ' · ' +
      I.number(page) +
      '/' +
      I.number(pages);
    $('cm-home-prev').disabled = page === 1;
    $('cm-home-next').disabled = page === pages;
    document
      .querySelectorAll('[data-cm-category]')
      .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.cmCategory === selected)));
    I.apply();
  }
  $('cm-home-search').addEventListener('input', () => {
    query = $('cm-home-search').value;
    page = 1;
    draw();
  });
  document.querySelectorAll('[data-cm-category]').forEach((b) =>
    b.addEventListener('click', () => {
      selected = b.dataset.cmCategory;
      page = 1;
      draw();
    }),
  );
  $('cm-home-prev').addEventListener('click', () => {
    page--;
    draw();
    $('cm-home-grid').scrollIntoView({ block: 'start' });
    $('cm-home-heading').focus({ preventScroll: true });
  });
  $('cm-home-next').addEventListener('click', () => {
    page++;
    draw();
    $('cm-home-grid').scrollIntoView({ block: 'start' });
    $('cm-home-heading').focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('cm-home-search').focus();
    }
  });
  let mobile = size() === 6;
  addEventListener('resize', () => {
    if (mobile !== (size() === 6)) {
      mobile = !mobile;
      page = 1;
      draw();
    }
  });
  document.addEventListener('cm:language', draw);
  document.addEventListener('cm:translations', draw);
  const params = new URLSearchParams(location.search),
    aliases = {
      数学: 'Math and Time',
      金融: 'Finance',
      健康: 'Health',
      日期: 'Dates',
      换算: 'Converters',
      商业: 'Business',
      科技: 'Digital and Technology',
      生活: 'Home and Everyday',
      家居: 'Home',
      出行: 'Home and Everyday',
      教育: 'Math and Time',
      科学: 'Science',
    };
  selected = aliases[params.get('category')] || params.get('domain') || 'all';
  query = params.get('q') || query;
  $('cm-home-search').value = query;
  draw();
})();
