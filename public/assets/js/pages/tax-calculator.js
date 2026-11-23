// State
let state = {
  deductionType: 'standard', // 'standard' or 'itemized'
  currency: 'USD',
  locale: 'en-US',
  pieChart: null
};

// Federal income tax data, taxable-income thresholds (top of each bracket for the first six rates;
// the 37% bracket is everything above the last number).
// Sources: IRS Rev. Proc. 2025-32 (tax year 2026), IRS Rev. Proc. 2024-40 plus the One Big Beautiful Bill Act
// standard deduction change (tax year 2025), IRS Rev. Proc. 2026-35 (tax year 2027).
// Married filing separately uses the single thresholds, except the 35% bracket tops out at half the joint amount.
const TAX_RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
const DEFAULT_TAX_YEAR = '2026';

const TAX_DATA = {
    '2027': {
        source: 'IRS Rev. Proc. 2026-35',
        standardDeduction: { single: 16600, married_joint: 33200, married_separate: 16600, head_household: 24925 },
        limits: {
            single:           [12800, 52025, 109125, 208325, 264550, 661375],
            married_joint:    [25600, 104050, 218250, 416650, 529100, 793650],
            married_separate: [12800, 52025, 109125, 208325, 264550, 396825],
            head_household:   [18250, 69650, 109100, 208300, 264550, 661350]
        }
    },
    '2026': {
        source: 'IRS Rev. Proc. 2025-32',
        standardDeduction: { single: 16100, married_joint: 32200, married_separate: 16100, head_household: 24150 },
        limits: {
            single:           [12400, 50400, 105700, 201775, 256225, 640600],
            married_joint:    [24800, 100800, 211400, 403550, 512450, 768700],
            married_separate: [12400, 50400, 105700, 201775, 256225, 384350],
            head_household:   [17700, 67450, 105700, 201750, 256200, 640600]
        }
    },
    '2025': {
        source: 'IRS Rev. Proc. 2024-40 and the One Big Beautiful Bill Act',
        standardDeduction: { single: 15750, married_joint: 31500, married_separate: 15750, head_household: 23625 },
        limits: {
            single:           [11925, 48475, 103350, 197300, 250525, 626350],
            married_joint:    [23850, 96950, 206700, 394600, 501050, 751600],
            married_separate: [11925, 48475, 103350, 197300, 250525, 375800],
            head_household:   [17000, 64850, 103350, 197300, 250500, 626350]
        }
    }
};

function getTaxYearData(year) {
    return TAX_DATA[year] || TAX_DATA[DEFAULT_TAX_YEAR];
}

function buildBrackets(year, status) {
    const limits = getTaxYearData(year).limits[status] || getTaxYearData(year).limits.single;
    return TAX_RATES.map((rate, i) => ({ limit: i < limits.length ? limits[i] : Infinity, rate: rate }));
}

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
        deduction = getTaxYearData(year).standardDeduction[status] || 0;
    } else {
        deduction = parseFloat(document.getElementById('itemizedAmount').value) || 0;
    }

    // Taxable Income
    let taxableIncome = Math.max(0, income - deduction);

    // Calculate Tax (Progressive)
    const brackets = buildBrackets(year, status);
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
        year: TAX_DATA[year] ? year : DEFAULT_TAX_YEAR,
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
  document.getElementById('bracketStatusDisplay').textContent = r.status.replace(/_/g, ' ').toUpperCase();
  document.getElementById('bracketYearDisplay').textContent = r.year;
  document.getElementById('bracketSourceDisplay').textContent = getTaxYearData(r.year).source;
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
