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
  initializeYearSelects();
  initializeDateSelects();
  calculate(); // Calculate on load
});

function initializeYearSelects() {
  const currentYear = new Date().getFullYear();
  const startYearSelect = document.getElementById('startYear');

  for (let i = 0; i < 50; i++) {
    const year = currentYear + i;
    startYearSelect.add(new Option(year, year));
  }
}

function initializeDateSelects() {
  const currentDate = new Date();
  document.getElementById('startMonth').value = currentDate.getMonth();
  document.getElementById('startYear').value = currentDate.getFullYear();
}

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
  const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
  const years = parseFloat(document.getElementById('loanTermYears').value) || 0;
  const months = parseFloat(document.getElementById('loanTermMonths').value) || 0;
  const rate = parseFloat(document.getElementById('interestRate').value) || 0;
  const startMonth = parseInt(document.getElementById('startMonth').value);
  const startYear = parseInt(document.getElementById('startYear').value);

  // 2. Calculation Logic
  // n = total number of payments (months)
  const n = (years * 12) + months;
  const r = (rate / 100) / 12;

  let monthlyPayment = 0;
  if (r === 0) {
    monthlyPayment = amount / n;
  } else if (n > 0) {
    monthlyPayment = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  // Handle edge cases
  if (!isFinite(monthlyPayment)) monthlyPayment = 0;

  const totalPayment = monthlyPayment * n;
  const totalInterest = totalPayment - amount;

  // Generate amortization schedule
  const schedule = [];
  let balance = amount;
  let totalInt = 0;
  let totalPay = 0;
  const startDate = new Date(startYear, startMonth);

  for (let month = 1; month <= n && balance > 0; month++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    const interestPayment = balance * r;
    let principalPayment = monthlyPayment - interestPayment;

    // Handle last payment adjustments
    if (balance < principalPayment) {
        principalPayment = balance;
        // Recalculate monthly payment for last month if strictly needed, or just adjust principal
    }

    balance -= principalPayment;
    if (balance < 0) balance = 0;

    totalInt += interestPayment;
    totalPay += (principalPayment + interestPayment);

    schedule.push({
      month,
      date: new Date(currentDate),
      payment: principalPayment + interestPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance
    });

    if (balance <= 0) break;
  }

  state.results = {
    loanAmount: amount,
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule,
    payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].date : startDate
  };

  renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('amortizationSection').style.display = 'block';

  // Monthly payment
  document.getElementById('monthlyPaymentDisplay').textContent = formatCurrency(state.results.monthlyPayment);

  // Breakdown table
  const r = state.results;
  let tableHTML = `
    <tr>
      <td class="muted">Principal</td>
      <td>${formatCurrency(r.loanAmount)}</td>
    </tr>
    <tr>
      <td class="muted">Total Interest</td>
      <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
    <tr class="total-row">
      <td>Total Payment</td>
      <td>${formatCurrency(r.totalPayment)}</td>
    </tr>
  `;

  document.getElementById('breakdownTableBody').innerHTML = tableHTML;

  // Summary stats
   const summaryHTML = `
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        Loan Amount
      </span>
      <span class="stat-value">${formatCurrency(r.loanAmount)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total of ${r.schedule.length} Payments</span>
      <span class="stat-value">${formatCurrency(r.totalPayment)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total Interest</span>
      <span class="stat-value rose">${formatCurrency(r.totalInterest)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
        Payoff Date
      </span>
      <span class="stat-value">${formatDate(r.payoffDate)}</span>
    </div>
  `;
  document.getElementById('summaryStats').innerHTML = summaryHTML;

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
    { label: 'Principal', value: r.loanAmount, color: 'hsl(185, 80%, 40%)' }, 
    { label: 'Interest', value: r.totalInterest, color: 'hsl(350, 89%, 60%)' } 
  ];

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
          display: false
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

  // Custom legend
  const legendHTML = data.map(d => `
    <div class="legend-item">
      <div class="legend-dot" style="background: ${d.color}"></div>
      <span>${d.label}</span>
    </div>
  `).join('');
  document.getElementById('chartLegend').innerHTML = legendHTML;
}

function renderLineChart() {
  const r = state.results;
  const ctx = document.getElementById('lineChart').getContext('2d');

  if (state.lineChart) {
    state.lineChart.destroy();
  }

  // Prepare yearly data for chart to avoid cluttering X-axis with monthly points
  // Or just filter schedule
  const displayData = r.schedule.filter((d, i) => i === 0 || d.month % 12 === 0 || i === r.schedule.length - 1);

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: displayData.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Balance',
          data: displayData.map(d => d.balance),
          borderColor: 'hsl(185, 80%, 40%)',
          backgroundColor: 'hsla(185, 80%, 40%, 0.1)',
          fill: true,
          tension: 0.4
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
         x: {
          grid: { display: false }
        },
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

  if (state.scheduleView === 'annual') {
    // Generate yearly summary
    const yearlyData = [];
    let currentYear = r.schedule[0]?.date.getFullYear();
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    let endingBalance = r.loanAmount;
    let yearCount = 1;

    r.schedule.forEach((payment, index) => {
      const paymentYear = payment.date.getFullYear();

      if (paymentYear !== currentYear || index === r.schedule.length - 1) {
        if (index === r.schedule.length - 1) {
          yearlyInterest += payment.interest;
          yearlyPrincipal += payment.principal;
          endingBalance = payment.balance;
        }

        yearlyData.push({
          year: yearCount,
          date: currentYear,
          interest: yearlyInterest,
          principal: yearlyPrincipal,
          balance: index === r.schedule.length - 1 ? payment.balance : endingBalance
        });

        yearCount++;
        currentYear = paymentYear;
        yearlyInterest = payment.interest;
        yearlyPrincipal = payment.principal;
        endingBalance = payment.balance;
      } else {
        yearlyInterest += payment.interest;
        yearlyPrincipal += payment.principal;
        endingBalance = payment.balance;
      }
    });

    const tableHTML = yearlyData.map(d => `
      <tr>
        <td>${d.year}</td>
        <td>${d.date}</td>
        <td>${formatCurrency(d.interest)}</td>
        <td>${formatCurrency(d.principal)}</td>
        <td>${formatCurrency(d.balance)}</td>
      </tr>
    `).join('');

    document.getElementById('scheduleTableBody').innerHTML = tableHTML;
  } else {
    const tableHTML = r.schedule.map(d => `
      <tr>
        <td>${d.month}</td>
        <td>${formatDate(d.date)}</td>
        <td>${formatCurrency(d.interest)}</td>
        <td>${formatCurrency(d.principal)}</td>
        <td>${formatCurrency(d.balance)}</td>
      </tr>
    `).join('');

    document.getElementById('scheduleTableBody').innerHTML = tableHTML;
  }
}

function clearForm() {
  document.getElementById('loanAmount').value = 10000;
  document.getElementById('loanTermYears').value = 5;
  document.getElementById('loanTermMonths').value = 0;
  document.getElementById('interestRate').value = 7.5;

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

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
