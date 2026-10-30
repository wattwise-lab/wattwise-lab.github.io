(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const $=id=>document.getElementById(id);
function compute(h,m,fromOff,toOff){const total=h*60+m-Math.round(fromOff*60)+Math.round(toOff*60);const dayShift=Math.floor(total/1440);const w=((total%1440)+1440)%1440;return {hh:Math.floor(w/60),mm:w%60,dayShift:dayShift,totalMinutes:total};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.hour)&&v.hour>=0&&v.hour<=23&&Number.isFinite(v.minute)&&v.minute>=0&&v.minute<=59&&Number.isFinite(parseFloat(v.from))&&Number.isFinite(parseFloat(v.to));
  if(!ok){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent="Enter an hour from 0 to 23 and minutes from 0 to 59, and pick two UTC offsets."; window.__summary=""; return; }
  const r=compute(v.hour,v.minute,parseFloat(v.from),parseFloat(v.to));
  const pad=n=>(n<10?"0":"")+n;
  $("result").textContent=pad(r.hh)+":"+pad(r.mm);
  $("chipBase").textContent=r.dayShift===0?"same day":(r.dayShift>0?"+"+r.dayShift+" day(s)":""+r.dayShift+" day(s)");
  $("chipInv").textContent="UTC"+(parseFloat(v.to)>=0?"+":"")+v.to;
  $("tblRows").innerHTML="<tr><td>Source time</td><td class='num'>"+pad(v.hour)+":"+pad(v.minute)+" (UTC"+(parseFloat(v.from)>=0?"+":"")+v.from+")</td></tr><tr><td>Target time</td><td class='num'>"+pad(r.hh)+":"+pad(r.mm)+" (UTC"+(parseFloat(v.to)>=0?"+":"")+v.to+")</td></tr><tr><td>Day shift</td><td class='num'>"+(r.dayShift===0?"Same day":(r.dayShift>0?r.dayShift+" day(s) later":(-r.dayShift)+" day(s) earlier"))+"</td></tr>";
  const vd=$("verdict"); vd.className="verdict warn"; $("verdictText").textContent="Fixed offsets only: daylight saving can move a place by an hour on some dates. Confirm the offset that applies on the actual date with an official source before scheduling.";
  window.__summary="Timezone: "+pad(v.hour)+":"+pad(v.minute)+" at UTC"+v.from+" = "+pad(r.hh)+":"+pad(r.mm)+" at UTC"+v.to+" (day shift "+r.dayShift+").";  }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
