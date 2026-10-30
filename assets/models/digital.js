(() => {
  'use strict';
  const { add, n, p, i, text, select, row: R, check, nums, sum, gcd } = CMModels;
  const D = (
    s,
    name,
    purpose,
    f,
    calc,
    formula,
    e,
    note = 'Planning estimate using your entered parameters. No external service, device, live tariff or network is contacted.|根据自填参数进行规划估算，不访问外部服务、设备、实时价目或网络。',
  ) => add(s, name, 'AI and Work-life', purpose, f, calc, formula, e, note);
  const eff = n('e', 'Transfer efficiency (%)|传输效率（%）', 80, 0.0001, 100);
  D(
    'download-time',
    'Download Time|下载时间',
    'Estimate transfer time with decimal bytes and network bit rates.|用十进制字节与网络比特率估计传输时间。',
    [
      n('s', 'File size (GB, decimal)|文件大小（GB，十进制）', 1),
      p('b', 'Link speed (Mbps)|链路速度（Mbps）', 100),
      eff,
    ],
    (v) => [
      R('Estimated duration|估计用时', (v.s * 8000) / ((v.b * v.e) / 100), 'seconds'),
      R('Effective transfer speed|有效传输速度', (v.b * v.e) / 100 / 8, 'MB/s'),
    ],
    'Seconds=GB×8000/(Mbps×efficiency)',
    [100, 10],
  );
  D(
    'video-file-size',
    'Video File Size|视频文件大小',
    'Combine video and audio bitrates over a running time.|按播放时长合并视频与音频码率。',
    [
      n('v', 'Video bitrate (Mbps)|视频码率（Mbps）', 8),
      n('a', 'Audio bitrate (kbps)|音频码率（kbps）', 128),
      n('t', 'Duration (minutes)|时长（分钟）', 10),
      n('o', 'Container overhead (%)|封装额外开销（%）', 0, 0, 100),
    ],
    (v) => [
      R(
        'Estimated file size|估计文件大小',
        (((v.v + v.a / 1000) * v.t * 60) / 8) * (1 + v.o / 100),
        'MB',
      ),
    ],
    'Size MB=(video Mbps+audio kbps/1000)×seconds/8×(1+overhead)',
    [609.6],
  );
  D(
    'audio-file-size',
    'Audio File Size|音频文件大小',
    'Estimate encoded audio size from total stream bitrate.|由编码后总音频码率估计大小。',
    [
      n('b', 'Total encoded bitrate (kbps)|编码总码率（kbps）', 320),
      n('t', 'Duration (minutes)|时长（分钟）', 5),
    ],
    (v) => [R('Encoded size|编码大小', (v.b * v.t * 60) / 8000, 'MB')],
    'MB=kbps×seconds/8000',
    [12],
    'Bitrate is the whole encoded stream; do not multiply it by channel count. Tags and container overhead are excluded.|码率指完整编码流，不再乘声道数；不含标签及封装开销。',
  );
  D(
    'uncompressed-image-size',
    'Uncompressed Image Size|未压缩图像大小',
    'Measure raw pixel storage before compression and metadata.|计算压缩及元数据之前的原始像素存储量。',
    [
      i('w', 'Pixel width|像素宽度', 1920, 1, 1000000),
      i('h', 'Pixel height|像素高度', 1080, 1, 1000000),
      i('b', 'Bits per pixel, all channels|每像素总位数（含全部通道）', 24, 1, 256),
    ],
    (v) => [
      R('Raw pixel bytes|原始像素字节', Math.ceil((v.w * v.h * v.b) / 8), 'bytes'),
      R('Megapixels|百万像素', (v.w * v.h) / 1e6, 'MP'),
    ],
    'Bytes=ceil(width×height×bitsPerPixel/8)',
    [6220800, 2.0736],
  );
  D(
    'aspect-ratio',
    'Aspect Ratio|宽高比',
    'Simplify integer dimensions and scale to a new width.|化简整数尺寸比例并缩放至新宽度。',
    [
      i('w', 'Original width|原宽度', 1920, 1, 1000000),
      i('h', 'Original height|原高度', 1080, 1, 1000000),
      n('n', 'Target width|目标宽度', 1280),
    ],
    (v) => {
      const g = gcd(v.w, v.h);
      return [
        R('Simplified ratio|化简比例', v.w / g + ':' + v.h / g),
        R('Target height|目标高度', (v.n * v.h) / v.w),
      ];
    },
    'Ratio=W/gcd(W,H):H/gcd(W,H); newH=newW×H/W',
    ['16:9', 720],
  );
  D(
    'pixel-density',
    'Screen Pixel Density|屏幕像素密度',
    'Convert resolution and diagonal size into pixels per inch.|由分辨率与对角线长度计算每英寸像素。',
    [
      i('w', 'Horizontal pixels|横向像素', 1920, 1, 1000000),
      i('h', 'Vertical pixels|纵向像素', 1080, 1, 1000000),
      p('d', 'Screen diagonal (inches)|屏幕对角线（英寸）', 24),
    ],
    (v) => [
      R('Pixel density|像素密度', Math.hypot(v.w, v.h) / v.d, 'PPI'),
      R('Pixel pitch|像素间距', (25.4 * v.d) / Math.hypot(v.w, v.h), 'mm'),
    ],
    'PPI=√(W²+H²)/diagonalInches',
    [91.7877987534291, 0.2767252330370444],
  );
  D(
    'photo-print-size',
    'Photo Print Size|照片打印尺寸',
    'Convert pixel dimensions and a chosen print density into physical size.|由像素尺寸与自选打印密度换算实际尺寸。',
    [
      i('w', 'Pixel width|像素宽度', 3000, 1, 1000000),
      i('h', 'Pixel height|像素高度', 2400, 1, 1000000),
      p('p', 'Pixels per printed inch|每打印英寸像素数', 300),
    ],
    (v) => [
      R('Print width|打印宽度', (v.w / v.p) * 2.54, 'cm'),
      R('Print height|打印高度', (v.h / v.p) * 2.54, 'cm'),
    ],
    'Centimetres=pixels/PPI×2.54',
    [25.4, 20.32],
  );
  D(
    'fluid-typography',
    'Fluid Typography Clamp|流式字号 clamp',
    'Generate a linear CSS font scale between two viewport widths.|在两个视口宽度间生成线性 CSS 字号变化。',
    [
      n('a', 'Minimum font size (px)|最小字号（px）', 16, 1, 200),
      n('b', 'Maximum font size (px)|最大字号（px）', 24, 1, 200),
      p('x', 'Minimum viewport width (px)|最小视口宽度（px）', 400),
      p('y', 'Maximum viewport width (px)|最大视口宽度（px）', 1200),
    ],
    (v) => {
      check(
        v.b >= v.a && v.y > v.x,
        'Font sizes must increase or stay equal, and viewport width must increase.|字号应递增或相等，视口宽度应递增。',
      );
      const slope = (100 * (v.b - v.a)) / (v.y - v.x),
        intercept = v.a - (slope * v.x) / 100;
      return [
        R(
          'CSS clamp expression|CSS clamp 表达式',
          `clamp(${v.a}px, calc(${intercept.toFixed(6).replace(/\.?0+$/, '')}px + ${slope.toFixed(6).replace(/\.?0+$/, '')}vw), ${v.b}px)`,
        ),
        R('Viewport coefficient|视口系数', slope, 'vw'),
        R('Pixel intercept|像素截距', intercept, 'px'),
      ];
    },
    'slope=100(fontMax−fontMin)/(viewportMax−viewportMin)',
    ['clamp(16px, calc(12px + 1vw), 24px)', 1, 12],
    'Generated CSS is a starting value. Prefer relative text units where appropriate and test zoom, text scaling and overflow.|生成 CSS 仅供起步，适当时优先相对文字单位，并测试缩放、系统字号与溢出。',
  );
  const parseIP = (s) => {
    const a = String(s).trim().split('.');
    check(
      a.length === 4 && a.every((x) => /^(0|[1-9]\d{0,2})$/.test(x) && Number(x) <= 255),
      'Enter a four-octet IPv4 address without leading zeros.|请输入四段 IPv4 地址，不使用前导零。',
    );
    return a.reduce((v, x) => v * 256 + Number(x), 0);
  };
  const showIP = (x) => [24, 16, 8, 0].map((b) => Math.floor(x / 2 ** b) % 256).join('.');
  D(
    'ipv4-subnet',
    'IPv4 Subnet|IPv4 子网',
    'Find a network, broadcast address and conventional host range.|计算网络地址、广播地址与常规主机范围。',
    [
      text('ip', 'IPv4 address|IPv4 地址', '192.168.1.10'),
      i('p', 'Prefix length|前缀长度', 24, 0, 32),
    ],
    (v) => {
      const ip = parseIP(v.ip),
        size = 2 ** (32 - v.p),
        base = Math.floor(ip / size) * size,
        last = base + size - 1,
        hosts = v.p === 32 ? 1 : v.p === 31 ? 2 : size - 2;
      return [
        R('Network|网络地址', showIP(base) + '/' + v.p),
        R('Subnet mask|子网掩码', showIP(2 ** 32 - size)),
        R('Last address|最后地址', showIP(last)),
        R('Address count|地址总数', size),
        R('Conventional usable hosts|常规可用主机数', hosts),
        R('First host|首个主机', showIP(base + (v.p < 31 ? 1 : 0))),
        R('Last host|最后主机', showIP(last - (v.p < 31 ? 1 : 0))),
      ];
    },
    'Block size=2^(32−prefix); network=floor(address/blockSize)×blockSize',
    ['192.168.1.0/24', '255.255.255.0', '192.168.1.255', 256, 254],
    'For /31 point-to-point both addresses are shown as hosts; /32 has one address. Does not determine routability or provider-reserved addresses.|/31 点对点两地址均计为主机，/32 为单地址；不判断可路由性或服务商保留地址。',
  );
  D(
    'ipv4-vlsm',
    'IPv4 VLSM Allocation|IPv4 VLSM 分配',
    'Allocate conventional host subnets largest-first inside one parent.|在一个父网内优先为最大需求分配常规主机子网。',
    [
      text('ip', 'Parent network address|父网络地址', '192.168.0.0'),
      i('p', 'Parent prefix|父前缀', 24, 0, 30),
      text('h', 'Required host counts|各子网所需主机数', '100,50'),
    ],
    (v) => {
      const ip = parseIP(v.ip),
        size = 2 ** (32 - v.p),
        start = Math.floor(ip / size) * size;
      check(
        ip === start,
        'Enter the parent network address, not a host address.|请输入父网络地址而非主机地址。',
      );
      const needs = nums(v.h);
      check(
        needs.length <= 32 && needs.every((x) => Number.isInteger(x) && x >= 1 && x <= 2 ** 32 - 2),
        'Use up to 32 positive integer host requirements.|最多 32 个正整数主机需求。',
      );
      const items = needs
        .map((h, k) => ({ h, k, size: 2 ** Math.ceil(Math.log2(h + 2)) }))
        .sort((a, b) => b.size - a.size || a.k - b.k);
      let next = start;
      const rows = [];
      for (const item of items) {
        check(
          next + item.size <= start + size,
          'The parent block is too small for these requirements.|父地址块不足以容纳这些需求。',
        );
        rows.push(
          R(
            'Request ' + (item.k + 1) + '|需求 ' + (item.k + 1),
            showIP(next) + '/' + (32 - Math.log2(item.size)),
          ),
        );
        next += item.size;
      }
      return [...rows, R('Unallocated addresses|未分配地址数', start + size - next)];
    },
    'For each requirement choose 2^ceil(log₂(hosts+2)); allocate largest blocks first',
    ['192.168.0.0/25', '192.168.0.128/26', 64],
    'Uses conventional network and broadcast reservations; /31 and /32 allocations are not used.|使用常规网络与广播地址保留规则，不采用 /31 或 /32 分配。',
  );
  D(
    'ipv6-subnet-count',
    'IPv6 Subnet Count|IPv6 子网数量',
    'Count equal-length IPv6 child prefixes using exact integers.|以精确整数计算等长 IPv6 子前缀数量。',
    [
      i('a', 'Parent prefix length|父前缀长度', 48, 0, 128),
      i('b', 'Child prefix length|子前缀长度', 64, 0, 128),
    ],
    (v) => {
      check(
        v.b >= v.a,
        'Child prefix must be at least as long as parent prefix.|子前缀长度不得短于父前缀。',
      );
      return [
        R('Child subnets|子网数量', (2n ** BigInt(v.b - v.a)).toString()),
        R('Addresses per child subnet|每子网地址数', (2n ** BigInt(128 - v.b)).toString()),
      ];
    },
    'Subnets=2^(childPrefix−parentPrefix); addresses=2^(128−childPrefix)',
    ['65536', '18446744073709551616'],
  );
  D(
    'raid-capacity',
    'RAID Capacity|RAID 可用容量',
    'Estimate conventional RAID usable capacity with equal-size disks.|估算等容量磁盘的常规 RAID 可用容量。',
    [
      i('n', 'Disk count|磁盘数', 4, 1, 1000),
      p('s', 'Smallest disk capacity (TB, decimal)|最小磁盘容量（TB，十进制）', 4),
      select('r', 'RAID level|RAID 级别', '5', [
        ['0', 'RAID 0'],
        ['1', 'RAID 1'],
        ['5', 'RAID 5'],
        ['6', 'RAID 6'],
        ['10', 'RAID 10'],
      ]),
    ],
    (v) => {
      check(
        v.r === '0' ||
          (v.r === '1' && v.n >= 2) ||
          (v.r === '5' && v.n >= 3) ||
          (v.r === '6' && v.n >= 4) ||
          (v.r === '10' && v.n >= 4 && v.n % 2 === 0),
        'Disk count does not support this RAID level.|磁盘数量不支持该 RAID 级别。',
      );
      const count =
        v.r === '0'
          ? v.n
          : v.r === '1'
            ? 1
            : v.r === '5'
              ? v.n - 1
              : v.r === '6'
                ? v.n - 2
                : v.n / 2;
      return [
        R('Usable nominal capacity|标称可用容量', count * v.s, 'TB'),
        R('Raw nominal capacity|标称原始容量', v.n * v.s, 'TB'),
      ];
    },
    'RAID0=N×S; RAID1=S; RAID5=(N−1)S; RAID6=(N−2)S; RAID10=N×S/2',
    [12, 16],
    'Before filesystem, controller metadata, spare disks and reserved capacity. RAID is not a backup.|未计文件系统、控制器元数据、热备盘与保留空间；RAID 不是备份。',
  );
  D(
    'storage-retention',
    'Storage Retention Time|存储保留时长',
    'Compare usable storage with daily generated data and replicas.|比较可用存储与每日产生数据及副本数。',
    [
      n('s', 'Usable capacity (TB, decimal)|可用容量（TB，十进制）', 10),
      p('d', 'New data per day (GB)|每日新增数据（GB）', 100),
      i('r', 'Stored copies|保存副本数', 2, 1, 1000),
      n('e', 'Reserved capacity (%)|保留空间（%）', 20, 0, 99.999),
    ],
    (v) => [
      R('Estimated retention|估计保留时长', (v.s * 1000 * (1 - v.e / 100)) / (v.d * v.r), 'days'),
    ],
    'Days=TB×1000×(1−reserve)/(dailyGB×copies)',
    [40],
  );
  D(
    'backup-window-bandwidth',
    'Backup Window Bandwidth|备份窗口所需带宽',
    'Reverse a data volume and deadline into required link speed.|由数据量与备份时限反推所需链路速度。',
    [
      n('s', 'Changed source data (GB)|发生变化的源数据（GB）', 100),
      n('c', 'Transferred size after compression (%)|压缩后传输比例（%）', 50, 0, 100),
      p('t', 'Available window (hours)|可用窗口（小时）', 2),
      eff,
    ],
    (v) => [
      R(
        'Required nominal bandwidth|所需标称带宽',
        (((v.s * v.c) / 100) * 8000) / (v.t * 3600 * (v.e / 100)),
        'Mbps',
      ),
    ],
    'Mbps=sourceGB×compressionFraction×8000/(hours×3600×efficiency)',
    [625 / 9],
  );
  D(
    'random-password-entropy',
    'Random Password Entropy|随机密码熵',
    'Count uncertainty for independent uniformly random character choices.|计算字符独立等概率随机生成时的不确定性。',
    [
      i('l', 'Random character count|随机字符数', 12, 1, 1000),
      i('a', 'Alphabet size|字符集大小', 64, 2, 1000000),
    ],
    (v) => [R('Generation entropy|生成过程熵', v.l * Math.log2(v.a), 'bits')],
    'H=length×log₂(alphabet size)',
    [72],
    'Applies only to independent uniform random generation, not human-chosen passwords. Do not enter an actual password; no password field exists.|仅适用于独立均匀随机生成，不适用于人为选取密码。无需输入真实密码，本页没有密码输入框。',
  );
  D(
    'random-search-time',
    'Random Search Time Model|随机搜索耗时模型',
    'Estimate average exhaustive-search time from an assumed random search space.|由假定随机空间估计穷举平均耗时。',
    [
      n('b', 'Random search-space entropy (bits)|随机空间熵（bits）', 40, 1, 1000),
      p('r', 'Assumed guesses per second|假定每秒尝试次数', 1000000),
    ],
    (v) => [
      R('Expected time at entered rate|所填速率下平均用时', 2 ** (v.b - 1) / v.r, 'seconds'),
      R('Worst-case exhaustive time|最坏穷举用时', 2 ** v.b / v.r, 'seconds'),
    ],
    'Expected seconds≈2^(bits−1)/guessesPerSecond',
    [549755.813888, 1099511.627776],
    'Uniform search-space model only. Real password guessing, online rate limits, hashing cost, parallelism and compromise risk can differ greatly.|仅均匀搜索空间模型；实际密码猜测、在线限速、哈希成本、并行与泄露风险可能大不相同。',
  );
  D(
    'hash-collision-probability',
    'Hash Collision Probability|哈希碰撞概率',
    'Estimate birthday collisions in a uniformly random hash space.|估计均匀随机哈希空间中的生日碰撞。',
    [
      n('n', 'Generated independent hashes|独立生成哈希数', 1000000, 0, 1e15),
      i('b', 'Hash width (bits)|哈希位数', 64, 1, 1024),
    ],
    (v) => {
      const t = (v.n * (v.n - 1)) / 2 / 2 ** v.b;
      return [
        R(
          'Approximate collision probability|近似碰撞概率',
          -100 * Math.expm1(-Math.max(0, t)),
          '%',
        ),
      ];
    },
    'P(collision)≈1−exp[−n(n−1)/(2×2^bits)]',
    [0.0000027105026839742054],
    'Birthday approximation for uniform independent hashes; not a cryptographic security proof or a model of adversarial collisions.|均匀独立哈希的生日近似，不是密码学安全证明，也不模拟对抗性碰撞。',
  );
  D(
    'sla-downtime',
    'SLA Downtime Budget|SLA 停机预算',
    'Translate availability percentage into allowed downtime.|将可用性比例换算为停机时间预算。',
    [
      n('a', 'Availability target (%)|可用性目标（%）', 99.9, 0, 100),
      p('d', 'Days in reporting period|统计期间天数', 30),
    ],
    (v) => [
      R('Allowed downtime|允许停机时间', v.d * 24 * 60 * (1 - v.a / 100), 'minutes'),
      R('Allowed downtime in seconds|允许停机秒数', v.d * 86400 * (1 - v.a / 100), 'seconds'),
    ],
    'Downtime=period×(1−availability)',
    [43.2, 2592],
    'Arithmetic budget only. Contract exclusions, maintenance windows and measurement methods are not applied.|仅计算时间预算，不应用合同排除项、维护窗口或测量方法。',
  );
  D(
    'component-availability',
    'Component Availability|组件组合可用性',
    'Combine independent component availabilities in series or parallel.|按串联或并联组合独立组件可用率。',
    [
      text('x', 'Component availabilities (%)|各组件可用率（%）', '99,99'),
      select('m', 'Dependency layout|依赖方式', 'series', [
        ['series', 'All must work|全部必须工作'],
        ['parallel', 'At least one must work|至少一个工作'],
      ]),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x >= 0 && x <= 100),
        'Availability must lie between 0% and 100%.|可用率应在 0% 到 100% 之间。',
      );
      return [
        R(
          'Combined availability|组合可用率',
          100 *
            (v.m === 'series'
              ? a.reduce((p, x) => (p * x) / 100, 1)
              : 1 - a.reduce((p, x) => p * (1 - x / 100), 1)),
          '%',
        ),
      ];
    },
    'Series=∏Aᵢ; parallel=1−∏(1−Aᵢ)',
    [98.01],
    'Assumes independence and ideal failover. Shared power, software, region and recovery dependencies can invalidate multiplication.|假设独立且切换理想；共享电源、软件、地域与恢复依赖可能使相乘模型失效。',
  );
  D(
    'latency-budget',
    'Sequential Latency Budget|串行延迟预算',
    'Add sequential stages and compare them with a target.|合计串行阶段延迟并与目标比较。',
    [
      text('x', 'Sequential stage times (ms)|各串行阶段用时（ms）', '20,50,30'),
      n('t', 'Target end-to-end latency (ms)|端到端目标延迟（ms）', 200),
    ],
    (v) => {
      const a = nums(v.x);
      check(
        a.every((x) => x >= 0),
        'Stage times cannot be negative.|各阶段用时不能为负。',
      );
      const t = sum(a);
      return [
        R('Total serial latency|串行总延迟', t, 'ms'),
        R('Remaining budget|剩余预算', v.t - t, 'ms'),
        R('Largest stage|最大阶段', Math.max(...a), 'ms'),
      ];
    },
    'Total=Σstage times; spare=target−total',
    [100, 100, 50],
    'For sequential work only. Concurrent branches require a dependency graph; percentile latencies cannot generally be added as if they were means.|仅适用于串行工作；并发分支需依赖图，分位数延迟通常不能像均值一样直接相加。',
  );
  D(
    'littles-law',
    'Little’s Law Capacity|利特尔定律容量',
    'Relate stable throughput, time in system and work in progress.|联系稳定系统的吞吐率、停留时间与在途工作量。',
    [
      n('r', 'Average arrivals per second|平均每秒到达数', 100),
      n('t', 'Average time in system (seconds)|平均系统停留时间（秒）', 0.2),
    ],
    (v) => [R('Average concurrent work|平均在途工作量', v.r * v.t)],
    'L=λW',
    [20],
    'Requires stable long-run averages and consistent system boundaries. This is not a maximum concurrency or queueing-tail guarantee.|要求稳定长期平均与一致系统边界，不保证最大并发或排队尾延迟。',
  );
  D(
    'server-hosting-cost',
    'Server Hosting Cost|服务器托管费用',
    'Combine instance hours with traffic and fixed charges.|合并实例小时、流量及固定费用。',
    [
      i('n', 'Instance count|实例数', 2, 0, 100000),
      n('h', 'Billable hours per instance|每实例计费小时', 720),
      n('r', 'Price per instance-hour|每实例小时价格', 0.05),
      n('t', 'Billable traffic (GB)|计费流量（GB）', 100),
      n('p', 'Traffic price per GB|每 GB 流量价格', 0.1),
      n('f', 'Other fixed charges|其他固定费用', 5),
    ],
    (v) => [
      R('Estimated period cost|估计期间费用', v.n * v.h * v.r + v.t * v.p + v.f),
      R('Compute portion|计算实例费用', v.n * v.h * v.r),
      R('Traffic portion|流量费用', v.t * v.p),
    ],
    'Cost=instances×hours×hourlyPrice+trafficGB×trafficPrice+fixed',
    [87, 72, 10],
    'All prices entered manually. Excludes taxes, tiered discounts, minimum billing and services not listed.|所有价格手动填写，不含税费、阶梯折扣、最低计费与未列服务。',
  );
  D(
    'cloud-storage-cost',
    'Cloud Storage and Requests Cost|云存储与请求费用',
    'Separate storage, request and egress cost assumptions.|分开计算存储、请求与出站流量成本。',
    [
      n('s', 'Average stored GB-months|平均存储 GB·月', 1000),
      n('p', 'Price per GB-month|每 GB·月价格', 0.02),
      n('r', 'Request count|请求次数', 1000000),
      n('q', 'Price per million requests|每百万请求价格', 0.4),
      n('e', 'Billable egress (GB)|计费出站流量（GB）', 100),
      n('f', 'Price per egress GB|每 GB 出站价格', 0.1),
    ],
    (v) => [
      R('Estimated monthly cost|估计月费用', v.s * v.p + (v.r / 1e6) * v.q + v.e * v.f),
      R('Storage portion|存储费用', v.s * v.p),
      R('Requests portion|请求费用', (v.r / 1e6) * v.q),
      R('Egress portion|出站费用', v.e * v.f),
    ],
    'Cost=GBmonths×storagePrice+requests/1e6×requestPrice+egressGB×egressPrice',
    [30.4, 20, 0.4, 10],
  );
  D(
    'context-token-budget',
    'Context Token Budget|上下文 Token 预算',
    'Reserve output space and calculate remaining input capacity.|预留输出空间并计算剩余输入容量。',
    [
      i('w', 'Model context window (tokens)|模型上下文窗口（tokens）', 32000, 1, 100000000),
      i('s', 'System and tool tokens|系统与工具 tokens', 2000, 0, 100000000),
      i('h', 'Existing history tokens|已有历史 tokens', 10000, 0, 100000000),
      i('r', 'Reserved output tokens|预留输出 tokens', 4000, 0, 100000000),
      i('p', 'Tokens per new document chunk|每个新文档块 tokens', 2000, 1, 100000000),
    ],
    (v) => {
      const available = v.w - v.s - v.h - v.r;
      return [
        R('Remaining input budget|剩余输入预算', available, 'tokens'),
        R('Whole new chunks that fit|可容纳完整新块数', Math.max(0, Math.floor(available / v.p))),
        R('Over budget|超出预算', Math.max(0, -available), 'tokens'),
      ];
    },
    'Available=window−system−history−reservedOutput',
    [16000, 8, 0],
    'Use the actual tokenizer and provider limits. Context windows, output caps, hidden overhead and prices are not fetched or verified here.|请使用实际分词器与提供商限制；此处不获取或核实上下文窗口、输出上限、隐藏开销或价格。',
  );
  D(
    'api-throughput-limit',
    'API Throughput Limit|API 吞吐限制',
    'Compare a request-rate quota with concurrency and service time.|比较请求速率配额与并发及服务时长限制。',
    [
      p('r', 'Requests allowed per minute|每分钟允许请求数', 600),
      i('c', 'Concurrent request slots|并发请求槽位', 5, 1, 100000),
      p('t', 'Average service time (seconds)|平均服务时间（秒）', 1),
      i('n', 'Requests to process|待处理请求数', 1000, 1, 1000000000),
    ],
    (v) => {
      const q = Math.min(v.r / 60, v.c / v.t);
      return [
        R('Steady-state throughput ceiling|稳态吞吐上限', q, 'requests/s'),
        R('Ideal steady-flow batch duration|理想稳态流批次用时', v.n / q, 'seconds'),
        R('Concurrency-limited throughput|并发限制吞吐', v.c / v.t, 'requests/s'),
      ];
    },
    'Throughput≤min(RPM/60,concurrency/serviceTime); duration≈requests/throughput',
    [5, 200, 5],
    'Steady-state upper bound, not a scheduler. Burst windows, retries, token quotas, queue delays and provider-specific enforcement are excluded.|稳态上界，不是调度器；不含突发窗口、重试、token 配额、排队及提供商执行规则。',
  );
})();
