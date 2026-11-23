// Car Affordability Calculator
// Rates: Experian State of the Automotive Finance Market, Q2 2026 (VantageScore 4.0), published Nov 13, 2026.
let state = { chart: null };

const APR_NEW = [4.41, 6.15, 9.71, 13.52, 16.11];
const APR_USED = [6.29, 8.81, 13.93, 19.10, 21.62];
const AVG = { new: 6.35, used: 11.19 };
const TIER_NAMES = ['Super prime (781+)', 'Prime (661-780)', 'Near prime (601-660)', 'Subprime (501-600)', 'Deep subprime (300-500)'];

document.addEventListener('DOMContentLoaded', function () {
  onMethod();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function onMethod() {
  const m = $('method').value;
  document.querySelectorAll('.m-pct').forEach(function (e) { e.style.display = m === 'pct' ? '' : 'none'; });
  document.querySelectorAll('.m-fixed').forEach(function (e) { e.style.display = m === 'fixed' ? '' : 'none'; });
  calculate();
}
function aprFor(cond, tier) {
  if (tier === 'avg') return AVG[cond];
  return (cond === 'new' ? APR_NEW : APR_USED)[parseInt(tier, 10)];
}
function onRateInputs() {
  const tier = $('tier').value;
  if (tier !== 'own') $('apr').value = aprFor($('condition').value, tier);
  calculate();
}
function factor(aprPct, n) {
  const r = aprPct / 1200;
  return r > 0 ? (1 - Math.pow(1 + r, -n)) / r : n;
}
// Max price for a given payment
function maxPrice(pay, aprPct, n, o) {
  const L = pay * factor(aprPct, n);
  const taxCredit = o.taxCredit ? o.trade : 0;
  const P = (L + o.t * taxCredit - o.fees + o.down + o.trade - o.owed) / (1 + o.t);
  return { price: Math.max(0, P), loan: L };
}

function calculate() {
  const income = parseFloat($('income').value);
  if (!(income > 0)) { showResults(false); return; }
  const G = income / 12;
  const method = $('method').value;
  const running = parseFloat($('running').value) || 0;
  const housing = parseFloat($('housing').value) || 0;
  const debts = parseFloat($('debts').value) || 0;
  const dti = (parseFloat($('dti').value) || 40) / 100;
  const apr = parseFloat($('apr').value);
  const n = parseInt($('term').value, 10);
  if (!(apr >= 0)) { showResults(false); return; }
  const o = {
    down: parseFloat($('down').value) || 0, trade: parseFloat($('trade').value) || 0, owed: parseFloat($('owed').value) || 0,
    t: (parseFloat($('taxRate').value) || 0) / 100, fees: parseFloat($('fees').value) || 0, taxCredit: $('taxCredit').checked
  };

  let budget, label;
  if (method === 'rule') { budget = 0.10 * G - running; label = '10% of income minus insurance, fuel and upkeep'; }
  else if (method === 'pct') { budget = (parseFloat($('pctVal').value) || 0) / 100 * G; label = $('pctVal').value + '% of gross income'; }
  else { budget = parseFloat($('fixedPay').value) || 0; label = 'Payment you chose'; }
  const dtiCap = dti * G - housing - debts;
  const pay = Math.max(0, Math.min(budget, dtiCap));

  const res = maxPrice(pay, apr, n, o);
  const price = res.price;
  const interest = pay * n - res.loan;
  const downTotal = o.down + o.trade - o.owed;
  const downPct = price > 0 ? downTotal / price * 100 : 0;
  const totalMonthly = pay + running;
  const cond = $('condition').value;

  $('resultLabel').textContent = 'You Can Afford a Vehicle Up To';
  $('resultValueDisplay').textContent = money(price);
  $('resultNote').textContent = money(pay) + ' a month for ' + n + ' months at ' + apr + '% APR (loan of ' + money(res.loan) + ')';

  const msgs = [];
  if (budget <= 0) msgs.push('Your insurance and running costs already use up the 10% budget. Raise the budget percentage or lower those costs.');
  if (dtiCap < budget && pay > 0) msgs.push('Your debt-to-income limit of ' + (dti * 100) + '% (including housing and other debts) caps the payment at ' + money(dtiCap) + '.');
  if (dtiCap <= 0) msgs.push('Your housing and other debts already reach the debt-to-income limit, so no new loan fits.');
  if (o.owed > o.trade) msgs.push('You owe ' + money(o.owed - o.trade) + ' more on your trade-in than it is worth. That negative equity reduces what you can spend.');
  const warn = $('warnBox');
  warn.style.display = msgs.length ? 'block' : 'none';
  warn.textContent = msgs.join(' ');

  const ok = function (b) { return b ? 'Yes' : 'No'; };
  const rows = [
    ['Gross monthly income', money(G)],
    ['Payment budget (' + label + ')', money(Math.max(0, budget))],
    ['Payment cap from debt-to-income limit', money(Math.max(0, dtiCap))],
    ['SUB:Monthly loan payment used', money(pay)],
    ['Loan amount', money(res.loan)],
    ['Down payment + trade-in equity', money(downTotal)],
    ['Sales tax and fees (est.)', money(Math.max(0, (price - (o.taxCredit ? o.trade : 0)) * o.t + o.fees))],
    ['SUB:Maximum vehicle price', money(price)],
    ['Total interest over the loan', money(interest)],
    ['Insurance, fuel and maintenance', money(running)],
    ['Total monthly car cost', money(totalMonthly) + ' (' + (totalMonthly / G * 100).toFixed(1) + '% of gross income)'],
    ['20/4/10 check: down payment at least 20%', ok(downPct >= 20) + ' (' + downPct.toFixed(1) + '%)'],
    ['20/4/10 check: term 48 months or less', ok(n <= 48)],
    ['20/4/10 check: total cost 10% of income or less', ok(totalMonthly <= 0.10 * G + 0.5)]
  ];
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  const tiers = cond === 'new' ? APR_NEW : APR_USED;
  $('tierBody').innerHTML = tiers.map(function (a, i) {
    return '<tr><td>' + TIER_NAMES[i] + '</td><td>' + a.toFixed(2) + '%</td><td>' + money(maxPrice(pay, a, n, o).price) + '</td></tr>';
  }).join('') + '<tr><td colspan="3" class="muted">Same payment, term and down payment, using Experian Q2 2026 averages for ' + (cond === 'new' ? 'new' : 'used') + ' cars.</td></tr>';

  const terms = [36, 48, 60, 72, 84];
  showResults(true);
  drawChart(terms, terms.map(function (m) { return Math.round(maxPrice(pay, apr, m, o).price); }), n);
}

function drawChart(terms, data, cur) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(terms, data, cur); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: terms.map(function (t) { return t + ' mo'; }), datasets: [{ label: 'Max price', data: data,
      backgroundColor: terms.map(function (t) { return t === cur ? 'hsl(180, 100%, 30%)' : 'hsl(215, 70%, 45%)'; }), borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw); } } } },
      scales: { y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } } }
  });
}

function clearForm() {
  ['income', 'down', 'trade', 'owed'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
