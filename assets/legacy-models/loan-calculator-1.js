(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function compute(v){
  let raw;try{raw=CMCoreFinance.loan(v);}catch(error){return{invalid:true,message:error.message.split('|')[0]};}
  const r=v.rate/1200,n=raw.months,pay=raw.pay,totInt=raw.interest,tot=raw.total,base=raw.base,withEx=raw.extra,saved=base.interest-withEx.interest;
  const rows=[]; let bal=v.prin;
  const marks=[1,5,10,20,30].filter(y=>y<=v.term);
  const cum={}; let ci=0, cp=0;
  for(let y=1;y<=v.term;y++){for(let mo=0;mo<12;mo++){const i=bal*r; ci+=i; const pr=Math.min(pay-i,bal); cp+=pr; bal-=pr; if(bal<0) bal=0;} if(marks.indexOf(y)>=0) cum[y]=[money(ci),money(cp),money(bal)];}
  marks.forEach(y=>rows.push(["Year "+y, cum[y][0], cum[y][1], cum[y][2]]));
  const mx=Math.max(tot,1);
  const verdict=v.extra>0?"With "+money(v.extra)+" extra a month you finish in "+withEx.months+" months instead of "+base.months+", saving "+money(saved)+" in interest.":"Scheduled payment "+money(pay)+" over "+num(v.term)+" years costs "+money(totInt)+" in interest. Add an extra payment above to see the saving.";
  return {main:money(pay), chips:[money(totInt), money(tot), withEx.months+" months with extra"], verdict, cells:{cPay:money(pay), cInt:money(totInt), cTot:money(tot), cSave:money(saved)}, bars:[{bar:"barA", val:"barAVal", pct:v.prin/mx*100, text:money(v.prin)},{bar:"barB", val:"barBVal", pct:totInt/mx*100, text:money(totInt)}], rows:{pathRows:rows}, summary:"Loan "+money(v.prin)+" at "+num(v.rate)+"% for "+num(v.term)+" years: "+money(pay)+"/mo, interest "+money(totInt)+", total "+money(tot)+"."};
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
