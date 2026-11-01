(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
const LABELS={I:["Voltage (V)","Resistance (Ω)"],V:["Electric current (A)","Resistance (Ω)"],R:["Voltage (V)","Electric current (A)"],P:["Voltage (V)","Electric current (A)"]};
const NAMES={I:"Electric current",V:"Voltage",R:"Resistance",P:"Electrical power"};
const UNITS={I:" A",V:" V",R:" Ω",P:" W"};
function setLabels(){
  const m=$("mode").value;
  $("lab1").textContent=LABELS[m][0];
  $("lab2").textContent=LABELS[m][1];
  $("resultLabel").textContent=NAMES[m];
}
function render(){
  setLabels();
  const m=$("mode").value;
  const x=Number($("in1").value), y=Number($("in2").value);
  let solved=null, power=null, check=null, ok=true, msg="";
  if(m==="I"){ if(y===0){ok=false;msg="Resistance is zero — a short circuit has no finite current. Enter a resistance above zero.";} else {solved=x/y; power=x*solved; check=x*x/y;} }
  else if(m==="V"){ solved=x*y; power=x*solved; check=x*x*y; }
  else if(m==="R"){ if(y===0){ok=false;msg="Current is zero — resistance cannot be determined from zero current. Enter a current above zero.";} else {solved=x/y; power=x*y; check=x/y;} }
  else { solved=x*y; power=solved; check=y===0?null:x/y; }
  if(!$("in1").value.trim()||!$("in2").value.trim()||![x,y].every(Number.isFinite)||ok&&(![solved,power].every(Number.isFinite)||(check!==null&&!Number.isFinite(check)))){ok=false;msg="Enter finite input values within the model range.";}
  if(x<0||y<0){ok=false;msg="Enter values at zero or above.";}
  if(!ok){
    $("result").textContent="—"; $("chipPower").textContent="—"; $("chipCheck").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent=msg;
    return;
  }
  $("result").textContent=num(solved)+UNITS[m];
  $("chipPower").textContent=num(power)+" W";
  $("chipCheck").textContent=check===null?"Resistance is undefined at zero current":(m==="R"?"R = "+num(check)+" Ω":m==="P"?"R = "+num(check)+" Ω":"P = "+num(check)+" W");
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent=NAMES[m]+" is "+num(solved)+UNITS[m]+" at "+num(power)+" W.";
}

$("mode").addEventListener("change",render);
document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
