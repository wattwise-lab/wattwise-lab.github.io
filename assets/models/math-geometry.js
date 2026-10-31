(() => {
  'use strict';
  const { add, n, p, u, i, text, row: R, check, nums, sum, PI, rad, deg } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const radius = p('r', 'Radius (m)|半径（m）', 3),
    height = p('h', 'Height (m)|高（m）', 4);
  const matrix = [
    u('a', 'Row 1, column 1|第 1 行第 1 列', 1),
    u('b', 'Row 1, column 2|第 1 行第 2 列', 2),
    u('c', 'Row 2, column 1|第 2 行第 1 列', 3),
    u('d', 'Row 2, column 2|第 2 行第 2 列', 4),
  ];
  // Sorted, parenthesized Heron formula preserves needle-shaped triangles.
  // W. Kahan: https://people.eecs.berkeley.edu/~wkahan/Triangle.pdf
  const triangleArea = (a, b, c) => {
    const [x, y, z] = [a, b, c].sort((left, right) => right - left);
    check(z > x - y, 'The sides must form a nondegenerate triangle.|三边需构成非退化三角形。');
    return Math.sqrt((x + (y + z)) * (z - (x - y)) * (z + (x - y)) * (x + (y - z))) / 4;
  };
  // 48–79: distinct plane and solid geometry tasks.
  D(
    'rectangle',
    'Rectangle Area and Diagonal|矩形面积与对角线',
    'Calculate rectangle area, perimeter and diagonal from two side lengths.|由两边长度计算矩形面积、周长和对角线。',
    [p('a', 'Length (m)|长（m）', 3), p('b', 'Width (m)|宽（m）', 4)],
    (v) => [
      R('Area|面积', v.a * v.b, 'm²'),
      R('Perimeter|周长', 2 * (v.a + v.b), 'm'),
      R('Diagonal|对角线', Math.hypot(v.a, v.b), 'm'),
    ],
    'A=lw; P=2(l+w); d=√(l²+w²)',
    [12, 14, 5],
  );
  D(
    'parallelogram',
    'Parallelogram Calculator|平行四边形',
    'Calculate area using perpendicular height and perimeter using side lengths.|用垂直高求面积，用两邻边求周长。',
    [
      p('a', 'Base (m)|底（m）', 6),
      p('h', 'Perpendicular height (m)|垂直高（m）', 4),
      p('b', 'Adjacent side (m)|邻边（m）', 5),
    ],
    (v) => {
      check(
        v.h <= v.b,
        'Perpendicular height cannot exceed its adjacent side.|垂直高不能大于对应邻边。',
      );
      return [R('Area|面积', v.a * v.h, 'm²'), R('Perimeter|周长', 2 * (v.a + v.b), 'm')];
    },
    'Use A = bh and P = 2(b+s). b is base, h is perpendicular height, and s is the adjacent side, all in the same length unit. A is area and P is perimeter.|使用 A = bh 及 P = 2(b+s)。b 为底，h 为垂直高，s 为邻边，均使用同一长度单位；A 为面积，P 为周长。',
    [24, 22],
  );
  D(
    'trapezoid',
    'Trapezoid Area|梯形面积',
    'Find trapezoid area and the length of its midline.|求梯形面积及中位线长度。',
    [
      p('a', 'First parallel side (m)|第一条平行边（m）', 8),
      p('b', 'Second parallel side (m)|第二条平行边（m）', 5),
      height,
    ],
    (v) => [
      R('Area|面积', ((v.a + v.b) * v.h) / 2, 'm²'),
      R('Midline|中位线', (v.a + v.b) / 2, 'm'),
    ],
    'Use A = (a+b)h/2 and m = (a+b)/2. a and b are parallel side lengths and h is perpendicular height in the same unit. m is midline length.|使用 A = (a+b)h/2 及 m = (a+b)/2。a 与 b 为两条平行边长度，h 为同单位垂直高，m 为中位线长度。',
    [26, 6.5],
  );
  D(
    'rhombus',
    'Rhombus from Diagonals|菱形对角线计算',
    'Find area, side length and perimeter from perpendicular diagonals.|由两条对角线求菱形面积、边长和周长。',
    [
      p('a', 'First diagonal (m)|第一条对角线（m）', 6),
      p('b', 'Second diagonal (m)|第二条对角线（m）', 8),
    ],
    (v) => {
      const s = Math.hypot(v.a, v.b) / 2;
      return [
        R('Area|面积', (v.a * v.b) / 2, 'm²'),
        R('Side length|边长', s, 'm'),
        R('Perimeter|周长', 4 * s, 'm'),
      ];
    },
    'Use A = d₁d₂/2 and s = √(d₁²+d₂²)/2. d₁ and d₂ are the rhombus diagonals in the same length unit. A is area and s is side length.|使用 A = d₁d₂/2 及 s = √(d₁²+d₂²)/2。d₁ 与 d₂ 为同长度单位的菱形对角线，A 为面积，s 为边长。',
    [24, 5, 20],
  );
  D(
    'point-to-line-distance',
    'Point to Line Distance|点到直线距离',
    'Find perpendicular distance and the projection onto Ax+By+C=0.|求点到一般式直线的垂直距离及垂足。',
    [
      u('a', 'Line coefficient A|直线系数 A', 3),
      u('b', 'Line coefficient B|直线系数 B', 4),
      u('c', 'Line coefficient C|直线系数 C', -5),
      u('x', 'Point x|点 x', 1),
      u('y', 'Point y|点 y', 2),
    ],
    (v) => {
      const d = v.a * v.a + v.b * v.b;
      check(d > 0, 'A and B cannot both be zero.|A 和 B 不能同时为零。');
      const q = v.a * v.x + v.b * v.y + v.c;
      return [
        R('Perpendicular distance|垂直距离', Math.abs(q) / Math.sqrt(d)),
        R('Projection x|垂足 x', v.x - (v.a * q) / d),
        R('Projection y|垂足 y', v.y - (v.b * q) / d),
      ];
    },
    'Use d = abs(Ax+By+C)/√(A²+B²) for the line Ax+By+C = 0 and point (x,y). abs means absolute value. The line coefficients A and B cannot both be zero.|对直线 Ax+By+C = 0 与点 (x,y)，使用 d = abs(Ax+By+C)/√(A²+B²)。abs 表示绝对值，直线系数 A 与 B 不能同时为零。',
    [1.2, 0.28, 1.04],
  );
  D(
    'ellipse',
    'Ellipse Area and Perimeter|椭圆面积与周长',
    'Find ellipse area and approximate perimeter from its semiaxes.|由半轴计算椭圆面积和近似周长。',
    [
      p('a', 'First semiaxis (m)|第一条半轴（m）', 3),
      p('b', 'Second semiaxis (m)|第二条半轴（m）', 2),
    ],
    (v) => {
      const h = ((v.a - v.b) / (v.a + v.b)) ** 2;
      return [
        R('Area|面积', PI * v.a * v.b, 'm²'),
        R(
          'Approximate perimeter|近似周长',
          PI * (v.a + v.b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))),
          'm',
        ),
      ];
    },
    'A=πab; perimeter uses Ramanujan’s second approximation.|A=πab；周长采用拉马努金第二近似公式。',
    [18.84955592153876, 15.865439589251233],
    'Inputs are semiaxes, half the full axis lengths. Perimeter is approximate.|输入是完整轴长的一半；椭圆周长采用近似式。',
  );
  D(
    'sector',
    'Circular Sector|扇形面积',
    'Find the area, arc and boundary length of a circular sector.|由半径和圆心角求扇形面积、弧长及边界长度。',
    [radius, n('a', 'Central angle (degrees)|圆心角（度）', 60, 0, 360)],
    (v) => {
      const angle = rad(v.a),
        arc = v.r * angle;
      return [
        R('Sector area|扇形面积', (v.r * v.r * angle) / 2, 'm²'),
        R('Arc length|弧长', arc, 'm'),
        R('Boundary length|边界长度', arc + 2 * v.r, 'm'),
      ];
    },
    'Convert the entered angle a in degrees to θ = πa/180 radians. Use A = r²θ/2 and s = rθ. r is radius, A is sector area, and s is arc length.|将自填角度 a 从度换算为弧度 θ = πa/180，再使用 A = r²θ/2 及 s = rθ。r 为半径，A 为扇形面积，s 为弧长。',
    [4.71238898038469, PI, 9.141592653589793],
  );
  D(
    'circular-segment',
    'Circular Segment|圆弓形面积',
    'Find the area enclosed by a chord and its selected circular arc.|求弦与所选圆弧围成的弓形面积。',
    [p('r', 'Radius (m)|半径（m）', 2), n('a', 'Arc angle (degrees)|圆弧对应角（度）', 60, 0, 360)],
    (v) => {
      const a = rad(v.a);
      return [
        R('Segment area|弓形面积', (v.r * v.r * (a - Math.sin(a))) / 2, 'm²'),
        R('Chord|弦长', 2 * v.r * Math.sin(a / 2), 'm'),
      ];
    },
    'Convert the entered angle a in degrees to θ = πa/180 radians. Use A = r²(θ−sinθ)/2 and c = 2r sin(θ/2). r is radius, A is segment area, and c is chord length.|将自填角度 a 从度换算为弧度 θ = πa/180，再使用 A = r²(θ−sinθ)/2 及 c = 2r sin(θ/2)。r 为半径，A 为圆弓形面积，c 为弦长。',
    [0.3623442948243183, 2],
  );
  D(
    'annulus',
    'Annulus Calculator|圆环面积',
    'Find area and total inner-plus-outer boundary of a circular ring.|求圆环面积及内外边界总长。',
    [p('a', 'Outer radius (m)|外半径（m）', 5), n('b', 'Inner radius (m)|内半径（m）', 2)],
    (v) => {
      check(v.a > v.b, 'Outer radius must exceed inner radius.|外半径必须大于内半径。');
      return [
        R('Ring area|圆环面积', PI * (v.a * v.a - v.b * v.b), 'm²'),
        R('Total boundary|边界总长', 2 * PI * (v.a + v.b), 'm'),
      ];
    },
    'Use A = π(R²−r²) and P = 2π(R+r). R and r are outer and inner radii in the same unit. A is annular area; P includes both boundary circles.|使用 A = π(R²−r²) 及 P = 2π(R+r)。R 与 r 为同单位外、内半径；A 为圆环面积，P 包含内外两条圆周。',
    [65.97344572538566, 43.982297150257104],
  );
  D(
    'regular-polygon',
    'Regular Polygon|正多边形',
    'Find area, perimeter, apothem and circumradius for a regular polygon.|由边数和边长求正多边形面积、周长、边心距和外接圆半径。',
    [i('n', 'Number of sides|边数', 6, 3, 10000), p('s', 'Side length (m)|边长（m）', 2)],
    (v) => [
      R('Area|面积', (v.n * v.s * v.s) / (4 * Math.tan(PI / v.n)), 'm²'),
      R('Perimeter|周长', v.n * v.s, 'm'),
      R('Apothem|边心距', v.s / (2 * Math.tan(PI / v.n)), 'm'),
      R('Circumradius|外接圆半径', v.s / (2 * Math.sin(PI / v.n)), 'm'),
    ],
    'Use A = ns²/[4tan(π/n)] and P = ns. n is the number of equal sides and s is side length. The tangent uses radians. A is area and P is perimeter.|使用 A = ns²/[4tan(π/n)] 及 P = ns。n 为等长边数，s 为边长，正切按弧度计算；A 为面积，P 为周长。',
    [10.392304845413264, 12, Math.sqrt(3), 2],
  );
  D(
    'polygon-area',
    'Polygon Area from Coordinates|坐标多边形面积',
    'Use ordered vertices to find a simple polygon’s area and perimeter.|按顺序输入顶点，求简单多边形面积和周长。',
    [text('values', 'Ordered x,y coordinate pairs (m)|顺序排列的 x,y 坐标（m）', '0,0 4,0 0,3')],
    (v) => {
      const a = nums(v.values);
      check(
        a.length >= 6 && a.length % 2 === 0,
        'Enter at least three x,y pairs.|至少输入三组 x,y 坐标。',
      );
      let area = 0,
        perimeter = 0;
      for (let k = 0; k < a.length; k += 2) {
        const j = (k + 2) % a.length;
        area += a[k] * a[j + 1] - a[j] * a[k + 1];
        perimeter += Math.hypot(a[j] - a[k], a[j + 1] - a[k + 1]);
      }
      return [R('Area|面积', Math.abs(area) / 2, 'm²'), R('Perimeter|周长', perimeter, 'm')];
    },
    'Use A = abs[Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)]/2. (xᵢ,yᵢ) are vertices in boundary order; the last vertex connects back to the first. abs means absolute value. Coordinates must use the same length unit.|使用 A = abs[Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)]/2。(xᵢ,yᵢ) 为沿边界顺序排列的顶点，末点连接回首点；abs 表示绝对值，坐标使用相同长度单位。',
    [6, 12],
    'Vertices must follow the boundary of a non-self-intersecting polygon. Self-intersections are not interpreted as filled unions.|顶点需沿不自交的多边形边界排列；自交图形不按区域并集求面积。',
  );
  D(
    'herons-formula',
    'Heron’s Triangle Formula|海伦公式',
    'Find triangle area and inscribed and circumscribed radii from three sides.|由三边求三角形面积及内、外接圆半径。',
    [
      p('a', 'Side a (m)|边 a（m）', 3),
      p('b', 'Side b (m)|边 b（m）', 4),
      p('c', 'Side c (m)|边 c（m）', 5),
    ],
    (v) => {
      const s = (v.a + v.b + v.c) / 2;
      const area = triangleArea(v.a, v.b, v.c);
      return [
        R('Area|面积', area, 'm²'),
        R('Inradius|内接圆半径', area / s, 'm'),
        R('Circumradius|外接圆半径', (v.a * v.b * v.c) / (4 * area), 'm'),
      ];
    },
    's=(a+b+c)/2; A=√(s(s−a)(s−b)(s−c))',
    [6, 1, 2.5],
  );
  D(
    'law-of-sines',
    'Law of Sines|正弦定理',
    'Solve a triangle from two angles and the side opposite the first.|由两个角及第一角的对边解三角形。',
    [
      p('a', 'Side opposite A (m)|角 A 的对边（m）', 5),
      n('A', 'Angle A (degrees)|角 A（度）', 30, 0.000001, 179.999999),
      n('B', 'Angle B (degrees)|角 B（度）', 60, 0.000001, 179.999999),
    ],
    (v) => {
      check(
        v.A + v.B < 180,
        'Angles A and B must sum to less than 180 degrees.|角 A、B 之和必须小于 180 度。',
      );
      const c = 180 - v.A - v.B;
      return [
        R('Side opposite B|角 B 的对边', (v.a * Math.sin(rad(v.B))) / Math.sin(rad(v.A)), 'm'),
        R('Side opposite C|角 C 的对边', (v.a * Math.sin(rad(c))) / Math.sin(rad(v.A)), 'm'),
        R('Angle C|角 C', c, '°'),
      ];
    },
    'Use a/sin(A) = b/sin(B) = c/sin(C) and C = 180°−A−B. Each lowercase side is opposite its matching uppercase angle. Input angles are in degrees and side lengths share a unit.|使用 a/sin(A) = b/sin(B) = c/sin(C) 及 C = 180°−A−B。每个小写边长均为对应大写角的对边；输入角度使用度，所有边长使用相同单位。',
    [8.660254037844387, 10, 90],
  );
  D(
    'law-of-cosines',
    'Law of Cosines|余弦定理',
    'Find the missing side and area from two sides and their included angle.|由两边及夹角求第三边和三角形面积。',
    [
      p('b', 'First side (m)|第一边（m）', 3),
      p('c', 'Second side (m)|第二边（m）', 4),
      n('A', 'Included angle (degrees)|夹角（度）', 90, 0.000001, 179.999999),
    ],
    (v) => [
      R(
        'Opposite side|夹角对边',
        Math.hypot(v.b - v.c, 2 * Math.sqrt(v.b * v.c) * Math.sin(rad(v.A) / 2)),
        'm',
      ),
      R('Area|面积', (v.b * v.c * Math.sin(rad(v.A))) / 2, 'm²'),
    ],
    'Use a² = b²+c²−2bc cos(A) and K = bc sin(A)/2. b and c are the entered sides and A is their included angle in degrees. a is the opposite side and K is triangle area.|使用 a² = b²+c²−2bc cos(A) 及 K = bc sin(A)/2。b 与 c 为自填两边，A 为其夹角（度），a 为对边，K 为三角形面积。',
    [5, 6],
  );
  D(
    'triangle-centroid',
    'Triangle Centroid|三角形重心',
    'Average the three vertex coordinates to locate the triangle centroid.|根据三个顶点坐标求三角形重心。',
    [
      u('a', 'Vertex A: x|顶点 A：x', 0),
      u('b', 'Vertex A: y|顶点 A：y', 0),
      u('c', 'Vertex B: x|顶点 B：x', 6),
      u('d', 'Vertex B: y|顶点 B：y', 0),
      u('e', 'Vertex C: x|顶点 C：x', 0),
      u('f', 'Vertex C: y|顶点 C：y', 9),
    ],
    (v) => {
      check(
        (v.c - v.a) * (v.f - v.b) !== (v.e - v.a) * (v.d - v.b),
        'Vertices must not lie on one line.|三个顶点不能共线。',
      );
      return [
        R('Centroid x|重心 x', (v.a + v.c + v.e) / 3),
        R('Centroid y|重心 y', (v.b + v.d + v.f) / 3),
      ];
    },
    'G=((x₁+x₂+x₃)/3,(y₁+y₂+y₃)/3)',
    [2, 3],
  );
  D(
    'circle-equation',
    'Circle Equation|圆的方程',
    'Write a circle equation from its centre and radius.|根据圆心和半径写出圆的标准方程。',
    [u('a', 'Centre x|圆心 x', 1), u('b', 'Centre y|圆心 y', 2), p('r', 'Radius|半径', 3)],
    (v) => {
      const term = (name, x) => '(' + name + (x < 0 ? ' + ' : ' - ') + Math.abs(x) + ')²';
      return [
        R('Circle equation|圆的方程', term('x', v.a) + ' + ' + term('y', v.b) + ' = ' + v.r * v.r),
        R('Radius squared|半径平方', v.r * v.r),
      ];
    },
    '(x−h)²+(y−k)²=r²',
    ['(x - 1)² + (y - 2)² = 9', 9],
  );
  D(
    'tangent-length',
    'Tangent Length to Circle|圆外切线长度',
    'Find tangent length from an external point to a circle.|由圆外点到圆心的距离和半径求切线长。',
    [p('d', 'Distance to centre (m)|到圆心的距离（m）', 5), radius],
    (v) => {
      check(v.d >= v.r, 'The point must be on or outside the circle.|该点必须位于圆上或圆外。');
      return [R('Tangent length|切线长度', Math.sqrt(v.d * v.d - v.r * v.r), 'm')];
    },
    't=√(d²−r²)',
    [4],
  );
  D(
    'chord-length',
    'Chord Length from Centre Offset|弦长计算器',
    'Find chord length from radius and perpendicular distance to the centre.|由半径及圆心到弦的垂直距离求弦长。',
    [
      p('r', 'Radius (m)|半径（m）', 5),
      n('d', 'Centre-to-chord offset (m)|圆心到弦的距离（m）', 3),
    ],
    (v) => {
      check(v.d <= v.r, 'Offset cannot exceed the radius.|圆心到弦的距离不能大于半径。');
      return [
        R('Chord length|弦长', 2 * Math.sqrt(v.r * v.r - v.d * v.d), 'm'),
        R('Minor central angle|较小圆心角', 2 * deg(Math.acos(v.d / v.r)), '°'),
      ];
    },
    'Use c = 2√(r²−d²). r is radius and d is perpendicular distance from the centre to the chord in the same unit. Chord length c uses that length unit.|使用 c = 2√(r²−d²)。r 为半径，d 为圆心到弦的同单位垂直距离；弦长 c 使用该长度单位。',
    [8, 106.26020470831196],
  );
  D(
    'arc-central-angle',
    'Central Angle from Arc Length|弧长反求圆心角',
    'Find a circle’s central angle and chord from a measured arc length.|由弧长和半径反求圆心角及弦长。',
    [radius, n('s', 'Arc length (m)|弧长（m）', PI)],
    (v) => {
      check(
        v.s <= 2 * PI * v.r,
        'Arc length must not exceed one circumference.|弧长不能超过一整圈周长。',
      );
      const a = v.s / v.r;
      return [
        R('Central angle|圆心角', deg(a), '°'),
        R('Chord length|弦长', 2 * v.r * Math.sin(a / 2), 'm'),
      ];
    },
    'Use θ = s/r and c = 2r sin(θ/2). s is arc length and r is radius in the same unit. θ is radians before conversion to displayed degrees; c is chord length.|使用 θ = s/r 及 c = 2r sin(θ/2)。s 为弧长，r 为同单位半径；θ 为弧度，随后换算成度显示，c 为弦长。',
    [60, 3],
  );
  D(
    'sagitta',
    'Sagitta of a Circular Arc|圆弧弓高',
    'Find the minor-arc height above a chord.|由半径和弦长求较小圆弧的弓高。',
    [p('r', 'Radius (m)|半径（m）', 5), n('c', 'Chord length (m)|弦长（m）', 8)],
    (v) => {
      check(v.c <= 2 * v.r, 'Chord cannot exceed the diameter.|弦长不能大于直径。');
      const half = v.c / 2;
      return [
        R('Sagitta|弓高', (half * half) / (v.r + Math.sqrt((v.r - half) * (v.r + half))), 'm'),
      ];
    },
    'h=r−√(r²−c²/4)',
    [2],
  );
  D(
    'cube',
    'Cube Volume and Surface|正方体体积与表面积',
    'Find cube volume, surface area and space diagonal.|求正方体体积、表面积和体对角线。',
    [p('a', 'Edge length (m)|棱长（m）', 3)],
    (v) => [
      R('Physical volume|体积', v.a ** 3, 'm³'),
      R('Surface area|表面积', 6 * v.a * v.a, 'm²'),
      R('Space diagonal|体对角线', v.a * Math.sqrt(3), 'm'),
    ],
    'V=a³; S=6a²; d=a√3',
    [27, 54, 5.196152422706632],
  );
  D(
    'cuboid',
    'Cuboid Calculator|长方体计算器',
    'Find a rectangular box’s volume, surface and space diagonal.|求长方体体积、表面积和体对角线。',
    [
      p('a', 'Length (m)|长（m）', 3),
      p('b', 'Width (m)|宽（m）', 4),
      p('c', 'Height (m)|高（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', v.a * v.b * v.c, 'm³'),
      R('Surface area|表面积', 2 * (v.a * v.b + v.b * v.c + v.a * v.c), 'm²'),
      R('Space diagonal|体对角线', Math.hypot(v.a, v.b, v.c), 'm'),
    ],
    'Use V = lwh and S = 2(lw+lh+wh). l, w and h are cuboid length, width and height in the same unit. V is volume and S is total surface area.|使用 V = lwh 及 S = 2(lw+lh+wh)。l、w、h 为同单位长方体长、宽、高；V 为体积，S 为总表面积。',
    [60, 94, 7.0710678118654755],
  );
  D(
    'sphere',
    'Sphere Volume and Surface|球体体积与表面积',
    'Find volume, surface area and diameter from a sphere’s radius.|由半径求球体积、表面积和直径。',
    [p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Physical volume|体积', (4 * PI * v.r ** 3) / 3, 'm³'),
      R('Surface area|表面积', 4 * PI * v.r * v.r, 'm²'),
      R('Diameter|直径', 2 * v.r, 'm'),
    ],
    'V=4πr³/3; S=4πr²',
    [33.510321638291124, 50.26548245743669, 4],
  );
  D(
    'cylinder',
    'Cylinder Volume and Surface|圆柱体计算器',
    'Find right-cylinder volume and total surface including both ends.|求直圆柱体积及包含两底面的总表面积。',
    [radius, p('h', 'Height (m)|高（m）', 5)],
    (v) => [
      R('Physical volume|体积', PI * v.r * v.r * v.h, 'm³'),
      R('Total surface|总表面积', 2 * PI * v.r * (v.r + v.h), 'm²'),
      R('Lateral surface|侧面积', 2 * PI * v.r * v.h, 'm²'),
    ],
    'V=πr²h; S=2πr(r+h)',
    [141.3716694115407, 150.79644737231007, 94.24777960769379],
  );
  D(
    'cone',
    'Cone Volume and Surface|圆锥体计算器',
    'Find a right circular cone’s volume, slant height and total surface.|求直圆锥体积、母线长和总表面积。',
    [radius, height],
    (v) => {
      const l = Math.hypot(v.r, v.h);
      return [
        R('Physical volume|体积', (PI * v.r * v.r * v.h) / 3, 'm³'),
        R('Total surface|总表面积', PI * v.r * (v.r + l), 'm²'),
        R('Slant height|母线长', l, 'm'),
      ];
    },
    'V=πr²h/3; l=√(r²+h²); S=πr(r+l)',
    [37.69911184307752, 75.39822368615503, 5],
  );
  D(
    'conical-frustum',
    'Conical Frustum|圆台体积与表面积',
    'Calculate a conical frustum from two circular radii and vertical height.|由两个底面半径和垂直高求圆台体积与表面积。',
    [
      p('a', 'Larger radius (m)|大底半径（m）', 3),
      n('b', 'Smaller radius (m)|小底半径（m）', 1),
      height,
    ],
    (v) => {
      check(v.a >= v.b, 'Larger radius must not be smaller.|大底半径不得小于小底半径。');
      const l = Math.hypot(v.a - v.b, v.h);
      return [
        R('Physical volume|体积', (PI * v.h * (v.a * v.a + v.a * v.b + v.b * v.b)) / 3, 'm³'),
        R('Slant height|母线长', l, 'm'),
        R('Total surface|总表面积', PI * (v.a * v.a + v.b * v.b + (v.a + v.b) * l), 'm²'),
      ];
    },
    'V=πh(R²+Rr+r²)/3; S=π(R²+r²+(R+r)l)',
    [54.454272662223076, 4.47213595499958],
  );
  D(
    'rectangular-pyramid',
    'Right Rectangular Pyramid|直四棱锥计算器',
    'Find volume and surface of a pyramid centred over a rectangular base.|求顶点位于矩形底面中心正上方的四棱锥体积与表面积。',
    [p('a', 'Base length (m)|底面长（m）', 6), p('b', 'Base width (m)|底面宽（m）', 6), height],
    (v) => [
      R('Physical volume|体积', (v.a * v.b * v.h) / 3, 'm³'),
      R(
        'Surface area|表面积',
        v.a * v.b + v.a * Math.hypot(v.h, v.b / 2) + v.b * Math.hypot(v.h, v.a / 2),
        'm²',
      ),
    ],
    'Use V = lwh/3 and S = lw+l√(h²+(w/2)²)+w√(h²+(l/2)²). l and w are rectangular base dimensions and h is perpendicular height, all in the same unit. S includes the base.|使用 V = lwh/3 及 S = lw+l√(h²+(w/2)²)+w√(h²+(l/2)²)。l 与 w 为矩形底面长宽，h 为垂直高，均使用同一单位；S 包含底面积。',
    [48, 96],
  );
  D(
    'prism',
    'Right Prism|直棱柱计算器',
    'Find volume and surface from base area, base perimeter and length.|由底面积、底面周长及柱高求直棱柱体积和表面积。',
    [
      p('a', 'Base area (m²)|底面积（m²）', 12),
      p('p', 'Base perimeter (m)|底面周长（m）', 14),
      p('h', 'Prism height (m)|柱高（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', v.a * v.h, 'm³'),
      R('Total surface|总表面积', 2 * v.a + v.p * v.h, 'm²'),
    ],
    'V=Ah; S=2A+Ph',
    [60, 94],
  );
  D(
    'torus',
    'Torus Volume and Surface|圆环体体积与表面积',
    'Find a ring torus’s volume and surface from major and tube radii.|由中心圆半径和管截面半径求圆环体体积与表面积。',
    [p('a', 'Major radius (m)|中心圆半径（m）', 3), p('b', 'Tube radius (m)|管半径（m）', 1)],
    (v) => {
      check(
        v.a > v.b,
        'A ring torus requires major radius greater than tube radius.|圆环体中心圆半径需大于管半径。',
      );
      return [
        R('Physical volume|体积', 2 * PI * PI * v.a * v.b * v.b, 'm³'),
        R('Surface area|表面积', 4 * PI * PI * v.a * v.b, 'm²'),
      ];
    },
    'V=2π²Rr²; S=4π²Rr',
    [59.21762640653615, 118.4352528130723],
  );
  D(
    'ellipsoid-volume',
    'Ellipsoid Volume|椭球体积',
    'Find ellipsoid volume from its three perpendicular semiaxes.|由三条互相垂直的半轴求椭球体积。',
    [
      p('a', 'Semiaxis a (m)|半轴 a（m）', 3),
      p('b', 'Semiaxis b (m)|半轴 b（m）', 2),
      p('c', 'Semiaxis c (m)|半轴 c（m）', 1),
    ],
    (v) => [R('Physical volume|体积', (4 * PI * v.a * v.b * v.c) / 3, 'm³')],
    'Use V = 4πabc/3. a, b and c are the ellipsoid semiaxes in the same unit, not full diameters. Volume V uses the cubed length unit.|使用 V = 4πabc/3。a、b、c 为同单位椭球半轴，并非完整直径；体积 V 使用该长度单位的立方。',
    [25.132741228718345],
  );
  D(
    'capsule',
    'Capsule Volume and Surface|胶囊体计算器',
    'Find a cylinder-plus-two-hemispheres capsule’s volume and surface.|求圆柱加两端半球组成的胶囊体体积和表面积。',
    [
      p('r', 'Radius (m)|半径（m）', 2),
      n('h', 'Straight cylinder length (m)|直圆柱段长度（m）', 5),
    ],
    (v) => [
      R('Physical volume|体积', PI * v.r * v.r * v.h + (4 * PI * v.r ** 3) / 3, 'm³'),
      R('Surface area|表面积', 2 * PI * v.r * v.h + 4 * PI * v.r * v.r, 'm²'),
      R('Total end-to-end length|整体长度', v.h + 2 * v.r, 'm'),
    ],
    'V=πr²h+4πr³/3; S=2πrh+4πr²',
    [96.34217471008699, 113.09733552923255, 9],
  );
  D(
    'hemisphere',
    'Hemisphere Calculator|半球体计算器',
    'Find a hemisphere’s volume, curved area and total area including its base.|求半球体积、曲面面积及包含底面的总面积。',
    [p('r', 'Radius (m)|半径（m）', 2)],
    (v) => [
      R('Physical volume|体积', (2 * PI * v.r ** 3) / 3, 'm³'),
      R('Curved area|曲面面积', 2 * PI * v.r * v.r, 'm²'),
      R('Total area with base|含底面总面积', 3 * PI * v.r * v.r, 'm²'),
    ],
    'Use V = 2πr³/3, C = 2πr² and S = 3πr². r is radius, V is hemisphere volume, C is curved area, and S includes the circular base.|使用 V = 2πr³/3、C = 2πr² 及 S = 3πr²。r 为半径，V 为半球体积，C 为曲面面积，S 包含圆形底面。',
    [16.755160819145562, 25.132741228718345, 37.69911184307752],
  );
  // 80–88: trigonometry and numerical algebra.
  D(
    'trigonometry',
    'Trigonometric Functions|三角函数值',
    'Calculate sine, cosine and tangent for an angle in degrees.|计算角度对应的正弦、余弦和正切值。',
    [u('a', 'Angle (degrees)|角度（度）', 30)],
    (v) => {
      const q = v.a / 90,
        whole = Number.isInteger(q),
        idx = ((q % 4) + 4) % 4;
      return [
        R('Sine|正弦', whole ? [0, 1, 0, -1][idx] : Math.sin(rad(v.a))),
        R('Cosine|余弦', whole ? [1, 0, -1, 0][idx] : Math.cos(rad(v.a))),
        R(
          'Tangent|正切',
          whole && Math.abs(q % 2) === 1 ? 'Undefined|未定义' : whole ? 0 : Math.tan(rad(v.a)),
        ),
      ];
    },
    'sinθ, cosθ, tanθ=sinθ/cosθ; tangent undefined at odd multiples of 90°.|sinθ, cosθ, tanθ=sinθ/cosθ；角度为 90° 的奇数倍时，正切没有定义。',
    [0.5, 0.8660254037844386, 0.5773502691896257],
  );
  D(
    'hyperbolic-functions',
    'Hyperbolic Functions|双曲函数值',
    'Calculate hyperbolic sine, cosine and tangent for a real argument.|计算实数对应的双曲正弦、余弦和正切。',
    [n('a', 'Real argument|实数自变量', 1, -100, 100)],
    (v) => [
      R('Hyperbolic sine|双曲正弦', Math.sinh(v.a)),
      R('Hyperbolic cosine|双曲余弦', Math.cosh(v.a)),
      R('Hyperbolic tangent|双曲正切', Math.tanh(v.a)),
    ],
    "Use sinh(x) = (e^x−e^(−x))/2, cosh(x) = (e^x+e^(−x))/2 and tanh(x) = sinh(x)/cosh(x). x is the real argument and e is Euler's number.|使用 sinh(x) = (e^x−e^(−x))/2、cosh(x) = (e^x+e^(−x))/2 及 tanh(x) = sinh(x)/cosh(x)。x 为实数自变量，e 为自然常数。",
    [1.1752011936438014, 1.5430806348152437, 0.7615941559557649],
  );
  D(
    'triangle-angles',
    'Triangle Angles from Sides|三边求三角形内角',
    'Find all three angles opposite the supplied side lengths.|根据三边计算其各自对角。',
    [p('a', 'Side a|边 a', 3), p('b', 'Side b|边 b', 4), p('c', 'Side c|边 c', 5)],
    (v) => {
      const area = triangleArea(v.a, v.b, v.c);
      const angle = (a, b, c) => {
        const cosineNumerator = b >= c ? (b - a) * (b + a) + c * c : (c - a) * (c + a) + b * b;
        return deg(Math.atan2(4 * area, cosineNumerator));
      };
      return [
        R('Angle A|角 A', angle(v.a, v.b, v.c), '°'),
        R('Angle B|角 B', angle(v.b, v.a, v.c), '°'),
        R('Angle C|角 C', angle(v.c, v.a, v.b), '°'),
      ];
    },
    'A=acos((b²+c²−a²)/(2bc)); similarly for B and C.|A=acos((b²+c²−a²)/(2bc))；B 和 C 的计算方式类似。',
    [36.86989764584401, 53.13010235415598, 90],
  );
  D(
    'matrix-eigenvalues',
    '2 × 2 Matrix Eigenvalues|二阶矩阵特征值',
    'Find real or conjugate-complex eigenvalues of a two-by-two matrix.|求二阶矩阵的实特征值或共轭复特征值。',
    matrix.map((f, k) => ({ ...f, value: [2, 1, 1, 2][k] })),
    (v) => {
      const tr = v.a + v.d,
        disc = (v.a - v.d) ** 2 + 4 * v.b * v.c;
      if (disc >= 0) {
        // Recover the smaller root from the product instead of subtracting near-equals.
        const q = (tr + (tr < 0 ? -1 : 1) * Math.sqrt(disc)) / 2;
        const other = q === 0 ? 0 : (v.a * v.d - v.b * v.c) / q;
        return [
          R('First real part|第一特征值实部', Math.max(q, other)),
          R('First imaginary part|第一特征值虚部', 0),
          R('Second real part|第二特征值实部', Math.min(q, other)),
          R('Second imaginary part|第二特征值虚部', 0),
        ];
      }
      return [
        R('First real part|第一特征值实部', tr / 2),
        R('First imaginary part|第一特征值虚部', Math.sqrt(-disc) / 2),
        R('Second real part|第二特征值实部', tr / 2),
        R('Second imaginary part|第二特征值虚部', -Math.sqrt(-disc) / 2),
      ];
    },
    'For the matrix [[a,b],[c,d]], use λ = (a+d±√((a−d)²+4bc))/2. A negative discriminant gives conjugate complex eigenvalues; the result lists real and imaginary parts separately.|对矩阵 [[a,b],[c,d]]，使用 λ = (a+d±√((a−d)²+4bc))/2。判别式为负时得到共轭复特征值，结果分别列出实部与虚部。',
    [3, 0, 1, 0],
  );
  D(
    'matrix-rank',
    '2 × 2 Matrix Rank|二阶矩阵的秩',
    'Determine rank with a floating-point tolerance tied to determinant products.|以和行列式乘积尺度相关的容差判断二阶矩阵的秩。',
    matrix,
    (v) => {
      const det = v.a * v.d - v.b * v.c,
        tol = 8 * Number.EPSILON * Math.max(Math.abs(v.a * v.d), Math.abs(v.b * v.c));
      const rank = Math.abs(det) > tol ? 2 : [v.a, v.b, v.c, v.d].some((x) => x !== 0) ? 1 : 0;
      return [R('Numerical rank|数值秩', rank), R('Determinant|行列式', det)];
    },
    'Rank 2 if determinant is numerically nonzero, rank 1 for a nonzero singular matrix, otherwise 0.|行列式在数值判断中不为零时秩为 2；非零奇异矩阵的秩为 1；否则为 0。',
    [2, -2],
    'Near-singular floating-point matrices can be numerically ambiguous. Exact symbolic rank is outside this tool.|接近奇异的浮点矩阵可能存在数值歧义；本工具不计算符号精确秩。',
  );
  D(
    'linear-interpolation',
    'Linear Interpolation|线性插值',
    'Estimate a value between two known coordinate pairs.|根据两个已知点线性插值。',
    [
      u('a', 'First x|第一个 x', 0),
      u('b', 'First y|第一个 y', 10),
      u('c', 'Second x|第二个 x', 100),
      u('d', 'Second y|第二个 y', 30),
      u('x', 'Target x|目标 x', 50),
    ],
    (v) => {
      check(v.a !== v.c, 'The x coordinates must differ.|两个 x 坐标必须不同。');
      return [R('Interpolated y|插值 y', v.b + ((v.x - v.a) * (v.d - v.b)) / (v.c - v.a))];
    },
    'y=y₁+(x−x₁)(y₂−y₁)/(x₂−x₁)',
    [20],
    'Values outside the two input x coordinates are linear extrapolations, not measured observations.|目标 x 在两已知点之外时属于线性外推，而非实测值。',
  );
  D(
    'quadratic-interpolation',
    'Quadratic Interpolation|二次插值',
    'Use three points with distinct x values to evaluate a quadratic interpolant.|用三个横坐标不同的点求二次插值。',
    [
      u('a', 'Point 1: x|点 1：x', 0),
      u('b', 'Point 1: y|点 1：y', 0),
      u('c', 'Point 2: x|点 2：x', 1),
      u('d', 'Point 2: y|点 2：y', 1),
      u('e', 'Point 3: x|点 3：x', 2),
      u('f', 'Point 3: y|点 3：y', 4),
      u('x', 'Target x|目标 x', 1.5),
    ],
    (v) => {
      check(
        v.a !== v.c && v.a !== v.e && v.c !== v.e,
        'All three x coordinates must differ.|三个 x 坐标必须互不相同。',
      );
      return [
        R(
          'Interpolated y|插值 y',
          (v.b * (v.x - v.c) * (v.x - v.e)) / ((v.a - v.c) * (v.a - v.e)) +
            (v.d * (v.x - v.a) * (v.x - v.e)) / ((v.c - v.a) * (v.c - v.e)) +
            (v.f * (v.x - v.a) * (v.x - v.c)) / ((v.e - v.a) * (v.e - v.c)),
        ),
      ];
    },
    'Use y = Σ yᵢ ∏ⱼ≠ᵢ (x−xⱼ)/(xᵢ−xⱼ) over the three entered points (xᵢ,yᵢ). x is the target coordinate. The input horizontal coordinates must be distinct; outside them, the polynomial is an extrapolation.|对三个自填点 (xᵢ,yᵢ)，使用 y = Σ yᵢ ∏ⱼ≠ᵢ (x−xⱼ)/(xᵢ−xⱼ)。x 为目标横坐标，输入横坐标必须互不相同；目标位于其范围外时属于多项式外推。',
    [2.25],
  );
  D(
    'polynomial-derivative',
    'Polynomial Derivative|多项式求导',
    'Differentiate coefficient-form polynomials and evaluate the derivative at x.|对按系数输入的多项式求导，并计算指定 x 处的导数。',
    [
      text('values', 'Coefficients, highest power first|系数（从最高次到常数项）', '3,2,1'),
      u('x', 'Evaluate at x|求值点 x', 2),
    ],
    (v) => {
      const a = nums(v.values);
      check(a.length <= 21, 'Maximum polynomial degree is 20.|多项式最高支持 20 次。');
      const degree = a.length - 1,
        d = a.slice(0, -1).map((c, k) => c * (degree - k));
      return [
        R(
          'Derivative at x|该点导数',
          d.reduce((value, c) => value * v.x + c, 0),
        ),
        R(
          'Derivative coefficients, descending powers|导数系数（降幂）',
          d.length ? d.join(', ') : '0',
        ),
      ];
    },
    'd(aₙxⁿ)/dx = n aₙ x^(n−1)',
    [14, '6, 2'],
  );
  D(
    'polynomial-integral',
    'Definite Polynomial Integral|多项式定积分',
    'Integrate a coefficient-form polynomial between two limits.|计算按系数输入的多项式在两界限间的定积分。',
    [
      text('values', 'Coefficients, highest power first|系数（从最高次到常数项）', '3,2,1'),
      u('a', 'Lower limit|下限', 0),
      u('b', 'Upper limit|上限', 1),
    ],
    (v) => {
      const a = nums(v.values);
      check(a.length <= 21, 'Maximum polynomial degree is 20.|多项式最高支持 20 次。');
      const degree = a.length - 1;
      return [
        R(
          'Definite integral|定积分',
          sum(
            a.map((c, k) => {
              const p = degree - k + 1;
              return (c * (v.b ** p - v.a ** p)) / p;
            }),
          ),
        ),
      ];
    },
    'Integrate each polynomial term with ∫ aₙxⁿ dx = aₙx^(n+1)/(n+1), then evaluate F(b)−F(a). aₙ is a coefficient, n is its nonnegative integer power, and a and b are lower and upper limits. F is the summed antiderivative.|逐项使用 ∫ aₙxⁿ dx = aₙx^(n+1)/(n+1) 积分，再求 F(b)−F(a)。aₙ 为系数，n 为其非负整数幂，a 与 b 为积分下、上限，F 为各项相加所得原函数。',
    [3],
  );
})();
