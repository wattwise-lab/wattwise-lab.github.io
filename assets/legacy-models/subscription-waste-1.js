(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function balAfter(P,r,n,paid){return P*Math.pow(1+r,paid)-pmt(P,r,n)*((Math.pow(1+r,paid)-1)/r);}

const INVALID_MSG='Enter monthly fee, uses per month, alternative price and idle months at zero or above, to see the estimated waste.';
function calc(v){
 if(!(v.fee>=0&&v.uses>=0&&v.alt>=0&&v.idle>=0)) return null;
 const annual=v.fee*12, val=v.uses*12*v.alt, base=Math.max(annual-val,0), idle=v.idle*v.fee, total=base+idle;
 return {big:money(total),
  chips:[["Annual fee",money(annual)],["Value received",money(val)],["Idle penalty",money(idle)]],
  rows:[["Annual fee",money(annual)],["Value received",money(val)],["Base waste",money(base)],["Idle-month penalty",money(idle)],["Estimated annual waste",money(total)]],
  bars:[["Value received",val,money(val)],["Total waste",total,money(total)]],
  cum:[0,1,2,4,8].map(function(u){return [num(u)+" use"+(u!==1?"s":"")+" / month",money(Math.max(annual-u*12*v.alt,0)+idle)];}),
  vclass:total===0?"":(total>annual/2?"warn":""),
  verdict:total===0?"No waste on these inputs: the value of your uses covers the annual fee and there are no idle months.":("Estimated annual waste is "+money(total)+" on an annual fee of "+money(annual)+": "+money(base)+" base waste plus "+money(idle)+" idle-month penalty. Note the idle term may overlap with the annual comparison — see Scope and limitations."),
  summary:"Subscription waste: annual fee "+money(annual)+", value received "+money(val)+", base waste "+money(base)+", idle penalty "+money(idle)+", total "+money(total)+"."};}

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
