import { createHash } from 'node:crypto';
const en = (value) => String(value).split('|')[0];
const esc = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export async function renderExpanded(
  model,
  { head, header, footer, schemas, catalog, resultNumberOptions },
) {
  const defaults = Object.fromEntries(model.fields.map((f) => [f.id, f.value])),
    example = model.calculate(defaults),
    name = en(model.name);
  const exampleNumberAttrs = (row) => {
    if (row.literal) return ' data-cm-no-translate';
    if (typeof row.value !== 'number') return '';
    const options = resultNumberOptions(row.value, model.domain);
    return (
      ' data-cm-value="' +
      row.value +
      '" data-cm-unit="' +
      esc(row.unit || '') +
      '" data-cm-significant-digits="' +
      options.maximumSignificantDigits +
      '"' +
      (options.notation === 'scientific' ? ' data-cm-notation="scientific"' : '')
    );
  };
  const exampleValue = (row) =>
    typeof row.value === 'number'
      ? new Intl.NumberFormat('en', resultNumberOptions(row.value, model.domain)).format(
          Object.is(row.value, -0) ? 0 : row.value,
        )
      : en(row.value);
  const fields = model.fields
    .map((f) => {
      let control;
      if (['date', 'month'].includes(f.type))
        control = `<input type="${f.type}" id="${f.id}" value="${f.value}" required>`;
      else if (f.type === 'text')
        control = `<input type="text" id="${f.id}" value="${esc(f.value)}" maxlength="${f.maxLength || 60}" required>`;
      else if (f.type === 'textarea')
        control = `<textarea id="${f.id}" rows="4" maxlength="8000" spellcheck="false">${esc(f.value)}</textarea>`;
      else if (f.type === 'select')
        control = `<select id="${f.id}">${f.options.map(([value, label]) => `<option value="${esc(value)}"${value === f.value ? ' selected' : ''}>${esc(en(label))}</option>`).join('')}</select>`;
      else
        control = `<input type="number" id="${f.id}" value="${f.value}" min="${f.min}" max="${f.max}" step="${f.step}" required inputmode="${f.step === 1 ? 'numeric' : 'decimal'}">`;
      return `<div${f.type === 'textarea' ? ' class="field--wide"' : ''}><label for="${f.id}">${esc(en(f.label))}</label>${control}</div>`;
    })
    .join('');
  const health = model.domain === 'Health',
    version = createHash('sha256')
      .update((model.sourceHash || '') + model.calculate.toString() + model.formula)
      .digest('hex')
      .slice(0, 12),
    modelIndex = catalog.findIndex((tool) => tool.slug === model.slug),
    relatedTerms = (slug) =>
      new Set(
        slug
          .replace(/-(?:calculator|converter)$/, '')
          .split('-')
          .filter(
            (term) =>
              term.length > 2 &&
              ![
                'and',
                'the',
                'for',
                'per',
                'from',
                'with',
                'net',
                'gross',
                'time',
                'rate',
              ].includes(term),
          ),
      ),
    ownTerms = relatedTerms(model.slug),
    relatedScore = (tool) =>
      [...relatedTerms(tool.slug)].filter((term) => ownTerms.has(term)).length,
    relatedDistance = (tool) => Math.abs(catalog.indexOf(tool) - modelIndex),
    related = model.related
      ? model.related.map((slug) => catalog.find((t) => t.slug === slug)).filter(Boolean)
      : catalog
          .filter((t) => t.domain === model.domain && t.slug !== model.slug)
          .sort(
            (a, b) => relatedScore(b) - relatedScore(a) || relatedDistance(a) - relatedDistance(b),
          )
          .slice(0, 6);
  const editorExample = model.editor
    ? `<div class="cm-expanded__example-items"><h3 data-cm-pair="${esc(model.editor.title)}">${esc(en(model.editor.title))}</h3><ul>${String(
        defaults[model.editor.field],
      )
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(';');
          return `<li><strong>${esc(values[0])}</strong>${model.editor.columns
            .slice(1)
            .map(
              (column, k) =>
                `<p><span data-cm-pair="${esc(column.label)}">${esc(en(column.label))}</span>: <b>${esc(values[k + 1] || '—')}</b></p>`,
            )
            .join('')}</li>`;
        })
        .join('')}</ul></div>`
    : '';
  const description = (
    en(model.purpose) +
    ' Enter ' +
    model.fields.map((f) => en(f.label).replace(/\s*\([^)]*\)/g, '')).join(', ') +
    '. Check the formula and worked example.'
  ).slice(0, 160);
  const conversionReference = model.referenceTable
    ? `<p data-cm-pair="x is the input, y is the converted value, a is the source-unit factor and b is the target-unit factor. Use the factors in the table below.|x 是输入，y 是换算值，a 是原单位系数，b 是目标单位系数。请使用下表中的系数。">x is the input, y is the converted value, a is the source-unit factor and b is the target-unit factor. Use the factors in the table below.</p><h3 data-cm-pair="Unit conversion factors|单位换算系数">Unit conversion factors</h3><p><span data-cm-pair="Base unit|基本单位">Base unit</span>: <code data-cm-no-translate>${esc(model.referenceTable.baseUnit)}</code></p><div class="cm-expanded__table"><table class="cm-expanded__factors"><thead><tr><th scope="col" data-cm-pair="Unit|单位">Unit</th><th scope="col" data-cm-pair="Base units per listed unit|每单位对应的基本单位数量">Base units per listed unit</th></tr></thead><tbody>${model.referenceTable.units.map(([, label, factor]) => `<tr><th scope="row" data-cm-pair="${esc(label)}">${esc(en(label))}</th><td dir="ltr" data-cm-value="${factor}"${Math.abs(factor) < 1e-6 || Math.abs(factor) >= 1e12 ? ' data-cm-notation="scientific"' : ''}>${factor}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  const main = `<main class="wrap" id="main-content"><nav class="cm-crumb" aria-label="Breadcrumb"><a href="/directory" data-cm-href="/directory" data-cm-i18n="all">All calculators</a><span>/</span><span>${esc(model.domain)}</span></nav><h1 id="cm-model-title">${esc(name)}</h1><p class="sub" id="cm-model-purpose">${esc(en(model.purpose))}</p><p class="cm-expanded__standalone"><a href="/workspace?add=${model.slug}" data-cm-href="/workspace?add=${model.slug}" ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span data-cm-i18n="addWorkspace">Add to workspace</span></a></p><div class="hero"><section class="card"><h2 data-cm-i18n="inputs">Your numbers</h2><form id="cm-model-form" novalidate><div class="grid">${fields}</div><div class="cm-expanded__actions"><button type="button" id="cm-reset" data-cm-i18n="resetExample">Reset example</button><button type="button" id="cm-copy" data-cm-i18n="copyResult">Copy result</button></div><p class="cm-expanded__note" data-cm-i18n="note">Local calculations. Results are estimates, not professional advice.</p></form></section><section class="card"><h2 id="cm-result-label">${esc(en(example[0].label))}</h2><output class="big" id="result" role="status" aria-live="polite" aria-atomic="true">—</output><dl class="cm-expanded__results" id="cm-result-rows"></dl><p class="cm-form-error" id="cm-model-error" role="status" hidden></p><p class="cm-expanded__note" id="cm-model-note">${esc(en(model.note))}</p><div class="cm-expanded__actions cm-expanded__standalone"><button type="button" id="cm-compare-add" data-cm-pair="Compare this scenario|比较此方案">Compare this scenario</button>${health ? '' : '<button type="button" id="cm-share" data-cm-pair="Copy share link|复制分享链接">Copy share link</button>'}<button type="button" id="cm-csv">CSV</button><button type="button" id="cm-print" data-cm-pair="Print / PDF|打印或保存 PDF">Print / PDF</button></div><p class="cm-expanded__status" id="cm-model-status" role="status" aria-live="polite"></p>${health ? '<p class="cm-expanded__note">Health inputs stay in this tab. Link sharing is disabled.</p>' : ''}</section></div><section class="card cm-expanded__compare" id="cm-compare" hidden><h2 data-cm-pair="Scenario comparison|方案对比">Scenario comparison</h2><p class="cm-expanded__note">Up to three snapshots in this tab. Loading one replaces the current inputs.</p><div class="cm-expanded__table"><table id="cm-compare-table"></table></div></section><section class="cm-expanded__guide" id="cm-model-guide"><section class="card"><h2 data-cm-i18n="formula">Formula</h2><p class="cm-expanded__formula" ${/\|[^|]*[\u3400-\u9fff]/.test(model.formula) ? 'data-cm-pair="' + esc(model.formula) + '"' : 'data-cm-no-translate'}>${esc(/\|[^|]*[\u3400-\u9fff]/.test(model.formula) ? en(model.formula) : model.formula)}</p>${conversionReference}<p data-cm-pair="${esc(model.purpose)}">${esc(en(model.purpose))}</p></section><section class="card"><h2 data-cm-pair="Worked example|计算示例">Worked example</h2><div class="cm-expanded__example"><dl>${model.fields
    .filter((f) => f.id !== model.editor?.field)
    .map(
      (f) =>
        `<div${f.type === 'textarea' ? ' class="cm-expanded__example-list"' : ''}><dt data-cm-pair="${esc(f.label)}">${esc(en(f.label))}</dt><dd${f.type === 'textarea' ? ' dir="ltr" data-cm-no-translate' : ''}>${esc(f.type === 'select' ? en(f.options.find((o) => o[0] === f.value)[1]) : f.type === 'textarea' ? String(f.value).replace(/,(?!\s)/g, ', ') : f.value)}</dd></div>`,
    )
    .join(
      '',
    )}</dl><dl>${example.map((r) => `<div><dt data-cm-pair="${esc(r.label)}">${esc(en(r.label))}</dt><dd${typeof r.value === 'string' && /^[+-]?\d{16,}$/.test(r.value) ? ' class="cm-expanded__exact-integer"' : ''}${exampleNumberAttrs(r)}>${esc(exampleValue(r))}${r.unit ? ' ' + esc(r.unit) : ''}</dd></div>`).join('')}</dl>${editorExample}</div></section><section class="card"><h2 data-cm-i18n="scope">Scope and limitations</h2><p data-cm-pair="${esc(model.note)}">${esc(en(model.note))}</p><p>Inputs are checked for missing values and allowed ranges. A result outside the finite numeric range is not displayed. Rounding affects display, while the calculation uses the model’s numeric precision.</p><p>Check your units and assumptions before relying on a result. Changing a label does not convert a currency or physical unit.</p><p class="cm-expanded__meta"><span data-cm-pair="Formula version|公式版本">Formula version</span>: <code>${version}</code> · <span data-cm-pair="Example checked|示例核查日期">Example checked</span>: <time datetime="2026-10-30">2026-10-30</time></p><p><a href="/methodology" data-cm-href="/methodology" data-cm-i18n="methods">Methodology</a></p></section><section class="card"><h2 data-cm-pair="Related tools|相关工具">Related tools</h2><nav class="cm-expanded__related">${related.map((x) => `<a href="/${x.slug}" data-cm-href="/${x.slug}" data-cm-pair="${esc(x.name + '|' + (x.names?.['zh-CN'] || x.name))}">${esc(x.name)}</a>`).join('')}</nav></section></section></main>`;
  const modelScript = 'assets/models/' + model.source;
  return (
    (await head({
      title: name + ' — Formula & Worked Example | CalcMintly',
      description,
      canonical: '/' + model.slug,
      styles: ['assets/cm-commercial.css', 'assets/cm-expanded.css'],
      scripts: [
        'assets/models/core.js',
        modelScript,
        'assets/cm-expanded.js',
        ...(model.editor ? ['assets/cm-scenario-editor.js'] : []),
      ],
      schema: schemas(name, model.slug),
    })) +
    `<body class="cm-unified cm-tool cm-expanded" data-model="${model.slug}">${header('en')}${main}${footer('en')}</body></html>`
  );
}
