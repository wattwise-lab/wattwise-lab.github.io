(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('embed')) {
    document.documentElement.classList.add('merchant-embedded');
    return;
  }
  const a = document.createElement('a');
  a.href = '/workspace?add=merchant-profit-planner';
  a.className = 'merchant-add-workspace';
  a.textContent = /^zh/.test(document.documentElement.lang)
    ? '＋ 添加到工作台'
    : '＋ Add to workspace';
  document.querySelector('.header-right')?.prepend(a);
})();
