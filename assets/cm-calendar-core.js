/* Gregorian date-only arithmetic. UTC storage avoids DST and skipped local dates. */
var CMCalendar = (() => {
  'use strict';
  const leap = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0),
    daysInMonth = (year, month) =>
      [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  function make(year, month, day) {
    const date = new Date(0);
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCFullYear(year, month, day);
    return date;
  }
  function parse(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    if (
      year < 1 ||
      year > 9999 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > daysInMonth(year, month - 1)
    )
      return null;
    return make(year, month - 1, day);
  }
  const ordinal = (date) => Math.floor(date.getTime() / 86400000),
    dayDiff = (a, b) => ordinal(b) - ordinal(a);
  const iso = (date) =>
    String(date.getUTCFullYear()).padStart(4, '0') +
    '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getUTCDate()).padStart(2, '0');
  function today() {
    const now = new Date();
    return make(now.getFullYear(), now.getMonth(), now.getDate());
  }
  function addMonths(date, months) {
    const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months,
      year = Math.floor(total / 12),
      month = ((total % 12) + 12) % 12;
    return make(year, month, Math.min(date.getUTCDate(), daysInMonth(year, month)));
  }
  function breakdown(a, b) {
    if (dayDiff(a, b) < 0)
      throw Error('End date must not precede start date.|结束日期不得早于开始日期。');
    let years = b.getUTCFullYear() - a.getUTCFullYear();
    if (dayDiff(addMonths(a, years * 12), b) < 0) years--;
    const anniversary = addMonths(a, years * 12);
    let months =
      (b.getUTCFullYear() - anniversary.getUTCFullYear()) * 12 +
      b.getUTCMonth() -
      anniversary.getUTCMonth();
    while (months > 0 && dayDiff(addMonths(a, years * 12 + months), b) < 0) months--;
    const anchor = addMonths(a, years * 12 + months);
    return { y: years, m: months, d: dayDiff(anchor, b) };
  }
  function birthday(year, date) {
    return make(
      year,
      date.getUTCMonth(),
      Math.min(date.getUTCDate(), daysInMonth(year, date.getUTCMonth())),
    );
  }
  function age(birth, reference) {
    const result = breakdown(birth, reference);
    let next = birthday(reference.getUTCFullYear(), birth);
    if (dayDiff(reference, next) < 0) next = birthday(reference.getUTCFullYear() + 1, birth);
    return {
      ...result,
      days: dayDiff(birth, reference),
      nextDate: next,
      nextDays: dayDiff(reference, next),
    };
  }
  function workdays(start, end, weekend = [0, 6]) {
    const days = dayDiff(start, end) + 1;
    if (days < 1) throw Error('End date must not precede start date.|结束日期不得早于开始日期。');
    const weekends = new Set(weekend);
    if ([...weekends].some((x) => !Number.isInteger(x) || x < 0 || x > 6))
      throw Error('Choose valid weekend days.|请选择有效休息日。');
    let wd = Math.floor(days / 7) * (7 - weekends.size);
    for (let k = 0; k < days % 7; k++) if (!weekends.has((start.getUTCDay() + k) % 7)) wd++;
    return { wd, we: days - wd, cal: days };
  }
  function format(date, locale = 'en', options = {}) {
    return new Intl.DateTimeFormat(locale === 'pcm' ? 'en-NG' : locale, {
      calendar: 'gregory',
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(date);
  }
  function duration(parts, locale = 'en') {
    locale = locale === 'pcm' ? 'en-NG' : locale;
    const values = [
      ['year', parts.y ?? parts.years],
      ['month', parts.m ?? parts.months],
      ['week', parts.weeks],
      ['day', parts.d ?? parts.days],
    ]
      .filter(([, value]) => value !== undefined)
      .map(([unit, value]) =>
        new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value),
      );
    return new Intl.ListFormat(locale, { style: 'short', type: 'conjunction' }).format(values);
  }
  function relativeDays(value, locale = 'en') {
    return new Intl.RelativeTimeFormat(locale === 'pcm' ? 'en-NG' : locale, {
      numeric: 'auto',
    }).format(value, 'day');
  }
  return {
    leap,
    daysInMonth,
    make,
    parse,
    ordinal,
    dayDiff,
    iso,
    today,
    addMonths,
    breakdown,
    birthday,
    age,
    workdays,
    format,
    duration,
    relativeDays,
  };
})();
