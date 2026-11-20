// State
let state = {
  deductionType: 'standard', // 'standard' or 'itemized'
  currency: 'USD',
  locale: 'en-US',
  pieChart: null
};

// Tax Brackets (Simplified 2024 Data)
const taxBrackets2024 = {
    single: [
        { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 }
    ],
    married_joint: [
        { limit: 23200, rate: 0.10 },
        { limit: 94300, rate: 0.12 },
        { limit: 201050, rate: 0.22 },
        { limit: 383900, rate: 0.24 },
        { limit: 487450, rate: 0.32 },
        { limit: 731200, rate: 0.35 },
        { limit: Infinity, rate: 0.37 }
    ],
    // ... simplified mapping for others ...
    married_separate: [
         { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 365600, rate: 0.35 },
        { limit: Infinity, rate: 0.37 }
    ],
    head_household: [
        { limit: 16550, rate: 0.10 },
        { limit: 63100, rate: 0.12 },
        { limit: 100500, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243700, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 }
    ]
};

const standardDeduction2024 = {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_household: 21900
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

function setDeductionType(type) {
    state.deductionType = type;
    document.getElementById('deductionStandard').className = type === 'standard' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('deductionItemized').className = type === 'itemized' ? 'toggle-btn active' : 'toggle-btn';

    document.getElementById('itemizedInputGroup').style.display = type === 'itemized' ? 'block' : 'none';
}

// Calculation Logic
function calculate() {
    const income = parseFloat(document.getElementById('grossIncome').value) || 0;
    const status = document.getElementById('filingStatus').value;
    const year = document.getElementById('taxYear').value;

    // Determine Deduction
    let deduction = 0;
    if (state.deductionType === 'standard') {
        // Basic lookup (simplified for 2024/23)
        deduction = standardDeduction2024[status] || 0;
    } else {
        deduction = parseFloat(document.getElementById('itemizedAmount').value) || 0;
    }

    // Taxable Income
    let taxableIncome = Math.max(0, income - deduction);

    // Calculate Tax (Progressive)
    const brackets = taxBrackets2024[status];
    let tax = 0;
    let previousLimit = 0;
    let marginalRate = 0;

    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const taxableAmountInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
            tax += taxableAmountInBracket * bracket.rate;
            marginalRate = bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }

    // Rates
    const effectiveRate = (income > 0) ? (tax / income) * 100 : 0;
    const afterTaxIncome = income - tax;

    state.results = {
        income,
        deduction,
        taxableIncome,
        tax,
        afterTaxIncome,
        marginalRate: (marginalRate * 100).toFixed(2),
        effectiveRate: effectiveRate.toFixed(2),
        status,
        brackets
    };

    renderResults();
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('bracketsSection').style.display = 'block';

  const r = state.results;
  document.getElementById('resultValueDisplay').textContent = formatCurrency(r.tax);

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Gross Income</td>
        <td>${formatCurrency(r.income)}</td>
    </tr>
     <tr>
        <td class="muted">Deduction</td>
        <td>- ${formatCurrency(r.deduction)}</td>
    </tr>
     <tr>
        <td class="muted">Taxable Income</td>
        <td>${formatCurrency(r.taxableIncome)}</td>
    </tr>
    <tr class="total-row">
        <td>Total Tax</td>
        <td>${formatCurrency(r.tax)}</td>
    </tr>
    <tr>
        <td class="muted">After-Tax Income</td>
        <td>${formatCurrency(r.afterTaxIncome)}</td>
    </tr>
    <tr style="background:#fff3e0">
        <td class="muted">Effective Tax Rate</td>
        <td>${r.effectiveRate}%</td>
    </tr>
     <tr style="background:#fff3e0">
        <td class="muted">Marginal Tax Rate</td>
        <td>${r.marginalRate}%</td>
    </tr>
  `;

  // Update Brackets Table
  document.getElementById('bracketStatusDisplay').textContent = r.status.replace('_', ' ').toUpperCase();
  const bracketsBody = document.getElementById('bracketsTableBody');
  bracketsBody.innerHTML = '';

  let prevLim = 0;
  let cumTax = 0;

  r.brackets.forEach((b, i) => {
      const ratePct = (b.rate * 100).toFixed(0) + '%';
      const rangeLabel = b.limit === Infinity 
         ? `Over ${formatCurrency(prevLim)}` 
         : `${formatCurrency(prevLim)} - ${formatCurrency(b.limit)}`;

      // Calculate cumulative tax for display
      let taxForThisBracket = 0;
      if (b.limit !== Infinity) {
         taxForThisBracket = (b.limit - prevLim) * b.rate;
      }

      const taxCalc = b.limit === Infinity 
         ? `${formatCurrency(cumTax)} + ${ratePct} of amount over ${formatCurrency(prevLim)}`
         : `${formatCurrency(cumTax)} + ${ratePct} of amount over ${formatCurrency(prevLim)}`;

      const tr = document.createElement('tr');
      // Highlight active bracket
      if (r.taxableIncome > prevLim && (r.taxableIncome <= b.limit || b.limit === Infinity)) {
          tr.style.background = "hsl(25, 95%, 90%)";
          tr.style.fontWeight = "bold";
      }

      tr.innerHTML = `
         <td>${ratePct}</td>
         <td>${rangeLabel}</td>
         <td style="font-size:0.8rem; color:var(--muted-foreground)">${taxCalc}</td>
      `;
      bracketsBody.appendChild(tr);

      cumTax += taxForThisBracket;
      prevLim = b.limit;
  });

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
      { label: 'Tax', value: r.tax, color: 'hsl(25, 95%, 53%)' }, // Orange
      { label: 'After-Tax Income', value: r.afterTaxIncome, color: 'hsl(210, 20%, 80%)' } // Gray
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
  document.getElementById('grossIncome').value = "";
  document.getElementById('itemizedAmount').value = 0;
  setDeductionType('standard');

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('bracketsSection').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  if (isNaN(value)) return "Error";
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
