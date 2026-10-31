(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){return CMCoreFinance.ai(v);}

function render(){
  const v=get();
  if(!(Number.isInteger(v.calls2)&&v.calls2>=0&&Number.isInteger(v.itok)&&v.itok>=0&&Number.isInteger(v.otok)&&v.otok>=0&&v.iprice>=0&&v.oprice>=0)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter whole-number call and token counts at zero or above, with nonnegative prices.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=money(r.total);
  $("chipA").textContent=money(r.ic);$("chipB").textContent=money(r.oc);$("chipC").textContent=money(r.perCall);
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Input tokens (monthly)",num(v.calls2*v.itok))+row("Output tokens (monthly)",num(v.calls2*v.otok))+row("Input cost",money(r.ic))+row("Output cost",money(r.oc))+row("Total monthly cost",money(r.total))+row("Cost per call",money(r.perCall))+row("Cost per 1,000 calls",money(r.per1000));
  $("bars").innerHTML=barRow("Input cost",money(r.ic),r.ic,Math.max(r.ic,r.oc,1),"")+barRow("Output cost",money(r.oc),r.oc,Math.max(r.ic,r.oc,1),"new");
  $("cumRows").innerHTML=row("10,000 calls",money(10000*(v.itok*v.iprice+v.otok*v.oprice)/1000000))+row("50,000 calls",money(50000*(v.itok*v.iprice+v.otok*v.oprice)/1000000))+row("100,000 calls",money(100000*(v.itok*v.iprice+v.otok*v.oprice)/1000000))+row("250,000 calls",money(250000*(v.itok*v.iprice+v.otok*v.oprice)/1000000));
  const vd=$("verdict");
  if(r.total<=0){vd.className="verdict";$("verdictText").textContent="No billable usage on these inputs; the monthly estimate is zero.";}
  else if(r.oc>r.ic*2){vd.className="verdict warn";$("verdictText").textContent="Output tokens dominate this bill: "+money(r.oc)+" of "+money(r.total)+" is output cost. If you can shorten outputs or cache repeated content, that is where the saving would come from — check your own token split first.";}
  else{vd.className="verdict";$("verdictText").textContent="On your inputs, this volume costs "+money(r.total)+" per month ("+money(r.perCall)+" per call). The split is "+money(r.ic)+" input and "+money(r.oc)+" output — verify the per-million-token prices against your own plan, since they drive the total directly.";}
  window.__summary="AI inference cost: "+money(r.total)+"/month for "+num(v.calls2)+" calls ("+num(v.itok)+" in / "+num(v.otok)+" out tokens), prices $"+num(v.iprice)+"/$"+num(v.oprice)+" per million tokens.";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));document.addEventListener("cm:language",render);document.addEventListener("cm:translations",render);render();

})();
