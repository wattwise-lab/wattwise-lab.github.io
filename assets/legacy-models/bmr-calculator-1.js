(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function calcBMR(w,h,a,sex){return 10*w+6.25*h-5*a+(sex==="male"?5:-161);}
function render(){
  const v=get();
  if(!(v.kg>0)||!(v.cm>0)||!(v.age>0)){invalid("Enter a weight, height, and age above zero to see your BMR.");return;}
  const b=calcBMR(v.kg,v.cm,v.age,$("sex").value);
  const other=calcBMR(v.kg,v.cm,v.age,$("sex").value==="male"?"female":"male");
  $("result").textContent=num1(b)+" kcal/day";
  $("chipWeek").textContent=num0(b*7)+" kcal";$("chipMonth").textContent=num0(b*30)+" kcal";$("chipOther").textContent=num1(other)+" kcal/day";
  $("cDay").textContent=num1(b)+" kcal";$("cWeek").textContent=num0(b*7)+" kcal";$("cMonth").textContent=num0(b*30)+" kcal";$("cOther").textContent=num1(other)+" kcal/day";
  const mx=Math.max(b,other);$("barYou").style.width=(b/mx*100)+"%";$("barYouVal").textContent=num1(b)+" kcal/day";$("barOther").style.width=(other/mx*100)+"%";$("barOtherVal").textContent=num1(other)+" kcal/day";
  setVerdict("","Your estimated resting expenditure is "+num1(b)+" kcal/day. This is a population equation, not a metabolic test: body composition, illness, medications, and other personal factors can move the true value, so treat it as a starting estimate.");
  window.__summary="BMR "+num1(b)+" kcal/day (Mifflin–St Jeor) for "+v.kg+" kg, "+v.cm+" cm, age "+v.age+", "+$("sex").value+".";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
