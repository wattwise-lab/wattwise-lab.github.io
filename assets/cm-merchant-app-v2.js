(() => {
 'use strict';
 const M=window.CMMerchant, COPY=window.CMMerchantCopy;
 const KEY='calcmintly.merchant-profit.v1';
 let lang='zh-CN', dirty=false, timer=null, priceGoal='monthly', baseline=0;
 const $=id=>document.getElementById(id);
 const t=(key,vars={})=>Object.entries(vars).reduce((s,[k,v])=>s.replaceAll('{'+k+'}',String(v)),COPY[lang][key]??key);
 const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 const emit=event=>document.dispatchEvent(new CustomEvent('cm:merchant-event',{detail:{event,modelVersion:M.MODEL_VERSION,scenarioCount:state.scenarios.length}}));
 function demo(){return {version:1,modelVersion:M.MODEL_VERSION,currency:'USD',active:0,scenarios:[{...M.DEFAULTS},{...M.DEFAULTS,shippingCharged:0},{...M.DEFAULTS,discount:10}].map((x,i)=>({...x,name:COPY[lang].names[i],source:t('demoSource'),checked:''}))};}
 let preferred;try{preferred=localStorage.getItem('calcmintly-language-v2');}catch{}
 const system=navigator.language||'en';const fallback=Object.keys(COPY).includes(preferred)?preferred:(/^zh(?:-|$)/i.test(system)?'zh-CN':Object.keys(COPY).includes(system.split('-')[0])?system.split('-')[0]:'en');
 const preferences=M.parsePreferences(location.search,Object.keys(COPY),fallback);
 lang=preferences.language;
 let state=demo();state.currency=preferences.currency;let autoNames=[0,1,2],autoSources=[true,true,true];
 const active=()=>state.scenarios[state.active];
 const priceInputs=()=>priceGoal==='monthly'&&active().monthlyOrders>0?{...active(),unitGoal:active().monthlyGoal/active().monthlyOrders}:active();
 const pct=new Set(['discount','feeRate','refundRate','refundProduct','refundShipping','recovery','feeRecovery']);
 const hints={price:'priceHint',goods:'goodsHint',recovery:'recoveryHint',taxCollected:'taxHint',adCost:'adHint',unitGoal:'goalHint',fixedCost:'fixedHint'};
 const groups={
  'product-fields':['price','discount','goods','packaging','shippingCharged','shippingCost'],
  'payment-fields':['feeRate','feeFixed','refundRate'],
  'advanced-fields':['refundProduct','refundShipping','recovery','returnCost','feeRecovery','otherCost','taxCollected'],
  'goal-fields':['adCost','unitGoal','monthlyOrders','fixedCost','monthlyGoal']
 };
 function money(v,down=false){if(v===null||!Number.isFinite(v))return '—';return new Intl.NumberFormat(lang,{style:'currency',currency:state.currency,currencyDisplay:'code',minimumFractionDigits:M.minorDigits(state.currency),maximumFractionDigits:M.minorDigits(state.currency)}).format(down?M.floorMoney(v,state.currency):v);}
 function num(v){return v===null||!Number.isFinite(v)?'—':new Intl.NumberFormat(lang,{maximumFractionDigits:2}).format(v);}
 function status(key){$('live-status').textContent=t(key);}
 function markDirty(){dirty=true;$('dirty').textContent=t('dirty');}
 function renderEmbed(){
  $('embed-code').value='<iframe src="https://calcmintly.com/embed/merchant-profit?lang='+lang+'&currency='+state.currency+'" title="CalcMintly merchant profit calculator" width="100%" height="900" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="border:1px solid #d6e0e1;border-radius:12px"></iframe>';
 }
 function buildFields(){
  for(const [id,fields] of Object.entries(groups)){
   const box=$(id);box.replaceChildren();
   for(const k of fields){
    const w=node('div',undefined,'field'),l=node('label',t(k)+(pct.has(k)?' (%)':k==='monthlyOrders'?'':' ('+state.currency+')'));
    l.htmlFor='input-'+k;
    const input=node('input');input.id='input-'+k;input.type='number';input.inputMode=k==='monthlyOrders'?'numeric':'decimal';input.step=k==='monthlyOrders'?'1':'any';input.min=M.FIELDS[k][0];input.max=M.FIELDS[k][1];input.autocomplete='off';input.required=true;input.dataset.field=k;
    const e=node('p',undefined,'field-error');e.id='error-'+k;
    input.setAttribute('aria-describedby',e.id+(hints[k]?' hint-'+k:''));
    w.append(l,input,e);
    if(hints[k]){const h=node('small',t(hints[k]));h.id='hint-'+k;w.append(h);}
    input.addEventListener('input',()=>{active()[k]=input.value.trim()===''?NaN:Number(input.value);markDirty();update();clearTimeout(timer);timer=setTimeout(()=>{if(M.calculate(active()).ok)emit('calculation_completed');},600);});
    box.append(w);
   }
  }
 }
 function renderTabs(focus=false){
  const tabs=$('scenario-tabs');tabs.replaceChildren();
  state.scenarios.forEach((s,i)=>{
   const b=node('button',String.fromCharCode(65+i)+' · '+s.name);b.type='button';b.role='tab';b.id='scenario-tab-'+i;b.setAttribute('aria-controls','scenario-form');b.setAttribute('aria-selected',i===state.active?'true':'false');b.tabIndex=i===state.active?0:-1;
   b.addEventListener('click',()=>selectScenario(i,true));
   b.addEventListener('keydown',e=>{let to=i;if(e.key==='ArrowRight')to=(i+(['ar','ur'].includes(lang)?-1:1)+state.scenarios.length)%state.scenarios.length;else if(e.key==='ArrowLeft')to=(i+(['ar','ur'].includes(lang)?1:-1)+state.scenarios.length)%state.scenarios.length;else if(e.key==='Home')to=0;else if(e.key==='End')to=state.scenarios.length-1;else return;e.preventDefault();selectScenario(to,true);});tabs.append(b);
  });
  $('scenario-form').setAttribute('aria-labelledby','scenario-tab-'+state.active);
  $('duplicate').disabled=state.scenarios.length>=3;$('remove').disabled=state.scenarios.length<=1;
  if(focus)$('scenario-tab-'+state.active).focus();
 }
 function selectScenario(i,focus){clearTimeout(timer);timer=null;state.active=i;renderTabs(focus);fillFields();update();emit('scenario_compared');}
 function fillFields(){
  const s=active();for(const k of Object.keys(M.FIELDS))$('input-'+k).value=Number.isFinite(s[k])?String(s[k]):'';
  $('scenario-name').value=s.name;$('assumption-source').value=s.source;$('assumption-date').value=s.checked;$('currency').value=state.currency;
 }
 function staticText(){document.documentElement.lang=lang;document.documentElement.dir=['ar','ur'].includes(lang)?'rtl':'ltr';document.title=t('title')+' | CalcMintly';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));document.querySelectorAll('[data-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.aria)));$('language').value=lang;$('dirty').textContent=t(dirty?'dirty':'clean');}
 function fullRender(){if(!$('language').dataset.ready){$('language').replaceChildren(...Object.keys(COPY).map(code=>{const o=node('option',COPY[code].localeName);o.value=code;return o;}));$('language').dataset.ready='true';}staticText();renderEmbed();buildFields();renderTabs();fillFields();update();}
 function rows(id,data){const dl=$(id);dl.replaceChildren();for(const [label,value] of data){const row=node('div');row.append(node('dt',label),node('dd',value));dl.append(row);}}
 function cap(v){return v===null?t('noOrders'):v<0?t('noAd'):money(v,true);}
 function updateErrors(result){
  const errors=new Map((result.errors??[]).map(e=>[e.field,e]));
  for(const k of Object.keys(M.FIELDS)){
   const e=errors.get(k),inp=$('input-'+k);inp.setAttribute('aria-invalid',e?'true':'false');
   $('error-'+k).textContent=e?t(e.code==='number'?'blank':e.code,{lo:e.lo,hi:e.hi}):'';
  }
  const badName=!active().name.trim()||active().name.length>60;
  $('scenario-name').setAttribute('aria-invalid',badName?'true':'false');$('name-error').textContent=badName?t('badName'):'';
  const badDate=!M.validDate(active().checked)||!$('assumption-date').validity.valid;$('assumption-date').setAttribute('aria-invalid',String(badDate));$('date-error').textContent=badDate?t('badDate'):'';
 }
 function resultText(id,value,long=false){const n=$(id);n.textContent=value;n.classList.toggle('long',long);}
 function update(){
  const x=active(),r=M.calculate(x);updateErrors(r);$('invalid-banner').hidden=r.ok;
  if(!r.ok){
   for(const id of ['result-contribution','result-cap','result-monthly','target-orders','required-price'])resultText(id,'—');
   for(const id of ['summary-rows','sensitivity-rows','breakdown-rows'])$(id).replaceChildren();
   $('ad-status').textContent=t('review');$('ad-status').className='status-note bad';$('apply-price').disabled=true;$('cap-detail').textContent=t('capNote');
   comparison();return;
  }
  resultText('result-contribution',money(r.afterAd));resultText('result-cap',cap(r.targetAd),r.targetAd===null||r.targetAd<0);resultText('result-monthly',money(r.monthlyProfit));
  $('cap-detail').textContent=r.targetAd!==null&&r.targetAd<0?t('shortage')+' '+money(-r.targetAd)+' / '+t('quantity'):t('capNote');
  rows('summary-rows',[[t('beforeAd'),money(r.beforeAd)],[t('breakEven'),cap(r.breakEvenAd)],[t('afterFixed'),r.allocated===null?t('noOrders'):money(r.perOrderAfterFixed)],[t('monthlyCap'),cap(r.monthlyTargetAd)]]);
  const a=$('ad-status');a.className='status-note'+(r.adHeadroom!==null&&r.adHeadroom>=0?'':' bad');
  a.textContent=r.targetAd===null?t('noOrders'):r.targetAd<0?t('noAd'):t(r.adHeadroom>=0?'available':'over')+' · '+t('headroom')+' '+money(Math.abs(r.adHeadroom));
  resultText('target-orders',r.targetOrders===null?t('unreachable'):num(r.targetOrders)+' '+t('quantity'),r.targetOrders===null);
  const priceData=priceInputs(), priceResult=M.calculate(priceData), price=M.actionablePrice(priceData,state.currency);
  resultText('required-price',price===null?t(priceResult.priceReason==='orders'?'noOrders':priceResult.priceReason==='range'?'priceOutOfRange':'priceImpossible'):money(price),price===null);$('apply-price').disabled=price===null;
  rows('sensitivity-rows',M.sensitivity(x).map(s=>[t(s.field==='shippingCost'?'shippingShock':s.field==='adCost'?'adShock':'refundShock',{n:num(s.change)}),money(s.delta)]));
  rows('breakdown-rows',[[t('grossRevenue'),money(r.grossRevenue)],[t('refundRevenue'),money(-r.refundRevenue)],[t('goods'),money(-x.goods)],[t('recoveredGoods'),money(r.recoveredGoods)],[t('packaging'),money(-x.packaging)],[t('shippingCost'),money(-x.shippingCost)],[t('otherCost'),money(-x.otherCost)],[t('processing'),money(-r.processing)],[t('returnedFees'),money(r.returnedFees)],[t('returnHandling'),money(-r.returnHandling)],[t('beforeAdRow'),money(r.beforeAd)],[t('adCost'),money(-x.adCost)],[t('afterAdRow'),money(r.afterAd)]]);
  comparison();
 }
 function comparison(){
  const out=state.scenarios.map(s=>M.calculate(s)),table=$('comparison');table.replaceChildren();
  const thead=node('thead'),head=node('tr');const first=node('th',t('metric'));first.scope='col';head.append(first);
  state.scenarios.forEach((s,i)=>{const n=node('th',String.fromCharCode(65+i)+' · '+s.name);n.scope='col';head.append(n);});thead.append(head);table.append(thead);
  const tbody=node('tbody');
  const metrics=[['price',(s,r)=>money(s.price)],['discount',(s,r)=>num(s.discount)+'%'],['shippingCharged',(s,r)=>money(s.shippingCharged)],['monthlyOrders',(s,r)=>num(s.monthlyOrders)],['contribution',(s,r)=>money(r.afterAd)],['cap',(s,r)=>cap(r.targetAd)],['monthly',(s,r)=>money(r.monthlyProfit)],['targetOrders',(s,r)=>r.targetOrders===null?t('unreachable'):num(r.targetOrders)]];
  for(const [label,fn] of metrics){const row=node('tr'),h=node('th',t(label));h.scope='row';row.append(h);out.forEach((r,i)=>row.append(node('td',r.ok?fn(state.scenarios[i],r):t('review'))));tbody.append(row);}table.append(tbody);
  renderDecisionExtras(out);
  $('compare-count').textContent=t('compareCount',{n:state.scenarios.length});
  if(out.some(r=>!r.ok))$('compare-message').textContent=t('scenarioInvalid');
  else {const highest=Math.max(...out.map(r=>r.monthlyProfit)),wins=out.flatMap((r,i)=>Math.abs(r.monthlyProfit-highest)<1e-8?[i]:[]);$('compare-message').textContent=wins.length===1?t('winner',{name:state.scenarios[wins[0]].name}):t('tie');}
 }
 function renderDecisionExtras(out){
  baseline=Math.min(baseline,state.scenarios.length-1);
  const select=$('baseline-select'),wasFocused=document.activeElement===select;
  select.replaceChildren();
  state.scenarios.forEach((s,i)=>{const o=node('option',String.fromCharCode(65+i)+' · '+s.name);o.value=String(i);select.append(o);});
  select.value=String(baseline);if(wasFocused)select.focus();
  const box=$('parity-results');box.replaceChildren();
  state.scenarios.forEach((s,i)=>{
   if(i===baseline)return;
   const r=M.matchScenario(state.scenarios[baseline],s),card=node('article',undefined,'parity-card');
   card.append(node('h3',String.fromCharCode(65+i)+' · '+s.name));
   if(!r.ok)card.append(node('p',t('review')));
   else if(r.kind!=='minimum')card.append(node('p',t(r.kind==='range'?'parityRange':'parityNonpositive')));
   else {card.append(node('small',t('parityOrders')),node('strong',num(r.orders)+' '+t('quantity')));
    card.append(node('p',r.uplift===null?t('parityZero'):t('parityChange')+': '+(r.delta>0?'+':'')+num(r.delta)+' · '+(r.uplift>0?'+':'')+num(r.uplift)+'%'));}
   box.append(card);
  });
  if(state.scenarios.length===1)box.append(node('p',t('parityOne')));
  $('parity-warning').hidden=!(out[baseline].ok&&out[baseline].monthlyProfit<0);$('parity-warning').textContent=t('parityLoss');
  const grid=$('scenario-grid');grid.replaceChildren();const values=M.scenarioGrid(active());
  if(!values.length){const c=node('caption',t('review'));grid.append(c);return;}
  const head=node('thead'),tr=node('tr'),first=node('th',t('gridPrice'));first.scope='col';tr.append(first);
  values[0].cells.forEach(c=>{const h=node('th',num(c.orders)+' '+t('gridOrders'));h.scope='col';tr.append(h);});head.append(tr);grid.append(head);
  const body=node('tbody');values.forEach(row=>{const tr=node('tr'),h=node('th',money(row.price));h.scope='row';tr.append(h);row.cells.forEach(c=>{const cell=node('td',c.ok?money(c.profit):t('notAvailable'));if(c.ok&&c.profit<0)cell.className='negative';tr.append(cell);});body.append(tr);});grid.append(body);
 }
 function safePlan(){try{if(!$('assumption-date').validity.valid)throw new Error('Invalid date');return M.cleanPlan(state);}catch{status('saveInvalid');return null;}}
 function replacePlan(p){clearTimeout(timer);timer=null;state=M.cleanPlan(p);autoNames=state.scenarios.map(()=>null);autoSources=state.scenarios.map(()=>false);baseline=0;dirty=false;fullRender();}
 $('baseline-select').addEventListener('change',e=>{baseline=Number(e.target.value);update();status('baselineChanged');emit('scenario_compared');});
 $('language').addEventListener('change',e=>{lang=e.target.value;try{localStorage.setItem('calcmintly-language-v2',lang);const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState({},'',u.href);}catch{}state.scenarios.forEach((s,i)=>{if(autoNames[i]!==null)s.name=COPY[lang].names[autoNames[i]];if(autoSources[i])s.source=t('demoSource');});fullRender();$('live-status').textContent='';});
 $('currency').addEventListener('change',e=>{if(!window.confirm(t('currencyConfirm'))){e.target.value=state.currency;return;}state.currency=e.target.value;markDirty();fullRender();});
 $('scenario-name').addEventListener('input',e=>{autoNames[state.active]=null;active().name=e.target.value;markDirty();renderTabs();update();});
 $('assumption-source').addEventListener('input',e=>{autoSources[state.active]=false;active().source=e.target.value;markDirty();});
 $('assumption-date').addEventListener('input',e=>{const invalid=!e.target.validity.valid;active().checked=invalid?'INVALID_DATE':e.target.value;e.target.setAttribute('aria-invalid',String(invalid));$('date-error').textContent=invalid?t('badDate'):'';markDirty();});
 $('duplicate').addEventListener('click',()=>{if(state.scenarios.length>=3){status('limit');return;}state.scenarios.push({...active(),name:(active().name+' · '+t('newName')).slice(0,60)});autoNames.push(null);autoSources.push(false);state.active=state.scenarios.length-1;markDirty();fullRender();$('scenario-settings').open=true;$('scenario-name').focus();$('scenario-name').select();emit('scenario_created');});
 $('remove').addEventListener('click',()=>{if(state.scenarios.length<=1||!window.confirm(t('removeConfirm')))return;if(state.active<baseline)baseline--;else if(state.active===baseline)baseline=0;autoNames.splice(state.active,1);autoSources.splice(state.active,1);state.scenarios.splice(state.active,1);state.active=Math.min(state.active,state.scenarios.length-1);markDirty();fullRender();$('scenario-tab-'+state.active).focus();});
 $('sample').addEventListener('click',()=>{if(dirty&&!window.confirm(t('sampleConfirm')))return;clearTimeout(timer);timer=null;state=demo();autoNames=[0,1,2];autoSources=[true,true,true];baseline=0;dirty=false;fullRender();status('resetStatus');emit('example_loaded');});
 $('apply-price').addEventListener('click',()=>{const p=M.actionablePrice(priceInputs(),state.currency);if(p===null)return;active().price=p;markDirty();fillFields();update();$('input-price').focus();status('applied');emit('reverse_price_applied');});
 $('price-goal-mode').addEventListener('change',e=>{priceGoal=e.target.value;update();emit('reverse_target_changed');});
 $('save').addEventListener('click',()=>{const p=safePlan();if(!p)return;try{localStorage.setItem(KEY,JSON.stringify(p));autoNames=state.scenarios.map(()=>null);autoSources=state.scenarios.map(()=>false);dirty=false;$('dirty').textContent=t('clean');status('saved');emit('plan_saved');}catch{status('storageError');}});
 $('restore').addEventListener('click',()=>{try{const raw=localStorage.getItem(KEY);if(!raw){status('noneSaved');return;}const p=JSON.parse(raw);if(M.validatePlan(p).length){status('invalidImport');return;}if(dirty&&!window.confirm(t('restoreConfirm')))return;replacePlan(p);status('restored');emit('plan_restored');}catch{status('storageError');}});
 $('clear').addEventListener('click',()=>{if(!window.confirm(t('clearConfirm')))return;try{localStorage.removeItem(KEY);markDirty();status('cleared');}catch{status('storageError');}});
 function download(name,body){const url=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'})),a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('export').addEventListener('click',()=>{const p=safePlan();if(!p)return;download('calcmintly-merchant-plan.json',JSON.stringify(p,null,2));status('exported');emit('plan_exported');});
 $('import').addEventListener('click',()=>$('import-file').click());
 $('import-file').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>102400){status('maxFile');return;}try{const p=JSON.parse(await f.text());if(M.validatePlan(p).length){status('invalidImport');return;}if(!window.confirm(t('importConfirm')))return;replacePlan(p);markDirty();status('imported');emit('plan_imported');}catch{status('invalidImport');}});
 $('copy').addEventListener('click',async()=>{const p=safePlan();if(!p)return;const lines=[t('title')+' — '+p.currency,t('compareNote'),...p.scenarios.map(s=>{const r=M.calculate(s);return s.name+' | '+t('contribution')+': '+money(r.afterAd)+' | '+t('cap')+': '+cap(r.targetAd)+' | '+t('monthly')+': '+money(r.monthlyProfit);}),t('scope')];const text=lines.join('\n');try{await navigator.clipboard.writeText(text);status('copied');emit('comparison_summary_copied');}catch{$('manual-copy').value=text;$('copy-dialog').showModal();$('manual-copy').focus();$('manual-copy').select();status('copyFailed');}});
 const clearCopy=()=>{$('manual-copy').value='';$('copy').focus();};
 $('close-dialog').addEventListener('click',()=>{clearCopy();$('copy-dialog').close();});$('copy-dialog').addEventListener('close',clearCopy);$('copy-dialog').addEventListener('cancel',clearCopy);
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 fullRender();
 try{if(localStorage.getItem(KEY))status('found');}catch{status('storageError');}
})();
