(() => {
  'use strict';
  const { add, n, p, u, row: R, check, PI } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized SI-unit model for educational estimates. Confirm material properties, boundary conditions and applicability before engineering use.|使用 SI 单位的理想化教育估算模型；工程使用前应确认材料参数、边界条件与适用范围。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const density = p('d', 'Density (kg/m³)|密度（kg/m³）', 1000),
    gravity = p('g', 'Gravity (m/s²)|重力加速度（m/s²）', 9.80665),
    area = p('a', 'Cross-sectional area (m²)|截面积（m²）', 0.01),
    radius = p('r', 'Pipe inner radius (m)|管内半径（m）', 0.01),
    temp = p('t', 'Absolute temperature (K)|绝对温度（K）', 300),
    Rgas = 8.31446261815324;
  D(
    'density',
    'Density from Mass and Volume|质量体积求密度',
    'Calculate average mass per unit volume.|计算平均单位体积质量。',
    [n('m', 'Mass (kg)|质量（kg）', 10), p('v', 'Volume (m³)|体积（m³）', 0.002)],
    (v) => [R('Average density|平均密度', v.m / v.v, 'kg/m³')],
    'ρ=m/V',
    [5000],
  );
  D(
    'pressure',
    'Pressure from Force|受力压强',
    'Distribute perpendicular force over an area.|将垂直作用力分摊至面积。',
    [n('f', 'Normal force (N)|垂直作用力（N）', 100), area],
    (v) => [R('Average pressure|平均压强', v.f / v.a, 'Pa')],
    'P=F/A',
    [10000],
  );
  D(
    'hydrostatic-pressure',
    'Hydrostatic Pressure|静水压强',
    'Calculate fluid pressure with depth and surface pressure.|由深度与表面压力计算静止流体压强。',
    [
      density,
      gravity,
      n('h', 'Depth below surface (m)|液面下深度（m）', 10),
      n('s', 'Absolute surface pressure (Pa)|液面绝对压强（Pa）', 101325),
    ],
    (v) => [
      R('Gauge pressure increase|表压增量', v.d * v.g * v.h, 'Pa'),
      R('Absolute pressure|绝对压强', v.s + v.d * v.g * v.h, 'Pa'),
    ],
    'Pabsolute=Psurface+ρgh',
    [98066.5, 199391.5],
  );
  D(
    'buoyant-force',
    'Buoyant Force|浮力',
    'Apply displaced-fluid volume to Archimedes’ principle.|用排开流体体积应用阿基米德原理。',
    [density, n('v', 'Displaced volume (m³)|排开体积（m³）', 0.01), gravity],
    (v) => [R('Buoyant force|浮力', v.d * v.v * v.g, 'N')],
    'Fb=ρfluid Vdisplaced g',
    [98.0665],
  );
  D(
    'volumetric-flow-rate',
    'Volumetric Flow Rate|体积流量',
    'Combine section area and mean flow speed.|结合截面积与平均流速。',
    [area, u('v', 'Mean signed velocity (m/s)|平均带符号流速（m/s）', 2)],
    (v) => [
      R('Volume flow rate|体积流量', v.a * v.v, 'm³/s'),
      R('Flow in litres per minute|每分钟升数', v.a * v.v * 60000, 'L/min'),
    ],
    'Q=Av',
    [0.02, 1200],
  );
  D(
    'pipe-flow-speed',
    'Pipe Flow Speed|管内流速',
    'Convert pipe flow rate and bore into average speed.|由管流量与内径求平均流速。',
    [
      n('q', 'Volume flow (L/min)|体积流量（L/min）', 60),
      p('d', 'Inner diameter (mm)|内径（mm）', 20),
    ],
    (v) => [R('Average speed|平均流速', v.q / 60000 / (PI * (v.d / 2000) ** 2), 'm/s')],
    'v=Q/[π(d/2)²]',
    [10 / PI],
  );
  D(
    'continuity-equation',
    'Flow Continuity|流动连续性',
    'Find downstream velocity for incompressible steady flow.|求不可压缩稳态流的下游流速。',
    [
      p('a', 'Upstream area (m²)|上游面积（m²）', 0.02),
      u('v', 'Upstream velocity (m/s)|上游流速（m/s）', 2),
      p('b', 'Downstream area (m²)|下游面积（m²）', 0.01),
    ],
    (v) => [
      R('Downstream velocity|下游流速', (v.a * v.v) / v.b, 'm/s'),
      R('Volume flow|体积流量', v.a * v.v, 'm³/s'),
    ],
    'A₁v₁=A₂v₂',
    [4, 0.04],
  );
  D(
    'bernoulli-pressure',
    'Bernoulli Pressure Change|伯努利压强变化',
    'Estimate downstream pressure from speed and elevation changes.|由流速与高度变化估算下游压强。',
    [
      density,
      n('p', 'Upstream absolute pressure (Pa)|上游绝对压强（Pa）', 200000),
      n('a', 'Upstream speed (m/s)|上游速率（m/s）', 2),
      n('b', 'Downstream speed (m/s)|下游速率（m/s）', 4),
      u('h', 'Downstream elevation minus upstream (m)|下游减上游高度（m）', 1),
      gravity,
    ],
    (v) => {
      const p = v.p + 0.5 * v.d * (v.a * v.a - v.b * v.b) - v.d * v.g * v.h;
      check(
        p >= 0,
        'The ideal model implies negative absolute pressure; these conditions are physically inconsistent.|理想模型得到负绝对压强，条件在物理上不一致。',
      );
      return [R('Downstream pressure|下游压强', p, 'Pa')];
    },
    'P₂=P₁+½ρ(v₁²−v₂²)−ρg(h₂−h₁)',
    [184193.35],
    'Steady, incompressible, inviscid flow along one streamline; no pump, turbine or pipe loss. Does not check cavitation.|沿同一流线稳态、不可压、无黏流；无泵、涡轮或管损，不检查气蚀。',
  );
  D(
    'reynolds-number',
    'Reynolds Number|雷诺数',
    'Compare inertia and viscosity in an entered flow scale.|比较所填流动尺度下的惯性与黏性。',
    [
      density,
      n('v', 'Mean speed (m/s)|平均速率（m/s）', 1),
      p('l', 'Characteristic length (m)|特征长度（m）', 0.01),
      p('mu', 'Dynamic viscosity (Pa·s)|动力黏度（Pa·s）', 0.001),
    ],
    (v) => [R('Reynolds number|雷诺数', (v.d * v.v * v.l) / v.mu)],
    'Re=ρvL/μ',
    [10000],
    'Characteristic length and transition thresholds depend on geometry; this tool does not classify every flow with a pipe-only threshold.|特征长度与转捩阈值取决于几何形状，本工具不将圆管阈值用于所有流动。',
  );
  D(
    'poiseuille-flow',
    'Laminar Pipe Flow|层流圆管流量',
    'Estimate viscous flow through a fully developed circular pipe.|估算充分发展圆管层流的黏性流量。',
    [
      radius,
      p('l', 'Pipe length (m)|管长（m）', 1),
      n('p', 'Pressure drop (Pa)|压降（Pa）', 100),
      p('mu', 'Dynamic viscosity (Pa·s)|动力黏度（Pa·s）', 0.001),
    ],
    (v) => [R('Volume flow rate|体积流量', (PI * v.r ** 4 * v.p) / (8 * v.mu * v.l), 'm³/s')],
    'Q=πr⁴ΔP/(8μL)',
    [PI * 0.000125],
    'Hagen–Poiseuille law: Newtonian incompressible fluid, rigid straight circular pipe, steady fully developed laminar flow; entrance losses excluded.|Hagen–Poiseuille 定律：牛顿不可压流体、刚性直圆管、稳态充分发展层流，不含入口损失。',
  );
  D(
    'drag-force',
    'Drag Force|阻力',
    'Estimate aerodynamic or hydrodynamic drag from an entered coefficient.|用自填阻力系数估计气动或水动阻力。',
    [
      p('d', 'Fluid density (kg/m³)|流体密度（kg/m³）', 1.225),
      n('v', 'Relative speed (m/s)|相对速率（m/s）', 10),
      n('c', 'Drag coefficient|阻力系数', 0.5),
      n('a', 'Reference frontal area (m²)|参考迎风面积（m²）', 1),
    ],
    (v) => [R('Drag force magnitude|阻力大小', 0.5 * v.d * v.v * v.v * v.c * v.a, 'N')],
    'Fd=½ρv²CdA',
    [30.625],
  );
  D(
    'mach-number',
    'Mach Number|马赫数',
    'Compare flow speed with local sound speed.|比较流速与当地声速。',
    [
      n('v', 'Flow speed (m/s)|流动速率（m/s）', 340),
      p('c', 'Local speed of sound (m/s)|当地声速（m/s）', 340),
    ],
    (v) => [R('Mach number|马赫数', v.v / v.c)],
    'M=v/c',
    [1],
  );
  D(
    'sensible-heat',
    'Sensible Heat Energy|显热能量',
    'Calculate energy for a temperature change without a phase transition.|计算无相变温度变化所需能量。',
    [
      n('m', 'Mass (kg)|质量（kg）', 2),
      p('c', 'Specific heat (J/kg·K)|比热容（J/kg·K）', 4184),
      u('d', 'Temperature change (K)|温差（K）', 10),
    ],
    (v) => [R('Heat transferred|传递热量', v.m * v.c * v.d, 'J')],
    'Q=mcΔT',
    [83680],
  );
  D(
    'linear-thermal-expansion',
    'Linear Thermal Expansion|线性热膨胀',
    'Estimate length change with constant expansion coefficient.|按恒定膨胀系数估计长度变化。',
    [
      n('l', 'Original length (m)|原始长度（m）', 2),
      u('a', 'Expansion coefficient (10⁻⁶/K)|膨胀系数（10⁻⁶/K）', 12),
      u('t', 'Temperature change (K)|温差（K）', 50),
    ],
    (v) => {
      const d = v.l * v.a * 1e-6 * v.t;
      check(
        v.l + d >= 0,
        'Resulting length cannot be negative; the linear approximation is outside its range.|结果长度不能为负，线性近似已超出范围。',
      );
      return [R('Length change|长度变化', d, 'm'), R('Final length|最终长度', v.l + d, 'm')];
    },
    'ΔL=αL₀ΔT',
    [0.0012, 2.0012],
  );
  D(
    'ideal-gas-pressure',
    'Ideal Gas Pressure|理想气体压强',
    'Apply the ideal gas equation in absolute temperature.|以绝对温度应用理想气体状态方程。',
    [
      n('n', 'Amount of substance (mol)|物质的量（mol）', 1),
      temp,
      p('v', 'Volume (m³)|体积（m³）', 0.025),
    ],
    (v) => [R('Absolute pressure|绝对压强', (v.n * Rgas * v.t) / v.v, 'Pa')],
    'P=nRT/V; R=8.31446261815324 J/(mol·K)',
    [99773.5514178389],
  );
  D(
    'combined-gas-law',
    'Combined Gas Law|综合气体定律',
    'Find a final volume when pressure and temperature change.|在气体量固定时由压强与温度变化求末体积。',
    [
      p('p', 'Initial absolute pressure (Pa)|初始绝对压强（Pa）', 100000),
      p('v', 'Initial volume (L)|初始体积（L）', 10),
      p('t', 'Initial temperature (K)|初始温度（K）', 300),
      p('q', 'Final absolute pressure (Pa)|最终绝对压强（Pa）', 200000),
      p('s', 'Final temperature (K)|最终温度（K）', 300),
    ],
    (v) => [R('Final volume|最终体积', (v.p * v.v * v.s) / (v.q * v.t), 'L')],
    'P₁V₁/T₁=P₂V₂/T₂',
    [5],
  );
  D(
    'thermal-conduction',
    'Steady Thermal Conduction|稳态导热',
    'Estimate one-dimensional heat flow across a flat material layer.|估计平板材料层的一维热传导。',
    [
      n('k', 'Thermal conductivity (W/m·K)|导热系数（W/m·K）', 0.04),
      n('a', 'Layer area (m²)|层面积（m²）', 10),
      p('l', 'Layer thickness (m)|层厚（m）', 0.1),
      u('d', 'Hot minus cold temperature (K)|热侧减冷侧温差（K）', 20),
    ],
    (v) => [R('Heat flow rate|热流率', (v.k * v.a * v.d) / v.l, 'W')],
    'Qdot=kAΔT/L',
    [80],
  );
  D(
    'convective-heat-transfer',
    'Convective Heat Transfer|对流换热',
    'Estimate heat flow between a surface and a fluid.|估计表面与流体间的换热。',
    [
      n('h', 'Convection coefficient (W/m²·K)|对流换热系数（W/m²·K）', 10),
      n('a', 'Surface area (m²)|表面积（m²）', 2),
      u('d', 'Surface minus fluid temperature (K)|表面减流体温差（K）', 20),
    ],
    (v) => [R('Heat flow rate|热流率', v.h * v.a * v.d, 'W')],
    'Qdot=hA(Tsurface−Tfluid)',
    [400],
  );
  D(
    'thermal-radiation',
    'Thermal Radiation|热辐射净功率',
    'Estimate radiation exchange with large surrounding surfaces.|估计与大环境表面间的辐射换热。',
    [
      n('e', 'Surface emissivity|表面发射率', 0.9, 0, 1),
      n('a', 'Area (m²)|面积（m²）', 1),
      p('t', 'Surface absolute temperature (K)|表面绝对温度（K）', 400),
      p('s', 'Surrounding absolute temperature (K)|环境绝对温度（K）', 300),
    ],
    (v) => [
      R(
        'Net outward radiation|向外净辐射功率',
        v.e * 5.670374419e-8 * v.a * (v.t ** 4 - v.s ** 4),
        'W',
      ),
    ],
    'Qdot=εσA(T⁴−Tsurroundings⁴)',
    [893.0839709925],
    'Gray diffuse surface in a large isothermal enclosure, view factor 1; convection and conduction excluded.|灰体漫反射表面处于大型等温包围环境，视角因子为 1；不含对流与导热。',
  );
  D(
    'carnot-efficiency',
    'Carnot Efficiency Limit|卡诺效率极限',
    'Find the theoretical heat-engine efficiency limit.|求热机理论最高效率。',
    [
      p('h', 'Hot reservoir temperature (K)|高温热源（K）', 600),
      p('c', 'Cold reservoir temperature (K)|低温热源（K）', 300),
    ],
    (v) => {
      check(
        v.h > v.c,
        'Hot reservoir must be hotter than cold reservoir.|高温热源温度必须高于低温热源。',
      );
      return [R('Theoretical maximum efficiency|理论最高效率', 100 * (1 - v.c / v.h), '%')];
    },
    'ηmax=1−Tcold/Thot',
    [50],
    'Absolute temperatures required. Real engines have additional losses and lower efficiency.|必须使用绝对温度；实际热机还存在其他损失，效率更低。',
  );
  D(
    'mixture-equilibrium-temperature',
    'Mixture Equilibrium Temperature|混合平衡温度',
    'Mix two masses with constant heat capacities and no heat loss.|计算两种恒定比热材料无热损混合温度。',
    [
      p('a', 'Mass A (kg)|A 质量（kg）', 1),
      p('c', 'Specific heat A (J/kg·K)|A 比热容（J/kg·K）', 4184),
      u('t', 'Initial A temperature (°C)|A 初温（°C）', 80),
      p('b', 'Mass B (kg)|B 质量（kg）', 3),
      p('d', 'Specific heat B (J/kg·K)|B 比热容（J/kg·K）', 4184),
      u('s', 'Initial B temperature (°C)|B 初温（°C）', 20),
    ],
    (v) => {
      check(
        v.t >= -273.15 && v.s >= -273.15,
        'Temperatures cannot be below absolute zero.|温度不能低于绝对零度。',
      );
      return [
        R(
          'Equilibrium temperature|平衡温度',
          (v.a * v.c * v.t + v.b * v.d * v.s) / (v.a * v.c + v.b * v.d),
          '°C',
        ),
      ];
    },
    'Tf=(mAcATA+mBcBTB)/(mAcA+mBcB)',
    [35],
    'Insulated mixture, constant heat capacities, no container heat, no reaction and no phase change.|绝热混合、比热恒定，忽略容器吸热、反应及相变。',
  );
  D(
    'latent-heat',
    'Latent Heat|相变潜热',
    'Estimate energy for a phase change at constant temperature.|估计恒温相变所需热量。',
    [
      n('m', 'Mass transformed (kg)|相变质量（kg）', 2),
      n('l', 'Specific latent heat (J/kg)|比潜热（J/kg）', 334000),
    ],
    (v) => [R('Phase-change energy magnitude|相变能量大小', v.m * v.l, 'J')],
    'Q=mL',
    [668000],
  );
  D(
    'ideal-gas-density',
    'Ideal Gas Density|理想气体密度',
    'Find ideal gas density from molar mass, pressure and temperature.|由摩尔质量、压强与温度求理想气体密度。',
    [
      p('p', 'Absolute pressure (Pa)|绝对压强（Pa）', 101325),
      p('m', 'Molar mass (g/mol)|摩尔质量（g/mol）', 28.97),
      temp,
    ],
    (v) => [R('Ideal gas density|理想气体密度', (v.p * v.m) / 1000 / (Rgas * v.t), 'kg/m³')],
    'ρ=PM/(RT), M in kg/mol',
    [1.1768189899],
  );
  D(
    'thermal-resistance',
    'Thermal Resistance of Layers|多层热阻',
    'Combine layer thicknesses and conductivities into area-normalized resistance.|合并材料层厚度与导热系数，求单位面积热阻。',
    [
      textField('l', 'Layer thicknesses (m)|各层厚度（m）', '0.1,0.2'),
      textField('k', 'Conductivities (W/m·K)|各层导热系数（W/m·K）', '0.04,0.2'),
    ],
    (v) => {
      const a = CMModels.nums(v.l),
        b = CMModels.nums(v.k);
      check(
        a.length === b.length && a.every((x) => x >= 0) && b.every((x) => x > 0),
        'Use equal lists, nonnegative thickness and positive conductivity.|两列应等长，厚度非负，导热系数为正。',
      );
      const r = CMModels.sum(a.map((x, k) => x / b[k]));
      check(r > 0, 'Total thermal resistance must be positive.|总热阻应大于零。');
      return [
        R('Area-normalized resistance|单位面积热阻', r, 'm²·K/W'),
        R('Conductance U without surface films|不含表面热阻的 U 值', 1 / r, 'W/m²·K'),
      ];
    },
    'R=ΣLᵢ/kᵢ; U=1/R',
    [3.5, 2 / 7],
    'One-dimensional steady layers with perfect contact. Surface films, thermal bridges and moisture effects are excluded.|一维稳态层状材料、接触理想；不含表面热阻、热桥与水分影响。',
  );
  function textField(id, label, value) {
    return CMModels.text(id, label, value);
  }
  D(
    'ideal-gas-molar-volume',
    'Ideal Gas Molar Volume|理想气体摩尔体积',
    'Calculate volume occupied per mole under chosen conditions.|计算指定温压下每摩尔理想气体占据体积。',
    [temp, p('p', 'Absolute pressure (Pa)|绝对压强（Pa）', 100000)],
    (v) => [R('Molar volume|摩尔体积', ((Rgas * v.t) / v.p) * 1000, 'L/mol')],
    'Vm=RT/P',
    [24.9433878544597],
  );
})();
