// Property Tax Calculator (US)
// Effective rates: Tax Foundation, 2024 data (latest available), via Rocket Mortgage "Property taxes by state: 2026 rankings".
// Actual bills depend on county/city mill rates, assessment ratios and exemptions.
let state = { chart: null };

// [state, effective rate %, state median home value]
const STATES = [
  ['Alabama', 0.37, 182264], ['Alaska', 0.94, 266070], ['Arizona', 0.48, 274792], ['Arkansas', 0.56, 168761],
  ['California', 0.70, 788920], ['Colorado', 0.50, 551854], ['Connecticut', 1.54, 414183], ['Delaware', 0.54, 389974],
  ['Florida', 0.78, 387464], ['Georgia', 0.79, 329110], ['Hawaii', 0.29, 841274], ['Idaho', 0.50, 462014],
  ['Illinois', 1.88, 273186], ['Indiana', 0.76, 244855], ['Iowa', 1.33, 219987], ['Kansas', 1.21, 230884],
  ['Kentucky', 0.74, 217447], ['Louisiana', 0.55, 201100], ['Maine', 0.98, 400642], ['Maryland', 0.92, 425692],
  ['Massachusetts', 1.00, 635252], ['Michigan', 1.19, 248560], ['Minnesota', 1.00, 337891], ['Mississippi', 0.58, 181232],
  ['Missouri', 0.89, 251663], ['Montana', 0.61, 459370], ['Nebraska', 1.44, 264859], ['Nevada', 0.50, 448322],
  ['New Hampshire', 1.50, 487482], ['New Jersey', 1.88, 548338], ['New Mexico', 0.63, 308031], ['New York', 1.30, 485932],
  ['North Carolina', 0.66, 331761], ['North Dakota', 0.92, 269509], ['Ohio', 1.36, 234906], ['Oklahoma', 0.79, 208281],
  ['Oregon', 0.81, 500850], ['Pennsylvania', 1.26, 272299], ['Rhode Island', 1.12, 475865], ['South Carolina', 0.49, 298029],
  ['South Dakota', 1.00, 308842], ['Tennessee', 0.52, 319167], ['Texas', 1.40, 303321], ['Utah', 0.48, 530787],
  ['Vermont', 1.51, 388919], ['Virginia', 0.78, 400201], ['Washington', 0.75, 603837], ['West Virginia', 0.51, 167589],
  ['Wisconsin', 1.32, 312361], ['Wyoming', 0.53, 357698]
];

document.addEventListener('DOMContentLoaded', function () {
  const sel = $('stateSel');
  sel.innerHTML = STATES.map(function (s, i) { return '<option value="' + i + '">' + s[0] + ' (' + s[1].toFixed(2) + '%)</option>'; }).join('');
  sel.value = String(STATES.findIndex(function (s) { return s[0] === 'Texas'; }));
  onMethodChange();
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

function onMethodChange() {
  const m = $('method').value;
  document.querySelectorAll('.m-state').forEach(function (e) { e.style.display = m === 'state' ? '' : 'none'; });
  document.querySelectorAll('.m-pct').forEach(function (e) { e.style.display = m === 'pct' ? '' : 'none'; });
  document.querySelectorAll('.m-mill').forEach(function (e) { e.style.display = m === 'mill' ? '' : 'none'; });
  calculate();
}

function calculate() {
  const value = parseFloat($('homeValue').value);
  const method = $('method').value;
  const ratio = parseFloat($('assessRatio').value);
  const exempt = parseFloat($('exemption').value) || 0;
  const growth = parseFloat($('growth').value) || 0;
  if (!(value > 0) || !(ratio > 0)) { showResults(false); return; }

  const st = STATES[parseInt($('stateSel').value, 10)];
  let annual, rateUsed, basis;
  const assessed = Math.max(0, value * ratio / 100 - exempt);
  if (method === 'state') {
    // effective rates already reflect typical assessment practice and exemptions, so apply to full market value less your extra exemption
    annual = Math.max(0, value - exempt) * st[1] / 100;
    rateUsed = st[1];
    basis = st[0] + ' average effective rate';
  } else if (method === 'pct') {
    const r = parseFloat($('localPct').value);
    if (!(r >= 0)) { showResults(false); return; }
    annual = assessed * r / 100; rateUsed = r * (assessed / value); basis = 'Your local rate × assessed value';
  } else {
    const mills = parseFloat($('mills').value);
    if (!(mills >= 0)) { showResults(false); return; }
    annual = assessed * mills / 1000; rateUsed = assessed * mills / 1000 / value * 100; basis = mills + ' mills × assessed value';
  }
  const monthly = annual / 12;

  $('resultLabel').textContent = 'Estimated Annual Property Tax';
  $('resultValueDisplay').textContent = money(annual);
  $('resultNote').textContent = money(monthly) + ' per month · effective rate ' + rateUsed.toFixed(2) + '%';

  // compare the same home in the five highest and five lowest states
  const sorted = STATES.slice().sort(function (a, b) { return b[1] - a[1]; });
  const cmp = sorted.slice(0, 3).concat(sorted.slice(-3));
  const rows = [
    ['Home value', money(value)],
    ['Assessed value after exemption', method === 'state' ? 'Rate applies to market value' : money(assessed)],
    ['Method', basis],
    ['SUB:Annual property tax', money(annual)],
    ['Monthly (for escrow)', money(monthly)],
    ['Effective tax rate', rateUsed.toFixed(2) + '%'],
    ['Per $1,000 of home value', money(annual / value * 1000, 2)]
  ];
  if (method === 'state') {
    const medTax = st[2] * st[1] / 100;
    rows.push([st[0] + ' median home (' + money(st[2]) + ') pays about', money(medTax) + ' / yr']);
  }
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('compareBody').innerHTML = cmp.map(function (s, i) {
    return '<tr><td>' + s[0] + '</td><td>' + s[1].toFixed(2) + '%</td><td>' + money(Math.max(0, value - exempt) * s[1] / 100) + '</td></tr>';
  }).join('');

  // 10-year projection
  const labels = [], data = [];
  for (let y = 1; y <= 10; y++) { labels.push('Yr ' + y); data.push(Math.round(annual * Math.pow(1 + growth / 100, y - 1))); }
  showResults(true);
  drawChart(labels, data);
}

function drawChart(labels, data) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(labels, data); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Annual property tax', data: data, backgroundColor: 'hsl(215, 70%, 45%)', borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw); } } } },
      scales: { y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } } }
  });
}

function clearForm() {
  ['homeValue', 'exemption'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
