(() => {
  'use strict';
  const S = window.CMPreferenceStore,
    I = window.CMI18n,
    panel = document.querySelector('[data-cm-preference-tool] .cm-preferences'),
    slug = document.body.dataset.cmPreferenceTool;
  if (!S || !I || !panel || !Object.hasOwn(S.policies, slug)) return;
  const params = new URLSearchParams(location.search),
    embedded =
      location.pathname.startsWith('/embed/') ||
      params.has('embed') ||
      Boolean(window.self && window.top && window.self !== window.top);
  if (embedded) {
    panel.hidden = true;
    return;
  }
  const controls = Object.keys(S.policies[slug]).map((id) => document.getElementById(id));
  if (controls.some((control) => !(control instanceof HTMLSelectElement))) return;
  let storage;
  try {
    storage = localStorage;
  } catch {}
  const remember = panel.querySelector('[data-cm-preference-action="remember"]'),
    forget = panel.querySelector('[data-cm-preference-action="forget"]'),
    status = panel.querySelector('[data-cm-preference-status]'),
    saved = S.read(storage).tools[slug],
    initial = {};
  let remembering = Boolean(saved),
    statusKey = '';
  const current = () => Object.fromEntries(controls.map((control) => [control.id, control.value]));
  const changed = [...document.querySelectorAll('main input,main select,main textarea')].some(
    (control) => {
      if (['language', 'cm-site-language'].includes(control.id) || control.type === 'file')
        return false;
      if (control instanceof HTMLSelectElement) {
        const original = [...control.options].find((option) => option.defaultSelected);
        return control.value !== ((original || control.options[0])?.value ?? '');
      }
      if (['radio', 'checkbox'].includes(control.type))
        return control.checked !== control.defaultChecked;
      return control.value !== control.defaultValue;
    },
  );
  const navigationType = window.performance?.getEntriesByType('navigation')[0]?.type,
    returning = ['back_forward', 'reload'].includes(navigationType);
  if (saved) {
    if (
      S.mayRestore({
        embedded,
        hash: location.hash,
        search: location.search,
        changed: changed || returning,
      })
    ) {
      for (const control of controls) {
        control.value = saved[control.id];
        initial[control.id] = saved[control.id];
      }
      statusKey = 'preferenceRestored';
    } else statusKey = 'preferenceSkipped';
  }
  window.CMPreferences = {
    initialChoice: (tool, id) => (tool === slug ? initial[id] : undefined),
  };
  function render() {
    remember.disabled = false;
    remember.setAttribute('aria-pressed', String(remembering));
    forget.disabled = !remembering;
    status.textContent = statusKey ? I.t(statusKey) : '';
  }
  function save() {
    if (S.remember(storage, slug, current())) {
      remembering = true;
      statusKey = 'preferenceSaved';
    } else statusKey = 'preferenceFailure';
    render();
  }
  remember.addEventListener('click', save);
  forget.addEventListener('click', () => {
    if (S.forget(storage, slug)) {
      remembering = false;
      statusKey = 'preferenceForgotten';
    } else statusKey = 'preferenceFailure';
    render();
  });
  document.addEventListener('change', (event) => {
    // Raw-state restoration and language updates dispatch synthetic events.
    // Only deliberate unit/currency changes update an opted-in preference.
    if (event.isTrusted && remembering && controls.includes(event.target)) save();
  });
  document.addEventListener('cm:local-data-cleared', () => {
    remembering = false;
    statusKey = 'preferenceForgotten';
    render();
  });
  window.addEventListener('storage', (event) => {
    if ((event.key === S.key || event.key === null) && !S.read(storage).tools[slug]) {
      remembering = false;
      statusKey = 'preferenceForgotten';
      render();
    }
  });
  document.addEventListener('cm:language', render);
  document.addEventListener('cm:translations', render);
  render();
})();
