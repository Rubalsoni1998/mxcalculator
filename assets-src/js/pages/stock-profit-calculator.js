// Stock Profit Calculator (US federal tax, tax year 2026)
// Sources: IRS Topic 409, IRS Topic 559 (NIIT), IRS Rev. Proc. 2025-32 (2026 rates and thresholds). Same tables as the Capital Gains Tax Calculator.
let state = { chart: null };

const ORD_LIMITS = {
  single: [12400, 50400, 105700, 201775, 256225, 640600],
  mfj:    [24800, 100800, 211400, 403550, 512450, 768700],
  mfs:    [12400, 50400, 105700, 201775, 256225, 384350],
  hoh:    [17700, 67450, 105700, 201750, 256200, 640600]
};
const ORD_RATES = [10, 12, 22, 24, 32, 35, 37];
const LTCG = { single: [49450, 545500], mfj: [98900, 613700], mfs: [49450, 306850], hoh: [66200, 579600] };
const NIIT_THRESHOLD = { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 };

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
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function pct(v, d) { return isFinite(v) ? v.toFixed(d === undefined ? 2 : d) + '%' : '–'; }
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function ordinaryTax(taxable, status) {
  const limits = ORD_LIMITS[status];
  let tax = 0, lower = 0;
  for (let i = 0; i < ORD_RATES.length; i++) {
    const upper = i < limits.length ? limits[i] : Infinity;
    tax += Math.max(0, Math.min(taxable, upper) - lower) * ORD_RATES[i] / 100;
    lower = upper;
  }
  return tax;
}

function calculate() {
  const shares = parseFloat($('shares').value);
  const buy = parseFloat($('buyPrice').value);
  const sell = parseFloat($('sellPrice').value);
  const buyFee = parseFloat($('buyFee').value) || 0;
  const sellFee = parseFloat($('sellFee').value) || 0;
  const divs = parseFloat($('dividends').value) || 0;
  const days = parseFloat($('days').value);
  const doTax = $('estimateTax').value === '1';
  $('taxFields').style.display = doTax ? 'block' : 'none';
  const status = $('filingStatus').value;
  const other = parseFloat($('otherIncome').value) || 0;
  const stateRate = parseFloat($('stateRate').value) || 0;

  if (!(shares > 0) || !(buy >= 0) || !(sell >= 0) || buyFee < 0 || sellFee < 0 || divs < 0) { showResults(false); return; }

  const cost = shares * buy + buyFee;
  const proceeds = shares * sell - sellFee;
  const gain = proceeds - cost;
  const profit = gain + divs;
  const roi = cost > 0 ? profit / cost * 100 : NaN;
  const daysOk = days >= 1;
  let annual = NaN;
  if (cost > 0 && daysOk && days >= 30 && 1 + profit / cost > 0) annual = (Math.pow(1 + profit / cost, 365 / days) - 1) * 100;
  const breakEven = (cost + sellFee) / shares;
  const term = daysOk && days > 365 ? 'long' : 'short';

  let fedTax = 0, niit = 0, stTax = 0, z0 = 0, z15 = 0, z20 = 0, rateLabel = '';
  const warn = $('warnBox'); warn.style.display = 'none';
  if (doTax && gain > 0) {
    if (term === 'short') {
      fedTax = ordinaryTax(other + gain, status) - ordinaryTax(other, status);
      rateLabel = 'short-term, taxed as ordinary income';
    } else {
      const t0 = LTCG[status][0], t15 = LTCG[status][1];
      const start = other, end = other + gain;
      z0 = Math.max(0, Math.min(end, t0) - Math.min(start, t0));
      z15 = Math.max(0, Math.min(end, t15) - Math.max(start, t0));
      z20 = Math.max(0, end - Math.max(start, t15));
      fedTax = z15 * 0.15 + z20 * 0.20;
      rateLabel = 'long-term rates';
    }
    const excess = Math.max(0, other + gain - NIIT_THRESHOLD[status]);
    niit = Math.min(gain, excess) * 0.038;
    stTax = gain * stateRate / 100;
  }
  if (gain < 0) {
    warn.style.display = 'block';
    warn.textContent = 'This trade is a capital loss of ' + money(-gain) + '. It first offsets other capital gains. Any excess can reduce ordinary income by up to $3,000 a year ($1,500 if married filing separately), and the rest carries forward. A wash sale (rebuying within 30 days) can delay the loss.';
  } else if (!daysOk && doTax) {
    warn.style.display = 'block';
    warn.textContent = 'Enter the number of days you held the stock so the tax estimate can tell short-term from long-term. It is treated as short-term until you do.';
  }
  const totalTax = fedTax + niit + stTax;
  const afterTax = profit - totalTax;

  $('resultLabel').textContent = profit >= 0 ? 'Total Profit' : 'Total Loss';
  $('resultValueDisplay').textContent = money(profit);
  let note = 'Return: ' + pct(roi);
  if (isFinite(annual)) note += ' (' + pct(annual, 1) + ' annualized)';
  if (doTax) note += ' · After tax: ' + money(afterTax);
  $('resultNote').textContent = note;

  const rows = [
    ['Shares', shares.toLocaleString('en-US', { maximumFractionDigits: 4 })],
    ['Total cost (shares × buy price + buy fees)', money(cost)],
    ['Net proceeds (shares × sell price − sell fees)', money(proceeds)],
    ['SUB:' + (gain >= 0 ? 'Capital gain' : 'Capital loss'), money(gain)],
    ['Dividends received', money(divs)],
    ['SUB:Total profit / loss', money(profit)],
    ['Return on investment', pct(roi)],
    ['Annualized return', isFinite(annual) ? pct(annual, 2) : (daysOk ? 'n/a (holds under 30 days)' : 'enter days held')],
    ['Break-even sell price', money(breakEven)],
    ['Holding period', daysOk ? days + ' days · ' + (term === 'long' ? 'long-term' : 'short-term') : '–']
  ];
  if (doTax) {
    if (gain > 0 && term === 'long') {
      rows.push(['Gain taxed at 0%', money(z0, 0)]);
      rows.push(['Gain taxed at 15%', money(z15, 0)]);
      rows.push(['Gain taxed at 20%', money(z20, 0)]);
    }
    rows.push(['Federal tax on gain' + (rateLabel ? ' (' + rateLabel + ')' : ''), money(fedTax)]);
    rows.push(['Net Investment Income Tax (3.8%)', money(niit)]);
    if (stateRate > 0) rows.push(['State tax (' + stateRate + '%)', money(stTax)]);
    rows.push(['SUB:Estimated tax', money(totalTax)]);
    rows.push(['SUB:Profit after tax', money(afterTax)]);
  }
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  // what-if table: other sell prices relative to the buy price
  const steps = [-30, -20, -10, 0, 10, 20, 30, 50, 100];
  let sc = '<tr class="sub-row"><td>' + money(sell) + ' (yours)</td><td>' + (buy > 0 ? ((sell / buy - 1) * 100).toFixed(1) + '%' : '–') + '</td><td>' + money(profit) + '</td><td>' + pct(roi) + '</td></tr>';
  if (buy > 0) {
    steps.forEach(function (s) {
      const p = buy * (1 + s / 100);
      const pr = shares * p - sellFee - cost + divs;
      sc += '<tr><td>' + money(p) + '</td><td>' + (s > 0 ? '+' : '') + s + '%</td><td class="' + (pr >= 0 ? 'good' : 'bad') + '">' + money(pr) + '</td><td>' + pct(cost > 0 ? pr / cost * 100 : NaN) + '</td></tr>';
    });
  }
  $('scenarioTable').innerHTML = sc;

  showResults(true);
  drawChart(cost, proceeds, divs, profit);
}

function drawChart(cost, proceeds, divs, profit) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(cost, proceeds, divs, profit); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total cost', 'Net proceeds', 'Dividends', 'Total profit'],
      datasets: [{ data: [cost, proceeds, divs, profit], borderWidth: 0, borderRadius: 6,
        backgroundColor: ['hsl(210, 15%, 55%)', 'hsl(215, 70%, 45%)', 'hsl(38, 90%, 55%)', profit >= 0 ? 'hsl(145, 70%, 38%)' : 'hsl(0, 70%, 48%)'] }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw); } } } },
      scales: { y: { ticks: { callback: function (v) { return Math.abs(v) >= 1000 ? '$' + (v / 1000) + 'k' : '$' + v; } } } }
    }
  });
}

function clearForm() {
  ['shares', 'days', 'buyPrice', 'sellPrice', 'buyFee', 'sellFee', 'dividends', 'otherIncome', 'stateRate'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
