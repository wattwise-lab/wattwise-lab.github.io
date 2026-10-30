(() => {
  'use strict';

  function parseDate(s) {
    return CMCalendar.parse(s);
  }
  function utcDay(d) {
    return CMCalendar.ordinal(d) * 86400000;
  }
  function dayDiff(a, b) {
    return CMCalendar.dayDiff(a, b);
  }
  function todayLocal() {
    return CMCalendar.today();
  }
  function iso(d) {
    return CMCalendar.iso(d);
  }
  function fillToday(id) {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = iso(todayLocal());
  }
  function fmtDate(d) {
    return CMCalendar.format(d, window.CMI18n?.language || 'en');
  }
  function weekday(d) {
    return new Intl.DateTimeFormat(
      window.CMI18n?.language === 'pcm' ? 'en-NG' : window.CMI18n?.language || 'en',
      { calendar: 'gregory', timeZone: 'UTC', weekday: 'long' },
    ).format(d);
  }

  const $ = (id) => document.getElementById(id);
  const fmt = (n) =>
    window.CMI18n
      ? window.CMI18n.number(Number(n))
      : Number(n).toLocaleString(
          typeof window !== 'undefined' && window.CMI18n ? window.CMI18n.formatLocale : 'en-US',
        );
  function birthdayIn(year, dob) {
    return CMCalendar.birthday(year, dob);
  }
  function ageCalc(dob, ref) {
    return CMCalendar.age(dob, ref);
  }
  function render() {
    const dob = parseDate($('dob').value),
      ref = $('ref').value ? parseDate($('ref').value) : todayLocal();
    if (!dob || !ref) {
      [
        'result',
        'chipDays',
        'chipNext',
        'tAge',
        'tDays',
        'tWeeks',
        'tNextDate',
        'tNextDays',
      ].forEach((id) => {
        $(id).textContent = '—';
      });
      $('note').textContent = 'Enter a date of birth.';
      window.__summary = '';
      return;
    }
    if (dayDiff(dob, ref) < 0) {
      [
        'result',
        'chipDays',
        'chipNext',
        'tAge',
        'tDays',
        'tWeeks',
        'tNextDate',
        'tNextDays',
      ].forEach((id) => {
        $(id).textContent = '—';
      });
      $('note').textContent = 'Date of birth is after the reference date.';
      window.__summary = '';
      return;
    }
    const r = ageCalc(dob, ref);
    const ageStr = CMCalendar.duration(r, window.CMI18n.language);
    $('result').textContent = CMCalendar.duration({ years: r.y }, window.CMI18n.language);
    $('chipDays').textContent = CMCalendar.duration({ days: r.days }, window.CMI18n.language);
    $('chipNext').textContent =
      r.nextDays === 0
        ? window.CMI18n.pick('Today|今天')
        : CMCalendar.duration({ days: r.nextDays }, window.CMI18n.language);
    $('tAge').textContent = ageStr;
    $('tDays').textContent = fmt(r.days);
    $('tWeeks').textContent = CMCalendar.duration(
      { weeks: Math.floor(r.days / 7), days: r.days % 7 },
      window.CMI18n.language,
    );
    $('tNextDate').textContent = fmtDate(r.nextDate) + ' (' + weekday(r.nextDate) + ')';
    $('tNextDays').textContent =
      r.nextDays === 0
        ? window.CMI18n.pick('Today|今天')
        : CMCalendar.duration({ days: r.nextDays }, window.CMI18n.language);
    $('note').textContent = window.CMI18n.message('Age at {0}: {1}.|截至 {0}，年龄为 {1}。', [
      fmtDate(ref),
      ageStr,
    ]);
    window.__summary =
      'Age: ' +
      ageStr +
      '; ' +
      fmt(r.days) +
      ' days lived; next birthday ' +
      fmtDate(r.nextDate) +
      ' (' +
      (r.nextDays === 0 ? 'today' : fmt(r.nextDays) + ' days away') +
      ').';
  }

  /* Live day defaults */
  $('ref').value = CMCalendar.iso(CMCalendar.today());
  document.querySelectorAll('input,select').forEach((e) => e.addEventListener('input', render));
  document.querySelectorAll('input,select').forEach((e) => e.addEventListener('change', render));
  document.addEventListener('cm:language', render);
  document.addEventListener('cm:translations', render);
  render();
})();
