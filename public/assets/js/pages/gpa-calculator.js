// Constants
const gradePoints = {
    "A+": 4.3, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   // Add initial 5 rows
   for(let i=0; i<5; i++) addCourseRow();
});

function addCourseRow() {
    const list = document.getElementById('courseList');
    const div = document.createElement('div');
    div.className = 'course-row';
    div.innerHTML = `
        <input type="text" class="course-name" placeholder="Course ${list.children.length + 1}">
        <select class="course-grade">
            <option value="">--</option>
            <option value="A+">A+</option>
            <option value="A" selected>A</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="B-">B-</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="C-">C-</option>
            <option value="D+">D+</option>
            <option value="D">D</option>
            <option value="D-">D-</option>
            <option value="F">F</option>
        </select>
        <input type="number" class="course-credits" value="3" min="0" max="10">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()" title="Remove">×</button>
    `;
    list.appendChild(div);
}

// Calculation Logic
function calculate() {
    const rows = document.querySelectorAll('.course-row');
    let totalPoints = 0;
    let totalCredits = 0;

    rows.forEach(row => {
        const grade = row.querySelector('.course-grade').value;
        const credits = parseFloat(row.querySelector('.course-credits').value) || 0;

        if (grade && credits > 0 && gradePoints.hasOwnProperty(grade)) {
            totalPoints += gradePoints[grade] * credits;
            totalCredits += credits;
        }
    });

    if (totalCredits === 0) {
        alert("Please enter at least one course with valid credits and grade.");
        return;
    }

    const gpa = totalPoints / totalCredits;

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('gpaDisplay').textContent = gpa.toFixed(2);
    document.getElementById('totalCreditsDisplay').textContent = `Based on ${totalCredits} credits`;

    document.getElementById('totalPointsDisplay').textContent = totalPoints.toFixed(1);
    document.getElementById('totalCreditsTable').textContent = totalCredits;

    // Update Meter
    // Scale 0 to 4.0 (actually can go to 4.3, clamp visual)
    let pct = (gpa / 4.0) * 100;
    if (pct > 100) pct = 100;
    document.getElementById('gpaMarker').style.left = pct + '%';
}

function clearForm() {
  const rows = document.querySelectorAll('.course-row');
  rows.forEach(row => {
      row.querySelector('.course-name').value = "";
      row.querySelector('.course-grade').value = "";
      row.querySelector('.course-credits').value = "3";
  });

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
