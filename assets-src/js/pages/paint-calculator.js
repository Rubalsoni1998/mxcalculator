// Paint Calculator
// Reference: coverage 350-400 sq ft per gallon (Sherwin-Williams/PPG about 400, Behr/Benjamin Moore about 350), primer 200-300 sq ft per gallon, door about 20 sq ft, window about 15 sq ft.

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

function calculate() {
  const L = nv('length'), W = nv('width'), H = nv('height');
  const coats = Math.max(1, Math.round(nv('coats')));
  const doors = nv('doors'), wins = nv('windows');
  const cov = parseFloat($('coverage').value);
  const withCeiling = $('ceilingOpt').value === '1';
  const withPrimer = $('primer').value === '1';
  const extra = parseFloat($('extra').value) / 100;
  const doorSize = nv('doorSize'), winSize = nv('winSize');
  const price = nv('price');
  if (!(L > 0) || !(W > 0) || !(H > 0)) { showResults(false); return; }

  const wallArea = 2 * (L + W) * H;
  const deduct = doors * doorSize + wins * winSize;
  const warn = $('warnBox'); warn.style.display = 'none';
  if (deduct >= wallArea) { warn.style.display = 'block'; warn.textContent = 'Doors and windows are larger than the wall area. Check your counts and sizes.'; showResults(false); return; }
  const paintable = wallArea - deduct;
  const ceilArea = withCeiling ? L * W : 0;
  const totalArea = paintable + ceilArea;
  const gallonsExact = totalArea * coats / cov * (1 + extra);
  const gallonsBuy = Math.ceil(gallonsExact - 1e-9);
  const primerArea = withPrimer ? totalArea : 0;
  const primerExact = primerArea / 250;
  const primerBuy = Math.ceil(primerExact - 1e-9);
  const cost = gallonsBuy * price;
  const primerCost = primerBuy * price;

  // exact gallons into whole gallons + quarts for the remainder
  const whole = Math.floor(gallonsExact + 1e-9);
  const quarts = Math.ceil((gallonsExact - whole) * 4 - 1e-9);
  let alt = '';
  if (gallonsExact > 0) {
    const g = quarts === 4 ? whole + 1 : whole, q = quarts === 4 ? 0 : quarts;
    alt = (g ? g + ' gallon' + (g === 1 ? '' : 's') : '') + (g && q ? ' + ' : '') + (q ? q + ' quart' + (q === 1 ? '' : 's') : '');
  }

  $('resultLabel').textContent = 'Paint to Buy';
  $('resultValueDisplay').textContent = gallonsBuy + (gallonsBuy === 1 ? ' gallon' : ' gallons');
  $('resultNote').textContent = 'Exactly ' + gallonsExact.toFixed(2) + ' gallons needed' + (/quart/.test(alt) ? ' (' + alt + ' also works)' : '') + (price > 0 ? ' · ' + money(cost, 0) + ' of paint' : '');

  const rows = [
    ['Wall area (2 × (L + W) × height)', fmt(wallArea) + ' sq ft'],
    ['Doors (' + doors + ') and windows (' + wins + ')', '−' + fmt(deduct) + ' sq ft'],
    ['Paintable wall area', fmt(paintable) + ' sq ft']
  ];
  if (withCeiling) rows.push(['Ceiling area', fmt(ceilArea) + ' sq ft']);
  rows.push(['Total area to paint', fmt(totalArea) + ' sq ft']);
  rows.push(['Coats × coverage', coats + ' × ' + cov + ' sq ft per gallon']);
  rows.push(['Gallons for one coat', (totalArea / cov).toFixed(2)]);
  if (extra > 0) rows.push(['Touch-up allowance', '+10%']);
  rows.push(['SUB:Gallons needed', gallonsExact.toFixed(2)]);
  rows.push(['SUB:Gallons to buy', gallonsBuy + '']);
  if (withPrimer) rows.push(['SUB:Primer to buy (250 sq ft per gallon)', primerBuy + (primerBuy === 1 ? ' gallon' : ' gallons') + ' (' + primerExact.toFixed(2) + ' needed)']);
  if (price > 0) {
    rows.push(['Paint cost (' + gallonsBuy + ' × ' + money(price, 2) + ')', money(cost)]);
    if (withPrimer) rows.push(['Primer cost (at the same price)', money(primerCost)]);
  }
  renderRows(rows);
  showResults(true);
}

function clearForm() {
  ['length', 'width', 'height', 'coats', 'doors', 'windows', 'price'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
