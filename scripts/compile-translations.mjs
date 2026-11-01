import fs from 'node:fs/promises';
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function compileTranslations(root, locales) {
  const corpus = JSON.parse(
      await fs.readFile(new URL('src/i18n-corpus.json', root), 'utf8'),
    ).filter((x) => x.active),
    coverage = {};
  await fs.mkdir(new URL('assets/translations/', root), { recursive: true });
  for (const locale of locales.filter((l) => l !== 'en')) {
    let messages = {};
    try {
      messages = JSON.parse(
        await fs.readFile(new URL('src/translations/' + locale + '.json', root), 'utf8'),
      );
    } catch {}
    const templates = [],
      missing = [];
    for (const item of corpus) {
      const translated = messages[item.source];
      if (!translated) {
        missing.push(item.id);
        continue;
      }
      if (item.parts) {
        const literals = Array.isArray(item.parts) ? item.parts : item.parts.literals,
          indices = Array.isArray(item.parts)
            ? literals.slice(1).map((_, k) => k)
            : item.parts.indices;
        if (!literals || indices.length !== literals.length - 1) continue;
        const placeholders = [...item.source.matchAll(/\{(\d+)\}/g)].map((x) => x[1]);
        if (placeholders.some((k) => !translated.includes('{' + k + '}'))) continue;
        const words = literals.join(' ').match(/[A-Za-z]{3,}/g) || [];
        if (words.length < 2) continue;
        const pattern = '^' + literals.map(escape).join('([\\s\\S]*?)') + '$';
        templates.push({ pattern, indices, target: translated });
      }
    }
    const activeMessages = Object.fromEntries(
      corpus
        .filter((item) => messages[item.source])
        .map((item) => [item.source, messages[item.source]]),
    );
    const data = { messages: activeMessages, templates },
      script =
        'window.CMTranslations=window.CMTranslations||{};window.CMTranslations[' +
        JSON.stringify(locale) +
        ']=' +
        JSON.stringify(data).replaceAll('<', '\\u003c') +
        ';\n';
    await fs.writeFile(new URL('assets/translations/' + locale + '.js', root), script);
    coverage[locale] = {
      activeSources: corpus.length,
      translated: corpus.length - missing.length,
      missing: missing.length,
      templates: templates.length,
    };
  }
  await fs.writeFile(
    new URL('src/translation-coverage.json', root),
    JSON.stringify(coverage, null, 2) + '\n',
  );
  return coverage;
}
