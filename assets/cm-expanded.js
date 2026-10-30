(() => {
  'use strict';
  const I = window.CMI18n,
    $ = (id) => document.getElementById(id),
    slug = document.body.dataset.model,
    model = window.CMModels?.models.find((m) => m.slug === slug);
  if (!model || !I) return;
  const embedded =
    location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  document.body.classList.add('cm-tool', 'cm-expanded');
  if (embedded) document.body.classList.add('cm-embedded');
  let values = Object.fromEntries(model.fields.map((f) => [f.id, f.value])),
    results = [],
    valid = false,
    scheduled = null,
    scenarios = [];
  const numberOptions = (value) =>
      value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e12)
        ? { maximumSignificantDigits: 8, notation: 'scientific' }
        : { maximumSignificantDigits: 12 },
    label = (value) => I.pick(value),
    format = (value, literal = false) =>
      typeof value === 'number'
        ? I.number(value, numberOptions(value))
        : literal
          ? String(value)
          : label(value);
  const presentations = {
    'ratio-simplifier-calculator': 'ratio',
    'mean-confidence-interval-calculator': 'interval',
    'proportion-confidence-interval-calculator': 'interval',
    'scientific-notation-calculator': 'notation',
    'midpoint-calculator': 'point',
    'section-formula-calculator': 'point',
    'triangle-centroid-calculator': 'point',
    'vector-cross-product-calculator': 'point',
    'matrix-inverse-calculator': 'matrix',
    'matrix-multiplication-calculator': 'matrix',
    'complex-number-calculator': 'complex',
    'matrix-eigenvalues-calculator': 'eigenvalues',
    'line-equation-calculator': 'line',
    'perpendicular-bisector-calculator': 'line',
  };
  function present(out) {
    const type = presentations[slug],
      result = $('result');
    result.classList.remove('cm-expanded__matrix');
    if (!type) return false;
    const values = out.map((r) => r.value),
      f = (x) => I.number(x, { ...numberOptions(x), useGrouping: false });
    if (type === 'matrix') {
      result.replaceChildren();
      result.classList.add('cm-expanded__matrix');
      for (const r of out) {
        const cell = document.createElement('span'),
          name = document.createElement('span');
        name.className = 'cm-sr-only';
        name.textContent = label(r.label) + ': ';
        cell.append(name, document.createTextNode(f(r.value)));
        result.append(cell);
      }
      $('cm-result-label').textContent = label('Result matrix|结果矩阵');
    }
    if (type === 'interval') {
      const f = (n) =>
        I.number(n, {
          maximumSignificantDigits: 7,
          useGrouping: false,
          ...(Math.abs(n) >= 1e7 || (Math.abs(n) > 0 && Math.abs(n) < 1e-6)
            ? { notation: 'scientific' }
            : {}),
        });
      result.textContent =
        f(values[0]) +
        (out[0].unit ? ' ' + I.unit(out[0].unit, values[0]) : '') +
        ' – ' +
        f(values[1]) +
        (out[1].unit ? ' ' + I.unit(out[1].unit, values[1]) : '');
      $('cm-result-label').textContent = I.message('Confidence interval ({0}%)|置信区间（{0}%）', [
        I.number(Number($('c').value)),
      ]);
    }
    if (type === 'point') {
      result.textContent = '(' + values.map(f).join('; ') + ')';
      $('cm-result-label').textContent = label('Coordinates|坐标');
    }
    if (type === 'ratio') {
      result.textContent = f(values[0]) + ' : ' + f(values[1]);
      $('cm-result-label').textContent = label('Reduced ratio|最简比例');
    }
    if (type === 'notation') {
      result.textContent = f(values[0]) + ' × 10';
      const exponent = document.createElement('sup');
      exponent.textContent = String(values[1]);
      result.append(exponent);
      $('cm-result-label').textContent = label('Scientific notation|科学计数法');
    }
    const complex = (real, imaginary) =>
      f(real) +
      (imaginary === 0 ? '' : (imaginary < 0 ? ' − ' : ' + ') + f(Math.abs(imaginary)) + 'i');
    if (type === 'complex') {
      result.textContent = complex(values[0], values[1]);
      $('cm-result-label').textContent = label('Complex result|复数结果');
    }
    if (type === 'eigenvalues') {
      result.textContent =
        'λ₁ = ' + complex(values[0], values[1]) + '; λ₂ = ' + complex(values[2], values[3]);
      $('cm-result-label').textContent = label('Eigenvalues|特征值');
    }
    if (type === 'line') {
      const terms = [];
      for (let k = 0; k < 2; k++) {
        const v = values[k];
        if (v !== 0)
          terms.push(
            (v < 0 ? '−' : terms.length ? '+' : '') +
              (Math.abs(v) === 1 ? '' : f(Math.abs(v))) +
              (k === 0 ? 'x' : 'y'),
          );
      }
      if (values[2] !== 0)
        terms.push((values[2] < 0 ? '−' : terms.length ? '+' : '') + f(Math.abs(values[2])));
      result.textContent = terms.join(' ') + ' = 0';
      $('cm-result-label').textContent = label('Line equation|直线方程');
    }
    return true;
  }
  function readValues() {
    const next = {};
    let bad = null;
    for (const field of model.fields) {
      const input = $(field.id);
      if (!input) continue;
      const raw = input.value;
      let value = field.type === 'number' ? Number(raw) : raw,
        invalid =
          field.type === 'number' &&
          (raw.trim() === '' ||
            !Number.isFinite(value) ||
            !input.validity.valid ||
            input.hasAttribute('data-ws-link-paused'));
      if (field.type === 'select' && !field.options.some((o) => o[0] === value)) invalid = true;
      if (['date', 'month'].includes(field.type) && (!raw || !input.validity.valid)) invalid = true;
      input.setAttribute('aria-invalid', String(invalid));
      if (invalid && !bad) bad = input;
      next[field.id] = value;
    }
    values = next;
    return bad;
  }
  function showError(message, field) {
    valid = false;
    results = [];
    $('result').textContent = '—';
    $('cm-result-rows').replaceChildren();
    $('cm-model-error').textContent =
      (field ? field.labels?.[0]?.textContent + ': ' : '') + message;
    $('cm-model-error').hidden = false;
    $('cm-copy').disabled = true;
    for (const id of ['cm-share', 'cm-csv', 'cm-print', 'cm-compare-add'])
      if ($(id)) $(id).disabled = true;
    document.body.classList.add('cm-invalid');
    document.dispatchEvent(
      new CustomEvent('cm:model-updated', { detail: { values, valid: false } }),
    );
  }
  function update() {
    scheduled = null;
    const bad = readValues();
    if (bad) {
      showError(
        bad.hasAttribute('data-ws-link-paused')
          ? bad.dataset.wsLinkPaused || bad.validationMessage
          : label('Enter a valid value within the displayed range.|请输入符合所示范围的有效值。'),
        bad,
      );
      return;
    }
    try {
      const out = model.calculate(values);
      if (
        !Array.isArray(out) ||
        !out.length ||
        out.some((r) => typeof r.value === 'number' && !Number.isFinite(r.value))
      )
        throw Error('Result is outside the finite numeric range.|结果超出有限数值范围。');
      results = out;
      valid = true;
      document.body.classList.remove('cm-invalid');
      $('cm-model-error').hidden = true;
      $('cm-copy').disabled = false;
      for (const id of ['cm-share', 'cm-csv', 'cm-print', 'cm-compare-add'])
        if ($(id)) $(id).disabled = id === 'cm-compare-add' && scenarios.length >= 3;
      $('cm-result-label').textContent = label(out[0].label);
      $('result').toggleAttribute('data-cm-no-translate', Boolean(out[0].literal));
      $('result').classList.toggle('cm-expanded__literal', Boolean(out[0].literal));
      $('result').textContent = format(out[0].value, out[0].literal);
      const aggregate = present(out);
      if (!aggregate) {
        const unit = document.createElement('span');
        unit.className = 'cm-expanded__unit';
        unit.textContent = out[0].unit ? I.unit(out[0].unit, out[0].value) : '';
        $('result').append(unit);
      }
      $('cm-result-rows').hidden = aggregate && presentations[slug] !== 'interval';
      $('cm-result-rows').replaceChildren(
        ...out.slice(presentations[slug] === 'interval' ? 2 : 1).map((r) => {
          const box = document.createElement('div'),
            dt = document.createElement('dt'),
            dd = document.createElement('dd');
          dt.textContent = label(r.label);
          if (r.literal) dd.setAttribute('data-cm-no-translate', '');
          dd.textContent =
            format(r.value, r.literal) + (r.unit ? ' ' + I.unit(r.unit, r.value) : '');
          if (typeof r.value === 'string' && /^[+-]?\d{16,}$/.test(r.value))
            dd.className = 'cm-expanded__exact-integer';
          box.append(dt, dd);
          return box;
        }),
      );
      document.dispatchEvent(
        new CustomEvent('cm:model-updated', { detail: { values, valid: true } }),
      );
    } catch (e) {
      showError(label(e.message));
    }
  }
  function schedule() {
    if (scheduled !== null) cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(update);
  }
  $('cm-model-form').addEventListener('input', schedule);
  $('cm-model-form').addEventListener('change', schedule);
  $('cm-model-form').addEventListener('submit', (e) => e.preventDefault());
  $('cm-reset').addEventListener('click', () => {
    for (const field of model.fields) $(field.id).value = String(field.value);
    $('cm-model-status').textContent = '';
    update();
  });
  const summary = () =>
    [
      label(model.name),
      ...model.fields.map((f) => label(f.label) + ': ' + values[f.id]),
      ...results.map(
        (r) =>
          label(r.label) +
          ': ' +
          format(r.value, r.literal) +
          (r.unit ? ' ' + I.unit(r.unit, r.value) : ''),
      ),
    ].join('\n');
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      $('cm-model-status').textContent = I.t('copied');
    } catch {
      $('cm-model-status').textContent = I.t('copyFail');
    }
  }
  $('cm-copy').addEventListener('click', () => {
    if (valid) copy(results[0].literal ? String(results[0].value) : summary());
  });
  $('cm-share')?.addEventListener('click', () => {
    if (!valid) return;
    const url = new URL(location.href);
    url.hash = 'cm=' + encodeURIComponent(JSON.stringify({ version: 1, slug, values }));
    if (
      url.hash.length > 12000 ||
      Object.values(values).some((value) => typeof value === 'string' && value.length > 8000)
    ) {
      $('cm-model-status').textContent = label(
        'This dataset is too long for a share link. Use CSV export instead.|这组数据超出分享链接长度限制，请改用 CSV 导出。',
      );
      return;
    }
    copy(url.href);
  });
  function csvCell(value) {
    let s = String(value);
    if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  }
  $('cm-csv').addEventListener('click', () => {
    if (!valid) return;
    const rows = [
      [label(model.name), ''],
      ...model.fields.map((f) => [label(f.label), values[f.id]]),
      ...results.map((r) => [label(r.label) + (r.unit ? ' (' + r.unit + ')' : ''), r.value]),
    ];
    const blob = new Blob(['\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = slug + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('cm-print').addEventListener('click', () => {
    if (valid) window.print();
  });
  $('cm-compare-add').addEventListener('click', () => {
    if (!valid || scenarios.length >= 3) return;
    scenarios.push({ values: { ...values }, results: results.map((r) => ({ ...r })) });
    drawCompare();
  });
  function drawCompare() {
    const box = $('cm-compare');
    box.hidden = scenarios.length === 0;
    $('cm-compare-add').disabled = scenarios.length >= 3;
    const table = $('cm-compare-table');
    table.replaceChildren();
    if (!scenarios.length) return;
    const head = document.createElement('thead'),
      tr = document.createElement('tr'),
      first = document.createElement('th');
    first.scope = 'col';
    first.textContent = I.translate('Input or result');
    tr.append(first);
    scenarios.forEach((scenario, index) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = String.fromCharCode(65 + index) + ' ';
      const restore = document.createElement('button');
      restore.type = 'button';
      restore.textContent = I.translate('Load');
      restore.addEventListener('click', () => {
        for (const f of model.fields) $(f.id).value = String(scenario.values[f.id]);
        update();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', I.t('remove') + ' ' + String.fromCharCode(65 + index));
      remove.addEventListener('click', () => {
        scenarios.splice(index, 1);
        drawCompare();
      });
      th.append(restore, remove);
      tr.append(th);
    });
    head.append(tr);
    table.append(head);
    const body = document.createElement('tbody');
    for (const field of model.fields) {
      const tr = document.createElement('tr'),
        th = document.createElement('th');
      th.scope = 'row';
      th.textContent = label(field.label);
      tr.append(th);
      for (const scenario of scenarios) {
        const td = document.createElement('td');
        td.textContent = String(scenario.values[field.id]);
        tr.append(td);
      }
      body.append(tr);
    }
    for (let index = 0; index < scenarios[0].results.length; index++) {
      const tr = document.createElement('tr'),
        th = document.createElement('th');
      th.scope = 'row';
      th.textContent = label(scenarios[0].results[index].label);
      tr.append(th);
      for (const scenario of scenarios) {
        const r = scenario.results[index],
          td = document.createElement('td');
        if (r?.literal) td.setAttribute('data-cm-no-translate', '');
        td.textContent = r
          ? format(r.value, r.literal) + (r.unit ? ' ' + I.unit(r.unit, r.value) : '')
          : '—';
        tr.append(td);
      }
      body.append(tr);
    }
    table.append(body);
  }
  function localize() {
    I.apply();
    if (!document.body.hasAttribute('data-cm-page-name'))
      document.title =
        I.language === 'en'
          ? document.body.dataset.cmTitleEn || label(model.name) + ' | CalcMintly'
          : label(model.name) + ' | CalcMintly';
    $('cm-model-title').textContent = label(model.name);
    $('cm-model-purpose').textContent = label(model.purpose);
    for (const field of model.fields) {
      const e = $(field.id),
        l = document.querySelector('label[for="' + CSS.escape(field.id) + '"]');
      if (l) l.textContent = label(field.label);
      if (field.type === 'select')
        for (const option of e.options) {
          const original = field.options.find((o) => o[0] === option.value);
          if (original) option.textContent = label(original[1]);
        }
    }
    $('cm-model-note').textContent = label(model.note);
    I.translateTree($('cm-model-guide'));
    update();
    drawCompare();
  }
  try {
    if (
      model.domain !== 'Health' &&
      location.hash.startsWith('#cm=') &&
      location.hash.length <= 12000
    ) {
      const state = JSON.parse(decodeURIComponent(location.hash.slice(4)));
      if (
        state.version === 1 &&
        state.slug === slug &&
        state.values &&
        typeof state.values === 'object'
      )
        for (const field of model.fields) {
          const value = state.values[field.id];
          if (
            (field.type === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
            (field.type !== 'number' && typeof value === 'string' && value.length <= 8000)
          )
            $(field.id).value = String(value);
        }
    }
  } catch {
    $('cm-model-status').textContent = I.translate(
      'The shared link could not be restored. Example inputs are shown.',
    );
  }
  window.CMCalculatorBridge = {
    snapshot: () => ({
      version: 1,
      kind: 'expanded',
      slug,
      form: window.CMFormState.capture(
        document,
        model.fields.map((f) => f.id),
      ),
      scenarios: structuredClone(scenarios),
    }),
    restore: (state) => {
      if (state?.version !== 1 || state.kind !== 'expanded' || state.slug !== slug)
        throw Error('state');
      window.CMFormState.restore(document, state.form, false);
      scenarios = structuredClone(state.scenarios).slice(0, 3);
      update();
      drawCompare();
    },
    results: () =>
      valid && !document.querySelector('[data-ws-link-paused]')
        ? results
            .map((r, k) =>
              typeof r.value === 'number' && Number.isFinite(r.value)
                ? { key: String(k), label: label(r.label), value: r.value, unit: r.unit || '' }
                : null,
            )
            .filter(Boolean)
        : [],
    inputs: () =>
      model.fields
        .filter((f) => f.type === 'number')
        .map((f) => ({
          id: f.id,
          label: label(f.label),
          unit: f.label.split('|')[0].match(/\(([^)]+)\)/)?.[1] || '',
        })),
    valid: () => valid,
  };
  document.addEventListener('cm:language', localize);
  document.addEventListener('cm:translations', localize);
  localize();
})();
