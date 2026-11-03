(() => {
  'use strict';
  const I = window.CMI18n,
    form = document.getElementById('cm-ai-form');
  if (!I || !form) return;
  const question = document.getElementById('cm-ai-question'),
    send = document.getElementById('cm-ai-send'),
    clear = document.getElementById('cm-ai-clear'),
    status = document.getElementById('cm-ai-status'),
    output = document.getElementById('cm-ai-output');
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const copy = (key) => (window.CMAICopy[I.language] || window.CMAICopy.en)[key];
  const pick = (s) => I.pick(String(s || ''));
  const contextNote = (s) => {
    const k =
      s.tool === 'shopping-total'
        ? 0
        : ['loan-calculator', 'mortgage-calculator'].includes(s.tool)
          ? 1
          : s.tool === 'arithmetic'
            ? 2
            : s.tool === 'electricity-usage'
              ? 3
              : null;
    return k === null
      ? pick(s.schema.note)
      : (window.CMAINotes[I.language] || window.CMAINotes.en)[k];
  };
  const taskName = (s) => {
    const known = window.CMCatalog.find((t) => t.slug === s.tool);
    return known
      ? I.toolName(known)
      : copy(
          s.tool === 'shopping-total' ? 'shopping' : s.tool === 'arithmetic' ? 'math' : 'energy',
        );
  };
  const formula = (s) =>
    s.tool === 'shopping-total'
      ? 'Σ(q × p) − D + T + S'
      : s.tool === 'loan-calculator'
        ? 'M = P × r / (1 − (1+r)^(−n)); r = i /1200; n =12y; r=0 ⇒ M=P/n'
        : s.tool === 'mortgage-calculator'
          ? 'M + tax/12 + insurance/12 + PMI + HOA + extra'
          : s.tool === 'arithmetic'
            ? s.values.expression
            : s.tool === 'electricity-usage'
              ? 'E = P × h × d /1000 (kWh)'
              : pick(s.schema.formula);
  function fieldLabel(f, s) {
    if (s.tool === 'arithmetic' && f.id === 'mode') return copy('unit');
    if (I.language === 'zh-CN') return pick(f.label);
    const aliases = {
      prin: 'Principal',
      rate: 'Annual interest rate (%)',
      term: 'Loan term (years)',
      extra: 'Extra monthly payment ($)',
      price: 'Home price ($)',
      down: 'Down payment ($)',
      tax: 'Annual property tax ($)',
      ins: 'Annual home insurance ($)',
      pmirate: 'PMI rate (%)',
      hoa: 'Monthly HOA fee ($)',
    };
    const key = ['loan-calculator', 'mortgage-calculator'].includes(s.tool)
      ? aliases[f.id]
      : s.tool === 'electricity-usage'
        ? { power: 'Power (W)', hours: 'Hours per day', days: 'Days' }[f.id]
        : s.tool === 'shopping-total'
          ? { discount: 'Discount (%)', tax: 'Tax rate (%)', shipping: 'Shipping' }[f.id]
          : s.tool === 'arithmetic'
            ? { expression: 'Expression', mode: 'Degrees' }[f.id]
            : null;
    return key
      ? I.translate(key).replaceAll('$', s.currency === 'currency' ? copy('currency') : s.currency)
      : pick(f.label);
  }

  let controller = null,
    plan = null,
    generation = 0;
  async function request(path, data) {
    const endpoint = window.CMAIConfig?.endpoint;
    if (!endpoint) throw Error('ai_not_configured');
    const r = await fetch(endpoint + path, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller?.signal,
    });
    let value;
    try {
      value = await r.json();
    } catch {
      throw Error('invalid_response');
    }
    if (!r.ok) throw Error(value.error || 'service_error');
    return value;
  }
  function setStatus(key, suffix = '') {
    if (key) {
      status.dataset.aiStatusKey = key;
      status.dataset.aiStatusSuffix = suffix;
      status.textContent = copy(key) + suffix;
    } else {
      delete status.dataset.aiStatusKey;
      delete status.dataset.aiStatusSuffix;
      status.textContent = '';
    }
  }
  const failure = (e) => {
    setStatus('error');
    status.dataset.errorCode = e.message;
  };
  function textReport() {
    return (plan?.steps || [])
      .map((s) =>
        [
          taskName(s),
          ...Object.entries(s.values).map(([k, v]) => {
            const f = s.schema.fields.find((field) => field.id === k);
            const value =
              k === 'items' && Array.isArray(v)
                ? v
                    .map(
                      (item) =>
                        `${item.name}: ${item.quantity ?? '?'} ${item.unit || '?'} × ${item.price ?? '?'} ${item.currency || '?'}/${item.perUnit || '?'}`,
                    )
                    .join('\n')
                : String(v);
            return (
              (f ? fieldLabel(f, s) : k) +
              ': ' +
              value +
              (f?.unit ? ' ' + (f.unit === 'currency' ? s.currency : f.unit) : '')
            );
          }),
          ...(s.result?.rows || []).map(
            (r) => pick(r.label) + ': ' + r.value + ' ' + (r.unit || ''),
          ),
          formula(s),
          contextNote(s),
        ].join('\n'),
      )
      .join('\n\n');
  }
  function editItems(step, focusIndex) {
    generation++;
    controller?.abort();
    controller = null;
    output.inert = false;
    output.setAttribute('aria-busy', 'false');
    plan.edited = true;
    plan.explanation = '';
    const missing =
      !step.values.items.length ||
      step.values.items.some((item) =>
        ['name', 'quantity', 'unit', 'price', 'perUnit', 'currency'].some(
          (key) => item[key] === null || item[key] === undefined || item[key] === '',
        ),
      );
    step.missing = step.missing.filter((field) => field !== 'items');
    if (missing) step.missing.push('items');
    const dirty = new Set([step.id]);
    for (const current of plan.steps)
      if (
        dirty.has(current.id) ||
        Object.values(current.sources || {}).some(
          (source) => source.ref && dirty.has(source.ref.step),
        )
      ) {
        current.result = null;
        dirty.add(current.id);
      }
    setStatus(missing ? 'missing' : 'recalc');
    renderPlan(step.id);
    document.getElementById('ai-' + step.id + '-item-' + focusIndex + '-name')?.focus();
  }
  function renderPlan(openStep) {
    if (!plan) return;
    const expanded = new Set(
      [...output.querySelectorAll('details[open]')].map(
        (node) => node.closest('[data-ai-step]')?.dataset.aiStep,
      ),
    );
    output.replaceChildren();
    output.setAttribute('aria-label', copy('results'));
    if (plan.edited || plan.title)
      output.append(el('h2', plan.edited ? copy('results') : plan.title));
    if (plan.explanation) output.append(el('p', plan.explanation, 'cm-ai-note'));
    if (plan.unsupported || !plan.steps.length) {
      output.append(el('p', copy('error'), 'cm-ai-missing'));
      const directory = el('a', I.t('all'));
      directory.href = I.url('/directory');
      output.append(directory);
      return;
    }
    const exports = el('div', undefined, 'cm-ai-export'),
      cp = el('button', copy('copy')),
      dl = el('button', copy('download'));
    cp.type = dl.type = 'button';
    cp.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textReport());
        setStatus('copy', ' ✓');
      } catch (e) {
        failure(e);
      }
    });
    dl.addEventListener('click', () => {
      const a = el('a'),
        url = URL.createObjectURL(new Blob([textReport()], { type: 'text/plain;charset=utf-8' }));
      a.href = url;
      a.download = 'calcmintly-ai-results.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    exports.append(cp, dl);
    output.append(exports);
    for (const s of plan.steps) {
      const card = el('article', undefined, 'cm-ai-card');
      card.dataset.aiStep = s.id;
      card.append(el('h2', s.index + '. ' + taskName(s)));
      if (s.missing.length) card.append(el('p', copy('missing'), 'cm-ai-missing'));
      const valuesDetails = el('details'),
        summary = el('summary', copy('review')),
        edit = el('form'),
        fields = el('div', undefined, 'cm-ai-fields');
      valuesDetails.open = !!s.missing.length || expanded.has(s.id) || openStep === s.id;
      valuesDetails.append(summary, edit);
      edit.append(fields);
      function control(f, key, value, parent = fields) {
        const field = el('div', undefined, 'cm-ai-field'),
          label = el('label', fieldLabel(f, s)),
          id = 'ai-' + s.id + '-' + key;
        label.htmlFor = id;
        const n = el(f.type === 'select' ? 'select' : f.type === 'textarea' ? 'textarea' : 'input');
        n.id = id;
        if (f.type === 'select')
          for (const [val, name] of f.options) n.append(new Option(pick(name), val));
        else if (f.type !== 'textarea') {
          n.type =
            f.type === 'number'
              ? 'number'
              : f.type === 'date' || f.type === 'month'
                ? f.type
                : 'text';
          if (n.type === 'number') {
            n.step = f.step || 'any';
            if (f.min !== undefined) n.min = f.min;
            if (f.max !== undefined) n.max = f.max;
          } else n.maxLength = 300;
        }
        if (f.type === 'textarea') {
          n.rows = 3;
          n.maxLength = 8000;
          field.dataset.wide = '';
        }
        n.required = true;
        n.value = value === undefined || value === null ? '' : String(value);
        field.append(label, n);
        if (f.unit)
          field.append(
            el(
              'small',
              f.unit === 'currency'
                ? s.currency === 'currency'
                  ? copy('currency')
                  : s.currency
                : I.unit(f.unit, value),
            ),
          );
        const source = s.sources?.[f.id];
        if (source?.source) field.append(el('small', copy('source') + ': ' + source.source));
        if (source?.ref) {
          n.disabled = true;
          const parent = plan.steps.find((step) => step.id === source.ref.step);
          if (parent)
            field.append(
              el(
                'small',
                '↳ ' +
                  parent.index +
                  '. ' +
                  taskName(parent) +
                  ' · ' +
                  pick(parent.result?.rows?.[source.ref.row]?.label),
              ),
            );
        }
        if (source?.assumption)
          field.append(el('small', copy('limits') + ': ' + String(value ?? '')));
        parent.append(field);
        return n;
      }
      for (const f of s.schema.fields) {
        if (f.type === 'items') {
          const items =
            Array.isArray(s.values.items) && s.values.items.length
              ? s.values.items
              : [{ name: '', quantity: null, unit: '', price: null, perUnit: '', currency: '' }];
          items.forEach((item, k) => {
            const box = el('div', undefined, 'cm-ai-item');
            const rowHead = el('div', undefined, 'cm-ai-item-head'),
              remove = el('button', I.t('remove'));
            remove.type = 'button';
            remove.dataset.aiRemoveItem = String(k);
            remove.setAttribute('aria-label', I.t('remove') + ' ' + (item.name || String(k + 1)));
            remove.addEventListener('click', () => {
              captureDraft();
              s.values.items.splice(k, 1);
              delete s.sources.items;
              editItems(s, Math.max(0, Math.min(k, s.values.items.length - 1)));
            });
            rowHead.append(el('strong', String(k + 1)), remove);
            box.append(rowHead);
            fields.append(box);
            for (const [key, label, type] of [
              ['name', 'items', 'text'],
              ['quantity', 'quantity', 'number'],
              ['unit', 'unit', 'text'],
              ['price', 'price', 'number'],
              ['perUnit', 'perUnit', 'text'],
              ['currency', 'currency', 'text'],
            ])
              control(
                { label: copy(label), type, min: type === 'number' ? 0 : undefined },
                'item-' + k + '-' + key,
                item[key],
                box,
              );
            if (item.source) {
              const proof = el('small', copy('source') + ': ' + item.source);
              proof.dir = 'auto';
              box.append(proof);
            }
          });
          const add = el('button', copy('items') + ' +');
          add.type = 'button';
          add.dataset.aiAddItem = '';
          add.addEventListener('click', () => {
            captureDraft();
            if (s.values.items.length >= 60) return;
            s.values.items.push({
              name: '',
              quantity: null,
              unit: '',
              price: null,
              perUnit: '',
              currency: s.values.items[0]?.currency || '',
            });
            delete s.sources.items;
            editItems(s, s.values.items.length - 1);
          });
          fields.append(add);
        } else control(f, f.id, s.values[f.id]);
      }
      const recalc = el('button', copy('recalc'), 'cm-ai-primary');
      recalc.type = 'submit';
      edit.append(recalc);
      edit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = ++generation;
        controller?.abort();
        controller = new AbortController();
        const timer = setTimeout(() => controller?.abort(), 20000);
        send.disabled = false;
        output.setAttribute('aria-busy', 'true');
        captureDraft();
        output.inert = true;
        recalc.disabled = true;
        setStatus('recalc', '…');
        try {
          const steps = plan.steps.map((step) => ({
            id: step.id,
            index: step.index,
            tool: step.tool,
            currency: step.currency,
            values: step.values,
            sources: step.sources,
            normalized: step.normalized,
          }));
          const response = await request('/recalculate', { steps, locale: I.language });
          if (current !== generation) return;
          plan.steps = response.steps;
          plan.edited = true;
          plan.explanation = '';
          const missing = plan.steps.some((step) => step.missing.length);
          setStatus(missing ? 'missing' : 'results');
          output.inert = false;
          renderPlan();
          const heading = [...output.querySelectorAll('[data-ai-step]')]
            .find((node) => node.dataset.aiStep === s.id)
            ?.querySelector('h2');
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
            const card = heading.closest('.cm-ai-card');
            const rect = heading.getBoundingClientRect();
            if (rect.top < 140 || rect.bottom > innerHeight)
              card.scrollIntoView({
                block: 'start',
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
              });
          }
        } catch (error) {
          if (current === generation) failure(error);
        } finally {
          clearTimeout(timer);
          recalc.disabled = false;
          if (current === generation) {
            controller = null;
            output.inert = false;
            output.setAttribute('aria-busy', 'false');
          }
        }
      });
      if (s.result) {
        const results = el('dl', undefined, 'cm-ai-results');
        for (const r of s.result.rows) {
          const row = el('div', undefined, 'cm-ai-result'),
            dt = el('dt', pick(r.label)),
            dd = el(
              'dd',
              typeof r.value === 'number'
                ? I.number(r.value, {
                    maximumSignificantDigits: ['Science', 'Health', 'Home and Everyday'].includes(
                      s.schema.domain,
                    )
                      ? 6
                      : 12,
                    ...(/^(?:currency|CNY|USD|EUR|GBP|JPY|INR|IDR|RUB|BRL|TRY|NGN)(?:\/|$)/.test(
                      r.unit || '',
                    )
                      ? {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                          maximumSignificantDigits: undefined,
                        }
                      : {}),
                  })
                : pick(r.value),
            );
          if (r.unit)
            dd.append(
              el(
                'small',
                r.unit.startsWith('currency')
                  ? r.unit.replace('currency', copy('currency'))
                  : I.unit(r.unit, r.value),
              ),
            );
          if (r.working) dt.append(el('small', r.working));
          row.append(dt, dd);
          results.append(row);
        }
        card.append(results);
        if (s.result.truncated)
          card.append(
            el(
              'p',
              copy('results') + ': ' + s.result.rows.length + ' / ' + s.result.totalRows,
              'cm-ai-note',
            ),
          );
      }
      const method = el('p', formula(s), 'cm-ai-method');
      method.dir = 'ltr';
      card.append(
        valuesDetails,
        el('h3', copy('method')),
        method,
        el('h3', copy('limits')),
        el('p', contextNote(s), 'cm-ai-note'),
      );
      const tool = (window.CMCatalog || []).find((t) => t.slug === s.tool);
      if (tool) {
        const nav = el('nav'),
          link = el('a', copy('open'));
        link.href = I.url('/' + s.tool);
        nav.append(link);
        card.append(nav);
      }
      output.append(card);
    }
  }
  function captureDraft() {
    if (!plan) return;
    for (const step of plan.steps) {
      for (const f of step.schema.fields) {
        if (f.type === 'items') {
          const items = step.values.items?.length ? step.values.items : [{}];
          step.values.items = items.map((item, k) => {
            const v = { ...item };
            for (const key of ['name', 'quantity', 'unit', 'price', 'perUnit', 'currency']) {
              const n = document.getElementById('ai-' + step.id + '-item-' + k + '-' + key);
              if (n) {
                const next = ['quantity', 'price'].includes(key)
                  ? n.value === ''
                    ? null
                    : Number(n.value)
                  : n.value;
                if (next !== v[key]) {
                  delete v.source;
                  delete step.sources.items;
                }
                v[key] = next;
              }
            }
            return v;
          });
        } else {
          const n = document.getElementById('ai-' + step.id + '-' + f.id);
          if (n && !n.disabled) {
            const next = f.type === 'number' ? (n.value === '' ? null : Number(n.value)) : n.value;
            if (next !== step.values[f.id]) delete step.sources[f.id];
            step.values[f.id] = next;
          }
        }
      }
    }
  }
  function renderCopy() {
    const c = window.CMAICopy[I.language] || window.CMAICopy.en;
    document.querySelectorAll('[data-ai-key]').forEach((n) => {
      if (c[n.dataset.aiKey]) n.textContent = c[n.dataset.aiKey];
    });
    const metadata =
      I.language === 'en'
        ? window.CMInfoMetadata['/ai']
        : { title: c.title + ' | CalcMintly', description: c.lead + ' ' + c.privacy };
    document.title = metadata.title;
    document
      .querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]')
      .forEach((n) => {
        n.content = metadata.title;
      });
    document
      .querySelectorAll(
        'meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]',
      )
      .forEach((n) => {
        n.content = metadata.description;
      });
    for (const node of document.querySelectorAll('script[data-cm-breadcrumb]')) {
      try {
        const value = JSON.parse(node.textContent);
        if (Array.isArray(value.itemListElement) && value.itemListElement.length)
          value.itemListElement.at(-1).name = c.title;
        node.textContent = JSON.stringify(value).replaceAll('<', '\\u003c');
      } catch {
        /* Invalid unrelated metadata does not block calculation. */
      }
    }
    question.placeholder = c.placeholder;
    if (status.dataset.aiStatusKey)
      status.textContent = c[status.dataset.aiStatusKey] + (status.dataset.aiStatusSuffix || '');
    output.setAttribute('aria-label', c.results);
    if (!controller) {
      captureDraft();
      renderPlan();
    }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!question.value.trim()) return;
    const current = ++generation;
    controller?.abort();
    controller = new AbortController();
    const timer = setTimeout(() => controller?.abort(), 100000);
    send.disabled = true;
    plan = null;
    output.inert = false;
    output.replaceChildren();
    output.setAttribute('aria-busy', 'true');
    setStatus('working');
    delete status.dataset.errorCode;
    try {
      const response = await request('/plan', { text: question.value, locale: I.language });
      if (current !== generation) return;
      plan = response.plan;
      renderPlan();
      setStatus(plan.questions.length ? 'missing' : 'results');
      const target = output.querySelector('h2') || output;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (matchMedia('(max-width: 800px)').matches)
        output.scrollIntoView({
          block: 'start',
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    } catch (error) {
      if (current === generation) {
        if (error.name === 'AbortError') setStatus('error');
        else failure(error);
      }
    } finally {
      clearTimeout(timer);
      if (current === generation) {
        controller = null;
        send.disabled = false;
        output.setAttribute('aria-busy', 'false');
      }
    }
  });
  clear.addEventListener('click', () => {
    generation++;
    controller?.abort();
    controller = null;
    plan = null;
    send.disabled = false;
    question.value = '';
    output.inert = false;
    setStatus(null);
    output.setAttribute('aria-busy', 'false');
    output.replaceChildren();
    question.focus();
  });
  document.querySelectorAll('[data-ai-example]').forEach((button) =>
    button.addEventListener('click', () => {
      question.value = (window.CMAIExamples[I.language] || window.CMAIExamples.en)[
        Number(button.dataset.aiExample)
      ];
      question.focus();
    }),
  );
  function ready() {
    // The shared shell loads after this page module. Register last so its generic
    // metadata pass cannot replace the page's authored AI translations.
    document.addEventListener('cm:language', renderCopy);
    document.addEventListener('cm:translations', renderCopy);
    renderCopy();
  }
  if (document.readyState !== 'complete')
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  renderCopy();
})();
