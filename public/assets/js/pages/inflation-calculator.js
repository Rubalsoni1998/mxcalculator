// State
let state = {
  mode: 'forward', // 'forward' or 'backward'
  currency: 'USD',
  locale: 'en-US',
  lineChart: null
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

function setMode(mode) {
    state.mode = mode;
    document.getElementById('modeForward').className = mode === 'forward' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('modeBackward').className = mode === 'backward' ? 'toggle-btn active' : 'toggle-btn';

    // Update Labels
    if (mode === 'forward') {
        document.getElementById('amountLabel').textContent = "Current Amount";
    } else {
        document.getElementById('amountLabel').textContent = "Amount (Future/Today)";
    }
    calculate();
}

// Calculation
function calculate() {
  const amount = parseFloat(document.getElementById('currentAmount').value) || 0;
  const rate = parseFloat(document.getElementById('inflationRate').value) || 0;
  const years = parseFloat(document.getElementById('years').value) || 0;

  let resultValue = 0;
  let totalInflation = 0;
  const schedule = [];

  // Logic
  // FV = PV * (1 + r)^n
  // PV = FV / (1 + r)^n

  if (state.mode === 'forward') {
      // Future Value Calculation
      resultValue = amount * Math.pow(1 + rate/100, years);
      totalInflation = resultValue - amount;

      // Generate Schedule
      for(let i=0; i<=years; i++) {
          const val = amount * Math.pow(1 + rate/100, i);
          schedule.push({
              year: i,
              value: val,
              change: val - amount
          });
      }

      document.getElementById('resultLabel').textContent = `Value in ${years} Years`;

  } else {
      // Backward Calculation (Purchasing Power)
      // "What is $100 today worth back then?"
      // Using discounting formula
      resultValue = amount / Math.pow(1 + rate/100, years);
      totalInflation = amount - resultValue;

      // Generate Schedule (going back)
       for(let i=0; i<=years; i++) {
          const val = amount / Math.pow(1 + rate/100, i);
          schedule.push({
              year: i, // Years ago
              value: val,
              change: amount - val
          });
      }
      document.getElementById('resultLabel').textContent = `Value ${years} Years Ago`;
  }

  state.results = {
      amount,
      resultValue,
      totalInflation,
      schedule
  };

  renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = formatCurrency(r.resultValue);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  const label1 = state.mode === 'forward' ? 'Future Value' : 'Historical Value';
  const label2 = state.mode === 'forward' ? 'Cumulative Inflation' : 'Loss of Purchasing Power';

  tableBody.innerHTML = `
    <tr>
        <td class="muted">Starting Amount</td>
        <td>${formatCurrency(r.amount)}</td>
    </tr>
    <tr>
        <td class="muted">${label2}</td>
        <td class="result-value" style="font-size:1rem; color:hsl(340, 82%, 52%)">${formatCurrency(r.totalInflation)}</td>
    </tr>
    <tr class="total-row">
        <td>${label1}</td>
        <td>${formatCurrency(r.resultValue)}</td>
    </tr>
  `;

  // Schedule Table
  const schedBody = document.getElementById('scheduleTableBody');
  schedBody.innerHTML = '';

  // Show fewer rows if many years
  const displaySchedule = r.schedule.length > 20 
      ? r.schedule.filter((d, i) => i === 0 || i % 5 === 0 || i === r.schedule.length - 1)
      : r.schedule;

  displaySchedule.forEach(row => {
      const tr = document.createElement('tr');
      const yearLabel = state.mode === 'forward' ? `Year ${row.year}` : `${row.year} years ago`;
      tr.innerHTML = `
        <td>${yearLabel}</td>
        <td>${formatCurrency(row.value)}</td>
        <td>${formatCurrency(row.change)}</td>
      `;
      schedBody.appendChild(tr);
  });

  // Chart
  renderLineChart();
}

function renderLineChart() {
  const r = state.results;
  const ctx = document.getElementById('lineChart').getContext('2d');

  if (state.lineChart) {
    state.lineChart.destroy();
  }

  // Prepare labels based on mode
  const labels = r.schedule.map(d => state.mode === 'forward' ? `Year ${d.year}` : `-${d.year} Yrs`);

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Equivalent Value',
          data: r.schedule.map(d => d.value),
          borderColor: 'hsl(340, 82%, 52%)', // Primary Pink
          backgroundColor: 'hsla(340, 82%, 52%, 0.1)',
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
              return `Value: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
         x: { grid: { display: false } },
         y: { 
             ticks: { 
                 callback: function(value) { 
                    // Simplify large numbers
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
  document.getElementById('currentAmount').value = 100;
  document.getElementById('inflationRate').value = 3.5;
  document.getElementById('years').value = 10;
  setMode('forward');

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
