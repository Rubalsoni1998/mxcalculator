// PMI Calculator
let state = { chart: null };

// Estimated annual PMI rate (% of loan) by credit tier (rows) and LTV bucket (cols: <=85, <=90, <=95, <=97)
const PMI_RATES = [
  [0.17, 0.23, 0.38, 0.55],   // 760+
  [0.20, 0.30, 0.50, 0.65],   // 740-759
  [0.25, 0.38, 0.60, 0.78],   // 720-739
  [0.32, 0.50, 0.75, 0.95],   // 700-719
  [0.45, 0.65, 0.95, 1.15],   // 680-699
  [0.62, 0.90, 1.20, 1.40],   // 660-679
  [0.80, 1.10, 1.40, 1.60],   // 640-659
  [0.95, 1.25, 1.55, 1.75]    // 620-639
];

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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d }).format(v);
}
function ymText(months) {
  if (months === null) return 'Not within loan term';
  const y = Math.floor(months / 12), m = months % 12;
  const parts = [];
  if (y) parts.push(y + (y === 1 ? ' year' : ' years'));
  if (m) parts.push(m + (m === 1 ? ' month' : ' months'));
  return parts.length ? parts.join(' ') : '0 months';
}

function onDownTypeChange() {
  const price = parseFloat($('homePrice').value) || 0;
  const el = $('downPayment');
  const v = parseFloat(el.value) || 0;
  if ($('downType').value === 'amt') el.value = Math.round(price * v / 100);
  else el.value = price ? Math.round(v / price * 10000) / 100 : 0;
  calculate();
}

function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}

function calculate() {
  const price = parseFloat($('homePrice').value);
  const dpIn = parseFloat($('downPayment').value);
  const rate = parseFloat($('interestRate').value);
  const years = parseFloat($('loanTerm').value);
  const tier = parseInt($('creditScore').value, 10);
  const override = parseFloat($('pmiOverride').value);

  if (!(price > 0) || !(dpIn >= 0) || !(rate >= 0) || !(years > 0)) { showResults(false); return; }
  const down = $('downType').value === 'pct' ? price * dpIn / 100 : dpIn;
  if (down >= price) { showResults(false); return; }

  const loan = price - down;
  const ltv = loan / price * 100;
  const n = Math.round(years * 12);
  const r = rate / 100 / 12;
  const pi = r > 0 ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;

  const required = ltv > 80;
  let annualRate = 0;
  if (required) {
    if (override > 0) annualRate = override;
    else {
      const bucket = ltv <= 85 ? 0 : ltv <= 90 ? 1 : ltv <= 95 ? 2 : 3;
      annualRate = PMI_RATES[tier][bucket];
      if (years <= 20) annualRate *= 0.75;
    }
  }
  const monthlyPmi = required ? loan * annualRate / 100 / 12 : 0;

  // find the month the balance reaches 80% and 78% of the original value
  let bal = loan, m80 = null, m78 = null;
  if (required) {
    for (let k = 1; k <= n; k++) {
      const interest = bal * r;
      bal -= (pi - interest);
      if (m80 === null && bal <= price * 0.80 + 0.005) m80 = k;
      if (bal <= price * 0.78 + 0.005) { m78 = k; break; }
    }
  }
  const totalTo80 = m80 !== null ? monthlyPmi * m80 : monthlyPmi * n;
  const totalTo78 = m78 !== null ? monthlyPmi * m78 : monthlyPmi * n;
  const needFor20 = Math.max(0, price * 0.20 - down);

  $('resultLabel').textContent = required ? 'Estimated Monthly PMI' : 'Estimated Monthly PMI';
  $('resultValueDisplay').textContent = required ? money(monthlyPmi) : '$0.00';
  $('resultNote').textContent = required
    ? 'About ' + annualRate.toFixed(2) + '% of the loan per year'
    : 'No PMI needed: your down payment is 20% or more';

  const warn = $('warnBox');
  if (required && ltv > 97) {
    warn.style.display = 'block';
    warn.textContent = 'Most conventional loans require at least 3% down (LTV of 97% or lower). Your estimate may not match an available loan.';
  } else warn.style.display = 'none';

  const rows = [
    ['Home price', money(price)],
    ['Down payment', money(down) + ' (' + (down / price * 100).toFixed(1) + '%)'],
    ['Loan amount', money(loan)],
    ['Loan-to-value (LTV)', ltv.toFixed(1) + '%'],
    ['Estimated PMI rate (per year)', required ? annualRate.toFixed(2) + '%' : 'Not required'],
    ['Monthly PMI', money(monthlyPmi)],
    ['Monthly principal &amp; interest', money(pi)],
    ['SUB:Total monthly (P&amp;I + PMI)', money(pi + monthlyPmi)]
  ];
  if (required) {
    rows.push(['You can request removal at 80% LTV', m80 !== null ? 'After ' + ymText(m80) : 'Not within loan term']);
    rows.push(['PMI ends automatically at 78% LTV', m78 !== null ? 'After ' + ymText(m78) : 'Not within loan term']);
    rows.push(['Total PMI paid until 80% LTV', money(totalTo80, 0)]);
    rows.push(['Total PMI paid until 78% LTV', money(totalTo78, 0)]);
    rows.push(['Extra down payment to avoid PMI', needFor20 > 0 ? money(needFor20, 0) : '$0']);
  }
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart(pi, monthlyPmi);
}

function drawChart(pi, pmi) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(pi, pmi); }, 200); return; }
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  const labels = ['Principal & interest', 'PMI'];
  const data = [pi, pmi];
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: ['hsl(215, 60%, 80%)', 'hsl(215, 70%, 38%)'], borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: function (c) {
          const t = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
          return c.label + ': ' + money(c.raw) + ' (' + (t ? (c.raw / t * 100).toFixed(1) : 0) + '%)';
        } } }
      }
    }
  });
}

function clearForm() {
  ['homePrice', 'downPayment', 'interestRate', 'loanTerm', 'pmiOverride'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
