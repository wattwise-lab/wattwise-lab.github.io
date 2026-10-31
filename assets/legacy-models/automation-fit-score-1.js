(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){const rp=4*Math.min(10,Math.max(0,v.rules));const dp=3*Math.min(10,Math.max(0,v.digital));const vol=Math.min(30,v.freq*v.mins2/600*3);const rd=2*Math.min(10,Math.max(0,v.risk));const raw=rp+dp+vol-rd;const s=Math.max(0,Math.min(100,raw));return {rp:rp,dp:dp,vol:vol,rd:rd,raw:raw,score:s,monthlyMins:v.freq*v.mins2};}
function render(){
  const v=get();
  if(!(v.freq>=0&&v.mins2>=0&&v.rules>=0&&v.rules<=10&&v.digital>=0&&v.digital<=10&&v.risk>=0&&v.risk<=10)){
    $("result").textContent="—";$("chipA").textContent="—";$("chipB").textContent="—";$("chipC").textContent="—";
    $("breakRows").innerHTML="";$("bars").innerHTML="";$("cumRows").innerHTML="";
    const vd=$("verdict");vd.className="verdict warn";
    $("verdictText").textContent="Enter runs and minutes at zero or above, and rule clarity, digitisation, and risk each between 0 and 10, to see the score.";window.__summary="";return;
  }
  const r=calc(v);
  $("result").textContent=num(r.score)+" / 100";
  $("chipA").textContent=num(r.rp)+" pts";$("chipB").textContent=num(r.vol)+" pts";$("chipC").textContent="\u2212"+num(r.rd)+" pts";
  const row=(l,val)=>"<tr><td>"+l+"</td><td class='num'>"+val+"</td></tr>";
  $("breakRows").innerHTML=row("Rule clarity (4 x score)",num(r.rp)+" pts")+row("Digitisation (3 x score)",num(r.dp)+" pts")+row("Volume points (capped at 30)",num(r.vol)+" pts")+row("Risk deduction (2 x score)","\u2212"+num(r.rd)+" pts")+row("Raw total",num(r.raw)+" pts")+row("Final score (clamped 0-100)",num(r.score)+" / 100")+row("Time spent per month",num(r.monthlyMins)+" minutes");
  $("bars").innerHTML=barRow("Rule clarity",num(r.rp)+" pts",r.rp,40,"")+barRow("Digitisation",num(r.dp)+" pts",r.dp,40,"")+barRow("Volume",num(r.vol)+" pts",r.vol,40,"new")+barRow("Risk deduction",num(r.rd)+" pts",r.rd,40,"newbad");
  $("cumRows").innerHTML=row("If rule clarity were 10",num(Math.max(0,Math.min(100,40+r.dp+r.vol-r.rd)))+" / 100")+row("If digitisation were 10",num(Math.max(0,Math.min(100,r.rp+30+r.vol-r.rd)))+" / 100")+row("If risk were 0",num(Math.max(0,Math.min(100,r.rp+r.dp+r.vol)))+" / 100")+row("If volume doubled",num(Math.max(0,Math.min(100,r.rp+r.dp+Math.min(30,v.freq*2*v.mins2/600*3)-r.rd)))+" / 100");
  const vd=$("verdict");
  if(r.score>=70){vd.className="verdict";$("verdictText").textContent="Strong candidate on this checklist: "+num(r.score)+" / 100. High rule clarity and digitisation with manageable risk is the usual shape of a good first automation — still pilot it on a small slice before full rollout.";}
  else if(r.score>=40){vd.className="verdict warn";$("verdictText").textContent="Mixed case: "+num(r.score)+" / 100. The checklist says review before automating — the weakest component in the breakdown above is the place to improve first, or the reason to keep a human in the loop.";}
  else{vd.className="verdict bad";$("verdictText").textContent="Weak fit on this checklist: "+num(r.score)+" / 100. Low clarity or digitisation, or high risk, drags the score down. Automating now would likely mean encoding unclear rules or handling frequent exceptions — clarify the process first.";}
  window.__summary="Automation fit score: "+num(r.score)+"/100 (rules "+num(r.rp)+" + digitisation "+num(r.dp)+" + volume "+num(r.vol)+" - risk "+num(r.rd)+").";
}
function barRow(l,disp,val,maxV,cls){const p=maxV>0?Math.max(0,Math.min(100,val/maxV*100)):0;return "<div class='bar-row'><label><span>"+l+"</span><span>"+disp+"</span></label><div class='bar'><i class='"+cls+"' style='width:"+p+"%'></i></div></div>";}



document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
