(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function simPayoff(bal,rate,pay){let m=0, intr=0; while(bal>0.005 && m<1200){const i=bal*rate/12; intr+=i; const p=Math.min(pay,bal+i); bal=bal+i-p; m++;} return {months:m,interest:intr,paidOff:bal<=0.005};}
function compute(v){
  if(v.cash<0 || v.expense<0 || v.income<0 || v.buffer<0 || v.buffer>100) return {invalid:true, message:"Enter cash, expenses, and income at zero or above, and a buffer between 0% and 100%."};
  const gap=v.expense-v.income, usable=v.cash*(1-v.buffer/100), kept=v.cash-usable;
  if(gap<=0) return {invalid:true, message:"Emergency income of "+money(v.income)+" covers monthly expenses of "+money(v.expense)+", so cash is not being drained and the runway is not limited by cash on these figures."};
  const months=usable/gap;
  const rows=[0,10,20,30].map(b=>{const u=v.cash*(1-b/100); return [b+"%", money(u), num(u/gap)+" months"];});
  const mx=Math.max(v.cash,1);
  return {main:num(months)+" months", chips:[money(usable), money(gap)+"/mo", money(kept)], verdict:"Usable cash "+money(usable)+" covers a monthly shortfall of "+money(gap)+" for "+num(months)+" months. The "+money(kept)+" buffer stays untouched.", cells:{cUse:money(usable), cGap:money(gap), cBuf:money(kept), cCash:money(v.cash)}, bars:[{bar:"barA", val:"barAVal", pct:usable/mx*100, text:money(usable)},{bar:"barB", val:"barBVal", pct:kept/mx*100, text:money(kept)}], rows:{pathRows:rows}, summary:"Emergency runway: "+num(months)+" months from "+money(usable)+" usable cash against a "+money(gap)+"/mo shortfall (buffer "+num(v.buffer)+"% of "+money(v.cash)+")."};
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
