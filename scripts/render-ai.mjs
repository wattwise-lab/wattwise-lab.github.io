export function aiEntry(copy, esc, href = '/ai') {
  return `<a class="cm-ai-entry" data-cm-href="/ai" href="${href}"><span class="cm-ai-entry__icon" aria-hidden="true">✦</span><span><strong data-ai-key="title" data-cm-no-translate>${esc(copy.title)}</strong><span data-ai-key="lead" data-cm-no-translate>${esc(copy.lead)}</span></span><span aria-hidden="true">→</span></a>`;
}
export async function renderAI({ head, header, footer, copy, esc }) {
  const tag = (key, type = 'span', extra = '') =>
    `<${type} data-ai-key="${key}" data-cm-no-translate ${extra}>${esc(copy[key])}</${type}>`;
  return (
    (await head({
      title: 'AI Calculator: Inputs, Units and Clear Results | CalcMintly',
      description:
        'Describe calculations in your own words. AI identifies tools and missing inputs. Validated models show results with units, methods and assumptions to review.',
      canonical: '/ai',
      styles: ['assets/cm-home.css', 'assets/cm-ai.css'],
      scripts: [
        'assets/cm-ai-config.js',
        'assets/cm-ai-examples.js',
        'assets/cm-ai-notes.js',
        'assets/cm-ai.js',
      ],
    })) +
    `<body class="cm-unified">${header('en')}<main class="cm-ai" id="main-content"><header class="cm-ai-intro"><p class="cm-ai-kicker" aria-hidden="true">✦ CALCMINTLY AI</p>${tag('title', 'h1')}${tag('lead', 'p')}</header><div class="cm-ai-layout"><section class="cm-ai-composer" aria-labelledby="cm-ai-label"><form id="cm-ai-form">${tag('label', 'label', 'id="cm-ai-label" for="cm-ai-question"')}<textarea id="cm-ai-question" data-aria rows="6" maxlength="5000" required dir="auto" aria-describedby="cm-ai-privacy"></textarea><div class="cm-ai-actions"><button class="cm-ai-primary" id="cm-ai-send" type="submit">${tag('send')}</button><button type="button" id="cm-ai-clear">${tag('clear')}</button></div>${tag('privacy', 'p', 'id="cm-ai-privacy" class="cm-ai-privacy"')}</form><section class="cm-ai-examples" aria-labelledby="cm-ai-example-title">${tag('examples', 'h2', 'id="cm-ai-example-title"')}<div>${['flow', 'shopping', 'energy', 'math'].map((key, k) => `<button type="button" data-ai-example="${k}">${tag(key)}</button>`).join('')}</div></section><p id="cm-ai-status" role="status" aria-live="polite"></p></section><section class="cm-ai-output" id="cm-ai-output" data-aria data-cm-no-translate aria-label="${esc(copy.results)}" aria-busy="false"><div class="cm-ai-empty"><span aria-hidden="true">↗</span>${tag('results', 'h2')}${tag('lead', 'p')}</div></section></div></main>${footer('en')}</body></html>`
  );
}
