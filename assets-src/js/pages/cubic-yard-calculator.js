// Cubic Yard Calculator
// 1 cubic yard = 27 cubic feet = 0.764555 cubic meters. Densities are typical values (lb per cubic yard) and vary with moisture and compaction.
// Bag sizes: mulch 2 cu ft, topsoil/compost 1 cu ft, gravel/sand 0.5 cu ft.

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
  const shape = $('shape').value;
  const unitLW = parseFloat($('lenUnit').value);          // feet per unit
  const unitD = parseFloat($('depthUnit').value);
  const a = nv('length') * unitLW, b = nv('width') * unitLW, d = nv('depth') * unitD;
  const qty = Math.max(1, Math.round(nv('qty')));
  const extra = nv('extra') / 100;
  const parts = $('material').value.split('|');
  const lbPerYd = parseFloat(parts[0]), bagCuFt = parseFloat(parts[1]);
  const price = nv('price');
  const needW = shape === 'rect';
  $('width').closest('.form-group').style.display = needW ? '' : 'none';
  if (!(a > 0) || (needW && !(b > 0)) || !(d > 0)) { showResults(false); return; }

  const base = shape === 'rect' ? a * b : Math.PI * Math.pow(a / 2, 2);
  const cuFtOne = base * d;
  const cuFt = cuFtOne * qty;
  const yd = cuFt / 27;
  const ydExtra = yd * (1 + extra);
  const cuFtExtra = ydExtra * 27;
  const m3 = cuFtExtra * 0.0283168;
  const lbs = ydExtra * lbPerYd;
  const tons = lbs / 2000;
  const bags = bagCuFt > 0 ? Math.ceil(cuFtExtra / bagCuFt - 1e-9) : 0;
  const cost = ydExtra * price;

  $('resultLabel').textContent = 'Cubic Yards to Order';
  $('resultValueDisplay').textContent = ydExtra.toFixed(2) + ' yd³';
  $('resultNote').textContent = yd.toFixed(2) + ' yd³ needed' + (extra > 0 ? ' + ' + (extra * 100) + '% extra' : '') + (lbPerYd > 0 ? ' · about ' + tons.toFixed(2) + ' tons' : '');

  const warn = $('warnBox');
  if (ydExtra > 12) { warn.style.display = 'block'; warn.textContent = 'This is a large order. Ask your supplier about delivery loads and whether the material is priced by the yard or by the ton.'; }
  else warn.style.display = 'none';

  const rows = [
    [shape === 'rect' ? 'Area (length × width)' : 'Area (circle)', fmt(base * qty, 1) + ' sq ft'],
    ['Depth', fmt(d * 12, 2) + ' in'],
    ['Volume', fmt(cuFt, 1) + ' cu ft'],
    ['Cubic yards (÷ 27)', yd.toFixed(2)]
  ];
  if (extra > 0) rows.push(['With ' + (extra * 100) + '% extra', ydExtra.toFixed(2) + ' yd³']);
  rows.push(['SUB:Cubic yards to order', ydExtra.toFixed(2)]);
  rows.push(['Cubic feet', fmt(cuFtExtra, 1)]);
  rows.push(['Cubic meters', m3.toFixed(2)]);
  if (lbPerYd > 0) {
    rows.push(['Estimated weight', fmt(lbs) + ' lb']);
    rows.push(['SUB:Estimated tons (US)', tons.toFixed(2)]);
  }
  if (bags > 0) rows.push(['Bags needed (' + bagCuFt + ' cu ft each)', fmt(bags)]);
  if (price > 0) rows.push(['SUB:Estimated cost', money(cost)]);
  renderRows(rows);
  showResults(true);
}

function clearForm() {
  ['length', 'width', 'depth', 'qty', 'extra', 'price'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
