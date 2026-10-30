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
  if (slug === 'quadratic-equation-calculator') {
    paragraph(
      'Scope and limitations',
      'Nonzero a defines a quadratic. If a is zero, the page reports the linear or constant-equation case. Results normally show 12 significant digits, increasing to 17 to distinguish close roots. Very small or large values use scientific notation. Decimal input precision still limits accuracy, especially near repeated roots. Unsupported numerical magnitudes show an error instead of infinity or a false zero.',
      'a 不为零时才是二次方程；a 为零时显示一次方程或常数等式情况。结果通常显示 12 位有效数字，区分接近的根时增至 17 位；极小值或极大值使用科学记数法。输入精度仍会限制准确度，接近重根时尤其明显。超出数值表示范围会报错，不显示无穷大或虚假的零。',
    );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'What if a is zero?')
      .next('p')
      .replaceWith(
        para(
          'Then solve bx + c = 0. If b is nonzero, x = −c ÷ b. If b and c are both zero, every real x works; if b is zero but c is not, there is no solution.',
          '此时求解 bx + c = 0。若 b 不为零，x = −c ÷ b；若 b、c 均为零，任意实数 x 都成立；若 b 为零而 c 不为零，则无解。',
        ),
      );
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-quadratic-source]').length)
      scope.append(
        '<p data-cm-quadratic-source><a data-cm-no-translate href="https://people.eecs.berkeley.edu/~wkahan/Qdrtcs.pdf" rel="noopener noreferrer">W. Kahan (2004), Qdrtcs</a></p>',
      );
  }
  if (slug === 'system-of-equations-calculator') {
    paragraph(
      'Formula',
      'For a₁x + b₁y = c₁ and a₂x + b₂y = c₂, D = a₁b₂ − a₂b₁. If D ≠ 0, x = (c₁b₂ − c₂b₁) ÷ D and y = (a₁c₂ − a₂c₁) ÷ D. If D = 0, consistent dependent constraints have infinitely many solutions; contradictory constraints have none. An equation with zero coefficients and a nonzero constant is a contradiction.',
      '对于 a₁x + b₁y = c₁、a₂x + b₂y = c₂，D = a₁b₂ − a₂b₁。当 D ≠ 0 时，x = (c₁b₂ − c₂b₁) ÷ D，y = (a₁c₂ − a₂c₁) ÷ D。当 D = 0 时，相关且相容的约束有无穷多解，矛盾约束则无解。系数全为零而常数不为零的方程属于矛盾。',
    );
    paragraph(
      'Scope and limitations',
      'This page solves two linear equations in two unknowns, including identity and contradictory zero-coefficient rows. It does not solve nonlinear terms, inequalities or larger systems. Results display up to 12 significant digits. Nearly dependent equations can be very sensitive to input precision. Values outside the supported numeric range show an error.',
      '本页求解二元一次方程组，包括恒等式及系数全为零的矛盾行。不求解非线性项、不等式或更大方程组。结果最多显示 12 位有效数字，接近相关的方程对输入精度可能十分敏感。超出数值表示范围时显示错误。',
    );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'What does the solution mean geometrically?')
      .next('p')
      .replaceWith(
        para(
          'A non-degenerate linear equation describes a line. Two intersecting lines give one solution; distinct parallel lines give none; coincident lines give infinitely many. A zero-coefficient equation instead describes either no restriction or a contradiction.',
          '非退化一次方程表示一条直线：相交直线有唯一解，不同平行线无解，重合直线有无穷多解。系数全为零的等式则表示没有额外限制，或构成矛盾。',
        ),
      );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'What if the determinant is zero?')
      .next('p')
      .replaceWith(
        para(
          'There is no unique pair. The page checks whether the constraints are consistent, including zero-coefficient rows. Consistent dependent equations give infinitely many solutions; a contradiction such as zero equaling a nonzero constant gives none.',
          '此时没有唯一数对。本页检查约束是否相容，也检查全零系数行。相关且相容的方程有无穷多解；例如零等于非零常数这样的矛盾则无解。',
        ),
      );
  }
  if (slug === 'simple-interest-calculator') {
    paragraph(
      'Scope and limitations',
      'The original principal stays fixed for the whole entered period, and interest is not added to principal. Real loan payments can reduce the outstanding principal and use daily interest counts; this page does not build that repayment schedule or include fees. Partial years scale interest proportionally. Comparisons with compounding depend on matching rate and timing conventions.',
      '在整个输入期间，原始本金保持固定，利息不加入本金。实际贷款付款可能减少未偿本金，并按实际天数计息；本页不生成该还款计划，也不包含费用。非整年按比例计息。与复利比较时，需采用一致的利率和时间口径。',
    );
    $('h3')
      .filter(
        (_, e) => $(e).text().trim() === 'How is simple interest different from compound interest?',
      )
      .next('p')
      .replaceWith(
        para(
          'Here simple interest uses the fixed original principal. Compounding adds earned interest to the balance before later interest is calculated. With a positive rate across several compounding periods, this increases growth; compare the same timeline and rate basis.',
          '本页单利使用固定的原始本金；复利则先把已赚利息加入余额，再计算后续利息。在正利率、多个复利周期下，这会增加增长量；比较时应统一时间范围和利率口径。',
        ),
      );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'When is simple interest actually used?')
      .next('p')
      .replaceWith(
        para(
          'This fixed-principal formula is useful for basic interest examples and contracts with no interim principal changes. Some loans called simple interest calculate interest on the outstanding balance, which changes with payments. Use the actual contract and a payment schedule for those loans.',
          '固定本金公式适用于基础利息示例及期间本金不变的合同。一些称作单利的贷款按未偿本金计息，而付款会改变该余额。此类贷款应按实际合同及付款计划计算。',
        ),
      );
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-simple-source]').length)
      scope.append(
        '<p data-cm-simple-source><a href="https://www.consumerfinance.gov/ask-cfpb/whats-the-difference-between-a-simple-interest-rate-and-precomputed-interest-on-an-auto-loan-en-841/" rel="noopener noreferrer">CFPB: simple interest and outstanding loan balances</a></p>',
      );
  }
  if (['bmr-calculator', 'tdee-calculator'].includes(slug)) {
    $('#age').attr('min', '18');
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-ree-source]').length)
      scope.append(
        para(
          'This page is for adult educational estimates. The original Mifflin–St Jeor study used healthy adults aged 19–78; extrapolation and individual medical circumstances require care. This is not a measured metabolic rate or an instruction for calorie intake.',
          '本页用于成人教育性估算。Mifflin–St Jeor 原始研究使用 19–78 岁健康成人样本，外推及个人医疗情况需谨慎。本结果不是实测代谢率，也不是热量摄入指令。',
        ) +
          '<p data-cm-ree-source><a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" rel="noopener noreferrer">Mifflin et al. (1990): resting energy expenditure equation</a></p>',
      );
  }
  if (slug === 'body-fat-calculator') {
    $('#age').attr('min', '18');
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-bodyfat-source]').length)
      scope.append(
        '<p data-cm-bodyfat-source><a href="https://pubmed.ncbi.nlm.nih.gov/2043597/" rel="noopener noreferrer">Deurenberg et al. (1991): adult body-fat prediction equation</a></p>',
      );
  }
  if (slug === 'roi-calculator') {
    $('.wrap>.card p')
      .filter((_, e) => /gain bar longer than/i.test($(e).text()))
      .replaceWith(
        para(
          'Bars compare the initial investment with final value plus cash income. A longer final-value-plus-income bar means positive ROI.',
          '柱形图比较初始投资与期末价值加现金收入，后者更长表示投资回报率为正。',
        ),
      );
  }
  if (slug === 'subscription-waste') {
    $('label[for="uses"]')
      .attr('data-cm-pair', 'Uses per active month|每个使用月的次数')
      .text('Uses per active month');
    $('#idle').attr('max', '12');
    paragraph(
      'Formula',
      'Active months = 12 − idle months. Annual alternative cost = uses per active month × active months × alternative price. Difference = max(annual subscription fee − annual alternative cost, 0). Idle-month fees are part of the annual fee, not an extra penalty.',
      '使用月数 = 12 − 闲置月数。全年替代成本 = 每个使用月的次数 × 使用月数 × 替代单价。差额 = max(全年订阅费 − 全年替代成本, 0)。闲置月费用已计入年费，不再额外叠加。',
    );
    paragraph(
      'Worked example',
      'Monthly fee 68, 2 uses per active month, alternative price 12 per use and 4 idle months: annual fee = 68 × 12 = 816; active months = 12 − 4 = 8; alternative cost = 2 × 8 × 12 = 192; difference = 816 − 192 = 624. Idle fees of 4 × 68 = 272 are already inside the annual fee. These are fictional example prices.',
      '月费 68，每个使用月 2 次，按次替代价格 12，闲置 4 个月：年费 = 68 × 12 = 816；使用月数 = 12 − 4 = 8；替代成本 = 2 × 8 × 12 = 192；差额 = 816 − 192 = 624。闲置费用 4 × 68 = 272 已包含在年费中。这些均为虚构示例价格。',
    );
    paragraph(
      'Scope and limitations',
      'This comparison assumes you pay for all 12 months and use the service at the entered frequency during active months only. Idle months reduce annual uses; their fees are already included and are not added again. Other subscription benefits, cancellation costs and changing prices are not modeled. The difference is a comparison with paying per use, not guaranteed cash recovered by cancelling.',
      '此对比假设全年支付 12 个月费用，仅在使用月按输入频率使用服务。闲置月减少全年使用次数，其费用已包含在年费中，不会重复叠加。其他会员权益、取消费用及价格变化不在模型内。差额是与按次付费方案的比较，并非取消订阅必然收回的现金。',
    );
    const faq = $('.wrap>.card').filter((_, e) => $(e).find('h2').first().text().trim() === 'FAQ');
    faq.html(
      '<h2>FAQ</h2>' +
        [
          [
            'How is this calculated?|如何计算？',
            'Subtract the cost of the same annual usage at your alternative price from the annual subscription fee. The result is floored at zero.|用年费减去相同全年使用量按替代单价计算的费用，结果最低为零。',
          ],
          [
            'What is an active month?|什么是使用月？',
            'A month in which you use the service. Enter the average uses for those months; idle months have zero uses.|指实际使用服务的月份。请输入这些月份的平均次数，闲置月按零次计算。',
          ],
          [
            'Are idle-month fees counted twice?|闲置月费用会重复计算吗？',
            'No. They are shown as an included part of the annual fee. They are not added to the difference.|不会。它们仅作为年费中已包含的部分展示，不会另加到差额上。',
          ],
          [
            'Does cancelling save the whole difference?|取消订阅能省下全部差额吗？',
            'Not necessarily. Compare the benefits you actually need, alternative prices, any cancellation fee and the remaining contract term.|不一定。还需比较实际所需权益、替代价格、取消费用及剩余合同期限。',
          ],
        ]
          .map(
            ([q, a]) =>
              '<h3 data-cm-pair="' +
              esc(q) +
              '">' +
              esc(q.split('|')[0]) +
              '</h3>' +
              para(...a.split('|')),
          )
          .join(''),
    );
    $('.wrap>.card').each((_, e) => {
      const card = $(e),
        heading = card.find('h2').first().text().trim();
      if (heading === 'Value received vs waste')
        card
          .find('p')
          .text(
            'Bars split the annual fee into the part covered by use value and the remaining difference.',
          );
      if (heading === 'Annual waste by uses per month') {
        card
          .find('th')
          .first()
          .attr('data-cm-pair', 'Uses per active month|每个使用月的次数')
          .text('Uses per active month');
        card
          .find('p')
          .replaceWith(
            para(
              'Same monthly fee, alternative price and idle months; only uses per active month vary.',
              '月费、替代单价和闲置月数保持一致，仅改变每个使用月的使用次数。',
            ),
          );
      }
    });
  }
  if (slug === 'pricing-power') {
    $('.hero p')
      .filter((_, e) => $(e).text().includes('See the FAQ for how the source scenario'))
      .replaceWith(
        para(
          'Enter the sales-volume decline you expect after the price change. This tool compares your assumptions; it does not predict demand from an elasticity coefficient.',
          '请输入你预计调价后减少的销量比例。本工具比较你输入的假设，不根据弹性系数预测需求。',
        ),
      );
    $('h3')
      .filter((_, e) => $(e).text().includes('volume decline'))
      .next('p')
      .filter((_, e) => $(e).text().includes('source scenario'))
      .replaceWith(
        para(
          'Enter the percentage of sales volume you expect to lose after the price increase. The formula applies this percentage directly to current sales. It does not estimate demand or multiply a price-elasticity coefficient by the price change.',
          '请输入你预计涨价后减少的销量百分比。公式直接将该比例用于当前销量，不预测需求，也不将价格弹性系数乘以调价幅度。',
        ),
      );
  }
  if (slug === 'net-salary-calculator') {
    $('h3')
      .filter((_, e) => $(e).next('p').text().includes('No country or region rate pre-filled'))
      .next('p')
      .replaceWith(
        para(
          'Use actual tax divided by gross pay from a recent payslip, or an effective rate confirmed by your payroll provider. The default 15% is an editable example, not a statutory rate for any country or region.',
          '可使用近期工资单的实际税额除以税前工资，或使用薪资服务方确认的有效税率。默认 15% 只是可修改的示例，不代表任何国家或地区的法定税率。',
        ),
      );
  }
  if (slug === 'markup-calculator') {
    $('h3')
      .filter((_, e) => $(e).next('p').text().startsWith('Added later, on the selling price.'))
      .next('p')
      .replaceWith(
        para(
          'Use a consistent tax basis for cost and price. This example treats selling price as tax-exclusive; whether purchase tax belongs in your cost depends on its recoverability and local rules. Apply the relevant sales-tax base and rate separately.',
          '成本和售价应采用一致的税务口径。本示例售价不含销售税；采购税是否计入成本取决于能否抵扣及当地规定。适用的销售税税基与税率请另行计算。',
        ),
      );
  }
  if (slug === 'present-value-calculator') {
    const chip = $('#chip5').parent();
    chip
      .contents()
      .filter((_, node) => node.type === 'text')
      .remove();
    chip.children('[data-cm-pv-label]').remove();
    chip.prepend(
      '<span data-cm-pv-label data-cm-pair="Present value if due in 5 years:|若 5 年后到期的现值：">Present value if due in 5 years:</span> ',
    );
    paragraph(
      'Worked example',
      '$10,000 due in 10 years at a 5% annual discount rate has a present value of $6,139.13 and a discount of $3,860.87. If due in 5 years instead, its present value is $7,835.26 and its discount is $2,164.74. Doubling the waiting time does not double the discount: the formula compounds the discount factor.',
      '10 年后收到的 $10,000，按年折现率 5% 计算，现值为 $6,139.13，折现金额为 $3,860.87。若改为 5 年后收到，现值为 $7,835.26，折现金额为 $2,164.74。等待时间翻倍不意味着折现金额翻倍，公式对折现因子进行复合计算。',
    );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'Can present value be negative?')
      .next('p')
      .replaceWith(
        para(
          'This page accepts non-negative amounts and shows their non-negative discounted value. For a future liability, enter its positive amount and interpret the result as the corresponding present cost. Signed cash flows require a different model.',
          '本页接受非负金额，并显示非负折现值。未来负债可输入其正数金额，把结果理解为对应的当前成本；带正负号的现金流需使用其他模型。',
        ),
      );
  }
  if (slug === 'pregnancy-due-date-calculator') {
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-pregnancy-source]').length)
      scope.append(
        '<p data-cm-pregnancy-source><a href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date" rel="noopener noreferrer">ACOG: Methods for Estimating the Due Date</a></p>',
      );
  }
  if (slug === 'discount-calculator') {
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'Does this include tax?')
      .next('p')
      .replaceWith(
        para(
          'No. The taxable amount depends on local rules and the type of discount or coupon. It may differ from the discounted amount paid. Confirm the applicable tax base before using the sales tax calculator.',
          '不包含。应税金额取决于当地规则及折扣、优惠券类型，可能不同于实际折后付款金额。使用销售税计算器前，请先核实适用税基。',
        ),
      );
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-tax-source]').length)
      scope.append(
        '<p data-cm-tax-source><a href="https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/coupons_and_food_stamps.htm" rel="noopener noreferrer">New York State: coupons and taxable receipts</a></p>',
      );
  }
  if (slug === 'inflation-calculator') {
    $('#y1,#y2').attr({ min: '1', max: '9999', step: '1' });
    $('#amt').attr('min', '0');
    paragraph(
      'Scope and limitations',
      'This page applies one constant assumed inflation rate, without fetching CPI data. A compound annual rate can reproduce the change between two index endpoints, but cannot describe the intervening yearly path. Use a consistent published CPI series, country and comparison period for historical work. The result compares general purchasing power, not the price of a particular item.',
      '本工具使用单一假设通胀率，不获取 CPI 数据。复合年均率可复现两个指数端点之间的变化，但不能描述中间各年的走势。历史比较应使用同一官方 CPI 序列、国家及一致的比较时段。结果比较总体购买力，不是某件商品的价格。',
    );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'Is the average rate the same as actual CPI?')
      .next('p')
      .replaceWith(
        para(
          'No data is loaded here. To match two published CPI endpoints over t years, enter 100 × ((ending index ÷ starting index)^(1/t) − 1) as the annual rate. An arithmetic mean of yearly percentage changes generally does not give the same compounded result. Use matching months or consistent annual-average indexes; those comparisons can differ.',
          '这里不载入实际指数。要匹配相隔 t 年的两个官方 CPI 端点，年率应填 100 × ((期末指数 ÷ 期初指数)^(1/t) − 1)。各年百分比变化的算术平均一般不能得到相同复利结果。请使用对应月份或一致的年度平均指数，两种比较的结果可能不同。',
        ),
      );
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-cpi-source]').length)
      scope.append(
        '<p data-cm-cpi-source><a href="https://www.bls.gov/cpi/factsheets/calculating-percent-changes.htm" rel="noopener noreferrer">U.S. Bureau of Labor Statistics: CPI percent changes</a></p>',
      );
  }
  if (slug === 'ideal-weight-calculator') {
    $('#cm').attr({ min: '152.4', step: 'any' });
    $('.wrap>.sub').replaceWith(
      para(
        'Explore the historical Devine reference formula for adults at least 152.4 cm tall. This is an educational comparison, not a weight goal or medication-dose calculator.',
        '查看身高至少 152.4 厘米成人的历史 Devine 参考公式。本工具用于学习比较，不设定体重目标，也不计算用药剂量。',
      ),
    );
    $('.wrap>p[data-cm-pair]').first().addClass('sub');
    paragraph(
      'Formula',
      'For height at least 5 feet (60 inches or 152.4 cm), reference weight in kg = base + 2.3 × (height in inches − 60). The base is 50 kg for men and 45.5 kg for women. Height in inches = height in cm ÷ 2.54. This page does not extrapolate below 152.4 cm.',
      '身高至少 5 英尺（60 英寸或 152.4 厘米）时，参考体重（千克）= 基数 + 2.3 ×（身高英寸数 − 60）。男性基数为 50 千克，女性为 45.5 千克；英寸数 = 厘米数 ÷ 2.54。本页不向低于 152.4 厘米的身高外推。',
    );
    paragraph(
      'Scope and limitations',
      'Devine is a historical height-and-sex reference equation associated with drug-dosing literature. It does not account for body composition, age, pregnancy or individual health. This adult educational tool does not select a clinical dosing weight, calculate a dose or determine a healthy target. Below 152.4 cm it shows no estimate, rather than inventing a constant minimum weight.',
      'Devine 是与药物剂量文献有关的历史身高及性别参考公式，不考虑身体成分、年龄、妊娠或个人健康。本成人学习工具不选择临床给药体重、不计算剂量，也不判断健康目标。低于 152.4 厘米时不显示估值，不编造固定最低体重。',
    );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'What happens below 5 feet?')
      .next('p')
      .replaceWith(
        para(
          'This page does not calculate below 5 feet (152.4 cm). Returning the same base weight for every shorter adult would conceal the formula limitation. Use an individual clinical assessment when a dosing or health decision is needed.',
          '低于 5 英尺（152.4 厘米）时本页不计算。为所有更矮的成人返回相同基数体重会掩盖公式局限。涉及给药或健康决策时，应接受个体化临床评估。',
        ),
      );
    const scope = $('[data-cm-section="scope"]');
    if (!scope.find('[data-cm-devine-source]').length)
      scope.append(
        '<p data-cm-devine-source><a href="https://www.accessdata.fda.gov/cdrh_docs/pdf16/P160013c.pdf" rel="noopener noreferrer">FDA device documentation: Devine formula appendix</a></p>',
      );
  }
  if (slug === 'linear-equation-calculator') {
    $('.wrap>.sub').replaceWith(
      para(
        'Solve ax + b = 0 and inspect a straight line from its slope and y-intercept, including horizontal lines and equations with no unique solution.',
        '求解 ax + b = 0，并根据斜率及 y 轴截距查看直线特征，包括水平直线与没有唯一解的方程。',
      ),
    );
    $('.wrap>p[data-cm-pair]').first().addClass('sub');
  }
  if (['mean-median-mode-calculator', 'standard-deviation-calculator'].includes(slug)) {
    $('.hero p')
      .filter((_, e) => /Non-numeric entries are ignored/.test($(e).text()))
      .replaceWith(
        para(
          'Results update as you type. Every entry must be a finite number; correct invalid entries to resume calculation. All calculations run locally in your browser.',
          '结果随输入更新。每一项都必须是有限数值；请修正无效项后继续计算。所有计算均在浏览器本地运行。',
        ),
      );
    $('h3')
      .filter((_, e) => $(e).text().trim() === 'Are non-numeric entries an error?')
      .next('p')
      .replaceWith(
        para(
          'Yes. Invalid or non-finite entries pause calculation and show an error instead of being silently skipped. Correct the list before reading a result.',
          '是。无效或非有限数值会暂停计算并显示错误，不会被悄悄跳过。读取结果前请先修正数列。',
        ),
      );
    if (slug === 'standard-deviation-calculator')
      paragraph(
        'Scope and limitations',
        'Every list entry must be a finite number. Use population SD when the list is the complete group of interest, and sample SD when observations estimate a larger population. Sample SD is undefined for a single value. Standard deviation is sensitive to outliers and describes spread, not distribution shape. Display is rounded to 4 decimal places.',
        '数列中每项都必须是有限数值。数列是关注的完整群体时用总体标准差，以样本推断更大总体时用样本标准差。单个数值的样本标准差无定义。标准差对离群值敏感，描述离散程度而非分布形状。显示值保留 4 位小数。',
      );
  }
  if (slug === 'future-value-calculator') {
    paragraph(
      'Formula',
      'Growth factor = (1 + annual rate ÷ compounding periods) raised to (compounding periods × years). Future value = present value × growth factor. Interest earned = future value − present value. The growth factor depends on rate, time and frequency; it remains defined even when present value is zero. A zero-year horizon has growth factor 1.',
      '增长倍数 =（1 + 年利率 ÷ 每年复利次数）的（每年复利次数 × 年数）次方。未来值 = 现值 × 增长倍数；利息 = 未来值 − 现值。增长倍数由利率、时间及复利频率决定，现值为零时仍有定义。零年期限的增长倍数为 1。',
    );
    $('#yearRows')
      .closest('section')
      .find('p')
      .filter((_, e) => !$(e).find('table').length)
      .each((_, e) => {
        if (/Year-by-year values assume/.test($(e).text()))
          $(e).replaceWith(
            para(
              'Every row uses the same entered compounding frequency and rate. The final row includes your exact planning horizon.',
              '每行均使用所填复利频率与利率，最后一行包含你填写的确切规划期限。',
            ),
          );
      });
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
    $('#tWd')
      .prev()
      .attr('data-cm-pair', 'Working days before holiday deductions|扣除节假日前的工作日')
      .text('Working days before holiday deductions');
    $('#tWe')
      .prev()
      .attr('data-cm-pair', 'Weekly rest days in selected pattern|所选每周模式中的休息日')
      .text('Weekly rest days in selected pattern');
    $('#tHol')
      .prev()
      .attr('data-cm-pair', 'Entered holiday deduction|所填节假日扣除')
      .text('Entered holiday deduction');
    paragraph(
      'Formula',
      'Count dates from start through end, including both endpoints. Exclude the weekly rest days in your selected pattern, then subtract the holiday deduction you enter. Deduct only holidays that would otherwise be working days.',
      '统计开始日至结束日，包含首尾两天。先排除所选每周模式中的休息日，再减去你填写的节假日扣除；仅扣除原本应工作的节假日。',
    );
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
    $('.hero p')
      .filter((_, e) => /model (?:uses|assumes) 48 working weeks/i.test($(e).text()))
      .each((_, e) =>
        $(e).replaceWith(
          para(
            'Enter your working weeks per year, nonzero weekly hours and a nonzero billable share. All are editable planning assumptions.',
            '填写每年工作周数、非零周工时及非零可计费比例；这些均是可编辑的规划假设。',
          ),
        ),
      );
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
    $('.hero p').each((_, element) => {
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
      code('M = P × r / (1 − (1 + r)^(−n))\nr = 0: M = P/n') +
        para(
          'M is monthly mortgage payment, P is borrowed principal, r is monthly interest rate and n is the loan term in months. Monthly ownership spending adds tax, insurance and maintenance to the mortgage. The renter initially invests the down payment and purchase fees; each month, whichever side spends less invests the difference. Owner ending wealth is sale proceeds after selling fees and remaining debt, plus investments. Compare it with renter investments at the same horizon.',
          'M 为房贷月供，P 为贷款本金，r 为月利率，n 为贷款月数。每月持有支出在月供外加上税费、保险及维护。租房方初始投资首付及买入费用；之后每月支出较少的一方投资差额。买房期末净值为卖房所得扣除卖出费用及剩余贷款，再加投资；与同一期限的租房投资相比。',
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
