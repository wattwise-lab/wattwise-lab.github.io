(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function balAfter(P,r,n,paid){return P*Math.pow(1+r,paid)-pmt(P,r,n)*((Math.pow(1+r,paid)-1)/r);}

const INVALID_MSG='Enter monthly storage fee, weekly search minutes, hourly value and cleanup hours at zero or above, to see the annual cost.';
function calc(v){
 if(!(v.storage>=0&&v.mins>=0&&v.hourly>=0&&v.cleanup>=0)) return null;
 const st=v.storage*12, sh=v.mins/60*52, sc=sh*v.hourly, total=st+sc, mo=total/12, cv=v.cleanup*v.hourly, pb=mo>0?cv/mo:0;
 return {big:money(total),
  chips:[["Storage per year",money(st)],["Search hours / year",num(sh)+" hrs"],["Monthly average",money(mo)]],
  rows:[["Storage fees per year",money(st)],["Search time per year",num(sh)+" hours"],["Search-time value",money(sc)],["Annual clutter cost",money(total)],["Monthly average",money(mo)],["Cleanup time value",money(cv)],["Cleanup payback",num(pb)+" months"]],
  bars:[["Storage fees",st,money(st)],["Search-time value",sc,money(sc)]],
  cum:[15,30,45,60,90].map(function(m){return [num(m)+" min / week",money(st+m/60*52*v.hourly)];}),
  vclass:"",
  verdict:"Annual clutter cost is "+money(total)+": "+money(st)+" storage fees plus "+money(sc)+" of search time ("+num(sh)+" hours a year at "+money(v.hourly)+" per hour). A "+num(v.cleanup)+"-hour cleanup valued at "+money(cv)+" would pay back in "+num(pb)+" months if it recovered the full monthly average — which it may not.",
  summary:"Digital clutter: storage "+money(st)+", search "+num(sh)+" hrs valued at "+money(sc)+", total "+money(total)+", cleanup payback "+num(pb)+" months."};}

function render(){
  const v=get(); const c=calc(v);
  if(!c){
    $("result").textContent="—"; $("chips").innerHTML=""; $("compRows").innerHTML=""; $("bars").innerHTML=""; $("cumRows").innerHTML="";
    const vd=$("verdict"); vd.className="verdict warn"; $("verdictText").textContent=INVALID_MSG; window.__summary=""; return;
  }
  $("result").textContent=c.big;
  $("chips").innerHTML=c.chips.map(ch=>'<span class="chip">'+ch[0]+': <strong>'+ch[1]+'</strong></span>').join("");
  $("compRows").innerHTML=c.rows.map(r=>"<tr><td>"+r[0]+"</td><td class='num'>"+r[1]+"</td></tr>").join("");
  const mx=Math.max.apply(null,c.bars.map(b=>b[1]).concat([1]));
  $("bars").innerHTML=c.bars.map(b=>'<div class="bar-row"><label><span>'+b[0]+'</span><span>'+b[2]+'</span></label><div class="bar"><i style="width:'+(b[1]/mx*100)+'%">'+'</i></div></div>').join("");
  $("cumRows").innerHTML=c.cum.map(r=>"<tr><td>"+r[0]+"</td><td class='num'>"+r[1]+"</td></tr>").join("");
  const vd=$("verdict"); vd.className="verdict"+(c.vclass?" "+c.vclass:""); $("verdictText").textContent=c.verdict;
  window.__summary=c.summary;
}


document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
