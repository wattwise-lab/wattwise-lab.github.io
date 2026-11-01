(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=Number(e.value)});return v;}
function bandSys(s){ if(s>180) return 4; if(s>=140) return 3; if(s>=130) return 2; if(s>=120) return 1; return 0; }
function bandDia(d){ if(d>120) return 4; if(d>=90) return 3; if(d>=80) return 2; return 0; }
function render(){
  const v=get();
  if(!(Number.isFinite(v.sys) && Number.isFinite(v.dia) && v.sys>v.dia && v.dia>0)){
    $("result").textContent="—"; $("chipPulse").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter finite readings above zero, with systolic higher than diastolic.";
    return;
  }
  const names=["Normal","Elevated","Stage 1 hypertension","Stage 2 hypertension","Very high reading"];
  const b=Math.max(bandSys(v.sys),bandDia(v.dia));
  $("result").textContent=names[b];
  $("chipPulse").textContent=num(v.sys-v.dia)+" mmHg";
  const vd=$("verdict");
  if(b===4){vd.className="verdict bad";$("verdictText").textContent="A very high reading with chest pain, trouble breathing, weakness, vision changes or difficulty speaking needs emergency help immediately. Without these symptoms, wait at least one minute and measure again. If it remains over 180 systolic or 120 diastolic, contact a healthcare professional promptly.";}
  else if(b===3){vd.className="verdict bad";$("verdictText").textContent="Stage 2 range. A single reading is not a diagnosis — repeat readings and a clinician's assessment decide what happens next.";}
  else if(b===2){vd.className="verdict warn";$("verdictText").textContent="Stage 1 range. Recheck with correct technique and discuss repeated readings with a clinician.";}
  else if(b===1){vd.className="verdict warn";$("verdictText").textContent="Elevated: systolic 120–129 with diastolic under 80. Worth watching and rechecking.";}
  else{vd.className="verdict";$("verdictText").textContent="Within the adult normal category in this high-pressure reference. This table does not assess low blood pressure or symptoms.";}
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
