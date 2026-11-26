// Currency comes from the visitor's choice on the home page (kept in the browser; USD by default).
const mxCur = (window.mxCurrency && window.mxCurrency.get()) || { code: 'USD', locale: 'en-US', symbol: '$' };
// State
let state = {
  solveFor: 'FV',
  paymentMode: 'end', // or 'begin'
  currency: mxCur.code,
  locale: mxCur.locale,
  lineChart: null,
  results: null
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  updateFormState();
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

function setMode(mode) {
    state.paymentMode = mode;
    document.getElementById('modeEnd').className = mode === 'end' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('modeBegin').className = mode === 'begin' ? 'toggle-btn active' : 'toggle-btn';
}

function updateFormState() {
    const solveTarget = document.getElementById('solveFor').value;
    state.solveFor = solveTarget;

    // Reset all fields to enabled/visible
    const fields = ['N', 'RATE', 'PV', 'PMT', 'FV'];
    fields.forEach(f => {
        const el = document.getElementById(getFieldId(f));
        if (el) {
            el.disabled = false;
            el.style.background = 'var(--card)';
            el.style.opacity = '1';
            // Find parent container to potentially highlight which one is target
            // document.getElementById('grp-'+f).style.opacity = '1';
        }
    });

    // Disable the target field
    const targetEl = document.getElementById(getFieldId(solveTarget));
    if (targetEl) {
        targetEl.disabled = true;
        targetEl.value = "";
        targetEl.placeholder = "Calculating...";
        targetEl.style.background = 'var(--secondary)';
        targetEl.style.opacity = '0.7';
    }
}

function getFieldId(code) {
    switch(code) {
        case 'N': return 'n-periods';
        case 'RATE': return 'interestRate';
        case 'PV': return 'presentValue';
        case 'PMT': return 'payment';
        case 'FV': return 'futureValue';
    }
    return '';
}

// Calculation Logic (TVM)
function calculate() {
    const target = getFieldId(document.getElementById('solveFor').value);
    const read = (id) => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) && id !== target ? 0 : v; };
    const n = read('n-periods');
    const rate = read('interestRate');
    const pv = read('presentValue');
    const pmt = read('payment');
    const fv = read('futureValue');

    const py = parseInt(document.getElementById('paymentsPerYear').value) || 1;
    const cy = parseInt(document.getElementById('compoundsPerYear').value) || 1;

    // Convert to standard logical variables
    // We will treat inputs as user typed them. Convention: + for inflow, - for outflow.
    // If user types all positives, we might need to guess, but standard TVM requires signs.

    // For simple solving:
    // rate is annual %.

    let result = 0;
    let resultFormatted = "";
    let resultLabel = "";

    // Core TVM Solver
    try {
        switch(state.solveFor) {
            case 'FV':
                result = calculateFV(n, rate, pv, pmt, py, cy, state.paymentMode);
                resultLabel = "Future Value (FV)";
                resultFormatted = formatCurrency(result);
                break;
            case 'PV':
                result = calculatePV(n, rate, pmt, fv, py, cy, state.paymentMode);
                resultLabel = "Present Value (PV)";
                resultFormatted = formatCurrency(result);
                break;
            case 'PMT':
                result = calculatePMT(n, rate, pv, fv, py, cy, state.paymentMode);
                resultLabel = "Payment (PMT)";
                resultFormatted = formatCurrency(result);
                break;
            case 'N':
                result = calculateN(rate, pv, pmt, fv, py, cy, state.paymentMode);
                resultLabel = "Number of Periods (N)";
                resultFormatted = result.toFixed(2);
                break;
            case 'RATE':
                 // Rate solving is complex iteration, simplifying or alerting limitation
                 // Basic estimation or Newtown-Raphson required.
                 // For this demo, let's implement a simple guesser or just placeholders
                 alert("Rate calculation requires complex iteration. Please use N, PV, PMT, or FV solving modes for this demo version.");
                 return;
        }
    } catch (e) {
        console.error(e);
        alert("Calculation Error. Please check your inputs (ensure correct sign usage, e.g. PV positive, PMT negative).");
        return;
    }

    state.results = {
        label: resultLabel,
        value: result,
        formatted: resultFormatted,
        inputs: { n, rate, pv, pmt, fv, py } // store for chart
    };

    renderResults();
}

// --- TVM Formulas ---
// General Formula: PV*(1+r)^n + PMT * [ ((1+r)^n - 1) / r ] + FV = 0
// (Adjusted for Begin/End mode)

// Helper: effective rate per period
function getRatePerPeriod(annualRate, py, cy) {
    // r = (1 + i/c)^(c/p) - 1
    const i = annualRate / 100;
    return Math.pow(1 + i/cy, cy/py) - 1;
}

function calculateFV(n, annualRate, pv, pmt, py, cy, mode) {
    const r = getRatePerPeriod(annualRate, py, cy);
    const f = Math.pow(1 + r, n);

    let fv = 0;
    if (r === 0) {
        fv = -(pv + pmt * n);
    } else {
        const pmtFactor = (mode === 'begin') ? (1 + r) : 1;
        fv = -( (pv * f) + (pmt * pmtFactor * (f - 1) / r) );
    }
    return fv;
}

function calculatePV(n, annualRate, pmt, fv, py, cy, mode) {
    const r = getRatePerPeriod(annualRate, py, cy);
    const f = Math.pow(1 + r, n);

    let pv = 0;
    if (r === 0) {
        pv = -(fv + pmt * n);
    } else {
        const pmtFactor = (mode === 'begin') ? (1 + r) : 1;
        pv = -( (fv + (pmt * pmtFactor * (f - 1) / r)) / f );
    }
    return pv;
}

function calculatePMT(n, annualRate, pv, fv, py, cy, mode) {
    const r = getRatePerPeriod(annualRate, py, cy);
    const f = Math.pow(1 + r, n);

    let pmt = 0;
    if (r === 0) {
        pmt = -(fv + pv) / n;
    } else {
        const pmtFactor = (mode === 'begin') ? (1 + r) : 1;
        pmt = -( (pv * f + fv) * r ) / ( pmtFactor * (f - 1) );
    }
    return pmt;
}

function calculateN(annualRate, pv, pmt, fv, py, cy, mode) {
    const r = getRatePerPeriod(annualRate, py, cy);

    if (r === 0) {
        return -(fv + pv) / pmt;
    }

    const pmtFactor = (mode === 'begin') ? (1 + r) : 1;
    // Solving V(1+r)^n + P/r((1+r)^n - 1) + F = 0 for n
    // (1+r)^n * (V + P/r) = P/r - F
    // (1+r)^n = (P/r - F) / (V + P/r)
    // n = ln(...) / ln(1+r)

    const top = (pmt * pmtFactor / r) - fv;
    const bottom = pv + (pmt * pmtFactor / r);

    if ( (top > 0 && bottom < 0) || (top < 0 && bottom > 0) ) {
         // signs mismatch, logarithmic error
         return 0; 
    }

    const n = Math.log( top / bottom ) / Math.log(1 + r);
    return n;
}

function renderResults() {
  if (!state.results) return;

  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  const r = state.results;
  document.getElementById('resultLabel').textContent = r.label;
  document.getElementById('resultValueDisplay').textContent = r.formatted;

  // Breakdown table
  const tableBody = document.getElementById('breakdownTableBody');
  tableBody.innerHTML = `
    <tr>
        <td class="muted">Periods (N)</td>
        <td>${document.getElementById('n-periods').value || r.value.toFixed(2)}</td>
    </tr>
     <tr>
        <td class="muted">Annual Rate</td>
        <td>${document.getElementById('interestRate').value}%</td>
    </tr>
     <tr>
        <td class="muted">Present Value</td>
        <td>${formatCurrency(document.getElementById('presentValue').value || r.value)}</td>
    </tr>
    <tr>
        <td class="muted">Payment</td>
        <td>${formatCurrency(document.getElementById('payment').value || r.value)}</td>
    </tr>
    <tr class="total-row">
        <td>Result: ${r.label}</td>
        <td>${r.formatted}</td>
    </tr>
  `;

  // Chart
  renderLineChart();
}

function renderLineChart() {
  const ctx = document.getElementById('lineChart').getContext('2d');

  if (state.lineChart) {
    state.lineChart.destroy();
  }

  // Simulate simple growth for chart context
  // This is an approximation to visualize the trend
  const n = parseFloat(document.getElementById('n-periods').value) || (state.solveFor === 'N' ? state.results.value : 10);
  const points = 20; // data points
  const step = n / points;

  const labels = [];
  const data = [];

  // Simple projection using PV and PMT to show accumulation/depletion
  let balance = parseFloat(document.getElementById('presentValue').value) || (state.solveFor === 'PV' ? state.results.value : 0);
  const pmt = parseFloat(document.getElementById('payment').value) || (state.solveFor === 'PMT' ? state.results.value : 0);
  const rate = parseFloat(document.getElementById('interestRate').value) || 0;

  // Very basic simulation for visual aid (annual steps approx)
  const r = rate / 100 / (12/step); // rough rate per step

  for(let i=0; i<=points; i++) {
      labels.push((i * step).toFixed(1));
      data.push(balance);
      // Apply interest + pmt
      balance = balance * (1 + r) + (pmt * step); // rough logic
  }

  state.lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Balance Trend',
          data: data,
          borderColor: 'hsl(255, 85%, 55%)', // Primary Violet
          backgroundColor: 'hsla(255, 85%, 55%, 0.1)',
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
                 return `Value: ${formatCurrency(context.raw)}`;
              }
           }
        }
      },
      scales: {
         x: { grid: { display: false }, title: { display: true, text: 'Periods' } },
         y: { 
             ticks: { 
                 callback: function(value) { 
                    return (value/1000).toFixed(0) + 'k';
                 } 
             } 
         }
      }
    }
  });
}

function clearForm() {
  document.getElementById('n-periods').value = "";
  document.getElementById('interestRate').value = "";
  document.getElementById('presentValue').value = "";
  document.getElementById('payment').value = "";
  document.getElementById('futureValue').value = "";

  document.getElementById('solveFor').value = "FV";
  updateFormState(); // reset enable/disable

  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('resultsPlaceholder').style.display = 'flex';
}

// Utility functions
function formatCurrency(value) {
  if (isNaN(value)) return "Error";
  return new Intl.NumberFormat(state.locale, {
    style: 'currency',
    currency: state.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
