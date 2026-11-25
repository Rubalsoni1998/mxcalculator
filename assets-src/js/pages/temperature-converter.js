// Temperature Converter
// C = (F - 32) x 5/9; F = C x 9/5 + 32; K = C + 273.15; R = F + 459.67. Absolute zero = -273.15 C = -459.67 F.

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

function calculate() {
  const raw = $('value').value.trim();
  const v = parseFloat(raw);
  const unit = $('unit').value;
  const warn = $('warnBox'); warn.style.display = 'none';
  if (raw === '' || !isFinite(v)) { showResults(false); return; }
  let c;
  if (unit === 'c') c = v;
  else if (unit === 'f') c = (v - 32) * 5 / 9;
  else if (unit === 'k') c = v - 273.15;
  else c = (v - 491.67) * 5 / 9;
  if (c < -273.15 - 1e-9) {
    showResults(true); $('resultLabel').textContent = 'Below absolute zero'; $('resultValueDisplay').textContent = '–'; $('resultNote').textContent = '';
    $('breakdownTableBody').innerHTML = '';
    warn.style.display = 'block'; warn.textContent = 'That is colder than absolute zero (−273.15°C, −459.67°F, 0 K), which is not possible. Enter a higher temperature.';
    return;
  }
  const f = c * 9 / 5 + 32, k = c + 273.15, r = f + 459.67;
  const d = function (x) { return (Math.round(x * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  const target = unit === 'f' ? ['Celsius', d(c) + '°C'] : ['Fahrenheit', d(f) + '°F'];
  $('resultLabel').textContent = unit === 'f' ? 'In Celsius' : 'In Fahrenheit';
  $('resultValueDisplay').textContent = target[1];
  $('resultNote').textContent = d(v) + {c: '°C', f: '°F', k: ' K', r: '°R'}[unit] + ' equals ' + d(c) + '°C · ' + d(f) + '°F · ' + d(k) + ' K';
  renderRows([
    ['Fahrenheit (°F)', d(f) + '°F'],
    ['Celsius (°C)', d(c) + '°C'],
    ['Kelvin (K)', d(k) + ' K'],
    ['Rankine (°R)', d(r) + '°R'],
    ['SUB:Formula used', unit === 'f' ? '(' + d(v) + ' − 32) × 5 ÷ 9' : unit === 'c' ? d(v) + ' × 9 ÷ 5 + 32' : unit === 'k' ? '(' + d(v) + ' − 273.15) × 9 ÷ 5 + 32' : d(v) + ' − 459.67']
  ]);
  showResults(true);
}

function clearForm() { $('value').value = ''; showResults(false); }
document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) { el.addEventListener('input', calculate); el.addEventListener('change', calculate); });
});
