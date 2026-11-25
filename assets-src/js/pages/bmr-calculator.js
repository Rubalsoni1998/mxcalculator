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
        weightLabel.textContent = 'lb';
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

    if (state.unitSystem === 'us') {
        const ft = parseFloat(document.getElementById('heightFeet').value) || 0;
        const inch = parseFloat(document.getElementById('heightInches').value) || 0;
        height = (ft * 12 + inch) * 2.54;
        weight = weight * 0.453592; // lbs to kg
    } else {
        height = parseFloat(document.getElementById('heightCm').value) || 0;
    }

    if (height <= 0 || weight <= 0 || age <= 0) {
        alert("Please enter valid details.");
        return;
    }

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    bmr = Math.round(bmr);

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('bmrValueDisplay').textContent = bmr.toLocaleString('en-US');

    // Generate Activity Table
    const activities = [
        { label: "Sedentary: little or no exercise", factor: 1.2 },
        { label: "Light: exercise 1-3 times/week", factor: 1.375 },
        { label: "Moderate: exercise 4-5 times/week", factor: 1.465 },
        { label: "Active: daily exercise or intense exercise 3-4 times/week", factor: 1.55 },
        { label: "Very Active: intense exercise 6-7 times/week", factor: 1.725 },
        { label: "Extra Active: very intense exercise daily, or physical job", factor: 1.9 }
    ];

    const tableBody = document.getElementById('bmrTableBody');
    tableBody.innerHTML = '';

    activities.forEach(act => {
         const val = Math.round(bmr * act.factor);
         const tr = document.createElement('tr');
         tr.innerHTML = `
            <td>${act.label}</td>
            <td>${val.toLocaleString('en-US')}</td>
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
