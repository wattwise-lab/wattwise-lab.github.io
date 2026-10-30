(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function calcBodyFat(w,hCm,a,sex){const h=hCm/100,bmi=w/(h*h),bf=1.2*bmi+0.23*a-10.8*(sex==="male"?1:0)-5.4;return{bmi:bmi,bf:bf,fatKg:w*bf/100,leanKg:w*(1-bf/100)};}
function render(){
  const v=get();
  if(!(v.kg>0)||!(v.cm>0)||!(v.age>0)){invalid("Enter a weight, height, and age above zero to see the estimate.");return;}
  const r=calcBodyFat(v.kg,v.cm,v.age,$("sex").value);
  const other=calcBodyFat(v.kg,v.cm,v.age,$("sex").value==="male"?"female":"male");
  $("result").textContent=num1(r.bf)+" %";
  $("chipBmi").textContent=num1(r.bmi);$("chipFat").textContent=num1(r.fatKg)+" kg";$("chipLean").textContent=num1(r.leanKg)+" kg";
  $("cBmi").textContent=num1(r.bmi);$("cBf").textContent=num1(r.bf)+" %";$("cFat").textContent=num1(r.fatKg)+" kg";$("cLean").textContent=num1(r.leanKg)+" kg";$("cOther").textContent=num1(other.bf)+" %";
  const mx=Math.max(r.bf,other.bf,1);$("barYou").style.width=(r.bf/mx*100)+"%";$("barYouVal").textContent=num1(r.bf)+" %";$("barOther").style.width=(other.bf/mx*100)+"%";$("barOtherVal").textContent=num1(other.bf)+" %";
  setVerdict("warn","This is a population-equation estimate, not a direct body-composition measurement. It can be inaccurate for athletes, older adults, and many body types — treat the percentage as a rough guide, not a measured value.");
  window.__summary="Estimated body fat "+num1(r.bf)+" % (BMI "+num1(r.bmi)+", age "+v.age+", "+$("sex").value+"), fat mass "+num1(r.fatKg)+" kg, lean mass "+num1(r.leanKg)+" kg.";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
