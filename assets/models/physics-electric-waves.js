(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, PI, rad, deg } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized SI-unit educational model. Real components, tolerances, losses and safe operating limits require separate verification.|使用 SI 单位的理想教育模型；实际元件、容差、损耗与安全工作界限需要另行核实。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const hz = n('f', 'Frequency (Hz)|频率（Hz）', 50),
    ke = 8.9875517923e9,
    h = 6.62607015e-34,
    c = 299792458,
    eV = 1.602176634e-19;
  const positiveList = (s) => {
    const a = nums(s);
    check(
      a.every((x) => x > 0),
      'All component values must be positive.|所有元件值应大于零。',
    );
    return a;
  };
  D(
    'electric-power',
    'DC Electric Power|直流电功率',
    'Calculate electrical power and energy from voltage and current.|由电压与电流计算电功率和耗能。',
    [
      n('v', 'Voltage (V)|电压（V）', 12),
      n('i', 'Current (A)|电流（A）', 2),
      n('t', 'Operating time (hours)|工作时长（小时）', 5),
    ],
    (v) => [
      R('Physical power|功率', v.v * v.i, 'W'),
      R('Energy consumed|耗电量', (v.v * v.i * v.t) / 1000, 'kWh'),
    ],
    'Use P = VI and E = Pt/1000. V is voltage in V, I is current in A, and t is operating hours. Power P is in W and consumed energy E is in kWh.|使用 P = VI 及 E = Pt/1000。变量 V 为电压（V），I 为电流（A），t 为工作小时；功率 P 的单位为 W，耗电量 E 的单位为 kWh。',
    [24, 0.12],
  );
  D(
    'series-resistance',
    'Series Resistance|串联电阻',
    'Add ideal resistors carrying the same current.|合并承载相同电流的理想串联电阻。',
    [text('x', 'Resistor values (Ω)|各电阻（Ω）', '1,2,3')],
    (v) => [R('Equivalent resistance|等效电阻', sum(positiveList(v.x)), 'Ω')],
    'Use Rₑ = ΣRᵢ. Each Rᵢ is a positive series resistor value in Ω. The equivalent resistance Rₑ uses the same unit; the sum covers every entered resistor.|使用 Rₑ = ΣRᵢ。每个 Rᵢ 为正的串联电阻值（Ω）；等效电阻 Rₑ 使用相同单位，对所有自填电阻求和。',
    [6],
  );
  D(
    'parallel-resistance',
    'Parallel Resistance|并联电阻',
    'Combine ideal resistors sharing the same voltage.|合并承受相同电压的理想并联电阻。',
    [text('x', 'Resistor values (Ω)|各电阻（Ω）', '10,20')],
    (v) => [R('Equivalent resistance|等效电阻', 1 / sum(positiveList(v.x).map((x) => 1 / x)), 'Ω')],
    'Use Rₑ = 1/Σ(1/Rᵢ). Each Rᵢ is a positive parallel resistor value in Ω. Sum their reciprocals, then take the reciprocal again for equivalent resistance Rₑ.|使用 Rₑ = 1/Σ(1/Rᵢ)。每个 Rᵢ 为正的并联电阻值（Ω）；先将倒数相加，再取倒数，得到等效电阻 Rₑ。',
    [20 / 3],
  );
  D(
    'voltage-divider',
    'Voltage Divider|电阻分压',
    'Find unloaded output voltage across the lower divider resistor.|求无负载分压器下侧电阻电压。',
    [
      u('v', 'Input voltage (V)|输入电压（V）', 12),
      p('a', 'Upper resistor R1 (Ω)|上侧电阻 R1（Ω）', 1000),
      p('b', 'Lower resistor R2 (Ω)|下侧电阻 R2（Ω）', 2000),
    ],
    (v) => [R('Unloaded output voltage|无负载输出电压', (v.v * v.b) / (v.a + v.b), 'V')],
    'Use Vₒ = VᵢR₂/(R₁+R₂). Vᵢ is input voltage, R₁ is the upper resistor, and R₂ is the lower resistor in the same resistance unit. Output Vₒ is measured across the lower resistor without a load.|使用 Vₒ = VᵢR₂/(R₁+R₂)。Vᵢ 为输入电压，R₁ 为上侧电阻，R₂ 为同电阻单位的下侧电阻；输出 Vₒ 为无负载时下侧电阻两端电压。',
    [8],
    'Assumes no output load. A load changes the lower equivalent resistance and output.|假设输出无负载；负载会改变下侧等效电阻与输出。',
  );
  D(
    'current-divider',
    'Current Divider|电流分流',
    'Split total current between two parallel resistors.|计算两个并联电阻的支路电流。',
    [
      u('i', 'Total current (A)|总电流（A）', 3),
      p('a', 'Branch A resistance (Ω)|A 支路电阻（Ω）', 10),
      p('b', 'Branch B resistance (Ω)|B 支路电阻（Ω）', 20),
    ],
    (v) => [
      R('Branch A current|A 支路电流', (v.i * v.b) / (v.a + v.b), 'A'),
      R('Branch B current|B 支路电流', (v.i * v.a) / (v.a + v.b), 'A'),
    ],
    'Use Iₐ = IRᵦ/(Rₐ+Rᵦ) and Iᵦ = IRₐ/(Rₐ+Rᵦ). I is total current. Rₐ and Rᵦ are the parallel branch resistances in the same unit; each current result uses the input current unit.|使用 Iₐ = IRᵦ/(Rₐ+Rᵦ) 及 Iᵦ = IRₐ/(Rₐ+Rᵦ)。I 为总电流，Rₐ 与 Rᵦ 为同单位并联支路电阻；各支路电流使用输入电流的单位。',
    [2, 1],
  );
  D(
    'capacitor-energy',
    'Capacitor Energy|电容储能',
    'Calculate charge and stored energy in an ideal capacitor.|计算理想电容的电荷与储能。',
    [n('c', 'Capacitance (µF)|电容量（µF）', 1000), u('v', 'Voltage (V)|电压（V）', 12)],
    (v) => [
      R('Stored energy|储存能量', 0.5 * v.c * 1e-6 * v.v * v.v, 'J'),
      R('Charge|电荷量', v.c * 1e-6 * v.v, 'C'),
    ],
    'E=½CV²; Q=CV',
    [0.072, 0.012],
  );
  D(
    'series-capacitance',
    'Series Capacitance|串联电容',
    'Combine ideal capacitors in series.|合并理想串联电容。',
    [text('x', 'Capacitor values (µF)|各电容（µF）', '10,20')],
    (v) => [
      R('Equivalent capacitance|等效电容', 1 / sum(positiveList(v.x).map((x) => 1 / x)), 'µF'),
    ],
    'Use Cₑ = 1/Σ(1/Cᵢ). Each Cᵢ is a positive series capacitance in µF. Sum reciprocals and take the reciprocal again; equivalent capacitance Cₑ remains in µF.|使用 Cₑ = 1/Σ(1/Cᵢ)。每个 Cᵢ 为正的串联电容值（µF）；先将倒数相加再取倒数，等效电容 Cₑ 仍使用 µF。',
    [20 / 3],
  );
  D(
    'parallel-capacitance',
    'Parallel Capacitance|并联电容',
    'Combine ideal capacitors in parallel.|合并理想并联电容。',
    [text('x', 'Capacitor values (µF)|各电容（µF）', '10,20')],
    (v) => [R('Equivalent capacitance|等效电容', sum(positiveList(v.x)), 'µF')],
    'Use Cₑ = ΣCᵢ. Each Cᵢ is a positive parallel capacitance in µF. Sum all entered values for equivalent capacitance Cₑ in the same unit.|使用 Cₑ = ΣCᵢ。每个 Cᵢ 为正的并联电容值（µF）；将所有输入值相加，得到相同单位的等效电容 Cₑ。',
    [30],
  );
  D(
    'rc-time-constant',
    'RC Time Constant|RC 时间常数',
    'Find capacitor charging time scales for an ideal RC circuit.|求理想 RC 电路电容充电的时间尺度。',
    [n('r', 'Resistance (Ω)|电阻（Ω）', 1000), n('c', 'Capacitance (µF)|电容（µF）', 100)],
    (v) => [
      R('Time constant|时间常数', v.r * v.c * 1e-6, 's'),
      R(
        'Time to 99% of step voltage|达到阶跃电压 99% 用时',
        -Math.log(0.01) * v.r * v.c * 1e-6,
        's',
      ),
    ],
    'τ=RC; t99=−τln(0.01)',
    [0.1, 0.460517018598809],
  );
  D(
    'rl-time-constant',
    'RL Time Constant|RL 时间常数',
    'Find current rise time scales in an ideal series RL circuit.|求理想串联 RL 电路电流上升时间尺度。',
    [
      n('l', 'Inductance (mH)|电感（mH）', 100),
      p('r', 'Total series resistance (Ω)|总串联电阻（Ω）', 10),
    ],
    (v) => [
      R('Time constant|时间常数', v.l / 1000 / v.r, 's'),
      R(
        'Time to 99% of final current|达到最终电流 99% 用时',
        (-Math.log(0.01) * v.l) / 1000 / v.r,
        's',
      ),
    ],
    'τ=L/R',
    [0.01, 0.0460517018598809],
  );
  D(
    'lc-resonance',
    'LC Resonant Frequency|LC 谐振频率',
    'Find natural resonance of ideal inductance and capacitance.|求理想电感电容的固有谐振频率。',
    [p('l', 'Inductance (mH)|电感（mH）', 10), p('c', 'Capacitance (nF)|电容（nF）', 100)],
    (v) => [
      R('Resonant frequency|谐振频率', 1 / (2 * PI * Math.sqrt(v.l * 1e-3 * v.c * 1e-9)), 'Hz'),
    ],
    'f₀=1/(2π√LC)',
    [5032.921210448704],
  );
  D(
    'inductive-reactance',
    'Inductive Reactance|感抗',
    'Calculate frequency-dependent ideal inductor reactance.|计算理想电感随频率变化的感抗。',
    [hz, n('l', 'Inductance (mH)|电感（mH）', 100)],
    (v) => [R('Inductive reactance|感抗', (2 * PI * v.f * v.l) / 1000, 'Ω')],
    'XL=2πfL',
    [10 * PI],
  );
  D(
    'capacitive-reactance',
    'Capacitive Reactance|容抗',
    'Calculate ideal capacitor reactance at a positive frequency.|计算正频率下理想电容的容抗。',
    [p('f', 'Frequency (Hz)|频率（Hz）', 50), p('c', 'Capacitance (µF)|电容（µF）', 100)],
    (v) => [R('Capacitive reactance magnitude|容抗大小', 1 / (2 * PI * v.f * v.c * 1e-6), 'Ω')],
    '|XC|=1/(2πfC)',
    [100 / PI],
  );
  D(
    'ac-series-impedance',
    'AC Series Impedance|交流串联阻抗',
    'Combine resistance and opposing series reactances.|合并电阻及相反方向的串联电抗。',
    [
      n('r', 'Resistance (Ω)|电阻（Ω）', 30),
      n('l', 'Inductive reactance (Ω)|感抗（Ω）', 40),
      n('c', 'Capacitive reactance magnitude (Ω)|容抗大小（Ω）', 0),
    ],
    (v) => {
      const x = v.l - v.c,
        z = Math.hypot(v.r, x);
      check(z > 0, 'Zero impedance has no defined phase angle.|零阻抗没有确定相位角。');
      return [
        R('Impedance magnitude|阻抗大小', z, 'Ω'),
        R('Impedance phase|阻抗相位', deg(Math.atan2(x, v.r)), '°'),
        R('Power factor magnitude|功率因数大小', v.r / z),
      ];
    },
    'Z=R+j(XL−XC); |Z|=√[R²+(XL−XC)²]',
    [50, 53.13010235415598, 0.6],
  );
  D(
    'electric-charge-flow',
    'Electric Charge from Current|电流电荷量',
    'Integrate a constant or average electric current over time.|将恒定或平均电流乘以持续时间。',
    [u('i', 'Average current (A)|平均电流（A）', 2), n('t', 'Duration (s)|持续时间（s）', 60)],
    (v) => [
      R('Charge transferred|通过电荷量', v.i * v.t, 'C'),
      R('Charge in ampere hours|安时电量', (v.i * v.t) / 3600, 'Ah'),
    ],
    'Q=It',
    [120, 1 / 30],
  );
  D(
    'coulomb-force',
    'Coulomb Force|库仑力',
    'Find electrostatic force magnitude between point charges in vacuum.|求真空中点电荷间的静电力大小。',
    [
      u('a', 'Charge A (µC)|电荷 A（µC）', 2),
      u('b', 'Charge B (µC)|电荷 B（µC）', 3),
      p('r', 'Separation (m)|距离（m）', 0.1),
    ],
    (v) => [
      R('Force magnitude|力大小', (ke * Math.abs(v.a * v.b) * 1e-12) / v.r ** 2, 'N'),
      R(
        'Interaction|相互作用',
        v.a * v.b > 0
          ? 'Repulsive|排斥'
          : v.a * v.b < 0
            ? 'Attractive|吸引'
            : 'No electrostatic interaction|无静电相互作用',
      ),
    ],
    '|F|=ke|q₁q₂|/r²',
    [5.39253107538, 'Repulsive|排斥'],
  );
  D(
    'point-charge-field',
    'Point Charge Electric Field|点电荷电场',
    'Find the radial electric field of a point charge in vacuum.|求真空点电荷的径向电场。',
    [u('q', 'Charge (nC)|电荷（nC）', 1), p('r', 'Radial distance (m)|径向距离（m）', 0.1)],
    (v) => [R('Outward signed electric field|向外为正的电场', (ke * v.q * 1e-9) / v.r ** 2, 'N/C')],
    'Er=ke q/r²',
    [898.75517923],
  );
  D(
    'magnetic-charge-force',
    'Magnetic Force on a Charge|运动电荷磁力',
    'Find magnetic force magnitude from velocity and field angle.|由速度与磁场夹角求磁力大小。',
    [
      u('q', 'Charge (µC)|电荷（µC）', 2),
      n('v', 'Speed (m/s)|速率（m/s）', 1000),
      n('b', 'Magnetic flux density (T)|磁感应强度（T）', 0.5),
      n('a', 'Velocity-field angle (degrees)|速度与磁场夹角（度）', 90, 0, 180),
    ],
    (v) => [
      R(
        'Magnetic force magnitude|磁力大小',
        Math.abs(v.q) * 1e-6 * v.v * v.b * Math.sin(rad(v.a)),
        'N',
      ),
    ],
    'Use F = abs(q)vB sinθ. q is charge converted from µC to C, v is speed in m/s, B is magnetic flux density in T, and θ is the velocity-field angle in degrees. abs means absolute value; force magnitude is in N.|使用 F = abs(q)vB sinθ。q 为从 µC 换算成 C 的电荷，v 为速率（m/s），B 为磁感应强度（T），θ 为速度与磁场夹角（度）；abs 表示绝对值，力大小的单位为 N。',
    [0.001],
  );
  D(
    'ideal-transformer',
    'Ideal Transformer Ratio|理想变压器变比',
    'Convert AC voltage by primary and secondary winding counts.|按初次级匝数换算交流电压。',
    [
      n('v', 'Primary RMS voltage (V)|初级有效电压（V）', 230),
      i('p', 'Primary turns|初级匝数', 1000, 1, 1000000),
      i('s', 'Secondary turns|次级匝数', 100, 1, 1000000),
    ],
    (v) => [
      R('Secondary RMS voltage|次级有效电压', (v.v * v.s) / v.p, 'V'),
      R('Primary / secondary turns|初次级匝数比', v.p / v.s),
    ],
    'Vs/Vp=Ns/Np',
    [23, 10],
    'Ideal AC transformer; excludes losses, saturation, insulation and current ratings. Not applicable to steady DC.|理想交流变压器，忽略损耗、饱和、绝缘与额定电流，不适用于稳态直流。',
  );
  D(
    'battery-runtime',
    'Battery Runtime Estimate|电池续航估算',
    'Estimate usable energy and constant-load runtime.|估计可用电量与恒定负载续航。',
    [
      p('v', 'Nominal battery voltage (V)|电池标称电压（V）', 12),
      n('a', 'Capacity (Ah)|容量（Ah）', 100),
      n('d', 'Usable depth of discharge (%)|可用放电深度（%）', 80, 0, 100),
      n('e', 'Conversion efficiency (%)|转换效率（%）', 90, 0, 100),
      p('p', 'Constant load power (W)|恒定负载功率（W）', 100),
    ],
    (v) => {
      const e = (((v.v * v.a * v.d) / 100) * v.e) / 100;
      return [
        R('Estimated runtime|估计续航', e / v.p, 'hours'),
        R('Delivered usable energy|输出可用能量', e, 'Wh'),
      ];
    },
    'Use t = VCfη/P. V is nominal voltage in V, C is capacity in Ah, f is usable discharge fraction, η is conversion efficiency as a fraction, and P is constant load in W. Runtime t is in hours.|使用 t = VCfη/P。变量 V 为标称电压（V），C 为容量（Ah），f 为可用放电比例，η 为转换效率的小数比例，P 为恒定负载（W）；续航 t 的单位为小时。',
    [8.64, 864],
    'Ignores rate-dependent capacity, ageing, temperature, voltage sag, standby losses and battery management limits.|忽略倍率容量变化、老化、温度、压降、待机损耗与电池管理限制。',
  );
  D(
    'wave-speed',
    'Wave Speed|波速',
    'Combine frequency and wavelength.|结合频率与波长求波速。',
    [n('f', 'Frequency (Hz)|频率（Hz）', 50), n('l', 'Wavelength (m)|波长（m）', 2)],
    (v) => [R('Wave speed|波速', v.f * v.l, 'm/s')],
    'v=fλ',
    [100],
  );
  D(
    'doppler-frequency',
    'Doppler Observed Frequency|多普勒观测频率',
    'Estimate a sound-frequency shift along one line.|估计一条直线上的声频变化。',
    [
      p('f', 'Emitted frequency (Hz)|发射频率（Hz）', 1000),
      p('c', 'Sound speed in medium (m/s)|介质声速（m/s）', 343),
      u('o', 'Observer speed toward source (m/s)|观察者朝向声源速度（m/s）', 0),
      u('s', 'Source speed toward observer (m/s)|声源朝向观察者速度（m/s）', 34.3),
    ],
    (v) => {
      check(
        Math.abs(v.o) < v.c && Math.abs(v.s) < v.c,
        'Use subsonic speeds relative to the medium.|相对介质速度应低于声速。',
      );
      return [R('Observed frequency|观测频率', (v.f * (v.c + v.o)) / (v.c - v.s), 'Hz')];
    },
    'Use fₒ = fₛ(c+vₒ)/(c−vₛ). fₛ is emitted frequency, c is sound speed in the medium, vₒ is observer velocity toward the source, and vₛ is source velocity toward the observer. Velocities share a unit; both moving speeds must be subsonic.|使用 fₒ = fₛ(c+vₒ)/(c−vₛ)。fₛ 为发射频率，c 为介质声速，vₒ 为观察者朝向声源速度，vₛ 为声源朝向观察者速度；速度使用相同单位，两个运动速率均须低于声速。',
    [10000 / 9],
    'Collinear classical sound model in a stationary medium; positive velocities approach. Not relativistic light Doppler.|静止介质中共线经典声学模型，接近速度为正；不是光的相对论多普勒模型。',
  );
  D(
    'sound-intensity-level',
    'Sound Intensity Level|声强级',
    'Convert sound intensity to a reference-relative decibel level.|将声强换算为相对参考值的分贝级。',
    [
      p('x', 'Sound intensity (W/m²)|声强（W/m²）', 1e-6),
      n('r', 'Reference intensity (W/m²)|参考声强（W/m²）', 1e-12, 1e-30, 1e15),
    ],
    (v) => [R('Sound intensity level|声强级', 10 * Math.log10(v.x / v.r), 'dB')],
    'Use L = 10log₁₀(I/Iᵣ). I is sound intensity and Iᵣ is reference intensity in the same unit. Sound intensity level L is in dB.|使用 L = 10log₁₀(I/Iᵣ)。I 为声强，Iᵣ 为同单位参考声强；声强级 L 的单位为 dB。',
    [60],
    'Intensity level is not automatically A-weighted sound pressure or a hearing-exposure assessment.|声强级不自动等于 A 计权声压级，也不是听力暴露评估。',
  );
  D(
    'combined-decibel-level',
    'Combined Decibel Level|分贝声级叠加',
    'Add independent incoherent levels measured on the same basis.|叠加使用相同口径测量的独立非相干声级。',
    [text('x', 'Independent levels (dB)|各独立声级（dB）', '60,60')],
    (v) => {
      const a = nums(v.x),
        m = Math.max(...a);
      return [
        R(
          'Combined level|合计声级',
          m + 10 * Math.log10(sum(a.map((x) => 10 ** ((x - m) / 10)))),
          'dB',
        ),
      ];
    },
    'Use L = 10log₁₀[Σ10^(Lᵢ/10)]. Lᵢ are independent incoherent levels in dB, sharing the same reference, weighting and location. The combined level L uses the same basis.|使用 L = 10log₁₀[Σ10^(Lᵢ/10)]。Lᵢ 为独立非相干声级（dB），须使用相同参考、计权与位置；合计声级 L 使用同一口径。',
    [63.01029995663981],
    'All levels must use the same reference, weighting and observation location. Coherent sources require phase information.|所有声级应使用相同参考、计权与观测位置；相干声源还需相位信息。',
  );
  D(
    'thin-lens',
    'Thin Lens Image|薄透镜成像',
    'Solve image distance and magnification using signed distances.|用带符号距离求像距与放大率。',
    [
      u('f', 'Focal length (cm), converging positive|焦距（cm，凸透镜为正）', 10),
      u('d', 'Object distance (cm), real object positive|物距（cm，实物为正）', 30),
    ],
    (v) => {
      check(
        v.f !== 0 && v.d !== 0 && Math.abs(v.d - v.f) > 1e-12,
        'Focal and object distances must be nonzero; an object at the focal plane forms an image at infinity.|焦距与物距非零；物体在焦平面时像在无穷远。',
      );
      const d = (v.f * v.d) / (v.d - v.f);
      return [
        R('Signed image distance|带符号像距', d, 'cm'),
        R('Lateral magnification|横向放大率', -d / v.d),
      ];
    },
    'Use 1/f = 1/dₒ+1/dᵢ and m = −dᵢ/dₒ. f is focal length, dₒ is object distance, and dᵢ is image distance in the same unit. A converging focal length and real object distance are positive; m is lateral magnification.|使用 1/f = 1/dₒ+1/dᵢ 及 m = −dᵢ/dₒ。f 为焦距，dₒ 为物距，dᵢ 为同单位像距；会聚透镜焦距和实物物距为正，m 为横向放大率。',
    [15, -0.5],
    'Paraxial thin lens in air; positive image distance is real, negative is virtual. Aberrations and lens thickness excluded.|空气中近轴薄透镜模型，像距正为实像、负为虚像；忽略像差与厚度。',
  );
  D(
    'snells-law',
    'Snell Refraction Angle|斯涅尔折射角',
    'Apply refraction at a flat interface between two media.|计算两介质平面界面的折射角。',
    [
      p('a', 'Incident refractive index|入射介质折射率', 1),
      p('b', 'Transmitted refractive index|透射介质折射率', 1.5),
      n('t', 'Incident angle from normal (degrees)|与法线夹角（度）', 30, 0, 90),
    ],
    (v) => {
      const s = (v.a / v.b) * Math.sin(rad(v.t));
      return [
        R(
          'Refraction angle|折射角',
          s > 1 ? 'Total internal reflection|全内反射' : deg(Math.asin(s)),
          '°',
        ),
      ];
    },
    'Use n₁sinθ₁ = n₂sinθ₂. n₁ and n₂ are incident and transmitted refractive indices; θ₁ and θ₂ are angles from the normal. Angles are entered and displayed in degrees. If refraction has no real angle, the result identifies total internal reflection.|使用 n₁sinθ₁ = n₂sinθ₂。n₁ 与 n₂ 为入射及透射介质折射率，θ₁ 与 θ₂ 为相对法线的夹角；输入和显示角度均使用度，若不存在实数折射角，结果标示全内反射。',
    [19.47122063449069],
  );
  D(
    'critical-angle',
    'Critical Angle|全反射临界角',
    'Find the critical angle from a denser optical medium.|求由高折射率介质射出的全反射临界角。',
    [
      p('a', 'Incident refractive index|入射介质折射率', 1.5),
      p('b', 'Transmitted refractive index|透射介质折射率', 1),
    ],
    (v) => {
      check(
        v.a > v.b,
        'Critical angle requires incident index greater than transmitted index.|临界角要求入射介质折射率大于透射介质。',
      );
      return [R('Critical angle from normal|与法线临界夹角', deg(Math.asin(v.b / v.a)), '°')];
    },
    'Use θ = asin(n₂/n₁). n₁ is incident refractive index and n₂ is transmitted refractive index, with n₁ > n₂. The critical angle is measured from the normal and displayed in degrees.|使用 θ = asin(n₂/n₁)。n₁ 为入射介质折射率，n₂ 为透射介质折射率，并要求 n₁ > n₂；临界角相对法线测量，以度显示。',
    [41.810314895778596],
  );
  D(
    'photon-energy',
    'Photon Energy|光子能量',
    'Convert vacuum wavelength into single-photon energy.|将真空波长换算为单光子能量。',
    [p('l', 'Vacuum wavelength (nm)|真空波长（nm）', 500)],
    (v) => {
      const energy = (h * c) / (v.l * 1e-9);
      return [
        R('Photon energy|光子能量', energy, 'J'),
        R('Photon energy in electronvolts|电子伏能量', energy / eV, 'eV'),
        R('Frequency|频率', c / (v.l * 1e-9), 'Hz'),
      ];
    },
    'E=hc/λ; f=c/λ',
    [3.972891714297857e-19, 2.479683968664005, 5.99584916e14],
  );
  D(
    'de-broglie-wavelength',
    'De Broglie Wavelength|德布罗意波长',
    'Estimate nonrelativistic matter wavelength from mass and speed.|由质量与速率估计非相对论物质波长。',
    [
      p('m', 'Mass in units of 10⁻³⁰ kg|质量（10⁻³⁰ kg）', 0.91093837015),
      p('v', 'Speed (m/s)|速率（m/s）', 1000000),
    ],
    (v) => {
      check(
        v.v < c * 0.1,
        'Use speed below 0.1c for this nonrelativistic approximation.|此非相对论近似要求速率低于 0.1c。',
      );
      return [R('Matter wavelength|物质波长', (h / (v.m * 1e-30 * v.v)) * 1e9, 'nm')];
    },
    'λ=h/(mv)',
    [0.727389510325698],
  );
  D(
    'diffraction-grating',
    'Diffraction Grating Angle|光栅衍射角',
    'Find the angle of a diffraction order at normal incidence.|求垂直入射光栅的指定级次衍射角。',
    [
      p('d', 'Slit spacing (µm)|缝距（µm）', 1),
      p('l', 'Wavelength (nm)|波长（nm）', 500),
      i('m', 'Diffraction order|衍射级次', 1, -1000, 1000),
    ],
    (v) => {
      const s = (v.m * v.l) / (1000 * v.d);
      check(
        Math.abs(s) <= 1,
        'This order cannot propagate: |mλ/d| exceeds 1.|该级次不能传播：|mλ/d| 大于 1。',
      );
      return [R('Diffraction angle|衍射角', deg(Math.asin(s)), '°')];
    },
    'Use d sinθ = mλ. d is slit spacing, λ is wavelength converted to the same length unit, and m is diffraction order. The angle is displayed in degrees; an order beyond the real-angle range is rejected.|使用 d sinθ = mλ。d 为缝距，λ 为换算至相同长度单位的波长，m 为衍射级次；角度以度显示，超出实数角度范围的级次会被拒绝。',
    [30],
  );
})();
