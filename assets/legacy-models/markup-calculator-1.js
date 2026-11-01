(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function render(){
  const v=get();
  if(!(v.cost>=0 && v.mark>=0)){
    $("result").textContent="—"; $("chipProfit").textContent="—"; $("chipMargin").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a cost and markup at zero or above.";
    return;
  }
  const price=v.cost*(1+v.mark/100), profit=price-v.cost, margin=price>0?profit/price*100:0;
  $("result").textContent=money(price);
  $("chipProfit").textContent=money(profit);
  $("chipMargin").textContent=num(margin)+"%";
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="At a "+num(v.mark)+"% markup on $"+num(v.cost)+", you sell at "+money(price)+" and keep "+money(profit)+" per unit — a "+num(margin)+"% margin.";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
