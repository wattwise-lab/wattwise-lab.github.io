(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const num1=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:1});
const num0=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:0});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.type==="date"?e.value:(parseFloat(e.value)||0)});return v;}
function setVerdict(cls,txt){const vd=$("verdict");vd.className="verdict"+(cls?" "+cls:"");$("verdictText").textContent=txt;}
function invalid(msg){$("result").textContent="—";document.querySelectorAll(".chip strong").forEach(c=>c.textContent="—");setVerdict("warn",msg);window.__summary="";}



function fmtTime(sec){sec=Math.round(sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h>0?h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0"):m+":"+String(s).padStart(2,"0");}
function calcPace(dist,totalSec){const perKm=totalSec/dist,perMile=perKm*1.609344;return{perKm:perKm,perMile:perMile,kmh:dist/(totalSec/3600),mph:dist/1.609344/(totalSec/3600)};}
function render(){
  const v=get();
  const total=v.hh*3600+v.mm*60+v.ss;
  if(!(v.dist>0)||!(total>0)){invalid("Enter a distance above zero and a finish time above zero to see your pace.");return;}
  const r=calcPace(v.dist,total);
  $("result").textContent=fmtTime(r.perKm)+" /km";
  $("chipMile").textContent=fmtTime(r.perMile)+" /mile";$("chipSpeed").textContent=num1(r.kmh)+" km/h";$("chip5k").textContent=fmtTime(r.perKm*5);
  $("cKm").textContent=fmtTime(r.perKm)+" /km";$("cMile").textContent=fmtTime(r.perMile)+" /mile";$("cKmh").textContent=num1(r.kmh)+" km/h";$("cMph").textContent=num(r.mph)+" mph";$("c5k").textContent=fmtTime(r.perKm*5);$("c10k").textContent=fmtTime(r.perKm*10);$("cMara").textContent=fmtTime(r.perKm*42.195);
  $("barKm").style.width="100%";$("barKmVal").textContent=fmtTime(r.perKm)+" /km";$("barMile").style.width="100%";$("barMileVal").textContent=fmtTime(r.perMile)+" /mile";
  setVerdict("","Your average pace is "+fmtTime(r.perKm)+" per kilometre ("+fmtTime(r.perMile)+" per mile) at "+num1(r.kmh)+" km/h. This is a whole-race average: it does not account for pauses, terrain, weather, elevation, or GPS measurement error.");
  window.__summary="Pace "+fmtTime(r.perKm)+"/km ("+fmtTime(r.perMile)+"/mile), "+num1(r.kmh)+" km/h, for "+v.dist+" km in "+fmtTime(total)+".";
}

document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
