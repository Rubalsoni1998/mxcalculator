// Federal Tax Refund Estimator (tax years 2026 and 2025)
// Sources: IRS Rev. Proc. 2025-32 (2026) and Rev. Proc. 2024-40 (2025), as amended by the One Big Beautiful Bill Act.
let state = { chart: null };

const RATES = [10, 12, 22, 24, 32, 35, 37];
const BRACKETS = {
  2026: {
    single: [12400, 50400, 105700, 201775, 256225, 640600],
    mfj:    [24800, 100800, 211400, 403550, 512450, 768700],
    mfs:    [12400, 50400, 105700, 201775, 256225, 384350],
    hoh:    [17700, 67450, 105700, 201750, 256200, 640600]
  },
  2025: {
    single: [11925, 48475, 103350, 197300, 250525, 626350],
    mfj:    [23850, 96950, 206700, 394600, 501050, 751600],
    mfs:    [11925, 48475, 103350, 197300, 250525, 375800],
    hoh:    [17000, 64850, 103350, 197300, 250500, 626350]
  }
};
const STD = { 2026: { single: 16100, mfj: 32200, mfs: 16100, hoh: 24150 }, 2025: { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625 } };
const EXTRA = { 2026: { single: 2050, mfj: 1650, mfs: 1650, hoh: 2050 }, 2025: { single: 2000, mfj: 1600, mfs: 1600, hoh: 2000 } };
const CTC = 2200, ODC = 500, ACTC_CAP = 1700;
const CTC_PHASE = { single: 200000, hoh: 200000, mfs: 200000, mfj: 400000 };

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
  calculate();
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
function taxOn(year, status, income) {
  const lim = BRACKETS[year][status];
  let tax = 0, prev = 0;
  for (let i = 0; i < RATES.length; i++) {
    const top = i < lim.length ? lim[i] : Infinity;
    if (income > prev) tax += (Math.min(income, top) - prev) * RATES[i] / 100;
    prev = top;
  }
  return Math.max(0, tax);
}
function num(id) { return Math.max(0, parseFloat($(id).value) || 0); }

function compute(v) {
  const joint = v.status === 'mfj', sep = v.status === 'mfs';
  const agi = Math.max(0, v.wages + v.other - v.adjust);
  const std = STD[v.year][v.status] + EXTRA[v.year][v.status] * v.seniors;
  const deduction = Math.max(std, v.itemized);
  const over = function (thr) { return Math.max(0, agi - thr); };
  // new deductions (not available to married filing separately)
  const senior = sep ? 0 : Math.max(0, 6000 * v.seniors - 0.06 * over(joint ? 150000 : 75000));
  const tips = sep ? 0 : Math.max(0, Math.min(v.tips, 25000) - 100 * Math.ceil(over(joint ? 300000 : 150000) / 1000));
  const ot = sep ? 0 : Math.max(0, Math.min(v.overtime, joint ? 25000 : 12500) - 100 * Math.ceil(over(joint ? 300000 : 150000) / 1000));
  const car = sep ? 0 : Math.max(0, Math.min(v.carInt, 10000) - 200 * Math.ceil(over(joint ? 200000 : 100000) / 1000));
  const taxable = Math.max(0, agi - deduction - senior - tips - ot - car);
  const tax = taxOn(v.year, v.status, taxable);

  const afterOther = Math.max(0, tax - v.credits);
  const otherUsed = tax - afterOther;
  const base = v.kids * CTC + v.deps * ODC;
  const reduction = Math.ceil(over(CTC_PHASE[v.status]) / 1000) * 50;
  const ctcAfter = Math.max(0, base - reduction);
  const nonref = Math.min(ctcAfter, afterOther);
  const unused = ctcAfter - nonref;
  const actc = v.kids > 0 ? Math.min(unused, v.kids * ACTC_CAP, 0.15 * Math.max(0, v.wages - 2500)) : 0;
  const totalTax = afterOther - nonref;
  const refundable = actc + v.eitc;
  const payments = v.withheld + v.estimated;
  const result = payments + refundable - totalTax;
  return { agi: agi, std: std, deduction: deduction, senior: senior, tips: tips, ot: ot, car: car, taxable: taxable, tax: tax, otherUsed: otherUsed,
    nonref: nonref, actc: actc, totalTax: totalTax, refundable: refundable, payments: payments, result: result, usedItemized: v.itemized > std };
}

function calculate() {
  if ($('wages').value === '' && $('other').value === '') { showResults(false); return; }
  const v = {
    year: $('taxYear').value, status: $('status').value, seniors: parseInt($('seniors').value, 10) || 0,
    wages: num('wages'), other: num('other'), adjust: num('adjust'), itemized: num('itemized'), tips: num('tips'), overtime: num('overtime'), carInt: num('carInt'),
    kids: Math.floor(num('kids')), deps: Math.floor(num('deps')), credits: num('credits'), eitc: num('eitc'), withheld: num('withheld'), estimated: num('estimated')
  };
  if (v.seniors === 2 && v.status !== 'mfj') v.seniors = 1;
  const r = compute(v);

  const refund = r.result >= 0;
  $('resultLabel').textContent = refund ? 'Estimated Federal Refund' : 'Estimated Amount You Owe';
  $('resultValueDisplay').textContent = money(Math.abs(r.result));
  $('resultNote').textContent = 'Total tax ' + money(r.totalTax) + ' vs ' + money(r.payments + r.refundable) + ' paid or refundable';

  const warn = $('warnBox');
  const msgs = [];
  if (!refund) msgs.push('You would owe tax. Consider raising your W-4 withholding or making an estimated payment to avoid a surprise or an underpayment penalty.');
  if (r.usedItemized) msgs.push('Your itemized deductions are larger than the standard deduction, so they were used.');
  warn.style.display = msgs.length ? 'block' : 'none';
  warn.textContent = msgs.join(' ');

  const extra = r.senior + r.tips + r.ot + r.car;
  const rows = [
    ['Adjusted gross income', money(r.agi)],
    ['Standard deduction' + (v.seniors ? ' (with age 65+ amount)' : ''), money(r.std)],
    ['Deduction used', money(r.deduction)],
    ['Senior, tips, overtime and car loan interest deductions', extra > 0 ? '− ' + money(extra) : '$0'],
    ['SUB:Taxable income', money(r.taxable)],
    ['Tax from brackets', money(r.tax)],
    ['Other non-refundable credits used', r.otherUsed > 0 ? '− ' + money(r.otherUsed) : '$0'],
    ['Child Tax Credit (non-refundable part)', r.nonref > 0 ? '− ' + money(r.nonref) : '$0'],
    ['SUB:Total federal income tax', money(r.totalTax)],
    ['Withholding and estimated payments', money(r.payments)],
    ['Additional Child Tax Credit (refundable)', money(r.actc)],
    ['Earned Income Credit (refundable)', money(v.eitc)],
    ['SUB:' + (refund ? 'Refund' : 'Amount owed'), money(Math.abs(r.result))],
    ['Effective tax rate on AGI', r.agi > 0 ? (r.totalTax / r.agi * 100).toFixed(1) + '%' : '0%']
  ];
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(r);
}

function drawChart(r) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(r); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: ['Total tax', 'Withholding + estimated', 'Refundable credits'], datasets: [{ data: [Math.round(r.totalTax), Math.round(r.payments), Math.round(r.refundable)],
      backgroundColor: ['hsl(0, 70%, 62%)', 'hsl(215, 70%, 45%)', 'hsl(150, 55%, 42%)'], borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw); } } } },
      scales: { y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } } }
  });
}

function clearForm() {
  ['wages', 'other', 'adjust', 'itemized', 'tips', 'overtime', 'carInt', 'credits', 'eitc', 'withheld', 'estimated', 'kids', 'deps'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
