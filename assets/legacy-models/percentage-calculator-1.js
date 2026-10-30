(()=>{'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
function pctCalc(p,b){return{part:b*p/100,inc:b*(1+p/100),dec:b*(1-p/100),frac:p/100};}
function render(){
 const p=parseFloat($("pct").value),b=parseFloat($("base").value);
 if(isNaN(p)||isNaN(b)){["result","chipInc","chipDec","tPart","tInc","tDec","tFrac"].forEach(id=>{$(id).textContent="—";});$("note").textContent="Enter a percentage and a base value.";window.__summary="";return;}
 const r=pctCalc(p,b);
 $("result").textContent=fmt(r.part);$("chipInc").textContent=fmt(r.inc);$("chipDec").textContent=fmt(r.dec);
 $("tPart").textContent=fmt(r.part);$("tInc").textContent=fmt(r.inc);$("tDec").textContent=fmt(r.dec);$("tFrac").textContent=fmt(r.frac);
 $("note").textContent=p+"% of "+fmt(b)+" is "+fmt(r.part)+".";
 window.__summary="Percentage: "+p+"% of "+fmt(b)+" = "+fmt(r.part)+"; after increase "+fmt(r.inc)+"; after decrease "+fmt(r.dec)+".";
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();
})();
