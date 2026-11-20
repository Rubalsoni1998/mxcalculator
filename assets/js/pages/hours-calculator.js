// State
let state = {
  currency: 'USD',
  locale: 'en-US'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   setCurrency('USD'); // Default
});

// Toggle functions
function setCurrency(currency) {
  state.currency = currency;
  state.locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const symbol = currency === 'INR' ? '₹' : '$';

  // Update Input Icons/Labels
  document.querySelectorAll('.dynamic-symbol').forEach(el => {
    el.textContent = symbol;
  });

  // Recalculate if values exist
  if(document.getElementById('totalPayDisplay').textContent !== '--') {
      calculate();
  }
}

// Calculation Logic
function calculate() {
    const rows = document.querySelectorAll('.timesheet-row');
    let totalMinutes = 0;

    rows.forEach(row => {
        const startInput = row.querySelector('.start-time').value;
        const endInput = row.querySelector('.end-time').value;
        const breakInput = parseInt(row.querySelector('.break-time').value) || 0;

        if (startInput && endInput) {
            const start = new Date(`1970-01-01T${startInput}:00`);
            let end = new Date(`1970-01-01T${endInput}:00`);

            // Handle overnight
            if (end < start) {
                end.setDate(end.getDate() + 1);
            }

            let diffMs = end - start;
            let diffMins = Math.floor(diffMs / 60000);

            // Subtract break
            diffMins -= breakInput;

            if (diffMins > 0) {
                totalMinutes += diffMins;
            }
        }
    });

    const rate = parseFloat(document.getElementById('hourlyRate').value) || 0;

    // Formatting Results
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const decimalHours = totalMinutes / 60;
    const totalPay = decimalHours * rate;

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    const payFormatter = new Intl.NumberFormat(state.locale, { style: 'currency', currency: state.currency });

    document.getElementById('totalPayDisplay').textContent = payFormatter.format(totalPay);
    document.getElementById('totalHoursDisplay').textContent = `${hours}:${mins.toString().padStart(2, '0')}`;
    document.getElementById('decimalHoursDisplay').textContent = decimalHours.toFixed(2);
    document.getElementById('totalMinutesDisplay').textContent = totalMinutes;
}

function clearForm() {
  const rows = document.querySelectorAll('.timesheet-row');
  rows.forEach(row => {
      row.querySelector('.start-time').value = "";
      row.querySelector('.end-time').value = "";
      row.querySelector('.break-time').value = "";
  });
  document.getElementById('hourlyRate').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
