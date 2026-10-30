(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  const amt=parseFloat($("amt").value)||0, y1=parseFloat($("y1").value)||0, y2=parseFloat($("y2").value)||0, i=(parseFloat($("inf").value)||0)/100;
  const t=y2-y1;
  if(!(amt>0) || !(t>0) || !(i>-1)){
    $("result").textContent="—"; $("chipFac").textContent="—"; $("chipBack").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter an amount above zero and a current year later than the past year.";
    return;
  }
  const fac=Math.pow(1+i,t);
  $("result").textContent="$"+num(amt*fac);
  $("chipFac").textContent=num(fac)+"×";
  $("chipBack").textContent="$"+num(100/fac);
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Prices rose "+num((fac-1)*100)+"% over "+t+" years at "+num(i*100)+"% a year.";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
