(() => {
  'use strict';
  const A = window.CMWorkspace,
    I = window.CMI18n,
    P = window.CMIntent;
  if (!A || !I || !P) return;
  const el = (tag, text) => {
      const e = document.createElement(tag);
      if (text) e.textContent = text;
      return e;
    },
    t = (s) => I.pick(s),
    section = el('details'),
    summary = el('summary'),
    form = el('form'),
    label = el('label'),
    input = el('textarea'),
    hint = el('p'),
    preview = el('button'),
    status = el('p');
  section.className = 'ws-intent';
  summary.dataset.cmPair = 'Fill from a short description|用一句话预填';
  label.dataset.cmPair = 'Tool name and labelled numbers|工具名称与带字段名的数字';
  input.id = 'ws-intent-input';
  input.rows = 3;
  input.maxLength = 2000;
  input.dataset.cmPlaceholder = 'intentExample';
  input.placeholder = I.t('intentExample');
  input.dir = 'auto';
  label.htmlFor = input.id;
  hint.dataset.cmPair =
    'Local rules support the six tool names shown below. Other languages can use translated field labels, with an English or Chinese tool name. Only labelled numbers are recognized. You review every value before it is applied; nothing is uploaded.|本地规则支持下列六种工具。其他语言可用翻译后的字段名，并保留英文或中文工具名称。仅识别带字段名的数字，应用前逐项预览，不上传内容。';
  hint.className = 'ws-intent__hint';
  preview.type = 'submit';
  preview.dataset.cmPair = 'Preview values|预览填入';
  status.setAttribute('role', 'status');
  const supported = el('p', 'mortgage · loan · compound · rent vs buy · freelance · AI cost');
  supported.className = 'ws-intent__supported';
  supported.dataset.cmNoTranslate = '';
  supported.lang = 'en';
  supported.dir = 'ltr';
  form.append(label, input, hint, supported, preview, status);
  section.append(summary, form);
  document.querySelector('.ws-search-panel').append(section);
  const dialog = el('dialog'),
    dialogForm = el('form'),
    title = el('h2'),
    note = el('p'),
    list = el('dl'),
    replaceLabel = el('label'),
    replace = el('select'),
    controls = el('div'),
    cancel = el('button'),
    apply = el('button');
  dialog.className = 'ws-tool-choice';
  dialog.id = 'ws-intent-preview';
  title.id = 'ws-intent-preview-title';
  note.id = 'ws-intent-preview-description';
  dialog.setAttribute('aria-labelledby', title.id);
  dialog.setAttribute('aria-describedby', note.id);
  note.className = 'ws-intent__hint';
  replace.id = 'ws-intent-replace';
  replaceLabel.htmlFor = replace.id;
  replaceLabel.dataset.cmPair = 'Replace this calculator|替换这台计算器';
  cancel.type = 'button';
  cancel.dataset.cmPair = 'Cancel|取消';
  apply.type = 'submit';
  apply.dataset.cmPair = 'Apply reviewed values|应用已核对数值';
  controls.className = 'ws-tool-choice__actions';
  controls.append(cancel, apply);
  dialogForm.append(title, note, list, replaceLabel, replace, controls);
  dialog.append(dialogForm);
  document.body.append(dialog);
  let proposal = null;
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => input.focus());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const parsed = P.parse(input.value, { translate: I.translate });
    status.textContent = '';
    if (parsed.error) {
      status.textContent = t(parsed.error);
      return;
    }
    for (const row of parsed.matched) {
      const rule = window.CMIntentSchema?.[parsed.slug]?.[row.id];
      if (!rule) {
        status.textContent = t(
          'Input preview is unavailable. Open the calculator to enter values.|暂时无法预览输入，请打开计算器直接填写。',
        );
        return;
      }
      const probe = document.createElement('input');
      probe.type = 'number';
      probe.min = rule.min;
      probe.max = rule.max;
      probe.step = rule.step;
      probe.defaultValue = rule.value;
      probe.value = String(row.value);
      if (!probe.validity.valid) {
        status.textContent =
          t(row.label) +
          ': ' +
          t(
            'Value is outside the calculator’s allowed range or step.|数值不在允许范围内，或不符合规定的取值间隔。',
          );
        return;
      }
    }
    proposal = parsed;
    const tool = window.CMCatalog.find((x) => x.slug === parsed.slug);
    title.textContent = tool.names?.[I.language] || I.translate(tool.name);
    note.textContent = t(
      'Review these values. Other fields keep their example defaults. Currency is not inferred or converted; check tax, insurance and local assumptions in the card.|请核对这些数值，其余字段保留示例默认值。不推断或转换货币，请在卡片内检查税费、保险与当地假设。',
    );
    list.replaceChildren();
    for (const row of parsed.matched) {
      const box = el('div'),
        dt = el('dt', t(row.label)),
        dd = el(
          'dd',
          I.number(row.value, { maximumSignificantDigits: 15 }) +
            (row.sourcePercent !== undefined
              ? ' (' + row.sourcePercent + '% × ' + t('Home price|房价') + ')'
              : ''),
        );
      box.append(dt, dd);
      list.append(box);
    }
    const full = A.cards().length >= 4;
    replaceLabel.hidden = replace.hidden = !full;
    replace.required = full;
    replace.replaceChildren(
      new Option(t('Choose a card|请选择卡片'), ''),
      ...A.cards().map(
        (card, k) =>
          new Option(
            k +
              1 +
              '. ' +
              (window.CMCatalog.find((x) => x.slug === card.slug).names?.[I.language] ||
                window.CMCatalog.find((x) => x.slug === card.slug).name),
            String(card.id),
          ),
      ),
    );
    I.apply(dialog);
    dialog.showModal();
    cancel.focus();
  });
  dialogForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!proposal) return;
    const card = A.add(proposal.slug, A.cards().length >= 4 ? Number(replace.value) : null);
    if (card) card.pendingValues = Object.entries(proposal.values);
    dialog.close();
  });
  document.addEventListener('cm:language', () => {
    I.apply(section);
    I.apply(dialog);
  });
  document.addEventListener('cm:translations', () => {
    I.apply(section);
    I.apply(dialog);
  });
  I.apply(section);
  I.apply(dialog);
})();
