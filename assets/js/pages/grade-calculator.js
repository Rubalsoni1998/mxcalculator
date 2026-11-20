// Initialize
document.addEventListener('DOMContentLoaded', function() {
   // Add initial 4 rows
   for(let i=0; i<4; i++) addAssignmentRow();
});

function addAssignmentRow() {
    const list = document.getElementById('assignmentList');
    const div = document.createElement('div');
    div.className = 'course-row';
    div.innerHTML = `
        <input type="text" class="assign-name" placeholder="Assignment ${list.children.length + 1}">
        <input type="number" class="assign-grade" placeholder="85">
        <input type="number" class="assign-weight" placeholder="10">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()" title="Remove">×</button>
    `;
    list.appendChild(div);
}

// Calculation Logic
function calculate() {
    const rows = document.querySelectorAll('.course-row');
    let totalWeightedScore = 0;
    let totalWeight = 0;

    rows.forEach(row => {
        const grade = parseFloat(row.querySelector('.assign-grade').value);
        const weight = parseFloat(row.querySelector('.assign-weight').value);

        if (!isNaN(grade) && !isNaN(weight)) {
            totalWeightedScore += grade * weight;
            totalWeight += weight;
        }
    });

    if (totalWeight === 0) {
        alert("Please enter at least one assignment with a weight > 0.");
        return;
    }

    const currentGrade = totalWeightedScore / totalWeight;

    // Letter Grade Logic
    let letter = "F";
    if (currentGrade >= 97) letter = "A+";
    else if (currentGrade >= 93) letter = "A";
    else if (currentGrade >= 90) letter = "A-";
    else if (currentGrade >= 87) letter = "B+";
    else if (currentGrade >= 83) letter = "B";
    else if (currentGrade >= 80) letter = "B-";
    else if (currentGrade >= 77) letter = "C+";
    else if (currentGrade >= 73) letter = "C";
    else if (currentGrade >= 70) letter = "C-";
    else if (currentGrade >= 67) letter = "D+";
    else if (currentGrade >= 63) letter = "D";
    else if (currentGrade >= 60) letter = "D-";

    // Render Standard Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('currentGradeDisplay').textContent = currentGrade.toFixed(2) + '%';
    document.getElementById('letterGradeDisplay').textContent = letter;

    document.getElementById('totalPointsDisplay').textContent = totalWeightedScore.toFixed(1);
    document.getElementById('totalWeightDisplay').textContent = totalWeight + '%';

    // Calculate Required Final Score (if inputs exist)
    const target = parseFloat(document.getElementById('targetGrade').value);
    const finalWeight = parseFloat(document.getElementById('finalWeight').value);

    const reqCard = document.getElementById('requiredScoreCard');

    if (!isNaN(target) && !isNaN(finalWeight) && finalWeight > 0) {
        // Formula: (Target - (CurrentWeight * CurrentGrade)) / FinalWeight
        // Note: CurrentWeight here is actually (100% - FinalWeight) percentage wise logic
        // Total = (Current * (1-FW)) + (Final * FW) = Target
        // Final = (Target - Current*(1-FW)) / FW

        // Wait, standard calculation is easier if we assume TotalWeight so far + FinalWeight = 100%
        // Or normalizing. Let's assume weights sum to 100.
        // Current Portion = currentGrade * (100 - finalWeight) / 100
        // Final Portion = x * finalWeight / 100
        // Target = Current Portion + Final Portion

        // If user entered weights that don't sum to (100-final), we might need to normalize or assume.
        // Standard approach: Treat "Current Grade" as the grade for the non-final portion.

        const rw = finalWeight / 100;
        const cw = 1 - rw;
        const required = (target - (currentGrade * cw)) / rw;

        reqCard.classList.remove('hidden');
        document.getElementById('requiredScoreDisplay').textContent = required.toFixed(2) + '%';

        // Style context based on difficulty
        const ctxText = document.getElementById('requiredScoreContext');
        if (required > 100) {
            ctxText.textContent = "You need extra credit to reach this target.";
            ctxText.style.color = "#ef4444"; // Red
        } else if (required <= 0) {
            ctxText.textContent = "You've already secured this grade!";
            ctxText.style.color = "var(--primary)";
        } else {
            ctxText.textContent = `to achieve ${target}% overall`;
            ctxText.style.color = "var(--muted-foreground)";
        }

    } else {
        reqCard.classList.add('hidden');
    }
}

function clearForm() {
  const rows = document.querySelectorAll('.course-row');
  rows.forEach(row => {
      row.querySelector('.assign-name').value = "";
      row.querySelector('.assign-grade').value = "";
      row.querySelector('.assign-weight').value = "";
  });
  document.getElementById('targetGrade').value = "";
  document.getElementById('finalWeight').value = "";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
