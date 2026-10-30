(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function render(){
  const v=get();
  const valid = v.bal>0 && v.crem>0 && v.nterm>0 && v.crate>=0 && v.nrate>=0 && v.close>=0 && v.stay>=0;
  if(!valid){
    $("result").textContent="—";
    $("chipSave").textContent="—"; $("chipBe").textContent="—"; $("chipInt").textContent="—";
    ["cOldPmt","cNewPmt","cDiffPmt","cOldInt","cNewInt","cDiffInt","cOldTot","cNewTot","cDiffTot","cOldTerm","cNewTerm","cDiffTerm"].forEach(id=>{$(id).textContent="—";});
    $("barOld").style.width="0%"; $("barNew").style.width="0%"; $("barOldVal").textContent="—"; $("barNewVal").textContent="—";
    $("cumRows").innerHTML="";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a loan balance and loan terms above zero, with rates and costs at zero or above, to see the comparison.";
    window.__summary="";
    return;
  }
  const oldP=pmt(v.bal,v.crate/100/12,v.crem*12), newP=pmt(v.bal,v.nrate/100/12,v.nterm*12);
  const save=oldP-newP, be=save>0?v.close/save:Infinity;
  const oldInt=oldP*v.crem*12-v.bal, newInt=newP*v.nterm*12-v.bal;
  const oldTot=oldP*v.crem*12, newTot=newP*v.nterm*12;
  $("result").textContent=money(newP);
  $("chipSave").textContent=money(save)+"/mo";
  $("chipBe").textContent=isFinite(be)?num(be)+" months":"no saving";
  $("chipInt").textContent=money(oldInt-newInt);
  $("cOldPmt").textContent=money(oldP); $("cNewPmt").textContent=money(newP);
  $("cDiffPmt").innerHTML=save>0?'<span class="pos">Save '+money(save)+'</span>':save<0?'<span class="neg">Pay '+money(-save)+' more</span>':'—';
  $("cOldInt").textContent=money(oldInt); $("cNewInt").textContent=money(newInt);
  $("cDiffInt").innerHTML=oldInt-newInt>0?'<span class="pos">Save '+money(oldInt-newInt)+'</span>':oldInt-newInt<0?'<span class="neg">'+money(newInt-oldInt)+' more</span>':'—';
  $("cOldTot").textContent=money(oldTot); $("cNewTot").textContent=money(newTot);
  $("cDiffTot").innerHTML=oldTot-newTot>0?'<span class="pos">Save '+money(oldTot-newTot)+'</span>':oldTot-newTot<0?'<span class="neg">'+money(newTot-oldTot)+' more</span>':'—';
  $("cOldTerm").textContent=num(v.crem)+" yrs"; $("cNewTerm").textContent=num(v.nterm)+" yrs";
  $("cDiffTerm").textContent=(v.nterm-v.crem>0?"+":"")+num(v.nterm-v.crem)+" yrs";
  const maxInt=Math.max(oldInt,newInt,1);
  $("barOld").style.width=(oldInt/maxInt*100)+"%"; $("barOldVal").textContent=money(oldInt);
  $("barNew").style.width=(newInt/maxInt*100)+"%"; $("barNewVal").textContent=money(newInt);
  $("barNew").className=newInt>oldInt?"newbad":"new";
  const stayM=v.stay*12, capM=Math.min(stayM,v.crem*12,v.nterm*12);
  const rows=[[12,"1 year"],[36,"3 years"],[60,"5 years"],[120,"10 years"]];
  let rh="";
  rows.forEach(r=>{const m=Math.min(r[0],v.crem*12,v.nterm*12);rh+="<tr><td>"+r[1]+"</td><td class='num'>"+money(save*m)+"</td></tr>";});
  if(capM>0&&[12,36,60,120].indexOf(capM)===-1){rh+="<tr><td>Your planned stay ("+num(v.stay)+" yrs)</td><td class='num'>"+money(save*capM)+"</td></tr>";}
  $("cumRows").innerHTML=rh;
  const vd=$("verdict");
  if(save<=0){vd.className="verdict bad";$("verdictText").textContent="No monthly saving at these rates — the new payment is "+money(-save)+" higher. On payment alone, this refinance does not pay off.";}
  else if(isFinite(be)&&be>stayM){vd.className="verdict warn";$("verdictText").textContent="Break-even is "+num(be)+" months, but you plan to move in "+num(v.stay)+" years ("+num(stayM)+" months). You would move before the savings cover the $"+num(v.close)+" closing costs — on payment alone, this refinance may not pay off for you.";}
  else if(newInt>oldInt){vd.className="verdict warn";$("verdictText").textContent="Lower payment, but "+money(newInt-oldInt)+" MORE total interest: the longer new term outweighs the lower rate. Monthly relief costs lifetime interest — weigh that trade before deciding.";}
  else{vd.className="verdict";$("verdictText").textContent="Clear win on these numbers: you break even in "+num(be)+" months, well within your "+num(v.stay)+"-year stay, and save "+money(oldInt-newInt)+" in total interest over the full term.";}
  window.__summary="Refinance comparison: new payment "+money(newP)+" (was "+money(oldP)+"), saving "+money(save)+"/mo, break-even "+(isFinite(be)?num(be)+" months":"n/a")+", total interest "+money(newInt)+" vs "+money(oldInt)+".";
}


document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
