// State
let state = {
  downPaymentType: 'dollar',
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

  // Update Toggle Buttons
  document.querySelectorAll('.dynamic-symbol-btn').forEach(btn => {
    btn.textContent = symbol;
  });

  // Re-calculate to update formatting
  calculate();
}

function setDownPaymentType(type) {
  state.downPaymentType = type;
  document.getElementById('downPaymentPercent').classList.toggle('active', type === 'percent');
  document.getElementById('downPaymentDollar').classList.toggle('active', type === 'dollar');
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
  const autoPrice = parseFloat(document.getElementById('autoPrice').value) || 0;
  const loanTermMonths = parseInt(document.getElementById('loanTerm').value) || 60;
  const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
  const downPaymentInput = parseFloat(document.getElementById('downPayment').value) || 0;
  const tradeInValue = parseFloat(document.getElementById('tradeInValue').value) || 0;
  const tradeInOwed = parseFloat(document.getElementById('tradeInOwed').value) || 0;
  const salesTaxRate = parseFloat(document.getElementById('salesTax').value) || 0;
  const otherFees = parseFloat(document.getElementById('otherFees').value) || 0;
  const includeFees = document.getElementById('includeFeesInLoan').checked;
  const extraMonthlyPayment = parseFloat(document.getElementById('extraMonthlyPayment').value) || 0;

  const startMonth = parseInt(document.getElementById('startMonth').value);
  const startYear = parseInt(document.getElementById('startYear').value);

  // Calculations
  let downPayment = state.downPaymentType === 'percent' 
    ? autoPrice * (downPaymentInput / 100) 
    : downPaymentInput;

  // Net Trade In
  const netTradeIn = tradeInValue - tradeInOwed;

  // Sales Tax Calculation (Simple logic: Tax on Price - Trade In Value)
  // Note: Tax laws vary by state, this is a general approximation
  const taxableAmount = Math.max(0, autoPrice - tradeInValue);
  const salesTaxAmount = taxableAmount * (salesTaxRate / 100);

  // Total Upfront Costs (if not included in loan)
  const upfrontFees = includeFees ? 0 : (salesTaxAmount + otherFees);

  // Loan Amount Calculation
  let loanAmount = autoPrice - downPayment - netTradeIn;
  if (includeFees) {
      loanAmount += salesTaxAmount + otherFees;
  }

  if (loanAmount < 0) loanAmount = 0;

  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTermMonths; // Input is in months

  // Monthly payment
  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / totalPayments;
  } else {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }

  // Amortization Schedule Generation
  const schedule = [];
  let balance = loanAmount;
  let totalInterest = 0;
  let totalLoanPayment = 0;
  const startDate = new Date(startYear, startMonth);

  for (let month = 1; month <= totalPayments && balance > 0; month++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    // Apply extra monthly payment
    const extra = extraMonthlyPayment;

    const totalPrincipalPayment = Math.min(principalPayment + extra, balance);
    const actualExtraPayment = Math.max(0, totalPrincipalPayment - principalPayment);
    principalPayment = totalPrincipalPayment - actualExtraPayment;

    balance -= totalPrincipalPayment;
    totalInterest += interestPayment;
    totalLoanPayment += monthlyPayment + actualExtraPayment;

    schedule.push({
      month,
      date: new Date(currentDate),
      payment: monthlyPayment + actualExtraPayment,
      principal: principalPayment + actualExtraPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      extraPayment: actualExtraPayment
    });

    if (balance <= 0) break;
  }

  // Totals for Display
  const totalCost = totalLoanPayment + downPayment + netTradeIn + (includeFees ? 0 : (salesTaxAmount + otherFees)); // Total cost of car
  const totalTaxAndFees = salesTaxAmount + otherFees;

  state.results = {
    autoPrice,
    loanAmount,
    monthlyPayment,
    totalLoanPayment,
    totalInterest,
    salesTaxAmount,
    otherFees,
    totalTaxAndFees,
    downPayment,
    tradeInValue,
    payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].date : startDate,
    schedule
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
      <td class="muted">Auto Price</td>
      <td>${formatCurrency(r.autoPrice)}</td>
    </tr>
    <tr>
      <td class="muted">Sales Tax & Fees</td>
      <td>${formatCurrency(r.totalTaxAndFees)}</td>
    </tr>
    <tr>
      <td class="muted">Total Interest</td>
      <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
    <tr class="total-row">
      <td>Total Loan Payments</td>
      <td>${formatCurrency(r.totalLoanPayment)}</td>
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
      <span class="stat-value">${formatCurrency(r.totalLoanPayment)}</span>
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
    { label: 'Loan Principal', value: r.loanAmount, color: 'hsl(262, 83%, 58%)' },
    { label: 'Total Interest', value: r.totalInterest, color: 'hsl(38, 92%, 50%)' }
  ];

  // If user paid significant down payment/trade in, maybe show that? 
  // For standard view, Principal vs Interest is most common.
  // Or Price vs Interest vs Tax. Let's do Price Breakdown components.

  // Better Visual: Principal Loan vs Interest
  // OR Total Cost Breakdown: Price, Tax, Interest.
  // Let's stick to Loan Principal vs Interest for consistency with Loan Calc.

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

  // Generate yearly data
  const yearlyData = [];
  let currentYear = r.schedule[0]?.date.getFullYear();
  let yearlyInterest = 0;
  let yearlyPrincipal = 0;
  let yearCount = 1;

  r.schedule.forEach((payment, index) => {
    const paymentYear = payment.date.getFullYear();

    if (paymentYear !== currentYear || index === r.schedule.length - 1) {
      if (index === r.schedule.length - 1) {
        yearlyInterest += payment.interest;
        yearlyPrincipal += payment.principal;
      }

      yearlyData.push({
        year: yearCount,
        balance: index === r.schedule.length - 1 ? payment.balance : r.schedule[index - 1]?.balance || 0,
        interest: yearlyInterest,
        principal: yearlyPrincipal
      });

      yearCount++;
      currentYear = paymentYear;
      yearlyInterest = payment.interest;
      yearlyPrincipal = payment.principal;
    } else {
      yearlyInterest += payment.interest;
      yearlyPrincipal += payment.principal;
    }
  });

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearlyData.map(d => d.year),
      datasets: [
        {
          label: 'Balance',
          data: yearlyData.map(d => d.balance),
          borderColor: 'hsl(262, 83%, 58%)',
          backgroundColor: 'hsla(262, 83%, 58%, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Interest',
          data: yearlyData.map(d => d.interest),
          borderColor: 'hsl(38, 92%, 50%)',
          backgroundColor: 'hsla(38, 92%, 50%, 0.1)',
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
          title: {
            display: true,
            text: 'Year'
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: false
          },
          ticks: {
            callback: function(value) {
              return state.currency === 'INR' 
                ? '₹' + (value / 1000).toFixed(0) + 'K'
                : '$' + (value / 1000).toFixed(0) + 'K';
            }
          },
          grid: {
            color: 'hsl(210, 20%, 90%)'
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
  document.getElementById('autoPrice').value = 35000;
  document.getElementById('loanTerm').value = 60;
  document.getElementById('interestRate').value = 6.5;
  document.getElementById('downPayment').value = 0;
  document.getElementById('tradeInValue').value = 0;
  document.getElementById('tradeInOwed').value = 0;
  document.getElementById('salesTax').value = 0;
  document.getElementById('otherFees').value = 0;
  document.getElementById('extraMonthlyPayment').value = 0;

  setDownPaymentType('dollar');

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
