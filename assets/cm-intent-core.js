var CMIntent = (() => {
  'use strict';
  const definitions = [
    {
      slug: 'mortgage-calculator',
      words: ['房贷', 'mortgage'],
      fields: [
        ['price', 'Home price|房价', ['房价', '总价', 'home price', 'property price', 'price']],
        ['down', 'Down payment|首付', ['首付', 'down payment']],
        [
          'rate',
          'Annual rate (%)|年利率（%）',
          ['年利率', '利率', 'interest rate', 'annual rate', 'rate'],
        ],
        ['term', 'Term (years)|期限（年）', ['期限', '年限', 'term', 'years']],
        [
          'extra',
          'Extra monthly principal|额外月还本金',
          ['额外月还本金', 'extra monthly principal'],
        ],
      ],
    },
    {
      slug: 'loan-calculator',
      words: ['贷款', 'loan'],
      fields: [
        [
          'prin',
          'Loan principal|贷款本金',
          ['贷款金额', '本金', 'principal', 'loan amount', 'amount'],
        ],
        [
          'rate',
          'Annual rate (%)|年利率（%）',
          ['年利率', '利率', 'interest rate', 'annual rate', 'rate'],
        ],
        ['term', 'Term (years)|期限（年）', ['期限', '年限', 'term', 'years']],
        ['extra', 'Extra monthly payment|额外月供', ['额外月供', 'extra monthly payment']],
      ],
    },
    {
      slug: 'compound-interest-calculator',
      words: ['复利', 'compound'],
      fields: [
        ['prin', 'Principal|本金', ['本金', 'principal', 'initial balance']],
        [
          'contrib',
          'Monthly contribution|每月存入',
          ['每月存入', '月存', 'monthly contribution', 'monthly deposit'],
        ],
        [
          'rate',
          'Annual rate (%)|年利率（%）',
          ['年利率', '利率', '年收益率', 'annual rate', 'rate'],
        ],
        ['years', 'Years|年数', ['期限', '年数', 'years']],
      ],
    },
    {
      slug: 'rent-vs-buy-calculator',
      words: ['租买', '租房买房', 'rent vs buy', 'rent or buy'],
      fields: [
        ['price', 'Home price|房价', ['房价', 'home price', 'price']],
        ['downp', 'Down payment (%)|首付比例（%）', ['首付比例', 'down payment percent']],
        ['mrate', 'Mortgage rate (%)|房贷利率（%）', ['房贷利率', '利率', 'mortgage rate', 'rate']],
        ['rent', 'Monthly rent|月租', ['月租', 'monthly rent']],
        ['years', 'Holding years|持有年数', ['持有年数', 'years']],
      ],
    },
    {
      slug: 'freelance-real-rate',
      words: ['自由职业', '时薪', 'freelance', 'hourly pay'],
      fields: [
        ['income', 'Annual income target|年收入目标', ['年收入目标', '年收入', 'annual income']],
        ['tax', 'Tax rate (%)|税率（%）', ['税率', 'tax rate']],
        ['exp', 'Annual expenses|年开支', ['年开支', '年成本', 'annual expenses']],
        ['hours', 'Hours per week|每周工时', ['每周工时', 'hours per week']],
        ['bill', 'Billable share (%)|可计费比例（%）', ['可计费比例', 'billable share']],
      ],
    },
    {
      slug: 'ai-inference-cost',
      words: ['ai成本', 'ai 成本', '推理成本', 'ai cost', 'inference cost'],
      fields: [
        ['itok', 'Input tokens per call|每次输入 tokens', ['每次输入', 'input tokens']],
        ['otok', 'Output tokens per call|每次输出 tokens', ['每次输出', 'output tokens']],
        ['calls2', 'Calls per month|每月调用', ['每月调用', '月调用', 'calls per month']],
        [
          'iprice',
          'Input price per million tokens|每百万输入价格',
          ['每百万输入价格', 'input price'],
        ],
        [
          'oprice',
          'Output price per million tokens|每百万输出价格',
          ['每百万输出价格', 'output price'],
        ],
      ],
    },
  ];
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function normalize(source) {
    return String(source)
      .normalize('NFKC')
      .replace(/[٠-٩۰-۹०-९০-৯౦-౯]/g, (char) => {
        const code = char.codePointAt(0);
        const zero = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0c66].find(
          (first) => code >= first && code <= first + 9,
        );
        return String(code - zero);
      })
      .replace(/٪/g, '%')
      .toLowerCase();
  }
  function parse(source, { translate = (x) => x } = {}) {
    const s = normalize(source);
    if (s.length > 2000)
      return { error: 'Keep the request under 2,000 characters.|描述请控制在 2,000 字符以内。' };
    if (/\d[,٫٬]\d|\d+\.\d*\./.test(s))
      return {
        error:
          'Use ungrouped numbers and a decimal point, for example 100000 or 3.5. This avoids ambiguous regional separators.|请使用不分组数字与小数点，例如 100000 或 3.5，以避免地区分隔符歧义。',
      };
    const candidates = definitions
      .map((d) => ({
        ...d,
        score: d.words.filter((w) => s.includes(w)).reduce((sum, w) => sum + w.length, 0),
      }))
      .sort((a, b) => b.score - a.score);
    const selected = candidates[0];
    if (!selected?.score)
      return {
        error:
          'Use a tool name from the supported examples, or search the full catalog above.|请使用支持示例中的工具名称，或在上方搜索完整目录。',
      };
    const values = {},
      matched = [],
      ambiguous = [],
      invalidNumbers = [],
      unitErrors = [];
    let downPercent = false;
    for (const [id, label, raw] of selected.fields) {
      const aliases = [
        ...new Set(
          [...raw, translate(label.split('|')[0])]
            .filter(Boolean)
            .map(normalize)
            .sort((a, b) => b.length - a.length),
        ),
      ];
      const parsed = [],
        meanings = new Set();
      for (const alias of aliases) {
        const regex = new RegExp(
          (/^\p{Script=Han}/u.test(alias) ? '' : '(?<![\\p{L}\\p{N}_])') +
            escape(alias) +
            '\\s*(?:=|:|：|为|是)?\\s*([+-]?(?:(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?|infinity|nan))\\s*(千万|百万|亿|万|千|[kmb](?![a-z]))?',
          'giu',
        );
        const matches = [...s.matchAll(regex)];
        if (matches.length) {
          for (const m of matches) {
            const numberEnd = m.index + m[0].lastIndexOf(m[1]) + m[1].length;
            const remainder = s.slice(numberEnd);
            const number =
              Number(m[1]) *
              ({ 万: 1e4, 千: 1e3, 百万: 1e6, 千万: 1e7, 亿: 1e8, k: 1e3, m: 1e6, b: 1e9 }[m[2]] ||
                1);
            if (
              !Number.isFinite(number) ||
              (number === 0 && /[1-9]/.test(m[1].split('e')[0])) ||
              /^[e./]|^[+-](?=\d)/.test(remainder)
            ) {
              invalidNumbers.push(label);
              continue;
            }
            const tail = s.slice(m.index + m[0].length).trimStart();
            if (/^(months?\b|个月|月)/.test(tail)) unitErrors.push(label);
            if (tail.startsWith('%')) {
              if (selected.slug === 'mortgage-calculator' && id === 'down') downPercent = true;
              else if (!['rate', 'mrate', 'downp', 'tax', 'bill'].includes(id))
                unitErrors.push(label);
            }
            parsed.push(number);
            meanings.add(
              String(number) +
                (selected.slug === 'mortgage-calculator' && id === 'down' && tail.startsWith('%')
                  ? '%'
                  : ''),
            );
          }
        }
      }
      if (meanings.size > 1) ambiguous.push(label);
      if (parsed.length) {
        values[id] = parsed[0];
        matched.push({ id, label, value: parsed[0] });
      }
    }
    if (invalidNumbers.length)
      return {
        error:
          'Use complete numbers within the supported numeric range.|请填写完整且处于可支持数值范围内的数字。',
      };
    if (unitErrors.length)
      return {
        error:
          'A unit does not match the field. Time fields here use years; percentages are accepted only for percentage fields or a mortgage down payment with a home price.|单位与字段不符：这里的时间字段使用年；百分比仅用于百分比字段，或同时给出房价的房贷首付。',
      };
    if (downPercent) {
      if (!(values.price > 0 && values.down >= 0 && values.down <= 100))
        return {
          error:
            'A percentage down payment needs a positive home price and a percentage from 0 to 100.|百分比首付需要同时填写正房价，且首付比例应在 0–100。',
        };
      const row = matched.find((x) => x.id === 'down');
      row.sourcePercent = values.down;
      values.down = (values.price * values.down) / 100;
      row.value = values.down;
    }
    if (ambiguous.length)
      return {
        error:
          'A field has conflicting values. Use each label once and preview again.|同一字段存在冲突数值，请每个字段只填写一次后重新预览。',
      };
    if (!matched.length)
      return {
        error:
          'No labelled numbers found. Use field name + number, such as “principal 100000 rate 5 term 20”.|未识别到带字段名的数字，请按“本金 100000 利率 5 期限 20”这样的格式填写。',
      };
    return { slug: selected.slug, values, matched };
  }
  return { parse, definitions, normalize };
})();
