(()=>{'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString((typeof window!=='undefined'&&window.CMI18n?window.CMI18n.formatLocale:'en-US'),{maximumFractionDigits:4});
function gpaCalc(rows){
 const used=rows.filter(r=>!isNaN(r.g)&&!isNaN(r.c)&&r.c>0);
 const pts=used.reduce((a,r)=>a+r.g*r.c,0), cred=used.reduce((a,r)=>a+r.c,0);
 return{used:used,pts:pts,cred:cred,gpa:cred>0?pts/cred:null};
}
function render(){
 const rows=[1,2,3,4].map(i=>({g:parseFloat($("g"+i).value),c:parseFloat($("c"+i).value)}));
 if(rows.some(row=>Number.isNaN(row.g)!==Number.isNaN(row.c))){for(const id of ['result','chipCred','chipPts','tCred','tPts'])$(id).textContent='—';$('gpaRows').replaceChildren();$('note').textContent=window.CMI18n.pick('Complete both grade and credits, or leave both fields empty for an unused course.|每门课程请完整填写绩点和学分，或将两项均留空。');window.__summary='';return;}
 const r=gpaCalc(rows);
 let rh="";
 rows.forEach((row,i)=>{if(!isNaN(row.g)&&!isNaN(row.c)&&row.c>0){rh+="<tr><td>Course "+(i+1)+"</td><td class='num'>"+fmt(row.g)+"</td><td class='num'>"+fmt(row.c)+"</td><td class='num'>"+fmt(row.g*row.c)+"</td></tr>";}});
 $("gpaRows").innerHTML=rh;
 if(r.gpa===null){$("result").textContent="—";$("chipCred").textContent="—";$("chipPts").textContent="—";$("tCred").textContent="—";$("tPts").textContent="—";$("note").textContent="Enter at least one course with credits above zero.";window.__summary="";return;}
 $("result").textContent=fmt(r.gpa);$("chipCred").textContent=fmt(r.cred);$("chipPts").textContent=fmt(r.pts);$("tCred").textContent=fmt(r.cred);$("tPts").textContent=fmt(r.pts);
 $("note").textContent=fmt(r.pts)+" grade points over "+fmt(r.cred)+" credits.";
 window.__summary="GPA: "+fmt(r.gpa)+" ("+fmt(r.pts)+" points over "+fmt(r.cred)+" credits).";
}


document.querySelectorAll("input,select").forEach(e=>e.addEventListener("input",render));render();
})();
