// State
let state = {
  downPaymentType: 'percent',
  propertyTaxType: 'percent',
  homeInsuranceType: 'dollar',
  pmiType: 'dollar',
  hoaType: 'dollar',
  otherCostsType: 'dollar',
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
  document.getElementById('includeTaxes').addEventListener('change', toggleTaxesSection);
  calculate(); // Calculate on load
});

function initializeYearSelects() {
  const currentYear = new Date().getFullYear();
  const startYearSelect = document.getElementById('startYear');
  const oneTimeYearSelect = document.getElementById('extraOneTimeYear');

  for (let i = 0; i < 50; i++) {
    const year = currentYear + i;
    startYearSelect.add(new Option(year, year));
    oneTimeYearSelect.add(new Option(year, year));
  }

  oneTimeYearSelect.value = currentYear + 1;
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

function setPropertyTaxType(type) {
  state.propertyTaxType = type;
  document.getElementById('propertyTaxPercent').classList.toggle('active', type === 'percent');
  document.getElementById('propertyTaxDollar').classList.toggle('active', type === 'dollar');
}

function setHomeInsuranceType(type) {
  state.homeInsuranceType = type;
  document.getElementById('homeInsurancePercent').classList.toggle('active', type === 'percent');
  document.getElementById('homeInsuranceDollar').classList.toggle('active', type === 'dollar');
}

function setPmiType(type) {
  state.pmiType = type;
  document.getElementById('pmiInsurancePercent').classList.toggle('active', type === 'percent');
  document.getElementById('pmiInsuranceDollar').classList.toggle('active', type === 'dollar');
}

function setHoaType(type) {
  state.hoaType = type;
  document.getElementById('hoaFeePercent').classList.toggle('active', type === 'percent');
  document.getElementById('hoaFeeDollar').classList.toggle('active', type === 'dollar');
}

function setOtherCostsType(type) {
  state.otherCostsType = type;
  document.getElementById('otherCostsPercent').classList.toggle('active', type === 'percent');
  document.getElementById('otherCostsDollar').classList.toggle('active', type === 'dollar');
}

function toggleTaxesSection() {
  const section = document.getElementById('taxesSection');
  const checkbox = document.getElementById('includeTaxes');
  section.classList.toggle('hidden', !checkbox.checked);
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
  const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
  const downPaymentValue = parseFloat(document.getElementById('downPayment').value) || 0;
  const loanTerm = parseInt(document.getElementById('loanTerm').value) || 30;
  const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
  const startMonth = parseInt(document.getElementById('startMonth').value);
  const startYear = parseInt(document.getElementById('startYear').value);
  const includeTaxes = document.getElementById('includeTaxes').checked;

  // Calculate down payment
  const downPayment = state.downPaymentType === 'percent' 
    ? homePrice * (downPaymentValue / 100)
    : downPaymentValue;

  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;

  // Monthly mortgage payment
  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / totalPayments;
  } else {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }

  // Additional costs
  let monthlyPropertyTax = 0, monthlyHomeInsurance = 0, monthlyPMI = 0, monthlyHOA = 0, monthlyOtherCosts = 0;

  if (includeTaxes) {
    const propertyTaxValue = parseFloat(document.getElementById('propertyTax').value) || 0;
    monthlyPropertyTax = state.propertyTaxType === 'percent'
      ? (homePrice * (propertyTaxValue / 100)) / 12
      : propertyTaxValue / 12;

    const homeInsuranceValue = parseFloat(document.getElementById('homeInsurance').value) || 0;
    monthlyHomeInsurance = state.homeInsuranceType === 'percent'
      ? (homePrice * (homeInsuranceValue / 100)) / 12
      : homeInsuranceValue / 12;

    const pmiValue = parseFloat(document.getElementById('pmiInsurance').value) || 0;
    monthlyPMI = state.pmiType === 'percent'
      ? (loanAmount * (pmiValue / 100)) / 12
      : pmiValue / 12;

    const hoaValue = parseFloat(document.getElementById('hoaFee').value) || 0;
    monthlyHOA = state.hoaType === 'percent'
      ? (homePrice * (hoaValue / 100)) / 12
      : hoaValue / 12;

    const otherCostsValue = parseFloat(document.getElementById('otherCosts').value) || 0;
    monthlyOtherCosts = state.otherCostsType === 'percent'
      ? (homePrice * (otherCostsValue / 100)) / 12
      : otherCostsValue / 12;
  }

  // Extra payments
  const extraMonthlyPayment = parseFloat(document.getElementById('extraMonthlyPayment').value) || 0;
  const extraYearlyPayment = parseFloat(document.getElementById('extraYearlyPayment').value) || 0;
  const extraYearlyMonth = parseInt(document.getElementById('extraYearlyMonth').value);
  const extraOneTimePayment = parseFloat(document.getElementById('extraOneTimePayment').value) || 0;
  const extraOneTimeMonth = parseInt(document.getElementById('extraOneTimeMonth').value);
  const extraOneTimeYear = parseInt(document.getElementById('extraOneTimeYear').value);

  // Generate amortization schedule
  const schedule = [];
  let balance = loanAmount;
  let totalInterest = 0;
  let totalMortgagePayment = 0;
  const startDate = new Date(startYear, startMonth);

  for (let month = 1; month <= totalPayments && balance > 0; month++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    let extraPayment = extraMonthlyPayment;
    if (currentDate.getMonth() === extraYearlyMonth) {
      extraPayment += extraYearlyPayment;
    }
    if (currentDate.getMonth() === extraOneTimeMonth && currentDate.getFullYear() === extraOneTimeYear) {
      extraPayment += extraOneTimePayment;
    }

    const totalPrincipalPayment = Math.min(principalPayment + extraPayment, balance);
    const actualExtraPayment = Math.max(0, totalPrincipalPayment - principalPayment);
    principalPayment = totalPrincipalPayment - actualExtraPayment;

    balance -= totalPrincipalPayment;
    totalInterest += interestPayment;
    totalMortgagePayment += monthlyPayment + actualExtraPayment;

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

  const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyHomeInsurance + monthlyPMI + monthlyHOA + monthlyOtherCosts;
  const totalAdditionalCosts = (monthlyPropertyTax + monthlyHomeInsurance + monthlyPMI + monthlyHOA + monthlyOtherCosts) * schedule.length;
  const totalOutOfPocket = totalMortgagePayment + totalAdditionalCosts + downPayment;

  state.results = {
    homePrice,
    loanAmount,
    downPayment,
    monthlyPayment,
    monthlyPropertyTax,
    monthlyHomeInsurance,
    monthlyPMI,
    monthlyHOA,
    monthlyOtherCosts,
    totalMonthlyPayment,
    totalMortgagePayment,
    totalInterest,
    totalOutOfPocket,
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
  document.getElementById('monthlyPaymentDisplay').textContent = formatCurrency(state.results.totalMonthlyPayment);

  // Breakdown table
  const r = state.results;
  const scheduleLength = r.schedule.length;
  let tableHTML = `
    <tr class="highlight">
      <td>Mortgage Payment</td>
      <td>${formatCurrency(r.monthlyPayment)}</td>
      <td>${formatCurrency(r.totalMortgagePayment)}</td>
    </tr>
  `;

  if (r.monthlyPropertyTax > 0) {
    tableHTML += `
      <tr>
        <td class="muted">Property Tax</td>
        <td>${formatCurrency(r.monthlyPropertyTax)}</td>
        <td>${formatCurrency(r.monthlyPropertyTax * scheduleLength)}</td>
      </tr>
    `;
  }

  if (r.monthlyHomeInsurance > 0) {
    tableHTML += `
      <tr>
        <td class="muted">Home Insurance</td>
        <td>${formatCurrency(r.monthlyHomeInsurance)}</td>
        <td>${formatCurrency(r.monthlyHomeInsurance * scheduleLength)}</td>
      </tr>
    `;
  }

  const otherMonthly = r.monthlyPMI + r.monthlyHOA + r.monthlyOtherCosts;
  if (otherMonthly > 0) {
    tableHTML += `
      <tr>
        <td class="muted">Other Costs</td>
        <td>${formatCurrency(otherMonthly)}</td>
        <td>${formatCurrency(otherMonthly * scheduleLength)}</td>
      </tr>
    `;
  }

  tableHTML += `
    <tr class="total-row">
      <td>Total Out-of-Pocket</td>
      <td>${formatCurrency(r.totalMonthlyPayment)}</td>
      <td>${formatCurrency(r.totalOutOfPocket)}</td>
    </tr>
  `;

  document.getElementById('breakdownTableBody').innerHTML = tableHTML;

  // Summary stats
  const summaryHTML = `
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        House Price
      </span>
      <span class="stat-value">${formatCurrency(r.homePrice)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Loan Amount</span>
      <span class="stat-value">${formatCurrency(r.loanAmount)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Down Payment</span>
      <span class="stat-value">${formatCurrency(r.downPayment)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total of ${r.schedule.length} Payments</span>
      <span class="stat-value">${formatCurrency(r.totalMortgagePayment)}</span>
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
    { label: 'Principal & Interest', value: r.monthlyPayment, color: 'hsl(168, 80%, 28%)' }
  ];
  if (r.monthlyPropertyTax > 0) {
    data.push({ label: 'Property Tax', value: r.monthlyPropertyTax, color: 'hsl(160, 84%, 39%)' });
  }
  if (r.monthlyHomeInsurance > 0) {
    data.push({ label: 'Home Insurance', value: r.monthlyHomeInsurance, color: 'hsl(38, 92%, 50%)' });
  }
  const otherCosts = r.monthlyPMI + r.monthlyHOA + r.monthlyOtherCosts;
  if (otherCosts > 0) {
    data.push({ label: 'Other Costs', value: otherCosts, color: 'hsl(350, 89%, 60%)' });
  }

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
          borderColor: 'hsl(168, 80%, 28%)',
          backgroundColor: 'hsla(168, 80%, 28%, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Interest',
          data: yearlyData.map(d => d.interest),
          borderColor: 'hsl(350, 89%, 60%)',
          backgroundColor: 'hsla(350, 89%, 60%, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Principal',
          data: yearlyData.map(d => d.principal),
          borderColor: 'hsl(160, 84%, 39%)',
          backgroundColor: 'hsla(160, 84%, 39%, 0.1)',
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
  document.getElementById('homePrice').value = 400000;
  document.getElementById('downPayment').value = 20;
  document.getElementById('loanTerm').value = 30;
  document.getElementById('interestRate').value = 6.197;
  document.getElementById('propertyTax').value = 1.2;
  document.getElementById('homeInsurance').value = 1500;
  document.getElementById('pmiInsurance').value = 0;
  document.getElementById('hoaFee').value = 0;
  document.getElementById('otherCosts').value = 4000;
  document.getElementById('extraMonthlyPayment').value = 0;
  document.getElementById('extraYearlyPayment').value = 0;
  document.getElementById('extraOneTimePayment').value = 0;

  setDownPaymentType('percent');
  setPropertyTaxType('percent');
  setHomeInsuranceType('dollar');
  setPmiType('dollar');
  setHoaType('dollar');
  setOtherCostsType('dollar');

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
