// State
let state = {
  unitSystem: 'us' // 'us' or 'metric'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setUnits('us');
});

// Toggle functions
function setUnits(system) {
    state.unitSystem = system;

    // Tab UI
    document.getElementById('tabUS').className = system === 'us' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabMetric').className = system === 'metric' ? 'tab-btn active' : 'tab-btn';

    // Input Visibility
    const usHeight = document.getElementById('heightUS');
    const metricHeight = document.getElementById('heightMetric');
    const weightLabel = document.getElementById('weightUnitLabel');
    const weightInput = document.getElementById('weight');

    if (system === 'us') {
        usHeight.classList.remove('hidden');
        metricHeight.classList.add('hidden');
        weightLabel.textContent = 'pounds';
        if (weightInput.value === '70') weightInput.value = '160'; 
    } else {
        usHeight.classList.add('hidden');
        metricHeight.classList.remove('hidden');
        weightLabel.textContent = 'kg';
        if (weightInput.value === '160') weightInput.value = '70'; 
    }
}

// Calculation Logic
function calculate() {
    let weight = parseFloat(document.getElementById('weight').value) || 0;
    let height = 0; // cm
    const age = parseFloat(document.getElementById('age').value) || 0;
    const gender = document.getElementById('gender').value;
    const activity = parseFloat(document.getElementById('activity').value) || 1.2;

    if (state.unitSystem === 'us') {
        const ft = parseFloat(document.getElementById('heightFeet').value) || 0;
        const inch = parseFloat(document.getElementById('heightInches').value) || 0;
        // Convert to metric for calculation
        const totalInches = (ft * 12) + inch;
        height = totalInches * 2.54; 
        // Convert lbs to kg
        weight = weight * 0.453592;
    } else {
        height = parseFloat(document.getElementById('heightCm').value) || 0;
    }

    if (height <= 0 || weight <= 0 || age <= 0) {
        alert("Please enter valid details.");
        return;
    }

    // Mifflin-St Jeor Equation
    // Men: 10W + 6.25H - 5A + 5
    // Women: 10W + 6.25H - 5A - 161

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    const tdee = Math.round(bmr * activity);

    // Generate Result Rows
    const goals = [
        { label: "Maintain weight", cals: tdee, class: "goal-row-maintain", textClass: "" },
        { label: "Mild weight loss (-0.5 lb/week)", cals: Math.round(tdee * 0.90), class: "goal-row-loss-mild", textClass: "" }, // Approx 250 cal deficit or 90%
        { label: "Weight loss (-1 lb/week)", cals: Math.round(tdee * 0.79), class: "goal-row-loss", textClass: "" }, // Approx 500 cal
        { label: "Extreme weight loss (-2 lb/week)", cals: Math.round(tdee * 0.59), class: "goal-row-loss-extreme", textClass: "" }, // Approx 1000 cal
         { label: "Mild weight gain (+0.5 lb/week)", cals: Math.round(tdee * 1.10), class: "goal-row-gain", textClass: "" },
          { label: "Weight gain (+1 lb/week)", cals: Math.round(tdee * 1.21), class: "goal-row-gain", textClass: "" }
    ];

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('maintainCalories').textContent = tdee.toLocaleString('en-US');

    const tableBody = document.getElementById('calorieTableBody');
    tableBody.innerHTML = '';

    goals.forEach(goal => {
         // Safety check: Don't recommend dangerous low calories
         let warning = "";
         if (goal.cals < 1000 && gender === 'female') warning = "*";
         if (goal.cals < 1200 && gender === 'male') warning = "*";

         const tr = document.createElement('tr');
         tr.className = goal.class;
         tr.innerHTML = `
            <td>${goal.label}</td>
            <td style="color:var(--primary)">${goal.cals.toLocaleString('en-US')}${warning}</td>
         `;
         tableBody.appendChild(tr);
    });
}

function clearForm() {
  if (state.unitSystem === 'us') {
      document.getElementById('heightFeet').value = "";
      document.getElementById('heightInches').value = "";
      document.getElementById('weight').value = "";
  } else {
      document.getElementById('heightCm').value = "";
      document.getElementById('weight').value = "";
  }

  document.getElementById('age').value = 25;

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
