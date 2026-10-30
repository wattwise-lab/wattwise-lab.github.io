(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, annuity, bisect } = CMModels;
  const note =
    'Educational estimate using your assumptions; no live rates, tax rules or investment recommendations. Returns can be negative and are not guaranteed.|按自填假设进行教育性估算，不提供实时利率、税法或投资建议；收益可能为负，且不保证。';
  const D = (s, name, purpose, f, calc, formula, e, extra = '') =>
    add(
      s,
      name,
      'Finance',
      purpose,
      f,
      calc,
      formula,
      e,
      note
        .split('|')
        .map((part, k) => part + (extra ? ' ' + (extra.split('|')[k] || extra.split('|')[0]) : ''))
        .join('|'),
    );
  const cash = (id, label, value) => n(id, label, value),
    rate = (id, label, value) => n(id, label, value, -99, 1000),
    years = i('t', 'Years|年数', 5, 1, 1000),
    periods = i('m', 'Compounding periods per year|每年复利次数', 12, 1, 366);
  const stream = text(
    'c',
    'Cash flows at equally spaced period ends, starting at time 0|等间隔现金流（从时点 0 开始）',
    '-1000,400,400,400',
  );
  const npv = (a, r) => sum(a.map((c, k) => c / (1 + r) ** k));
  D(
    'effective-annual-rate',
    'Effective Annual Rate|有效年利率',
    'Convert a nominal annual rate and compounding frequency into an effective rate.|将名义年利率和复利频率换算为有效年利率。',
    [rate('r', 'Nominal annual rate (%)|名义年利率（%）', 12), periods],
    (v) => [
      R(
        'Effective annual rate|有效年利率',
        100 * Math.expm1(v.m * Math.log1p(v.r / 100 / v.m)),
        '%',
      ),
    ],
    'EAR=(1+j/m)ᵐ−1',
    [12.68250301319698],
  );
  D(
    'nominal-interest-rate',
    'Nominal Interest Rate|名义年利率换算',
    'Recover a nominal rate from an effective annual rate.|由有效年利率反推名义年利率。',
    [rate('r', 'Effective annual rate (%)|有效年利率（%）', 12.68250301319698), periods],
    (v) => [
      R('Nominal annual rate|名义年利率', 100 * v.m * Math.expm1(Math.log1p(v.r / 100) / v.m), '%'),
    ],
    'j=m[(1+EAR)¹ᐟᵐ−1]',
    [12],
  );
  D(
    'continuous-compounding',
    'Continuous Compounding|连续复利',
    'Project a lump sum with continuous compounding.|用连续复利计算一笔本金的终值。',
    [
      cash('a', 'Principal|本金', 1000),
      rate('r', 'Continuous annual rate (%)|连续年利率（%）', 5),
      years,
    ],
    (v) => {
      const f = v.a * Math.exp((v.r / 100) * v.t);
      return [R('Future balance|未来余额', f), R('Growth|增长额', f - v.a)];
    },
    'FV=Peʳᵗ',
    [1284.0254166877414, 284.0254166877414],
  );
  D(
    'annuity-present-value',
    'Annuity Present Value|年金现值',
    'Discount equal end-of-period payments to today.|将等额期末付款折现至现在。',
    [
      cash('a', 'Payment each period|每期金额', 100),
      rate('r', 'Rate per period (%)|每期利率（%）', 5),
      i('t', 'Number of payments|付款期数', 10, 1, 10000),
    ],
    (v) => [
      R('Present value|现值', v.a * annuity(v.r / 100, v.t)),
      R('Undiscounted payments|未折现总额', v.a * v.t),
    ],
    'PV=A[1−(1+r)⁻ⁿ]/r; PV=An at r=0',
    [772.1734929184817, 1000],
  );
  D(
    'annuity-future-value',
    'Annuity Future Value|年金终值',
    'Accumulate equal end-of-period deposits.|计算等额期末存入款项的终值。',
    [
      cash('a', 'Deposit each period|每期存入', 100),
      rate('r', 'Rate per period (%)|每期利率（%）', 5),
      i('t', 'Number of deposits|存入期数', 10, 1, 10000),
    ],
    (v) => {
      const r = v.r / 100,
        q = r === 0 ? v.t : Math.expm1(v.t * Math.log1p(r)) / r;
      return [R('Future value|终值', v.a * q), R('Total deposited|累计存入', v.a * v.t)];
    },
    'FV=A[(1+r)ⁿ−1]/r; FV=An at r=0',
    [1257.789253554884, 1000],
  );
  D(
    'growing-annuity',
    'Growing Annuity Present Value|增长年金现值',
    'Value a finite sequence of growing end-of-period payments.|计算有限期、逐期增长付款的现值。',
    [
      cash('a', 'First payment|首期付款', 100),
      rate('r', 'Discount rate per period (%)|每期折现率（%）', 5),
      rate('g', 'Payment growth per period (%)|每期付款增长率（%）', 2),
      i('t', 'Payments|付款期数', 10, 1, 10000),
    ],
    (v) => {
      const r = v.r / 100,
        g = v.g / 100,
        q = (1 + g) / (1 + r);
      return [
        R(
          'Present value|现值',
          (v.a / (1 + r)) *
            (Math.abs(q - 1) < 1e-12 ? v.t : -Math.expm1(v.t * Math.log(q)) / (1 - q)),
        ),
      ];
    },
    'PV=A₁[1−((1+g)/(1+r))ⁿ]/(r−g)',
    [838.810565252133],
  );
  D(
    'perpetuity',
    'Perpetuity Present Value|永续年金现值',
    'Value a level payment continuing indefinitely.|计算无限期等额付款的理论现值。',
    [
      cash('a', 'Payment per period|每期付款', 100),
      p('r', 'Discount rate per period (%)|每期折现率（%）', 5),
    ],
    (v) => [R('Present value|现值', v.a / (v.r / 100))],
    'PV=A/r',
    [2000],
  );
  D(
    'growing-perpetuity',
    'Growing Perpetuity|增长永续年金',
    'Value perpetual payments growing below the discount rate.|计算增长率低于折现率的永续付款现值。',
    [
      cash('a', 'Next payment|下一期付款', 100),
      p('r', 'Discount rate (%)|折现率（%）', 8),
      rate('g', 'Payment growth (%)|付款增长率（%）', 3),
    ],
    (v) => {
      check(v.r > v.g, 'Discount rate must exceed growth rate.|折现率必须大于增长率。');
      return [R('Present value|现值', v.a / ((v.r - v.g) / 100))];
    },
    'PV=A₁/(r−g)',
    [2000],
  );
  D(
    'net-present-value',
    'Net Present Value|净现值 NPV',
    'Discount a complete dated-by-period cash-flow series.|折现包含初始投入的等间隔现金流。',
    [stream, rate('r', 'Discount rate per period (%)|每期折现率（%）', 10)],
    (v) => [R('Net present value|净现值', npv(nums(v.c), v.r / 100))],
    'NPV=ΣCₜ/(1+r)ᵗ',
    [-5.25920360631115],
  );
  D(
    'internal-rate-of-return',
    'Internal Rate of Return|内部收益率 IRR',
    'Solve the return of a conventional investment cash-flow sequence.|求常规投资现金流的内部收益率。',
    [stream],
    (v) => {
      const a = nums(v.c);
      check(
        a.length >= 2 &&
          a[0] < 0 &&
          a.slice(1).every((x) => x >= 0) &&
          a.slice(1).some((x) => x > 0),
        'Use an initial outflow followed only by nonnegative inflows; this avoids multiple-IRR ambiguity.|使用初始支出及后续非负收入，以避免多解 IRR 歧义。',
      );
      return [R('IRR per period|每期 IRR', 100 * bisect((r) => npv(a, r), -0.9999, 1000), '%')];
    },
    'Solve ΣCₜ/(1+IRR)ᵗ=0',
    [9.7010257403],
  );
  D(
    'modified-internal-rate',
    'Modified Internal Rate of Return|修正内部收益率 MIRR',
    'Separate financing and reinvestment assumptions for cash flows.|分别设置融资率与再投资率计算现金流收益。',
    [
      stream,
      rate('f', 'Financing rate per period (%)|每期融资率（%）', 5),
      rate('r', 'Reinvestment rate per period (%)|每期再投资率（%）', 8),
    ],
    (v) => {
      const a = nums(v.c),
        t = a.length - 1;
      check(
        t > 0 && a.some((x) => x < 0) && a.some((x) => x > 0),
        'Need at least two periods including inflows and outflows.|至少两个时点，且同时包含收入和支出。',
      );
      const pv = -sum(a.map((x, k) => Math.min(x, 0) / (1 + v.f / 100) ** k)),
        fv = sum(a.map((x, k) => Math.max(x, 0) * (1 + v.r / 100) ** (t - k)));
      return [R('MIRR per period|每期 MIRR', 100 * ((fv / pv) ** (1 / t) - 1), '%')];
    },
    'MIRR=(FVpositive/|PVnegative|)¹ᐟⁿ−1',
    [9.098975834465172],
  );
  D(
    'discounted-payback',
    'Discounted Payback Period|折现回收期',
    'Find when discounted inflows recover an initial investment.|计算折现后收入何时收回初始投入。',
    [stream, rate('r', 'Discount rate per period (%)|每期折现率（%）', 0)],
    (v) => {
      const a = nums(v.c);
      check(
        a[0] < 0 && a.slice(1).every((x) => x >= 0),
        'Use an initial outflow followed by nonnegative inflows.|使用初始支出及后续非负收入。',
      );
      let total = a[0],
        answer = null;
      for (let k = 1; k < a.length; k++) {
        const q = a[k] / (1 + v.r / 100) ** k;
        if (total < 0 && total + q >= 0) answer = k - 1 - total / q;
        total += q;
      }
      return [
        R(
          'Discounted payback|折现回收期',
          answer === null ? 'Not recovered in entered horizon|所填期限内未回收' : answer,
          'periods',
        ),
        R('Discounted net balance|折现净余额', total),
      ];
    },
    'Accumulate discounted inflows; interpolate within the recovery period|累加折现后的现金流入；在回收投资的期间内进行插值。',
    [2.5, 200],
  );
  D(
    'profitability-index',
    'Profitability Index|获利指数',
    'Compare discounted future inflows against an initial cost.|比较未来收入现值与初始成本。',
    [
      p('a', 'Initial cost|初始成本', 1000),
      text('c', 'Future inflows, period 1 onward|未来收入（从第 1 期开始）', '400,400,400'),
      rate('r', 'Discount rate per period (%)|每期折现率（%）', 0),
    ],
    (v) => {
      const a = nums(v.c);
      check(
        a.every((x) => x >= 0),
        'Future inflows must be nonnegative.|未来收入应非负。',
      );
      const q = sum(a.map((x, k) => x / (1 + v.r / 100) ** (k + 1)));
      return [R('Profitability index|获利指数', q / v.a), R('Net present value|净现值', q - v.a)];
    },
    'PI=PV(future inflows)/initial cost',
    [1.2, 200],
  );
  D(
    'equivalent-annual-cost',
    'Equivalent Annual Cost|等额年成本',
    'Annualize a purchase and recurring costs at a chosen discount rate.|按折现率将购置与维护费用换算为等额年成本。',
    [
      cash('a', 'Initial purchase|初始购置成本', 1000),
      cash('c', 'Annual operating cost|每年运行成本', 100),
      cash('s', 'End-of-life resale|期末残值', 0),
      rate('r', 'Annual discount rate (%)|年折现率（%）', 0),
      years,
    ],
    (v) => {
      const r = v.r / 100,
        pv = v.a - v.s / (1 + r) ** v.t;
      return [R('Equivalent annual cost|等额年成本', pv / annuity(r, v.t) + v.c)];
    },
    'EAC=[P−S/(1+r)ⁿ]/annuityFactor(r,n)+annual cost',
    [300],
  );
  const bondFields = [
    p('f', 'Face value|面值', 1000),
    n('c', 'Annual coupon rate (%)|年票息率（%）', 5, 0, 100),
    n('y', 'Nominal annual yield (%)|名义年收益率（%）', 5, 0, 100),
    i('t', 'Whole years to maturity|到期整年数', 5, 1, 100),
    i('m', 'Coupon payments per year|每年付息次数', 2, 1, 12),
  ];
  const bond = (v, y = v.y / 100) => {
    const r = y / v.m,
      t = v.t * v.m,
      c = (v.f * v.c) / 100 / v.m;
    return c * annuity(r, t) + v.f / (1 + r) ** t;
  };
  D(
    'bond-price',
    'Fixed Coupon Bond Price|固定票息债券价格',
    'Discount fixed coupons and principal on coupon dates.|在付息日折现固定票息与本金。',
    bondFields,
    (v) => [
      R('Theoretical clean price|理论净价', bond(v)),
      R('Price per 100 face value|每百元面值价格', (100 * bond(v)) / v.f),
    ],
    'P=ΣC/(1+y/m)ᵏ+F/(1+y/m)ᴺ',
    [1000, 100],
    'Assumes settlement on a coupon date, no default, no call option and no accrued interest.|假设在付息日结算，无违约、赎回权及应计利息。',
  );
  D(
    'bond-yield',
    'Bond Yield to Maturity|债券到期收益率',
    'Solve a fixed-coupon bond yield from its coupon-date price.|根据付息日价格反求固定票息债券到期收益率。',
    [...bondFields.filter((f) => f.id !== 'y'), p('p', 'Market price|市场价格', 1000)],
    (v) => [
      R(
        'Nominal annual yield|名义年到期收益率',
        100 * bisect((y) => bond(v, y) - v.p, -0.99, 100),
        '%',
      ),
    ],
    'Solve P=ΣC/(1+y/m)ᵏ+F/(1+y/m)ᴺ',
    [5],
    'Uses equal coupon periods and settlement on a coupon date; excludes default and accrued interest.|使用等长付息期，假设在付息日结算；不含违约与应计利息。',
  );
  D(
    'current-bond-yield',
    'Bond Current Yield|债券当期收益率',
    'Compare annual coupon income with the bond purchase price.|比较债券每年票息收入与买入价。',
    [cash('c', 'Annual coupon income|年票息收入', 50), p('p', 'Purchase price|买入价', 1000)],
    (v) => [R('Current yield|当期收益率', (100 * v.c) / v.p, '%')],
    'Current yield=annual coupon/price',
    [5],
    'This omits capital gains, reinvestment and time to maturity.|不含资本利得、再投资和到期时间。',
  );
  D(
    'bond-duration',
    'Bond Duration|债券久期',
    'Estimate interest-rate sensitivity using discounted cash-flow timing.|用折现现金流时间估计利率敏感度。',
    bondFields,
    (v) => {
      const r = v.y / 100 / v.m,
        t = v.t * v.m,
        c = (v.f * v.c) / 100 / v.m;
      let s = 0;
      for (let k = 1; k <= t; k++) s += ((k / v.m) * (c + (k === t ? v.f : 0))) / (1 + r) ** k;
      const d = s / bond(v);
      return [
        R('Macaulay duration|麦考利久期', d, 'years'),
        R('Modified duration|修正久期', d / (1 + r), 'years'),
      ];
    },
    'D=Σ(t×PV(CF))/P; Dmodified=D/(1+y/m)',
    [4.485432762, 4.376031963],
    'Local sensitivity estimate for small yield changes, with no embedded options.|适用于小幅利率变化且无内嵌期权的局部敏感度估计。',
  );
  D(
    'bond-convexity',
    'Bond Convexity|债券凸性',
    'Measure curvature in a fixed bond’s price-yield relationship.|衡量固定票息债券价格与收益率关系的曲率。',
    bondFields,
    (v) => {
      const r = v.y / 100 / v.m,
        t = v.t * v.m,
        c = (v.f * v.c) / 100 / v.m;
      let q = 0;
      for (let k = 1; k <= t; k++)
        q += (k * (k + 1) * (c + (k === t ? v.f : 0))) / (1 + r) ** (k + 2);
      return [R('Annualized convexity|年化凸性', q / (bond(v) * v.m * v.m))];
    },
    'Convexity=Σ[k(k+1)CFₖ/(1+y/m)ᵏ⁺²]/(Pm²)',
    [22.612322],
    'Assumes equal coupon periods and no embedded options.|假设付息期相等，且无内嵌期权。',
  );
  D(
    'dividend-discount',
    'Dividend Discount Value|股利折现估值',
    'Model constant-growth dividends below a required return.|在必要回报率高于增长率时估算股利折现价值。',
    [
      cash('d', 'Next annual dividend|下一年股利', 3),
      p('r', 'Required annual return (%)|必要年回报率（%）', 8),
      rate('g', 'Annual dividend growth (%)|年股利增长率（%）', 2),
    ],
    (v) => {
      check(
        v.r > v.g,
        'Required return must exceed dividend growth.|必要回报率必须高于股利增长率。',
      );
      return [R('Model value per share|每股模型价值', v.d / ((v.r - v.g) / 100))];
    },
    'P=D₁/(r−g)',
    [50],
  );
  D(
    'dividend-yield',
    'Dividend Yield|股息率',
    'Compare annual dividends with the current share price.|比较年度股息与当前股价。',
    [cash('d', 'Annual dividend per share|每股年度股息', 3), p('p', 'Share price|股价', 60)],
    (v) => [R('Dividend yield|股息率', (100 * v.d) / v.p, '%')],
    'Dividend yield=D/P',
    [5],
  );
  D(
    'earnings-per-share',
    'Earnings per Share|每股收益 EPS',
    'Allocate earnings available to common shareholders.|将归属于普通股股东的收益分摊至股份。',
    [
      u('a', 'Net earnings|净收益', 1000000),
      cash('d', 'Preferred dividends|优先股股息', 100000),
      p('s', 'Weighted average common shares|加权平均普通股数', 300000),
    ],
    (v) => [R('Basic earnings per share|基本每股收益', (v.a - v.d) / v.s)],
    'EPS=(net earnings−preferred dividends)/weighted average common shares',
    [3],
    'Basic EPS only; diluted shares, reporting standards and accounting adjustments are not modeled.|仅为基本 EPS；不模拟稀释股份、会计准则及调整项。',
  );
  D(
    'price-earnings-ratio',
    'Price to Earnings Ratio|市盈率',
    'Compare share price with positive earnings per share.|比较股价与正的每股收益。',
    [cash('p', 'Share price|股价', 60), p('e', 'Annual earnings per share|年每股收益', 3)],
    (v) => [
      R('Price / earnings|市盈率', v.p / v.e),
      R(
        'Earnings yield|盈利收益率',
        v.p > 0 ? (100 * v.e) / v.p : 'Undefined at zero price|股价为零时无定义',
        '%',
      ),
    ],
    'P/E=price/EPS',
    [20, 5],
  );
  D(
    'price-book-ratio',
    'Price to Book Ratio|市净率',
    'Compare share price with positive book value per share.|比较股价与正的每股账面价值。',
    [cash('p', 'Share price|股价', 40), p('b', 'Book value per share|每股账面价值', 20)],
    (v) => [R('Price / book|市净率', v.p / v.b)],
    'P/B=price/book value per share',
    [2],
  );
  D(
    'capm',
    'Capital Asset Pricing Model|资本资产定价模型',
    'Estimate a required return from market beta and a risk premium.|按市场贝塔与风险溢价估计必要回报率。',
    [
      rate('f', 'Risk-free rate (%)|无风险利率（%）', 3),
      rate('m', 'Expected market return (%)|预期市场回报率（%）', 8),
      u('b', 'Market beta|市场贝塔', 1.2),
    ],
    (v) => [
      R('Model required return|模型必要回报率', v.f + v.b * (v.m - v.f), '%'),
      R('Market risk premium|市场风险溢价', v.m - v.f, 'percentage points'),
    ],
    'E[R]=Rf+β(E[Rm]−Rf)',
    [9, 5],
  );
  D(
    'weighted-average-cost-capital',
    'Weighted Average Cost of Capital|加权平均资本成本',
    'Blend debt and equity financing costs with an entered tax rate.|按自填税率合并债务与权益融资成本。',
    [
      cash('e', 'Equity market value|权益市场价值', 600),
      cash('d', 'Debt market value|债务市场价值', 400),
      rate('r', 'Equity cost (%)|权益成本（%）', 10),
      n('c', 'Debt cost (%)|债务成本（%）', 5, 0, 100),
      n('t', 'Effective tax rate (%)|有效税率（%）', 25, 0, 100),
    ],
    (v) => {
      check(v.e + v.d > 0, 'Total capital must be positive.|总资本应大于零。');
      return [
        R('WACC|加权平均资本成本', (v.e * v.r + v.d * v.c * (1 - v.t / 100)) / (v.e + v.d), '%'),
      ];
    },
    'WACC=E/(D+E)Re+D/(D+E)Rd(1−tax)',
    [7.5],
  );
  D(
    'portfolio-expected-return',
    'Portfolio Expected Return|投资组合预期回报',
    'Weight asset-return assumptions by portfolio shares.|按组合占比加权各资产回报假设。',
    [
      text('r', 'Expected asset returns (%)|各资产预期回报（%）', '5,10,15'),
      text('w', 'Portfolio weights (%) summing to 100|组合权重（%，合计 100）', '20,50,30'),
    ],
    (v) => {
      const r = nums(v.r),
        w = nums(v.w);
      check(
        r.length === w.length && w.every((x) => x >= 0) && Math.abs(sum(w) - 100) < 1e-8,
        'Use matching lists and nonnegative weights totaling 100%.|两列应等长，权重非负且合计 100%。',
      );
      return [
        R('Weighted expected return|加权预期回报', sum(r.map((x, k) => (x * w[k]) / 100)), '%'),
      ];
    },
    'E[Rp]=ΣwᵢE[Rᵢ]',
    [10.5],
  );
  D(
    'two-asset-volatility',
    'Two Asset Portfolio Volatility|双资产组合波动率',
    'Combine two asset volatilities and their correlation.|合并两项资产的波动率及相关性。',
    [
      n('a', 'Asset A volatility (%)|A 资产波动率（%）', 10, 0, 1000),
      n('b', 'Asset B volatility (%)|B 资产波动率（%）', 20, 0, 1000),
      n('w', 'Asset A weight (%)|A 资产权重（%）', 50, 0, 100),
      n('c', 'Correlation|相关系数', 0, -1, 1),
    ],
    (v) => {
      const w = v.w / 100;
      return [
        R(
          'Portfolio volatility|组合波动率',
          Math.sqrt(
            Math.max(0, (w * v.a) ** 2 + ((1 - w) * v.b) ** 2 + 2 * w * (1 - w) * v.a * v.b * v.c),
          ),
          '%',
        ),
      ];
    },
    'σp=√[w²σA²+(1−w)²σB²+2w(1−w)σAσBρ]',
    [Math.sqrt(125)],
  );
  D(
    'sharpe-ratio',
    'Sharpe Ratio|夏普比率',
    'Compare excess return with total return volatility.|比较超额回报与总回报波动。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('f', 'Same-period risk-free return (%)|同期无风险回报（%）', 2),
      p('s', 'Same-period volatility (%)|同期波动率（%）', 16),
    ],
    (v) => [R('Sharpe ratio|夏普比率', (v.r - v.f) / v.s)],
    'Sharpe=(R−Rf)/σ',
    [0.5],
    'Use matching return periods. This does not annualize or estimate volatility from prices.|请使用相同期间；不自动年化，也不从价格估算波动率。',
  );
  D(
    'sortino-ratio',
    'Sortino Ratio|索提诺比率',
    'Compare return above a target with downside deviation.|比较超过目标的回报与下行偏差。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('t', 'Same-period target return (%)|同期目标回报（%）', 2),
      p('d', 'Same-period downside deviation (%)|同期下行偏差（%）', 8),
    ],
    (v) => [R('Sortino ratio|索提诺比率', (v.r - v.t) / v.d)],
    'Sortino=(R−target)/downside deviation',
    [1],
  );
  D(
    'treynor-ratio',
    'Treynor Ratio|特雷诺比率',
    'Compare excess return per unit of market beta.|比较每单位市场贝塔的超额回报。',
    [
      rate('r', 'Period return (%)|期间回报（%）', 10),
      rate('f', 'Same-period risk-free return (%)|同期无风险回报（%）', 2),
      p('b', 'Positive market beta|正市场贝塔', 1),
    ],
    (v) => [R('Treynor ratio (decimal return)|特雷诺比率（小数回报）', (v.r - v.f) / 100 / v.b)],
    'Treynor=(R−Rf)/β',
    [0.08],
  );
  D(
    'information-ratio',
    'Information Ratio|信息比率',
    'Compare active return with tracking error.|比较相对基准的超额回报与跟踪误差。',
    [
      rate('r', 'Portfolio return (%)|组合回报（%）', 10),
      rate('b', 'Benchmark return (%)|基准回报（%）', 7),
      p('s', 'Tracking error (%)|跟踪误差（%）', 6),
    ],
    (v) => [R('Information ratio|信息比率', (v.r - v.b) / v.s)],
    'IR=(Rp−Rb)/tracking error',
    [0.5],
  );
})();
