(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.gross>0)||v.taxrate<0||v.social<0||v.other<0) return {valid:false};
  const tax=v.gross*v.taxrate/100, net=v.gross-tax-v.social-v.other, ded=tax+v.social+v.other;
  const scen=[0,15,25].map(r=>[num(r)+"%", money(v.gross-v.gross*r/100-v.social-v.other)]);
  return {valid:true, big:money(net), chips:{chipTax:money(tax), chipYear:money(net*12)},
   rows:[["Gross pay / month",money(v.gross)],["Estimated tax",money(tax)],["Social contributions",money(v.social)],["Other deductions",money(v.other)],["Total deductions",money(ded)],["Net pay / month",money(net)],["Net pay / year",money(net*12)],["Take-home share",pct(v.gross>0?net/v.gross*100:0)]],
   scen:scen, barA:net, barB:ded, barAText:money(net), barBText:money(ded), barBBad:net<0,
   vclass:net<0?"bad":net/v.gross<0.5?"warn":"", vtext:net<0?("Deductions of "+money(ded)+" exceed gross pay of "+money(v.gross)+". Check the rate and deduction amounts."):("Net pay "+money(net)+" per month ("+money(net*12)+" per year) from gross pay of "+money(v.gross)+"; deductions total "+money(ded)+"."),
   summary:"Net pay "+money(net)+"/month ("+money(net*12)+"/year) from gross "+money(v.gross)+", tax "+money(tax)+" at "+pct(v.taxrate)+", social "+money(v.social)+", other "+money(v.other)+"."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipTax").textContent="—";
    $("chipYear").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter gross pay above zero, with the tax rate and deductions at zero or above.";
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
