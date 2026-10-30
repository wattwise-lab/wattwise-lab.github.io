(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const fv=parseFloat($("fv").value)||0, r=(parseFloat($("rate").value)||0)/100, n=parseFloat($("years").value)||0;
  if(!(fv>0) || !(r>=0) || !(n>=0)){
    $("result").textContent="—"; $("chipDisc").textContent="—"; $("chip5").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a future value above zero and non-negative rate and years.";
    return;
  }
  const pv=fv/Math.pow(1+r,n), pv5=fv/Math.pow(1+r,5);
  $("result").textContent="$"+num(pv);
  $("chipDisc").textContent="$"+num(fv-pv);
  $("chip5").textContent="$"+num(pv5);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Waiting "+num(n)+" years at "+num(r*100)+"% costs $"+num(fv-pv)+" of today's value.";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
