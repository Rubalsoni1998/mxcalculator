// Lottery Tax Calculator (US federal tax year 2026 + state tax)
// Federal: 24% withholding on prizes over $5,000; 2026 brackets from IRS Rev. Proc. 2025-32 (same figures as the Tax Bracket Calculator).
// State: Tax Foundation withholding rates (via World Population Review, Nov 2026) and USA Mega; "final" = top state rate where it exceeds withholding.
// Jackpots reported Nov 20, 2026: Mega Millions $629M (cash $258.8M), Powerball $114M (cash $47.7M).
let state = { chart: null };

const WITHHOLD_FED = 0.24;
const WITHHOLD_THRESHOLD = 5000;
const RATES = [10, 12, 22, 24, 32, 35, 37];
const BRACKETS = {
  single: [12400, 50400, 105700, 201775, 256225, 640600],
  mfj:    [24800, 100800, 211400, 403550, 512450, 768700],
  mfs:    [12400, 50400, 105700, 201775, 256225, 384350],
  hoh:    [17700, 67450, 105700, 201750, 256200, 640600]
};
const PRESETS = { mm: [629000000, 258800000], pb: [114000000, 47700000] };

// [state, withholding %, estimated final %, note]
const STATES = [
  ['Alabama', 0, 5, 'No state lottery; prizes from other states are taxed as income'],
  ['Alaska', 0, 0, 'No state lottery and no income tax'],
  ['Arizona', 2.5, 2.5, 'Also taxes non-residents'],
  ['Arkansas', 5.9, 5.9, ''],
  ['California', 0, 0, 'California Lottery prizes are exempt'],
  ['Colorado', 4, 4, ''],
  ['Connecticut', 6.99, 6.99, ''],
  ['Delaware', 0, 6.6, 'No withholding; prizes are taxable income'],
  ['District of Columbia', 8.95, 10.75, ''],
  ['Florida', 0, 0, 'No state income tax'],
  ['Georgia', 5.75, 5.75, ''],
  ['Hawaii', 0, 11, 'No state lottery; prizes from other states are taxed as income'],
  ['Idaho', 6.93, 6.93, ''],
  ['Illinois', 4.95, 4.95, ''],
  ['Indiana', 3.23, 3.23, ''],
  ['Iowa', 5, 5, ''],
  ['Kansas', 5, 5, ''],
  ['Kentucky', 5, 5, ''],
  ['Louisiana', 5, 5, ''],
  ['Maine', 5, 5, ''],
  ['Maryland', 8.95, 8.95, 'Also taxes non-residents; local tax may apply'],
  ['Massachusetts', 5, 9, 'Top rate includes the 4% surtax above $1 million'],
  ['Michigan', 4.25, 4.25, ''],
  ['Minnesota', 7.25, 9.85, ''],
  ['Mississippi', 5, 5, ''],
  ['Missouri', 4, 4, ''],
  ['Montana', 6.9, 6.9, ''],
  ['Nebraska', 5, 5, ''],
  ['Nevada', 0, 0, 'No state lottery and no income tax'],
  ['New Hampshire', 0, 0, 'No state income tax'],
  ['New Jersey', 8, 10.75, ''],
  ['New Mexico', 5.9, 5.9, ''],
  ['New York', 8.82, 10.9, 'New York City residents pay about 3.9% more'],
  ['North Carolina', 5.25, 5.25, ''],
  ['North Dakota', 2.9, 2.9, ''],
  ['Ohio', 4.8, 4.8, 'Some cities add local tax'],
  ['Oklahoma', 5, 5, ''],
  ['Oregon', 8, 9.9, ''],
  ['Pennsylvania', 3.07, 3.07, 'Prizes from the PA Lottery bought in-state are exempt for residents'],
  ['Rhode Island', 5.99, 5.99, ''],
  ['South Carolina', 7, 7, ''],
  ['South Dakota', 0, 0, 'No state income tax'],
  ['Tennessee', 0, 0, 'No state income tax'],
  ['Texas', 0, 0, 'No state income tax'],
  ['Utah', 0, 4.5, 'No state lottery; prizes from other states are taxed as income'],
  ['Vermont', 6, 8.75, ''],
  ['Virginia', 4, 5.75, ''],
  ['Washington', 0, 0, 'No state income tax'],
  ['West Virginia', 6.5, 6.5, ''],
  ['Wisconsin', 7.65, 7.65, ''],
  ['Wyoming', 0, 0, 'No state income tax']
];

document.addEventListener('DOMContentLoaded', function () {
  const sel = $('state');
  sel.innerHTML = STATES.map(function (s, i) {
    return '<option value="' + i + '">' + s[0] + (s[1] || s[2] ? ' (' + fmt(s[1]) + '% withheld / ' + fmt(s[2]) + '% final)' : ' (no tax)') + '</option>';
  }).join('');
  sel.value = String(STATES.findIndex(function (s) { return s[0] === 'Texas'; }));
  onBasis();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function fmt(n) { return String(Math.round(n * 100) / 100); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function compact(v) {
  if (!isFinite(v)) return '–';
  if (Math.abs(v) >= 1e9) return '$' + (v / 1e9).toFixed(2) + ' billion';
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + ' million';
  return money(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function onPreset() {
  const p = PRESETS[$('preset').value];
  if (p) { $('jackpot').value = p[0]; $('cash').value = p[1]; }
  calculate();
}
function onBasis() {
  const c = $('stateBasis').value === 'custom';
  document.querySelectorAll('.custom-rate').forEach(function (e) { e.style.display = c ? '' : 'none'; });
  calculate();
}

// Federal income tax on a taxable income (2026, ordinary rates)
function fedTax(status, income) {
  const lim = BRACKETS[status];
  let tax = 0, prev = 0;
  for (let i = 0; i < RATES.length; i++) {
    const top = i < lim.length ? lim[i] : Infinity;
    if (income > prev) tax += (Math.min(income, top) - prev) * RATES[i] / 100;
    prev = top;
  }
  return Math.max(0, tax);
}
function withheld(gross) { return gross > WITHHOLD_THRESHOLD ? gross * WITHHOLD_FED : 0; }

// Core calculation for one winner. Returns totals for the lump sum or the 30-year annuity.
function runOption(option, jackpot, cash, winners, status, other, stateRate) {
  if (option === 'lump') {
    const gross = cash / winners;
    const fed = fedTax(status, other + gross) - fedTax(status, other);
    const st = gross * stateRate;
    return { gross: gross, fed: fed, state: st, net: gross - fed - st, withheld: withheld(gross), rows: [] };
  }
  const total = jackpot / winners;
  const first = total * 0.05 / (Math.pow(1.05, 30) - 1);
  let gross = 0, fed = 0, st = 0, wh = 0;
  const rows = [];
  for (let y = 0; y < 30; y++) {
    const pay = first * Math.pow(1.05, y);
    const f = fedTax(status, other + pay) - fedTax(status, other);
    const s = pay * stateRate;
    gross += pay; fed += f; st += s; wh += withheld(pay);
    if (y < 5) rows.push([y + 1, pay, f + s, pay - f - s]);
  }
  return { gross: gross, fed: fed, state: st, net: gross - fed - st, withheld: wh, rows: rows };
}

function stateRateUsed() {
  const basis = $('stateBasis').value;
  if (basis === 'custom') return (parseFloat($('customRate').value) || 0) / 100;
  const s = STATES[parseInt($('state').value, 10)];
  return (basis === 'withhold' ? s[1] : s[2]) / 100;
}

function calculate() {
  const jackpot = parseFloat($('jackpot').value);
  const cash = parseFloat($('cash').value);
  const winners = Math.max(1, parseInt($('winners').value, 10) || 1);
  const other = parseFloat($('otherIncome').value) || 0;
  const status = $('status').value;
  const payout = $('payout').value;
  if (!(jackpot > 0) || !(cash > 0)) { showResults(false); return; }

  const rate = stateRateUsed();
  const s = STATES[parseInt($('state').value, 10)];
  const lump = runOption('lump', jackpot, cash, winners, status, other, rate);
  const ann = runOption('annuity', jackpot, cash, winners, status, other, rate);
  const cur = payout === 'lump' ? lump : ann;

  $('resultLabel').textContent = 'Estimated Take-Home (' + (payout === 'lump' ? 'lump sum' : '30-year annuity') + (winners > 1 ? ', your share of ' + winners : '') + ')';
  $('resultValueDisplay').textContent = compact(cur.net);
  $('resultNote').textContent = 'You keep ' + (cur.net / cur.gross * 100).toFixed(1) + '% of the ' + compact(cur.gross) + ' before tax';

  const warn = $('warnBox');
  const gapFed = Math.max(0, cur.fed - cur.withheld);
  if (cur.fed > cur.withheld * 1.02 && cur.gross > WITHHOLD_THRESHOLD) {
    warn.style.display = 'block';
    warn.textContent = 'The lottery withholds only ' + compact(cur.withheld) + ' of federal tax. You will owe about ' + compact(gapFed) + ' more when you file, so set that money aside.';
  } else if (cur.fed < cur.withheld * 0.98) {
    warn.style.display = 'block';
    warn.textContent = 'The 24% withholding is more than your estimated federal tax, so you would get about ' + compact(cur.withheld - cur.fed) + ' back at filing.';
  } else warn.style.display = 'none';

  const rows = [
    ['Prize before tax' + (payout === 'annuity' ? ' (30 payments)' : ''), compact(cur.gross)],
    ['Federal tax withheld by the lottery (24%)', '− ' + compact(cur.withheld)],
    ['Extra federal tax due at filing', '− ' + compact(Math.max(0, cur.fed - cur.withheld))],
    ['SUB:Total federal tax', '− ' + compact(cur.fed)],
    ['State tax (' + fmt(rate * 100) + '%' + (s[3] && $('stateBasis').value !== 'custom' ? ', ' + s[0] : '') + ')', '− ' + compact(cur.state)],
    ['SUB:You keep', compact(cur.net)],
    ['Average tax rate', ((cur.fed + cur.state) / cur.gross * 100).toFixed(1) + '%']
  ];
  if (s[3] && $('stateBasis').value !== 'custom') rows.push(['State note', s[3]]);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('compareBody').innerHTML = [['Lump sum', lump], ['30-year annuity', ann]].map(function (r) {
    return '<tr><td>' + r[0] + '</td><td>' + compact(r[1].gross) + '</td><td>' + compact(r[1].fed + r[1].state) + '</td><td>' + compact(r[1].net) + '</td></tr>';
  }).join('');
  $('annuityBody').innerHTML = ann.rows.map(function (r) {
    return '<tr><td>Year ' + r[0] + '</td><td>' + compact(r[1]) + '</td><td>' + compact(r[2]) + '</td><td>' + compact(r[3]) + '</td></tr>';
  }).join('') + '<tr><td colspan="4" class="muted">The first year is the smallest payment; each later payment is 5% larger.</td></tr>';

  showResults(true);
  drawChart(cur.net, cur.fed, cur.state);
}

function drawChart(net, fed, st) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(net, fed, st); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['You keep', 'Federal tax', 'State tax'],
      datasets: [{ data: [net, fed, st], backgroundColor: ['hsl(150, 55%, 42%)', 'hsl(215, 70%, 40%)', 'hsl(35, 90%, 55%)'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: function (c) { return c.label + ': ' + compact(c.raw); } } } } }
  });
}

function clearForm() {
  ['jackpot', 'cash'].forEach(function (id) { $(id).value = ''; });
  $('preset').value = 'custom';
  showResults(false);
}
