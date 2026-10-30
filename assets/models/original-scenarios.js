(() => {
  'use strict';
  const { add, n, i, text, row: R, check, sum } = CMModels;
  const weekDate = (anchor, week) => {
    check(
      /^\d{4}-\d{2}-\d{2}$/.test(anchor),
      'Use a valid first-week date in YYYY-MM-DD format.|首周日期须为有效 YYYY-MM-DD 格式。',
    );
    const d = new Date(anchor + 'T00:00:00Z');
    check(
      Number.isFinite(d.getTime()) &&
        d.toISOString().slice(0, 10) === anchor &&
        Number(anchor.slice(0, 4)) >= 1900 &&
        Number(anchor.slice(0, 4)) <= 9900,
      'Use a real calendar date between years 1900 and 9900.|请输入 1900 至 9900 年内的真实日历日期。',
    );
    d.setUTCDate(d.getUTCDate() + 7 * (week - 1));
    return d.toISOString().slice(0, 10);
  };
  const monthDate = (anchor, index) => {
    check(
      /^\d{4}-(0[1-9]|1[0-2])$/.test(anchor) &&
        Number(anchor.slice(0, 4)) >= 1900 &&
        Number(anchor.slice(0, 4)) <= 9900,
      'Use a planning month in YYYY-MM format, between years 1900 and 9900.|规划首月须为 1900 至 9900 年内的 YYYY-MM 格式。',
    );
    const d = new Date(anchor + '-01T00:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + index - 1);
    return d.toISOString().slice(0, 7);
  };
  const error =
    'Check the item table: names must be unique, all numbers valid, and dates within the displayed range.|请检查项目表：名称须唯一，数值须有效，日期须处于所示范围。';
  function records(value, count) {
    const lines = String(value)
      .trim()
      .split(/\n/)
      .filter((x) => x.trim());
    check(lines.length > 0 && lines.length <= 20, 'Use 1–20 items.|请填写 1–20 个项目。');
    const rows = lines.map((line) => line.split(';').map((x) => x.trim()));
    check(
      rows.every((r) => r.length === count && r[0] && r[0].length <= 60) &&
        new Set(rows.map((r) => r[0])).size === rows.length,
      error,
    );
    return rows;
  }
  const number = (s, min = 0, max = 1e9, integer = false) => {
    const x = Number(s);
    check(
      String(s).trim() !== '' &&
        Number.isFinite(x) &&
        x >= min &&
        x <= max &&
        (!integer || Number.isInteger(x)),
      error,
    );
    return x;
  };
  const col = (key, label, type = 'number', min = 0, max = 1e9) => ({ key, label, type, min, max });
  function collision(v, drop = -1, shiftIndex = -1, shift = 0) {
    weekDate(v.anchor, 1);
    const items = records(v.plans, 6).map((r, k) => ({
      name: r[0],
      hours: number(r[1], 0, 168),
      cost: number(r[2]),
      upfront: number(r[3]),
      start: number(r[4], 1, 104, true) + (k === shiftIndex ? shift : 0),
      end: number(r[5], 1, 104, true) + (k === shiftIndex ? shift : 0),
    }));
    check(
      items.every((x) => x.end >= x.start),
      error,
    );
    let balance = v.cash;
    const timeline = [];
    for (let week = 1; week <= v.horizon; week++) {
      const active = items.filter((x, k) => k !== drop && week >= x.start && week <= x.end),
        hours = v.fixed + sum(active.map((x) => x.hours)),
        cost = v.living + sum(active.map((x) => x.cost + (week === x.start ? x.upfront : 0)));
      balance += v.income - cost;
      timeline.push({
        period: week,
        hours,
        freeHours: v.hours - hours,
        spending: cost,
        balance,
        conflict: hours > v.hours + 1e-9 || balance < -0.0000001,
      });
    }
    return {
      items,
      timeline,
      conflicts: timeline.filter((x) => x.conflict).length,
      first: timeline.find((x) => x.conflict)?.period || 0,
      maxHours: Math.max(0, ...timeline.map((x) => -x.freeHours)),
      funding: Math.max(0, ...timeline.map((x) => -x.balance)),
      end: balance,
    };
  }
  add(
    'plan-collision',
    'Plan Collision|计划撞车',
    'AI and Work-life',
    'Find the first week your plans exceed shared time or cash, then compare delays and removals.|找出多个计划首次超出共同时间或资金的周，并比较延期与移除。',
    [
      {
        ...text(
          'anchor',
          'First planning week starts (YYYY-MM-DD)|首周起始日期（YYYY-MM-DD）',
          '2026-11-02',
        ),
        type: 'date',
        min: '1900-01-01',
        max: '9900-12-31',
      },
      i('horizon', 'Planning horizon (weeks)|规划期限（周）', 8, 1, 104),
      n('hours', 'Total available hours each week|每周可用总小时', 40, 0, 168),
      n('fixed', 'Existing fixed hours each week|每周原有固定小时', 30, 0, 168),
      n('cash', 'Starting available cash|初始可用现金', 1000),
      n('income', 'Cash income each week|每周现金收入', 600),
      n('living', 'Essential cash spending each week|每周必要现金支出', 500),
      text(
        'plans',
        'Plans: name; hours/week; cost/week; upfront cost; start week; end week|计划：名称；每周小时；每周费用；初始费用；起始周；结束周',
        'Course;8;60;200;1;4\nSide project;6;30;100;3;6',
      ),
      i('shift', 'Delay each plan for comparison (weeks)|逐项比较延期周数', 2, 1, 52),
    ],
    (v) => {
      const a = collision(v);
      return [
        R('First collision week|首次撞车周', a.first || 'No collision in horizon|期限内无撞车'),
        R('Weeks with a time or cash shortfall|时间或资金不足周数', a.conflicts, 'weeks'),
        R('Largest weekly time shortfall|最大每周时间缺口', a.maxHours, 'hours'),
        R('Largest cumulative cash shortfall|最大累计现金缺口', a.funding),
        R('Cash at horizon end|期末现金', a.end),
      ];
    },
    'Each week: cash += income−essential−active costs−new upfront costs; free hours=capacity−fixed−active hours',
    [3, 2, 4, 0, 1140],
    'A planning simulation, not a prediction. Weekly income and capacity are constant; upfront costs occur at each plan’s start. Plans outside the horizon are excluded. Time cannot be borrowed from another week; cash carries forward.|这是规划模拟，不是预测；每周收入与容量固定，初始费用在计划起始周发生，期限外项目不计；时间不跨周借用，现金余额结转。',
  );
  let model = CMModels.models.at(-1);
  model.editor = {
    field: 'plans',
    title: 'Plans to fit together|一起安排的计划',
    columns: [
      col('name', 'Plan name|计划名称', 'text'),
      col('hours', 'Hours/week|小时/周', 'number', 0, 168),
      col('cost', 'Cost/week|费用/周'),
      col('upfront', 'Upfront cost|初始费用'),
      col('start', 'Start week|起始周', 'number', 1, 104),
      col('end', 'End week|结束周', 'number', 1, 104),
    ],
    sample: ['New plan', 2, 20, 0, 1, 4],
  };
  model.detail = (v) => {
    const a = collision(v);
    return [
      {
        title: 'Weekly capacity and cash|每周容量与现金',
        headers: [
          'Week|周',
          'Week starts|本周起始',
          'Committed hours|已安排小时',
          'Free hours|空余小时',
          'Cash spending|现金支出',
          'Ending cash|期末现金',
          'State|状态',
        ],
        rows: a.timeline.map((x) => [
          x.period,
          weekDate(v.anchor, x.period),
          x.hours,
          x.freeHours,
          x.spending,
          x.balance,
          x.conflict ? 'Shortfall|有缺口' : 'Fits|可容纳',
        ]),
      },
      {
        title: 'Change one plan at a time|每次只调整一个计划',
        headers: [
          'Plan|计划',
          'Change|调整',
          'First collision week (0 = none)|首次撞车周（0 为无）',
          'Shortfall weeks|不足周数',
          'Ending cash|期末现金',
        ],
        rows: a.items.flatMap((x, k) => {
          const remove = collision(v, k),
            delay = collision(v, -1, k, v.shift);
          return [
            [x.name, 'Remove|移除', remove.first, remove.conflicts, remove.end],
            [x.name, 'Delay|延期', delay.first, delay.conflicts, delay.end],
          ];
        }),
      },
    ];
  };
  function dependencies(v, backup = -1) {
    const rows = records(v.resources, 7),
      items = rows.map((r) => ({
        name: r[0],
        restore: number(r[1], 0, 8760),
        restart: number(r[2], 0, 8760),
        loss: number(r[3]),
        backup: number(r[4], -1, 8760),
        cost: number(r[5]),
        needs: r[6]
          ? r[6]
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      }));
    check(
      items.every((x) => !x.name.includes(',')),
      'Resource names cannot contain commas, which separate dependencies.|资源名称不能含逗号，逗号用于分隔依赖。',
    );
    const names = items.map((x) => x.name),
      root = names.indexOf(String(v.failed).trim());
    check(
      root >= 0,
      'The failed resource must match an item name.|故障资源必须与某一项目名称相同。',
    );
    check(
      items.every(
        (x) =>
          new Set(x.needs).size === x.needs.length && x.needs.every((name) => names.includes(name)),
      ),
      'Dependencies must name existing resources without duplicates.|依赖须填写现有资源名称，且不能重复。',
    );
    const visiting = new Set(),
      done = new Set(),
      durations = items.map(() => 0);
    let activated = false;
    function visit(k) {
      if (done.has(k)) return durations[k];
      check(
        !visiting.has(k),
        'A dependency cycle exists. Remove the circular dependency before calculating.|依赖存在环路，请先移除循环依赖。',
      );
      visiting.add(k);
      const item = items[k],
        upstream = Math.max(0, ...item.needs.map((name) => visit(names.indexOf(name))));
      let t =
        k === root
          ? Math.max(item.restore, upstream > 0 ? upstream + item.restart : 0)
          : upstream > 0
            ? upstream + item.restart
            : 0;
      if (k === backup && t > 0 && item.backup >= 0 && item.backup < t) {
        t = item.backup;
        activated = true;
      }
      durations[k] = t;
      visiting.delete(k);
      done.add(k);
      return t;
    }
    for (let k = 0; k < items.length; k++) visit(k);
    const direct = durations.map((h, k) => h * items[k].loss),
      backupCost = activated ? items[backup].cost : 0;
    return {
      items,
      root,
      durations,
      direct,
      total: sum(direct) + backupCost,
      backupCost,
      affected: durations.filter((x) => x > 0).length,
      max: Math.max(...durations),
    };
  }
  add(
    'life-single-point-failure',
    'Life Single Point of Failure|生活单点故障',
    'AI and Work-life',
    'Trace how a failed resource interrupts dependent activities and compare one backup at a time.|追踪故障资源如何中断依赖活动，并逐项比较备用方案。',
    [
      text('failed', 'Initially failed resource name|初始故障资源名称', 'Internet'),
      text(
        'resources',
        'Resources: name; direct restore hours; restart delay; loss/hour; backup restore hours (-1 = none); backup cost; dependencies separated by commas|资源：名称；直接修复小时；重启延迟；每小时损失；备用恢复小时（-1 为无）；备用成本；依赖名（逗号分隔）',
        'Internet;8;0;20;1;30;\nPayments;4;1;50;2;20;Internet\nShipping;6;2;30;3;40;Payments',
      ),
    ],
    (v) => {
      const a = dependencies(v),
        b = dependencies(v, a.root);
      return [
        R('Affected resources|受影响资源数', a.affected),
        R('Longest interruption|最长中断', a.max, 'hours'),
        R('Loss without backup|无备用总损失', a.total),
        R('Loss plus cost with failed-resource backup|故障资源备用的损失加成本', b.total),
        R('Net benefit of failed-resource backup|故障资源备用净收益', a.total - b.total),
      ];
    },
    'Downstream interruption=max(dependency interruptions)+restart delay; backup may shorten one resource; total=Σ(independent hourly loss×downtime)+backup cost',
    [3, 11, 940, 270, 670],
    'Deterministic what-if graph, not a failure probability estimate. Every named dependency is required. Loss rates must represent separate losses to avoid counting the same revenue twice. Backups bypass that resource’s dependencies at the entered recovery time; each comparison activates one backup only.|确定性情景依赖图，不估算故障概率；所有列出的依赖均为必要条件。各项损失率须独立，避免重复计算同一收入；备用按所填恢复时间绕过该资源依赖，每次比较只启用一个备用。',
  );
  model = CMModels.models.at(-1);
  model.graph = (v) => {
    const a = dependencies(v);
    return a.items.map((x, k) => ({
      name: x.name,
      needs: x.needs,
      hours: a.durations[k],
      failed: k === a.root,
    }));
  };
  model.editor = {
    field: 'resources',
    title: 'Resources and dependencies|资源与依赖',
    columns: [
      col('name', 'Resource name|资源名称', 'text'),
      col('restore', 'Direct repair (h)|直接修复（小时）', 'number', 0, 8760),
      col('restart', 'Restart delay (h)|重启延迟（小时）', 'number', 0, 8760),
      col('loss', 'Loss/hour|损失/小时'),
      col('backup', 'Backup time (h), -1 none|备用小时，-1 无', 'number', -1, 8760),
      col('cost', 'Backup cost|备用成本'),
      col('needs', 'Required resources, comma-separated|必要资源（逗号分隔）', 'text'),
    ],
    sample: ['New resource', 4, 1, 10, -1, 0, 'Internet'],
  };
  model.detail = (v) => {
    const a = dependencies(v);
    return [
      {
        title: 'Interruption path|中断路径',
        rawColumns: [0, 1],
        headers: [
          'Resource|资源',
          'Requires|依赖',
          'Interruption hours|中断小时',
          'Independent loss|独立损失',
        ],
        rows: a.items.map((x, k) => [
          x.name,
          x.needs.join(', ') || '—',
          a.durations[k],
          a.direct[k],
        ]),
      },
      {
        title: 'Activate one backup at a time|每次启用一个备用',
        headers: [
          'Backup for|备用资源',
          'Total loss and cost|总损失与成本',
          'Net benefit|净收益',
          'Longest interruption (h)|最长中断（小时）',
        ],
        rows: a.items.flatMap((x, k) =>
          x.backup >= 0
            ? [
                [
                  x.name,
                  dependencies(v, k).total,
                  a.total - dependencies(v, k).total,
                  dependencies(v, k).max,
                ],
              ]
            : [],
        ),
      },
    ];
  };
  function commitments(v, cancel = -1) {
    monthDate(v.anchor, 1);
    const rows = records(v.commitments, 8),
      items = rows.map((r) => ({
        name: r[0],
        cost: number(r[1]),
        hours: number(r[2], 0, 744),
        start: number(r[3], 1, 120, true),
        end: number(r[4], 1, 120, true),
        earliest: number(r[5], 1, 120, true),
        notice: number(r[6], 0, 120, true),
        fee: number(r[7]),
      }));
    check(
      items.every((x) => x.end >= x.start),
      error,
    );
    const timeline = [];
    for (let month = 1; month <= v.horizon; month++) {
      let money = 0,
        hours = 0,
        fees = 0;
      for (let k = 0; k < items.length; k++) {
        const x = items[k],
          effective = Math.max(x.start, x.earliest, v.cancel + x.notice),
          stopped = k === cancel && effective <= x.end;
        const active = month >= x.start && month <= x.end && (!stopped || month < effective);
        if (active) {
          money += x.cost;
          hours += x.hours;
        }
        if (stopped && month === effective) fees += x.fee;
      }
      timeline.push({
        month,
        money: money + fees,
        hours,
        freeMoney: v.income - v.essential - money - fees,
        freeHours: v.hours - v.fixed - hours,
        fees,
      });
    }
    return {
      items,
      timeline,
      total: sum(timeline.map((x) => x.money)),
      hours: sum(timeline.map((x) => x.hours)),
      minMoney: Math.min(...timeline.map((x) => x.freeMoney)),
      minHours: Math.min(...timeline.map((x) => x.freeHours)),
    };
  }
  add(
    'future-commitment-lock',
    'Future Commitment Lock|承诺锁定',
    'AI and Work-life',
    'See future money and time already promised, including notice periods, lock dates and exit fees.|查看未来已承诺的金钱与时间，并计入通知期、锁定日期和退出费用。',
    [
      {
        ...text('anchor', 'First planning month (YYYY-MM)|规划首月（YYYY-MM）', '2026-11'),
        type: 'month',
        min: '1900-01',
        max: '9900-12',
      },
      i('horizon', 'Planning horizon (months)|规划期限（月）', 12, 1, 120),
      n('income', 'Monthly available income|每月可用收入', 5000),
      n('essential', 'Monthly essential spending|每月必要支出', 3000),
      n('hours', 'Monthly available hours|每月可用小时', 80, 0, 744),
      n('fixed', 'Other fixed monthly hours|其他固定月小时', 20, 0, 744),
      i(
        'cancel',
        'Request cancellation at start of month number|在第几个月月初申请取消',
        3,
        1,
        120,
      ),
      text(
        'commitments',
        'Items: name; monthly cost; monthly hours; start month; end month; earliest stop month; notice months; exit fee|项目：名称；月费用；月小时；起始月；结束月；最早停止月；通知月数；退出费',
        'Gym;100;12;1;12;4;1;30\nCourse;200;16;2;8;5;1;50\nMachine;150;0;1;12;12;2;200',
      ),
    ],
    (v) => {
      const a = commitments(v),
        savings = a.items.map((x, k) => a.total - commitments(v, k).total);
      return [
        R('Committed cost within horizon|期限内承诺费用', a.total),
        R('Committed time within horizon|期限内承诺时间', a.hours, 'hours'),
        R('Lowest monthly free money|最低单月自由金额', a.minMoney),
        R('Lowest monthly free time|最低单月自由时间', a.minHours, 'hours'),
        R('Largest net saving from one cancellation|单项取消最大净节省', Math.max(0, ...savings)),
      ];
    },
    'Effective stop=max(start,earliestStop,requestMonth+notice); charge active months before stop plus exit fee in stop month',
    [4400, 256, 1550, 32, 870],
    'Month 1 is your first planning month. Costs and time are uniform within each active month; cancellation takes effect at the start of the stop month. Comparisons include only the horizon, and each cancels one item. Contract terms must be checked separately.|第 1 月为你的首个规划月；有效月份内费用与时间固定，取消在停止月月初生效；仅比较期限内结果，每次取消一项，合同条款须另行核实。',
  );
  model = CMModels.models.at(-1);
  model.editor = {
    field: 'commitments',
    title: 'Money and time commitments|金钱与时间承诺',
    columns: [
      col('name', 'Commitment name|承诺名称', 'text'),
      col('cost', 'Cost/month|费用/月'),
      col('hours', 'Hours/month|小时/月', 'number', 0, 744),
      col('start', 'Start month|起始月', 'number', 1, 120),
      col('end', 'End month|结束月', 'number', 1, 120),
      col('earliest', 'Earliest stop month|最早停止月', 'number', 1, 120),
      col('notice', 'Notice months|通知月数', 'number', 0, 120),
      col('fee', 'Exit fee|退出费'),
    ],
    sample: ['New commitment', 50, 4, 1, 12, 1, 1, 0],
  };
  model.detail = (v) => {
    const a = commitments(v);
    return [
      {
        title: 'Monthly free capacity|每月自由容量',
        headers: [
          'Month|月',
          'Calendar month|日历月份',
          'Committed spending|承诺支出',
          'Exit fees|退出费',
          'Committed hours|承诺小时',
          'Free money|自由金额',
          'Free hours|自由小时',
        ],
        rows: a.timeline.map((x) => [
          x.month,
          monthDate(v.anchor, x.month),
          x.money,
          x.fees,
          x.hours,
          x.freeMoney,
          x.freeHours,
        ]),
      },
      {
        title: 'Cancel one commitment at a time|每次取消一项承诺',
        headers: [
          'Commitment|承诺',
          'Stop month start|停止月月初',
          'Net saving in horizon|期限内净节省',
          'Hours released|释放小时',
          'Total cost after cancellation|取消后总费用',
        ],
        rows: a.items.map((x, k) => {
          const b = commitments(v, k);
          return [
            x.name,
            monthDate(v.anchor, Math.max(x.start, x.earliest, v.cancel + x.notice)),
            a.total - b.total,
            a.hours - b.hours,
            b.total,
          ];
        }),
      },
    ];
  };
})();
