(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const v0=parseFloat($("v0").value), v1=parseFloat($("v1").value), t=parseFloat($("t").value);
  if(isNaN(v0)||isNaN(v1)||isNaN(t)||!(t>0)){
    $("result").textContent="—"; $("chipDist").textContent="—"; $("chipDv").textContent="—"; $("chipTravel").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter both velocities and a time above zero.";
    return;
  }
  const a=(v1-v0)/t, d=((v0+v1)/2)*t;
  const crossing=v0*v1<0,zeroTime=crossing?-v0/a:0,distance=crossing?(Math.abs(v0)*zeroTime+Math.abs(v1)*(t-zeroTime))/2:Math.abs(d);
  $("result").textContent=num(a)+" m/s²";
  $("chipDist").textContent=num(d)+" m"; $("chipTravel").textContent=num(distance)+" m";
  $("chipDv").textContent=num(v1-v0)+" m/s";
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent = crossing ? "Direction reverses during this interval. Travelled distance is "+num(distance)+" m; signed displacement is "+num(d)+" m." : Math.abs(v1)>Math.abs(v0) ? "Speed increases. Signed acceleration is "+num(a)+" m/s²." : Math.abs(v1)<Math.abs(v0) ? "Speed decreases. Signed acceleration is "+num(a)+" m/s²." : "Constant velocity: no acceleration.";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
