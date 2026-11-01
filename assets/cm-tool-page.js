(() => {
  'use strict';
  const I = window.CMI18n,
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed'),
    wrap = document.querySelector('.wrap');
  if (!wrap || !I) return;
  document.body.classList.add('cm-tool');
  if (embedded) document.body.classList.add('cm-embedded');
  const slug = location.pathname
      .split('/')
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, ''),
    catalog = window.CMCatalog || [],
    tool = catalog.find((x) => x.slug === slug),
    h1 = wrap.querySelector('h1');
  const guide = wrap.querySelector('.cm-guide') || document.createElement('nav');
  guide.replaceChildren();
  guide.className = 'cm-guide';
  guide.dataset.cmLabel = 'help';
  guide.setAttribute('aria-label', I.t('help'));
  for (const [index, section] of [...wrap.querySelectorAll(':scope>.card')].entries()) {
    const heading = section.querySelector('h2');
    if (!heading) continue;
    if (!section.id) section.id = 'guide-' + index;
    const key = section.dataset.cmSection;
    if (['formula', 'example', 'scope', 'faq'].includes(key)) {
      const a = document.createElement('a');
      a.href = '#' + section.id;
      a.textContent =
        key === 'formula' || key === 'scope'
          ? I.t(key)
          : I.pick(key === 'example' ? 'Worked example|计算示例' : 'FAQ|常见问题');
      a.dataset.cmGuide = key;
      guide.append(a);
    }
  }
  wrap.querySelector('.hero')?.after(guide);
  const result = wrap.querySelector('.big'),
    resultCard = result?.closest('.card'),
    errors = document.createElement('p');
  errors.className = 'cm-form-error';
  errors.setAttribute('role', 'status');
  errors.hidden = true;
  resultCard?.append(errors);
  let beforeFormula = true;
  for (const section of wrap.querySelectorAll(':scope>.card')) {
    if (['formula', 'example', 'scope', 'faq', 'related'].includes(section.dataset.cmSection))
      beforeFormula = false;
    if (beforeFormula) section.classList.add('cm-data-section');
  }
  function invalidField() {
    let first = null;
    for (const field of [
      ...wrap.querySelectorAll(
        '.hero input[type=number],.hero input[type=date],.hero input[type=time]',
      ),
    ].filter((field) => field.getClientRects().length)) {
      const optional =
          (slug === 'gpa-calculator' || field.hasAttribute('data-cm-optional')) &&
          field.value.trim() === '' &&
          !field.validity.badInput,
        invalid =
          !optional &&
          (field.value.trim() === '' ||
            (field.type === 'number' && !Number.isFinite(field.valueAsNumber)) ||
            !field.validity.valid ||
            field.hasAttribute('data-ws-link-paused'));
      field.setAttribute('aria-invalid', String(invalid));
      if (!invalid && field.getAttribute('aria-describedby') === 'cm-input-error')
        field.removeAttribute('aria-describedby');
      if (invalid && !first) first = field;
    }
    return first;
  }

  function validate() {
    const first = invalidField(),
      raw = result?.textContent?.trim() || '',
      invalidResult = !!result && (/\b(?:NaN|Infinity)\b|∞|Invalid Date/u.test(raw) || raw === '—');
    const invalid = !!first || invalidResult;
    document.body.classList.toggle('cm-invalid', invalid);
    errors.hidden = !invalid;
    errors.id = 'cm-input-error';
    if (first) {
      first.setAttribute('aria-describedby', 'cm-input-error');
      errors.textContent =
        (wrap.querySelector('label[for="' + CSS.escape(first.id) + '"]')?.textContent ||
          I.t('inputs')) +
        ': ' +
        (first.hasAttribute('data-ws-link-paused')
          ? first.dataset.wsLinkPaused || first.validationMessage
          : I.pick('Enter a valid value within the displayed range.|请输入符合所示范围的有效值。'));
    } else if (invalidResult) {
      const reason = wrap.querySelector('#verdictText,#note')?.textContent?.trim();
      errors.textContent =
        reason && reason !== '—'
          ? I.translate(reason)
          : I.pick(
              'No valid finite result is available. Check your inputs and the model limits.|没有可用的有效有限结果，请检查输入与模型限制。',
            );
    }
    for (const button of wrap.querySelectorAll('[data-cm-action=copy]')) button.disabled = invalid;
    document.dispatchEvent(new CustomEvent('cm:model-updated', { detail: { valid: !invalid } }));
  }
  function guard(event) {
    if (invalidField()) {
      validate();
      event.stopImmediatePropagation();
    }
  }
  wrap.addEventListener('input', guard, true);
  wrap.addEventListener('change', guard, true);
  wrap.addEventListener('input', validate);
  wrap.addEventListener('change', validate);
  validate();
  if (result) {
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
  }

  wrap.querySelectorAll('[data-cm-today]').forEach((button) =>
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.cmToday);
      input.value = window.CMCalendar.iso(window.CMCalendar.today());
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }),
  );
  const copyStatus = wrap.querySelector('.cm-copy-status') || document.createElement('span');
  copyStatus.className = 'cm-copy-status';
  copyStatus.setAttribute('role', 'status');
  const reset = [...wrap.querySelectorAll('button')].find(
    (b) => b.dataset.cmAction === 'reset' || /reset example/i.test(b.textContent),
  );
  if (reset) {
    reset.dataset.cmAction = 'reset';
    reset.removeAttribute('onclick');
    reset.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        for (const f of wrap.querySelectorAll('.hero input,.hero select,.hero textarea')) {
          if (f.tagName === 'SELECT') {
            const o = [...f.options].find((x) => x.defaultSelected) || f.options[0];
            f.value = o?.value || '';
          } else if (f.type === 'checkbox' || f.type === 'radio') f.checked = f.defaultChecked;
          else if (f.type !== 'file') f.value = f.defaultValue;
        }
        for (const f of wrap.querySelectorAll('.hero input,.hero select,.hero textarea')) {
          f.dispatchEvent(new Event('input', { bubbles: true }));
          f.dispatchEvent(new Event('change', { bubbles: true }));
        }
        validate();
      },
      true,
    );
  }
  let copy = [...wrap.querySelectorAll('button')].find(
    (b) => b.dataset.cmAction === 'copy' || /copy (summary|result)/i.test(b.textContent),
  );
  if (!copy && reset) {
    copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = I.t('copyResult');
    reset.after(copy);
  }
  if (copy) {
    copy.dataset.cmAction = 'copy';
    copy.removeAttribute('onclick');
    copy.after(copyStatus);
    copy.addEventListener(
      'click',
      async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (document.body.classList.contains('cm-invalid')) {
          copyStatus.textContent = I.t('invalidExpression');
          return;
        }
        const text = [
          h1?.textContent,
          result?.textContent,
          ...[...wrap.querySelectorAll('.hero input,.hero select')]
            .filter((f) => f.getClientRects().length)
            .map(
              (f) =>
                (wrap.querySelector('label[for="' + CSS.escape(f.id) + '"]')?.textContent || f.id) +
                ': ' +
                f.value,
            ),
        ].join('\n');
        try {
          await navigator.clipboard.writeText(text);
          copyStatus.textContent = I.t('copied');
        } catch {
          copyStatus.textContent = I.t('copyFail');
        }
      },
      true,
    );
  }
  const add = wrap.querySelector('.cm-workspace-entry') || document.createElement('a');
  add.className = 'cm-add cm-workspace-entry';
  add.dataset.cmHref = '/workspace?add=' + slug;
  add.href = I.url(add.dataset.cmHref);
  if (!add.querySelector('[data-cm-i18n]')) {
    add.removeAttribute('data-cm-i18n');
    add.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span data-cm-i18n="addWorkspace"></span>';
    add.querySelector('span').textContent = I.t('addWorkspace');
  }
  if (!embedded) wrap.querySelector('.sub')?.after(add);
  function localize(event) {
    I.translateTree(wrap);
    if (h1 && tool) {
      h1.textContent = tool.names?.[I.language] || I.translate(tool.name);
      h1.lang = I.language;
      if (!document.body.hasAttribute('data-cm-page-name'))
        document.title =
          I.language === 'en'
            ? document.body.dataset.cmTitleEn || h1.textContent + ' | CalcMintly'
            : h1.textContent + ' | CalcMintly';
    }
    const sub = wrap.querySelector('.sub');
    if (sub && tool?.descriptions?.[I.language]) sub.textContent = tool.descriptions[I.language];
    if (reset) reset.textContent = I.t('resetExample');
    if (copy) copy.textContent = I.t('copyResult');
    I.apply();
    guide
      .querySelectorAll('a')
      .forEach(
        (a) =>
          (a.textContent = ['formula', 'scope'].includes(a.dataset.cmGuide)
            ? I.t(a.dataset.cmGuide)
            : I.pick(a.dataset.cmGuide === 'example' ? 'Worked example|计算示例' : 'FAQ|常见问题')),
      );
    if (event?.type === 'cm:language' || event?.type === 'cm:translations') {
      const input = wrap.querySelector('.hero input,.hero select,.hero textarea');
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    }
    validate();
  }
  if (embedded) document.querySelectorAll('a').forEach((a) => (a.target = '_blank'));
  document.addEventListener('cm:language', localize);
  document.addEventListener('cm:translations', localize);
  localize();
})();
