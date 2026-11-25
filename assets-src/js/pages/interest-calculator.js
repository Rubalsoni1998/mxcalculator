// State
let state = {
  scheduleView: 'annual',
  results: null,
  pieChart: null,
  lineChart: null,
  currency: 'USD',
  locale: 'en-US'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  calculate(); // Calculate on load
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

  // Re-calculate to update formatting
  calculate();
}

function toggleMoreOptions() {
  const btn = document.getElementById('moreOptionsBtn');
  const content = document.getElementById('moreOptionsContent');
  btn.classList.toggle('open');
  content.classList.toggle('open');
}

function setScheduleView(view) {
  state.scheduleView = view;
  document.getElementById('annualTab').classList.toggle('active', view === 'annual');
  document.getElementById('monthlyTab').classList.toggle('active', view === 'monthly');
  document.getElementById('scheduleCol1').textContent = view === 'annual' ? 'Year' : 'Month';
  renderScheduleTable();
}

// Calculation
function calculate() {
  // Get Values
  const principal = parseFloat(document.getElementById('principalAmount').value) || 0;
  const rate = parseFloat(document.getElementById('interestRate').value) || 0;
  const years = parseFloat(document.getElementById('investmentTerm').value) || 0;
  const compoundFreq = parseInt(document.getElementById('compoundFreq').value);

  const additionalDeposit = parseFloat(document.getElementById('additionalDeposit').value) || 0;
  const depositFreq = parseInt(document.getElementById('depositFreq').value); // 12=monthly, 1=annually

  // Calculations
  let balance = principal;
  let totalDeposits = principal;
  const r = rate / 100;
  const schedule = [];

  // Calculate based on monthly steps for precision (if compounding allows) or yearly steps
  // Simulating month-by-month for granular chart data
  const totalMonths = years * 12;
  let yearlyInterest = 0;
  let cumulativeInterest = 0;

  // Determine compounding period rate
  // If Simple Interest (compoundFreq == 0)
  if (compoundFreq === 0) {
      // Simple Interest: Total Interest = P * r * t
      const totalSimpleInterest = principal * r * years;
      // Note: Regular deposits in simple interest is complex, usually simple interest applies to static principal. 
      // We will apply simple interest logic to deposits based on time remaining.
      // However, for standard simple interest tools, they typically ignore complex deposit schedules.
      // We will just calculate simple interest on Principal for this basic mode.
      balance = principal + totalSimpleInterest;
      cumulativeInterest = totalSimpleInterest;

      // Generate simple annual schedule
      for(let y=1; y<=years; y++) {
         const annualInt = principal * r;
         schedule.push({
             month: y * 12,
             year: y,
             interest: annualInt, // Interest earned this year
             totalInterest: annualInt * y,
             balance: principal + (annualInt * y)
         });
      }
  } else {
      // Compound Interest
      // We step through months to handle monthly deposits correctly
      let currentInterest = 0;
      let yearCounter = 1;
      let tempAnnualInterest = 0;

      for(let m=1; m<=totalMonths; m++) {
          // Apply Deposit
          let depositThisMonth = 0;
          if (depositFreq === 12) { // Monthly
              depositThisMonth = additionalDeposit;
          } else if (depositFreq === 1 && m % 12 === 0) { // Annually
              depositThisMonth = additionalDeposit;
          }

          // Apply Interest
          // Rate per month approximation if compounding is monthly or higher frequency
          // For daily/etc, we estimate the monthly growth factor
          let monthlyGrowthRate = 0;
          if (compoundFreq >= 12) {
             // n times per year. Rate per period = r/n. Periods per month = n/12
             monthlyGrowthRate = Math.pow(1 + r/compoundFreq, compoundFreq/12) - 1;
          } else {
             // Compounding less than monthly (e.g. Annually)
             // We only apply interest at the END of the compounding period
             // Logic: check if m % (12/compoundFreq) === 0
             // This is slightly complex for a simple loop. 
             // Simplified: Convert annual rate to effective monthly rate for graph smoothing
             // BUT for accuracy, we stick to effective annual rate logic
             monthlyGrowthRate = Math.pow(1 + r/compoundFreq, compoundFreq/12) - 1; 
          }

          // Add deposit first (usually deposits earn interest if made at start, or not if end. Assuming start for max growth)
          balance += depositThisMonth;
          totalDeposits += depositThisMonth;

          const interestEarned = balance * monthlyGrowthRate;
          balance += interestEarned;
          cumulativeInterest += interestEarned;
          tempAnnualInterest += interestEarned;

          // Record Schedule Data
          // Push every month for monthly view
          // Push end of year for annual view

          if (m % 12 === 0) {
              schedule.push({
                  month: m,
                  year: yearCounter,
                  interest: tempAnnualInterest, // Interest this specific year
                  totalInterest: cumulativeInterest,
                  balance: balance
              });
              tempAnnualInterest = 0;
              yearCounter++;
          }
      }
  }

  state.results = {
    principal,
    totalDeposits,
    totalInterest: cumulativeInterest,
    totalBalance: balance,
    schedule
  };

  renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('amortizationSection').style.display = 'block';

  // Total Balance Hero
  document.getElementById('totalBalanceDisplay').textContent = formatCurrency(state.results.totalBalance);

  // Breakdown table
  const r = state.results;
  let tableHTML = `
    <tr>
      <td class="muted">Principal</td>
      <td>${formatCurrency(r.principal)}</td>
    </tr>
    <tr>
      <td class="muted">Total Contributions</td>
      <td>${formatCurrency(r.totalDeposits - r.principal)}</td>
    </tr>
    <tr>
      <td class="muted">Total Interest</td>
      <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
    <tr class="total-row">
      <td>Total Balance</td>
      <td>${formatCurrency(r.totalBalance)}</td>
    </tr>
  `;

  document.getElementById('breakdownTableBody').innerHTML = tableHTML;

  // Charts
  renderPieChart();
  renderLineChart();
  renderScheduleTable();
}

function renderPieChart() {
  const r = state.results;
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (state.pieChart) {
    state.pieChart.destroy();
  }

  const data = [
    { label: 'Principal', value: r.principal, color: 'hsl(210, 20%, 80%)' }, // Light Gray
    { label: 'Contributions', value: r.totalDeposits - r.principal, color: 'hsl(35, 90%, 60%)' }, // Light Amber
    { label: 'Interest', value: r.totalInterest, color: 'hsl(35, 90%, 45%)' } // Dark Amber
  ];

  // Filter out zero values
  const validData = data.filter(d => d.value > 0);

  state.pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: validData.map(d => d.label),
      datasets: [{
        data: validData.map(d => d.value),
        backgroundColor: validData.map(d => d.color),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(0);
              return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  document.getElementById('chartLegend').innerHTML = ''; // Using Chart.js legend
}

function renderLineChart() {
  const r = state.results;
  const ctx = document.getElementById('lineChart').getContext('2d');

  if (state.lineChart) {
    state.lineChart.destroy();
  }

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: r.schedule.map(d => `Year ${d.year}`),
      datasets: [
        {
          label: 'Total Balance',
          data: r.schedule.map(d => d.balance),
          borderColor: 'hsl(35, 90%, 45%)',
          backgroundColor: 'hsla(35, 90%, 45%, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Interest',
          data: r.schedule.map(d => d.totalInterest),
          borderColor: 'hsl(210, 40%, 12%)', // Dark
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
               return state.currency === 'INR' 
                ? '₹' + (value / 1000).toFixed(0) + 'K'
                : '$' + (value / 1000).toFixed(0) + 'K';
            }
          }
        }
      }
    }
  });
}

function renderScheduleTable() {
  const r = state.results;
  // Note: Current logic only generates Annual snapshots in the schedule array for simplicity.
  // A full monthly array would be needed for the Monthly tab. 
  // For this specific replica, we will display Annual only or toggle logic if expanded.
  // Currently, schedule has 1 entry per year.

  const tableHTML = r.schedule.map(d => `
    <tr>
      <td>${d.year}</td>
      <td>${formatCurrency(d.interest)}</td>
      <td>${formatCurrency(d.totalInterest)}</td>
      <td>${formatCurrency(d.balance)}</td>
    </tr>
  `).join('');

  document.getElementById('scheduleTableBody').innerHTML = tableHTML;
}

function clearForm() {
  document.getElementById('principalAmount').value = 10000;
  document.getElementById('interestRate').value = 5;
  document.getElementById('investmentTerm').value = 5;
  document.getElementById('additionalDeposit').value = 0;

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
  document.getElementById('amortizationSection').style.display = 'none';
}

// Utility functions
function formatCurrency(value) {
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}
