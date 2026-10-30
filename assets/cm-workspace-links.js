(() => {
  'use strict';
  const A = window.CMWorkspace,
    I = window.CMI18n,
    U = window.CMUnits;
  if (!A || !I || !U) return;
  const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    },
    p = (s) => I.pick(s),
    pair = (tag, s, cls = '') => {
      const e = el(tag, cls, p(s));
      e.dataset.cmPair = s;
      return e;
    },
    button = (s, fn) => {
      const b = pair('button', s);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    },
    name = (card) => {
      const tool = window.CMCatalog.find((t) => t.slug === card.slug);
      return tool?.names?.[I.language] || I.translate(tool?.name || card.slug);
    },
    byId = (id) => A.cards().find((c) => String(c.id) === String(id));
  const panel = el('details', 'ws-links'),
    summary = pair('summary', 'Link numbers between calculators|连接计算器数值'),
    form = el('form', 'ws-links__form'),
    source = el('select'),
    result = el('select'),
    destination = el('select'),
    field = el('select'),
    preview = el('p', 'ws-links__preview'),
    create = pair('button', 'Create live link|建立持续联动'),
    status = el('p', 'ws-links__status'),
    list = el('div', 'ws-links__list');
  create.type = 'submit';
  status.setAttribute('role', 'status');
  preview.setAttribute('role', 'status');
  const help = pair(
    'p',
    'Choose a declared result unit and a compatible destination unit. Conversion is shown before linking. Links stay in this tab, pause on invalid values, and are excluded from saved or shared layouts.|选择单位明确的结果和兼容输入，建立前会显示换算。联动仅留在当前标签页，数值无效时暂停，不写入保存或分享的布局。',
    'ws-links__help',
  );
  for (const [input, id, label] of [
    [source, 'ws-link-source', 'Source calculator|来源计算器'],
    [result, 'ws-link-result', 'Source result|来源结果'],
    [destination, 'ws-link-destination', 'Destination calculator|目标计算器'],
    [field, 'ws-link-field', 'Destination input|目标输入项'],
  ]) {
    input.id = id;
    input.required = true;
    const labelEl = pair('label', label),
      box = el('div');
    labelEl.htmlFor = id;
    box.append(labelEl, input);
    form.append(box);
  }
  form.append(preview, create);
  panel.append(summary, help, form, status, list);
  document.getElementById('desk').before(panel);
  let links = [],
    next = 1,
    busy = false,
    queued = false;
  const watched = new WeakSet();
  function fields(card) {
    if (!card?.ready) return [];
    const bridge = card.frame.contentWindow.CMCalculatorBridge;
    return (bridge?.inputs() || []).filter((f) => {
      const input = card.frame.contentDocument.getElementById(f.id);
      return input?.type === 'number' && input.getClientRects().length && !input.disabled;
    });
  }
  function options(select, items, empty) {
    const old = select.value;
    select.replaceChildren(
      new Option(p(empty), ''),
      ...items.map((x) => new Option(x.label, x.value)),
    );
    if (items.some((x) => String(x.value) === old)) select.value = old;
  }
  function updateChoices() {
    const cards = A.cards().filter((c) => c.ready);
    options(
      source,
      cards.map((c) => ({ value: c.id, label: name(c) })),
      'Choose a calculator|请选择计算器',
    );
    options(
      destination,
      cards
        .filter((c) => String(c.id) !== source.value)
        .map((c) => ({ value: c.id, label: name(c) })),
      'Choose a calculator|请选择计算器',
    );
    const src = byId(source.value),
      dst = byId(destination.value);
    options(
      result,
      (src ? A.results(src) : []).map((r, k) => ({
        value: String(r.key ?? k),
        label: r.label + ' · ' + I.number(r.value) + (r.unit ? ' ' + r.unit : ''),
      })),
      'Choose a result|请选择结果',
    );
    options(
      field,
      fields(dst).map((f) => ({
        value: f.id,
        label: f.label + ' · ' + (f.unit || p('unit not declared|未声明单位')),
      })),
      'Choose an input|请选择输入项',
    );
    drawPreview();
  }
  function selection() {
    const src = byId(source.value),
      dst = byId(destination.value),
      row =
        src && result.value !== ''
          ? A.results(src).find((row, k) => String(row.key ?? k) === result.value)
          : null,
      target = fields(dst).find((f) => f.id === field.value);
    return { src, dst, row, target };
  }
  function probe(input, value) {
    const x = input.ownerDocument.createElement('input');
    x.type = 'number';
    for (const attribute of ['min', 'max', 'step'])
      if (input.hasAttribute(attribute)) x.setAttribute(attribute, input.getAttribute(attribute));
    x.defaultValue = input.defaultValue;
    x.value = String(value);
    return x.validity.valid;
  }
  function cycles(src, dst) {
    const graph = new Map();
    for (const link of links) {
      if (!graph.has(link.source)) graph.set(link.source, []);
      graph.get(link.source).push(link.destination);
    }
    const seen = new Set(),
      todo = [dst];
    while (todo.length) {
      const n = todo.pop();
      if (n === src) return true;
      if (seen.has(n)) continue;
      seen.add(n);
      todo.push(...(graph.get(n) || []));
    }
    return false;
  }
  function drawPreview() {
    create.disabled = true;
    const { src, dst, row, target } = selection();
    preview.textContent = p(
      'Choose the source, result and destination input.|请选择来源、结果和目标输入。',
    );
    if (!row || !target) return;
    const c = U.contract(row.unit, target.unit);
    if (c.state !== 'compatible') {
      preview.textContent = p(
        c.state === 'unknown'
          ? 'A unit is not declared. Use “Send result” for a deliberate one-time copy; live linking is unavailable.|有单位未明确声明，请使用「传递结果」手动复制一次，暂不提供持续联动。'
          : 'These units describe different quantities. Choose a compatible input.|这些单位对应不同的量，请选择兼容输入。',
      );
      return;
    }
    if (cycles(src.id, dst.id)) {
      preview.textContent = p(
        'This would create a circular calculation. Remove a link before reversing its direction.|这会形成循环计算，请先移除已有联动再反转方向。',
      );
      return;
    }
    if (links.some((l) => l.destination === dst.id && l.field === target.id)) {
      preview.textContent = p(
        'This input already has a link. Remove it before choosing another source.|此输入已有联动，请先移除，再选择其他来源。',
      );
      return;
    }
    const value = U.convert(row.value, row.unit, target.unit),
      input = dst.frame.contentDocument.getElementById(target.id);
    preview.textContent =
      I.number(row.value) +
      ' ' +
      row.unit +
      ' → ' +
      I.number(value) +
      ' ' +
      target.unit +
      ' · ' +
      p('This replaces the destination value and keeps it linked.|这会替换目标数值并保持联动。');
    create.disabled = value === null || !probe(input, value);
    if (create.disabled)
      preview.textContent +=
        ' ' +
        p(
          'The converted value does not meet the destination range or step.|换算值不符合目标输入的范围或步进。',
        );
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    drawPreview();
    if (create.disabled) return;
    const { src, dst, target } = selection();
    if (links.length >= 12) {
      status.textContent = p(
        'This workspace supports up to twelve live links.|当前工作台最多支持十二条持续联动。',
      );
      return;
    }
    const input = dst.frame.contentDocument.getElementById(target.id),
      link = {
        id: next++,
        source: src.id,
        result: String(result.value),
        destination: dst.id,
        field: target.id,
        readOnly: input.readOnly,
        customValidity: input.validity.customError ? input.validationMessage : '',
        state: '',
      };
    links.push(link);
    input.readOnly = true;
    input.setAttribute('data-ws-linked', '');
    status.textContent = p(
      'Live link created. Remove it to edit the destination directly.|已建立持续联动，移除后可直接编辑目标输入。',
    );
    propagate();
    draw();
    drawPreview();
  });
  for (const input of [source, result, destination, field])
    input.addEventListener('change', updateChoices);
  const pausedMessage = () =>
    p(
      'The source calculator has no compatible valid result. This link is paused. Fix the source or remove the link before editing this input.|源计算器暂无兼容的有效结果，联动已暂停。请修正来源，或移除联动后编辑此项。',
    );
  function notifyInput(input, card) {
    const w = card.frame.contentWindow;
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
  }
  function pause(link, input, card) {
    if (!input || !card) return;
    const message = pausedMessage(),
      changed = input.getAttribute('data-ws-link-paused') !== message;
    input.readOnly = true;
    input.dataset.wsLinkPaused = message;
    input.setCustomValidity(message);
    if (changed) notifyInput(input, card);
  }
  function release(link) {
    const card = byId(link.destination),
      input = card?.frame?.contentDocument?.getElementById(link.field);
    if (input) {
      const paused = input.hasAttribute('data-ws-link-paused');
      input.readOnly = link.readOnly;
      input.removeAttribute('data-ws-linked');
      input.removeAttribute('data-ws-link-paused');
      if (paused) {
        input.setCustomValidity(link.customValidity || '');
        notifyInput(input, card);
      }
    }
  }
  function remove(id) {
    const link = links.find((l) => l.id === id);
    if (link) release(link);
    links = links.filter((l) => l.id !== id);
    draw();
    drawPreview();
  }
  function draw() {
    list.replaceChildren();
    for (const link of links) {
      const src = byId(link.source),
        dst = byId(link.destination);
      if (!src || !dst) continue;
      const row = el('div', 'ws-links__item'),
        text = el(
          'p',
          '',
          name(src) +
            ' → ' +
            name(dst) +
            ' / ' +
            (fields(dst).find((f) => f.id === link.field)?.label || link.field),
        ),
        small = el('span', '', p(link.state || 'Waiting for values|等待数值')),
        removeButton = button('Remove link|移除联动', () => remove(link.id));
      text.append(small);
      row.append(text, removeButton);
      list.append(row);
    }
  }
  function propagate() {
    if (busy) return;
    busy = true;
    for (let pass = 0; pass < A.cards().length; pass++)
      for (const link of links) {
        const src = byId(link.source),
          dst = byId(link.destination),
          input = dst?.frame?.contentDocument?.getElementById(link.field),
          row = src?.ready
            ? A.results(src).find((row, k) => String(row.key ?? k) === link.result)
            : null,
          target = fields(dst).find((f) => f.id === link.field);
        if (!row || !input || !target) {
          link.state = 'Paused: source or destination is unavailable.|暂停：来源或目标不可用。';
          pause(link, input, dst);
          continue;
        }
        const value = U.convert(row.value, row.unit, target.unit);
        if (value === null || !probe(input, value)) {
          link.state =
            'Paused: units, range or step are incompatible.|暂停：单位、范围或步进不兼容。';
          pause(link, input, dst);
          continue;
        }
        link.state = 'Linked; destination follows the source.|持续联动中，目标跟随来源。';
        input.readOnly = true;
        const resumed = input.hasAttribute('data-ws-link-paused');
        if (resumed) {
          input.removeAttribute('data-ws-link-paused');
          input.setCustomValidity(link.customValidity || '');
        }
        if (resumed || Number(input.value) !== value || input.value === '') {
          input.value = String(value);
          notifyInput(input, dst);
        }
      }
    busy = false;
    draw();
    document.dispatchEvent(new Event('cm:workspace-results'));
  }
  function queue() {
    if (busy || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      propagate();
      drawPreview();
    });
  }
  function watch() {
    for (const card of A.cards()) {
      if (!card.frame || watched.has(card.frame)) continue;
      watched.add(card.frame);
      const bind = () => {
        const doc = card.frame.contentDocument;
        if (!doc) return;
        for (const type of ['input', 'change', 'cm:model-updated'])
          doc.addEventListener(type, queue);
        updateChoices();
        queue();
      };
      card.frame.addEventListener('load', bind);
      if (card.ready) bind();
    }
  }
  function refresh() {
    const ids = new Set(A.cards().map((c) => c.id));
    for (const link of links)
      if (!ids.has(link.source) || !ids.has(link.destination)) release(link);
    links = links.filter((l) => ids.has(l.source) && ids.has(l.destination));
    watch();
    updateChoices();
    draw();
    I.apply(panel);
  }
  document.addEventListener('cm:workspace-change', refresh);
  document.addEventListener('cm:workspace-results', updateChoices);
  document.addEventListener('cm:language', refresh);
  document.addEventListener('cm:translations', refresh);
  refresh();
  // A print report uses text nodes only, includes assumptions and omits unloaded / invalid results.
  const report = el('section', 'ws-print-report'),
    print = button('Print workspace / PDF|打印工作台或保存 PDF', () => {
      report.replaceChildren(
        pair('h2', 'Calculator workspace report|计算器工作台报告'),
        el(
          'p',
          '',
          new Intl.DateTimeFormat(I.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
            new Date(),
          ),
        ),
        pair(
          'p',
          'Inputs and results are a snapshot of this tab. Check each calculator’s full formula and limitations before making decisions.|输入与结果为当前标签页快照，请结合各计算器完整公式及限制核对后决策。',
        ),
      );
      for (const card of A.cards()) {
        const section = el('section'),
          h = el('h3', '', name(card)),
          dl = el('dl');
        section.append(h);
        if (!card.ready) section.append(pair('p', 'Calculator not loaded.|计算器尚未载入。'));
        else {
          for (const input of A.fields(card.frame.contentDocument)) {
            dl.append(
              el('dt', '', A.labelFor(card.frame.contentDocument, input)),
              el('dd', '', input.value),
            );
          }
          const rows = A.results(card);
          for (const row of rows)
            dl.append(
              el('dt', '', row.label),
              el('dd', '', I.number(row.value) + (row.unit ? ' ' + row.unit : '')),
            );
          if (!rows.length)
            section.append(pair('p', 'No valid numeric result.|没有有效数值结果。'));
          section.append(dl, el('p', '', 'https://calcmintly.com/' + card.slug));
        }
        report.append(section);
      }
      if (links.length) {
        report.append(pair('h2', 'Active links|当前联动'));
        for (const link of links)
          report.append(
            el(
              'p',
              '',
              name(byId(link.source)) +
                ' → ' +
                name(byId(link.destination)) +
                ' / ' +
                link.field +
                ' · ' +
                p(link.state),
            ),
          );
      }
      window.print();
    });
  document.getElementById('save-layout').after(print);
  document.querySelector('main').append(report);
})();
