// Net Worth Calculator
// Benchmarks: Federal Reserve Survey of Consumer Finances, 2025 results (published October 2026), household net worth by age of reference person.
let state = { chart: null };

const ASSETS = [
  ['cash', 'Cash & checking'], ['savings', 'Savings, CDs & money market'], ['brokerage', 'Brokerage & investments'],
  ['retirement', 'Retirement accounts'], ['home', 'Home'], ['otherre', 'Other real estate'],
  ['vehicles', 'Vehicles'], ['business', 'Business'], ['otherassets', 'Other assets']
];
const DEBTS = ['mortgage', 'heloc', 'auto', 'student', 'cards', 'otherdebt'];
const COLORS = ['hsl(262,60%,52%)', 'hsl(215,70%,50%)', 'hsl(190,65%,42%)', 'hsl(150,55%,42%)', 'hsl(38,90%,55%)', 'hsl(20,80%,55%)', 'hsl(330,60%,55%)', 'hsl(210,15%,55%)', 'hsl(280,35%,65%)'];
const BENCH = [
  { label: 'Under 35', median: 33000, mean: 135400 },
  { label: '35 to 44', median: 155600, mean: 681900 },
  { label: '45 to 54', median: 253700, mean: 1244500 },
  { label: '55 to 64', median: 411900, mean: 1878000 },
  { label: '65 to 74', median: 431300, mean: 1897600 },
  { label: '75 or older', median: 504900, mean: 1962200 },
  { label: 'All households', median: 215900, mean: 1241500 }
];

document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function val(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 0 : d;
  const s = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(Math.abs(v));
  return v < 0 ? '−' + s : s;
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function calculate() {
  const a = {}; ASSETS.forEach(function (x) { a[x[0]] = val(x[0]); });
  const d = {}; DEBTS.forEach(function (k) { d[k] = val(k); });
  const totalA = ASSETS.reduce(function (s, x) { return s + a[x[0]]; }, 0);
  const totalL = DEBTS.reduce(function (s, k) { return s + d[k]; }, 0);
  const anyNeg = ASSETS.some(function (x) { return a[x[0]] < 0; }) || DEBTS.some(function (k) { return d[k] < 0; });
  if (anyNeg || (totalA === 0 && totalL === 0)) { showResults(false); return; }

  const nw = totalA - totalL;
  const liquid = a.cash + a.savings + a.brokerage - d.cards;
  const homeEquity = a.home - d.mortgage - d.heloc;
  const ratio = totalA > 0 ? totalL / totalA * 100 : NaN;
  const group = parseInt($('ageGroup').value, 10);   // 0 = skip, 1..6
  const b = group > 0 ? BENCH[group - 1] : null;

  $('resultLabel').textContent = 'Your Net Worth';
  $('resultValueDisplay').textContent = money(nw);
  $('resultNote').textContent = 'Assets ' + money(totalA) + ' − liabilities ' + money(totalL);

  const warn = $('warnBox');
  if (nw < 0) {
    warn.style.display = 'block';
    warn.textContent = 'Your debts are larger than your assets. That is common early in life with student loans or a new mortgage. Paying down high-interest debt first raises net worth fastest.';
  } else warn.style.display = 'none';

  const rows = [
    ['Total assets', money(totalA)],
    ['Total liabilities', money(totalL)],
    ['SUB:Net worth', money(nw)],
    ['Liquid net worth (cash, savings, brokerage, minus card debt)', money(liquid)],
    ['Home equity (home value − mortgage − HELOC)', money(homeEquity)],
    ['Net worth without home equity', money(nw - homeEquity)],
    ['Retirement accounts as share of assets', totalA > 0 ? (a.retirement / totalA * 100).toFixed(1) + '%' : '–'],
    ['Debt-to-asset ratio', isFinite(ratio) ? ratio.toFixed(1) + '%' : '–']
  ];
  if (b) {
    rows.push(['Median net worth, age ' + b.label.toLowerCase() + ' (Fed 2025)', money(b.median)]);
    rows.push(['Average net worth, age ' + b.label.toLowerCase() + ' (Fed 2025)', money(b.mean)]);
    rows.push(['SUB:You vs. the median', b.median > 0 ? (nw >= b.median ? (nw / b.median).toFixed(2) + '× the median (' + money(nw - b.median) + ' above)' : (Math.max(nw, 0) / b.median * 100).toFixed(0) + '% of the median (' + money(b.median - nw) + ' below)') : '–']);
  }
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('benchTable').innerHTML = BENCH.map(function (r, i) {
    const hit = group > 0 && i === group - 1;
    return '<tr' + (hit ? ' class="sub-row"' : '') + '><td>' + r.label + (hit ? ' (your group)' : '') + '</td><td>' + money(r.median) + '</td><td>' + money(r.mean) + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(a);
}

function drawChart(a) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(a); }, 200); return; }
  const labels = [], data = [], colors = [];
  ASSETS.forEach(function (x, i) { if (a[x[0]] > 0) { labels.push(x[1]); data.push(a[x[0]]); colors.push(COLORS[i]); } });
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  if (!data.length) return;
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function (c) {
        const tot = c.dataset.data.reduce(function (s, v) { return s + v; }, 0);
        return c.label + ': ' + money(c.raw) + ' (' + (c.raw / tot * 100).toFixed(1) + '%)';
      } } } }
    }
  });
}

function clearForm() {
  ASSETS.map(function (x) { return x[0]; }).concat(DEBTS).forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
