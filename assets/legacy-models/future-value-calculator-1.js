(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function fv(pv,r,n,t){return pv*Math.pow(1+r/n,n*t);}
function render(){
  const v=get();
  const valid = v.pv>=0 && v.rate>=0 && v.years>0 && v.n>=1;
  if(!valid){
    $("result").textContent="—"; $("chipInt").textContent="—"; $("chipMult").textContent="—";
    $("yearRows").innerHTML="";
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent="Enter a present value and rate at zero or above, years above zero, and at least 1 compounding period per year.";
    return;
  }
  const f=fv(v.pv,v.rate/100,v.n,v.years), earned=f-v.pv;
  $("result").textContent=money(f);
  $("chipInt").textContent=money(earned);
  $("chipMult").textContent=num(f/v.pv)+"×";
  let rh="";
  [1,5,10,20,30].forEach(y=>{ if(y<=v.years){ const val=fv(v.pv,v.rate/100,1,y); rh+="<tr><td>"+y+" year"+(y>1?"s":"")+"</td><td class='num'>"+money(val)+"</td><td class='num'>"+money(val-v.pv)+"</td></tr>"; } });
  if(rh===""){ const val=fv(v.pv,v.rate/100,1,v.years); rh="<tr><td>"+num(v.years)+" years</td><td class='num'>"+money(val)+"</td><td class='num'>"+money(val-v.pv)+"</td></tr>"; }
  $("yearRows").innerHTML=rh;
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Your $"+num(v.pv)+" grows to "+money(f)+" in "+num(v.years)+" years at "+num(v.rate)+"%, earning "+money(earned)+" in interest.";
}

document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();

})();
