(() => {
  'use strict';
  const I = window.CMI18n,
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  if (!I) return;
  document.body.classList.add('cm-unified');
  if (embedded) document.body.classList.add('cm-unified--embedded');
  const themeKey = 'calcmintly.theme.v1';
  const modeKey = 'calcmintly.color-mode.v1';
  const themes = ['system', 'ocean', 'sand', 'graphite', 'violet', 'rose'];
  let selectedTheme = 'system',
    selectedMode = 'auto';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  try {
    const saved = localStorage.getItem(themeKey),
      mode = localStorage.getItem(modeKey);
    if (themes.includes(saved)) selectedTheme = saved;
    if (['auto', 'light', 'dark'].includes(mode)) selectedMode = mode;
  } catch {
    /* Session preferences still work without storage. */
  }
  function renderAppearance() {
    const copy = window.CMAppearanceCopy[I.language] || window.CMAppearanceCopy.en;
    document.documentElement.dataset.cmTheme = selectedTheme;
    if (selectedMode === 'auto') delete document.documentElement.dataset.cmMode;
    else document.documentElement.dataset.cmMode = selectedMode;
    const dark = selectedMode === 'dark' || (selectedMode === 'auto' && systemDark.matches);
    document
      .querySelectorAll('[data-cm-theme-choice]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.cmThemeChoice === selectedTheme)),
      );
    document
      .querySelectorAll('[data-cm-mode-choice]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.cmModeChoice === selectedMode)),
      );
    document
      .querySelectorAll('[data-cm-appearance-title]')
      .forEach((e) => (e.textContent = copy[0]));
    document
      .querySelectorAll('.cm-appearance-trigger,.cm-appearance-panel,.cm-appearance-modes')
      .forEach((e) => e.setAttribute('aria-label', copy[0]));
    document
      .querySelectorAll('[data-cm-palette-name]')
      .forEach((e) => (e.textContent = copy[Number(e.dataset.cmPaletteName) + 4]));
    document
      .querySelectorAll('[data-cm-mode-name]')
      .forEach((e) => (e.textContent = copy[Number(e.dataset.cmModeName) + 1]));
    document.querySelectorAll('[data-cm-mode-toggle]').forEach((b) => {
      b.setAttribute('aria-label', copy[dark ? 2 : 3]);
      b.title = copy[dark ? 2 : 3];
    });
    document
      .querySelectorAll('[data-cm-mode-symbol]')
      .forEach((e) => (e.hidden = e.dataset.cmModeSymbol !== (dark ? 'light' : 'dark')));
  }
  function saveAppearance() {
    renderAppearance();
    try {
      localStorage.setItem(themeKey, selectedTheme);
      localStorage.setItem(modeKey, selectedMode);
    } catch {
      /* Session-only choice. */
    }
  }
  document.querySelectorAll('[data-cm-theme-choice]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedTheme = b.dataset.cmThemeChoice;
      saveAppearance();
    }),
  );
  document.querySelectorAll('[data-cm-mode-choice]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedMode = b.dataset.cmModeChoice;
      saveAppearance();
    }),
  );
  document.querySelectorAll('[data-cm-mode-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedMode =
        selectedMode === 'dark' || (selectedMode === 'auto' && systemDark.matches)
          ? 'light'
          : 'dark';
      saveAppearance();
    }),
  );
  systemDark.addEventListener('change', renderAppearance);
  window.addEventListener('storage', (event) => {
    if (event.key === themeKey || event.key === null)
      selectedTheme = themes.includes(event.newValue) ? event.newValue : 'system';
    if (event.key === modeKey || event.key === null)
      selectedMode = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'auto';
    renderAppearance();
  });
  document.addEventListener('cm:local-data-cleared', () => {
    selectedTheme = 'system';
    selectedMode = 'auto';
    renderAppearance();
  });
  document.addEventListener('cm:language', renderAppearance);
  renderAppearance();

  // Search stays local: only a static catalog is loaded, never the typed query.
  const commandButton = document.querySelector('[data-cm-command-open]');
  if (commandButton) {
    const dialog = document.createElement('dialog');
    dialog.className = 'cm-command';
    dialog.setAttribute('aria-labelledby', 'cm-command-title');
    const top = document.createElement('div');
    top.className = 'cm-command-top';
    const title = document.createElement('label');
    title.id = 'cm-command-title';
    title.htmlFor = 'cm-command-query';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Esc';
    close.addEventListener('click', () => dialog.close());
    const input = document.createElement('input');
    input.id = 'cm-command-query';
    input.type = 'search';
    input.autocomplete = 'off';
    input.spellcheck = false;
    const results = document.createElement('nav');
    results.className = 'cm-command-results';
    const status = document.createElement('p');
    status.className = 'cm-command-status';
    status.setAttribute('role', 'status');
    const all = document.createElement('a');
    all.className = 'cm-command-all';
    top.append(title, close);
    dialog.append(top, input, status, results, all);
    document.body.append(dialog);
    const common = [
      'basic-calculator',
      'scientific-calculator',
      'percentage-calculator',
      'loan-calculator',
      'mortgage-calculator',
      'bmi-calculator',
      'age-calculator',
      'unit-converter',
    ];
    let catalogLoading = false;
    function renderSearch() {
      title.textContent = I.t('searchLabel');
      input.placeholder = I.t('search');
      results.setAttribute('aria-label', I.t('searchLabel'));
      all.textContent = I.t('all');
      all.href = I.url(
        '/directory' + (input.value.trim() ? '?q=' + encodeURIComponent(input.value.trim()) : ''),
      );
      const query = input.value.trim().toLocaleLowerCase(I.language);
      const catalog = window.CMCatalog || [];
      const matches = query
        ? catalog
            .filter((tool) => I.searchText(tool).toLocaleLowerCase(I.language).includes(query))
            .map((tool) => {
              const names = [I.toolName(tool), tool.name, ...Object.values(tool.names || {})]
                .filter(Boolean)
                .map((name) => name.toLocaleLowerCase(I.language));
              const rank = names.some((name) => name === query)
                ? 0
                : names.some((name) => name.startsWith(query))
                  ? 1
                  : names.some((name) => name.includes(query))
                    ? 2
                    : 3;
              return { tool, rank };
            })
            .sort((a, b) => a.rank - b.rank || (a.tool.priority || 500) - (b.tool.priority || 500))
            .map((item) => item.tool)
        : common.map((slug) => catalog.find((tool) => tool.slug === slug)).filter(Boolean);
      results.replaceChildren();
      matches.slice(0, 8).forEach((tool) => {
        const link = document.createElement('a');
        link.href = I.url('/' + tool.slug);
        link.textContent = I.toolName(tool);
        results.append(link);
      });
      status.textContent = query && !matches.length && !catalogLoading ? I.t('none') : '';
      status.hidden = !status.textContent;
    }
    function openSearch() {
      document.querySelectorAll('.cm-site-header details[open]').forEach((d) => (d.open = false));
      renderSearch();
      dialog.showModal();
      input.focus();
      if ((window.CMCatalog || []).length < 500 && !catalogLoading) {
        catalogLoading = true;
        const script = document.createElement('script');
        script.src = commandButton.dataset.cmCatalogSource;
        script.onload = () => {
          catalogLoading = false;
          renderSearch();
        };
        script.onerror = () => {
          catalogLoading = false;
          renderSearch();
          script.remove();
        };
        document.head.append(script);
      }
    }
    commandButton.addEventListener('click', openSearch);
    input.addEventListener('input', renderSearch);
    dialog.addEventListener('close', () => commandButton.focus());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
        return;
      }
      if (event.key === 'Tab') {
        const controls = Array.from(dialog.querySelectorAll('button,input,a[href]')).filter(
          (element) =>
            !element.disabled && element.tabIndex >= 0 && element.getClientRects().length,
        );
        if (controls.length) {
          event.preventDefault();
          const index = controls.indexOf(document.activeElement);
          const next =
            index < 0
              ? event.shiftKey
                ? controls.length - 1
                : 0
              : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
          controls[next].focus();
        }
      }
      const links = Array.from(results.querySelectorAll('a'));
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const i = links.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? i + 1 : i - 1;
        if (links.length) links[(next + links.length) % links.length].focus();
      }
      if (event.key === 'Enter' && document.activeElement === input && links[0]) {
        event.preventDefault();
        links[0].click();
      }
    });
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.open) dialog.close();
        else openSearch();
      }
    });
    document.addEventListener('cm:language', renderSearch);
    document.addEventListener('cm:translations', renderSearch);
  }
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
      s.title = s.selectedOptions[0]?.textContent || I.language;
      const badge = s.parentElement.querySelector('.cm-site-header__locale-name');
      if (badge) badge.textContent = I.language === 'zh-CN' ? '中文' : I.language.toUpperCase();
    });
    I.updateMetadata();
    discoverTableScrollers();
    const current = location.pathname.replace(/\.html$/, '');
    document.querySelectorAll('.cm-site-header nav a,.cm-site-footer nav a').forEach((a) => {
      if (new URL(a.href).pathname === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  document
    .querySelectorAll('[data-cm-language]')
    .forEach((s) =>
      s.addEventListener('change', () =>
        I.setLanguage(s.value, { navigate: Boolean(document.querySelector('[data-cm-home]')) }),
      ),
    );
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
        document.dispatchEvent(new CustomEvent('cm:local-data-cleared'));
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
