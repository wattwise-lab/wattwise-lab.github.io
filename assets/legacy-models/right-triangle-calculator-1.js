(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const a=parseFloat($("la").value)||0, b=parseFloat($("lb").value)||0;
  if(!(a>0) || !(b>0)){
    $("result").textContent="—"; $("chipAng").textContent="—"; $("chipArea").textContent="—"; $("chipPer").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter both legs above zero.";
    return;
  }
  const c=Math.sqrt(a*a+b*b), angA=Math.atan2(a,b)*180/Math.PI, angB=90-angA;
  $("result").textContent=num(c);
  $("chipAng").textContent=num(angA)+"° / "+num(angB)+"°";
  $("chipArea").textContent=num(0.5*a*b);
  $("chipPer").textContent=num(a+b+c);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Check: "+num(a)+"² + "+num(b)+"² = "+num(a*a+b*b)+" = "+num(c)+"².";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
