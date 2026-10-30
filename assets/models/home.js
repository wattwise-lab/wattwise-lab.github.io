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
    'Tiles=ceil[area(1+waste)/(tile length×width)]',
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
    'Bricks=ceil[(wall−openings)(1+waste)/joint-adjusted face area]',
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
    'Cut length=round up(height+trim) to repeat; rolls=ceil(strips/floor(rollLength/cutLength))|裁切长度为 height+trim 按花纹重复长度向上取整；卷数 rolls=ceil(strips/floor(rollLength/cutLength))。',
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
    'Packs=ceil[area(1+waste)/packCoverage]',
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
    'Compare ceil(roomWidth/rollWidth)×roomLength and rotated layout|比较 ceil(roomWidth/rollWidth)×roomLength 与旋转铺设方向后的用量。',
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
    'Joint fraction=1−LW/[(L+j)(W+j)]; litres=area×fraction×depth(mm)',
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
    'Loose volume=area×finished depth×(1+compaction allowance)',
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
    'Litres=area(m²)×depth(cm)×10',
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
    'Positions=ceil(length/maxSpacing)+1',
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
    'Mass=area×thickness×density×(1+waste)',
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
    'Angle=atan(rise/run); area=projectedArea×√(1+(rise/run)²)',
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
    'Risers=ceil(totalRise/maxRiser); treads=risers−1',
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
    'Gradient=rise/run; length=√(rise²+run²)',
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
    'Open posts=ceil(length/spacing)+1; closed posts=ceil(length/spacing)',
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
    'Rows=ceil[(deckWidth+gap)/(boardWidth+gap)]',
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
      R('Volume|体积', ((v.t * v.w * v.l * v.q) / 12) * 0.002359737216, 'm³'),
    ],
    'Board feet=thickness(in)×width(in)×length(ft)×pieces/12',
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
    'Pieces=floor[(stock+kerf)/(piece+kerf)]',
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
    'A=r²acos((r−h)/r)−(r−h)√(2rh−h²); V=AL',
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
    'V=length×width×(shallow+deep)/2',
    [60, 60000],
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
    'Litres=roof area(m²)×rainfall(mm)×efficiency',
    [1600, 1000, 600],
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
    'Supply litres=area×depth/efficiency; minutes=litres/flow',
    [12.5, 250],
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
    'Seed mass=area×labelled rate×(1+waste)',
    [0.66, 1],
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
    'Product mass=area×chosen N rate/N fraction',
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
    'Fixtures=ceil(area×lux/(lumens×utilization×maintenance))',
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
    'ACH=airflow(m³/h)/roomVolume',
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
    'Energy=peak kW×peak sun hours×(1−loss)×days',
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
    'Saving kWh=A(Uold−Unew)degreeDays×24/(1000×efficiency)',
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
    'Annual saving=(old kWh−new kWh)×price',
    [50, 8],
  );
  D(
    'ev-fuel-cost-comparison',
    'EV vs Fuel Energy Cost|电车燃油车能耗费用比较',
    'Compare per-distance energy costs and purchase-price payback.|比较单位里程能源费与购车差价回收。',
    [
      n('f', 'Fuel consumption (L/100 km)|油耗（L/100 km）', 7),
      n('p', 'Fuel price per litre|每升燃油价格', 1.5),
      n('e', 'EV wall energy (kWh/100 km)|电车墙端能耗（kWh/100 km）', 18),
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
    'Annual saving=(fuel L×fuelPrice−wall kWh×electricityPrice)×annualKm/100',
    [10.5, 4.5, 600, 10],
    'Use electricity measured at the wall to include charging losses. Excludes maintenance, insurance, taxes, depreciation and incentives.|使用墙端电量以包含充电损失；不含维护、保险、税费、折旧与补贴。',
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
    'Total hours=distance/speed+stopMinutes/60',
    [3.5, 3],
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
      waste,
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
    'Budget=(transport+nights×lodging+people×days×dailySpend)(1+buffer)',
    [1210, 605, 1100],
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
    'New quantity=original quantity×target servings/original servings',
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
    'Water mass=coffee mass×water-to-coffee ratio',
    [300, 320],
    'Water input, not final beverage yield; retention and evaporation are excluded.|计算投入用水，不等于最终饮品量；未计吸水滞留与蒸发。',
  );
  D(
    'bakers-hydration',
    'Baker’s Hydration|烘焙含水率',
    'Include preferment flour and water in total dough hydration.|将酵种中的面粉与水计入面团总含水率。',
    [
      n('f', 'Main dough flour (g)|主面团面粉（g）', 450),
      n('w', 'Main dough water (g)|主面团水（g）', 300),
      n('s', 'Preferment total mass (g)|酵种总质量（g）', 100),
      n('h', 'Preferment hydration (%)|酵种含水率（%）', 100, 0, 1000),
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
    'Preferment flour=S/(1+h); hydration=(mainWater+prefermentWater)/(mainFlour+prefermentFlour)',
    [70, 500, 350],
  );
})();
