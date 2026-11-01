(() => {
  'use strict';
  const I = window.CMI18n,
    engine = window.CMKeypad || CMKeypad,
    $ = (id) => document.getElementById(id),
    scientific = document.body.dataset.keypad === 'scientific';
  const pocket = new engine.Pocket();
  let ans = 0,
    scienceMemory = 0,
    scienceHistory = [],
    scienceValue = 0,
    scienceError = null,
    lastHistory = null,
    lastHistoryLanguage = null;
  const symbols = (s) => s.replaceAll('*', '×').replaceAll('/', '÷').replaceAll('-', '−');
  const display = (n) => I.number(n, { maximumSignificantDigits: 15, useGrouping: true });
  const formatEntry = (raw) => {
    if (pocket.replace || /[eE]/.test(raw)) return display(Number(raw));
    const digits = (raw.split('.')[1] || '').length;
    return (
      (raw.startsWith('-') && Number(raw) === 0 ? '−' : '') +
      I.number(Number(raw), {
        notation: 'standard',
        minimumFractionDigits: Math.min(15, digits),
        maximumFractionDigits: 15,
        useGrouping: true,
      }) +
      (raw.endsWith('.') ? I.number(1.1).replace(/\p{N}/gu, '') : '')
    );
  };
  function errorLabel(code) {
    return I.t(
      code === 'division'
        ? 'division'
        : code === 'domain' || code === 'overflow'
          ? 'domain'
          : 'invalidExpression',
    );
  }
  function renderHistory() {
    const history = scientific ? scienceHistory : pocket.history;
    if (lastHistory === history && lastHistoryLanguage === I.language) return;
    lastHistory = history;
    lastHistoryLanguage = I.language;
    $('kp-history-list').replaceChildren();
    $('kp-empty').hidden = history.length > 0;
    $('kp-clear-history').disabled = !history.length;
    for (const entry of history) {
      const li = document.createElement('li'),
        small = document.createElement('small'),
        b = document.createElement('button');
      small.textContent = symbols(entry.expression);
      b.type = 'button';
      b.textContent = display(Number(entry.result));
      b.addEventListener('click', () => {
        if (scientific) {
          $('kp-input').value = entry.result;
          preview();
          $('kp-input').focus();
        } else {
          pocket.clear();
          pocket.entry = entry.result;
          pocket.replace = true;
          render();
        }
      });
      li.append(small, b);
      $('kp-history-list').append(li);
    }
  }
  function render() {
    if (scientific) {
      preview();
      $('kp-memory').hidden = scienceMemory === 0;
    } else {
      $('kp-expression').textContent = symbols(pocket.expression);
      $('kp-result').textContent = pocket.error ? '—' : formatEntry(pocket.entry);
      $('kp-memory').hidden = pocket.memory.n === 0n;
      $('kp-error').textContent = pocket.error ? errorLabel(pocket.error) : '';
    }
    renderHistory();
    document.querySelector('[data-key="."]').textContent =
      new Intl.NumberFormat(I.formatLocale).formatToParts(1.1).find((p) => p.type === 'decimal')
        ?.value || '.';
    if (!document.body.hasAttribute('data-cm-page-name'))
      document.title =
        I.language === 'en'
          ? document.body.dataset.cmTitleEn ||
            I.t(scientific ? 'scientific' : 'basic') + ' | CalcMintly'
          : I.t(scientific ? 'scientific' : 'basic') + ' | CalcMintly';
  }
  function preview() {
    try {
      const input = $('kp-input'),
        raw = input.value,
        normalized = window.CMData.expression(raw, I.formatLocale);
      if (normalized !== raw) {
        const position = input.selectionStart;
        input.value = normalized;
        if (position !== null) {
          const next = window.CMData.expression(raw.slice(0, position), I.formatLocale).length;
          input.setSelectionRange(next, next);
        }
      }
      scienceValue = engine.scientific(input.value, $('kp-deg').checked, ans);
      scienceError = null;
      $('kp-result').textContent = display(scienceValue);
      $('kp-error').textContent = '';
      $('kp-input').removeAttribute('aria-invalid');
    } catch (e) {
      scienceError = e.message;
      $('kp-result').textContent = '—';
      $('kp-error').textContent = errorLabel(e.message);
      $('kp-input').setAttribute('aria-invalid', 'true');
    }
  }
  function insert(value) {
    const input = $('kp-input'),
      a = input.selectionStart ?? input.value.length,
      b = input.selectionEnd ?? a;
    input.value = (input.value.slice(0, a) + value + input.value.slice(b)).slice(0, 500);
    const caret = a + value.length;
    input.focus();
    input.setSelectionRange(caret, caret);
    preview();
  }
  function commit() {
    preview();
    if (scienceError) return;
    const input = $('kp-input');
    scienceHistory.unshift({
      expression: input.value + ' =',
      result: Number(scienceValue.toPrecision(15)).toString(),
    });
    scienceHistory = scienceHistory.slice(0, 20);
    ans = scienceValue;
    input.value = Number(scienceValue.toPrecision(15)).toString();
    input.focus();
    input.select();
    render();
  }
  function action(key) {
    $('kp-copy-status').textContent = '';
    if (!scientific) {
      pocket.input(key);
      render();
      return;
    }
    const input = $('kp-input');
    if (key === 'AC' || key === 'CE') {
      input.value = '';
      preview();
      input.focus();
      return;
    }
    if (key === 'back') {
      const a = input.selectionStart ?? input.value.length,
        b = input.selectionEnd ?? a;
      input.value = input.value.slice(0, a === b ? Math.max(0, a - 1) : a) + input.value.slice(b);
      input.focus();
      input.setSelectionRange(Math.max(0, a - 1), Math.max(0, a - 1));
      preview();
      return;
    }
    if (key === '=') {
      commit();
      return;
    }
    if (key === 'MC') {
      scienceMemory = 0;
      render();
      return;
    }
    if (key === 'MR') {
      insert('(' + String(scienceMemory) + ')');
      return;
    }
    if (key === 'M+' || key === 'M-') {
      preview();
      if (!scienceError) {
        scienceMemory += scienceValue * (key === 'M+' ? 1 : -1);
        if (!Number.isFinite(scienceMemory) || Math.abs(scienceMemory) > 1e100) scienceMemory = 0;
      }
      render();
      return;
    }
    if (key === 'sign') {
      input.value = '-(' + input.value + ')';
      preview();
      input.focus();
      return;
    }
    if (key === 'sqrt') key = 'sqrt(';
    if (key === 'reciprocal') key = '1/(';
    insert(key);
  }
  document
    .querySelectorAll('[data-key]')
    .forEach((b) => b.addEventListener('click', () => action(b.dataset.key)));
  if (scientific) {
    $('kp-input').addEventListener('input', preview);
    $('kp-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        action('AC');
      }
    });
    document
      .querySelectorAll('[name=kp-angle]')
      .forEach((r) => r.addEventListener('change', preview));
  }
  document.addEventListener('keydown', (e) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.target.isContentEditable ||
      e.target.closest('input,select,textarea,dialog')
    )
      return;
    if (e.target.closest('button,a') && ['Enter', ' '].includes(e.key)) return;
    const typed = window.CMData.expression(e.key, I.formatLocale);
    const key = /^[0-9.+\-*/%()]$/.test(typed)
      ? typed
      : e.key === 'Enter' || e.key === '='
        ? '='
        : e.key === 'Backspace'
          ? 'back'
          : e.key === 'Escape'
            ? 'AC'
            : e.key === 'Delete'
              ? 'CE'
              : null;
    if (!key || (!scientific && /[()]/.test(key))) return;
    e.preventDefault();
    if (e.target.tagName === 'BUTTON') e.target.blur();
    action(key);
  });
  $('kp-copy').addEventListener('click', async () => {
    const error = scientific ? scienceError : pocket.error;
    if (error) {
      $('kp-copy-status').textContent = errorLabel(error);
      return;
    }
    try {
      const value = scientific ? Number(scienceValue.toPrecision(15)).toString() : pocket.entry;
      await navigator.clipboard.writeText(value);
      $('kp-copy-status').textContent = I.t('copied');
    } catch {
      $('kp-copy-status').textContent = I.t('copyFail');
    }
  });
  $('kp-clear-history').addEventListener('click', () => {
    if (scientific) scienceHistory = [];
    else pocket.history = [];
    renderHistory();
  });
  document.addEventListener('cm:language', render);
  window.CMCalculatorBridge = {
    snapshot: () => ({
      version: 1,
      kind: 'keypad',
      scientific,
      pocket: pocket.snapshot(),
      form: scientific
        ? window.CMFormState.capture(document, ['kp-input', 'kp-deg', 'kp-rad'])
        : [],
      ans,
      scienceMemory,
      scienceHistory: scienceHistory.map((x) => ({ ...x })),
    }),
    restore: (state) => {
      if (state?.version !== 1 || state.kind !== 'keypad' || state.scientific !== scientific)
        throw Error('state');
      pocket.restore(state.pocket);
      if (scientific) {
        window.CMFormState.restore(document, state.form, false);
        ans = state.ans;
        scienceMemory = state.scienceMemory;
        scienceHistory = state.scienceHistory.map((x) => ({ ...x }));
      }
      render();
    },
    results: () => {
      const error = scientific ? scienceError : pocket.error;
      if (error) return [];
      return [{ label: I.t('result'), value: scientific ? scienceValue : Number(pocket.entry) }];
    },
    inputs: () => [],
    valid: () => !(scientific ? scienceError : pocket.error),
  };
  if (location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed'))
    document.body.classList.add('kp-embedded');
  render();
})();
