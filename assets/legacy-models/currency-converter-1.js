(()=>{'use strict';

const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:6});
const $=id=>document.getElementById(id);
function compute(amount,rate,fee){const gross=amount*rate;const feeAmt=gross*fee/100;return {gross:gross,feeAmt:feeAmt,net:gross-feeAmt};}
// DOM
function get(){const v={};document.querySelectorAll("input,select").forEach(e=>{v[e.id]=e.tagName==="SELECT"?e.value:(parseFloat(e.value));});return v;}
function render(){ const v=get();
  const ok=Number.isFinite(v.amount)&&v.amount>=0&&Number.isFinite(v.rate)&&v.rate>=0&&Number.isFinite(v.fee)&&v.fee>=0&&v.fee<=100;
  if(!ok){ $("result").textContent="—"; $("chipBase").textContent="—"; $("chipInv").textContent="—"; $("tblRows").innerHTML=""; const vd=$("verdict"); vd.className="verdict bad"; $("verdictText").textContent="Enter an amount at zero or above, a rate at zero or above, and a fee between 0% and 100%."; window.__summary=""; return; }
  const r=compute(v.amount,v.rate,v.fee);
  $("result").textContent=fmt(r.net);
  $("chipBase").textContent=fmt(r.gross)+" before fee";
  $("chipInv").textContent=fmt(r.feeAmt)+" fee";
  $("tblRows").innerHTML="<tr><td>Gross (amount &times; rate)</td><td class='num'>"+fmt(r.gross)+"</td></tr><tr><td>Fee ("+fmt(v.fee)+"%)</td><td class='num'>&minus;"+fmt(r.feeAmt)+"</td></tr><tr><td>Amount received</td><td class='num'>"+fmt(r.net)+"</td></tr><tr><td>Effective rate (received &divide; amount)</td><td class='num'>"+(v.amount>0?fmt(r.net/v.amount):"—")+"</td></tr>";
  const vd=$("verdict"); vd.className="verdict warn"; $("verdictText").textContent="Example rate only: this page does not fetch a market rate. Replace "+fmt(v.rate)+" with the actual rate your bank or provider quotes, including their spread, before acting on the result.";
  window.__summary="Currency: "+fmt(v.amount)+" at rate "+fmt(v.rate)+" with "+fmt(v.fee)+"% fee = "+fmt(r.net)+" received (gross "+fmt(r.gross)+", fee "+fmt(r.feeAmt)+").";  }


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();

})();
