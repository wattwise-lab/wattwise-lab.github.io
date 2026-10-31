import fs from 'node:fs/promises';
import * as espree from 'espree';
const root = new URL('../assets/legacy-models/', import.meta.url);
const replacements = {
  parseDate: 'function parseDate(s){return CMCalendar.parse(s);}',
  utcDay: 'function utcDay(d){return CMCalendar.ordinal(d)*86400000;}',
  dayDiff: 'function dayDiff(a,b){return CMCalendar.dayDiff(a,b);}',
  todayLocal: 'function todayLocal(){return CMCalendar.today();}',
  iso: 'function iso(d){return CMCalendar.iso(d);}',
  fmtDate: 'function fmtDate(d){return CMCalendar.format(d,window.CMI18n?.language||"en");}',
  weekday:
    'function weekday(d){return new Intl.DateTimeFormat(window.CMI18n?.language==="pcm"?"en-NG":window.CMI18n?.language||"en",{calendar:"gregory",timeZone:"UTC",weekday:"long"}).format(d);}',
  birthdayIn: 'function birthdayIn(year,dob){return CMCalendar.birthday(year,dob);}',
  ageCalc: 'function ageCalc(dob,ref){return CMCalendar.age(dob,ref);}',
  calBreak: 'function calBreak(a,b){return CMCalendar.breakdown(a,b);}',
  workdayCalc:
    'function workdayCalc(s,e){const value=document.getElementById("weekend")?.value||"0,6";return CMCalendar.workdays(s,e,value==="none"?[]:value.split(",").map(Number));}',
};
for (const slug of [
  'age-calculator',
  'date-difference-calculator',
  'countdown-calculator',
  'workday-calculator',
]) {
  const file = new URL(slug + '-1.js', root);
  let source = await fs.readFile(file, 'utf8');
  const ast = espree.parse(source, { ecmaVersion: 'latest', range: true }),
    edits = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && replacements[node.id?.name]) {
      edits.push({ range: node.range, text: replacements[node.id.name] });
      return;
    }
    for (const value of Object.values(node))
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
  }
  visit(ast);
  for (const edit of edits.sort((a, b) => b.range[0] - a.range[0]))
    source = source.slice(0, edit.range[0]) + edit.text + source.slice(edit.range[1]);
  source = source.replace(
    'const fmt=n=>Number(n).toLocaleString("en-US");',
    'const fmt=n=>window.CMI18n?window.CMI18n.number(Number(n)):Number(n).toLocaleString("en-US");',
  );
  if (!source.includes('document.addEventListener("cm:language",render)'))
    source = source.replace(
      'render();\n})();',
      'document.addEventListener("cm:language",render);document.addEventListener("cm:translations",render);render();\n})();',
    );
  if (
    ['age-calculator', 'countdown-calculator'].includes(slug) &&
    !source.includes('/* Live day defaults */')
  ) {
    const id = slug === 'age-calculator' ? 'ref' : 'from';
    const marker =
      'document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));';
    source = source.replace(
      marker,
      '/* Live day defaults */\n$("' +
        id +
        '").value=CMCalendar.iso(CMCalendar.today());\n' +
        marker,
    );
  }
  if (slug === 'workday-calculator') {
    source = source.replace(
      'const r=workdayCalc(s,e), net=Math.max(0,r.wd-hol);',
      'const r=workdayCalc(s,e);if(hol<0||hol>r.wd){["result","chipWd","chipWe","tCal","tWd","tWe","tHol","tNet"].forEach(id=>{$(id).textContent="—";});$("note").textContent="Holiday deductions must be between zero and the selected working-day count.";window.__summary="";return;}const net=r.wd-hol;',
    );
  }
  await fs.writeFile(file, source);
}
const pregnancyFile = new URL('pregnancy-due-date-calculator-1.js', root);
let pregnancy = await fs.readFile(pregnancyFile, 'utf8');
pregnancy = pregnancy.replace(
  'const lmpLocal=new Date(v.lmp+"T00:00:00");\n  const daysSince=Math.floor((today-lmpLocal)/86400000);',
  'const lmpDate=CMCalendar.parse(v.lmp);\n  const daysSince=CMCalendar.dayDiff(lmpDate,CMCalendar.today());',
);
await fs.writeFile(pregnancyFile, pregnancy);
console.log('Calendar presenters use the verified date-only core.');
