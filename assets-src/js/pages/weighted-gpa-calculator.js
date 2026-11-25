// Weighted GPA Calculator
// Grade values: A+ 4.0 (or 4.3), A 4.0, A- 3.7, B+ 3.3, B 3.0, B- 2.7, C+ 2.3, C 2.0, C- 1.7, D+ 1.3, D 1.0, D- 0.7, F 0.
// Honors +0.5 and AP/IB/dual +1.0 are the most common bonuses; no bonus is applied to an F.

function $(id) { return document.getElementById(id); }
const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
const BASE = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0 };
const MAX_ROWS = 20;
function showResults(on) { $('resultsPlaceholder').style.display = on ? 'none' : 'flex'; $('resultsContent').style.display = on ? 'block' : 'none'; }
function gv(g) { return g === 'A+' ? parseFloat($('aplus').value) : BASE[g]; }
function bonus(level, g) {
  if (g === 'F') return 0;
  return level === 'h' ? parseFloat($('honorsBonus').value) : level === 'a' ? parseFloat($('apBonus').value) : 0;
}
function f2(v) { return v.toFixed(2); }

function addRow() {
  const wrap = $('courseRows');
  if (wrap.children.length >= MAX_ROWS) return;
  const d = document.createElement('div'); d.className = 'gpa-row';
  d.innerHTML = '<input type="text" class="c-name" placeholder="Course" aria-label="Course name">' +
    '<select class="c-grade" aria-label="Grade">' + GRADES.map(function (g) { return '<option' + (g === 'A' ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select>' +
    '<select class="c-level" aria-label="Course level"><option value="r">Regular</option><option value="h">Honors</option><option value="a">AP / IB / Dual</option></select>' +
    '<input type="number" class="c-credit" value="1" min="0" max="10" step="0.5" inputmode="decimal" aria-label="Credits">' +
    '<button type="button" class="gpa-del" aria-label="Remove course" onclick="removeRow(this)">×</button>';
  wrap.appendChild(d); bind(d); calculate();
}
function removeRow(btn) {
  const wrap = $('courseRows');
  if (wrap.children.length <= 1) return;
  btn.parentNode.remove(); calculate();
}
function bind(root) { root.querySelectorAll('input, select').forEach(function (el) { el.addEventListener('input', calculate); el.addEventListener('change', calculate); }); }

function calculate() {
  const rows = Array.prototype.slice.call(document.querySelectorAll('#courseRows .gpa-row'));
  let credits = 0, qpW = 0, qpU = 0, n = 0, honors = 0, ap = 0;
  const detail = [];
  rows.forEach(function (r, i) {
    const g = r.querySelector('.c-grade').value, lvl = r.querySelector('.c-level').value;
    const cr = parseFloat(r.querySelector('.c-credit').value);
    if (!(cr > 0)) return;
    const name = r.querySelector('.c-name').value.trim() || ('Course ' + (i + 1));
    const u = gv(g), w = u + bonus(lvl, g);
    credits += cr; qpU += u * cr; qpW += w * cr; n++;
    if (lvl === 'h') honors++; if (lvl === 'a') ap++;
    detail.push([name, g, lvl === 'h' ? 'Honors' : lvl === 'a' ? 'AP / IB' : 'Regular', cr, u, w]);
  });
  const warn = $('warnBox'); warn.style.display = 'none';
  if (!(credits > 0)) { showResults(false); return; }
  const wg = qpW / credits, ug = qpU / credits;

  $('resultLabel').textContent = 'Weighted GPA';
  $('resultValueDisplay').textContent = f2(wg);
  $('resultNote').textContent = 'Unweighted GPA: ' + f2(ug) + ' · ' + credits + ' credits · ' + n + ' courses';
  const body = detail.map(function (d) {
    return '<tr><td class="muted">' + d[0].replace(/</g, '&lt;') + ' (' + d[1] + ', ' + d[2] + (d[3] !== 1 ? ', ' + d[3] + ' cr' : '') + ')</td><td>' + f2(d[4]) + ' → ' + f2(d[5]) + '</td></tr>';
  }).join('');
  $('breakdownTableBody').innerHTML =
    '<tr class="sub-row"><td>Weighted GPA</td><td>' + f2(wg) + '</td></tr>' +
    '<tr class="sub-row"><td>Unweighted GPA</td><td>' + f2(ug) + '</td></tr>' +
    '<tr><td class="muted">Total credits</td><td>' + credits + '</td></tr>' +
    '<tr><td class="muted">Weighted quality points</td><td>' + f2(qpW) + '</td></tr>' +
    '<tr><td class="muted">Unweighted quality points</td><td>' + f2(qpU) + '</td></tr>' +
    '<tr><td class="muted">Honors / AP-IB courses</td><td>' + honors + ' / ' + ap + '</td></tr>' +
    '<tr><td class="muted">Boost from weighting</td><td>+' + f2(wg - ug) + '</td></tr>' +
    '<tr><th colspan="2" style="text-align:left;padding-top:.75rem">Per course: unweighted → weighted points</th></tr>' + body;

  const hb = parseFloat($('honorsBonus').value), ab = parseFloat($('apBonus').value);
  $('scaleTable').innerHTML = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map(function (g) {
    const u = gv(g);
    return '<tr><td>' + g + '</td><td>' + f2(u) + '</td><td>' + f2(u + (g === 'F' ? 0 : hb)) + '</td><td>' + f2(u + (g === 'F' ? 0 : ab)) + '</td></tr>';
  }).join('');
  showResults(true);
}

function clearForm() {
  const wrap = $('courseRows');
  while (wrap.children.length > 1) wrap.lastChild.remove();
  const r = wrap.firstChild;
  r.querySelector('.c-name').value = ''; r.querySelector('.c-grade').value = 'A'; r.querySelector('.c-level').value = 'r'; r.querySelector('.c-credit').value = 1;
  calculate();
}
document.addEventListener('DOMContentLoaded', function () {
  bind(document); calculate();
});
