// Closing Cost Calculator (US home purchase)
// Title/settlement/government % by state: LodeStar 2025/2026 closing cost reports (as published by Bankrate, Nov 2026).
// These percentages cover title, settlement and government charges only, not lender fees or agent commissions.
// Default rate: Freddie Mac PMMS 30-year fixed average, 7.28% (week of Nov 19, 2026).
let state = { chart: null };

const FHA_UFMIP = 1.75;                                    // upfront FHA mortgage insurance premium, % of base loan
function vaFee(downPct) { return downPct >= 10 ? 1.25 : (downPct >= 5 ? 1.5 : 2.15); }   // first use, regular military

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
  d = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function num(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }

function onLocationChange() {
  const v = $('location').value;
  if (v !== 'custom') $('titlePct').value = v;
  calculate();
}

function calculate() {
  const price = parseFloat($('price').value);
  const dp = parseFloat($('downPct').value);
  const rate = parseFloat($('rate').value);
  if (!(price > 0) || !(dp >= 0) || dp >= 100 || !(rate >= 0)) { showResults(false); return; }

  const loanType = $('loanType').value;
  const down = price * dp / 100;
  const baseLoan = price - down;

  const origination = baseLoan * num('origPct') / 100;
  const points = baseLoan * num('points') / 100;
  const thirdParty = num('thirdParty');
  const titleGov = price * num('titlePct') / 100;

  const insurance = num('insurance');                       // 12 months paid at closing
  const taxMonths = num('taxMonths');
  const annualTax = price * num('taxRate') / 100;
  const taxEscrow = annualTax / 12 * taxMonths;
  const prepaidInterest = baseLoan * rate / 100 / 365 * num('interestDays');

  let upfrontMI = 0, upfrontLabel = 'Upfront mortgage insurance / funding fee';
  if (loanType === 'fha') { upfrontMI = baseLoan * FHA_UFMIP / 100; upfrontLabel = 'FHA upfront mortgage insurance (1.75%)'; }
  if (loanType === 'va') { upfrontMI = baseLoan * vaFee(dp) / 100; upfrontLabel = 'VA funding fee (' + vaFee(dp) + '%, first use)'; }
  const financeMI = $('financeMI').checked && upfrontMI > 0;

  const seller = num('sellerCredit');
  const lender = origination + points;
  const prepaids = insurance + taxEscrow + prepaidInterest;
  const cashItems = lender + thirdParty + titleGov + prepaids + (financeMI ? 0 : upfrontMI);
  const closingTotal = Math.max(0, cashItems + (financeMI ? upfrontMI : 0));
  const closingCash = Math.max(0, cashItems - seller);
  const cashToClose = down + closingCash;
  const pct = closingTotal / price * 100;
  const finalLoan = baseLoan + (financeMI ? upfrontMI : 0);

  $('resultLabel').textContent = 'Estimated Closing Costs';
  $('resultValueDisplay').textContent = money(closingTotal);
  $('resultNote').textContent = 'About ' + pct.toFixed(2) + '% of the purchase price · cash needed at closing: ' + money(cashToClose);

  const warn = $('warnBox');
  if (loanType === 'fha' && dp < 3.5) { warn.style.display = 'block'; warn.textContent = 'FHA loans require at least 3.5% down for most borrowers.'; }
  else if (loanType === 'conv' && dp < 3) { warn.style.display = 'block'; warn.textContent = 'Most conventional loans require at least 3% down.'; }
  else warn.style.display = 'none';

  const rows = [
    ['Purchase price', money(price)],
    ['Down payment (' + dp + '%)', money(down)],
    ['Loan amount' + (financeMI ? ' (incl. financed fee)' : ''), money(finalLoan)],
    ['SUB:Lender fees', money(lender)],
    ['Origination / underwriting', money(origination)],
    ['Discount points', money(points)],
    ['SUB:Third-party &amp; title', money(thirdParty + titleGov)],
    ['Appraisal, credit, inspection, survey', money(thirdParty)],
    ['Title, settlement &amp; government charges', money(titleGov)],
    ['SUB:Prepaids &amp; escrow', money(prepaids)],
    ['Homeowners insurance (12 mo.)', money(insurance)],
    ['Property tax escrow (' + taxMonths + ' mo.)', money(taxEscrow)],
    ['Prepaid interest (' + num('interestDays') + ' days)', money(prepaidInterest)]
  ];
  if (upfrontMI > 0) rows.push([upfrontLabel + (financeMI ? ' – financed' : ''), money(upfrontMI)]);
  if (seller > 0) rows.push(['Seller credit', '− ' + money(seller)]);
  rows.push(['SUB:Total closing costs', money(closingTotal)]);
  rows.push(['Cash to close (down payment + costs after credit)', money(cashToClose)]);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart([lender, thirdParty, titleGov, prepaids, upfrontMI]);
}

function drawChart(data) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(data); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Lender fees', 'Appraisal & other third party', 'Title & government', 'Prepaids & escrow', 'Upfront mortgage insurance'],
      datasets: [{ data: data, backgroundColor: ['hsl(215, 70%, 40%)', 'hsl(190, 60%, 50%)', 'hsl(150, 50%, 45%)', 'hsl(38, 90%, 55%)', 'hsl(340, 60%, 55%)'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: function (c) { return c.label + ': ' + money(c.raw); } } } } }
  });
}

function clearForm() {
  ['price', 'downPct', 'sellerCredit'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
