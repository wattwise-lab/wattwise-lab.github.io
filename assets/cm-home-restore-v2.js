(function homeAddon() {
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
  .cm-home-restored .directory-head h2{font-family:inherit!important;font-size:clamp(27px,3.1vw,37px)!important;font-weight:650!important;letter-spacing:-.034em!important;line-height:1.18!important}
  .cm-home-restored .hub-tool-card h3{font-family:inherit!important;letter-spacing:-.018em!important}
  .cm-home-restored .workspace-promo h2{font-family:inherit!important;font-size:17px!important;font-weight:650!important}
  .cm-home-restored .workspace-promo p{font-family:inherit!important;font-size:13px!important;line-height:1.45!important}
  .cm-home-restored .tool-card-grid{scroll-margin-top:90px}
  .cm-home-restored .mobile-nav a.cm-added-link{background:#edf7f1;color:#175b51;font-weight:700}
  .cm-home-restored .category-tabs button:focus-visible,.cm-home-restored .mobile-nav a:focus-visible{outline:3px solid #2d8e86;outline-offset:3px}
  @media(max-width:700px){.cm-home-restored .hub-hero{padding:22px 16px 20px!important}.cm-home-restored .hub-hero h1{font-size:clamp(26px,7vw,34px)!important;margin:8px 0!important}.cm-home-restored .hub-hero>p{font-size:13px!important}.cm-home-restored .hero-badge{display:none!important}.cm-home-restored .workspace-promo{margin:0 16px 12px!important;padding:13px 15px!important}.cm-home-restored .tool-directory{padding:19px 16px 45px!important}.cm-home-restored .cm-pagebar{gap:7px}.cm-home-restored .cm-pagebar button{padding:8px 11px}}
  @media(max-width:700px){.cm-home-restored .category-tabs{flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-x:contain;scrollbar-width:thin;gap:8px!important;margin:16px 0 18px!important;padding-bottom:8px!important}.cm-home-restored .category-tabs button{flex:0 0 auto!important;white-space:nowrap!important;min-height:38px!important}.cm-home-restored .directory-head h2{font-size:clamp(24px,6.5vw,29px)!important}.cm-home-restored .directory-head p{font-size:13px!important}.cm-home-restored .tool-card-grid{scroll-margin-top:75px}}
  `;
  function boot() {
    if (
      !document.querySelector('.hub-hero') ||
      document.querySelector('.tool-card-grid')?.dataset.cmCatalog === '20261030r2'
    )
      return;
    document.documentElement.classList.add('cm-home-restored');
    if (!document.getElementById('cm-home-restoration-style')) {
      const style = document.createElement('style');
      style.id = 'cm-home-restoration-style';
      style.textContent = css;
      document.head.append(style);
    }
    const script = document.createElement('script');
    script.src = '/assets/cm-home-directory.js?v=20261030r2';
    document.head.append(script);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
