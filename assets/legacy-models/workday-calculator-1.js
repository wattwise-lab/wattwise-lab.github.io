(()=>{'use strict';

function parseDate(s){return CMCalendar.parse(s);}
function utcDay(d){return CMCalendar.ordinal(d)*86400000;}
function dayDiff(a,b){return CMCalendar.dayDiff(a,b);}
function todayLocal(){return CMCalendar.today();}
function iso(d){return CMCalendar.iso(d);}
function fillToday(id){const el=document.getElementById(id);if(el&&!el.value)el.value=iso(todayLocal());}
function fmtDate(d){return CMCalendar.format(d,window.CMI18n?.language||"en");}
function weekday(d){return new Intl.DateTimeFormat(window.CMI18n?.language==="pcm"?"en-NG":window.CMI18n?.language||"en",{calendar:"gregory",timeZone:"UTC",weekday:"long"}).format(d);}

const $=id=>document.getElementById(id);
const fmt=n=>window.CMI18n?window.CMI18n.number(Number(n)):Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'));
function workdayCalc(s,e){const value=document.getElementById("weekend")?.value||"0,6";return CMCalendar.workdays(s,e,value==="none"?[]:value.split(",").map(Number));}
function render(){
 const s=parseDate($("start").value), e=parseDate($("end").value);
 const hol=parseFloat($("hol").value)||0;
 if(!s||!e){["result","chipWd","chipWe","tCal","tWd","tWe","tHol","tNet"].forEach(id=>{$(id).textContent="—";});$("note").textContent="Enter a start and an end date.";window.__summary="";return;}
 if(e<s){["result","chipWd","chipWe","tCal","tWd","tWe","tHol","tNet"].forEach(id=>{$(id).textContent="—";});$("note").textContent="End date is before the start date.";window.__summary="";return;}
 const r=workdayCalc(s,e);if(hol<0||hol>r.wd){["result","chipWd","chipWe","tCal","tWd","tWe","tHol","tNet"].forEach(id=>{$(id).textContent="—";});$("note").textContent="Holiday deductions must be between zero and the selected working-day count.";window.__summary="";return;}const net=r.wd-hol;
 $("result").textContent=fmt(net)+" workdays";$("chipWd").textContent=fmt(r.wd);$("chipWe").textContent=fmt(r.we);
 $("tCal").textContent=fmt(r.cal);$("tWd").textContent=fmt(r.wd);$("tWe").textContent=fmt(r.we);$("tHol").textContent=fmt(hol);$("tNet").textContent=fmt(net);
 $("note").textContent=fmt(r.cal)+" calendar days: "+fmt(r.wd)+" weekdays, "+fmt(r.we)+" weekend days"+(hol>0?", less "+fmt(hol)+" holidays = "+fmt(net)+" net workdays.":", "+fmt(net)+" net workdays.");
 window.__summary="Workdays: "+fmt(net)+" net ("+fmt(r.wd)+" weekdays, "+fmt(r.we)+" weekend days, "+fmt(hol)+" holidays) from "+fmtDate(s)+" to "+fmtDate(e)+".";
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));document.querySelectorAll("input,select").forEach(e=>e.addEventListener("change",render));document.addEventListener("cm:language",render);document.addEventListener("cm:translations",render);render();
})();
