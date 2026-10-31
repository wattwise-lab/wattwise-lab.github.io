(() => {
  'use strict';
  const { add, n, p, i, text, select, row: R, check, nums, sum, PI, deg } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Planning estimate from your measurements and assumptions. Confirm dimensions, product coverage and local installation requirements before buying.|按自填测量与假设进行规划估算；采购前请核实尺寸、产品覆盖率及当地安装要求。',
  ) => add(s, name, 'Home and Everyday', purpose, f, calc, formula, e, note);
  const area = p('a', 'Net area (m²)|净面积（m²）', 20),
    waste = n('w', 'Waste allowance (%)|损耗余量（%）', 10, 0, 100);
  D(
    'tile-quantity',
    'Tile Quantity|瓷砖数量',
    'Convert a floor area into tiles, boxes and waste allowance.|将铺设面积换算为瓷砖、箱数与损耗余量。',
    [
      area,
      p('l', 'Tile length (cm)|瓷砖长度（cm）', 50),
      p('b', 'Tile width (cm)|瓷砖宽度（cm）', 50),
      i('q', 'Tiles per box|每箱片数', 8, 1, 1000),
      waste,
    ],
    (v) => {
      const q = Math.ceil((v.a * (1 + v.w / 100)) / ((v.l * v.b) / 10000) - 1e-10);
      return [
        R('Tiles needed|所需片数', q),
        R('Boxes to buy|应购箱数', Math.ceil(q / v.q)),
        R('Area including waste|含损耗面积', v.a * (1 + v.w / 100), 'm²'),
      ];
    },
    'Use N = ceil[A(1+w)/(lb)]. A is net area in m², l and b are tile dimensions converted to m, and w is waste allowance as a fraction. ceil rounds up to whole tiles; boxes are rounded up separately.|使用 N = ceil[A(1+w)/(lb)]。A 为净面积（m²），l 与 b 为换算成 m 的瓷砖长宽，w 为损耗比例；ceil 表示向上取整为片数，箱数另外向上取整。',
    [88, 11, 22],
  );
  D(
    'brick-quantity',
    'Brick Quantity|砖块用量',
    'Estimate one-layer wall bricks allowing for mortar joints and openings.|考虑灰缝及洞口估计单层墙砖数。',
    [
      p('a', 'Gross wall area (m²)|墙体总面积（m²）', 10),
      n('o', 'Opening area (m²)|洞口面积（m²）', 0),
      p('l', 'Brick face length (mm)|砖面长度（mm）', 190),
      p('h', 'Brick face height (mm)|砖面高度（mm）', 90),
      n('j', 'Mortar joint (mm)|灰缝（mm）', 10),
      waste,
    ],
    (v) => {
      check(v.o < v.a, 'Openings must be smaller than gross wall area.|洞口应小于墙体总面积。');
      return [
        R(
          'Estimated bricks|估计砖数',
          Math.ceil((((v.a - v.o) * 1e6) / ((v.l + v.j) * (v.h + v.j))) * (1 + v.w / 100) - 1e-10),
        ),
      ];
    },
    'Use N = ceil[(A−O)(1+w)/((l+j)(h+j))]. A and O are wall and opening areas in m²; brick face dimensions l, h and joint width j are converted to m. w is the waste fraction and ceil rounds up.|使用 N = ceil[(A−O)(1+w)/((l+j)(h+j))]。A 与 O 为墙体及洞口面积（m²）；砖面长高 l、h 与灰缝宽 j 均换算为 m。w 为损耗比例，ceil 表示向上取整。',
    [550],
    'Single face layer only; bonding pattern, corners and structural wall thickness require a separate takeoff.|仅单面一层；砌筑方式、转角与结构墙厚需另行算量。',
  );
  D(
    'wallpaper-rolls',
    'Wallpaper Rolls|壁纸卷数',
    'Calculate full-height strips with repeat-pattern matching.|按完整高度条带和图案重复匹配计算卷数。',
    [
      p('p', 'Wall perimeter to cover (m)|待贴墙面周长（m）', 10),
      p('h', 'Wall height (m)|墙高（m）', 2.5),
      p('w', 'Roll width (m)|每卷宽度（m）', 0.5),
      p('l', 'Roll length (m)|每卷长度（m）', 10),
      n('r', 'Pattern repeat (m), zero for none|图案重复长度（m，无则 0）', 0),
      n('t', 'Trim allowance per strip (m)|每条修边余量（m）', 0),
    ],
    (v) => {
      const length = v.r > 0 ? Math.ceil((v.h + v.t) / v.r - 1e-10) * v.r : v.h + v.t,
        count = Math.floor(v.l / length + 1e-10),
        strips = Math.ceil(v.p / v.w - 1e-10);
      check(count >= 1, 'A roll must fit at least one full strip.|每卷至少应能裁出一条完整条带。');
      return [
        R('Rolls needed|所需卷数', Math.ceil(strips / count)),
        R('Strips required|所需条数', strips),
        R('Usable strips per roll|每卷可用条数', count),
        R('Cut length per strip|每条裁切长度', length, 'm'),
      ];
    },
    'For r = 0, cut length is c = h+t; for r > 0, use c = r ceil((h+t)/r). Rolls are N = ceil[ceil(P/w)/floor(L/c)]. h is wall height, t is trim, r is pattern repeat, P is wall perimeter, w is roll width, and L is roll length, all in m. ceil rounds up and floor rounds down.|当 r = 0 时，裁切长度为 c = h+t；当 r > 0 时，使用 c = r ceil((h+t)/r)。卷数为 N = ceil[ceil(P/w)/floor(L/c)]。h 为墙高，t 为修边余量，r 为花纹重复长度，P 为墙面周长，w 为卷宽，L 为卷长，均使用 m；ceil 表示向上取整，floor 表示向下取整。',
    [5, 20, 4, 2.5],
  );
  D(
    'flooring-packs',
    'Flooring Packs|地板包数',
    'Calculate whole packs and total area bought.|计算整包地板及采购总覆盖面积。',
    [
      area,
      p('p', 'Coverage per pack (m²)|每包覆盖面积（m²）', 2),
      waste,
      n('c', 'Price per pack|每包价格', 50),
    ],
    (v) => {
      const q = Math.ceil((v.a * (1 + v.w / 100)) / v.p - 1e-10);
      return [
        R('Packs to buy|应购包数', q),
        R('Purchased coverage|采购覆盖面积', q * v.p, 'm²'),
        R('Material cost|材料成本', q * v.c),
      ];
    },
    'Use N = ceil[A(1+w)/C]. A is net area and C is coverage per pack in the same area unit. w is the waste fraction. ceil rounds up to whole packs.|使用 N = ceil[A(1+w)/C]。A 为净面积，C 为每包覆盖面积，使用相同面积单位；w 为损耗比例，ceil 表示向上取整为整包数。',
    [11, 22, 550],
  );
  D(
    'carpet-roll-length',
    'Carpet Roll Length|地毯卷长',
    'Compare two rectangular orientations using fixed-width carpet.|比较固定卷宽地毯的两种铺设方向。',
    [
      p('l', 'Room length (m)|房间长度（m）', 5),
      p('w', 'Room width (m)|房间宽度（m）', 4),
      p('r', 'Carpet roll width (m)|地毯卷宽（m）', 4),
      n('a', 'Extra trim on each strip (m)|每条额外修边（m）', 0),
    ],
    (v) => {
      const a = Math.ceil(v.w / v.r) * (v.l + v.a),
        b = Math.ceil(v.l / v.r) * (v.w + v.a);
      return [
        R('Lower roll-length requirement|较少所需卷长', Math.min(a, b), 'm'),
        R('Lengthwise roll requirement|顺长铺卷长', a, 'm'),
        R('Widthwise roll requirement|顺宽铺卷长', b, 'm'),
        R('Purchased carpet area|购买地毯面积', Math.min(a, b) * v.r, 'm²'),
      ];
    },
    'Compare L₁ = ceil(W/R)(L+t) and L₂ = ceil(L/R)(W+t), then choose the smaller requirement. L and W are room length and width, R is carpet roll width, and t is extra trim on each strip, all in m. ceil rounds the strip count up.|比较 L₁ = ceil(W/R)(L+t) 与 L₂ = ceil(L/R)(W+t)，取较小用量。L 与 W 为房间长宽，R 为地毯卷宽，t 为每条额外修边余量，均使用 m；ceil 表示将条数向上取整。',
    [5, 5, 8, 20],
    'Rectangular room, joined parallel strips and no pattern matching. Confirm seam placement and pile direction with the installer.|矩形房间、平行拼接条带且不匹配图案；请与安装者确认接缝位置及绒毛方向。',
  );
  D(
    'tile-grout',
    'Tile Grout Quantity|瓷砖填缝剂',
    'Estimate joint volume and grout mass from a repeating tile grid.|由重复瓷砖网格估计灰缝体积与填缝剂质量。',
    [
      area,
      p('l', 'Tile length (mm)|瓷砖长（mm）', 300),
      p('b', 'Tile width (mm)|瓷砖宽（mm）', 300),
      n('j', 'Joint width (mm)|缝宽（mm）', 3),
      n('d', 'Joint depth (mm)|缝深（mm）', 5),
      p('rho', 'Mixed grout density (kg/L)|混合填缝剂密度（kg/L）', 1.6),
      waste,
    ],
    (v) => {
      const l = v.a * (1 - (v.l * v.b) / ((v.l + v.j) * (v.b + v.j))) * v.d;
      return [
        R('Grout mass including waste|含损耗填缝剂质量', l * v.rho * (1 + v.w / 100), 'kg'),
        R('Joint volume|缝体积', l, 'L'),
      ];
    },
    'Use f = 1−lb/[(l+j)(b+j)] and V = Afd. l, b and j are tile length, width and joint width in the same unit; A is area in m² and d is joint depth in mm. V is litres; mass also includes entered density and waste.|使用 f = 1−lb/[(l+j)(b+j)] 及 V = Afd。l、b、j 为同单位的砖长、砖宽与缝宽；A 为面积（m²），d 为缝深（mm）；V 的单位为升，质量还计入自填密度与损耗。',
    [(180900 / 91809) * 1.76, 180900 / 91809],
  );
  D(
    'gravel-base',
    'Compacted Gravel Base|压实碎石基层',
    'Allow for compaction and convert loose volume into delivery mass.|考虑压实并将松散体积换算为配送质量。',
    [
      area,
      p('d', 'Compacted depth (cm)|压实厚度（cm）', 10),
      n('c', 'Extra loose volume for compaction (%)|压实所需额外松散体积（%）', 20, 0, 200),
      p('rho', 'Loose bulk density (kg/m³)|松散堆积密度（kg/m³）', 1600),
    ],
    (v) => {
      const loose = ((v.a * v.d) / 100) * (1 + v.c / 100);
      return [
        R('Loose volume to order|应订松散体积', loose, 'm³'),
        R('Estimated delivered mass|估计配送质量', (loose * v.rho) / 1000, 'tonnes'),
      ];
    },
    'Use V = Ad(1+c). A is area in m², d is finished depth converted to m, and c is the extra loose-volume fraction for compaction. Loose volume V is in m³.|使用 V = Ad(1+c)。A 为面积（m²），d 为换算成 m 的压实厚度，c 为压实所需额外松散体积比例；松散体积 V 的单位为 m³。',
    [2.4, 3.84],
  );
  D(
    'mulch-bags',
    'Mulch Bags|覆盖物袋数',
    'Convert garden area and layer depth into whole bags.|将花园面积及覆盖厚度换算为整袋数量。',
    [
      area,
      n('d', 'Layer depth (cm)|覆盖厚度（cm）', 5),
      p('b', 'Volume per bag (L)|每袋体积（L）', 50),
    ],
    (v) => {
      const litres = v.a * v.d * 10;
      return [
        R('Bags needed|所需袋数', Math.ceil(litres / v.b - 1e-10)),
        R('Total coverage volume|总覆盖体积', litres, 'L'),
      ];
    },
    'Use V = 10Ad and N = ceil(V/B). A is area in m², d is depth in cm, and B is litres per bag. V is litres and ceil rounds up to whole bags.|使用 V = 10Ad 及 N = ceil(V/B)。A 为面积（m²），d 为厚度（cm），B 为每袋升数；V 的单位为升，ceil 表示向上取整为整袋数。',
    [20, 1000],
  );
  D(
    'wall-stud-layout',
    'Wall Stud Layout|墙柱间距布置',
    'Estimate equally spaced stud positions including both wall ends.|估计包含墙两端的等间距墙柱位置数。',
    [
      p('l', 'Wall length (m)|墙长（m）', 4.8),
      p('s', 'Maximum centre spacing (mm)|最大中心间距（mm）', 600),
    ],
    (v) => [
      R('Basic stud positions|基本墙柱位置数', Math.ceil((v.l * 1000) / v.s - 1e-10) + 1),
      R('Equalized spacing|等分间距', (v.l * 1000) / Math.ceil((v.l * 1000) / v.s - 1e-10), 'mm'),
    ],
    'Use N = ceil(L/s)+1. L is wall length and s is maximum centre spacing, converted to the same unit. ceil rounds up the number of intervals; the extra position includes both ends.|使用 N = ceil(L/s)+1。L 为墙长，s 为最大中心间距，两者换算至同一单位；ceil 将间隔数向上取整，再增加一个位置以包含两端。',
    [9, 600],
    'Layout count only. Doors, corners, double studs, loads, bracing and code compliance require a construction plan.|仅计算布置数量；门洞、转角、双柱、荷载、支撑与规范合规需施工图确认。',
  );
  D(
    'asphalt-quantity',
    'Asphalt Quantity|沥青用量',
    'Convert area and compacted thickness into material mass.|由面积与压实厚度计算材料质量。',
    [
      area,
      p('d', 'Compacted thickness (cm)|压实厚度（cm）', 5),
      p('rho', 'Compacted density (kg/m³)|压实密度（kg/m³）', 2400),
      waste,
    ],
    (v) => [
      R(
        'Material including allowance|含余量材料质量',
        (((v.a * v.d) / 100) * v.rho * (1 + v.w / 100)) / 1000,
        'tonnes',
      ),
    ],
    'Use M = Adρ(1+w). A is area in m², d is compacted thickness converted to m, ρ is density in kg/m³, and w is the waste fraction. M is kilograms before conversion to tonnes.|使用 M = Adρ(1+w)。A 为面积（m²），d 为换算成 m 的压实厚度，ρ 为密度（kg/m³），w 为损耗比例；M 为千克数，随后换算成吨显示。',
    [2.64],
  );
  D(
    'roof-pitch',
    'Roof Pitch and Area|屋顶坡度与面积',
    'Convert rise and run to pitch angle and sloping area.|由升高与水平距离求坡角及斜面面积。',
    [
      n('r', 'Roof rise (m)|屋顶升高（m）', 3),
      p('l', 'Horizontal run (m)|水平距离（m）', 4),
      p('a', 'Horizontal projected roof area (m²)|屋顶水平投影面积（m²）', 80),
    ],
    (v) => [
      R('Roof angle|屋顶坡角', deg(Math.atan(v.r / v.l)), '°'),
      R('Slope rise per 12 run|水平 12 对应升高', (12 * v.r) / v.l),
      R('Sloping area|斜面面积', (v.a * Math.hypot(v.r, v.l)) / v.l, 'm²'),
    ],
    'Use θ = atan(r/l) and S = A√(1+(r/l)²). r is roof rise and l is horizontal run in the same unit. A is horizontal projected area and S is sloping area in the same area unit. The angle is displayed in degrees.|使用 θ = atan(r/l) 及 S = A√(1+(r/l)²)。r 为屋顶升高，l 为同单位水平距离；A 为水平投影面积，S 为同面积单位的斜面面积，坡角以度显示。',
    [36.86989764584402, 9, 100],
  );
  D(
    'stair-layout',
    'Stair Layout|楼梯踏步布置',
    'Divide total rise into equal risers under an entered height limit.|按自填高度上限将总升高分为等高踏步。',
    [
      p('h', 'Total rise (mm)|总升高（mm）', 2800),
      p('r', 'Maximum preferred riser (mm)|偏好最大踢面高度（mm）', 180),
      p('g', 'Tread going (mm)|踏面进深（mm）', 250),
    ],
    (v) => {
      const k = Math.ceil(v.h / v.r);
      return [
        R('Riser count|踢面数', k),
        R('Actual riser height|实际踢面高度', v.h / k, 'mm'),
        R('Treads before upper landing|上平台前踏面数', k - 1),
        R('Straight horizontal run|直梯水平长度', (k - 1) * v.g, 'mm'),
      ];
    },
    'Use N = ceil(H/r) and T = N−1. H is total rise and r is the preferred maximum riser height in the same unit. ceil rounds up; T counts treads before the upper landing. Actual riser height is H/N.|使用 N = ceil(H/r) 及 T = N−1。H 为总升高，r 为同单位的偏好最大踢面高度；ceil 表示向上取整，T 为上平台前踏面数，实际踢面高度为 H/N。',
    [16, 175, 15, 3750],
    'Geometry sketch only; not a building-code check. Headroom, landings, guards and local accessibility rules are excluded.|仅几何草算，不检查建筑规范；不含净空、平台、护栏与当地无障碍规定。',
  );
  D(
    'ramp-gradient',
    'Ramp Gradient|坡道坡度',
    'Compare rise and horizontal run with actual ramp length.|比较升高、水平距离与实际坡长。',
    [n('h', 'Rise (m)|升高（m）', 0.5), p('l', 'Horizontal run (m)|水平距离（m）', 6)],
    (v) => [
      R('Gradient|坡度', (100 * v.h) / v.l, '%'),
      R('Ramp length|坡长', Math.hypot(v.h, v.l), 'm'),
      R('Angle|坡角', deg(Math.atan(v.h / v.l)), '°'),
    ],
    'Use g = h/l and s = √(h²+l²). h is rise and l is horizontal run in the same unit. Gradient g is displayed as a percentage; ramp length s keeps the distance unit.|使用 g = h/l 及 s = √(h²+l²)。h 为升高，l 为同单位水平距离；坡度 g 以百分比显示，坡长 s 使用原距离单位。',
    [25 / 3, Math.sqrt(36.25), 4.763641690726178],
    'Describes geometry; does not certify wheelchair access or compliance with local ramp standards.|仅描述几何形状，不认证轮椅通行或当地坡道规范合规。',
  );
  D(
    'fence-posts',
    'Fence Post Count|围栏立柱数量',
    'Count posts for a straight run or a closed loop.|计算直线或闭合围栏所需立柱。',
    [
      p('l', 'Fence length (m)|围栏长度（m）', 30),
      p('s', 'Maximum post spacing (m)|最大柱距（m）', 2.5),
      select('loop', 'Fence shape|围栏形状', 'open', [
        ['open', 'Open straight run|开放直线'],
        ['closed', 'Closed loop|闭合环线'],
      ]),
    ],
    (v) => [
      R('Posts needed|所需立柱', Math.ceil(v.l / v.s - 1e-10) + (v.loop === 'open' ? 1 : 0)),
      R('Equal spacing|等分柱距', v.l / Math.ceil(v.l / v.s - 1e-10), 'm'),
    ],
    'Let n = ceil(L/s), where L is fence length and s is maximum post spacing in the same unit. Open-run post count is n+1; a closed loop uses n posts. ceil rounds up.|设 n = ceil(L/s)，其中 L 为围栏长度，s 为同单位的最大柱距；开放直线需 n+1 根立柱，闭合环线需 n 根。ceil 表示向上取整。',
    [13, 2.5],
    'No gates, corners, intermediate bracing or terrain changes are included.|不含门、转角、中间支撑或地形变化。',
  );
  D(
    'decking-boards',
    'Decking Board Layout|露台板布置',
    'Estimate board rows with a specified gap and stock length.|按留缝与库存板长估计板排和用量。',
    [
      p('l', 'Deck length along boards (m)|沿板方向长度（m）', 5),
      p('w', 'Deck width (m)|露台宽度（m）', 3),
      p('b', 'Board width (mm)|板宽（mm）', 140),
      n('g', 'Gap between boards (mm)|板间缝（mm）', 10),
      p('s', 'Stock board length (m)|库存板长（m）', 5),
    ],
    (v) => {
      const rows = Math.ceil((v.w * 1000 + v.g) / (v.b + v.g) - 1e-10),
        pieces = rows * Math.ceil(v.l / v.s - 1e-10);
      return [
        R('Board rows|板排数', rows),
        R('Stock boards without cut reuse|不复用裁片的库存板数', pieces),
        R('Installed linear board length|安装板材延米', rows * v.l, 'm'),
      ];
    },
    'Use N = ceil[(W+g)/(b+g)]. W is deck width, b is board width, and g is the gap, all in the same unit. ceil rounds up to board rows. Stock board count also accounts for length without reusing cut pieces.|使用 N = ceil[(W+g)/(b+g)]。W 为露台宽，b 为板宽，g 为板间缝，均使用同一单位；ceil 表示向上取整为板排数，库存板数还计入长度且不复用裁片。',
    [21, 21, 105],
  );
  D(
    'board-feet',
    'Lumber Board Feet|木材板英尺',
    'Measure lumber volume using nominal inch dimensions.|用英寸标称尺寸计算板英尺。',
    [
      p('t', 'Thickness (in)|厚度（in）', 2),
      p('w', 'Width (in)|宽度（in）', 6),
      p('l', 'Length (ft)|长度（ft）', 8),
      i('q', 'Piece count|件数', 10, 1, 100000),
    ],
    (v) => [
      R('Total board feet|总板英尺', (v.t * v.w * v.l * v.q) / 12, 'board ft'),
      R('Physical volume|体积', ((v.t * v.w * v.l * v.q) / 12) * 0.002359737216, 'm³'),
    ],
    'Use B = twLq/12. t and w are thickness and width in in, L is length in ft, and q is piece count. B is total board feet.|使用 B = twLq/12。t 与 w 为厚度及宽度（in），L 为长度（ft），q 为件数；B 为总板英尺。',
    [80, 0.18877897728],
  );
  D(
    'linear-cut-yield',
    'Linear Cut Yield|直料裁切利用率',
    'Account for blade kerf when cutting repeated equal pieces.|裁切等长材料时计入锯缝。',
    [
      p('l', 'Stock length (mm)|原料长度（mm）', 2400),
      p('p', 'Finished piece length (mm)|成品长度（mm）', 500),
      n('k', 'Saw kerf per cut (mm)|每刀锯缝（mm）', 3),
    ],
    (v) => {
      const q = Math.floor((v.l + v.k) / (v.p + v.k) + 1e-10),
        used = q * v.p + Math.max(0, q - 1) * v.k;
      return [
        R('Whole pieces|完整件数', q),
        R(
          'Remaining length before any final separation cut|未计末次分离刀的余长',
          v.l - used,
          'mm',
        ),
        R('Finished material yield|成品材料利用率', (100 * q * v.p) / v.l, '%'),
      ];
    },
    'Use N = floor[(L+k)/(p+k)]. L is stock length, p is finished piece length, and k is saw kerf in the same unit. floor rounds down. This counts kerf between pieces; a final separation cut may need another kerf.|使用 N = floor[(L+k)/(p+k)]。L 为原料长，p 为成品长，k 为同单位锯缝；floor 表示向下取整。仅计成品间锯缝，末次切离余料可能还需一刀锯缝。',
    [4, 391, 250 / 3],
    'Counts kerf between pieces only; if separating leftover stock requires an extra cut, subtract that kerf from the remainder and check fit.|仅计成品间锯缝；若需切离余料，余长还应扣一刀锯缝并检查是否足够。',
  );
  D(
    'horizontal-tank-fill',
    'Horizontal Cylinder Tank Fill|卧式圆柱罐液量',
    'Find liquid volume from fill depth in a horizontal round tank.|由液深计算卧式圆柱罐存液体积。',
    [
      p('r', 'Inner radius (m)|内半径（m）', 1),
      p('l', 'Straight cylinder length (m)|直筒长度（m）', 2),
      n('h', 'Fill depth from bottom (m)|底部起液深（m）', 1),
    ],
    (v) => {
      check(v.h <= 2 * v.r, 'Fill depth cannot exceed the diameter.|液深不能超过直径。');
      const a =
        v.r * v.r * Math.acos((v.r - v.h) / v.r) -
        (v.r - v.h) * Math.sqrt(Math.max(0, 2 * v.r * v.h - v.h * v.h));
      return [
        R('Liquid volume|液体体积', a * v.l, 'm³'),
        R('Fill fraction|充填比例', (100 * a) / (PI * v.r * v.r), '%'),
      ];
    },
    'Use A = r²acos((r−h)/r)−(r−h)√(2rh−h²) and V = AL. r is inner radius, h is liquid depth from the bottom, and L is cylinder length, all in m. acos uses radians; V is in m³.|使用 A = r²acos((r−h)/r)−(r−h)√(2rh−h²) 及 V = AL。r 为内半径，h 为底部起液深，L 为直筒长度，均使用 m；acos 按弧度计算，V 的单位为 m³。',
    [PI, 50],
    'Straight circular cylinder with flat ends. Dished end caps, tilt and wall thickness are excluded.|直圆柱平底端盖模型，不含封头、倾斜与壁厚。',
  );
  D(
    'pool-volume',
    'Swimming Pool Volume|泳池容积',
    'Estimate rectangular pool volume with a uniformly sloping floor.|估算底面均匀倾斜矩形泳池容积。',
    [
      p('l', 'Pool length (m)|泳池长（m）', 10),
      p('w', 'Pool width (m)|泳池宽（m）', 4),
      n('a', 'Shallow depth (m)|浅端深度（m）', 1),
      n('b', 'Deep depth (m)|深端深度（m）', 2),
    ],
    (v) => [
      R('Pool volume|泳池容积', (v.l * v.w * (v.a + v.b)) / 2, 'm³'),
      R('Water volume|水量', (1000 * v.l * v.w * (v.a + v.b)) / 2, 'L'),
    ],
    'Use V = lw(a+b)/2. l and w are rectangular pool length and width; a and b are shallow and deep depths, all in m. V is in m³, assuming a uniformly sloping floor.|使用 V = lw(a+b)/2。l 与 w 为矩形泳池长宽，a 与 b 为浅深两端深度，均使用 m；假设池底均匀倾斜，V 的单位为 m³。',
    [60, 60000],
    'Uses internal rectangular dimensions and a uniformly sloping floor. Steps, benches, curved walls and changes in water level are not modeled.|使用池内矩形尺寸，假设池底均匀倾斜；不建模台阶、座台、曲面池壁及水位变化。',
  );
  D(
    'rainwater-harvesting',
    'Rainwater Harvesting|雨水收集量',
    'Estimate roof runoff captured from a rainfall event.|估计一次降雨可收集的屋面径流。',
    [
      p('a', 'Roof catchment area (m²)|集雨屋面面积（m²）', 100),
      n('r', 'Rainfall depth (mm)|降雨深度（mm）', 20),
      n('e', 'Collection efficiency (%)|收集效率（%）', 80, 0, 100),
      n('s', 'Available tank capacity (L)|水箱可用容量（L）', 1000),
    ],
    (v) => {
      const q = (v.a * v.r * v.e) / 100;
      return [
        R('Potential collected water|潜在集水量', q, 'L'),
        R('Stored with entered spare capacity|按所填剩余容量存水', Math.min(q, v.s), 'L'),
        R('Overflow|溢流量', Math.max(0, q - v.s), 'L'),
      ];
    },
    'Use V = Are. A is roof catchment area in m², r is rainfall in mm, and e is collection efficiency as a fraction. V is potential collected litres; actual storage is capped by entered spare tank capacity.|使用 V = Are。A 为集雨屋面面积（m²），r 为降雨量（mm），e 为收集效率的小数比例；V 为潜在集水升数，实际存水受自填水箱剩余容量限制。',
    [1600, 1000, 600],
    'Estimates collected water from one rainfall event using your collection efficiency and remaining tank space. Does not forecast rainfall or assess water quality and drinking safety.|按自填收集效率和水箱剩余容量估算单次降雨可收集的水量，不预测降雨，也不评估水质或饮用安全。',
  );
  D(
    'irrigation-runtime',
    'Irrigation Runtime|灌溉运行时间',
    'Convert a chosen water depth and emitter flow into runtime.|将自选水深及出水流量换算为运行时长。',
    [
      area,
      n('d', 'Chosen water depth (mm)|自选灌水深度（mm）', 10),
      p('f', 'Total emitter flow (L/min)|所有滴头总流量（L/min）', 20),
      n('e', 'Application efficiency (%)|施用效率（%）', 80, 0.0001, 100),
    ],
    (v) => {
      const q = (v.a * v.d) / (v.e / 100);
      return [
        R('Required runtime|所需运行时长', q / v.f, 'minutes'),
        R('Supply water volume|供水量', q, 'L'),
      ];
    },
    'Use V = Ad/e and t = V/q. A is area in m², d is chosen water depth in mm, e is application efficiency as a fraction, and q is total emitter flow in L/min. V is litres and t is minutes.|使用 V = Ad/e 及 t = V/q。A 为面积（m²），d 为自选灌水深度（mm），e 为施用效率的小数比例，q 为滴头总流量（L/min）；V 为升数，t 为分钟数。',
    [12.5, 250],
    'Assumes constant total emitter flow and the entered application efficiency. The water-depth target is chosen by you; crop needs, soil behavior and weather are not assessed.|假设滴头总流量和自填施用效率保持不变；灌水深度由你选定，不评估作物需求、土壤特性或天气。',
  );
  D(
    'grass-seed-quantity',
    'Grass Seed Quantity|草籽用量',
    'Apply a product’s labelled sowing rate to an area.|将产品标签播种率应用于面积。',
    [
      area,
      n('r', 'Labelled seed rate (g/m²)|标签播种率（g/m²）', 30),
      waste,
      p('b', 'Pack mass (kg)|每包质量（kg）', 1),
    ],
    (v) => {
      const kg = ((v.a * v.r) / 1000) * (1 + v.w / 100);
      return [
        R('Seed including allowance|含余量草籽', kg, 'kg'),
        R('Packs needed|所需包数', Math.ceil(kg / v.b - 1e-10)),
      ];
    },
    'Use M = Ar(1+w). A is area in m², r is labelled sowing rate in g/m², and w is the waste fraction. M is grams before conversion to kilograms; packs are rounded up using entered pack mass.|使用 M = Ar(1+w)。A 为面积（m²），r 为标签播种率（g/m²），w 为损耗比例；M 为克数，随后换算为千克，并按自填每包质量向上取整为包数。',
    [0.66, 1],
    'Uses the product seed rate and pack mass you enter, with an optional waste allowance. Does not choose a seed variety, sowing season or agronomic application rate.|按自填产品播种率、包装质量和可选损耗余量换算，不代选草籽品种、播种季节或农艺施用率。',
  );
  D(
    'fertilizer-nitrogen-amount',
    'Fertilizer from Chosen Nitrogen Target|自选氮目标换算肥料量',
    'Convert a separately confirmed nitrogen target into product mass.|将另行确认的氮目标换算为肥料产品质量。',
    [
      area,
      n('n', 'Confirmed nitrogen target (g/m²)|已确认施氮目标（g/m²）', 2),
      n('p', 'Product nitrogen by mass (%)|产品氮质量分数（%）', 10, 0.0001, 100),
    ],
    (v) => [R('Fertilizer product mass|肥料产品质量', (v.a * v.n) / (v.p / 100) / 1000, 'kg')],
    'Use M = An/f. A is area in m², n is the separately confirmed nitrogen target in g/m², and f is product nitrogen by mass as a fraction. M is product grams before conversion to kilograms.|使用 M = An/f。A 为面积（m²），n 为另行确认的施氮目标（g/m²），f 为产品氮质量分数的小数比例；M 为产品克数，随后换算为千克。',
    [0.4],
    'Does not recommend an application rate. Follow soil testing, product labels, runoff controls and local restrictions; other nutrients are not evaluated.|不建议施用率；应遵守土壤检测、产品标签、径流控制及当地限制，未评估其他养分。',
  );
  D(
    'room-lighting-lumens',
    'Room Lighting Lumens|房间照明流明',
    'Translate a chosen illuminance target into fixture quantity.|将自选照度目标换算为灯具数量。',
    [
      area,
      p('lux', 'Chosen illuminance target (lux)|自选照度目标（lux）', 300),
      p('l', 'Lumens per fixture|每灯具流明', 1000),
      n('u', 'Utilization factor|利用系数', 0.6, 0.0001, 1),
      n('m', 'Maintenance factor|维护系数', 0.8, 0.0001, 1),
    ],
    (v) => [
      R('Fixture count|灯具数量', Math.ceil((v.a * v.lux) / (v.l * v.u * v.m) - 1e-10)),
      R('Required installed lumens|所需安装流明', (v.a * v.lux) / (v.u * v.m), 'lm'),
    ],
    'Use N = ceil(AE/(Φum)). A is area in m², E is chosen illuminance in lux, Φ is lumens per fixture, and u and m are utilization and maintenance factors. ceil rounds up to whole fixtures.|使用 N = ceil(AE/(Φum))。A 为面积（m²），E 为自选照度（lux），Φ 为每灯具流明，u 与 m 为利用及维护系数；ceil 表示向上取整为灯具数量。',
    [13, 12500],
    'Lumen-method estimate, not a lighting simulation. Glare, daylight, task placement and electrical design require separate review.|流明法估算，不是照明仿真；眩光、日光、任务位置与电气设计需另行审核。',
  );
  D(
    'air-changes-per-hour',
    'Air Changes per Hour|每小时换气次数',
    'Compare ventilation flow with room volume.|比较通风量与房间体积。',
    [
      p('v', 'Room volume (m³)|房间体积（m³）', 60),
      n('q', 'Measured airflow (m³/h)|实测风量（m³/h）', 300),
    ],
    (v) => [
      R('Air changes per hour|每小时换气次数', v.q / v.v, '1/h'),
      R(
        'Ideal single-volume replacement time|理想单体积置换时间',
        v.q > 0 ? (60 * v.v) / v.q : 'No replacement flow|无置换风量',
        'minutes',
      ),
    ],
    'Use ACH = Q/V. Q is measured airflow in m³/h and V is room volume in m³. ACH is air changes per hour; it is a flow-to-volume ratio, not a contaminant-removal guarantee.|使用 ACH = Q/V。Q 为实测风量（m³/h），V 为房间体积（m³）；ACH 为每小时换气次数，是风量与体积之比，不保证污染物清除效果。',
    [5, 12],
    'Perfect mixing is not assumed to guarantee contaminant removal. No ventilation safety or infection-risk assessment is made.|换气数不保证污染物清除效果；不进行通风安全或感染风险评估。',
  );
  D(
    'solar-energy-production',
    'Solar Energy Production|光伏发电估算',
    'Estimate production using entered peak sun hours and system losses.|按自填峰值日照与系统损耗估计发电量。',
    [
      n('p', 'Array peak capacity (kW)|组件峰值容量（kW）', 5),
      n('h', 'Average peak sun hours per day|日均峰值日照小时', 4, 0, 24),
      n('l', 'System losses (%)|系统损耗（%）', 20, 0, 100),
      i('d', 'Days in period|期间天数', 30, 1, 366),
    ],
    (v) => [
      R('Period energy|期间发电量', v.p * v.h * (1 - v.l / 100) * v.d, 'kWh'),
      R('Average daily energy|日均发电量', v.p * v.h * (1 - v.l / 100), 'kWh'),
    ],
    'Use E = Ph(1−l)d. P is peak array capacity in kW, h is average peak sun hours per day, l is system loss as a fraction, and d is days. Period energy E is in kWh.|使用 E = Ph(1−l)d。P 为组件峰值容量（kW），h 为日均峰值日照小时，l 为系统损耗的小数比例，d 为天数；期间发电量 E 的单位为 kWh。',
    [480, 16],
    'Sun hours are an input assumption, not a live local forecast. Shading, orientation and seasonal variation require site-specific modeling.|日照为自填假设，不是当地实时预测；遮挡、朝向及季节变化需场址模型。',
  );
  D(
    'insulation-payback',
    'Insulation Savings Payback|保温节省回收期',
    'Estimate conduction savings and simple installation payback.|估计导热节省与简单安装成本回收期。',
    [
      p('a', 'Envelope area (m²)|围护面积（m²）', 100),
      p('o', 'Old U value (W/m²·K)|旧 U 值（W/m²·K）', 1),
      p('b', 'New U value (W/m²·K)|新 U 值（W/m²·K）', 0.5),
      n('d', 'Annual heating degree days (K·day)|年采暖度日（K·天）', 2000),
      p('e', 'Heating system efficiency|供暖系统效率', 1),
      n('p', 'Energy price per kWh|每 kWh 能源价格', 0.2),
      n('c', 'Installation cost|安装成本', 1000),
    ],
    (v) => {
      check(v.b < v.o, 'New U value must be lower than old U value.|新 U 值必须低于旧 U 值。');
      const energy = (v.a * (v.o - v.b) * v.d * 24) / 1000 / v.e,
        s = energy * v.p;
      return [
        R('Annual energy saving|年能源节省', energy, 'kWh'),
        R('Annual bill saving|年账单节省', s),
        R(
          'Simple payback|简单回收期',
          s > 0 ? v.c / s : 'No bill saving at zero price|能源价格为零时无账单节省',
          'years',
        ),
      ];
    },
    'Use E = A(Uₒ−Uₙ)D×24/(1000η). A is area in m²; Uₒ and Uₙ are old and new transmittance in W/m²·K; D is annual heating degree days in K·day; η is system efficiency. E is annual energy saving in kWh.|使用 E = A(Uₒ−Uₙ)D×24/(1000η)。A 为面积（m²），Uₒ 与 Uₙ 分别为旧、新传热系数（W/m²·K），D 为年采暖度日（K·day），η 为系统效率；E 为年能源节省（kWh）。',
    [2400, 480, 25 / 12],
    'Steady degree-day estimate; excludes air leakage, cooling changes, rebound, finance and energy-price changes.|稳态度日估算，不含漏风、制冷变化、反弹效应、融资与能源价格变化。',
  );
  D(
    'appliance-replacement-payback',
    'Appliance Replacement Payback|电器更换回收期',
    'Compare annual consumption savings with an added purchase cost.|比较年耗电节省与额外购置成本。',
    [
      n('a', 'Old annual consumption (kWh)|旧电器年耗电（kWh）', 500),
      n('b', 'New annual consumption (kWh)|新电器年耗电（kWh）', 300),
      n('p', 'Electricity price per kWh|每 kWh 电价', 0.25),
      n('c', 'Net replacement cost|净更换成本', 400),
    ],
    (v) => {
      const s = (v.a - v.b) * v.p;
      return [
        R('Annual bill saving|年电费节省', s),
        R(
          'Simple payback|简单回收期',
          s > 0 ? v.c / s : 'No positive bill saving|无正向电费节省',
          'years',
        ),
      ];
    },
    'Use S = (Eₒ−Eₙ)p. Eₒ and Eₙ are old and new annual energy use in kWh, and p is price per kWh. S is annual bill saving; simple payback divides net replacement cost by a positive saving.|使用 S = (Eₒ−Eₙ)p。Eₒ 与 Eₙ 为旧、新电器年耗电（kWh），p 为每 kWh 电价；S 为年电费节省，简单回收期为净更换成本除以正向节省。',
    [50, 8],
    'Assumes constant annual consumption and electricity price. Payback includes energy savings only; maintenance, financing, resale and appliance lifetime are excluded.|假设年耗电和电价保持不变；回收期只计能源费节省，不含维护、融资、转售及电器使用寿命。',
  );
  D(
    'ev-fuel-cost-comparison',
    'EV vs Fuel Energy Cost|电车燃油车能耗费用比较',
    'Compare per-distance energy costs and purchase-price payback.|比较单位里程能源费与购车差价回收。',
    [
      n('f', 'Fuel consumption (L/100 km)|油耗（L/100 km）', 7),
      n('p', 'Fuel price per litre|每升燃油价格', 1.5),
      n(
        'e',
        'Charging electricity from supply (kWh/100 km)|充电侧取电量（含损耗，kWh/100 km）',
        18,
      ),
      n('q', 'Electricity price per kWh|每 kWh 电价', 0.25),
      n('d', 'Annual distance (km)|年里程（km）', 10000),
      n('c', 'Extra EV purchase cost|电车额外购置成本', 6000),
    ],
    (v) => {
      const f = v.f * v.p,
        e = v.e * v.q,
        s = ((f - e) * v.d) / 100;
      return [
        R('Fuel cost per 100 km|燃油车每百公里费用', f),
        R('EV cost per 100 km|电车每百公里费用', e),
        R('Annual energy saving|年能源费节省', s),
        R(
          'Energy-only payback|仅能源费回收期',
          s > 0 ? v.c / s : 'No positive energy saving|无正向能源费节省',
          'years',
        ),
      ];
    },
    'Use S = (fp−eq)D/100. f is fuel litres and e is EV wall energy in kWh per 100 km; p is fuel price per litre, q is electricity price per kWh, and D is annual distance in km. S is annual energy-cost saving.|使用 S = (fp−eq)D/100。f 为每 100 km 油耗升数，e 为同里程充电时从电网取用的电量（kWh，包含充电损耗），p 为每升油价，q 为每 kWh 电价，D 为年里程（km）；S 为年能源费节省。',
    [10.5, 4.5, 600, 10],
    'Enter electricity drawn from the supply, including charging losses. Excludes maintenance, insurance, taxes, depreciation and incentives.|填写充电时从电网取用的电量（包含充电损耗）；不含维护、保险、税费、折旧与补贴。',
  );
  D(
    'travel-time',
    'Travel Time with Stops|含停留出行时间',
    'Combine distance, moving speed and stop duration.|结合距离、行驶速度与停留时长。',
    [
      n('d', 'Distance (km)|距离（km）', 300),
      p('v', 'Average moving speed (km/h)|平均行驶速度（km/h）', 100),
      n('s', 'Total stops (minutes)|总停留（分钟）', 30),
    ],
    (v) => [
      R('Total travel time|总出行时间', v.d / v.v + v.s / 60, 'hours'),
      R('Moving time|行驶时间', v.d / v.v, 'hours'),
    ],
    'Use T = D/v+s/60. D is distance in km, v is average moving speed in km/h, and s is total stop time in minutes. Total travel time T is in hours.|使用 T = D/v+s/60。D 为距离（km），v 为平均行驶速度（km/h），s 为总停留分钟数；总出行时间 T 的单位为小时。',
    [3.5, 3],
    'Assumes the entered average moving speed and total stop time. Does not include live traffic, weather delays or route planning.|按自填平均行驶速度和总停留时间估算；不包含实时路况、天气延误或路线规划。',
  );
  D(
    'trip-budget',
    'Trip Budget|旅行预算',
    'Combine shared transport, nightly stays and per-person daily spending.|合并共享交通、每晚住宿与每人每日支出。',
    [
      i('p', 'Travellers|人数', 2, 1, 1000),
      i('d', 'Days|天数', 5, 1, 10000),
      i('n', 'Nights|晚数', 4, 0, 10000),
      n('t', 'Total group transport|全组交通总费', 300),
      n('h', 'Total accommodation per night|全组每晚住宿费', 100),
      n('f', 'Daily spending per person|每人每日支出', 40),
      n('w', 'Budget buffer (%)|预算余量（%）', 10, 0, 100),
    ],
    (v) => {
      const b = v.t + v.h * v.n + v.f * v.p * v.d,
        total = b * (1 + v.w / 100);
      return [
        R('Group budget with buffer|含余量全组预算', total),
        R('Per-person budget|每人预算', total / v.p),
        R('Base group cost|全组基础费用', b),
      ];
    },
    'Use B = (T+nH+pdF)(1+w). T is group transport cost, n is nights, H is group lodging cost per night, p is people, d is days, F is daily spending per person, and w is the buffer fraction. Costs use the same currency.|使用 B = (T+nH+pdF)(1+w)。T 为全组交通费，n 为晚数，H 为全组每晚住宿费，p 为人数，d 为天数，F 为每人每日支出，w 为预算余量比例；所有费用使用同一货币。',
    [1210, 605, 1100],
    'Transport and accommodation are group costs; daily spending is per person. Use one currency throughout. No exchange rates or live travel prices are supplied.|交通和住宿按全组费用计，每日支出按每人计；全部金额使用同一货币，不提供汇率或实时旅行报价。',
  );
  D(
    'weighted-bill-split',
    'Weighted Bill Split|按权重分账',
    'Split a total by chosen shares and reconcile currency rounding.|按自选权重分账，并对齐货币舍入尾差。',
    [
      n('a', 'Total bill|总账单', 100),
      text('w', 'Nonnegative participant weights|各参与者非负权重', '1,1,2'),
      i('d', 'Currency decimal places|货币小数位', 2, 0, 4),
    ],
    (v) => {
      const a = nums(v.w),
        total = sum(a);
      check(
        a.length <= 100 && a.every((x) => x >= 0) && total > 0,
        'Use up to 100 nonnegative weights with a positive sum.|最多 100 个非负权重，合计应大于零。',
      );
      const scale = 10 ** v.d,
        cents = Math.round(v.a * scale);
      check(
        Number.isSafeInteger(cents),
        'Total is too large for exact currency splitting.|总额过大，无法进行精确货币分账。',
      );
      const raw = a.map((x) => (cents * x) / total),
        q = raw.map(Math.floor),
        order = raw.map((x, k) => k).sort((a, b) => raw[b] - q[b] - (raw[a] - q[a]) || a - b);
      for (let k = 0, left = cents - sum(q); k < left; k++) q[order[k]]++;
      return q.map((x, k) => R('Participant ' + (k + 1) + '|参与者 ' + (k + 1), x / scale));
    },
    'Allocate integer minor units by largest remainder|以整数最小货币单位计算，按最大余数法分配。',
    [25, 25, 50],
  );
  D(
    'recipe-scaling',
    'Recipe Scaling|食谱份量缩放',
    'Scale ingredient amounts from original servings to target servings.|按原份数与目标份数同比缩放原料。',
    [
      p('a', 'Original servings|原份数', 4),
      n('b', 'Target servings|目标份数', 6),
      text(
        'x',
        'Ingredient amounts in their own unchanged units|各原料数量（各自单位保持不变）',
        '200,100,2',
      ),
    ],
    (v) => [
      R('Scale factor|缩放倍数', v.b / v.a),
      ...nums(v.x).map((x, k) => {
        check(x >= 0, 'Ingredient amounts cannot be negative.|原料数量不能为负。');
        return R('Ingredient ' + (k + 1) + '|原料 ' + (k + 1), (x * v.b) / v.a);
      }),
    ],
    "Use q = xB/A. x is an original ingredient amount, A is original servings, and B is target servings. Each scaled amount q retains that ingredient's original unit.|使用 q = xB/A。x 为原原料数量，A 为原份数，B 为目标份数；每项缩放后数量 q 保留该原料原来的单位。",
    [1.5, 300, 150, 3],
    'Units remain unchanged. Cooking time, seasoning and leavening may not scale linearly.|单位保持不变；烹饪时间、调味及膨松剂可能不按线性比例缩放。',
  );
  D(
    'coffee-brew-ratio',
    'Coffee Brew Ratio|咖啡冲煮比例',
    'Calculate brew water from coffee dose and a chosen water ratio.|由咖啡粉量和自选水粉比求用水量。',
    [
      n('c', 'Coffee dose (g)|咖啡粉量（g）', 20),
      p('r', 'Water grams per gram of coffee|每克咖啡对应水克数', 15),
    ],
    (v) => [
      R('Brew water|冲煮用水', v.c * v.r, 'g'),
      R('Combined starting mass|总初始质量', v.c * (1 + v.r), 'g'),
    ],
    'Use W = Cr. C is coffee mass in g and r is water grams per gram of coffee. W is required water mass in g; the ratio compares water with coffee.|使用 W = Cr。C 为咖啡粉质量（g），r 为每克咖啡对应的水克数；W 为所需水质量（g），比例方向为水比咖啡。',
    [300, 320],
    'Water input, not final beverage yield; retention and evaporation are excluded.|计算投入用水，不等于最终饮品量；未计吸水滞留与蒸发。',
  );
  D(
    'bakers-hydration',
    'Baker’s Hydration|烘焙含水率',
    'Include preferment flour and water in total dough hydration.|将酵种中的面粉与水计入面团总水粉比。',
    [
      n('f', 'Main dough flour (g)|主面团面粉（g）', 450),
      n('w', 'Main dough water (g)|主面团水（g）', 300),
      n('s', 'Preferment total mass (g)|酵种总质量（g）', 100),
      n('h', 'Preferment hydration (%)|酵种水粉比（%）', 100, 0, 1000),
    ],
    (v) => {
      const sf = v.s / (1 + v.h / 100),
        sw = v.s - sf,
        total = v.f + sf;
      check(total > 0, 'Total flour must be positive.|总面粉量应大于零。');
      return [
        R('Total hydration|总含水率', (100 * (v.w + sw)) / total, '%'),
        R('Total flour|总面粉', total, 'g'),
        R('Total water|总水', v.w + sw, 'g'),
      ];
    },
    'Use Fₚ = S/(1+h), Wₚ = S−Fₚ and H = (W+Wₚ)/(F+Fₚ). S is preferment mass, h is its hydration fraction, and F and W are main-dough flour and water, all masses in g. Total hydration H is displayed as a percentage.|使用 Fₚ = S/(1+h)、Wₚ = S−Fₚ 及 H = (W+Wₚ)/(F+Fₚ)。S 为酵种质量，h 为酵种含水率的小数比例，F 与 W 为主面团面粉及水，所有质量均使用 g；总含水率 H 以百分比显示。',
    [70, 500, 350],
    'Preferment is treated as flour and water only. Water from eggs, milk and other ingredients is not included. Hydration compares total water mass with total flour mass.|酵种按仅含面粉和水处理，不计鸡蛋、牛奶等其他原料带入的水；含水率比较总水质量与总面粉质量。',
  );
})();
