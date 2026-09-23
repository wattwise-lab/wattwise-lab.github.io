import { readFile } from 'node:fs/promises';

const expected = ['en','zh-CN','hi','es','ar','fr','bn','pt','id','ur','ru','de','ja','pcm','mr','vi','te','sw','ha','tr'];
const providers = ['_next/static/chunks/language-provider-Dh2x92in.js','_next/static/chunks/language-provider-C-xlUVXD.js'];
const shells = ['_next/static/chunks/site-shell-EXo-4ePF.js','_next/static/chunks/site-shell-D_30KB5T.js'];
const failures=[];
// Every page must hydrate with the same module identities as the rest of the
// compiled Vinext graph. Renaming only the HTML entry chunks breaks hydration.
for (const locale of expected) {
  const path = locale === 'en' ? 'index.html' : `${locale}/index.html`;
  const html = await readFile(path,'utf8');
  for (const chunk of ['index-D17bkTAG.js','language-provider-Dh2x92in.js','site-shell-EXo-4ePF.js']) {
    if (!html.includes(chunk)) failures.push(path+' missing graph-compatible '+chunk);
  }
  if (html.includes('index-i18n20-20260923.js')) failures.push(path+' loads a duplicate router runtime');
}
const homepageChunk = await readFile('_next/static/chunks/page-CdJW6O90.js','utf8');
if (homepageChunk.includes('e===`en`?`.`:`里。`')) failures.push('non-Chinese headline still appends Chinese suffix');

for (const file of providers) {
  const s=await readFile(file,'utf8');
  if (!s.includes('calcmintly-i18n20-home')) failures.push(file+' missing home translations');
  if (!s.includes('calcmintly-i18n20-select')) failures.push(file+' missing selector bootstrap');
  for (const locale of expected) {
    if (!s.includes('"'+locale+'"') && !s.includes('`'+locale+'`')) failures.push(file+' missing locale '+locale);
  }
  if (!s.includes('[`ar`,`ur`].includes')) failures.push(file+' missing RTL support');
}

for (const file of shells) {
  const s=await readFile(file,'utf8');
  for (const locale of expected) {
    if (!s.includes('value:`'+locale+'`')) failures.push(file+' selector missing '+locale);
  }
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('CalcMintly i18n smoke passed: 20 visible AI languages across current and cached bundles.');
