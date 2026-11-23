// Dividend Calculator
let state = { chart: null };

document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  const dec = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function calculate() {
  const initial = parseFloat($('initial').value);
  const monthly = parseFloat($('monthly').value) || 0;
  const yld = parseFloat($('yield').value);
  const dg = (parseFloat($('divGrowth').value) || 0) / 100;
  const pg = (parseFloat($('priceGrowth').value) || 0) / 100;
  const years = Math.round(parseFloat($('years').value));
  const freq = parseInt($('frequency').value, 10);
  const drip = $('drip').value === '1';
  const tax = (parseFloat($('taxRate').value) || 0) / 100;

  if (!(initial >= 0) || !(yld >= 0) || !(years >= 1) || monthly < 0 || (initial === 0 && monthly === 0)) { showResults(false); return; }

  let price = 100;
  let shares = initial / price;
  let cash = 0, contributed = initial, totalNet = 0, totalGross = 0;
  let yearNet = 0, yearGross = 0;
  const D0 = price * yld / 100;                 // starting annual dividend per share
  const step = 12 / freq;
  const monthlyGrowth = Math.pow(1 + pg, 1 / 12);
  const rows = [], labels = [], valueSeries = [], investedSeries = [];
  let lastYearNet = 0, lastYearGross = 0;

  for (let m = 1; m <= years * 12; m++) {
    price *= monthlyGrowth;
    if (monthly > 0) { shares += monthly / price; contributed += monthly; }
    const yIdx = Math.floor((m - 1) / 12);
    if (m % step === 0) {
      const dps = D0 * Math.pow(1 + dg, yIdx) / freq;
      const gross = shares * dps;
      const net = gross * (1 - tax);
      yearGross += gross; yearNet += net; totalGross += gross; totalNet += net;
      if (drip) shares += net / price; else cash += net;
    }
    if (m % 12 === 0) {
      const value = shares * price + cash;
      rows.push({ year: m / 12, invested: contributed, income: yearNet, value: value });
      labels.push('Year ' + (m / 12)); valueSeries.push(Math.round(value)); investedSeries.push(Math.round(contributed));
      lastYearNet = yearNet; lastYearGross = yearGross;
      yearNet = 0; yearGross = 0;
    }
  }
  const finalValue = shares * price + cash;
  const yoc = contributed > 0 ? lastYearGross / contributed * 100 : 0;
  const growth = finalValue - contributed;

  $('resultLabel').textContent = 'Portfolio Value After ' + years + (years === 1 ? ' Year' : ' Years');
  $('resultValueDisplay').textContent = money(finalValue, 0);
  $('resultNote').textContent = 'Final-year dividend income: ' + money(lastYearNet, 0) + ' (' + money(lastYearNet / 12, 0) + ' per month, after tax)';
  $('warnBox').style.display = 'none';

  const body = [
    ['Total invested', money(contributed, 0)],
    ['Total dividends received (after tax)', money(totalNet, 0)],
    ['Total dividends before tax', money(totalGross, 0)],
    ['Dividends reinvested?', drip ? 'Yes' : 'No (collected as cash: ' + money(cash, 0) + ')'],
    ['Shares owned at the end (per $100 start price)', shares.toFixed(2)],
    ['Final-year dividend income (after tax)', money(lastYearNet, 0)],
    ['Yield on cost (final year, before tax)', yoc.toFixed(2) + '%'],
    ['Total gain over contributions', money(growth, 0)],
    ['SUB:Final portfolio value', money(finalValue, 0)]
  ];
  $('breakdownTableBody').innerHTML = body.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('yearTable').innerHTML = rows.map(function (r) {
    return '<tr><td>' + r.year + '</td><td>' + money(r.invested, 0) + '</td><td>' + money(r.income, 0) + '</td><td>' + money(r.value, 0) + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(labels, valueSeries, investedSeries);
}

function drawChart(labels, value, invested) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(labels, value, invested); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: [
      { label: 'Portfolio value', data: value, borderColor: 'hsl(145, 70%, 38%)', backgroundColor: 'hsla(145, 70%, 38%, 0.12)', fill: true, tension: 0.25, pointRadius: 0 },
      { label: 'Total invested', data: invested, borderColor: 'hsl(210, 15%, 55%)', borderDash: [6, 4], fill: false, tension: 0, pointRadius: 0 }
    ] },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + money(c.raw, 0); } } } },
      scales: { y: { ticks: { callback: function (v) { return v >= 1000 ? '$' + (v / 1000) + 'k' : '$' + v; } } }, x: { ticks: { maxTicksLimit: 8 } } }
    }
  });
}

function clearForm() {
  ['initial', 'monthly', 'yield', 'divGrowth', 'priceGrowth', 'years', 'taxRate'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
