(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function calcIdeal(hCm,sex){const inch=hCm/2.54,over=Math.max(inch-60,0);return{ideal:(sex==="male"?50:45.5)+2.3*over,inch:inch};}
function render(){
  const v=get();
  if(!(v.cm>0)){invalid("Enter a height above zero to see the reference weight.");return;}
  const r=calcIdeal(v.cm,$("sex").value);
  const other=calcIdeal(v.cm,$("sex").value==="male"?"female":"male");
  const bmi=r.ideal/Math.pow(v.cm/100,2);
  $("result").textContent=num1(r.ideal)+" kg";
  $("chipH").textContent=num1(r.inch)+" in";$("chipOther").textContent=num1(other.ideal)+" kg";$("chipBmi").textContent=num1(bmi);
  $("cIdeal").textContent=num1(r.ideal)+" kg";$("cOther").textContent=num1(other.ideal)+" kg";$("cInch").textContent=num1(r.inch)+" in ("+num1(Math.max(r.inch-60,0))+" in above 5 ft)";$("cBmi").textContent=num1(bmi);$("cLb").textContent=num1(r.ideal/0.45359237)+" lb";
  const mx=Math.max(r.ideal,other.ideal);$("barYou").style.width=(r.ideal/mx*100)+"%";$("barYouVal").textContent=num1(r.ideal)+" kg";$("barOther").style.width=(other.ideal/mx*100)+"%";$("barOtherVal").textContent=num1(other.ideal)+" kg";
  setVerdict("warn","The Devine formula was developed for medication dosing and is not a personalized health or appearance target. A single height-based number cannot capture build, muscle, age, or personal circumstances.");
  window.__summary="Devine reference weight "+num1(r.ideal)+" kg for "+v.cm+" cm, "+$("sex").value+" (other sex "+num1(other.ideal)+" kg).";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
