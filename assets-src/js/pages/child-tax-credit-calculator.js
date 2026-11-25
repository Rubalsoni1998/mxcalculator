// Child Tax Credit Calculator (US federal, tax year 2026)
// Sources: IRS Rev. Proc. 2025-32, IRC section 24 as amended by the One Big Beautiful Bill Act.
let state = { chart: null };

const CTC_PER_CHILD = 2200;     // maximum credit per qualifying child under 17 (tax years 2025 and 2026)
const ACTC_CAP = 1700;          // maximum refundable portion per child for 2026
const ODC = 500;                // credit for other dependents (non-refundable)
const PHASE_START = { single: 200000, hoh: 200000, mfs: 200000, mfj: 400000 };

document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function calculate() {
  const status = $('filingStatus').value;
  const kids = parseInt($('children').value, 10) || 0;
  const others = parseInt($('otherDeps').value, 10) || 0;
  const magi = parseFloat($('magi').value);
  const earned = parseFloat($('earned').value);
  const taxBefore = parseFloat($('taxBefore').value);

  if (!(magi >= 0) || !(earned >= 0) || !(taxBefore >= 0)) { showResults(false); return; }

  const base = kids * CTC_PER_CHILD + others * ODC;
  const over = Math.max(0, magi - PHASE_START[status]);
  const reduction = Math.ceil(over / 1000) * 50;         // $50 for each $1,000 (or part) over the threshold
  const afterPhase = Math.max(0, base - reduction);

  // non-refundable part: limited by income tax owed
  const nonref = Math.min(afterPhase, taxBefore);
  // refundable part (Additional Child Tax Credit)
  const unused = afterPhase - nonref;
  const cap = kids * ACTC_CAP;
  const earnedLimit = Math.max(0, 0.15 * (earned - 2500));
  const actc = kids > 0 ? Math.min(unused, cap, earnedLimit) : 0;
  const total = nonref + actc;

  $('resultLabel').textContent = 'Estimated Child Tax Credit';
  $('resultValueDisplay').textContent = money(total, 0);
  $('resultNote').textContent = base === 0 ? 'Add a qualifying child to see your credit'
    : (afterPhase === 0 ? 'Your income is above the phase-out range, so the credit is $0'
      : money(nonref, 0) + ' reduces your tax + ' + money(actc, 0) + ' refundable');

  const warn = $('warnBox');
  if (reduction > 0 && afterPhase > 0) {
    warn.style.display = 'block';
    warn.textContent = 'Your income is above ' + money(PHASE_START[status], 0) + ', so the credit is reduced by ' + money(reduction, 0) + ' ($50 for every $1,000 over).';
  } else if (unused > actc && kids > 0) {
    warn.style.display = 'block';
    warn.textContent = money(unused - actc, 0) + ' of the credit is lost because it is above your tax owed and above the refundable limit (max $1,700 per child, and 15% of earnings over $2,500).';
  } else warn.style.display = 'none';

  const rows = [
    ['Qualifying children (under 17, with SSN)', kids + ' × ' + money(CTC_PER_CHILD, 0) + ' = ' + money(kids * CTC_PER_CHILD, 0)],
    ['Other dependents', others + ' × ' + money(ODC, 0) + ' = ' + money(others * ODC, 0)],
    ['SUB:Credit before income phase-out', money(base, 0)],
    ['Phase-out reduction', reduction > 0 ? '− ' + money(Math.min(reduction, base), 0) : '$0'],
    ['Credit after phase-out', money(afterPhase, 0)],
    ['Reduces your federal income tax (non-refundable)', money(nonref, 0)],
    ['Refundable Additional Child Tax Credit', money(actc, 0)],
    ['SUB:Total credit', money(total, 0)],
    ['Your tax after the credit', money(Math.max(0, taxBefore - nonref), 0)],
    ['Refund added from the credit', money(actc, 0)]
  ];
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(nonref, actc, Math.max(0, base - afterPhase), Math.max(0, unused - actc));
}

function drawChart(nonref, actc, phased, lost) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(nonref, actc, phased, lost); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Lowers your tax', 'Refundable (ACTC)', 'Lost to phase-out', 'Unusable portion'],
      datasets: [{ data: [nonref, actc, phased, lost], backgroundColor: ['hsl(215, 70%, 40%)', 'hsl(150, 55%, 42%)', 'hsl(0, 70%, 62%)', 'hsl(215, 15%, 70%)'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: function (c) { return c.label + ': ' + money(c.raw, 0); } } } } }
  });
}

function clearForm() {
  ['children', 'otherDeps', 'magi', 'earned', 'taxBefore'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
