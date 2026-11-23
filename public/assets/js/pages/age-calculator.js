// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set defaults
  const today = new Date();
  document.getElementById('targetDateInput').valueAsDate = today;
  // Default DOB example (2000-01-01)
  const defaultDob = new Date('2000-01-01');
  document.getElementById('dobInput').valueAsDate = defaultDob;
});

// Calculation Logic
function calculate() {
    const dobStr = document.getElementById('dobInput').value;
    const targetStr = document.getElementById('targetDateInput').value;

    if (!dobStr || !targetStr) {
        alert("Please enter valid dates.");
        return;
    }

    const dob = new Date(dobStr);
    const target = new Date(targetStr);

    if (dob > target) {
        alert("Date of Birth cannot be after the Target Date.");
        return;
    }

    // Calculate Age (Years, Months, Days)
    let years = target.getFullYear() - dob.getFullYear();
    let months = target.getMonth() - dob.getMonth();
    let days = target.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        // Get days in previous month
        const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // Detailed Breakdown
    const diffTime = Math.abs(target - dob);
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remDaysWeek = totalDays % 7;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    // Next Birthday
    const currentYear = target.getFullYear();
    let nextBday = new Date(dob);
    nextBday.setFullYear(currentYear);

    if (nextBday < target) {
        nextBday.setFullYear(currentYear + 1);
    }

    const diffBday = Math.ceil((nextBday - target) / (1000 * 60 * 60 * 24));
    const nextBdayDayOfWeek = nextBday.toLocaleDateString('en-US', { weekday: 'long' });

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    // Hero
    document.getElementById('ageDisplay').textContent = `${years} years ${months} months ${days} days`;
    document.getElementById('ageSubDisplay').textContent = `or ${years * 12 + months} months ${days} days`;

    // Next Birthday
    if (years > 0 || months > 0 || days > 0) {
         document.getElementById('nextBdayDate').textContent = nextBday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

         if (diffBday === 0) {
             document.getElementById('nextBdayCounter').textContent = "Happy Birthday! It's today!";
         } else {
             document.getElementById('nextBdayCounter').textContent = `${diffBday} days remaining`;
         }
    } else {
         // Born today
         document.getElementById('nextBdayCounter').textContent = "Born today!";
    }

    // Table
    const tbody = document.getElementById('breakdownBody');
    tbody.innerHTML = `
        <tr>
            <td>Total Months</td>
            <td>${(years * 12) + months} months, ${days} days</td>
        </tr>
        <tr>
            <td>Total Weeks</td>
            <td>${totalWeeks.toLocaleString('en-US')} weeks, ${remDaysWeek} days</td>
        </tr>
        <tr>
            <td>Total Days</td>
            <td>${totalDays.toLocaleString('en-US')} days</td>
        </tr>
        <tr>
            <td>Total Hours (approx)</td>
            <td>${totalHours.toLocaleString('en-US')} hours</td>
        </tr>
        <tr>
            <td>Total Minutes (approx)</td>
            <td>${totalMinutes.toLocaleString('en-US')} minutes</td>
        </tr>
    `;
}

function clearForm() {
  const today = new Date();
  document.getElementById('targetDateInput').valueAsDate = today;
  document.getElementById('dobInput').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
