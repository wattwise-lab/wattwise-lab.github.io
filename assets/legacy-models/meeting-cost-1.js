(()=>{'use strict';
const $=id=>document.getElementById(id);
const money=n=>(typeof window!=='undefined'&&window.CMI18n?window.CMI18n.currency(Number(n),'USD',{maximumFractionDigits:2,minimumFractionDigits:2}):"$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}));
const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
function meetCalc(p,h,m,w,wk){const per=p*h*m/60;return{per:per,week:per*w,annual:per*w*wk,phMeet:p*m/60,phYear:p*m/60*w*wk};}
function render(){
 const p=parseFloat($("people").value),h=parseFloat($("hourly").value),m=parseFloat($("mins").value),w=parseFloat($("weekly").value),wk=parseFloat($("weeks").value);
 if([p,h,m,w,wk].some(v=>isNaN(v)||v<0)){["result","chipMeet","chipWeek","tMeet","tWeek","tAnnual","tPHMeet","tPHYear"].forEach(id=>{$(id).textContent="—";});$("verdict").className="verdict warn";$("verdictText").textContent="Enter values at zero or above for all inputs.";window.__summary="";return;}
 const r=meetCalc(p,h,m,w,wk);
 $("result").textContent=money(r.annual);$("chipMeet").textContent=money(r.per);$("chipWeek").textContent=money(r.week);
 $("tMeet").textContent=money(r.per);$("tWeek").textContent=money(r.week);$("tAnnual").textContent=money(r.annual);$("tPHMeet").textContent=fmt(r.phMeet)+" hrs";$("tPHYear").textContent=fmt(r.phYear)+" hrs";
 const vd=$("verdict");
 if(r.annual===0){vd.className="verdict";$("verdictText").textContent="Zero cost on these inputs — at least one of people, rate, length, or frequency is zero.";}
 else if(r.annual>=100000){vd.className="verdict warn";$("verdictText").textContent="At "+money(r.annual)+" a year ("+fmt(r.phYear)+" person-hours), this recurring meeting is a large time commitment. Cutting people, minutes, or frequency each reduces the cost proportionally — try halving one of them above.";}
 else{vd.className="verdict";$("verdictText").textContent="Annual time value "+money(r.annual)+" ("+fmt(r.phYear)+" person-hours). Check whether the decisions made in these meetings are worth that time.";}
 window.__summary="Meeting cost: "+money(r.per)+" per meeting, "+money(r.week)+" per week, "+money(r.annual)+" per year.";
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();
})();
