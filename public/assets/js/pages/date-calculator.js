// State
let state = {
    mode: 'duration', // 'duration' or 'addsub'
    op: 'add'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set defaults to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
  document.getElementById('baseDate').value = today;
});

// Toggle Mode
function setMode(mode) {
    state.mode = mode;

    // Tab UI
    document.getElementById('tabDuration').className = mode === 'duration' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabAddSub').className = mode === 'addsub' ? 'tab-btn active' : 'tab-btn';

    // Form Visibility
    if (mode === 'duration') {
        document.getElementById('formDuration').classList.remove('hidden');
        document.getElementById('formAddSub').classList.add('hidden');
    } else {
        document.getElementById('formDuration').classList.add('hidden');
        document.getElementById('formAddSub').classList.remove('hidden');
    }

    // Reset Result
    document.getElementById('resultsContent').classList.add('hidden');
    document.getElementById('resultsPlaceholder').classList.remove('hidden');
}

function setOp(op) {
    state.op = op;
    document.getElementById('opAdd').className = op === 'add' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('opSub').className = op === 'sub' ? 'toggle-btn active' : 'toggle-btn';
}

// Calculation Logic
function calculate() {
    // Hide placeholder, show content
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    if (state.mode === 'duration') {
        const d1 = new Date(document.getElementById('startDate').value);
        const d2 = new Date(document.getElementById('endDate').value);

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            alert("Please enter valid dates.");
            return;
        }

        // Calculate Difference
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Nice breakdown (Years, Months, Days) logic is complex due to varying month lengths.
        // Simplified approximation for breakdown grid:
        const totalWeeks = (diffDays / 7).toFixed(1);
        const totalMonths = (diffDays / 30.44).toFixed(1);
        const totalYears = (diffDays / 365.25).toFixed(2);

        document.getElementById('resultLabel').textContent = "Duration";
        document.getElementById('mainResultDisplay').textContent = `${diffDays} Days`;
        document.getElementById('subResultDisplay').textContent = ""; // Could put detailed string here

        document.getElementById('breakdownGrid').classList.remove('hidden');
        document.getElementById('totalDays').textContent = diffDays;
        document.getElementById('totalWeeks').textContent = totalWeeks;
        document.getElementById('totalMonths').textContent = totalMonths;
        document.getElementById('totalYears').textContent = totalYears;

    } else {
        // Add / Subtract
        const base = new Date(document.getElementById('baseDate').value);
        if (isNaN(base.getTime())) { alert("Invalid date"); return; }

        let y = parseInt(document.getElementById('addYears').value) || 0;
        let m = parseInt(document.getElementById('addMonths').value) || 0;
        let w = parseInt(document.getElementById('addWeeks').value) || 0;
        let d = parseInt(document.getElementById('addDays').value) || 0;

        if (state.op === 'sub') {
            y = -y; m = -m; w = -w; d = -d;
        }

        // Calculation logic
        // Add Years/Months first (calendar logic) then Days/Weeks
        const resultDate = new Date(base);
        resultDate.setFullYear(resultDate.getFullYear() + y);
        resultDate.setMonth(resultDate.getMonth() + m);
        resultDate.setDate(resultDate.getDate() + d + (w * 7));

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        document.getElementById('resultLabel').textContent = "Result Date";
        document.getElementById('mainResultDisplay').textContent = resultDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('subResultDisplay').textContent = resultDate.toLocaleDateString('en-US', { weekday: 'long' });

        document.getElementById('breakdownGrid').classList.add('hidden');
    }
}

function clearForm() {
  const today = new Date().toISOString().split('T')[0];

  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
  document.getElementById('baseDate').value = today;

  document.getElementById('addYears').value = "";
  document.getElementById('addMonths').value = "";
  document.getElementById('addWeeks').value = "";
  document.getElementById('addDays').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
