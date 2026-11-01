(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function fmtDate(d){return d.toISOString().slice(0,10);}
function calcDue(lmpStr){const lmp=new Date(lmpStr+"T00:00:00Z");const due=new Date(lmp.getTime()+280*86400000);const conc=new Date(lmp.getTime()+14*86400000);return{lmp:lmp,due:due,conc:conc};}
function render(){
  const v=get();
  if(!v.lmp){invalid("Pick the first day of the last menstrual period to see the estimate.");return;}
  const r=calcDue(v.lmp);
  const lmpDate=CMCalendar.parse(v.lmp);
  const daysSince=CMCalendar.dayDiff(lmpDate,CMCalendar.today());
  const gaW=daysSince>=0?Math.floor(daysSince/7):0, gaD=daysSince>=0?daysSince%7:0;
  const rem=Math.max(280-daysSince,0), remW=Math.floor(rem/7), remD=rem%7;
  $("result").textContent=fmtDate(r.due);
  $("chipGa").textContent=daysSince>=0?gaW+"w "+gaD+"d":"not started";$("chipRem").textContent=remW+"w "+remD+"d";$("chipConc").textContent=fmtDate(r.conc);
  $("cLmp").textContent=v.lmp;$("cDue").textContent=fmtDate(r.due);$("cConc").textContent=fmtDate(r.conc)+" (assumes a 28-day cycle)";$("cGa").textContent=daysSince>=0?gaW+" weeks "+gaD+" days ("+daysSince+" days since LMP)":"LMP is in the future";$("cTri").textContent="2nd trimester starts "+fmtDate(new Date(r.lmp.getTime()+14*7*86400000))+" · 3rd trimester starts "+fmtDate(new Date(r.lmp.getTime()+28*7*86400000));
  setVerdict("warn","This is Naegele's rule: LMP + 280 days, assuming a 28-day cycle with ovulation on day 14. Cycle length and ultrasound dating may shift the estimate, and the actual date of delivery varies from person to person. Use prenatal care records for medical decisions.");
  window.__summary="Estimated due date "+fmtDate(r.due)+" from LMP "+v.lmp+" (Naegele's rule, +280 days).";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
