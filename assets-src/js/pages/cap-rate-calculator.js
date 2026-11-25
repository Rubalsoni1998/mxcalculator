// Cap Rate Calculator
let state = { chart: null };

document.addEventListener('DOMContentLoaded', function () {
  onModeChange();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  const dec = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
}
function num(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function onModeChange() {
  const cap = $('mode').value === 'cap';
  $('priceGroup').style.display = cap ? 'block' : 'none';
  $('capGroup').style.display = cap ? 'none' : 'block';
  calculate();
}

function calculate() {
  const mode = $('mode').value;
  const gross = num('grossIncome');
  const vac = Math.min(100, Math.max(0, num('vacancy'))) / 100;
  if (!(gross > 0)) { showResults(false); return; }

  const egi = gross * (1 - vac);
  const vacLoss = gross - egi;
  const tax = num('propTax'), ins = num('insurance'), maint = num('maintenance'), util = num('utilities'), other = num('other');
  const mgmt = egi * num('mgmt') / 100;
  const opex = tax + ins + maint + util + other + mgmt;
  const noi = egi - opex;
  const expRatio = egi > 0 ? opex / egi * 100 : 0;

  let price, cap, label, big, note;
  if (mode === 'cap') {
    price = num('price');
    if (!(price > 0)) { showResults(false); return; }
    cap = noi / price * 100;
    label = 'Capitalization Rate';
    big = cap.toFixed(2) + '%';
    note = 'Net operating income of ' + money(noi) + ' per year';
  } else {
    cap = num('targetCap');
    if (!(cap > 0)) { showResults(false); return; }
    price = noi / (cap / 100);
    label = 'Estimated Property Value';
    big = noi > 0 ? money(price) : 'Not meaningful';
    note = 'NOI of ' + money(noi) + ' at a ' + cap.toFixed(2) + '% cap rate';
  }

  $('resultLabel').textContent = label;
  $('resultValueDisplay').textContent = big;
  $('resultNote').textContent = note;

  const warn = $('warnBox');
  if (noi <= 0) {
    warn.style.display = 'block';
    warn.textContent = 'Operating expenses are at or above income, so NOI is not positive. Check your numbers.';
  } else if (mode === 'cap' && cap > 15) {
    warn.style.display = 'block';
    warn.textContent = 'A cap rate this high is unusual. Double-check rent, expenses and price, and consider the property\'s condition and risk.';
  } else warn.style.display = 'none';

  let band = '';
  if (mode === 'cap' && noi > 0) band = cap < 4 ? 'Low (lower risk, lower yield)' : cap < 6 ? 'Moderate (stable markets)' : cap < 8 ? 'Balanced return and risk' : 'High (higher yield, higher risk)';

  const rows = [
    ['Gross annual rent', money(gross)],
    ['Vacancy loss (' + (vac * 100).toFixed(1) + '%)', '− ' + money(vacLoss)],
    ['SUB:Effective gross income', money(egi)],
    ['Property tax', '− ' + money(tax)],
    ['Insurance', '− ' + money(ins)],
    ['Maintenance &amp; repairs', '− ' + money(maint)],
    ['Utilities', '− ' + money(util)],
    ['Property management (' + num('mgmt').toFixed(1) + '%)', '− ' + money(mgmt)],
    ['Other expenses', '− ' + money(other)],
    ['Total operating expenses', money(opex)],
    ['SUB:Net operating income (NOI)', money(noi)],
    ['Operating expense ratio', expRatio.toFixed(1) + '%'],
    [mode === 'cap' ? 'Purchase price' : 'Estimated value', money(price)],
    ['Cap rate', cap.toFixed(2) + '%'],
    ['Gross rent multiplier (GRM)', price > 0 ? (price / gross).toFixed(2) : '–']
  ];
  if (band) rows.push(['Typical range', band]);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart([['Net operating income', Math.max(noi, 0), 'hsl(265, 70%, 38%)'], ['Vacancy', vacLoss, 'hsl(0, 0%, 75%)'], ['Property tax', tax, 'hsl(265, 55%, 62%)'],
    ['Insurance', ins, 'hsl(200, 60%, 60%)'], ['Maintenance', maint, 'hsl(160, 50%, 55%)'], ['Utilities', util, 'hsl(45, 80%, 60%)'],
    ['Management', mgmt, 'hsl(20, 80%, 62%)'], ['Other', other, 'hsl(330, 60%, 65%)']].filter(function (d) { return d[1] > 0; }));
}

function drawChart(items) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(items); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: items.map(function (d) { return d[0]; }), datasets: [{ data: items.map(function (d) { return d[1]; }), backgroundColor: items.map(function (d) { return d[2]; }), borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '55%',
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: function (c) {
          const t = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
          return c.label + ': ' + money(c.raw) + ' (' + (t ? (c.raw / t * 100).toFixed(1) : 0) + '%)';
        } } }
      }
    }
  });
}

function clearForm() {
  ['price', 'targetCap', 'grossIncome', 'vacancy', 'propTax', 'insurance', 'maintenance', 'utilities', 'mgmt', 'other'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
