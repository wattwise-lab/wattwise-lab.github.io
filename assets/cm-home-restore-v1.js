(function homeAddon(){
  'use strict';
  const css = `
  .cm-home-restored .site-header,.cm-home-restored .hub-hero,.cm-home-restored .tool-directory,.cm-home-restored .workspace-promo{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
  .cm-home-restored .hub-hero{min-height:0!important;padding:30px 22px 28px!important}
  .cm-home-restored .hub-hero h1{font-family:inherit!important;font-size:clamp(30px,4vw,46px)!important;line-height:1.12!important;letter-spacing:-.038em!important;margin:12px 0 8px!important;font-weight:650!important}
  .cm-home-restored .hub-hero>p{font-size:clamp(13px,1.5vw,15px)!important;line-height:1.5!important;max-width:760px!important;margin:0!important}
  .cm-home-restored .hero-badge{padding:5px 10px!important;font-size:11px!important}
  .cm-home-restored .hero-search{height:51px!important;margin-top:14px!important;border-radius:13px!important;box-shadow:0 5px 14px #25375a10!important}
  .cm-home-restored .hero-proof{display:none!important}
  .cm-home-restored .workspace-promo{padding:14px 19px!important;margin-bottom:12px!important}
  .cm-home-restored .tool-directory{padding-top:28px!important;padding-bottom:55px!important}
  .cm-home-restored .directory-head{margin-bottom:16px!important}
  .cm-home-restored .tool-card-grid>a.hub-tool-card[hidden]{display:none!important}
  .cm-home-restored .cm-pagebar{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;margin:25px auto 10px;padding:12px 8px;font-size:14px;color:#526075}
  .cm-home-restored .cm-pagebar button{appearance:none;background:#fff;border:1px solid #bdcad2;border-radius:10px;color:#203e42;min-height:42px;padding:8px 18px;font:inherit;font-weight:650;cursor:pointer}
  .cm-home-restored .cm-pagebar button:disabled{cursor:default;opacity:.45}
  .cm-home-restored .cm-pagebar button:focus-visible,.cm-home-restored .category-menu a:focus-visible{outline:3px solid #2d8e86;outline-offset:3px}
  .cm-home-restored .cm-pagebar .cm-alltools{color:#165b55;font-weight:650;margin-left:8px}
  .cm-home-restored .category-menu a.cm-added-link{background:#eef7f2;color:#155f57;font-weight:700}
  .cm-home-restored .category-menu{max-width:calc(100vw - 32px)}
  @media(max-width:700px){.cm-home-restored .hub-hero{padding:22px 16px 20px!important}.cm-home-restored .hub-hero h1{font-size:clamp(26px,7vw,34px)!important;margin:8px 0!important}.cm-home-restored .hub-hero>p{font-size:13px!important}.cm-home-restored .hero-badge{display:none!important}.cm-home-restored .workspace-promo{margin:0 16px 12px!important;padding:13px 15px!important}.cm-home-restored .tool-directory{padding:19px 16px 45px!important}.cm-home-restored .cm-pagebar{gap:7px}.cm-home-restored .cm-pagebar button{padding:8px 11px}}
  `;
  function boot(){
    const hero=document.querySelector('.hub-hero');
    if(!hero||document.getElementById('cm-home-restoration-style'))return;
    document.documentElement.classList.add('cm-home-restored');
    const style=document.createElement('style');style.id='cm-home-restoration-style';style.textContent=css;document.head.append(style);
    const zh=/^zh/i.test(document.documentElement.lang||'');
    const labels=zh?{all:'全部 92 个计算器',merchant:'商家利润与广告预算',previous:'上一页',next:'下一页',show:(a,b,n)=>`显示 ${a}–${b} 项，共 ${n} 项`}:{all:'Browse all 92 calculators',merchant:'Merchant profit & ad budget',previous:'Previous',next:'Next',show:(a,b,n)=>`Showing ${a}–${b} of ${n}`};
    const menu=document.querySelector('.nav-categories');
    if(menu){
      const links=menu.querySelector('.category-menu');
      if(links&&!links.querySelector('.cm-added-link')){
        for(const [href,title] of [['/directory',labels.all],['/merchant-profit-planner',labels.merchant]]){
          const a=document.createElement('a');a.className='cm-added-link';a.href=href;a.textContent=title;links.append(a);
        }
      }
      const desktop=()=>window.matchMedia('(min-width: 701px)').matches;
      menu.addEventListener('mouseenter',()=>{if(desktop())menu.open=true;});
      menu.addEventListener('mouseleave',()=>{if(desktop()&&!menu.contains(document.activeElement))menu.open=false;});
      document.addEventListener('focusin',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
      document.addEventListener('pointerdown',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
      window.addEventListener('resize',()=>{if(!desktop())menu.open=false;});
    }
    const grid=document.querySelector('.tool-directory .tool-card-grid');
    if(!grid)return;
    const pager=document.createElement('nav');pager.className='cm-pagebar';pager.setAttribute('aria-label',zh?'计算器分页':'Calculator pages');
    const prev=document.createElement('button'),next=document.createElement('button'),position=document.createElement('span'),all=document.createElement('a');
    prev.type='button';next.type='button';prev.textContent=labels.previous;next.textContent=labels.next;
    position.setAttribute('aria-live','polite');all.className='cm-alltools';all.href='/directory';all.textContent=labels.all;
    pager.append(prev,position,next,all);grid.insertAdjacentElement('afterend',pager);
    let page=1,scheduled=false;
    const PAGE_SIZE=12;
    function render(){
      scheduled=false;
      if(!grid.isConnected)return;
      const cards=Array.from(grid.children).filter(n=>n.matches('a.hub-tool-card'));
      const pages=Math.max(1,Math.ceil(cards.length/PAGE_SIZE));page=Math.max(1,Math.min(page,pages));
      const first=(page-1)*PAGE_SIZE;
      cards.forEach((card,i)=>{card.hidden=i<first||i>=first+PAGE_SIZE;});
      prev.disabled=page===1;next.disabled=page===pages;
      position.textContent=labels.show(cards.length?first+1:0,Math.min(first+PAGE_SIZE,cards.length),cards.length)+` · ${page}/${pages}`;
      pager.hidden=cards.length===0;
    }
    function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
    prev.addEventListener('click',()=>{if(page>1){page--;render();grid.scrollIntoView({block:'start'});}});
    next.addEventListener('click',()=>{page++;render();grid.scrollIntoView({block:'start'});});
    const tabs=document.querySelector('.category-tabs');if(tabs)tabs.addEventListener('click',e=>{if(e.target.closest('button')){page=1;setTimeout(schedule,0);}});
    const search=document.querySelector('.hero-search input');if(search)search.addEventListener('input',()=>{page=1;setTimeout(schedule,0);});
    const mo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.target===grid)){page=1;schedule();}});
    mo.observe(grid,{childList:true});render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
