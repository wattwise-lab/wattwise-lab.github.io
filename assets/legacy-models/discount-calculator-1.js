(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function calc(v){
  if(!(v.price>0)||v.disc<0||v.disc>100||v.extra<0) return {valid:false};
  const fin=Math.max(0, v.price*(1-v.disc/100)-v.extra), saved=v.price-fin, spct=saved/v.price*100;
  const scen=[0,20,50].map(d=>[num(d)+"%", money(Math.max(0, v.price*(1-d/100)-v.extra))]);
  return {valid:true, big:money(fin), chips:{chipSave:money(saved), chipPct:pct(spct)},
   rows:[["Original price",money(v.price)],["After percentage discount",money(v.price*(1-v.disc/100))],["Extra fixed discount",money(v.extra)],["Final price",money(fin)],["Amount saved",money(saved)],["Effective saving",pct(spct)]],
   scen:scen, barA:fin, barB:saved, barAText:money(fin), barBText:money(saved), barBBad:false,
   vclass:spct>=50?"warn":"", vtext:spct>=50?("Deep discount: you save "+money(saved)+" ("+pct(spct)+"), paying "+money(fin)+" of the original "+money(v.price)+". Check margin before offering this."):("You pay "+money(fin)+" instead of "+money(v.price)+", saving "+money(saved)+" ("+pct(spct)+")."),
   summary:"Final price "+money(fin)+" (saved "+money(saved)+" / "+pct(spct)+", original "+money(v.price)+", discount "+num(v.disc)+"%, extra "+money(v.extra)+")."};
}
function render(){
  const v=get(); const r=calc(v);
  if(!r.valid){
    $("result").textContent="—";
    $("chipSave").textContent="—";
    $("chipPct").textContent="—";
    $("tblRows").innerHTML=""; $("scenRows").innerHTML="";
    $("barA").style.width="0%"; $("barB").style.width="0%"; $("barAVal").textContent="—"; $("barBVal").textContent="—";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter an original price above zero, a discount between 0% and 100%, and an extra discount at zero or above.";
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
