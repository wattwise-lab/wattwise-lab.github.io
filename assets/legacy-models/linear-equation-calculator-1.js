(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const a=parseFloat($("a").value), b=parseFloat($("b").value), m=parseFloat($("m").value), c=parseFloat($("c").value);
  if(isNaN(a)||isNaN(b)||isNaN(m)||isNaN(c)){
    $("result").textContent="—"; $("chipLine").textContent="—"; $("chipXint").textContent="—"; $("chipYint").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter numbers in all four fields.";
    return;
  }
  if(a===0){
    $("result").textContent = b===0 ? "every x" : "no solution";
  } else {
    $("result").textContent="x = "+num(-b/a);
  }
  $("chipLine").textContent="y = "+num(m)+"x + "+num(c);
  $("chipXint").textContent = m===0 ? "none (horizontal)" : num(-c/m);
  $("chipYint").textContent=num(c);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent = a===0 ? (b===0 ? "0·x + 0 = 0 is true for every x." : "0·x + "+num(b)+" = 0 has no solution.") : "Check: "+num(a)+" × ("+num(-b/a)+") + "+num(b)+" = "+num(a*(-b/a)+b)+".";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
