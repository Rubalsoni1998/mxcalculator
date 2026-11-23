// State
let state = {
  results: null,
  lineChart: null,
  currency: 'USD',
  locale: 'en-US'
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

// Calculation
function calculate() {
  // Get Values
  const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
  const retireAge = parseInt(document.getElementById('retirementAge').value) || 65;
  const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value) || 85;

  // Basic Validation
  if (currentAge >= retireAge) {
      alert("Retirement age must be greater than current age.");
      return;
  }
  if (retireAge >= lifeExpectancy) {
      alert("Life expectancy must be greater than retirement age.");
      return;
  }

  let currentIncome = parseFloat(document.getElementById('currentIncome').value) || 0;
  const savingsPct = parseFloat(document.getElementById('savingsPercent').value) || 0;
  let balance = parseFloat(document.getElementById('currentSavings').value) || 0;

  const incomeIncrease = parseFloat(document.getElementById('incomeIncrease').value) || 0;
  const incomeRequiredPct = parseFloat(document.getElementById('incomeRequiredPct').value) || 80;
  const preRate = parseFloat(document.getElementById('preRate').value) || 0;
  const postRate = parseFloat(document.getElementById('postRate').value) || 0;
  const inflation = parseFloat(document.getElementById('inflationRate').value) || 3;

  const schedule = [];

  // Simulation
  let age = currentAge;
  let annualContribution = 0;
  let interestEarned = 0;

  // Phase 1: Working
  while(age < retireAge) {
      annualContribution = currentIncome * (savingsPct / 100);

      interestEarned = (balance * (preRate/100)) + (annualContribution * (preRate/100/2));

      balance += annualContribution + interestEarned;

      schedule.push({
          age: age + 1, // End of this year
          type: 'Working',
          income: currentIncome,
          cashFlow: annualContribution, // +Savings
          interest: interestEarned,
          balance: balance
      });

      // Next Year Adjustments
      currentIncome *= (1 + incomeIncrease/100);
      age++;
  }

  const balanceAtRetirement = balance;
  const finalWorkingIncome = currentIncome; // Income right before retirement
  let retirementIncomeNeeded = finalWorkingIncome * (incomeRequiredPct / 100);

  // Phase 2: Retirement
  while(age < lifeExpectancy) {
      interestEarned = (balance * (postRate/100)); // Earn interest

      // Withdraw needed income (minus Interest? No, withdraw from pile)
      balance -= retirementIncomeNeeded;
      balance += interestEarned; // Add interest earned on remaining

      schedule.push({
          age: age + 1,
          type: 'Retired',
          income: 0,
          cashFlow: -retirementIncomeNeeded, // -Withdrawal
          interest: interestEarned,
          balance: Math.max(0, balance)
      });

      // Next Year: Required income grows by inflation
      retirementIncomeNeeded *= (1 + inflation/100);
      age++;
  }

  state.results = {
      balanceAtRetirement,
      finalBalance: balance,
      schedule,
      retireAge,
      isSolvent: balance > 0
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
  document.getElementById('resRetireAge').textContent = r.retireAge;
  document.getElementById('finalBalance').textContent = formatCurrency(r.balanceAtRetirement);

  const badge = document.getElementById('statusMessage');
  if (r.isSolvent) {
      badge.className = 'status-badge status-success';
      badge.textContent = 'Savings sufficient for lifespan';
  } else {
      badge.className = 'status-badge status-danger';
      badge.textContent = 'Savings depleted before age ' + document.getElementById('lifeExpectancy').value;
  }

  // Breakdown table (Key Milestones)
  // Showing 5-year intervals + Retirement Start + End
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = '';

  r.schedule.forEach(row => {
      if (row.age % 5 === 0 || row.age === r.retireAge || row.age === r.schedule[r.schedule.length-1].age) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>Age ${row.age}</td>
            <td>${formatCurrency(row.balance)}</td>
          `;
          if (row.age === r.retireAge) tr.style.fontWeight = 'bold';
          tableBody.appendChild(tr);
      }
  });

  // Full Schedule
  const schedBody = document.getElementById('scheduleTableBody');
  schedBody.innerHTML = '';
   r.schedule.forEach(row => {
      const tr = document.createElement('tr');
      const flowLabel = row.type === 'Working' ? 'Save' : 'Draw';

      tr.innerHTML = `
        <td>${row.age}</td>
        <td>${row.type === 'Working' ? formatCurrency(row.income) : '-'}</td>
        <td>${formatCurrency(row.cashFlow)} / ${formatCurrency(row.interest)}</td>
        <td>${formatCurrency(row.balance)}</td>
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

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: r.schedule.map(d => d.age),
      datasets: [
        {
          label: 'Balance',
          data: r.schedule.map(d => d.balance),
          borderColor: 'hsl(142, 70%, 35%)', // Primary Green
          backgroundColor: 'hsla(142, 70%, 35%, 0.1)',
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
         x: { title: { display: true, text: 'Age' }, grid: { display: false } },
         y: { 
             ticks: { 
                 callback: function(value) { 
                    return state.currency === 'INR' ? '₹' + (value/1000).toFixed(0) + 'k' : '$' + (value/1000).toFixed(0) + 'k';
                 } 
             } 
         }
      }
    }
  });
}

function clearForm() {
  // Main Fields
  document.getElementById('currentAge').value = 30;
  document.getElementById('retirementAge').value = 65;
  document.getElementById('lifeExpectancy').value = 85;
  document.getElementById('currentIncome').value = 60000;
  document.getElementById('currentSavings').value = 40000;
  document.getElementById('savingsPercent').value = 15;

  // Advanced Fields
  document.getElementById('incomeIncrease').value = 2;
  document.getElementById('incomeRequiredPct').value = 80;
  document.getElementById('preRate').value = 7;
  document.getElementById('postRate').value = 4;
  document.getElementById('inflationRate').value = 3;

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
