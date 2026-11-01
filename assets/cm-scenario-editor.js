(() => {
  'use strict';
  const I = window.CMI18n,
    model = window.CMModels?.models.find((m) => m.slug === document.body.dataset.model);
  if (!model?.editor || !I) return;
  const meta = model.editor,
    source = document.getElementById(meta.field),
    parent = source.closest('.field--wide'),
    box = document.createElement('section'),
    heading = document.createElement('h3'),
    list = document.createElement('div'),
    actions = document.createElement('div'),
    add = document.createElement('button'),
    hint = document.createElement('p'),
    details = document.createElement('section');
  box.className = 'cm-scenario-editor';
  heading.dataset.cmPair = meta.title;
  heading.textContent = I.pick(meta.title);
  actions.className = 'cm-expanded__actions';
  add.type = 'button';
  add.dataset.cmPair = 'Add item|添加项目';
  add.textContent = I.pick(add.dataset.cmPair);
  hint.dataset.cmPair =
    'Edit each item directly. Up to 20 items; removing an item immediately updates the comparison.|直接编辑每个项目，最多 20 项；移除项目会立即更新比较。';
  hint.textContent = I.pick(hint.dataset.cmPair);
  hint.className = 'cm-expanded__note';
  details.className = 'cm-scenario-detail';
  details.id = 'cm-scenario-detail';
  details.setAttribute('aria-live', 'off');
  actions.append(add);
  box.append(heading, hint, list, actions);
  parent.append(box);
  source.hidden = true;
  parent.querySelector('label').hidden = true;
  const hero = document.querySelector('.hero');
  hero.after(details);
  let serialized = '',
    rows = [],
    sequence = 0;
  function sync() {
    source.value = rows.map((row) => row.inputs.map((x) => x.value.trim()).join(';')).join('\n');
    serialized = source.value;
    source.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function makeRow(values) {
    const fieldset = document.createElement('fieldset'),
      legend = document.createElement('legend'),
      grid = document.createElement('div'),
      remove = document.createElement('button');
    fieldset.className = 'cm-scenario-editor__item';
    grid.className = 'cm-scenario-editor__grid';
    legend.textContent = I.pick('Item|项目') + ' ' + (rows.length + 1);
    remove.type = 'button';
    remove.className = 'cm-scenario-editor__remove';
    remove.textContent = I.t('remove');
    const row = { fieldset, legend, remove, inputs: [] };
    const id = ++sequence;
    meta.columns.forEach((column, k) => {
      const field = document.createElement('div'),
        label = document.createElement('label'),
        input = document.createElement('input');
      input.id = 'cm-scenario-' + id + '-' + k;
      input.type = column.type;
      input.value = String(values[k] ?? '');
      input.required = k !== meta.columns.length - 1 || column.key !== 'needs';
      input.autocomplete = 'off';
      if (column.type === 'number') {
        input.min = String(column.min);
        input.max = String(column.max);
        input.step = ['start', 'end', 'earliest', 'notice'].includes(column.key) ? '1' : 'any';
        input.inputMode = 'decimal';
      } else input.maxLength = column.key === 'needs' ? 1000 : 60;
      label.htmlFor = input.id;
      label.dataset.cmPair = column.label;
      label.textContent = I.pick(column.label);
      input.addEventListener('input', () => {
        const invalid =
          !input.validity.valid || input.value.includes(';') || input.value.includes('\n');
        input.setAttribute('aria-invalid', String(invalid));
        sync();
      });
      field.append(label, input);
      grid.append(field);
      row.inputs.push(input);
    });
    remove.addEventListener('click', () => {
      rows = rows.filter((x) => x !== row);
      fieldset.remove();
      updateNames();
      sync();
    });
    fieldset.append(legend, grid, remove);
    list.append(fieldset);
    rows.push(row);
    return row;
  }
  function updateNames() {
    rows.forEach((row, k) => {
      row.legend.textContent = I.pick('Item|项目') + ' ' + (k + 1);
      row.remove.textContent = I.t('remove');
      row.remove.setAttribute(
        'aria-label',
        I.t('remove') + ' ' + (row.inputs[0].value || String(k + 1)),
      );
      row.remove.disabled = rows.length <= 1;
    });
    add.disabled = rows.length >= 20;
  }
  function refresh() {
    if (source.value === serialized) return;
    serialized = source.value;
    rows = [];
    list.replaceChildren();
    for (const line of source.value.split('\n').filter((x) => x.trim()))
      makeRow(line.split(';').map((x) => x.trim()));
    updateNames();
  }
  add.addEventListener('click', () => {
    if (rows.length >= 20) return;
    const values = [...meta.sample];
    let name = I.translate(values[0]),
      index = rows.length + 1;
    while (rows.some((r) => r.inputs[0].value === name))
      name = I.translate(values[0]) + ' ' + index++;
    values[0] = name;
    const row = makeRow(values);
    updateNames();
    sync();
    row.inputs[0].focus();
  });
  function graph(values) {
    if (!model.graph) return null;
    const nodes = model.graph(values),
      depths = new Map(),
      depth = (name) => {
        if (depths.has(name)) return depths.get(name);
        const node = nodes.find((x) => x.name === name),
          d = node.needs.length ? Math.max(...node.needs.map(depth)) + 1 : 0;
        depths.set(name, d);
        return d;
      };
    nodes.forEach((n) => depth(n.name));
    const levels = new Map(),
      positions = new Map();
    for (const node of nodes) {
      const d = depths.get(node.name),
        row = levels.get(d) || 0;
      positions.set(node.name, { x: 20 + d * 230, y: 20 + row * 100 });
      levels.set(d, row + 1);
    }
    const w = 220 + Math.max(...depths.values()) * 230,
      h = 30 + Math.max(...levels.values()) * 100,
      card = document.createElement('section'),
      heading = document.createElement('h2'),
      hint = document.createElement('p'),
      scroll = document.createElement('div'),
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    card.className = 'card';
    heading.textContent = I.pick('Dependency map|依赖关系图');
    hint.textContent = I.pick(
      'Arrows point from required resources to dependent activities. The table below provides the full names, dependencies and interruption durations.|箭头从必要资源指向依赖活动，下表提供完整名称、依赖与中断时长。',
    );
    hint.className = 'cm-expanded__note';
    scroll.className = 'cm-dependency-map';
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', I.pick('Scrollable dependency map|可滚动依赖图'));
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('aria-hidden', 'true');
    const shape = (tag, attrs, text) => {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      if (text !== undefined) e.textContent = text;
      return e;
    };
    for (const node of nodes) {
      const b = positions.get(node.name);
      for (const need of node.needs) {
        const a = positions.get(need),
          x = a.x + 180,
          y = a.y + 29,
          end = b.x - 9,
          ey = b.y + 29;
        svg.append(
          shape('path', {
            d:
              'M' +
              x +
              ' ' +
              y +
              ' C' +
              (x + 25) +
              ' ' +
              y +
              ',' +
              (end - 25) +
              ' ' +
              ey +
              ',' +
              end +
              ' ' +
              ey,
            class: 'cm-dependency-map__edge',
          }),
          shape('path', {
            d:
              'M' +
              (end - 5) +
              ' ' +
              (ey - 4) +
              ' L' +
              end +
              ' ' +
              ey +
              ' L' +
              (end - 5) +
              ' ' +
              (ey + 4),
            class: 'cm-dependency-map__edge',
          }),
        );
      }
    }
    for (const node of nodes) {
      const a = positions.get(node.name),
        g = shape('g', {
          transform: 'translate(' + a.x + ' ' + a.y + ')',
          class: node.failed ? 'cm-dependency-map__node is-failed' : 'cm-dependency-map__node',
        });
      g.append(
        shape('rect', { width: 180, height: 66, rx: 9 }),
        shape(
          'text',
          { x: 12, y: 23, class: 'cm-dependency-map__name', 'data-cm-no-translate': '' },
          node.name.length > 20 ? node.name.slice(0, 19) + '…' : node.name,
        ),
        shape(
          'text',
          { x: 12, y: 47, class: 'cm-dependency-map__duration' },
          I.number(node.hours) +
            ' ' +
            I.unit('hours', node.hours) +
            (node.failed ? ' · ' + I.pick('Initial failure|初始故障') : ''),
        ),
      );
      svg.append(g);
    }
    scroll.append(svg);
    card.append(heading, hint, scroll);
    return card;
  }
  function draw(values, valid) {
    details.replaceChildren();
    details.hidden = !valid;
    if (!valid) return;
    try {
      const map = graph(values);
      if (map) details.append(map);
      for (const section of model.detail(values)) {
        const card = document.createElement('section'),
          h = document.createElement('h2'),
          scroll = document.createElement('div'),
          table = document.createElement('table'),
          caption = document.createElement('caption'),
          thead = document.createElement('thead'),
          tr = document.createElement('tr'),
          tbody = document.createElement('tbody');
        card.className = 'card';
        h.textContent = I.pick(section.title);
        scroll.className = 'cm-expanded__table';
        scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region');
        scroll.setAttribute('aria-label', I.pick(section.title));
        caption.textContent = I.pick(section.title);
        caption.className = 'cm-sr-only';
        for (const text of section.headers) {
          const th = document.createElement('th');
          th.scope = 'col';
          th.textContent = I.pick(text);
          tr.append(th);
        }
        thead.append(tr);
        for (const row of section.rows) {
          const tr = document.createElement('tr');
          row.forEach((value, k) => {
            const cell = document.createElement(k === 0 ? 'th' : 'td');
            if (k === 0) cell.scope = 'row';
            const raw = typeof value === 'string' && (k === 0 || section.rawColumns?.includes(k));
            if (raw) cell.dataset.cmNoTranslate = '';
            const dateValue =
              typeof value === 'string' && /^\d{4}-\d{2}(?:-\d{2})?$/.test(value) && !raw
                ? new Intl.DateTimeFormat(I.formatLocale, {
                    year: 'numeric',
                    month: 'short',
                    ...(value.length === 10 ? { day: 'numeric' } : {}),
                    timeZone: 'UTC',
                  }).format(new Date(value + (value.length === 7 ? '-01' : '') + 'T12:00:00Z'))
                : null;
            cell.textContent =
              dateValue ||
              (typeof value === 'number'
                ? I.number(value, { maximumSignificantDigits: 10 })
                : raw
                  ? value
                  : I.pick(value));
            tr.append(cell);
          });
          tbody.append(tr);
        }
        table.append(caption, thead, tbody);
        scroll.append(table);
        card.append(h, scroll);
        details.append(card);
      }
    } catch {
      details.hidden = true;
    }
  }
  document.addEventListener('cm:model-updated', (event) => {
    refresh();
    draw(event.detail.values, event.detail.valid);
  });
  document.addEventListener('cm:language', () => {
    I.apply();
    updateNames();
  });
  refresh();
  const values = Object.fromEntries(
    model.fields.map((f) => [
      f.id,
      f.type === 'number'
        ? Number(document.getElementById(f.id).value)
        : document.getElementById(f.id).value,
    ]),
  );
  draw(values, !document.body.classList.contains('cm-invalid'));
})();
