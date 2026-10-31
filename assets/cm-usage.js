(() => {
  'use strict';
  const preference = 'calcmintly-usage-opt-in-v1',
    key = 'calcmintly-local-usage-v1';
  let counted = false,
    timer;
  function enabled() {
    try {
      return localStorage.getItem(preference) === 'yes';
    } catch {
      return false;
    }
  }
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 1000)
          .filter(
            ([slug, n]) =>
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
              slug.length <= 100 &&
              Number.isSafeInteger(n) &&
              n > 0,
          ),
      );
    } catch {
      return {};
    }
  }
  function set(value) {
    try {
      if (value) localStorage.setItem(preference, 'yes');
      else {
        localStorage.removeItem(preference);
        localStorage.removeItem(key);
      }
      document.dispatchEvent(new Event('cm:usage'));
      return true;
    } catch {
      return false;
    }
  }
  function record() {
    if (counted || !enabled()) return;
    const slug =
      document.body.dataset.model ||
      (document.body.dataset.keypad && document.body.dataset.keypad + '-calculator') ||
      location.pathname
        .split('/')
        .filter(Boolean)
        .at(-1)
        ?.replace(/\.html$/, '');
    if (
      !window.CMCatalog?.some((x) => x.slug === slug) ||
      document.body.classList.contains('cm-invalid') ||
      document.querySelector('#kp-error')?.textContent
    )
      return;
    try {
      const value = read();
      value[slug] = Math.min(Number.MAX_SAFE_INTEGER, (value[slug] || 0) + 1);
      localStorage.setItem(key, JSON.stringify(value));
      counted = true;
      document.dispatchEvent(new Event('cm:usage'));
    } catch {}
  }
  function interaction(event) {
    if (!event.isTrusted || !enabled() || counted) return;
    const element = event.target;
    if (
      !element.closest?.('main,.wrap,.kp-wrap') ||
      element.matches?.('[type=search],[data-cm-language]')
    )
      return;
    if (event.type === 'click' && !element.closest('[data-key]')) return;
    clearTimeout(timer);
    timer = setTimeout(record, 600);
  }
  document.addEventListener('input', interaction);
  document.addEventListener('click', interaction);
  document.addEventListener('keydown', (event) => {
    if (
      event.isTrusted &&
      document.body.dataset.keypad &&
      /^[0-9+*/=%.()-]$|^Enter$/.test(event.key)
    )
      interaction(event);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === preference || event.key === key)
      document.dispatchEvent(new Event('cm:usage'));
  });
  window.CMLocalUsage = { enabled, read, set };
})();
