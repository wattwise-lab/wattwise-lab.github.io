(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.revenue>0)||v.varcost<0||v.fixedcost<0) return {valid:false};
  const tc=v.varcost+v.fixedcost, profit=v.revenue-tc, margin=profit/v.revenue*100, ratio=tc/v.revenue*100;
  const scen=[80000,100000,120000].map(r=>["$"+num(r), money(r-tc)]);
  return {valid:true, big:money(profit), chips:{chipMargin:pct(margin), chipCost:money(tc)},
   rows:[["Revenue",money(v.revenue)],["Variable costs",money(v.varcost)],["Fixed costs",money(v.fixedcost)],["Total cost",money(tc)],["Net profit",money(profit)],["Net margin",pct(margin)],["Cost ratio",pct(ratio)]],
   scen:scen, barA:tc, barB:profit, barAText:money(tc), barBText:money(profit), barBBad:profit<0,
   vclass:profit<0?"bad":margin<10?"warn":"", vtext:profit<0?("Loss of "+money(-profit)+": costs of "+money(tc)+" exceed revenue of "+money(v.revenue)+"."):("Net profit "+money(profit)+" at a "+pct(margin)+" margin; costs consume "+pct(ratio)+" of revenue."),
   summary:"Net profit "+money(profit)+" (margin "+pct(margin)+", revenue "+money(v.revenue)+", total cost "+money(tc)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipMargin").textContent="—";
    $("chipCost").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter revenue above zero, with costs at zero or above, to see net profit and margin.";
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
