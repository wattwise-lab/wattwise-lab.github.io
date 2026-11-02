import postcss from 'postcss';

// Keep OS defaults, while allowing a saved explicit choice before the first paint.
export function colorModeCSS(source) {
  const root = postcss.parse(source);
  const dark = [];
  root.walkAtRules('media', (rule) => {
    if (/^(?:screen\s+and\s+)?\(prefers-color-scheme:\s*dark\)$/.test(rule.params.trim()))
      dark.push(rule);
  });
  const prefix = (selector, condition) => {
    if (/^(:root|html)(?=[\s.#:[>+~]|$)/.test(selector))
      return selector.replace(/^(:root|html)/, '$1' + condition);
    return ':root' + condition + ' ' + selector;
  };
  for (const media of dark) {
    const explicit = media.clone();
    media.walkRules((rule) => {
      rule.selectors = rule.selectors.map((s) => prefix(s, ':not([data-cm-mode="light"])'));
    });
    explicit.walkRules((rule) => {
      rule.selectors = rule.selectors.map((s) => prefix(s, '[data-cm-mode="dark"]'));
    });
    if (media.params.trim().startsWith('screen')) {
      explicit.params = 'screen';
      media.after(explicit);
    } else media.after(explicit.nodes);
  }
  return root.toString();
}
