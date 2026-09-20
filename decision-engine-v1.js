(() => {
"use strict";
const ROOT="cm-decision-engine", PARAM="de", VERSION="1.0.0";
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const cp=(o,p)=>Object.assign({},o,p);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2});
const number=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const fmt=(v,k="number")=>!Number.isFinite(v)?"—":k==="money"?money.format(v):k==="percent"?number.format(v)+"%":k==="years"?number.format(v)+" years":k==="integer"?Math.round(v).toLocaleString("en-US"):number.format(v);

function annuity(p,rate,years){
  p=Math.max(0,n(p)); years=n(years);
  if(!(years>0)) return NaN;
  const months=years*12,r=n(rate)/1200;
  if(Math.abs(r)<1e-12) return p/months;
  const f=Math.pow(1+r,months);
  return p*r*f/(f-1);
}
function fv(p,c,rate,years){
  p=Math.max(0,n(p)); c=Math.max(0,n(c)); years=n(years);
  if(!(years>=0)) return NaN;
  const months=years*12,r=n(rate)/1200;
  if(Math.abs(r)<1e-12) return p+c*months;
  const g=Math.pow(1+r,months);
  return p*g+c*((g-1)/r);
}
function bisect(fn,target,lo,hi){
  target=n(target,NaN); lo=n(lo); hi=n(hi);
  if(!Number.isFinite(target)||!(hi>lo)) return NaN;
  let a=fn(lo)-target,b=fn(hi)-target;
  if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0) return NaN;
  for(let i=0;i<100;i++){
    const mid=(lo+hi)/2,m=fn(mid)-target;
    if(!Number.isFinite(m)) return NaN;
    if(Math.abs(m)<1e-8) return mid;
    if(a*m<=0){hi=mid;b=m;} else {lo=mid;a=m;}
  }
  return (lo+hi)/2;
}
function mortgage(i){
  const price=Math.max(0,n(i.homePrice)),down=clamp(n(i.downPayment),0,price),principal=price-down;
  const pi=annuity(principal,i.rate,i.term); if(!Number.isFinite(pi)) return NaN;
  const ltv=price>0?principal/price:0;
  const pmi=ltv>0.8?principal*Math.max(0,n(i.pmiRate))/1200:0;
  return pi+Math.max(0,n(i.propertyTax))/12+Math.max(0,n(i.insurance))/12+Math.max(0,n(i.hoa))+Math.max(0,n(i.extra))+pmi;
}
const loan=i=>annuity(Math.max(0,n(i.principal)),i.rate,i.term)+Math.max(0,n(i.extra));
const profit=i=>n(i.revenue)-n(i.variableCosts)-n(i.fixedCosts);
const breakEven=i=>(n(i.price)-n(i.variableCost))>0?n(i.fixedCost)/(n(i.price)-n(i.variableCost)):NaN;
const roi=i=>n(i.initial)>0?(n(i.final)+n(i.income)-n(i.initial))/n(i.initial)*100:NaN;
const aiCost=i=>Math.max(0,n(i.calls))*((Math.max(0,n(i.inputTokens))/1e6*Math.max(0,n(i.inputPrice)))+(Math.max(0,n(i.outputTokens))/1e6*Math.max(0,n(i.outputPrice))));
const aiNet=i=>Math.max(0,n(i.people))*Math.max(0,n(i.runs))*Math.max(0,n(i.minutes))/60*Math.max(0,n(i.hourly))-Math.max(0,n(i.fee));

const C={
"mortgage-calculator":{
 title:"Mortgage Decision Lab",sub:"Reverse-solve affordability, compare rate scenarios, and see which assumptions move the monthly cost most.",metric:"Monthly housing cost",kind:"money",goal:"Desired monthly housing cost",
 fields:[
  ["homePrice","Home price","Home price","USD",1000,0,400000],["downPayment","Down payment","Down payment","USD",1000,0,80000],["rate","Interest rate","Interest rate","%",0.01,0,6.5,30],["term","Loan term","Loan term","years",1,1,30,50],["propertyTax","Annual property tax","Annual property tax","USD",100,0,4800],["insurance","Annual home insurance","Annual home insurance","USD",100,0,1500],["pmiRate","PMI rate","PMI rate","%",0.05,0,0.6,5],["hoa","Monthly HOA fee","Monthly HOA fee","USD",25,0,0],["extra","Extra monthly principal","Extra monthly principal","USD",50,0,0]
 ],
 primary:mortgage,
 targets:[
  ["metric","Monthly housing cost","money"],
  ["homePrice","Home price","money",(i,g)=>bisect(v=>mortgage(cp(i,{homePrice:v})),g,Math.max(n(i.downPayment)+1,1000),Math.max(1e7,n(i.downPayment)*20+1000))],
  ["downPayment","Down payment","money",(i,g)=>bisect(v=>mortgage(cp(i,{downPayment:v})),g,0,Math.max(1,n(i.homePrice)*.99))],
  ["rate","Interest rate","percent",(i,g)=>bisect(v=>mortgage(cp(i,{rate:v})),g,0,30)],
  ["term","Loan term","years",(i,g)=>bisect(v=>mortgage(cp(i,{term:v})),g,1,50)]
 ],
 details:i=>{const p=Math.max(0,n(i.homePrice)),d=clamp(n(i.downPayment),0,p),principal=p-d;return [["Loan principal",principal,"money"],["Principal + interest",annuity(principal,i.rate,i.term),"money"],["Loan-to-value",p?principal/p*100:0,"percent"]];},
 scenarios:i=>[["Conservative","Rate +1.0%",cp(i,{rate:n(i.rate)+1})],["Base","Current assumptions",cp(i,{})],["Upside","Rate -1.0%",cp(i,{rate:Math.max(0,n(i.rate)-1)})]],
 sens:["homePrice","downPayment","rate","term","propertyTax","insurance","hoa"]
},
"loan-calculator":{
 title:"Loan Decision Lab",sub:"Solve backward from a monthly payment target and compare how rate and term change affordability.",metric:"Monthly payment",kind:"money",goal:"Desired monthly payment",
 fields:[["principal","Loan principal","Loan principal","USD",1000,0,300000],["rate","Annual interest rate","Annual interest rate","%",0.01,0,6.5,100],["term","Loan term","Loan term","years",1,1,30,100],["extra","Extra monthly payment","Extra monthly payment","USD/month",50,0,0]],
 primary:loan,
 targets:[["metric","Monthly payment","money"],["principal","Loan principal","money",(i,g)=>bisect(v=>loan(cp(i,{principal:v})),g,0,1e8)],["rate","Annual interest rate","percent",(i,g)=>bisect(v=>loan(cp(i,{rate:v})),g,0,100)],["term","Loan term","years",(i,g)=>bisect(v=>loan(cp(i,{term:v})),g,.25,100)]],
 details:i=>[["Base required payment",annuity(i.principal,i.rate,i.term),"money"],["Extra monthly payment",Math.max(0,n(i.extra)),"money"],["Principal",Math.max(0,n(i.principal)),"money"]],
 scenarios:i=>[["Conservative","Rate +1.0%",cp(i,{rate:n(i.rate)+1})],["Base","Current assumptions",cp(i,{})],["Upside","Rate -1.0%",cp(i,{rate:Math.max(0,n(i.rate)-1)})]],
 sens:["principal","rate","term","extra"]
},
"compound-interest-calculator":{
 title:"Compound Growth Decision Lab",sub:"Reverse-solve the principal, monthly contribution, return, or time needed to reach a future-value goal.",metric:"Future value",kind:"money",goal:"Desired future value",
 fields:[["principal","Principal","Principal","USD",1000,0,10000],["contribution","Monthly contribution","Monthly contribution","USD",100,0,500],["rate","Annual return","Rate","%",0.1,0,6,100],["years","Years","Years","years",1,0,10,100]],
 primary:i=>fv(i.principal,i.contribution,i.rate,i.years),
 targets:[
  ["metric","Future value","money"],
  ["principal","Starting principal","money",(i,g)=>{const m=Math.max(0,n(i.years))*12,r=n(i.rate)/1200,G=Math.abs(r)<1e-12?1:Math.pow(1+r,m),c=Math.abs(r)<1e-12?n(i.contribution)*m:n(i.contribution)*((G-1)/r);return (g-c)/G;}],
  ["contribution","Monthly contribution","money",(i,g)=>{const m=Math.max(0,n(i.years))*12,r=n(i.rate)/1200,G=Math.abs(r)<1e-12?1:Math.pow(1+r,m),f=Math.abs(r)<1e-12?m:(G-1)/r;return f>0?(g-n(i.principal)*G)/f:NaN;}],
  ["rate","Annual return","percent",(i,g)=>bisect(v=>fv(i.principal,i.contribution,v,i.years),g,0,100)],
  ["years","Time required","years",(i,g)=>bisect(v=>fv(i.principal,i.contribution,i.rate,v),g,.01,100)]
 ],
 details:i=>{const total=Math.max(0,n(i.principal))+Math.max(0,n(i.contribution))*Math.max(0,n(i.years))*12,F=fv(i.principal,i.contribution,i.rate,i.years);return [["Total contributed",total,"money"],["Investment growth",F-total,"money"],["Years",Math.max(0,n(i.years)),"years"]];},
 scenarios:i=>[["Conservative","Return -2.0%",cp(i,{rate:Math.max(0,n(i.rate)-2)})],["Base","Current assumptions",cp(i,{})],["Upside","Return +2.0%",cp(i,{rate:n(i.rate)+2})]],
 sens:["principal","contribution","rate","years"]
},
"profit-calculator":{
 title:"Profit Decision Lab",sub:"Work backward from a profit target and see whether revenue, variable cost, or fixed cost is the biggest lever.",metric:"Profit",kind:"money",goal:"Desired profit",
 fields:[["revenue","Revenue","Revenue","USD",1000,0,100000],["variableCosts","Variable costs","Variable costs","USD",1000,0,68000],["fixedCosts","Fixed costs","Fixed costs","USD",1000,0,8000]],
 primary:profit,
 targets:[["metric","Profit","money"],["revenue","Revenue needed","money",(i,g)=>g+n(i.variableCosts)+n(i.fixedCosts)],["variableCosts","Maximum variable costs","money",(i,g)=>n(i.revenue)-n(i.fixedCosts)-g],["fixedCosts","Maximum fixed costs","money",(i,g)=>n(i.revenue)-n(i.variableCosts)-g]],
 details:i=>[["Profit margin",n(i.revenue)>0?profit(i)/n(i.revenue)*100:NaN,"percent"],["Total costs",n(i.variableCosts)+n(i.fixedCosts),"money"],["Revenue",n(i.revenue),"money"]],
 scenarios:i=>[["Conservative","Revenue -10%, variable cost +5%",cp(i,{revenue:n(i.revenue)*.9,variableCosts:n(i.variableCosts)*1.05})],["Base","Current assumptions",cp(i,{})],["Upside","Revenue +10%, variable cost -5%",cp(i,{revenue:n(i.revenue)*1.1,variableCosts:n(i.variableCosts)*.95})]],
 sens:["revenue","variableCosts","fixedCosts"]
},
"break-even-calculator":{
 title:"Break-even Decision Lab",sub:"Reverse-solve the price, fixed cost, or variable cost required to hit a target break-even volume.",metric:"Break-even units",kind:"integer",goal:"Desired break-even units",
 fields:[["fixedCost","Fixed cost","Fixed cost","USD",100,0,50000],["price","Price per unit","Price","USD",1,0,200],["variableCost","Variable cost per unit","Variable cost","USD",1,0,120]],
 primary:breakEven,
 targets:[["metric","Break-even units","integer"],["fixedCost","Maximum fixed cost","money",(i,g)=>g*(n(i.price)-n(i.variableCost))],["price","Required selling price","money",(i,g)=>g>0?n(i.variableCost)+n(i.fixedCost)/g:NaN],["variableCost","Maximum variable cost","money",(i,g)=>g>0?n(i.price)-n(i.fixedCost)/g:NaN]],
 details:i=>{const u=breakEven(i);return [["Contribution per unit",n(i.price)-n(i.variableCost),"money"],["Break-even revenue",u*n(i.price),"money"],["Fixed cost",n(i.fixedCost),"money"]];},
 scenarios:i=>[["Conservative","Price -10%, variable cost +5%",cp(i,{price:n(i.price)*.9,variableCost:n(i.variableCost)*1.05})],["Base","Current assumptions",cp(i,{})],["Upside","Price +10%, variable cost -5%",cp(i,{price:n(i.price)*1.1,variableCost:n(i.variableCost)*.95})]],
 sens:["fixedCost","price","variableCost"]
},
"roi-calculator":{
 title:"ROI Decision Lab",sub:"Set a target ROI and solve backward for the initial value, final value, or income needed to reach it.",metric:"ROI",kind:"percent",goal:"Desired ROI",
 fields:[["initial","Initial value","Initial value","USD",1000,0,10000],["final","Final value","Final value","USD",1000,0,12500],["income","Income","Income","USD",100,0,500]],
 primary:roi,
 targets:[["metric","ROI","percent"],["initial","Initial value","money",(i,g)=>1+g/100>0?(n(i.final)+n(i.income))/(1+g/100):NaN],["final","Final value needed","money",(i,g)=>n(i.initial)*(1+g/100)-n(i.income)],["income","Income needed","money",(i,g)=>n(i.initial)*(1+g/100)-n(i.final)]],
 details:i=>[["Net gain",n(i.final)+n(i.income)-n(i.initial),"money"],["Initial value",n(i.initial),"money"],["Final + income",n(i.final)+n(i.income),"money"]],
 scenarios:i=>[["Conservative","Final value -10%",cp(i,{final:n(i.final)*.9})],["Base","Current assumptions",cp(i,{})],["Upside","Final value +10%",cp(i,{final:n(i.final)*1.1})]],
 sens:["initial","final","income"]
},
"ai-inference-cost":{
 title:"AI Inference Cost Decision Lab",sub:"Plan backward from a monthly AI budget and stress-test how usage, token volume, and model pricing change total spend.",metric:"Total inference cost",kind:"money",goal:"Monthly AI budget",
 fields:[["inputTokens","Input tokens per call","Input Tokens","tokens",1,0,2500],["outputTokens","Output tokens per call","Output Tokens","tokens",1,0,800],["calls","Calls","Calls","times",1,0,100000],["inputPrice","Input price / 1M","Input Price","USD",.01,0,5],["outputPrice","Output price / 1M","Output Price","USD",.01,0,20]],
 primary:aiCost,
 targets:[
  ["metric","Total inference cost","money"],
  ["calls","Maximum calls","integer",(i,g)=>{const u=aiCost(cp(i,{calls:1}));return u>0?g/u:NaN;}],
  ["inputTokens","Maximum input tokens / call","integer",(i,g)=>{const calls=n(i.calls),p=n(i.inputPrice);if(!(calls>0&&p>0))return NaN;const rem=g/calls-n(i.outputTokens)/1e6*n(i.outputPrice);return rem>=0?rem*1e6/p:NaN;}],
  ["outputTokens","Maximum output tokens / call","integer",(i,g)=>{const calls=n(i.calls),p=n(i.outputPrice);if(!(calls>0&&p>0))return NaN;const rem=g/calls-n(i.inputTokens)/1e6*n(i.inputPrice);return rem>=0?rem*1e6/p:NaN;}]
 ],
 details:i=>{const calls=Math.max(0,n(i.calls)),a=calls*Math.max(0,n(i.inputTokens))/1e6*Math.max(0,n(i.inputPrice)),b=calls*Math.max(0,n(i.outputTokens))/1e6*Math.max(0,n(i.outputPrice));return [["Cost per call",calls?(a+b)/calls:0,"money"],["Input token cost",a,"money"],["Output token cost",b,"money"]];},
 scenarios:i=>[["Conservative","Usage +25%",cp(i,{calls:n(i.calls)*1.25})],["Base","Current usage",cp(i,{})],["Efficient","Usage -25%",cp(i,{calls:n(i.calls)*.75})]],
 sens:["inputTokens","outputTokens","calls","inputPrice","outputPrice"]
},
"ai-workflow-savings":{
 title:"AI Workflow Savings Decision Lab",sub:"Reverse-solve the automation fee, time saved, labor rate, or usage needed to hit a monthly net-savings goal.",metric:"Net monthly savings",kind:"money",goal:"Desired net monthly savings",
 fields:[["people","People","People","people",1,0,8],["runs","Runs per person","Runs","times",1,0,20],["minutes","Minutes saved per run","Minutes","minutes",1,0,18],["hourly","Hourly labor value","Hourly","USD",.01,0,120],["fee","Automation fee","Fee","USD",.01,0,999]],
 primary:aiNet,
 targets:[
  ["metric","Net monthly savings","money"],
  ["fee","Maximum automation fee","money",(i,g)=>n(i.people)*n(i.runs)*n(i.minutes)/60*n(i.hourly)-g],
  ["minutes","Minutes saved per run","number",(i,g)=>{const d=n(i.people)*n(i.runs)*n(i.hourly);return d>0?(g+n(i.fee))*60/d:NaN;}],
  ["hourly","Required hourly labor value","money",(i,g)=>{const d=n(i.people)*n(i.runs)*n(i.minutes);return d>0?(g+n(i.fee))*60/d:NaN;}],
  ["runs","Runs per person needed","number",(i,g)=>{const d=n(i.people)*n(i.minutes)*n(i.hourly);return d>0?(g+n(i.fee))*60/d:NaN;}]
 ],
 details:i=>{const gross=n(i.people)*n(i.runs)*n(i.minutes)/60*n(i.hourly),fee=Math.max(0,n(i.fee)),net=gross-fee;return [["Gross labor value saved",gross,"money"],["Automation fee",fee,"money"],["Net ROI",fee>0?net/fee*100:NaN,"percent"]];},
 scenarios:i=>[["Conservative","20% less time saved, 10% higher fee",cp(i,{minutes:n(i.minutes)*.8,fee:n(i.fee)*1.1})],["Base","Current assumptions",cp(i,{})],["Upside","20% more time saved, 10% lower fee",cp(i,{minutes:n(i.minutes)*1.2,fee:n(i.fee)*.9})]],
 sens:["people","runs","minutes","hourly","fee"]
}
};

function key(){
 let p=location.pathname.replace(/^\/+|\/+$/g,"");
 return p.replace(/\.html$/i,"");
}
function normField(a){return {key:a[0],label:a[1],aria:a[2],unit:a[3],step:a[4],min:a[5],fallback:a[6],max:a[7]};}
function fields(cfg){return cfg.fields.map(normField);}
function original(f){
 const el=document.querySelector('input[aria-label="'+f.aria.replace(/"/g,'\\"')+'"]');
 return el?n(el.value,f.fallback):f.fallback;
}
function inputs(cfg){const o={};fields(cfg).forEach(f=>o[f.key]=original(f));return o;}
function shared(tool,cfg,base){
 try{
  const raw=new URLSearchParams(location.search).get(PARAM); if(!raw)return null;
  const p=JSON.parse(raw); if(!p||p.v!==1||p.tool!==tool||typeof p.inputs!=="object")return null;
  const x=cp(base,{}); fields(cfg).forEach(f=>{if(Number.isFinite(Number(p.inputs[f.key])))x[f.key]=Number(p.inputs[f.key]);});
  return {inputs:x,target:cfg.targets.some(t=>t[0]===p.target)?p.target:cfg.targets[0][0],goal:Number.isFinite(Number(p.goal))?Number(p.goal):cfg.primary(x)};
 }catch(_){return null;}
}
function shareUrl(tool,s){
 const u=new URL(location.href); u.searchParams.set(PARAM,JSON.stringify({v:1,tool,inputs:s.inputs,target:s.target,goal:s.goal})); return u.toString();
}
function fieldHTML(cfg,s){
 return '<div class="cmde-field-grid">'+fields(cfg).map(f=>{
  const v=Number.isFinite(Number(s.inputs[f.key]))?Number(s.inputs[f.key]):"";
  const min=f.min!==undefined?' min="'+f.min+'"':"",max=f.max!==undefined?' max="'+f.max+'"':"",step=f.step!==undefined?' step="'+f.step+'"':"";
  return '<label class="cmde-field"><span>'+f.label+'</span><div class="cmde-input-wrap"><input data-cmde-input="'+f.key+'" type="number" inputmode="decimal" value="'+v+'"'+min+max+step+'><em>'+f.unit+'</em></div></label>';
 }).join("")+'</div>';
}
function details(cfg,i){return (cfg.details?cfg.details(i):[]).map(d=>'<div class="cmde-detail"><span>'+d[0]+'</span><strong>'+fmt(d[1],d[2])+'</strong></div>').join("");}
function solveHTML(cfg,s){
 const t=cfg.targets.find(x=>x[0]===s.target)||cfg.targets[0],needs=t[0]!=="metric",v=needs?(t[3]?t[3](s.inputs,s.goal):NaN):cfg.primary(s.inputs),bad=!Number.isFinite(v)||v<0;
 return '<div class="cmde-solve-layout"><div class="cmde-panel"><div class="cmde-panel-head"><div><p class="cmde-kicker">Assumptions</p><h3>Use the current calculator values</h3></div><button type="button" class="cmde-ghost" data-cmde-sync>Sync from calculator</button></div>'+fieldHTML(cfg,s)+'</div>'+
 '<div class="cmde-panel cmde-result-panel"><label class="cmde-field"><span>Solve for</span><div class="cmde-select-wrap"><select data-cmde-target>'+cfg.targets.map(x=>'<option value="'+x[0]+'"'+(x[0]===s.target?" selected":"")+'>'+x[1]+'</option>').join("")+'</select></div></label>'+
 (needs?'<label class="cmde-field cmde-goal"><span>'+cfg.goal+'</span><div class="cmde-input-wrap"><input data-cmde-goal type="number" inputmode="decimal" value="'+s.goal+'" step="0.01"><em>'+(cfg.kind==="percent"?"%":cfg.kind==="money"?"USD":"")+'</em></div></label>':"")+
 '<div class="cmde-result-box '+(bad?"is-invalid":"")+'"><span>'+t[1]+'</span><strong class="cmde-result-value" data-testid="cmde-result">'+(bad?"No feasible solution":fmt(v,t[2]||cfg.kind))+'</strong><small>'+(bad?"Try a less restrictive target or adjust the assumptions.":"Deterministic calculation — no AI-generated arithmetic.")+'</small></div><div class="cmde-details">'+details(cfg,s.inputs)+'</div></div></div>';
}
function scenariosHTML(cfg,s){
 return '<div class="cmde-scenario-grid">'+cfg.scenarios(s.inputs).map((x,i)=>'<article class="cmde-scenario-card'+(i===1?" is-base":"")+'"><div class="cmde-scenario-top"><span>'+x[0]+'</span>'+(i===1?'<b>Baseline</b>':'')+'</div><p>'+x[1]+'</p><strong>'+fmt(cfg.primary(x[2]),cfg.kind)+'</strong><small>'+cfg.metric+'</small></article>').join("")+'</div><div class="cmde-panel cmde-explain"><h3>Why scenario comparison matters</h3><p>A single answer can hide risk. These cases keep the formula fixed and change only the stated assumptions.</p></div>';
}
function sensRows(cfg,s){
 const base=cfg.primary(s.inputs); if(!Number.isFinite(base))return [];
 return cfg.sens.map(k=>{const f=fields(cfg).find(x=>x.key===k),v=n(s.inputs[k]);if(!f||Math.abs(v)<1e-12)return null;const lo=cfg.primary(cp(s.inputs,{[k]:v*.9})),hi=cfg.primary(cp(s.inputs,{[k]:v*1.1}));if(!Number.isFinite(lo)||!Number.isFinite(hi))return null;return {label:f.label,lo,hi,impact:Math.max(Math.abs(lo-base),Math.abs(hi-base))};}).filter(Boolean).sort((a,b)=>b.impact-a.impact);
}
function sensitivityHTML(cfg,s){
 const base=cfg.primary(s.inputs),rows=sensRows(cfg,s),max=rows.length?rows[0].impact:1;
 return '<div class="cmde-panel"><div class="cmde-panel-head"><div><p class="cmde-kicker">What matters most</p><h3>±10% sensitivity test</h3></div><div class="cmde-baseline"><span>Baseline</span><strong>'+fmt(base,cfg.kind)+'</strong></div></div><div class="cmde-sensitivity-list">'+
 (rows.length?rows.map((r,i)=>'<div class="cmde-sensitivity-row"><div class="cmde-rank">'+(i+1)+'</div><div class="cmde-sensitivity-main"><div class="cmde-sensitivity-title"><strong>'+r.label+'</strong><span>−10% → '+fmt(r.lo,cfg.kind)+' · +10% → '+fmt(r.hi,cfg.kind)+'</span></div><div class="cmde-bar"><i style="width:'+Math.max(4,r.impact/max*100)+'%"></i></div></div><div class="cmde-impact"><span>max move</span><strong>'+fmt(r.impact,cfg.kind)+'</strong></div></div>').join(""):'<p class="cmde-empty">Sensitivity needs at least one non-zero adjustable input.</p>')+
 '</div><p class="cmde-footnote">Ranking uses the largest absolute result change when one input moves by ±10% and all other inputs stay fixed.</p></div>';
}
function shareHTML(tool,s){
 const u=shareUrl(tool,s).replace(/"/g,"&quot;");
 return '<div class="cmde-share-grid"><div class="cmde-panel"><p class="cmde-kicker">Share calculation</p><h3>Send the exact assumptions and Decision Lab state</h3><p class="cmde-copy">The link stores inputs in the URL only. No account is required.</p><div class="cmde-share-box"><input id="cmde-share-url" readonly value="'+u+'"><button type="button" class="cmde-primary" data-cmde-copy>Copy link</button></div><small class="cmde-share-status" data-cmde-share-status>Anyone opening the link gets the same Decision Lab inputs.</small></div><div class="cmde-panel"><p class="cmde-kicker">Included</p><div class="cmde-included"><span>✓ Calculator type</span><span>✓ Current assumptions</span><span>✓ Solve-for target</span><span>✓ Desired result</span></div><button type="button" class="cmde-ghost cmde-reset-link" data-cmde-clear-share>Clear shared state from URL</button></div></div>';
}
function render(tool,cfg,s,el){
 let body=s.tab==="scenarios"?scenariosHTML(cfg,s):s.tab==="sensitivity"?sensitivityHTML(cfg,s):s.tab==="share"?shareHTML(tool,s):solveHTML(cfg,s);
 const tabs=[["solve","Solve backward"],["scenarios","Scenarios"],["sensitivity","What matters most"],["share","Share"]];
 el.innerHTML='<div class="cmde-heading"><div><div class="cmde-badge">Decision Engine</div><h2>'+cfg.title+'</h2><p>'+cfg.sub+'</p></div><button type="button" class="cmde-version">v'+VERSION+'</button></div><div class="cmde-tabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" aria-selected="'+(s.tab===t[0])+'" data-cmde-tab="'+t[0]+'" class="'+(s.tab===t[0]?"is-active":"")+'">'+t[1]+'</button>').join("")+'</div><div class="cmde-body">'+body+'</div>';
 el.querySelectorAll("[data-cmde-tab]").forEach(b=>b.onclick=()=>{s.tab=b.dataset.cmdeTab;render(tool,cfg,s,el);});
 el.querySelectorAll("[data-cmde-input]").forEach(x=>x.onchange=()=>{s.inputs[x.dataset.cmdeInput]=n(x.value);render(tool,cfg,s,el);});
 const t=el.querySelector("[data-cmde-target]"); if(t)t.onchange=()=>{s.target=t.value;if(s.target!=="metric"&&(!Number.isFinite(s.goal)||s.goal===0))s.goal=cfg.primary(s.inputs);render(tool,cfg,s,el);};
 const g=el.querySelector("[data-cmde-goal]"); if(g)g.onchange=()=>{s.goal=n(g.value);render(tool,cfg,s,el);};
 const sync=el.querySelector("[data-cmde-sync]"); if(sync)sync.onclick=()=>{s.inputs=inputs(cfg);s.goal=cfg.primary(s.inputs);render(tool,cfg,s,el);};
 const copyBtn=el.querySelector("[data-cmde-copy]"); if(copyBtn)copyBtn.onclick=async()=>{const x=el.querySelector("#cmde-share-url"),st=el.querySelector("[data-cmde-share-status]");let ok=false;try{if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(x.value);ok=true;}}catch(_){}if(!ok){x.focus();x.select();try{ok=document.execCommand("copy");}catch(_){}}st.textContent=ok?"Link copied.":"Select and copy the link above.";};
 const clear=el.querySelector("[data-cmde-clear-share]"); if(clear)clear.onclick=()=>{const u=new URL(location.href);u.searchParams.delete(PARAM);history.replaceState({},"",u.toString());render(tool,cfg,s,el);};
}
let mounted=null;
function mount(){
 const tool=key(),cfg=C[tool],old=document.getElementById(ROOT);
 if(!cfg){if(old)old.remove();mounted=null;return;}
 if(old&&mounted===tool)return;
 if(old)old.remove();
 const base=inputs(cfg),loaded=shared(tool,cfg,base),s=loaded||{inputs:base,target:cfg.targets[0][0],goal:cfg.primary(base)};s.tab="solve";
 const el=document.createElement("section");el.id=ROOT;el.className="cmde-shell";el.dataset.tool=tool;
 const footer=document.querySelector("footer"),main=document.querySelector("main");
 if(footer&&footer.parentNode)footer.parentNode.insertBefore(el,footer);else if(main&&main.parentNode)main.parentNode.insertBefore(el,main.nextSibling);else document.body.appendChild(el);
 mounted=tool;render(tool,cfg,s,el);
}
const schedule=(ms=150)=>setTimeout(mount,ms);
["pushState","replaceState"].forEach(m=>{const o=history[m];if(!o||o.__cmde)return;const w=function(){const r=o.apply(this,arguments);schedule(180);return r;};w.__cmde=true;history[m]=w;});
addEventListener("popstate",()=>schedule(180));
addEventListener("load",()=>schedule(450));
if(document.readyState==="complete")schedule(250);else document.addEventListener("DOMContentLoaded",()=>schedule(450),{once:true});
})();