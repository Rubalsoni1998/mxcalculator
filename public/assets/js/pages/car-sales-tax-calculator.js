// Car Sales Tax Calculator (all 50 states, 2026 rules)
// Source: state revenue department and motor vehicle agency guidance, as compiled by CarSalesTax.com (checked Oct 30, 2026).
// Rates are state-level; local tax is entered by the user where the state allows it.
let state = { chart: null };

// [state, state rate %, trade-in rule, has local tax, tax name, note, special]
// trade-in rule: full | none | dealer (dealer sales only) | cap (limited to $12,000) | newonly | na (no tax to reduce)
const STATES = [
  ['Alabama', 2, 'full', true, 'Sales tax', 'Reduced 2% state automotive rate; county and city tax added at registration.', ''],
  ['Alaska', 0, 'na', true, 'No state sales tax', 'About 110 cities and boroughs levy 1% to 7%; many cap the tax on a vehicle.', ''],
  ['Arizona', 5.6, 'full', true, 'Transaction privilege tax', 'County and city rates are added.', ''],
  ['Arkansas', 6.5, 'full', true, 'Sales tax', 'Used vehicles under $4,000 are exempt; $4,000 to $9,999 pay a 3.5% state rate.', ''],
  ['California', 7.25, 'none', true, 'Sales and use tax', 'District taxes bring the total to 7.25% to 11.75%.', ''],
  ['Colorado', 2.9, 'full', true, 'Sales tax', 'County, city and district taxes of your registration address are added.', ''],
  ['Connecticut', 6.35, 'full', false, 'Sales and use tax', '7.75% on vehicles over $50,000 (price before trade-in).', 'ct'],
  ['Delaware', 5.25, 'full', false, 'Document fee (no sales tax)', 'Charged on the higher of the price or the NADA trade-in value.', ''],
  ['Florida', 6, 'full', true, 'Sales tax', 'County surtax of up to 2% applies to the first $5,000 only.', 'fl'],
  ['Georgia', 7, 'dealer', false, 'Title ad valorem tax (no sales tax)', 'Charged on fair market value, not the price; 3% for new residents.', ''],
  ['Hawaii', 4, 'none', true, 'General excise tax', 'Trade-in treatment is not stated in state guidance, so no credit is applied. County surcharge of 0.5%.', ''],
  ['Idaho', 6, 'dealer', false, 'Sales tax', 'A trade-in counts only on a dealer sale in the same transaction.', ''],
  ['Illinois', 6.25, 'dealer', true, 'Sales tax', 'Private sales pay a flat vehicle use tax by price and age (Form RUT-50) instead.', ''],
  ['Indiana', 7, 'full', false, 'Sales tax', '', ''],
  ['Iowa', 5, 'full', false, 'Fee for new registration (no sales tax)', 'A trade-in counts when the same people own both vehicles.', ''],
  ['Kansas', 6.5, 'full', true, 'Sales tax', 'The higher of the dealer\'s or your home local rate applies.', ''],
  ['Kentucky', 6, 'full', false, 'Motor vehicle usage tax', '', ''],
  ['Louisiana', 5, 'full', true, 'Sales tax', 'Rose to 5% in 2025; parish and city tax of your home is added.', ''],
  ['Maine', 5.5, 'full', false, 'Sales tax', '', ''],
  ['Maryland', 6.5, 'full', false, 'Vehicle excise tax', 'Raised from 6% on July 1, 2025.', ''],
  ['Massachusetts', 6.25, 'dealer', false, 'Sales and use tax', 'Private sales are taxed on the higher of the price or the NADA trade-in value.', ''],
  ['Michigan', 6, 'cap', false, 'Sales tax', 'The trade-in credit is limited to $12,000 in 2026.', ''],
  ['Minnesota', 6.875, 'full', false, 'Motor vehicle sales tax', 'Some cities and counties add a $20 excise tax.', ''],
  ['Mississippi', 5, 'full', false, 'Sales tax', 'County ad valorem tax is due at the tag office.', ''],
  ['Missouri', 4.225, 'full', true, 'Sales tax', 'Local tax of where you live, not where you buy.', ''],
  ['Montana', 0, 'na', false, 'No sales tax', 'Registration fees depend on vehicle age, plus a county option tax.', ''],
  ['Nebraska', 5.5, 'full', true, 'Sales tax', 'Local tax of 0.5% to 2% by registration address.', ''],
  ['Nevada', 6.85, 'full', true, 'Sales tax', 'Rate of the county where the sale happens (Clark County is 8.375%).', ''],
  ['New Hampshire', 0, 'na', false, 'No sales tax', '', ''],
  ['New Jersey', 6.625, 'full', false, 'Sales tax', 'New cars of $45,000 or more, or under 19 mpg, also pay a 0.4% surcharge.', ''],
  ['New Mexico', 4, 'full', false, 'Motor vehicle excise tax', 'Used cars: the higher of the price or 80% of NADA value.', ''],
  ['New York', 4, 'full', true, 'Sales tax', 'Local rate of your home brings the total to 7% to 8.875%.', ''],
  ['North Carolina', 3, 'full', false, 'Highway use tax', '', ''],
  ['North Dakota', 5, 'full', false, 'Motor vehicle excise tax', '', ''],
  ['Ohio', 5.75, 'newonly', true, 'Sales tax', 'County rate of your home is added (8.75% at most). A trade-in counts only on a new vehicle.', ''],
  ['Oklahoma', 4.5, 'none', false, 'Excise tax + sales tax', '3.25% vehicle excise tax plus 1.25% sales tax.', ''],
  ['Oregon', 0, 'na', false, 'No sales tax', '0.5% privilege or use tax on new vehicles only.', 'or'],
  ['Pennsylvania', 6, 'full', true, 'Sales tax', '7% in Allegheny County and 8% in Philadelphia (enter 1 or 2 as the local rate).', ''],
  ['Rhode Island', 7, 'full', false, 'Sales tax', '', ''],
  ['South Carolina', 5, 'na', false, 'Infrastructure maintenance fee (no sales tax)', 'Capped at $500; $250 flat for a car brought from another state.', 'sc'],
  ['South Dakota', 4, 'full', false, 'Motor vehicle excise tax', '', ''],
  ['Tennessee', 7, 'full', true, 'Sales tax', 'Local tax applies to the first $1,600 only, plus 2.75% state tax on the next $1,600.', 'tn'],
  ['Texas', 6.25, 'full', false, 'Motor vehicle sales tax', 'Private sales are taxed on at least 80% of the standard presumptive value.', ''],
  ['Utah', 4.85, 'full', true, 'Sales tax', 'Mandatory local taxes bring the total to about 6% to 7%.', ''],
  ['Vermont', 6, 'full', false, 'Purchase and use tax', 'On the higher of the price or the J.D. Power clean trade-in value.', ''],
  ['Virginia', 4.15, 'none', false, 'Motor vehicle sales and use tax', '$75 minimum. Rebates reduce the taxable price but a trade-in does not.', 'va'],
  ['Washington', 7, 'full', true, 'Sales tax + motor vehicle sales tax', '6.5% state rate plus a 0.5% motor vehicle sales tax (since Jan 1, 2026), plus local tax.', ''],
  ['West Virginia', 6, 'full', false, 'Motor vehicle sales tax', 'The trade-in must be titled in West Virginia.', ''],
  ['Wisconsin', 5, 'full', true, 'Sales tax', 'County (and Milwaukee city) tax of where the car is kept.', ''],
  ['Wyoming', 4, 'full', true, 'Sales tax', 'County tax of your home, paid to the county treasurer.', '']
];

const RULE_TEXT = {
  full: 'Full trade-in credit', none: 'No trade-in credit (tax on full price)', dealer: 'Credit on dealer sales only',
  cap: 'Credit capped at $12,000', newonly: 'Credit on new vehicles only', na: 'No tax to reduce'
};

document.addEventListener('DOMContentLoaded', function () {
  $('state').innerHTML = STATES.map(function (s, i) { return '<option value="' + i + '">' + s[0] + ' (' + fmt(s[1]) + '%)</option>'; }).join('');
  $('state').value = String(STATES.findIndex(function (s) { return s[0] === 'Texas'; }));
  onStateChange();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function fmt(n) { return String(Math.round(n * 1000) / 1000); }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function onStateChange() {
  const s = STATES[parseInt($('state').value, 10)];
  document.querySelectorAll('.local-group').forEach(function (e) { e.style.display = s[3] ? '' : 'none'; });
  document.querySelectorAll('.trade-group').forEach(function (e) { e.style.display = $('seller').value === 'dealer' ? '' : 'none'; });
  calculate();
}

// Returns { credit, taxable, stateRate, stateTax, localTax, extra }
function taxFor(s, price, trade, seller, cond, localPct) {
  let credit = 0;
  if (seller === 'dealer' && trade > 0) {
    if (s[2] === 'full' || s[2] === 'dealer') credit = Math.min(trade, price);
    else if (s[2] === 'cap') credit = Math.min(trade, price, 12000);
    else if (s[2] === 'newonly' && cond === 'new') credit = Math.min(trade, price);
  }
  // private sales: no trade-in is part of the deal
  const taxable = Math.max(0, price - credit);
  let rate = s[1];
  if (s[6] === 'ct' && price > 50000) rate = 7.75;
  let stateTax = taxable * rate / 100;
  let extra = 0;
  if (s[6] === 'or') { rate = cond === 'new' ? 0.5 : 0; stateTax = price * rate / 100; }
  if (s[6] === 'sc') { stateTax = Math.min(500, taxable * rate / 100); }
  if (s[6] === 'va') { stateTax = price > 0 ? Math.max(75, taxable * rate / 100) : 0; }
  let localTax = 0;
  const lp = s[3] ? localPct : 0;
  if (s[6] === 'fl') localTax = Math.min(taxable, 5000) * lp / 100;
  else if (s[6] === 'tn') { localTax = Math.min(taxable, 1600) * lp / 100; extra = Math.max(0, Math.min(taxable - 1600, 1600)) * 0.0275; }
  else localTax = taxable * lp / 100;
  return { credit: credit, taxable: taxable, stateRate: rate, stateTax: stateTax, localTax: localTax, extra: extra, total: stateTax + localTax + extra };
}

function calculate() {
  const s = STATES[parseInt($('state').value, 10)];
  const price = parseFloat($('price').value);
  const trade = parseFloat($('trade').value) || 0;
  const localPct = parseFloat($('local').value) || 0;
  const doc = parseFloat($('docFee').value) || 0;
  const seller = $('seller').value, cond = $('condition').value;
  if (!(price > 0)) { showResults(false); return; }

  const t = taxFor(s, price, trade, seller, cond, localPct);
  const noTrade = taxFor(s, price, 0, seller, cond, localPct);
  const saved = Math.max(0, noTrade.total - t.total);
  const out = price - (seller === 'dealer' ? Math.min(trade, price) : 0) + t.total + doc;

  $('resultLabel').textContent = 'Estimated Sales Tax in ' + s[0];
  $('resultValueDisplay').textContent = money(t.total);
  $('resultNote').textContent = 'Effective rate ' + (t.total / price * 100).toFixed(2) + '% of the vehicle price' + (saved > 0 ? ' · trade-in saves ' + money(saved) : '');

  const warn = $('warnBox');
  const msgs = [];
  if (s[3] && localPct === 0) msgs.push(s[0] + ' allows local sales tax. Enter your county or city rate for a closer estimate.');
  if (seller === 'dealer' && trade > 0 && saved === 0 && s[2] !== 'na') msgs.push(RULE_TEXT[s[2]] + ' in ' + s[0] + (s[2] === 'newonly' && cond === 'used' ? ' (you chose a used vehicle)' : '') + ', so your trade-in does not lower the tax.');
  if (s[5]) msgs.push(s[5]);
  warn.style.display = msgs.length ? 'block' : 'none';
  warn.innerHTML = msgs.map(function (m) { return m.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }).join('<br>');

  const rows = [
    ['State', s[0] + ' (' + s[4] + ')'],
    ['Vehicle price', money(price)],
    ['Trade-in credit applied', t.credit > 0 ? '− ' + money(t.credit) : '$0.00'],
    ['Taxable amount', money(t.taxable)],
    ['State rate' + (s[6] === 'sc' ? ' (capped at $500)' : ''), fmt(t.stateRate) + '%'],
    ['State tax', money(t.stateTax)],
    ['Local tax' + (s[3] ? ' (' + fmt(localPct) + '%)' : ''), s[3] ? money(t.localTax) : 'None'],
  ];
  if (t.extra > 0) rows.push(['Single-article tax (Tennessee)', money(t.extra)]);
  rows.push(['SUB:Total sales tax', money(t.total)]);
  if (doc > 0) rows.push(['Dealer documentation fee', money(doc)]);
  rows.push(['Out-the-door cost after trade-in (tax and doc fee, no title or registration)', money(out)]);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  // compare all states at state level only
  const all = STATES.map(function (st) { const r = taxFor(st, price, trade, seller, cond, 0); return { name: st[0], rate: r.total / price * 100, tax: r.total }; });
  const sorted = all.slice().sort(function (a, b) { return b.tax - a.tax; });
  const picks = sorted.slice(0, 5).concat(sorted.slice(-5));
  $('compareBody').innerHTML = picks.map(function (p) {
    const mine = p.name === s[0] ? ' style="font-weight:700"' : '';
    return '<tr' + mine + '><td>' + p.name + '</td><td>' + p.rate.toFixed(2) + '%</td><td>' + money(p.tax) + '</td></tr>';
  }).join('') + '<tr><td colspan="3" class="muted">State-level tax only, with no local tax added.</td></tr>';

  showResults(true);
  drawChart(picks, s[0]);
}

function drawChart(picks, mine) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(picks, mine); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: picks.map(function (p) { return p.name; }), datasets: [{ label: 'State sales tax', data: picks.map(function (p) { return Math.round(p.tax); }),
      backgroundColor: picks.map(function (p) { return p.name === mine ? 'hsl(180, 100%, 30%)' : 'hsl(215, 70%, 45%)'; }), borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return money(c.raw, 0); } } } },
      scales: { x: { ticks: { maxRotation: 60, minRotation: 40 } }, y: { ticks: { callback: function (v) { return '$' + v.toLocaleString('en-US'); } } } } }
  });
}

function clearForm() {
  ['price', 'trade', 'docFee'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
