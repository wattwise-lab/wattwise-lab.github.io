const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const para = (en, zh) => `<p data-cm-pair="${esc(en + '|' + zh)}">${esc(en)}</p>`;
const code = (s) =>
  `<p class="cm-expanded__formula" data-cm-no-translate><code>${esc(s)}</code></p>`;
export function upgradeCorePage($, slug) {
  if (slug === 'ohms-law-calculator') {
    $('option,label,th,td,h2').each((_, element) => {
      const e = $(element),
        text = e.text().trim(),
        pairs = { Current: 'Electric current|电流', Power: 'Electrical power|电功率' };
      if (pairs[text]) e.attr('data-cm-pair', pairs[text]).text(pairs[text].split('|')[0]);
    });
  }
  if (slug === 'mean-median-mode-calculator') {
    $('th,td,h2').each((_, element) => {
      const e = $(element),
        text = e.text().trim(),
        pairs = { Range: 'Statistical range|极差', Mode: 'Statistical mode|众数' };
      if (pairs[text] && !e.children().length)
        e.attr('data-cm-pair', pairs[text]).text(pairs[text].split('|')[0]);
    });
  }
  if (slug === 'molar-mass-calculator') {
    $('h3').each((_, element) => {
      const e = $(element);
      if (e.text().trim() === 'What is a mole?')
        e.attr('data-cm-pair', 'What is a mole in chemistry?|化学中的摩尔是什么？').text(
          'What is a mole in chemistry?',
        );
    });
  }
  const grid = $('.hero .grid').first();
  function field(id, label, value, min = 0, max = 1e12, step = 'any') {
    if ($('#' + id).length) return;
    grid.append(
      `<div><label for="${id}" data-cm-pair="${esc(label)}">${esc(label.split('|')[0])}</label><input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" required></div>`,
    );
  }
  function section(name, html) {
    const card = $('.wrap>.card')
      .filter((_, element) => $(element).find('h2').first().text().trim() === name)
      .first();
    if (card.length) card.html('<h2>' + esc(name) + '</h2>' + html);
  }
  function paragraph(name, en, zh) {
    const card = $('.wrap>.card')
      .filter((_, element) => $(element).find('h2').first().text().trim() === name)
      .first();
    card.find('p').remove();
    card.append(para(en, zh));
  }
  if (slug === 'apr-calculator') {
    $('#rate').attr('max', '1000');
    $('#months').attr({ min: '1', max: '1200', step: '1' });
    $('#result')
      .closest('section')
      .find('h2')
      .first()
      .attr('data-cm-pair', 'Modeled annualized rate|模型年化利率')
      .text('Modeled annualized rate');
    $('#chipEff')
      .parent()
      .contents()
      .filter((_, n) => n.type === 'text')
      .first()
      .replaceWith('Effective annual rate: ');
    paragraph(
      'Formula',
      'First calculate a fixed monthly payment from the principal, nominal interest rate and whole number of months. Then find the monthly discount rate that makes the present value of all payments equal principal minus upfront fees. The displayed annualized rate is 12 times that monthly rate; the effective annual rate compounds it for a year. At zero interest with no fees, both rates are exactly zero.',
      '先按本金、名义利率及整数月数计算固定月供，再求使全部还款现值等于本金减前期费用的月折现率。所示年化利率为该月利率的 12 倍，有效年利率按该月利率复合一年。零利率且无费用时，两种利率均严格为零。',
    );
    paragraph(
      'Worked example',
      'For a $10,000 loan at 6% nominal interest over 36 months with $300 upfront fees, the unrounded monthly payment is about $304.21937452. Total payments round to $10,951.90 and proceeds are $9,700. The discount rate gives an annualized rate of about 8.06% and an effective annual rate of about 8.36%. Calculations use unrounded payments; actual payment rounding can change the result.',
      '本金 $10,000，名义年利率 6%，36 个月，前期费用 $300；未舍入月供约 $304.21937452，总还款四舍五入为 $10,951.90，到手资金为 $9,700。折现所得年化利率约 8.06%，有效年利率约 8.36%。计算使用未舍入月供，实际还款的舍入规则可能改变结果。',
    );
    paragraph(
      'Scope and limitations',
      'This is a mathematical fixed-payment loan cost model with equally spaced monthly payments and fees deducted at the start. It is not a jurisdiction-specific statutory APR disclosure. Local rules determine included charges, timing, rounding and disclosure conventions. Variable rates, irregular dates, optional services and later charges are not modeled. Compare lender disclosures using the rules and cash flows that apply to that loan.',
      '本工具按每月等间隔固定还款、期初扣费建立数学成本模型，不是某司法辖区的法定 APR 披露。费用计入、时间、舍入和披露方式由当地规则决定。模型不含浮动利率、不规则日期、可选服务及后续收费；比较贷款时应采用该笔贷款适用的规则与现金流。',
    );
    section(
      'FAQ',
      '<h3>What is the difference between the two annual rates?</h3>' +
        para(
          'The annualized rate multiplies the monthly discount rate by 12. The effective annual rate compounds it over a year. Both describe this model; neither label guarantees that a lender or local law uses the same calculation.',
          '年化利率将月折现率乘以 12；有效年利率按该月利率复合一年。两者均描述本模型，不保证贷款机构或当地法律采用相同算法。',
        ) +
        '<h3>What if the loan has no fees?</h3>' +
        para(
          'The monthly discount rate equals the entered nominal annual rate divided by 12. With a positive rate, annual compounding produces a higher effective rate. At zero interest and zero fees, both rates are zero.',
          '月折现率等于所填名义年利率除以 12。正利率复合后有效年利率更高；零利率、零费用时两者均为零。',
        ) +
        '<h3>Can I use a zero-interest loan with an upfront fee?</h3>' +
        para(
          'Yes. Payments still repay the principal, but the fee reduces the amount received, producing a positive discount rate and borrowing cost.',
          '可以。还款仍归还本金，但费用减少到手资金，因此折现率与借款成本为正。',
        ),
    );
    if (!$('#cm-apr-source').length)
      $('.wrap').append(
        '<section class="card" id="cm-apr-source"><h2>Primary references</h2><p><a href="https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/" rel="noopener">CFPB — interest rates and APR disclosures</a></p></section>',
      );
  }
  if (slug === 'debt-to-income-calculator') {
    const purpose =
      'Compare entered monthly debt payments with gross monthly income and calculate the housing share. Lending limits depend on the lender and loan product.';
    $('.wrap > .sub')
      .attr(
        'data-cm-pair',
        purpose + '|比较所填月债务付款与税前月收入，计算住房付款占比。贷款限额因机构与产品而异。',
      )
      .text(purpose);
    $('body').attr('data-cm-page-purpose', purpose);
    paragraph(
      'Formula',
      'DTI = total entered monthly payments ÷ gross monthly income × 100. Housing share = housing payment ÷ gross monthly income × 100. Gross income means income before taxes and deductions.',
      'DTI = 所填月付款总额 ÷ 税前月收入 × 100；住房占比 = 住房月付款 ÷ 税前月收入 × 100。税前收入指扣除税款及其他扣款之前的收入。',
    );
    paragraph(
      'Worked example',
      'Gross income $6,000 per month, housing $1,500, auto $300 and other debts $200 give total monthly payments of $2,000. DTI = $2,000 ÷ $6,000 × 100 = 33.33%. Housing share = $1,500 ÷ $6,000 × 100 = 25.00%. These are ratios, not loan approval predictions.',
      '税前月收入 $6,000、住房 $1,500、汽车贷款 $300、其他债务 $200，月付款合计 $2,000。DTI = $2,000 ÷ $6,000 × 100 = 33.33%；住房占比 = $1,500 ÷ $6,000 × 100 = 25.00%。这些只是比率，不预测贷款审批。',
    );
    paragraph(
      'Scope and limitations',
      'This worksheet totals the payments you enter. Different lenders and loan products use different DTI limits and may define eligible income and housing obligations differently. It does not assess credit history, assets, local lending rules or ability to afford all living costs. Confirm which payments and income your lender includes; avoid counting the same payment twice.',
      '本表汇总你填写的付款。不同贷款机构和产品采用不同 DTI 限额，对合格收入与住房义务的定义也可能不同。本工具不评估征信、资产、当地贷款规则或完整生活负担。请向机构确认收入与付款的计入方式，并避免重复计算同一笔付款。',
    );
    section(
      'FAQ',
      '<h3>Which payments should I enter?</h3>' +
        para(
          'Use the recurring obligations relevant to your comparison, such as housing, vehicle loans, student loans and credit card minimums. This worksheet includes any housing payment you enter, including rent. A lender may use different definitions. Food and utilities are separate living costs; the ratio does not replace a full budget.',
          '填写与你的比较相关的定期付款，例如住房、汽车贷款、学生贷款和信用卡最低还款。本表会计入所填住房付款，包括房租；机构定义可能不同。食品与水电属于其他生活费用，因此该比率不能代替完整预算。',
        ) +
        '<h3>Does this ratio determine loan approval?</h3>' +
        para(
          'No. There is no universal DTI cutoff. The lender, product, income documentation and other eligibility factors affect the decision. This calculator displays the ratio without assigning an approval category.',
          '不能。DTI 没有通用审批界限；机构、产品、收入证明与其他资格因素都会影响决定。本页仅显示比率，不划分审批类别。',
        ) +
        '<h3>Should I use gross or take-home pay?</h3>' +
        para(
          'Use gross income before taxes and deductions for this DTI calculation. A separate budget based on take-home pay is useful for everyday affordability, but it answers a different question.',
          '本 DTI 计算使用扣税及扣款之前的收入。以到手收入编制的生活预算有助于衡量实际负担，但用途不同。',
        ) +
        '<h3>How do payment changes affect the ratio?</h3>' +
        para(
          'With income unchanged, reducing a required monthly payment lowers the ratio. Paying extra principal only changes this calculation when it changes the recurring payment you enter. Ask your lender how revised payments and documented income are assessed.',
          '收入不变时，减少必需的月付款可降低比率。额外归还本金只有改变所填定期付款时才会影响本计算。请向机构确认调整后的付款与有证明的收入如何评估。',
        ),
    );
    if (!$('#cm-dti-source').length)
      $('.wrap').append(
        '<section class="card" id="cm-dti-source"><h2>Primary references</h2><p><a href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/" rel="noopener">CFPB — debt-to-income ratio</a></p></section>',
      );
  }
  if (slug === 'velocity-calculator') {
    if (!$('#cm-speed-source').length)
      $('.wrap').append(
        '<section class="card" id="cm-speed-source"><h2>Primary references</h2><p><a href="https://openstax.org/books/college-physics-2e/pages/2-3-time-velocity-and-speed" rel="noopener">OpenStax — speed and velocity definitions</a></p></section>',
      );
  }
  if (slug === 'compound-interest-calculator') {
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'Can I model irregular contributions?')
      .next('p')
      .replaceWith(
        para(
          'This form uses a fixed monthly contribution. For irregular deposits, grow each cash flow over the time remaining until the same end date, then add those future values. Do not add results with different end dates.',
          '本表使用固定月投入。对于不定期存入，分别按每笔现金流距离同一结束日期的剩余时间计算未来值，再相加；不要把结束日期不同的结果直接相加。',
        ),
      );
  }
  if (slug === 'bmi-calculator') {
    $('label[for=unit]').attr('data-cm-pair', 'Unit system|单位制').text('Unit system');
    paragraph(
      'Formula',
      'BMI = weight (kg) ÷ height² (m²). BMI Prime = BMI ÷ 25. Ponderal Index = weight (kg) ÷ height³ (m³). The reference weight interval starts at 18.5 × height² and ends just below 25 × height². Displayed thresholds are rounded; the upper threshold is excluded.',
      'BMI = 体重（kg）÷ 身高²（m²）；BMI Prime = BMI ÷ 25；Ponderal Index = 体重（kg）÷ 身高³（m³）。参考体重区间从 18.5 × 身高² 起，严格小于 25 × 身高²。显示的边界经过四舍五入，不包含上限。',
    );
    paragraph(
      'Worked example',
      'At 175 cm and 72.6 kg: BMI = 72.6 ÷ 1.75² ≈ 23.7, BMI Prime ≈ 0.95, and Ponderal Index ≈ 13.5 kg/m³. The reference weight thresholds are 18.5 × 1.75² = 56.65625 kg and 25 × 1.75² = 76.5625 kg, with the upper threshold excluded. Rounded for display: 56.7–<76.6 kg. Select metric units and enter these values to reproduce the example.',
      '身高 175 cm、体重 72.6 kg：BMI = 72.6 ÷ 1.75² ≈ 23.7，BMI Prime ≈ 0.95，Ponderal Index ≈ 13.5 kg/m³。参考体重边界为 18.5 × 1.75² = 56.65625 kg 和 25 × 1.75² = 76.5625 kg，不含上限。显示时四舍五入为 56.7–<76.6 kg。选择公制并填写这些数值可复算。',
    );
    paragraph(
      'Scope and limitations',
      'The CDC categories used here apply to adults aged 20 and older. BMI is a screening measure, not a diagnosis or a direct body-fat measurement. It does not distinguish muscle from fat or account for pregnancy and individual health circumstances. Children and teenagers need age- and sex-specific assessment. Classification uses unrounded BMI, even when the displayed number rounds to a boundary.',
      '本页使用 CDC 的 20 岁及以上成人分类。BMI 只是筛查指标，不是诊断或体脂直接测量；它不区分肌肉与脂肪，也不考虑妊娠及个人健康状况。儿童和青少年需按年龄、性别评估。分类依据未四舍五入的 BMI，即使显示值恰好舍入到边界。',
    );
    $('p')
      .filter((_, e) => $(e).text().startsWith('Standard adult cut-offs:'))
      .each((_, e) =>
        $(e).replaceWith(
          para(
            'Adult categories: underweight below 18.5; healthy weight from 18.5 to less than 25; overweight from 25 to less than 30; obesity from 30. The bar uses a scale of 40.',
            '成人分类：低于 18.5 为体重偏低；18.5 至小于 25 为健康体重范围；25 至小于 30 为超重；30 起为肥胖。图条刻度上限为 40。',
          ),
        ),
      );
    const faq = $('[data-cm-section=faq]');
    faq.find('p').each((_, e) => {
      const text = $(e).text();
      if (text.startsWith('Underweight is below 18.5'))
        $(e).replaceWith(
          para(
            'The intervals are below 18.5, from 18.5 to less than 25, from 25 to less than 30, and 30 or more. These are screening labels for adults aged 20 and older, not individual diagnoses.',
            '区间依次为低于 18.5、18.5 至小于 25、25 至小于 30，以及 30 或以上。这些是 20 岁及以上成人的筛查标签，不代表个人诊断。',
          ),
        );
      if (text.startsWith('BMI divided by 25'))
        $(e).replaceWith(
          para(
            'BMI Prime is BMI divided by 25. A value of 1 reaches the upper boundary and is outside the healthy-weight interval used here.',
            'BMI Prime 为 BMI 除以 25。数值为 1 时已达到上边界，不在本页使用的健康体重区间内。',
          ),
        );
    });
    if (!$('#cm-bmi-boundary-note').length)
      $('#result')
        .closest('section')
        .append(
          para(
            'Weight thresholds are rounded. The lower bound is included; the upper bound is excluded.',
            '体重边界经过四舍五入；包含下限，不包含上限。',
          ).replace('<p ', '<p id="cm-bmi-boundary-note" '),
        );
    if (!$('#cm-bmi-source').length)
      $('.wrap').append(
        '<section class="card" id="cm-bmi-source"><h2>Primary references</h2><p><a href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html" rel="noopener">CDC — adult BMI categories</a></p></section>',
      );
  }
  if (['mortgage-calculator', 'loan-calculator'].includes(slug)) {
    $('#term').attr({ min: String(1 / 12), max: '100' });
    $('#rate').attr('max', '1000');
  }
  if (slug === 'early-loan-payoff-calculator') $('#rate').attr('max', '1000');
  if (slug === 'ai-inference-cost') {
    $('#itok,#otok,#calls2').attr({ min: '0', max: '1000000000000', step: '1' });
    paragraph(
      'Scope and limitations',
      'All prices are editable examples in USD per million tokens, not a current provider quote. Zero calls means zero monthly cost; the hypothetical cost per call still follows your token and price assumptions. Caching, reasoning tokens, discounts, other modalities, taxes and rate limits require separate entries or estimates.',
      '所有价格均为可编辑的每百万 tokens 美元示例，不是提供商当前报价。零调用时月费为零，假设单次成本仍按 token 与价格计算；缓存、推理 tokens、折扣、其他模态、税费与限速需另行估算。',
    );
  }
  if (
    [
      'age-calculator',
      'countdown-calculator',
      'date-difference-calculator',
      'workday-calculator',
    ].includes(slug)
  ) {
    $('.hero input[type=date]').attr({ min: '0001-01-01', max: '9999-12-31' });
    if (['age-calculator', 'countdown-calculator'].includes(slug)) {
      const id = slug === 'age-calculator' ? 'ref' : 'from';
      if (!$('.cm-date-today').length)
        $('#' + id).after(
          '<button class="cm-date-today" type="button" data-cm-today="' +
            id +
            '" data-cm-pair="Use today|使用今天">Use today</button>',
        );
    }
    const scope = $('.wrap>.card')
      .filter(
        (_, element) => $(element).find('h2').first().text().trim() === 'Scope and limitations',
      )
      .first();
    if (!$('#cm-calendar-convention').length)
      scope.append(
        '<div id="cm-calendar-convention">' +
          para(
            'Uses the proleptic Gregorian calendar and date-only arithmetic, independent of daylight saving time. Complete years and months use the original day of month, clamped to the last valid day when necessary. Other anniversary conventions can differ; this is not a legal age determination.',
            '使用前推格里高利历及纯日期运算，不受夏令时影响。完整年、月按原日期计周年，必要时夹取至该月最后有效日；其他周年约定可能不同，本工具不判定法定年龄。',
          ) +
          '</div>',
      );
  }
  if (slug === 'workday-calculator' && !$('#weekend').length) {
    grid.append(
      '<div><label for="weekend" data-cm-pair="Weekly non-working days|每周休息日">Weekly non-working days</label><select id="weekend"><option value="0,6" selected data-cm-pair="Saturday and Sunday|周六、周日">Saturday and Sunday</option><option value="5,6" data-cm-pair="Friday and Saturday|周五、周六">Friday and Saturday</option><option value="0" data-cm-pair="Sunday only|仅周日">Sunday only</option><option value="none" data-cm-pair="No weekly rest days|无固定每周休息日">No weekly rest days</option></select></div>',
    );
  }
  if (slug === 'workday-calculator') {
    section(
      'FAQ',
      para(
        'Which days count? Choose the weekly rest-day pattern. The default excludes Saturday and Sunday; the date range includes both endpoints.',
        '如何确定工作日？请选择每周休息日模式，默认排除周六、周日，日期范围包含首尾两天。',
      ) +
        para(
          'Holiday deductions must refer only to otherwise working days, without double-counting weekly rest days. Fractional deductions may represent half days; the total cannot exceed the working-day count.',
          '节假日扣除仅应包含原本工作的日子，不要重复扣除每周休息日；可用小数表示半天，总扣除不能超过工作日数。',
        ),
    );
  }
  if (slug === 'pregnancy-due-date-calculator')
    $('#lmp').attr({ min: '0001-01-01', max: '9998-12-31' });
  if (slug === 'freelance-real-rate') {
    $('#tax').attr({ min: '0', max: '99.999' });
    $('#hours').attr({ min: '0.000001', max: '168' });
    $('#bill').attr({ min: '0.000001', max: '100' });
    field('weeks', 'Working weeks per year|每年工作周数', 48, 0.000001, 53);
    if (!$('#taxbase').length)
      grid.append(
        '<div><label for="taxbase" data-cm-pair="Tax basis assumption|税基假设">Tax basis assumption</label><select id="taxbase"><option value="gross" selected data-cm-pair="Gross revenue|总收入流水">Gross revenue</option><option value="profit" data-cm-pair="Revenue after entered expenses|扣除所填费用后的收入">Revenue after entered expenses</option></select></div>',
      );
    $('#tNum')
      .closest('tr')
      .find('td,th')
      .first()
      .attr('data-cm-pair', 'Amount divided by retained share|用于除以留存比例的金额')
      .text('Amount divided by retained share');
    $('#tRet')
      .closest('tr')
      .find('td,th')
      .first()
      .attr('data-cm-pair', 'Retained share after entered tax|按所填税率计算的留存比例')
      .text('Retained share after entered tax');
    paragraph(
      'Breakdown',
      'For gross-revenue tax: revenue × (1 − tax rate) − expenses = income target. For profit-basis tax: (revenue − expenses) × (1 − tax rate) = income target. The selected basis is an assumption, not a tax ruling.',
      '按总收入计税：流水 ×（1 − 税率）− 费用 = 收入目标。按利润计税：（流水 − 费用）×（1 − 税率）= 收入目标。所选税基是假设，不是税务裁定。',
    );
    section(
      'Formula',
      code(
        'Billable hours = weekly hours × working weeks × billable fraction\nGross-basis revenue = (income target + expenses)/(1 − tax rate)\nProfit-basis revenue = income target/(1 − tax rate) + expenses\nHourly rate = required revenue/billable hours',
      ) +
        para(
          'There is no retained-share floor. A tax rate of 100% is outside this model.',
          '不再设置留存比例下限，100% 税率超出本模型范围。',
        ),
    );
    section(
      'Worked example',
      para(
        'At the default gross-revenue tax basis: target 240,000 + expenses 30,000 = 270,000. Divide by 0.8 to get revenue 337,500. Billable hours = 40 × 48 × 0.6 = 1,152. Required rate = 337,500 / 1,152 = 292.96875 per hour.',
        '默认按总收入计税：目标 240,000 + 费用 30,000 = 270,000；除以 0.8 得流水 337,500。可计费工时 = 40 × 48 × 0.6 = 1,152。所需时薪 = 337,500 / 1,152 = 292.96875。',
      ) +
        para(
          'Selecting profit-basis tax changes the same example to revenue 330,000 and a required rate of 286.458333333 per hour. This illustrates why the tax-basis assumption matters.',
          '改选按利润计税，同一示例流水为 330,000，所需时薪约 286.458333333，说明税基假设会改变结果。',
        ),
    );
    section(
      'Scope and limitations',
      para(
        'This is a planning model with one effective tax rate and an editable working-year assumption. It does not apply tax brackets, social contributions, deductions or local rules. Confirm which expenses, if any, reduce your actual taxable base.',
        '本工具使用单一有效税率与可编辑工作年假设进行规划，不应用税档、社保、扣除或当地规则；请核实哪些费用可减少实际税基。',
      ) +
        para(
          'Unpaid administration, marketing, leave and downtime must be reflected in your working weeks or billable share. A required rate is a break-even target for your assumptions, not a market-rate recommendation.',
          '无偿行政、营销、休假及停工应体现在工作周数或可计费比例中；所需时薪是按假设覆盖目标的价格，不是市场报价建议。',
        ),
    );
    section(
      'FAQ',
      para(
        'Why two tax bases? Expenses may or may not be deductible in your actual situation. The choice changes the arithmetic; it does not determine legal eligibility for deductions.',
        '为什么有两种税基？实际费用可能可抵扣，也可能不可抵扣。选项改变计算，但不判断法定抵扣资格。',
      ) +
        para(
          'Why 48 weeks? It is an editable example allowing time off. Replace it with your own realistic working year.',
          '为什么默认 48 周？这只是预留休息时间的可编辑示例，请换成自己的实际工作年。',
        ) +
        para(
          'What if billable time is zero? No finite hourly rate can cover a positive annual target without billable hours.',
          '可计费时间为零怎么办？没有可计费工时时，不存在能覆盖正年度目标的有限时薪。',
        ),
    );
  }
  if (slug === 'rent-vs-buy-calculator') {
    $('.hero .hint,.hero .note,.hero .small').each((_, element) => {
      if (/Mortgage modelled as a 30-year|rent is held flat/.test($(element).text()))
        $(element).remove();
    });
    $('#price').attr('min', '0.000001');
    $('#rent').attr('min', '0');
    $('#years').attr({ min: String(1 / 12), max: '100' });
    $('#downp').attr({ min: '0', max: '100' });
    $('#mrate').attr({ min: '0', max: '1000' });
    $('#appr').attr({ min: '-99.999', max: '1000' });
    field('loanYears', 'Mortgage term (years)|房贷期限（年）', 30, 1 / 12, 100);
    field('buyfee', 'Purchase transaction costs (% of price)|买入交易费用（房价 %）', 3, 0, 100);
    field('sellfee', 'Selling costs (% of final value)|卖出费用（期末房价 %）', 5, 0, 100);
    field(
      'ownrate',
      'Annual tax, insurance and maintenance (% of home value)|每年税费、保险与维护（房产价值 %）',
      1.5,
      0,
      100,
    );
    field('rentgrowth', 'Annual rent growth (%)|年租金增长率（%）', 2, -99.999, 1000);
    field(
      'invest',
      'Alternative annual investment return (%)|替代投资年回报率（%）',
      5,
      -99.999,
      1000,
    );
    const bars = $('#bars').closest('.card');
    bars.find('h2').text('Ending wealth at the planning horizon');
    bars.find('p').remove();
    bars.append(
      para(
        'Both sides start with the same cash. The renter invests the down payment and purchase fees; whichever side spends less each month invests the difference. Values can be negative, even when a bar is clipped at zero.',
        '双方初始现金相同；租房方投资首付与买入费用，每月支出较少的一方投资差额。净值可能为负，负值即使柱长显示为零，仍会以数字列出。',
      ),
    );
    paragraph(
      'Advantage at different holding lengths',
      'Mortgage payments stop after the loan term. Home value, rent and alternative investments compound monthly from the annual assumptions; holding time rounds to the nearest month.',
      '房贷在贷款期限结束后停止还款；房价、租金与替代投资按年度假设逐月复合变化，持有时间四舍五入至最近整月。',
    );
    section(
      'Formula',
      code(
        'Monthly mortgage = principal/annuityFactor(monthlyRate, loanMonths)\nMonthly owner cost = mortgage + currentHomeValue × annualOwnershipCost/12\nRenter starts with down payment + purchase fees invested\nEach month the lower-spending side invests the cash-flow difference\nOwner ending wealth = finalHomeValue × (1 − saleFee) − loanBalance + ownerPortfolio\nDifference = owner ending wealth − renter ending wealth',
      ) +
        para(
          'Investment contributions occur at month end. Growth is smooth in this scenario; real markets do not follow a constant path.',
          '投资追加在月末发生；本情景按平滑增长模拟，实际市场不会沿固定轨迹变化。',
        ),
    );
    section(
      'Worked example',
      para(
        'Default example: price 400,000; 30% down; 6.5% mortgage for 30 years; hold 10 years; rent 2,000; home and rent growth 2%; purchase fees 3%; sale fees 5%; annual ownership costs 1.5%; alternative return 5%.',
        '默认示例：房价 400,000，首付 30%，房贷 6.5% / 30 年，持有 10 年，月租 2,000，房价与租金年增长 2%，买入费 3%，卖出费 5%，年持有费 1.5%，替代回报 5%。',
      ) +
        para(
          'Monthly mortgage is 1,769.79046578. The final mortgage balance is 237,373.15381644 and home value is 487,597.76799790. Owner ending wealth is 226,406.27374355; renter ending wealth is 234,962.36304386. The difference is −8,556.08930031, so renting has higher ending wealth in this example.',
          '房贷月供约 1,769.79046578，期末贷款余额约 237,373.15381644，房价约 487,597.76799790；买房期末净值约 226,406.27374355，租房期末净值约 234,962.36304386，差额约 −8,556.08930031，因此此示例中租房期末净值更高。',
        ),
    );
    section(
      'Scope and limitations',
      para(
        'All prices, growth rates, costs and returns are editable assumptions, not market forecasts. The combined ownership rate represents the tax, insurance and maintenance you choose; do not add the same cost twice. The model excludes local tax deductions, rent deposits, moving costs, borrowing restrictions and individual investment taxes.',
        '所有价格、增长、费用与回报均为可编辑假设，不是市场预测。合并持有费率代表你选定的税费、保险与维护，不要重复计入；不含当地税务扣除、租房押金、搬家成本、借款限制及个人投资税。',
      ) +
        para(
          'A larger ending wealth is one modeled financial comparison, not a recommendation to buy or rent. Test negative appreciation, lower investment returns, different horizons and realistic ownership costs.',
          '期末净值更高仅代表一项模型财务比较，不构成租买建议；请测试负房价增长、较低投资回报、不同期限及实际持有费用。',
        ),
    );
    section(
      'FAQ',
      para(
        'Can the mortgage rate be zero? Yes. Payments become principal divided by the number of months, without dividing by a zero rate.',
        '房贷利率可以为零吗？可以，此时月供为本金除以月数，不再除以零利率。',
      ) +
        para(
          'What happens after the mortgage ends? The remaining balance and mortgage payments become zero; the comparison continues with ongoing ownership costs and invested cash-flow differences.',
          '房贷结束后怎么办？剩余本金与房贷月供归零，比较继续计入持有费用及双方投资的支出差额。',
        ) +
        para(
          'Can home prices fall? Yes. Appreciation may be negative above −100%, and ending equity can be negative.',
          '房价可以下跌吗？可以，房价增长率可在 −100% 以上为负，期末房产净值也可能为负。',
        ) +
        para(
          'Why do the answers change with investment assumptions? Money tied up in a home and monthly cash-flow differences have an opportunity cost. The entered alternative return explicitly models that assumption.',
          '为什么投资假设会改变答案？占用在房产中的现金与每月支出差额存在机会成本，所填替代回报率用于明确模拟这一假设。',
        ),
    );
  }
}
