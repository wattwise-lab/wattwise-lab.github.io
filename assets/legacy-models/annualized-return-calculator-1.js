(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function simPayoff(bal,rate,pay){let m=0, intr=0; while(bal>0.005 && m<1200){const i=bal*rate/12; intr+=i; const p=Math.min(pay,bal+i); bal=bal+i-p; m++;} return {months:m,interest:intr,paidOff:bal<=0.005};}
function compute(v){
  if(!(v.init>0) || !(v.years>0) || v.fin<0) return {invalid:true, message:"Enter an initial value and a number of years above zero, and a final value at zero or above."};
  const cagr=Math.pow(v.fin/v.init,1/v.years)-1, gain=v.fin-v.init, tot=gain/v.init;
  const rows=[]; const whole=Math.abs(v.years-Math.round(v.years))<1e-9;
  if(whole){for(let t=0;t<=v.years;t++) rows.push(["Year "+t, money(v.init*Math.pow(1+cagr,t))]);}
  else rows.push(["Start",money(v.init)],["After "+num(v.years)+" years",money(v.fin)]);
  const mx=Math.max(v.init,v.fin,1);
  const verdict=cagr>0?"Positive growth: "+pct(cagr)+" a year turns "+money(v.init)+" into "+money(v.fin)+" over "+num(v.years)+" years, a total gain of "+money(gain)+".":cagr<0?"Negative growth: the value fell at "+pct(-cagr)+" a year on a smoothed basis, losing "+money(-gain)+" in total.":"No change: the value is flat over the period.";
  return {main:pct(cagr), chips:[money(gain), pct(tot), num(v.years)+" yrs"], verdict, vclass:cagr<0?"bad":cagr===0?"warn":"", cells:{cGain:money(gain), cTot:pct(tot), cEnd:money(v.fin)}, bars:[{bar:"barA", val:"barAVal", pct:v.init/mx*100, text:money(v.init)},{bar:"barB", val:"barBVal", pct:v.fin/mx*100, text:money(v.fin)}], rows:{pathRows:rows}, summary:"Annualized return "+pct(cagr)+": "+money(v.init)+" to "+money(v.fin)+" over "+num(v.years)+" years (gain "+money(gain)+")."};
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
