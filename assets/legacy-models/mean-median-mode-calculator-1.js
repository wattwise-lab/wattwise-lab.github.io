(()=>{'use strict';

const num=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
let dataError='';function parseData(){try{dataError='';return CMData.list($('data').value);}catch(error){dataError=window.CMI18n.pick(error.message);return[];}}
function render(){
  const d=parseData();
  if(d.length===0){
    $("result").textContent="—"; $("chipMedian").textContent="—"; $("chipMode").textContent="—";
    ["bCount","bSum","bMean","bMedian","bMode","bRange","bSorted"].forEach(id=>{$(id).textContent="—";});
    const vd=$("verdict"); vd.className="verdict warn";
    $("verdictText").textContent=dataError||"Enter at least one number above.";
    return;
  }
  const s=[...d].sort((a,b)=>a-b);
  const sum=d.reduce((a,b)=>a+b,0), mean=sum/d.length;
  const median=d.length%2===1 ? s[(d.length-1)/2] : (s[d.length/2-1]+s[d.length/2])/2;
  const freq={}; s.forEach(x=>{freq[x]=(freq[x]||0)+1;});
  const maxf=Math.max(...Object.values(freq));
  const modes=maxf>1 ? Object.keys(freq).filter(k=>freq[k]===maxf).map(Number) : [];
  $("result").textContent=num(mean);
  $("chipMedian").textContent=num(median);
  $("chipMode").textContent=modes.length?modes.map(num).join(", "):"none";
  $("bCount").textContent=num(d.length);
  $("bSum").textContent=num(sum);
  $("bMean").textContent=num(mean);
  $("bMedian").textContent=num(median);
  $("bMode").textContent=modes.length?modes.map(num).join(", "):"none";
  $("bRange").textContent=num(s[s.length-1]-s[0]);
  $("bSorted").textContent=s.map(num).join(", ");
  const vd=$("verdict"); vd.className="verdict";
  $("verdictText").textContent="Mean "+num(mean)+", median "+num(median)+", mode "+(modes.length?modes.map(num).join(", "):"none")+" across "+d.length+" values.";
}

$("data").addEventListener("input",render);render();

})();
