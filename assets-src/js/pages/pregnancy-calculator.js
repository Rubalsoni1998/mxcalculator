// State
let state = {
  method: 'lmp' 
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set default date to today
  document.getElementById('inputDate').valueAsDate = new Date();
  updateFormState();
});

// Toggle functions
function updateFormState() {
    const radios = document.getElementsByName('calcMethod');
    radios.forEach(r => { if(r.checked) state.method = r.value });

    const grpCycle = document.getElementById('grp-cycle');
    const grpIvf = document.getElementById('grp-ivf');
    const grpUltra = document.getElementById('grp-ultrasound');
    const dateLabel = document.getElementById('dateLabel');

    // Reset visibility
    grpCycle.classList.add('hidden');
    grpIvf.classList.add('hidden');
    grpUltra.classList.add('hidden');

    if (state.method === 'lmp') {
        dateLabel.textContent = "First Day of Last Period";
        grpCycle.classList.remove('hidden');
    } else if (state.method === 'conception') {
        dateLabel.textContent = "Date of Conception";
    } else if (state.method === 'ivf') {
        dateLabel.textContent = "Transfer Date";
        grpIvf.classList.remove('hidden');
    } else if (state.method === 'ultrasound') {
        dateLabel.textContent = "Date of Ultrasound";
        grpUltra.classList.remove('hidden');
    }
}

// Calculation Logic
function calculate() {
    const inputDateVal = document.getElementById('inputDate').value;
    if (!inputDateVal) { alert("Please select a date"); return; }

    const inputDate = new Date(inputDateVal);
    let dueDate = new Date();
    let conceptionDate = new Date();

    // Calculate Due Date based on method
    if (state.method === 'lmp') {
        const cycleLen = parseInt(document.getElementById('cycleLength').value) || 28;
        // LMP + 280 days + (cycle - 28)
        const offset = 280 + (cycleLen - 28);
        dueDate.setTime(inputDate.getTime() + (offset * 24 * 60 * 60 * 1000));
        conceptionDate.setTime(dueDate.getTime() - (266 * 24 * 60 * 60 * 1000));
    } 
    else if (state.method === 'conception') {
        conceptionDate = new Date(inputDate);
        dueDate.setTime(conceptionDate.getTime() + (266 * 24 * 60 * 60 * 1000));
    }
    else if (state.method === 'ivf') {
        const type = parseInt(document.getElementById('ivfType').value);
        // Transfer date + 266 days - embryo age (3 or 5)
        const daysToAdd = 266 - type;
        dueDate.setTime(inputDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        conceptionDate.setTime(dueDate.getTime() - (266 * 24 * 60 * 60 * 1000));
    }
    else if (state.method === 'ultrasound') {
        const w = parseInt(document.getElementById('ultraWeeks').value) || 0;
        const d = parseInt(document.getElementById('ultraDays').value) || 0;
        const daysPregnantAlready = (w * 7) + d;
        const remainingDays = 280 - daysPregnantAlready;

        dueDate.setTime(inputDate.getTime() + (remainingDays * 24 * 60 * 60 * 1000));
        conceptionDate.setTime(dueDate.getTime() - (266 * 24 * 60 * 60 * 1000));
    }

    // Calculate Current Status
    const today = new Date();
    const totalDuration = 280 * 24 * 60 * 60 * 1000; // 40 weeks in ms
    const timeRemaining = dueDate.getTime() - today.getTime();
    const timeElapsed = totalDuration - timeRemaining;

    let weeksPregnant = Math.floor(timeElapsed / (7 * 24 * 60 * 60 * 1000));
    let daysPregnant = Math.floor((timeElapsed % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));

    if (weeksPregnant < 0) { weeksPregnant = 0; daysPregnant = 0; }
    if (weeksPregnant > 42) { weeksPregnant = 42; } // Cap visual

    // Milestones
    // Trimester 1 ends week 12 (84 days from LMP start, roughly conception + 70)
    // Actually standard is LMP based.
    // Conception is Day 14 of LMP timeline (roughly)
    // LMP Start = Due Date - 280 days
    const lmpDate = new Date(dueDate.getTime() - (280 * 24 * 60 * 60 * 1000));

    const tri2Start = new Date(lmpDate.getTime() + (13 * 7 * 24 * 60 * 60 * 1000)); // Week 13
    const tri3Start = new Date(lmpDate.getTime() + (27 * 7 * 24 * 60 * 60 * 1000)); // Week 27

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('resultDueDate').textContent = dueDate.toLocaleDateString('en-US', options);
    document.getElementById('resultCurrentStatus').textContent = `${weeksPregnant} weeks, ${daysPregnant} days pregnant`;

    // Update Progress Bar
    const pct = (weeksPregnant / 40) * 100;
    document.getElementById('progressBar').style.width = Math.min(pct, 100) + '%';

    // Update Table
    const tbody = document.getElementById('milestonesBody');
    tbody.innerHTML = `
        <tr>
            <td>Conception Date</td>
            <td>${conceptionDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
        </tr>
        <tr>
            <td>2nd Trimester Begins</td>
            <td>${tri2Start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
        </tr>
        <tr>
            <td>3rd Trimester Begins</td>
            <td>${tri3Start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
        </tr>
        <tr>
            <td>Due Date</td>
            <td style="font-weight:700; color:var(--primary)">${dueDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
        </tr>
    `;
}

function clearForm() {
  document.getElementById('inputDate').valueAsDate = new Date();
  document.getElementById('cycleLength').value = 28;
  document.getElementById('ultraWeeks').value = "";
  document.getElementById('ultraDays').value = "";

  // Reset radio
  document.querySelector('input[value="lmp"]').checked = true;
  updateFormState();

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
