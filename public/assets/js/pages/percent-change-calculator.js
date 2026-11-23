// Percent Change Calculator
let state = { chart: null };

document.addEventListener('DOMContentLoaded', function () {
  onModeChange();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function fmt(v, max) {
  if (!isFinite(v)) return '–';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: max === undefined ? 4 : max }).format(v);
}
function fmtPct(v) { return fmt(v, 2) + '%'; }
function signed(v, max) { return (v > 0 ? '+' : '') + fmt(v, max); }

function onModeChange() {
  const change = $('mode').value === 'change';
  $('changeGroup').style.display = change ? 'block' : 'none';
  $('applyGroup').style.display = change ? 'none' : 'block';
  calculate();
}

function calculate() {
  const mode = $('mode').value;
  const warn = $('warnBox');
  warn.style.display = 'none';
  let labels, values, colors;

  if (mode === 'change') {
    const a = parseFloat($('oldVal').value), b = parseFloat($('newVal').value);
    if (!isFinite(a) || !isFinite(b)) { showResults(false); return; }
    const diff = b - a;
    const avg = (Math.abs(a) + Math.abs(b)) / 2;
    const pdiff = avg === 0 ? 0 : Math.abs(diff) / avg * 100;

    if (a === 0) {
      $('resultLabel').textContent = 'Percent Change';
      $('resultValueDisplay').textContent = 'Undefined';
      $('resultNote').textContent = 'The old value is 0, so percent change cannot be calculated';
      warn.style.display = 'block';
      warn.textContent = 'Percent change divides by the old value, which cannot be zero. Try the percent difference below instead.';
      $('breakdownTableBody').innerHTML =
        '<tr><td class="muted">Old value</td><td>' + fmt(a) + '</td></tr>' +
        '<tr><td class="muted">New value</td><td>' + fmt(b) + '</td></tr>' +
        '<tr><td class="muted">Absolute change</td><td>' + signed(diff) + '</td></tr>' +
        '<tr><td class="muted">Percent difference</td><td>' + fmtPct(pdiff) + '</td></tr>';
    } else {
      const pc = diff / Math.abs(a) * 100;
      const kind = diff > 0 ? 'Increase' : diff < 0 ? 'Decrease' : 'No change';
      $('resultLabel').textContent = 'Percent ' + (diff === 0 ? 'Change' : kind);
      $('resultValueDisplay').textContent = signed(pc, 2) + '%';
      $('resultNote').textContent = fmt(a) + ' → ' + fmt(b) + ' (' + signed(diff) + ')';
      const cls = diff > 0 ? 'good' : diff < 0 ? 'bad' : '';
      $('breakdownTableBody').innerHTML =
        '<tr><td class="muted">Old value</td><td>' + fmt(a) + '</td></tr>' +
        '<tr><td class="muted">New value</td><td>' + fmt(b) + '</td></tr>' +
        '<tr><td class="muted">Absolute change</td><td>' + signed(diff) + '</td></tr>' +
        '<tr class="sub-row"><td>Percent change</td><td class="' + cls + '">' + signed(pc, 4) + '%</td></tr>' +
        '<tr><td class="muted">Multiplier (new ÷ old)</td><td>' + fmt(b / a, 6) + '</td></tr>' +
        '<tr><td class="muted">Percent difference (symmetric)</td><td>' + fmtPct(pdiff) + '</td></tr>' +
        '<tr><td class="muted">Change needed to return to old value</td><td>' + (b === 0 ? 'Not possible' : signed((a - b) / Math.abs(b) * 100, 2) + '%') + '</td></tr>';
    }
    labels = ['Old value', 'New value'];
    values = [a, b];
    colors = ['hsl(20, 60%, 80%)', 'hsl(20, 80%, 45%)'];
  } else {
    const s = parseFloat($('startVal').value), p = parseFloat($('pct').value);
    if (!isFinite(s) || !isFinite(p)) { showResults(false); return; }
    const up = $('direction').value === 'up';
    const delta = s * p / 100 * (up ? 1 : -1);
    const result = s + delta;
    $('resultLabel').textContent = (up ? 'Increase' : 'Decrease') + ' of ' + fmt(p, 4) + '%';
    $('resultValueDisplay').textContent = fmt(result, 4);
    $('resultNote').textContent = fmt(s) + (up ? ' + ' : ' − ') + fmt(Math.abs(delta)) + ' = ' + fmt(result);
    $('breakdownTableBody').innerHTML =
      '<tr><td class="muted">Starting value</td><td>' + fmt(s) + '</td></tr>' +
      '<tr><td class="muted">Percent ' + (up ? 'increase' : 'decrease') + '</td><td>' + fmt(p, 4) + '%</td></tr>' +
      '<tr><td class="muted">Amount ' + (up ? 'added' : 'removed') + '</td><td>' + fmt(Math.abs(delta)) + '</td></tr>' +
      '<tr class="sub-row"><td>New value</td><td>' + fmt(result, 4) + '</td></tr>' +
      '<tr><td class="muted">Multiplier</td><td>' + fmt(1 + (up ? 1 : -1) * p / 100, 6) + '</td></tr>' +
      '<tr><td class="muted">Change needed to get back to start</td><td>' + (result === 0 ? 'Not possible' : signed((s - result) / Math.abs(result) * 100, 2) + '%') + '</td></tr>';
    if (!up && p > 100) {
      warn.style.display = 'block';
      warn.textContent = 'A decrease over 100% takes a positive number below zero.';
    }
    labels = ['Starting value', 'New value'];
    values = [s, result];
    colors = ['hsl(20, 60%, 80%)', 'hsl(20, 80%, 45%)'];
  }

  showResults(true);
  drawChart(labels, values, colors);
}

function drawChart(labels, values, colors) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(labels, values, colors); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 8, borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return fmt(c.raw, 4); } } } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function clearForm() {
  ['oldVal', 'newVal', 'startVal', 'pct'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
