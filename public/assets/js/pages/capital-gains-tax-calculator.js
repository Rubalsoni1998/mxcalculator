// Capital Gains Tax Calculator (US federal, tax year 2026)
// Sources: IRS Rev. Proc. 2025-32 (rates and thresholds), IRC section 1411 (3.8% NIIT, thresholds not indexed).
let state = { chart: null };

const ORD_LIMITS = {
  single: [12400, 50400, 105700, 201775, 256225, 640600],
  mfj:    [24800, 100800, 211400, 403550, 512450, 768700],
  mfs:    [12400, 50400, 105700, 201775, 256225, 384350],
  hoh:    [17700, 67450, 105700, 201750, 256200, 640600]
};
const ORD_RATES = [10, 12, 22, 24, 32, 35, 37];
// Long-term capital gains: taxable-income top of the 0% zone and of the 15% zone
const LTCG = {
  single: [49450, 545500],
  mfj:    [98900, 613700],
  mfs:    [49450, 306850],
  hoh:    [66200, 579600]
};
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
function pct(v) { return isFinite(v) ? v.toFixed(2) + '%' : '–'; }
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
  const status = $('filingStatus').value;
  const term = $('holding').value;           // 'long' or 'short'
  const sale = parseFloat($('salePrice').value);
  const cost = parseFloat($('costBasis').value);
  const fees = parseFloat($('sellingCosts').value) || 0;
  const other = parseFloat($('otherIncome').value) || 0;
  const stateRate = parseFloat($('stateRate').value) || 0;
  const applyNiit = $('niit').checked;

  if (!(sale >= 0) || !(cost >= 0)) { showResults(false); return; }

  const gain = sale - cost - fees;
  const warn = $('warnBox');
  warn.style.display = 'none';

  let fedTax = 0, niit = 0, stateTax = 0, rateLabel = '';
  let z0 = 0, z15 = 0, z20 = 0;        // amounts taxed at 0/15/20 (long-term)

  if (gain > 0) {
    if (term === 'short') {
      fedTax = ordinaryTax(other + gain, status) - ordinaryTax(other, status);
      rateLabel = 'Taxed as ordinary income (10%–37%)';
    } else {
      const t0 = LTCG[status][0], t15 = LTCG[status][1];
      const start = other, end = other + gain;
      z0 = Math.max(0, Math.min(end, t0) - Math.min(start, t0));
      z15 = Math.max(0, Math.min(end, t15) - Math.max(start, t0));
      z15 = Math.max(0, z15);
      z20 = Math.max(0, end - Math.max(start, t15));
      fedTax = z15 * 0.15 + z20 * 0.20;
      rateLabel = '0% / 15% / 20% long-term rates';
    }
    if (applyNiit) {
      const magi = other + gain;
      const excess = Math.max(0, magi - NIIT_THRESHOLD[status]);
      niit = Math.min(gain, excess) * 0.038;
    }
    stateTax = gain * stateRate / 100;
  } else if (gain < 0) {
    warn.style.display = 'block';
    warn.textContent = 'This sale is a loss of ' + money(-gain) + '. A capital loss first offsets other capital gains. If losses exceed gains, up to $3,000 ($1,500 if married filing separately) can reduce ordinary income each year, and any extra carries forward.';
  }

  const totalTax = fedTax + niit + stateTax;
  const net = Math.max(gain, 0) - totalTax;
  const eff = gain > 0 ? totalTax / gain * 100 : 0;

  $('resultLabel').textContent = 'Estimated Capital Gains Tax';
  $('resultValueDisplay').textContent = money(totalTax);
  $('resultNote').textContent = gain > 0
    ? 'Effective rate on your gain: ' + pct(eff) + ' · ' + rateLabel
    : 'No gain, so no capital gains tax';

  const rows = [
    ['Sale price', money(sale)],
    ['Cost basis (purchase price)', '− ' + money(cost)],
    ['Selling costs', '− ' + money(fees)],
    ['SUB:' + (gain >= 0 ? 'Capital gain' : 'Capital loss'), money(gain)],
    ['Holding period', term === 'long' ? 'Long-term (more than 1 year)' : 'Short-term (1 year or less)']
  ];
  if (gain > 0 && term === 'long') {
    rows.push(['Gain taxed at 0%', money(z0, 0)]);
    rows.push(['Gain taxed at 15%', money(z15, 0)]);
    rows.push(['Gain taxed at 20%', money(z20, 0)]);
  }
  rows.push(['Federal capital gains tax', money(fedTax)]);
  if (applyNiit) rows.push(['Net Investment Income Tax (3.8%)', money(niit)]);
  if (stateRate > 0) rows.push(['State tax (' + stateRate + '%)', money(stateTax)]);
  rows.push(['SUB:Total tax', money(totalTax)]);
  rows.push(['Profit after tax', money(net)]);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(Math.max(net, 0), fedTax, niit, stateTax);
}

function drawChart(net, fed, nii, st) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(net, fed, nii, st); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  const labels = ['Profit after tax', 'Federal tax', 'NIIT (3.8%)', 'State tax'];
  const data = [net, fed, nii, st];
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: ['hsl(150, 55%, 45%)', 'hsl(215, 70%, 40%)', 'hsl(30, 85%, 55%)', 'hsl(280, 45%, 55%)'], borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: function (c) { return c.label + ': ' + money(c.raw); } } } }
    }
  });
}

function clearForm() {
  ['salePrice', 'costBasis', 'sellingCosts', 'otherIncome', 'stateRate'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
