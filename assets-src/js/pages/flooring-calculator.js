// Flooring Calculator
// Reference: typical waste 10% (5-10% simple laminate/vinyl), 15% or more for diagonal or herringbone layouts, tile 10-20%.

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
  const L = nv('length'), W = nv('width');
  const add = nv('addArea'), sub = nv('subArea');
  const mat = $('material');
  const label = mat.options[mat.selectedIndex].text.replace(/ \(\d+%\)$/, '');
  const autoWaste = parseFloat(mat.value.split('|')[0]);
  const customRaw = $('waste').value.trim();
  const waste = customRaw !== '' && isFinite(parseFloat(customRaw)) && parseFloat(customRaw) >= 0 ? parseFloat(customRaw) : autoWaste;
  const box = nv('boxCoverage'), price = nv('price'), labor = nv('labor');
  const area = L * W + add - sub;
  if (!(L > 0) || !(W > 0) || !(box > 0) || !(area > 0)) { showResults(false); return; }

  const need = area * (1 + waste / 100);
  const boxes = Math.ceil(need / box - 1e-9);
  const bought = boxes * box;
  const leftover = bought - area;
  const material = bought * price;
  const install = area * labor;
  const total = material + install;

  $('resultLabel').textContent = 'Boxes to Buy';
  $('resultValueDisplay').textContent = boxes + (boxes === 1 ? ' box' : ' boxes');
  $('resultNote').textContent = fmt(need, 1) + ' sq ft with ' + waste + '% waste · ' + fmt(bought, 1) + ' sq ft purchased' + (price > 0 ? ' · ' + money(material, 0) + ' material' : '');

  const warn = $('warnBox');
  if (customRaw !== '' && parseFloat(customRaw) < 5) { warn.style.display = 'block'; warn.textContent = 'Less than 5% waste is risky. Even simple rooms usually need some allowance for end cuts and damaged pieces.'; }
  else warn.style.display = 'none';

  const rows = [
    ['Room area (length × width)', fmt(L * W, 1) + ' sq ft']
  ];
  if (add) rows.push(['Additional area', '+' + fmt(add, 1) + ' sq ft']);
  if (sub) rows.push(['Excluded area', '−' + fmt(sub, 1) + ' sq ft']);
  rows.push(['SUB:Floor area to cover', fmt(area, 1) + ' sq ft']);
  rows.push(['Flooring type', label]);
  rows.push(['Waste allowance', waste + '%' + (customRaw !== '' ? ' (custom)' : '')]);
  rows.push(['Square feet needed', fmt(need, 1) + ' sq ft']);
  rows.push(['Coverage per box', fmt(box, 1) + ' sq ft']);
  rows.push(['SUB:Boxes to buy', boxes + '']);
  rows.push(['Square feet purchased', fmt(bought, 1) + ' sq ft']);
  rows.push(['Left over after covering the floor', fmt(leftover, 1) + ' sq ft (' + (leftover / area * 100).toFixed(1) + '%)']);
  if (price > 0) rows.push(['Material cost', money(material)]);
  if (labor > 0) rows.push(['Installation cost', money(install)]);
  if (price > 0 || labor > 0) rows.push(['SUB:Estimated total', money(total)]);
  renderRows(rows);
  showResults(true);
}

function clearForm() {
  ['length', 'width', 'addArea', 'subArea', 'waste', 'boxCoverage', 'price', 'labor'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
