(()=>{'use strict';
const $=id=>document.getElementById(id);
const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function render(){
 const values={};for(const input of document.querySelectorAll('.hero input,.hero select'))values[input.id]=input.tagName==='SELECT'?input.value:input.value.trim()===''?NaN:Number(input.value);
 let r;try{r=CMCoreFinance.freelance(values);}catch(error){['result','chipBill','chipRev','tNum','tRet','tBill','tRev','tRate'].forEach(id=>{$(id).textContent='—';});$('verdict').className='verdict warn';$('verdictText').textContent=error.message.split('|')[0];window.__summary='';return;}
 $('result').textContent=money(r.rate)+'/hour';$('chipBill').textContent=fmt(r.billHrs)+' hrs';$('chipRev').textContent=money(r.rev);$('tNum').textContent=money(r.num);$('tRet').textContent=window.CMI18n.number(r.ret*100,{minimumFractionDigits:3,maximumFractionDigits:3})+'%';$('tBill').textContent=fmt(r.billHrs)+' hrs';$('tRev').textContent=money(r.rev);$('tRate').textContent=money(r.rate)+'/hour';$('verdict').className='verdict';$('verdictText').textContent='At '+money(r.rate)+'/hour across '+fmt(r.billHrs)+' billable hours, annual revenue of '+money(r.rev)+' covers the entered income target and expenses. The entered tax is applied to '+(r.taxbase==='gross'?'gross revenue':'revenue after the entered expenses')+'. Confirm that this tax basis matches your situation.';window.__summary='Freelance rate '+money(r.rate)+'/hour; '+fmt(r.billHrs)+' billable hours; annual revenue '+money(r.rev)+'.';
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));document.addEventListener("cm:language",render);document.addEventListener("cm:translations",render);render();
})();
