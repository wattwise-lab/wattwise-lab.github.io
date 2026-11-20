(() => {
  'use strict';
  const panel = document.querySelector('.cm-quick');
  const engine = window.CMKeypad;
  const pocket = new engine.Pocket();
  const input = panel.querySelector('#quick-expression');
  const history = panel.querySelector('ol');
  const modes = [...panel.querySelectorAll('[data-mode]')];
  let science = false,
    value = 0,
    fresh = false,
    error = '',
    scienceHistory = [];
  function render() {
    const raw = science ? String(value) : pocket.entry;
    panel.querySelector('output').textContent =
      error || pocket.error
        ? window.CMI18n.t(
            error === 'division' || pocket.error === 'division' ? 'division' : 'invalidExpression',
          )
        : window.CMI18n.number(Number(raw), { maximumSignificantDigits: 15, useGrouping: false }) +
          (!science && raw.endsWith('.') ? window.CMI18n.number(1.1).replace(/\p{N}/gu, '') : '');
    panel.querySelector('small').textContent = science ? '°' : pocket.expression;
    const rows = science ? scienceHistory : pocket.history;
    history.replaceChildren(
      ...rows.map((row) => {
        const li = document.createElement('li');
        li.textContent = row.expression + ' ' + row.result;
        return li;
      }),
    );
    panel.querySelector('#quick-empty').hidden = !!rows.length;
  }
  modes.forEach((link) =>
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const next = link.dataset.mode === 'scientific';
      if (next === science) return;
      if (next) {
        value = Number(pocket.entry);
        input.value = pocket.entry;
        fresh = true;
      } else {
        pocket.clear();
        pocket.entry = String(value);
      }
      science = next;
      error = '';
      input.hidden = !next;
      panel.querySelector('.quick-functions').hidden = !next;
      modes.forEach((a) => a.setAttribute('aria-current', String(a === link)));
      panel.querySelector('h1').textContent = link.textContent;
      render();
    }),
  );
  function press(k) {
    if (!science) {
      pocket.input(k);
      render();
      return;
    }
    let expr = input.value;
    if (k === 'AC' || k === 'CE') {
      expr = '';
      value = 0;
      fresh = false;
    } else if (k === '=') {
      try {
        value = engine.scientific(
          window.CMData.expression(expr, window.CMI18n.formatLocale),
          true,
          value,
        );
        scienceHistory.unshift({ expression: expr + ' =', result: value });
        scienceHistory = scienceHistory.slice(0, 20);
        expr = String(value);
        fresh = true;
        error = '';
      } catch (e) {
        error = e.message;
      }
      input.value = expr;
      render();
      return;
    } else if (k === 'back') {
      expr = expr.slice(0, -1);
      fresh = false;
    } else if (k === 'sign') {
      expr = '-(' + (expr || '0') + ')';
      fresh = false;
    } else {
      if (fresh && !['+', '-', '*', '/', '^', '%'].includes(k)) expr = '';
      expr += k;
      fresh = false;
    }
    input.value = expr.slice(0, 500);
    error = '';
    render();
  }
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-key]');
    if (b) press(b.dataset.key);
  });
  input.addEventListener('input', () => {
    fresh = false;
    error = '';
    render();
  });
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.target === input) {
      if (e.key === 'Enter') {
        e.preventDefault();
        press('=');
      }
      return;
    }
    if (e.target !== document.body && !panel.contains(e.target)) return;
    if (e.target.closest('a,button,summary') && e.key === 'Enter') return;
    const key = window.CMData.expression(e.key, window.CMI18n.formatLocale);
    const k = /^[0-9.+*/%=-]$/.test(key)
      ? key
      : { Enter: '=', Backspace: 'back', Escape: 'AC', Delete: 'CE' }[e.key];
    if (k) {
      e.preventDefault();
      press(k);
    }
  });
  render();
})();
