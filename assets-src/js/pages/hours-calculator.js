// Currency comes from the visitor's choice on the home page (kept in the browser; USD by default).
const mxCur = (window.mxCurrency && window.mxCurrency.get()) || { code: 'USD', locale: 'en-US', symbol: '$' };
// State
let state = {
  currency: mxCur.code,
  locale: mxCur.locale
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
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
