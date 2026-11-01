(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const $=id=>document.getElementById(id);
function compute(dist,fuel){const l100=fuel/dist*100;const kmL=fuel>0?dist/fuel:null;const miles=dist/1.609344;const mpgUS=fuel>0?miles/(fuel/3.785411784):null;const mpgUK=fuel>0?miles/(fuel/4.54609):null;return {l100:l100,kmL:kmL,mpgUS:mpgUS,mpgUK:mpgUK};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.dist)&&v.dist>0&&Number.isFinite(v.fuel)&&v.fuel>=0;
  if(!ok){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; ["bar100","bar300","bar600"].forEach(id=>{$(id).style.width="0%";}); ["bar100Val","bar300Val","bar600Val"].forEach(id=>{$(id).textContent="—";}); const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent="Enter a distance above zero and fuel used at zero or above."; window.__summary=""; return; }
  const r=compute(v.dist,v.fuel);
  $("result").textContent=fmt(r.l100)+" L/100km";
  $("chipBase").textContent=r.kmL!==null?fmt(r.kmL)+" km/L":"— (no fuel used)";
  $("chipInv").textContent=r.mpgUS!==null?fmt(r.mpgUS)+" US MPG":"—";
  $("tblRows").innerHTML="<tr><td>Litres per 100 km</td><td class='num'>"+fmt(r.l100)+"</td></tr><tr><td>Kilometres per litre</td><td class='num'>"+(r.kmL!==null?fmt(r.kmL):"—")+"</td></tr><tr><td>US miles per gallon</td><td class='num'>"+(r.mpgUS!==null?fmt(r.mpgUS):"—")+"</td></tr><tr><td>UK miles per gallon</td><td class='num'>"+(r.mpgUK!==null?fmt(r.mpgUK):"—")+"</td></tr>";
  const vd=$("verdict"); vd.className="verdict"; $("verdictText").textContent=r.l100<=6?"Efficient on these numbers: under 6 L/100km is economical for most petrol cars.":r.l100<=9?"Mid-range consumption: typical for a family petrol car in mixed driving.":"High consumption on these numbers: above 9 L/100km is thirsty for a modern car — check driving mix and load before comparing models.";
  window.__summary="Fuel economy: "+fmt(v.dist)+" km on "+fmt(v.fuel)+" L = "+fmt(r.l100)+" L/100km, "+(r.kmL!==null?fmt(r.kmL)+" km/L":"")+", "+(r.mpgUS!==null?fmt(r.mpgUS)+" US MPG":"")+"."; 
  const f100=r.l100*1, f300=r.l100*3, f600=r.l100*6;
  $("bar100Val").textContent=fmt(f100)+" L"; $("bar300Val").textContent=fmt(f300)+" L"; $("bar600Val").textContent=fmt(f600)+" L";
  const mx=Math.max(f600,0.000001);
  $("bar100").style.width=(f100/mx*100)+"%"; $("bar300").style.width=(f300/mx*100)+"%"; $("bar600").style.width=(f600/mx*100)+"%"; }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
