(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(v.bill<0||v.rate<0||!(v.people>=1)) return {valid:false};
  const tip=v.bill*v.rate/100, tot=v.bill+tip, per=tot/v.people, tipPer=tip/v.people;
  const scen=[0,15,20].map(r=>[num(r)+"%", money(v.bill*(1+r/100)/v.people)]);
  return {valid:true, big:money(per), chips:{chipTip:money(tip), chipTotal:money(tot)},
   rows:[["Bill amount",money(v.bill)],["Tip rate",pct(v.rate)],["Tip",money(tip)],["Total bill",money(tot)],["People",num(v.people)],["Tip per person",money(tipPer)],["Total per person",money(per)]],
   scen:scen, barA:v.bill, barB:tip, barAText:money(v.bill), barBText:money(tip), barBBad:false,
   vclass:"", vtext:"Tip "+money(tip)+" on a $"+num(v.bill)+" bill; "+num(v.people)+(v.people===1?" person pays ":" people pay ")+money(per)+" each ("+money(tipPer)+" tip each).",
   summary:"Per person "+money(per)+" (tip "+money(tip)+", total "+money(tot)+", bill "+money(v.bill)+", rate "+pct(v.rate)+", people "+num(v.people)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipTip").textContent="—";
    $("chipTotal").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a bill at zero or above, a tip rate at zero or above, and at least 1 person.";
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
