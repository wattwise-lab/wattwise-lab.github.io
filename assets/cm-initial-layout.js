(() => {
  'use strict';
  try {
    const theme = localStorage.getItem('calcmintly.theme.v1');
    if (['system', 'ocean', 'sand', 'graphite', 'violet', 'rose'].includes(theme))
      document.documentElement.dataset.cmTheme = theme;
  } catch {
    /* Respect browsers that disable persistent storage. */
  }
  try {
    const mode = localStorage.getItem('calcmintly.color-mode.v1');
    if (['light', 'dark'].includes(mode)) document.documentElement.dataset.cmMode = mode;
  } catch {
    /* System mode remains available. */
  }
  const body = document.body;
  if (!body) return;
  const slug = location.pathname
      .split('/')
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, ''),
    embedded =
      location.pathname.startsWith('/embed/') || new URLSearchParams(location.search).has('embed');
  if (embedded) {
    body.classList.add('cm-unified--embedded', 'cm-embedded');
    if (slug === 'basic-calculator' || slug === 'scientific-calculator')
      body.classList.add('kp-embedded');
  }
  if (slug !== 'workspace') return;
  const root = document.documentElement;
  root.setAttribute('data-cm-workspace-booting', '');
  body.setAttribute('aria-busy', 'true');
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    root.removeAttribute('data-cm-workspace-booting');
    body.removeAttribute('aria-busy');
  };
  const afterEnhancements = () => requestAnimationFrame(release);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', afterEnhancements, { once: true });
  else afterEnhancements();
  window.addEventListener('load', release, { once: true });
})();
