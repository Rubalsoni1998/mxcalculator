// State
let currentMode = 1;
let chartInstance = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   // defaults
});

// Toggle Modes
function setMode(mode) {
    currentMode = mode;

    // Tabs UI
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab${mode}`).classList.add('active');

    // Forms UI
    document.querySelectorAll('.form-mode').forEach(form => form.classList.add('hidden'));
    document.getElementById(`formMode${mode}`).classList.remove('hidden');

    // Reset Result
    document.getElementById('resultsContent').classList.add('hidden');
    document.getElementById('resultsPlaceholder').classList.remove('hidden');
}

// Calculation Logic
function calculate() {
    let result = 0;
    let label = "Result";
    let equation = "";
    let dataForChart = [];
    let chartLabels = [];
    let chartType = 'pie';
    let chartColors = ['hsl(225, 75%, 55%)', 'hsl(210, 20%, 80%)'];

    if (currentMode === 1) {
        // X% of Y
        const pct = parseFloat(document.getElementById('m1_percent').value);
        const num = parseFloat(document.getElementById('m1_num').value);

        if (isNaN(pct) || isNaN(num)) return;

        result = (pct / 100) * num;
        label = `${pct}% of ${num}`;
        equation = `${pct}% × ${num} = ${result}`;

        // Pie chart: Result vs Remainder (if pct < 100)
        if (pct <= 100) {
            chartLabels = ['Result', 'Remainder'];
            dataForChart = [result, num - result];
        } else {
            // Bar chart for growth
            chartType = 'bar';
            chartLabels = ['Original', 'Result'];
            dataForChart = [num, result];
        }

    } else if (currentMode === 2) {
        // X is what % of Y
        const n1 = parseFloat(document.getElementById('m2_num1').value);
        const n2 = parseFloat(document.getElementById('m2_num2').value);

        if (isNaN(n1) || isNaN(n2) || n2 === 0) return;

        result = (n1 / n2) * 100;
        label = `${n1} is what % of ${n2}`;
        equation = `${n1} / ${n2} = ${result.toFixed(2)}%`;

        if (n1 <= n2) {
             chartLabels = ['Part', 'Whole'];
             dataForChart = [n1, n2 - n1];
        } else {
             chartType = 'bar';
             chartLabels = ['Whole', 'Part'];
             dataForChart = [n2, n1];
        }

    } else if (currentMode === 3) {
        // % Change
        const from = parseFloat(document.getElementById('m3_from').value);
        const to = parseFloat(document.getElementById('m3_to').value);

        if (isNaN(from) || isNaN(to) || from === 0) return; // avoid div by zero

        const diff = to - from;
        result = (diff / Math.abs(from)) * 100;
        const type = result >= 0 ? "Increase" : "Decrease";

        label = `Percentage ${type}`;
        equation = `(${to} - ${from}) / ${from} × 100 = ${result.toFixed(2)}%`;

        chartType = 'bar';
        chartLabels = ['From', 'To'];
        dataForChart = [from, to];
        if(result < 0) chartColors = ['hsl(210, 20%, 80%)', 'hsl(350, 89%, 60%)']; // Red for decrease
        else chartColors = ['hsl(210, 20%, 80%)', 'hsl(160, 84%, 39%)']; // Green for increase
    }

    // Render Text
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('resultLabel').textContent = label;
    // Check if mode 2 or 3 (percent result)
    let displayVal = result.toLocaleString('en-US', {maximumFractionDigits: 2});
    if (currentMode !== 1) displayVal += "%";

    document.getElementById('resultValueDisplay').textContent = displayVal;
    document.getElementById('resultEquationDisplay').textContent = equation;

    // Render Chart
    renderChart(chartType, chartLabels, dataForChart, chartColors);
}

function renderChart(type, labels, data, colors) {
    const ctx = document.getElementById('resultChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    const config = {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: type === 'doughnut' || type === 'pie' }
            }
        }
    };

    // Adjust for bar chart
    if (type === 'bar') {
        config.options.plugins.legend.display = false;
        config.options.scales = {
            y: { beginAtZero: true }
        };
    } else {
         // For pie/doughnut cutout
         config.type = 'doughnut';
         config.options.cutout = '60%';
    }

    chartInstance = new Chart(ctx, config);
}

function clearForm() {
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(i => i.value = "");

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
