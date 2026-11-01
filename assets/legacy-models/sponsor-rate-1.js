(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const mult=Math.max(0.7,Math.min(1.5,v.eng/4));const cpmVal=v.sviews/1000*v.cpm*mult;const prod=v.hours*v.hourly2;const total=cpmVal+prod;return {mult:mult,cpmVal:cpmVal,prod:prod,total:total,low:total*0.85,high:total*1.20};}
function render(){
  const v=get();
  if(!(v.sviews>=0&&v.cpm>=0&&v.eng>=0&&v.hours>=0&&v.hourly2>=0)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter views, CPM, engagement, hours, and hourly cost at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=money(r.total);
  $("chipA").textContent=money(r.cpmVal);$("chipB").textContent=num(r.mult)+"x";$("chipC").textContent=money(r.prod);
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Expected views",num(v.sviews))+row("CPM entered",money(v.cpm)+" / 1,000 views")+row("Engagement multiplier (engagement / 4, clamped 0.7-1.5)",num(r.mult)+"x")+row("CPM-based value",money(r.cpmVal))+row("Production cost (hours x hourly)",money(r.prod))+row("Estimated sponsor rate",money(r.total))+row("Illustrative range (85%-120%)",money(r.low)+" - "+money(r.high));
  $("bars").innerHTML=barRow("CPM-based value",money(r.cpmVal),r.cpmVal,Math.max(r.cpmVal,r.prod,1),"")+barRow("Production cost",money(r.prod),r.prod,Math.max(r.cpmVal,r.prod,1),"new");
  $("cumRows").innerHTML=row("At 40,000 views",money(40000/1000*v.cpm*Math.max(0.7,Math.min(1.5,v.eng/4))+v.hours*v.hourly2))+row("At 80,000 views",money(80000/1000*v.cpm*Math.max(0.7,Math.min(1.5,v.eng/4))+v.hours*v.hourly2))+row("At 160,000 views",money(160000/1000*v.cpm*Math.max(0.7,Math.min(1.5,v.eng/4))+v.hours*v.hourly2))+row("At 320,000 views",money(320000/1000*v.cpm*Math.max(0.7,Math.min(1.5,v.eng/4))+v.hours*v.hourly2));
  const vd=$("verdict");
  if(r.total<=0){vd.className="verdict";$("verdictText").textContent="Zero on these inputs: views, CPM, or production inputs are zero, so the estimated rate is zero.";}
  else if(r.prod>r.cpmVal){vd.className="verdict warn";$("verdictText").textContent="Production-heavy rate: "+money(r.prod)+" of the "+money(r.total)+" total is production cost, not audience value. That is defensible for labour-intensive work, but a sponsor paying mainly for production time may compare you with cheaper producers — be ready to show the audience value separately.";}
  else{vd.className="verdict";$("verdictText").textContent="On your inputs, the rate is "+money(r.total)+": "+money(r.cpmVal)+" of audience value (engagement multiplier "+num(r.mult)+"x) plus "+money(r.prod)+" of production cost. The 85%-120% range is "+money(r.low)+" to "+money(r.high)+" — a starting point for negotiation, not a market valuation.";}
  window.__summary="Sponsor rate: "+money(r.total)+" (CPM value "+money(r.cpmVal)+" at "+num(r.mult)+"x plus production "+money(r.prod)+").";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
