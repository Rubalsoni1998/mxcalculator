// Currency comes from the visitor's choice on the home page (kept in the browser; USD by default).
const mxCur = (window.mxCurrency && window.mxCurrency.get()) || { code: 'USD', locale: 'en-US', symbol: '$' };
// State
let state = {
  results: null,
  pieChart: null,
  lineChart: null,
  contribTiming: 'beginning',
  currency: mxCur.code,
  locale: mxCur.locale
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  calculate(); 
});

// Toggle functions
// Currency symbols in the inputs. USD is already in the HTML, so the default case does no work at all.
function applyCurrencySymbols() {
  if (mxCur.code === 'USD') return;
  document.querySelectorAll('.dynamic-symbol, .dynamic-symbol-btn').forEach(el => {
    el.textContent = mxCur.symbol;
  });
}
applyCurrencySymbols();

function setContribTiming(timing) {
    state.contribTiming = timing;
    document.getElementById('contribBeginning').className = timing === 'beginning' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('contribEnd').className = timing === 'end' ? 'toggle-btn active' : 'toggle-btn';
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
  const startAmount = parseFloat(document.getElementById('startAmount').value) || 0;
  const years = parseFloat(document.getElementById('investmentTerm').value) || 0;
  const rate = parseFloat(document.getElementById('returnRate').value) || 0;
  const compoundFreq = parseInt(document.getElementById('compoundFreq').value);

  const contribAmount = parseFloat(document.getElementById('additionalContrib').value) || 0;
  const contribFreq = parseInt(document.getElementById('contribFreq').value);

  // Basic Validation
  if (years <= 0) {
     // Handle trivial case or alert
     // Let's assume 0 years means just showing start amount
  }

  // Simulation variables
  let balance = startAmount;
  let totalContributions = startAmount;
  let totalInterest = 0;

  const schedule = [];
  const annualRate = rate / 100;

  // We'll simulate month by month for accuracy with different frequencies
  // Total simulation steps = years * 12 (months)
  // If daily compounding, ideally we simulate days, but for chart we usually aggregate annually

  // Approach: Calculate Future Value directly for speed? 
  // But we need annual breakdown for chart.

  // Let's use a loop per year for the schedule
  let prevBalance = balance;

  for(let y=1; y<=years; y++) {
      let interestThisYear = 0;
      let contribThisYear = 0;

      // Sub-loop for compounding periods within the year? 
      // Simplification: Calculate End Balance for the year based on inputs

      // 1. Principal Growth: P(1 + r/n)^(nt)
      // 2. Series of Payments Future Value

      // Iterative approach is safer for mixed frequencies
      // We will iterate based on the "most frequent" action: either Compounding or Contribution
      // Let's iterate monthly as a reasonable common denominator (approx for daily)

      // Actually, let's step by smallest period defined by max(compoundFreq, contribFreq, 12)
      // But Standard 12 steps/year is good enough approximation for charts usually

      let subPeriods = 12; 
      let ratePerPeriod = 0;

      // Effective rate per sub-period (month)
      // If compounding is daily (365), effective annual is (1+r/365)^365. Monthly is (1+r/365)^(365/12)-1
      if (compoundFreq >= 12) {
          ratePerPeriod = Math.pow(1 + annualRate/compoundFreq, compoundFreq/12) - 1;
      } else {
          // Compounding less than monthly (e.g. Annually)
          // This is tricky in a monthly loop. 
          // Standard approach: Simple interest within the compounding period?
          // Or just apply interest only at the compounding month?
          // Let's assume standard monthly compounding for chart smoothness if freq is high, 
          // otherwise strictly apply at intervals.
          // To be robust: Let's assume daily simulation for highest accuracy if needed, but computationally heavy.
          // Let's stick to standard formulas per year.
          ratePerPeriod = Math.pow(1 + annualRate/compoundFreq, compoundFreq/12) - 1;
      }

      for(let m=1; m<=12; m++) {
          let monthlyContrib = 0;

          // Determine contribution this month
          if (contribFreq === 12) monthlyContrib = contribAmount;
          else if (contribFreq === 1 && m === 1) monthlyContrib = contribAmount; // Annual at start of year?
          else if (contribFreq === 26) monthlyContrib = (contribAmount * 26) / 12; // Approx for Bi-weekly

          // Apply contribution timing
          if (state.contribTiming === 'beginning') {
              balance += monthlyContrib;
              totalContributions += monthlyContrib;
              contribThisYear += monthlyContrib;
          }

          // Apply Interest
          let interest = balance * ratePerPeriod;
          balance += interest;
          totalInterest += interest;
          interestThisYear += interest;

          if (state.contribTiming === 'end') {
              balance += monthlyContrib;
              totalContributions += monthlyContrib;
              contribThisYear += monthlyContrib;
          }
      }

      schedule.push({
          year: y,
          interest: interestThisYear,
          totalInterest: totalInterest,
          balance: balance
      });
  }

  state.results = {
      startAmount,
      totalContributions, // Note: Includes start amount in this tracking logic
      totalInterest,
      endBalance: balance,
      schedule
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
  document.getElementById('endBalanceDisplay').textContent = formatCurrency(r.endBalance);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Starting Amount</td>
        <td>${formatCurrency(r.startAmount)}</td>
    </tr>
    <tr>
        <td class="muted">Total Contributions</td>
        <td>${formatCurrency(r.totalContributions - r.startAmount)}</td>
    </tr>
    <tr>
        <td class="muted">Total Interest</td>
        <td>${formatCurrency(r.totalInterest)}</td>
    </tr>
    <tr class="total-row">
        <td>End Balance</td>
        <td>${formatCurrency(r.endBalance)}</td>
    </tr>
  `;

  // Full Schedule
  const schedBody = document.getElementById('scheduleTableBody');
  schedBody.innerHTML = '';

  // Limit rows for performance if many years
  const displaySchedule = r.schedule.length > 50 
    ? r.schedule.filter((d, i) => i === 0 || d.year % 5 === 0 || i === r.schedule.length - 1)
    : r.schedule;

  displaySchedule.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Year ${row.year}</td>
        <td>${formatCurrency(row.interest)}</td>
        <td>${formatCurrency(row.totalInterest)}</td>
        <td>${formatCurrency(row.balance)}</td>
      `;
      schedBody.appendChild(tr);
  });

  // Chart
  renderCharts();
}

function renderCharts() {
    const r = state.results;

    // 1. Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (state.pieChart) state.pieChart.destroy();

    const principal = r.startAmount;
    const contribs = r.totalContributions - r.startAmount;
    const interest = r.totalInterest;

    const pieData = [
        { label: 'Starting Principal', value: principal, color: 'hsl(160, 60%, 80%)' },
        { label: 'Contributions', value: contribs, color: 'hsl(160, 70%, 60%)' },
        { label: 'Interest', value: interest, color: 'hsl(160, 84%, 39%)' }
    ];
    const validPieData = pieData.filter(d => d.value > 0);

    state.pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: validPieData.map(d => d.label),
            datasets: [{
                data: validPieData.map(d => d.value),
                backgroundColor: validPieData.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                     callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((val/total)*100).toFixed(1);
                            return `${context.label}: ${formatCurrency(val)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
    document.getElementById('chartLegend').innerHTML = ''; // Clear custom legend if using ChartJS standard

    // 2. Line Chart
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if (state.lineChart) state.lineChart.destroy();

    state.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: r.schedule.map(d => `Year ${d.year}`),
            datasets: [
                {
                    label: 'Total Balance',
                    data: r.schedule.map(d => d.balance),
                    borderColor: 'hsl(160, 84%, 39%)',
                    backgroundColor: 'hsla(160, 84%, 39%, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Total Principal',
                    // Principal = Start + (Contrib * months passed) roughly. 
                    // Exact principal tracking would need to be stored in schedule. 
                    // Approx: Balance - TotalInterest
                    data: r.schedule.map(d => d.balance - d.totalInterest),
                    borderColor: 'hsl(210, 20%, 60%)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                     callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
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

function clearForm() {
  document.getElementById('startAmount').value = 10000;
  document.getElementById('investmentTerm').value = 10;
  document.getElementById('returnRate').value = 6;
  document.getElementById('additionalContrib').value = 500;

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
