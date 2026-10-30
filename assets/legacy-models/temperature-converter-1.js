(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const unit=d=>d==="c"?"°C":d==="f"?"°F":"K";
const $=id=>document.getElementById(id);
function toC(v,from){if(from==="c")return v;if(from==="f")return (v-32)*5/9;return v-273.15;}
function fromC(c,to){if(to==="c")return c;if(to==="f")return c*9/5+32;return c+273.15;}
function compute(v,from,to){const c=toC(v,from);const k=c+273.15;return {result:fromC(c,to),celsius:c,kelvin:k,valid:k>=-1e-9};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.val);
  const r=ok?compute(v.val,v.from,v.to):null;
  if(!ok||!r.valid){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent=!ok?"Enter a temperature to convert.":"Below absolute zero (0 K): no physical temperature is colder than -273.15 °C. Check the input scale."; window.__summary=""; return; }
  $("result").textContent=fmt(r.result)+unit(v.to);
  $("chipBase").textContent=fmt(r.celsius)+" °C";
  $("chipInv").textContent=fmt(r.kelvin)+" K";
  let rh=""; for(const u of ["c","f","k"]){ rh+="<tr><td>"+unit(u)+"</td><td class='num'>"+fmt(fromC(r.celsius,u))+"</td></tr>"; }
  $("tblRows").innerHTML=rh;
  const vd=$("verdict"); vd.className="verdict"; $("verdictText").textContent="Valid temperature: "+fmt(r.kelvin)+" K is at or above absolute zero.";
  window.__summary="Temperature: "+fmt(v.val)+unit(v.from)+" = "+fmt(r.result)+unit(v.to)+" ("+fmt(r.celsius)+" °C, "+fmt(r.kelvin)+" K).";  }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
