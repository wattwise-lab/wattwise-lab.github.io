(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const r=parseFloat($("r").value)||0;
  if(r<=0){
    $("result").textContent="—"; $("chipCirc").textContent="—"; $("chipDia").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a radius above zero.";
    return;
  }
  const area=Math.PI*r*r, circ=2*Math.PI*r;
  $("result").textContent=num(area);
  $("chipCirc").textContent=num(circ);
  $("chipDia").textContent=num(2*r);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="A circle of radius "+num(r)+" has area "+num(area)+" and circumference "+num(circ)+".";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
