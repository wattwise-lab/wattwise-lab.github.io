(() => {
  'use strict';
  const { add, n, p, u, row: R, PI, rad } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Idealized classical model in SI units. Check sign conventions and assumptions; not a certified engineering design calculation.|使用 SI 单位的理想经典模型；请检查符号约定与假设，不是经认证的工程设计计算。',
  ) => add(s, name, 'Science', purpose, f, calc, formula, e, note);
  const mass = n('m', 'Mass (kg)|质量（kg）', 10),
    gravity = p('g', 'Gravity (m/s²)|重力加速度（m/s²）', 9.80665),
    speed = u('v', 'Velocity (m/s)|速度（m/s）', 5),
    angle = n('a', 'Angle (degrees)|夹角（度）', 0, -360, 360);
  D(
    'force',
    'Force from Mass and Acceleration|质量加速度求力',
    'Apply Newton’s second law on one axis.|在单一轴向应用牛顿第二定律。',
    [mass, u('a', 'Acceleration (m/s²)|加速度（m/s²）', 2)],
    (v) => [R('Net force|合力', v.m * v.a, 'N')],
    'F=ma',
    [20],
  );
  D(
    'weight-force',
    'Weight Force|重力大小',
    'Convert mass to weight under an entered gravitational field.|按自填重力场将质量转换为重力。',
    [mass, gravity],
    (v) => [R('Weight force|重力', v.m * v.g, 'N')],
    'W=mg',
    [98.0665],
  );
  D(
    'momentum',
    'Linear Momentum|线动量',
    'Calculate signed momentum along a single axis.|计算单一轴向带符号动量。',
    [mass, speed],
    (v) => [R('Momentum|动量', v.m * v.v, 'kg·m/s')],
    'p=mv',
    [50],
  );
  D(
    'impulse',
    'Impulse|冲量',
    'Calculate momentum change from a constant or average force.|由恒力或平均力计算动量变化。',
    [
      u('f', 'Average signed force (N)|平均带符号力（N）', 20),
      n('t', 'Duration (s)|持续时间（s）', 3),
    ],
    (v) => [R('Impulse|冲量', v.f * v.t, 'N·s')],
    'J=Faverage Δt',
    [60],
  );
  D(
    'kinetic-energy',
    'Kinetic Energy|动能',
    'Find translational kinetic energy at nonrelativistic speed.|计算非相对论速度下的平动动能。',
    [mass, speed],
    (v) => [R('Kinetic energy|动能', 0.5 * v.m * v.v * v.v, 'J')],
    'Ek=½mv²',
    [125],
  );
  D(
    'gravitational-potential-energy',
    'Gravitational Potential Energy|重力势能变化',
    'Calculate potential-energy change in a uniform gravitational field.|计算均匀重力场中的势能变化。',
    [mass, gravity, u('h', 'Height change (m)|高度变化（m）', 5)],
    (v) => [R('Potential energy change|势能变化', v.m * v.g * v.h, 'J')],
    'ΔU=mgΔh',
    [490.3325],
  );
  D(
    'mechanical-work',
    'Work by a Constant Force|恒力做功',
    'Find the component of constant force along displacement.|计算恒力沿位移方向所做的功。',
    [
      n('f', 'Force magnitude (N)|力大小（N）', 20),
      n('s', 'Displacement magnitude (m)|位移大小（m）', 5),
      angle,
    ],
    (v) => [R('Work|功', v.f * v.s * Math.cos(rad(v.a)), 'J')],
    'W=Fs cosθ',
    [100],
  );
  D(
    'mechanical-power',
    'Mechanical Power|机械功率',
    'Convert work over time to average mechanical power.|由做功与用时计算平均机械功率。',
    [u('w', 'Work (J)|功（J）', 1000), p('t', 'Duration (s)|用时（s）', 5)],
    (v) => [R('Average power|平均功率', v.w / v.t, 'W')],
    'P=W/t',
    [200],
  );
  D(
    'torque',
    'Torque|力矩',
    'Find torque magnitude from force, lever arm and included angle.|由力、力臂长度与夹角计算力矩大小。',
    [
      n('f', 'Force magnitude (N)|力大小（N）', 20),
      n('r', 'Radius to application point (m)|施力点半径（m）', 0.5),
      n('a', 'Included angle (degrees)|夹角（度）', 90, 0, 180),
    ],
    (v) => [R('Torque magnitude|力矩大小', v.f * v.r * Math.sin(rad(v.a)), 'N·m')],
    'τ=rF sinθ',
    [10],
  );
  D(
    'lever-equilibrium',
    'Lever Equilibrium|杠杆平衡',
    'Solve a perpendicular balancing force around a pivot.|求支点两侧垂直施力的平衡力。',
    [
      n('f', 'Known force (N)|已知力（N）', 100),
      p('a', 'Known lever arm (m)|已知力臂（m）', 0.5),
      p('b', 'Opposite lever arm (m)|另一力臂（m）', 2),
    ],
    (v) => [R('Balancing force|平衡力', (v.f * v.a) / v.b, 'N')],
    'F₁L₁=F₂L₂',
    [25],
  );
  D(
    'hookes-law',
    'Hooke’s Law Spring Force|胡克定律弹簧力',
    'Calculate restoring force for a linear elastic spring.|计算线性弹性弹簧的回复力。',
    [
      n('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200),
      u('x', 'Displacement from equilibrium (m)|相对平衡位置位移（m）', 0.1),
    ],
    (v) => [R('Restoring force|回复力', -v.k * v.x, 'N')],
    'F=−kx',
    [-20],
    'Linear elastic range only; sign is opposite displacement. Plastic deformation and spring mass are omitted.|仅限线弹性范围，力方向与位移相反；忽略塑性变形与弹簧质量。',
  );
  D(
    'spring-energy',
    'Elastic Spring Energy|弹簧弹性势能',
    'Find stored energy in an ideal linear spring.|计算理想线性弹簧的储能。',
    [
      n('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200),
      u('x', 'Extension or compression (m)|伸长或压缩量（m）', 0.1),
    ],
    (v) => [R('Stored elastic energy|储存弹性势能', 0.5 * v.k * v.x * v.x, 'J')],
    'U=½kx²',
    [1],
  );
  D(
    'friction-force',
    'Friction Force|摩擦力',
    'Compare kinetic friction with the maximum static-friction limit.|比较动摩擦力与最大静摩擦界限。',
    [
      n('n', 'Normal force (N)|法向力（N）', 100),
      n('k', 'Kinetic coefficient|动摩擦系数', 0.3, 0, 10),
      n('s', 'Static coefficient|静摩擦系数', 0.5, 0, 10),
    ],
    (v) => [
      R('Kinetic friction magnitude|动摩擦力大小', v.n * v.k, 'N'),
      R('Maximum static friction|最大静摩擦力', v.n * v.s, 'N'),
    ],
    'Fk=μkN; |Fs|≤μsN',
    [30, 50],
    'Static friction adjusts up to its limit; the maximum is not automatically the actual force.|静摩擦力会调整至所需值，但不超过上限；最大值不自动等于实际力。',
  );
  D(
    'centripetal-force',
    'Centripetal Force|向心力',
    'Find inward force and acceleration for circular motion.|求圆周运动的向心力与向心加速度。',
    [mass, n('v', 'Tangential speed (m/s)|切向速率（m/s）', 5), p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Inward net force|向心合力', (v.m * v.v * v.v) / v.r, 'N'),
      R('Centripetal acceleration|向心加速度', (v.v * v.v) / v.r, 'm/s²'),
    ],
    'F=mv²/r; a=v²/r',
    [125, 12.5],
  );
  D(
    'angular-velocity',
    'Angular Velocity|角速度',
    'Convert rotation frequency into angular and rim speed.|由转动频率求角速度与边缘线速度。',
    [u('f', 'Rotations per minute|每分钟转数', 60), n('r', 'Radius (m)|半径（m）', 0.5)],
    (v) => [
      R('Angular velocity|角速度', (v.f * 2 * PI) / 60, 'rad/s'),
      R('Rim velocity|边缘线速度', ((v.f * 2 * PI) / 60) * v.r, 'm/s'),
    ],
    'ω=2π rpm/60; v=ωr',
    [2 * PI, PI],
  );
  D(
    'angular-acceleration',
    'Angular Acceleration|角加速度',
    'Find average angular acceleration between two velocities.|由两个角速度求平均角加速度。',
    [
      u('a', 'Initial angular velocity (rad/s)|初始角速度（rad/s）', 2),
      u('b', 'Final angular velocity (rad/s)|最终角速度（rad/s）', 10),
      p('t', 'Elapsed time (s)|经过时间（s）', 4),
    ],
    (v) => [R('Average angular acceleration|平均角加速度', (v.b - v.a) / v.t, 'rad/s²')],
    'α=(ω₁−ω₀)/Δt',
    [2],
  );
  D(
    'rotational-energy',
    'Rotational Kinetic Energy|转动动能',
    'Calculate rotation energy from moment of inertia and angular velocity.|由转动惯量与角速度计算转动动能。',
    [
      n('i', 'Moment of inertia (kg·m²)|转动惯量（kg·m²）', 2),
      u('w', 'Angular velocity (rad/s)|角速度（rad/s）', 10),
    ],
    (v) => [R('Rotational energy|转动动能', 0.5 * v.i * v.w * v.w, 'J')],
    'E=½Iω²',
    [100],
  );
  D(
    'disk-moment-of-inertia',
    'Disk Moment of Inertia|圆盘转动惯量',
    'Find inertia of a uniform solid disk about its central normal axis.|计算均匀实心圆盘绕中心垂直轴的转动惯量。',
    [mass, n('r', 'Disk radius (m)|圆盘半径（m）', 0.5)],
    (v) => [R('Moment of inertia|转动惯量', 0.5 * v.m * v.r * v.r, 'kg·m²')],
    'I=½mr²',
    [1.25],
  );
  D(
    'projectile-range',
    'Projectile Range|抛体射程',
    'Model ideal flight landing at the launch height.|计算落点与起点等高的理想抛体运动。',
    [
      n('v', 'Launch speed (m/s)|发射速率（m/s）', 20),
      n('a', 'Launch elevation (degrees)|仰角（度）', 45, 0, 90),
      gravity,
    ],
    (v) => [
      R('Horizontal range|水平射程', (v.v * v.v * Math.sin(2 * rad(v.a))) / v.g, 'm'),
      R('Flight time|飞行时间', (2 * v.v * Math.sin(rad(v.a))) / v.g, 's'),
      R('Maximum rise|最高上升高度', (v.v * Math.sin(rad(v.a))) ** 2 / (2 * v.g), 'm'),
    ],
    'Range=v²sin(2θ)/g; time=2v sinθ/g',
    [400 / 9.80665, (20 * Math.SQRT2) / 9.80665, 100 / 9.80665],
    'Same launch and landing height, constant gravity, no drag, wind or Earth curvature.|起落等高、重力恒定，忽略阻力、风与地球曲率。',
  );
  D(
    'free-fall',
    'Free Fall from Rest|静止自由落体',
    'Estimate fall time and impact speed from a release height.|由释放高度估计自由落体时间与触地速率。',
    [n('h', 'Release height (m)|释放高度（m）', 20), gravity],
    (v) => [
      R('Fall time|下落时间', Math.sqrt((2 * v.h) / v.g), 's'),
      R('Impact speed magnitude|触地速率', Math.sqrt(2 * v.g * v.h), 'm/s'),
    ],
    't=√(2h/g); speed=√(2gh)',
    [Math.sqrt(40 / 9.80665), Math.sqrt(40 * 9.80665)],
    'Released from rest in uniform gravity, without drag. Not a fall-safety assessment.|均匀重力下从静止释放且忽略阻力，不用于坠落安全评估。',
  );
  D(
    'escape-velocity',
    'Escape Velocity|逃逸速度',
    'Estimate escape speed from a spherical gravitating body.|估算球形天体表面的逃逸速度。',
    [
      n('m', 'Central mass (kg)|中心天体质量（kg）', 5.972e24, 1, 1e40),
      p('r', 'Distance from centre (m)|距中心距离（m）', 6371000),
    ],
    (v) => [R('Escape speed|逃逸速度', Math.sqrt((2 * 6.6743e-11 * v.m) / v.r), 'm/s')],
    'v=√(2GM/r)',
    [Math.sqrt((2 * 6.6743e-11 * 5.972e24) / 6371000)],
    'Newtonian isolated spherical body; excludes atmosphere, rotation and other bodies. G=6.67430×10⁻¹¹ SI.|牛顿孤立球形天体模型，忽略大气、自转与其他天体；G=6.67430×10⁻¹¹（SI）。',
  );
  D(
    'universal-gravitation',
    'Universal Gravitation|万有引力',
    'Calculate mutual gravitational attraction between point masses.|计算点质量间的万有引力。',
    [
      n('a', 'Mass A (kg)|质量 A（kg）', 1000),
      n('b', 'Mass B (kg)|质量 B（kg）', 1000),
      p('r', 'Centre-to-centre separation (m)|质心间距离（m）', 1),
    ],
    (v) => [R('Attractive force|引力大小', (6.6743e-11 * v.a * v.b) / v.r ** 2, 'N')],
    'F=Gm₁m₂/r²',
    [0.000066743],
  );
  D(
    'pendulum-period',
    'Simple Pendulum Period|单摆周期',
    'Estimate the small-angle period of an ideal pendulum.|估计理想单摆的小角度周期。',
    [n('l', 'Pendulum length (m)|摆长（m）', 1), gravity],
    (v) => [R('Small-angle period|小角度周期', 2 * PI * Math.sqrt(v.l / v.g), 's')],
    'T=2π√(L/g)',
    [(2 * PI) / Math.sqrt(9.80665)],
    'Small amplitude, massless string, point bob, fixed pivot and no friction.|小振幅、无质量细绳、质点摆球、固定支点且无摩擦。',
  );
  D(
    'spring-oscillation-period',
    'Spring Oscillation Period|弹簧振子周期',
    'Find an ideal mass-spring system’s natural period.|计算理想质点弹簧系统的固有周期。',
    [mass, p('k', 'Spring stiffness (N/m)|弹簧刚度（N/m）', 200)],
    (v) => [
      R('Natural period|固有周期', 2 * PI * Math.sqrt(v.m / v.k), 's'),
      R('Natural frequency|固有频率', Math.sqrt(v.k / v.m) / (2 * PI), 'Hz'),
    ],
    'T=2π√(m/k)',
    [(2 * PI) / Math.sqrt(20), Math.sqrt(20) / (2 * PI)],
  );
  D(
    'elastic-collision',
    'One Dimensional Elastic Collision|一维弹性碰撞',
    'Solve final velocities for an isolated perfectly elastic collision.|求孤立系统完全弹性碰撞后的速度。',
    [
      p('a', 'Mass A (kg)|质量 A（kg）', 2),
      p('b', 'Mass B (kg)|质量 B（kg）', 2),
      u('u', 'Initial A velocity (m/s)|A 初速度（m/s）', 5),
      u('v', 'Initial B velocity (m/s)|B 初速度（m/s）', 0),
    ],
    (v) => [
      R('Final A velocity|A 末速度', ((v.a - v.b) * v.u + 2 * v.b * v.v) / (v.a + v.b), 'm/s'),
      R('Final B velocity|B 末速度', (2 * v.a * v.u + (v.b - v.a) * v.v) / (v.a + v.b), 'm/s'),
    ],
    'vA=[(mA−mB)uA+2mBuB]/(mA+mB); vB=[2mAuA+(mB−mA)uB]/(mA+mB)',
    [0, 5],
  );
})();
