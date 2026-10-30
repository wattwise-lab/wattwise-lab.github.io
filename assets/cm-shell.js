(() => {
  'use strict';
  const I = window.CMI18n,
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  if (!I) return;
  document.body.classList.add('cm-unified');
  if (embedded) document.body.classList.add('cm-unified--embedded');
  function render() {
    I.apply();
    document.querySelectorAll('[data-cm-language]').forEach((s) => {
      s.value = I.language;
    });
    I.updateMetadata();
    const current = location.pathname.replace(/\.html$/, '');
    document.querySelectorAll('.cm-site-header__nav a').forEach((a) => {
      if (new URL(a.href).pathname === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  document
    .querySelectorAll('[data-cm-language]')
    .forEach((s) => s.addEventListener('change', () => I.setLanguage(s.value)));
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || /^(mailto:|tel:|data:)/.test(raw)) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    a.href = I.url(a.href);
  });
  document.querySelectorAll('.cm-site-header details').forEach((d) => {
    document.addEventListener('pointerdown', (e) => {
      if (d.open && !d.contains(e.target)) d.open = false;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && d.open) {
        d.open = false;
        d.querySelector('summary')?.focus();
      }
    });
  });
  const clear = document.getElementById('cm-clear-local');
  if (clear)
    clear.addEventListener('click', () => {
      try {
        for (const key of Object.keys(localStorage))
          if (key.startsWith('calcmintly')) localStorage.removeItem(key);
        document.getElementById('cm-local-status').textContent = I.pick(
          'Saved CalcMintly browser data cleared.|已清除本浏览器保存的 CalcMintly 数据。',
        );
      } catch {
        document.getElementById('cm-local-status').textContent = I.pick(
          'This browser could not clear saved site data.|此浏览器无法清除保存的本站数据。',
        );
      }
    });
  document.addEventListener('cm:language', render);
  document.addEventListener('cm:translations', render);
  render();
  // Static native links are the only navigation runtime. No client router, no hydration.
})();
