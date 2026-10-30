import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const catalogFile=await fs.readFile(new URL('../assets/cm-catalog-v3.js',import.meta.url),'utf8');
const catalog=JSON.parse(catalogFile.split('=').slice(1).join('=').trim().replace(/;$/,''));
assert.equal(catalog.length,92);assert.equal(new Set(catalog.map(t=>t.slug)).size,92);
const sitemap=await fs.readFile(new URL('../sitemap.xml',import.meta.url),'utf8');
for(const tool of catalog){const html=await fs.readFile(new URL('../'+tool.slug+'.html',import.meta.url),'utf8');assert(html.includes('https://calcmintly.com/'+tool.slug),tool.slug+' canonical');assert(sitemap.includes('https://calcmintly.com/'+tool.slug+'</loc>'),tool.slug+' sitemap');assert(tool.descriptions['zh-CN'],tool.slug+' Chinese description');if(tool.slug!=='merchant-profit-planner')assert(html.includes('/assets/cm-tool-page.js'),tool.slug+' shared presentation');}
const fraction=await fs.readFile(new URL('../fraction-calculator.html',import.meta.url),'utf8');
const context=vm.createContext({});vm.runInContext(fraction.slice(fraction.indexOf('function gcd('),fraction.indexOf('function fmtDec(')),context);
for(const [a,b,op,c,d,expected]of [[1,2,'add',1,3,'5/6'],[1.1,2,'add',1,3,'53/60'],[0.1,0.2,'add',1,2,'1/1'],[-1,2,'mul',2,3,'-1/3'],[1,-2,'sub',1,3,'-5/6'],[1,2,'div',3,4,'2/3'],[0,2,'add',0,3,'0/1'],[1e-7,1,'add',2e-7,1,'3/10000000']])assert.equal(context.opCalc(a,b,op,c,d).simp,expected);
assert(context.opCalc(1,0,'add',1,2).error);assert(context.opCalc(1,2,'div',0,3).error);
console.log('PASS: 92 tools, paths, sitemap, Chinese descriptions; 10 fraction cases.');
