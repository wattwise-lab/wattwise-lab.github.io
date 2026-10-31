(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function balAfter(P,r,n,paid){return P*Math.pow(1+r,paid)-pmt(P,r,n)*((Math.pow(1+r,paid)-1)/r);}

const INVALID_MSG='Enter area, coats and coverage above zero, with a waste allowance at zero or above, to see the paint required.';
function calc(v){
 if(!(v.area>0&&v.coats>0&&v.cov>0&&v.waste>=0)) return null;
 const per=v.area/v.cov, all=per*v.coats, wv=all*v.waste/100, total=all+wv;
 return {big:num(total)+" L",
  chips:[["Per coat",num(per)+" L"],["Waste",num(wv)+" L"],["All coats",num(all)+" L"]],
  rows:[["Paint per coat (area \u00f7 coverage)",num(per)+" L"],["Paint for all coats",num(all)+" L"],["Waste volume",num(wv)+" L"],["Paint required",num(total)+" L"]],
  bars:[["Paint for coats",all,num(all)+" L"],["Waste",wv,num(wv)+" L"]],
  cum:[1,2,3].map(function(c){return [c+" coat"+(c>1?"s":""),num(per*c*(1+v.waste/100))+" L"];}),
  vclass:v.waste===0?"warn":"",
  verdict:v.waste===0?"Paint required is "+num(total)+" L with no waste allowance. Porous surfaces and application losses usually consume extra paint — consider adding an allowance.":"Paint required is "+num(total)+" L: "+num(all)+" L for "+num(v.coats)+" coats plus "+num(wv)+" L waste at "+num(v.waste)+"%. Check the coverage rate on your paint's data sheet before buying.",
  summary:"Paint: "+num(per)+" L per coat, "+num(all)+" L for "+num(v.coats)+(v.coats===1?" coat, ":" coats, ")+"waste "+num(wv)+" L, total "+num(total)+" L."};}

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
