(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function compute(v){
  let raw;try{raw=CMCoreFinance.early(v);}catch(error){return{invalid:true,message:error.message.split('|')[0]};}
  const base=raw.base,ex=raw.extra,saved=raw.saved,monthsSaved=raw.monthsSaved;
  const mx=Math.max(base.interest,ex.interest,1);
  return {main:monthsSaved+" months", chips:[base.months+" months", ex.months+" months", money(saved)], verdict:"Extra payments of "+money(v.extra)+" a month finish the loan "+monthsSaved+" months sooner ("+ex.months+" instead of "+base.months+" months) and save "+money(saved)+" in interest.", cells:{cBaseM:base.months+" months", cBaseI:money(base.interest), cExM:ex.months+" months", cExI:money(ex.interest), cSave:money(saved)}, bars:[{bar:"barA", val:"barAVal", pct:base.interest/mx*100, text:money(base.interest)},{bar:"barB", val:"barBVal", pct:ex.interest/mx*100, text:money(ex.interest)}], rows:{pathRows:[["Without extra", base.months+" months", money(base.interest)],["With "+money(v.extra)+" extra", ex.months+" months", money(ex.interest)]]}, summary:"Early payoff: "+base.months+" months / "+money(base.interest)+" interest without extra; "+ex.months+" months / "+money(ex.interest)+" with "+money(v.extra)+" extra (saves "+monthsSaved+" months, "+money(saved)+")."};
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
