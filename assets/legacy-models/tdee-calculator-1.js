(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function calcBMR2(w,h,a,sex){return 10*w+6.25*h-5*a+(sex==="male"?5:-161);}
function calcTDEE(w,h,a,sex,act){const b=calcBMR2(w,h,a,sex);return{bmr:b,tdee:b*act,actCal:b*act-b};}
function render(){
  const v=get();
  if(!(v.kg>0)||!(v.cm>0)||!(v.age>0)){invalid("Enter a weight, height, and age above zero to see your TDEE.");return;}
  const r=calcTDEE(v.kg,v.cm,v.age,$("sex").value,parseFloat($("act").value));
  $("result").textContent=num1(r.tdee)+" kcal/day";
  $("chipBmr").textContent=num1(r.bmr)+" kcal/day";$("chipWeek").textContent=num0(r.tdee*7)+" kcal";$("chipAct").textContent=num1(r.actCal)+" kcal/day";
  let rows="";[[1.2,"Sedentary"],[1.375,"Lightly active"],[1.55,"Moderately active"],[1.725,"Very active"],[1.9,"Extremely active"]].forEach(l=>{rows+="<tr><td>"+l[1]+" ("+l[0]+")</td><td class='num'>"+num1(r.bmr*l[0])+" kcal/day</td></tr>";});
  $("lvlRows").innerHTML=rows;
  const mx=r.bmr*1.9;$("barSed").style.width=(r.bmr*1.2/mx*100)+"%";$("barSedVal").textContent=num1(r.bmr*1.2);$("barYou").style.width=(r.tdee/mx*100)+"%";$("barYouVal").textContent=num1(r.tdee);$("barExt").style.width="100%";$("barExtVal").textContent=num1(r.bmr*1.9);
  setVerdict("","Your estimated total daily expenditure is "+num1(r.tdee)+" kcal/day: a BMR of "+num1(r.bmr)+" kcal/day multiplied by "+parseFloat($("act").value)+". Both parts are estimates — the BMR equation varies between individuals, and the activity factor is a coarse category, not a measurement of your days.");
  window.__summary="TDEE "+num1(r.tdee)+" kcal/day (BMR "+num1(r.bmr)+" × "+parseFloat($("act").value)+") for "+v.kg+" kg, "+v.cm+" cm, age "+v.age+", "+$("sex").value+".";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
