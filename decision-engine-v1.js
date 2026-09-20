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
function originalEl(f){
  return document.querySelector('input[aria-label="'+f.aria.replace(/"/g,'\\"')+'"]');
}
function nativeSet(el,value){
  if(!el) return;
  const proto=Object.getPrototypeOf(el);
  const desc=Object.getOwnPropertyDescriptor(proto,"value") || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
  if(desc&&desc.set) desc.set.call(el,String(value)); else el.value=String(value);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}
function applyInputs(cfg,data){
  fields(cfg).forEach(f=>{
    if(Number.isFinite(Number(data[f.key]))) nativeSet(originalEl(f),Number(data[f.key]));
  });
}
function targetFor(cfg,s){
  const fallback=cfg.targets[1]||cfg.targets[0];
  return cfg.targets.find(t=>t[0]===s.target&&t[0]!=="metric")||fallback;
}
function currentState(cfg,s){
  s.inputs=inputs(cfg);
  const current=cfg.primary(s.inputs);
  if(!Number.isFinite(s.goal)) s.goal=current;
  if(!s.target||s.target==="metric") s.target=(cfg.targets[1]||cfg.targets[0])[0];
  return current;
}
function deltaText(value,base,kind){
  if(!Number.isFinite(value)||!Number.isFinite(base)) return "";
  const d=value-base;
  if(Math.abs(d)<1e-9) return "Current";
  return (d>0?"+":"−")+fmt(Math.abs(d),kind)+" vs current";
}
function solvePanel(cfg,s){
  const current=currentState(cfg,s);
  const t=targetFor(cfg,s);
  const solved=t[3]?t[3](s.inputs,s.goal):NaN;
  const bad=!Number.isFinite(solved)||solved<0;
  const canApply=!bad&&fields(cfg).some(f=>f.key===t[0]);
  return '<div class="cmde-solve">'+
    '<div class="cmde-solve-controls">'+
      '<div class="cmde-eyebrow">Reverse solve</div>'+
      '<h3>Set the outcome. Solve the input.</h3>'+
      '<p>Uses the same deterministic formula as this calculator.</p>'+
      '<div class="cmde-control-grid">'+
        '<label><span>Target '+cfg.metric.toLowerCase()+'</span><div class="cmde-control-input"><input data-cmde-goal type="number" inputmode="decimal" step="0.01" value="'+s.goal+'"><em>'+(cfg.kind==="money"?"USD":cfg.kind==="percent"?"%":"")+'</em></div></label>'+
        '<label><span>Solve for</span><select data-cmde-target>'+cfg.targets.filter(x=>x[0]!=="metric").map(x=>'<option value="'+x[0]+'"'+(x[0]===t[0]?" selected":"")+'>'+x[1]+'</option>').join("")+'</select></label>'+
      '</div>'+
      '<div class="cmde-mini-metrics"><span><small>Current</small><b data-testid="cmde-current">'+fmt(current,cfg.kind)+'</b></span><span><small>Target</small><b>'+fmt(s.goal,cfg.kind)+'</b></span></div>'+
    '</div>'+
    '<div class="cmde-solve-answer '+(bad?"is-invalid":"")+'">'+
      '<small>Required '+t[1].toLowerCase()+'</small>'+
      '<strong data-testid="cmde-result">'+(bad?"No feasible solution":fmt(solved,t[2]||"number"))+'</strong>'+
      '<p>'+(bad?"Adjust the target or the current assumptions.":"Based on the values already entered above.")+'</p>'+
      (canApply?'<button type="button" data-cmde-apply="'+t[0]+'">Apply to calculator</button>':'')+
    '</div>'+
  '</div>';
}
function comparePanel(cfg,s){
  const current=currentState(cfg,s);
  return '<div class="cmde-section-head"><div><div class="cmde-eyebrow">Scenario compare</div><h3>One result is not enough.</h3></div><p>Same formula. Only the named assumptions change.</p></div>'+
  '<div class="cmde-compare-grid">'+cfg.scenarios(s.inputs).map((x,i)=>{
    const v=cfg.primary(x[2]);
    return '<article class="cmde-compare-card '+(i===1?"is-base":"")+'"><div><span>'+x[0]+'</span>'+(i===1?'<b>BASE</b>':'')+'</div><p>'+x[1]+'</p><strong>'+fmt(v,cfg.kind)+'</strong><small>'+deltaText(v,current,cfg.kind)+'</small></article>';
  }).join("")+'</div>';
}
function sensRows(cfg,s){
  const base=cfg.primary(s.inputs); if(!Number.isFinite(base)) return [];
  return cfg.sens.map(k=>{
    const f=fields(cfg).find(x=>x.key===k),v=n(s.inputs[k]);
    if(!f||Math.abs(v)<1e-12) return null;
    const lo=cfg.primary(cp(s.inputs,{[k]:v*.9})),hi=cfg.primary(cp(s.inputs,{[k]:v*1.1}));
    if(!Number.isFinite(lo)||!Number.isFinite(hi)) return null;
    return {label:f.label,lo,hi,impact:Math.max(Math.abs(lo-base),Math.abs(hi-base))};
  }).filter(Boolean).sort((a,b)=>b.impact-a.impact);
}
function insightsPanel(cfg,s){
  const current=currentState(cfg,s),rows=sensRows(cfg,s).slice(0,4),top=rows[0],max=top?top.impact:1;
  return '<div class="cmde-section-head"><div><div class="cmde-eyebrow">Sensitivity</div><h3>What changes the answer most?</h3></div><p>Each input moves ±10% while every other input stays fixed.</p></div>'+
  (top?'<div class="cmde-top-insight"><span>Most sensitive</span><strong>'+top.label+'</strong><p>A 10% move changes '+cfg.metric.toLowerCase()+' by up to <b>'+fmt(top.impact,cfg.kind)+'</b>.</p></div>':'')+
  '<div class="cmde-insight-list">'+rows.map((r,i)=>'<div class="cmde-insight-row"><span class="cmde-rank">'+(i+1)+'</span><div><div class="cmde-insight-title"><strong>'+r.label+'</strong><small>'+fmt(r.lo,cfg.kind)+' ↔ '+fmt(r.hi,cfg.kind)+'</small></div><i><b style="width:'+Math.max(7,r.impact/max*100)+'%"></b></i></div><em>'+fmt(r.impact,cfg.kind)+'</em></div>').join("")+'</div>';
}
function sharePanel(tool,cfg,s){
  currentState(cfg,s);
  const u=shareUrl(tool,s).replace(/"/g,"&quot;");
  return '<div class="cmde-share"><div><div class="cmde-eyebrow">Share</div><h3>Send this exact calculation.</h3><p>The assumptions are encoded in the link. No account and no server-side save.</p></div><button type="button" data-cmde-copy data-share-url="'+u+'"><span>Copy share link</span><small data-cmde-copy-status>Same inputs, same solve target.</small></button></div>';
}
function panelHTML(tool,cfg,s){
  if(s.mode==="solve") return solvePanel(cfg,s);
  if(s.mode==="compare") return comparePanel(cfg,s);
  if(s.mode==="insights") return insightsPanel(cfg,s);
  if(s.mode==="share") return sharePanel(tool,cfg,s);
  return "";
}
function render(tool,cfg,s,rail,panel){
  const modes=[["solve","Solve for"],["compare","Compare"],["insights","Insights"],["share","Share"]];
  rail.innerHTML='<div class="cmde-rail-label"><span>Explore this result</span><small>Decision tools</small></div><div class="cmde-mode-switch">'+modes.map(m=>'<button type="button" data-cmde-mode="'+m[0]+'" class="'+(s.mode===m[0]?"is-active":"")+'" aria-pressed="'+(s.mode===m[0])+'">'+m[1]+'</button>').join("")+'</div>'+(s.mode?'<button type="button" class="cmde-close" data-cmde-close aria-label="Close decision tools">×</button>':'');
  panel.hidden=!s.mode;
  panel.innerHTML=s.mode?panelHTML(tool,cfg,s):"";

  rail.querySelectorAll("[data-cmde-mode]").forEach(b=>b.onclick=()=>{
    const next=b.dataset.cmdeMode;
    s.mode=s.mode===next?null:next;
    if(s.mode==="solve"){
      const cur=cfg.primary(inputs(cfg));
      if(!Number.isFinite(s.goal)||s.goal===0) s.goal=cur;
      if(!s.target||s.target==="metric") s.target=(cfg.targets[1]||cfg.targets[0])[0];
    }
    render(tool,cfg,s,rail,panel);
  });
  const close=rail.querySelector("[data-cmde-close]");
  if(close) close.onclick=()=>{s.mode=null;render(tool,cfg,s,rail,panel);};

  const target=panel.querySelector("[data-cmde-target]");
  if(target) target.onchange=()=>{s.target=target.value;render(tool,cfg,s,rail,panel);};
  const goal=panel.querySelector("[data-cmde-goal]");
  if(goal) goal.onchange=()=>{s.goal=n(goal.value);render(tool,cfg,s,rail,panel);};
  const apply=panel.querySelector("[data-cmde-apply]");
  if(apply) apply.onclick=()=>{
    const t=targetFor(cfg,s),value=t[3]?t[3](inputs(cfg),s.goal):NaN;
    const f=fields(cfg).find(x=>x.key===apply.dataset.cmdeApply);
    if(f&&Number.isFinite(value)){
      nativeSet(originalEl(f),value);
      setTimeout(()=>render(tool,cfg,s,rail,panel),80);
    }
  };
  const copyBtn=panel.querySelector("[data-cmde-copy]");
  if(copyBtn) copyBtn.onclick=async()=>{
    const value=copyBtn.dataset.shareUrl,status=copyBtn.querySelector("[data-cmde-copy-status]");
    let ok=false;
    try{if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(value);ok=true;}}catch(_){}
    if(!ok){
      const ta=document.createElement("textarea");ta.value=value;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();
      try{ok=document.execCommand("copy");}catch(_){}
      ta.remove();
    }
    if(status) status.textContent=ok?"Copied.":"Copy failed — try again.";
  };
}
let mountedTool=null;
function mount(){
  const tool=key(),cfg=C[tool];
  const existingRail=document.getElementById("cmde-rail"),existingPanel=document.getElementById(ROOT);
  if(!cfg){
    if(existingRail) existingRail.remove();
    if(existingPanel) existingPanel.remove();
    mountedTool=null;
    return;
  }
  const calc=document.querySelector(".universal-calc");
  if(!calc) return;
  if(existingRail&&existingPanel&&mountedTool===tool) return;
  if(existingRail) existingRail.remove();
  if(existingPanel) existingPanel.remove();

  const base=inputs(cfg),loaded=shared(tool,cfg,base);
  const s=loaded||{inputs:base,target:(cfg.targets[1]||cfg.targets[0])[0],goal:cfg.primary(base)};
  if(loaded){
    applyInputs(cfg,loaded.inputs);
    s.mode="solve";
  }else{
    s.mode=null;
  }

  calc.classList.add("cmde-enhanced");
  const rail=document.createElement("div");
  rail.id="cmde-rail";
  rail.className="cmde-rail";
  const panel=document.createElement("section");
  panel.id=ROOT;
  panel.className="cmde-inline";
  panel.hidden=true;
  calc.appendChild(rail);
  calc.appendChild(panel);
  mountedTool=tool;
  render(tool,cfg,s,rail,panel);

  const form=calc.querySelector("form");
  if(form&&!form.dataset.cmdeBound){
    form.dataset.cmdeBound="1";
    let timer=0;
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(mountedTool===tool&&document.body.contains(panel)&&s.mode) render(tool,cfg,s,rail,panel);},90);};
    form.addEventListener("input",refresh);
    form.addEventListener("change",refresh);
  }
}
const schedule=(ms=150)=>setTimeout(mount,ms);
["pushState","replaceState"].forEach(m=>{const o=history[m];if(!o||o.__cmde)return;const w=function(){const r=o.apply(this,arguments);schedule(180);return r;};w.__cmde=true;history[m]=w;});
addEventListener("popstate",()=>schedule(180));
addEventListener("load",()=>schedule(350));
if(document.readyState==="complete")schedule(180);else document.addEventListener("DOMContentLoaded",()=>schedule(300),{once:true});
})();