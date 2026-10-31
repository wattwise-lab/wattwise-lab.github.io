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
  function render() {
    const t = parseDate($('target').value),
      f = $('from').value ? parseDate($('from').value) : todayLocal();
    if (!t || !f) {
      ['result', 'chipWeeks', 'chipWd', 'tDays', 'tWeeks', 'tTarget', 'tFrom'].forEach((id) => {
        $(id).textContent = '—';
      });
      $('note').textContent = 'Enter a target date.';
      window.__summary = '';
      return;
    }
    const d = dayDiff(f, t),
      ad = Math.abs(d);
    const wStr = CMCalendar.duration(
      { weeks: Math.floor(ad / 7), days: ad % 7 },
      window.CMI18n.language,
    );
    if (d > 0) {
      $('result').textContent = CMCalendar.duration({ days: d }, window.CMI18n.language);
      $('note').textContent =
        fmtDate(t) + ' · ' + CMCalendar.relativeDays(d, window.CMI18n.language);
    } else if (d < 0) {
      $('result').textContent = CMCalendar.relativeDays(-ad, window.CMI18n.language);
      $('note').textContent =
        fmtDate(t) + ' · ' + CMCalendar.relativeDays(d, window.CMI18n.language);
    } else {
      $('result').textContent = window.CMI18n.pick('Today|今天');
      $('note').textContent = 'The target date is today.';
    }
    $('chipWeeks').textContent = wStr;
    $('chipWd').textContent = weekday(t);
    $('tDays').textContent =
      d > 0
        ? CMCalendar.duration({ days: d }, window.CMI18n.language)
        : d < 0
          ? CMCalendar.relativeDays(-ad, window.CMI18n.language)
          : CMCalendar.duration({ days: 0 }, window.CMI18n.language) +
            ' (' +
            window.CMI18n.pick('Today|今天') +
            ')';
    $('tWeeks').textContent = wStr;
    $('tTarget').textContent = fmtDate(t) + ' (' + weekday(t) + ')';
    $('tFrom').textContent = fmtDate(f);
    window.__summary =
      'Countdown: ' +
      (d > 0 ? fmt(d) + ' days until ' : d < 0 ? fmt(ad) + ' days since ' : 'target is today ') +
      fmtDate(t) +
      '.';
  }

  /* Live day defaults */
  $('from').value = CMCalendar.iso(CMCalendar.today());
  document.querySelectorAll('input,select').forEach((e) => e.addEventListener('input', render));
  document.querySelectorAll('input,select').forEach((e) => e.addEventListener('change', render));
  document.addEventListener('cm:language', render);
  document.addEventListener('cm:translations', render);
  render();
})();
