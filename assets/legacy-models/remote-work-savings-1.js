(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const cash=v.rdays*v.commute-v.home;const time=v.rdays*v.cmins/60*v.chourly;const total=cash+time;return {cash:cash,time:time,total:total,perDay:v.rdays>0?total/v.rdays:0};}
function render(){
  const v=get();
  if(!(v.commute>=0&&v.cmins>=0&&v.chourly>=0&&v.rdays>=0&&v.home>=0)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter commute spending, minutes, hourly value, remote days, and home costs at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=money(r.total);
  $("chipA").textContent=money(r.cash);$("chipB").textContent=money(r.time);$("chipC").textContent=money(r.perDay)+"/day";
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Commute spending saved",money(v.rdays*v.commute))+row("Extra home costs",money(v.home))+row("Cash saving",money(r.cash))+row("Recovered time (hours)",num(v.rdays*v.cmins/60)+" hrs")+row("Time value",money(r.time))+row("Total monthly value",money(r.total))+row("Total per remote day",money(r.perDay));
  $("bars").innerHTML=barRow("Cash saving",money(r.cash),Math.max(r.cash,0),Math.max(r.cash,r.time,1),"")+barRow("Time value",money(r.time),r.time,Math.max(r.cash,r.time,1),"new");
  $("cumRows").innerHTML=row("4 remote days",money(4*(v.commute+v.cmins/60*v.chourly)-v.home))+row("8 remote days",money(8*(v.commute+v.cmins/60*v.chourly)-v.home))+row("12 remote days",money(12*(v.commute+v.cmins/60*v.chourly)-v.home))+row("20 remote days",money(20*(v.commute+v.cmins/60*v.chourly)-v.home));
  const vd=$("verdict");
  if(r.total<0){vd.className="verdict bad";$("verdictText").textContent="Negative on these inputs: extra home costs of "+money(v.home)+" exceed the remote-day value. Check the home-cost figure — it is monthly, while the savings scale with remote days, so few remote days with high home costs can go negative.";}
  else if(r.cash<0){vd.className="verdict warn";$("verdictText").textContent="Cash-negative but time-positive: cash saving is "+money(r.cash)+" (home costs exceed commute spending saved), while recovered time is worth "+money(r.time)+", for a total of "+money(r.total)+". Whether that trade is worth it depends on whether the recovered time is genuinely usable.";}
  else{vd.className="verdict";$("verdictText").textContent="Positive on both halves: "+money(r.cash)+" cash saving plus "+money(r.time)+" of recovered time value, "+money(r.total)+" per month across "+num(v.rdays)+" remote days. Set hourly value to zero for a cash-only comparison.";}
  window.__summary="Remote work savings: "+money(r.total)+"/month (cash "+money(r.cash)+" + time "+money(r.time)+") over "+num(v.rdays)+" remote days.";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
