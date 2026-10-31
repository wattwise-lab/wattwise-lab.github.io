/* CalcMintly compact directory. One catalog, 12 results per page, native tool links. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id === 'language' ? 'cm-site-language' : id),
    C = window.CMHomeCopy;
  if (!C || !window.CMCatalog) return;
  const data = window.CMCatalog,
    SIZE = () => (matchMedia('(max-width:700px)').matches ? 6 : 12);
  const domains = [...new Set(data.map((x) => x.domain))],
    allowed = Object.keys(C);
  const counts = Object.fromEntries(
    domains.map((d) => [d, data.filter((t) => t.domain === d).length]),
  );
  const icons = {
    Finance: '$',
    Business: '%',
    Health: '+',
    Converters: '⇄',
    'Home and Everyday': '⌂',
    'Math and Time': '÷',
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
  const alias = {
    金融: 'Finance',
    商业: 'Business',
    健康: 'Health',
    换算: 'Converters',
    生活: 'Home and Everyday',
    家居: 'Home and Everyday',
    出行: 'Home and Everyday',
    数学: 'Math and Time',
    日期: 'Math and Time',
    教育: 'Math and Time',
    科技: 'Digital and Technology',
  };
  const matchLocale = (v) =>
    allowed.includes(v)
      ? v
      : /^zh(?:-|$)/i.test(v || '')
        ? 'zh-CN'
        : allowed.includes((v || '').split('-')[0])
          ? v.split('-')[0]
          : null;
  let lang = 'en',
    query = '',
    domain = 'all',
    page = 1,
    sort = 'recommended',
    searchTimer;
  lang = window.CMI18n.language;
  const t = (k, v = {}) =>
    Object.entries(v).reduce(
      (s, [a, b]) =>
        s.replaceAll('{' + a + '}', typeof b === 'number' ? window.CMI18n.number(b) : String(b)),
      C[lang][k === 'count' && Number(v.count) === 1 ? 'countOne' : k] ?? C.en[k] ?? k,
    );
  const cat = (d) => C[lang].domains[d] || d;
  const name = window.CMI18n.toolName;
  function loadURL() {
    const p = new URLSearchParams(location.search);
    query = (p.get('q') || '').slice(0, 120);
    const d = p.get('domain') || alias[p.get('category')] || 'all';
    domain = domains.includes(d) ? d : 'all';
    page = Math.max(1, Math.floor(Number(p.get('page')) || 1));
    sort = p.get('sort') === 'name' ? 'name' : 'recommended';
    $('search').value = query;
    $('sort').value = sort;
    $('category-mobile').value = domain;
  }
  function writeURL(push) {
    try {
      const u = new URL(location.href);
      for (const k of ['q', 'domain', 'page', 'sort', 'category']) u.searchParams.delete(k);
      if (query.trim()) u.searchParams.set('q', query.trim());
      if (domain !== 'all') u.searchParams.set('domain', domain);
      if (page > 1) u.searchParams.set('page', page);
      if (sort !== 'recommended') u.searchParams.set('sort', sort);
      u.searchParams.delete('lang');
      if (u.hash === '#calculators') u.hash = '';
      const next = new URL(window.CMI18n.url(u.href), location.origin);
      if (next.href !== location.href)
        history[push ? 'pushState' : 'replaceState']({}, '', next.href);
    } catch {}
  }
  function translatedShell() {
    document.documentElement.lang = lang;
    document.documentElement.dir = ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-t]').forEach((e) => {
      e.textContent = t(e.dataset.t);
    });
    $('search').placeholder = t('search');
    $('search').setAttribute('aria-label', t('searchLabel'));
    $('sort').setAttribute('aria-label', t('sort'));
    $('language').value = lang;
    document.querySelectorAll('.category').forEach((b) => {
      const d = b.dataset.domain;
      b.querySelector('span').textContent = d === 'all' ? t('all') : cat(d);
      b.querySelector('small').textContent = window.CMI18n.number(
        d === 'all' ? data.length : counts[d],
      );
    });
    [...$('category-mobile').options].forEach(
      (o) =>
        (o.textContent =
          (o.value === 'all' ? t('all') : cat(o.value)) +
          ' · ' +
          window.CMI18n.number(o.value === 'all' ? data.length : counts[o.value])),
    );
  }
  function filtered() {
    const words = clean(query).split(' ').filter(Boolean);
    let rows = data.filter(
      (x) =>
        (domain === 'all' || x.domain === domain) &&
        words.every((w) =>
          clean([window.CMI18n.searchText(x), cat(x.domain)].join(' ')).includes(w),
        ),
    );
    const collator = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' });
    rows.sort((a, b) => {
      if (sort === 'recommended') {
        const n = a.priority - b.priority;
        if (n) return n;
      }
      return collator.compare(name(a), name(b)) || a.slug.localeCompare(b.slug);
    });
    return rows;
  }
  function draw(focus = false, push = false, updateURL = true) {
    const rows = filtered(),
      pages = Math.max(1, Math.ceil(rows.length / SIZE()));
    page = Math.min(page, pages);
    const from = (page - 1) * SIZE();
    const frag = document.createDocumentFragment();
    rows.slice(from, from + SIZE()).forEach((x) => {
      const a = document.createElement('a');
      a.className = 'tool' + (x.new ? ' new' : '');
      a.href = window.CMI18n.url('/' + x.slug);
      const icon = document.createElement('span');
      icon.className = 'tool-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = icons[x.domain];
      const body = document.createElement('span');
      body.className = 'tool-text';
      const n = document.createElement('span');
      n.className = 'tool-name';
      n.textContent = name(x);
      n.lang = lang;
      if (x.new) {
        const badge = document.createElement('span');
        badge.className = 'new-tag';
        badge.lang = lang;
        badge.textContent = t('new');
        n.append(badge);
      }
      const d = document.createElement('span');
      d.className = 'tool-domain';
      d.textContent = cat(x.domain);
      const description = document.createElement('span');
      description.className = 'tool-description';
      description.textContent = x.descriptions?.[lang] || window.CMI18n.translate(x.description);
      body.append(n, d, description);
      a.append(icon, body);
      frag.append(a);
    });
    $('tool-grid').replaceChildren(frag);
    $('empty').hidden = rows.length !== 0;
    $('tool-grid').hidden = rows.length === 0;
    $('pager').hidden = rows.length === 0;
    $('previous').disabled = page <= 1;
    $('next').disabled = page >= pages;
    $('page-position').textContent = t('page', { page, pages });
    $('result-count').textContent = t('count', {
      start: rows.length ? from + 1 : 0,
      end: Math.min(from + SIZE(), rows.length),
      count: rows.length,
    });
    $('result-heading').textContent = domain === 'all' ? t('results') : cat(domain);
    $('clear').hidden = !query;
    document
      .querySelectorAll('.category')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.domain === domain)));
    $('category-mobile').value = domain;
    if (updateURL) writeURL(push);
    if (focus) {
      $('result-heading').focus({ preventScroll: true });
      $('results').scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  $('search').addEventListener('input', () => {
    query = $('search').value;
    page = 1;
    draw(false, false, false);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => writeURL(false), 250);
  });
  $('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(searchTimer);
    draw(true, false);
  });
  $('clear').addEventListener('click', () => {
    query = '';
    page = 1;
    $('search').value = '';
    draw();
    $('search').focus();
  });
  function selectDomain(value) {
    domain = value;
    page = 1;
    draw(false, true);
  }
  document
    .querySelectorAll('.category')
    .forEach((b) => b.addEventListener('click', () => selectDomain(b.dataset.domain)));
  $('category-mobile').addEventListener('change', (e) => selectDomain(e.target.value));
  $('sort').addEventListener('change', (e) => {
    sort = e.target.value;
    page = 1;
    draw(false, true);
  });
  $('previous').addEventListener('click', () => {
    if (page > 1) {
      page--;
      draw(true, true);
    }
  });
  $('next').addEventListener('click', () => {
    if (!$('next').disabled) {
      page++;
      draw(true, true);
    }
  });
  $('reset').addEventListener('click', () => {
    query = '';
    domain = 'all';
    page = 1;
    sort = 'recommended';
    $('search').value = '';
    $('sort').value = sort;
    draw(false, true);
    $('search').focus();
  });
  window.addEventListener('popstate', () => {
    const l =
      matchLocale(new URLSearchParams(location.search).get('lang')) ||
      matchLocale(location.pathname.split('/')[1]) ||
      window.CMI18n.language;
    if (l !== window.CMI18n.language) window.CMI18n.setLanguage(l);
    lang = l;
    loadURL();
    translatedShell();
    draw(false, false, false);
  });
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) &&
      !document.activeElement.isContentEditable
    ) {
      e.preventDefault();
      $('search').focus();
    }
    if (e.key === 'Escape') {
      if ($('mobile-menu')) $('mobile-menu').open = false;
      if (document.activeElement === $('search') && query) {
        query = '';
        page = 1;
        $('search').value = '';
        draw();
      }
    }
  });
  document.addEventListener('click', (e) => {
    const menu = $('mobile-menu');
    if (menu?.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('focusin', (e) => {
    const menu = $('mobile-menu');
    if (menu?.open && !menu.contains(e.target)) menu.open = false;
  });
  $('mobile-menu')?.addEventListener('toggle', () =>
    document.querySelector('.cm-site-header')?.classList.toggle('menu-open', $('mobile-menu').open),
  );
  let mobile = SIZE() === 6;
  window.addEventListener('resize', () => {
    if (mobile !== (SIZE() === 6)) {
      mobile = !mobile;
      page = 1;
      draw();
    }
  });
  document.addEventListener('cm:language', () => {
    lang = window.CMI18n.language;
    translatedShell();
    draw();
  });
  document.addEventListener('cm:translations', () => {
    translatedShell();
    draw();
  });
  loadURL();
  translatedShell();
  draw(false, false, false);
})();
