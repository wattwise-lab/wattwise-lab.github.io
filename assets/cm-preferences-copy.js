/* Authored native copy for the same explicit preference controls in all 20 locales. */
(() => {
  'use strict';
  window.CMPreferenceCopy = {
    en: {
      preferenceTitle: 'Choices on this device',
      preferenceHint:
        'Remember only the selected units in this browser. Numbers and other inputs are not saved. Used for fresh standalone examples; shared links and workspace cards keep their own choices.',
      preferenceCurrencyHint:
        'Remember only the currency code in this browser. Amounts are not saved or converted. Used for fresh standalone examples; shared links and workspace cards keep their own choices.',
      preferenceRemember: 'Remember choices',
      preferenceForget: 'Forget choices',
      preferenceSaved:
        'Choices saved on this device. Future unit or currency changes will also be remembered.',
      preferenceForgotten: 'Saved choices removed. Current inputs are unchanged.',
      preferenceFailure: 'This browser could not update the saved choices.',
      preferenceRestored:
        'Saved choices applied to this new example. Check the units before entering numbers.',
      preferenceSkipped: 'Existing input state takes precedence. Saved choices were not applied.',
      preferencePrivacy:
        'Unit and currency choices are stored only after you choose Remember choices. This setting does not save numbers or calculation inputs. Clear CalcMintly local data also removes these choices.',
    },
    'zh-CN': {
      preferenceTitle: '本设备的选择',
      preferenceHint:
        '仅在本浏览器记住所选单位，不保存数值或其他输入。用于下次独立打开工具时的新示例；分享链接和工作台卡片保留各自的选择。',
      preferenceCurrencyHint:
        '仅在本浏览器记住币种代码，不保存或换算金额。用于下次独立打开工具时的新示例；分享链接和工作台卡片保留各自的选择。',
      preferenceRemember: '记住选择',
      preferenceForget: '忘记选择',
      preferenceSaved: '已在本设备保存；之后手动更改单位或币种时也会记住。',
      preferenceForgotten: '已移除保存的选择，当前输入不变。',
      preferenceFailure: '本浏览器未能更新保存的选择。',
      preferenceRestored: '已将保存的选择用于这个新示例；输入数值前请核对单位。',
      preferenceSkipped: '优先保留已有输入状态，未应用保存的选择。',
      preferencePrivacy:
        '只有点击“记住选择”后才会保存单位和币种选择，此设置不保存数值或计算输入。“清除 CalcMintly 本地数据”也会移除这些选择。',
    },
    hi: {
      preferenceTitle: 'इस डिवाइस की पसंद',
      preferenceHint:
        'इस ब्राउज़र में केवल चुनी हुई इकाइयाँ याद रखें। संख्याएँ और अन्य इनपुट सहेजे नहीं जाते। ये नए स्वतंत्र उदाहरणों पर लागू होंगी; साझा लिंक और कार्यक्षेत्र कार्ड अपनी पसंद रखेंगे।',
      preferenceCurrencyHint:
        'इस ब्राउज़र में केवल मुद्रा कोड याद रखें। रकम सहेजी या परिवर्तित नहीं की जाती। यह नए स्वतंत्र उदाहरणों पर लागू होगा; साझा लिंक और कार्यक्षेत्र कार्ड अपनी पसंद रखेंगे।',
      preferenceRemember: 'पसंद याद रखें',
      preferenceForget: 'पसंद हटाएँ',
      preferenceSaved:
        'पसंद इस डिवाइस पर सहेज दी गई। आगे इकाई या मुद्रा में किए बदलाव भी याद रखे जाएँगे।',
      preferenceForgotten: 'सहेजी हुई पसंद हटा दी गई। मौजूदा इनपुट नहीं बदले।',
      preferenceFailure: 'यह ब्राउज़र सहेजी हुई पसंद अपडेट नहीं कर सका।',
      preferenceRestored:
        'इस नए उदाहरण पर सहेजी हुई पसंद लागू की गई। संख्या भरने से पहले इकाई जाँचें।',
      preferenceSkipped: 'मौजूदा इनपुट को प्राथमिकता मिली। सहेजी हुई पसंद लागू नहीं की गई।',
      preferencePrivacy:
        'इकाई और मुद्रा की पसंद केवल “पसंद याद रखें” चुनने के बाद सहेजी जाती है। यह सेटिंग संख्या या गणना के इनपुट नहीं सहेजती। CalcMintly का स्थानीय डेटा साफ़ करने पर ये पसंद भी हट जाती हैं।',
    },
    es: {
      preferenceTitle: 'Preferencias de este dispositivo',
      preferenceHint:
        'Recuerda solo las unidades elegidas en este navegador. No se guardan números ni otros datos. Se usan en ejemplos nuevos abiertos por separado; los enlaces compartidos y las tarjetas del espacio de trabajo conservan sus opciones.',
      preferenceCurrencyHint:
        'Recuerda solo el código de moneda en este navegador. No se guardan ni convierten importes. Se usa en ejemplos nuevos abiertos por separado; los enlaces compartidos y las tarjetas del espacio de trabajo conservan sus opciones.',
      preferenceRemember: 'Recordar opciones',
      preferenceForget: 'Olvidar opciones',
      preferenceSaved:
        'Opciones guardadas en este dispositivo. También se recordarán los próximos cambios de unidad o moneda.',
      preferenceForgotten: 'Opciones guardadas eliminadas. Los datos actuales no han cambiado.',
      preferenceFailure: 'Este navegador no pudo actualizar las opciones guardadas.',
      preferenceRestored:
        'Opciones guardadas aplicadas a este nuevo ejemplo. Comprueba las unidades antes de introducir números.',
      preferenceSkipped:
        'Los datos existentes tienen prioridad. No se aplicaron las opciones guardadas.',
      preferencePrivacy:
        'Las opciones de unidad y moneda solo se guardan al elegir Recordar opciones. Este ajuste no guarda números ni datos de cálculo. Borrar los datos locales de CalcMintly también elimina estas opciones.',
    },
    ar: {
      preferenceTitle: 'الاختيارات على هذا الجهاز',
      preferenceHint:
        'احفظ الوحدات المختارة فقط في هذا المتصفح. لا تُحفظ الأرقام أو المدخلات الأخرى. تُستخدم للأمثلة الجديدة المفتوحة بشكل مستقل؛ وتحتفظ الروابط المشتركة وبطاقات مساحة العمل باختياراتها.',
      preferenceCurrencyHint:
        'احفظ رمز العملة فقط في هذا المتصفح. لا تُحفظ المبالغ ولا تُحوّل. يُستخدم للأمثلة الجديدة المفتوحة بشكل مستقل؛ وتحتفظ الروابط المشتركة وبطاقات مساحة العمل باختياراتها.',
      preferenceRemember: 'تذكّر الاختيارات',
      preferenceForget: 'حذف الاختيارات المحفوظة',
      preferenceSaved:
        'حُفظت الاختيارات على هذا الجهاز. ستُحفظ أيضًا التغييرات اللاحقة للوحدات أو العملة.',
      preferenceForgotten: 'حُذفت الاختيارات المحفوظة. لم تتغير المدخلات الحالية.',
      preferenceFailure: 'تعذّر على هذا المتصفح تحديث الاختيارات المحفوظة.',
      preferenceRestored:
        'طُبّقت الاختيارات المحفوظة على هذا المثال الجديد. تحقّق من الوحدات قبل إدخال الأرقام.',
      preferenceSkipped: 'للمدخلات الحالية الأولوية. لم تُطبّق الاختيارات المحفوظة.',
      preferencePrivacy:
        'تُحفظ اختيارات الوحدات والعملة فقط بعد اختيار «تذكّر الاختيارات». لا يحفظ هذا الإعداد الأرقام أو مدخلات الحساب. يؤدي مسح بيانات CalcMintly المحلية أيضًا إلى حذف هذه الاختيارات.',
    },
    fr: {
      preferenceTitle: 'Choix sur cet appareil',
      preferenceHint:
        'Mémorisez uniquement les unités choisies dans ce navigateur. Les nombres et autres saisies ne sont pas enregistrés. Ces choix servent aux nouveaux exemples ouverts séparément ; les liens partagés et les cartes de l’espace de travail gardent leurs propres choix.',
      preferenceCurrencyHint:
        'Mémorisez uniquement le code de devise dans ce navigateur. Les montants ne sont ni enregistrés ni convertis. Ce choix sert aux nouveaux exemples ouverts séparément ; les liens partagés et les cartes de l’espace de travail gardent leurs propres choix.',
      preferenceRemember: 'Mémoriser les choix',
      preferenceForget: 'Oublier les choix',
      preferenceSaved:
        'Choix enregistrés sur cet appareil. Les prochains changements d’unité ou de devise seront aussi mémorisés.',
      preferenceForgotten: 'Choix enregistrés supprimés. Les saisies actuelles restent inchangées.',
      preferenceFailure: 'Ce navigateur n’a pas pu mettre à jour les choix enregistrés.',
      preferenceRestored:
        'Choix enregistrés appliqués à ce nouvel exemple. Vérifiez les unités avant de saisir des nombres.',
      preferenceSkipped:
        'Les saisies existantes sont prioritaires. Les choix enregistrés n’ont pas été appliqués.',
      preferencePrivacy:
        'Les choix d’unité et de devise sont enregistrés uniquement après avoir sélectionné Mémoriser les choix. Ce réglage ne conserve ni nombres ni données de calcul. Effacer les données locales de CalcMintly supprime aussi ces choix.',
    },
    bn: {
      preferenceTitle: 'এই ডিভাইসের পছন্দ',
      preferenceHint:
        'এই ব্রাউজারে শুধু নির্বাচিত একক মনে রাখুন। সংখ্যা বা অন্য ইনপুট সংরক্ষিত হয় না। নতুন করে আলাদাভাবে খোলা উদাহরণে এগুলো ব্যবহৃত হবে; শেয়ার করা লিংক ও কর্মক্ষেত্রের কার্ড নিজস্ব পছন্দ রাখবে।',
      preferenceCurrencyHint:
        'এই ব্রাউজারে শুধু মুদ্রার কোড মনে রাখুন। টাকার অঙ্ক সংরক্ষণ বা রূপান্তর করা হয় না। নতুন করে আলাদাভাবে খোলা উদাহরণে এটি ব্যবহৃত হবে; শেয়ার করা লিংক ও কর্মক্ষেত্রের কার্ড নিজস্ব পছন্দ রাখবে।',
      preferenceRemember: 'পছন্দ মনে রাখুন',
      preferenceForget: 'সংরক্ষিত পছন্দ মুছুন',
      preferenceSaved:
        'এই ডিভাইসে পছন্দ সংরক্ষিত হয়েছে। পরে একক বা মুদ্রা বদলালেও তা মনে রাখা হবে।',
      preferenceForgotten: 'সংরক্ষিত পছন্দ মুছে গেছে। বর্তমান ইনপুট বদলায়নি।',
      preferenceFailure: 'এই ব্রাউজার সংরক্ষিত পছন্দ আপডেট করতে পারেনি।',
      preferenceRestored:
        'এই নতুন উদাহরণে সংরক্ষিত পছন্দ প্রয়োগ হয়েছে। সংখ্যা দেওয়ার আগে একক দেখুন।',
      preferenceSkipped: 'আগের ইনপুট অগ্রাধিকার পেয়েছে। সংরক্ষিত পছন্দ প্রয়োগ হয়নি।',
      preferencePrivacy:
        'শুধু “পছন্দ মনে রাখুন” বেছে নিলেই একক ও মুদ্রার পছন্দ সংরক্ষিত হয়। এই সেটিং সংখ্যা বা গণনার ইনপুট সংরক্ষণ করে না। CalcMintly-এর স্থানীয় ডেটা মুছলে এই পছন্দও মুছে যায়।',
    },
    pt: {
      preferenceTitle: 'Preferências neste dispositivo',
      preferenceHint:
        'Memorize apenas as unidades escolhidas neste navegador. Números e outros dados não são guardados. As preferências valem para novos exemplos abertos separadamente; links partilhados e cartões da área de trabalho mantêm as suas escolhas.',
      preferenceCurrencyHint:
        'Memorize apenas o código da moeda neste navegador. Os valores não são guardados nem convertidos. A preferência vale para novos exemplos abertos separadamente; links partilhados e cartões da área de trabalho mantêm as suas escolhas.',
      preferenceRemember: 'Memorizar escolhas',
      preferenceForget: 'Esquecer escolhas',
      preferenceSaved:
        'Escolhas guardadas neste dispositivo. As próximas alterações de unidade ou moeda também serão memorizadas.',
      preferenceForgotten: 'Escolhas guardadas removidas. Os dados atuais não mudaram.',
      preferenceFailure: 'Este navegador não conseguiu atualizar as escolhas guardadas.',
      preferenceRestored:
        'Escolhas guardadas aplicadas a este novo exemplo. Confira as unidades antes de introduzir números.',
      preferenceSkipped:
        'Os dados existentes têm prioridade. As escolhas guardadas não foram aplicadas.',
      preferencePrivacy:
        'As escolhas de unidade e moeda só são guardadas depois de selecionar Memorizar escolhas. Esta definição não guarda números nem dados de cálculo. Limpar os dados locais do CalcMintly também remove estas escolhas.',
    },
    id: {
      preferenceTitle: 'Pilihan di perangkat ini',
      preferenceHint:
        'Ingat hanya satuan yang dipilih di browser ini. Angka dan masukan lainnya tidak disimpan. Digunakan untuk contoh baru yang dibuka terpisah; tautan bersama dan kartu ruang kerja mempertahankan pilihannya sendiri.',
      preferenceCurrencyHint:
        'Ingat hanya kode mata uang di browser ini. Nominal tidak disimpan atau dikonversi. Digunakan untuk contoh baru yang dibuka terpisah; tautan bersama dan kartu ruang kerja mempertahankan pilihannya sendiri.',
      preferenceRemember: 'Ingat pilihan',
      preferenceForget: 'Hapus pilihan tersimpan',
      preferenceSaved:
        'Pilihan disimpan di perangkat ini. Perubahan satuan atau mata uang berikutnya juga akan diingat.',
      preferenceForgotten: 'Pilihan tersimpan dihapus. Masukan saat ini tidak berubah.',
      preferenceFailure: 'Browser ini tidak dapat memperbarui pilihan tersimpan.',
      preferenceRestored:
        'Pilihan tersimpan diterapkan pada contoh baru ini. Periksa satuan sebelum memasukkan angka.',
      preferenceSkipped: 'Masukan yang ada diutamakan. Pilihan tersimpan tidak diterapkan.',
      preferencePrivacy:
        'Pilihan satuan dan mata uang disimpan hanya setelah Anda memilih Ingat pilihan. Pengaturan ini tidak menyimpan angka atau masukan perhitungan. Menghapus data lokal CalcMintly juga menghapus pilihan ini.',
    },
    ur: {
      preferenceTitle: 'اس آلے پر ترجیحات',
      preferenceHint:
        'اس براؤزر میں صرف منتخب اکائیاں یاد رکھیں۔ اعداد اور دیگر اندراجات محفوظ نہیں ہوتے۔ یہ الگ سے کھولی گئی نئی مثالوں پر لاگو ہوں گی؛ مشترکہ لنکس اور ورک اسپیس کارڈ اپنی ترجیحات برقرار رکھیں گے۔',
      preferenceCurrencyHint:
        'اس براؤزر میں صرف کرنسی کوڈ یاد رکھیں۔ رقوم محفوظ یا تبدیل نہیں کی جاتیں۔ یہ الگ سے کھولی گئی نئی مثالوں پر لاگو ہوگا؛ مشترکہ لنکس اور ورک اسپیس کارڈ اپنی ترجیحات برقرار رکھیں گے۔',
      preferenceRemember: 'ترجیحات یاد رکھیں',
      preferenceForget: 'محفوظ ترجیحات مٹائیں',
      preferenceSaved:
        'ترجیحات اس آلے پر محفوظ ہو گئیں۔ آئندہ اکائی یا کرنسی کی تبدیلیاں بھی یاد رکھی جائیں گی۔',
      preferenceForgotten: 'محفوظ ترجیحات مٹا دی گئیں۔ موجودہ اندراجات تبدیل نہیں ہوئے۔',
      preferenceFailure: 'یہ براؤزر محفوظ ترجیحات کو تازہ نہیں کر سکا۔',
      preferenceRestored:
        'اس نئی مثال پر محفوظ ترجیحات لاگو ہو گئیں۔ اعداد درج کرنے سے پہلے اکائیاں دیکھ لیں۔',
      preferenceSkipped: 'موجودہ اندراجات کو ترجیح دی گئی۔ محفوظ ترجیحات لاگو نہیں ہوئیں۔',
      preferencePrivacy:
        'اکائی اور کرنسی کی ترجیحات صرف «ترجیحات یاد رکھیں» منتخب کرنے کے بعد محفوظ ہوتی ہیں۔ یہ ترتیب اعداد یا حساب کے اندراجات محفوظ نہیں کرتی۔ CalcMintly کا مقامی ڈیٹا صاف کرنے سے یہ ترجیحات بھی مٹ جاتی ہیں۔',
    },
    ru: {
      preferenceTitle: 'Настройки на этом устройстве',
      preferenceHint:
        'Сохраняются только выбранные единицы в этом браузере. Числа и другие введённые данные не сохраняются. Настройки применяются к новым отдельно открытым примерам; общие ссылки и карточки рабочего пространства сохраняют свой выбор.',
      preferenceCurrencyHint:
        'В этом браузере сохраняется только код валюты. Суммы не сохраняются и не пересчитываются. Настройка применяется к новым отдельно открытым примерам; общие ссылки и карточки рабочего пространства сохраняют свой выбор.',
      preferenceRemember: 'Запомнить выбор',
      preferenceForget: 'Удалить сохранённый выбор',
      preferenceSaved:
        'Выбор сохранён на этом устройстве. Последующие изменения единиц или валюты тоже будут запоминаться.',
      preferenceForgotten: 'Сохранённый выбор удалён. Текущие данные не изменились.',
      preferenceFailure: 'Браузеру не удалось обновить сохранённый выбор.',
      preferenceRestored:
        'Сохранённый выбор применён к новому примеру. Проверьте единицы перед вводом чисел.',
      preferenceSkipped: 'Текущие данные имеют приоритет. Сохранённый выбор не применён.',
      preferencePrivacy:
        'Выбор единиц и валюты сохраняется только после нажатия «Запомнить выбор». Эта настройка не сохраняет числа и данные расчётов. Очистка локальных данных CalcMintly также удаляет этот выбор.',
    },
    de: {
      preferenceTitle: 'Auswahl auf diesem Gerät',
      preferenceHint:
        'Nur die gewählten Einheiten werden in diesem Browser gespeichert. Zahlen und andere Eingaben werden nicht gespeichert. Die Auswahl gilt für neu einzeln geöffnete Beispiele; geteilte Links und Arbeitsbereichskarten behalten ihre eigene Auswahl.',
      preferenceCurrencyHint:
        'Nur der Währungscode wird in diesem Browser gespeichert. Beträge werden weder gespeichert noch umgerechnet. Die Auswahl gilt für neu einzeln geöffnete Beispiele; geteilte Links und Arbeitsbereichskarten behalten ihre eigene Auswahl.',
      preferenceRemember: 'Auswahl merken',
      preferenceForget: 'Auswahl vergessen',
      preferenceSaved:
        'Auswahl auf diesem Gerät gespeichert. Weitere Änderungen an Einheit oder Währung werden ebenfalls gemerkt.',
      preferenceForgotten: 'Gespeicherte Auswahl entfernt. Aktuelle Eingaben bleiben unverändert.',
      preferenceFailure: 'Dieser Browser konnte die gespeicherte Auswahl nicht aktualisieren.',
      preferenceRestored:
        'Gespeicherte Auswahl auf dieses neue Beispiel angewendet. Prüfen Sie die Einheiten vor der Zahleneingabe.',
      preferenceSkipped:
        'Vorhandene Eingaben haben Vorrang. Die gespeicherte Auswahl wurde nicht angewendet.',
      preferencePrivacy:
        'Einheiten und Währung werden erst nach „Auswahl merken“ gespeichert. Diese Einstellung speichert keine Zahlen oder Berechnungseingaben. Das Löschen lokaler CalcMintly-Daten entfernt auch diese Auswahl.',
    },
    ja: {
      preferenceTitle: 'この端末の選択設定',
      preferenceHint:
        '選んだ単位だけをこのブラウザに保存します。数値やその他の入力は保存しません。新しく単独で開いた計算例に使い、共有リンクとワークスペースのカードはそれぞれの選択を優先します。',
      preferenceCurrencyHint:
        '通貨コードだけをこのブラウザに保存します。金額の保存や換算は行いません。新しく単独で開いた計算例に使い、共有リンクとワークスペースのカードはそれぞれの選択を優先します。',
      preferenceRemember: '選択を記憶',
      preferenceForget: '記憶した選択を削除',
      preferenceSaved: 'この端末に保存しました。今後手動で変更した単位や通貨も記憶します。',
      preferenceForgotten: '保存した選択を削除しました。現在の入力は変わりません。',
      preferenceFailure: 'このブラウザでは保存した選択を更新できませんでした。',
      preferenceRestored:
        'この新しい計算例に保存した選択を適用しました。数値を入力する前に単位をご確認ください。',
      preferenceSkipped: '既存の入力を優先し、保存した選択は適用しませんでした。',
      preferencePrivacy:
        '単位と通貨の選択は「選択を記憶」を選んだ場合のみ保存します。この設定では数値や計算入力を保存しません。CalcMintlyのローカルデータを消去すると、これらの選択も削除されます。',
    },
    pcm: {
      preferenceTitle: 'Choices for this device',
      preferenceHint:
        'Na only the units wey you choose this browser go remember. E no save numbers or other inputs. E go use them for new examples wey you open alone; shared links and workspace cards go keep their own choices.',
      preferenceCurrencyHint:
        'Na only currency code this browser go remember. E no save or convert money amounts. E go use am for new examples wey you open alone; shared links and workspace cards go keep their own choices.',
      preferenceRemember: 'Remember choices',
      preferenceForget: 'Forget choices',
      preferenceSaved:
        'Choices don save for this device. E go also remember unit or currency changes wey you make later.',
      preferenceForgotten: 'Saved choices don clear. Your current inputs no change.',
      preferenceFailure: 'This browser no fit update the saved choices.',
      preferenceRestored:
        'Saved choices don apply to this new example. Check the units before you enter numbers.',
      preferenceSkipped: 'Inputs wey already dey get priority. Saved choices no apply.',
      preferencePrivacy:
        'Unit and currency choices go save only after you choose Remember choices. This setting no save numbers or calculation inputs. Clear CalcMintly local data go also remove these choices.',
    },
    mr: {
      preferenceTitle: 'या डिव्हाइसवरील निवडी',
      preferenceHint:
        'या ब्राउझरमध्ये फक्त निवडलेली एकके लक्षात ठेवा. संख्या आणि इतर इनपुट जतन होत नाहीत. नव्याने स्वतंत्रपणे उघडलेल्या उदाहरणांसाठी या निवडी वापरल्या जातील; सामायिक दुवे आणि कार्यक्षेत्रातील कार्ड त्यांच्या निवडी ठेवतील.',
      preferenceCurrencyHint:
        'या ब्राउझरमध्ये फक्त चलन कोड लक्षात ठेवा. रक्कम जतन किंवा रूपांतरित केली जात नाही. नव्याने स्वतंत्रपणे उघडलेल्या उदाहरणांसाठी ही निवड वापरली जाईल; सामायिक दुवे आणि कार्यक्षेत्रातील कार्ड त्यांच्या निवडी ठेवतील.',
      preferenceRemember: 'निवडी लक्षात ठेवा',
      preferenceForget: 'जतन केलेल्या निवडी हटवा',
      preferenceSaved:
        'निवडी या डिव्हाइसवर जतन झाल्या. पुढील एकक किंवा चलन बदलही लक्षात ठेवले जातील.',
      preferenceForgotten: 'जतन केलेल्या निवडी हटवल्या. सध्याचे इनपुट बदलले नाहीत.',
      preferenceFailure: 'या ब्राउझरला जतन केलेल्या निवडी अद्ययावत करता आल्या नाहीत.',
      preferenceRestored:
        'या नव्या उदाहरणाला जतन केलेल्या निवडी लागू केल्या. संख्या भरण्यापूर्वी एकके तपासा.',
      preferenceSkipped: 'आधीच्या इनपुटला प्राधान्य दिले. जतन केलेल्या निवडी लागू केल्या नाहीत.',
      preferencePrivacy:
        '“निवडी लक्षात ठेवा” निवडल्यानंतरच एकक आणि चलनाच्या निवडी जतन होतात. ही सेटिंग संख्या किंवा गणनेचे इनपुट जतन करत नाही. CalcMintly चा स्थानिक डेटा साफ केल्यास या निवडीही हटतात.',
    },
    vi: {
      preferenceTitle: 'Lựa chọn trên thiết bị này',
      preferenceHint:
        'Chỉ ghi nhớ đơn vị đã chọn trong trình duyệt này. Không lưu số hay dữ liệu nhập khác. Áp dụng cho ví dụ mới mở riêng; liên kết chia sẻ và thẻ trong không gian làm việc giữ lựa chọn của chúng.',
      preferenceCurrencyHint:
        'Chỉ ghi nhớ mã tiền tệ trong trình duyệt này. Không lưu hoặc quy đổi số tiền. Áp dụng cho ví dụ mới mở riêng; liên kết chia sẻ và thẻ trong không gian làm việc giữ lựa chọn của chúng.',
      preferenceRemember: 'Ghi nhớ lựa chọn',
      preferenceForget: 'Xóa lựa chọn đã lưu',
      preferenceSaved:
        'Đã lưu lựa chọn trên thiết bị này. Các lần đổi đơn vị hoặc tiền tệ sau cũng sẽ được ghi nhớ.',
      preferenceForgotten: 'Đã xóa lựa chọn đã lưu. Dữ liệu nhập hiện tại không đổi.',
      preferenceFailure: 'Trình duyệt này không cập nhật được lựa chọn đã lưu.',
      preferenceRestored:
        'Đã áp dụng lựa chọn đã lưu cho ví dụ mới này. Kiểm tra đơn vị trước khi nhập số.',
      preferenceSkipped: 'Ưu tiên dữ liệu nhập hiện có. Không áp dụng lựa chọn đã lưu.',
      preferencePrivacy:
        'Đơn vị và tiền tệ chỉ được lưu sau khi chọn Ghi nhớ lựa chọn. Cài đặt này không lưu số hay dữ liệu tính toán. Xóa dữ liệu cục bộ CalcMintly cũng xóa các lựa chọn này.',
    },
    te: {
      preferenceTitle: 'ఈ పరికరంలోని ఎంపికలు',
      preferenceHint:
        'ఈ బ్రౌజర్‌లో ఎంచుకున్న ప్రమాణాలను మాత్రమే గుర్తుంచుకోండి. సంఖ్యలు లేదా ఇతర ఇన్‌పుట్‌లు సేవ్ కావు. విడిగా కొత్తగా తెరిచే ఉదాహరణలకు ఇవి వర్తిస్తాయి; షేర్ చేసిన లింకులు, వర్క్‌స్పేస్ కార్డులు తమ ఎంపికలనే ఉంచుకుంటాయి.',
      preferenceCurrencyHint:
        'ఈ బ్రౌజర్‌లో కరెన్సీ కోడ్‌ను మాత్రమే గుర్తుంచుకోండి. మొత్తాలు సేవ్ కావు, మార్పిడి జరగదు. విడిగా కొత్తగా తెరిచే ఉదాహరణలకు ఇది వర్తిస్తుంది; షేర్ చేసిన లింకులు, వర్క్‌స్పేస్ కార్డులు తమ ఎంపికలనే ఉంచుకుంటాయి.',
      preferenceRemember: 'ఎంపికలను గుర్తుంచుకోండి',
      preferenceForget: 'సేవ్ చేసిన ఎంపికలను తొలగించండి',
      preferenceSaved:
        'ఈ పరికరంలో ఎంపికలు సేవ్ అయ్యాయి. తర్వాత ప్రమాణం లేదా కరెన్సీ మార్పులను కూడా గుర్తుంచుకుంటుంది.',
      preferenceForgotten: 'సేవ్ చేసిన ఎంపికలు తొలగించబడ్డాయి. ప్రస్తుత ఇన్‌పుట్‌లు మారలేదు.',
      preferenceFailure: 'ఈ బ్రౌజర్ సేవ్ చేసిన ఎంపికలను నవీకరించలేకపోయింది.',
      preferenceRestored:
        'ఈ కొత్త ఉదాహరణకు సేవ్ చేసిన ఎంపికలు వర్తింపజేశాం. సంఖ్యలు నమోదు చేసే ముందు ప్రమాణాలను తనిఖీ చేయండి.',
      preferenceSkipped:
        'ఇప్పటికే ఉన్న ఇన్‌పుట్‌లకు ప్రాధాన్యం ఇచ్చాం. సేవ్ చేసిన ఎంపికలు వర్తింపజేయలేదు.',
      preferencePrivacy:
        '“ఎంపికలను గుర్తుంచుకోండి” ఎంచుకున్న తర్వాత మాత్రమే ప్రమాణం, కరెన్సీ ఎంపికలు సేవ్ అవుతాయి. ఈ సెట్టింగ్ సంఖ్యలు లేదా గణన ఇన్‌పుట్‌లను సేవ్ చేయదు. CalcMintly స్థానిక డేటాను తొలగిస్తే ఈ ఎంపికలు కూడా తొలగిపోతాయి.',
    },
    sw: {
      preferenceTitle: 'Chaguo kwenye kifaa hiki',
      preferenceHint:
        'Kumbuka vipimo vilivyochaguliwa pekee katika kivinjari hiki. Nambari na ingizo lingine halihifadhiwi. Hutumika kwa mifano mipya iliyofunguliwa pekee; viungo vilivyoshirikiwa na kadi za eneo la kazi hubaki na chaguo zao.',
      preferenceCurrencyHint:
        'Kumbuka msimbo wa sarafu pekee katika kivinjari hiki. Kiasi cha fedha hakihifadhiwi wala kubadilishwa. Hutumika kwa mifano mipya iliyofunguliwa pekee; viungo vilivyoshirikiwa na kadi za eneo la kazi hubaki na chaguo zao.',
      preferenceRemember: 'Kumbuka chaguo',
      preferenceForget: 'Futa chaguo zilizohifadhiwa',
      preferenceSaved:
        'Chaguo zimehifadhiwa kwenye kifaa hiki. Mabadiliko yajayo ya kipimo au sarafu pia yatakumbukwa.',
      preferenceForgotten: 'Chaguo zilizohifadhiwa zimefutwa. Ingizo la sasa halijabadilika.',
      preferenceFailure: 'Kivinjari hiki hakikuweza kusasisha chaguo zilizohifadhiwa.',
      preferenceRestored:
        'Chaguo zilizohifadhiwa zimetumika kwa mfano huu mpya. Kagua vipimo kabla ya kuingiza nambari.',
      preferenceSkipped:
        'Ingizo lililopo limepewa kipaumbele. Chaguo zilizohifadhiwa hazikutumika.',
      preferencePrivacy:
        'Chaguo za vipimo na sarafu huhifadhiwa tu baada ya kuchagua Kumbuka chaguo. Mpangilio huu hauhifadhi nambari au ingizo la hesabu. Kufuta data ya ndani ya CalcMintly pia huondoa chaguo hizi.',
    },
    ha: {
      preferenceTitle: 'Zaɓuɓɓuka a wannan na’ura',
      preferenceHint:
        'A tuna raka’o’in da aka zaɓa kawai a wannan burauza. Ba a adana lambobi ko sauran bayanan shigarwa. Ana amfani da su ga sabbin misalan da aka buɗe su kaɗai; hanyoyin rabawa da katunan wurin aiki suna riƙe zaɓin nasu.',
      preferenceCurrencyHint:
        'A tuna lambar kuɗi kawai a wannan burauza. Ba a adana ko canza adadin kuɗi. Ana amfani da ita ga sabbin misalan da aka buɗe su kaɗai; hanyoyin rabawa da katunan wurin aiki suna riƙe zaɓin nasu.',
      preferenceRemember: 'Tuna zaɓuɓɓuka',
      preferenceForget: 'Goge zaɓuɓɓukan da aka adana',
      preferenceSaved:
        'An adana zaɓuɓɓuka a wannan na’ura. Za a tuna sauye-sauyen raka’a ko kuɗi na gaba ma.',
      preferenceForgotten:
        'An goge zaɓuɓɓukan da aka adana. Bayanan shigarwa na yanzu ba su canza ba.',
      preferenceFailure: 'Wannan burauza ba ta iya sabunta zaɓuɓɓukan da aka adana ba.',
      preferenceRestored:
        'An yi amfani da zaɓuɓɓukan da aka adana ga wannan sabon misali. Duba raka’o’i kafin shigar da lambobi.',
      preferenceSkipped:
        'Bayanan da suke nan suna da fifiko. Ba a yi amfani da zaɓuɓɓukan da aka adana ba.',
      preferencePrivacy:
        'Ana adana zaɓin raka’a da kuɗi ne kawai bayan ka zaɓi Tuna zaɓuɓɓuka. Wannan saiti ba ya adana lambobi ko bayanan lissafi. Goge bayanan CalcMintly na cikin na’ura yana cire waɗannan zaɓuɓɓukan ma.',
    },
    tr: {
      preferenceTitle: 'Bu cihazdaki seçimler',
      preferenceHint:
        'Bu tarayıcıda yalnızca seçilen birimler hatırlanır. Sayılar ve diğer girdiler kaydedilmez. Yeni ve ayrı açılan örneklerde kullanılır; paylaşılan bağlantılar ve çalışma alanı kartları kendi seçimlerini korur.',
      preferenceCurrencyHint:
        'Bu tarayıcıda yalnızca para birimi kodu hatırlanır. Tutarlar kaydedilmez veya dönüştürülmez. Yeni ve ayrı açılan örneklerde kullanılır; paylaşılan bağlantılar ve çalışma alanı kartları kendi seçimlerini korur.',
      preferenceRemember: 'Seçimleri hatırla',
      preferenceForget: 'Kayıtlı seçimleri sil',
      preferenceSaved:
        'Seçimler bu cihaza kaydedildi. Sonraki birim veya para birimi değişiklikleri de hatırlanacak.',
      preferenceForgotten: 'Kayıtlı seçimler silindi. Mevcut girdiler değişmedi.',
      preferenceFailure: 'Bu tarayıcı kayıtlı seçimleri güncelleyemedi.',
      preferenceRestored:
        'Kayıtlı seçimler bu yeni örneğe uygulandı. Sayı girmeden önce birimleri kontrol edin.',
      preferenceSkipped: 'Mevcut girdilere öncelik verildi. Kayıtlı seçimler uygulanmadı.',
      preferencePrivacy:
        'Birim ve para birimi seçimleri yalnızca Seçimleri hatırla seçildikten sonra kaydedilir. Bu ayar sayıları veya hesaplama girdilerini kaydetmez. CalcMintly yerel verilerini temizlemek bu seçimleri de kaldırır.',
    },
  };
  for (const [locale, copy] of Object.entries(window.CMPreferenceCopy))
    Object.assign(window.CMUiCopy[locale], copy);
})();
