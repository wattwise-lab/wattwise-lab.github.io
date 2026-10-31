(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function compute(v){
  let raw;try{raw=CMCoreFinance.mortgage(v);}catch(error){return{invalid:true,message:error.message.split('|')[0]};}
  const loan=raw.loan,ltv=raw.ltv,pi=raw.pi,taxM=raw.tax,insM=raw.insurance,pmiM=raw.pmi,tot=raw.total;
  const mx=Math.max(tot,1);
  const verdict=ltv>0.8?"Loan-to-value is "+pct(ltv)+", so PMI of "+money(pmiM)+" a month applies. Total monthly payment is "+money(tot)+". A larger down payment that brings loan-to-value to 80% would remove PMI in this model.":"Loan-to-value is "+pct(ltv)+", so no PMI applies. Total monthly payment is "+money(tot)+", of which principal & interest is "+money(pi)+".";
  return {main:money(tot), chips:[money(loan), pct(ltv), money(pi)], verdict, vclass:ltv>0.8?"warn":"", cells:{cPI:money(pi), cTax:money(taxM), cIns:money(insM), cPMI:money(pmiM), cHOA:money(v.hoa), cTot:money(tot)}, bars:[{bar:"barA", val:"barAVal", pct:pi/mx*100, text:money(pi)},{bar:"barB", val:"barBVal", pct:(tot-pi)/mx*100, text:money(tot-pi)}], rows:{}, summary:"Mortgage: loan "+money(loan)+" (LTV "+pct(ltv)+") at "+num(v.rate)+"% for "+num(v.term)+" years: total "+money(tot)+"/mo (P&I "+money(pi)+", PMI "+money(pmiM)+")."};
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
