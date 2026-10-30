(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const cash=v.odays*(v.transport+v.food);const time=v.odays*v.omins/60*v.ohourly;const total=cash+time;return {cash:cash,time:time,total:total,perDay:v.odays>0?total/v.odays:0};}
function render(){
  const v=get();
  if(!(v.odays>=0&&v.transport>=0&&v.food>=0&&v.omins>=0&&v.ohourly>=0)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter office days, transport, food, minutes, and hourly value at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=money(r.total);
  $("chipA").textContent=money(r.cash);$("chipB").textContent=money(r.time);$("chipC").textContent=money(r.perDay)+"/day";
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Transport",money(v.odays*v.transport))+row("Extra food",money(v.odays*v.food))+row("Cash cost",money(r.cash))+row("Commute time (hours)",num(v.odays*v.omins/60)+" hrs")+row("Time value",money(r.time))+row("Total monthly cost",money(r.total))+row("Cost per office day",money(r.perDay));
  $("bars").innerHTML=barRow("Transport",money(v.odays*v.transport),v.odays*v.transport,Math.max(v.odays*v.transport,v.odays*v.food,r.time,1),"")+barRow("Extra food",money(v.odays*v.food),v.odays*v.food,Math.max(v.odays*v.transport,v.odays*v.food,r.time,1),"")+barRow("Time value",money(r.time),r.time,Math.max(v.odays*v.transport,v.odays*v.food,r.time,1),"new");
  $("cumRows").innerHTML=row("4 office days",money(4*(v.transport+v.food+v.omins/60*v.ohourly)))+row("8 office days",money(8*(v.transport+v.food+v.omins/60*v.ohourly)))+row("12 office days",money(12*(v.transport+v.food+v.omins/60*v.ohourly)))+row("20 office days",money(20*(v.transport+v.food+v.omins/60*v.ohourly)));
  const vd=$("verdict");
  if(r.total<=0){vd.className="verdict";$("verdictText").textContent="Zero on these inputs: office days, costs, or time value are zero, so the estimated cost is zero.";}
  else if(r.time>r.cash){vd.className="verdict warn";$("verdictText").textContent="Time dominates this cost: "+money(r.time)+" of time value against "+money(r.cash)+" cash. The cash outlay is the smaller half — the real cost of office days here is the "+num(v.odays*v.omins/60)+" commute hours, so shortening the commute matters more than trimming lunch.";}
  else{vd.className="verdict";$("verdictText").textContent="On your inputs, office days cost "+money(r.total)+" per month: "+money(r.cash)+" cash plus "+money(r.time)+" of commute time value, or "+money(r.perDay)+" per office day. Enter costs after any reimbursement for the cash half to be accurate.";}
  window.__summary="Return to office cost: "+money(r.total)+"/month (cash "+money(r.cash)+" + time "+money(r.time)+") over "+num(v.odays)+" office days.";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
