(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2,minimumFractionDigits:2});
const $=id=>document.getElementById(id);
function render(){
  let vals=[],dataError='';try{vals=CMData.list($('data').value);}catch(error){dataError=window.CMI18n.pick(error.message);}
  if(vals.length<2){
    $("result").textContent="—"; $("chipSamp").textContent="—"; $("chipMean").textContent="—"; $("chipSd").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent=dataError||"Enter at least two numbers, separated by commas or spaces.";
    return;
  }
  const n=vals.length, mean=vals.reduce((a,b)=>a+b,0)/n;
  const ss=vals.reduce((a,b)=>a+(b-mean)*(b-mean),0);
  const pop=ss/n, samp=ss/(n-1);
  $("result").textContent=num(pop);
  $("chipSamp").textContent=num(samp);
  $("chipMean").textContent=num(mean);
  $("chipSd").textContent=num(Math.sqrt(pop))+" / "+num(Math.sqrt(samp));
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="n = "+n+", mean "+num(mean)+", sum of squared deviations "+num(ss)+".";
}

document.querySelectorAll("input,textarea").forEach(e=>e.addEventListener("input",render));render();

})();
