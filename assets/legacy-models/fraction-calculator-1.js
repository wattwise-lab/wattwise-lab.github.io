(()=>{'use strict';
const $=id=>document.getElementById(id);
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a;}
function rational(value){const parts=String(value).toLowerCase().split('e'),exp=Number(parts[1]||0),decimal=parts[0],digits=decimal.replace('.',''),places=(decimal.split('.')[1]||'').length-exp;let n=BigInt(digits),d=1n;if(places>0)d=10n**BigInt(places);else n*=10n**BigInt(-places);const g=gcd(n,d)||1n;return{n:n/g,d:d/g};}
function opCalc(n1,d1,op,n2,d2){
 if(![n1,d1,n2,d2].every(Number.isFinite))return{error:"Enter four finite numbers."};
 if(d1===0||d2===0)return{error:"A denominator cannot be zero."};
 if(op==="div"&&n2===0)return{error:"Division requires a nonzero second numerator."};
 const a=rational(n1),b=rational(d1),c=rational(n2),e=rational(d2);
 const p=a.n*b.d,q=a.d*b.n,r=c.n*e.d,t=c.d*e.n;
 let n,d,dec;
 if(op==="add"){n=p*t+r*q;d=q*t;dec=n1/d1+n2/d2;}
 else if(op==="sub"){n=p*t-r*q;d=q*t;dec=n1/d1-n2/d2;}
 else if(op==="mul"){n=p*r;d=q*t;dec=(n1/d1)*(n2/d2);}
 else{n=p*t;d=q*r;dec=(n1/d1)/(n2/d2);}
 if(!Number.isFinite(dec))return{error:"The result is outside the supported decimal range."};
 if(d<0n){n=-n;d=-d;}const g=gcd(n,d)||1n,sn=n/g,sd=d/g;
 const abs=sn<0n?-sn:sn;let mixed=sn+"/"+sd;
 if(sd===1n)mixed=String(sn);else if(abs>sd)mixed=(sn/sd)+" "+(abs%sd)+"/"+sd;
 return{raw:n+"/"+d,g:String(g),simp:sn+"/"+sd,dec,mixed};
}
function fmtDec(x){return Number(x).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:4});}
function render(){
 const n1=parseFloat($("n1").value),d1=parseFloat($("d1").value),n2=parseFloat($("n2").value),d2=parseFloat($("d2").value),op=$("op").value;
 if([n1,d1,n2,d2].some(v=>isNaN(v))){["result","chipDec","chipSimp","tRaw","tGcd","tSimp","tDec","tMix"].forEach(id=>{$(id).textContent="—";});$("note").textContent="Enter all four numbers to see the result.";window.__summary="";return;}
 const r=opCalc(n1,d1,op,n2,d2);
 if(r.error){["result","chipDec","chipSimp","tRaw","tGcd","tSimp","tDec","tMix"].forEach(id=>{$(id).textContent="—";});$("note").textContent=r.error;window.__summary="";return;}
 $("result").textContent=r.simp;$("chipDec").textContent=fmtDec(r.dec);$("chipSimp").textContent=r.simp;
 $("tRaw").textContent=r.raw;$("tGcd").textContent=String(r.g);$("tSimp").textContent=r.simp;$("tDec").textContent=fmtDec(r.dec);$("tMix").textContent=r.mixed;
 $("note").textContent=r.simp+" = "+fmtDec(r.dec)+" as a decimal.";
 window.__summary="Fraction result: "+r.simp+" ("+fmtDec(r.dec)+").";
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));document.querySelectorAll("input,select").forEach(e=>e.addEventListener("change",render));render();
})();
