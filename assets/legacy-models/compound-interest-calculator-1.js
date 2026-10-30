(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function simPayoff(bal,rate,pay){let m=0, intr=0; while(bal>0.005 && m<1200){const i=bal*rate/12; intr+=i; const p=Math.min(pay,bal+i); bal=bal+i-p; m++;} return {months:m,interest:intr,paidOff:bal<=0.005};}
function compute(v){
  if(v.prin<0 || v.contrib<0 || v.rate<0 || !(v.years>0)) return {invalid:true, message:"Enter principal, contribution, and rate at zero or above, and years above zero."};
  const r=v.rate/100/12, n=Math.round(v.years*12);
  const fP=v.prin*Math.pow(1+r,n);
  const fC=r===0?v.contrib*n:v.contrib*(Math.pow(1+r,n)-1)/r;
  const fv=fP+fC, paid=v.contrib*n, intr=fv-v.prin-paid;
  const rows=[]; for(let y=1;y<=v.years;y++){const nn=y*12; const bal=v.prin*Math.pow(1+r,nn)+(r===0?v.contrib*nn:v.contrib*(Math.pow(1+r,nn)-1)/r); rows.push(["Year "+y, money(bal)]);}
  const mx=Math.max(fv,1);
  return {main:money(fv), chips:[money(v.prin+paid), money(intr), num(v.years)+" yrs"], verdict:"On these assumptions, "+money(v.prin+paid)+" put in becomes "+money(fv)+", with "+money(intr)+" from interest. Contributions do most of the early work; interest takes over as the balance grows.", cells:{cPrin:money(v.prin), cCont:money(paid), cInt:money(intr), cTot:money(fv)}, bars:[{bar:"barA", val:"barAVal", pct:v.prin/mx*100, text:money(v.prin)},{bar:"barB", val:"barBVal", pct:paid/mx*100, text:money(paid)},{bar:"barC", val:"barCVal", pct:Math.max(intr,0)/mx*100, text:money(intr)}], rows:{pathRows:rows}, summary:"Compound growth: "+money(fv)+" after "+num(v.years)+" years from "+money(v.prin)+" plus "+money(v.contrib)+"/mo at "+num(v.rate)+"%; interest "+money(intr)+"."};
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
