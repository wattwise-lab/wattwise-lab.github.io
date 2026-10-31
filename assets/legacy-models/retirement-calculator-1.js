(()=>{'use strict';

const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const pct=n=>(Number(n)*100).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2})+"%";
const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function pmt(P,r,n){return r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);}
function simPayoff(bal,rate,pay){let m=0, intr=0; while(bal>0.005 && m<1200){const i=bal*rate/12; intr+=i; const p=Math.min(pay,bal+i); bal=bal+i-p; m++;} return {months:m,interest:intr,paidOff:bal<=0.005};}
function compute(v){
  if(!(v.retage>v.age) || v.age<0 || v.current<0 || v.contrib<0 || v.rate<0) return {invalid:true, message:"Enter a retirement age above the current age, with current amount, contribution, and rate at zero or above."};
  const r=v.rate/100/12, n=Math.round((v.retage-v.age)*12);
  const fC=v.current*Math.pow(1+r,n);
  const fContrib=r===0?v.contrib*n:v.contrib*(Math.pow(1+r,n)-1)/r;
  const tot=fC+fContrib, paid=v.contrib*n, growth=tot-v.current-paid;
  const rows=[]; for(let a=v.age+5;a<=v.retage;a+=5){const nn=(a-v.age)*12; const bal=v.current*Math.pow(1+r,nn)+(r===0?v.contrib*nn:v.contrib*(Math.pow(1+r,nn)-1)/r); rows.push(["Age "+a, money(bal)]);}
  if((v.retage-v.age)%5!==0) rows.push(["Age "+v.retage, money(tot)]);
  const mx=Math.max(tot,1);
  return {main:money(tot), chips:[(v.retage-v.age)+" years", money(paid), money(growth)], verdict:"Over "+(v.retage-v.age)+" years, "+money(v.current)+" grows to "+money(fC)+" and "+money(v.contrib)+" a month grows to "+money(fContrib)+", for "+money(tot)+" at retirement.", cells:{cCur:money(fC), cCont:money(fContrib), cPaid:money(paid), cTot:money(tot)}, bars:[{bar:"barA", val:"barAVal", pct:fC/mx*100, text:money(fC)},{bar:"barB", val:"barBVal", pct:fContrib/mx*100, text:money(fContrib)},{bar:"barC", val:"barCVal", pct:paid/mx*100, text:money(paid)}], rows:{pathRows:rows}, summary:"Retirement projection: age "+v.age+" to "+v.retage+", "+money(v.current)+" plus "+money(v.contrib)+"/mo at "+num(v.rate)+"%: "+money(tot)+" at retirement."};
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
