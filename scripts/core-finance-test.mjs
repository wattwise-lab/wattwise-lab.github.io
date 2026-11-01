import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c = vm.createContext({});
vm.runInContext(
  await fs.readFile(new URL('../assets/cm-finance-core.js', import.meta.url), 'utf8'),
  c,
);
const F = c.CMCoreFinance;
let count = 0;
const near = (a, b, eps = 1e-8) =>
  assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), a + ' ≠ ' + b);
function test(name, fn) {
  try {
    fn();
    count++;
  } catch (e) {
    throw Error(name + ': ' + e.message, { cause: e });
  }
}
test('zero-interest payment', () => near(F.payment(12000, 0, 12), 1000));
test('reference fixed mortgage payment', () =>
  near(F.payment(100000, 0.05 / 12, 360), 536.8216230121398));
test('tiny rate does not cancel to zero', () => near(F.payment(12000, 1e-14, 12), 1000, 1e-10));
test('large rate stays finite', () => assert.ok(Number.isFinite(F.payment(100000, 1, 1200))));
test('payment exactly at interest cannot amortize', () =>
  assert.equal(F.schedule(1000, 12, 10).reason, 'interest'));
test('payment above interest can exceed supported horizon', () =>
  assert.equal(F.schedule(1000, 12, 10.000001).reason, 'horizon'));
test('fractional final payment is included', () => {
  const s = F.schedule(1000, 0, 300);
  assert.equal(s.months, 4);
  near(s.finalPayment, 100);
  near(s.total, 1000);
});
test('loan cash conservation', () => {
  const s = F.schedule(10000, 6, 300);
  near(s.total, 10000 + s.interest);
});
test('zero-interest extra payment shortens exact time', () => {
  const s = F.loan({ prin: 12000, rate: 0, term: 1, extra: 1000 });
  assert.equal(s.base.months, 12);
  assert.equal(s.extra.months, 6);
  near(s.interest, 0);
});
test('invalid zero loan term rejected', () =>
  assert.throws(() => F.loan({ prin: 12000, rate: 0, term: 0, extra: 0 })));
const mortgage = {
  price: 100000,
  down: 20000,
  rate: 0,
  term: 10,
  tax: 1200,
  ins: 600,
  pmirate: 10,
  hoa: 50,
  extra: 0,
};
test('mortgage monthly costs include all entered recurring costs', () =>
  near(F.mortgage(mortgage).total, 2600 / 3));
test('PMI omitted at exactly 80 percent LTV', () => near(F.mortgage(mortgage).pmi, 0));
test('PMI appears above 80 percent LTV', () =>
  near(F.mortgage({ ...mortgage, down: 19999 }).pmi, 80001 / 120));
test('down payment equal to price rejected in mortgage tool', () =>
  assert.throws(() => F.mortgage({ ...mortgage, down: 100000 })));
test('nonfinite financial input rejected', () =>
  assert.throws(() => F.mortgage({ ...mortgage, price: Infinity })));
const free = { income: 80000, tax: 20, exp: 20000, hours: 40, bill: 50, weeks: 50 };
test('gross-revenue tax basis', () => near(F.freelance({ ...free, taxbase: 'gross' }).rate, 125));
test('profit tax basis', () => near(F.freelance({ ...free, taxbase: 'profit' }).rate, 120));
test('no arbitrary five percent retained floor', () =>
  near(F.freelance({ ...free, tax: 99 }).rate, 10000));
test('100 percent tax cannot fund positive target', () =>
  assert.throws(() => F.freelance({ ...free, tax: 100 })));
test('billable share over 100 rejected', () =>
  assert.throws(() => F.freelance({ ...free, bill: 101 })));
test('zero working hours rejected', () => assert.throws(() => F.freelance({ ...free, hours: 0 })));
const ai = { itok: 500, otok: 250, calls2: 1000, iprice: 2, oprice: 4 };
test('AI unit and total cost', () => {
  const a = F.ai(ai);
  near(a.total, 2);
  near(a.perCall, 0.002);
});
test('zero calls retain hypothetical unit cost', () => {
  const a = F.ai({ ...ai, calls2: 0 });
  near(a.total, 0);
  near(a.perCall, 0.002);
});
test('negative token count rejected', () => assert.throws(() => F.ai({ ...ai, itok: -1 })));
test('fractional calls rejected', () => assert.throws(() => F.ai({ ...ai, calls2: 1.5 })));
const rent = { price: 1200, downp: 0, mrate: 0, rent: 100, years: 1, appr: 0, loanYears: 1 };
test('zero-interest rent-buy comparison stays finite', () => {
  const a = F.rent(rent);
  near(a.ending.advantage, 1200);
  near(a.balance, 0);
});
test('mortgage stops after its term', () => {
  const a = F.rent({ ...rent, years: 2 });
  near(a.totalMortgage, 1200);
  near(a.balance, 0);
  near(a.ownerPortfolio, 1200);
});
test('negative appreciation remains supported', () =>
  near(F.rent({ ...rent, downp: 100, rent: 0, appr: -10, years: 2 }).ending.advantage, -228));
test('opportunity cost of down payment', () =>
  near(F.rent({ ...rent, downp: 100, rent: 0, invest: 10, years: 2 }).ending.advantage, -252));
test('purchase and sale fees both counted', () =>
  near(F.rent({ ...rent, downp: 100, rent: 0, buyfee: 10, sellfee: 10 }).ending.advantage, -240));
test('ongoing ownership costs counted', () =>
  near(F.rent({ ...rent, downp: 100, rent: 0, ownrate: 12 }).ending.advantage, -144));
test('negative rent invalid', () => assert.throws(() => F.rent({ ...rent, rent: -1 })));
test('submonth holding horizon invalid', () =>
  assert.throws(() => F.rent({ ...rent, years: 0.001 })));
test('full down payment works without a mortgage', () =>
  near(F.rent({ ...rent, downp: 100 }).pay, 0));
test('growth below total loss rejected', () =>
  assert.throws(() => F.rent({ ...rent, appr: -100 })));
test('root solver returns payment principal', () =>
  near(
    F.solve((p) => F.payment(p, 0.05 / 12, 360), 536.8216230121398, 0, 200000),
    100000,
  ));
test('unbracketed reversal condition has no answer', () =>
  assert.equal(
    F.solve((x) => x * x, 10, 0, 1),
    null,
  ));
test('new rent-buy default agrees with independent 45-digit Decimal reference', () => {
  const a = F.rent({
    price: 400000,
    downp: 30,
    mrate: 6.5,
    rent: 2000,
    years: 10,
    appr: 2,
    loanYears: 30,
    buyfee: 3,
    sellfee: 5,
    ownrate: 1.5,
    rentgrowth: 2,
    invest: 5,
  });
  near(a.ending.ownerWealth, 226406.27374355268, 1e-10);
  near(a.ending.renterWealth, 234962.36304385855, 1e-10);
  near(a.ending.advantage, -8556.089300305888, 1e-10);
});
test('inverse zero-rate loan principal', () =>
  near(F.goalValue('loan-calculator', { prin: 1000, rate: 0, term: 10, extra: 0 }, 100), 12000));
test('inverse loan round trip', () => {
  const v = { prin: 300000, rate: 6.5, term: 30, extra: 0 },
    principal = F.goalValue('loan-calculator', v, 2000);
  near(F.loan({ ...v, prin: principal }).pay, 2000);
});
test('inverse mortgage at zero rate', () =>
  near(F.goalValue('mortgage-calculator', { ...mortgage, pmirate: 0 }, 1000), 116000));
test('mortgage budget below fixed expenses is unavailable', () =>
  assert.equal(F.goalValue('mortgage-calculator', mortgage, 100), null));
test('mortgage inverse handles the PMI price discontinuity', () => {
  const price = F.goalValue('mortgage-calculator', mortgage, 900);
  near(price, 100000);
  assert.ok(F.mortgage({ ...mortgage, price }).total <= 900);
  assert.ok(F.mortgage({ ...mortgage, price: price + 0.01 }).total > 900);
});
test('inverse early payoff reaches target months', () => {
  const v = { bal: 20000, rate: 8, pay: 500, extra: 0 },
    extra = F.goalValue('early-loan-payoff-calculator', v, 24);
  assert.equal(F.early({ ...v, extra }).extra.months, 24);
});
test('inverse early payoff rejects fractional target months', () =>
  assert.throws(() =>
    F.goalValue('early-loan-payoff-calculator', { bal: 1000, rate: 0, pay: 100, extra: 0 }, 1.2),
  ));
test('inverse freelance price round trip', () => {
  const bill = F.goalValue('freelance-real-rate', free, 250);
  near(F.freelance({ ...free, bill }).rate, 250);
});
test('AI budget floors whole calls and respects ceiling', () => {
  const v = { itok: 2000, otok: 500, calls2: 10000, iprice: 3, oprice: 15 },
    n = F.goalValue('ai-inference-cost', v, 100);
  assert.ok(F.ai({ ...v, calls2: n }).total <= 100);
  assert.ok(F.ai({ ...v, calls2: n + 1 }).total > 100);
});
test('zero-cost AI capacity has no finite ceiling', () =>
  assert.equal(
    F.goalValue('ai-inference-cost', { itok: 0, otok: 0, calls2: 0, iprice: 0, oprice: 0 }, 100),
    null,
  ));
test('rent break-even rent balances ending wealth', () => {
  const v = {
      price: 400000,
      downp: 30,
      mrate: 6.5,
      rent: 2000,
      years: 10,
      appr: 2,
      loanYears: 30,
      buyfee: 3,
      sellfee: 5,
      ownrate: 1.5,
      rentgrowth: 2,
      invest: 5,
    },
    rent = F.goalValue('rent-vs-buy-calculator', v, 0);
  near(F.rent({ ...v, rent }).ending.advantage, 0, 1e-7);
});
console.log('Core finance:', count, 'independent reference and boundary cases PASS');
