/* Shared numerical contracts for the core decision tools. No DOM, network or price feed. */
var CMCoreFinance = (() => {
  'use strict';
  const check = (ok, message) => {
      if (!ok) throw Error(message);
    },
    R = (label, value, unit = '') => ({ label, value, unit }),
    sum = (a) => a.reduce((s, x) => s + x, 0);
  const numeric = (v, ids) =>
    check(
      ids.every((id) => Number.isFinite(v[id])),
      'Fill every numeric input with a finite number.|请为每个数值输入填写有限数字。',
    );
  const payment = (principal, r, months) =>
    principal / (r === 0 ? months : -Math.expm1(-months * Math.log1p(r)) / r);
  function schedule(principal, annualRate, pay, maxMonths = 1200) {
    const r = annualRate / 1200;
    if (principal === 0)
      return { months: 0, interest: 0, total: 0, finalPayment: 0, paidOff: true };
    if (pay <= principal * r)
      return {
        months: Infinity,
        interest: Infinity,
        total: Infinity,
        paidOff: false,
        reason: 'interest',
      };
    const exact = r === 0 ? principal / pay : -Math.log1p((-principal * r) / pay) / Math.log1p(r);
    if (!Number.isFinite(exact) || exact > maxMonths + 1e-7)
      return { months: Math.ceil(exact), paidOff: false, reason: 'horizon' };
    const months = Math.max(1, Math.ceil(exact - 1e-8));
    let balance = principal,
      interest = 0,
      total = 0,
      finalPayment = 0;
    for (let k = 1; k <= months; k++) {
      const cost = balance * r;
      interest += cost;
      const paid = k === months ? balance + cost : Math.min(pay, balance + cost);
      balance = Math.max(0, balance + cost - paid);
      total += paid;
      finalPayment = paid;
    }
    return { months, interest, total, finalPayment, paidOff: true };
  }
  function mortgage(v) {
    numeric(v, ['price', 'down', 'rate', 'term', 'tax', 'ins', 'pmirate', 'hoa', 'extra']);
    check(
      v.price > 0 &&
        v.down >= 0 &&
        v.down < v.price &&
        v.rate >= 0 &&
        v.rate <= 1000 &&
        v.term >= 1 / 12 &&
        v.term <= 100 &&
        [v.tax, v.ins, v.pmirate, v.hoa, v.extra].every((x) => x >= 0),
      'Use a positive home price, a smaller down payment, a term of 1–1,200 months, and nonnegative costs.|房价须为正，首付低于房价，期限为 1–1,200 个月，费用非负。',
    );
    const loan = v.price - v.down,
      ltv = loan / v.price,
      months = Math.round(v.term * 12),
      pi = payment(loan, v.rate / 1200, months),
      tax = v.tax / 12,
      insurance = v.ins / 12,
      pmi = ltv > 0.8 ? (loan * v.pmirate) / 1200 : 0,
      total = pi + tax + insurance + pmi + v.hoa;
    return {
      loan,
      ltv,
      months,
      pi,
      tax,
      insurance,
      pmi,
      total,
      rows: [
        R('Monthly housing payment|月住房支出', total, 'USD/month'),
        R('Principal and interest|本金与利息月供', pi, 'USD/month'),
        R('Loan principal|贷款本金', loan, 'USD'),
        R('Loan to value|贷款价值比', 100 * ltv, '%'),
      ],
    };
  }
  function loan(v) {
    numeric(v, ['prin', 'rate', 'term', 'extra']);
    check(
      v.prin > 0 &&
        v.rate >= 0 &&
        v.rate <= 1000 &&
        v.term >= 1 / 12 &&
        v.term <= 100 &&
        v.extra >= 0,
      'Use positive principal, a term of 1–1,200 months, and nonnegative rate and extra payment.|本金为正，期限为 1–1,200 个月，利率与额外还款非负。',
    );
    const months = Math.round(v.term * 12),
      pay = payment(v.prin, v.rate / 1200, months),
      base = schedule(v.prin, v.rate, pay),
      extra = schedule(v.prin, v.rate, pay + v.extra);
    return {
      months,
      pay,
      base,
      extra,
      interest: pay * months - v.prin,
      total: pay * months,
      rows: [
        R('Scheduled monthly payment|计划月供', pay, 'USD/month'),
        R('Scheduled total interest|计划总利息', pay * months - v.prin, 'USD'),
        R('Payoff with extra|额外还款后还清月数', extra.months, 'months'),
        R('Interest saving|节省利息', base.interest - extra.interest, 'USD'),
      ],
    };
  }
  function early(v) {
    numeric(v, ['bal', 'rate', 'pay', 'extra']);
    check(
      v.bal > 0 && v.rate >= 0 && v.rate <= 1000 && v.pay > 0 && v.extra >= 0,
      'Use positive balance and payment, with nonnegative rate and extra payment.|余额及月供为正，利率与额外还款非负。',
    );
    const base = schedule(v.bal, v.rate, v.pay),
      extra = schedule(v.bal, v.rate, v.pay + v.extra);
    check(
      base.paidOff,
      base.reason === 'interest'
        ? 'Payment must exceed first-month interest.|月供必须高于首月利息。'
        : 'Payment covers interest but does not clear the debt within 1,200 months. Increase the payment.|月供覆盖利息，但无法在 1,200 个月内还清，请提高月供。',
    );
    return {
      base,
      extra,
      saved: base.interest - extra.interest,
      monthsSaved: base.months - extra.months,
      rows: [
        R('Months saved|提前月数', base.months - extra.months, 'months'),
        R('Interest saved|节省利息', base.interest - extra.interest, 'USD'),
        R('Baseline payoff|原还清月数', base.months, 'months'),
        R('Payoff with extra|额外还款后月数', extra.months, 'months'),
      ],
    };
  }
  function freelance(v) {
    const weeks = v.weeks ?? 48,
      taxbase = v.taxbase ?? 'gross';
    numeric(v, ['income', 'tax', 'exp', 'hours', 'bill']);
    check(
      v.income >= 0 &&
        v.exp >= 0 &&
        v.tax >= 0 &&
        v.tax < 100 &&
        v.hours > 0 &&
        v.hours <= 168 &&
        v.bill > 0 &&
        v.bill <= 100 &&
        weeks > 0 &&
        weeks <= 53 &&
        ['gross', 'profit'].includes(taxbase),
      'Use positive working time and billable share, a tax rate below 100%, and nonnegative income and expenses.|工作时间与可计费比例为正，税率低于 100%，收入与费用非负。',
    );
    const ret = 1 - v.tax / 100,
      billHrs = (v.hours * weeks * v.bill) / 100,
      rev = taxbase === 'gross' ? (v.income + v.exp) / ret : v.income / ret + v.exp,
      rate = rev / billHrs;
    return {
      ret,
      billHrs,
      rev,
      rate,
      weeks,
      taxbase,
      num: taxbase === 'gross' ? v.income + v.exp : v.income,
      rows: [
        R('Required billable hourly rate|所需可计费时薪', rate, 'USD/hour'),
        R('Annual required revenue|所需年收入流水', rev, 'USD/year'),
        R('Annual billable time|每年可计费时间', billHrs, 'hours'),
      ],
    };
  }
  function ai(v) {
    numeric(v, ['itok', 'otok', 'calls2', 'iprice', 'oprice']);
    check(
      [v.itok, v.otok, v.calls2, v.iprice, v.oprice].every((x) => x >= 0) &&
        [v.itok, v.otok, v.calls2].every(Number.isInteger),
      'Token and call counts must be nonnegative whole numbers; prices must be nonnegative.|Token 与调用次数须为非负整数，价格非负。',
    );
    const perCall = (v.itok * v.iprice + v.otok * v.oprice) / 1e6,
      ic = (v.calls2 * v.itok * v.iprice) / 1e6,
      oc = (v.calls2 * v.otok * v.oprice) / 1e6,
      total = ic + oc;
    return {
      ic,
      oc,
      total,
      perCall,
      per1000: 1000 * perCall,
      rows: [
        R('Monthly inference cost|每月推理成本', total, 'USD/month'),
        R('Input token cost|输入 Token 成本', ic, 'USD/month'),
        R('Output token cost|输出 Token 成本', oc, 'USD/month'),
        R('Cost per call|每次调用成本', perCall, 'USD/call'),
      ],
    };
  }
  function rent(v) {
    const q = { loanYears: 30, buyfee: 0, sellfee: 0, ownrate: 0, rentgrowth: 0, invest: 0, ...v };
    numeric(q, [
      'price',
      'downp',
      'mrate',
      'rent',
      'years',
      'appr',
      'loanYears',
      'buyfee',
      'sellfee',
      'ownrate',
      'rentgrowth',
      'invest',
    ]);
    check(
      q.price > 0 &&
        q.rent >= 0 &&
        q.years >= 1 / 12 &&
        q.years <= 100 &&
        q.downp >= 0 &&
        q.downp <= 100 &&
        q.mrate >= 0 &&
        q.mrate <= 1000 &&
        q.loanYears >= 1 / 12 &&
        q.loanYears <= 100 &&
        [q.appr, q.rentgrowth, q.invest].every((x) => x > -100 && x <= 1000) &&
        [q.buyfee, q.sellfee, q.ownrate].every((x) => x >= 0 && x <= 100),
      'Check prices, percentages and terms. Growth rates must exceed −100%; holding and loan terms are 1–1,200 months.|请核对价格、比例与期限；增长率须高于 −100%，持有与贷款期限为 1–1,200 个月。',
    );
    const months = Math.round(q.years * 12),
      loanMonths = Math.round(q.loanYears * 12),
      down = (q.price * q.downp) / 100,
      loan = q.price - down,
      buyFee = (q.price * q.buyfee) / 100,
      pay = loan === 0 ? 0 : payment(loan, q.mrate / 1200, loanMonths),
      houseGrowth = Math.exp(Math.log1p(q.appr / 100) / 12),
      rentGrowth = Math.exp(Math.log1p(q.rentgrowth / 100) / 12),
      investmentGrowth = Math.exp(Math.log1p(q.invest / 100) / 12);
    let balance = loan,
      home = q.price,
      rentAmount = q.rent,
      renterPortfolio = down + buyFee,
      ownerPortfolio = 0,
      totalRent = 0,
      totalMortgage = 0,
      totalOwn = 0;
    const path = [];
    for (let month = 1; month <= months; month++) {
      renterPortfolio *= investmentGrowth;
      ownerPortfolio *= investmentGrowth;
      const ownership = (home * q.ownrate) / 1200,
        interest = (balance * q.mrate) / 1200,
        mortgage =
          month <= loanMonths
            ? month === loanMonths
              ? balance + interest
              : Math.min(pay, balance + interest)
            : 0;
      balance = Math.max(0, balance + interest - mortgage);
      const difference = mortgage + ownership - rentAmount;
      if (difference >= 0) renterPortfolio += difference;
      else ownerPortfolio -= difference;
      totalRent += rentAmount;
      totalMortgage += mortgage;
      totalOwn += ownership;
      home *= houseGrowth;
      rentAmount *= rentGrowth;
      if (month % 12 === 0 || month === months) {
        const equity = home * (1 - q.sellfee / 100) - balance;
        path.push({
          month,
          balance,
          home,
          equity,
          renterWealth: renterPortfolio,
          ownerWealth: equity + ownerPortfolio,
          advantage: equity + ownerPortfolio - renterPortfolio,
        });
      }
    }
    const ending = path.at(-1),
      ownerCash = down + buyFee + totalMortgage + totalOwn,
      netBuy = ownerCash - ending.equity;
    return {
      months,
      loanMonths,
      down,
      loan,
      buyFee,
      pay,
      balance,
      home,
      totalRent,
      totalMortgage,
      totalOwn,
      ownerCash,
      netBuy,
      renterPortfolio,
      ownerPortfolio,
      ending,
      path,
      rows: [
        R('Buying minus renting ending wealth|买房减租房期末净值', ending.advantage, 'USD'),
        R('Owner ending wealth|买房期末净值', ending.ownerWealth, 'USD'),
        R('Renter ending wealth|租房期末净值', ending.renterWealth, 'USD'),
        R('Monthly mortgage payment|房贷月供', pay, 'USD/month'),
        R('Remaining mortgage balance|剩余房贷本金', balance, 'USD'),
      ],
    };
  }
  const functions = {
    'mortgage-calculator': mortgage,
    'loan-calculator': loan,
    'early-loan-payoff-calculator': early,
    'rent-vs-buy-calculator': rent,
    'freelance-real-rate': freelance,
    'ai-inference-cost': ai,
  };
  function evaluate(slug, v) {
    check(functions[slug], 'Unknown finance model.|未知金融模型。');
    const result = functions[slug](v);
    check(
      result.rows.every((row) => Number.isFinite(row.value)),
      'Result is outside the finite numeric range.|结果超出有限数值范围。',
    );
    return result;
  }
  function solve(fn, target, lo, hi) {
    let a = fn(lo) - target,
      b = fn(hi) - target;
    if (!Number.isFinite(a) || !Number.isFinite(b) || a * b > 0) return null;
    for (let k = 0; k < 90; k++) {
      const mid = (lo + hi) / 2,
        value = fn(mid) - target;
      if (Math.abs(value) < 1e-8) return mid;
      if (a * value <= 0) hi = mid;
      else {
        lo = mid;
        a = value;
      }
    }
    return (lo + hi) / 2;
  }
  function goalValue(slug, v, budget) {
    const r = evaluate(slug, v);
    check(
      Number.isFinite(budget) && budget >= 0,
      'Goal must be nonnegative and finite.|目标必须为有限非负数。',
    );
    if (slug === 'mortgage-calculator') {
      const fixed = v.tax / 12 + v.ins / 12 + v.hoa;
      if (budget <= fixed) return null;
      let lo = v.down,
        hi = v.down + budget * r.months + 1;
      for (let k = 0; k < 90; k++) {
        const price = (lo + hi) / 2,
          total = price <= v.down ? fixed : mortgage({ ...v, price }).total;
        if (total <= budget) lo = price;
        else hi = price;
      }
      return lo;
    }
    if (slug === 'loan-calculator') return budget / payment(1, v.rate / 1200, r.months);
    if (slug === 'early-loan-payoff-calculator') {
      check(
        Number.isInteger(budget) && budget >= 1 && budget <= 1200,
        'Target months must be a whole number from 1 to 1,200.|目标月数须为 1 至 1,200 的整数。',
      );
      return Math.max(0, payment(v.bal, v.rate / 1200, budget) - v.pay);
    }
    if (slug === 'freelance-real-rate')
      return budget > 0 ? (100 * r.rev) / (v.hours * r.weeks * budget) : null;
    if (slug === 'ai-inference-cost') {
      const n = r.perCall > 0 ? Math.floor(budget / r.perCall) : null;
      return Number.isSafeInteger(n) ? n : null;
    }
    if (slug === 'rent-vs-buy-calculator') {
      const zero = rent({ ...v, rent: 0 }),
        lr = Math.log1p(v.rentgrowth / 100) / 12,
        li = Math.log1p(v.invest / 100) / 12;
      let coefficient = 0;
      for (let k = 1; k <= r.months; k++)
        coefficient += Math.exp((k - 1) * lr + (r.months - k) * li);
      const root = coefficient > 0 ? -zero.ending.advantage / coefficient : null;
      return root !== null && root >= 0 && Number.isFinite(root) ? root : null;
    }
    return null;
  }
  return {
    payment,
    schedule,
    mortgage,
    loan,
    early,
    freelance,
    ai,
    rent,
    evaluate,
    solve,
    sum,
    goalValue,
  };
})();
