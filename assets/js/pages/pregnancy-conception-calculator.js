// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set default target to ~9 months from now
  const future = new Date();
  future.setMonth(future.getMonth() + 9);
  document.getElementById('inputDate').valueAsDate = future;
});

// Calculation Logic
function calculate() {
    const inputDateVal = document.getElementById('inputDate').value;
    if (!inputDateVal) { alert("Please select a date"); return; }

    const dueDate = new Date(inputDateVal);

    // Conception = Due Date - 266 days
    const conceptionDate = new Date(dueDate.getTime() - (266 * 24 * 60 * 60 * 1000));

    // Window (+/- 2 days)
    const windowStart = new Date(conceptionDate.getTime() - (2 * 24 * 60 * 60 * 1000));
    const windowEnd = new Date(conceptionDate.getTime() + (2 * 24 * 60 * 60 * 1000));

    // LMP (Approx) = Due Date - 280 days
    const lmpDate = new Date(dueDate.getTime() - (280 * 24 * 60 * 60 * 1000));

    // Trimester 1 End = LMP + 12 weeks
    const tri1End = new Date(lmpDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000));

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    const shortOpt = { month: 'short', day: 'numeric' };

    document.getElementById('resultConceptionDate').textContent = conceptionDate.toLocaleDateString('en-US', options);
    document.getElementById('resultWindow').textContent = `${windowStart.toLocaleDateString('en-US', shortOpt)} - ${windowEnd.toLocaleDateString('en-US', shortOpt)}`;

    // Timeline
    document.getElementById('timeLMP').textContent = lmpDate.toLocaleDateString();
    document.getElementById('timeConception').textContent = conceptionDate.toLocaleDateString();
    document.getElementById('timeTri1').textContent = tri1End.toLocaleDateString();
    document.getElementById('timeDue').textContent = dueDate.toLocaleDateString();
}

function clearForm() {
  const future = new Date();
  future.setMonth(future.getMonth() + 9);
  document.getElementById('inputDate').valueAsDate = future;

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
