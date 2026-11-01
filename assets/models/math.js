(() => {
  'use strict';
  const { add, n, p, u, i, text, select, row: R, check, nums, gcd, choose, PI, deg } = CMModels;
  const D = (slug, name, purpose, fields, calculate, formula, expected, note) =>
    add(slug, name, 'Math and Time', purpose, fields, calculate, formula, expected, note);
  const integers = (s) => {
    const a = nums(s);
    check(a.every(Number.isSafeInteger), 'Enter safe whole numbers.|请输入安全范围内的整数。');
    return a;
  };
  const bigGcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a || 1n;
  };
  const fraction = (value) => {
    const [m, e = '0'] = String(value).toLowerCase().split('e'),
      places = (m.split('.')[1] || '').length - Number(e);
    let a = BigInt(m.replace('.', '')),
      b = 1n;
    if (places > 0) b = 10n ** BigInt(places);
    else a *= 10n ** BigInt(-places);
    const g = bigGcd(a, b);
    return [a / g, b / g];
  };
  const points = [
    u('x1', 'First x|起点 x', 0),
    u('y1', 'First y|起点 y', 0),
    u('x2', 'Second x|终点 x', 6),
    u('y2', 'Second y|终点 y', 8),
  ];
  const matrix = [
    u('a', 'Row 1, column 1|第 1 行第 1 列', 1),
    u('b', 'Row 1, column 2|第 1 行第 2 列', 2),
    u('c', 'Row 2, column 1|第 2 行第 1 列', 3),
    u('d', 'Row 2, column 2|第 2 行第 2 列', 4),
  ];
  const vectors = [
    u('a', 'Vector A: x|向量 A：x', 1),
    u('b', 'Vector A: y|向量 A：y', 2),
    u('c', 'Vector A: z|向量 A：z', 3),
    u('d', 'Vector B: x|向量 B：x', 4),
    u('e', 'Vector B: y|向量 B：y', 5),
    u('f', 'Vector B: z|向量 B：z', 6),
  ];
  // 1–21: arithmetic and number representation.
  D(
    'ratio-simplifier',
    'Ratio Simplifier|比例化简',
    'Reduce two whole-number quantities to their smallest ratio.|把两个整数数量约成最简比例。',
    [i('a', 'First quantity|第一项', 12, 0, 1e12), i('b', 'Second quantity|第二项', 18, 0, 1e12)],
    (v) => {
      check(v.a || v.b, 'The two quantities cannot both be zero.|两项不能同时为零。');
      const g = gcd(v.a, v.b);
      return [
        R('First reduced term|化简后第一项', v.a / g),
        R('Second reduced term|化简后第二项', v.b / g),
      ];
    },
    'Use a:b = (a/g):(b/g), where g = gcd(a,b) is the greatest common divisor of the entered nonnegative integers. The quantities cannot both be zero.|使用 a:b = (a/g):(b/g)，其中 g = gcd(a,b) 为自填非负整数的最大公约数；两项不能同时为零。',
    [2, 3],
  );
  D(
    'proportion',
    'Proportion Calculator|比例方程',
    'Solve the missing fourth term when a/b = c/x.|已知 a/b = c/x，求第四项 x。',
    [p('a', 'a|a', 3), p('b', 'b|b', 4), u('c', 'c|c', 6)],
    (v) => [R('Missing value x|未知项 x', (v.b * v.c) / v.a)],
    'x = b × c ÷ a',
    [8],
  );
  D(
    'percent-error',
    'Percent Error|百分误差',
    'Compare a measurement with a nonzero reference value.|比较测量值与非零参考值的误差。',
    [u('a', 'Measured value|测量值', 98), u('b', 'Reference value|参考值', 100)],
    (v) => {
      check(v.b !== 0, 'Reference cannot be zero.|参考值不能为零。');
      return [
        R('Absolute percent error|绝对百分误差', Math.abs((v.a - v.b) / v.b) * 100, '%'),
        R('Signed relative error|带符号相对误差', ((v.a - v.b) / Math.abs(v.b)) * 100, '%'),
      ];
    },
    'Use E = 100abs(m−r)/abs(r). m is measured value, r is the nonzero reference in the same unit, and abs means absolute value. E is percent error.|使用 E = 100abs(m−r)/abs(r)。m 为测量值，r 为同单位非零参考值，abs 表示绝对值；E 为百分误差。',
    [2, -2],
  );
  D(
    'percent-difference',
    'Percent Difference|百分差异',
    'Compare two nonnegative values symmetrically using their average.|以两数均值为基准，对称比较两个非负数。',
    [n('a', 'First value|第一个值', 80), n('b', 'Second value|第二个值', 100)],
    (v) => {
      check(v.a + v.b > 0, 'At least one value must be positive.|至少一个值应大于零。');
      return [R('Percent difference|百分差异', (200 * Math.abs(v.a - v.b)) / (v.a + v.b), '%')];
    },
    '100 × |a − b| ÷ ((a + b) ÷ 2)',
    [22.22222222222222],
  );
  D(
    'decimal-to-fraction',
    'Decimal to Fraction|小数转分数',
    'Convert the entered finite decimal into a reduced fraction.|将输入的有限小数转为约分后的分数。',
    [u('a', 'Decimal|小数', 0.125)],
    (v) => {
      const [a, b] = fraction(v.a);
      return [
        R('Reduced fraction|最简分数', a + '/' + b),
        R('Numerator|分子', a.toString()),
        R('Denominator|分母', b.toString()),
      ];
    },
    'Remove the decimal point, divide by 10ⁿ, then reduce by gcd.|移除小数点，以 10ⁿ 为分母，再用 gcd（最大公约数）约分。',
    ['1/8', '1', '8'],
    'The decimal is interpreted as the JavaScript numeric input, with up to about 15 significant digits.|按数值输入解析小数，精度约为 15 位有效数字。',
  );
  D(
    'mixed-number',
    'Mixed Number to Improper Fraction|带分数转假分数',
    'Convert a signed whole part and fractional part into one fraction.|将带符号的带分数转为假分数。',
    [
      select('sign', 'Sign|符号', '+', [
        ['+', 'Positive|正'],
        ['-', 'Negative|负'],
      ]),
      i('a', 'Whole part|整数部分', 2, 0, 1e12),
      i('b', 'Fraction numerator|分数部分的分子', 1, 0, 1e12),
      i('c', 'Fraction denominator|分母', 3, 1, 1e12),
    ],
    (v) => {
      const a = BigInt(v.a) * BigInt(v.c) + BigInt(v.b),
        b = BigInt(v.c),
        g = bigGcd(a, b),
        num = (v.sign === '-' ? -a : a) / g;
      return [
        R('Improper fraction|假分数', num + '/' + b / g),
        R('Decimal|小数', Number(num) / Number(b / g)),
      ];
    },
    'Use s(wd+n)/d. w is the whole part, n is fractional numerator, d is denominator, and s is the selected sign. The resulting fraction is reduced by its greatest common divisor.|使用 s(wd+n)/d。w 为整数部分，n 为分数部分的分子，d 为分母，s 为自选正负号；所得分数再按最大公约数约分。',
    ['7/3', 7 / 3],
  );
  D(
    'integer-division',
    'Integer Division with Remainder|整数除法与余数',
    'Find the quotient rounded toward zero and the remaining signed amount.|求向零取整的商及带符号余数。',
    [i('a', 'Dividend|被除数', 17, -1e12, 1e12), i('b', 'Divisor|除数', 5, -1e12, 1e12)],
    (v) => {
      check(v.b !== 0, 'Divisor cannot be zero.|除数不能为零。');
      const q = Math.trunc(v.a / v.b);
      return [R('Quotient|商', q), R('Remainder|余数', v.a - v.b * q)];
    },
    'Use q = trunc(a/b) and r = a−bq. a is dividend and b is nonzero divisor. trunc rounds toward zero; q is quotient and r is the signed remainder.|使用 q = trunc(a/b) 及 r = a−bq。a 为被除数，b 为非零除数；trunc 表示向零取整，q 为商，r 为带符号余数。',
    [3, 2],
  );
  D(
    'modular-arithmetic',
    'Modular Arithmetic|模运算',
    'Add, multiply or exponentiate integers under a positive modulus.|在正模数下进行整数加法、乘法或乘方。',
    [
      i('a', 'First integer|第一个整数', 17, -1e12, 1e12),
      i('b', 'Second integer or exponent|第二个整数或指数', 5, 0, 1e9),
      i('m', 'Modulus|模数', 7, 1, 1e12),
      select('op', 'Operation|运算', 'multiply', [
        ['add', 'Addition|加法'],
        ['multiply', 'Multiplication|乘法'],
        ['power', 'Exponentiation|乘方'],
      ]),
    ],
    (v) => {
      const m = BigInt(v.m),
        norm = (x) => ((x % m) + m) % m;
      let a = norm(BigInt(v.a)),
        b = BigInt(v.b),
        r;
      if (v.op === 'add') r = norm(a + b);
      else if (v.op === 'multiply') r = norm(a * b);
      else {
        r = 1n % m;
        while (b) {
          if (b & 1n) r = norm(r * a);
          a = norm(a * a);
          b >>= 1n;
        }
      }
      return [R('Residue|模余数', Number(r))];
    },
    '0 ≤ result < modulus; modular exponentiation uses repeated squaring.|0 ≤ result < modulus；模幂采用重复平方法。',
    [1],
  );
  D(
    'greatest-common-factor',
    'Greatest Common Factor|最大公因数',
    'Find the largest factor shared by a list of integers.|求一组整数共有的最大因数。',
    [text('values', 'Whole numbers|整数列表', '12, 18, 30')],
    (v) => {
      const a = integers(v.values);
      check(
        a.some((x) => x !== 0),
        'Not all integers may be zero.|整数不能全部为零。',
      );
      return [R('Greatest common factor|最大公因数', a.reduce(gcd))];
    },
    'Euclidean algorithm, applied across the list.|对整个数列依次应用欧几里得算法。',
    [6],
  );
  D(
    'least-common-multiple',
    'Least Common Multiple|最小公倍数',
    'Find the smallest positive common multiple of nonzero integers.|求非零整数的最小正公倍数。',
    [text('values', 'Nonzero whole numbers|非零整数列表', '12, 18, 30')],
    (v) => {
      const a = integers(v.values);
      check(
        a.every((x) => x !== 0),
        'Every input must be nonzero.|各输入都应非零。',
      );
      let r = 1n;
      for (const x of a) {
        const z = BigInt(Math.abs(x));
        r = (r / bigGcd(r, z)) * z;
      }
      return [R('Least common multiple|最小公倍数', r.toString())];
    },
    'Use lcm(a,b) = abs(ab)/gcd(a,b) repeatedly across the entered nonzero integers. gcd is greatest common divisor and abs means absolute value. The result is the least positive common multiple.|对自填非零整数依次使用 lcm(a,b) = abs(ab)/gcd(a,b)。gcd 为最大公约数，abs 表示绝对值；结果为最小正公倍数。',
    ['180'],
  );
  D(
    'prime-factorization',
    'Prime Factorization|质因数分解',
    'Write a positive integer as a product of prime powers.|把正整数写成质数幂的乘积。',
    [i('a', 'Integer|整数', 360, 2, 1e12)],
    (v) => {
      let x = v.a;
      const a = [];
      for (let d = 2; d * d <= x; d += d === 2 ? 1 : 2) {
        if (x % d) continue;
        let c = 0;
        while (x % d === 0) {
          x /= d;
          c++;
        }
        a.push(c === 1 ? String(d) : d + '^' + c);
      }
      if (x > 1) a.push(String(x));
      return [
        R('Prime factors|质因数', a.join(' × ')),
        R('Distinct prime factors|不同质因数数量', a.length),
      ];
    },
    'Repeatedly divide by prime candidates up to √n.|用不超过 √n 的候选质因数反复试除。',
    ['2^3 × 3^2 × 5', 3],
  );
  D(
    'prime-number',
    'Prime Number Check|质数判断',
    'Check whether an integer has any divisor other than one and itself.|判断整数是否只有 1 和自身两个正因数。',
    [i('a', 'Integer|整数', 97, 0, 1e12)],
    (v) => {
      let prime = v.a >= 2,
        divisor = 0;
      if (prime)
        for (let d = 2; d * d <= v.a; d += d === 2 ? 1 : 2)
          if (v.a % d === 0) {
            prime = false;
            divisor = d;
            break;
          }
      return [
        R('Classification|分类', prime ? 'Prime number|质数' : 'Not a prime number|非质数'),
        R('Smallest nontrivial divisor, zero if none|最小非平凡因数（没有则为零）', divisor),
      ];
    },
    'A prime integer n ≥ 2 has no divisor between 2 and √n.|质数 n ≥ 2 在 2 到 √n 之间没有整数因数。',
    ['Prime number|质数', 0],
  );
  D(
    'square-root',
    'Square Root|平方根',
    'Find the nonnegative principal square root and its opposite.|求非负主平方根及其相反数。',
    [n('a', 'Radicand|被开方数', 81)],
    (v) => [
      R('Principal square root|主平方根', Math.sqrt(v.a)),
      R('Negative root|负平方根', -Math.sqrt(v.a)),
    ],
    'Use r = √x with r ≥ 0. x is the nonnegative radicand and r is its principal square root. The other displayed root is its opposite.|使用 r = √x，且 r ≥ 0。x 为非负被开方数，r 为主平方根；另一个显示值为其相反数。',
    [9, -9],
  );
  D(
    'cube-root',
    'Cube Root|立方根',
    'Find the real cube root of a positive or negative value.|求正数或负数的实数立方根。',
    [u('a', 'Radicand|被开方数', -27)],
    (v) => [R('Real cube root|实数立方根', Math.cbrt(v.a))],
    'r³ = x',
    [-3],
  );
  D(
    'nth-root',
    'Nth Root|n 次方根',
    'Find a real nth root with explicit handling of negative inputs.|求 n 次实数根，并检查负数的根次数。',
    [u('a', 'Radicand|被开方数', 32), i('b', 'Root degree|根次数', 5, 1, 1000)],
    (v) => {
      check(
        v.a >= 0 || v.b % 2 === 1,
        'A negative number needs an odd root degree.|负数的实数根要求奇数根次数。',
      );
      return [R('Real root|实数根', Math.sign(v.a) * Math.abs(v.a) ** (1 / v.b))];
    },
    'Use r = sign(x)abs(x)^(1/n). x is the radicand, n is a positive integer root degree, abs means absolute value, and sign gives the sign of the input. Negative inputs require an odd root degree.|使用 r = sign(x)abs(x)^(1/n)。x 为被开方数，n 为正整数根次数，abs 表示绝对值，sign 返回输入的符号；负数的实数根要求奇数根次数。',
    [2],
  );
  D(
    'exponent',
    'Exponent Calculator|乘方计算器',
    'Raise a real base to an exponent within the real-number domain.|计算实数底数的乘方，检查实数定义域。',
    [u('a', 'Base|底数', 2), u('b', 'Exponent|指数', 10)],
    (v) => {
      check(
        !(v.a === 0 && v.b <= 0) && !(v.a < 0 && !Number.isInteger(v.b)),
        'This power is outside the supported real-number domain.|此乘方不在支持的实数定义域内。',
      );
      return [R('Exponentiation result|乘方结果', v.a ** v.b)];
    },
    'Use y = b^e. b is the real base and e is the entered exponent. This tool requires an integer exponent for a negative base and a positive exponent for a zero base.|使用 y = b^e。b 为实数底数，e 为自填指数；本工具对负底数要求整数指数，对零底数要求正指数。',
    [1024],
  );
  D(
    'logarithm',
    'Logarithm Calculator|对数计算器',
    'Find the logarithm of a positive value in a valid chosen base.|计算正数在指定合法底数下的对数。',
    [p('a', 'Value|数值', 1000), p('b', 'Base|底数', 10)],
    (v) => {
      check(v.b !== 1, 'Logarithm base cannot be one.|对数底数不能为 1。');
      return [R('Logarithm|对数', Math.log(v.a) / Math.log(v.b))];
    },
    'Use log_b(x) = ln(x)/ln(b). x is a positive value and b is a positive base other than unity. ln is the natural logarithm.|使用 log_b(x) = ln(x)/ln(b)。x 为正数，b 为大于零且不等于一的底数，ln 为自然对数。',
    [3],
  );
  D(
    'scientific-notation',
    'Scientific Notation|科学计数法',
    'Separate a finite number into its decimal coefficient and power of ten.|把有限数拆成十进制系数和 10 的指数。',
    [u('a', 'Value|数值', 12345)],
    (v) => {
      const [coefficient, exponent] = v.a.toExponential().split('e'),
        m = Number(coefficient),
        e = Number(exponent);
      return [R('Coefficient|系数', m), R('Power of ten|10 的指数', e)];
    },
    'Write x = m×10^e. x is the entered value, m is the coefficient, and e is an integer exponent. For nonzero input, 1 ≤ abs(m) < 10; abs means absolute value. Zero uses zero coefficient and exponent.|写成 x = m×10^e。x 为输入值，m 为系数，e 为整数指数；输入非零时满足 1 ≤ abs(m) < 10，abs 表示绝对值；零使用零系数和零指数。',
    [1.2345, 4],
  );
  D(
    'rounding',
    'Rounding Calculator|四舍五入',
    'Round a value to decimal places using ties away from zero.|按指定位数取整，恰好一半时向远离零的方向舍入。',
    [
      u('a', 'Value|数值', 123.456),
      i('b', 'Decimal places; negative rounds tens|小数位数（负数舍入到十位等）', 2, -12, 12),
    ],
    (v) => {
      const f = 10 ** v.b;
      return [
        R(
          'Rounded value|舍入结果',
          (Math.sign(v.a) * Math.round((Math.abs(v.a) + Number.EPSILON) * f)) / f,
        ),
      ];
    },
    'Use R = sign(x)round(abs(x)×10^p)/10^p. x is the value and p is decimal places. abs means absolute value; sign restores the sign. Halfway cases round away from zero; negative places round to larger place values.|使用 R = sign(x)round(abs(x)×10^p)/10^p。x 为数值，p 为小数位数；abs 表示绝对值，sign 恢复正负号；恰好一半时向远离零的方向舍入，负位数舍入到更高数位。',
    [123.46],
  );
  D(
    'significant-figures',
    'Significant Figures Rounding|有效数字舍入',
    'Round a numeric value to the selected count of significant figures.|把数值舍入到指定的有效数字位数。',
    [u('a', 'Value|数值', 1.23456), i('b', 'Significant figures|有效数字位数', 3, 1, 15)],
    (v) => [R('Rounded value|舍入结果', Number(v.a.toPrecision(v.b)))],
    'Keep the first n significant digits; trailing display zeros are not measurement precision.|保留前 n 位有效数字；显示时补在末尾的零不代表测量精度。',
    [1.23],
  );
  D(
    'absolute-value',
    'Absolute Value|绝对值',
    'Find a number’s distance from zero and its sign.|计算数到零的距离并判断正负号。',
    [u('a', 'Value|数值', -12.5)],
    (v) => [R('Absolute value|绝对值', Math.abs(v.a)), R('Sign|符号', Math.sign(v.a))],
    'Use A = abs(x). x is the entered real number and abs means its distance from zero. The absolute value is nonnegative; the separate sign result identifies positive, negative or zero input.|使用 A = abs(x)。x 为自填实数，abs 表示到零的距离；绝对值非负，单独列出的符号结果区分正数、负数或零。',
    [12.5, -1],
  );
  // 22–47: coordinates, algebra, matrices and vectors.
  D(
    'slope',
    'Slope between Two Points|两点斜率',
    'Find rise divided by run and identify vertical lines.|求两点间的纵向变化与横向变化之比。',
    points,
    (v) => {
      const dx = v.x2 - v.x1,
        dy = v.y2 - v.y1;
      check(dx || dy, 'The points must be distinct.|两点不能重合。');
      return [
        R('Slope|斜率', dx === 0 ? 'Undefined: vertical line|未定义：垂直直线' : dy / dx),
        R('Rise|纵向变化', dy),
        R('Run|横向变化', dx),
      ];
    },
    'Use m = (y₂−y₁)/(x₂−x₁) for points (x₁,y₁) and (x₂,y₂). m is slope. The points must differ; equal horizontal coordinates produce a vertical line with undefined slope.|对点 (x₁,y₁) 与 (x₂,y₂)，使用 m = (y₂−y₁)/(x₂−x₁)，其中 m 为斜率；两点必须不同，横坐标相等时为垂直直线，斜率无定义。',
    [4 / 3, 8, 6],
  );
  D(
    'line-equation',
    'Line through Two Points|两点确定直线',
    'Calculate the coefficients of Ax + By + C = 0, including vertical lines.|根据两点求直线一般式，支持垂直直线。',
    points,
    (v) => {
      check(v.x1 !== v.x2 || v.y1 !== v.y2, 'The points must be distinct.|两点不能重合。');
      return [R('A|A', v.y1 - v.y2), R('B|B', v.x2 - v.x1), R('C|C', v.x1 * v.y2 - v.x2 * v.y1)];
    },
    'A = y₁ − y₂; B = x₂ − x₁; C = x₁y₂ − x₂y₁; Ax + By + C = 0',
    [-8, 6, 0],
  );
  D(
    'midpoint',
    'Midpoint Calculator|中点计算器',
    'Find the coordinate halfway between two points.|求两点之间的中点坐标。',
    points,
    (v) => [R('Midpoint x|中点 x', (v.x1 + v.x2) / 2), R('Midpoint y|中点 y', (v.y1 + v.y2) / 2)],
    'M = ((x₁+x₂)/2, (y₁+y₂)/2)',
    [3, 4],
  );
  D(
    'distance-between-points',
    'Distance between Points|两点距离',
    'Find straight-line Euclidean distance in two dimensions.|计算二维坐标中两点的直线距离。',
    points,
    (v) => [R('Distance|距离', Math.hypot(v.x2 - v.x1, v.y2 - v.y1))],
    'd = √((x₂−x₁)² + (y₂−y₁)²)',
    [10],
  );
  D(
    'section-formula',
    'Internal Division Point|内分点计算器',
    'Locate a point dividing a line segment in a positive ratio.|按正比例求线段的内分点。',
    [
      ...points,
      p('m', 'First ratio term|第一段比例', 1),
      p('n', 'Second ratio term|第二段比例', 2),
    ],
    (v) => [
      R('Division point x|内分点 x', (v.n * v.x1 + v.m * v.x2) / (v.m + v.n)),
      R('Division point y|内分点 y', (v.n * v.y1 + v.m * v.y2) / (v.m + v.n)),
    ],
    'P = (nA + mB) ÷ (m+n), AP:PB = m:n',
    [2, 8 / 3],
  );
  D(
    'perpendicular-bisector',
    'Perpendicular Bisector|垂直平分线',
    'Find coefficients of the perpendicular bisector of a segment.|求线段垂直平分线的一般式系数。',
    points,
    (v) => {
      const a = v.x2 - v.x1,
        b = v.y2 - v.y1;
      check(a || b, 'The points must be distinct.|两点不能重合。');
      return [R('A|A', a), R('B|B', b), R('C|C', -(a * (v.x1 + v.x2) + b * (v.y1 + v.y2)) / 2)];
    },
    'A=x₂−x₁; B=y₂−y₁; C=−A(x₁+x₂)/2−B(y₁+y₂)/2',
    [6, 8, -50],
  );
  D(
    'discriminant',
    'Quadratic Discriminant|二次方程判别式',
    'Classify the real roots of ax² + bx + c using the discriminant.|用判别式判断二次方程的实根情况。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', -5), u('c', 'c|c', 6)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      const d = v.b * v.b - 4 * v.a * v.c;
      return [
        R('Discriminant|判别式', d),
        R('Distinct real roots|不同实根数量', d > 0 ? 2 : d === 0 ? 1 : 0),
      ];
    },
    'Δ = b² − 4ac',
    [1, 2],
  );
  D(
    'completing-square',
    'Completing the Square|配方法',
    'Rewrite ax² + bx + c as a(x + h)² + k.|把二次式写成 a(x+h)²+k 的形式。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', 6), u('c', 'c|c', 5)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      return [
        R('Inside shift h|括号内平移量 h', v.b / (2 * v.a)),
        R('Outside constant k|括号外常数 k', v.c - (v.b * v.b) / (4 * v.a)),
      ];
    },
    'h=b/(2a); k=c−b²/(4a)',
    [3, -4],
  );
  D(
    'cubic-real-roots',
    'Cubic Real Roots|一元三次方程实根',
    'Find the real roots of a cubic polynomial using its depressed form.|用降幂形式求一元三次方程的实根。',
    [
      u('a', 'Cubic coefficient a|三次项系数 a', 1),
      u('b', 'Quadratic coefficient b|二次项系数 b', -6),
      u('c', 'Linear coefficient c|一次项系数 c', 11),
      u('d', 'Constant d|常数 d', -6),
    ],
    (v) => {
      check(v.a !== 0, 'Cubic coefficient cannot be zero.|三次项系数不能为零。');
      const b = v.b / v.a,
        c = v.c / v.a,
        d = v.d / v.a,
        p = c - (b * b) / 3,
        q = (2 * b ** 3) / 27 - (b * c) / 3 + d,
        disc = (q * q) / 4 + p ** 3 / 27;
      let roots;
      if (Math.abs(disc) < 1e-12) {
        const z = Math.cbrt(-q / 2);
        roots = [2 * z - b / 3, -z - b / 3];
      } else if (disc > 0)
        roots = [Math.cbrt(-q / 2 + Math.sqrt(disc)) + Math.cbrt(-q / 2 - Math.sqrt(disc)) - b / 3];
      else {
        const angle = Math.acos(Math.max(-1, Math.min(1, ((3 * q) / (2 * p)) * Math.sqrt(-3 / p))));
        roots = [0, 1, 2].map(
          (k) => 2 * Math.sqrt(-p / 3) * Math.cos((angle - 2 * PI * k) / 3) - b / 3,
        );
      }
      roots = [...new Set(roots.sort((a, b) => a - b).map((x) => Number(x.toPrecision(10))))];
      return [
        R('Real roots|实根', roots.join(', ')),
        R('Distinct real roots|不同实根数量', roots.length),
      ];
    },
    'x=y−b/(3a); solve y³+py+q=0 with Cardano/trigonometric formulas.|x=y−b/(3a)；用卡尔达诺公式或三角公式求解 y³+py+q=0。',
    ['1, 2, 3', 3],
    'Numerical real roots, rounded to 10 significant digits. Near repeated roots, rescaling coefficients improves reliability.|数值实根显示 10 位有效数字；接近重根时应缩放系数并复核。',
  );
  D(
    'arithmetic-sequence',
    'Arithmetic Sequence|等差数列',
    'Find the nth term and sum of an arithmetic progression.|计算等差数列的第 n 项及前 n 项和。',
    [
      u('a', 'First term|首项', 3),
      u('d', 'Common difference|公差', 2),
      i('n', 'Number of terms|项数', 10, 1, 1e9),
    ],
    (v) => [
      R('Nth term|第 n 项', v.a + (v.n - 1) * v.d),
      R('Sum|前 n 项和', (v.n * (2 * v.a + (v.n - 1) * v.d)) / 2),
    ],
    'aₙ=a₁+(n−1)d; Sₙ=n(2a₁+(n−1)d)/2',
    [21, 120],
  );
  D(
    'geometric-sequence',
    'Geometric Sequence|等比数列',
    'Find the nth term and finite sum with an editable common ratio.|按公比计算等比数列的第 n 项及有限和。',
    [
      u('a', 'First term|首项', 2),
      u('r', 'Common ratio|公比', 3),
      i('n', 'Number of terms|项数', 5, 1, 1000),
    ],
    (v) => [
      R('Nth term|第 n 项', v.a * v.r ** (v.n - 1)),
      R('Finite sum|前 n 项和', v.r === 1 ? v.a * v.n : (v.a * (1 - v.r ** v.n)) / (1 - v.r)),
    ],
    'aₙ=a₁r^(n−1); Sₙ=a₁(1−rⁿ)/(1−r), with r=1 handled separately.|aₙ=a₁r^(n−1); Sₙ=a₁(1−rⁿ)/(1−r)，其中 r=1 的情况单独处理。',
    [162, 242],
  );
  D(
    'fibonacci',
    'Fibonacci Number|斐波那契数',
    'Calculate an exact Fibonacci number with F₀=0 and F₁=1.|以 F₀=0、F₁=1 为约定，计算精确斐波那契数。',
    [i('n', 'Index n|下标 n', 20, 0, 1000)],
    (v) => {
      let a = 0n,
        b = 1n;
      for (let k = 0; k < v.n; k++) [a, b] = [b, a + b];
      return [
        R('Fibonacci number|斐波那契数', a.toString()),
        R('Next number|下一项', b.toString()),
      ];
    },
    'Fₙ = Fₙ₋₁ + Fₙ₋₂',
    ['6765', '10946'],
  );
  D(
    'sum-of-integers',
    'Sum of Consecutive Integers|连续整数求和',
    'Sum all positive integers from one through n.|计算从 1 到 n 的正整数之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 1e7)],
    (v) => [R('Sum|总和', (v.n * (v.n + 1)) / 2)],
    '1+2+…+n = n(n+1)/2',
    [5050],
  );
  D(
    'sum-of-squares',
    'Sum of Squares|平方和',
    'Sum the squares of positive integers from one through n.|计算 1 到 n 各整数的平方之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 1e6)],
    (v) => [R('Sum of squares|平方和', (v.n * (v.n + 1) * (2 * v.n + 1)) / 6)],
    '1²+2²+…+n² = n(n+1)(2n+1)/6',
    [338350],
  );
  D(
    'sum-of-cubes',
    'Sum of Cubes|立方和',
    'Sum the cubes of positive integers from one through n.|计算 1 到 n 各整数的立方之和。',
    [i('n', 'Last integer n|末项 n', 100, 0, 100000)],
    (v) => [R('Sum of cubes|立方和', ((v.n * (v.n + 1)) / 2) ** 2)],
    '1³+2³+…+n³ = [n(n+1)/2]²',
    [25502500],
  );
  D(
    'binomial-expansion',
    'Binomial Expansion Coefficients|二项式展开系数',
    'Generate coefficients of (ax+b)ⁿ from highest to lowest power.|按幂次从高到低列出 (ax+b)ⁿ 的展开系数。',
    [
      u('a', 'Coefficient a|系数 a', 1),
      u('b', 'Constant b|常数 b', 1),
      i('n', 'Power n|幂次 n', 3, 0, 20),
    ],
    (v) => [
      R(
        'Coefficients, descending powers|系数（幂次降序）',
        Array.from({ length: v.n + 1 }, (_, k) =>
          Number((Math.round(choose(v.n, k)) * v.a ** (v.n - k) * v.b ** k).toPrecision(12)),
        ).join(', '),
      ),
    ],
    'In (ax+b)^n, the coefficient of x^(n−k) is C(n,k)a^(n−k)b^k. a and b are entered constants, n is the nonnegative integer power, and k runs from zero through that power. C(n,k) is a binomial coefficient.|在 (ax+b)^n 中，x^(n−k) 的系数为 C(n,k)a^(n−k)b^k。a 与 b 为自填常数，n 为非负整数幂，k 从零取到该幂次，C(n,k) 为二项式系数。',
    ['1, 3, 3, 1'],
  );
  D(
    'quadratic-vertex',
    'Quadratic Vertex|抛物线顶点',
    'Find the vertex, axis and opening direction of a quadratic.|求二次函数的顶点、对称轴和开口方向。',
    [u('a', 'a, nonzero|a（非零）', 1), u('b', 'b|b', -4), u('c', 'c|c', 3)],
    (v) => {
      check(v.a !== 0, 'Coefficient a must be nonzero.|系数 a 不能为零。');
      const x = -v.b / (2 * v.a);
      return [
        R('Vertex x|顶点 x', x),
        R('Vertex y|顶点 y', v.a * x * x + v.b * x + v.c),
        R('Opening|开口', v.a > 0 ? 'Upward|向上' : 'Downward|向下'),
      ];
    },
    'xᵥ=−b/(2a); yᵥ=axᵥ²+bxᵥ+c',
    [2, -1, 'Upward|向上'],
  );
  D(
    'matrix-determinant',
    '2 × 2 Matrix Determinant|二阶矩阵行列式',
    'Calculate determinant and identify singular two-by-two matrices.|计算二阶矩阵的行列式，判断是否奇异。',
    matrix,
    (v) => [R('Determinant|行列式', v.a * v.d - v.b * v.c)],
    'For matrix [[a,b],[c,d]], use det = ad−bc. The letters give entries in row order. A zero determinant identifies a singular matrix.|对矩阵 [[a,b],[c,d]]，使用 det = ad−bc。字母按行表示矩阵元素，行列式为零表示矩阵奇异。',
    [-2],
  );
  D(
    'matrix-inverse',
    '2 × 2 Matrix Inverse|二阶矩阵求逆',
    'Find the four entries of a nonsingular matrix inverse.|求非奇异二阶矩阵的逆矩阵四个元素。',
    matrix,
    (v) => {
      const d = v.a * v.d - v.b * v.c;
      check(d !== 0, 'A singular matrix has no inverse.|奇异矩阵没有逆矩阵。');
      return [
        R('Inverse row 1, column 1|逆矩阵第 1 行第 1 列', v.d / d),
        R('Inverse row 1, column 2|逆矩阵第 1 行第 2 列', -v.b / d),
        R('Inverse row 2, column 1|逆矩阵第 2 行第 1 列', -v.c / d),
        R('Inverse row 2, column 2|逆矩阵第 2 行第 2 列', v.a / d),
      ];
    },
    'A⁻¹ = [[d,−b],[−c,a]] ÷ (ad−bc)',
    [-2, 1, 1.5, -0.5],
  );
  D(
    'matrix-multiplication',
    '2 × 2 Matrix Multiplication|二阶矩阵乘法',
    'Multiply two two-by-two matrices in the stated order.|按指定顺序计算两个二阶矩阵的乘积。',
    [
      ...matrix,
      u('e', 'B: row 1, column 1|B：第 1 行第 1 列', 5),
      u('f', 'B: row 1, column 2|B：第 1 行第 2 列', 6),
      u('g', 'B: row 2, column 1|B：第 2 行第 1 列', 7),
      u('h', 'B: row 2, column 2|B：第 2 行第 2 列', 8),
    ],
    (v) => [
      R('Product row 1, column 1|积第 1 行第 1 列', v.a * v.e + v.b * v.g),
      R('Product row 1, column 2|积第 1 行第 2 列', v.a * v.f + v.b * v.h),
      R('Product row 2, column 1|积第 2 行第 1 列', v.c * v.e + v.d * v.g),
      R('Product row 2, column 2|积第 2 行第 2 列', v.c * v.f + v.d * v.h),
    ],
    'Cᵢⱼ = Σ Aᵢₖ Bₖⱼ',
    [19, 22, 43, 50],
  );
  D(
    'complex-number',
    'Complex Arithmetic|复数运算',
    'Add, subtract, multiply or divide two complex numbers.|对两个复数进行加减乘除。',
    [
      u('a', 'A real part|A 实部', 2),
      u('b', 'A imaginary part|A 虚部', 3),
      u('c', 'B real part|B 实部', 4),
      u('d', 'B imaginary part|B 虚部', -5),
      select('op', 'Operation|运算', 'add', [
        ['add', 'Add|相加'],
        ['subtract', 'Subtract|相减'],
        ['multiply', 'Multiply|相乘'],
        ['divide', 'Divide|相除'],
      ]),
    ],
    (v) => {
      let a, b;
      if (v.op === 'add') {
        a = v.a + v.c;
        b = v.b + v.d;
      } else if (v.op === 'subtract') {
        a = v.a - v.c;
        b = v.b - v.d;
      } else if (v.op === 'multiply') {
        a = v.a * v.c - v.b * v.d;
        b = v.a * v.d + v.b * v.c;
      } else {
        const den = v.c * v.c + v.d * v.d;
        check(den > 0, 'Cannot divide by zero.|不能除以零。');
        a = (v.a * v.c + v.b * v.d) / den;
        b = (v.b * v.c - v.a * v.d) / den;
      }
      return [R('Result real part|结果实部', a), R('Result imaginary part|结果虚部', b)];
    },
    '(a+bi)(c+di)=(ac−bd)+(ad+bc)i; division uses the conjugate.|(a+bi)(c+di)=(ac−bd)+(ad+bc)i；除法使用共轭复数。',
    [6, -2],
  );
  D(
    'polar-coordinates',
    'Cartesian to Polar Coordinates|直角坐标转极坐标',
    'Convert a point into radius and signed angle using atan2.|用 atan2 将平面坐标转为半径和带符号角度。',
    [u('x', 'x coordinate|x 坐标', 3), u('y', 'y coordinate|y 坐标', 4)],
    (v) => [
      R('Radius|半径', Math.hypot(v.x, v.y)),
      R('Angle|角度', deg(Math.atan2(v.y, v.x)), '°'),
    ],
    'Use r = √(x²+y²) and θ = atan2(y,x). x and y are Cartesian coordinates in the same unit. Radius r keeps that unit; the signed angle θ is converted from radians to degrees for display.|使用 r = √(x²+y²) 及 θ = atan2(y,x)。x 与 y 为同单位直角坐标，半径 r 使用该单位，带符号角 θ 从弧度换算成度显示。',
    [5, 53.13010235415598],
  );
  D(
    'vector-dot-product',
    'Vector Dot Product|向量点积',
    'Find the scalar product of two three-dimensional vectors.|求两个三维向量的数量积。',
    vectors,
    (v) => [R('Dot product|点积', v.a * v.d + v.b * v.e + v.c * v.f)],
    'A·B = aₓbₓ+aᵧbᵧ+a_zb_z',
    [32],
  );
  D(
    'vector-cross-product',
    'Vector Cross Product|向量叉积',
    'Find the three coordinates of the cross product in right-hand order.|按右手系求两个三维向量的叉积坐标。',
    vectors,
    (v) => [
      R('Cross product x|叉积 x', v.b * v.f - v.c * v.e),
      R('Cross product y|叉积 y', v.c * v.d - v.a * v.f),
      R('Cross product z|叉积 z', v.a * v.e - v.b * v.d),
    ],
    'A×B = (aᵧb_z−a_zbᵧ, a_zbₓ−aₓb_z, aₓbᵧ−aᵧbₓ)',
    [-3, 6, -3],
  );
  D(
    'vector-magnitude',
    'Vector Magnitude and Unit Vector|向量模与单位向量',
    'Find vector length and the normalized direction of a nonzero vector.|求非零三维向量的模及归一化方向。',
    [
      u('a', 'x component|x 分量', 3),
      u('b', 'y component|y 分量', 4),
      u('c', 'z component|z 分量', 0),
    ],
    (v) => {
      const m = Math.hypot(v.a, v.b, v.c);
      check(m > 0, 'The zero vector has no unit direction.|零向量没有单位方向。');
      return [
        R('Magnitude|模', m),
        R('Unit vector x|单位向量 x', v.a / m),
        R('Unit vector y|单位向量 y', v.b / m),
        R('Unit vector z|单位向量 z', v.c / m),
      ];
    },
    'Use M = √(x²+y²+z²) and u = (x/M,y/M,z/M). x, y and z are vector components, M is magnitude, and u is the unit direction. The vector must be nonzero.|使用 M = √(x²+y²+z²) 及 u = (x/M,y/M,z/M)。x、y、z 为向量分量，M 为向量模，u 为单位方向；向量必须非零。',
    [5, 0.6, 0.8, 0],
  );
  D(
    'angle-between-vectors',
    'Angle between Vectors|向量夹角',
    'Find the smaller angle between two nonzero vectors.|求两个非零三维向量之间的较小夹角。',
    [...vectors.map((f) => ({ ...f, value: ['a', 'e'].includes(f.id) ? 1 : 0 }))],
    (v) => {
      const unit = (components) => {
        const scale = Math.max(...components.map(Math.abs));
        check(scale > 0, 'Both vectors must be nonzero.|两个向量都应非零。');
        const scaled = components.map((component) => component / scale);
        const length = Math.hypot(...scaled);
        return scaled.map((component) => component / length);
      };
      const a = unit([v.a, v.b, v.c]),
        b = unit([v.d, v.e, v.f]);
      const difference = Math.hypot(...a.map((component, index) => component - b[index]));
      const combined = Math.hypot(...a.map((component, index) => component + b[index]));
      return [R('Angle|夹角', deg(2 * Math.atan2(difference, combined)), '°')];
    },
    'Use θ = acos[(A·B)/(norm(A)norm(B))]. A and B are nonzero vectors, the dot denotes their dot product, and norm means Euclidean magnitude. The angle is displayed in degrees.|使用 θ = acos[(A·B)/(norm(A)norm(B))]。A 与 B 为非零向量，点号表示点积，norm 表示欧几里得模；夹角以度显示。',
    [90],
  );
})();
