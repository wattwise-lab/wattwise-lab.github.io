(() => {
  'use strict';
  const I = window.CMI18n,
    F = window.CMCoreFinance,
    slug = location.pathname
      .split('/')
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, ''),
    wrap = document.querySelector('.wrap');
  if (!I || !F || !wrap) return;
  const options = {
    'mortgage-calculator': {
      axis: 'rate',
      axisLabel: 'Annual interest rate (%)|年利率（%）',
      cases: (v) => [v.rate, Math.max(0, v.rate - 1), v.rate + 1],
      goal: 'Monthly housing budget (USD)|月住房预算（USD）',
      value: 3000,
      min: 0,
      max: 1e12,
    },
    'loan-calculator': {
      axis: 'rate',
      axisLabel: 'Annual interest rate (%)|年利率（%）',
      cases: (v) => [v.rate, Math.max(0, v.rate - 1), v.rate + 1],
      goal: 'Monthly payment budget (USD)|月供预算（USD）',
      value: 2000,
      min: 0,
      max: 1e12,
    },
    'rent-vs-buy-calculator': {
      axis: 'appr',
      axisLabel: 'Annual home appreciation (%)|房价年增长率（%）',
      cases: (v) => [v.appr, Math.max(-99.999, v.appr - 2), Math.min(1000, v.appr + 2)],
    },
    'early-loan-payoff-calculator': {
      axis: 'extra',
      axisLabel: 'Extra monthly payment (USD)|额外月供（USD）',
      cases: (v) => [v.extra, 0, v.extra + 100],
      goal: 'Target repayment time (months)|目标还清期限（月）',
      value: 60,
      min: 1,
      max: 1200,
      step: 1,
    },
    'freelance-real-rate': {
      axis: 'bill',
      axisLabel: 'Billable share (%)|可计费比例（%）',
      cases: (v) => [v.bill, Math.max(0.000001, v.bill - 10), Math.min(100, v.bill + 10)],
      goal: 'Target maximum hourly rate (USD)|目标最高时薪（USD）',
      value: 250,
      min: 0.000001,
      max: 1e12,
    },
    'ai-inference-cost': {
      axis: 'calls2',
      axisLabel: 'API calls per month|每月 API 调用次数',
      cases: (v) => [
        v.calls2,
        Math.floor(v.calls2 * 0.7),
        Math.min(1e12, Math.ceil(v.calls2 * 1.3)),
      ],
      goal: 'Monthly token budget (USD)|每月 token 预算（USD）',
      value: 5000,
      min: 0,
      max: 1e12,
    },
  };
  const config = options[slug];
  if (!config) return;
  const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    },
    pick = (s) => I.pick(s),
    number = (n, unit = '') =>
      I.number(
        n,
        unit.startsWith('USD')
          ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          : { maximumSignificantDigits: 8 },
      ),
    button = (pair, fn) => {
      const b = el('button', '', pick(pair));
      b.type = 'button';
      b.dataset.cmPair = pair;
      b.addEventListener('click', fn);
      return b;
    },
    pair = (tag, value, cls = '') => {
      const e = el(tag, cls, pick(value));
      e.dataset.cmPair = value;
      return e;
    };
  const unitMap = {
    price: 'USD',
    down: 'USD',
    prin: 'USD',
    bal: 'USD',
    pay: 'USD/month',
    extra: 'USD/month',
    rate: '%',
    pmirate: '%',
    mrate: '%',
    appr: '%',
    buyfee: '%',
    sellfee: '%',
    ownrate: '%',
    rentgrowth: '%',
    invest: '%',
    downp: '%',
    tax: slug === 'freelance-real-rate' ? '%' : 'USD/year',
    ins: 'USD/year',
    hoa: 'USD/month',
    term: 'years',
    loanYears: 'years',
    years: 'years',
    rent: 'USD/month',
    income: 'USD/year',
    exp: 'USD/year',
    hours: 'hours/week',
    bill: '%',
    weeks: 'weeks/year',
    itok: 'tokens/call',
    otok: 'tokens/call',
    calls2: 'calls/month',
    iprice: 'USD/million-tokens',
    oprice: 'USD/million-tokens',
  };
  function read() {
    return Object.fromEntries(
      [...wrap.querySelectorAll('.hero input[id],.hero select[id]')].map((input) => [
        input.id,
        input.tagName === 'SELECT'
          ? input.value
          : input.value.trim() === ''
            ? NaN
            : Number(input.value),
      ]),
    );
  }
  let current = null,
    currentValues = {},
    valid = false,
    proposal = null,
    custom = [false, false, false],
    snapshots = [];
  window.CMCalculatorBridge = {
    snapshot: () => ({
      version: 1,
      kind: 'finance',
      slug,
      form: window.CMFormState.capture(wrap.querySelector('.hero')),
      goal: goal.value,
      cases: caseInputs.map((e) => e.value),
      custom: [...custom],
      snapshots: structuredClone(snapshots),
    }),
    restore: (state) => {
      if (state?.version !== 1 || state.kind !== 'finance' || state.slug !== slug)
        throw Error('state');
      window.CMFormState.restore(wrap.querySelector('.hero'), state.form, true);
      goal.value = state.goal;
      caseInputs.forEach((e, k) => (e.value = state.cases[k]));
      custom = [...state.custom];
      snapshots = structuredClone(state.snapshots).slice(0, 3);
      update();
    },
    results: () =>
      valid && !document.body.classList.contains('cm-invalid')
        ? current.rows.map((row, index) => ({
            key: String(index),
            label: pick(row.label),
            value: row.value,
            unit: row.unit,
          }))
        : [],
    inputs: () =>
      [...wrap.querySelectorAll('.hero input[type=number][id]')].map((input) => ({
        id: input.id,
        label:
          wrap.querySelector('label[for="' + CSS.escape(input.id) + '"]')?.textContent || input.id,
        unit: unitMap[input.id] || '',
      })),
    valid: () => valid && !document.body.classList.contains('cm-invalid'),
  };
  const section = el('section', 'card cm-decisions'),
    heading = pair('h2', 'Test your next step|试算下一步'),
    intro = pair(
      'p',
      'Compare one changed assumption at a time, or work backward from a goal. These are transparent scenarios, not forecasts.|每次只改变一个假设进行比较，也可以从目标反推；这是透明情景，不是预测。',
      'cm-decisions__note',
    ),
    panels = el('div', 'cm-decisions__panels'),
    inverse = el('section'),
    goalTitle = pair('h3', 'Work backward from a goal|从目标反推'),
    goalLabel = el('label'),
    goal = el('input'),
    inverseResult = el('p', 'cm-decisions__inverse'),
    inverseNote = el('p', 'cm-decisions__note'),
    apply = button('Fill this value into the calculator|将此值填入计算器', () => {
      if (!proposal) return;
      const input = document.getElementById(proposal.id);
      const value = unitMap[proposal.id]?.startsWith('USD')
        ? (proposal.id === 'extra'
            ? Math.ceil(proposal.value * 100)
            : Math.floor(proposal.value * 100)) / 100
        : proposal.value;
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
    }),
    trials = el('section'),
    trialTitle = pair('h3', 'Three editable cases|三个可编辑情景'),
    caseGrid = el('div', 'cm-decisions__cases'),
    caseInputs = [];
  if (config.goal) {
    goal.id = 'cm-decision-goal';
    goal.type = 'number';
    goal.min = String(config.min);
    goal.max = String(config.max);
    goal.step = String(config.step || 'any');
    goal.defaultValue = String(config.value);
    goal.value = String(config.value);
    goalLabel.htmlFor = goal.id;
    goalLabel.dataset.cmPair = config.goal;
    goalLabel.textContent = pick(config.goal);
    inverse.append(goalTitle, goalLabel, goal, inverseResult, inverseNote, apply);
  } else inverse.append(goalTitle, inverseResult, inverseNote);
  const baseInput = document.getElementById(config.axis);
  for (let k = 0; k < 3; k++) {
    const box = el('div'),
      l = el('label', '', String.fromCharCode(65 + k)),
      input = el('input'),
      output = el('output');
    input.id = 'cm-decision-case-' + k;
    input.type = 'number';
    for (const attribute of ['min', 'max', 'step'])
      if (baseInput.hasAttribute(attribute))
        input.setAttribute(attribute, baseInput.getAttribute(attribute));
    l.htmlFor = input.id;
    output.id = 'cm-decision-output-' + k;
    output.setAttribute('aria-live', 'off');
    input.addEventListener('input', () => {
      custom[k] = true;
      update();
    });
    box.append(l, input, output);
    caseGrid.append(box);
    caseInputs.push(input);
  }
  trials.append(
    trialTitle,
    pair('p', config.axisLabel, 'cm-decisions__axis'),
    caseGrid,
    pair(
      'p',
      'Only this assumption changes; all other inputs follow the main form. Cases are not probabilities or confidence intervals.|仅改变这一假设，其余输入沿用主表单；情景不是概率或置信区间。',
      'cm-decisions__note',
    ),
  );
  const compare = el('div', 'cm-decisions__table'),
    error = el('p', 'cm-form-error'),
    actions = el('div', 'cm-decisions__actions'),
    status = el('p', 'cm-decisions__status'),
    save = button('Save this case|暂存此方案', () => {
      if (!valid || snapshots.length >= 3) return;
      snapshots.push({
        values: { ...currentValues },
        rows: current.rows.map((row, index) => ({
          key: String(index),
          ...row,
        })),
      });
      drawSaved();
    }),
    share = button('Copy share link|复制分享链接', async () => {
      if (!valid) return;
      const url = new URL(location.href);
      url.hash =
        'cm=' + encodeURIComponent(JSON.stringify({ version: 1, slug, values: currentValues }));
      await copy(url.href);
    }),
    csv = button('Export CSV|导出 CSV', () => {
      if (!valid) return;
      download([
        [pick('Input or result|输入或结果'), pick('Value|数值')],
        ...Object.entries(currentValues).map(([id, value]) => [
          wrap.querySelector('label[for="' + CSS.escape(id) + '"]')?.textContent || id,
          value,
        ]),
        ...current.rows.map((row) => [
          pick(row.label) + (row.unit ? ' (' + row.unit + ')' : ''),
          row.value,
        ]),
      ]);
    }),
    print = button('Print / PDF|打印或保存 PDF', () => window.print()),
    saved = el('section', 'cm-decisions__saved');
  error.hidden = true;
  error.setAttribute('role', 'status');
  status.setAttribute('role', 'status');
  actions.append(save, share, csv, print);
  panels.append(inverse, trials);
  section.append(heading, intro, panels, error, compare, actions, status, saved);
  const guide = wrap.querySelector('.cm-guide');
  if (guide) guide.after(section);
  else wrap.querySelector('.hero').after(section);
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = I.t('copied');
    } catch {
      status.textContent = I.t('copyFail');
    }
  }
  function download(rows) {
    const cell = (value) => {
        let text = String(value);
        if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
        return '"' + text.replaceAll('"', '""') + '"';
      },
      url = URL.createObjectURL(
        new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
          type: 'text/csv;charset=utf-8',
        }),
      ),
      a = el('a');
    a.href = url;
    a.download = slug + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function table(headers, rows) {
    const scroll = el('div', 'cm-decisions__scroll'),
      table = el('table'),
      thead = el('thead'),
      tr = el('tr'),
      tbody = el('tbody');
    for (const header of headers) {
      const th = el('th', '', pick(header));
      th.scope = 'col';
      tr.append(th);
    }
    thead.append(tr);
    for (const row of rows) {
      const tr = el('tr');
      row.forEach((value, k) => {
        const td = el(
          k === 0 ? 'th' : 'td',
          '',
          typeof value === 'number' ? number(value) : pick(value),
        );
        if (k === 0) td.scope = 'row';
        tr.append(td);
      });
      tbody.append(tr);
    }
    table.append(thead, tbody);
    scroll.append(table);
    scroll.tabIndex = 0;
    return scroll;
  }
  function reverse(v, r) {
    const budget = Number(goal.value);
    proposal = null;
    if (config.goal && (!goal.value || !goal.validity.valid || !Number.isFinite(budget))) {
      inverseResult.textContent = '—';
      inverseNote.textContent = pick(
        'Enter a goal within the allowed range.|请输入允许范围内的目标。',
      );
      apply.disabled = true;
      return;
    }
    let value = null,
      id = '',
      label = '',
      unit = '',
      note = '';
    if (slug === 'mortgage-calculator') {
      value = F.goalValue(slug, v, budget);
      id = 'price';
      label = 'Maximum modeled home price|模型内最高房价';
      unit = 'USD';
      note =
        'Keeps the entered down payment, tax, insurance and fees fixed. Includes the model’s PMI threshold; this is payment arithmetic, not loan approval.|首付、税费、保险与费用保持所填值，并计入模型 PMI 阈值；仅为还款数学，不代表贷款审批。';
    }
    if (slug === 'loan-calculator') {
      value = F.goalValue(slug, v, budget);
      id = 'prin';
      label = 'Principal supported by this payment|该月供对应本金';
      unit = 'USD';
      note =
        'Same rate and term, excluding extra payments and fees. This is not a credit or affordability assessment.|采用相同利率与期限，不含额外还款及费用，不是信用或负担能力评估。';
    }
    if (slug === 'early-loan-payoff-calculator') {
      value = F.goalValue(slug, v, budget);
      id = 'extra';
      label = 'Extra monthly payment needed|所需额外月供';
      unit = 'USD/month';
      note =
        'Uses a fixed rate and end-of-month payments. The final payment may be smaller; lender rounding and penalties are excluded.|使用固定利率与月末还款，末期可能较少；不含放款机构舍入及违约费用。';
    }
    if (slug === 'freelance-real-rate') {
      value = F.goalValue(slug, v, budget);
      id = 'bill';
      label = 'Billable share needed at this hourly rate|该时薪所需可计费比例';
      unit = '%';
      note =
        value > 100
          ? 'More than 100% is not feasible within the entered working hours. Change time, target or price assumptions.|超过 100% 表示所填工时内无法实现，请调整时间、目标或价格假设。'
          : 'Assumes all entered billable time can actually be sold at the goal rate. It does not estimate customer demand.|假设所填可计费时间均能按目标时薪售出，不估算客户需求。';
    }
    if (slug === 'ai-inference-cost') {
      value = F.goalValue(slug, v, budget);
      id = 'calls2';
      label = 'Cost-only monthly call capacity|仅按费用估计的月调用量';
      unit = 'calls/month';
      note =
        r.perCall > 0
          ? 'Uses the entered token mix and prices; quotas, retries, rate limits and other costs are separate constraints.|使用所填 token 组合与价格；配额、重试、限速及其他费用是独立限制。'
          : 'Zero unit cost has no finite cost-based ceiling. This does not mean unlimited provider access.|单次成本为零时，费用上无有限上限，不代表提供商允许无限访问。';
      if (value !== null && !Number.isSafeInteger(value)) value = null;
    }
    if (slug === 'rent-vs-buy-calculator') {
      value = F.goalValue(slug, v, 0);
      id = 'rent';
      label = 'Monthly rent at equal modeled ending wealth|模型期末净值相等时的月租';
      unit = 'USD/month';
      note =
        'All other assumptions stay fixed. A missing result means no nonnegative crossing is available within numeric precision; it is not a buy/rent recommendation.|其余假设保持不变；无结果表示在数值精度内没有非负交点，不构成租买建议。';
    }
    inverseResult.replaceChildren(
      el('span', '', pick(label)),
      el(
        'strong',
        '',
        value !== null && Number.isFinite(value)
          ? number(value, unit) + ' ' + I.unit(unit, value)
          : '—',
      ),
    );
    inverseNote.textContent = pick(note);
    if (id && value !== null && Number.isFinite(value)) {
      const original = document.getElementById(id),
        probe = document.createElement('input');
      probe.type = 'number';
      for (const attribute of ['min', 'max', 'step'])
        if (original.hasAttribute(attribute))
          probe.setAttribute(attribute, original.getAttribute(attribute));
      probe.defaultValue = original.defaultValue;
      probe.value = String(value);
      if (probe.validity.valid) proposal = { id, value };
    }
    apply.disabled = !proposal;
  }
  function drawSaved() {
    saved.replaceChildren();
    save.disabled = !valid || snapshots.length >= 3;
    if (!snapshots.length) return;
    saved.append(pair('h3', 'Saved cases in this tab|此标签页暂存的方案'));
    snapshots.forEach((snapshot, k) => {
      const row = el('div', 'cm-decisions__snapshot'),
        name = el('strong', '', String.fromCharCode(65 + k)),
        load = button('Load|载入', () => {
          for (const [id, value] of Object.entries(snapshot.values)) {
            const input = document.getElementById(id);
            if (input) input.value = String(value);
          }
          const input = wrap.querySelector('.hero input');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }),
        remove = button('Remove|移除', () => {
          snapshots.splice(k, 1);
          drawSaved();
        });
      row.append(
        name,
        el(
          'span',
          '',
          number(snapshot.rows[0].value, snapshot.rows[0].unit) +
            ' ' +
            I.unit(snapshot.rows[0].unit, snapshot.rows[0].value),
        ),
        load,
        remove,
      );
      saved.append(row);
    });
  }
  function update() {
    try {
      currentValues = read();
      current = F.evaluate(slug, currentValues);
      valid = true;
      error.hidden = true;
      reverse(currentValues, current);
      const defaults = config.cases(currentValues),
        rows = [];
      caseInputs.forEach((input, k) => {
        if (!custom[k]) {
          input.value = String(defaults[k]);
          input.defaultValue = String(defaults[k]);
        }
        const value = Number(input.value);
        try {
          if (!input.value || !input.validity.valid)
            throw Error('Check the case value.|请检查情景数值。');
          const result = F.evaluate(slug, { ...currentValues, [config.axis]: value }).rows[0];
          input.setAttribute('aria-invalid', 'false');
          document.getElementById('cm-decision-output-' + k).textContent =
            number(result.value, result.unit) + ' ' + I.unit(result.unit, result.value);
          rows.push([
            String.fromCharCode(65 + k),
            value,
            result.value,
            result.value - current.rows[0].value,
          ]);
        } catch (error) {
          input.setAttribute('aria-invalid', 'true');
          document.getElementById('cm-decision-output-' + k).textContent = pick(error.message);
        }
      });
      compare.replaceChildren(
        table(
          [
            'Case|情景',
            config.axisLabel,
            current.rows[0].label +
              ' (' +
              I.unit(current.rows[0].unit, current.rows[0].value) +
              ')',
            'Change from main form|相对主表单变化',
          ],
          rows,
        ),
      );
    } catch (exception) {
      valid = false;
      current = null;
      proposal = null;
      error.hidden = false;
      error.textContent = pick(exception.message);
      inverseResult.textContent = '—';
      inverseNote.textContent = '';
      compare.replaceChildren();
      apply.disabled = true;
      caseInputs.forEach(
        (_, k) => (document.getElementById('cm-decision-output-' + k).textContent = '—'),
      );
    }
    for (const b of [share, csv, print]) b.disabled = !valid;
    drawSaved();
  }
  function localize() {
    I.apply(section);
    update();
  }
  try {
    if (location.hash.startsWith('#cm=') && location.hash.length <= 12000) {
      const data = JSON.parse(decodeURIComponent(location.hash.slice(4)));
      if (data.version === 1 && data.slug === slug && data.values) {
        for (const [id, value] of Object.entries(data.values)) {
          const input = wrap.querySelector('.hero #' + CSS.escape(id));
          if (
            input &&
            ((typeof value === 'number' && Number.isFinite(value)) ||
              (typeof value === 'string' && value.length < 40))
          )
            input.value = String(value);
        }
        wrap.querySelector('.hero input')?.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  } catch {
    status.textContent = pick('Shared values could not be restored.|无法恢复分享数值。');
  }
  wrap.querySelector('.hero').addEventListener('input', update);
  wrap.querySelector('.hero').addEventListener('change', update);
  goal.addEventListener('input', update);
  document.addEventListener('cm:language', localize);
  document.addEventListener('cm:translations', localize);
  localize();
})();
