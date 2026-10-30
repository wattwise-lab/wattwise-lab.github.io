(() => {
  'use strict';
  const A = window.CMWorkspace,
    I = window.CMI18n,
    catalog = window.CMCatalog;
  if (!A || !I) return;
  const $ = (id) => document.getElementById(id),
    el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    },
    text = (s) => I.pick(s),
    name = (x) => x.names?.[I.language] || I.translate(x.name),
    button = (pair, action, cls = '') => {
      const b = el('button', cls, text(pair));
      b.type = 'button';
      b.dataset.cmPair = pair;
      b.addEventListener('click', action);
      return b;
    };
  const desk = $('desk'),
    panel = el('section', 'ws-search-panel'),
    title = el('h2', '', text('What do you need to calculate?|想算什么？')),
    label = el('label', 'cm-sr-only', I.t('searchLabel')),
    search = el('input'),
    hint = el('p', 'ws-search-hint'),
    results = el('div', 'ws-direct-results'),
    more = button('See all matches|查看全部匹配', () => A.openPicker(null, search.value));
  title.dataset.cmPair = 'What do you need to calculate?|想算什么？';
  search.type = 'search';
  search.id = 'ws-direct-search';
  search.maxLength = 120;
  search.autocomplete = 'off';
  search.placeholder = I.t('search');
  label.htmlFor = search.id;
  results.id = 'ws-direct-results';
  results.setAttribute('aria-label', I.t('results'));
  hint.id = 'ws-direct-status';
  hint.setAttribute('role', 'status');
  panel.append(title, label, search, hint, results, more);
  document.querySelector('.ws-actions').before(panel);
  let query = '';
  const chooser = el('dialog', 'ws-tool-choice'),
    form = el('form'),
    dialogTitle = el('h2'),
    message = el('p'),
    options = el('div', 'ws-tool-choice__options'),
    apply = button('Replace selected card|替换选中卡片', () => {}),
    cancel = button('Cancel|取消', () => chooser.close());
  apply.type = 'submit';
  form.append(dialogTitle, message, options, el('div', 'ws-tool-choice__actions'));
  form.lastChild.append(cancel, apply);
  chooser.append(form);
  document.body.append(chooser);
  let commit = () => {},
    returnFocus = null;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    commit();
    chooser.close();
  });
  chooser.addEventListener('close', () => returnFocus?.isConnected && returnFocus.focus());
  function choose(slug) {
    if (A.cards().length < 4) {
      search.value = '';
      A.add(slug, null);
      return;
    }
    returnFocus = document.activeElement;
    dialogTitle.textContent = text('Choose a card to replace|选择要替换的卡片');
    message.textContent =
      name(catalog.find((x) => x.slug === slug)) +
      ' · ' +
      text('The other cards keep their current inputs.|其他卡片保留当前输入。');
    options.replaceChildren();
    const select = el('select'),
      l = el('label', '', text('Replace this calculator|替换这台计算器'));
    select.id = 'ws-replace-target';
    l.htmlFor = select.id;
    select.append(
      new Option(text('Choose a card|请选择卡片'), ''),
      ...A.cards().map(
        (c, k) =>
          new Option(k + 1 + '. ' + name(catalog.find((x) => x.slug === c.slug)), String(c.id)),
      ),
    );
    select.required = true;
    select.addEventListener('change', () => (apply.disabled = !select.value));
    options.append(l, select);
    apply.dataset.cmPair = 'Replace selected card|替换选中卡片';
    apply.textContent = text(apply.dataset.cmPair);
    apply.disabled = true;
    commit = () => A.add(slug, Number(select.value));
    chooser.showModal();
    select.focus();
  }
  function draw() {
    query = search.value.trim().toLocaleLowerCase();
    const words = query.split(/\s+/).filter(Boolean),
      matches = [...catalog]
        .filter((x) => words.every((word) => I.searchText(x).toLocaleLowerCase().includes(word)))
        .sort((a, b) => a.priority - b.priority);
    results.replaceChildren();
    for (const item of matches.slice(0, 8)) {
      const b = button('', () => choose(item.slug), 'ws-direct-tool'),
        strong = el('strong', '', name(item)),
        small = el(
          'small',
          '',
          window.CMHomeCopy?.[I.language]?.domains?.[item.domain] || item.domain,
        ),
        icon = el('span', '', '＋');
      delete b.dataset.cmPair;
      b.setAttribute(
        'aria-label',
        text(A.cards().length < 4 ? 'Add|添加' : 'Replace with|替换为') + ' ' + name(item),
      );
      b.append(strong, small, icon);
      results.append(b);
    }
    hint.textContent = query
      ? I.number(matches.length) + ' ' + text('matching tools|个匹配工具')
      : text(
          'Eight everyday shortcuts. Search all 500 by name or purpose.|八个常用入口；按名称或用途搜索全部 500 个工具。',
        );
    results.hidden = A.cards().length > 0 && !query;
    more.hidden = matches.length <= 8 || results.hidden;
    more.disabled = A.cards().length >= 4;
    if (A.cards().length >= 4) {
      more.hidden = true;
      hint.textContent +=
        ' ' +
        text(
          'All four spaces are in use. Pick a tool below to choose which card to replace.|四个位置已满，点击下方工具后选择要替换的卡片。',
        );
    }
  }
  search.addEventListener('input', draw);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      results.querySelector('button')?.click();
    }
  });
  const packs = [
    [
      'House purchase|买房决策',
      [
        'mortgage-calculator',
        'rent-vs-buy-calculator',
        'affordable-loan-amount-calculator',
        'remaining-loan-balance-calculator',
      ],
      'Monthly housing, buy or rent, loan amount and remaining debt.|月住房开销、租买比较、可借金额与剩余负债',
    ],
    [
      'Run a shop|经营店铺',
      [
        'merchant-profit-planner',
        'break-even-calculator',
        'return-on-ad-spend-calculator',
        'target-margin-price-calculator',
      ],
      'Pricing, break-even, advertising and target margin.|定价、保本、广告与目标利润率',
    ],
    [
      'Personal planning|个人安排',
      [
        'plan-collision-calculator',
        'life-single-point-failure-calculator',
        'future-commitment-lock-calculator',
      ],
      'Time collisions, dependencies and future commitments.|时间冲突、资源依赖与未来承诺',
    ],
    [
      'Freelance work|自由职业',
      [
        'freelance-real-rate',
        'ai-workflow-savings',
        'ai-inference-cost',
        'context-token-budget-calculator',
      ],
      'Actual hourly pay, automation savings and AI budgets.|实际时薪、自动化节省与 AI 预算',
    ],
    [
      'Everyday shopping|日常购物',
      ['discount-calculator', 'sales-tax-calculator', 'weighted-bill-split-calculator'],
      'Discount, tax and fair bill splitting.|折扣、税费与分账',
    ],
    [
      'Savings plan|储蓄计划',
      ['compound-interest-calculator', 'savings-goal-calculator', 'savings-withdrawal-calculator'],
      'Growth, goal contributions and withdrawal duration.|增长、目标投入与提取期限',
    ],
  ];
  const starters = $('ws-starters'),
    summary = el('summary', '', text('Start with a goal|按目标开始'));
  summary.dataset.cmPair = 'Start with a goal|按目标开始';
  starters.replaceChildren(summary);
  const packGrid = el('div', 'ws-goal-packs');
  for (const [title, slugs, description] of packs) {
    const b = button('', () => loadPack(title, slugs), 'ws-goal-pack'),
      strong = el('strong'),
      p = el('span');
    delete b.dataset.cmPair;
    strong.dataset.cmPair = title;
    strong.textContent = text(title);
    p.dataset.cmPair = description;
    p.textContent = text(description);
    b.append(strong, p);
    packGrid.append(b);
  }
  starters.append(packGrid);
  function loadPack(title, slugs) {
    if (A.cards().length + slugs.length <= 4) {
      slugs.forEach((slug) => A.add(slug, null));
      return;
    }
    returnFocus = document.activeElement;
    dialogTitle.textContent = text(title);
    message.textContent = text(
      'This goal pack replaces the current layout with example inputs. Current input values are not saved.|此目标组合将用示例输入替换当前布局，当前输入值不会保存。',
    );
    options.replaceChildren(
      ...slugs.map((slug) => el('p', '', name(catalog.find((x) => x.slug === slug)))),
    );
    apply.dataset.cmPair = 'Use this goal pack|使用此目标组合';
    apply.textContent = text(apply.dataset.cmPair);
    apply.disabled = false;
    commit = () => A.replaceAll(slugs);
    chooser.showModal();
    cancel.focus();
  }
  const share = button('Share layout|分享布局', async () => {
      const url = new URL(I.url('/workspace'), location.origin);
      url.hash =
        'desk=' + encodeURIComponent(JSON.stringify({ v: 1, tools: A.cards().map((c) => c.slug) }));
      try {
        await navigator.clipboard.writeText(url.href);
        A.announce(
          text(
            'Layout link copied. It contains tool choices only, without your input values.|布局链接已复制，仅含工具选择，不含输入值。',
          ),
        );
      } catch {
        A.announce(I.t('copyFail'));
      }
    }),
    csv = button('Export results CSV|导出结果 CSV', () => {
      const data = [
        [text('Calculator|计算器'), text('Input or result|输入或结果'), text('Value|数值')],
      ];
      for (const card of A.cards()) {
        const tool = name(catalog.find((x) => x.slug === card.slug)),
          doc = card.frame?.contentDocument;
        if (!card.ready || !doc) continue;
        for (const input of A.fields(doc)) data.push([tool, A.labelFor(doc, input), input.value]);
        for (const result of A.results(card))
          data.push([
            tool,
            result.label + (result.unit ? ' (' + result.unit + ')' : ''),
            result.value,
          ]);
      }
      const cell = (value) => {
          let s = String(value);
          if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        },
        blob = new Blob(['\uFEFF' + data.map((row) => row.map(cell).join(',')).join('\r\n')], {
          type: 'text/csv;charset=utf-8',
        }),
        url = URL.createObjectURL(blob),
        a = el('a');
      a.href = url;
      a.download = 'calcmintly-workspace.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  $('save-layout').after(share, csv);
  const overview = el('section', 'ws-overview'),
    overviewTitle = el('h2', '', text('Current results|当前结果')),
    overviewList = el('div');
  overviewTitle.dataset.cmPair = 'Current results|当前结果';
  overview.append(overviewTitle, overviewList);
  desk.before(overview);
  function resultSummary() {
    overview.hidden = A.cards().length === 0;
    share.disabled = A.cards().length === 0;
    csv.disabled = !A.cards().some((c) => c.ready);
    overviewList.replaceChildren();
    for (const card of A.cards()) {
      const b = button(
          '',
          () => {
            card.node.scrollIntoView({ block: 'start' });
            card.node.focus({ preventScroll: true });
          },
          'ws-overview__item',
        ),
        strong = el('strong', '', name(catalog.find((x) => x.slug === card.slug))),
        value = el('span'),
        rows = card.ready ? A.results(card) : [];
      delete b.dataset.cmPair;
      value.textContent = rows.length
        ? rows[0].label +
          ': ' +
          I.number(
            rows[0].value,
            rows[0].unit?.startsWith('USD')
              ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              : { maximumSignificantDigits: 8 },
          ) +
          (rows[0].unit ? ' ' + I.unit(rows[0].unit, rows[0].value) : '')
        : text(
            card.ready
              ? 'Open the card to inspect the result|打开卡片查看结果'
              : 'Loading…|正在加载…',
          );
      b.append(strong, value);
      overviewList.append(b);
    }
  }
  const watched = new WeakSet();
  function watchCards() {
    for (const card of A.cards()) {
      if (!card.frame || watched.has(card.frame)) continue;
      watched.add(card.frame);
      card.frame.addEventListener('load', () => {
        const doc = card.frame.contentDocument;
        if (doc) {
          doc.addEventListener('input', () => setTimeout(resultSummary, 80));
          doc.addEventListener('change', () => setTimeout(resultSummary, 80));
          doc.addEventListener('cm:model-updated', resultSummary);
        }
        resultSummary();
      });
    }
  }
  function refresh() {
    I.apply(panel);
    I.apply(starters);
    draw();
    watchCards();
    resultSummary();
  }
  document.addEventListener('cm:workspace-change', refresh);
  document.addEventListener('cm:workspace-results', resultSummary);
  document.addEventListener('cm:language', refresh);
  document.addEventListener('cm:translations', refresh);
  refresh();
  if (A.pendingAdd) choose(A.pendingAdd);
})();
