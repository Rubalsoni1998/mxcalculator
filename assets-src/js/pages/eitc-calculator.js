// Earned Income Tax Credit (EITC) Calculator (US federal, tax years 2026 and 2025)
// Sources: IRS Rev. Proc. 2025-32 (tax year 2026) and Rev. Proc. 2024-40 (tax year 2025); IRS EITC tables page, updated Nov 16, 2026.
let state = { chart: null };

// Index = number of qualifying children (3 means "3 or more").
const PARAMS = {
  2026: {
    earnedAmt: [8680, 13020, 18290, 18290],
    maxCredit: [664, 4427, 7316, 8231],
    phaseInRate: [0.0765, 0.34, 0.40, 0.45],
    phaseOutRate: [0.0765, 0.1598, 0.2106, 0.2106],
    thrSingle: [10860, 23890, 23890, 23890],
    thrJoint: [18140, 31160, 31160, 31160],
    limitSingle: [19540, 51593, 58629, 62974],
    limitJoint: [26820, 58863, 65899, 70244],
    investLimit: 12200
  },
  2025: {
    earnedAmt: [8490, 12730, 17880, 17880],
    maxCredit: [649, 4328, 7152, 8046],
    phaseInRate: [0.0765, 0.34, 0.40, 0.45],
    phaseOutRate: [0.0765, 0.1598, 0.2106, 0.2106],
    thrSingle: [10620, 23350, 23350, 23350],
    thrJoint: [17730, 30470, 30470, 30470],
    limitSingle: [19104, 50434, 57310, 61555],
    limitJoint: [26214, 57554, 64430, 68675],
    investLimit: 11950
  }
};
const KID_LABEL = ['No qualifying children', '1 qualifying child', '2 qualifying children', '3 or more qualifying children'];

document.addEventListener('DOMContentLoaded', function () {
  onKidsChange();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
  $('kids').addEventListener('change', onKidsChange);
});

function $(id) { return document.getElementById(id); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function onKidsChange() {
  const k = $('kids').value === '0';
  document.querySelectorAll('.age-group').forEach(function (e) { e.style.display = k ? '' : 'none'; });
}

// Credit for a given earned income / AGI. Both phase-in and phase-out are applied and the smaller result is the credit.
function creditFor(p, k, joint, earned, agi) {
  const thr = (joint ? p.thrJoint : p.thrSingle)[k];
  const phaseIn = Math.min(p.maxCredit[k], p.phaseInRate[k] * Math.min(earned, p.earnedAmt[k]));
  const higher = Math.max(agi, earned);
  const phaseOut = Math.max(0, p.maxCredit[k] - p.phaseOutRate[k] * Math.max(0, higher - thr));
  return Math.max(0, Math.min(phaseIn, phaseOut));
}

function calculate() {
  const p = PARAMS[$('taxYear').value];
  const joint = $('status').value === 'mfj';
  const k = parseInt($('kids').value, 10);
  const earned = parseFloat($('earned').value);
  const agi = parseFloat($('agi').value);
  const invest = parseFloat($('invest').value) || 0;
  const age = parseFloat($('age').value);
  const eligibleRules = $('qualify').checked;
  if (!(earned >= 0) || !(agi >= 0)) { showResults(false); return; }

  const limit = (joint ? p.limitJoint : p.limitSingle)[k];
  const thr = (joint ? p.thrJoint : p.thrSingle)[k];
  const higher = Math.max(agi, earned);

  let reason = '';
  if (!eligibleRules) reason = 'You must meet the Social Security number, residency and dependent rules to claim the credit.';
  else if (invest > p.investLimit) reason = 'Your investment income is over the ' + money(p.investLimit) + ' limit, so you cannot claim the credit.';
  else if (earned <= 0) reason = 'You need earned income from work to claim the credit.';
  else if (k === 0 && !(age >= 25 && age < 65)) reason = 'With no qualifying children you must be at least 25 and under 65 (either spouse can meet this on a joint return).';
  else if (higher >= limit) reason = 'Your income is at or above the ' + money(limit) + ' limit for this filing status and family size.';

  const credit = reason ? 0 : Math.round(creditFor(p, k, joint, earned, agi));
  const stage = earned < p.earnedAmt[k] && higher <= thr ? 'phase-in' : (higher > thr ? 'phase-out' : 'maximum range');

  $('resultLabel').textContent = 'Estimated EITC for Tax Year ' + $('taxYear').value;
  $('resultValueDisplay').textContent = money(credit);
  $('resultNote').textContent = reason ? 'Not eligible with these numbers' :
    (credit === p.maxCredit[k] ? 'You are at the maximum credit' : 'Maximum for your family size is ' + money(p.maxCredit[k]) + ' (you are in the ' + stage + ' range)');

  const warn = $('warnBox');
  if (reason) { warn.style.display = 'block'; warn.textContent = reason; } else warn.style.display = 'none';

  const rows = [
    ['Tax year / filing status', $('taxYear').value + ' / ' + (joint ? 'Married filing jointly' : 'Single, HOH or widowed')],
    ['Qualifying children', KID_LABEL[k]],
    ['Earned income', money(earned)],
    ['AGI', money(agi)],
    ['Income used for phase-out (higher of the two)', money(higher)],
    ['Credit at full earned income amount (' + money(p.earnedAmt[k]) + ')', money(p.maxCredit[k])],
    ['Phase-out begins at', money(thr)],
    ['Credit ends at', money(limit)],
    ['Investment income limit', money(p.investLimit)],
    ['SUB:Estimated EITC (refundable)', money(credit)]
  ];
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('maxTableBody').innerHTML = [0, 1, 2, 3].map(function (i) {
    const lim = (joint ? p.limitJoint : p.limitSingle)[i];
    const cur = i === k ? ' style="font-weight:700"' : '';
    return '<tr' + cur + '><td>' + (i === 3 ? '3 or more' : (i === 0 ? 'None' : i)) + '</td><td>' + money(p.maxCredit[i]) + '</td><td>' + money(lim) + '</td></tr>';
  }).join('');

  // chart: credit as income rises (earned income = AGI)
  const labels = [], data = [];
  const top = Math.ceil((limit * 1.08) / 5000) * 5000;
  const stepSize = top / 24;
  for (let x = 0; x <= top; x += stepSize) {
    labels.push('$' + Math.round(x / 100) * 100 / 1000 + 'k');
    data.push(Math.round(creditFor(p, k, joint, x, x)));
  }
  showResults(true);
  drawChart(labels, data, earned, top);
}

function drawChart(labels, data) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(labels, data); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: [{ label: 'EITC', data: data, borderColor: 'hsl(180, 100%, 30%)', backgroundColor: 'hsla(180, 100%, 30%, 0.15)', fill: true, tension: 0.15, pointRadius: 0, borderWidth: 2.5 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: function (c) { return 'Income ' + c[0].label; }, label: function (c) { return 'Credit: ' + money(c.raw); } } } },
      scales: { x: { ticks: { maxTicksLimit: 8 } }, y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } } }
  });
}

function clearForm() {
  ['earned', 'agi', 'invest'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
