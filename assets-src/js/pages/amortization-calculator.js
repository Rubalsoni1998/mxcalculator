// Currency comes from the visitor's choice on the home page (kept in the browser; USD by default).
const mxCur = (window.mxCurrency && window.mxCurrency.get()) || { code: 'USD', locale: 'en-US', symbol: '$' };
// State
let state = {
  scheduleView: 'annual',
  results: null,
  pieChart: null,
  lineChart: null,
  currency: mxCur.code,
  locale: mxCur.locale
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initializeYearSelects();
  initializeDateSelects();
  calculate(); 
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
// Currency symbols in the inputs. USD is already in the HTML, so the default case does no work at all.
function applyCurrencySymbols() {
  if (mxCur.code === 'USD') return;
  document.querySelectorAll('.dynamic-symbol, .dynamic-symbol-btn').forEach(el => {
    el.textContent = mxCur.symbol;
  });
}
applyCurrencySymbols();

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
  const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
  const termYears = parseFloat(document.getElementById('loanTermYears').value) || 0;
  const termMonths = parseFloat(document.getElementById('loanTermMonths').value) || 0;
  const rate = parseFloat(document.getElementById('interestRate').value) || 0;
  const startMonth = parseInt(document.getElementById('startMonth').value);
  const startYear = parseInt(document.getElementById('startYear').value);

  const extraMonthly = parseFloat(document.getElementById('extraMonthly').value) || 0;
  const extraYearly = parseFloat(document.getElementById('extraYearly').value) || 0;
  const extraOneTime = parseFloat(document.getElementById('extraOneTime').value) || 0;

  // Basic Validation checks
  if (amount <= 0) {
    alert("Please enter a valid loan amount.");
    return;
  }
  if (termYears === 0 && termMonths === 0) {
    alert("Please enter a valid loan term.");
    return;
  }

  // Logic
  const totalTerms = (termYears * 12) + termMonths;
  const monthlyRate = (rate / 100) / 12;

  let monthlyPayment = 0;
  if (monthlyRate === 0) {
      monthlyPayment = amount / totalTerms;
  } else {
      monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, totalTerms)) / (Math.pow(1 + monthlyRate, totalTerms) - 1);
  }

  // Amortization loop
  let balance = amount;
  let totalInterest = 0;
  let totalPaid = 0;
  let payments = 0;
  const schedule = [];
  const startDate = new Date(startYear, startMonth);

  // Safety break
  let maxMonths = totalTerms * 2; 
  if (maxMonths < 120) maxMonths = 120; // Ensure loop runs for short terms

  for(let m=1; m<=maxMonths; m++) {
      if (balance <= 0.01) break; // Small threshold for floating point

      let interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;

      // Apply Extra Payments
      let extra = extraMonthly;
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + m - 1);

      if (m % 12 === 0) extra += extraYearly;
      if (m === 1) extra += extraOneTime; // Simplify one-time to start

      // Cap principal payment
      let totalPrincipal = principalPayment + extra;
      if (totalPrincipal > balance) {
          totalPrincipal = balance;
          // Adjust total payment for this last month
          principalPayment = totalPrincipal; 
      }

      balance -= totalPrincipal;
      totalInterest += interestPayment;
      totalPaid += (totalPrincipal + interestPayment);
      payments++;

      schedule.push({
          month: m,
          date: new Date(currentDate),
          interest: interestPayment,
          principal: totalPrincipal,
          balance: Math.max(0, balance),
          payment: totalPrincipal + interestPayment
      });
  }

  state.results = {
      loanAmount: amount,
      monthlyPayment,
      totalPayment: totalPaid,
      totalInterest,
      schedule,
      payoffDate: schedule.length > 0 ? schedule[schedule.length-1].date : startDate,
      actualTerms: payments
  };

  renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('amortizationSection').style.display = 'block';

  // Summary
  const r = state.results;
  document.getElementById('monthlyPaymentDisplay').textContent = formatCurrency(r.monthlyPayment);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Principal</td>
        <td>${formatCurrency(r.loanAmount)}</td>
    </tr>
    <tr>
        <td class="muted">Total Interest</td>
        <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
     <tr class="total-row">
        <td>Total Repayment</td>
        <td>${formatCurrency(r.totalPayment)}</td>
    </tr>
  `;

  // Summary Stats
  const statsBody = document.getElementById('summaryStats');
  statsBody.innerHTML = `
    <div class="stat-row">
        <span class="stat-label">Number of Payments</span>
        <span class="stat-value">${r.actualTerms}</span>
    </div>
    <div class="stat-row">
        <span class="stat-label">Payoff Date</span>
        <span class="stat-value rose">${formatDate(r.payoffDate)}</span>
    </div>
  `;

  // Chart
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
    { label: 'Principal', value: r.loanAmount, color: 'hsl(225, 70%, 45%)' }, 
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

  // Filter for Annual if too many points
  const displayData = r.schedule.length > 50 
    ? r.schedule.filter((d, i) => i === 0 || d.month % 12 === 0 || i === r.schedule.length - 1)
    : r.schedule;

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: displayData.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Balance',
          data: displayData.map(d => d.balance),
          borderColor: 'hsl(225, 70%, 45%)', // Primary Blue
          backgroundColor: 'hsla(225, 70%, 45%, 0.1)',
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
                    return mxCur.symbol + (value / 1000).toFixed(0) + 'k';
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
  document.getElementById('loanAmount').value = 200000;
  document.getElementById('loanTermYears').value = 15;
  document.getElementById('loanTermMonths').value = 0;
  document.getElementById('interestRate').value = 6;
  document.getElementById('extraMonthly').value = 0;
  document.getElementById('extraYearly').value = 0;
  document.getElementById('extraOneTime').value = 0;

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
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
