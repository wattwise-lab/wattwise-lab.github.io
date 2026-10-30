(() => {
  'use strict';
  const {
    add,
    n,
    p,
    u,
    i,
    text,
    row: R,
    check,
    nums,
    sum,
    mean,
    variance,
    quantile,
    normal,
    invNormal,
    beta,
    gammaP,
    gammaQ,
    logGamma,
    choose,
    factorial,
  } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const confidence = n('c', 'Confidence level (%)|置信水平（%）', 95, 50, 99.999);
  const probability = (id = 'p', value = 50) =>
    n(id, 'Success probability (%)|成功概率（%）', value, 0, 100);
  const inverseBeta = (q, a, b) => {
    let lo = 0,
      hi = 1;
    for (let k = 0; k < 90; k++) {
      const x = (lo + hi) / 2;
      if (beta(x, a, b) < q) lo = x;
      else hi = x;
    }
    return (lo + hi) / 2;
  };
  D(
    'binomial-cumulative',
    'Binomial Cumulative Probability|二项分布累积概率',
    'Find the probability of at most k successes.|求最多成功 k 次的概率。',
    [
      i('n', 'Trials n|试验次数 n', 10, 0, 100000),
      i('k', 'Maximum successes k|最多成功次数 k', 3, 0, 100000),
      probability(),
    ],
    (v) => {
      check(v.k <= v.n, 'Require k ≤ n.|需满足 k ≤ n。');
      const p = v.p / 100,
        r = v.k === v.n || p === 0 ? 1 : p === 1 ? 0 : beta(1 - p, v.n - v.k, v.k + 1),
        upper = v.k === v.n || p === 0 ? 0 : p === 1 ? 1 : beta(p, v.k + 1, v.n - v.k);
      return [
        R('At most k successes|最多成功 k 次', 100 * r, '%'),
        R('More than k successes|成功超过 k 次', 100 * upper, '%'),
      ];
    },
    'P(X≤k)=I₍₁₋ₚ₎(n−k,k+1)',
    [17.1875, 82.8125],
  );
  D(
    'poisson-probability',
    'Poisson Point Probability|泊松分布点概率',
    'Estimate the chance of exactly k events at a constant average rate.|在平均发生率固定时，求恰好发生 k 次的概率。',
    [
      n('l', 'Expected events λ|预期次数 λ', 3, 0, 100000),
      i('k', 'Event count k|事件次数 k', 2, 0, 100000),
    ],
    (v) => [
      R(
        'Exactly k events|恰好发生 k 次',
        100 *
          (v.l === 0
            ? v.k === 0
              ? 1
              : 0
            : Math.exp(-v.l + v.k * Math.log(v.l) - logGamma(v.k + 1))),
        '%',
      ),
    ],
    'P(X=k)=e⁻λ λᵏ/k!',
    [22.4041807655388],
    'Assumes independent events and a constant rate over a fixed interval.|假设事件独立，且固定区间内平均发生率不变。',
  );
  D(
    'poisson-cumulative',
    'Poisson Cumulative Probability|泊松分布累积概率',
    'Find the probability of at most k Poisson events.|求泊松事件发生次数不超过 k 的概率。',
    [
      n('l', 'Expected events λ|预期次数 λ', 3, 0, 10000),
      i('k', 'Maximum count k|最大次数 k', 2, 0, 10000),
    ],
    (v) => {
      const q = gammaQ(v.k + 1, v.l);
      return [
        R('At most k events|最多发生 k 次', 100 * q, '%'),
        R('More than k events|发生超过 k 次', 100 * gammaP(v.k + 1, v.l), '%'),
      ];
    },
    'P(X≤k)=1−P(k+1,λ)',
    [42.3190081126844],
  );
  D(
    'normal-distribution',
    'Normal Cumulative Probability|正态分布累积概率',
    'Convert a normal-distribution threshold into a percentile.|将正态分布阈值转换为累积百分位。',
    [
      u('m', 'Mean μ|均值 μ', 100),
      p('s', 'Standard deviation σ|标准差 σ', 15),
      u('x', 'Threshold x|阈值 x', 115),
    ],
    (v) => {
      const z = (v.x - v.m) / v.s,
        q = normal(z);
      return [
        R('Probability below threshold|小于阈值的概率', 100 * q, '%'),
        R('Probability above threshold|大于阈值的概率', 100 * normal(-z), '%'),
        R('Standard score|标准分数', z),
      ];
    },
    'z=(x−μ)/σ; P(X≤x)=Φ(z)',
    [84.1344746068543, 15.8655253931457, 1],
  );
  D(
    'normal-quantile',
    'Normal Quantile|正态分布分位数',
    'Find a value from its normal-distribution percentile.|由正态分布累积百分位求对应数值。',
    [
      u('m', 'Mean μ|均值 μ', 0),
      p('s', 'Standard deviation σ|标准差 σ', 1),
      n('q', 'Cumulative percentile (%)|累积百分位（%）', 97.5, 0.000001, 99.999999),
    ],
    (v) => {
      const z = invNormal(v.q / 100);
      return [R('Quantile value|分位数值', v.m + v.s * z), R('Standard score|标准分数', z)];
    },
    'x=μ+σΦ⁻¹(p)',
    [1.95996398454005, 1.95996398454005],
  );
  D(
    'exponential-distribution',
    'Exponential Waiting Time|指数分布等待时间',
    'Estimate the probability an event arrives within a waiting interval.|估算事件在给定等待时间内发生的概率。',
    [p('m', 'Mean waiting time|平均等待时间', 10), n('t', 'Waiting threshold|等待阈值', 5)],
    (v) => [
      R('Arrival by threshold|阈值前发生', -100 * Math.expm1(-v.t / v.m), '%'),
      R('Still waiting at threshold|阈值时仍等待', 100 * Math.exp(-v.t / v.m), '%'),
    ],
    'P(T≤t)=1−e⁻ᵗᐟᵐ',
    [39.3469340287367, 60.6530659712633],
    'The exponential model assumes a constant hazard and memoryless waiting.|指数模型假设发生率固定，且等待时间无记忆性。',
  );
  D(
    'uniform-distribution',
    'Uniform Interval Probability|均匀分布区间概率',
    'Find the probability of a range within a continuous uniform distribution.|求连续均匀分布落入指定区间的概率。',
    [
      u('a', 'Distribution lower bound|分布下界', 2),
      u('b', 'Distribution upper bound|分布上界', 10),
      u('l', 'Query lower bound|查询下界', 4),
      u('h', 'Query upper bound|查询上界', 8),
    ],
    (v) => {
      check(
        v.b > v.a && v.h >= v.l,
        'Upper bounds must not be below lower bounds; the distribution needs positive width.|上界不得低于下界，且分布宽度应大于零。',
      );
      return [
        R(
          'Interval probability|区间概率',
          (100 * Math.max(0, Math.min(v.b, v.h) - Math.max(v.a, v.l))) / (v.b - v.a),
          '%',
        ),
        R('Mean|均值', (v.a + v.b) / 2),
        R('Variance|方差', (v.b - v.a) ** 2 / 12),
      ];
    },
    'P(l≤X≤h)=max(0,min(b,h)−max(a,l))/(b−a)',
    [50, 6, 64 / 12],
  );
  D(
    'geometric-distribution',
    'Geometric First Success|几何分布首次成功',
    'Find the chance that the first success occurs on a chosen trial.|求首次成功恰好出现在某次试验的概率。',
    [
      n('p', 'Success probability (%)|成功概率（%）', 20, 0.000001, 100),
      i('k', 'First successful trial|首次成功的试验序号', 3, 1, 100000),
    ],
    (v) => {
      const p = v.p / 100;
      return [
        R('First success on trial k|第 k 次首次成功', 100 * p * (1 - p) ** (v.k - 1), '%'),
        R('Expected trials|预期试验次数', 1 / p),
      ];
    },
    'P(T=k)=(1−p)ᵏ⁻¹p; E[T]=1/p',
    [12.8, 5],
  );
  D(
    'negative-binomial',
    'Negative Binomial Trials|负二项分布试验次数',
    'Find the chance the rth success occurs on trial n.|求第 r 次成功恰好出现在第 n 次试验的概率。',
    [
      i('r', 'Required successes r|所需成功次数 r', 3, 1, 10000),
      i('n', 'Total trials n|试验总次数 n', 5, 1, 10000),
      n('p', 'Success probability (%)|成功概率（%）', 50, 0.000001, 100),
    ],
    (v) => {
      check(
        v.n >= v.r,
        'Trials must be at least required successes.|试验次数不得少于所需成功次数。',
      );
      const p = v.p / 100,
        q =
          p === 1
            ? v.n === v.r
              ? 1
              : 0
            : Math.exp(
                logGamma(v.n) -
                  logGamma(v.r) -
                  logGamma(v.n - v.r + 1) +
                  v.r * Math.log(p) +
                  (v.n - v.r) * Math.log1p(-p),
              );
      return [R('Probability|概率', 100 * q, '%'), R('Expected trials|预期试验次数', v.r / p)];
    },
    'P(T=n)=C(n−1,r−1)pʳ(1−p)ⁿ⁻ʳ',
    [18.75, 6],
  );
  D(
    'hypergeometric-distribution',
    'Hypergeometric Probability|超几何分布概率',
    'Calculate sampling success counts without replacement.|计算不放回抽样时恰好抽到指定成功个数的概率。',
    [
      i('n', 'Population size N|总体大小 N', 20, 1, 10000),
      i('k', 'Successes in population K|总体成功个数 K', 7, 0, 10000),
      i('d', 'Draws n|抽样个数 n', 5, 0, 10000),
      i('x', 'Drawn successes k|抽中成功个数 k', 2, 0, 10000),
    ],
    (v) => {
      check(
        v.k <= v.n && v.d <= v.n && v.x <= v.d,
        'Population and sample counts are inconsistent.|总体或样本个数不一致。',
      );
      const feasible = v.x <= v.k && v.d - v.x <= v.n - v.k;
      return [
        R(
          'Exactly k successes|恰好抽中 k 个',
          feasible
            ? 100 *
                Math.exp(
                  logGamma(v.k + 1) -
                    logGamma(v.x + 1) -
                    logGamma(v.k - v.x + 1) +
                    logGamma(v.n - v.k + 1) -
                    logGamma(v.d - v.x + 1) -
                    logGamma(v.n - v.k - v.d + v.x + 1) -
                    logGamma(v.n + 1) +
                    logGamma(v.d + 1) +
                    logGamma(v.n - v.d + 1),
                )
            : 0,
          '%',
        ),
        R('Expected successes|预期成功个数', (v.d * v.k) / v.n),
      ];
    },
    'P(X=k)=C(K,k)C(N−K,n−k)/C(N,n)',
    [(100 * 6006) / 15504, 1.75],
  );
  D(
    'birthday-probability',
    'Birthday Collision Probability|生日碰撞概率',
    'Find the chance that at least two people share a birthday.|求至少两人生日相同的概率。',
    [
      i('n', 'People|人数', 23, 0, 100000),
      i('d', 'Equally likely days|等概率日期数', 365, 1, 100000),
    ],
    (v) => {
      let log = 0;
      if (v.n > v.d) return [R('At least one shared birthday|至少一组生日相同', 100, '%')];
      for (let k = 0; k < v.n; k++) log += Math.log1p(-k / v.d);
      return [R('At least one shared birthday|至少一组生日相同', -100 * Math.expm1(log), '%')];
    },
    'P(collision)=1−∏ᵢ₌₀ⁿ⁻¹(1−i/d)',
    [50.7297234323985],
    'Assumes independent and equally likely birthdays; actual birth dates are not uniform.|假设生日独立且等概率；实际出生日期并非均匀分布。',
  );
  D(
    'permutations',
    'Permutations|排列数',
    'Count ordered selections without repetition.|计算不重复、有顺序的选取方式数。',
    [
      i('n', 'Available items n|可选项目 n', 10, 0, 170),
      i('r', 'Selected items r|选取项目 r', 3, 0, 170),
    ],
    (v) => {
      check(v.r <= v.n, 'Require r ≤ n.|需满足 r ≤ n。');
      let q = 1;
      for (let k = 0; k < v.r; k++) q *= v.n - k;
      return [R('Ordered selections|有序选法', q)];
    },
    'P(n,r)=n!/(n−r)!',
    [720],
    'Very large counts are floating-point approximations.|极大计数使用浮点近似。',
  );
  D(
    'combinations',
    'Combinations|组合数',
    'Count unordered selections without repetition.|计算不重复、无顺序的选取方式数。',
    [
      i('n', 'Available items n|可选项目 n', 10, 0, 1000),
      i('r', 'Selected items r|选取项目 r', 3, 0, 1000),
    ],
    (v) => [R('Unordered selections|无序选法', choose(v.n, v.r))],
    'C(n,r)=n!/[r!(n−r)!]',
    [120],
    'Very large counts are floating-point approximations.|极大计数使用浮点近似。',
  );
  D(
    'factorial',
    'Factorial|阶乘',
    'Multiply all positive integers up to n, with 0! defined as 1.|计算从 1 到 n 的整数乘积，并规定 0! 为 1。',
    [i('n', 'Nonnegative integer n|非负整数 n', 10, 0, 170)],
    (v) => [R('Factorial|阶乘', factorial(v.n))],
    'n!=1×2×…×n; 0!=1',
    [3628800],
  );
  D(
    'expected-value',
    'Expected Value and Risk|期望值与波动',
    'Combine discrete outcomes with their probabilities.|按概率汇总离散结果的期望值和波动。',
    [
      text('x', 'Outcome values|各结果数值', '0,10,20'),
      text('p', 'Probabilities summing to 1|各概率（合计为 1）', '0.2,0.5,0.3'),
    ],
    (v) => {
      const x = nums(v.x),
        p = nums(v.p);
      check(
        x.length === p.length && p.every((t) => t >= 0 && t <= 1) && Math.abs(sum(p) - 1) < 1e-9,
        'Provide matching outcomes and nonnegative probabilities totaling 1.|结果与概率应等长，概率非负且合计为 1。',
      );
      const m = sum(x.map((t, k) => t * p[k])),
        s = sum(x.map((t, k) => (t - m) ** 2 * p[k]));
      return [
        R('Expected value|期望值', m),
        R('Variance|方差', s),
        R('Standard deviation|标准差', Math.sqrt(s)),
      ];
    },
    'E[X]=Σpᵢxᵢ; Var(X)=Σpᵢ(xᵢ−E[X])²',
    [11, 49, 7],
  );
  D(
    'weighted-variance',
    'Weighted Population Variance|加权总体方差',
    'Measure population spread with nonnegative observation weights.|用非负观测权重衡量总体离散程度。',
    [text('x', 'Values|数据', '1,2,3'), text('w', 'Nonnegative weights|非负权重', '1,2,1')],
    (v) => {
      const x = nums(v.x),
        w = nums(v.w);
      check(
        x.length === w.length && w.every((t) => t >= 0) && sum(w) > 0,
        'Use matching lists with nonnegative weights and a positive total.|两列应等长，权重非负且总权重大于零。',
      );
      const sw = sum(w),
        m = sum(x.map((t, k) => t * w[k])) / sw,
        s = sum(x.map((t, k) => (t - m) ** 2 * w[k])) / sw;
      return [
        R('Population variance|总体方差', s),
        R('Standard deviation|标准差', Math.sqrt(s)),
        R('Weighted mean|加权均值', m),
      ];
    },
    'μ=Σwx/Σw; σ²=Σw(x−μ)²/Σw',
    [0.5, Math.SQRT1_2, 2],
    'This is population variance; it does not apply a sample-weight bias correction.|这是总体方差，不应用样本权重偏差修正。',
  );
  D(
    'sample-skewness',
    'Adjusted Sample Skewness|校正样本偏度',
    'Measure sample asymmetry with the adjusted Fisher–Pearson coefficient.|使用校正 Fisher–Pearson 系数衡量样本偏斜。',
    [text('x', 'Observations|观测值', '1,2,3,4,5')],
    (v) => {
      const a = nums(v.x),
        n = a.length,
        m = mean(a),
        s = Math.sqrt(variance(a));
      check(
        n >= 3 && s > 0,
        'Need at least three observations with nonzero variance.|至少需要三个观测值，且方差不为零。',
      );
      return [
        R(
          'Adjusted skewness|校正偏度',
          (n / ((n - 1) * (n - 2))) * sum(a.map((x) => ((x - m) / s) ** 3)),
        ),
      ];
    },
    'G₁=nΣ[(x−x̄)/s]³/[(n−1)(n−2)]',
    [0],
  );
  D(
    'sample-kurtosis',
    'Unbiased Excess Kurtosis|无偏超额峰度',
    'Measure sample tail weight relative to a normal distribution.|衡量样本尾部相对正态分布的厚重程度。',
    [text('x', 'Observations|观测值', '1,2,3,4,5')],
    (v) => {
      const a = nums(v.x),
        n = a.length,
        m = mean(a),
        s = variance(a);
      check(
        n >= 4 && s > 0,
        'Need at least four observations with nonzero variance.|至少需要四个观测值，且方差不为零。',
      );
      return [
        R(
          'Excess kurtosis|超额峰度',
          (((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum(a.map((x) => (x - m) ** 4))) /
            (s * s) -
            (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)),
        ),
      ];
    },
    'G₂=n(n+1)Σ[(x−x̄)/s]⁴/[(n−1)(n−2)(n−3)]−3(n−1)²/[(n−2)(n−3)]',
    [-1.2],
  );
  D(
    'cohens-d',
    'Cohen’s d and Hedges’ g|Cohen d 与 Hedges g',
    'Compare two means on a pooled standard-deviation scale.|用合并标准差比较两组均值差异。',
    [
      u('a', 'Group A mean|A 组均值', 10),
      u('b', 'Group B mean|B 组均值', 8),
      p('s', 'Group A sample SD|A 组样本标准差', 2),
      p('t', 'Group B sample SD|B 组样本标准差', 2),
      i('n', 'Group A sample size|A 组样本量', 20, 2, 1000000),
      i('m', 'Group B sample size|B 组样本量', 20, 2, 1000000),
    ],
    (v) => {
      const df = v.n + v.m - 2,
        s = Math.sqrt(((v.n - 1) * v.s * v.s + (v.m - 1) * v.t * v.t) / df),
        d = (v.a - v.b) / s;
      return [
        R('Cohen’s d|Cohen’s d 效应量', d),
        R('Hedges’ g (approximate correction)|Hedges g（近似修正）', d * (1 - 3 / (4 * df - 1))),
        R('Pooled sample SD|合并样本标准差', s),
      ];
    },
    'd=(μA−μB)/sp; g≈d[1−3/(4df−1)]',
    [1, 1 - 3 / 151, 2],
  );
  D(
    'odds-ratio',
    'Odds Ratio|比值比',
    'Compare event odds across two independent groups.|比较两个独立群体的事件优势比。',
    [
      p('a', 'A events|A 组发生数', 20),
      p('b', 'A non-events|A 组未发生数', 80),
      p('c', 'B events|B 组发生数', 10),
      p('d', 'B non-events|B 组未发生数', 90),
    ],
    (v) => {
      const r = (v.a * v.d) / (v.b * v.c),
        s = Math.sqrt(1 / v.a + 1 / v.b + 1 / v.c + 1 / v.d),
        z = invNormal(0.975);
      return [
        R('Odds ratio|比值比', r),
        R('Approximate 95% lower bound|近似 95% 下界', Math.exp(Math.log(r) - z * s)),
        R('Approximate 95% upper bound|近似 95% 上界', Math.exp(Math.log(r) + z * s)),
      ];
    },
    'OR=ad/(bc); CI=exp[ln(OR)±1.96√(1/a+1/b+1/c+1/d)]',
    [2.25],
    'Use positive cell counts. The large-sample interval can be unreliable for small samples; no continuity correction is applied.|各格计数应为正。小样本时大样本区间可能不可靠；未使用连续性修正。',
  );
  D(
    'risk-ratio',
    'Risk Ratio and Difference|风险比与概率差',
    'Compare observed event proportions between groups.|比较两组观测事件比例。',
    [
      i('a', 'A events|A 组发生数', 20, 0, 100000000),
      i('n', 'A total|A 组总数', 100, 1, 100000000),
      i('b', 'B events|B 组发生数', 10, 1, 100000000),
      i('m', 'B total|B 组总数', 100, 1, 100000000),
    ],
    (v) => {
      check(
        v.a <= v.n && v.b <= v.m,
        'Events cannot exceed group totals.|发生数不能超过该组总数。',
      );
      return [
        R('Risk ratio|风险比', v.a / v.n / (v.b / v.m)),
        R('Absolute difference|绝对差', 100 * (v.a / v.n - v.b / v.m), 'percentage points'),
        R('A event proportion|A 组发生比例', (100 * v.a) / v.n, '%'),
        R('B event proportion|B 组发生比例', (100 * v.b) / v.m, '%'),
      ];
    },
    'RR=(a/nA)/(b/nB); difference=a/nA−b/nB',
    [2, 10, 20, 10],
    'Association does not establish causation. A zero reference proportion makes the ratio undefined.|关联不能证明因果。参照组比例为零时，比值无定义。',
  );
  D(
    'ab-proportion-test',
    'A/B Proportion Test|A/B 比例检验',
    'Compare two independent conversion rates using a two-sided pooled z test.|用双侧合并 z 检验比较两个独立转化率。',
    [
      i('a', 'A conversions|A 组转化数', 100, 0, 100000000),
      i('n', 'A visitors|A 组人数', 1000, 1, 100000000),
      i('b', 'B conversions|B 组转化数', 130, 0, 100000000),
      i('m', 'B visitors|B 组人数', 1000, 1, 100000000),
    ],
    (v) => {
      check(v.a <= v.n && v.b <= v.m, 'Conversions cannot exceed visitors.|转化数不能超过人数。');
      const a = v.a / v.n,
        b = v.b / v.m,
        q = (v.a + v.b) / (v.n + v.m),
        se = Math.sqrt(q * (1 - q) * (1 / v.n + 1 / v.m));
      check(
        se > 0,
        'Both groups together must contain events and non-events.|两组合计应同时有发生和未发生。',
      );
      const z = (b - a) / se;
      return [
        R('B minus A|B 减 A', 100 * (b - a), 'percentage points'),
        R('Two-sided p-value|双侧 p 值', 2 * normal(-Math.abs(z))),
        R('z statistic|z 统计量', z),
        R(
          'Relative lift|相对提升',
          a > 0 ? 100 * (b / a - 1) : 'Undefined at zero baseline|基线为零时无定义',
          '%',
        ),
      ];
    },
    'z=(pB−pA)/√[p̂(1−p̂)(1/nA+1/nB)]',
    [3],
    'Requires independent fixed-horizon samples and sufficiently large expected cell counts. Repeated peeking changes error rates.|要求样本独立、预先固定观察周期，且期望格数足够大；反复查看并择时停止会改变错误率。',
  );
  D(
    'exact-binomial-interval',
    'Exact Binomial Confidence Interval|二项分布精确置信区间',
    'Compute a conservative Clopper–Pearson interval for a success proportion.|计算成功比例的保守 Clopper–Pearson 区间。',
    [
      i('k', 'Successes|成功次数', 5, 0, 100000),
      i('n', 'Trials|试验次数', 10, 1, 100000),
      confidence,
    ],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const a = (1 - v.c / 100) / 2;
      return [
        R('Lower bound|下界', 100 * (v.k === 0 ? 0 : inverseBeta(a, v.k, v.n - v.k + 1)), '%'),
        R(
          'Upper bound|上界',
          100 * (v.k === v.n ? 1 : inverseBeta(1 - a, v.k + 1, v.n - v.k)),
          '%',
        ),
        R('Observed proportion|观测比例', (100 * v.k) / v.n, '%'),
      ];
    },
    'Lower=B⁻¹(α/2;k,n−k+1); upper=B⁻¹(1−α/2;k+1,n−k)',
    [18.7086028447208, 81.2913971552792, 50],
  );
  D(
    'correlation-confidence-interval',
    'Correlation Confidence Interval|相关系数置信区间',
    'Estimate a Pearson correlation interval with Fisher’s z transform.|用 Fisher z 变换估计 Pearson 相关系数区间。',
    [
      n('r', 'Sample correlation r|样本相关系数 r', 0, -0.999999999, 0.999999999),
      i('n', 'Paired observations|成对观测数', 30, 4, 10000000),
      confidence,
    ],
    (v) => {
      const z = Math.atanh(v.r),
        d = invNormal((1 + v.c / 100) / 2) / Math.sqrt(v.n - 3);
      return [
        R('Lower correlation bound|相关系数下界', Math.tanh(z - d)),
        R('Upper correlation bound|相关系数上界', Math.tanh(z + d)),
      ];
    },
    'CI=tanh[atanh(r)±zα/₂/√(n−3)]',
    [-0.3602692225955644, 0.3602692225955644],
    'Approximation assumes independent paired observations and approximately bivariate-normal data.|近似方法假设成对观测相互独立，且数据近似二元正态分布。',
  );
  D(
    'shannon-entropy',
    'Shannon Entropy|香农信息熵',
    'Measure uncertainty in a discrete probability distribution.|衡量离散概率分布的不确定性。',
    [text('p', 'Probabilities summing to 1|概率（合计为 1）', '0.5,0.5')],
    (v) => {
      const a = nums(v.p);
      check(
        a.every((x) => x >= 0 && x <= 1) && Math.abs(sum(a) - 1) < 1e-9,
        'Probabilities must be nonnegative and total 1.|概率应非负且合计为 1。',
      );
      const h = -sum(a.filter((x) => x > 0).map((x) => x * Math.log2(x)));
      return [
        R('Entropy|信息熵', h, 'bits'),
        R('Effective equally likely outcomes|等概率有效结果数', 2 ** h),
      ];
    },
    'H=−Σpᵢlog₂pᵢ',
    [1, 2],
  );
  D(
    'shannon-diversity',
    'Shannon Diversity Index|香农多样性指数',
    'Compare abundance diversity and evenness from category counts.|根据类别计数比较多样性与均匀度。',
    [text('x', 'Positive category counts|各类别正计数', '10,10,10')],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x > 0),
        'Counts must be positive.|计数应大于零。',
      );
      const total = sum(a),
        h = -sum(a.map((x) => (x / total) * Math.log(x / total)));
      return [
        R('Shannon diversity H|香农多样性 H', h),
        R('Evenness|均匀度', a.length > 1 ? h / Math.log(a.length) : 1),
        R('Effective categories|有效类别数', Math.exp(h)),
      ];
    },
    'H=−Σpᵢlnpᵢ; J=H/lnS',
    [Math.log(3), 1, 3],
  );
  D(
    'simpson-diversity',
    'Simpson Diversity Index|辛普森多样性指数',
    'Find the chance that two different sampled items belong to different categories.|求不放回抽取两个项目属于不同类别的概率。',
    [text('x', 'Category integer counts|各类别整数计数', '10,10,10')],
    (v) => {
      const a = nums(v.x),
        total = sum(a);
      check(
        a.every((x) => Number.isInteger(x) && x >= 0) && total >= 2,
        'Use nonnegative integer counts totaling at least two.|使用非负整数计数，且总数至少为 2。',
      );
      return [
        R(
          'Gini–Simpson diversity|Gini–Simpson 多样性',
          1 - sum(a.map((x) => x * (x - 1))) / (total * (total - 1)),
        ),
      ];
    },
    'D=1−Σnᵢ(nᵢ−1)/[N(N−1)]',
    [20 / 29],
  );
  D(
    'mean-absolute-deviation',
    'Mean Absolute Deviation|平均绝对偏差',
    'Measure average absolute distance from the arithmetic mean.|计算各数值与算术均值的平均绝对距离。',
    [text('x', 'Observations|观测值', '2,4,6,8')],
    (v) => {
      const a = nums(v.x),
        m = mean(a);
      return [
        R('Mean absolute deviation|平均绝对偏差', mean(a.map((x) => Math.abs(x - m)))),
        R('Arithmetic mean|算术均值', m),
      ];
    },
    'MADmean=Σ|xᵢ−x̄|/n',
    [2, 5],
  );
  D(
    'median-absolute-deviation',
    'Median Absolute Deviation|中位数绝对偏差',
    'Estimate robust spread around the sample median.|估计围绕样本中位数的稳健离散程度。',
    [text('x', 'Observations|观测值', '1,1,2,2,4,6,9')],
    (v) => {
      const a = nums(v.x),
        m = quantile(a, 0.5),
        d = quantile(
          a.map((x) => Math.abs(x - m)),
          0.5,
        );
      return [
        R('Median absolute deviation|中位数绝对偏差', d),
        R('Normal-consistent scaled MAD|正态一致性缩放 MAD', d * 1.482602218505602),
        R('Median|中位数', m),
      ];
    },
    'MAD=median(|xᵢ−median(x)|); scaled≈1.4826022185 MAD',
    [1, 1.482602218505602, 2],
  );
  D(
    'chebyshev-bound',
    'Chebyshev Probability Bound|切比雪夫概率界',
    'Bound the share of a distribution within k standard deviations.|给出分布落在 k 个标准差内的比例下界。',
    [n('k', 'Standard deviations k|标准差倍数 k', 2, 1, 1000000)],
    (v) => [
      R(
        'At least within k standard deviations|至少落在 k 个标准差内',
        100 * (1 - 1 / v.k ** 2),
        '%',
      ),
      R('At most outside the interval|区间外比例至多', 100 / v.k ** 2, '%'),
    ],
    'P(|X−μ|<kσ)≥1−1/k²',
    [75, 25],
    'Requires a finite mean and variance. This is a universal bound, not the exact probability of a particular distribution.|要求均值与方差有限。这是通用界限，不是特定分布的精确概率。',
  );
})();
