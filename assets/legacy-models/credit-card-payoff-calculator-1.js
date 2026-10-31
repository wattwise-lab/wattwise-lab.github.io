(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function simPayoff(bal,rate,pay){let m=0, intr=0; while(bal>0.005 && m<1200){const i=bal*rate/12; intr+=i; const p=Math.min(pay,bal+i); bal=bal+i-p; m++;} return {months:m,interest:intr,paidOff:bal<=0.005};}
function compute(v){
  if(!(v.bal>0) || v.rate<0 || !(v.pay>0)) return {invalid:true, message:"Enter a balance and a monthly payment above zero, and a rate at zero or above."};
  const firstInt=v.bal*v.rate/100/12;
  const res=simPayoff(v.bal,v.rate/100,v.pay);
  if(!res.paidOff) return {invalid:true, message:"The payment of "+money(v.pay)+" does not cover the first month's interest of "+money(firstInt)+", so the balance grows and the card never pays off at this payment. Raise the payment above that interest figure."};
  const tot=v.bal+res.interest;
  const rows=[]; let bal=v.bal; let y=0;
  while(bal>0.005 && y<10){for(let mo=0;mo<12 && bal>0.005;mo++){const i=bal*v.rate/100/12; bal=bal+i-Math.min(v.pay,bal+i);} y++; rows.push(["Year "+y, money(Math.max(bal,0))]); if(bal<=0.005) break;}
  const mx=Math.max(tot,1);
  return {main:res.months+" months", chips:[money(res.interest), money(tot), money(firstInt)], verdict:"At "+money(v.pay)+" a month, the $"+num(v.bal)+" balance takes "+res.months+" months and costs "+money(res.interest)+" in interest, for "+money(tot)+" total. Paying more each month cuts both figures.", cells:{cMonths:res.months+" months", cInt:money(res.interest), cTot:money(tot)}, bars:[{bar:"barA", val:"barAVal", pct:v.bal/mx*100, text:money(v.bal)},{bar:"barB", val:"barBVal", pct:res.interest/mx*100, text:money(res.interest)}], rows:{pathRows:rows}, summary:"Credit card payoff: "+money(v.bal)+" at "+num(v.rate)+"% APR, "+money(v.pay)+"/mo: "+res.months+" months, interest "+money(res.interest)+", total "+money(tot)+"."};
}

if(typeof document!=="undefined"){
const $=id=>document.getElementById(id);
function get(){const v={};document.querySelectorAll("input").forEach(e=>{v[e.id]=parseFloat(e.value)||0});return v;}
function render(){
  const v=get(); const r=compute(v);
  const set=(id,txt)=>{const el=$(id); if(el) el.textContent=txt;};
  if(r.invalid){
    ["main","chip1","chip2","chip3"].forEach(id=>set(id,"—"));
    document.querySelectorAll("[data-cell]").forEach(el=>el.textContent="—");
    document.querySelectorAll("tbody[data-rows]").forEach(tb=>tb.innerHTML="");
    document.querySelectorAll(".bar i").forEach(b=>b.style.width="0%");
    document.querySelectorAll("[data-barval]").forEach(el=>el.textContent="—");
    const vd=$("verdict"); if(vd){vd.className="verdict warn"; $("verdictText").textContent=r.message;}
    window.__summary="";
    return;
  }
  set("main",r.main);
  (r.chips||[]).forEach((c,i)=>set("chip"+(i+1),c));
  const vd=$("verdict"); if(vd){vd.className="verdict"+(r.vclass?" "+r.vclass:""); $("verdictText").textContent=r.verdict;}
  Object.entries(r.cells||{}).forEach(([id,txt])=>set(id,txt));
  (r.bars||[]).forEach(b=>{const el=$(b.bar); if(el) el.style.width=b.pct+"%"; set(b.val,b.text);});
  Object.entries(r.rows||{}).forEach(([tb,rows])=>{const el=$(tb); if(el) el.innerHTML=rows.map(row=>"<tr>"+row.map((c,i)=>"<td"+(i>0?" class='num'":"")+">"+c+"</td>").join("")+"</tr>").join("");});
  window.__summary=r.summary||"";
}


document.querySelectorAll("input").forEach(e=>e.addEventListener("input",render));render();
}


})();
