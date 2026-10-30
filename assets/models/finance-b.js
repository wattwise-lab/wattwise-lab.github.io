(() => {
  'use strict';
  const { add, n, p, i, text, row: R, check, nums, sum, annuity, payment } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Educational estimate using your entered assumptions; no live prices, tax rules or guaranteed returns.|按自填假设进行教育性估算，不提供实时价格、税法或保证收益。',
    domain = 'Finance',
  ) => add(s, name, domain, purpose, f, calc, formula, e, note);
  const cash = (id, label, value) => n(id, label, value),
    pct = (id, label, value) => n(id, label, value, 0, 100),
    rate = n('r', 'Nominal annual interest rate (%)|名义年利率（%）', 6, 0, 100),
    months = i('t', 'Term in months|期限（月）', 12, 1, 1200);
  D(
    'maximum-drawdown',
    'Maximum Drawdown|最大回撤',
    'Measure the largest peak-to-trough loss in a value series.|计算价值序列中从峰值到后续谷值的最大跌幅。',
    [
      text(
        'x',
        'Positive portfolio values in time order|按时间顺序的正组合价值',
        '100,120,90,110,80,130',
      ),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x > 0),
        'Portfolio values must be positive.|组合价值必须大于零。',
      );
      let peak = a[0],
        d = 0,
        pi = 0,
        start = 0,
        end = 0;
      for (let k = 0; k < a.length; k++) {
        if (a[k] > peak) {
          peak = a[k];
          pi = k;
        }
        const q = 1 - a[k] / peak;
        if (q > d) {
          d = q;
          start = pi;
          end = k;
        }
      }
      return [
        R('Maximum drawdown|最大回撤', 100 * d, '%'),
        R('Peak observation number|峰值观测序号', start + 1),
        R('Trough observation number|谷值观测序号', end + 1),
      ];
    },
    'MDD=maxₜ(1−Vₜ/maxₛ≤ₜVₛ)',
    [100 / 3, 2, 5],
  );
  D(
    'average-purchase-price',
    'Average Purchase Price|分批买入均价',
    'Combine purchases by cash spent and unit price, with fees.|合并分批买入金额、单价与费用，计算持仓均价。',
    [
      text('a', 'Purchase amounts excluding fees|各笔买入金额（不含费用）', '100,100,100'),
      text('p', 'Price per unit for each purchase|各笔买入单价', '10,20,25'),
      cash('f', 'Total fees|总费用', 8),
    ],
    (v) => {
      const a = nums(v.a),
        p = nums(v.p);
      check(
        a.length === p.length && a.every((x) => x >= 0) && p.every((x) => x > 0),
        'Provide matching nonnegative amounts and positive prices.|金额与单价应等长，金额非负且单价为正。',
      );
      const units = sum(a.map((x, k) => x / p[k]));
      check(units > 0, 'Buy at least one positive amount.|至少一笔买入金额应大于零。');
      return [
        R('Average all-in price|含费均价', (sum(a) + v.f) / units),
        R('Total units|总份额', units),
        R('Total cost|总成本', sum(a) + v.f),
      ];
    },
    'Units=Σ(amount/price); average=(Σamount+fees)/units',
    [308 / 19, 19, 308],
  );
  D(
    'capital-gains-tax-estimate',
    'Capital Gains Tax Estimate|资本利得税自填估算',
    'Apply an entered effective tax rate to a realized gain.|按自填有效税率估算已实现资本利得税。',
    [
      cash('b', 'Purchase cost basis|买入成本基础', 1000),
      cash('s', 'Sale proceeds|卖出收入', 1500),
      cash('f', 'Sale fees|卖出费用', 50),
      pct('r', 'Effective gains tax rate (%)|有效资本利得税率（%）', 20),
    ],
    (v) => {
      const gain = v.s - v.f - v.b,
        tax = (Math.max(0, gain) * v.r) / 100;
      return [
        R('Estimated tax|估算税额', tax),
        R('After-tax gain|税后收益', gain - tax),
        R('Net sale proceeds|税后卖出净收入', v.s - v.f - tax),
      ];
    },
    'Gain=sale−fees−basis; tax=max(gain,0)×entered rate',
    [90, 360, 1360],
    'No country-specific rules, allowances, holding-period rules or loss offsets are applied. Use the rate and basis confirmed for your situation.|不应用任何特定国家规则、免税额、持有期规则或亏损抵扣；请使用经核实适用于你的税率和成本基础。',
  );
  D(
    'real-investment-return',
    'Real Investment Return|实际投资回报率',
    'Remove inflation from a nominal investment return.|从名义投资回报中剔除通胀影响。',
    [
      n('r', 'Nominal return (%)|名义回报（%）', 10, -99.99, 10000),
      n('f', 'Inflation (%)|通胀（%）', 5, -99.99, 10000),
    ],
    (v) => [R('Real return|实际回报率', 100 * ((1 + v.r / 100) / (1 + v.f / 100) - 1), '%')],
    'Real return=(1+nominal)/(1+inflation)−1',
    [100 / 21],
  );
  D(
    'rule-of-72',
    'Rule of 72|72 法则',
    'Compare the quick doubling-time rule with exact compound growth.|比较快速翻倍估算与精确复利翻倍时间。',
    [p('r', 'Annual growth rate (%)|年增长率（%）', 6)],
    (v) => [
      R('Rule-of-72 estimate|72 法则估算', 72 / v.r, 'years'),
      R('Exact annual compounding|精确年度复利', Math.LN2 / Math.log1p(v.r / 100), 'years'),
    ],
    'Approximate years=72/r%; exact years=ln2/ln(1+r)',
    [12, 11.89566104594],
  );
  D(
    'investment-doubling-time',
    'Investment Target Time|投资增长倍数时间',
    'Solve the time to grow by a chosen multiple at a constant rate.|求固定增长率下达到目标倍数的时间。',
    [
      p('m', 'Target growth multiple|目标增长倍数', 3),
      p('r', 'Annual effective growth (%)|有效年增长率（%）', 10),
    ],
    (v) => {
      check(v.m >= 1, 'Target multiple must be at least one.|目标倍数不得小于 1。');
      return [R('Time to target|达到目标所需时间', Math.log(v.m) / Math.log1p(v.r / 100), 'years')];
    },
    't=ln(target multiple)/ln(1+r)',
    [11.5267046072476],
  );
  D(
    'savings-withdrawal',
    'Savings Withdrawal Duration|储蓄定额提取期限',
    'Estimate how long a balance lasts with fixed monthly withdrawals.|估算储蓄按固定金额逐月提取可维持多久。',
    [
      cash('b', 'Starting balance|初始余额', 12000),
      p('w', 'Monthly withdrawal|每月提取', 1000),
      n('r', 'Nominal annual return (%)|名义年回报（%）', 0, 0, 100),
    ],
    (v) => {
      const r = v.r / 1200;
      if (v.b === 0) return [R('Withdrawal duration|提取期限', 0, 'months')];
      if (r > 0 && v.w <= v.b * r)
        return [
          R(
            'Withdrawal duration|提取期限',
            'Not depleted under fixed assumptions|固定假设下不会耗尽',
            'months',
          ),
        ];
      return [
        R(
          'Withdrawal duration|提取期限',
          r === 0 ? v.b / v.w : -Math.log1p((-v.b * r) / v.w) / Math.log1p(r),
          'months',
        ),
      ];
    },
    'n=−ln(1−Br/W)/ln(1+r); n=B/W at r=0',
    [12],
    'Withdrawals occur at month end. Rates are constant; taxes, fees and market sequence risk are omitted. Fractional months interpolate the model.|按月末提取、利率固定；不含税费与市场收益顺序风险，小数月份为模型插值。',
  );
  D(
    'lease-payment',
    'Lease Payment Estimate|租赁月供估算',
    'Separate depreciation and financing portions of a vehicle lease.|分开估算车辆租赁的折旧和融资月供。',
    [
      cash('c', 'Adjusted capitalized cost|调整后资本化成本', 30000),
      cash('s', 'Residual value|残值', 18000),
      months,
      n('f', 'Money factor|租赁货币因子', 0.002, 0, 0.1),
      pct('tax', 'Payment tax rate (%)|月供税率（%）', 0),
    ],
    (v) => {
      check(
        v.s <= v.c,
        'Residual cannot exceed capitalized cost in this model.|本模型残值不得超过资本化成本。',
      );
      const dep = (v.c - v.s) / v.t,
        fin = (v.c + v.s) * v.f;
      return [
        R('Estimated monthly payment|估算月供', (dep + fin) * (1 + v.tax / 100)),
        R('Monthly depreciation|月折旧', dep),
        R('Monthly financing charge|月融资费用', fin),
      ];
    },
    'Payment=[(cap−residual)/months+(cap+residual)×money factor]×(1+tax)',
    [1096, 1000, 96],
    'Common money-factor lease estimate. Contracts may apply taxes and fees differently; mileage and end-of-lease charges are excluded.|常见货币因子租赁估算；合同税费方式可能不同，不含里程与期末费用。',
  );
  D(
    'balloon-loan',
    'Balloon Loan Payment|尾款贷款月供',
    'Calculate equal payments leaving a chosen final balance.|计算保留指定期末尾款的等额月供。',
    [
      p('a', 'Principal|本金', 12000),
      cash('b', 'Final balloon balance|期末尾款', 6000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
    ],
    (v) => {
      check(v.b <= v.a, 'Balloon cannot exceed principal in this model.|本模型尾款不得超过本金。');
      const r = v.r / 1200,
        a = (v.a - v.b / (1 + r) ** v.t) / annuity(r, v.t);
      return [
        R('Monthly payment|每月还款', a),
        R('Total interest|总利息', a * v.t + v.b - v.a),
        R('Final balloon|期末尾款', v.b),
      ];
    },
    'A=[P−B/(1+r)ⁿ]/annuityFactor(r,n)',
    [500, 0, 6000],
  );
  D(
    'interest-only-loan',
    'Interest Only Loan|先息后本贷款',
    'Calculate interest-only payments and the final principal obligation.|计算仅付息期间月供及到期应归还本金。',
    [p('a', 'Principal|本金', 100000), rate, months],
    (v) => [
      R('Monthly interest-only payment|每月付息', (v.a * v.r) / 1200),
      R('Interest over entered term|所填期限利息', ((v.a * v.r) / 1200) * v.t),
      R('Principal still due|仍应归还本金', v.a),
    ],
    'Monthly interest=P×annual nominal rate/12',
    [500, 6000, 100000],
  );
  D(
    'remaining-loan-balance',
    'Remaining Loan Balance|贷款剩余本金',
    'Find the balance after a chosen number of equal payments.|计算等额还款若干期后的剩余本金。',
    [
      p('a', 'Original principal|原始本金', 12000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
      i('k', 'Payments already made|已还期数', 5, 0, 1200),
    ],
    (v) => {
      check(v.k <= v.t, 'Payments made cannot exceed the term.|已还期数不得超过总期限。');
      const r = v.r / 1200,
        a = payment(v.a, r, v.t),
        b =
          r === 0
            ? v.a - a * v.k
            : v.a * (1 + r) ** v.k - (a * Math.expm1(v.k * Math.log1p(r))) / r;
      return [
        R('Remaining principal|剩余本金', Math.max(0, b)),
        R('Scheduled monthly payment|计划月供', a),
      ];
    },
    'Bₖ=P(1+r)ᵏ−A[(1+r)ᵏ−1]/r',
    [7000, 1000],
  );
  D(
    'affordable-loan-amount',
    'Loan Amount from Payment|月供反推可借本金',
    'Reverse a payment budget into a principal amount.|由月供预算反推等额还款本金。',
    [
      cash('a', 'Monthly payment budget|月供预算', 1000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
      months,
    ],
    (v) => [
      R('Principal supported by payment|该月供对应本金', v.a * annuity(v.r / 1200, v.t)),
      R('Total scheduled payments|计划总还款', v.a * v.t),
    ],
    'P=A×annuityFactor(r,n)',
    [12000, 12000],
    'This is payment arithmetic, not a lending approval or affordability assessment. Other costs and obligations are excluded.|仅为还款数学，不代表贷款审批或负担能力评估；不含其他成本与义务。',
  );
  D(
    'loan-term',
    'Loan Term from Payment|月供反推还清期限',
    'Solve repayment duration from balance, rate and payment.|由本金、利率与月供反推还清期限。',
    [
      cash('b', 'Loan balance|贷款余额', 12000),
      p('a', 'Monthly payment|每月还款', 1000),
      n('r', 'Nominal annual rate (%)|名义年利率（%）', 0, 0, 100),
    ],
    (v) => {
      const r = v.r / 1200;
      check(
        v.b === 0 || v.a > v.b * r,
        'Payment must exceed monthly interest.|月供必须超过当月利息。',
      );
      const t = r === 0 ? v.b / v.a : -Math.log1p((-v.b * r) / v.a) / Math.log1p(r);
      return [
        R('Modeled repayment time|模型还清期限', t, 'months'),
        R(
          'Number of payments, final payment may be smaller|还款次数（末期可能较少）',
          Math.ceil(t),
          'payments',
        ),
      ];
    },
    'n=−ln(1−Pr/A)/ln(1+r)',
    [12, 12],
  );
  D(
    'flat-versus-reducing-loan',
    'Flat vs Reducing Interest|平息与递减余额利息',
    'Compare flat interest with amortization at the same stated rate.|比较同一名义利率下的平息与余额递减等额还款。',
    [p('a', 'Principal|本金', 12000), rate, months],
    (v) => {
      const flat = (((v.a * v.r) / 100) * v.t) / 12,
        am = payment(v.a, v.r / 1200, v.t);
      return [
        R('Flat-interest monthly payment|平息月供', (v.a + flat) / v.t),
        R('Reducing-balance monthly payment|递减余额月供', am),
        R('Flat total interest|平息总利息', flat),
        R('Reducing total interest|递减余额总利息', am * v.t - v.a),
      ];
    },
    'Flat interest=P×annual rate×years; reducing payment=P/annuityFactor(r,n)',
    [1060, 1032.797156485, 720, 393.56587782],
    'Same quoted rates do not mean equal borrowing costs. Fees and lender rounding are omitted.|相同报价利率不等于相同借款成本；不含费用与放款机构舍入规则。',
  );
  D(
    'debt-snowball-avalanche',
    'Debt Snowball vs Avalanche|雪球与雪崩还债比较',
    'Compare smallest-balance-first and highest-rate-first repayment.|比较优先还小额债务与优先还高息债务。',
    [
      text('b', 'Debt balances in matching order|各笔债务余额（顺序对应）', '1000,2000'),
      text('r', 'Nominal annual rates (%)|各笔名义年利率（%）', '0,0'),
      text('m', 'Minimum monthly payments|各笔最低月供', '50,50'),
      p('budget', 'Total monthly budget|每月总还款预算', 500),
    ],
    (v) => {
      const b = nums(v.b),
        r = nums(v.r),
        m = nums(v.m);
      check(
        b.length === r.length &&
          b.length === m.length &&
          b.length <= 30 &&
          b.every((x) => x >= 0) &&
          r.every((x) => x >= 0 && x <= 100) &&
          m.every((x) => x >= 0) &&
          v.budget >= sum(m),
        'Use up to 30 matching debts; budget must cover all entered minimums.|最多 30 笔对应债务，预算应覆盖所填最低月供。',
      );
      const run = (mode) => {
        const balances = [...b];
        let interest = 0,
          k = 0;
        while (sum(balances) > 0.0000001 && k < 1200) {
          k++;
          for (let j = 0; j < b.length; j++) {
            const q = (balances[j] * r[j]) / 1200;
            balances[j] += q;
            interest += q;
          }
          let left = v.budget;
          for (let j = 0; j < b.length; j++) {
            const pay = Math.min(balances[j], m[j], left);
            balances[j] -= pay;
            left -= pay;
          }
          const order = balances
            .map((_, j) => j)
            .filter((j) => balances[j] > 1e-8)
            .sort((a, c) =>
              mode === 'snow' ? balances[a] - balances[c] || a - c : r[c] - r[a] || a - c,
            );
          for (const j of order) {
            const pay = Math.min(left, balances[j]);
            balances[j] -= pay;
            left -= pay;
          }
        }
        check(
          sum(balances) <= 1e-7,
          'At least one strategy does not repay within 1,200 months; increase the budget.|至少一种方案无法在 1,200 个月内还清，请提高预算。',
        );
        return [k, interest];
      };
      const a = run('snow'),
        b2 = run('avalanche');
      return [
        R('Snowball repayment months|雪球法还清月数', a[0], 'months'),
        R('Avalanche repayment months|雪崩法还清月数', b2[0], 'months'),
        R('Snowball interest|雪球法利息', a[1]),
        R('Avalanche interest|雪崩法利息', b2[1]),
        R('Interest saved by avalanche|雪崩法节省利息', a[1] - b2[1]),
      ];
    },
    'Accrue monthly interest → pay minimums → allocate remaining budget by selected order',
    [6, 6, 0, 0, 0],
    'Fixed rates, fixed entered minimums and no new borrowing. Payments occur after monthly interest. Actual statement rules can differ.|利率及自填最低月供固定，无新增借款；先计月息再还款，实际账单规则可能不同。',
  );
  const B = (s, name, purpose, f, calc, formula, e, note) =>
    D(
      s,
      name,
      purpose,
      f,
      calc,
      formula,
      e,
      note ||
        'Business ratio based on your consistent-period inputs. Accounting definitions and industry comparisons may differ.|根据同一期间输入计算商业比率，会计口径与行业比较可能不同。',
      'Business',
    );
  B(
    'cash-conversion-cycle',
    'Cash Conversion Cycle|现金周转周期',
    'Combine inventory, collection and supplier-payment days.|合并存货、收款与付款天数。',
    [
      n('i', 'Inventory days|存货周转天数', 45),
      n('r', 'Receivable days|应收账款天数', 30),
      n('p', 'Payable days|应付账款天数', 20),
    ],
    (v) => [R('Cash conversion cycle|现金周转周期', v.i + v.r - v.p, 'days')],
    'CCC=DIO+DSO−DPO',
    [55],
  );
  B(
    'current-ratio',
    'Current Ratio|流动比率',
    'Compare current assets with current liabilities.|比较流动资产与流动负债。',
    [cash('a', 'Current assets|流动资产', 200000), p('l', 'Current liabilities|流动负债', 100000)],
    (v) => [R('Current ratio|流动比率', v.a / v.l)],
    'Current ratio=current assets/current liabilities',
    [2],
  );
  B(
    'quick-ratio',
    'Quick Ratio|速动比率',
    'Exclude inventory and prepayments from short-term coverage.|从短期偿债资产中扣除存货及预付项。',
    [
      cash('a', 'Current assets|流动资产', 200000),
      cash('i', 'Inventory|存货', 50000),
      cash('p', 'Prepayments|预付款', 10000),
      p('l', 'Current liabilities|流动负债', 100000),
    ],
    (v) => {
      check(
        v.i + v.p <= v.a,
        'Inventory plus prepayments cannot exceed current assets.|存货与预付款合计不能超过流动资产。',
      );
      return [R('Quick ratio|速动比率', (v.a - v.i - v.p) / v.l)];
    },
    'Quick ratio=(current assets−inventory−prepayments)/current liabilities',
    [1.4],
  );
  B(
    'inventory-turnover',
    'Inventory Turnover|存货周转率',
    'Compare cost of goods sold with average inventory.|比较销售成本与平均存货。',
    [
      cash('c', 'Cost of goods sold in period|期间销售成本', 600000),
      p('i', 'Average inventory|平均存货', 100000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Inventory turnover|存货周转率', v.c / v.i, 'times'),
      R(
        'Inventory days|存货天数',
        v.c > 0 ? (v.d * v.i) / v.c : 'Undefined with zero sales cost|销售成本为零时无定义',
        'days',
      ),
    ],
    'Turnover=COGS/average inventory; DIO=days/turnover',
    [6, 365 / 6],
  );
  B(
    'receivables-turnover',
    'Receivables Turnover|应收账款周转率',
    'Compare credit sales with average receivables.|比较赊销额与平均应收账款。',
    [
      cash('s', 'Net credit sales|赊销净额', 600000),
      p('a', 'Average receivables|平均应收账款', 50000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Receivables turnover|应收账款周转率', v.s / v.a, 'times'),
      R(
        'Collection days|收款天数',
        v.s > 0 ? (v.d * v.a) / v.s : 'Undefined with zero credit sales|赊销为零时无定义',
        'days',
      ),
    ],
    'Turnover=net credit sales/average receivables',
    [12, 365 / 12],
  );
  B(
    'payables-turnover',
    'Payables Turnover|应付账款周转率',
    'Compare credit purchases with average trade payables.|比较赊购额与平均贸易应付账款。',
    [
      cash('s', 'Net credit purchases|赊购净额', 360000),
      p('a', 'Average trade payables|平均贸易应付账款', 30000),
      p('d', 'Days in period|期间天数', 365),
    ],
    (v) => [
      R('Payables turnover|应付账款周转率', v.s / v.a, 'times'),
      R(
        'Payment days|付款天数',
        v.s > 0 ? (v.d * v.a) / v.s : 'Undefined with zero purchases|购入为零时无定义',
        'days',
      ),
    ],
    'Turnover=net credit purchases/average payables',
    [12, 365 / 12],
  );
  B(
    'working-capital',
    'Working Capital|营运资本',
    'Calculate net short-term operating funding.|计算净短期资金与营运资本占收入比例。',
    [
      cash('a', 'Current assets|流动资产', 200000),
      cash('l', 'Current liabilities|流动负债', 120000),
      p('s', 'Annual revenue|年收入', 1000000),
    ],
    (v) => [
      R('Net working capital|净营运资本', v.a - v.l),
      R('Working capital / revenue|营运资本占收入', (100 * (v.a - v.l)) / v.s, '%'),
    ],
    'NWC=current assets−current liabilities',
    [80000, 8],
  );
  B(
    'operating-leverage',
    'Degree of Operating Leverage|经营杠杆系数',
    'Estimate local operating-profit sensitivity to sales volume.|估计经营利润对销量的局部敏感度。',
    [
      p('q', 'Units sold|销售数量', 1000),
      p('p', 'Selling price per unit|单位售价', 20),
      cash('c', 'Variable cost per unit|单位变动成本', 10),
      cash('f', 'Fixed operating costs|固定经营成本', 5000),
    ],
    (v) => {
      const contribution = v.q * (v.p - v.c),
        profit = contribution - v.f;
      check(
        profit !== 0,
        'Operating leverage is undefined at zero operating profit.|经营利润为零时，经营杠杆无定义。',
      );
      return [
        R('Operating leverage|经营杠杆系数', contribution / profit),
        R('Operating profit|经营利润', profit),
      ];
    },
    'DOL=Q(P−V)/[Q(P−V)−F]',
    [2, 5000],
  );
  B(
    'economic-order-quantity',
    'Economic Order Quantity|经济订货批量 EOQ',
    'Balance ordering and inventory holding costs.|权衡订货与存货持有成本。',
    [
      p('d', 'Annual demand units|年需求数量', 10000),
      p('s', 'Cost per order|每次订货成本', 50),
      p('h', 'Annual holding cost per unit|每单位年持有成本', 2),
    ],
    (v) => {
      const q = Math.sqrt((2 * v.d * v.s) / v.h);
      return [
        R('Economic order quantity|经济订货批量', q, 'units'),
        R('Orders per year|每年订货次数', v.d / q),
        R('Annual ordering plus holding cost|年订货与持有成本', (v.d / q) * v.s + (q / 2) * v.h),
      ];
    },
    'EOQ=√(2DS/H)',
    [Math.sqrt(500000), Math.sqrt(200), Math.sqrt(2000000)],
    'Assumes constant demand, instant replenishment, no shortages, no bulk discounts and an unlimited shelf life.|假设需求稳定、即时补货、无缺货、无批量折扣且保质期不受限。',
  );
  B(
    'reorder-point',
    'Inventory Reorder Point|库存再订货点',
    'Combine lead-time demand with a safety buffer.|合并交货期需求与安全库存。',
    [
      n('d', 'Average daily demand|平均每日需求', 50),
      n('l', 'Lead time in days|交货期天数', 7),
      n('s', 'Safety stock units|安全库存数量', 100),
    ],
    (v) => [R('Reorder point|再订货点', v.d * v.l + v.s, 'units')],
    'ROP=daily demand×lead time+safety stock',
    [450],
  );
  B(
    'inventory-safety-stock',
    'Inventory Safety Stock|库存安全量',
    'Estimate a demand-variation buffer for fixed lead time.|在交货期固定时估计需求波动缓冲。',
    [
      n('z', 'Service-factor z|服务水平系数 z', 1.65, 0, 6),
      n('s', 'Daily demand standard deviation|日需求标准差', 10),
      n('l', 'Fixed lead time in days|固定交货期天数', 9),
    ],
    (v) => [R('Safety stock|安全库存', v.z * v.s * Math.sqrt(v.l), 'units')],
    'SS=zσdaily√leadTime',
    [49.5],
    'Independent daily demand with stable variance and fixed lead time. Choose the service factor separately; this is not a guaranteed fill rate.|假设每日需求独立、方差稳定且交货期固定；服务系数需另行确定，不代表保证满足率。',
  );
  B(
    'customer-lifetime-value',
    'Customer Lifetime Value|客户生命周期价值',
    'Estimate contribution from a stable recurring customer relationship.|估算稳定周期客户关系的贡献价值。',
    [
      cash('a', 'Monthly revenue per customer|每客户月收入', 50),
      pct('m', 'Contribution margin (%)|贡献利润率（%）', 60),
      n('c', 'Monthly customer churn (%)|月客户流失率（%）', 5, 0.000001, 100),
      cash('s', 'One-time servicing cost|一次性服务成本', 0),
    ],
    (v) => [
      R('Undiscounted contribution lifetime value|未折现贡献生命周期价值', (v.a * v.m) / v.c - v.s),
      R('Expected customer lifetime|预期客户存续期', 100 / v.c, 'months'),
    ],
    'LTV=monthly revenue×margin/monthly churn−one-time cost',
    [600, 20],
    'Assumes constant churn and margin, no expansion and no discounting. Small churn changes can produce large value changes.|假设流失率与利润率固定，无增购且不折现；小幅流失变化可能显著改变价值。',
  );
  B(
    'customer-acquisition-cost',
    'Customer Acquisition Cost|客户获取成本 CAC',
    'Divide attributable acquisition spending by new customers.|将可归属获客支出分摊至新增客户。',
    [
      cash('a', 'Acquisition spending|获客支出', 10000),
      i('n', 'New paying customers|新增付费客户', 100, 1, 100000000),
    ],
    (v) => [R('Cost per acquired customer|每新增客户成本', v.a / v.n)],
    'CAC=attributable acquisition spending/new paying customers',
    [100],
  );
  B(
    'customer-churn-rate',
    'Customer Churn Rate|客户流失率',
    'Measure customers lost from the starting customer cohort.|衡量期初客户群在本期的流失比例。',
    [
      i('a', 'Starting customers|期初客户数', 1000, 1, 100000000),
      i('l', 'Starting-cohort customers lost|期初群体流失人数', 50, 0, 100000000),
    ],
    (v) => {
      check(
        v.l <= v.a,
        'Lost customers cannot exceed the starting cohort.|流失人数不得超过期初群体。',
      );
      return [
        R('Customer churn|客户流失率', (100 * v.l) / v.a, '%'),
        R('Cohort retention|群体留存率', 100 * (1 - v.l / v.a), '%'),
      ];
    },
    'Churn=lost starting-cohort customers/starting customers',
    [5, 95],
  );
  B(
    'net-revenue-retention',
    'Net Revenue Retention|净收入留存率 NRR',
    'Track existing-customer recurring revenue after expansion and losses.|追踪原有客户收入经增购、降购及流失后的留存。',
    [
      p('s', 'Starting recurring revenue|期初经常性收入', 10000),
      cash('e', 'Expansion revenue|增购收入', 2000),
      cash('d', 'Contraction revenue|降购减少收入', 500),
      cash('c', 'Churned revenue|流失收入', 500),
    ],
    (v) => {
      check(
        v.d + v.c <= v.s,
        'Contraction plus churn cannot exceed starting revenue.|降购与流失减少额合计不能超过期初收入。',
      );
      return [
        R('Net revenue retention|净收入留存率', (100 * (v.s + v.e - v.d - v.c)) / v.s, '%'),
        R('Gross revenue retention|毛收入留存率', (100 * (v.s - v.d - v.c)) / v.s, '%'),
      ];
    },
    'NRR=(start+expansion−contraction−churn)/start',
    [110, 90],
    'Exclude all new-customer revenue; use the same starting cohort and recurring-revenue period.|排除所有新客户收入，使用同一期初群体与经常性收入期间。',
  );
  B(
    'return-on-ad-spend',
    'Return on Ad Spend|广告支出回报 ROAS',
    'Compare attributed revenue with advertising spend and margin.|比较归因收入与广告投入，并计入贡献利润率。',
    [
      cash('r', 'Attributed revenue|归因收入', 10000),
      p('s', 'Ad spend|广告支出', 2000),
      pct('m', 'Pre-ad contribution margin (%)|广告前贡献利润率（%）', 40),
    ],
    (v) => [
      R('ROAS|广告支出回报', v.r / v.s, '×'),
      R('Contribution after advertising|扣广告后贡献', (v.r * v.m) / 100 - v.s),
      R(
        'Break-even ROAS|保本 ROAS',
        v.m > 0 ? 100 / v.m : 'No finite break-even at zero margin|零利润率时不存在有限保本值',
        '×',
      ),
    ],
    'ROAS=revenue/ad spend; break-even ROAS=1/margin',
    [5, 2000, 2.5],
    'Attribution is your assumption and does not establish incremental sales. Excludes costs outside entered margin.|归因为自填假设，不能证明增量销量；不含所填利润率之外的成本。',
  );
  B(
    'contribution-margin',
    'Contribution Margin|贡献毛益',
    'Measure revenue remaining after variable costs.|计算收入扣除变动成本后可覆盖固定成本的金额。',
    [
      p('p', 'Price per unit|单位售价', 20),
      cash('v', 'Variable cost per unit|单位变动成本', 12),
      n('q', 'Units|数量', 1000),
    ],
    (v) => [
      R('Contribution per unit|单位贡献毛益', v.p - v.v),
      R('Contribution ratio|贡献毛益率', (100 * (v.p - v.v)) / v.p, '%'),
      R('Total contribution|总贡献毛益', (v.p - v.v) * v.q),
    ],
    'Contribution=P−V; contribution ratio=(P−V)/P',
    [8, 40, 8000],
  );
  B(
    'target-margin-price',
    'Target Margin Selling Price|目标利润率反推售价',
    'Reverse a target margin and percentage fees into a selling price.|由目标利润率及按收入计费比例反推售价。',
    [
      cash('c', 'Unit cost including fixed per-sale fees|单位成本（含每单固定费用）', 60),
      n('m', 'Target profit margin (%)|目标利润率（%）', 25, 0, 99.999),
      n('f', 'Revenue-based fee rate (%)|按收入计费比例（%）', 5, 0, 99.999),
    ],
    (v) => {
      check(
        v.m + v.f < 100,
        'Margin plus percentage fees must be below 100%.|利润率与比例费用合计必须低于 100%。',
      );
      const p = v.c / (1 - (v.m + v.f) / 100);
      return [
        R('Required selling price|所需售价', p),
        R('Profit per unit|单位利润', (p * v.m) / 100),
        R('Percentage fees per unit|单位比例费用', (p * v.f) / 100),
      ];
    },
    'Price=cost/(1−target margin−fee rate)',
    [600 / 7, 150 / 7, 30 / 7],
  );
})();
