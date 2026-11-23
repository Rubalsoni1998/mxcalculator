// State
let state = {
  unitSystem: 'us' // 'us' or 'metric'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Default to US units
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
        if (weightInput.value === '70') weightInput.value = '160'; // quick toggle default
    } else {
        usHeight.classList.add('hidden');
        metricHeight.classList.remove('hidden');
        weightLabel.textContent = 'kg';
        if (weightInput.value === '160') weightInput.value = '70'; // quick toggle default
    }
}

// Calculation Logic
function calculate() {
    let weight = parseFloat(document.getElementById('weight').value) || 0;
    let height = 0; // in meters

    if (state.unitSystem === 'us') {
        const ft = parseFloat(document.getElementById('heightFeet').value) || 0;
        const inch = parseFloat(document.getElementById('heightInches').value) || 0;
        // Convert to metric for calculation
        const totalInches = (ft * 12) + inch;
        height = totalInches * 0.0254; 
        // Convert lbs to kg
        weight = weight * 0.453592;
    } else {
        const cm = parseFloat(document.getElementById('heightCm').value) || 0;
        height = cm / 100;
    }

    if (height <= 0 || weight <= 0) {
        alert("Please enter valid height and weight values.");
        return;
    }

    // BMI Formula: kg / m^2
    const bmi = weight / (height * height);
    const bmiFixed = bmi.toFixed(1);

    // Categorize
    let category = "";
    let color = "";
    let rowId = "";

    if (bmi < 18.5) {
        category = "Underweight";
        color = "#3b82f6";
        rowId = "row-underweight";
    } else if (bmi < 25) {
        category = "Normal";
        color = "#10b981";
        rowId = "row-normal";
    } else if (bmi < 30) {
        category = "Overweight";
        color = "#f59e0b";
        rowId = "row-overweight";
    } else {
        category = "Obese";
        color = "#ef4444";
        rowId = "row-obese";
    }

    // Healthy Range Calculation
    // Lower: 18.5 * h^2
    // Upper: 25 * h^2
    const minWeightKg = 18.5 * (height * height);
    const maxWeightKg = 25 * (height * height);

    let rangeString = "";
    if (state.unitSystem === 'us') {
        const minLbs = (minWeightKg / 0.453592).toFixed(1);
        const maxLbs = (maxWeightKg / 0.453592).toFixed(1);
        rangeString = `${minLbs} - ${maxLbs} lbs`;
    } else {
        rangeString = `${minWeightKg.toFixed(1)} - ${maxWeightKg.toFixed(1)} kg`;
    }

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    const bmiDisplay = document.getElementById('bmiValueDisplay');
    const catDisplay = document.getElementById('bmiCategoryDisplay');

    bmiDisplay.textContent = bmiFixed;
    catDisplay.textContent = category;
    catDisplay.style.background = color;

    document.getElementById('healthyRangeDisplay').textContent = rangeString;

    // Update Table Highlighting
    document.querySelectorAll('.schedule-table tr').forEach(r => r.classList.remove('active-row'));
    document.getElementById(rowId).classList.add('active-row');

    // Update Gauge Marker
    // Map BMI 15-35 to 0-100%
    // range span = 20. 
    let percent = ((bmi - 15) / 20) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    document.getElementById('bmiMarker').style.left = percent + '%';
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
