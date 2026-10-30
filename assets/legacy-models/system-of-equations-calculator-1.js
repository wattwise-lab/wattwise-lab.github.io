(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const a1=parseFloat($("a1").value), b1=parseFloat($("b1").value), c1=parseFloat($("c1").value),
        a2=parseFloat($("a2").value), b2=parseFloat($("b2").value), c2=parseFloat($("c2").value);
  if([a1,b1,c1,a2,b2,c2].some(isNaN)){
    $("result").textContent="—"; $("chipDet").textContent="—"; $("chipC1").textContent="—"; $("chipC2").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter numbers in all six fields.";
    return;
  }
  const D=a1*b2-a2*b1;
  $("chipDet").textContent=num(D);
  if(D===0){
    const prop = (a1*c2===a2*c1) && (b1*c2===b2*c1);
    $("result").textContent = prop ? "infinitely many" : "no solution";
    $("chipC1").textContent="—"; $("chipC2").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent = prop ? "The two equations describe the same line, so every point on it is a solution." : "The two lines are parallel and never meet, so there is no solution.";
    return;
  }
  const x=(c1*b2-c2*b1)/D, y=(a1*c2-a2*c1)/D;
  $("result").textContent="x = "+num(x)+", y = "+num(y);
  $("chipC1").textContent=num(a1*x+b1*y)+" = "+num(c1);
  $("chipC2").textContent=num(a2*x+b2*y)+" = "+num(c2);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Both equations check out at (x, y) = ("+num(x)+", "+num(y)+").";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
