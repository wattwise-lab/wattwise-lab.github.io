(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.price>v.cost)||v.cost<0||!(v.sales>0)||v.increase<0||v.decline<0||v.decline>100) return {valid:false};
  const np=v.price*(1+v.increase/100), nv=v.sales*(1-v.decline/100), oldP=(v.price-v.cost)*v.sales, newP=(np-v.cost)*nv, ch=newP-oldP;
  const scen=[0,5,15].map(d=>[num(d)+"%", money((np-v.cost)*v.sales*(1-d/100)-oldP)]);
  return {valid:true, big:money(ch), chips:{chipNp:money(np), chipNprof:money(newP)},
   rows:[["Current price",money(v.price)],["New price",money(np)],["Unit cost",money(v.cost)],["Current margin / unit",money(v.price-v.cost)],["New margin / unit",money(np-v.cost)],["Current volume",num(v.sales)+" units"],["New volume",num(nv)+" units"],["Current profit",money(oldP)],["New profit",money(newP)],["Change in profit",money(ch)]],
   scen:scen, barA:oldP, barB:newP, barAText:money(oldP), barBText:money(newP), barBBad:newP<oldP,
   vclass:ch<0?"bad":"", vtext:ch<0?("The increase loses "+money(-ch)+": volume falls to "+num(nv)+" units and the higher margin does not compensate."):("The increase adds "+money(ch)+" of profit: new profit "+money(newP)+" vs current "+money(oldP)+" at "+num(nv)+" units."),
   summary:"Profit change "+money(ch)+" (new profit "+money(newP)+", current "+money(oldP)+", new price "+money(np)+", new volume "+num(nv)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipNp").textContent="—";
    $("chipNprof").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter price above cost, cost at zero or above, sales above zero, and increase and volume decline between 0% and 100%.";
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
