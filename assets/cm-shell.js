(() => {
  'use strict';
  const I = window.CMI18n,
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  if (!I) return;
  document.body.classList.add('cm-unified');
  if (embedded) document.body.classList.add('cm-unified--embedded');
  // Appearance is an explicit device preference; calculator inputs are never stored here.
  const themeKey = 'calcmintly.theme.v1';
  const themes = ['system', 'ocean', 'sand', 'graphite'];
  const themeCopy = {
    en: ['Appearance', 'System · Mint', 'Ocean', 'Warm sand', 'Graphite'],
    'zh-CN': ['外观主题', '跟随系统 · 薄荷', '海洋蓝', '暖沙色', '石墨灰'],
    hi: ['रूप', 'सिस्टम · पुदीना', 'समुद्री नीला', 'गर्म रेत', 'ग्रेफाइट'],
    es: ['Apariencia', 'Sistema · Menta', 'Océano', 'Arena cálida', 'Grafito'],
    ar: ['المظهر', 'النظام · نعناع', 'المحيط', 'رمال دافئة', 'جرافيت'],
    fr: ['Apparence', 'Système · Menthe', 'Océan', 'Sable chaud', 'Graphite'],
    bn: ['চেহারা', 'সিস্টেম · পুদিনা', 'সমুদ্র', 'উষ্ণ বালি', 'গ্রাফাইট'],
    pt: ['Aparência', 'Sistema · Menta', 'Oceano', 'Areia quente', 'Grafite'],
    id: ['Tampilan', 'Sistem · Mint', 'Samudra', 'Pasir hangat', 'Grafit'],
    ur: ['ظاہری شکل', 'سسٹم · پودینہ', 'سمندر', 'گرم ریت', 'گریفائٹ'],
    ru: ['Оформление', 'Система · Мята', 'Океан', 'Тёплый песок', 'Графит'],
    de: ['Darstellung', 'System · Minze', 'Ozean', 'Warmer Sand', 'Graphit'],
    ja: ['外観', 'システム · ミント', 'オーシャン', 'ウォームサンド', 'グラファイト'],
    pcm: ['How e look', 'System · Mint', 'Ocean blue', 'Warm sand', 'Graphite'],
    mr: ['दिसणे', 'सिस्टम · मिंट', 'सागर', 'उबदार वाळू', 'ग्रॅफाइट'],
    vi: ['Giao diện', 'Hệ thống · Bạc hà', 'Đại dương', 'Cát ấm', 'Than chì'],
    te: ['రూపం', 'సిస్టమ్ · మింట్', 'సముద్రం', 'వెచ్చని ఇసుక', 'గ్రాఫైట్'],
    sw: ['Mwonekano', 'Mfumo · Mnanaa', 'Bahari', 'Mchanga wenye joto', 'Grafiti'],
    ha: ['Kamanni', 'Tsarin na’ura · Mint', 'Teku', 'Yashi mai ɗumi', 'Grafit'],
    tr: ['Görünüm', 'Sistem · Nane', 'Okyanus', 'Sıcak kum', 'Grafit'],
  };
  let selectedTheme = 'system';
  try {
    const saved = localStorage.getItem(themeKey);
    if (themes.includes(saved)) selectedTheme = saved;
  } catch {
    /* Appearance still works when browser storage is unavailable. */
  }
  function applyTheme(value) {
    selectedTheme = themes.includes(value) ? value : 'system';
    document.documentElement.dataset.cmTheme = selectedTheme;
    document.querySelectorAll('[data-cm-theme-select]').forEach((s) => {
      s.value = selectedTheme;
    });
  }
  const appearanceMenu = document.querySelector('.cm-site-header__mobile nav');
  let themeLabel, themeSelect;
  if (appearanceMenu) {
    const group = document.createElement('div');
    group.className = 'cm-appearance';
    themeLabel = document.createElement('label');
    themeLabel.htmlFor = 'cm-site-theme';
    themeSelect = document.createElement('select');
    themeSelect.id = 'cm-site-theme';
    themeSelect.dataset.cmThemeSelect = '';
    themes.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      themeSelect.append(option);
    });
    group.append(themeLabel, themeSelect);
    appearanceMenu.append(group);
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
      try {
        localStorage.setItem(themeKey, selectedTheme);
      } catch {
        /* Session-only choice. */
      }
    });
  }
  function renderAppearance() {
    const copy = themeCopy[I.language] || themeCopy.en;
    if (themeLabel) themeLabel.textContent = copy[0];
    if (themeSelect)
      Array.from(themeSelect.options).forEach((o, i) => {
        o.textContent = copy[i + 1];
      });
    applyTheme(selectedTheme);
  }
  window.addEventListener('storage', (event) => {
    if (event.key === themeKey || event.key === null) applyTheme(event.newValue);
  });
  document.addEventListener('cm:local-data-cleared', () => applyTheme('system'));
  document.addEventListener('cm:language', renderAppearance);
  renderAppearance();
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
