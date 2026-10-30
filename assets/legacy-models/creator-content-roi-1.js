(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const orders=v.views*v.conv/100;const rev=orders*v.order;const gp=rev*v.margin/100;const net=gp-v.cost;const roi=v.cost>0?net/v.cost*100:0;return {orders:orders,rev:rev,gp:gp,net:net,roi:roi};}
function render(){
  const v=get();
  if(!(v.cost>0&&v.views>=0&&v.conv>=0&&v.order>=0&&v.margin>=0&&v.margin<=100)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter a production cost above zero, with views, conversion, order value, and margin (0-100) at zero or above, to see the estimate.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=num(r.roi)+"% ROI";
  $("chipA").textContent=num(r.orders);$("chipB").textContent=money(r.gp);$("chipC").textContent=money(r.net);
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Orders (views x conversion)",num(r.orders))+row("Revenue from orders",money(r.rev))+row("Gross profit (margin applied)",money(r.gp))+row("Production cost",money(v.cost))+row("Net profit",money(r.net))+row("ROI",num(r.roi)+"%");
  $("bars").innerHTML=barRow("Production cost",money(v.cost),v.cost,Math.max(v.cost,r.gp,1),"newbad")+barRow("Gross profit",money(r.gp),r.gp,Math.max(v.cost,r.gp,1),"new");
  $("cumRows").innerHTML=row("At 10,000 views",num(((10000*v.conv/100*v.order*v.margin/100)-v.cost)/v.cost*100)+"% ROI")+row("At 25,000 views",num(((25000*v.conv/100*v.order*v.margin/100)-v.cost)/v.cost*100)+"% ROI")+row("At 50,000 views",num(((50000*v.conv/100*v.order*v.margin/100)-v.cost)/v.cost*100)+"% ROI")+row("At 100,000 views",num(((100000*v.conv/100*v.order*v.margin/100)-v.cost)/v.cost*100)+"% ROI");
  const vd=$("verdict");
  if(r.roi<0){vd.className="verdict bad";$("verdictText").textContent="Loss on these assumptions: gross profit "+money(r.gp)+" does not cover the "+money(v.cost)+" production cost, leaving "+money(r.net)+". The piece would need more views, a higher conversion rate, or a lower cost to break even.";}
  else if(r.roi<100){vd.className="verdict warn";$("verdictText").textContent="Positive but modest: "+num(r.roi)+"% ROI, or "+money(r.net)+" net on a "+money(v.cost)+" cost. Check whether the conversion assumption is measured or hoped for — it drives this result more than the view count.";}
  else{vd.className="verdict";$("verdictText").textContent="Strong on these assumptions: "+num(r.orders)+" orders produce "+money(r.gp)+" gross profit against a "+money(v.cost)+" cost, a "+num(r.roi)+"% ROI. Treat the conversion rate as the figure to verify first, since views alone do not create profit.";}
  window.__summary="Creator content ROI: "+num(r.roi)+"% ("+num(r.orders)+" orders, "+money(r.gp)+" gross profit minus "+money(v.cost)+" cost = "+money(r.net)+").";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
