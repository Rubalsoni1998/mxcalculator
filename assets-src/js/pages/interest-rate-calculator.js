// State
let state = {
  currency: 'USD',
  locale: 'en-US',
  pieChart: null
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  calculate(); 
});

// Toggle functions
function setCurrency(currency) {
  state.currency = currency;
  state.locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const symbol = currency === 'INR' ? '₹' : '$';

  // Update Input Icons
  document.querySelectorAll('.dynamic-symbol').forEach(el => {
    el.textContent = symbol;
  });
  calculate();
}

// Calculation Logic (Iterative Newton-Raphson)
function calculate() {
    const principal = parseFloat(document.getElementById('loanAmount').value) || 0;
    const years = parseFloat(document.getElementById('termYears').value) || 0;
    const months = parseFloat(document.getElementById('termMonths').value) || 0;
    const pmt = parseFloat(document.getElementById('monthlyPayment').value) || 0;

    const n = (years * 12) + months;

    if (principal <= 0 || n <= 0 || pmt <= 0) {
        // Invalid or incomplete inputs
        return; 
    }

    // Basic check: Total payment must be > Principal
    if (pmt * n <= principal) {
         alert("Total payments are less than the loan amount. Interest rate would be negative.");
         return;
    }

    // Iterative Solver for Rate (r)
    // Formula: P = (PMT/r) * (1 - (1+r)^-n)
    // We need to find r (monthly rate)

    let r = 0.05 / 12; // Initial guess (5% annual)
    let precision = 0.000001;
    let maxIter = 100;

    for (let i = 0; i < maxIter; i++) {
        // Function value: f(r) = (PMT/r) * (1 - (1+r)^-n) - P
        // Derivative: f'(r) ... complex derivative, standard financial approximation is often used
        // Let's use simple binary search or Newton if derivative is implemented.
        // Simplified Newton Step:

        const k = Math.pow(1 + r, -n);
        const f_r = (pmt/r) * (1 - k) - principal;

        // Derivative f'(r) = (PMT/r^2) * ( (1+r)^(-n-1) * n*r - (1 - (1+r)^-n) )
        // Actually simpler: f'(r) = (PMT/r) * [ n*(1+r)^(-n-1) ] - (PMT/r^2)*(1-(1+r)^-n)

        const df_r = (pmt/r) * (n * Math.pow(1+r, -n-1)) - (pmt/(r*r)) * (1 - k);

        const new_r = r - f_r / df_r;

        if (Math.abs(new_r - r) < precision) {
            r = new_r;
            break;
        }
        r = new_r;
    }

    const monthlyRate = r;
    const annualRate = r * 12 * 100;

    const totalPaid = pmt * n;
    const totalInterest = totalPaid - principal;

    state.results = {
        rate: annualRate,
        totalPaid,
        totalInterest,
        principal
    };

    renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = r.rate.toFixed(3) + "%";

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Loan Principal</td>
        <td>${formatCurrency(r.principal)}</td>
    </tr>
     <tr>
        <td class="muted">Total Interest Cost</td>
        <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
     <tr class="total-row">
        <td>Total Repayment</td>
        <td>${formatCurrency(r.totalPaid)}</td>
    </tr>
  `;

  // Chart
  renderPieChart();
}

function renderPieChart() {
  const r = state.results;
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (state.pieChart) {
    state.pieChart.destroy();
  }

  const data = [
      { label: 'Principal', value: r.principal, color: 'hsl(10, 60%, 80%)' }, // Light Coral
      { label: 'Interest', value: r.totalInterest, color: 'hsl(10, 85%, 55%)' } // Primary Coral
  ];

  state.pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.color),
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
}

function clearForm() {
  document.getElementById('loanAmount').value = "";
  document.getElementById('termYears').value = 5;
  document.getElementById('termMonths').value = 0;
  document.getElementById('monthlyPayment').value = "";

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  if (isNaN(value)) return "Error";
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
