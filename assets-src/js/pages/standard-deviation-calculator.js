// State
let mode = 'sample';
let chartInstance = null;

// Mode Toggle
function setMode(newMode) {
    mode = newMode;
    document.getElementById('btnSample').className = mode === 'sample' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('btnPop').className = mode === 'population' ? 'toggle-btn active' : 'toggle-btn';
    // Re-calc if data exists
    if (document.getElementById('dataInput').value.trim() !== "") {
        calculate();
    }
}

// Calculation Logic
function calculate() {
    const rawInput = document.getElementById('dataInput').value;
    // Split by comma, space, newline, tab
    const tokens = rawInput.split(/[\s,]+/);

    const data = [];
    for(let t of tokens) {
        if (t.trim() === '') continue;
        const num = parseFloat(t);
        if (!isNaN(num)) data.push(num);
    }

    if (data.length < 2) {
        alert("Please enter at least 2 numbers.");
        return;
    }

    const n = data.length;

    // Mean
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Variance
    let sumSqDiff = 0;
    for(let x of data) {
        sumSqDiff += Math.pow(x - mean, 2);
    }

    let variance = 0;
    let stdDev = 0;

    if (mode === 'sample') {
        variance = sumSqDiff / (n - 1);
    } else {
        variance = sumSqDiff / n;
    }

    stdDev = Math.sqrt(variance);
    const stdError = stdDev / Math.sqrt(n);

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    // Format (up to 4-6 decimals usually good for stats)
    const fmt = (num) => parseFloat(num.toFixed(6));

    document.getElementById('resStdDev').textContent = fmt(stdDev);
    document.getElementById('resLabel').textContent = mode === 'sample' ? "Sample Standard Deviation (s)" : "Population Standard Deviation (σ)";

    document.getElementById('varSymbol').textContent = mode === 'sample' ? "s²" : "σ²";
    document.getElementById('resVariance').textContent = fmt(variance);
    document.getElementById('resMean').textContent = fmt(mean);
    document.getElementById('resSum').textContent = fmt(sum);
    document.getElementById('resCount').textContent = n;
    document.getElementById('resError').textContent = fmt(stdError);

    renderChart(mean, stdDev);
}

function renderChart(mean, stdDev) {
    const ctx = document.getElementById('distributionChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    // Generate bell curve data points
    // Range: Mean +/- 4 SD
    const minX = mean - 4 * stdDev;
    const maxX = mean + 4 * stdDev;
    const step = (maxX - minX) / 100; // 100 points

    const labels = [];
    const dataPoints = [];

    for(let x = minX; x <= maxX; x += step) {
        // Normal PDF formula
        const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        labels.push(x.toFixed(2));
        dataPoints.push(y);
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Normal Distribution',
                data: dataPoints,
                borderColor: 'hsl(265, 70%, 50%)',
                backgroundColor: 'hsla(265, 70%, 50%, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0 // Smooth line
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                     callbacks: {
                         title: (ctx) => `Value: ${ctx[0].label}`,
                         label: (ctx) => `Probability Density: ${ctx.raw.toFixed(4)}`
                     }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(val, index) {
                            // Show specific ticks roughly matching Mean, +/- SD
                            // This is hard with auto-generated labels, so we let Chart.js auto-skip
                            return this.getLabelForValue(val);
                        },
                        maxTicksLimit: 9
                    },
                    grid: { display: false }
                },
                y: {
                    display: false // Hide density values, just show shape
                }
            }
        }
    });
}

function clearForm() {
  document.getElementById('dataInput').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
