/* No storage, telemetry, parent messages, or transmission of calculator inputs. */
(() => {
 'use strict';
 const M=window.CMMerchant,C=window.CMMerchantCopy;
 const $=id=>document.getElementById(id), node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 let lang='en',currency='USD',state={...M.DEFAULTS};
 const preferences=M.parsePreferences(location.search,Object.keys(C),document.documentElement.lang||'en');lang=preferences.language;currency=preferences.currency;
 const t=k=>C[lang][k]??k;
 const pct=new Set(['discount','feeRate','refundRate','refundProduct','refundShipping','recovery','feeRecovery']);
 const core=['price','goods','shippingCost','shippingCharged','adCost','monthlyOrders','fixedCost','unitGoal'];
 const extra=Object.keys(M.FIELDS).filter(k=>!core.includes(k));
 const money=v=>v===null||!Number.isFinite(v)?'—':new Intl.NumberFormat(lang,{style:'currency',currency,currencyDisplay:'code',maximumFractionDigits:M.minorDigits(currency),minimumFractionDigits:M.minorDigits(currency)}).format(v);
 function render(){
  document.documentElement.lang=lang;document.documentElement.dir=['ar','ur'].includes(lang)?'rtl':'ltr';document.title=t('widgetTitle')+' | CalcMintly';
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));document.querySelectorAll('[data-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.aria)));
  $('language').value=lang;$('currency').value=currency;
  for(const [id,keys] of [['core',core],['extra',extra]]){
   const target=$(id);target.replaceChildren();
   for(const k of keys){const wrap=node('div'),label=node('label',t(k)+(pct.has(k)?' (%)':k==='monthlyOrders'?'':' ('+currency+')'));label.htmlFor='w-'+k;
    const inp=node('input');inp.id='w-'+k;inp.type='number';inp.required=true;inp.step=k==='monthlyOrders'?'1':'any';inp.min=M.FIELDS[k][0];inp.max=M.FIELDS[k][1];inp.inputMode=k==='monthlyOrders'?'numeric':'decimal';inp.value=Number.isFinite(state[k])?String(state[k]):'';inp.setAttribute('aria-describedby','widget-error');
    inp.addEventListener('input',()=>{state[k]=inp.value.trim()===''?NaN:Number(inp.value);update();});wrap.append(label,inp);target.append(wrap);
   }
  }
  $('full-tool').href='../merchant-profit-planner?lang='+encodeURIComponent(lang)+'&currency='+currency;
  update();
 }
 function update(){
  const r=M.calculate(state);const bad=new Set((r.errors??[]).map(e=>e.field));
  Object.keys(M.FIELDS).forEach(k=>$('w-'+k).setAttribute('aria-invalid',String(bad.has(k))));
  $('widget-error').textContent=r.ok?'':t('invalidResult');
  $('contribution').textContent=r.ok?money(r.afterAd):'—';
  $('adcap').textContent=!r.ok?'—':r.targetAd===null?t('noOrders'):r.targetAd<0?t('noAd'):money(M.floorMoney(r.targetAd,currency));
  $('monthly').textContent=r.ok?money(r.monthlyProfit):'—';
 }
 $('language').replaceChildren(...Object.keys(C).map(code=>{const o=node('option',C[code].localeName);o.value=code;return o;}));
 $('language').addEventListener('change',e=>{lang=e.target.value;render();});
 $('currency').addEventListener('change',e=>{currency=e.target.value;render();});
 $('reset').addEventListener('click',()=>{state={...M.DEFAULTS};render();$('w-price').focus();});
 render();
})();
