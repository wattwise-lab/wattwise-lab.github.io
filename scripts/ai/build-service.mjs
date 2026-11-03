import fs from 'node:fs/promises';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
const root = new URL('../../', import.meta.url),
  read = (f) => fs.readFile(new URL(f, root), 'utf8');
const sourceFiles = [
  'assets/cm-data-core.js',
  'assets/models/core.js',
  ...(await fs.readdir(new URL('assets/models/', root)))
    .filter((f) => f !== 'core.js' && f.endsWith('.js'))
    .sort()
    .map((f) => 'assets/models/' + f),
  'assets/cm-keypad-core.js',
  'assets/cm-finance-core.js',
];
const sources = await Promise.all(sourceFiles.map(read));
const version = createHash('sha256')
  .update(
    sources.join('\n') +
      (await read('services/ai/engine.mjs')) +
      (await read('services/ai/worker.mjs')),
  )
  .digest('hex')
  .slice(0, 12);
await fs.writeFile(
  new URL('services/ai/library.mjs', root),
  sources.join('\n;\n') +
    '\nexport const models=CMModels.models; export const Decimal=CMKeypad.Decimal; export const scientific=CMKeypad.scientific; export const finance=CMCoreFinance; export const data=CMData;\n',
);
await build({
  entryPoints: [new URL('services/ai/worker.mjs', root).pathname],
  outfile: new URL('services/ai/public/_worker.js', root).pathname,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  define: { CM_AI_VERSION: JSON.stringify(version) },
  legalComments: 'inline',
});
await fs.writeFile(
  new URL('services/ai/public/index.html', root),
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>CalcMintly calculation service</title><p>CalcMintly calculation service. Use the <a href="https://calcmintly.com/ai">AI calculator</a>.</p></html>',
);
console.log('AI service built, model version ' + version);
