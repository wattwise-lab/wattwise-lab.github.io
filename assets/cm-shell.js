(() => {
  'use strict';
  const I = window.CMI18n,
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  if (!I) return;
  document.body.classList.add('cm-unified');
  if (embedded) document.body.classList.add('cm-unified--embedded');
  const tableScrollers = new Map();
  function updateTableScrollers() {
    for (const [scroll, heading] of tableScrollers) {
      const overflowing = scroll.clientWidth > 0 && scroll.scrollWidth > scroll.clientWidth + 1;
      if (overflowing) {
        scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region');
        if (heading) scroll.setAttribute('aria-labelledby', heading.id);
      } else {
        scroll.removeAttribute('tabindex');
        scroll.removeAttribute('role');
        scroll.removeAttribute('aria-labelledby');
      }
    }
  }
  const tableObserver =
    typeof ResizeObserver === 'function' ? new ResizeObserver(updateTableScrollers) : null;
  function discoverTableScrollers() {
    document.querySelectorAll('main table').forEach((table) => {
      const scroll = table.parentElement;
      if (
        !scroll.matches('.tblwrap,.cm-expanded__table,.cm-decisions__scroll') ||
        tableScrollers.has(scroll)
      )
        return;
      const heading = scroll.closest('section,.card')?.querySelector('h2');
      if (heading && !heading.id) heading.id = 'cm-table-heading-' + tableScrollers.size;
      tableScrollers.set(scroll, heading);
      tableObserver?.observe(scroll);
      tableObserver?.observe(table);
    });
    updateTableScrollers();
  }
  function render() {
    I.apply();
    document.querySelectorAll('[data-cm-language]').forEach((s) => {
      s.value = I.language;
    });
    I.updateMetadata();
    discoverTableScrollers();
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
  document.addEventListener('DOMContentLoaded', discoverTableScrollers, { once: true });
  document.addEventListener('cm:model-updated', discoverTableScrollers);
  if (!tableObserver) window.addEventListener('resize', updateTableScrollers);
  render();
  // Static native links are the only navigation runtime. No client router, no hydration.
})();
