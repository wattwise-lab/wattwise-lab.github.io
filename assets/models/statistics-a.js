(() => {
  'use strict';
  const {
    add,
    n,
    p,
    u,
    i,
    text,
    select,
    row: R,
    check,
    nums,
    sum,
    mean,
    variance,
    quantile,
    invNormal,
    tP,
    gammaQ,
    logGamma,
  } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const list = text('values', 'Observations, separated by commas|观测值（逗号分隔）', '1,2,3,4,5');
  const confidence = n('c', 'Confidence level (%)|置信水平（%）', 95, 50, 99.999);
  const pairs = (x, y) => {
    const a = nums(x),
      b = nums(y);
    check(
      a.length === b.length && a.length >= 2,
      'The two lists need the same length and at least two values.|两组数据应等长，且各至少两个值。',
    );
    return [a, b];
  };
  const studentCritical = (c, df) => {
    let a = 0,
      b = 1e7;
    for (let k = 0; k < 90; k++) {
      const x = (a + b) / 2;
      if (tP(x, df) > 1 - c) a = x;
      else b = x;
    }
    return (a + b) / 2;
  };
  const moments = (x, y) => {
    const [a, b] = pairs(x, y),
      ma = mean(a),
      mb = mean(b),
      xx = sum(a.map((x) => (x - ma) ** 2)),
      yy = sum(b.map((x) => (x - mb) ** 2)),
      xy = sum(a.map((x, k) => (x - ma) * (b[k] - mb)));
    return { a, b, ma, mb, xx, yy, xy };
  };
  // 1–17: descriptive statistics and interval design.
  D(
    'weighted-average',
    'Weighted Average|加权平均数',
    'Combine values with explicit nonnegative weights.|按非负权重计算一组数的加权平均。',
    [text('values', 'Values|数值', '10,20'), text('weights', 'Weights|权重', '1,3')],
    (v) => {
      const [a, w] = pairs(v.values, v.weights);
      check(
        w.every((x) => x >= 0) && sum(w) > 0,
        'Weights must be nonnegative and have a positive sum.|权重应非负且总和大于零。',
      );
      return [
        R('Weighted average|加权平均数', sum(a.map((x, k) => x * w[k])) / sum(w)),
        R('Total weight|权重总和', sum(w)),
      ];
    },
    'Σ(wᵢxᵢ) / Σwᵢ',
    [17.5, 4],
  );
  D(
    'geometric-mean',
    'Geometric Mean|几何平均数',
    'Average positive multiplicative values using logarithms.|用对数计算正数数据的几何平均。',
    [text('values', 'Positive observations|正数观测值', '2,8')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x > 0),
        'Every observation must be positive.|所有观测值都需大于零。',
      );
      return [R('Geometric mean|几何平均数', Math.exp(mean(a.map(Math.log))))];
    },
    "Use G = exp[Σln(xᵢ)/n]. xᵢ are positive observations, n is their count, ln is natural logarithm, and exp is its inverse. Geometric mean G has the observations' unit.|使用 G = exp[Σln(xᵢ)/n]。xᵢ 为正数观测值，n 为数量，ln 为自然对数，exp 为其反函数；几何平均数 G 与观测值单位相同。",
    [4],
  );
  D(
    'harmonic-mean',
    'Harmonic Mean|调和平均数',
    'Average positive rates when their numerators carry equal weight.|在分子等权的条件下计算正比率的调和平均。',
    [text('values', 'Positive rates|正比率', '30,60')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x > 0),
        'Every rate must be positive.|所有比率都需大于零。',
      );
      return [R('Harmonic mean|调和平均数', a.length / sum(a.map((x) => 1 / x)))];
    },
    'HM = n / Σ(1/xᵢ)',
    [40],
    'For travel speeds this applies to equal distances, not equal time intervals.|用于速度时对应等距离路段，而不是等时间路段。',
  );
  D(
    'root-mean-square',
    'Root Mean Square|均方根',
    'Find the quadratic mean of signed observations.|计算可含正负数的观测值的均方根。',
    [text('values', 'Observations|观测值', '3,4')],
    (v) => {
      const a = nums(v.values);
      return [R('Root mean square|均方根', Math.sqrt(mean(a.map((x) => x * x))))];
    },
    "Use R = √[Σxᵢ²/n]. xᵢ are observations and n is their count. The root mean square R is nonnegative and uses the observations' unit.|使用 R = √[Σxᵢ²/n]。xᵢ 为观测值，n 为数量；均方根 R 非负，使用观测值的单位。",
    [3.5355339059327378],
  );
  D(
    'data-range',
    'Data Statistical range|极差计算器',
    'Find the spread between the largest and smallest observations.|计算最大值、最小值及其差值。',
    [text('values', 'Observations|观测值', '-2,1,5')],
    (v) => {
      const a = nums(v.values),
        lo = Math.min(...a),
        hi = Math.max(...a);
      return [
        R('Statistical range|极差', hi - lo),
        R('Minimum|最小值', lo),
        R('Maximum|最大值', hi),
      ];
    },
    "Use R = max(x)−min(x). x is the entered observation list; max and min select its largest and smallest values. The range R uses the observations' unit.|使用 R = max(x)−min(x)。x 为自填观测值列表，max 与 min 分别选择最大及最小值；极差 R 使用观测值的单位。",
    [7, -2, 5],
  );
  D(
    'quartiles',
    'Quartiles|四分位数',
    'Find the lower quartile, median and upper quartile by linear interpolation.|用线性插值法求下四分位数、中位数和上四分位数。',
    [text('values', 'Observations|观测值', '1,2,3,4,5,6,7,8,9')],
    (v) => {
      const a = nums(v.values);
      return [
        R('Lower quartile Q1|下四分位数 Q1', quantile(a, 0.25)),
        R('Median Q2|中位数 Q2', quantile(a, 0.5)),
        R('Upper quartile Q3|上四分位数 Q3', quantile(a, 0.75)),
      ];
    },
    'Sorted position h=(n−1)p, with linear interpolation (type 7).|排序后的位置 h=(n−1)p，采用线性插值（第 7 类方法）。',
    [3, 5, 7],
    'Quartile conventions differ between software. This tool uses type-7 linear interpolation.|不同软件的四分位数约定不同，本工具采用第 7 型线性插值。',
  );
  D(
    'percentile',
    'Percentile Value|百分位数',
    'Find the value at an editable percentile of a data set.|求一组数据在指定百分位上的数值。',
    [list, n('p', 'Percentile (%)|百分位（%）', 75, 0, 100)],
    (v) => [R('Percentile value|百分位数', quantile(nums(v.values), v.p / 100))],
    'h=(n−1)p; interpolate between neighbouring sorted observations.|h=(n−1)p；在相邻的已排序观测值之间进行插值。',
    [4],
    'Uses type-7 interpolation, including minimum at 0% and maximum at 100%.|采用第 7 型插值；0% 为最小值，100% 为最大值。',
  );
  D(
    'percentile-rank',
    'Percentile Rank|百分位排名',
    'Find a value’s position using below, inclusive or midrank conventions.|按低于、低于等于或中秩约定计算数值的百分位排名。',
    [
      text('values', 'Observations|观测值', '1,2,3,3,4'),
      u('x', 'Target value|目标值', 3),
      select('method', 'Rank convention|排名约定', 'mid', [
        ['mid', 'Midrank|中秩'],
        ['below', 'Strictly below|严格低于'],
        ['inclusive', 'At or below|低于等于'],
      ]),
    ],
    (v) => {
      const a = nums(v.values),
        below = a.filter((x) => x < v.x).length,
        equal = a.filter((x) => x === v.x).length,
        r = below + (v.method === 'mid' ? equal / 2 : v.method === 'inclusive' ? equal : 0);
      return [
        R('Percentile rank|百分位排名', (100 * r) / a.length, '%'),
        R('Equal observations|相等的观测数量', equal),
      ];
    },
    'Use R = 100(B+wE)/n. B counts observations below the target, E counts equal observations, and n is sample count. Convention weight w is 0 for strictly below, 0.5 for midrank, or 1 for inclusive rank.|使用 R = 100(B+wE)/n。B 为低于目标的观测数，E 为相等观测数，n 为样本数；约定权重 w 在严格低于、中秩、低于等于三种口径下分别为 0、0.5、1。',
    [60, 2],
  );
  D(
    'interquartile-range',
    'Interquartile Range and Outliers|四分位距与异常值',
    'Find IQR and the conventional 1.5-IQR outlier fences.|求四分位距及常用的 1.5 倍四分位距异常值界限。',
    [text('values', 'Observations|观测值', '1,2,3,4,5,100')],
    (v) => {
      const a = nums(v.values),
        q1 = quantile(a, 0.25),
        q3 = quantile(a, 0.75),
        d = q3 - q1,
        lo = q1 - 1.5 * d,
        hi = q3 + 1.5 * d;
      return [
        R('Interquartile range|四分位距', d),
        R('Lower fence|下界', lo),
        R('Upper fence|上界', hi),
        R('Observations outside fences|界限外观测数', a.filter((x) => x < lo || x > hi).length),
      ];
    },
    'Use IQR = Q₃−Q₁ with fences Q₁−1.5IQR and Q₃+1.5IQR. Q₁ and Q₃ are lower and upper quartiles using linear interpolation. Values beyond the fences are flagged, not automatically treated as errors.|使用 IQR = Q₃−Q₁，界限为 Q₁−1.5IQR 与 Q₃+1.5IQR。Q₁ 与 Q₃ 为采用线性插值的下、上四分位数；界外值仅被标示，不自动视为错误。',
    [2.5, -1.5, 8.5, 1],
    'Fences are descriptive screening rules, not proof that a value is erroneous.|界限只是描述性筛查规则，不能证明某个观测值错误。',
  );
  D(
    'z-score',
    'Z-Score|标准分数 Z',
    'Express a value’s distance from a reference mean in standard deviations.|用标准差表示数值偏离参考均值的程度。',
    [
      u('x', 'Observed value|观测值', 85),
      u('m', 'Reference mean|参考均值', 70),
      p('s', 'Reference standard deviation|参考标准差', 5),
    ],
    (v) => [R('Z-score|Z 分数', (v.x - v.m) / v.s)],
    'z=(x−μ)/σ',
    [3],
  );
  D(
    'coefficient-of-variation',
    'Coefficient of Variation|变异系数',
    'Compare sample standard deviation with a positive mean.|比较样本标准差与正均值的相对大小。',
    [text('values', 'Nonnegative observations|非负观测值', '10,20,30')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x >= 0) && mean(a) > 0,
        'Use nonnegative ratio-scale data with a positive mean.|需使用均值大于零的非负比率尺度数据。',
      );
      const s = Math.sqrt(variance(a));
      return [
        R('Coefficient of variation|变异系数', (100 * s) / mean(a), '%'),
        R('Sample standard deviation|样本标准差', s),
        R('Mean|均值', mean(a)),
      ];
    },
    'Use CV = 100s/μ. s is sample standard deviation and μ is the positive arithmetic mean of the entered nonnegative observations. The coefficient of variation is displayed as a percentage.|使用 CV = 100s/μ。s 为样本标准差，μ 为所填非负观测值的大于零的算术均值；变异系数以百分数显示。',
    [50, 10, 20],
    'Not suitable for arbitrary zero scales such as Celsius temperatures or means close to zero.|不适合摄氏温度等零点任意的尺度，也不宜用于接近零的均值。',
  );
  D(
    'standard-error',
    'Standard Error of the Mean|均值标准误',
    'Estimate the standard error from independent sample observations.|根据独立样本观测值估算均值标准误。',
    [text('values', 'Sample observations|样本观测值', '10,20,30')],
    (v) => {
      const a = nums(v.values),
        s = Math.sqrt(variance(a));
      return [
        R('Standard error|标准误', s / Math.sqrt(a.length)),
        R('Sample standard deviation|样本标准差', s),
        R('Sample size|样本量', a.length),
      ];
    },
    'Use SE = s/√n. s is sample standard deviation and n is the number of independent observations. Standard error describes variability of a sample mean, not the spread of individual observations.|使用 SE = s/√n。s 为样本标准差，n 为独立观测数；标准误描述样本均值的变动，而非单个观测值的离散程度。',
    [5.773502691896258, 10, 3],
  );
  D(
    'mean-confidence-interval',
    'Mean Confidence Interval|均值置信区间',
    'Build a two-sided t interval from sample mean, sample deviation and size.|由样本均值、样本标准差和样本量构造双侧 t 置信区间。',
    [
      u('m', 'Sample mean|样本均值', 10),
      n('s', 'Sample standard deviation|样本标准差', 4),
      i('n', 'Sample size|样本量', 16, 2, 1e7),
      confidence,
    ],
    (v) => {
      const se = v.s / Math.sqrt(v.n),
        critical = studentCritical(v.c / 100, v.n - 1),
        margin = critical * se;
      return [
        R('Lower confidence limit|置信下限', v.m - margin),
        R('Upper confidence limit|置信上限', v.m + margin),
        R('Margin of error|误差界限', margin),
        R('Degrees of freedom|自由度', v.n - 1),
      ];
    },
    'Use m±t_c s/√n. m is sample mean, s is sample standard deviation, n is sample size, and t_c is the two-sided Student critical value for the chosen confidence and n−1 degrees of freedom.|使用 m±t_c s/√n。m 为样本均值，s 为样本标准差，n 为样本量，t_c 为按自选双侧置信水平及 n−1 个自由度取得的 Student 临界值。',
    [7.868550454440677, 12.131449545559324],
    'Assumes independent observations and a suitable sampling model; small samples need approximately normal observations.|假设观测独立且抽样模型适用；小样本需要观测近似正态。',
  );
  D(
    'proportion-confidence-interval',
    'Wilson Proportion Interval|比例置信区间',
    'Use the Wilson score interval for a binary success count.|用 Wilson 得分法计算二项成功率的置信区间。',
    [i('k', 'Successes|成功次数', 50, 0, 1e9), i('n', 'Trials|试验次数', 100, 1, 1e9), confidence],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const p = v.k / v.n,
        z = invNormal((1 + v.c / 100) / 2),
        den = 1 + (z * z) / v.n,
        centre = (p + (z * z) / (2 * v.n)) / den,
        margin = (z * Math.sqrt((p * (1 - p)) / v.n + (z * z) / (4 * v.n * v.n))) / den;
      return [
        R('Lower confidence limit|置信下限', 100 * (centre - margin), '%'),
        R('Upper confidence limit|置信上限', 100 * (centre + margin), '%'),
        R('Observed proportion|观测比例', 100 * p, '%'),
      ];
    },
    'Use Wilson centre C = (p+z²/(2n))/(1+z²/n) and half-width H = z√[p(1−p)/n+z²/(4n²)]/(1+z²/n). p is successes divided by trials, n is trials, and z is the two-sided standard-normal critical value. Bounds are C−H and C+H, displayed as percentages.|使用 Wilson 中心 C = (p+z²/(2n))/(1+z²/n) 及半宽 H = z√[p(1−p)/n+z²/(4n²)]/(1+z²/n)。p 为成功次数除以试验次数，n 为试验次数，z 为双侧标准正态临界值；上下界为 C−H 与 C+H，以百分比显示。',
    [40.38315302709716, 59.61684697290284, 50],
    'Independent binary trials; confidence describes the method’s repeated-sample coverage, not a probability assigned to a fixed true proportion.|假设独立二项试验；置信水平描述方法在重复抽样中的覆盖率，不是固定真实比例的概率。',
  );
  D(
    'sample-size-mean',
    'Sample Size for a Mean|均值估计所需样本量',
    'Plan sample size from assumed population deviation and desired error.|按假设总体标准差和目标误差规划样本量。',
    [
      p('s', 'Assumed population standard deviation|假设总体标准差', 10),
      p('e', 'Desired half-width|目标半宽误差', 2),
      confidence,
      i('N', 'Finite population, zero for unlimited|有限总体大小（0 表示不限定）', 0, 0, 1e12),
    ],
    (v) => {
      const z = invNormal((1 + v.c / 100) / 2),
        n0 = ((z * v.s) / v.e) ** 2,
        needed = v.N > 0 ? n0 / (1 + (n0 - 1) / v.N) : n0;
      return [R('Required sample size|所需样本量', Math.max(1, Math.ceil(needed)))];
    },
    'Use n₀ = (zσ/E)². σ is assumed population deviation, E is desired half-width, and z is the two-sided normal critical value. For finite population N, use n = n₀/[1+(n₀−1)/N]; otherwise keep the uncorrected value. Round up to a whole sample count.|使用 n₀ = (zσ/E)²。σ 为假设总体标准差，E 为目标半宽误差，z 为双侧正态临界值；有限总体大小为 N 时使用 n = n₀/[1+(n₀−1)/N]，否则保留未修正值，再向上取整为样本数。',
    [97],
    'Normal approximation for simple random sampling. The assumed deviation must come from relevant evidence.|用于简单随机抽样的正态近似；假设标准差需要相关依据。',
  );
  D(
    'sample-size-proportion',
    'Sample Size for a Proportion|比例估计所需样本量',
    'Plan binary-trial sample size using expected proportion and margin.|按预期比例和误差界限规划二项试验样本量。',
    [
      n('p', 'Expected proportion (%)|预期比例（%）', 50, 0.000001, 99.999999),
      p('e', 'Desired margin (percentage points)|目标误差（百分点）', 5),
      confidence,
      i('N', 'Finite population, zero for unlimited|有限总体大小（0 表示不限定）', 0, 0, 1e12),
    ],
    (v) => {
      const p = v.p / 100,
        e = v.e / 100,
        z = invNormal((1 + v.c / 100) / 2),
        n0 = (z * z * p * (1 - p)) / (e * e),
        needed = v.N > 0 ? n0 / (1 + (n0 - 1) / v.N) : n0;
      return [R('Required sample size|所需样本量', Math.max(1, Math.ceil(needed)))];
    },
    'n₀=z²p(1−p)/E²; optionally apply finite-population correction.|n₀=z²p(1−p)/E²；可选应用有限总体修正。',
    [385],
    'Normal approximation; 50% is conservative when the proportion is unknown. Cluster sampling needs a separate design adjustment.|采用正态近似；未知比例时 50% 较保守，整群抽样还需设计效应调整。',
  );
  D(
    'margin-of-error',
    'Proportion Margin of Error|比例误差界限',
    'Estimate a normal-approximation margin from sample size and proportion.|由样本量和比例估算正态近似误差界限。',
    [
      n('p', 'Proportion (%)|比例（%）', 50, 0, 100),
      i('n', 'Sample size|样本量', 400, 1, 1e9),
      confidence,
    ],
    (v) => {
      const p = v.p / 100,
        z = invNormal((1 + v.c / 100) / 2);
      return [
        R(
          'Margin of error|误差界限',
          100 * z * Math.sqrt((p * (1 - p)) / v.n),
          'percentage points|百分点',
        ),
      ];
    },
    'E = z√(p(1−p)/n)',
    [4.899909961350134],
    'This Wald approximation is unreliable for small samples or proportions near zero or one; use Wilson or exact intervals instead.|小样本或比例接近 0、1 时 Wald 近似不可靠，应查看 Wilson 或精确区间。',
  );
  // 18–25: tests, correlation and regression.
  D(
    'one-sample-t-test',
    'One-Sample t Test|单样本 t 检验',
    'Compare a sample mean with a stated reference using a two-sided t test.|用双侧 t 检验比较样本均值与给定参考值。',
    [
      text('values', 'Sample observations|样本观测值', '2,4,6,8,10'),
      u('m', 'Null-hypothesis mean|原假设均值', 5),
    ],
    (v) => {
      const a = nums(v.values),
        se = Math.sqrt(variance(a) / a.length);
      check(se > 0, 'Sample standard deviation must be positive.|样本标准差必须大于零。');
      const t = (mean(a) - v.m) / se;
      return [
        R('t statistic|t 统计量', t),
        R('Degrees of freedom|自由度', a.length - 1),
        R('Two-sided p-value|双侧 p 值', tP(t, a.length - 1)),
      ];
    },
    'Use t = (m−μ₀)/(s/√n) with df = n−1. m is sample mean, μ₀ is the null-hypothesis mean, s is sample standard deviation, and n is sample size. The displayed p-value is two-sided.|使用 t = (m−μ₀)/(s/√n)，自由度为 df = n−1。m 为样本均值，μ₀ 为原假设均值，s 为样本标准差，n 为样本量；显示的 p 值为双侧。',
    [0.7071067811865475, 4, 0.5185185185185185],
    'Requires an appropriate independent-sampling model. A p-value does not measure the probability that the null hypothesis is true.|需要适当的独立抽样模型；p 值不是原假设为真的概率。',
  );
  D(
    'welch-t-test',
    'Welch Two-Sample t Test|Welch 双样本 t 检验',
    'Compare two independent sample means without assuming equal variances.|比较两个独立样本均值，不要求两组方差相等。',
    [text('x', 'Sample A|样本 A', '8,9,10,11,12'), text('y', 'Sample B|样本 B', '6,7,8,9,10')],
    (v) => {
      const a = nums(v.x),
        b = nums(v.y),
        va = variance(a) / a.length,
        vb = variance(b) / b.length;
      check(
        va + vb > 0,
        'The combined sampling variance must be positive.|合并抽样方差必须大于零。',
      );
      const t = (mean(a) - mean(b)) / Math.sqrt(va + vb),
        df = (va + vb) ** 2 / ((va * va) / (a.length - 1) + (vb * vb) / (b.length - 1));
      return [
        R('t statistic|t 统计量', t),
        R('Welch degrees of freedom|Welch 自由度', df),
        R('Two-sided p-value|双侧 p 值', tP(t, df)),
      ];
    },
    "Use t = (m₁−m₂)/√(s₁²/n₁+s₂²/n₂). m, s and n are each sample's mean, sample standard deviation and size; subscripts distinguish the samples. The two-sided p-value uses Welch–Satterthwaite degrees of freedom, without assuming equal variances.|使用 t = (m₁−m₂)/√(s₁²/n₁+s₂²/n₂)。m、s、n 分别为各组均值、样本标准差和样本量，下标区分样本；双侧 p 值采用 Welch–Satterthwaite 自由度，不假设两组方差相等。",
    [2, 8, 0.08051623795726259],
    'For independent samples. Paired measurements require a paired test.|用于独立样本；配对测量应使用配对检验。',
  );
  D(
    'paired-t-test',
    'Paired t Test|配对 t 检验',
    'Test whether the mean within-pair difference is zero.|检验同一配对内差值的均值是否为零。',
    [
      text('x', 'First measurement|第一次测量', '8,9,10,11,12'),
      text('y', 'Paired second measurement|配对的第二次测量', '7,7,8,9,9'),
    ],
    (v) => {
      const [a, b] = pairs(v.x, v.y),
        d = a.map((x, k) => x - b[k]),
        se = Math.sqrt(variance(d) / d.length);
      check(
        se > 0,
        'Paired differences must have positive sample variance.|配对差值的样本方差需大于零。',
      );
      const t = mean(d) / se;
      return [
        R('t statistic|t 统计量', t),
        R('Degrees of freedom|自由度', d.length - 1),
        R('Two-sided p-value|双侧 p 值', tP(t, d.length - 1)),
        R('Mean first-minus-second difference|第一次减第二次的平均差', mean(d)),
      ];
    },
    'Apply a one-sample t test to the paired differences.|对每对数据的差值执行单样本 t 检验。',
    [6.324555320336758, 4],
    'Pair positions must correspond to the same unit or person; observations between pairs must be independent.|两列同一位置需对应同一对象；不同配对之间应独立。',
  );
  D(
    'chi-square-independence',
    '2 × 2 Chi-Square Test|二乘二卡方独立性检验',
    'Test independence in a two-by-two count table without continuity correction.|对二乘二计数表进行无连续性校正的独立性检验。',
    [
      i('a', 'Row 1, column 1 count|第 1 行第 1 列计数', 10, 0, 1e9),
      i('b', 'Row 1, column 2 count|第 1 行第 2 列计数', 20, 0, 1e9),
      i('c', 'Row 2, column 1 count|第 2 行第 1 列计数', 30, 0, 1e9),
      i('d', 'Row 2, column 2 count|第 2 行第 2 列计数', 40, 0, 1e9),
    ],
    (v) => {
      const N = v.a + v.b + v.c + v.d,
        den = (v.a + v.b) * (v.c + v.d) * (v.a + v.c) * (v.b + v.d);
      check(den > 0, 'Every row and column total must be positive.|各行、列总数都应大于零。');
      const stat = (N * (v.a * v.d - v.b * v.c) ** 2) / den,
        expected = [
          ((v.a + v.b) * (v.a + v.c)) / N,
          ((v.a + v.b) * (v.b + v.d)) / N,
          ((v.c + v.d) * (v.a + v.c)) / N,
          ((v.c + v.d) * (v.b + v.d)) / N,
        ];
      return [
        R('Chi-square statistic|卡方统计量', stat),
        R('Degrees of freedom|自由度', 1),
        R('p-value|p 值', gammaQ(0.5, stat / 2)),
        R('Smallest expected count|最小期望计数', Math.min(...expected)),
      ];
    },
    'χ²=N(ad−bc)²/((a+b)(c+d)(a+c)(b+d)); df=1',
    [0.7936507936507936, 1],
    'The chi-square approximation can be unreliable with small expected counts. No Yates correction is applied.|期望计数较小时卡方近似可能不可靠；本工具不做 Yates 校正。',
  );
  D(
    'chi-square-goodness-of-fit',
    'Chi-Square Goodness of Fit|卡方拟合优度检验',
    'Compare observed category counts with positive expected counts.|比较分类观测计数与正的期望计数。',
    [
      text('x', 'Observed counts|观测计数', '10,20,30'),
      text('y', 'Expected counts|期望计数', '20,20,20'),
      i('k', 'Parameters estimated from the same data|由同一数据估计的参数数量', 0, 0, 100),
    ],
    (v) => {
      const [a, b] = pairs(v.x, v.y);
      check(
        a.every((x) => x >= 0) && b.every((x) => x > 0),
        'Observed counts must be nonnegative and expected counts positive.|观测计数需非负，期望计数需为正。',
      );
      check(
        Math.abs(sum(a) - sum(b)) <= 1e-8 * Math.max(1, sum(a)),
        'Observed and expected totals must agree.|观测与期望总计应一致。',
      );
      const df = a.length - 1 - v.k;
      check(df > 0, 'Degrees of freedom must be positive.|自由度必须大于零。');
      const stat = sum(a.map((x, k) => (x - b[k]) ** 2 / b[k]));
      return [
        R('Chi-square statistic|卡方统计量', stat),
        R('Degrees of freedom|自由度', df),
        R('p-value|p 值', gammaQ(df / 2, stat / 2)),
      ];
    },
    'Use χ² = Σ(Oᵢ−Eᵢ)²/Eᵢ and df = k−1−p. Oᵢ and Eᵢ are observed and expected counts, k is category count, and p is parameters estimated from the same data. The p-value is the upper chi-square tail.|使用 χ² = Σ(Oᵢ−Eᵢ)²/Eᵢ，自由度为 df = k−1−p。Oᵢ 与 Eᵢ 为观测和期望计数，k 为类别数，p 为从同一数据估计的参数数；p 值采用卡方分布上尾。',
    [10, 2, 0.006737946999085467],
  );
  D(
    'pearson-correlation',
    'Pearson Correlation|皮尔逊相关系数',
    'Measure linear association between paired numeric observations.|衡量两组配对数值的线性相关程度。',
    [
      text('x', 'x observations|x 观测值', '1,2,3,4,5'),
      text('y', 'y observations|y 观测值', '2,4,6,8,10'),
    ],
    (v) => {
      const m = moments(v.x, v.y);
      check(m.xx * m.yy > 0, 'Both variables must vary.|两个变量都必须有变化。');
      return [
        R('Pearson r|皮尔逊 r', Math.max(-1, Math.min(1, m.xy / Math.sqrt(m.xx * m.yy)))),
        R('Sample covariance|样本协方差', m.xy / (m.a.length - 1)),
        R('Paired observations|配对观测数', m.a.length),
      ];
    },
    'r=Σ(x−x̄)(y−ȳ)/√(Σ(x−x̄)²Σ(y−ȳ)²)',
    [1, 5, 5],
    'Correlation measures linear association and does not establish causation.|相关系数衡量线性联系，不能证明因果关系。',
  );
  D(
    'linear-regression',
    'Simple Linear Regression|一元线性回归',
    'Fit y=intercept+slope×x and predict y at an editable x.|拟合一元线性回归，并在指定 x 处求预测值。',
    [
      text('x', 'x observations|x 观测值', '1,2,3,4'),
      text('y', 'y observations|y 观测值', '2,4,5,4'),
      u('target', 'Prediction x|预测点 x', 5),
    ],
    (v) => {
      const m = moments(v.x, v.y);
      check(m.xx > 0, 'The x values must vary.|x 值必须有变化。');
      const slope = m.xy / m.xx,
        intercept = m.mb - slope * m.ma;
      return [
        R('Slope|斜率', slope),
        R('Intercept|截距', intercept),
        R('Predicted y|预测 y', intercept + slope * v.target),
      ];
    },
    'Use b = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)² and a = ȳ−bx̄. xᵢ and yᵢ are paired observations, bars denote means, b is slope, and a is intercept. Prediction at the entered target is a+bx.|使用 b = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)² 及 a = ȳ−bx̄。xᵢ 与 yᵢ 为成对观测值，横线表示均值，b 为斜率，a 为截距；目标点的预测值为 a+bx。',
    [0.7, 2, 5.5],
    'Ordinary least squares with an intercept. Extrapolation beyond the observed x range can be unreliable.|采用带截距的普通最小二乘法；超出观测 x 范围的外推可能不可靠。',
  );
  D(
    'r-squared',
    'R-Squared and Prediction Error|决定系数与预测误差',
    'Compare predictions with observations using R² and root mean squared error.|用 R² 和均方根误差比较预测值与观测值。',
    [text('x', 'Observed values|观测值', '2,4,6'), text('y', 'Predicted values|预测值', '2,3,5')],
    (v) => {
      const [a, b] = pairs(v.x, v.y),
        sse = sum(a.map((x, k) => (x - b[k]) ** 2)),
        sst = sum(a.map((x) => (x - mean(a)) ** 2));
      check(sst > 0, 'Observed values must vary.|观测值必须有变化。');
      return [
        R('R-squared|决定系数 R²', 1 - sse / sst),
        R('Root mean squared error|均方根误差', Math.sqrt(sse / a.length)),
      ];
    },
    'Use R² = 1−SSE/SST and RMSE = √(SSE/n). SSE is summed squared prediction error, SST is summed squared deviation of observations from their mean, and n is count. A constant observed series has undefined explained-variation ratio.|使用 R² = 1−SSE/SST 及 RMSE = √(SSE/n)。SSE 为预测误差平方和，SST 为观测值相对均值的离差平方和，n 为数量；观测值全部相同时，解释变异比例无定义。',
    [0.75, 0.816496580927726],
    'R² can be negative for poor predictions. This does not adjust for fitted parameter count.|预测较差时 R² 可以为负；本工具不按拟合参数数目做调整。',
  );
  // 26–30: probability operations and the binomial probability mass.
  D(
    'bayes-theorem',
    'Bayes’ Theorem|贝叶斯定理',
    'Update a prior probability from true-signal and false-signal rates.|根据真实信号率和误报率更新先验概率。',
    [
      n('a', 'Prior probability (%)|先验概率（%）', 1, 0, 100),
      n('b', 'Signal rate when true (%)|条件为真时的信号率（%）', 99, 0, 100),
      n('c', 'Signal rate when false (%)|条件为假时的信号率（%）', 5, 0, 100),
    ],
    (v) => {
      const a = v.a / 100,
        b = v.b / 100,
        c = v.c / 100,
        e = a * b + (1 - a) * c;
      check(e > 0, 'The signal must have positive probability.|信号发生概率必须大于零。');
      return [
        R('Posterior probability|后验概率', (100 * a * b) / e, '%'),
        R('Overall signal probability|信号总体概率', 100 * e, '%'),
      ];
    },
    'P(A|B)=P(B|A)P(A)/(P(B|A)P(A)+P(B|¬A)P(¬A))',
    [100 / 6, 5.94],
    'Inputs are probabilities you supply; this tool does not infer them from a diagnosis or a real-world population.|概率由你提供，本工具不根据诊断或现实人群自行推断。',
  );
  D(
    'conditional-probability',
    'Conditional Probability|条件概率',
    'Calculate P(A given B) from joint probability and the probability of B.|由联合概率及 B 的概率计算条件概率 P(A|B)。',
    [
      n('a', 'Joint probability P(A and B) (%)|联合概率 P(A 且 B)（%）', 20, 0, 100),
      n('b', 'Probability P(B) (%)|概率 P(B)（%）', 40, 0.000001, 100),
    ],
    (v) => {
      check(v.a <= v.b, 'Joint probability cannot exceed P(B).|联合概率不能大于 P(B)。');
      return [R('Conditional probability|条件概率', (100 * v.a) / v.b, '%')];
    },
    'P(A|B)=P(A∩B)/P(B)',
    [50],
  );
  D(
    'union-probability',
    'Union Probability|事件并集概率',
    'Find the probability that at least one of two events occurs.|求两个事件至少一个发生的概率。',
    [
      n('a', 'P(A) (%)|P(A)（%）', 30, 0, 100),
      n('b', 'P(B) (%)|P(B)（%）', 40, 0, 100),
      n('c', 'P(A and B) (%)|P(A 且 B)（%）', 10, 0, 100),
    ],
    (v) => {
      check(
        v.c <= Math.min(v.a, v.b) && v.c >= Math.max(0, v.a + v.b - 100),
        'The intersection must satisfy the probability bounds.|交集概率必须满足概率界限。',
      );
      return [R('Probability of A or B|A 或 B 的概率', v.a + v.b - v.c, '%')];
    },
    'P(A∪B)=P(A)+P(B)−P(A∩B)',
    [60],
  );
  D(
    'independent-events',
    'Independent Events Probability|独立事件联合概率',
    'Multiply probabilities of independent events and find the complement.|求独立事件全部发生及其补事件的概率。',
    [text('values', 'Probabilities from 0 to 1|0–1 之间的概率', '0.5,0.2,0.8')],
    (v) => {
      const a = nums(v.values);
      check(
        a.every((x) => x >= 0 && x <= 1),
        'Probabilities must lie between zero and one.|概率必须在 0 到 1 之间。',
      );
      const p = a.reduce((r, x) => r * x, 1);
      return [
        R('Probability all occur|全部发生的概率', 100 * p, '%'),
        R('Probability at least one fails|至少一个未发生的概率', 100 * (1 - p), '%'),
      ];
    },
    'For independent events, use P = ∏pᵢ for all events occurring and 1−P for not all occurring. pᵢ are entered probability fractions. The complement means at least one event fails, not that every event fails.|对独立事件，全部发生的概率为 P = ∏pᵢ，并非全部发生的概率为 1−P。pᵢ 为自填概率比例；补事件表示至少一项不发生，并非每项都不发生。',
    [8, 92],
    'Multiplication requires independence. Related events need a joint or conditional model.|相乘要求事件独立；有关联的事件需要联合或条件模型。',
  );
  D(
    'binomial-probability',
    'Binomial Probability|二项分布点概率',
    'Find the chance of exactly k successes in n independent trials.|求 n 次独立二项试验中恰好成功 k 次的概率。',
    [
      i('n', 'Trials n|试验次数 n', 10, 0, 100000),
      i('k', 'Successes k|成功次数 k', 3, 0, 100000),
      n('p', 'Success probability (%)|每次成功概率（%）', 50, 0, 100),
    ],
    (v) => {
      check(v.k <= v.n, 'Successes cannot exceed trials.|成功次数不能超过试验次数。');
      const p = v.p / 100,
        prob =
          p === 0
            ? v.k === 0
              ? 1
              : 0
            : p === 1
              ? v.k === v.n
                ? 1
                : 0
              : Math.exp(
                  logGamma(v.n + 1) -
                    logGamma(v.k + 1) -
                    logGamma(v.n - v.k + 1) +
                    v.k * Math.log(p) +
                    (v.n - v.k) * Math.log1p(-p),
                );
      return [R('Exactly k successes|恰好成功 k 次', 100 * prob, '%')];
    },
    'P(X=k)=C(n,k)pᵏ(1−p)ⁿ⁻ᵏ',
    [11.71875],
  );
})();
