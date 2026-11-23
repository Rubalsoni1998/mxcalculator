// State
let state = {
  currency: 'USD',
  locale: 'en-US',
  salaryChart: null
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

function toggleMoreOptions() {
  const btn = document.getElementById('moreOptionsBtn');
  const content = document.getElementById('moreOptionsContent');
  btn.classList.toggle('open');
  content.classList.toggle('open');
}

// Calculation Logic
function calculate() {
    const amount = parseFloat(document.getElementById('salaryAmount').value) || 0;
    const freq = document.getElementById('salaryFrequency').value;
    const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 40;
    const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 5;
    const holidays = parseFloat(document.getElementById('holidays').value) || 0;
    const vacation = parseFloat(document.getElementById('vacation').value) || 0;

    // Normalize to Annual (Unadjusted)
    // Standard year = 52 weeks
    let annualUnadjusted = 0;

    switch(freq) {
        case 'year': annualUnadjusted = amount; break;
        case 'month': annualUnadjusted = amount * 12; break;
        case 'biweekly': annualUnadjusted = amount * 26; break;
        case 'week': annualUnadjusted = amount * 52; break;
        case 'day': annualUnadjusted = amount * daysPerWeek * 52; break;
        case 'hour': annualUnadjusted = amount * hoursPerWeek * 52; break;
    }

    // Calculate Base Hourly Rate (Unadjusted)
    const totalAnnualHours = hoursPerWeek * 52;
    const hourlyRate = annualUnadjusted / totalAnnualHours;

    // Calculate Adjusted (Effective)
    // Total working days per year
    const totalDays = daysPerWeek * 52;
    const adjustedDays = totalDays - holidays - vacation;
    const hoursPerDay = hoursPerWeek / daysPerWeek;

    // Adjusted Annual = Hourly Rate * Adjusted Days * Hours/Day
    const annualAdjusted = hourlyRate * adjustedDays * hoursPerDay;

    state.results = {
        unadjusted: {
            annual: annualUnadjusted,
            monthly: annualUnadjusted / 12,
            biweekly: annualUnadjusted / 26,
            weekly: annualUnadjusted / 52,
            daily: annualUnadjusted / (52 * daysPerWeek),
            hourly: hourlyRate
        },
        adjusted: {
            annual: annualAdjusted,
            monthly: annualAdjusted / 12,
            biweekly: annualAdjusted / 26,
            weekly: annualAdjusted / 52,
            daily: annualAdjusted / adjustedDays * (daysPerWeek * 52 / 12 / 4), // Approx average
            // Actually simpler: Adjusted Daily = Annual / Adjusted Days
            dailyReal: annualAdjusted / adjustedDays,
            hourly: hourlyRate // Hourly rate usually stays same, total income drops. Or effective hourly?
            // Standard calc: Effective Hourly = Annual Adjusted / Total Standard Hours (if salaried)
            // OR Hourly Rate stays same (if hourly), just total drops.
            // We will display the Total Income drop.
        }
    };

    renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = formatCurrency(r.unadjusted.annual);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  const rows = [
      { label: 'Annual', key: 'annual' },
      { label: 'Monthly', key: 'monthly' },
      { label: 'Bi-Weekly', key: 'biweekly' },
      { label: 'Weekly', key: 'weekly' },
      { label: 'Daily', key: 'daily' }, // Daily unadjusted vs daily adjusted
      { label: 'Hourly', key: 'hourly' }
  ];

  tableBody.innerHTML = '';

  rows.forEach(row => {
      let val1 = r.unadjusted[row.key];
      let val2 = r.adjusted[row.key];

      if (row.key === 'daily') val2 = r.adjusted.dailyReal;
      if (row.key === 'hourly') val2 = r.unadjusted.hourly; // Rate doesn't change typically

      const tr = document.createElement('tr');
      if (row.key === 'annual') tr.classList.add('total-row');

      tr.innerHTML = `
        <td>${row.label}</td>
        <td>${formatCurrency(val1)}</td>
        <td class="unadjusted">${formatCurrency(val2)}</td>
      `;
      tableBody.appendChild(tr);
  });

  // Chart
  renderChart();
}

function renderChart() {
  const r = state.results;
  const ctx = document.getElementById('salaryChart').getContext('2d');

  if (state.salaryChart) {
    state.salaryChart.destroy();
  }

  const data = [r.unadjusted.annual, r.adjusted.annual];

  state.salaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Unadjusted', 'Adjusted'],
      datasets: [{
        label: 'Annual Income',
        data: data,
        backgroundColor: ['hsl(199, 89%, 48%)', 'hsl(210, 20%, 80%)'],
        borderRadius: 8,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
           callbacks: {
              label: function(context) {
                 return `${context.label}: ${formatCurrency(context.raw)}`;
              }
           }
        }
      },
      scales: {
         y: { 
             beginAtZero: true,
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
  document.getElementById('salaryAmount').value = 50000;
  document.getElementById('salaryFrequency').value = "year";
  document.getElementById('hoursPerWeek').value = 40;
  document.getElementById('daysPerWeek').value = 5;
  document.getElementById('holidays').value = 0;
  document.getElementById('vacation').value = 0;

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  if (isNaN(value) || !isFinite(value)) return "-";
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
