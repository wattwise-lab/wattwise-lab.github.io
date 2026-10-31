(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const base=parseFloat($("base").value)||0, h=parseFloat($("height").value)||0,
        a=parseFloat($("sa").value)||0, b=parseFloat($("sb").value)||0, c=parseFloat($("sc").value)||0;
  if(!(base>0) || !(h>0)){
    $("result").textContent="—"; $("chipHeron").textContent="—"; $("chipPer").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a base and a height above zero.";
    return;
  }
  $("result").textContent=num(0.5*base*h);
  const valid = a>0 && b>0 && c>0 && a<b+c && b<a+c && c<a+b;
  if(valid){
    const s=(a+b+c)/2;
    $("chipHeron").textContent=num(Math.sqrt(s*(s-a)*(s-b)*(s-c)));
    $("chipPer").textContent=num(a+b+c);
    const vd=$("verdict"); vd.className="verdict";
    $("verdictText").textContent="Sides "+num(a)+", "+num(b)+", "+num(c)+" form a valid triangle.";
  } else {
    $("chipHeron").textContent="invalid triangle";
    $("chipPer").textContent=num(a+b+c);
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="The three sides do not satisfy the triangle inequality, so Heron's formula does not apply.";
  }
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
