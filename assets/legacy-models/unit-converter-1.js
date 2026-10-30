(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const $=id=>document.getElementById(id);
const F={"m":1,"km":1000,"cm":0.01,"mm":0.001,"in":0.0254,"ft":0.3048,"mi":1609.344};
const UNITS=["m","km","cm","mm","in","ft","mi"];
function compute(v,from,to){const base=v*F[from];const all={};for(const u in F){all[u]=base/F[u];}return {result:base/F[to],base:base,all:all};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.val)&&v.val>=0;
  if(!ok){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent="Enter a value at zero or above to convert a length."; window.__summary=""; return; }
  const r=compute(v.val,v.from,v.to);
  $("result").textContent=fmt(r.result)+" "+v.to;
  $("chipBase").textContent=fmt(r.base)+" m";
  $("chipInv").textContent=fmt(compute(1,v.to,v.from).result)+" "+v.from+" per 1 "+v.to;
  let rh=""; for(const u of Object.keys(F)){ rh+="<tr><td>"+u+"</td><td class='num'>"+fmt(r.all[u])+"</td></tr>"; }
  $("tblRows").innerHTML=rh;
  const vd=$("verdict"); vd.className="verdict"; $("verdictText").textContent="Same length, seven units — the table below shows the full conversion.";
  window.__summary="Conversion: "+fmt(v.val)+" "+v.from+" = "+fmt(r.result)+" "+v.to+"; in m: "+fmt(r.base)+".";  }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
