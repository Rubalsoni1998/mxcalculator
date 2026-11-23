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

// Calculation Logic
function calculate() {
    const price = parseFloat(document.getElementById('beforeTaxPrice').value) || 0;
    const rate = parseFloat(document.getElementById('taxRate').value) || 0;

    const taxAmount = price * (rate / 100);
    const totalPrice = price + taxAmount;

    state.results = {
        price,
        taxAmount,
        totalPrice,
        rate
    };

    renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = formatCurrency(r.totalPrice);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Before Tax Price</td>
        <td>${formatCurrency(r.price)}</td>
    </tr>
     <tr>
        <td class="muted">Sales Tax (${r.rate}%)</td>
        <td>${formatCurrency(r.taxAmount)}</td>
    </tr>
     <tr class="total-row">
        <td>Total Price</td>
        <td>${formatCurrency(r.totalPrice)}</td>
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
      { label: 'Base Price', value: r.price, color: 'hsl(180, 60%, 80%)' }, // Light Teal
      { label: 'Tax', value: r.taxAmount, color: 'hsl(180, 100%, 30%)' } // Primary Teal
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
  document.getElementById('beforeTaxPrice').value = "";
  document.getElementById('taxRate').value = "";

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
