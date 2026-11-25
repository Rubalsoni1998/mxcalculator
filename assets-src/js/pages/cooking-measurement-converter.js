// Cooking Measurement Converter
// US customary: 1 cup = 236.5882365 mL, 1 tbsp = 14.78676478125 mL, 1 tsp = 4.92892159375 mL, 1 fl oz = 29.5735295625 mL.
// Grams per US cup: King Arthur Baking ingredient weight chart (flour 120, granulated sugar 198, brown sugar 213, butter 227), standard densities for water, milk, oil, honey.

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

const CUP = 236.5882365;
const VOL = { tsp: 4.92892159375, tbsp: 14.78676478125, floz: 29.5735295625, cup: CUP, pint: CUP * 2, quart: CUP * 4, gal: CUP * 16, ml: 1, l: 1000 };
const WT = { g: 1, oz: 28.349523125, lb: 453.59237, kg: 1000 };
const DENS = { water: 236.588, milk: 245, oil: 217, honey: 336, butter: 227, ap: 120, bread: 120, granulated: 198, brown: 213, powdered: 120, cocoa: 85, cornstarch: 128 };
const NAME = { water: 'Water', milk: 'Milk', oil: 'Vegetable oil', honey: 'Honey', butter: 'Butter', ap: 'All-purpose flour', bread: 'Bread flour', granulated: 'Granulated sugar', brown: 'Brown sugar (packed)', powdered: 'Powdered sugar', cocoa: 'Cocoa powder', cornstarch: 'Cornstarch' };

function frac(x) {
  const w = Math.floor(x + 1e-9), r = x - w;
  const f = Math.round(r * 8);
  if (f === 0) return String(w);
  if (f === 8) return String(w + 1);
  const g = f % 4 === 0 ? [f / 4, 2] : f % 2 === 0 ? [f / 2, 4] : [f, 8];
  return (w ? w + ' ' : '') + g[0] + '/' + g[1];
}
function cups(x) { const r = Math.round(x * 100) / 100; return n(r, 2) + (r === 1 ? ' cup' : ' cups'); }
function n(x, d) { return x.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: d === undefined ? 2 : d }); }

function calculate() {
  const raw = $('value').value.trim(), v = parseFloat(raw);
  const unit = $('unit').value, ing = $('ingredient').value;
  const dens = ing === 'none' ? null : DENS[ing];
  const warn = $('warnBox'); warn.style.display = 'none';
  if (raw === '' || !isFinite(v) || v < 0) { showResults(false); return; }
  let ml = null, g = null;
  const fromWeight = WT[unit] !== undefined;
  if (unit === 'stick') { ml = CUP / 2 * v; g = 113.398 * v; }                 // a US stick is always butter
  else if (VOL[unit]) { ml = v * VOL[unit]; if (dens) g = ml / CUP * dens; }
  else { g = v * WT[unit]; if (dens) ml = g / dens * CUP; }
  if (fromWeight && ml === null) { warn.style.display = 'block'; warn.textContent = 'Pick an ingredient to convert weight into cups, spoons or milliliters.'; }
  const rows = [];
  if (ml !== null) {
    rows.push(['Teaspoons', n(ml / VOL.tsp)], ['Tablespoons', n(ml / VOL.tbsp)], ['Fluid ounces', n(ml / VOL.floz)],
      ['Cups', n(ml / VOL.cup, 3) + (frac(ml / VOL.cup) !== n(ml / VOL.cup, 3) ? ' (about ' + frac(ml / VOL.cup) + ')' : '')], ['Pints', n(ml / VOL.pint, 3)], ['Quarts', n(ml / VOL.quart, 3)], ['Gallons', n(ml / VOL.gal, 4)],
      ['Milliliters', n(ml, 1)], ['Liters', n(ml / 1000, 3)]);
  }
  if (g !== null) {
    rows.push(['SUB:Grams', n(g, 1)], ['Ounces (weight)', n(g / WT.oz, 2)], ['Pounds', n(g / WT.lb, 3)], ['Kilograms', n(g / 1000, 3)]);
    if (ing === 'butter' || unit === 'stick') rows.push(['Sticks of butter', n(g / 113.398, 2)]);
  }
  if (ing !== 'none') rows.push(['Ingredient', NAME[ing] + ' (' + n(DENS[ing], 0) + ' g per cup)']);
  renderRows(rows);

  let label, value, note;
  if (!fromWeight && g !== null) {
    label = 'In Grams'; value = n(g, 0) + ' g'; note = n(g / WT.oz, 1) + ' oz · ' + cups(ml / VOL.cup) + ' · ' + n(ml, 0) + ' mL';
  } else if (!fromWeight) {
    label = 'In Milliliters'; value = n(ml, 0) + ' mL'; note = cups(ml / VOL.cup) + ' · ' + n(ml / VOL.tbsp, 1) + ' tbsp · ' + n(ml / VOL.floz, 1) + ' fl oz';
  } else if (ml !== null) {
    label = 'In Cups'; value = cups(ml / VOL.cup); note = 'about ' + frac(ml / VOL.cup) + ' cups · ' + n(ml, 0) + ' mL · ' + n(g / WT.oz, 1) + ' oz';
  } else if (unit === 'g' || unit === 'kg') {
    label = 'In Ounces'; value = n(g / WT.oz, 2) + ' oz'; note = n(g, 0) + ' g · ' + n(g / WT.lb, 3) + ' lb';
  } else {
    label = 'In Grams'; value = n(g, 0) + ' g'; note = n(g / WT.oz, 2) + ' oz · ' + n(g / WT.lb, 3) + ' lb';
  }
  $('resultLabel').textContent = label; $('resultValueDisplay').textContent = value; $('resultNote').textContent = note;
  showResults(true);
}

function buildIng() {
  const order = ['ap', 'bread', 'granulated', 'brown', 'powdered', 'cocoa', 'cornstarch', 'butter', 'water', 'milk', 'oil', 'honey'];
  $('ingTable').innerHTML = order.map(function (k) {
    return '<tr><td>' + NAME[k] + '</td><td>' + n(DENS[k], 0) + ' g</td><td>' + n(DENS[k] / 2, 0) + ' g</td><td>' + n(DENS[k] / 16, 1) + ' g</td></tr>';
  }).join('');
}
function clearForm() { $('value').value = ''; showResults(false); }
document.addEventListener('DOMContentLoaded', buildIng);
