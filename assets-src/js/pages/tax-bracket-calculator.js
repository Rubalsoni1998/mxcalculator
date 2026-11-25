// Tax Bracket Calculator (US federal income tax, tax years 2026 and 2025)
// Sources: IRS Rev. Proc. 2025-32 (2026) and Rev. Proc. 2024-40 (2025), as amended by the One Big Beautiful Bill Act.
let state = { chart: null };

const RATES = [10, 12, 22, 24, 32, 35, 37];
// Upper limit of each of the first six brackets, by tax year and filing status.
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
const STD = {
  2026: { single: 16100, mfj: 32200, mfs: 16100, hoh: 24150 },
  2025: { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625 }
};
// Extra standard deduction per person who is 65+ or blind
const EXTRA = {
  2026: { single: 2050, mfj: 1650, mfs: 1650, hoh: 2050 },
  2025: { single: 2000, mfj: 1600, mfs: 1600, hoh: 2000 }
};
const STATUS_NAME = { single: 'Single', mfj: 'Married filing jointly', mfs: 'Married filing separately', hoh: 'Head of household' };

document.addEventListener('DOMContentLoaded', function () {
  onModeChange();
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
function pct(v) { return isFinite(v) ? v.toFixed(2) + '%' : '–'; }
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function calculate() {
  const year = $('taxYear').value;
  const status = $('filingStatus').value;
  const mode = $('incomeMode').value;
  const income = parseFloat($('income').value);
  const preTax = parseFloat($('preTax').value) || 0;
  const people = parseInt($('extraCount').value, 10) || 0;
  const customDed = parseFloat($('customDeduction').value);

  if (!(income >= 0)) { showResults(false); return; }

  const limits = BRACKETS[year][status];
  const stdBase = STD[year][status] + people * EXTRA[year][status];
  let deduction = 0, taxable;
  if (mode === 'taxable') {
    taxable = income;
  } else {
    deduction = customDed > 0 ? customDed : stdBase;
    taxable = Math.max(0, income - preTax - deduction);
  }

  // walk the brackets
  const rows = [];
  let remaining = taxable, lower = 0, tax = 0, marginal = 10, nextTop = null;
  for (let i = 0; i < RATES.length; i++) {
    const upper = i < limits.length ? limits[i] : Infinity;
    const slice = Math.max(0, Math.min(taxable, upper) - lower);
    const t = slice * RATES[i] / 100;
    rows.push({ rate: RATES[i], from: lower, to: upper, slice: slice, tax: t });
    if (taxable > lower) { marginal = RATES[i]; nextTop = isFinite(upper) ? upper : null; }
    tax += t;
    lower = upper;
  }
  if (taxable === 0) { marginal = 10; nextTop = limits[0]; }
  const effTaxable = taxable > 0 ? tax / taxable * 100 : 0;
  const grossBase = mode === 'gross' ? income : taxable;
  const effGross = grossBase > 0 ? tax / grossBase * 100 : 0;
  const toNext = nextTop !== null ? Math.max(0, nextTop - taxable) : null;

  $('resultLabel').textContent = 'Estimated Federal Income Tax (' + year + ')';
  $('resultValueDisplay').textContent = money(tax);
  $('resultNote').textContent = 'You are in the ' + marginal + '% bracket. Average rate on taxable income: ' + pct(effTaxable);

  const out = [['Tax year / filing status', year + ' · ' + STATUS_NAME[status]]];
  if (mode === 'gross') {
    out.push(['Gross income', money(income)]);
    if (preTax > 0) out.push(['Pre-tax deductions', '− ' + money(preTax)]);
    out.push([customDed > 0 ? 'Deduction used (your amount)' : 'Standard deduction' + (people ? ' (incl. 65+/blind add-on)' : ''), '− ' + money(deduction)]);
  }
  out.push(['SUB:Taxable income', money(taxable)]);
  out.push(['Federal income tax', money(tax)]);
  out.push(['Marginal tax rate', marginal + '%']);
  out.push(['Effective rate (of taxable income)', pct(effTaxable)]);
  if (mode === 'gross') out.push(['Effective rate (of gross income)', pct(effGross)]);
  out.push(['Income left in current bracket', toNext === null ? 'Top bracket' : money(toNext, 0)]);
  if (mode === 'gross') out.push(['Left after federal tax &amp; pre-tax deductions', money(income - tax - preTax)]);
  $('breakdownTableBody').innerHTML = out.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  $('bracketTableBody').innerHTML = rows.map(function (r) {
    const active = r.slice > 0;
    return '<tr' + (active ? ' class="sub-row"' : '') + '><td>' + r.rate + '%</td><td>' + money(r.from, 0) + (isFinite(r.to) ? ' – ' + money(r.to, 0) : ' and up') +
      '</td><td>' + money(r.slice, 0) + '</td><td>' + money(r.tax, 0) + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(rows);
}

function drawChart(rows) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(rows); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rows.map(function (r) { return r.rate + '%'; }),
      datasets: [{ label: 'Tax paid in bracket', data: rows.map(function (r) { return Math.round(r.tax); }), backgroundColor: 'hsl(215, 70%, 45%)', borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw, 0); } } } },
      scales: { y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } }
    }
  });
}

function onModeChange() {
  const gross = $('incomeMode').value === 'gross';
  document.querySelectorAll('.gross-only').forEach(function (el) { el.style.display = gross ? '' : 'none'; });
  calculate();
}

function clearForm() {
  ['income', 'preTax', 'customDeduction'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
