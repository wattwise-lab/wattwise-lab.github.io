(() => {
  'use strict';
  const $ = (id) => document.getElementById(id === 'ws-language' ? 'cm-site-language' : id),
    catalog = window.CMCatalog || [],
    bySlug = new Map(catalog.map((x) => [x.slug, x]));
  const copy = {
    en: {
      skip: 'Skip to workspace',
      all: 'All calculators',
      workspace: 'Workspace',
      methods: 'Methods',
      eyebrow: 'YOUR CALCULATOR DESK',
      title: 'Your tools. Side by side.',
      intro: 'Choose a calculator, enter your numbers and compare. Keep up to four tools together.',
      add: '＋ Add calculator',
      replace: 'Replace',
      save: 'Save layout',
      restore: 'Load saved',
      help: 'How it works',
      helpTitle: 'Three simple steps',
      step1: 'Add a calculator by name or purpose. Use Replace on a card to change it.',
      step2: 'Edit the example numbers. Every calculator updates independently.',
      step3:
        'Use “Send result” to copy a number into another card. Check the units first; values do not stay linked.',
      saveNote:
        'Saving remembers tool choices and order on this device. Inputs stay in the current tab and are not saved.',
      start: 'Quick start',
      startHint: 'Add a ready-made pair',
      shopping: 'Shopping: discount + tax',
      savings: 'Savings: interest + goal',
      home: 'Home: paint + area',
      local:
        'Calculations run in your browser. Exchange rates and assumptions are entered by you. Open a full calculator for its formula and limitations.',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
      choose: 'CHOOSE A TOOL',
      searchLabel: 'Search calculators',
      search: 'Search mortgage, profit, BMI…',
      previous: 'Previous',
      next: 'Next',
      send: 'Send result',
      transferHelp:
        'Choose the result, destination calculator and input. This copies a number once; it does not convert units or link the tools.',
      result: 'Result to send',
      destination: 'Destination calculator',
      field: 'Destination input',
      apply: 'Copy to this input',
      remove: 'Remove calculator',
      earlier: 'Move earlier',
      later: 'Move later',
      full: 'Full calculator & guide ↗',
      loading: 'Loading calculator…',
      emptyTitle: 'Add a calculator here',
      emptyHint:
        'Search all ' +
        catalog.length +
        ' tools, or add the same one twice to compare your numbers.',
      count: (n) => `${n} of 4 calculators · ${catalog.length} available`,
      pickerHint: 'Search by name or purpose. Every calculator on the site is available here.',
      replaceHint: 'Choose a new calculator for this card. Other cards keep their inputs.',
      matches: (n, a, b) => `${n} matches · Showing ${a}–${b}`,
      page: (a, b) => `${a} / ${b}`,
      none: 'No matching calculators. Try another word or choose all categories.',
      saved:
        'Layout saved on this device. Tool choices and order only; input values are not saved.',
      saveError:
        'Your browser could not save this layout. The current workspace is still available in this tab.',
      restored: 'Saved layout loaded with fresh example values.',
      removed: 'Calculator removed.',
      undo: 'Undo',
      fullHint: 'All four spaces are in use. Choose Replace on any card to change its calculator.',
      templateFull:
        'This pair needs two empty spaces. Remove a calculator or replace a card first.',
      added: 'Calculator added.',
      replaced: 'Calculator replaced.',
      noTargets: 'Add another calculator before sending a result.',
      noNumber:
        'This result is not a single number. Choose a numeric result or use the full calculator.',
      sent: 'Result copied. The destination calculator has recalculated.',
      preview: (n, t, f) => `${n} → ${t} / ${f}`,
      close: 'Close',
      pickField: 'Choose an input',
      invalidField:
        'This number does not match the input’s allowed range or step. Choose a compatible input.',
      openError: 'Could not load the calculator. Open the full tool to continue.',
      reload: 'Reload',
      languageNote:
        'Calculator fields and full guides are currently in English, except the multilingual merchant tool.',
    },
    'zh-CN': {
      skip: '跳至工作台',
      all: '全部计算器',
      workspace: '工作台',
      methods: '计算方法',
      eyebrow: '你的计算器工作台',
      title: '需要的工具，一起算清楚。',
      intro: '添加计算器，输入数字，并排比较。最多同时使用四个工具。',
      add: '＋ 添加计算器',
      replace: '替换',
      save: '保存布局',
      restore: '载入已保存布局',
      help: '使用说明',
      helpTitle: '三步开始使用',
      step1: '按名称或用途搜索并添加计算器。点击卡片上的「替换」可直接更换。',
      step2: '把示例数字换成自己的数值，各计算器会独立实时更新。',
      step3: '点击「传递结果」，将一个数值填入另一块计算器。请核对单位；数值不会持续联动。',
      saveNote: '保存只记住本设备上的工具名称和顺序，不保存输入数值。当前输入会保留在此标签页。',
      start: '快速开始',
      startHint: '一键添加一组常用工具',
      shopping: '购物：折扣 + 销售税',
      savings: '储蓄：复利 + 储蓄目标',
      home: '装修：油漆 + 面积',
      local: '计算在浏览器本地进行。汇率和假设由你填写；完整工具页面提供公式、示例和适用范围。',
      privacy: '隐私',
      terms: '使用条款',
      contact: '联系',
      choose: '选择你需要的工具',
      searchLabel: '搜索计算器',
      search: '搜索房贷、利润、BMI、换算…',
      previous: '上一页',
      next: '下一页',
      send: '传递结果',
      transferHelp:
        '选择结果、目标计算器及输入项。只复制一次数值，不自动换算单位，也不会持续联动。',
      result: '要传递的结果',
      destination: '目标计算器',
      field: '目标输入项',
      apply: '填入此输入项',
      remove: '移除计算器',
      earlier: '向前移动',
      later: '向后移动',
      full: '完整计算器与说明 ↗',
      loading: '正在加载计算器…',
      emptyTitle: '在这里添加计算器',
      emptyHint:
        '全部 ' + catalog.length + ' 个工具都能查找，也可以重复添加同一个工具，比较两组数值。',
      count: (n) => `已使用 ${n} / 4 个位置 · 共 ${catalog.length} 个工具可选`,
      pickerHint: '按名称或用途搜索。网站现有的计算器都可以添加。',
      replaceHint: '选择这块卡片的新计算器，其余卡片的输入会保留。',
      matches: (n, a, b) => `找到 ${n} 个 · 显示第 ${a}–${b} 项`,
      page: (a, b) => `第 ${a} / ${b} 页`,
      none: '没有找到匹配工具。换一个词，或选择全部分类。',
      saved: '布局已保存在本设备。只保存工具名称和顺序，不保存输入数值。',
      saveError: '浏览器未能保存布局，当前标签页中的工具仍可继续使用。',
      restored: '已载入保存的布局，使用新的示例数值。',
      removed: '已移除计算器。',
      undo: '撤销',
      fullHint: '四个位置已满。点击任意卡片上的「替换」即可更换工具。',
      templateFull: '这组工具需要两个空位。请先移除计算器，或直接替换卡片。',
      added: '计算器已添加。',
      replaced: '计算器已替换。',
      noTargets: '请先添加另一个计算器，再传递结果。',
      noNumber: '此结果不是单个数值。请选择数值结果，或打开完整计算器。',
      sent: '数值已填入，目标计算器已重新计算。',
      preview: (n, t, f) => `${n} → ${t} / ${f}`,
      close: '关闭',
      pickField: '请选择输入项',
      invalidField: '该数值不符合目标输入项的范围或步进要求，请选择兼容的输入项。',
      openError: '计算器未能加载，可打开完整工具继续使用。',
      reload: '重新加载',
      languageNote: '除多语言商家工具外，计算器内部字段及完整指南目前为英文。',
    },
  };
  let lang = window.CMI18n.language;
  const commonKeys = {
    skip: 'skip',
    all: 'all',
    workspace: 'workspace',
    methods: 'methods',
    add: 'addCalculator',
    replace: 'replace',
    save: 'saveLayout',
    restore: 'loadLayout',
    help: 'help',
    send: 'sendResult',
    remove: 'remove',
    earlier: 'moveEarlier',
    later: 'moveLater',
    close: 'close',
    previous: 'previous',
    next: 'next',
    privacy: 'privacy',
    terms: 'terms',
    contact: 'contact',
    undo: 'undo',
    searchLabel: 'searchLabel',
    search: 'search',
    emptyTitle: 'addCalculator',
  };
  const t = (k) => {
    if (k === 'count')
      return (n) =>
        window.CMI18n.number(n) +
        ' / 4 · ' +
        window.CMI18n.number(catalog.length) +
        ' ' +
        window.CMI18n.t('results');
    if (k === 'matches')
      return (n, a, b) => window.CMI18n.t('count', { start: a, end: b, count: n });
    if (k === 'page') return (a, b) => window.CMI18n.t('page', { page: a, pages: b });
    if (k === 'preview') return (n, t, f) => n + ' → ' + t + ' / ' + f;
    if (commonKeys[k]) return window.CMI18n.t(commonKeys[k]);
    return (
      window.CMWorkspaceCopy?.[lang]?.[k] ?? window.CMI18n.translate((copy[lang] || copy.en)[k])
    );
  };
  const toolName = window.CMI18n.toolName,
    domainName = (d) => window.CMHomeCopy?.[lang]?.domains[d] || d;
  let cards = [],
    nextId = 1,
    replaceId = null,
    pickerPage = 1,
    pickerQuery = '',
    pickerDomain = 'all',
    lastRemoved = null,
    pendingAdd = null;
  const size = 8,
    templates = {
      shopping: ['discount-calculator', 'sales-tax-calculator'],
      savings: ['compound-interest-calculator', 'savings-goal-calculator'],
      home: ['paint-calculator', 'area-converter'],
    };
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  function button(text, fn, cls = '') {
    const b = el('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function announce(message, undo) {
    $('ws-message').replaceChildren(document.createTextNode(message));
    if (undo) $('ws-message').append(button(t('undo'), undo));
  }
  function captureCard(card) {
    if (!card.ready) return true;
    try {
      const w = card.frame.contentWindow,
        d = card.frame.contentDocument;
      card.pendingState = w.CMCalculatorBridge?.snapshot
        ? { kind: 'bridge', data: w.CMCalculatorBridge.snapshot() }
        : { kind: 'fields', data: w.CMFormState.capture(d) };
      return true;
    } catch {
      announce(
        window.CMI18n.pick(
          'The calculator state could not be captured. Keep this card in place and try again.|未能记录计算器状态，请保留此卡片并重试。',
        ),
      );
      return false;
    }
  }
  function storageRead() {
    try {
      const raw = localStorage.getItem('calcmintly-desk-v1');
      let v = JSON.parse(raw);
      if (!raw) {
        const old = JSON.parse(localStorage.getItem('calcmintly.workspace.v1'));
        if (old?.version === 1 && Array.isArray(old.slugs)) v = old.slugs;
      }
      return Array.isArray(v) ? v.filter((s) => bySlug.has(s)).slice(0, 4) : null;
    } catch {
      return null;
    }
  }
  function updateShell() {
    if (!document.body.hasAttribute('data-cm-page-name'))
      document.title = window.CMI18n.t('workspace') + ' | CalcMintly';
    document.documentElement.lang = lang;
    $('desk').setAttribute('aria-label', t('workspace'));
    $('ws-jump').setAttribute('aria-label', lang === 'zh-CN' ? '跳至计算器' : 'Jump to calculator');
    $('picker-domain').setAttribute(
      'aria-label',
      window.CMHomeCopy?.[lang]?.categories || 'Category',
    );
    document.querySelectorAll('[data-w]').forEach((e) => (e.textContent = t(e.dataset.w)));
    $('ws-language').value = lang;
    $('picker-search').placeholder = t('search');
    $('picker-search').setAttribute('aria-label', t('searchLabel'));
    document
      .querySelectorAll('[data-close]')
      .forEach((b) => b.setAttribute('aria-label', t('close')));
    $('restore-layout').hidden = !storageRead();
    $('slot-count').textContent = t('count')(cards.length);
    $('picker-domain').replaceChildren(
      new Option(t('all'), 'all'),
      ...[...new Set(catalog.map((x) => x.domain))].map((d) => new Option(domainName(d), d)),
    );
    $('picker-domain').value = pickerDomain;
  }
  function visibleFields(doc) {
    return [...doc.querySelectorAll('input,select,textarea')].filter(
      (f) =>
        !f.disabled &&
        f.id &&
        f.getClientRects().length &&
        f.type !== 'file' &&
        f.type !== 'hidden' &&
        !['language', 'scenario-name', 'assumption-source', 'assumption-date'].includes(f.id),
    );
  }
  function labelFor(doc, f) {
    return (
      doc.querySelector('label[for="' + CSS.escape(f.id) + '"]')?.textContent.trim() ||
      f.getAttribute('aria-label') ||
      f.id
    );
  }
  function numericResults(card) {
    if (!card.ready) return [];
    if (card.frame.contentWindow.CMCalculatorBridge)
      return card.frame.contentWindow.CMCalculatorBridge.results();
    const doc = card.frame.contentDocument;
    if (!card.ready || !doc?.body) return [];
    if (doc.body.classList.contains('cm-invalid')) return [];
    const nodes = [...doc.querySelectorAll('.big,.chips strong,.metric strong')].filter(
      (n) => n.getClientRects().length,
    );
    return nodes
      .map((n) => {
        const raw = n.textContent.trim();
        const value = window.CMData.displayNumber(raw, window.CMI18n.language);
        if (value === null) return null;
        const chip = n.closest('.chip');
        const label =
          (chip ? chip.textContent.replace(n.textContent, '').trim() : null) ||
          n.closest('.card')?.querySelector('h2')?.textContent.trim() ||
          n.closest('.metric')?.querySelector('.metric-label')?.textContent.trim() ||
          t('result');
        return Number.isFinite(value) ? { label: raw + ' · ' + label, value } : null;
      })
      .filter(Boolean);
  }
  function fit(card) {
    const d = card.frame.contentDocument;
    if (!d) return;
    const wrap = d.querySelector('.wrap,.kp-wrap');
    if (wrap) {
      const height = Math.ceil(wrap.getBoundingClientRect().height) + 2;
      card.frame.style.height =
        Math.max(260, Math.min(height, card.slug === 'merchant-profit-planner' ? 900 : 1250)) +
        'px';
    }
  }
  function mount(card) {
    const data = bySlug.get(card.slug),
      section = el('article', 'ws-card');
    section.id = 'desk-' + card.id;
    section.tabIndex = -1;
    section.setAttribute('aria-label', toolName(data));
    card.node = section;
    const head = el('div', 'ws-card-head'),
      top = el('div', 'ws-card-top'),
      category = el('span', 'ws-card-category');
    category.append(el('span', 'ws-number'), document.createTextNode(domainName(data.domain)));
    const actions = el('div', 'ws-card-actions');
    const replace = button(t('replace'), () => openPicker(card.id), 'replace');
    const moveLeft = button('←', () => move(card.id, -1));
    moveLeft.setAttribute('aria-label', t('earlier'));
    const moveRight = button('→', () => move(card.id, 1));
    moveRight.setAttribute('aria-label', t('later'));
    const remove = button('×', () => removeCard(card.id));
    remove.setAttribute('aria-label', t('remove'));
    actions.append(replace, moveLeft, moveRight, remove);
    top.append(category, actions);
    head.append(top, el('h2', '', toolName(data)));
    section.append(head);
    const loading = el('p', 'ws-loading', t('loading'));
    section.append(loading);
    const frame = el('iframe');
    frame.title = toolName(data);
    frame.src = window.CMLocaleRoutes.path('/' + card.slug, lang) + '?embed=1';
    frame.setAttribute('referrerpolicy', 'same-origin');
    card.frame = frame;
    const failed = (message) => {
      card.ready = false;
      send.disabled = true;
      loading.replaceChildren(document.createTextNode(message + ' '));
      loading.append(
        button(window.CMI18n.pick('Reload calculator|重新载入计算器'), () => {
          loading.replaceChildren(document.createTextNode(t('loading')));
          frame.contentWindow.location.reload();
        }),
      );
      if (!loading.isConnected) frame.before(loading);
    };
    frame.addEventListener('load', () => {
      card.observer?.disconnect();
      const d = frame.contentDocument;
      if (frame.contentWindow.location.href === 'about:blank') return;
      if (
        d?.body.dataset.cmPageKind !== 'calculator' ||
        !d.querySelector('main') ||
        !d.querySelector('input,select')
      ) {
        failed(t('openError'));
        return;
      }
      if (card.pendingState) {
        try {
          const saved = card.pendingState,
            w = frame.contentWindow;
          if (saved.kind === 'bridge') w.CMCalculatorBridge.restore(saved.data);
          else w.CMFormState.restore(d, saved.data);
          card.pendingState = null;
        } catch {
          failed(
            window.CMI18n.pick(
              'This calculator could not restore its previous state. The snapshot remains in this tab; reload the card to retry.|此计算器未能恢复先前状态，快照仍保留在当前标签页，可重新载入卡片重试。',
            ),
          );
          return;
        }
      }
      if (card.pendingValues) {
        for (const [id, value] of card.pendingValues) {
          const f = d.getElementById(id);
          if (f) {
            f.value = value;
            f.dispatchEvent(new frame.contentWindow.Event('input', { bubbles: true }));
            f.dispatchEvent(new frame.contentWindow.Event('change', { bubbles: true }));
          }
        }
        card.pendingValues = null;
      }
      loading.remove();
      card.ready = true;
      send.disabled = false;
      send.removeAttribute('title');
      document.dispatchEvent(new Event('cm:workspace-results'));
      fit(card);
      const observer = new ResizeObserver(() => fit(card));
      observer.observe(d.body);
      card.observer = observer;
      d.addEventListener('input', () => fit(card));
      d.addEventListener('change', () => fit(card));
    });
    section.append(frame);
    const foot = el('div', 'ws-card-footer'),
      send = button(t('send') + ' →', () => openTransfer(card.id));
    send.disabled = true;
    send.title = t('loading');
    const full = el('a', '', t('full'));
    full.href = window.CMLocaleRoutes.path('/' + card.slug, lang);
    full.target = '_blank';
    full.rel = 'noopener';
    foot.append(send, full);
    section.append(foot);
    return section;
  }
  function refresh() {
    $('ws-starters').open = cards.length === 0;
    for (const node of [...$('desk').children])
      if (!cards.some((c) => c.node === node)) node.remove();
    cards.forEach((c, i) => {
      if (!c.node) mount(c);
      if (!c.node.isConnected) $('desk').append(c.node);
      const at = $('desk').children[i];
      if (at !== c.node) {
        if (typeof $('desk').moveBefore === 'function') $('desk').moveBefore(c.node, at);
        else {
          if (!captureCard(c)) return;
          c.ready = false;
          c.node.querySelector('.ws-card-footer button').disabled = true;
          $('desk').insertBefore(c.node, at);
        }
      }
      c.node.querySelector('.ws-number').textContent = i + 1;
      const moves = c.node.querySelectorAll('.ws-card-actions button');
      moves[1].disabled = i === 0;
      moves[2].disabled = i === cards.length - 1;
    });
    for (let i = cards.length; i < Math.min(cards.length + 1, 4); i++) {
      const empty = el('article', 'ws-card empty-slot'),
        content = el('div');
      content.append(
        el('span', 'plus', '＋'),
        el('h2', '', t('emptyTitle')),
        el('p', '', t('emptyHint')),
        button(t('add'), () => openPicker(null)),
      );
      empty.append(content);
      $('desk').append(empty);
    }
    $('ws-jump').replaceChildren(
      ...cards.map((c, i) =>
        button(i + 1 + '. ' + toolName(bySlug.get(c.slug)), () => {
          c.node.scrollIntoView({ block: 'start' });
          c.node.focus({ preventScroll: true });
        }),
      ),
    );
    $('slot-count').textContent = t('count')(cards.length);
    $('add-tool').disabled = cards.length === 4;
    $('add-tool').title = cards.length === 4 ? t('fullHint') : t('add');
    document.dispatchEvent(new Event('cm:workspace-change'));
  }
  function add(slug, replace) {
    if (!bySlug.has(slug)) return;
    if (replace !== null) {
      const i = cards.findIndex((c) => c.id === replace);
      if (i < 0) return;
      cards[i].observer?.disconnect();
      cards[i].node?.remove();
      cards[i] = { id: nextId++, slug };
      lastRemoved = null;
    } else {
      if (cards.length >= 4) {
        announce(t('fullHint'));
        return;
      }
      cards.push({ id: nextId++, slug });
    }
    refresh();
    const card = replace !== null ? cards.find((c) => !c.ready) : cards[cards.length - 1];
    card?.node.focus({ preventScroll: true });
    announce(
      t(replace !== null ? 'replaced' : 'added') + (cards.length === 4 ? ' ' + t('fullHint') : ''),
    );
    return card;
  }
  function removeCard(id) {
    const index = cards.findIndex((c) => c.id === id),
      card = cards[index];
    if (!card) return;
    if (!captureCard(card)) return;
    card.ready = false;
    card.observer?.disconnect();
    cards.splice(index, 1);
    card.node.remove();
    lastRemoved = { card, index };
    refresh();
    announce(t('removed'), () => {
      if (!lastRemoved || cards.length === 4) return;
      const r = lastRemoved;
      cards.splice(Math.min(r.index, cards.length), 0, r.card);
      lastRemoved = null;
      refresh();
      announce(t('added'));
    });
  }
  function move(id, delta) {
    const i = cards.findIndex((c) => c.id === id),
      j = i + delta;
    if (j < 0 || j >= cards.length) return;
    [cards[i], cards[j]] = [cards[j], cards[i]];
    refresh();
    cards[j].node.focus({ preventScroll: true });
  }
  function openPicker(id, query = '') {
    if (id === null && cards.length >= 4) {
      announce(t('fullHint'));
      return;
    }
    replaceId = id;
    pickerPage = 1;
    pickerQuery = query;
    pickerDomain = 'all';
    $('picker-search').value = query;
    $('picker-domain').value = 'all';
    $('picker-title').textContent = t(id === null ? 'add' : 'replace');
    $('picker-hint').textContent = t(id === null ? 'pickerHint' : 'replaceHint');
    drawPicker();
    $('picker').showModal();
    $('picker-search').focus();
  }
  const clean = (s) =>
    String(s)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’'−‐–-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  function drawPicker() {
    const words = clean(pickerQuery).split(' ').filter(Boolean);
    const rows = catalog.filter(
      (x) =>
        (pickerDomain === 'all' || x.domain === pickerDomain) &&
        words.every((w) =>
          clean([window.CMI18n.searchText(x), domainName(x.domain)].join(' ')).includes(w),
        ),
    );
    const common = [
      'basic-calculator',
      'scientific-calculator',
      'percentage-calculator',
      'loan-calculator',
      'mortgage-calculator',
      'compound-interest-calculator',
      'discount-calculator',
      'sales-tax-calculator',
      'bmi-calculator',
      'merchant-profit-planner',
    ];
    const q = clean(pickerQuery);
    const rank = (x) => {
      const names = [x.name, ...Object.values(x.names || {})].map(clean);
      return q
        ? names.includes(q)
          ? 0
          : names.some((n) => n.startsWith(q))
            ? 1
            : names.some((n) => n.includes(q))
              ? 2
              : 3
        : common.includes(x.slug)
          ? common.indexOf(x.slug)
          : 99;
    };
    rows.sort((a, b) => rank(a) - rank(b));
    const pages = Math.max(1, Math.ceil(rows.length / size));
    pickerPage = Math.min(pickerPage, pages);
    const start = (pickerPage - 1) * size;
    $('picker-count').textContent = t('matches')(
      rows.length,
      rows.length ? start + 1 : 0,
      Math.min(start + size, rows.length),
    );
    const frag = document.createDocumentFragment();
    for (const x of rows.slice(start, start + size)) {
      const b = button(
          '',
          () => {
            const id = replaceId;
            $('picker').close();
            add(x.slug, id);
          },
          'pick-tool',
        ),
        span = el('span');
      span.append(
        el('b', '', toolName(x)),
        el(
          'small',
          '',
          domainName(x.domain) +
            ' · ' +
            (x.descriptions?.[lang] || window.CMI18n.translate(x.description)),
        ),
      );
      b.append(span, el('i', '', '＋'));
      frag.append(b);
    }
    if (!rows.length) frag.append(el('p', 'picker-empty', t('none')));
    $('picker-results').replaceChildren(frag);
    $('picker-prev').disabled = pickerPage <= 1;
    $('picker-next').disabled = pickerPage >= pages;
    $('picker-page').textContent = t('page')(pickerPage, pages);
  }
  function openTransfer(id) {
    const card = cards.find((c) => c.id === id);
    if (!card?.ready) {
      announce(t('loading'));
      return;
    }
    const targets = cards.filter((c) => c.id !== id && c.ready);
    if (!targets.length) {
      announce(t('noTargets'));
      return;
    }
    const results = numericResults(card);
    if (!results.length) {
      announce(t('noNumber'));
      return;
    }
    $('transfer-value').replaceChildren(
      ...results.map(
        (r) =>
          new Option(
            r.label +
              ' · ' +
              (r.display || window.CMI18n.number(r.value)) +
              (r.unit ? ' ' + window.CMI18n.unit(r.unit, r.value) : ''),
            String(r.value),
          ),
      ),
    );
    $('transfer-destination').replaceChildren(
      ...targets.map(
        (c) => new Option(cards.indexOf(c) + 1 + '. ' + toolName(bySlug.get(c.slug)), String(c.id)),
      ),
    );
    destinationChanged();
    $('transfer').showModal();
  }
  function destinationChanged() {
    const c = cards.find((c) => c.id === Number($('transfer-destination').value));
    const d = c?.frame.contentDocument;
    const fields = d ? visibleFields(d).filter((f) => f.type === 'number' && !f.readOnly) : [];
    $('transfer-field').replaceChildren(
      new Option(t('pickField'), ''),
      ...fields.map((f) => new Option(labelFor(d, f) + ' · ' + f.value, f.id)),
    );
    preview();
  }
  function preview() {
    const n = $('transfer-value').value,
      d = $('transfer-destination').selectedOptions[0]?.textContent || '',
      f = $('transfer-field').selectedOptions[0]?.textContent || '';
    $('transfer-preview').textContent = t('preview')(n, d, f);
    $('transfer-submit').disabled = !$('transfer-field').value;
  }
  $('transfer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const card = cards.find((c) => c.id === Number($('transfer-destination').value)),
      doc = card?.frame.contentDocument,
      field = doc?.getElementById($('transfer-field').value),
      value = Number($('transfer-value').value);
    if (!field || !Number.isFinite(value)) return;
    const probe = doc.createElement('input');
    probe.type = 'number';
    probe.min = field.min;
    probe.max = field.max;
    probe.step = field.step;
    probe.defaultValue = field.defaultValue;
    probe.value = String(value);
    if (!probe.validity.valid) {
      $('transfer-preview').textContent = t('invalidField');
      return;
    }
    const win = card.frame.contentWindow;
    Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(
      field,
      String(value),
    );
    field.dispatchEvent(new win.Event('input', { bubbles: true }));
    field.dispatchEvent(new win.Event('change', { bubbles: true }));
    $('transfer').close();
    announce(t('sent'));
    card.node.scrollIntoView({ block: 'nearest' });
    field.focus({ preventScroll: true });
  });
  $('transfer-destination').addEventListener('change', destinationChanged);
  $('transfer-field').addEventListener('change', preview);
  $('transfer-value').addEventListener('change', preview);
  $('add-tool').addEventListener('click', () => openPicker(null));
  $('picker-search').addEventListener('input', (e) => {
    pickerQuery = e.target.value;
    pickerPage = 1;
    drawPicker();
  });
  $('picker-domain').addEventListener('change', (e) => {
    pickerDomain = e.target.value;
    pickerPage = 1;
    drawPicker();
  });
  $('picker-prev').addEventListener('click', () => {
    pickerPage--;
    drawPicker();
  });
  $('picker-next').addEventListener('click', () => {
    pickerPage++;
    drawPicker();
  });
  document
    .querySelectorAll('[data-close]')
    .forEach((b) => b.addEventListener('click', () => $(b.dataset.close).close()));
  $('help-toggle').addEventListener('click', () => {
    const expanded = $('help-toggle').getAttribute('aria-expanded') === 'true';
    $('help-toggle').setAttribute('aria-expanded', String(!expanded));
    $('ws-help').hidden = expanded;
  });
  $('save-layout').addEventListener('click', () => {
    try {
      localStorage.setItem('calcmintly-desk-v1', JSON.stringify(cards.map((c) => c.slug)));
      $('restore-layout').hidden = false;
      announce(t('saved'));
    } catch {
      announce(t('saveError'));
    }
  });
  $('restore-layout').addEventListener('click', () => {
    const saved = storageRead();
    if (!saved) return;
    cards.forEach((c) => c.observer?.disconnect());
    cards = saved.map((slug) => ({ id: nextId++, slug }));
    lastRemoved = null;
    refresh();
    announce(t('restored'));
  });
  document.querySelectorAll('[data-template]').forEach((b) =>
    b.addEventListener('click', () => {
      const pair = templates[b.dataset.template];
      if (cards.length + pair.length > 4) {
        announce(t('templateFull'));
        return;
      }
      pair.forEach((s) => cards.push({ id: nextId++, slug: s }));
      refresh();
      announce(t('added'));
    }),
  );
  function updateLanguage() {
    lang = window.CMI18n.language;
    updateShell();
    for (const card of cards) {
      const data = bySlug.get(card.slug);
      card.node.querySelector('h2').textContent = toolName(data);
      const category = card.node.querySelector('.ws-card-category');
      category.lastChild.textContent = domainName(data.domain);
      const ab = card.node.querySelectorAll('.ws-card-actions button');
      ab[1].setAttribute('aria-label', t('earlier'));
      ab[2].setAttribute('aria-label', t('later'));
      ab[3].setAttribute('aria-label', t('remove'));
      card.node.setAttribute('aria-label', toolName(data));
      card.node.querySelector('.replace').textContent = t('replace');
      card.node.querySelector('.ws-card-footer button').textContent = t('send') + ' →';
      card.node.querySelector('.ws-card-footer a').textContent = t('full');
      card.frame.title = toolName(data);
      card.frame.contentWindow.CMI18n?.setLanguage(lang);
    }
    refresh();
    if ($('picker').open) drawPicker();
  }
  document.addEventListener('cm:language', updateLanguage);
  document.addEventListener('cm:translations', updateLanguage);
  window.CMWorkspace = {
    cards: () => cards,
    add,
    openPicker,
    results: numericResults,
    fields: visibleFields,
    labelFor,
    announce,
    refresh,
    get pendingAdd() {
      return pendingAdd;
    },
    replaceAll(slugs) {
      cards.forEach((c) => c.observer?.disconnect());
      cards = slugs
        .filter((s) => bySlug.has(s))
        .slice(0, 4)
        .map((slug) => ({ id: nextId++, slug }));
      lastRemoved = null;
      refresh();
    },
  };
  updateShell();
  function sharedLayout() {
    if (!location.hash.startsWith('#desk=') || location.hash.length > 2048) return null;
    try {
      const value = JSON.parse(decodeURIComponent(location.hash.slice(6)));
      return value.v === 1 &&
        Array.isArray(value.tools) &&
        value.tools.length <= 4 &&
        value.tools.every((s) => bySlug.has(s))
        ? value.tools
        : null;
    } catch {
      return null;
    }
  }
  const shared = sharedLayout();
  window.addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#desk=')) return;
    const layout = sharedLayout();
    if (!layout) {
      announce(
        window.CMI18n.pick(
          'This layout link is invalid. Your current calculators are unchanged.|布局链接无效，当前计算器保持原状。',
        ),
      );
      return;
    }
    if (layout.length !== cards.length || layout.some((slug, k) => cards[k].slug !== slug)) {
      window.CMWorkspace.replaceAll(layout);
      announce(
        window.CMI18n.pick(
          'Shared layout loaded with fresh example values.|已载入分享布局，并使用新的示例数值。',
        ),
      );
    }
  });
  const saved = shared || storageRead();
  if (saved) cards = saved.map((slug) => ({ id: nextId++, slug }));
  const added = new URLSearchParams(location.search).get('add');
  if (bySlug.has(added)) {
    if (cards.length < 4) cards.push({ id: nextId++, slug: added });
    else pendingAdd = added;
  }
  refresh();
})();
