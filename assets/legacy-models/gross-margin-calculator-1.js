(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.revenue>0)||v.cogs<0) return {valid:false};
  const gp=v.revenue-v.cogs, margin=gp/v.revenue*100, ratio=v.cogs/v.revenue*100;
  const scen=[80000,100000,120000].map(r=>["$"+num(r), pct((r-v.cogs)/r*100)]);
  return {valid:true, big:pct(margin), chips:{chipGp:money(gp), chipRatio:pct(ratio)},
   rows:[["Revenue",money(v.revenue)],["Cost of goods sold",money(v.cogs)],["Gross profit",money(gp)],["Gross margin",pct(margin)],["COGS ratio",pct(ratio)]],
   scen:scen, barA:v.cogs, barB:gp, barAText:money(v.cogs), barBText:money(gp), barBBad:gp<0,
   vclass:gp<0?"bad":margin<20?"warn":"", vtext:gp<0?("Negative gross margin: cost of goods sold exceeds revenue by "+money(-gp)+"."):("Gross profit "+money(gp)+" on revenue of "+money(v.revenue)+"; each revenue dollar keeps "+pct(margin)+" before operating expenses."),
   summary:"Gross margin "+pct(margin)+" (gross profit "+money(gp)+", revenue "+money(v.revenue)+", COGS "+money(v.cogs)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipGp").textContent="—";
    $("chipRatio").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter revenue above zero, with cost of goods sold at zero or above, to see gross margin.";
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
