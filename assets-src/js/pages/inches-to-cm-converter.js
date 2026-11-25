// Inches to Centimeters Converter
// 1 in = 2.54 cm exactly (1959 international yard and pound agreement); 1 ft = 30.48 cm; 1 yd = 91.44 cm.

function $(id) { return document.getElementById(id); }
function nv(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function fmt(v, d) { return isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 0 : d }) : '–'; }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function renderRows(rows) {
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');
}
document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

const TO_CM = { in: 2.54, cm: 1, mm: 0.1, m: 100, yd: 91.44 };

function calculate() {
  const unit = $('unit').value;
  const dp = parseInt($('dp').value, 10);
  $('singleWrap').style.display = unit === 'ftin' ? 'none' : '';
  $('ftinWrap').style.display = unit === 'ftin' ? '' : 'none';
  const warn = $('warnBox'); warn.style.display = 'none';
  let cm, label;
  if (unit === 'ftin') {
    const ft = parseFloat($('feet').value), inch = parseFloat($('inches').value);
    if (!(ft >= 0) && !(inch >= 0)) { showResults(false); return; }
    const t = ((ft || 0) * 12 + (inch || 0));
    if (t < 0) { showResults(false); return; }
    cm = t * 2.54; label = (ft || 0) + ' ft ' + (inch || 0) + ' in';
  } else {
    const raw = $('value').value.trim(), v = parseFloat(raw);
    if (raw === '' || !isFinite(v) || v < 0) { showResults(false); return; }
    cm = v * TO_CM[unit]; label = v + ' ' + unit;
  }
  const inches = cm / 2.54;
  let wf = Math.floor(inches / 12 + 1e-12), wi = Math.max(0, inches - wf * 12);
  if (wi >= 11.9995) { wf += 1; wi = 0; }
  const f = function (x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const toCm = unit === 'in' || unit === 'ftin' || unit === 'yd';
  $('resultLabel').textContent = toCm ? 'In Centimeters' : 'In Inches';
  $('resultValueDisplay').textContent = toCm ? f(cm, dp) + ' cm' : f(inches, dp) + ' in';
  $('resultNote').textContent = label + ' = ' + f(cm, dp) + ' cm = ' + f(inches, dp) + ' in = ' + wf + ' ft ' + f(wi, 1) + ' in';
  renderRows([
    ['Centimeters (cm)', f(cm, dp)],
    ['Millimeters (mm)', f(cm * 10, Math.min(dp, 1))],
    ['Meters (m)', f(cm / 100, Math.max(dp, 2))],
    ['Inches (in)', f(inches, dp)],
    ['Feet and inches', wf + ' ft ' + f(wi, dp > 2 ? 2 : dp) + ' in'],
    ['Feet (ft)', f(inches / 12, Math.max(dp, 2))],
    ['Yards (yd)', f(inches / 36, Math.max(dp, 3))],
    ['SUB:Exact factor', '1 in = 2.54 cm']
  ]);
  showResults(true);
}

function buildChart() {
  const rows = [[4, 10], [5, 0], [5, 2], [5, 4], [5, 6], [5, 8], [5, 10], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]];
  $('chartTable').innerHTML = rows.map(function (r) {
    const inch = r[0] * 12 + r[1];
    return '<tr><td>' + r[0] + ' ft ' + r[1] + ' in</td><td>' + inch + '</td><td>' + (inch * 2.54).toFixed(1) + ' cm</td></tr>';
  }).join('');
}
function clearForm() { ['value', 'feet', 'inches'].forEach(function (id) { $(id).value = ''; }); showResults(false); }
document.addEventListener('DOMContentLoaded', buildChart);
