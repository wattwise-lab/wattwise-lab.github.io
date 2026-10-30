(() => {
  'use strict';
  const { add, u, i, text, select, row: R, check, PI } = CMModels;
  function C(
    slug,
    name,
    purpose,
    units,
    from,
    to,
    x,
    expected,
    note = 'Conversion factors are defined relative to the displayed base unit. Input precision limits meaningful output precision; this does not change a physical quantity or perform a safety assessment.|换算系数相对于所示基本单位定义；输入精度决定有意义的输出精度，不改变物理量，也不进行安全评估。',
  ) {
    const options = units.map(([id, label]) => [id, label]),
      factor = (id) => units.find((x) => x[0] === id)[2];
    add(
      slug + '-converter',
      name,
      'Converters',
      purpose,
      [
        u('x', 'Value to convert|待换算数值', x),
        select('a', 'From unit|原单位', from, options),
        select('b', 'To unit|目标单位', to, options),
      ],
      (v) => [
        R(
          'Converted value|换算值',
          (v.x * factor(v.a)) / factor(v.b),
          units.find((x) => x[0] === v.b)[0],
        ),
        R('Value in base unit|基本单位数值', v.x * factor(v.a), units[0][0]),
      ],
      'result=input×factor(from)/factor(to); base unit: ' + units[0][0],
      [expected],
      note,
    );
  }
  C(
    'pressure',
    'Pressure Converter|压强单位换算',
    'Convert absolute or gauge pressure values without changing their reference.|换算绝对压强或表压数值，保持压力参考基准。',
    [
      ['Pa', 'Pa', 1],
      ['kPa', 'kPa', 1000],
      ['MPa', 'MPa', 1e6],
      ['bar', 'bar', 1e5],
      ['atm', 'atm', 101325],
      ['psi', 'psi', 6894.757293168361],
      ['Torr', 'Torr', 101325 / 760],
    ],
    'atm',
    'kPa',
    1,
    101.325,
  );
  C(
    'energy',
    'Energy Converter|能量单位换算',
    'Convert work, heat and electrical energy units.|换算功、热与电能单位。',
    [
      ['J', 'J', 1],
      ['kJ', 'kJ', 1000],
      ['MJ', 'MJ', 1e6],
      ['Wh', 'Wh', 3600],
      ['kWh', 'kWh', 3.6e6],
      ['cal-th', 'Calorie, thermochemical|热化学卡', 4.184],
      ['kcal-th', 'Kilocalorie, thermochemical|热化学千卡', 4184],
      ['eV', 'eV', 1.602176634e-19],
    ],
    'kWh',
    'MJ',
    1,
    3.6,
  );
  C(
    'power',
    'Power Converter|功率单位换算',
    'Convert power, including explicitly defined horsepower.|换算功率，并明确马力定义。',
    [
      ['W', 'W', 1],
      ['kW', 'kW', 1000],
      ['MW', 'MW', 1e6],
      ['hp-mech', 'Mechanical horsepower|机械马力', 745.6998715822702],
      ['PS', 'Metric horsepower|公制马力', 735.49875],
    ],
    'hp-mech',
    'W',
    1,
    745.6998715822702,
  );
  C(
    'force',
    'Force Converter|力单位换算',
    'Convert force independently of mass.|换算力单位，区别于质量。',
    [
      ['N', 'N', 1],
      ['kN', 'kN', 1000],
      ['dyn', 'dyn', 1e-5],
      ['lbf', 'lbf', 4.4482216152605],
      ['kgf', 'kgf', 9.80665],
    ],
    'kgf',
    'N',
    1,
    9.80665,
  );
  C(
    'angle',
    'Angle Converter|角度单位换算',
    'Convert plane angles, turns and angular minutes.|换算平面角、整周和角分角秒。',
    [
      ['rad', 'rad', 1],
      ['deg', 'Degrees|度', PI / 180],
      ['turn', 'Turns|周', 2 * PI],
      ['grad', 'Gradians|百分度', PI / 200],
      ['arcmin', 'Arcminutes|角分', PI / 10800],
      ['arcsec', 'Arcseconds|角秒', PI / 648000],
    ],
    'deg',
    'rad',
    180,
    PI,
  );
  C(
    'frequency',
    'Frequency Converter|频率单位换算',
    'Convert cycles per second and revolutions per minute.|换算每秒周期与每分钟转数。',
    [
      ['Hz', 'Hz', 1],
      ['kHz', 'kHz', 1000],
      ['MHz', 'MHz', 1e6],
      ['GHz', 'GHz', 1e9],
      ['rpm', 'rpm', 1 / 60],
    ],
    'rpm',
    'Hz',
    60,
    1,
  );
  C(
    'electric-charge',
    'Electric Charge Converter|电荷单位换算',
    'Convert coulombs, ampere hours and elementary charges.|换算库仑、安时与元电荷。',
    [
      ['C', 'C', 1],
      ['mC', 'mC', 0.001],
      ['µC', 'µC', 1e-6],
      ['nC', 'nC', 1e-9],
      ['Ah', 'Ah', 3600],
      ['mAh', 'mAh', 3.6],
      ['e', 'Elementary charges|元电荷', 1.602176634e-19],
    ],
    'Ah',
    'C',
    1,
    3600,
  );
  C(
    'voltage',
    'Voltage Converter|电压单位换算',
    'Convert electric potential differences with SI prefixes.|用 SI 前缀换算电势差。',
    [
      ['V', 'V', 1],
      ['mV', 'mV', 0.001],
      ['µV', 'µV', 1e-6],
      ['kV', 'kV', 1000],
      ['MV', 'MV', 1e6],
    ],
    'mV',
    'V',
    1000,
    1,
  );
  C(
    'electric-current',
    'Electric Current Converter|电流单位换算',
    'Convert electric-current scales with SI prefixes.|用 SI 前缀换算电流量级。',
    [
      ['A', 'A', 1],
      ['mA', 'mA', 0.001],
      ['µA', 'µA', 1e-6],
      ['nA', 'nA', 1e-9],
      ['kA', 'kA', 1000],
    ],
    'mA',
    'A',
    250,
    0.25,
  );
  C(
    'resistance',
    'Resistance Converter|电阻单位换算',
    'Convert ohms and their decimal multiples.|换算欧姆及其十进制倍数。',
    [
      ['Ω', 'Ω', 1],
      ['mΩ', 'mΩ', 0.001],
      ['µΩ', 'µΩ', 1e-6],
      ['kΩ', 'kΩ', 1000],
      ['MΩ', 'MΩ', 1e6],
      ['GΩ', 'GΩ', 1e9],
    ],
    'kΩ',
    'Ω',
    4.7,
    4700,
  );
  C(
    'capacitance',
    'Capacitance Converter|电容单位换算',
    'Convert farads, microfarads, nanofarads and picofarads.|换算法拉、微法、纳法与皮法。',
    [
      ['F', 'F', 1],
      ['mF', 'mF', 1e-3],
      ['µF', 'µF', 1e-6],
      ['nF', 'nF', 1e-9],
      ['pF', 'pF', 1e-12],
    ],
    'µF',
    'nF',
    1,
    1000,
  );
  C(
    'inductance',
    'Inductance Converter|电感单位换算',
    'Convert henrys and their decimal submultiples.|换算亨利及其十进制分数单位。',
    [
      ['H', 'H', 1],
      ['mH', 'mH', 1e-3],
      ['µH', 'µH', 1e-6],
      ['nH', 'nH', 1e-9],
    ],
    'mH',
    'µH',
    1,
    1000,
  );
  C(
    'density',
    'Density Converter|密度单位换算',
    'Convert mass per volume across metric and customary units.|换算公制与英制质量密度。',
    [
      ['kg/m³', 'kg/m³', 1],
      ['g/cm³', 'g/cm³', 1000],
      ['g/mL', 'g/mL', 1000],
      ['kg/L', 'kg/L', 1000],
      ['lb/ft³', 'lb/ft³', 0.45359237 / 0.028316846592],
      ['lb/US-gal', 'Pounds per US gallon|磅/美制加仑', 0.45359237 / 0.003785411784],
    ],
    'g/cm³',
    'kg/m³',
    1,
    1000,
  );
  C(
    'volume-flow',
    'Volume Flow Converter|体积流量单位换算',
    'Convert volumetric flow with explicit US and imperial gallons.|换算体积流量，明确美制与英制加仑。',
    [
      ['m³/s', 'm³/s', 1],
      ['m³/h', 'm³/h', 1 / 3600],
      ['L/s', 'L/s', 0.001],
      ['L/min', 'L/min', 0.001 / 60],
      ['US-gal/min', 'US gallons/min|美制加仑/分钟', 0.003785411784 / 60],
      ['imp-gal/min', 'Imperial gallons/min|英制加仑/分钟', 0.00454609 / 60],
      ['ft³/min', 'ft³/min', 0.028316846592 / 60],
    ],
    'L/min',
    'm³/h',
    60,
    3.6,
  );
  C(
    'torque',
    'Torque Converter|力矩单位换算',
    'Convert turning moments without treating them as energy.|换算转动力矩，保持其与能量的物理区别。',
    [
      ['N·m', 'N·m', 1],
      ['N·cm', 'N·cm', 0.01],
      ['lbf·ft', 'lbf·ft', 4.4482216152605 * 0.3048],
      ['lbf·in', 'lbf·in', 4.4482216152605 * 0.0254],
      ['kgf·m', 'kgf·m', 9.80665],
    ],
    'lbf·ft',
    'N·m',
    1,
    1.3558179483314003,
  );
  C(
    'acceleration',
    'Acceleration Converter|加速度单位换算',
    'Convert acceleration and standard gravity units.|换算加速度及标准重力倍数。',
    [
      ['m/s²', 'm/s²', 1],
      ['ft/s²', 'ft/s²', 0.3048],
      ['g0', 'Standard gravity|标准重力', 9.80665],
      ['Gal', 'Gal', 0.01],
    ],
    'g0',
    'm/s²',
    1,
    9.80665,
  );
  C(
    'dynamic-viscosity',
    'Dynamic Viscosity Converter|动力黏度单位换算',
    'Convert dynamic viscosity, including poise and centipoise.|换算动力黏度，包括泊与厘泊。',
    [
      ['Pa·s', 'Pa·s', 1],
      ['mPa·s', 'mPa·s', 0.001],
      ['P', 'Poise|泊', 0.1],
      ['cP', 'Centipoise|厘泊', 0.001],
    ],
    'cP',
    'Pa·s',
    1,
    0.001,
  );
  C(
    'kinematic-viscosity',
    'Kinematic Viscosity Converter|运动黏度单位换算',
    'Convert kinematic viscosity, including stokes and centistokes.|换算运动黏度，包括斯托克斯与厘斯。',
    [
      ['m²/s', 'm²/s', 1],
      ['mm²/s', 'mm²/s', 1e-6],
      ['St', 'Stokes|斯托克斯', 1e-4],
      ['cSt', 'Centistokes|厘斯', 1e-6],
    ],
    'cSt',
    'mm²/s',
    10,
    10,
  );
  C(
    'thermal-conductivity',
    'Thermal Conductivity Converter|导热系数单位换算',
    'Convert thermal conductivity with clearly defined heat units.|换算导热系数并明确热量单位定义。',
    [
      ['W/(m·K)', 'W/(m·K)', 1],
      ['mW/(m·K)', 'mW/(m·K)', 0.001],
      ['W/(cm·K)', 'W/(cm·K)', 100],
      ['cal-th/(s·cm·K)', 'Thermochemical cal/(s·cm·K)|热化学卡/(秒·厘米·K)', 418.4],
    ],
    'W/(cm·K)',
    'W/(m·K)',
    1,
    100,
  );
  C(
    'heat-flux',
    'Heat Flux Converter|热流密度单位换算',
    'Convert heat flow per unit area.|换算单位面积热流。',
    [
      ['W/m²', 'W/m²', 1],
      ['kW/m²', 'kW/m²', 1000],
      ['W/cm²', 'W/cm²', 10000],
      ['W/ft²', 'W/ft²', 1 / 0.09290304],
    ],
    'W/cm²',
    'kW/m²',
    1,
    10,
  );
  C(
    'illuminance',
    'Illuminance Converter|照度单位换算',
    'Convert lux, foot-candles and phot.|换算勒克斯、英尺烛光与辐透。',
    [
      ['lx', 'Lux|勒克斯', 1],
      ['fc', 'Foot-candles|英尺烛光', 1 / 0.09290304],
      ['ph', 'Phot|辐透', 10000],
    ],
    'fc',
    'lx',
    1,
    10.763910416709722,
  );
  C(
    'radioactivity',
    'Radioactivity Converter|放射性活度单位换算',
    'Convert decay activity units independently of absorbed dose.|换算衰变活度，保持其与吸收剂量的区别。',
    [
      ['Bq', 'Bq', 1],
      ['kBq', 'kBq', 1000],
      ['MBq', 'MBq', 1e6],
      ['GBq', 'GBq', 1e9],
      ['Ci', 'Ci', 3.7e10],
      ['mCi', 'mCi', 3.7e7],
      ['µCi', 'µCi', 3.7e4],
    ],
    'mCi',
    'MBq',
    1,
    37,
    'Activity is decays per second, not dose or health risk. No conversion to gray or sievert is performed.|活度表示每秒衰变次数，不是剂量或健康风险，不换算至戈瑞或希沃特。',
  );
  C(
    'absorbed-dose',
    'Absorbed Dose Converter|吸收剂量单位换算',
    'Convert gray and rad without assuming biological weighting.|换算戈瑞与拉德，不假定生物权重。',
    [
      ['Gy', 'Gy', 1],
      ['mGy', 'mGy', 0.001],
      ['µGy', 'µGy', 1e-6],
      ['rad', 'rad', 0.01],
    ],
    'rad',
    'mGy',
    1,
    10,
    'Absorbed energy per mass only. Gray is not interchangeable with sievert without radiation and tissue weighting. Not a medical dose calculation.|仅换算单位质量吸收能量，未经辐射与组织加权，戈瑞不能与希沃特互换；不用于医疗剂量计算。',
  );
  add(
    'number-base-converter',
    'Integer Number Base Converter|整数进制换算',
    'Converters',
    'Convert exact signed integers between bases 2 and 36.|在 2–36 进制间精确换算带符号整数。',
    [
      text('x', 'Integer digits, optional minus sign|整数数字，可带负号', 'FF'),
      i('a', 'Input base|原进制', 16, 2, 36),
      i('b', 'Output base|目标进制', 10, 2, 36),
    ],
    (v) => {
      let s = String(v.x).trim().toUpperCase(),
        negative = s.startsWith('-');
      if (negative) s = s.slice(1);
      check(
        s.length > 0 && s.length <= 1000 && /^[0-9A-Z]+$/.test(s),
        'Use 1–1,000 valid integer digits, without prefixes or separators.|请输入 1–1,000 位合法整数数字，不加前缀或分隔符。',
      );
      let value = 0n;
      for (const ch of s) {
        const d = parseInt(ch, 36);
        check(d < v.a, 'A digit is not valid in the input base.|某个数字不适用于原进制。');
        value = value * BigInt(v.a) + BigInt(d);
      }
      if (negative) value = -value;
      return [R('Converted integer|换算后的整数', value.toString(v.b).toUpperCase())];
    },
    'Accumulate value=value×inputBase+digit using exact integers, then divide by outputBase',
    ['255'],
    'Integer-only exact conversion. Letters A–Z represent digits 10–35; fractions and two’s-complement encodings are excluded.|仅精确换算整数，字母 A–Z 表示 10–35；不含小数与补码编码。',
  );
  add(
    'roman-numeral-converter',
    'Roman Numeral Converter|罗马数字换算',
    'Converters',
    'Convert integers into conventional subtractive Roman numerals.|将整数转换为常见减法式罗马数字。',
    [i('x', 'Integer from 1 to 3,999|1–3,999 的整数', 2026, 1, 3999)],
    (v) => {
      let x = v.x,
        out = '';
      for (const [a, s] of [
        [1000, 'M'],
        [900, 'CM'],
        [500, 'D'],
        [400, 'CD'],
        [100, 'C'],
        [90, 'XC'],
        [50, 'L'],
        [40, 'XL'],
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
      ])
        while (x >= a) {
          out += s;
          x -= a;
        }
      return [R('Roman numeral|罗马数字', out)];
    },
    'Greedy subtractive symbols: M, CM, D, CD, C, XC, L, XL, X, IX, V, IV, I',
    ['MMXXVI'],
    'Modern conventional notation for 1–3,999 only; historical variants and overbar notation are excluded.|仅支持 1–3,999 的现代常见写法，不含历史变体与上划线记数。',
  );
})();
