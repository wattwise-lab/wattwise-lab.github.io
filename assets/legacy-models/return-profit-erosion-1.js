(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.orders>0)||v.rate<0||v.rate>100||v.profit<0||v.reverse<0||v.value<0||v.loss<0||v.loss>100) return {valid:false};
  const ret=v.orders*v.rate/100, per=v.profit+v.reverse+v.value*v.loss/100, er=ret*per, tot=v.orders*v.profit, share=tot>0?er/tot*100:0;
  const scen=[5,12,20].map(r=>[num(r)+"%", money(v.orders*r/100*per)]);
  return {valid:true, big:money(er), chips:{chipRet:num(ret)+" orders", chipShare:pct(share)},
   rows:[["Orders",num(v.orders)],["Return rate",pct(v.rate)],["Returned orders",num(ret)+" orders"],["Erosion per return",money(per)],["Foregone profit",money(ret*v.profit)],["Reverse shipping",money(ret*v.reverse)],["Product value lost",money(ret*v.value*v.loss/100)],["Total profit eroded",money(er)],["Profit if no returns",money(tot)],["Erosion share",pct(share)]],
   scen:scen, barA:tot, barB:er, barAText:money(tot), barBText:money(er), barBBad:share>=50,
   vclass:share>=50?"bad":share>=25?"warn":"", vtext:share>=50?("Returns erode "+pct(share)+" of profit ("+money(er)+" of "+money(tot)+") — more than half the profit is lost to returns at these assumptions."):("Returns erode "+money(er)+" ("+pct(share)+" of "+money(tot)+" profit) across "+num(ret)+" returned orders."),
   summary:"Profit eroded "+money(er)+" ("+pct(share)+" of "+money(tot)+", "+num(ret)+" returns of "+num(v.orders)+" orders)."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipRet").textContent="—";
    $("chipShare").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter orders above zero, return rate and loss between 0% and 100%, and profit, reverse shipping, and product value at zero or above.";
    window.__summary="";
    return;
  }
  $("result").textContent=r.big;
  Object.keys(r.chips).forEach(k=>{$(k).textContent=r.chips[k];});
  $("tblRows").innerHTML=r.rows.map(x=>"<tr><td>"+x[0]+"</td><td class='num'>"+x[1]+"</td></tr>").join("");
  $("scenRows").innerHTML=r.scen.map(x=>"<tr><td>"+x[0]+"</td><td class='num'>"+x[1]+"</td></tr>").join("");
  const mx=Math.max(Math.abs(r.barA),Math.abs(r.barB),1);
  $("barA").style.width=(Math.abs(r.barA)/mx*100)+"%"; $("barAVal").textContent=r.barAText;
  $("barB").style.width=(Math.abs(r.barB)/mx*100)+"%"; $("barBVal").textContent=r.barBText;
  $("barB").className=r.barBBad?"newbad":"new";
  const vd=$("verdict"); vd.className="verdict"+(r.vclass?" "+r.vclass:"");
  $("verdictText").textContent=r.vtext;
  window.__summary=r.summary;
}


document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
