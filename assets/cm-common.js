/* Strict list parsing shared by old and new statistics tools. */
var CMData = (() => {
  'use strict';
  function digits(value) {
    return String(value)
      .replace(/[٠-٩۰-۹०-९০-৯౦-౯]/g, (char) => {
        for (const zero of [0x660, 0x6f0, 0x966, 0x9e6, 0xc66]) {
          const n = char.codePointAt(0) - zero;
          if (n >= 0 && n <= 9) return String(n);
        }
        return char;
      })
      .replaceAll('٫', '.')
      .replaceAll('٬', '')
      .replaceAll('−', '-');
  }
  function list(source) {
    const tokens = digits(source)
      .trim()
      .split(/[\s,;，；]+/)
      .filter(Boolean);
    if (tokens.length < 1 || tokens.length > 1000)
      throw Error('Enter 1–1000 numbers.|请输入 1–1000 个数。');
    const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    if (!tokens.every((token) => decimal.test(token)))
      throw Error(
        'Every item must be a complete decimal number. Separate values with spaces, commas or semicolons.|每一项须为完整十进制数，以空格、逗号或分号分隔。',
      );
    const values = tokens.map(Number);
    if (!values.every(Number.isFinite))
      throw Error('Every number must be finite.|所有数值须为有限数字。');
    return values;
  }
  function displayNumber(source, locale = 'en') {
    let text = String(source).replace(/[\u061c\u200e\u200f]/g, '');
    const parts = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale).formatToParts(
        1234567.89,
      ),
      group = parts.find((p) => p.type === 'group')?.value,
      decimal = parts.find((p) => p.type === 'decimal')?.value;
    if (group) text = text.replaceAll(group, '');
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    text = digits(text);
    const matches = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g) || [];
    if (matches.length !== 1 || /NaN|Infinity|∞/.test(text)) return null;
    const value = Number(matches[0]);
    return Number.isFinite(value) ? value : null;
  }
  function expression(source, locale = 'en') {
    let text = digits(source);
    const decimal = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale)
      .formatToParts(1.1)
      .find((p) => p.type === 'decimal')?.value;
    if (decimal && decimal !== '.') text = text.replaceAll(decimal, '.');
    return text;
  }
  return { digits, list, displayNumber, expression };
})();

;
var CMFormState = (() => {
  "use strict";
  const ignored = /* @__PURE__ */ new Set(["language", "cm-site-language", "ws-language"]);
  function control(value) {
    return value instanceof HTMLInputElement || value instanceof HTMLSelectElement || value instanceof HTMLTextAreaElement;
  }
  function capture(root, ids) {
    const elements = ids ? ids.map((id) => root.querySelector("#" + CSS.escape(id))) : [...root.querySelectorAll("input[id],select[id],textarea[id]")];
    return elements.filter(control).filter((e) => !ignored.has(e.id) && e.type !== "file").map((e) => ({
      id: e.id,
      value: e.value,
      ...e instanceof HTMLInputElement && ["radio", "checkbox"].includes(e.type) ? { checked: e.checked } : {}
    }));
  }
  function restore(root, saved, emit = true) {
    const changed = [];
    for (const item of saved) {
      const e = root.querySelector("#" + CSS.escape(item.id));
      if (!control(e) || e.type === "file" || ignored.has(e.id)) continue;
      e.value = item.value;
      if (typeof item.checked === "boolean" && e instanceof HTMLInputElement)
        e.checked = item.checked;
      changed.push(e);
    }
    if (emit)
      for (const e of changed) {
        e.dispatchEvent(new Event("input", { bubbles: true }));
        e.dispatchEvent(new Event("change", { bubbles: true }));
      }
  }
  return { capture, restore };
})();

;
(function (root) {
  'use strict';
  const locales = [
    'en',
    'zh-CN',
    'hi',
    'es',
    'ar',
    'fr',
    'bn',
    'pt',
    'id',
    'ur',
    'ru',
    'de',
    'ja',
    'pcm',
    'mr',
    'vi',
    'te',
    'sw',
    'ha',
    'tr',
  ];
  function normalize(value) {
    return (
      locales.find((locale) => locale.toLowerCase() === String(value || '').toLowerCase()) || null
    );
  }
  function sourcePath(pathname) {
    const bits = pathname.split('/').filter(Boolean);
    if (normalize(bits[0])) bits.shift();
    if (bits.at(-1) === 'index.html') bits.pop();
    const result = '/' + bits.join('/');
    return result.replace(/\.html$/, '') || '/';
  }
  function path(pathname, locale) {
    const source = sourcePath(pathname),
      prefix = normalize(locale) || 'en';
    return (prefix === 'en' ? '' : '/' + prefix.toLowerCase()) + (source === '/' ? '/' : source);
  }
  function url(input, locale, origin) {
    const value = new URL(input, origin);
    if (value.origin !== origin || !/^https?:$/.test(value.protocol)) return input;
    const source = sourcePath(value.pathname);
    if (/^\/(?:assets|_next)(?:\/|$)/.test(source) || /\.[a-z0-9]+$/i.test(source))
      return value.pathname + value.search + value.hash;
    const embedded = source.startsWith('/embed/') || value.searchParams.has('embed');
    value.pathname = embedded ? source : path(source, locale);
    value.searchParams.delete('lang');
    if (embedded && locale !== 'en') value.searchParams.set('lang', normalize(locale) || 'en');
    return value.pathname + value.search + value.hash;
  }
  root.CMLocaleRoutes = { locales, normalize, sourcePath, path, url };
})(typeof window === 'undefined' ? globalThis : window);

;
(function (root) {
  'use strict';
  const titleParts = [
    'Free online calculator',
    'Results and formulas',
    'Worked examples',
    'Local calculation',
    'Editable inputs',
    'No account required',
  ];
  const descriptionParts = [
    'Calculate directly in your browser.',
    'No account is required.',
    'Check your inputs and units.',
    'Review the formula and limitations.',
    'See a worked example.',
    'Compare editable assumptions.',
    'Use this tool on a phone, tablet or desktop.',
    'Explore the full calculator library.',
    'Free to use.',
    'Local calculation.',
    'Available free of charge.',
  ];
  function shorten(value, limit) {
    if (value.length <= limit) return value;
    const clipped = value.slice(0, limit - 1);
    const space = clipped.lastIndexOf(' ');
    return (space > limit * 0.7 ? clipped.slice(0, space) : clipped).trimEnd() + '…';
  }
  function fit(base, additions, minimum, maximum, separator) {
    let states = new Map([[base.length, base]]);
    for (const addition of additions) {
      for (const [, text] of [...states]) {
        const next = text + separator + addition;
        if (next.length <= maximum && !states.has(next.length)) states.set(next.length, next);
      }
    }
    const found = [...states]
      .filter(([length]) => length >= minimum && length <= maximum)
      .sort(
        ([a], [b]) => Math.abs(a - (minimum + maximum) / 2) - Math.abs(b - (minimum + maximum) / 2),
      );
    return found[0]?.[1] || base;
  }
  function forPage(name, purpose, translate = (value) => value, locale = 'en') {
    const brand = ' | CalcMintly',
      limit = 60 - brand.length;
    const shortName = shorten(name, limit);
    const title =
      fit(shortName, titleParts.map(translate), 50 - brand.length, limit, ' · ') + brand;
    const cleanPurpose = purpose.trim().replace(/[。.!]+$/, '');
    const east = ['zh-CN', 'ja'].includes(locale);
    let base = name + (east ? '。' : '. ') + cleanPurpose + (east ? '。' : '.');
    if (base.length > 160)
      base =
        cleanPurpose.length <= 155
          ? cleanPurpose + (east ? '。' : '.')
          : name + (east ? '。' : '.');
    base = shorten(base, 155);
    const description = fit(base, descriptionParts.map(translate), 150, 160, east ? '' : ' ');
    return { title, description };
  }
  root.CMMetadata = { forPage, titleParts, descriptionParts };
})(typeof window === 'undefined' ? globalThis : window);

;
window.CMInfoMetadata = {
  '/': {
    title: 'Free Online Calculators for Everyday Life | CalcMintly',
    description:
      'Explore 500 free calculators for everyday maths, finance, health and conversions. Use a real keypad, compare tools in one workspace and check the formulas.',
  },
  '/directory': {
    title: 'All 500 Free Calculators: Browse the Library | CalcMintly',
    description:
      'Browse 500 CalcMintly calculators by name, topic or problem. Find everyday keypads, finance and health estimates, technical tools and original planning models.',
  },
  '/workspace': {
    title: 'Calculator Workspace: Compare Four Tools | CalcMintly',
    description:
      'Add up to four calculators, edit their inputs and compare results side by side. Find tools quickly, connect compatible units and save or share a tool layout.',
  },
  '/ranking': {
    title: '500 Calculator Picks and Device Usage Order | CalcMintly',
    description:
      'Explore an editorial selection of 500 calculators. Optional usage counts come only from this browser; this page does not claim a worldwide popularity ranking.',
  },
  '/about': {
    title: 'About CalcMintly: Free Calculators and Clear Methods',
    description:
      'Learn how CalcMintly builds 500 free calculators, documents formulas and limitations, and keeps tools useful through clear interfaces and reproducible checks.',
  },
  '/methodology': {
    title: 'Calculation Methods, Sources and Limitations | CalcMintly',
    description:
      'Read how CalcMintly selects formulas, states input units, checks worked examples and documents assumptions. Review sources and limitations before using results.',
  },
  '/privacy': {
    title: 'Privacy Policy, Local Data and Browser Storage | CalcMintly',
    description:
      'Read how CalcMintly handles calculator inputs, browser storage and hosting logs. Learn what shared links include and how to clear browser’s saved site data.',
  },
  '/terms': {
    title: 'Terms of Use, Estimates and Site Limitations | CalcMintly',
    description:
      'Review the terms for using CalcMintly, including estimate accuracy, financial and health limitations, permitted use and how to report a problem with the site.',
  },
  '/contact': {
    title: 'Contact CalcMintly: Support, Feedback and Corrections',
    description:
      'Learn to report a calculator error, send feedback or ask about CalcMintly. Include the tool, assumptions and reproducible steps without sharing sensitive data.',
  },
  '/updates': {
    title: 'CalcMintly Updates: Calculators, Fixes and New Features',
    description:
      'Follow CalcMintly releases, calculator additions and fixes. Review changes to the shared interface, workspace, formulas and language support across the site.',
  },
  '/404': {
    title: 'Page Not Found: Explore 500 Free Calculators | CalcMintly',
    description:
      'This address could not be found. Return to the CalcMintly homepage, browse 500 calculators or open your workspace to find a useful tool and continue working.',
  },
};

;
window.CMHomeCopy = {"en":{"heading":"Calculators","intro":"500 tools. Find yours by name or task.","search":"Search a name or task: mortgage, profit, unit conversion…","searchLabel":"Search calculators","all":"All calculators","categories":"Categories","results":"Calculators","count":"{start}–{end} of {count} tools","clear":"Clear","sort":"Sort results","recommended":"Recommended","alphabetical":"Name A–Z","previous":"Previous","next":"Next","page":"Page {page} of {pages}","none":"No matching calculators","try":"Try a shorter search or a different category.","reset":"Reset filters","merchant":"Merchant profit","workspace":"Workspace","menu":"Menu","privacy":"Privacy","updates":"Updates","methods":"Methodology","note":"Local calculations. Results are estimates, not professional advice.","new":"New","skip":"Skip to calculators","domains":{"Finance":"Finance","Business":"Business","Health":"Health","Converters":"Converters","Home and Everyday":"Home and Everyday","Math and Time":"Math and Time","AI and Work-life":"AI and Work-life","Science":"Science","Digital and Technology":"Digital and Technology"},"countOne":"{start}–{end} of {count} tool"},"zh-CN":{"heading":"计算器","intro":"500 个工具，按名称或用途查找","search":"搜索名称或用途，例如 房贷、利润、单位换算…","searchLabel":"搜索计算器","all":"全部计算器","categories":"工具分类","results":"计算器","count":"第 {start}–{end} 项，共 {count} 个","clear":"清除","sort":"排列方式","recommended":"推荐排序","alphabetical":"名称排序","previous":"上一页","next":"下一页","page":"第 {page} / {pages} 页","none":"没有找到匹配的计算器","try":"试试更短的关键词，或切换分类","reset":"重置筛选","merchant":"商家利润","workspace":"工作台","menu":"菜单","privacy":"隐私说明","updates":"更新记录","methods":"计算方法","note":"在浏览器本地计算，结果仅供估算，不代替专业意见","new":"新","skip":"跳至计算器","domains":{"Finance":"金融与储蓄","Business":"商业与利润","Health":"健康与运动","Converters":"单位与货币换算","Home and Everyday":"家居与生活","Math and Time":"数学与日期","AI and Work-life":"AI 与工作","Science":"科学与工程","Digital and Technology":"数字与技术"},"countOne":"第 {start}–{end} 项，共 {count} 个"},"ja":{"heading":"計算ツール","intro":"500 ツール。名前や用途で探す","search":"名前や用途を検索：住宅ローン、利益、単位換算…","searchLabel":"計算ツールを検索","all":"すべてのツール","categories":"カテゴリー","results":"計算ツール","count":"{count} 件中 {start}–{end} 件","clear":"クリア","sort":"並べ替え","recommended":"おすすめ順","alphabetical":"名前順","previous":"前へ","next":"次へ","page":"{page} / {pages} ページ","none":"一致するツールがありません","try":"短いキーワードか別のカテゴリーをお試しください","reset":"絞り込みを解除","merchant":"販売利益","workspace":"ワークスペース","menu":"メニュー","privacy":"プライバシー","updates":"更新履歴","methods":"計算方法","note":"ブラウザ内で計算します。結果は目安で、専門的助言ではありません。","new":"新着","skip":"ツールへ移動","domains":{"Finance":"金融・貯蓄","Business":"ビジネス・利益","Health":"健康・運動","Converters":"単位・通貨換算","Home and Everyday":"暮らし・住まい","Math and Time":"数学・日付","AI and Work-life":"AI・仕事","Science":"科学・工学","Digital and Technology":"デジタル・技術"},"countOne":"{count} 件中 {start}–{end} 件"},"es":{"heading":"Calculadoras","intro":"500 herramientas. Busca por nombre o tarea.","search":"Buscar hipoteca, beneficios, conversión de unidades…","searchLabel":"Buscar calculadoras","all":"Todas las calculadoras","categories":"Categorías","results":"Calculadoras","count":"{start}–{end} de {count} herramientas","clear":"Borrar","sort":"Ordenar","recommended":"Recomendadas","alphabetical":"Nombre A–Z","previous":"Anterior","next":"Siguiente","page":"Página {page} de {pages}","none":"No hay coincidencias","try":"Prueba una búsqueda más corta u otra categoría.","reset":"Restablecer filtros","merchant":"Beneficio comercial","workspace":"Espacio de trabajo","menu":"Menú","privacy":"Privacidad","updates":"Novedades","methods":"Metodología","note":"Cálculos locales. Los resultados son estimaciones, no asesoramiento profesional.","new":"Nuevo","skip":"Ir a las calculadoras","domains":{"Finance":"Finanzas","Business":"Negocios","Health":"Salud","Converters":"Conversores","Home and Everyday":"Hogar y vida diaria","Math and Time":"Matemáticas y fechas","AI and Work-life":"IA y trabajo","Science":"Ciencia","Digital and Technology":"Tecnología digital"},"countOne":"{start}–{end} de {count} herramienta"},"fr":{"heading":"Calculatrices","intro":"500 outils. Recherchez par nom ou par besoin.","search":"Rechercher prêt, bénéfice, conversion…","searchLabel":"Rechercher des calculatrices","all":"Toutes les calculatrices","categories":"Catégories","results":"Calculatrices","count":"{start}–{end} sur {count} outils","clear":"Effacer","sort":"Trier","recommended":"Sélection","alphabetical":"Nom A–Z","previous":"Précédent","next":"Suivant","page":"Page {page} sur {pages}","none":"Aucun résultat","try":"Essayez un terme plus court ou une autre catégorie.","reset":"Réinitialiser les filtres","merchant":"Bénéfice commercial","workspace":"Espace de travail","menu":"Menu","privacy":"Confidentialité","updates":"Nouveautés","methods":"Méthodologie","note":"Calculs locaux. Les résultats sont des estimations, pas des conseils professionnels.","new":"Nouveau","skip":"Aller aux calculatrices","domains":{"Finance":"Finance","Business":"Entreprise","Health":"Santé","Converters":"Conversions","Home and Everyday":"Maison et quotidien","Math and Time":"Maths et dates","AI and Work-life":"IA et travail","Science":"Sciences","Digital and Technology":"Numérique et technologie"},"countOne":"{start}–{end} sur {count} outil"},"de":{"heading":"Rechner","intro":"500 Tools. Nach Name oder Aufgabe suchen.","search":"Kredit, Gewinn, Einheiten suchen…","searchLabel":"Rechner suchen","all":"Alle Rechner","categories":"Kategorien","results":"Rechner","count":"{start}–{end} von {count} Tools","clear":"Löschen","sort":"Sortieren","recommended":"Empfohlen","alphabetical":"Name A–Z","previous":"Zurück","next":"Weiter","page":"Seite {page} von {pages}","none":"Keine passenden Rechner","try":"Versuchen Sie einen kürzeren Begriff oder eine andere Kategorie.","reset":"Filter zurücksetzen","merchant":"Händlergewinn","workspace":"Arbeitsbereich","menu":"Menü","privacy":"Datenschutz","updates":"Neuigkeiten","methods":"Methodik","note":"Lokale Berechnungen. Ergebnisse sind Schätzungen, keine professionelle Beratung.","new":"Neu","skip":"Zu den Rechnern","domains":{"Finance":"Finanzen","Business":"Geschäft","Health":"Gesundheit","Converters":"Umrechner","Home and Everyday":"Haushalt und Alltag","Math and Time":"Mathematik und Zeit","AI and Work-life":"KI und Arbeit","Science":"Wissenschaft","Digital and Technology":"Digitaltechnik"},"countOne":"{start}–{end} von {count} Tool"},"pt":{"heading":"Calculadoras","intro":"500 ferramentas. Pesquise por nome ou tarefa.","search":"Pesquisar empréstimo, lucro, conversão…","searchLabel":"Pesquisar calculadoras","all":"Todas as calculadoras","categories":"Categorias","results":"Calculadoras","count":"{start}–{end} de {count} ferramentas","clear":"Limpar","sort":"Ordenar","recommended":"Recomendadas","alphabetical":"Nome A–Z","previous":"Anterior","next":"Próxima","page":"Página {page} de {pages}","none":"Nenhuma correspondência","try":"Tente um termo mais curto ou outra categoria.","reset":"Redefinir filtros","merchant":"Lucro comercial","workspace":"Área de trabalho","menu":"Menu","privacy":"Privacidade","updates":"Atualizações","methods":"Metodologia","note":"Cálculos locais. Os resultados são estimativas, não aconselhamento profissional.","new":"Novo","skip":"Ir às calculadoras","domains":{"Finance":"Finanças","Business":"Negócios","Health":"Saúde","Converters":"Conversores","Home and Everyday":"Casa e cotidiano","Math and Time":"Matemática e datas","AI and Work-life":"IA e trabalho","Science":"Ciência","Digital and Technology":"Tecnologia digital"},"countOne":"{start}–{end} de {count} ferramenta"},"id":{"heading":"Kalkulator","intro":"500 alat. Cari berdasarkan nama atau kebutuhan.","search":"Cari pinjaman, laba, konversi satuan…","searchLabel":"Cari kalkulator","all":"Semua kalkulator","categories":"Kategori","results":"Kalkulator","count":"{start}–{end} dari {count} alat","clear":"Hapus","sort":"Urutkan","recommended":"Rekomendasi","alphabetical":"Nama A–Z","previous":"Sebelumnya","next":"Berikutnya","page":"Halaman {page} dari {pages}","none":"Tidak ada hasil yang cocok","try":"Coba kata yang lebih singkat atau kategori lain.","reset":"Atur ulang filter","merchant":"Laba pedagang","workspace":"Ruang kerja","menu":"Menu","privacy":"Privasi","updates":"Pembaruan","methods":"Metodologi","note":"Perhitungan lokal. Hasil adalah perkiraan, bukan saran profesional.","new":"Baru","skip":"Ke kalkulator","domains":{"Finance":"Keuangan","Business":"Bisnis","Health":"Kesehatan","Converters":"Konversi","Home and Everyday":"Rumah dan keseharian","Math and Time":"Matematika dan waktu","AI and Work-life":"AI dan kerja","Science":"Sains","Digital and Technology":"Digital dan teknologi"},"countOne":"{start}–{end} dari {count} alat"},"ru":{"heading":"Калькуляторы","intro":"500 инструмента. Поиск по названию или задаче.","search":"Кредит, прибыль, перевод единиц…","searchLabel":"Поиск калькуляторов","all":"Все калькуляторы","categories":"Категории","results":"Калькуляторы","count":"{start}–{end} из {count}","clear":"Очистить","sort":"Сортировка","recommended":"Рекомендуемые","alphabetical":"По названию","previous":"Назад","next":"Далее","page":"Страница {page} из {pages}","none":"Ничего не найдено","try":"Попробуйте более короткий запрос или другую категорию.","reset":"Сбросить фильтры","merchant":"Прибыль продавца","workspace":"Рабочая область","menu":"Меню","privacy":"Конфиденциальность","updates":"Обновления","methods":"Методология","note":"Расчёты выполняются локально. Результаты — оценки, а не профессиональные рекомендации.","new":"Новое","skip":"К калькуляторам","domains":{"Finance":"Финансы","Business":"Бизнес","Health":"Здоровье","Converters":"Конвертеры","Home and Everyday":"Дом и быт","Math and Time":"Математика и даты","AI and Work-life":"ИИ и работа","Science":"Наука","Digital and Technology":"Цифровые технологии"},"countOne":"{start}–{end} из {count}"},"ar":{"heading":"الحاسبات","intro":"500 أداة. ابحث بالاسم أو المهمة.","search":"ابحث عن القروض أو الأرباح أو تحويل الوحدات…","searchLabel":"البحث عن الحاسبات","all":"كل الحاسبات","categories":"الفئات","results":"الحاسبات","count":"{start}–{end} من {count} أداة","clear":"مسح","sort":"الترتيب","recommended":"مقترحة","alphabetical":"حسب الاسم","previous":"السابق","next":"التالي","page":"صفحة {page} من {pages}","none":"لا توجد نتائج مطابقة","try":"جرّب عبارة أقصر أو فئة أخرى.","reset":"إعادة ضبط المرشحات","merchant":"أرباح التاجر","workspace":"مساحة العمل","menu":"القائمة","privacy":"الخصوصية","updates":"التحديثات","methods":"المنهجية","note":"الحسابات محلية. النتائج تقديرية وليست نصيحة مهنية.","new":"جديد","skip":"الانتقال إلى الحاسبات","domains":{"Finance":"المال","Business":"الأعمال","Health":"الصحة","Converters":"التحويلات","Home and Everyday":"المنزل والحياة اليومية","Math and Time":"الرياضيات والتواريخ","AI and Work-life":"الذكاء الاصطناعي والعمل","Science":"العلوم","Digital and Technology":"التقنية الرقمية"},"countOne":"{start}–{end} من {count} أداة"},"ur":{"heading":"کیلکولیٹرز","intro":"500 ٹولز۔ نام یا کام کے مطابق تلاش کریں۔","search":"قرض، منافع، اکائی کی تبدیلی تلاش کریں…","searchLabel":"کیلکولیٹر تلاش کریں","all":"تمام کیلکولیٹرز","categories":"زمرے","results":"کیلکولیٹرز","count":"{count} میں سے {start}–{end}","clear":"صاف کریں","sort":"ترتیب","recommended":"تجویز کردہ","alphabetical":"نام کے مطابق","previous":"پچھلا","next":"اگلا","page":"صفحہ {page} از {pages}","none":"کوئی مماثل کیلکولیٹر نہیں","try":"مختصر لفظ یا دوسرا زمرہ آزمائیں۔","reset":"فلٹر ری سیٹ","merchant":"تاجر کا منافع","workspace":"ورک اسپیس","menu":"مینو","privacy":"رازداری","updates":"تازہ کاریاں","methods":"طریقۂ کار","note":"حساب مقامی طور پر ہوتا ہے۔ نتائج تخمینے ہیں، پیشہ ورانہ مشورہ نہیں۔","new":"نیا","skip":"کیلکولیٹر پر جائیں","domains":{"Finance":"مالیات","Business":"کاروبار","Health":"صحت","Converters":"تبدیلیاں","Home and Everyday":"گھر اور روزمرہ","Math and Time":"ریاضی اور تاریخیں","AI and Work-life":"اے آئی اور کام","Science":"سائنس","Digital and Technology":"ڈیجیٹل ٹیکنالوجی"},"countOne":"{count} میں سے {start}–{end}"},"hi":{"heading":"कैलकुलेटर","intro":"500 टूल। नाम या काम से खोजें।","search":"ऋण, लाभ, इकाई परिवर्तन खोजें…","searchLabel":"कैलकुलेटर खोजें","all":"सभी कैलकुलेटर","categories":"श्रेणियाँ","results":"कैलकुलेटर","count":"{count} में से {start}–{end}","clear":"मिटाएँ","sort":"क्रम","recommended":"सुझाए गए","alphabetical":"नाम के अनुसार","previous":"पिछला","next":"अगला","page":"पृष्ठ {page} / {pages}","none":"कोई मिलान नहीं","try":"छोटा शब्द या दूसरी श्रेणी आज़माएँ।","reset":"फ़िल्टर रीसेट","merchant":"व्यापारी लाभ","workspace":"वर्कस्पेस","menu":"मेनू","privacy":"गोपनीयता","updates":"अपडेट","methods":"कार्यप्रणाली","note":"गणना ब्राउज़र में होती है। परिणाम अनुमान हैं, पेशेवर सलाह नहीं।","new":"नया","skip":"कैलकुलेटर पर जाएँ","domains":{"Finance":"वित्त","Business":"व्यवसाय","Health":"स्वास्थ्य","Converters":"रूपांतरण","Home and Everyday":"घर और दैनिक जीवन","Math and Time":"गणित और तारीख","AI and Work-life":"AI और काम","Science":"विज्ञान","Digital and Technology":"डिजिटल और तकनीक"},"countOne":"{count} में से {start}–{end}"},"bn":{"heading":"ক্যালকুলেটর","intro":"500টি টুল। নাম বা কাজ দিয়ে খুঁজুন।","search":"ঋণ, লাভ, একক রূপান্তর খুঁজুন…","searchLabel":"ক্যালকুলেটর খুঁজুন","all":"সব ক্যালকুলেটর","categories":"বিভাগ","results":"ক্যালকুলেটর","count":"{count}টির মধ্যে {start}–{end}","clear":"মুছুন","sort":"সাজান","recommended":"প্রস্তাবিত","alphabetical":"নাম অনুযায়ী","previous":"আগের","next":"পরের","page":"পৃষ্ঠা {page} / {pages}","none":"মিল পাওয়া যায়নি","try":"ছোট শব্দ বা অন্য বিভাগ চেষ্টা করুন।","reset":"ফিল্টার রিসেট","merchant":"ব্যবসার লাভ","workspace":"ওয়ার্কস্পেস","menu":"মেনু","privacy":"গোপনীয়তা","updates":"আপডেট","methods":"পদ্ধতি","note":"হিসাব ব্রাউজারেই হয়। ফলাফল অনুমান, পেশাগত পরামর্শ নয়।","new":"নতুন","skip":"ক্যালকুলেটরে যান","domains":{"Finance":"অর্থ","Business":"ব্যবসা","Health":"স্বাস্থ্য","Converters":"রূপান্তর","Home and Everyday":"বাড়ি ও দৈনন্দিন","Math and Time":"গণিত ও তারিখ","AI and Work-life":"AI ও কাজ","Science":"বিজ্ঞান","Digital and Technology":"ডিজিটাল প্রযুক্তি"},"countOne":"{count}টির মধ্যে {start}–{end}"},"mr":{"heading":"कॅल्क्युलेटर","intro":"500 साधने. नाव किंवा कामानुसार शोधा.","search":"कर्ज, नफा, एकक रूपांतरण शोधा…","searchLabel":"कॅल्क्युलेटर शोधा","all":"सर्व कॅल्क्युलेटर","categories":"वर्ग","results":"कॅल्क्युलेटर","count":"{count} पैकी {start}–{end}","clear":"साफ करा","sort":"क्रम","recommended":"शिफारस केलेले","alphabetical":"नावानुसार","previous":"मागील","next":"पुढील","page":"पृष्ठ {page} / {pages}","none":"जुळणारे साधन नाही","try":"लहान शब्द किंवा दुसरा वर्ग वापरा.","reset":"फिल्टर रीसेट","merchant":"व्यापारी नफा","workspace":"वर्कस्पेस","menu":"मेनू","privacy":"गोपनीयता","updates":"अद्यतने","methods":"पद्धत","note":"गणना ब्राउझरमध्ये होते. निकाल अंदाज आहेत, व्यावसायिक सल्ला नाही.","new":"नवीन","skip":"कॅल्क्युलेटरकडे जा","domains":{"Finance":"वित्त","Business":"व्यवसाय","Health":"आरोग्य","Converters":"रूपांतरण","Home and Everyday":"घर आणि दैनंदिन","Math and Time":"गणित आणि तारीख","AI and Work-life":"AI आणि काम","Science":"विज्ञान","Digital and Technology":"डिजिटल आणि तंत्रज्ञान"},"countOne":"{count} पैकी {start}–{end}"},"vi":{"heading":"Máy tính","intro":"500 công cụ. Tìm theo tên hoặc nhu cầu.","search":"Tìm khoản vay, lợi nhuận, đổi đơn vị…","searchLabel":"Tìm máy tính","all":"Tất cả máy tính","categories":"Danh mục","results":"Máy tính","count":"{start}–{end} trong {count} công cụ","clear":"Xóa","sort":"Sắp xếp","recommended":"Đề xuất","alphabetical":"Tên A–Z","previous":"Trước","next":"Sau","page":"Trang {page} / {pages}","none":"Không có kết quả phù hợp","try":"Thử từ khóa ngắn hơn hoặc danh mục khác.","reset":"Đặt lại bộ lọc","merchant":"Lợi nhuận bán hàng","workspace":"Không gian làm việc","menu":"Menu","privacy":"Quyền riêng tư","updates":"Cập nhật","methods":"Phương pháp","note":"Tính toán tại máy. Kết quả chỉ là ước tính, không phải tư vấn chuyên môn.","new":"Mới","skip":"Đến máy tính","domains":{"Finance":"Tài chính","Business":"Kinh doanh","Health":"Sức khỏe","Converters":"Chuyển đổi","Home and Everyday":"Nhà cửa và đời sống","Math and Time":"Toán và ngày tháng","AI and Work-life":"AI và công việc","Science":"Khoa học","Digital and Technology":"Kỹ thuật số và công nghệ"},"countOne":"{start}–{end} trong {count} công cụ"},"pcm":{"heading":"Calculators","intro":"500 tools. Search by name or wetin you wan do.","search":"Search loan, profit, unit conversion…","searchLabel":"Search calculators","all":"All calculators","categories":"Categories","results":"Calculators","count":"{start}–{end} of {count} tools","clear":"Clear","sort":"Sort results","recommended":"Recommended","alphabetical":"Name A–Z","previous":"Previous","next":"Next","page":"Page {page} of {pages}","none":"No calculator match","try":"Try shorter word or another category.","reset":"Reset filters","merchant":"Merchant profit","workspace":"Workspace","menu":"Menu","privacy":"Privacy","updates":"Updates","methods":"Method","note":"Calculations dey happen locally. Results na estimates, no be professional advice.","new":"New","skip":"Go to calculators","domains":{"Finance":"Finance","Business":"Business","Health":"Health","Converters":"Converters","Home and Everyday":"Home and everyday","Math and Time":"Math and time","AI and Work-life":"AI and work","Science":"Science","Digital and Technology":"Digital and tech"},"countOne":"{start}–{end} of {count} tool"},"sw":{"heading":"Vikokotoo","intro":"Zana 500. Tafuta kwa jina au kazi.","search":"Tafuta mkopo, faida, ubadilishaji wa vipimo…","searchLabel":"Tafuta vikokotoo","all":"Vikokotoo vyote","categories":"Kategoria","results":"Vikokotoo","count":"{start}–{end} kati ya {count}","clear":"Futa","sort":"Panga","recommended":"Zilizopendekezwa","alphabetical":"Jina A–Z","previous":"Iliyotangulia","next":"Inayofuata","page":"Ukurasa {page} kati ya {pages}","none":"Hakuna matokeo","try":"Jaribu neno fupi au kategoria nyingine.","reset":"Weka upya vichujio","merchant":"Faida ya biashara","workspace":"Eneo la kazi","menu":"Menyu","privacy":"Faragha","updates":"Masasisho","methods":"Mbinu","note":"Hesabu hufanyika kwenye kifaa. Matokeo ni makadirio, si ushauri wa kitaalamu.","new":"Mpya","skip":"Nenda kwa vikokotoo","domains":{"Finance":"Fedha","Business":"Biashara","Health":"Afya","Converters":"Ubadilishaji","Home and Everyday":"Nyumbani na kila siku","Math and Time":"Hisabati na tarehe","AI and Work-life":"AI na kazi","Science":"Sayansi","Digital and Technology":"Teknolojia ya kidijitali"},"countOne":"{start}–{end} kati ya {count}"},"ha":{"heading":"Kalkuleta","intro":"Kayan aiki 500. Nemo ta suna ko aiki.","search":"Nemo bashi, riba, canjin raka’a…","searchLabel":"Nemo kalkuleta","all":"Duk kalkuletoci","categories":"Rukuni","results":"Kalkuleta","count":"{start}–{end} daga {count}","clear":"Goge","sort":"Jeri","recommended":"Shawarwari","alphabetical":"Suna A–Z","previous":"Na baya","next":"Na gaba","page":"Shafi {page} na {pages}","none":"Babu sakamako","try":"Gwada gajeriyar kalma ko wani rukuni.","reset":"Sake saita tacewa","merchant":"Ribar kasuwanci","workspace":"Wurin aiki","menu":"Menu","privacy":"Sirri","updates":"Sabuntawa","methods":"Hanya","note":"Ana lissafi a na’urarka. Sakamako kimantawa ne, ba shawarar ƙwararre ba.","new":"Sabo","skip":"Je kalkuleta","domains":{"Finance":"Kuɗi","Business":"Kasuwanci","Health":"Lafiya","Converters":"Canji","Home and Everyday":"Gida da rayuwa","Math and Time":"Lissafi da lokaci","AI and Work-life":"AI da aiki","Science":"Kimiyya","Digital and Technology":"Fasahar dijital"},"countOne":"{start}–{end} daga {count}"},"te":{"heading":"క్యాలిక్యులేటర్లు","intro":"500 టూల్స్. పేరు లేదా పని ఆధారంగా వెతకండి.","search":"లోన్, లాభం, యూనిట్ మార్పిడి వెతకండి…","searchLabel":"క్యాలిక్యులేటర్లు వెతకండి","all":"అన్ని క్యాలిక్యులేటర్లు","categories":"వర్గాలు","results":"క్యాలిక్యులేటర్లు","count":"{count}లో {start}–{end}","clear":"తొలగించు","sort":"క్రమం","recommended":"సూచించినవి","alphabetical":"పేరు క్రమం","previous":"మునుపటి","next":"తదుపరి","page":"పేజీ {page} / {pages}","none":"సరిపోలే ఫలితాలు లేవు","try":"చిన్న పదం లేదా మరో వర్గం ప్రయత్నించండి.","reset":"ఫిల్టర్లు రీసెట్","merchant":"వ్యాపారి లాభం","workspace":"వర్క్‌స్పేస్","menu":"మెను","privacy":"గోప్యత","updates":"నవీకరణలు","methods":"పద్ధతి","note":"లెక్కలు మీ బ్రౌజర్‌లోనే జరుగుతాయి. ఫలితాలు అంచనాలు, వృత్తిపరమైన సలహా కాదు.","new":"కొత్త","skip":"క్యాలిక్యులేటర్లకు వెళ్ళండి","domains":{"Finance":"ఆర్థికం","Business":"వ్యాపారం","Health":"ఆరోగ్యం","Converters":"మార్పిడి","Home and Everyday":"ఇల్లు మరియు దైనందిన","Math and Time":"గణితం మరియు తేదీలు","AI and Work-life":"AI మరియు పని","Science":"విజ్ఞానం","Digital and Technology":"డిజిటల్ సాంకేతికత"},"countOne":"{count}లో {start}–{end}"},"tr":{"heading":"Hesaplayıcılar","intro":"500 araç. Ada veya göreve göre arayın.","search":"Kredi, kâr, birim dönüşümü ara…","searchLabel":"Hesaplayıcı ara","all":"Tüm hesaplayıcılar","categories":"Kategoriler","results":"Hesaplayıcılar","count":"{count} araçtan {start}–{end}","clear":"Temizle","sort":"Sırala","recommended":"Önerilen","alphabetical":"Ad A–Z","previous":"Önceki","next":"Sonraki","page":"Sayfa {page} / {pages}","none":"Eşleşen hesaplayıcı yok","try":"Daha kısa bir kelime veya başka kategori deneyin.","reset":"Filtreleri sıfırla","merchant":"Satıcı kârı","workspace":"Çalışma alanı","menu":"Menü","privacy":"Gizlilik","updates":"Güncellemeler","methods":"Metodoloji","note":"Hesaplamalar cihazınızda yapılır. Sonuçlar tahmindir, profesyonel tavsiye değildir.","new":"Yeni","skip":"Hesaplayıcılara geç","domains":{"Finance":"Finans","Business":"İş","Health":"Sağlık","Converters":"Dönüştürücüler","Home and Everyday":"Ev ve günlük yaşam","Math and Time":"Matematik ve tarihler","AI and Work-life":"Yapay zekâ ve iş","Science":"Bilim","Digital and Technology":"Dijital teknoloji"},"countOne":"{count} araçtan {start}–{end}"}};

;
window.CMLegacyCopy = {
  en: {
    全部工具: 'All tools',
    金融: 'Finance',
    健康: 'Health',
    换算: 'Converters',
    透明公式: 'Transparent formulas',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Free, transparent online calculators. Results are estimates, not professional advice.',
    计算口径: 'Methodology',
    关于: 'About',
    隐私: 'Privacy',
    联系: 'Contact',
    返回全部工具: 'Back to all tools',
    输入: 'Inputs',
    调整你的数据: 'Adjust your data',
    建立你的情景: 'Build your scenario',
    实时更新: 'Live',
    恢复示例数据: 'Reset example',
    核心结果: 'Key result',
    参考情景: 'Reference',
    需要复核: 'Review needed',
    输入警告: 'Input warning',
    稳健情景: 'Stable scenario',
    需要验证: 'Validate',
    风险提示: 'Risk alert',
    结果解读: 'Interpretation',
    情景诊断: 'Scenario insight',
    计算公式: 'Formula',
    复制结果: 'Copy result',
    已复制: 'Copied',
    生成报告: 'Create report',
    使用方法: 'How to use',
    '用真实数据，做多档比较': 'Use real data and compare scenarios',
    替换示例值: 'Replace examples',
    测试边界: 'Test boundaries',
    复核口径: 'Review assumptions',
    关于这项计算: 'About this calculation',
    如何使用: 'How to use',
    先改最不确定的数字: 'Start with the most uncertain input',
    填真实数据: 'Use real data',
    做三档情景: 'Compare three scenarios',
    保存并复核: 'Save and verify',
    FAQ: 'FAQ',
    计算结果: 'Result',
    数学: 'Math',
    日期: 'Dates',
    商业: 'Business',
    科技: 'Technology',
    生活: 'Everyday',
    出行: 'Travel',
    家居: 'Home',
    教育: 'Education',
    全部: 'All',
    基础: 'Essential',
    热门: 'Popular',
    常用: 'Common',
    多功能: 'Multi-tool',
    专业: 'Pro',
    AI效率: 'AI productivity',
    AI开发: 'AI engineering',
    创作者: 'Creator economy',
    职业: 'Career',
    团队效率: 'Team productivity',
    个人财务: 'Personal finance',
    创业: 'Entrepreneurship',
    成长: 'Personal growth',
    效率: 'Productivity',
    可持续: 'Sustainability',
    电商: 'E-commerce',
    '一个入口，解决日常计算': 'One place for everyday calculations',
    答案不该藏在: 'Answers should not hide in',
    复杂公式: 'complex formulas',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Free calculators across everyday categories. Instant results, transparent formulas, clear explanations, no sign-up.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Search loans, BMI, AI cost, conversions…',
    个首发工具: 'launch tools',
    实时计算: 'Instant calculations',
    移动端友好: 'Mobile friendly',
    计算器目录: 'Calculator directory',
    '从问题出发，不从公式出发': 'Start with the question, not the formula',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Choose a tool and change any value—the result updates instantly.',
    打开工具: 'Open tool',
    暂时没有匹配工具: 'No matching tool yet',
    '换一个关键词试试。': 'Try another keyword.',
    计算器: 'Calculators',
    浏览分类: 'Browse categories',
    热门工具: 'Popular tools',
    方法与标准: 'Methods & standards',
    菜单: 'Menu',
    'CALCMINTLY 标准': 'THE CALCMINTLY STANDARD',
    '不只给一个数字，还告诉你数字怎么来的。':
      'More than a number—we show you how it was calculated.',
    实时反馈: 'Instant feedback',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Form calculators update as you type. On a keypad, press = to finish a calculation.',
    公式透明: 'Transparent formulas',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'See the method, defaults, and limitations so you can verify every result.',
    情境解释: 'Useful context',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Turn results into practical ranges and guidance, without false precision.',
    常见问题: 'Frequently asked questions',
    '使用前，你可能想知道': 'What to know before you calculate',
    '这些计算器免费吗？': 'Are these calculators free?',
    '是。首发工具无需注册即可使用。':
      'Yes. Every launch calculator is free to use without an account.',
    '数据会被上传吗？': 'Is my data uploaded?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Calculations run locally in your browser. We do not receive the values you enter.',
    '结果能替代专业意见吗？': 'Can the results replace professional advice?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'No. Financial, health, and business results are for estimates and comparisons. Use qualified professionals and official documents for important decisions.',
    百分比计算器: 'Percentage Calculator',
    贷款计算器: 'Loan Calculator',
    'BMI 计算器': 'BMI Calculator',
    年龄计算器: 'Age Calculator',
    长度单位换算器: 'Length Converter',
    利润计算器: 'Profit Calculator',
    数学计算: 'Math',
    金融计算: 'Finance',
    健康计算: 'Health',
    日期计算: 'Dates',
    单位换算: 'Converters',
    商业计算: 'Business',
    百分比: 'Percentage',
    基数: 'Base value',
    贷款本金: 'Loan principal',
    年利率: 'Annual interest rate',
    贷款期限: 'Loan term',
    额外月供: 'Extra monthly payment',
    身高: 'Height',
    体重: 'Weight',
    英尺: 'Feet',
    英寸: 'Inches',
    出生日期: 'Date of birth',
    数值: 'Value',
    从: 'From',
    换算为: 'Convert to',
    收入: 'Revenue',
    变动成本: 'Variable costs',
    固定成本: 'Fixed costs',
    所有计算均在你的浏览器本地完成: 'All calculations run locally in your browser',
    '结果 = 基数 × 百分比 ÷ 100': 'Result = base value × percentage ÷ 100',
    '月供 = 本金 × 月利率 × (1+月利率)^期数 ÷ [(1+月利率)^期数−1]':
      'Monthly payment = principal × monthly rate × (1 + monthly rate)^payments ÷ [(1 + monthly rate)^payments − 1]',
    'BMI = 体重(kg) ÷ 身高²(m²)': 'BMI = weight (kg) ÷ height² (m²)',
    '周岁 = 当前日期 − 出生日期（使用公历日历差值，不用毫秒近似年份）':
      'Age = current date − date of birth, using calendar differences',
    '目标值 = 输入值 × 来源单位换算系数 ÷ 目标单位换算系数':
      'Target value = input × source-unit factor ÷ target-unit factor',
    '净利润 = 收入 − 变动成本 − 固定成本；净利率 = 净利润 ÷ 收入':
      'Net profit = revenue − variable costs − fixed costs; net margin = net profit ÷ revenue',
  },
  hi: {
    全部工具: 'सभी टूल',
    金融: 'वित्त',
    健康: 'स्वास्थ्य',
    换算: 'कन्वर्टर',
    透明公式: 'पारदर्शी फ़ॉर्मूले',
    计算口径: 'कार्यप्रणाली',
    关于: 'परिचय',
    隐私: 'गोपनीयता',
    联系: 'संपर्क',
    返回全部工具: 'सभी टूल पर लौटें',
    输入: 'इनपुट',
    调整你的数据: 'अपना डेटा समायोजित करें',
    建立你的情景: 'अपना परिदृश्य बनाएं',
    实时更新: 'लाइव',
    核心结果: 'मुख्य परिणाम',
    参考情景: 'संदर्भ',
    输入警告: 'इनपुट चेतावनी',
    结果解读: 'परिणाम की व्याख्या',
    计算公式: 'फ़ॉर्मूला',
    复制结果: 'परिणाम कॉपी करें',
    生成报告: 'रिपोर्ट बनाएं',
    使用方法: 'कैसे उपयोग करें',
    关于这项计算: 'इस गणना के बारे में',
    如何使用: 'कैसे उपयोग करें',
    数学: 'गणित',
    日期: 'तारीख',
    商业: 'व्यवसाय',
    科技: 'तकनीक',
    生活: 'दैनिक जीवन',
    出行: 'यात्रा',
    家居: 'घर',
    教育: 'शिक्षा',
    全部: 'सभी',
    计算器: 'कैलकुलेटर',
    浏览分类: 'श्रेणियाँ देखें',
    方法与标准: 'तरीके और मानक',
    菜单: 'मेनू',
    '一个入口，解决日常计算': 'रोज़मर्रा की गणनाओं के लिए एक जगह',
    答案不该藏在: 'उत्तर छिपे नहीं होने चाहिए',
    复杂公式: 'जटिल फ़ॉर्मूलों में',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'मुफ्त और पारदर्शी ऑनलाइन कैलकुलेटर। परिणाम अनुमान हैं, पेशेवर सलाह नहीं।',
    计算工作台: 'कैलकुलेशन वर्कस्पेस',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'हर दिन के लिए मुफ्त कैलकुलेटर। तुरंत परिणाम, साफ़ फ़ॉर्मूले, सरल व्याख्या, बिना साइन-अप।',
    '搜索贷款、BMI、AI成本、单位换算…': 'लोन, BMI, AI लागत, यूनिट कन्वर्ज़न खोजें…',
    个首发工具: ' लॉन्च टूल',
    实时计算: 'तुरंत गणना',
    移动端友好: 'मोबाइल अनुकूल',
    计算器目录: 'कैलकुलेटर डायरेक्टरी',
    '从问题出发，不从公式出发': 'फ़ॉर्मूले से नहीं, सवाल से शुरू करें',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'एक टूल चुनें और कोई भी मान बदलें—परिणाम तुरंत अपडेट होगा।',
    打开工具: 'टूल खोलें',
    暂时没有匹配工具: 'अभी कोई मेल खाता टूल नहीं',
    '换一个关键词试试。': 'दूसरा कीवर्ड आज़माएँ।',
    'CALCMINTLY 标准': 'CALCMINTLY मानक',
    '不只给一个数字，还告诉你数字怎么来的。': 'सिर्फ संख्या नहीं—हम बताते हैं कि वह कैसे निकली।',
    实时反馈: 'तुरंत प्रतिक्रिया',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'फ़ॉर्म में लिखते ही परिणाम बदलते हैं। कीपैड पर गणना पूरी करने के लिए = दबाएँ।',
    公式透明: 'पारदर्शी फ़ॉर्मूले',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'विधि, डिफ़ॉल्ट और सीमाएँ देखें ताकि परिणाम की जाँच कर सकें।',
    情境解释: 'उपयोगी संदर्भ',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'झूठी सटीकता के बजाय उपयोगी रेंज और संकेत पाएँ।',
    常见问题: 'सामान्य प्रश्न',
    '使用前，你可能想知道': 'गणना से पहले जानने योग्य बातें',
    '这些计算器免费吗？': 'क्या ये कैलकुलेटर मुफ्त हैं?',
    '是。首发工具无需注册即可使用。': 'हाँ। सभी लॉन्च टूल बिना खाते के मुफ्त हैं।',
    '数据会被上传吗？': 'क्या मेरा डेटा अपलोड होता है?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'गणना आपके ब्राउज़र में होती है। हम आपके दर्ज किए मान प्राप्त नहीं करते।',
    '结果能替代专业意见吗？': 'क्या परिणाम पेशेवर सलाह की जगह ले सकते हैं?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'नहीं। वित्त, स्वास्थ्य और व्यवसाय परिणाम अनुमान व तुलना के लिए हैं; महत्वपूर्ण निर्णयों में पेशेवर और आधिकारिक दस्तावेज़ देखें।',
  },
  es: {
    全部工具: 'Todas las herramientas',
    金融: 'Finanzas',
    健康: 'Salud',
    换算: 'Conversores',
    透明公式: 'Fórmulas transparentes',
    计算口径: 'Metodología',
    关于: 'Acerca de',
    隐私: 'Privacidad',
    联系: 'Contacto',
    返回全部工具: 'Volver a herramientas',
    输入: 'Entradas',
    调整你的数据: 'Ajusta tus datos',
    建立你的情景: 'Construye tu escenario',
    实时更新: 'En vivo',
    核心结果: 'Resultado clave',
    参考情景: 'Referencia',
    输入警告: 'Advertencia de entrada',
    结果解读: 'Interpretación',
    计算公式: 'Fórmula',
    复制结果: 'Copiar resultado',
    生成报告: 'Crear informe',
    使用方法: 'Cómo usar',
    关于这项计算: 'Sobre este cálculo',
    如何使用: 'Cómo usar',
    数学: 'Matemáticas',
    日期: 'Fechas',
    商业: 'Negocios',
    科技: 'Tecnología',
    生活: 'Vida diaria',
    出行: 'Viajes',
    家居: 'Hogar',
    教育: 'Educación',
    全部: 'Todo',
    计算器: 'Calculadoras',
    浏览分类: 'Explorar categorías',
    方法与标准: 'Métodos y estándares',
    菜单: 'Menú',
    '一个入口，解决日常计算': 'Un lugar para cálculos cotidianos',
    答案不该藏在: 'Las respuestas no deberían esconderse en',
    复杂公式: 'fórmulas complejas',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Calculadoras online gratuitas y transparentes. Los resultados son estimaciones, no asesoramiento profesional.',
    计算工作台: 'Espacio de cálculo',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Calculadoras gratuitas para tareas cotidianas. Resultados instantáneos, fórmulas transparentes y explicaciones claras, sin registro.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Buscar préstamos, BMI, coste de IA, conversiones…',
    个首发工具: ' herramientas disponibles',
    实时计算: 'Cálculo instantáneo',
    移动端友好: 'Adaptado a móvil',
    计算器目录: 'Directorio de calculadoras',
    '从问题出发，不从公式出发': 'Empieza por la pregunta, no por la fórmula',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Elige una herramienta y cambia cualquier valor: el resultado se actualiza al instante.',
    打开工具: 'Abrir herramienta',
    暂时没有匹配工具: 'No hay herramientas coincidentes',
    '换一个关键词试试。': 'Prueba otra palabra clave.',
    'CALCMINTLY 标准': 'ESTÁNDAR CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。': 'No solo damos un número: mostramos cómo se calculó.',
    实时反馈: 'Respuesta instantánea',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Los formularios se actualizan al escribir. En el teclado, pulsa = para terminar.',
    公式透明: 'Fórmulas transparentes',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Consulta método, valores por defecto y límites para verificar el resultado.',
    情境解释: 'Contexto útil',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Convierte resultados en rangos y orientación útiles, sin falsa precisión.',
    常见问题: 'Preguntas frecuentes',
    '使用前，你可能想知道': 'Qué conviene saber antes de calcular',
    '这些计算器免费吗？': '¿Estas calculadoras son gratis?',
    '是。首发工具无需注册即可使用。':
      'Sí. Las herramientas disponibles son gratuitas y no requieren cuenta.',
    '数据会被上传吗？': '¿Se suben mis datos?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Los cálculos se realizan en tu navegador. No recibimos los valores que introduces.',
    '结果能替代专业意见吗？': '¿Los resultados sustituyen el asesoramiento profesional?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'No. Los resultados financieros, de salud y negocio son estimaciones; para decisiones importantes consulta profesionales y documentos oficiales.',
  },
  ar: {
    全部工具: 'كل الأدوات',
    金融: 'المال',
    健康: 'الصحة',
    换算: 'التحويلات',
    透明公式: 'معادلات واضحة',
    计算口径: 'المنهجية',
    关于: 'حول',
    隐私: 'الخصوصية',
    联系: 'اتصل بنا',
    返回全部工具: 'العودة إلى الأدوات',
    输入: 'المدخلات',
    调整你的数据: 'عدّل بياناتك',
    建立你的情景: 'ابنِ السيناريو',
    实时更新: 'مباشر',
    核心结果: 'النتيجة الأساسية',
    参考情景: 'مرجع',
    输入警告: 'تنبيه الإدخال',
    结果解读: 'تفسير النتيجة',
    计算公式: 'المعادلة',
    复制结果: 'نسخ النتيجة',
    生成报告: 'إنشاء تقرير',
    使用方法: 'طريقة الاستخدام',
    关于这项计算: 'حول هذا الحساب',
    如何使用: 'طريقة الاستخدام',
    数学: 'الرياضيات',
    日期: 'التواريخ',
    商业: 'الأعمال',
    科技: 'التقنية',
    生活: 'الحياة اليومية',
    出行: 'السفر',
    家居: 'المنزل',
    教育: 'التعليم',
    全部: 'الكل',
    计算器: 'الحاسبات',
    浏览分类: 'تصفح الفئات',
    方法与标准: 'الطرق والمعايير',
    菜单: 'القائمة',
    '一个入口，解决日常计算': 'مكان واحد للحسابات اليومية',
    答案不该藏在: 'لا ينبغي أن تختبئ الإجابات داخل',
    复杂公式: 'معادلات معقدة',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'حاسبات مجانية وشفافة على الإنترنت. النتائج تقديرية وليست نصيحة مهنية.',
    计算工作台: 'مساحة الحساب',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'حاسبات مجانية لمهام الحياة اليومية، بنتائج فورية ومعادلات واضحة وشرح بسيط، من دون تسجيل.',
    '搜索贷款、BMI、AI成本、单位换算…': 'ابحث عن القروض وBMI وتكلفة الذكاء الاصطناعي والتحويلات…',
    个首发工具: ' أداة متاحة',
    实时计算: 'حساب فوري',
    移动端友好: 'مناسب للهاتف',
    计算器目录: 'دليل الحاسبات',
    '从问题出发，不从公式出发': 'ابدأ بالسؤال، لا بالمعادلة',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'اختر أداة وعدّل أي قيمة؛ تتحدث النتيجة فوراً.',
    打开工具: 'افتح الأداة',
    暂时没有匹配工具: 'لا توجد أداة مطابقة حالياً',
    '换一个关键词试试。': 'جرّب كلمة أخرى.',
    'CALCMINTLY 标准': 'معيار CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。': 'لا نعطي رقماً فقط، بل نوضح كيف حُسب.',
    实时反馈: 'تحديث فوري',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'تتحدث نتائج النماذج أثناء الإدخال. في الحاسبة ذات الأزرار، اضغط = لإتمام الحساب.',
    公式透明: 'معادلات واضحة',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'اعرض طريقة الحساب والقيم الافتراضية والحدود لتتمكن من التحقق.',
    情境解释: 'سياق مفيد',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'حوّل النتائج إلى نطاقات وإرشادات عملية من دون دقة زائفة.',
    常见问题: 'أسئلة شائعة',
    '使用前，你可能想知道': 'ما ينبغي معرفته قبل الحساب',
    '这些计算器免费吗？': 'هل هذه الحاسبات مجانية؟',
    '是。首发工具无需注册即可使用。': 'نعم. الأدوات المتاحة مجانية ولا تحتاج إلى حساب.',
    '数据会被上传吗？': 'هل تُرفع بياناتي؟',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'تتم الحسابات محلياً في متصفحك ولا نستقبل القيم التي تدخلها.',
    '结果能替代专业意见吗？': 'هل تحل النتائج محل الرأي المهني؟',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'لا. نتائج المال والصحة والأعمال للتقدير والمقارنة؛ استخدم مختصين ووثائق رسمية للقرارات المهمة.',
  },
  fr: {
    全部工具: 'Tous les outils',
    金融: 'Finance',
    健康: 'Santé',
    换算: 'Convertisseurs',
    透明公式: 'Formules transparentes',
    计算口径: 'Méthodologie',
    关于: 'À propos',
    隐私: 'Confidentialité',
    联系: 'Contact',
    返回全部工具: 'Retour aux outils',
    输入: 'Entrées',
    调整你的数据: 'Ajustez vos données',
    建立你的情景: 'Construisez votre scénario',
    实时更新: 'En direct',
    核心结果: 'Résultat clé',
    参考情景: 'Référence',
    输入警告: 'Alerte de saisie',
    结果解读: 'Interprétation',
    计算公式: 'Formule',
    复制结果: 'Copier le résultat',
    生成报告: 'Créer un rapport',
    使用方法: 'Mode d’emploi',
    关于这项计算: 'À propos de ce calcul',
    如何使用: 'Comment utiliser',
    数学: 'Maths',
    日期: 'Dates',
    商业: 'Business',
    科技: 'Technologie',
    生活: 'Quotidien',
    出行: 'Voyage',
    家居: 'Maison',
    教育: 'Éducation',
    全部: 'Tout',
    计算器: 'Calculatrices',
    浏览分类: 'Parcourir les catégories',
    方法与标准: 'Méthodes et normes',
    菜单: 'Menu',
    '一个入口，解决日常计算': 'Un seul endroit pour les calculs du quotidien',
    答案不该藏在: 'Les réponses ne devraient pas se cacher dans',
    复杂公式: 'des formules complexes',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Calculatrices en ligne gratuites et transparentes. Les résultats sont des estimations, pas des conseils professionnels.',
    计算工作台: 'Espace de calcul',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Des calculatrices gratuites pour le quotidien, avec résultats instantanés, formules transparentes et explications claires, sans inscription.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Rechercher prêt, IMC, coût IA, conversions…',
    个首发工具: ' outils disponibles',
    实时计算: 'Calcul instantané',
    移动端友好: 'Adapté au mobile',
    计算器目录: 'Répertoire des calculatrices',
    '从问题出发，不从公式出发': 'Partez de la question, pas de la formule',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Choisissez un outil et modifiez une valeur : le résultat se met à jour immédiatement.',
    打开工具: 'Ouvrir l’outil',
    暂时没有匹配工具: 'Aucun outil correspondant',
    '换一个关键词试试。': 'Essayez un autre mot-clé.',
    'CALCMINTLY 标准': 'STANDARD CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Plus qu’un nombre : nous expliquons comment il est calculé.',
    实时反馈: 'Résultats instantanés',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Les formulaires se mettent à jour pendant la saisie. Sur le clavier, appuyez sur = pour terminer.',
    公式透明: 'Formules transparentes',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Consultez la méthode, les valeurs par défaut et les limites pour vérifier le calcul.',
    情境解释: 'Contexte utile',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Transformez les résultats en fourchettes et indications utiles, sans fausse précision.',
    常见问题: 'Questions fréquentes',
    '使用前，你可能想知道': 'À savoir avant de calculer',
    '这些计算器免费吗？': 'Ces calculatrices sont-elles gratuites ?',
    '是。首发工具无需注册即可使用。': 'Oui. Les outils disponibles sont gratuits et sans compte.',
    '数据会被上传吗？': 'Mes données sont-elles envoyées ?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Les calculs s’effectuent dans votre navigateur. Nous ne recevons pas les valeurs saisies.',
    '结果能替代专业意见吗？': 'Les résultats remplacent-ils un avis professionnel ?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Non. Les résultats financiers, santé et business servent à estimer et comparer ; consultez professionnels et documents officiels pour les décisions importantes.',
  },
  bn: {
    全部工具: 'সব টুল',
    金融: 'অর্থ',
    健康: 'স্বাস্থ্য',
    换算: 'রূপান্তর',
    透明公式: 'স্বচ্ছ সূত্র',
    计算口径: 'পদ্ধতি',
    关于: 'পরিচিতি',
    隐私: 'গোপনীয়তা',
    联系: 'যোগাযোগ',
    返回全部工具: 'সব টুলে ফিরুন',
    输入: 'ইনপুট',
    调整你的数据: 'ডেটা সমন্বয় করুন',
    建立你的情景: 'পরিস্থিতি তৈরি করুন',
    实时更新: 'লাইভ',
    核心结果: 'মূল ফলাফল',
    参考情景: 'রেফারেন্স',
    输入警告: 'ইনপুট সতর্কতা',
    结果解读: 'ফলাফল ব্যাখ্যা',
    计算公式: 'সূত্র',
    复制结果: 'ফলাফল কপি',
    生成报告: 'রিপোর্ট তৈরি',
    使用方法: 'ব্যবহারবিধি',
    关于这项计算: 'এই গণনা সম্পর্কে',
    如何使用: 'কীভাবে ব্যবহার করবেন',
    数学: 'গণিত',
    日期: 'তারিখ',
    商业: 'ব্যবসা',
    科技: 'প্রযুক্তি',
    生活: 'দৈনন্দিন',
    出行: 'ভ্রমণ',
    家居: 'বাড়ি',
    教育: 'শিক্ষা',
    全部: 'সব',
    计算器: 'ক্যালকুলেটর',
    浏览分类: 'বিভাগ দেখুন',
    方法与标准: 'পদ্ধতি ও মান',
    菜单: 'মেনু',
    '一个入口，解决日常计算': 'দৈনন্দিন হিসাবের এক জায়গা',
    答案不该藏在: 'উত্তর লুকিয়ে থাকা উচিত নয়',
    复杂公式: 'জটিল সূত্রে',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'বিনামূল্যের স্বচ্ছ অনলাইন ক্যালকুলেটর। ফলাফল অনুমান, পেশাগত পরামর্শ নয়।',
    计算工作台: 'ক্যালকুলেশন ওয়ার্কস্পেস',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'দৈনন্দিন কাজের জন্য বিনামূল্যের ক্যালকুলেটর। তাৎক্ষণিক ফল, স্বচ্ছ সূত্র ও পরিষ্কার ব্যাখ্যা; নিবন্ধন নেই।',
    '搜索贷款、BMI、AI成本、单位换算…': 'ঋণ, BMI, AI খরচ, ইউনিট রূপান্তর খুঁজুন…',
    个首发工具: 'টি উপলভ্য টুল',
    实时计算: 'তাৎক্ষণিক হিসাব',
    移动端友好: 'মোবাইল উপযোগী',
    计算器目录: 'ক্যালকুলেটর ডিরেক্টরি',
    '从问题出发，不从公式出发': 'সূত্র নয়, প্রশ্ন থেকে শুরু করুন',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'একটি টুল বেছে কোনো মান বদলান—ফল সঙ্গে সঙ্গে বদলাবে।',
    打开工具: 'টুল খুলুন',
    暂时没有匹配工具: 'এখনও মেলানো টুল নেই',
    '换一个关键词试试。': 'অন্য কীওয়ার্ড চেষ্টা করুন।',
    'CALCMINTLY 标准': 'CALCMINTLY মানদণ্ড',
    '不只给一个数字，还告诉你数字怎么来的。': 'শুধু সংখ্যা নয়—কীভাবে হিসাব হয়েছে তাও দেখাই।',
    实时反馈: 'তাৎক্ষণিক প্রতিক্রিয়া',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'ফর্মে লেখার সঙ্গে ফল বদলায়। কীপ্যাডে গণনা শেষ করতে = চাপুন।',
    公式透明: 'স্বচ্ছ সূত্র',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'পদ্ধতি, ডিফল্ট ও সীমা দেখুন এবং ফল যাচাই করুন।',
    情境解释: 'উপযোগী প্রসঙ্গ',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'মিথ্যা নির্ভুলতার বদলে ব্যবহারযোগ্য পরিসর ও নির্দেশনা পান।',
    常见问题: 'সাধারণ প্রশ্ন',
    '使用前，你可能想知道': 'হিসাবের আগে যা জানা ভালো',
    '这些计算器免费吗？': 'এই ক্যালকুলেটরগুলো কি বিনামূল্যে?',
    '是。首发工具无需注册即可使用。': 'হ্যাঁ। উপলভ্য টুলগুলো বিনামূল্যে এবং অ্যাকাউন্ট লাগে না।',
    '数据会被上传吗？': 'আমার ডেটা কি আপলোড হয়?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'হিসাব আপনার ব্রাউজারেই হয়। আপনার দেওয়া মান আমরা পাই না।',
    '结果能替代专业意见吗？': 'ফল কি পেশাগত পরামর্শের বিকল্প?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'না। অর্থ, স্বাস্থ্য ও ব্যবসার ফল অনুমান ও তুলনার জন্য; গুরুত্বপূর্ণ সিদ্ধান্তে বিশেষজ্ঞ ও সরকারি নথি দেখুন।',
  },
  pt: {
    全部工具: 'Todas as ferramentas',
    金融: 'Finanças',
    健康: 'Saúde',
    换算: 'Conversores',
    透明公式: 'Fórmulas transparentes',
    计算口径: 'Metodologia',
    关于: 'Sobre',
    隐私: 'Privacidade',
    联系: 'Contato',
    返回全部工具: 'Voltar às ferramentas',
    输入: 'Entradas',
    调整你的数据: 'Ajuste seus dados',
    建立你的情景: 'Monte seu cenário',
    实时更新: 'Ao vivo',
    核心结果: 'Resultado principal',
    参考情景: 'Referência',
    输入警告: 'Aviso de entrada',
    结果解读: 'Interpretação',
    计算公式: 'Fórmula',
    复制结果: 'Copiar resultado',
    生成报告: 'Criar relatório',
    使用方法: 'Como usar',
    关于这项计算: 'Sobre este cálculo',
    如何使用: 'Como usar',
    数学: 'Matemática',
    日期: 'Datas',
    商业: 'Negócios',
    科技: 'Tecnologia',
    生活: 'Cotidiano',
    出行: 'Viagem',
    家居: 'Casa',
    教育: 'Educação',
    全部: 'Tudo',
    计算器: 'Calculadoras',
    浏览分类: 'Explorar categorias',
    方法与标准: 'Métodos e padrões',
    菜单: 'Menu',
    '一个入口，解决日常计算': 'Um lugar para cálculos do dia a dia',
    答案不该藏在: 'As respostas não devem se esconder em',
    复杂公式: 'fórmulas complexas',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Calculadoras online gratuitas e transparentes. Os resultados são estimativas, não aconselhamento profissional.',
    计算工作台: 'Espaço de cálculo',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Calculadoras gratuitas para tarefas do dia a dia. Resultados instantâneos, fórmulas transparentes e explicações claras, sem cadastro.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Pesquisar empréstimo, IMC, custo de IA, conversões…',
    个首发工具: ' ferramentas disponíveis',
    实时计算: 'Cálculo instantâneo',
    移动端友好: 'Compatível com celular',
    计算器目录: 'Diretório de calculadoras',
    '从问题出发，不从公式出发': 'Comece pela pergunta, não pela fórmula',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Escolha uma ferramenta e altere qualquer valor; o resultado atualiza na hora.',
    打开工具: 'Abrir ferramenta',
    暂时没有匹配工具: 'Nenhuma ferramenta correspondente',
    '换一个关键词试试。': 'Tente outra palavra-chave.',
    'CALCMINTLY 标准': 'PADRÃO CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Mais do que um número: mostramos como ele foi calculado.',
    实时反馈: 'Resposta instantânea',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Os formulários atualizam ao digitar. No teclado, pressione = para concluir.',
    公式透明: 'Fórmulas transparentes',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Veja o método, padrões e limites para verificar o cálculo.',
    情境解释: 'Contexto útil',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Transforme resultados em faixas e orientações úteis, sem falsa precisão.',
    常见问题: 'Perguntas frequentes',
    '使用前，你可能想知道': 'O que saber antes de calcular',
    '这些计算器免费吗？': 'Estas calculadoras são gratuitas?',
    '是。首发工具无需注册即可使用。':
      'Sim. As ferramentas disponíveis são gratuitas e não exigem conta.',
    '数据会被上传吗？': 'Meus dados são enviados?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Os cálculos rodam no seu navegador. Não recebemos os valores informados.',
    '结果能替代专业意见吗？': 'Os resultados substituem aconselhamento profissional?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Não. Resultados financeiros, de saúde e negócios servem para estimativa e comparação; use profissionais e documentos oficiais em decisões importantes.',
  },
  id: {
    全部工具: 'Semua alat',
    金融: 'Keuangan',
    健康: 'Kesehatan',
    换算: 'Konverter',
    透明公式: 'Rumus transparan',
    计算口径: 'Metodologi',
    关于: 'Tentang',
    隐私: 'Privasi',
    联系: 'Kontak',
    返回全部工具: 'Kembali ke semua alat',
    输入: 'Input',
    调整你的数据: 'Sesuaikan data',
    建立你的情景: 'Bangun skenario',
    实时更新: 'Langsung',
    核心结果: 'Hasil utama',
    参考情景: 'Referensi',
    输入警告: 'Peringatan input',
    结果解读: 'Interpretasi',
    计算公式: 'Rumus',
    复制结果: 'Salin hasil',
    生成报告: 'Buat laporan',
    使用方法: 'Cara pakai',
    关于这项计算: 'Tentang perhitungan ini',
    如何使用: 'Cara menggunakan',
    数学: 'Matematika',
    日期: 'Tanggal',
    商业: 'Bisnis',
    科技: 'Teknologi',
    生活: 'Sehari-hari',
    出行: 'Perjalanan',
    家居: 'Rumah',
    教育: 'Pendidikan',
    全部: 'Semua',
    计算器: 'Kalkulator',
    浏览分类: 'Jelajahi kategori',
    方法与标准: 'Metode & standar',
    菜单: 'Menu',
    '一个入口，解决日常计算': 'Satu tempat untuk hitungan sehari-hari',
    答案不该藏在: 'Jawaban tidak seharusnya tersembunyi dalam',
    复杂公式: 'rumus rumit',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Kalkulator online gratis dan transparan. Hasil adalah estimasi, bukan nasihat profesional.',
    计算工作台: 'Ruang kerja kalkulasi',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Kalkulator gratis untuk kebutuhan sehari-hari. Hasil instan, rumus transparan, penjelasan jelas, tanpa daftar.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Cari pinjaman, BMI, biaya AI, konversi unit…',
    个首发工具: ' alat tersedia',
    实时计算: 'Perhitungan instan',
    移动端友好: 'Ramah seluler',
    计算器目录: 'Direktori kalkulator',
    '从问题出发，不从公式出发': 'Mulai dari pertanyaan, bukan rumus',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Pilih alat lalu ubah nilai apa pun—hasil langsung diperbarui.',
    打开工具: 'Buka alat',
    暂时没有匹配工具: 'Belum ada alat yang cocok',
    '换一个关键词试试。': 'Coba kata kunci lain.',
    'CALCMINTLY 标准': 'STANDAR CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Bukan sekadar angka—kami tunjukkan cara menghitungnya.',
    实时反馈: 'Umpan balik instan',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Hasil formulir berubah saat Anda mengetik. Pada papan tombol, tekan = untuk menyelesaikan hitungan.',
    公式透明: 'Rumus transparan',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Lihat metode, nilai default, dan batasan agar hasil mudah diperiksa.',
    情境解释: 'Konteks berguna',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Ubah hasil menjadi rentang dan panduan yang berguna tanpa presisi palsu.',
    常见问题: 'Pertanyaan umum',
    '使用前，你可能想知道': 'Yang perlu diketahui sebelum menghitung',
    '这些计算器免费吗？': 'Apakah kalkulator ini gratis?',
    '是。首发工具无需注册即可使用。': 'Ya. Alat yang tersedia gratis dan tanpa akun.',
    '数据会被上传吗？': 'Apakah data saya diunggah?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Perhitungan berjalan di browser. Kami tidak menerima angka yang Anda masukkan.',
    '结果能替代专业意见吗？': 'Apakah hasil menggantikan saran profesional?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Tidak. Hasil keuangan, kesehatan, dan bisnis adalah estimasi; gunakan profesional dan dokumen resmi untuk keputusan penting.',
  },
  ur: {
    全部工具: 'تمام ٹولز',
    金融: 'مالیات',
    健康: 'صحت',
    换算: 'کنورٹرز',
    透明公式: 'شفاف فارمولے',
    计算口径: 'طریقۂ کار',
    关于: 'تعارف',
    隐私: 'رازداری',
    联系: 'رابطہ',
    返回全部工具: 'تمام ٹولز پر واپس',
    输入: 'ان پٹس',
    调整你的数据: 'اپنا ڈیٹا ایڈجسٹ کریں',
    建立你的情景: 'اپنا منظرنامہ بنائیں',
    实时更新: 'لائیو',
    核心结果: 'اہم نتیجہ',
    参考情景: 'حوالہ',
    输入警告: 'ان پٹ وارننگ',
    结果解读: 'نتیجے کی تشریح',
    计算公式: 'فارمولا',
    复制结果: 'نتیجہ کاپی کریں',
    生成报告: 'رپورٹ بنائیں',
    使用方法: 'استعمال کا طریقہ',
    关于这项计算: 'اس حساب کے بارے میں',
    如何使用: 'کیسے استعمال کریں',
    数学: 'ریاضی',
    日期: 'تاریخیں',
    商业: 'کاروبار',
    科技: 'ٹیکنالوجی',
    生活: 'روزمرہ',
    出行: 'سفر',
    家居: 'گھر',
    教育: 'تعلیم',
    全部: 'سب',
    计算器: 'کیلکولیٹرز',
    浏览分类: 'زمرے دیکھیں',
    方法与标准: 'طریقے اور معیارات',
    菜单: 'مینو',
    '一个入口，解决日常计算': 'روزمرہ حساب کے لیے ایک جگہ',
    答案不该藏在: 'جوابات چھپے نہیں ہونے چاہئیں',
    复杂公式: 'پیچیدہ فارمولوں میں',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'مفت اور شفاف آن لائن کیلکولیٹر۔ نتائج تخمینے ہیں، پیشہ ورانہ مشورہ نہیں۔',
    计算工作台: 'کیلکولیشن ورک اسپیس',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'روزمرہ کاموں کے لیے مفت کیلکولیٹر۔ فوری نتائج، شفاف فارمولے اور واضح وضاحت، بغیر رجسٹریشن۔',
    '搜索贷款、BMI、AI成本、单位换算…': 'قرض، BMI، AI لاگت، یونٹ کنورژن تلاش کریں…',
    个首发工具: ' دستیاب ٹولز',
    实时计算: 'فوری حساب',
    移动端友好: 'موبائل فرینڈلی',
    计算器目录: 'کیلکولیٹر ڈائریکٹری',
    '从问题出发，不从公式出发': 'فارمولے سے نہیں، سوال سے شروع کریں',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'ایک ٹول منتخب کریں اور کوئی قدر بدلیں—نتیجہ فوراً اپ ڈیٹ ہوگا۔',
    打开工具: 'ٹول کھولیں',
    暂时没有匹配工具: 'ابھی کوئی مماثل ٹول نہیں',
    '换一个关键词试试。': 'کوئی اور لفظ آزمائیں۔',
    'CALCMINTLY 标准': 'CALCMINTLY معیار',
    '不只给一个数字，还告诉你数字怎么来的。': 'صرف عدد نہیں—ہم بتاتے ہیں کہ حساب کیسے ہوا۔',
    实时反馈: 'فوری فیڈبیک',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'فارم میں لکھتے ہی نتائج بدلتے ہیں۔ کی پیڈ پر حساب مکمل کرنے کے لیے = دبائیں۔',
    公式透明: 'شفاف فارمولے',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'طریقہ، ڈیفالٹس اور حدود دیکھیں تاکہ نتیجہ چیک کیا جا سکے۔',
    情境解释: 'مفید سیاق',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'جھوٹی درستگی کے بجائے قابلِ عمل رینج اور رہنمائی حاصل کریں۔',
    常见问题: 'عام سوالات',
    '使用前，你可能想知道': 'حساب سے پہلے جاننے کی باتیں',
    '这些计算器免费吗？': 'کیا یہ کیلکولیٹر مفت ہیں؟',
    '是。首发工具无需注册即可使用。': 'ہاں۔ دستیاب ٹولز مفت ہیں اور اکاؤنٹ درکار نہیں۔',
    '数据会被上传吗？': 'کیا میرا ڈیٹا اپ لوڈ ہوتا ہے؟',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'حساب آپ کے براؤزر میں ہوتا ہے۔ ہم آپ کی درج کردہ قدریں وصول نہیں کرتے۔',
    '结果能替代专业意见吗？': 'کیا نتائج پیشہ ورانہ مشورے کی جگہ لے سکتے ہیں؟',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'نہیں۔ مالی، صحت اور کاروباری نتائج تخمینے اور موازنے کے لیے ہیں؛ اہم فیصلوں میں ماہرین اور سرکاری دستاویزات دیکھیں۔',
  },
  ru: {
    全部工具: 'Все инструменты',
    金融: 'Финансы',
    健康: 'Здоровье',
    换算: 'Конвертеры',
    透明公式: 'Прозрачные формулы',
    计算口径: 'Методология',
    关于: 'О сервисе',
    隐私: 'Конфиденциальность',
    联系: 'Контакты',
    返回全部工具: 'Назад к инструментам',
    输入: 'Ввод',
    调整你的数据: 'Измените данные',
    建立你的情景: 'Создайте сценарий',
    实时更新: 'Онлайн',
    核心结果: 'Ключевой результат',
    参考情景: 'Ориентир',
    输入警告: 'Предупреждение ввода',
    结果解读: 'Интерпретация',
    计算公式: 'Формула',
    复制结果: 'Копировать результат',
    生成报告: 'Создать отчёт',
    使用方法: 'Как пользоваться',
    关于这项计算: 'Об этом расчёте',
    如何使用: 'Как использовать',
    数学: 'Математика',
    日期: 'Даты',
    商业: 'Бизнес',
    科技: 'Технологии',
    生活: 'Повседневное',
    出行: 'Поездки',
    家居: 'Дом',
    教育: 'Образование',
    全部: 'Все',
    计算器: 'Калькуляторы',
    浏览分类: 'Категории',
    方法与标准: 'Методы и стандарты',
    菜单: 'Меню',
    '一个入口，解决日常计算': 'Все повседневные расчёты в одном месте',
    答案不该藏在: 'Ответы не должны скрываться в',
    复杂公式: 'сложных формулах',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Бесплатные прозрачные онлайн-калькуляторы. Результаты — оценки, а не профессиональные рекомендации.',
    计算工作台: 'Рабочая область расчётов',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Бесплатные калькуляторы для повседневных задач: мгновенные результаты, прозрачные формулы и понятные объяснения без регистрации.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Искать кредит, BMI, стоимость ИИ, конвертацию…',
    个首发工具: ' доступных инструментов',
    实时计算: 'Мгновенный расчёт',
    移动端友好: 'Удобно на мобильных',
    计算器目录: 'Каталог калькуляторов',
    '从问题出发，不从公式出发': 'Начинайте с вопроса, а не с формулы',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Выберите инструмент и измените любое значение — результат обновится сразу.',
    打开工具: 'Открыть инструмент',
    暂时没有匹配工具: 'Подходящих инструментов пока нет',
    '换一个关键词试试。': 'Попробуйте другой запрос.',
    'CALCMINTLY 标准': 'СТАНДАРТ CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Не просто число — мы показываем, как оно рассчитано.',
    实时反馈: 'Мгновенная обратная связь',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Результаты в формах обновляются при вводе. На клавиатуре нажмите =, чтобы завершить расчёт.',
    公式透明: 'Прозрачные формулы',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Показываем метод, значения по умолчанию и ограничения для проверки расчёта.',
    情境解释: 'Полезный контекст',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Превращаем результаты в полезные диапазоны и ориентиры без ложной точности.',
    常见问题: 'Частые вопросы',
    '使用前，你可能想知道': 'Что стоит знать перед расчётом',
    '这些计算器免费吗？': 'Эти калькуляторы бесплатны?',
    '是。首发工具无需注册即可使用。': 'Да. Доступные инструменты бесплатны и не требуют аккаунта.',
    '数据会被上传吗？': 'Мои данные загружаются?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Расчёты выполняются в браузере. Мы не получаем введённые значения.',
    '结果能替代专业意见吗？': 'Могут ли результаты заменить мнение специалиста?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Нет. Финансовые, медицинские и деловые результаты служат для оценки и сравнения; для важных решений используйте специалистов и официальные документы.',
  },
  de: {
    全部工具: 'Alle Tools',
    金融: 'Finanzen',
    健康: 'Gesundheit',
    换算: 'Umrechner',
    透明公式: 'Transparente Formeln',
    计算口径: 'Methodik',
    关于: 'Über uns',
    隐私: 'Datenschutz',
    联系: 'Kontakt',
    返回全部工具: 'Zurück zu allen Tools',
    输入: 'Eingaben',
    调整你的数据: 'Daten anpassen',
    建立你的情景: 'Szenario erstellen',
    实时更新: 'Live',
    核心结果: 'Kernergebnis',
    参考情景: 'Referenz',
    输入警告: 'Eingabewarnung',
    结果解读: 'Interpretation',
    计算公式: 'Formel',
    复制结果: 'Ergebnis kopieren',
    生成报告: 'Bericht erstellen',
    使用方法: 'Anwendung',
    关于这项计算: 'Über diese Berechnung',
    如何使用: 'So verwenden',
    数学: 'Mathematik',
    日期: 'Datum',
    商业: 'Business',
    科技: 'Technologie',
    生活: 'Alltag',
    出行: 'Reise',
    家居: 'Haushalt',
    教育: 'Bildung',
    全部: 'Alle',
    计算器: 'Rechner',
    浏览分类: 'Kategorien durchsuchen',
    方法与标准: 'Methoden & Standards',
    菜单: 'Menü',
    '一个入口，解决日常计算': 'Ein Ort für alltägliche Berechnungen',
    答案不该藏在: 'Antworten sollten nicht in',
    复杂公式: 'komplizierten Formeln versteckt sein',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Kostenlose, transparente Online-Rechner. Ergebnisse sind Schätzungen und keine professionelle Beratung.',
    计算工作台: 'Rechenbereich',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Kostenlose Rechner für Alltagsfragen. Sofortige Ergebnisse, transparente Formeln und klare Erklärungen – ohne Anmeldung.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Kredit, BMI, KI-Kosten, Einheiten suchen…',
    个首发工具: ' verfügbare Tools',
    实时计算: 'Sofortberechnung',
    移动端友好: 'Mobilfreundlich',
    计算器目录: 'Rechnerverzeichnis',
    '从问题出发，不从公式出发': 'Mit der Frage beginnen, nicht mit der Formel',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Tool wählen und einen Wert ändern – das Ergebnis aktualisiert sich sofort.',
    打开工具: 'Tool öffnen',
    暂时没有匹配工具: 'Noch kein passendes Tool',
    '换一个关键词试试。': 'Versuchen Sie ein anderes Stichwort.',
    'CALCMINTLY 标准': 'DER CALCMINTLY-STANDARD',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Mehr als eine Zahl – wir zeigen, wie sie berechnet wurde.',
    实时反馈: 'Sofortiges Feedback',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Formularrechner reagieren auf Eingaben. Beim Tastenrechner schließt = die Berechnung ab.',
    公式透明: 'Transparente Formeln',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Methode, Standardwerte und Grenzen sind sichtbar und nachprüfbar.',
    情境解释: 'Nützlicher Kontext',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Ergebnisse werden zu brauchbaren Bereichen und Hinweisen statt falscher Präzision.',
    常见问题: 'Häufige Fragen',
    '使用前，你可能想知道': 'Was Sie vor dem Rechnen wissen sollten',
    '这些计算器免费吗？': 'Sind diese Rechner kostenlos?',
    '是。首发工具无需注册即可使用。':
      'Ja. Die verfügbaren Tools sind kostenlos und ohne Konto nutzbar.',
    '数据会被上传吗？': 'Werden meine Daten hochgeladen?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Die Berechnungen laufen im Browser. Wir erhalten Ihre eingegebenen Werte nicht.',
    '结果能替代专业意见吗？': 'Ersetzen die Ergebnisse professionelle Beratung?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Nein. Finanz-, Gesundheits- und Geschäftsergebnisse dienen Schätzung und Vergleich; nutzen Sie Fachleute und offizielle Unterlagen für wichtige Entscheidungen.',
  },
  ja: {
    全部工具: 'すべてのツール',
    金融: '金融',
    健康: '健康',
    换算: '換算',
    透明公式: '透明な計算式',
    计算口径: '計算方法',
    关于: '概要',
    隐私: 'プライバシー',
    联系: 'お問い合わせ',
    返回全部工具: 'すべてのツールへ戻る',
    输入: '入力',
    调整你的数据: 'データを調整',
    建立你的情景: 'シナリオを作成',
    实时更新: 'リアルタイム',
    核心结果: '主要結果',
    参考情景: '参考',
    输入警告: '入力警告',
    结果解读: '結果の解釈',
    计算公式: '計算式',
    复制结果: '結果をコピー',
    生成报告: 'レポート作成',
    使用方法: '使い方',
    关于这项计算: 'この計算について',
    如何使用: '使い方',
    数学: '数学',
    日期: '日付',
    商业: 'ビジネス',
    科技: 'テクノロジー',
    生活: '生活',
    出行: '移動',
    家居: '住まい',
    教育: '教育',
    全部: 'すべて',
    计算器: '計算機',
    浏览分类: 'カテゴリーから探す',
    方法与标准: '方法と基準',
    菜单: 'メニュー',
    '一个入口，解决日常计算': '日常の計算をひとつの場所で',
    答案不该藏在: '答えを隠す必要はありません',
    复杂公式: '複雑な数式の中に',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      '無料で透明性の高いオンライン計算機です。結果は目安であり、専門的な助言ではありません。',
    计算工作台: '計算ワークスペース',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      '日常の幅広い計算を無料で。入力するとすぐ結果が出て、数式と前提も確認できます。登録不要です。',
    '搜索贷款、BMI、AI成本、单位换算…': 'ローン、BMI、AIコスト、単位換算を検索…',
    个首发工具: ' 個の利用可能ツール',
    实时计算: 'リアルタイム計算',
    移动端友好: 'モバイル対応',
    计算器目录: '計算機一覧',
    '从问题出发，不从公式出发': '数式ではなく、問いから始める',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'ツールを選び数値を変えると、結果がすぐ更新されます。',
    打开工具: 'ツールを開く',
    暂时没有匹配工具: '一致するツールがまだありません',
    '换一个关键词试试。': '別のキーワードを試してください。',
    'CALCMINTLY 标准': 'CALCMINTLY の基準',
    '不只给一个数字，还告诉你数字怎么来的。': '数字だけでなく、どう計算したかも示します。',
    实时反馈: '即時フィードバック',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'フォームは入力に応じて結果を更新します。キー式電卓は = で計算を確定します。',
    公式透明: '透明な計算式',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      '計算方法、初期値、適用範囲を示し、確認・再計算しやすくします。',
    情境解释: '役立つ文脈',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      '見せかけの精密さではなく、実用的な範囲とヒントに変換します。',
    常见问题: 'よくある質問',
    '使用前，你可能想知道': '計算前に知っておきたいこと',
    '这些计算器免费吗？': '計算機は無料ですか？',
    '是。首发工具无需注册即可使用。': 'はい。利用可能なツールは無料で、アカウントも不要です。',
    '数据会被上传吗？': '入力データは送信されますか？',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      '計算はブラウザ内で行われ、入力した数値を当社が受信することはありません。',
    '结果能替代专业意见吗？': '結果は専門家の助言の代わりになりますか？',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'いいえ。金融・健康・ビジネスの結果は推定と比較用です。重要な判断では専門家や公式資料を確認してください。',
  },
  pcm: {
    全部工具: 'All tools',
    金融: 'Finance',
    健康: 'Health',
    换算: 'Converters',
    透明公式: 'Clear formulas',
    计算口径: 'Method',
    关于: 'About',
    隐私: 'Privacy',
    联系: 'Contact',
    返回全部工具: 'Back to all tools',
    输入: 'Inputs',
    调整你的数据: 'Adjust your data',
    建立你的情景: 'Build your scenario',
    实时更新: 'Live',
    核心结果: 'Main result',
    参考情景: 'Reference',
    输入警告: 'Input warning',
    结果解读: 'Result meaning',
    计算公式: 'Formula',
    复制结果: 'Copy result',
    生成报告: 'Create report',
    使用方法: 'How to use am',
    关于这项计算: 'About this calculation',
    如何使用: 'How to use',
    数学: 'Math',
    日期: 'Dates',
    商业: 'Business',
    科技: 'Technology',
    生活: 'Everyday',
    出行: 'Travel',
    家居: 'Home',
    教育: 'Education',
    全部: 'All',
    计算器: 'Calculators',
    浏览分类: 'Browse categories',
    方法与标准: 'Methods & standards',
    菜单: 'Menu',
    '一个入口，解决日常计算': 'One place for everyday calculations',
    答案不该藏在: 'Answer no suppose hide inside',
    复杂公式: 'complex formulas',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Free, clear online calculators. Results na estimate, no be professional advice.',
    计算工作台: 'Calculation workspace',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Free calculators for everyday things. Result show immediately, formula clear, explanation simple, no sign-up.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Search loan, BMI, AI cost, unit conversion…',
    个首发工具: ' tools available',
    实时计算: 'Instant calculation',
    移动端友好: 'Mobile friendly',
    计算器目录: 'Calculator directory',
    '从问题出发，不从公式出发': 'Start from the question, no be formula',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Choose tool, change any value, result go update immediately.',
    打开工具: 'Open tool',
    暂时没有匹配工具: 'No matching tool yet',
    '换一个关键词试试。': 'Try another keyword.',
    'CALCMINTLY 标准': 'CALCMINTLY STANDARD',
    '不只给一个数字，还告诉你数字怎么来的。': 'No be only number—we show how we calculate am.',
    实时反馈: 'Instant feedback',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Form calculators dey update as you type. For keypad, press = to finish the calculation.',
    公式透明: 'Clear formulas',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'See method, defaults and limits so you fit check the result.',
    情境解释: 'Useful context',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Turn result to useful range and guidance, no fake precision.',
    常见问题: 'Common questions',
    '使用前，你可能想知道': 'Wetin to know before you calculate',
    '这些计算器免费吗？': 'These calculators free?',
    '是。首发工具无需注册即可使用。': 'Yes. Available tools free and no account needed.',
    '数据会被上传吗？': 'Una dey upload my data?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Calculation dey happen inside your browser. We no receive the values wey you enter.',
    '结果能替代专业意见吗？': 'Result fit replace professional advice?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'No. Finance, health and business results na for estimate and comparison; use professionals and official documents for important decisions.',
  },
  mr: {
    全部工具: 'सर्व साधने',
    金融: 'वित्त',
    健康: 'आरोग्य',
    换算: 'रूपांतरण',
    透明公式: 'पारदर्शक सूत्रे',
    计算口径: 'पद्धत',
    关于: 'माहिती',
    隐私: 'गोपनीयता',
    联系: 'संपर्क',
    返回全部工具: 'सर्व साधनांकडे परत',
    输入: 'इनपुट',
    调整你的数据: 'डेटा समायोजित करा',
    建立你的情景: 'परिस्थिती तयार करा',
    实时更新: 'लाइव्ह',
    核心结果: 'मुख्य निकाल',
    参考情景: 'संदर्भ',
    输入警告: 'इनपुट चेतावणी',
    结果解读: 'निकालाचे स्पष्टीकरण',
    计算公式: 'सूत्र',
    复制结果: 'निकाल कॉपी करा',
    生成报告: 'अहवाल तयार करा',
    使用方法: 'कसे वापरावे',
    关于这项计算: 'या गणनेबद्दल',
    如何使用: 'कसे वापरावे',
    数学: 'गणित',
    日期: 'तारीख',
    商业: 'व्यवसाय',
    科技: 'तंत्रज्ञान',
    生活: 'दैनंदिन',
    出行: 'प्रवास',
    家居: 'घर',
    教育: 'शिक्षण',
    全部: 'सर्व',
    计算器: 'कॅल्क्युलेटर',
    浏览分类: 'वर्ग पाहा',
    方法与标准: 'पद्धती व मानके',
    菜单: 'मेनू',
    '一个入口，解决日常计算': 'दैनंदिन गणनेसाठी एकच ठिकाण',
    答案不该藏在: 'उत्तरे लपलेली नसावीत',
    复杂公式: 'गुंतागुंतीच्या सूत्रांमध्ये',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'मोफत आणि पारदर्शक ऑनलाइन कॅल्क्युलेटर. निकाल अंदाज आहेत, व्यावसायिक सल्ला नाही.',
    计算工作台: 'कॅल्क्युलेशन वर्कस्पेस',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'दैनंदिन गरजांसाठी मोफत कॅल्क्युलेटर. तत्काळ निकाल, पारदर्शक सूत्रे आणि स्पष्ट स्पष्टीकरण; नोंदणी नाही.',
    '搜索贷款、BMI、AI成本、单位换算…': 'कर्ज, BMI, AI खर्च, युनिट रूपांतरण शोधा…',
    个首发工具: ' उपलब्ध साधने',
    实时计算: 'तत्काळ गणना',
    移动端友好: 'मोबाइल अनुकूल',
    计算器目录: 'कॅल्क्युलेटर निर्देशिका',
    '从问题出发，不从公式出发': 'सूत्रापेक्षा प्रश्नापासून सुरू करा',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'एक साधन निवडा आणि कोणतेही मूल्य बदला—निकाल लगेच अपडेट होईल.',
    打开工具: 'साधन उघडा',
    暂时没有匹配工具: 'सध्या जुळणारे साधन नाही',
    '换一个关键词试试。': 'दुसरा कीवर्ड वापरा.',
    'CALCMINTLY 标准': 'CALCMINTLY मानक',
    '不只给一个数字，还告诉你数字怎么来的。': 'फक्त संख्या नाही—ती कशी मोजली तेही दाखवतो.',
    实时反馈: 'तत्काळ प्रतिसाद',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'फॉर्ममध्ये लिहिताच निकाल बदलतात. कीपॅडवर गणना पूर्ण करण्यासाठी = दाबा.',
    公式透明: 'पारदर्शक सूत्रे',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'पद्धत, डीफॉल्ट आणि मर्यादा पाहून निकाल तपासा.',
    情境解释: 'उपयोगी संदर्भ',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'खोटी अचूकता न देता उपयोगी श्रेणी आणि सूचना मिळवा.',
    常见问题: 'सामान्य प्रश्न',
    '使用前，你可能想知道': 'गणनेपूर्वी काय जाणून घ्यावे',
    '这些计算器免费吗？': 'हे कॅल्क्युलेटर मोफत आहेत का?',
    '是。首发工具无需注册即可使用。': 'हो. उपलब्ध साधने मोफत आहेत आणि खाते लागत नाही.',
    '数据会被上传吗？': 'माझा डेटा अपलोड होतो का?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'गणना तुमच्या ब्राउझरमध्ये होते. तुम्ही दिलेली मूल्ये आम्हाला मिळत नाहीत.',
    '结果能替代专业意见吗？': 'निकाल व्यावसायिक सल्ल्याची जागा घेऊ शकतात का?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'नाही. वित्त, आरोग्य आणि व्यवसाय निकाल अंदाज व तुलना यासाठी आहेत; महत्त्वाच्या निर्णयांसाठी तज्ज्ञ व अधिकृत कागदपत्रे वापरा.',
  },
  vi: {
    全部工具: 'Tất cả công cụ',
    金融: 'Tài chính',
    健康: 'Sức khỏe',
    换算: 'Chuyển đổi',
    透明公式: 'Công thức minh bạch',
    计算口径: 'Phương pháp',
    关于: 'Giới thiệu',
    隐私: 'Quyền riêng tư',
    联系: 'Liên hệ',
    返回全部工具: 'Quay lại công cụ',
    输入: 'Đầu vào',
    调整你的数据: 'Điều chỉnh dữ liệu',
    建立你的情景: 'Tạo kịch bản',
    实时更新: 'Trực tiếp',
    核心结果: 'Kết quả chính',
    参考情景: 'Tham chiếu',
    输入警告: 'Cảnh báo đầu vào',
    结果解读: 'Diễn giải kết quả',
    计算公式: 'Công thức',
    复制结果: 'Sao chép kết quả',
    生成报告: 'Tạo báo cáo',
    使用方法: 'Cách dùng',
    关于这项计算: 'Về phép tính này',
    如何使用: 'Cách sử dụng',
    数学: 'Toán',
    日期: 'Ngày tháng',
    商业: 'Kinh doanh',
    科技: 'Công nghệ',
    生活: 'Hằng ngày',
    出行: 'Đi lại',
    家居: 'Gia đình',
    教育: 'Giáo dục',
    全部: 'Tất cả',
    计算器: 'Máy tính',
    浏览分类: 'Duyệt danh mục',
    方法与标准: 'Phương pháp & tiêu chuẩn',
    菜单: 'Menu',
    '一个入口，解决日常计算': 'Một nơi cho các phép tính hằng ngày',
    答案不该藏在: 'Câu trả lời không nên ẩn trong',
    复杂公式: 'công thức phức tạp',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Máy tính trực tuyến miễn phí và minh bạch. Kết quả chỉ là ước tính, không phải tư vấn chuyên môn.',
    计算工作台: 'Không gian tính toán',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Máy tính miễn phí cho nhiều nhu cầu hằng ngày. Kết quả tức thì, công thức minh bạch, giải thích rõ ràng, không cần đăng ký.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Tìm khoản vay, BMI, chi phí AI, đổi đơn vị…',
    个首发工具: ' công cụ khả dụng',
    实时计算: 'Tính tức thì',
    移动端友好: 'Thân thiện di động',
    计算器目录: 'Danh mục máy tính',
    '从问题出发，不从公式出发': 'Bắt đầu từ câu hỏi, không phải công thức',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Chọn công cụ và thay đổi bất kỳ giá trị nào—kết quả cập nhật ngay.',
    打开工具: 'Mở công cụ',
    暂时没有匹配工具: 'Chưa có công cụ phù hợp',
    '换一个关键词试试。': 'Thử từ khóa khác.',
    'CALCMINTLY 标准': 'TIÊU CHUẨN CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Không chỉ đưa ra con số—chúng tôi cho bạn biết cách tính.',
    实时反馈: 'Phản hồi tức thì',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Kết quả biểu mẫu cập nhật khi nhập. Trên bàn phím, nhấn = để hoàn tất phép tính.',
    公式透明: 'Công thức minh bạch',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Xem phương pháp, giá trị mặc định và giới hạn để kiểm tra kết quả.',
    情境解释: 'Ngữ cảnh hữu ích',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Biến kết quả thành phạm vi và gợi ý hữu ích thay vì tạo độ chính xác giả.',
    常见问题: 'Câu hỏi thường gặp',
    '使用前，你可能想知道': 'Điều cần biết trước khi tính',
    '这些计算器免费吗？': 'Các máy tính này có miễn phí không?',
    '是。首发工具无需注册即可使用。': 'Có. Các công cụ hiện có miễn phí và không cần tài khoản.',
    '数据会被上传吗？': 'Dữ liệu của tôi có bị tải lên không?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Phép tính chạy trong trình duyệt. Chúng tôi không nhận các giá trị bạn nhập.',
    '结果能替代专业意见吗？': 'Kết quả có thay thế tư vấn chuyên môn không?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Không. Kết quả tài chính, sức khỏe và kinh doanh dùng để ước tính và so sánh; hãy dùng chuyên gia và tài liệu chính thức cho quyết định quan trọng.',
  },
  te: {
    全部工具: 'అన్ని టూల్స్',
    金融: 'ఫైనాన్స్',
    健康: 'ఆరోగ్యం',
    换算: 'కన్వర్టర్లు',
    透明公式: 'పారదర్శక ఫార్ములాలు',
    计算口径: 'పద్ధతి',
    关于: 'గురించి',
    隐私: 'గోప్యత',
    联系: 'సంప్రదింపు',
    返回全部工具: 'అన్ని టూల్స్‌కు తిరుగు',
    输入: 'ఇన్‌పుట్‌లు',
    调整你的数据: 'డేటాను సర్దుబాటు చేయండి',
    建立你的情景: 'సన్నివేశం రూపొందించండి',
    实时更新: 'లైవ్',
    核心结果: 'ముఖ్య ఫలితం',
    参考情景: 'సూచన',
    输入警告: 'ఇన్‌పుట్ హెచ్చరిక',
    结果解读: 'ఫలిత వివరణ',
    计算公式: 'ఫార్ములా',
    复制结果: 'ఫలితం కాపీ',
    生成报告: 'రిపోర్ట్ రూపొందించండి',
    使用方法: 'ఎలా ఉపయోగించాలి',
    关于这项计算: 'ఈ లెక్క గురించి',
    如何使用: 'ఎలా ఉపయోగించాలి',
    数学: 'గణితం',
    日期: 'తేదీలు',
    商业: 'వ్యాపారం',
    科技: 'సాంకేతికత',
    生活: 'దైనందిన',
    出行: 'ప్రయాణం',
    家居: 'ఇల్లు',
    教育: 'విద్య',
    全部: 'అన్నీ',
    计算器: 'క్యాలిక్యులేటర్లు',
    浏览分类: 'వర్గాలు చూడండి',
    方法与标准: 'పద్ధతులు & ప్రమాణాలు',
    菜单: 'మెను',
    '一个入口，解决日常计算': 'రోజువారీ లెక్కలకు ఒకే చోటు',
    答案不该藏在: 'సమాధానాలు దాగి ఉండకూడదు',
    复杂公式: 'క్లిష్టమైన ఫార్ములాల్లో',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'ఉచిత, పారదర్శక ఆన్‌లైన్ క్యాలిక్యులేటర్లు. ఫలితాలు అంచనాలు మాత్రమే; వృత్తిపరమైన సలహా కాదు.',
    计算工作台: 'క్యాలిక్యులేషన్ వర్క్‌స్పేస్',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'రోజువారీ అవసరాలకు ఉచిత క్యాలిక్యులేటర్లు. వెంటనే ఫలితాలు, పారదర్శక ఫార్ములాలు, స్పష్టమైన వివరణలు; నమోదు అవసరం లేదు.',
    '搜索贷款、BMI、AI成本、单位换算…': 'లోన్, BMI, AI ఖర్చు, యూనిట్ కన్వర్షన్ వెతకండి…',
    个首发工具: ' అందుబాటులో ఉన్న టూల్స్',
    实时计算: 'తక్షణ లెక్క',
    移动端友好: 'మొబైల్‌కు అనుకూలం',
    计算器目录: 'క్యాలిక్యులేటర్ డైరెక్టరీ',
    '从问题出发，不从公式出发': 'ఫార్ములా కాదు, ప్రశ్నతో ప్రారంభించండి',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'ఒక టూల్ ఎంచుకుని ఏ విలువైనా మార్చండి—ఫలితం వెంటనే అప్‌డేట్ అవుతుంది.',
    打开工具: 'టూల్ తెరవండి',
    暂时没有匹配工具: 'ప్రస్తుతం సరిపోయే టూల్ లేదు',
    '换一个关键词试试。': 'మరో కీవర్డ్ ప్రయత్నించండి.',
    'CALCMINTLY 标准': 'CALCMINTLY ప్రమాణం',
    '不只给一个数字，还告诉你数字怎么来的。': 'సంఖ్య మాత్రమే కాదు—ఎలా లెక్కించామో చూపిస్తాము.',
    实时反馈: 'తక్షణ స్పందన',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'ఫారమ్‌లో టైప్ చేస్తుంటే ఫలితాలు మారుతాయి. కీప్యాడ్‌లో గణన పూర్తి చేయడానికి = నొక్కండి.',
    公式透明: 'పారదర్శక ఫార్ములాలు',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'పద్ధతి, డిఫాల్ట్‌లు, పరిమితులను చూసి ఫలితాన్ని తనిఖీ చేయండి.',
    情境解释: 'ఉపయోగకరమైన సందర్భం',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'కృత్రిమ ఖచ్చితత్వం కాకుండా ఉపయోగకరమైన పరిధులు, సూచనలు పొందండి.',
    常见问题: 'సాధారణ ప్రశ్నలు',
    '使用前，你可能想知道': 'లెక్కకు ముందు తెలుసుకోవాల్సినవి',
    '这些计算器免费吗？': 'ఈ క్యాలిక్యులేటర్లు ఉచితమా?',
    '是。首发工具无需注册即可使用。': 'అవును. అందుబాటులో ఉన్న టూల్స్ ఉచితం; ఖాతా అవసరం లేదు.',
    '数据会被上传吗？': 'నా డేటా అప్‌లోడ్ అవుతుందా?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'లెక్కలు మీ బ్రౌజర్‌లోనే జరుగుతాయి. మీరు ఇచ్చిన విలువలను మేము స్వీకరించము.',
    '结果能替代专业意见吗？': 'ఫలితాలు వృత్తిపరమైన సలహాను భర్తీ చేస్తాయా?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'కాదు. ఆర్థిక, ఆరోగ్య, వ్యాపార ఫలితాలు అంచనా/పోలిక కోసం మాత్రమే; ముఖ్య నిర్ణయాలకు నిపుణులు, అధికారిక పత్రాలు ఉపయోగించండి.',
  },
  sw: {
    全部工具: 'Zana zote',
    金融: 'Fedha',
    健康: 'Afya',
    换算: 'Vibadilishaji',
    透明公式: 'Fomula wazi',
    计算口径: 'Mbinu',
    关于: 'Kuhusu',
    隐私: 'Faragha',
    联系: 'Mawasiliano',
    返回全部工具: 'Rudi kwenye zana',
    输入: 'Ingizo',
    调整你的数据: 'Rekebisha data',
    建立你的情景: 'Jenga hali yako',
    实时更新: 'Moja kwa moja',
    核心结果: 'Matokeo muhimu',
    参考情景: 'Rejea',
    输入警告: 'Onyo la ingizo',
    结果解读: 'Tafsiri ya matokeo',
    计算公式: 'Fomula',
    复制结果: 'Nakili matokeo',
    生成报告: 'Tengeneza ripoti',
    使用方法: 'Jinsi ya kutumia',
    关于这项计算: 'Kuhusu hesabu hii',
    如何使用: 'Jinsi ya kutumia',
    数学: 'Hisabati',
    日期: 'Tarehe',
    商业: 'Biashara',
    科技: 'Teknolojia',
    生活: 'Kila siku',
    出行: 'Usafiri',
    家居: 'Nyumbani',
    教育: 'Elimu',
    全部: 'Zote',
    计算器: 'Vikokotoo',
    浏览分类: 'Vinjari kategoria',
    方法与标准: 'Mbinu na viwango',
    菜单: 'Menyu',
    '一个入口，解决日常计算': 'Sehemu moja kwa hesabu za kila siku',
    答案不该藏在: 'Majibu hayapaswi kujificha ndani ya',
    复杂公式: 'fomula ngumu',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Vikokotoo vya mtandaoni vya bure na wazi. Matokeo ni makadirio, si ushauri wa kitaalamu.',
    计算工作台: 'Eneo la hesabu',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Vikokotoo vya bure kwa mahitaji ya kila siku. Matokeo ya papo hapo, fomula wazi na maelezo rahisi, bila usajili.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Tafuta mkopo, BMI, gharama ya AI, ubadilishaji…',
    个首发工具: ' zana zinazopatikana',
    实时计算: 'Hesabu ya papo hapo',
    移动端友好: 'Inafaa kwa simu',
    计算器目录: 'Orodha ya vikokotoo',
    '从问题出发，不从公式出发': 'Anza na swali, si fomula',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Chagua zana na badili thamani yoyote—matokeo yatasasishwa mara moja.',
    打开工具: 'Fungua zana',
    暂时没有匹配工具: 'Bado hakuna zana inayolingana',
    '换一个关键词试试。': 'Jaribu neno jingine.',
    'CALCMINTLY 标准': 'KIWANGO CHA CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。': 'Si namba tu—tunaonyesha ilivyokokotolewa.',
    实时反馈: 'Majibu ya papo hapo',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Matokeo ya fomu hubadilika unapoandika. Kwenye vitufe, bonyeza = kukamilisha hesabu.',
    公式透明: 'Fomula wazi',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Angalia mbinu, chaguo-msingi na mipaka ili kuthibitisha matokeo.',
    情境解释: 'Muktadha muhimu',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Geuza matokeo kuwa viwango na maelekezo yanayofaa bila usahihi wa bandia.',
    常见问题: 'Maswali ya kawaida',
    '使用前，你可能想知道': 'Unachopaswa kujua kabla ya kukokotoa',
    '这些计算器免费吗？': 'Vikokotoo hivi ni bure?',
    '是。首发工具无需注册即可使用。': 'Ndiyo. Zana zinazopatikana ni bure na hazihitaji akaunti.',
    '数据会被上传吗？': 'Data yangu inapakiwa?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Hesabu hufanyika kwenye kivinjari chako. Hatupokei thamani unazoingiza.',
    '结果能替代专业意见吗？': 'Matokeo yanaweza kuchukua nafasi ya ushauri wa kitaalamu?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Hapana. Matokeo ya fedha, afya na biashara ni kwa makadirio na ulinganisho; tumia wataalamu na nyaraka rasmi kwa maamuzi muhimu.',
  },
  ha: {
    全部工具: 'Duk kayan aiki',
    金融: 'Kuɗi',
    健康: 'Lafiya',
    换算: 'Canji',
    透明公式: 'Tsarukan lissafi masu bayyani',
    计算口径: 'Hanya',
    关于: 'Game da mu',
    隐私: 'Sirri',
    联系: 'Tuntuɓa',
    返回全部工具: 'Koma ga kayan aiki',
    输入: 'Abubuwan shigarwa',
    调整你的数据: 'Daidaita bayananka',
    建立你的情景: 'Gina yanayinka',
    实时更新: 'Kai tsaye',
    核心结果: 'Babban sakamako',
    参考情景: 'Nuni',
    输入警告: 'Gargadin shigarwa',
    结果解读: 'Fassarar sakamako',
    计算公式: 'Tsarin lissafi',
    复制结果: 'Kwafi sakamako',
    生成报告: 'Ƙirƙiri rahoto',
    使用方法: 'Yadda ake amfani',
    关于这项计算: 'Game da wannan lissafi',
    如何使用: 'Yadda ake amfani',
    数学: 'Lissafi',
    日期: 'Kwanaki',
    商业: 'Kasuwanci',
    科技: 'Fasaha',
    生活: 'Rayuwa',
    出行: 'Tafiya',
    家居: 'Gida',
    教育: 'Ilimi',
    全部: 'Duka',
    计算器: 'Kalkuleta',
    浏览分类: 'Duba rukuni',
    方法与标准: "Hanyoyi da ka'idoji",
    菜单: 'Menu',
    '一个入口，解决日常计算': 'Wuri ɗaya don lissafin yau da kullum',
    答案不该藏在: 'Amsoshi kada su ɓoye a cikin',
    复杂公式: 'tsarukan lissafi masu rikitarwa',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Kalkuletocin yanar gizo kyauta kuma a bayyane. Sakamako kimantawa ne, ba shawarar ƙwararre ba.',
    计算工作台: 'Wurin lissafi',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Kalkuletoci kyauta don bukatun yau da kullum. Sakamako nan take, tsari bayyananne da bayanin sauƙi, babu rajista.',
    '搜索贷款、BMI、AI成本、单位换算…': "Nemo bashi, BMI, kuɗin AI, canjin raka'a…",
    个首发工具: ' kayan aiki',
    实时计算: 'Lissafi nan take',
    移动端友好: 'Ya dace da waya',
    计算器目录: 'Jerin kalkuletoci',
    '从问题出发，不从公式出发': 'Fara da tambaya, ba tsari ba',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Zaɓi kayan aiki ka canza kowace ƙima—sakamako zai sabunta nan take.',
    打开工具: 'Buɗe kayan aiki',
    暂时没有匹配工具: 'Babu kayan aiki da ya dace yanzu',
    '换一个关键词试试。': 'Gwada wata kalma.',
    'CALCMINTLY 标准': 'MATSAYIN CALCMINTLY',
    '不只给一个数字，还告诉你数字怎么来的。': 'Ba lamba kawai ba—muna nuna yadda aka lissafta ta.',
    实时反馈: 'Amsa nan take',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Sakamakon fom yana sabuntawa yayin rubutu. A madannin lissafi, danna = don kammalawa.',
    公式透明: 'Tsarukan lissafi masu bayyani',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Duba hanya, tsoffin ƙima da iyaka don tabbatar da sakamako.',
    情境解释: 'Bayani mai amfani',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Mayar da sakamako zuwa kewayo da shawarwari masu amfani ba tare da ƙarya daidaito ba.',
    常见问题: 'Tambayoyin da ake yawan yi',
    '使用前，你可能想知道': 'Abin da ya kamata ka sani kafin lissafi',
    '这些计算器免费吗？': 'Kalkuletocin nan kyauta ne?',
    '是。首发工具无需注册即可使用。':
      'Eh. Kayan aikin da ake da su kyauta ne kuma ba sa buƙatar asusu.',
    '数据会被上传吗？': 'Ana ɗora bayanaina?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Lissafi yana gudana a burauzarka. Ba mu karɓar ƙimomin da ka shigar.',
    '结果能替代专业意见吗？': 'Sakamako zai iya maye gurbin shawarar ƙwararre?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      "A'a. Sakamakon kuɗi, lafiya da kasuwanci don kimantawa da kwatantawa ne; yi amfani da ƙwararru da takardun hukuma don muhimman yanke shawara.",
  },
  tr: {
    全部工具: 'Tüm araçlar',
    金融: 'Finans',
    健康: 'Sağlık',
    换算: 'Dönüştürücüler',
    透明公式: 'Şeffaf formüller',
    计算口径: 'Metodoloji',
    关于: 'Hakkında',
    隐私: 'Gizlilik',
    联系: 'İletişim',
    返回全部工具: 'Tüm araçlara dön',
    输入: 'Girdiler',
    调整你的数据: 'Verilerinizi ayarlayın',
    建立你的情景: 'Senaryonuzu oluşturun',
    实时更新: 'Canlı',
    核心结果: 'Ana sonuç',
    参考情景: 'Referans',
    输入警告: 'Girdi uyarısı',
    结果解读: 'Sonuç yorumu',
    计算公式: 'Formül',
    复制结果: 'Sonucu kopyala',
    生成报告: 'Rapor oluştur',
    使用方法: 'Nasıl kullanılır',
    关于这项计算: 'Bu hesaplama hakkında',
    如何使用: 'Nasıl kullanılır',
    数学: 'Matematik',
    日期: 'Tarihler',
    商业: 'İş',
    科技: 'Teknoloji',
    生活: 'Günlük',
    出行: 'Seyahat',
    家居: 'Ev',
    教育: 'Eğitim',
    全部: 'Tümü',
    计算器: 'Hesaplayıcılar',
    浏览分类: 'Kategorilere göz at',
    方法与标准: 'Yöntemler ve standartlar',
    菜单: 'Menü',
    '一个入口，解决日常计算': 'Günlük hesaplamalar için tek yer',
    答案不该藏在: 'Cevaplar şunun içinde saklanmamalı',
    复杂公式: 'karmaşık formüller',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      'Ücretsiz ve şeffaf çevrimiçi hesaplayıcılar. Sonuçlar tahmindir, profesyonel tavsiye değildir.',
    计算工作台: 'Hesaplama çalışma alanı',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      'Günlük ihtiyaçlar için ücretsiz hesaplayıcılar. Anında sonuç, şeffaf formüller ve açık açıklamalar; kayıt gerekmez.',
    '搜索贷款、BMI、AI成本、单位换算…': 'Kredi, BMI, AI maliyeti, birim dönüşümü ara…',
    个首发工具: ' kullanılabilir araç',
    实时计算: 'Anında hesaplama',
    移动端友好: 'Mobil uyumlu',
    计算器目录: 'Hesaplayıcı dizini',
    '从问题出发，不从公式出发': 'Formülden değil, sorudan başlayın',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      'Bir araç seçin ve herhangi bir değeri değiştirin; sonuç anında güncellenir.',
    打开工具: 'Aracı aç',
    暂时没有匹配工具: 'Şimdilik eşleşen araç yok',
    '换一个关键词试试。': 'Başka bir anahtar kelime deneyin.',
    'CALCMINTLY 标准': 'CALCMINTLY STANDARDI',
    '不只给一个数字，还告诉你数字怎么来的。':
      'Sadece sayı vermiyoruz; nasıl hesaplandığını gösteriyoruz.',
    实时反馈: 'Anında geri bildirim',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      'Form hesaplayıcıları yazdıkça güncellenir. Tuşlu hesap makinesinde bitirmek için = tuşuna basın.',
    公式透明: 'Şeffaf formüller',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      'Yöntem, varsayılanlar ve sınırlar görünür; sonucu kolayca kontrol edebilirsiniz.',
    情境解释: 'Yararlı bağlam',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      'Sonuçları sahte kesinlik yerine kullanışlı aralıklara ve yönlendirmelere dönüştürün.',
    常见问题: 'Sık sorulan sorular',
    '使用前，你可能想知道': 'Hesaplamadan önce bilmeniz gerekenler',
    '这些计算器免费吗？': 'Bu hesaplayıcılar ücretsiz mi?',
    '是。首发工具无需注册即可使用。': 'Evet. Mevcut araçlar ücretsizdir ve hesap gerektirmez.',
    '数据会被上传吗？': 'Verilerim yükleniyor mu?',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      'Hesaplamalar tarayıcınızda çalışır. Girdiğiniz değerleri almıyoruz.',
    '结果能替代专业意见吗？': 'Sonuçlar profesyonel tavsiyenin yerini alır mı?',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      'Hayır. Finans, sağlık ve iş sonuçları tahmin ve karşılaştırma içindir; önemli kararlar için uzmanları ve resmi belgeleri kullanın.',
  },
  'zh-CN': {
    全部工具: '全部工具',
    金融: '金融',
    健康: '健康',
    换算: '换算',
    透明公式: '透明公式',
    '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。':
      '免费、透明的在线计算器。结果仅供估算，不构成金融、医疗、财税或其他专业建议。',
    计算口径: '计算口径',
    关于: '关于',
    隐私: '隐私',
    联系: '联系',
    返回全部工具: '返回全部工具',
    输入: '输入',
    调整你的数据: '调整你的数据',
    建立你的情景: '建立你的情景',
    实时更新: '实时更新',
    恢复示例数据: '恢复示例数据',
    核心结果: '核心结果',
    参考情景: '参考情景',
    需要复核: '需要复核',
    输入警告: '输入警告',
    稳健情景: '稳健情景',
    需要验证: '需要验证',
    风险提示: '风险提示',
    结果解读: '结果解读',
    情景诊断: '情景诊断',
    计算公式: '计算公式',
    复制结果: '复制结果',
    已复制: '已复制',
    生成报告: '生成报告',
    使用方法: '使用方法',
    '用真实数据，做多档比较': '用真实数据，做多档比较',
    替换示例值: '替换示例值',
    测试边界: '测试边界',
    复核口径: '复核口径',
    关于这项计算: '关于这项计算',
    如何使用: '如何使用',
    先改最不确定的数字: '先改最不确定的数字',
    填真实数据: '填真实数据',
    做三档情景: '做三档情景',
    保存并复核: '保存并复核',
    FAQ: 'FAQ',
    计算结果: '计算结果',
    数学: '数学',
    日期: '日期',
    商业: '商业',
    科技: '科技',
    生活: '生活',
    出行: '出行',
    家居: '家居',
    教育: '教育',
    全部: '全部',
    基础: '基础',
    热门: '热门',
    常用: '常用',
    多功能: '多功能',
    专业: '专业',
    AI效率: 'AI效率',
    AI开发: 'AI开发',
    创作者: '创作者',
    职业: '职业',
    团队效率: '团队效率',
    个人财务: '个人财务',
    创业: '创业',
    成长: '成长',
    效率: '效率',
    可持续: '可持续',
    电商: '电商',
    '一个入口，解决日常计算': '一个入口，解决日常计算',
    答案不该藏在: '答案不该藏在',
    复杂公式: '复杂公式',
    '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。':
      '免费的全品类在线计算器。输入即出结果，公式透明，解释清楚，无需注册。',
    '搜索贷款、BMI、AI成本、单位换算…': '搜索贷款、BMI、AI成本、单位换算…',
    个首发工具: '个首发工具',
    实时计算: '实时计算',
    移动端友好: '移动端友好',
    计算器目录: '计算器目录',
    '从问题出发，不从公式出发': '从问题出发，不从公式出发',
    '选择一个工具，修改任何数值，结果都会立即更新。':
      '选择一个工具，修改任何数值，结果都会立即更新。',
    打开工具: '打开工具',
    暂时没有匹配工具: '暂时没有匹配工具',
    '换一个关键词试试。': '换一个关键词试试。',
    计算器: '计算器',
    浏览分类: '浏览分类',
    热门工具: '热门工具',
    方法与标准: '方法与标准',
    菜单: '菜单',
    'CALCMINTLY 标准': 'CALCMINTLY 标准',
    '不只给一个数字，还告诉你数字怎么来的。': '不只给一个数字，还告诉你数字怎么来的。',
    实时反馈: '实时反馈',
    '没有“计算”按钮。输入变化，结果、图表和提示同步更新。':
      '表单计算器随输入更新；按键计算器使用等号完成计算。',
    公式透明: '公式透明',
    '显示计算方法、默认值和适用限制，方便检查和复算。':
      '显示计算方法、默认值和适用限制，方便检查和复算。',
    情境解释: '情境解释',
    '把结果转换成可行动的区间和提示，而不是制造伪精确。':
      '把结果转换成可行动的区间和提示，而不是制造伪精确。',
    常见问题: '常见问题',
    '使用前，你可能想知道': '使用前，你可能想知道',
    '这些计算器免费吗？': '这些计算器免费吗？',
    '是。首发工具无需注册即可使用。': '是。首发工具无需注册即可使用。',
    '数据会被上传吗？': '数据会被上传吗？',
    '当前计算都在浏览器本地完成，我们不会接收你输入的数值。':
      '当前计算都在浏览器本地完成，我们不会接收你输入的数值。',
    '结果能替代专业意见吗？': '结果能替代专业意见吗？',
    '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。':
      '不能。金融、健康及商业结果用于估算和比较，请结合专业人士与正式文件决策。',
    百分比计算器: '百分比计算器',
    贷款计算器: '贷款计算器',
    'BMI 计算器': 'BMI 计算器',
    年龄计算器: '年龄计算器',
    长度单位换算器: '长度单位换算器',
    利润计算器: '利润计算器',
    数学计算: '数学计算',
    金融计算: '金融计算',
    健康计算: '健康计算',
    日期计算: '日期计算',
    单位换算: '单位换算',
    商业计算: '商业计算',
    百分比: '百分比',
    基数: '基数',
    贷款本金: '贷款本金',
    年利率: '年利率',
    贷款期限: '贷款期限',
    额外月供: '额外月供',
    身高: '身高',
    体重: '体重',
    英尺: '英尺',
    英寸: '英寸',
    出生日期: '出生日期',
    数值: '数值',
    从: '从',
    换算为: '换算为',
    收入: '收入',
    变动成本: '变动成本',
    固定成本: '固定成本',
    所有计算均在你的浏览器本地完成: '所有计算均在你的浏览器本地完成',
    '结果 = 基数 × 百分比 ÷ 100': '结果 = 基数 × 百分比 ÷ 100',
    '月供 = 本金 × 月利率 × (1+月利率)^期数 ÷ [(1+月利率)^期数−1]':
      '月供 = 本金 × 月利率 × (1+月利率)^期数 ÷ [(1+月利率)^期数−1]',
    'BMI = 体重(kg) ÷ 身高²(m²)': 'BMI = 体重(kg) ÷ 身高²(m²)',
    '周岁 = 当前日期 − 出生日期（使用公历日历差值，不用毫秒近似年份）':
      '周岁 = 当前日期 − 出生日期（使用公历日历差值，不用毫秒近似年份）',
    '目标值 = 输入值 × 来源单位换算系数 ÷ 目标单位换算系数':
      '目标值 = 输入值 × 来源单位换算系数 ÷ 目标单位换算系数',
    '净利润 = 收入 − 变动成本 − 固定成本；净利率 = 净利润 ÷ 收入':
      '净利润 = 收入 − 变动成本 − 固定成本；净利率 = 净利润 ÷ 收入',
  },
};

;
window.CMUiCopy = {
  en: {
    home: 'Home',
    ranking: 'Ranking',
    about: 'About',
    terms: 'Terms',
    contact: 'Contact',
    language: 'Language',
    addCalculator: 'Add calculator',
    addWorkspace: 'Add to workspace',
    saveLayout: 'Save layout',
    loadLayout: 'Load saved layout',
    replace: 'Replace',
    remove: 'Remove',
    undo: 'Undo',
    moveEarlier: 'Move earlier',
    moveLater: 'Move later',
    sendResult: 'Send result',
    help: 'How it works',
    close: 'Close',
    pinnedTitle: 'Most-used calculators',
    pinnedHint: 'Eight everyday essentials, always within reach.',
    basic: 'Pocket calculator',
    scientific: 'Scientific calculator',
    percentage: 'Percentage',
    loan: 'Loan payment',
    mortgage: 'Mortgage',
    bmi: 'BMI',
    age: 'Age',
    unit: 'Unit conversion',
    history: 'History',
    emptyHistory: 'Your calculations will appear here.',
    clearHistory: 'Clear history',
    copyResult: 'Copy result',
    copied: 'Copied',
    copyFail: 'Select the result to copy it.',
    degree: 'Degrees',
    radian: 'Radians',
    expression: 'Expression',
    result: 'Result',
    invalidExpression: 'Check the expression.',
    division: 'Cannot divide by zero.',
    domain: 'Outside the real-number domain.',
    resetExample: 'Reset example',
    inputs: 'Your numbers',
    formula: 'Formula',
    scope: 'Scope and limitations',
    chooseGoal: 'Choose a goal',
    original: 'Original tools',
    priority: 'Selection priority',
    localUsage: 'Use on this device',
    clearEntry: 'Clear entry',
    allClear: 'Clear all',
    backspace: 'Backspace',
    sign: 'Change sign',
    percentKey: 'Percent',
    squareRoot: 'Square root',
    reciprocal: 'Reciprocal',
    calculate: 'Calculate',
    originalsTitle: 'Original planning tools',
    originalsHint: 'Explore time conflicts, fragile dependencies and future commitments.',
    unitCall: 'API call',
    unitCalls: 'API calls',
    unitOrder: 'order',
    unitOrders: 'orders',
    jsRequired: 'Interactive features need JavaScript. Page content and links remain available.',
  },
  'zh-CN': {
    home: '首页',
    ranking: '排行榜',
    about: '关于',
    terms: '服务条款',
    contact: '联系',
    language: '语言',
    addCalculator: '添加计算器',
    addWorkspace: '添加到工作台',
    saveLayout: '保存布局',
    loadLayout: '载入已保存布局',
    replace: '替换',
    remove: '移除',
    undo: '撤销',
    moveEarlier: '向前移动',
    moveLater: '向后移动',
    sendResult: '传递结果',
    help: '使用说明',
    close: '关闭',
    pinnedTitle: '最常用计算器',
    pinnedHint: '精选八个日常工具，固定在这里，随时打开。',
    basic: '普通计算器',
    scientific: '科学计算器',
    percentage: '百分比',
    loan: '贷款月供',
    mortgage: '房贷',
    bmi: 'BMI',
    age: '年龄',
    unit: '单位换算',
    history: '计算历史',
    emptyHistory: '完成的计算会显示在这里。',
    clearHistory: '清空历史',
    copyResult: '复制结果',
    copied: '已复制',
    copyFail: '请选择结果并手动复制。',
    degree: '角度',
    radian: '弧度',
    expression: '算式',
    result: '结果',
    invalidExpression: '请检查算式。',
    division: '不能除以零。',
    domain: '超出实数计算范围。',
    resetExample: '恢复示例',
    inputs: '输入数值',
    formula: '计算公式',
    scope: '适用范围与限制',
    chooseGoal: '按目标选择',
    original: '原创工具',
    priority: '选题优先级',
    localUsage: '本设备使用',
    clearEntry: '清除当前输入',
    allClear: '全部清除',
    backspace: '退格',
    sign: '切换正负',
    percentKey: '百分比',
    squareRoot: '平方根',
    reciprocal: '倒数',
    calculate: '计算',
    originalsTitle: '原创情景计算',
    originalsHint: '看清时间冲突、资源依赖和未来承诺的影响。',
    unitCall: '次 API 调用',
    unitCalls: 'API 调用',
    unitOrder: '单',
    unitOrders: '单',
    jsRequired: '交互功能需要启用 JavaScript。页面内容和链接仍可查看。',
  },
  hi: {
    home: 'होम',
    ranking: 'रैंकिंग',
    about: 'परिचय',
    terms: 'शर्तें',
    contact: 'संपर्क',
    language: 'भाषा',
    addCalculator: 'कैलकुलेटर जोड़ें',
    addWorkspace: 'वर्कस्पेस में जोड़ें',
    saveLayout: 'लेआउट सहेजें',
    loadLayout: 'सहेजा लेआउट खोलें',
    replace: 'बदलें',
    remove: 'हटाएँ',
    undo: 'पूर्ववत करें',
    moveEarlier: 'पहले ले जाएँ',
    moveLater: 'बाद में ले जाएँ',
    sendResult: 'परिणाम भेजें',
    help: 'कैसे उपयोग करें',
    close: 'बंद करें',
    pinnedTitle: 'सबसे काम आने वाले कैलकुलेटर',
    pinnedHint: 'रोज़मर्रा के आठ ज़रूरी टूल, हमेशा यहाँ।',
    basic: 'सामान्य कैलकुलेटर',
    scientific: 'वैज्ञानिक कैलकुलेटर',
    percentage: 'प्रतिशत',
    loan: 'ऋण की किस्त',
    mortgage: 'गृह ऋण',
    bmi: 'BMI',
    age: 'आयु',
    unit: 'इकाई परिवर्तन',
    history: 'इतिहास',
    emptyHistory: 'आपकी गणनाएँ यहाँ दिखेंगी।',
    clearHistory: 'इतिहास मिटाएँ',
    copyResult: 'परिणाम कॉपी करें',
    copied: 'कॉपी हो गया',
    copyFail: 'परिणाम चुनकर कॉपी करें।',
    degree: 'डिग्री',
    radian: 'रेडियन',
    expression: 'व्यंजक',
    result: 'परिणाम',
    invalidExpression: 'व्यंजक जाँचें।',
    division: 'शून्य से भाग नहीं दे सकते।',
    domain: 'वास्तविक संख्याओं की सीमा से बाहर।',
    resetExample: 'उदाहरण रीसेट करें',
    inputs: 'आपके मान',
    formula: 'सूत्र',
    scope: 'दायरा और सीमाएँ',
    chooseGoal: 'लक्ष्य चुनें',
    original: 'मौलिक टूल',
    priority: 'चयन प्राथमिकता',
    localUsage: 'इस डिवाइस पर उपयोग',
    clearEntry: 'वर्तमान प्रविष्टि मिटाएँ',
    allClear: 'सब मिटाएँ',
    backspace: 'पिछला अंक मिटाएँ',
    sign: 'चिह्न बदलें',
    percentKey: 'प्रतिशत',
    squareRoot: 'वर्गमूल',
    reciprocal: 'व्युत्क्रम',
    calculate: 'गणना करें',
    originalsTitle: 'मौलिक योजना उपकरण',
    originalsHint: 'समय के टकराव, निर्भरता और भविष्य की प्रतिबद्धताएँ समझें।',
    unitCall: 'API कॉल',
    unitCalls: 'API कॉल',
    unitOrder: 'ऑर्डर',
    unitOrders: 'ऑर्डर',
    jsRequired:
      'इंटरैक्टिव सुविधाओं के लिए JavaScript चाहिए। पेज की सामग्री और लिंक उपलब्ध रहते हैं।',
  },
  es: {
    home: 'Inicio',
    ranking: 'Clasificación',
    about: 'Acerca de',
    terms: 'Condiciones',
    contact: 'Contacto',
    language: 'Idioma',
    addCalculator: 'Añadir calculadora',
    addWorkspace: 'Añadir al espacio de trabajo',
    saveLayout: 'Guardar diseño',
    loadLayout: 'Cargar diseño guardado',
    replace: 'Cambiar',
    remove: 'Quitar',
    undo: 'Deshacer',
    moveEarlier: 'Mover antes',
    moveLater: 'Mover después',
    sendResult: 'Enviar resultado',
    help: 'Cómo funciona',
    close: 'Cerrar',
    pinnedTitle: 'Calculadoras más utilizadas',
    pinnedHint: 'Ocho herramientas de uso diario, siempre a mano.',
    basic: 'Calculadora básica',
    scientific: 'Calculadora científica',
    percentage: 'Porcentaje',
    loan: 'Cuota de préstamo',
    mortgage: 'Hipoteca',
    bmi: 'IMC',
    age: 'Edad',
    unit: 'Conversión de unidades',
    history: 'Historial',
    emptyHistory: 'Tus cálculos aparecerán aquí.',
    clearHistory: 'Borrar historial',
    copyResult: 'Copiar resultado',
    copied: 'Copiado',
    copyFail: 'Selecciona el resultado para copiarlo.',
    degree: 'Grados',
    radian: 'Radianes',
    expression: 'Expresión',
    result: 'Resultado',
    invalidExpression: 'Revisa la expresión.',
    division: 'No se puede dividir entre cero.',
    domain: 'Fuera del dominio de los números reales.',
    resetExample: 'Restablecer ejemplo',
    inputs: 'Tus valores',
    formula: 'Fórmula',
    scope: 'Alcance y limitaciones',
    chooseGoal: 'Elegir un objetivo',
    original: 'Herramientas originales',
    priority: 'Prioridad de selección',
    localUsage: 'Uso en este dispositivo',
    clearEntry: 'Borrar entrada',
    allClear: 'Borrar todo',
    backspace: 'Retroceso',
    sign: 'Cambiar signo',
    percentKey: 'Porcentaje',
    squareRoot: 'Raíz cuadrada',
    reciprocal: 'Recíproco',
    calculate: 'Calcular',
    originalsTitle: 'Herramientas de planificación originales',
    originalsHint: 'Explora conflictos de tiempo, dependencias y compromisos futuros.',
    unitCall: 'llamada API',
    unitCalls: 'llamadas API',
    unitOrder: 'pedido',
    unitOrders: 'pedidos',
    jsRequired:
      'Las funciones interactivas requieren JavaScript. El contenido y los enlaces siguen disponibles.',
  },
  ar: {
    home: 'الرئيسية',
    ranking: 'الترتيب',
    about: 'حول الموقع',
    terms: 'الشروط',
    contact: 'اتصل بنا',
    language: 'اللغة',
    addCalculator: 'إضافة حاسبة',
    addWorkspace: 'إضافة إلى مساحة العمل',
    saveLayout: 'حفظ التخطيط',
    loadLayout: 'تحميل التخطيط المحفوظ',
    replace: 'استبدال',
    remove: 'إزالة',
    undo: 'تراجع',
    moveEarlier: 'نقل إلى السابق',
    moveLater: 'نقل إلى التالي',
    sendResult: 'إرسال النتيجة',
    help: 'طريقة الاستخدام',
    close: 'إغلاق',
    pinnedTitle: 'الحاسبات الأكثر استخدامًا',
    pinnedHint: 'ثماني أدوات يومية أساسية في متناولك دائمًا.',
    basic: 'حاسبة عادية',
    scientific: 'حاسبة علمية',
    percentage: 'النسبة المئوية',
    loan: 'قسط القرض',
    mortgage: 'القرض العقاري',
    bmi: 'مؤشر كتلة الجسم',
    age: 'العمر',
    unit: 'تحويل الوحدات',
    history: 'السجل',
    emptyHistory: 'ستظهر حساباتك هنا.',
    clearHistory: 'مسح السجل',
    copyResult: 'نسخ النتيجة',
    copied: 'تم النسخ',
    copyFail: 'حدد النتيجة لنسخها.',
    degree: 'درجات',
    radian: 'راديان',
    expression: 'التعبير',
    result: 'النتيجة',
    invalidExpression: 'تحقق من التعبير.',
    division: 'لا يمكن القسمة على صفر.',
    domain: 'خارج نطاق الأعداد الحقيقية.',
    resetExample: 'إعادة المثال',
    inputs: 'قيم الإدخال',
    formula: 'الصيغة',
    scope: 'النطاق والقيود',
    chooseGoal: 'اختر هدفًا',
    original: 'أدوات مبتكرة',
    priority: 'أولوية الاختيار',
    localUsage: 'الاستخدام على هذا الجهاز',
    clearEntry: 'مسح الإدخال',
    allClear: 'مسح الكل',
    backspace: 'حذف آخر رمز',
    sign: 'تغيير الإشارة',
    percentKey: 'النسبة المئوية',
    squareRoot: 'الجذر التربيعي',
    reciprocal: 'المقلوب',
    calculate: 'احسب',
    originalsTitle: 'أدوات تخطيط أصلية',
    originalsHint: 'استكشف تعارض الوقت والاعتماد على الموارد والالتزامات المستقبلية.',
    unitCall: 'استدعاء API',
    unitCalls: 'استدعاءات API',
    unitOrder: 'طلب',
    unitOrders: 'طلبات',
    jsRequired: 'تتطلب الميزات التفاعلية JavaScript. يظل محتوى الصفحة والروابط متاحًا.',
  },
  fr: {
    home: 'Accueil',
    ranking: 'Classement',
    about: 'À propos',
    terms: 'Conditions',
    contact: 'Contact',
    language: 'Langue',
    addCalculator: 'Ajouter une calculatrice',
    addWorkspace: 'Ajouter à l’espace de travail',
    saveLayout: 'Enregistrer la disposition',
    loadLayout: 'Charger la disposition',
    replace: 'Remplacer',
    remove: 'Retirer',
    undo: 'Annuler',
    moveEarlier: 'Déplacer avant',
    moveLater: 'Déplacer après',
    sendResult: 'Transférer le résultat',
    help: 'Mode d’emploi',
    close: 'Fermer',
    pinnedTitle: 'Calculatrices les plus utilisées',
    pinnedHint: 'Huit outils du quotidien, toujours à portée de main.',
    basic: 'Calculatrice simple',
    scientific: 'Calculatrice scientifique',
    percentage: 'Pourcentage',
    loan: 'Mensualité de prêt',
    mortgage: 'Prêt immobilier',
    bmi: 'IMC',
    age: 'Âge',
    unit: 'Conversion d’unités',
    history: 'Historique',
    emptyHistory: 'Vos calculs apparaîtront ici.',
    clearHistory: 'Effacer l’historique',
    copyResult: 'Copier le résultat',
    copied: 'Copié',
    copyFail: 'Sélectionnez le résultat pour le copier.',
    degree: 'Degrés',
    radian: 'Radians',
    expression: 'Expression',
    result: 'Résultat',
    invalidExpression: 'Vérifiez l’expression.',
    division: 'Division par zéro impossible.',
    domain: 'Hors du domaine des nombres réels.',
    resetExample: 'Réinitialiser l’exemple',
    inputs: 'Vos valeurs',
    formula: 'Formule',
    scope: 'Portée et limites',
    chooseGoal: 'Choisir un objectif',
    original: 'Outils originaux',
    priority: 'Priorité de sélection',
    localUsage: 'Utilisation sur cet appareil',
    clearEntry: 'Effacer la saisie',
    allClear: 'Tout effacer',
    backspace: 'Retour arrière',
    sign: 'Changer de signe',
    percentKey: 'Pourcentage',
    squareRoot: 'Racine carrée',
    reciprocal: 'Inverse',
    calculate: 'Calculer',
    originalsTitle: 'Des outils de planification originaux',
    originalsHint: 'Explorez les conflits de temps, les dépendances et les engagements futurs.',
    unitCall: 'appel API',
    unitCalls: 'appels API',
    unitOrder: 'commande',
    unitOrders: 'commandes',
    jsRequired:
      'Les fonctions interactives nécessitent JavaScript. Le contenu et les liens restent accessibles.',
  },
  bn: {
    home: 'হোম',
    ranking: 'ক্রমতালিকা',
    about: 'পরিচিতি',
    terms: 'শর্তাবলি',
    contact: 'যোগাযোগ',
    language: 'ভাষা',
    addCalculator: 'ক্যালকুলেটর যোগ করুন',
    addWorkspace: 'ওয়ার্কস্পেসে যোগ করুন',
    saveLayout: 'বিন্যাস সংরক্ষণ',
    loadLayout: 'সংরক্ষিত বিন্যাস খুলুন',
    replace: 'প্রতিস্থাপন',
    remove: 'সরান',
    undo: 'পূর্বাবস্থায় ফেরান',
    moveEarlier: 'আগে সরান',
    moveLater: 'পরে সরান',
    sendResult: 'ফল পাঠান',
    help: 'ব্যবহারবিধি',
    close: 'বন্ধ করুন',
    pinnedTitle: 'সবচেয়ে ব্যবহৃত ক্যালকুলেটর',
    pinnedHint: 'দৈনন্দিন আটটি দরকারি টুল, সবসময় হাতের কাছে।',
    basic: 'সাধারণ ক্যালকুলেটর',
    scientific: 'বৈজ্ঞানিক ক্যালকুলেটর',
    percentage: 'শতকরা',
    loan: 'ঋণের কিস্তি',
    mortgage: 'গৃহঋণ',
    bmi: 'BMI',
    age: 'বয়স',
    unit: 'একক রূপান্তর',
    history: 'ইতিহাস',
    emptyHistory: 'আপনার হিসাব এখানে দেখা যাবে।',
    clearHistory: 'ইতিহাস মুছুন',
    copyResult: 'ফল কপি করুন',
    copied: 'কপি হয়েছে',
    copyFail: 'কপি করতে ফল নির্বাচন করুন।',
    degree: 'ডিগ্রি',
    radian: 'রেডিয়ান',
    expression: 'রাশি',
    result: 'ফল',
    invalidExpression: 'রাশিটি পরীক্ষা করুন।',
    division: 'শূন্য দিয়ে ভাগ করা যায় না।',
    domain: 'বাস্তব সংখ্যার সীমার বাইরে।',
    resetExample: 'উদাহরণ পুনরায় সেট করুন',
    inputs: 'ইনপুট মান',
    formula: 'সূত্র',
    scope: 'প্রযোজ্যতা ও সীমাবদ্ধতা',
    chooseGoal: 'লক্ষ্য বাছুন',
    original: 'মৌলিক টুল',
    priority: 'নির্বাচনের অগ্রাধিকার',
    localUsage: 'এই ডিভাইসে ব্যবহার',
    clearEntry: 'বর্তমান ইনপুট মুছুন',
    allClear: 'সব মুছুন',
    backspace: 'শেষ অক্ষর মুছুন',
    sign: 'চিহ্ন বদলান',
    percentKey: 'শতকরা',
    squareRoot: 'বর্গমূল',
    reciprocal: 'বিপরীত সংখ্যা',
    calculate: 'হিসাব করুন',
    originalsTitle: 'মৌলিক পরিকল্পনার সরঞ্জাম',
    originalsHint: 'সময়ের সংঘাত, নির্ভরতা ও ভবিষ্যতের প্রতিশ্রুতির প্রভাব দেখুন।',
    unitCall: 'API কল',
    unitCalls: 'API কল',
    unitOrder: 'অর্ডার',
    unitOrders: 'অর্ডার',
    jsRequired:
      'ইন্টার‌্যাক্টিভ সুবিধার জন্য JavaScript দরকার। পৃষ্ঠার বিষয়বস্তু ও লিংক ব্যবহার করা যাবে।',
  },
  pt: {
    home: 'Início',
    ranking: 'Classificação',
    about: 'Sobre',
    terms: 'Termos',
    contact: 'Contato',
    language: 'Idioma',
    addCalculator: 'Adicionar calculadora',
    addWorkspace: 'Adicionar ao espaço de trabalho',
    saveLayout: 'Salvar layout',
    loadLayout: 'Carregar layout salvo',
    replace: 'Substituir',
    remove: 'Remover',
    undo: 'Desfazer',
    moveEarlier: 'Mover antes',
    moveLater: 'Mover depois',
    sendResult: 'Enviar resultado',
    help: 'Como usar',
    close: 'Fechar',
    pinnedTitle: 'Calculadoras mais usadas',
    pinnedHint: 'Oito ferramentas do dia a dia, sempre à mão.',
    basic: 'Calculadora básica',
    scientific: 'Calculadora científica',
    percentage: 'Porcentagem',
    loan: 'Parcela do empréstimo',
    mortgage: 'Financiamento imobiliário',
    bmi: 'IMC',
    age: 'Idade',
    unit: 'Conversão de unidades',
    history: 'Histórico',
    emptyHistory: 'Seus cálculos aparecerão aqui.',
    clearHistory: 'Limpar histórico',
    copyResult: 'Copiar resultado',
    copied: 'Copiado',
    copyFail: 'Selecione o resultado para copiar.',
    degree: 'Graus',
    radian: 'Radianos',
    expression: 'Expressão',
    result: 'Resultado',
    invalidExpression: 'Confira a expressão.',
    division: 'Não é possível dividir por zero.',
    domain: 'Fora do domínio dos números reais.',
    resetExample: 'Restaurar exemplo',
    inputs: 'Seus valores',
    formula: 'Fórmula',
    scope: 'Escopo e limitações',
    chooseGoal: 'Escolher um objetivo',
    original: 'Ferramentas originais',
    priority: 'Prioridade de seleção',
    localUsage: 'Uso neste dispositivo',
    clearEntry: 'Limpar entrada',
    allClear: 'Limpar tudo',
    backspace: 'Apagar último caractere',
    sign: 'Inverter sinal',
    percentKey: 'Porcentagem',
    squareRoot: 'Raiz quadrada',
    reciprocal: 'Recíproco',
    calculate: 'Calcular',
    originalsTitle: 'Ferramentas de planejamento originais',
    originalsHint: 'Explore conflitos de tempo, dependências e compromissos futuros.',
    unitCall: 'chamada API',
    unitCalls: 'chamadas API',
    unitOrder: 'pedido',
    unitOrders: 'pedidos',
    jsRequired:
      'Os recursos interativos precisam de JavaScript. O conteúdo e os links continuam disponíveis.',
  },
  id: {
    home: 'Beranda',
    ranking: 'Peringkat',
    about: 'Tentang',
    terms: 'Ketentuan',
    contact: 'Kontak',
    language: 'Bahasa',
    addCalculator: 'Tambah kalkulator',
    addWorkspace: 'Tambah ke ruang kerja',
    saveLayout: 'Simpan tata letak',
    loadLayout: 'Muat tata letak tersimpan',
    replace: 'Ganti',
    remove: 'Hapus',
    undo: 'Urungkan',
    moveEarlier: 'Pindah ke depan',
    moveLater: 'Pindah ke belakang',
    sendResult: 'Kirim hasil',
    help: 'Cara menggunakan',
    close: 'Tutup',
    pinnedTitle: 'Kalkulator yang paling sering digunakan',
    pinnedHint: 'Delapan alat sehari-hari yang selalu mudah dijangkau.',
    basic: 'Kalkulator biasa',
    scientific: 'Kalkulator ilmiah',
    percentage: 'Persentase',
    loan: 'Cicilan pinjaman',
    mortgage: 'KPR',
    bmi: 'IMT',
    age: 'Usia',
    unit: 'Konversi satuan',
    history: 'Riwayat',
    emptyHistory: 'Perhitungan Anda akan muncul di sini.',
    clearHistory: 'Hapus riwayat',
    copyResult: 'Salin hasil',
    copied: 'Tersalin',
    copyFail: 'Pilih hasil untuk menyalinnya.',
    degree: 'Derajat',
    radian: 'Radian',
    expression: 'Ekspresi',
    result: 'Hasil',
    invalidExpression: 'Periksa ekspresi.',
    division: 'Tidak dapat membagi dengan nol.',
    domain: 'Di luar domain bilangan real.',
    resetExample: 'Atur ulang contoh',
    inputs: 'Nilai masukan',
    formula: 'Rumus',
    scope: 'Cakupan dan batasan',
    chooseGoal: 'Pilih tujuan',
    original: 'Alat orisinal',
    priority: 'Prioritas pemilihan',
    localUsage: 'Penggunaan di perangkat ini',
    clearEntry: 'Hapus masukan',
    allClear: 'Hapus semua',
    backspace: 'Hapus karakter terakhir',
    sign: 'Ubah tanda',
    percentKey: 'Persen',
    squareRoot: 'Akar kuadrat',
    reciprocal: 'Kebalikan',
    calculate: 'Hitung',
    originalsTitle: 'Alat perencanaan orisinal',
    originalsHint: 'Pelajari benturan waktu, ketergantungan, dan komitmen mendatang.',
    unitCall: 'panggilan API',
    unitCalls: 'panggilan API',
    unitOrder: 'pesanan',
    unitOrders: 'pesanan',
    jsRequired: 'Fitur interaktif memerlukan JavaScript. Isi halaman dan tautan tetap tersedia.',
  },
  ur: {
    home: 'ہوم',
    ranking: 'درجہ بندی',
    about: 'تعارف',
    terms: 'شرائط',
    contact: 'رابطہ',
    language: 'زبان',
    addCalculator: 'کیلکولیٹر شامل کریں',
    addWorkspace: 'ورک اسپیس میں شامل کریں',
    saveLayout: 'ترتیب محفوظ کریں',
    loadLayout: 'محفوظ ترتیب کھولیں',
    replace: 'تبدیل کریں',
    remove: 'ہٹائیں',
    undo: 'واپس کریں',
    moveEarlier: 'پہلے منتقل کریں',
    moveLater: 'بعد میں منتقل کریں',
    sendResult: 'نتیجہ بھیجیں',
    help: 'طریقۂ استعمال',
    close: 'بند کریں',
    pinnedTitle: 'سب سے زیادہ استعمال ہونے والے کیلکولیٹر',
    pinnedHint: 'روزمرہ کے آٹھ ضروری ٹول، ہمیشہ دستیاب۔',
    basic: 'عام کیلکولیٹر',
    scientific: 'سائنسی کیلکولیٹر',
    percentage: 'فیصد',
    loan: 'قرض کی قسط',
    mortgage: 'گھر کا قرض',
    bmi: 'BMI',
    age: 'عمر',
    unit: 'اکائی کی تبدیلی',
    history: 'تاریخچہ',
    emptyHistory: 'آپ کے حساب یہاں نظر آئیں گے۔',
    clearHistory: 'تاریخچہ صاف کریں',
    copyResult: 'نتیجہ نقل کریں',
    copied: 'نقل ہو گیا',
    copyFail: 'نقل کرنے کے لیے نتیجہ منتخب کریں۔',
    degree: 'ڈگری',
    radian: 'ریڈیئن',
    expression: 'عبارت',
    result: 'نتیجہ',
    invalidExpression: 'عبارت کی جانچ کریں۔',
    division: 'صفر سے تقسیم ممکن نہیں۔',
    domain: 'حقیقی اعداد کی حد سے باہر۔',
    resetExample: 'مثال بحال کریں',
    inputs: 'درج کردہ اعداد',
    formula: 'فارمولا',
    scope: 'دائرہ اور حدود',
    chooseGoal: 'مقصد منتخب کریں',
    original: 'اصل ٹول',
    priority: 'انتخاب کی ترجیح',
    localUsage: 'اس آلے پر استعمال',
    clearEntry: 'موجودہ اندراج صاف کریں',
    allClear: 'سب صاف کریں',
    backspace: 'آخری حرف مٹائیں',
    sign: 'علامت بدلیں',
    percentKey: 'فیصد',
    squareRoot: 'مربع جذر',
    reciprocal: 'معکوس',
    calculate: 'حساب کریں',
    originalsTitle: 'منفرد منصوبہ بندی کے آلات',
    originalsHint: 'وقت کے ٹکراؤ، انحصار اور مستقبل کی ذمہ داریوں کا اثر دیکھیں۔',
    unitCall: 'API کال',
    unitCalls: 'API کالز',
    unitOrder: 'آرڈر',
    unitOrders: 'آرڈرز',
    jsRequired: 'تفاعلی خصوصیات کے لیے JavaScript درکار ہے۔ صفحے کا مواد اور روابط دستیاب رہیں گے۔',
  },
  ru: {
    home: 'Главная',
    ranking: 'Рейтинг',
    about: 'О сайте',
    terms: 'Условия',
    contact: 'Контакты',
    language: 'Язык',
    addCalculator: 'Добавить калькулятор',
    addWorkspace: 'Добавить в рабочую область',
    saveLayout: 'Сохранить раскладку',
    loadLayout: 'Загрузить раскладку',
    replace: 'Заменить',
    remove: 'Удалить',
    undo: 'Отменить',
    moveEarlier: 'Переместить раньше',
    moveLater: 'Переместить позже',
    sendResult: 'Передать результат',
    help: 'Как пользоваться',
    close: 'Закрыть',
    pinnedTitle: 'Самые нужные калькуляторы',
    pinnedHint: 'Восемь повседневных инструментов всегда под рукой.',
    basic: 'Обычный калькулятор',
    scientific: 'Научный калькулятор',
    percentage: 'Проценты',
    loan: 'Платёж по кредиту',
    mortgage: 'Ипотека',
    bmi: 'ИМТ',
    age: 'Возраст',
    unit: 'Перевод единиц',
    history: 'История',
    emptyHistory: 'Здесь появятся ваши вычисления.',
    clearHistory: 'Очистить историю',
    copyResult: 'Копировать результат',
    copied: 'Скопировано',
    copyFail: 'Выделите результат для копирования.',
    degree: 'Градусы',
    radian: 'Радианы',
    expression: 'Выражение',
    result: 'Результат',
    invalidExpression: 'Проверьте выражение.',
    division: 'Делить на ноль нельзя.',
    domain: 'Вне области действительных чисел.',
    resetExample: 'Восстановить пример',
    inputs: 'Исходные значения',
    formula: 'Формула',
    scope: 'Область применения и ограничения',
    chooseGoal: 'Выбрать цель',
    original: 'Авторские инструменты',
    priority: 'Приоритет выбора',
    localUsage: 'Использование на устройстве',
    clearEntry: 'Очистить ввод',
    allClear: 'Очистить всё',
    backspace: 'Удалить символ',
    sign: 'Сменить знак',
    percentKey: 'Процент',
    squareRoot: 'Квадратный корень',
    reciprocal: 'Обратное число',
    calculate: 'Вычислить',
    originalsTitle: 'Оригинальные инструменты планирования',
    originalsHint: 'Оцените конфликты времени, зависимости и будущие обязательства.',
    unitCall: 'вызов API',
    unitCalls: 'вызовы API',
    unitOrder: 'заказ',
    unitOrders: 'заказы',
    jsRequired:
      'Для интерактивных функций нужен JavaScript. Содержимое страницы и ссылки остаются доступными.',
  },
  de: {
    home: 'Startseite',
    ranking: 'Rangliste',
    about: 'Über uns',
    terms: 'Bedingungen',
    contact: 'Kontakt',
    language: 'Sprache',
    addCalculator: 'Rechner hinzufügen',
    addWorkspace: 'Zum Arbeitsbereich hinzufügen',
    saveLayout: 'Anordnung speichern',
    loadLayout: 'Gespeicherte Anordnung laden',
    replace: 'Ersetzen',
    remove: 'Entfernen',
    undo: 'Rückgängig',
    moveEarlier: 'Nach vorne verschieben',
    moveLater: 'Nach hinten verschieben',
    sendResult: 'Ergebnis übertragen',
    help: 'Anleitung',
    close: 'Schließen',
    pinnedTitle: 'Häufig verwendete Rechner',
    pinnedHint: 'Acht Alltagswerkzeuge, immer griffbereit.',
    basic: 'Einfacher Rechner',
    scientific: 'Wissenschaftlicher Rechner',
    percentage: 'Prozent',
    loan: 'Kreditrate',
    mortgage: 'Immobilienkredit',
    bmi: 'BMI',
    age: 'Alter',
    unit: 'Einheitenumrechnung',
    history: 'Verlauf',
    emptyHistory: 'Hier erscheinen deine Berechnungen.',
    clearHistory: 'Verlauf löschen',
    copyResult: 'Ergebnis kopieren',
    copied: 'Kopiert',
    copyFail: 'Ergebnis zum Kopieren markieren.',
    degree: 'Grad',
    radian: 'Bogenmaß',
    expression: 'Ausdruck',
    result: 'Ergebnis',
    invalidExpression: 'Ausdruck prüfen.',
    division: 'Division durch null ist nicht möglich.',
    domain: 'Außerhalb der reellen Zahlen.',
    resetExample: 'Beispiel zurücksetzen',
    inputs: 'Eingabewerte',
    formula: 'Formel',
    scope: 'Anwendungsbereich und Grenzen',
    chooseGoal: 'Ziel auswählen',
    original: 'Eigene Werkzeuge',
    priority: 'Auswahlpriorität',
    localUsage: 'Nutzung auf diesem Gerät',
    clearEntry: 'Eingabe löschen',
    allClear: 'Alles löschen',
    backspace: 'Letztes Zeichen löschen',
    sign: 'Vorzeichen wechseln',
    percentKey: 'Prozent',
    squareRoot: 'Quadratwurzel',
    reciprocal: 'Kehrwert',
    calculate: 'Berechnen',
    originalsTitle: 'Eigene Planungstools',
    originalsHint: 'Untersuche Zeitkonflikte, Abhängigkeiten und künftige Verpflichtungen.',
    unitCall: 'API-Aufruf',
    unitCalls: 'API-Aufrufe',
    unitOrder: 'Bestellung',
    unitOrders: 'Bestellungen',
    jsRequired:
      'Interaktive Funktionen benötigen JavaScript. Seiteninhalte und Links bleiben verfügbar.',
  },
  ja: {
    home: 'ホーム',
    ranking: 'ランキング',
    about: 'このサイトについて',
    terms: '利用規約',
    contact: 'お問い合わせ',
    language: '言語',
    addCalculator: '計算機を追加',
    addWorkspace: 'ワークスペースに追加',
    saveLayout: '配置を保存',
    loadLayout: '保存した配置を開く',
    replace: '入れ替え',
    remove: '削除',
    undo: '元に戻す',
    moveEarlier: '前へ移動',
    moveLater: '後ろへ移動',
    sendResult: '結果を渡す',
    help: '使い方',
    close: '閉じる',
    pinnedTitle: 'よく使う計算機',
    pinnedHint: '毎日に役立つ8つのツールを、いつでもすぐに。',
    basic: '普通電卓',
    scientific: '関数電卓',
    percentage: 'パーセント',
    loan: 'ローン返済額',
    mortgage: '住宅ローン',
    bmi: 'BMI',
    age: '年齢',
    unit: '単位換算',
    history: '計算履歴',
    emptyHistory: '計算結果がここに表示されます。',
    clearHistory: '履歴を消去',
    copyResult: '結果をコピー',
    copied: 'コピーしました',
    copyFail: '結果を選択してコピーしてください。',
    degree: '度数法',
    radian: 'ラジアン',
    expression: '数式',
    result: '結果',
    invalidExpression: '数式を確認してください。',
    division: 'ゼロでは割れません。',
    domain: '実数の範囲外です。',
    resetExample: '例をリセット',
    inputs: '入力値',
    formula: '計算式',
    scope: '適用範囲と制限',
    chooseGoal: '目的から選ぶ',
    original: '独自ツール',
    priority: '選定の優先順位',
    localUsage: 'この端末での使用',
    clearEntry: '入力を消去',
    allClear: 'すべて消去',
    backspace: '1文字削除',
    sign: '符号を切り替え',
    percentKey: 'パーセント',
    squareRoot: '平方根',
    reciprocal: '逆数',
    calculate: '計算',
    originalsTitle: '独自の計画ツール',
    originalsHint: '時間の重複、リソースへの依存、将来の約束による影響を確認。',
    unitCall: 'API 呼び出し',
    unitCalls: 'API 呼び出し',
    unitOrder: '件',
    unitOrders: '件',
    jsRequired: '操作機能には JavaScript が必要です。ページの内容とリンクは引き続き利用できます。',
  },
  pcm: {
    home: 'Home',
    ranking: 'Ranking',
    about: 'About',
    terms: 'Terms',
    contact: 'Contact',
    language: 'Language',
    addCalculator: 'Add calculator',
    addWorkspace: 'Add to workspace',
    saveLayout: 'Save layout',
    loadLayout: 'Open saved layout',
    replace: 'Replace',
    remove: 'Remove',
    undo: 'Undo',
    moveEarlier: 'Move am forward',
    moveLater: 'Move am backward',
    sendResult: 'Send result',
    help: 'How e dey work',
    close: 'Close',
    pinnedTitle: 'Calculators wey people dey use well',
    pinnedHint: 'Eight everyday tools, always dey here for you.',
    basic: 'Normal calculator',
    scientific: 'Science calculator',
    percentage: 'Percentage',
    loan: 'Loan payment',
    mortgage: 'House loan',
    bmi: 'BMI',
    age: 'Age',
    unit: 'Unit conversion',
    history: 'History',
    emptyHistory: 'Your calculations go show here.',
    clearHistory: 'Clear history',
    copyResult: 'Copy result',
    copied: 'E don copy',
    copyFail: 'Select the result make you copy am.',
    degree: 'Degrees',
    radian: 'Radians',
    expression: 'Expression',
    result: 'Result',
    invalidExpression: 'Check the expression.',
    division: 'You no fit divide by zero.',
    domain: 'E pass real-number range.',
    resetExample: 'Reset example',
    inputs: 'Your numbers',
    formula: 'Formula',
    scope: 'Where e fit work and limits',
    chooseGoal: 'Choose your goal',
    original: 'Original tools',
    priority: 'Selection priority',
    localUsage: 'Use for this device',
    clearEntry: 'Clear this entry',
    allClear: 'Clear everything',
    backspace: 'Delete last character',
    sign: 'Change sign',
    percentKey: 'Percent',
    squareRoot: 'Square root',
    reciprocal: 'Reciprocal',
    calculate: 'Calculate',
    originalsTitle: 'Original tools to plan well',
    originalsHint: 'Check time wey clash, things wey depend on each other, and future promises.',
    unitCall: 'API call',
    unitCalls: 'API calls',
    unitOrder: 'order',
    unitOrders: 'orders',
    jsRequired: 'Interactive features need JavaScript. Page content and links still dey available.',
  },
  mr: {
    home: 'मुख्यपृष्ठ',
    ranking: 'क्रमवारी',
    about: 'आमच्याबद्दल',
    terms: 'अटी',
    contact: 'संपर्क',
    language: 'भाषा',
    addCalculator: 'कॅल्क्युलेटर जोडा',
    addWorkspace: 'वर्कस्पेसमध्ये जोडा',
    saveLayout: 'मांडणी जतन करा',
    loadLayout: 'जतन केलेली मांडणी उघडा',
    replace: 'बदला',
    remove: 'काढा',
    undo: 'पूर्ववत करा',
    moveEarlier: 'पुढे हलवा',
    moveLater: 'मागे हलवा',
    sendResult: 'निकाल पाठवा',
    help: 'वापरण्याची पद्धत',
    close: 'बंद करा',
    pinnedTitle: 'नेहमी वापरले जाणारे कॅल्क्युलेटर',
    pinnedHint: 'रोजची आठ आवश्यक साधने, नेहमी जवळ.',
    basic: 'सामान्य कॅल्क्युलेटर',
    scientific: 'वैज्ञानिक कॅल्क्युलेटर',
    percentage: 'टक्केवारी',
    loan: 'कर्जाचा हप्ता',
    mortgage: 'गृहकर्ज',
    bmi: 'BMI',
    age: 'वय',
    unit: 'एकक रूपांतरण',
    history: 'इतिहास',
    emptyHistory: 'तुमची गणिते येथे दिसतील.',
    clearHistory: 'इतिहास साफ करा',
    copyResult: 'निकाल कॉपी करा',
    copied: 'कॉपी केले',
    copyFail: 'कॉपी करण्यासाठी निकाल निवडा.',
    degree: 'अंश',
    radian: 'रेडियन',
    expression: 'व्यंजक',
    result: 'निकाल',
    invalidExpression: 'व्यंजक तपासा.',
    division: 'शून्याने भागता येत नाही.',
    domain: 'वास्तव संख्यांच्या कक्षेबाहेर.',
    resetExample: 'उदाहरण पुन्हा सेट करा',
    inputs: 'इनपुट मूल्ये',
    formula: 'सूत्र',
    scope: 'व्याप्ती आणि मर्यादा',
    chooseGoal: 'उद्दिष्ट निवडा',
    original: 'मूळ साधने',
    priority: 'निवड प्राधान्य',
    localUsage: 'या उपकरणावरील वापर',
    clearEntry: 'सध्याची नोंद साफ करा',
    allClear: 'सर्व साफ करा',
    backspace: 'शेवटचे अक्षर मिटवा',
    sign: 'चिन्ह बदला',
    percentKey: 'टक्के',
    squareRoot: 'वर्गमूळ',
    reciprocal: 'व्यस्त संख्या',
    calculate: 'गणना करा',
    originalsTitle: 'मौलिक नियोजन साधने',
    originalsHint: 'वेळेचे संघर्ष, अवलंबित्व आणि भविष्यातील वचनबद्धता तपासा.',
    unitCall: 'API कॉल',
    unitCalls: 'API कॉल',
    unitOrder: 'ऑर्डर',
    unitOrders: 'ऑर्डर',
    jsRequired:
      'परस्परसंवादी सुविधांसाठी JavaScript आवश्यक आहे. पानावरील मजकूर आणि दुवे उपलब्ध राहतात.',
  },
  vi: {
    home: 'Trang chủ',
    ranking: 'Xếp hạng',
    about: 'Giới thiệu',
    terms: 'Điều khoản',
    contact: 'Liên hệ',
    language: 'Ngôn ngữ',
    addCalculator: 'Thêm máy tính',
    addWorkspace: 'Thêm vào không gian làm việc',
    saveLayout: 'Lưu bố cục',
    loadLayout: 'Mở bố cục đã lưu',
    replace: 'Thay thế',
    remove: 'Xóa',
    undo: 'Hoàn tác',
    moveEarlier: 'Chuyển lên trước',
    moveLater: 'Chuyển ra sau',
    sendResult: 'Chuyển kết quả',
    help: 'Cách sử dụng',
    close: 'Đóng',
    pinnedTitle: 'Máy tính thường dùng nhất',
    pinnedHint: 'Tám công cụ hằng ngày, luôn trong tầm tay.',
    basic: 'Máy tính cơ bản',
    scientific: 'Máy tính khoa học',
    percentage: 'Phần trăm',
    loan: 'Khoản trả vay',
    mortgage: 'Vay mua nhà',
    bmi: 'BMI',
    age: 'Tuổi',
    unit: 'Đổi đơn vị',
    history: 'Lịch sử',
    emptyHistory: 'Các phép tính sẽ xuất hiện ở đây.',
    clearHistory: 'Xóa lịch sử',
    copyResult: 'Sao chép kết quả',
    copied: 'Đã sao chép',
    copyFail: 'Chọn kết quả để sao chép.',
    degree: 'Độ',
    radian: 'Radian',
    expression: 'Biểu thức',
    result: 'Kết quả',
    invalidExpression: 'Kiểm tra biểu thức.',
    division: 'Không thể chia cho không.',
    domain: 'Ngoài miền số thực.',
    resetExample: 'Đặt lại ví dụ',
    inputs: 'Giá trị đầu vào',
    formula: 'Công thức',
    scope: 'Phạm vi và giới hạn',
    chooseGoal: 'Chọn mục tiêu',
    original: 'Công cụ sáng tạo',
    priority: 'Ưu tiên lựa chọn',
    localUsage: 'Sử dụng trên thiết bị này',
    clearEntry: 'Xóa mục nhập',
    allClear: 'Xóa tất cả',
    backspace: 'Xóa ký tự cuối',
    sign: 'Đổi dấu',
    percentKey: 'Phần trăm',
    squareRoot: 'Căn bậc hai',
    reciprocal: 'Nghịch đảo',
    calculate: 'Tính',
    originalsTitle: 'Công cụ lập kế hoạch độc đáo',
    originalsHint: 'Xem xung đột thời gian, sự phụ thuộc và các cam kết tương lai.',
    unitCall: 'lượt gọi API',
    unitCalls: 'lượt gọi API',
    unitOrder: 'đơn',
    unitOrders: 'đơn',
    jsRequired:
      'Các tính năng tương tác cần JavaScript. Nội dung trang và các liên kết vẫn xem được.',
  },
  te: {
    home: 'హోమ్',
    ranking: 'ర్యాంకింగ్',
    about: 'మా గురించి',
    terms: 'నిబంధనలు',
    contact: 'సంప్రదించండి',
    language: 'భాష',
    addCalculator: 'కాలిక్యులేటర్ జోడించండి',
    addWorkspace: 'వర్క్‌స్పేస్‌కు జోడించండి',
    saveLayout: 'అమరికను సేవ్ చేయండి',
    loadLayout: 'సేవ్ చేసిన అమరిక తెరవండి',
    replace: 'మార్చండి',
    remove: 'తొలగించండి',
    undo: 'రద్దు చేయండి',
    moveEarlier: 'ముందుకు తరలించండి',
    moveLater: 'వెనక్కి తరలించండి',
    sendResult: 'ఫలితాన్ని పంపండి',
    help: 'ఉపయోగ విధానం',
    close: 'మూసివేయండి',
    pinnedTitle: 'ఎక్కువగా ఉపయోగించే కాలిక్యులేటర్లు',
    pinnedHint: 'రోజువారీ ఎనిమిది అవసరమైన సాధనాలు, ఎల్లప్పుడూ అందుబాటులో.',
    basic: 'సాధారణ కాలిక్యులేటర్',
    scientific: 'శాస్త్రీయ కాలిక్యులేటర్',
    percentage: 'శాతం',
    loan: 'రుణ వాయిదా',
    mortgage: 'గృహ రుణం',
    bmi: 'BMI',
    age: 'వయస్సు',
    unit: 'ప్రమాణాల మార్పిడి',
    history: 'చరిత్ర',
    emptyHistory: 'మీ లెక్కలు ఇక్కడ కనిపిస్తాయి.',
    clearHistory: 'చరిత్రను తొలగించండి',
    copyResult: 'ఫలితాన్ని కాపీ చేయండి',
    copied: 'కాపీ అయింది',
    copyFail: 'కాపీ చేయడానికి ఫలితాన్ని ఎంచుకోండి.',
    degree: 'డిగ్రీలు',
    radian: 'రేడియన్లు',
    expression: 'వ్యక్తీకరణ',
    result: 'ఫలితం',
    invalidExpression: 'వ్యక్తీకరణను తనిఖీ చేయండి.',
    division: 'సున్నాతో భాగించలేరు.',
    domain: 'వాస్తవ సంఖ్యల పరిధికి బయట.',
    resetExample: 'ఉదాహరణను రీసెట్ చేయండి',
    inputs: 'ఇన్‌పుట్ విలువలు',
    formula: 'సూత్రం',
    scope: 'పరిధి మరియు పరిమితులు',
    chooseGoal: 'లక్ష్యాన్ని ఎంచుకోండి',
    original: 'సొంత సాధనాలు',
    priority: 'ఎంపిక ప్రాధాన్యత',
    localUsage: 'ఈ పరికరంలో వినియోగం',
    clearEntry: 'ప్రస్తుత నమోదు తొలగించండి',
    allClear: 'అన్నీ తొలగించండి',
    backspace: 'చివరి అక్షరం తొలగించండి',
    sign: 'గుర్తు మార్చండి',
    percentKey: 'శాతం',
    squareRoot: 'వర్గమూలం',
    reciprocal: 'విలోమం',
    calculate: 'లెక్కించండి',
    originalsTitle: 'ప్రత్యేక ప్రణాళిక సాధనాలు',
    originalsHint: 'సమయ ఘర్షణలు, ఆధారపడే వనరులు, భవిష్యత్ కట్టుబాట్లను చూడండి.',
    unitCall: 'API కాల్',
    unitCalls: 'API కాల్స్',
    unitOrder: 'ఆర్డర్',
    unitOrders: 'ఆర్డర్లు',
    jsRequired: 'ఇంటరాక్టివ్ సౌకర్యాలకు JavaScript అవసరం. పేజీ సమాచారం, లింకులు అందుబాటులో ఉంటాయి.',
  },
  sw: {
    home: 'Mwanzo',
    ranking: 'Orodha ya nafasi',
    about: 'Kuhusu',
    terms: 'Masharti',
    contact: 'Wasiliana',
    language: 'Lugha',
    addCalculator: 'Ongeza kikokotoo',
    addWorkspace: 'Ongeza kwenye eneo la kazi',
    saveLayout: 'Hifadhi mpangilio',
    loadLayout: 'Fungua mpangilio uliohifadhiwa',
    replace: 'Badilisha',
    remove: 'Ondoa',
    undo: 'Tendua',
    moveEarlier: 'Sogeza mbele',
    moveLater: 'Sogeza nyuma',
    sendResult: 'Tuma matokeo',
    help: 'Jinsi ya kutumia',
    close: 'Funga',
    pinnedTitle: 'Vikokotoo vinavyotumika sana',
    pinnedHint: 'Zana nane za kila siku, daima karibu nawe.',
    basic: 'Kikokotoo cha kawaida',
    scientific: 'Kikokotoo cha kisayansi',
    percentage: 'Asilimia',
    loan: 'Malipo ya mkopo',
    mortgage: 'Mkopo wa nyumba',
    bmi: 'BMI',
    age: 'Umri',
    unit: 'Ubadilishaji wa vipimo',
    history: 'Historia',
    emptyHistory: 'Mahesabu yako yataonekana hapa.',
    clearHistory: 'Futa historia',
    copyResult: 'Nakili matokeo',
    copied: 'Imenakiliwa',
    copyFail: 'Chagua matokeo ili kuyanakili.',
    degree: 'Digrii',
    radian: 'Radiani',
    expression: 'Usemi',
    result: 'Matokeo',
    invalidExpression: 'Kagua usemi.',
    division: 'Haiwezekani kugawanya kwa sifuri.',
    domain: 'Nje ya eneo la namba halisi.',
    resetExample: 'Rudisha mfano',
    inputs: 'Thamani za ingizo',
    formula: 'Fomula',
    scope: 'Matumizi na mipaka',
    chooseGoal: 'Chagua lengo',
    original: 'Zana bunifu',
    priority: 'Kipaumbele cha uteuzi',
    localUsage: 'Matumizi kwenye kifaa hiki',
    clearEntry: 'Futa ingizo',
    allClear: 'Futa yote',
    backspace: 'Futa herufi ya mwisho',
    sign: 'Badilisha alama',
    percentKey: 'Asilimia',
    squareRoot: 'Mzizi wa pili',
    reciprocal: 'Kinyume cha namba',
    calculate: 'Kokotoa',
    originalsTitle: 'Zana asilia za kupanga',
    originalsHint: 'Chunguza migongano ya muda, utegemezi na ahadi za baadaye.',
    unitCall: 'mwito wa API',
    unitCalls: 'miito ya API',
    unitOrder: 'agizo',
    unitOrders: 'maagizo',
    jsRequired:
      'Vipengele shirikishi vinahitaji JavaScript. Maudhui ya ukurasa na viungo bado vinapatikana.',
  },
  ha: {
    home: 'Gida',
    ranking: 'Jerin matsayi',
    about: 'Game da mu',
    terms: 'Sharuɗɗa',
    contact: 'Tuntuɓa',
    language: 'Harshe',
    addCalculator: 'Ƙara kalkuleta',
    addWorkspace: 'Ƙara zuwa wurin aiki',
    saveLayout: 'Ajiye tsari',
    loadLayout: 'Buɗe tsarin da aka ajiye',
    replace: 'Sauya',
    remove: 'Cire',
    undo: 'Mayar',
    moveEarlier: 'Matsa gaba',
    moveLater: 'Matsa baya',
    sendResult: 'Tura sakamako',
    help: 'Yadda ake amfani',
    close: 'Rufe',
    pinnedTitle: 'Kalkuletoci da aka fi amfani da su',
    pinnedHint: 'Muhimman kayan aiki takwas na yau da kullum, a kusa da kai.',
    basic: 'Kalkuleta ta yau da kullum',
    scientific: 'Kalkuleta ta kimiyya',
    percentage: 'Kashi',
    loan: 'Biyan rance',
    mortgage: 'Rancen gida',
    bmi: 'BMI',
    age: 'Shekaru',
    unit: 'Canjin ma’auni',
    history: 'Tarihi',
    emptyHistory: 'Lissafinka zai bayyana a nan.',
    clearHistory: 'Goge tarihi',
    copyResult: 'Kwafi sakamako',
    copied: 'An kwafa',
    copyFail: 'Zaɓi sakamakon domin kwafinsa.',
    degree: 'Digiri',
    radian: 'Radian',
    expression: 'Jimlar lissafi',
    result: 'Sakamako',
    invalidExpression: 'Duba jimlar lissafin.',
    division: 'Ba za a raba da sifili ba.',
    domain: 'Ya fita daga iyakar lambobi na zahiri.',
    resetExample: 'Mayar da misali',
    inputs: 'Ƙimomin shigarwa',
    formula: 'Ƙa’ida',
    scope: 'Amfani da iyakoki',
    chooseGoal: 'Zaɓi manufa',
    original: 'Sabbin kayan aiki',
    priority: 'Fifikon zaɓi',
    localUsage: 'Amfani a wannan na’ura',
    clearEntry: 'Goge shigarwar',
    allClear: 'Goge duka',
    backspace: 'Goge harafin ƙarshe',
    sign: 'Sauya alama',
    percentKey: 'Kashi',
    squareRoot: 'Tushen murabba’i',
    reciprocal: 'Juyayyen lamba',
    calculate: 'Lissafa',
    originalsTitle: 'Kayan tsara aiki na asali',
    originalsHint: 'Duba karo na lokaci, dogaro da wasu abubuwa da alkawuran gaba.',
    unitCall: 'kiran API',
    unitCalls: 'kiraye-kirayen API',
    unitOrder: 'oda',
    unitOrders: 'odoci',
    jsRequired:
      'Fasalolin mu’amala suna buƙatar JavaScript. Ana iya karanta shafin da amfani da hanyoyin haɗi.',
  },
  tr: {
    home: 'Ana sayfa',
    ranking: 'Sıralama',
    about: 'Hakkında',
    terms: 'Koşullar',
    contact: 'İletişim',
    language: 'Dil',
    addCalculator: 'Hesaplayıcı ekle',
    addWorkspace: 'Çalışma alanına ekle',
    saveLayout: 'Düzeni kaydet',
    loadLayout: 'Kayıtlı düzeni aç',
    replace: 'Değiştir',
    remove: 'Kaldır',
    undo: 'Geri al',
    moveEarlier: 'Öne taşı',
    moveLater: 'Arkaya taşı',
    sendResult: 'Sonucu aktar',
    help: 'Nasıl kullanılır',
    close: 'Kapat',
    pinnedTitle: 'En sık kullanılan hesaplayıcılar',
    pinnedHint: 'Her zaman elinizin altında sekiz günlük araç.',
    basic: 'Normal hesap makinesi',
    scientific: 'Bilimsel hesap makinesi',
    percentage: 'Yüzde',
    loan: 'Kredi taksiti',
    mortgage: 'Konut kredisi',
    bmi: 'VKİ',
    age: 'Yaş',
    unit: 'Birim dönüştürme',
    history: 'Geçmiş',
    emptyHistory: 'Hesaplamalarınız burada görünecek.',
    clearHistory: 'Geçmişi temizle',
    copyResult: 'Sonucu kopyala',
    copied: 'Kopyalandı',
    copyFail: 'Kopyalamak için sonucu seçin.',
    degree: 'Derece',
    radian: 'Radyan',
    expression: 'İfade',
    result: 'Sonuç',
    invalidExpression: 'İfadeyi kontrol edin.',
    division: 'Sıfıra bölünemez.',
    domain: 'Gerçek sayıların tanım kümesi dışında.',
    resetExample: 'Örneği sıfırla',
    inputs: 'Giriş değerleri',
    formula: 'Formül',
    scope: 'Kapsam ve sınırlamalar',
    chooseGoal: 'Bir hedef seçin',
    original: 'Özgün araçlar',
    priority: 'Seçim önceliği',
    localUsage: 'Bu cihazdaki kullanım',
    clearEntry: 'Girişi temizle',
    allClear: 'Tümünü temizle',
    backspace: 'Son karakteri sil',
    sign: 'İşareti değiştir',
    percentKey: 'Yüzde',
    squareRoot: 'Karekök',
    reciprocal: 'Çarpmaya göre ters',
    calculate: 'Hesapla',
    originalsTitle: 'Özgün planlama araçları',
    originalsHint: 'Zaman çakışmalarını, bağımlılıkları ve gelecekteki taahhütleri inceleyin.',
    unitCall: 'API çağrısı',
    unitCalls: 'API çağrıları',
    unitOrder: 'sipariş',
    unitOrders: 'siparişler',
    jsRequired:
      'Etkileşimli özellikler JavaScript gerektirir. Sayfa içeriği ve bağlantılar kullanılabilir.',
  },
};

;
(() => {
  'use strict';
  const keys = [
    'basicDescription',
    'scientificDescription',
    'basicScope',
    'scientificScope',
    'memoryClear',
    'memoryRecall',
    'memoryAdd',
    'memorySubtract',
  ];
  const rows = {
    en: [
      'A familiar keypad for everyday arithmetic, percentages, memory and calculation history.',
      'Calculate expressions with parentheses, powers, roots, logarithms and trigonometric functions.',
      'Up to 15 significant digits. Operations follow key order. Memory and history stay in this tab.',
      'Up to 15 significant digits using floating-point arithmetic. Real numbers only. Factorials support integers from 0 to 69.',
      'Clear memory',
      'Recall memory',
      'Add to memory',
      'Subtract from memory',
    ],
    'zh-CN': [
      '熟悉的实体按键布局，支持日常四则、百分比、记忆和计算历史。',
      '计算含括号、乘方、开方、对数和三角函数的算式。',
      '最多显示 15 位有效数字。按按键顺序运算。记忆与历史只保留在当前标签页。',
      '采用浮点运算，最多显示 15 位有效数字。仅支持实数；阶乘支持 0–69 的整数。',
      '清除记忆',
      '读取记忆',
      '加入记忆',
      '从记忆减去',
    ],
    hi: [
      'रोज़मर्रा के अंकगणित, प्रतिशत, मेमोरी और गणना इतिहास के लिए परिचित कीपैड।',
      'कोष्ठक, घात, मूल, लघुगणक और त्रिकोणमितीय फलनों वाले व्यंजक हल करें।',
      'अधिकतम 15 सार्थक अंक। गणना कुंजी दबाने के क्रम में होती है। मेमोरी और इतिहास इसी टैब में रहते हैं।',
      'फ़्लोटिंग-पॉइंट गणना में अधिकतम 15 सार्थक अंक। केवल वास्तविक संख्याएँ। फैक्टोरियल 0 से 69 तक के पूर्णांकों के लिए है।',
      'मेमोरी साफ़ करें',
      'मेमोरी पढ़ें',
      'मेमोरी में जोड़ें',
      'मेमोरी से घटाएँ',
    ],
    es: [
      'Un teclado familiar para operaciones diarias, porcentajes, memoria e historial.',
      'Calcula expresiones con paréntesis, potencias, raíces, logaritmos y funciones trigonométricas.',
      'Hasta 15 cifras significativas. Las operaciones siguen el orden de las teclas. La memoria y el historial permanecen en esta pestaña.',
      'Hasta 15 cifras significativas con aritmética de coma flotante. Solo números reales. Factoriales de enteros entre 0 y 69.',
      'Borrar memoria',
      'Recuperar memoria',
      'Sumar a la memoria',
      'Restar de la memoria',
    ],
    ar: [
      'لوحة مفاتيح مألوفة للحساب اليومي والنسب المئوية والذاكرة وسجل العمليات.',
      'احسب تعبيرات تتضمن الأقواس والأسس والجذور واللوغاريتمات والدوال المثلثية.',
      'حتى 15 رقمًا معنويًا. تُنفذ العمليات حسب ترتيب الضغط. تبقى الذاكرة والسجل في علامة التبويب الحالية.',
      'حتى 15 رقمًا معنويًا بحساب الفاصلة العائمة. أعداد حقيقية فقط. المضروب للأعداد الصحيحة من 0 إلى 69.',
      'مسح الذاكرة',
      'استدعاء الذاكرة',
      'إضافة إلى الذاكرة',
      'طرح من الذاكرة',
    ],
    fr: [
      'Un clavier familier pour le calcul quotidien, les pourcentages, la mémoire et l’historique.',
      'Calculez des expressions avec parenthèses, puissances, racines, logarithmes et fonctions trigonométriques.',
      'Jusqu’à 15 chiffres significatifs. Les opérations suivent l’ordre des touches. La mémoire et l’historique restent dans cet onglet.',
      'Jusqu’à 15 chiffres significatifs en virgule flottante. Nombres réels uniquement. Factorielles pour les entiers de 0 à 69.',
      'Effacer la mémoire',
      'Rappeler la mémoire',
      'Ajouter à la mémoire',
      'Soustraire de la mémoire',
    ],
    bn: [
      'দৈনন্দিন পাটিগণিত, শতকরা, মেমরি ও গণনার ইতিহাসের জন্য পরিচিত কীপ্যাড।',
      'বন্ধনী, ঘাত, মূল, লগারিদম ও ত্রিকোণমিতিক ফাংশনসহ রাশি গণনা করুন।',
      'সর্বোচ্চ ১৫টি তাৎপর্যপূর্ণ অঙ্ক। কী চাপার ক্রমে গণনা হয়। মেমরি ও ইতিহাস বর্তমান ট্যাবেই থাকে।',
      'ফ্লোটিং-পয়েন্ট গণনায় সর্বোচ্চ ১৫টি তাৎপর্যপূর্ণ অঙ্ক। শুধু বাস্তব সংখ্যা। ০–৬৯ পূর্ণসংখ্যার ফ্যাক্টোরিয়াল সমর্থিত।',
      'মেমরি মুছুন',
      'মেমরি পড়ুন',
      'মেমরিতে যোগ করুন',
      'মেমরি থেকে বিয়োগ করুন',
    ],
    pt: [
      'Um teclado familiar para contas diárias, porcentagens, memória e histórico.',
      'Calcule expressões com parênteses, potências, raízes, logaritmos e funções trigonométricas.',
      'Até 15 algarismos significativos. As operações seguem a ordem das teclas. Memória e histórico ficam nesta aba.',
      'Até 15 algarismos significativos com ponto flutuante. Apenas números reais. Fatoriais de inteiros entre 0 e 69.',
      'Limpar memória',
      'Recuperar memória',
      'Somar à memória',
      'Subtrair da memória',
    ],
    id: [
      'Tombol yang familier untuk aritmetika sehari-hari, persentase, memori, dan riwayat perhitungan.',
      'Hitung ekspresi dengan kurung, pangkat, akar, logaritma, dan fungsi trigonometri.',
      'Hingga 15 digit signifikan. Operasi mengikuti urutan tombol. Memori dan riwayat hanya tersimpan di tab ini.',
      'Hingga 15 digit signifikan dengan aritmetika titik mengambang. Hanya bilangan real. Faktorial untuk bilangan bulat 0–69.',
      'Hapus memori',
      'Panggil memori',
      'Tambah ke memori',
      'Kurangi dari memori',
    ],
    ur: [
      'روزمرہ حساب، فیصد، میموری اور حساب کی تاریخ کے لیے مانوس کی پیڈ۔',
      'قوسین، قوت، جذر، لوگارتھم اور مثلثی افعال والی عبارتیں حل کریں۔',
      'زیادہ سے زیادہ 15 معنی خیز ہندسے۔ عملیات بٹن دبانے کی ترتیب سے ہوتے ہیں۔ میموری اور تاریخ اسی ٹیب میں رہتی ہیں۔',
      'فلوٹنگ پوائنٹ حساب میں زیادہ سے زیادہ 15 معنی خیز ہندسے۔ صرف حقیقی اعداد۔ فیکٹوریل 0 سے 69 تک صحیح اعداد کے لیے ہے۔',
      'میموری صاف کریں',
      'میموری واپس لائیں',
      'میموری میں جمع کریں',
      'میموری سے منفی کریں',
    ],
    ru: [
      'Привычная клавиатура для повседневных вычислений, процентов, памяти и истории.',
      'Вычисляйте выражения со скобками, степенями, корнями, логарифмами и тригонометрическими функциями.',
      'До 15 значащих цифр. Операции выполняются в порядке нажатий. Память и история хранятся только в этой вкладке.',
      'До 15 значащих цифр, арифметика с плавающей точкой. Только действительные числа. Факториалы целых чисел от 0 до 69.',
      'Очистить память',
      'Вызвать из памяти',
      'Прибавить к памяти',
      'Вычесть из памяти',
    ],
    de: [
      'Eine vertraute Tastatur für Alltagsrechnungen, Prozente, Speicher und Verlauf.',
      'Berechne Ausdrücke mit Klammern, Potenzen, Wurzeln, Logarithmen und trigonometrischen Funktionen.',
      'Bis zu 15 signifikante Stellen. Die Reihenfolge der Tasten bestimmt die Rechnung. Speicher und Verlauf bleiben in diesem Tab.',
      'Bis zu 15 signifikante Stellen mit Gleitkommaarithmetik. Nur reelle Zahlen. Fakultäten ganzer Zahlen von 0 bis 69.',
      'Speicher löschen',
      'Speicher abrufen',
      'Zum Speicher addieren',
      'Vom Speicher subtrahieren',
    ],
    ja: [
      '日常の四則計算、パーセント、メモリー、計算履歴を使える、なじみのある電卓です。',
      '括弧、累乗、根、対数、三角関数を含む数式を計算できます。',
      '最大15桁の有効数字を表示します。キーを押した順に計算します。メモリーと履歴は現在のタブ内だけに保存します。',
      '浮動小数点演算で最大15桁の有効数字を表示します。実数のみ。階乗は0〜69の整数に対応します。',
      'メモリーを消去',
      'メモリーを呼び出す',
      'メモリーに加算',
      'メモリーから減算',
    ],
    pcm: [
      'Normal keypad for everyday maths, percentage, memory and calculation history.',
      'Calculate expressions wey get brackets, powers, roots, logarithms and trigonometry.',
      'Up to 15 significant digits. Calculation dey follow the order wey you press keys. Memory and history stay for this tab.',
      'Up to 15 significant digits with floating-point maths. Na real numbers only. Factorial dey support whole numbers from 0 to 69.',
      'Clear memory',
      'Bring memory back',
      'Add to memory',
      'Subtract from memory',
    ],
    mr: [
      'दैनंदिन अंकगणित, टक्केवारी, मेमरी आणि गणनेच्या इतिहासासाठी परिचित कीपॅड.',
      'कंस, घातांक, मूळ, लॉगरिदम आणि त्रिकोणमितीय फलने असलेली व्यंजके सोडवा.',
      'जास्तीत जास्त 15 सार्थ अंक. कळा दाबण्याच्या क्रमाने गणना होते. मेमरी आणि इतिहास या टॅबमध्येच राहतात.',
      'फ्लोटिंग-पॉइंट गणनेत जास्तीत जास्त 15 सार्थ अंक. केवळ वास्तव संख्या. 0 ते 69 पूर्णांकांचे फॅक्टोरियल समर्थित आहेत.',
      'मेमरी साफ करा',
      'मेमरी वाचा',
      'मेमरीत जोडा',
      'मेमरीतून वजा करा',
    ],
    vi: [
      'Bàn phím quen thuộc cho phép tính hằng ngày, phần trăm, bộ nhớ và lịch sử.',
      'Tính biểu thức có ngoặc, lũy thừa, căn, logarit và hàm lượng giác.',
      'Tối đa 15 chữ số có nghĩa. Phép tính theo thứ tự nhấn phím. Bộ nhớ và lịch sử chỉ nằm trong thẻ này.',
      'Tối đa 15 chữ số có nghĩa với số dấu phẩy động. Chỉ hỗ trợ số thực. Giai thừa cho số nguyên từ 0 đến 69.',
      'Xóa bộ nhớ',
      'Gọi bộ nhớ',
      'Cộng vào bộ nhớ',
      'Trừ khỏi bộ nhớ',
    ],
    te: [
      'రోజువారీ అంకగణితం, శాతాలు, మెమరీ మరియు లెక్కల చరిత్ర కోసం పరిచయమైన కీప్యాడ్.',
      'బ్రాకెట్లు, ఘాతాలు, మూలాలు, సంవర్గమానాలు మరియు త్రికోణమితి ఫంక్షన్లతో వ్యక్తీకరణలను లెక్కించండి.',
      'గరిష్ఠంగా 15 సార్థక అంకెలు. నొక్కిన కీల క్రమంలో లెక్క జరుగుతుంది. మెమరీ, చరిత్ర ఈ ట్యాబ్‌లోనే ఉంటాయి.',
      'ఫ్లోటింగ్-పాయింట్ గణనలో గరిష్ఠంగా 15 సార్థక అంకెలు. వాస్తవ సంఖ్యలు మాత్రమే. ఫ్యాక్టోరియల్‌కు 0–69 పూర్ణాంకాలు మద్దతు పొందుతాయి.',
      'మెమరీ తొలగించండి',
      'మెమరీ తీసుకురండి',
      'మెమరీకి కలపండి',
      'మెమరీ నుంచి తీసివేయండి',
    ],
    sw: [
      'Kibodi iliyozoeleka kwa hesabu za kila siku, asilimia, kumbukumbu na historia.',
      'Kokotoa misemo yenye mabano, vipeo, mizizi, logaritimu na trigonometria.',
      'Hadi tarakimu 15 muhimu. Hesabu hufuata mpangilio wa vitufe. Kumbukumbu na historia hubaki kwenye kichupo hiki.',
      'Hadi tarakimu 15 muhimu kwa hesabu za nukta inayohama. Namba halisi pekee. Faktoria kwa namba kamili 0–69.',
      'Futa kumbukumbu',
      'Rudisha kumbukumbu',
      'Ongeza kwenye kumbukumbu',
      'Ondoa kutoka kumbukumbu',
    ],
    ha: [
      'Maballan da aka saba don lissafin yau da kullum, kashi, ma’ajiya da tarihin lissafi.',
      'Lissafa jimloli masu baka, ƙarfin lamba, tushen lamba, logarithm da trigonometry.',
      'Har zuwa muhimman lambobi 15. Lissafi yana bin tsarin danna maballai. Ma’ajiya da tarihi suna cikin wannan shafi kawai.',
      'Har zuwa muhimman lambobi 15 da lissafin floating-point. Lambobi na zahiri kawai. Factorial yana goyon bayan cikakkun lambobi 0–69.',
      'Goge ma’ajiya',
      'Dawo da ma’ajiya',
      'Ƙara wa ma’ajiya',
      'Rage daga ma’ajiya',
    ],
    tr: [
      'Günlük aritmetik, yüzde, bellek ve işlem geçmişi için tanıdık bir tuş takımı.',
      'Parantez, üs, kök, logaritma ve trigonometrik fonksiyon içeren ifadeleri hesaplayın.',
      'En fazla 15 anlamlı basamak. İşlemler tuş sırasını izler. Bellek ve geçmiş yalnızca bu sekmede kalır.',
      'Kayan noktalı aritmetikle en fazla 15 anlamlı basamak. Yalnızca gerçek sayılar. Faktöriyel 0–69 arasındaki tam sayıları destekler.',
      'Belleği temizle',
      'Belleği çağır',
      'Belleğe ekle',
      'Bellekten çıkar',
    ],
  };
  for (const [l, a] of Object.entries(rows)) {
    if (a.length !== keys.length) throw Error('Keypad locale mismatch: ' + l);
    Object.assign(window.CMUiCopy[l], Object.fromEntries(keys.map((k, i) => [k, a[i]])));
  }
})();

;
window.CMTranslationAssets={"zh-CN":"/assets/dist/zh-CN.9fa5607af4fc.js","hi":"/assets/dist/hi.6023bcb8925e.js","es":"/assets/dist/es.2a6e701c70da.js","ar":"/assets/dist/ar.e036cbd91074.js","fr":"/assets/dist/fr.b8f55e1cbe77.js","bn":"/assets/dist/bn.7bb101ae805f.js","pt":"/assets/dist/pt.0895766ec1f7.js","id":"/assets/dist/id.bcfd7aaf0635.js","ur":"/assets/dist/ur.b9b81fbcbb78.js","ru":"/assets/dist/ru.162edf24e326.js","de":"/assets/dist/de.0b21617aff4f.js","ja":"/assets/dist/ja.58e82258860b.js","pcm":"/assets/dist/pcm.24d264a933ef.js","mr":"/assets/dist/mr.3b77842537d9.js","vi":"/assets/dist/vi.59756ba109d9.js","te":"/assets/dist/te.f0fc5e82a555.js","sw":"/assets/dist/sw.b91d1f21f663.js","ha":"/assets/dist/ha.16b9816e56e2.js","tr":"/assets/dist/tr.a39b35e187c5.js"};

;
window.CMI18n = (() => {
  'use strict';
  const languages = {
    en: 'English',
    'zh-CN': '简体中文',
    hi: 'हिन्दी',
    es: 'Español',
    ar: 'العربية',
    fr: 'Français',
    bn: 'বাংলা',
    pt: 'Português',
    id: 'Bahasa Indonesia',
    ur: 'اردو',
    ru: 'Русский',
    de: 'Deutsch',
    ja: '日本語',
    pcm: 'Nigerian Pidgin',
    mr: 'मराठी',
    vi: 'Tiếng Việt',
    te: 'తెలుగు',
    sw: 'Kiswahili',
    ha: 'Hausa',
    tr: 'Türkçe',
  };
  const supported = Object.keys(languages),
    normalize = (x) =>
      supported.includes(x)
        ? x
        : /^zh/i.test(x || '')
          ? 'zh-CN'
          : supported.includes(String(x || '').split('-')[0])
            ? x.split('-')[0]
            : null;
  let stored;
  try {
    stored = localStorage.getItem('calcmintly-language-v2');
  } catch {}
  const params = new URLSearchParams(location.search),
    pathLocale = location.pathname.split('/')[1];
  let lang =
    normalize(params.get('lang')) ||
    normalize(pathLocale) ||
    (document.documentElement.hasAttribute('data-cm-localized-routes') &&
      normalize(document.documentElement.lang)) ||
    normalize(stored) ||
    normalize(navigator.language) ||
    'en';
  const originalText = new WeakMap(),
    appliedText = new WeakMap(),
    originalAttrs = new WeakMap(),
    missing = new Set(),
    loads = new Map(),
    compiled = new Map(),
    memo = new Map();
  const oldEn = window.CMLegacyCopy?.en || {},
    reverse = new Map(Object.entries(oldEn).map(([zh, en]) => [en, zh]));
  const explicitKeys = new Map(
    Object.entries(window.CMUiCopy?.en || {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [value, key]),
  );
  function ensureTranslations(locale = lang) {
    if (locale === 'en' || window.CMTranslations?.[locale]) return Promise.resolve();
    if (loads.has(locale)) return loads.get(locale);
    const path = window.CMTranslationAssets?.[locale];
    if (!path) return Promise.resolve();
    const promise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = true;
      script.onload = () => {
        compiled.delete(locale);
        memo.delete(locale);
        if (lang === locale) {
          apply();
          translateTree(document.body);
          document.dispatchEvent(
            new CustomEvent('cm:translations', { detail: { language: locale } }),
          );
        }
        resolve();
      };
      script.onerror = () => resolve();
      document.head.append(script);
    });
    loads.set(locale, promise);
    return promise;
  }
  function dictionary() {
    const raw = window.CMTranslations?.[lang];
    if (!raw) return null;
    if (!compiled.has(lang))
      compiled.set(lang, {
        messages: raw.messages,
        templates: (raw.templates || []).map((x) => ({ ...x, regex: new RegExp(x.pattern, 'u') })),
      });
    return compiled.get(lang);
  }
  function t(key, values = {}) {
    const resolved = key === 'count' && Number(values.count) === 1 ? 'countOne' : key;
    let s =
      window.CMUiCopy?.[lang]?.[resolved] ??
      window.CMHomeCopy?.[lang]?.[resolved] ??
      window.CMUiCopy?.en?.[resolved] ??
      window.CMHomeCopy?.en?.[resolved] ??
      key;
    for (const [k, v] of Object.entries(values)) s = s.replaceAll('{' + k + '}', String(v));
    return s;
  }
  function translate(source) {
    if (!source || !source.trim()) return source;
    if (/^(?:https?:\/\/\S+|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(source.trim())) return source;
    const text = source.trim().replace(/\s+/g, ' '),
      pad = source.match(/^\s*/)[0],
      tail = source.match(/\s*$/)[0];
    let value;
    const explicit = explicitKeys.get(text);
    if (explicit) value = window.CMUiCopy?.[lang]?.[explicit];
    const data = dictionary();
    if (!value && data) {
      value = data.messages[text];
      if (!value && lang !== 'en') {
        if (!memo.has(lang)) memo.set(lang, new Map());
        const cache = memo.get(lang);
        if (cache.has(text)) value = cache.get(text);
        else {
          for (const template of data.templates) {
            const match = template.regex.exec(text);
            if (!match) continue;
            const parts = Object.fromEntries(
              template.indices.map((index, k) => [index, match[k + 1]]),
            );
            value = template.target.replace(/\{(\d+)\}/g, (whole, index) => parts[index] ?? whole);
            break;
          }
          if (cache.size > 5000) cache.clear();
          cache.set(text, value || null);
        }
      }
    }
    if (!value && lang === 'zh-CN' && /[\u3400-\u9fff]/.test(source)) return source;
    if (!value) {
      const key = reverse.get(text) || text;
      value = window.CMLegacyCopy?.[lang]?.[key];
    }
    if (!value && window.CMFieldCopy) value = window.CMFieldCopy[lang]?.[text];
    if (!value && lang !== 'en' && /[A-Za-z]{3}/.test(text)) missing.add(text);
    return pad + (value || text) + tail;
  }
  function pick(pair) {
    const [en, zh] = String(pair).split('|');
    return lang === 'zh-CN' ? zh || en : translate(en);
  }
  function message(source, values) {
    return pick(source).replace(/\{(\d+)\}/g, (whole, index) =>
      values[index] === undefined ? whole : String(values[index]),
    );
  }
  function number(value, options = {}) {
    const small = Number.isFinite(value) && value !== 0 && Math.abs(value) < 0.000001,
      large = Number.isFinite(value) && Math.abs(value) >= 1e16;
    return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
      ...(small || large ? { notation: 'scientific' } : {}),
      ...options,
    }).format(Object.is(value, -0) ? 0 : value);
  }
  function currency(value, code = 'USD', options = {}) {
    try {
      return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
        style: 'currency',
        currency: code,
        ...options,
      }).format(value);
    } catch {
      return String(value) + ' ' + code;
    }
  }
  function toolName(tool) {
    return tool?.names?.[lang] || translate(tool?.name || '');
  }
  function toolDescription(tool) {
    return tool?.descriptions?.[lang] || translate(tool?.description || '');
  }
  function searchText(tool) {
    return [
      toolName(tool),
      toolDescription(tool),
      tool.name,
      tool.description,
      ...Object.values(tool.names || {}),
      ...Object.values(tool.descriptions || {}),
      tool.keywords,
      tool.slug,
    ]
      .filter(Boolean)
      .join(' ');
  }
  function unit(source, value = 2) {
    const rateTime = (key) =>
      lang === 'zh-CN'
        ? { month: '月', year: '年', hour: '小时' }[key] || unit(key, 1)
        : lang === 'ja'
          ? { month: '月', year: '年', hour: '時間' }[key] || unit(key, 1)
          : unit(key, 1);
    const composite = String(source).match(/^([A-Z]{3})\/(month|year|hour|call|order)$/);
    if (composite)
      return (
        composite[1] +
        '/' +
        (composite[2] === 'call'
          ? t('unitCall')
          : composite[2] === 'order'
            ? t('unitOrder')
            : rateTime(composite[2]))
      );
    const count = String(source).match(/^(calls|orders)\/(month|year)$/);
    if (count)
      return (
        t(
          count[1] === 'calls'
            ? Number(value) === 1
              ? 'unitCall'
              : 'unitCalls'
            : Number(value) === 1
              ? 'unitOrder'
              : 'unitOrders',
        ) +
        '/' +
        rateTime(count[2])
      );
    const units = {
      weeks: 'week',
      week: 'week',
      years: 'year',
      year: 'year',
      months: 'month',
      month: 'month',
      days: 'day',
      day: 'day',
      hours: 'hour',
      hour: 'hour',
      minutes: 'minute',
      minute: 'minute',
      seconds: 'second',
      second: 'second',
      bits: 'bit',
      bytes: 'byte',
    };
    if (units[source])
      try {
        return new Intl.NumberFormat(lang === 'pcm' ? 'en-NG' : lang, {
          style: 'unit',
          unit: units[source],
          unitDisplay: 'long',
        })
          .formatToParts(Math.abs(Number(value) || 0))
          .filter((x) => x.type === 'unit')
          .map((x) => x.value)
          .join(' ');
      } catch {}
    return translate(source);
  }
  function url(path, locale = lang) {
    if (document.documentElement.hasAttribute('data-cm-localized-routes') && window.CMLocaleRoutes)
      return window.CMLocaleRoutes.url(path, locale, location.origin);
    const u = new URL(path, location.origin);
    if (u.origin !== location.origin || /^(mailto|tel):/.test(path)) return path;
    const bits = u.pathname.split('/').filter(Boolean);
    if (bits.length === 0 || (bits.length === 1 && supported.includes(bits[0]))) {
      u.pathname = locale === 'en' ? '/' : '/' + locale + '/';
      u.searchParams.delete('lang');
    } else u.searchParams.set('lang', locale);
    return u.pathname + u.search + u.hash;
  }
  function updateMetadata() {
    const body = document.body;
    if (!body?.hasAttribute('data-cm-page-name') || !window.CMMetadata) return;
    const preferredName = window.CMCatalog?.find((tool) => tool.name === body.dataset.cmPageName)
      ?.names?.[lang];
    const metadata =
      lang === 'en'
        ? { title: body.dataset.cmTitleEn, description: body.dataset.cmDescriptionEn }
        : body.dataset.cmPageKind === 'info'
          ? {
              title: translate(body.dataset.cmTitleEn),
              description: translate(body.dataset.cmDescriptionEn),
            }
          : window.CMMetadata.forPage(
              preferredName || translate(body.dataset.cmPageName),
              translate(body.dataset.cmPagePurpose),
              translate,
              lang,
            );
    if (metadata.title) document.title = metadata.title;
    for (const element of document.querySelectorAll(
      'meta[property="og:title"],meta[name="twitter:title"]',
    ))
      element.content = metadata.title;
    if (metadata.description)
      for (const element of document.querySelectorAll(
        'meta[name=description],meta[property="og:description"],meta[name="twitter:description"]',
      ))
        element.content = metadata.description;
    const canonicalPath = body.dataset.cmCanonicalPath || location.pathname;
    const canonical = 'https://calcmintly.com' + url(canonicalPath, lang).split('?')[0];
    const canonicalLink = document.querySelector('link[rel=canonical]');
    if (canonicalLink) canonicalLink.href = canonical;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonical;
    for (const link of document.querySelectorAll('link[rel=alternate][hreflang]')) {
      const alternate = link.getAttribute('hreflang');
      link.href =
        'https://calcmintly.com' +
        url(location.pathname, alternate === 'x-default' ? 'en' : alternate).split('?')[0];
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = lang.replace('-', '_');
    for (const script of document.querySelectorAll('script[data-cm-schema-source]')) {
      const schema = JSON.parse(script.dataset.cmSchemaSource);
      function localize(value, key) {
        if (Array.isArray(value)) return value.map((x) => localize(x, key));
        if (value && typeof value === 'object')
          return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, k)]));
        if (typeof value !== 'string' || key.startsWith('@')) return value;
        if (
          ['url', 'item', 'mainEntityOfPage'].includes(key) &&
          value.startsWith('https://calcmintly.com')
        )
          return (
            'https://calcmintly.com' +
            url(value.replace('https://calcmintly.com', location.origin), lang)
          );
        return ['name', 'description', 'text'].includes(key) ? translate(value) : value;
      }
      const localized = localize(schema, '');
      if (['WebApplication', 'SoftwareApplication', 'WebSite'].includes(schema['@type']))
        localized.inLanguage = lang;
      const result = JSON.stringify(localized).replaceAll('<', '\\u003c');
      if (script.textContent !== result) script.textContent = result;
    }
  }
  function options(select) {
    select.replaceChildren(...supported.map((l) => new Option(languages[l], l)));
    select.value = lang;
    select.setAttribute('aria-label', t('language'));
  }
  function apply(root = document) {
    document.documentElement.lang = lang;
    document.documentElement.dir = ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr';
    const tools = new Map((window.CMCatalog || []).map((tool) => [tool.slug, tool]));
    root.querySelectorAll?.('[data-cm-tool-slug]').forEach((element) => {
      const tool = tools.get(element.dataset.cmToolSlug);
      if (tool) element.textContent = toolName(tool);
    });
    root.querySelectorAll?.('[data-cm-i18n]').forEach((e) => (e.textContent = t(e.dataset.cmI18n)));
    root
      .querySelectorAll?.('[data-cm-pair]')
      .forEach((e) => (e.textContent = pick(e.dataset.cmPair)));
    root
      .querySelectorAll?.('[data-cm-placeholder]')
      .forEach((e) => (e.placeholder = t(e.dataset.cmPlaceholder)));
    root
      .querySelectorAll?.('[data-cm-label]')
      .forEach((e) => e.setAttribute('aria-label', t(e.dataset.cmLabel)));
    root.querySelectorAll?.('[data-cm-href]').forEach((a) => (a.href = url(a.dataset.cmHref)));
    if (document.documentElement.hasAttribute('data-cm-localized-routes'))
      root.querySelectorAll?.('a[href]:not([data-cm-href]):not([download])').forEach((a) => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#')) a.href = url(href);
      });
    root.querySelectorAll?.('[data-cm-language]').forEach(options);
    root.querySelectorAll?.('[data-cm-value]').forEach((element) => {
      const value = Number(element.dataset.cmValue),
        digits = Number(element.dataset.cmSignificantDigits);
      if (Number.isFinite(value))
        element.textContent =
          number(value, {
            maximumSignificantDigits:
              Number.isInteger(digits) && digits >= 1 && digits <= 21 ? digits : 12,
            ...(element.dataset.cmNotation === 'scientific' ? { notation: 'scientific' } : {}),
          }) + (element.dataset.cmUnit ? ' ' + unit(element.dataset.cmUnit, value) : '');
    });
  }
  function translateTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          'script,style,noscript,code,pre,textarea,[data-cm-no-translate],[data-cm-tool-slug],[data-cm-i18n],[data-cm-pair],[data-t],.kp-value,.kp-expression,.metric strong',
        )
      )
        continue;
      let original = originalText.get(node);
      if (!original || (appliedText.has(node) && appliedText.get(node) !== node.textContent)) {
        original = parent.hasAttribute('data-cm-source')
          ? parent.getAttribute('data-cm-source')
          : node.textContent;
        originalText.set(node, original);
      }
      const value = translate(original);
      if (node.textContent !== value) node.textContent = value;
      appliedText.set(node, value);
    }
    root.querySelectorAll?.('[placeholder],[aria-label],[alt]').forEach((el) => {
      if (el.matches('[data-cm-language],[data-cm-placeholder],[data-cm-label],[data-aria]'))
        return;
      let originals = originalAttrs.get(el);
      if (!originals) {
        originals = {
          placeholder:
            el.getAttribute('data-cm-source-placeholder') ?? el.getAttribute('placeholder'),
          'aria-label':
            el.getAttribute('data-cm-source-aria-label') ?? el.getAttribute('aria-label'),
          alt: el.getAttribute('data-cm-source-alt') ?? el.getAttribute('alt'),
        };
        originalAttrs.set(el, originals);
      }
      for (const [k, v] of Object.entries(originals))
        if (v !== null) el.setAttribute(k, translate(v));
    });
  }
  function setLanguage(value, { navigate = false } = {}) {
    const next = normalize(value);
    if (!next) return;
    lang = next;
    try {
      localStorage.setItem('calcmintly-language-v2', lang);
    } catch {}
    if (navigate) {
      location.assign(url(location.href, lang));
      return;
    }
    const u = new URL(location.href);
    if (document.documentElement.hasAttribute('data-cm-localized-routes')) {
      const path = url(location.href, lang);
      history.replaceState(history.state, '', path);
    } else if (!supported.includes(u.pathname.split('/')[1])) {
      u.searchParams.set('lang', lang);
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    }
    apply();
    document.dispatchEvent(new CustomEvent('cm:language', { detail: { language: lang } }));
    ensureTranslations(lang);
  }
  function observe() {
    const root = document.querySelector('main,.wrap') || document.body;
    let queued = false;
    const observer = new MutationObserver((records) => {
      if (
        queued ||
        !records.some((record) => {
          const node =
            record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target;
          return !node.closest?.(
            'script,style,code,pre,textarea,input,[data-cm-no-translate],[data-cm-i18n],[data-cm-pair],[data-cm-value],.kp-value,.kp-expression',
          );
        })
      )
        return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        translateTree(root);
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    translateTree(root);
  }
  apply();
  ensureTranslations(lang);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
  return {
    languages,
    supported,
    normalize,
    get language() {
      return lang;
    },
    get formatLocale() {
      return lang === 'pcm' ? 'en-NG' : lang;
    },
    currency,
    toolName,
    toolDescription,
    searchText,
    t,
    translate,
    pick,
    message,
    number,
    unit,
    url,
    options,
    updateMetadata,
    apply,
    translateTree,
    setLanguage,
    ensureTranslations,
    missing,
  };
})();

;
(() => {
  'use strict';
  const preference = 'calcmintly-usage-opt-in-v1',
    key = 'calcmintly-local-usage-v1';
  let counted = false,
    timer;
  function enabled() {
    try {
      return localStorage.getItem(preference) === 'yes';
    } catch {
      return false;
    }
  }
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 1000)
          .filter(
            ([slug, n]) =>
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
              slug.length <= 100 &&
              Number.isSafeInteger(n) &&
              n > 0,
          ),
      );
    } catch {
      return {};
    }
  }
  function set(value) {
    try {
      if (value) localStorage.setItem(preference, 'yes');
      else {
        localStorage.removeItem(preference);
        localStorage.removeItem(key);
      }
      document.dispatchEvent(new Event('cm:usage'));
      return true;
    } catch {
      return false;
    }
  }
  function record() {
    if (counted || !enabled()) return;
    const slug =
      document.body.dataset.model ||
      (document.body.dataset.keypad && document.body.dataset.keypad + '-calculator') ||
      location.pathname
        .split('/')
        .filter(Boolean)
        .at(-1)
        ?.replace(/\.html$/, '');
    if (
      !window.CMCatalog?.some((x) => x.slug === slug) ||
      document.body.classList.contains('cm-invalid') ||
      document.querySelector('#kp-error')?.textContent
    )
      return;
    try {
      const value = read();
      value[slug] = Math.min(Number.MAX_SAFE_INTEGER, (value[slug] || 0) + 1);
      localStorage.setItem(key, JSON.stringify(value));
      counted = true;
      document.dispatchEvent(new Event('cm:usage'));
    } catch {}
  }
  function interaction(event) {
    if (!event.isTrusted || !enabled() || counted) return;
    const element = event.target;
    if (
      !element.closest?.('main,.wrap,.kp-wrap') ||
      element.matches?.('[type=search],[data-cm-language]')
    )
      return;
    if (event.type === 'click' && !element.closest('[data-key]')) return;
    clearTimeout(timer);
    timer = setTimeout(record, 600);
  }
  document.addEventListener('input', interaction);
  document.addEventListener('click', interaction);
  document.addEventListener('keydown', (event) => {
    if (
      event.isTrusted &&
      document.body.dataset.keypad &&
      /^[0-9+*/=%.()-]$|^Enter$/.test(event.key)
    )
      interaction(event);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === preference || event.key === key)
      document.dispatchEvent(new Event('cm:usage'));
  });
  window.CMLocalUsage = { enabled, read, set };
})();
