(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    I = window.CMI18n,
    say = (pair, values = []) =>
      I?.message
        ? I.message(pair, values)
        : pair.split('|')[0].replace(/\{(\d+)\}/g, (_, k) => values[k]),
    label = (pair) => say(pair),
    num = (n) => n.toLocaleString(I?.formatLocale || 'en-US', { maximumFractionDigits: 2 }),
    money = (n) =>
      I?.currency
        ? I.currency(n, 'USD', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
        : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
    inputs = [$('fee'), $('uses'), $('alt'), $('idle')];
  function render() {
    const values = inputs.map((input) => (input.value.trim() === '' ? NaN : Number(input.value))),
      [fee, uses, alt, idle] = values;
    let annual, active, val, total, idleFee;
    const valid =
      values.every(Number.isFinite) &&
      values.every((v) => v >= 0) &&
      idle <= 12 &&
      [
        (annual = fee * 12),
        (active = 12 - idle),
        (val = uses * active * alt),
        (total = Math.max(annual - val, 0)),
        (idleFee = idle * fee),
      ].every(Number.isFinite);
    if (!valid) {
      $('result').textContent = '—';
      ['chips', 'compRows', 'bars', 'cumRows'].forEach((id) => {
        $(id).innerHTML = '';
      });
      $('verdict').className = 'verdict warn';
      $('verdictText').textContent = say(
        'Enter finite, non-negative fees, uses and alternative price, with idle months from 0 to 12.|请输入有限且非负的费用、次数与单次替代价格，闲置月数须在 0 到 12 之间。',
      );
      window.__summary = '';
      return;
    }
    const compared = label('Pay-per-use comparison|按次付费对比'),
      idleLabel = label('Idle-month fees (included)|闲置月费用（已包含）'),
      unused = label('Fee above alternative cost|超出替代成本的费用'),
      covered = label('Fee covered by use value|使用价值覆盖的费用'),
      annualLabel = label('Annual fee|年费'),
      rows = [
        [annualLabel, money(annual)],
        [label('Active months|使用月数'), num(active)],
        [label('Annual uses|全年使用次数'), num(uses * active)],
        [compared, money(val)],
        [idleLabel, money(idleFee)],
        [unused, money(total)],
      ];
    $('result').textContent = money(total);
    $('chips').innerHTML = [
      [annualLabel, money(annual)],
      [compared, money(val)],
      [idleLabel, money(idleFee)],
    ]
      .map(([a, b]) => '<span class="chip">' + a + ': <strong>' + b + '</strong></span>')
      .join('');
    $('compRows').innerHTML = rows
      .map(([a, b]) => '<tr><td>' + a + '</td><td class="num">' + b + '</td></tr>')
      .join('');
    $('bars').innerHTML = [
      [covered, Math.min(val, annual)],
      [unused, total],
    ]
      .map(
        ([a, b]) =>
          '<div class="bar-row"><label><span>' +
          a +
          '</span><span>' +
          money(b) +
          '</span></label><div class="bar"><i style="width:' +
          (annual > 0 ? (b / annual) * 100 : 0) +
          '%"></i></div></div>',
      )
      .join('');
    $('cumRows').innerHTML = [0, 1, 2, 4, 8]
      .map(
        (u) =>
          '<tr><td>' +
          num(u) +
          '</td><td class="num">' +
          money(Math.max(annual - u * active * alt, 0)) +
          '</td></tr>',
      )
      .join('');
    $('verdict').className = 'verdict' + (total > annual / 2 ? ' warn' : '');
    $('verdictText').textContent = say(
      'Annual fee {0} versus {1} for the entered usage at the alternative price: the non-negative difference is {2}. Idle-month fees of {3} are already included in the annual fee.|年费 {0}，按输入的使用量与替代单价计算的成本为 {1}，非负差额为 {2}。闲置月费用 {3} 已包含在年费内。',
      [money(annual), money(val), money(total), money(idleFee)],
    );
    window.__summary = say(
      'Subscription comparison: annual fee {0}, alternative usage cost {1}, difference {2}; idle-month fees {3} are included.|订阅对比：年费 {0}，替代使用成本 {1}，差额 {2}；闲置月费用 {3} 已包含。',
      [money(annual), money(val), money(total), money(idleFee)],
    );
  }
  inputs.forEach((input) => input.addEventListener('input', render));
  render();
})();
