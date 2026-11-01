(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const inv=v.tuition+v.lhours*v.lhourly;const ben=v.raise*v.prob/100;const pay=ben>0?inv/ben:Infinity;return {inv:inv,ben:ben,pay:pay,net12:ben*12-inv,net24:ben*24-inv};}
function render(){
  const v=get();
  if(!(v.tuition>=0&&v.lhours>=0&&v.lhourly>=0&&v.raise>=0&&v.prob>=0&&v.prob<=100)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter tuition, hours, hourly value, expected gain, and probability (0-100) at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=isFinite(r.pay)?num(r.pay)+" months":"no payback";
  $("chipA").textContent=money(r.inv);$("chipB").textContent=money(r.ben)+"/mo";$("chipC").textContent=money(r.net12);
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Tuition",money(v.tuition))+row("Value of study time (hours x hourly)",money(v.lhours*v.lhourly))+row("Total investment",money(r.inv))+row("Expected monthly gain (raise x probability)",money(r.ben)+"/mo")+row("Payback time",isFinite(r.pay)?num(r.pay)+" months":"no finite payback")+row("Net after 12 months",money(r.net12))+row("Net after 24 months",money(r.net24));
  $("bars").innerHTML=barRow("Total investment",money(r.inv),r.inv,Math.max(r.inv,r.ben*12,1),"newbad")+barRow("Expected gain, 12 months",money(r.ben*12),r.ben*12,Math.max(r.inv,r.ben*12,1),"new");
  $("cumRows").innerHTML=row("After 6 months",money(r.ben*6-r.inv))+row("After 12 months",money(r.ben*12-r.inv))+row("After 18 months",money(r.ben*18-r.inv))+row("After 24 months",money(r.ben*24-r.inv));
  const vd=$("verdict");
  if(!isFinite(r.pay)){vd.className="verdict bad";$("verdictText").textContent="No finite payback on these inputs: the expected monthly gain is zero, so the "+money(r.inv)+" investment is never repaid by income alone. Learning can still be worthwhile for other reasons, but not on this financial test.";}
  else if(r.pay>24){vd.className="verdict warn";$("verdictText").textContent="Slow payback: "+num(r.pay)+" months to repay "+money(r.inv)+" at "+money(r.ben)+" per month. That is a long time for an income gain to stay unchanged — weigh it against cheaper or shorter routes to the same skill.";}
  else{vd.className="verdict";$("verdictText").textContent="Payback in "+num(r.pay)+" months on these assumptions: "+money(r.inv)+" invested, repaid at "+money(r.ben)+" per month (a "+money(v.raise)+" gain at "+num(v.prob)+"% probability). The probability input is doing heavy lifting — test the payback at a lower probability before committing.";}
  window.__summary="Learning ROI: payback "+(isFinite(r.pay)?num(r.pay)+" months":"none")+" (investment "+money(r.inv)+", expected gain "+money(r.ben)+"/mo).";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
