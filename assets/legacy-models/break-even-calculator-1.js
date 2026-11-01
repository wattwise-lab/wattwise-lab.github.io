(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(v.fixed<0||v.price<=v.varcost||v.varcost<0) return {valid:false};
  const cm=v.price-v.varcost, units=v.fixed/cm, rev=units*v.price;
  const scen=[180,200,240].map(p=>["$"+num(p), p>v.varcost?num(v.fixed/(p-v.varcost))+" units":"no break-even"]);
  return {valid:true, big:num(units)+" units", chips:{chipCm:money(cm)+" / unit", chipRev:money(rev)},
   rows:[["Fixed costs",money(v.fixed)],["Unit price",money(v.price)],["Unit variable cost",money(v.varcost)],["Contribution margin / unit",money(cm)],["Contribution margin ratio",pct(cm/v.price*100)],["Break-even units",num(units)+" units"],["Break-even revenue",money(rev)]],
   scen:scen, barA:v.fixed, barB:units*cm, barAText:money(v.fixed), barBText:money(units*cm), barBBad:false,
   vclass:"", vtext:"Sell "+num(units)+" units ($"+num(rev)+" revenue) to cover fixed costs of $"+num(v.fixed)+". Each unit beyond that adds "+money(cm)+" toward profit at this price.",
   summary:"Break-even: "+num(units)+" units / "+money(rev)+" revenue (fixed "+money(v.fixed)+", price "+money(v.price)+", variable cost "+money(v.varcost)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipCm").textContent="—";
    $("chipRev").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter fixed costs at zero or above, and a unit price above the unit variable cost, to see the break-even point.";
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
