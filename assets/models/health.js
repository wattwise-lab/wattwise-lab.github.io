(() => {
  'use strict';
  const { add, n, p, i, text, row: R, check, nums, sum, mean, variance } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'For personal measurement and planning, not diagnosis, treatment or a training prescription. Measurement error and individual differences affect results.|用于个人测量与规划，不用于诊断、治疗或训练处方；测量误差与个体差异会影响结果。',
  ) => add(s, name, 'Health', purpose, f, calc, formula, e, note);
  const weight = p('w', 'Body mass (kg)|体重（kg）', 75),
    height = p('h', 'Height (cm)|身高（cm）', 180),
    fat = n('f', 'Measured body fat (%)|测量体脂率（%）', 20, 0, 99.9);
  D(
    'waist-height-ratio',
    'Waist to Height Ratio|腰围身高比',
    'Compare waist circumference with measured height.|比较实测腰围与身高。',
    [p('w', 'Waist circumference (cm)|腰围（cm）', 80), height],
    (v) => [R('Waist / height|腰围身高比', v.w / v.h)],
    'Ratio=waist circumference/height',
    [4 / 9],
  );
  D(
    'waist-hip-ratio',
    'Waist to Hip Ratio|腰臀比',
    'Compare waist and hip circumference in the same unit.|用相同单位比较腰围与臀围。',
    [
      p('w', 'Waist circumference (cm)|腰围（cm）', 80),
      p('h', 'Hip circumference (cm)|臀围（cm）', 100),
    ],
    (v) => [R('Waist / hip|腰臀比', v.w / v.h)],
    'WHR=waist/hip',
    [0.8],
  );
  D(
    'body-surface-area',
    'Body Surface Area|体表面积',
    'Estimate body surface area with the Mosteller formula.|用 Mosteller 公式估算体表面积。',
    [weight, height],
    (v) => [R('Estimated surface area|估算体表面积', Math.sqrt((v.w * v.h) / 3600), 'm²')],
    'BSA=√[height(cm)×mass(kg)/3600]',
    [Math.sqrt(3.75)],
    'Mosteller approximation for educational comparison. Never use this page to determine medication or chemotherapy doses.|Mosteller 近似，仅供教育性比较；不得据此确定药物或化疗剂量。',
  );
  D(
    'fat-free-mass-index',
    'Fat Free Mass Index|去脂体重指数 FFMI',
    'Scale measured fat-free mass by height squared.|将测量推算的去脂体重按身高平方标准化。',
    [weight, height, fat],
    (v) => {
      const lean = v.w * (1 - v.f / 100);
      return [
        R('FFMI|去脂体重指数', lean / (v.h / 100) ** 2, 'kg/m²'),
        R('Fat-free mass|去脂体重', lean, 'kg'),
      ];
    },
    'FFMI=mass×(1−fat fraction)/height(m)²',
    [60 / 3.24, 60],
  );
  D(
    'fat-mass-index',
    'Fat Mass Index|脂肪质量指数 FMI',
    'Scale measured fat mass by height squared.|将测量推算的脂肪质量按身高平方标准化。',
    [weight, height, fat],
    (v) => [
      R('FMI|脂肪质量指数', (v.w * v.f) / 100 / (v.h / 100) ** 2, 'kg/m²'),
      R('Fat mass|脂肪质量', (v.w * v.f) / 100, 'kg'),
    ],
    'FMI=mass×fat fraction/height(m)²',
    [15 / 3.24, 15],
  );
  D(
    'heart-rate-reserve',
    'Heart Rate Reserve Target|心率储备目标',
    'Apply an entered intensity to measured heart-rate reserve.|将自填强度应用于实测心率储备。',
    [
      n('m', 'Measured maximum heart rate (bpm)|实测最大心率（bpm）', 190, 30, 250),
      n('r', 'Resting heart rate (bpm)|静息心率（bpm）', 60, 20, 200),
      n('p', 'Chosen reserve intensity (%)|自选储备强度（%）', 60, 0, 100),
    ],
    (v) => {
      check(
        v.m > v.r,
        'Maximum heart rate must exceed resting heart rate.|最大心率必须高于静息心率。',
      );
      return [
        R('Target at entered intensity|自填强度对应心率', v.r + ((v.m - v.r) * v.p) / 100, 'bpm'),
        R('Heart-rate reserve|心率储备', v.m - v.r, 'bpm'),
      ];
    },
    'Target=resting+(maximum−resting)×intensity',
    [138, 130],
    'Enter an intensity approved for your circumstances. Medicines and health conditions can change heart-rate responses; this does not set a safe exercise zone.|请填写适合自身情况且经确认的强度；药物和健康状况可能改变心率反应，本工具不确定安全运动区间。',
  );
  D(
    'maximum-heart-rate-percentage',
    'Heart Rate Intensity Percentage|心率强度百分比',
    'Compare an observed heart rate with a measured maximum.|比较观测心率与实测最大心率。',
    [
      p('h', 'Observed heart rate (bpm)|观测心率（bpm）', 150),
      p('m', 'Measured maximum heart rate (bpm)|实测最大心率（bpm）', 200),
    ],
    (v) => [R('Percentage of entered maximum|占所填最大心率', (100 * v.h) / v.m, '%')],
    'Intensity=observed heart rate/maximum×100',
    [75],
  );
  D(
    'one-rep-max',
    'One Rep Max Estimate|一次最大重量估算',
    'Compare Epley and Brzycki estimates from a submaximal set.|由次最大组比较 Epley 与 Brzycki 重量估算。',
    [
      p('w', 'Lifted weight (kg)|举起重量（kg）', 60),
      i('r', 'Completed repetitions|完成次数', 5, 1, 10),
    ],
    (v) => [
      R('Epley estimate|Epley 估算', v.r === 1 ? v.w : v.w * (1 + v.r / 30), 'kg'),
      R('Brzycki estimate|Brzycki 估算', (v.w * 36) / (37 - v.r), 'kg'),
    ],
    'Epley=w(1+r/30) for r>1; Brzycki=36w/(37−r)',
    [70, 67.5],
    'Prediction only, not a recommendation to attempt the weight. Limited to 1–10 technically sound repetitions; fatigue, exercise type and training history affect accuracy.|仅为预测，不建议据此尝试该重量。限 1–10 次动作规范的重复；疲劳、动作类型与训练经历影响准确度。',
  );
  D(
    'session-training-load',
    'Session Training Load|单次训练负荷',
    'Multiply session duration by a perceived-exertion rating.|将训练时长乘以主观用力评分。',
    [
      n('t', 'Session duration (minutes)|训练时长（分钟）', 60),
      n('r', 'Session RPE from 0 to 10|单次 RPE（0–10）', 5, 0, 10),
    ],
    (v) => [R('Session load|单次训练负荷', v.t * v.r, 'AU')],
    'Session load=minutes×session RPE',
    [300],
  );
  D(
    'barbell-plate-loading',
    'Barbell Plate Loading|杠铃配片',
    'Find balanced plate pairs from an available set of denominations.|根据可用片重组合找到左右平衡的配片方案。',
    [
      n('t', 'Target total weight (kg)|目标总重量（kg）', 100),
      n('b', 'Bar weight (kg)|空杆重量（kg）', 20),
      text(
        'p',
        'Available plate sizes (kg), unlimited pairs|可用片重（kg，每种视为足量）',
        '20,10,5,2.5,1.25',
      ),
    ],
    (v) => {
      check(v.t >= v.b, 'Target must be at least the bar weight.|目标重量不得低于空杆重量。');
      const sizes = [...new Set(nums(v.p))].sort((a, b) => b - a);
      check(
        sizes.length <= 20 && sizes.every((x) => x > 0 && Number.isInteger(x * 100)),
        'Use up to 20 positive plate sizes with at most two decimal places.|最多 20 种正片重，且最多两位小数。',
      );
      const target = Math.round((v.t - v.b) * 50);
      check(
        Math.abs(target - (v.t - v.b) * 50) < 1e-7 && target <= 100000,
        'Target must fit 0.02 kg total increments and at most 2,000 kg added load.|总增量应为 0.02 kg 的整数倍，且加片不超过 2,000 kg。',
      );
      const dp = new Int32Array(target + 1).fill(1000000),
        prev = new Int32Array(target + 1).fill(-1);
      dp[0] = 0;
      for (let a = 1; a <= target; a++)
        for (let j = 0; j < sizes.length; j++) {
          const s = Math.round(sizes[j] * 100);
          if (a >= s && dp[a - s] + 1 < dp[a]) {
            dp[a] = dp[a - s] + 1;
            prev[a] = j;
          }
        }
      check(
        dp[target] < 1000000,
        'The exact target cannot be made with these plate sizes.|这些片重无法组成精确目标。',
      );
      const count = sizes.map(() => 0);
      for (let a = target; a > 0;) {
        const j = prev[a];
        count[j]++;
        a -= Math.round(sizes[j] * 100);
      }
      return [
        R(
          'Plates on each side|每侧配片',
          count
            .map((c, k) => (c ? c + ' × ' + sizes[k] + ' kg' : ''))
            .filter(Boolean)
            .join(' + ') || 'None|无需加片',
        ),
        R('Plate count per side|每侧片数', dp[target]),
        R('Total weight|总重量', v.t, 'kg'),
      ];
    },
    'Target each side=(total−bar)/2; integer dynamic programming minimizes plate count|每侧目标重量=(总重量−杠铃杆重量)/2；用整数动态规划求最少杠铃片数量。',
    ['2 × 20 kg', 2, 100],
    'Assumes enough matching pairs of each size. Collars are excluded; include their mass in bar weight if needed.|假设每种片重有足够成对片；不含卡扣，必要时将其质量计入空杆。',
  );
  D(
    'strength-bodyweight-ratio',
    'Strength to Bodyweight Ratio|力量体重比',
    'Express a lifted load as a multiple of body mass.|将举起重量表示为体重倍数。',
    [n('l', 'Lifted load (kg)|举起负荷（kg）', 100), weight],
    (v) => [R('Load / body mass|负荷体重比', v.l / v.w, '×')],
    'Relative strength=lifted load/body mass',
    [4 / 3],
  );
  D(
    'race-time-prediction',
    'Race Time Projection|比赛时间推算',
    'Project another distance using an editable endurance exponent.|使用可编辑耐力指数推算另一距离用时。',
    [
      p('d', 'Known distance (km)|已知距离（km）', 5),
      p('t', 'Known finish time (minutes)|已知完成时间（分钟）', 25),
      p('n', 'Target distance (km)|目标距离（km）', 10),
      n('e', 'Endurance exponent|耐力指数', 1.06, 0.5, 2),
    ],
    (v) => [
      R('Projected finish time|推算完成时间', v.t * (v.n / v.d) ** v.e, 'minutes'),
      R('Projected pace|推算配速', (v.t * (v.n / v.d) ** v.e) / v.n, 'min/km'),
    ],
    'T₂=T₁(D₂/D₁)ᵉ',
    [25 * 2 ** 1.06, 2.5 * 2 ** 1.06],
    'Empirical power-law projection; exponent 1.06 is only a starting assumption. Fitness, terrain, weather and distance affect accuracy.|经验幂律推算，1.06 仅为初始假设；体能、地形、天气及距离影响准确度。',
  );
  D(
    'running-splits',
    'Even Pace Running Splits|匀速跑步分段',
    'Calculate split duration and the final partial split.|计算匀速分段用时及最后不足一段的时间。',
    [
      p('d', 'Total distance (km)|总距离（km）', 10),
      p('t', 'Target finish time (minutes)|目标完成时间（分钟）', 50),
      p('s', 'Split length (km)|分段长度（km）', 1),
    ],
    (v) => {
      const count = Math.floor(v.d / v.s + 1e-12),
        rem = Math.max(0, v.d - count * v.s);
      return [
        R('Full split time|完整分段用时', (v.t / v.d) * v.s, 'minutes'),
        R('Full split count|完整段数', count),
        R('Final partial distance|最后不足一段距离', rem, 'km'),
        R('Final partial time|最后不足一段用时', (v.t / v.d) * rem, 'minutes'),
      ];
    },
    'Split time=total time×split distance/total distance',
    [5, 10, 0, 0],
  );
  D(
    'run-walk-interval',
    'Run Walk Intervals|跑走间歇',
    'Combine running and walking intervals into a session plan.|将跑步与步行间歇组合成训练时长与距离。',
    [
      p('r', 'Run minutes per cycle|每轮跑步分钟', 3),
      n('w', 'Walk minutes per cycle|每轮步行分钟', 1),
      i('n', 'Cycles|轮数', 10, 1, 10000),
      n('rs', 'Running speed (km/h)|跑步速度（km/h）', 10),
      n('ws', 'Walking speed (km/h)|步行速度（km/h）', 5),
    ],
    (v) => [
      R('Session duration|总时长', (v.r + v.w) * v.n, 'minutes'),
      R('Estimated distance|估计距离', ((v.r * v.rs + v.w * v.ws) * v.n) / 60, 'km'),
    ],
    'Time=n(run+walk); distance=n(runMinutes×runSpeed+walkMinutes×walkSpeed)/60',
    [40, 35 / 6],
  );
  D(
    'swimming-pace',
    'Swimming Pace|游泳配速',
    'Calculate pace per 100 metres and lengths in a pool.|计算每百米配速与泳池趟数。',
    [
      p('d', 'Swim distance (m)|游泳距离（m）', 1000),
      p('t', 'Elapsed time (minutes)|用时（分钟）', 20),
      p('l', 'Pool length (m)|泳池长度（m）', 25),
    ],
    (v) => [
      R('Pace per 100 m|每百米配速', (100 * v.t) / v.d, 'minutes'),
      R('Pool lengths|泳池趟数', v.d / v.l),
      R('Average speed|平均速度', v.d / v.t / 60, 'm/s'),
    ],
    'Pace100=100×minutes/distance',
    [2, 40, 5 / 6],
  );
  D(
    'cycling-power-weight',
    'Cycling Power to Weight|骑行功率体重比',
    'Compare cycling power with rider mass.|比较骑行功率与骑手体重。',
    [n('p', 'Measured power (W)|实测功率（W）', 250), weight],
    (v) => [R('Power to body mass|功率体重比', v.p / v.w, 'W/kg')],
    'Relative power=watts/body mass(kg)',
    [10 / 3],
  );
  D(
    'cycling-gearing-speed',
    'Cycling Gearing Speed|自行车齿比速度',
    'Convert cadence and gear ratio into theoretical road speed.|由踏频与齿比计算理论行驶速度。',
    [
      n('c', 'Cadence (rpm)|踏频（rpm）', 90),
      i('f', 'Front chainring teeth|前齿盘齿数', 50, 1, 200),
      i('r', 'Rear sprocket teeth|后飞轮齿数', 25, 1, 200),
      p('w', 'Wheel rollout circumference (m)|车轮实测周长（m）', 2.1),
    ],
    (v) => [
      R('Theoretical speed|理论速度', ((v.c * v.f) / v.r) * v.w * 0.06, 'km/h'),
      R('Distance per crank revolution|每转曲柄行进距离', (v.f / v.r) * v.w, 'm'),
    ],
    'Speed=cadence×front/rear×wheel circumference×0.06',
    [22.68, 4.2],
    'Assumes no wheel slip and accurate loaded wheel circumference; wind and gradients affect the power required.|假设车轮不打滑且负载轮周测量准确；风与坡度影响所需功率。',
  );
  D(
    'running-cadence-speed',
    'Running Cadence and Step Length|跑步步频步长',
    'Combine steps per minute and length per step.|结合每分钟步数与单步步长。',
    [
      n('c', 'Cadence (steps/min)|步频（步/分钟）', 180),
      p('s', 'Length per single step (m)|单步长度（m）', 1),
    ],
    (v) => [
      R('Running speed|跑步速度', v.c * v.s * 0.06, 'km/h'),
      R('Distance in one minute|一分钟距离', v.c * v.s, 'm'),
    ],
    'Speed=steps/min×metres/step×0.06',
    [10.8, 180],
    'A step is one foot contact, not a full two-step stride.|这里一步指一次脚触地，不是左右两步的完整步幅。',
  );
  D(
    'jump-height-flight-time',
    'Jump Height from Flight Time|腾空时间估计跳高',
    'Estimate vertical rise from a measured flight interval.|由测量腾空时间估计竖直上升高度。',
    [
      n('t', 'Flight time (seconds)|腾空时间（秒）', 0.5, 0, 3),
      p('g', 'Local gravity (m/s²)|当地重力加速度（m/s²）', 9.80665),
    ],
    (v) => [
      R('Estimated centre-of-mass rise|估计重心上升高度', ((v.g * v.t * v.t) / 8) * 100, 'cm'),
    ],
    'h=gt²/8',
    [30.64578125],
    'Assumes takeoff and landing centre-of-mass heights are equal, symmetric flight and no air resistance. Landing posture can bias this estimate.|假设起跳与落地重心等高、飞行对称且忽略空气阻力；落地姿势可能造成偏差。',
  );
  D(
    'training-monotony',
    'Weekly Training Monotony|周训练单调度',
    'Summarize seven daily load values, including rest days.|汇总含休息日在内的七天负荷。',
    [
      text(
        'x',
        'Exactly seven daily loads, include zeros for rest|恰好七天负荷（休息日填 0）',
        '100,200,300,0,100,200,500',
      ),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.length === 7 && a.every((x) => x >= 0),
        'Enter exactly seven nonnegative daily loads.|请输入恰好七个非负日负荷。',
      );
      const m = mean(a),
        sd = Math.sqrt(variance(a, false));
      return [
        R('Weekly total load|周总负荷', sum(a), 'AU'),
        R(
          'Monotony, population SD convention|单调度（总体标准差口径）',
          sd > 0 ? m / sd : 'Undefined at zero variability|无变化时无定义',
        ),
        R(
          'Training strain|训练应激',
          sd > 0 ? (sum(a) * m) / sd : 'Undefined at zero variability|无变化时无定义',
        ),
      ];
    },
    'Monotony=mean daily load/population SD; strain=weekly sum×monotony',
    [1400, Math.sqrt(7 / 4)],
    'Uses population SD of all seven days. Monitoring summary only; no injury prediction or safe-load threshold is inferred.|采用七天总体标准差，仅作监测汇总；不推断伤病概率或安全负荷阈值。',
  );
  D(
    'exercise-sweat-rate',
    'Exercise Sweat Rate Estimate|运动出汗率估计',
    'Estimate fluid loss from mass change, drinking and urine.|由体重变化、饮水与排尿估算体液损失。',
    [
      p('a', 'Pre-exercise mass (kg)|运动前体重（kg）', 75),
      p('b', 'Post-exercise mass (kg)|运动后体重（kg）', 74.5),
      n('d', 'Fluid consumed (L)|饮入液体（L）', 0.5),
      n('u', 'Urine produced (L)|排尿量（L）', 0),
      p('t', 'Exercise duration (hours)|运动时长（小时）', 1),
    ],
    (v) => {
      const loss = v.a - v.b + v.d - v.u;
      check(
        loss >= 0,
        'These measurements imply negative sweat loss; check mass, intake and urine.|这些测量推算为负出汗量，请核对体重、饮入与排尿。',
      );
      return [
        R('Estimated sweat rate|估计出汗率', loss / v.t, 'L/h'),
        R('Estimated sweat loss|估计出汗量', loss, 'L'),
      ];
    },
    'Loss(L)≈preMass−postMass+drink−urine; rate=loss/hours',
    [1, 1],
    'Approximation treats 1 kg mass change as 1 L and omits respiratory/metabolic changes. This is not a fluid or sodium intake prescription.|近似将 1 kg 质量变化视为 1 L，忽略呼吸与代谢变化；不构成补液或补钠处方。',
  );
  D(
    'macronutrient-energy',
    'Macronutrient Energy|三大营养素能量',
    'Convert entered protein, carbohydrate and fat grams to label-style energy.|将自填蛋白质、碳水与脂肪克数换算为常见标签能量。',
    [
      n('p', 'Protein (g)|蛋白质（g）', 30),
      n('c', 'Available carbohydrate (g)|可利用碳水（g）', 50),
      n('f', 'Fat (g)|脂肪（g）', 10),
    ],
    (v) => [
      R('Estimated energy|估计能量', 4 * v.p + 4 * v.c + 9 * v.f, 'kcal'),
      R('Protein energy|蛋白质能量', 4 * v.p, 'kcal'),
      R('Carbohydrate energy|碳水能量', 4 * v.c, 'kcal'),
      R('Fat energy|脂肪能量', 9 * v.f, 'kcal'),
    ],
    'Energy=4×protein+4×available carbohydrate+9×fat',
    [410, 120, 200, 90],
    'General 4/4/9 factors; fibre, sugar alcohols, organic acids and food-specific factors can differ. This does not recommend macro targets.|使用通用 4/4/9 系数；纤维、糖醇、有机酸及食物特定系数可能不同，不建议营养素目标。',
  );
  D(
    'food-energy-density',
    'Food Energy Density|食物能量密度',
    'Scale a serving’s energy to 100 grams or another serving weight.|将一份食物能量换算至每百克或其他份量。',
    [
      n('e', 'Energy in measured portion (kcal)|测量份能量（kcal）', 250),
      p('w', 'Measured portion mass (g)|测量份质量（g）', 100),
      n('s', 'Target serving mass (g)|目标份量（g）', 60),
    ],
    (v) => [
      R('Energy per 100 g|每百克能量', (100 * v.e) / v.w, 'kcal'),
      R('Target serving energy|目标份能量', (v.e * v.s) / v.w, 'kcal'),
    ],
    'Density=energy/mass; serving energy=density×serving mass',
    [250, 150],
  );
  D(
    'alcohol-content',
    'Alcohol Content in Grams|饮品纯酒精含量',
    'Convert drink volume and ABV to an estimated ethanol mass.|由饮品体积与酒精体积比估计纯酒精质量。',
    [
      n('v', 'Drink volume (mL)|饮品体积（mL）', 500),
      n('a', 'Alcohol by volume (%)|酒精体积比（%）', 5, 0, 100),
      p('s', 'Grams in your local standard drink|当地一标准杯酒精克数', 10),
    ],
    (v) => {
      const g = ((v.v * v.a) / 100) * 0.789;
      return [
        R('Pure alcohol mass|纯酒精质量', g, 'g'),
        R('Entered standard-drink equivalents|按自填标准杯折算', g / v.s),
      ];
    },
    'Ethanol(g)=volume(mL)×ABV×0.789 g/mL',
    [19.725, 1.9725],
    'Approximate ethanol density at room temperature. Standard-drink definitions vary; this does not estimate blood alcohol, driving fitness or a safe consumption limit.|使用室温近似酒精密度；标准杯定义因地区而异，不估计血液酒精、驾驶能力或安全饮用上限。',
  );
  D(
    'sleep-efficiency',
    'Sleep Efficiency|睡眠效率',
    'Compare estimated time asleep with time spent in bed.|比较估计睡着时长与在床时长。',
    [
      p('b', 'Time in bed (minutes)|在床时长（分钟）', 480),
      n('l', 'Sleep onset latency (minutes)|入睡等待（分钟）', 20),
      n('w', 'Awake after sleep onset (minutes)|入睡后清醒（分钟）', 40),
    ],
    (v) => {
      check(v.l + v.w <= v.b, 'Awake time cannot exceed time in bed.|清醒时间不得超过在床时长。');
      const t = v.b - v.l - v.w;
      return [
        R('Sleep efficiency|睡眠效率', (100 * t) / v.b, '%'),
        R('Estimated time asleep|估计睡着时长', t, 'minutes'),
      ];
    },
    'Efficiency=(time in bed−latency−awake time)/time in bed',
    [87.5, 420],
    'Self-reported estimate; not a sleep-disorder diagnosis or a replacement for a sleep study.|自我报告估算，不用于睡眠障碍诊断，也不能替代睡眠检查。',
  );
})();
