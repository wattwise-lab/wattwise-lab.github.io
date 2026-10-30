(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function balAfter(P,r,n,paid){return P*Math.pow(1+r,paid)-pmt(P,r,n)*((Math.pow(1+r,paid)-1)/r);}

const INVALID_MSG='Enter current age at zero or above, expected lifespan above current age, annual cost and reserve at zero or above, and cost growth at zero or above, to see the budget.';
function calc(v){
 if(!(v.age>=0&&v.life>v.age&&v.annual>=0&&v.infl>=0&&v.reserve>=0)) return null;
 const n=v.life-v.age, r=v.infl/100, sub=r===0?v.annual*n:v.annual*((Math.pow(1+r,n)-1)/r), total=sub+v.reserve;
 function cumAt(t){return (r===0?v.annual*t:v.annual*((Math.pow(1+r,t)-1)/r))+v.reserve;}
 return {big:money(total),
  chips:[["Remaining years",num(n)+" years"],["Growth-adjusted costs",money(sub)],["Reserve",money(v.reserve)]],
  rows:[["Current age",num(v.age)+" years"],["Expected lifespan",num(v.life)+" years"],["Remaining years",num(n)+" years"],["Annual cost",money(v.annual)],["Growth-adjusted costs",money(sub)],["Reserve",money(v.reserve)],["Lifetime budget",money(total)]],
  bars:[["Growth-adjusted costs",sub,money(sub)],["Reserve",v.reserve,money(v.reserve)]],
  cum:[1,3,5,10].filter(function(t){return t<=n;}).concat([1,3,5,10].indexOf(n)===-1?[n]:[]).map(function(t){return ["After "+num(t)+" year"+(t>1?"s":""),money(cumAt(t))];}),
  vclass:"",
  verdict:"Lifetime budget is "+money(total)+" for "+num(n)+" remaining years: "+money(sub)+" in growth-adjusted annual costs plus a "+money(v.reserve)+" reserve. Lifespan and cost growth are assumptions — test a shorter lifespan and a higher growth rate before relying on this figure.",
  summary:"Pet lifetime budget: "+num(n)+" remaining years, growth-adjusted costs "+money(sub)+", reserve "+money(v.reserve)+", total "+money(total)+"."};}

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
