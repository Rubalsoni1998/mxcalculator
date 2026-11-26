// Currency comes from the visitor's choice on the home page (kept in the browser; USD by default).
const mxCur = (window.mxCurrency && window.mxCurrency.get()) || { code: 'USD', locale: 'en-US', symbol: '$' };
// State
let state = {
  currency: mxCur.code,
  locale: mxCur.locale,
  pieChart: null,
  lineChart: null
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  calculate(); 
});

// Toggle functions
// Currency symbols in the inputs. USD is already in the HTML, so the default case does no work at all.
function applyCurrencySymbols() {
  if (mxCur.code === 'USD') return;
  document.querySelectorAll('.dynamic-symbol, .dynamic-symbol-btn').forEach(el => {
    el.textContent = mxCur.symbol;
  });
}
applyCurrencySymbols();

// Calculation Logic
function calculate() {
    const P = parseFloat(document.getElementById('baseAmount').value) || 0;
    const r = (parseFloat(document.getElementById('interestRate').value) || 0) / 100;
    const t = parseFloat(document.getElementById('years').value) || 0;
    const n = parseInt(document.getElementById('compoundFreq').value);
    const pmt = parseFloat(document.getElementById('monthlyDeposit').value) || 0;

    // Compound Interest Formula (Lump Sum): A = P(1 + r/n)^(nt)
    const amountFromPrincipal = P * Math.pow(1 + r/n, n * t);

    // Future Value of a Series (Regular Deposits)
    // Note: Assuming deposits made at end of month, standard annuity formula
    // Formula: PMT * [ (1 + r/n)^(nt) - 1 ] / (r/n)
    // Adjustment: If pmt freq (monthly) != compound freq (e.g. daily), complex.
    // Simplified Logic: Standard approximation used in general calculators
    // We will calculate stepwise for chart data to be accurate

    let balance = P;
    let totalPrincipal = P;
    let schedule = [];

    // Stepwise calculation (Monthly steps for chart resolution)
    const totalMonths = t * 12;
    let currentYear = 0;
    let yearInterest = 0;

    for(let m = 1; m <= totalMonths; m++) {
        // Apply Deposit
        balance += pmt;
        totalPrincipal += pmt;

        // Apply Interest (Rate per month approximation based on compound freq)
        // Effective monthly rate = (1 + r/n)^(n/12) - 1
        const monthlyRate = Math.pow(1 + r/n, n/12) - 1;
        const interest = balance * monthlyRate;
        balance += interest;
        yearInterest += interest;

        if (m % 12 === 0) {
            currentYear++;
            schedule.push({
                year: currentYear,
                interest: yearInterest,
                balance: balance,
                totalInterest: balance - totalPrincipal
            });
            yearInterest = 0;
        }
    }

    const totalInterest = balance - totalPrincipal;

    state.results = {
        principal: P,
        totalDeposits: totalPrincipal - P,
        totalPrincipal,
        totalInterest,
        futureValue: balance,
        schedule
    };

    renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('graphSection').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = formatCurrency(r.futureValue);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Principal</td>
        <td>${formatCurrency(r.principal)}</td>
    </tr>
     <tr>
        <td class="muted">Total Deposits</td>
        <td>${formatCurrency(r.totalDeposits)}</td>
    </tr>
     <tr>
        <td class="muted">Total Interest</td>
        <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
    <tr class="total-row">
        <td>Total Value</td>
        <td>${formatCurrency(r.futureValue)}</td>
    </tr>
  `;

  // Schedule Table
  const schedBody = document.getElementById('scheduleTableBody');
  schedBody.innerHTML = '';
  r.schedule.forEach(row => {
     const tr = document.createElement('tr');
     tr.innerHTML = `
        <td>Year ${row.year}</td>
        <td>${formatCurrency(row.interest)}</td>
        <td>${formatCurrency(row.totalInterest)}</td>
        <td>${formatCurrency(row.balance)}</td>
     `;
     schedBody.appendChild(tr);
  });

  // Charts
  renderCharts();
}

function renderCharts() {
  const r = state.results;

  // Pie Chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if (state.pieChart) state.pieChart.destroy();

  const pieData = [
      { label: 'Principal + Deposits', value: r.totalPrincipal, color: 'hsl(245, 60%, 80%)' },
      { label: 'Interest', value: r.totalInterest, color: 'hsl(245, 75%, 60%)' } // Primary Purple
  ];

  state.pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: pieData.map(d => d.label),
      datasets: [{
        data: pieData.map(d => d.value),
        backgroundColor: pieData.map(d => d.color),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: {
           callbacks: {
              label: function(context) {
                 const total = context.dataset.data.reduce((a, b) => a + b, 0);
                 const percentage = ((context.raw / total) * 100).toFixed(1);
                 return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
              }
           }
        }
      }
    }
  });

  // Line Chart
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  if (state.lineChart) state.lineChart.destroy();

  state.lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: r.schedule.map(d => `Year ${d.year}`),
      datasets: [
        {
          label: 'Total Balance',
          data: r.schedule.map(d => d.balance),
          borderColor: 'hsl(245, 75%, 60%)', 
          backgroundColor: 'hsla(245, 75%, 60%, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
           callbacks: {
              label: function(context) {
                 return `Balance: ${formatCurrency(context.raw)}`;
              }
           }
        }
      },
      scales: {
         x: { grid: { display: false } },
         y: { 
             ticks: { 
                 callback: function(value) { 
                    if (value >= 1000) return (value/1000).toFixed(0) + 'k';
                    return value;
                 } 
             } 
         }
      }
    }
  });
}

function clearForm() {
  document.getElementById('baseAmount').value = 5000;
  document.getElementById('interestRate').value = 5;
  document.getElementById('years').value = 10;
  document.getElementById('monthlyDeposit').value = 100;

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('graphSection').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  if (isNaN(value)) return "Error";
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
