import { readFile } from 'node:fs/promises';

const expected = ['en','zh-CN','hi','es','ar','fr','bn','pt','id','ur','ru','de','ja','pcm','mr','vi','te','sw','ha','tr'];
const providers = ['_next/static/chunks/language-provider-Dh2x92in.js','_next/static/chunks/language-provider-C-xlUVXD.js'];
const shells = ['_next/static/chunks/site-shell-EXo-4ePF.js','_next/static/chunks/site-shell-D_30KB5T.js'];
const failures=[];

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
