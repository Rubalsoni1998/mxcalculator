// Pounds to Kilograms Converter
// 1 lb = 0.45359237 kg exactly (1959 international agreement); 1 oz = 28.349523125 g; 1 stone = 14 lb.

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

const TO_KG = { lb: 0.45359237, kg: 1, oz: 0.028349523125, g: 0.001, st: 6.35029318 };
const LB = 0.45359237;

function calculate() {
  const raw = $('value').value.trim();
  const v = parseFloat(raw);
  const unit = $('unit').value;
  const dp = parseInt($('dp').value, 10);
  const warn = $('warnBox'); warn.style.display = 'none';
  if (raw === '' || !isFinite(v) || v < 0) { showResults(false); return; }
  const kg = v * TO_KG[unit];
  const lb = kg / LB, oz = lb * 16, g = kg * 1000, st = lb / 14;
  let wl = Math.floor(lb + 1e-12), wo = Math.max(0, (lb - wl) * 16);
  if (wo >= 15.9995) { wl += 1; wo = 0; }
  let ws = Math.floor(lb / 14 + 1e-12), wr = Math.max(0, lb - ws * 14);
  if (wr >= 13.9995) { ws += 1; wr = 0; }
  const f = function (x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const names = { lb: 'lb', kg: 'kg', oz: 'oz', g: 'g', st: 'st' };

  const toKg = unit !== 'kg' && unit !== 'g';
  $('resultLabel').textContent = toKg ? 'In Kilograms' : 'In Pounds';
  $('resultValueDisplay').textContent = toKg ? f(kg, dp) + ' kg' : f(lb, dp) + ' lb';
  $('resultNote').textContent = f(v, 2) + ' ' + names[unit] + ' = ' + f(kg, dp) + ' kg = ' + f(lb, dp) + ' lb';
  renderRows([
    ['Kilograms (kg)', f(kg, dp)],
    ['Grams (g)', f(g, Math.min(dp, 2))],
    ['Pounds (lb)', f(lb, dp)],
    ['Pounds and ounces', f(wl, 0) + ' lb ' + f(wo, 1) + ' oz'],
    ['Ounces (oz)', f(oz, dp)],
    ['Stone and pounds', f(ws, 0) + ' st ' + f(wr, 1) + ' lb'],
    ['Stone (st)', f(st, dp)],
    ['SUB:Exact factor', '1 lb = 0.45359237 kg']
  ]);
  showResults(true);
}

function buildChart() {
  const lbs = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 250, 300, 350];
  let h = '';
  for (let i = 0; i < lbs.length; i += 2) {
    h += '<tr><td>' + lbs[i] + ' lb</td><td>' + (lbs[i] * LB).toFixed(2) + ' kg</td><td>' + lbs[i + 1] + ' lb</td><td>' + (lbs[i + 1] * LB).toFixed(2) + ' kg</td></tr>';
  }
  $('chartTable').innerHTML = h;
}
function clearForm() { $('value').value = ''; showResults(false); }
document.addEventListener('DOMContentLoaded', buildChart);
