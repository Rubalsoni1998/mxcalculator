// State
let state = {
    mode: 'addsub', // 'addsub' or 'duration'
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
    document.getElementById('tabAddSub').className = mode === 'addsub' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabDuration').className = mode === 'duration' ? 'tab-btn active' : 'tab-btn';

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
        // Get Date + Time string
        const startStr = `${document.getElementById('startDate').value}T${document.getElementById('startTime').value}`;
        const endStr = `${document.getElementById('endDate').value}T${document.getElementById('endTime').value}`;

        const d1 = new Date(startStr);
        const d2 = new Date(endStr);

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            alert("Please enter valid dates and times.");
            return;
        }

        // Calculate Difference in MS
        const diffTime = Math.abs(d2 - d1);

        // Breakdown
        const totalSeconds = Math.floor(diffTime / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        // Remainder breakdown
        const days = totalDays;
        const hours = totalHours % 24;
        const minutes = totalMinutes % 60;
        const seconds = totalSeconds % 60;

        document.getElementById('resultLabel').textContent = "Duration";
        document.getElementById('mainResultDisplay').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        document.getElementById('subResultDisplay').textContent = "Total Time";

        document.getElementById('breakdownGrid').classList.remove('hidden');

        const tbody = document.getElementById('breakdownBody');
        tbody.innerHTML = `
            <tr>
                <td>Total Hours</td>
                <td>${totalHours.toLocaleString()} hours</td>
            </tr>
            <tr>
                <td>Total Minutes</td>
                <td>${totalMinutes.toLocaleString()} minutes</td>
            </tr>
            <tr>
                <td>Total Seconds</td>
                <td>${totalSeconds.toLocaleString()} seconds</td>
            </tr>
        `;

    } else {
        // Add / Subtract
        const baseStr = `${document.getElementById('baseDate').value}T${document.getElementById('baseTime').value}`;
        const base = new Date(baseStr);

        if (isNaN(base.getTime())) { alert("Invalid date/time"); return; }

        let d = parseInt(document.getElementById('addDays').value) || 0;
        let h = parseInt(document.getElementById('addHours').value) || 0;
        let m = parseInt(document.getElementById('addMinutes').value) || 0;
        let s = parseInt(document.getElementById('addSeconds').value) || 0;

        if (state.op === 'sub') {
            d = -d; h = -h; m = -m; s = -s;
        }

        // Calculation logic using Timestamps for accuracy across month boundaries
        // But basic Date setters handle overflow automatically (e.g. June 31 -> July 1)
        // EXCEPT for Time + Date mix, usually safer to add milliseconds or use set methods sequentially

        const resultDate = new Date(base);
        resultDate.setDate(resultDate.getDate() + d);
        resultDate.setHours(resultDate.getHours() + h);
        resultDate.setMinutes(resultDate.getMinutes() + m);
        resultDate.setSeconds(resultDate.getSeconds() + s);

        document.getElementById('resultLabel').textContent = "Result Date & Time";

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };

        // Split display for readability
        const datePart = resultDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timePart = resultDate.toLocaleTimeString('en-US');

        document.getElementById('mainResultDisplay').textContent = timePart;
        document.getElementById('subResultDisplay').textContent = datePart;

        document.getElementById('breakdownGrid').classList.add('hidden');
    }
}

function clearForm() {
  const today = new Date().toISOString().split('T')[0];

  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
  document.getElementById('baseDate').value = today;
  document.getElementById('baseTime').value = "12:00";
  document.getElementById('startTime').value = "09:00";
  document.getElementById('endTime').value = "17:00";

  document.getElementById('addDays').value = "";
  document.getElementById('addHours').value = "";
  document.getElementById('addMinutes').value = "";
  document.getElementById('addSeconds').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
