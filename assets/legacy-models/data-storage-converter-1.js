(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const $=id=>document.getElementById(id);
const LV={"B":0,"KB":1,"MB":2,"GB":3,"TB":4};
function compute(v,from,to,base){const bytes=v*Math.pow(base,LV[from]);const all={};for(const u in LV){all[u]=bytes/Math.pow(base,LV[u]);}return {result:bytes/Math.pow(base,LV[to]),base:bytes,all:all};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.val)&&v.val>=0&&(v.base==="1024"||v.base==="1000");
  if(!ok){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent="Enter a value at zero or above and pick a base (1024 or 1000)."; window.__summary=""; return; }
  const base=parseFloat(v.base); const r=compute(v.val,v.from,v.to,base);
  $("result").textContent=fmt(r.result)+" "+v.to;
  $("chipBase").textContent=fmt(r.base)+" B";
  $("chipInv").textContent=fmt(compute(1,v.to,v.from,base).result)+" "+v.from+" per 1 "+v.to;
  let rh=""; for(const u of Object.keys(LV)){ rh+="<tr><td>"+u+"</td><td class='num'>"+fmt(r.all[u])+"</td></tr>"; }
  $("tblRows").innerHTML=rh;
  const vd=$("verdict"); vd.className="verdict"; $("verdictText").textContent="Base "+v.base+": each step multiplies or divides by "+v.base+". Switch the base to see how the same value reads under the other convention.";
  window.__summary="Data conversion (base "+v.base+"): "+fmt(v.val)+" "+v.from+" = "+fmt(r.result)+" "+v.to+"; "+fmt(r.base)+" bytes.";  }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
