(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function calcCalories(met,w,min){const perMin=met*3.5*w/200;return{total:perMin*min,perMin:perMin,perHour:perMin*60};}
function render(){
  const v=get();
  if(!(v.met>0)||!(v.kg>0)||!(v.min>0)){invalid("Enter a MET value, a weight, and a duration above zero to see the estimate.");return;}
  const r=calcCalories(v.met,v.kg,v.min);
  $("result").textContent=num1(r.total)+" kcal";
  $("chipHour").textContent=num1(r.perHour)+" kcal";$("chipMin").textContent=num(r.perMin)+" kcal";$("chip30").textContent=num1(r.perMin*30)+" kcal";
  $("c15").textContent=num1(r.perMin*15)+" kcal";$("c30").textContent=num1(r.perMin*30)+" kcal";$("c45").textContent=num1(r.perMin*45)+" kcal";$("c60").textContent=num1(r.perMin*60)+" kcal";
  const mx=r.perMin*60;$("bar15").style.width=(r.perMin*15/mx*100)+"%";$("bar15Val").textContent=num1(r.perMin*15)+" kcal";$("bar30").style.width=(r.perMin*30/mx*100)+"%";$("bar30Val").textContent=num1(r.perMin*30)+" kcal";$("bar60").style.width="100%";$("bar60Val").textContent=num1(r.perMin*60)+" kcal";
  setVerdict("warn","MET values are population averages. Fitness, movement efficiency, equipment, and individual physiology can materially change actual expenditure, so this is an estimate, not a measured burn.");
  window.__summary="Calories burned "+num1(r.total)+" kcal at "+v.met+" MET, "+v.kg+" kg, "+v.min+" minutes ("+num1(r.perHour)+" kcal/hour).";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
