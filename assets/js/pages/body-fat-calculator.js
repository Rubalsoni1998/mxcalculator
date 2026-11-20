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
    const lenLabels = document.querySelectorAll('.lengthUnitLabel');

    // Defaults
    const weightInput = document.getElementById('weight');
    const waistInput = document.getElementById('waist');
    const neckInput = document.getElementById('neck');
    const hipInput = document.getElementById('hip');

    if (system === 'us') {
        usHeight.classList.remove('hidden');
        metricHeight.classList.add('hidden');
        weightLabel.textContent = 'lb';
        lenLabels.forEach(el => el.textContent = 'in');

        if (weightInput.value === '77') weightInput.value = '170'; 
        if (waistInput.value === '89') waistInput.value = '35'; 
    } else {
        usHeight.classList.add('hidden');
        metricHeight.classList.remove('hidden');
        weightLabel.textContent = 'kg';
        lenLabels.forEach(el => el.textContent = 'cm');

        if (weightInput.value === '170') weightInput.value = '77'; 
        if (waistInput.value === '35') waistInput.value = '89'; 
    }
}

function updateFormForGender() {
    const gender = document.getElementById('gender').value;
    const hipGroup = document.getElementById('hipGroup');

    if (gender === 'female') {
        hipGroup.classList.remove('hidden');
    } else {
        hipGroup.classList.add('hidden');
    }
}

// Calculation Logic (US Navy Method)
function calculate() {
    const gender = document.getElementById('gender').value;
    let weight = parseFloat(document.getElementById('weight').value) || 0;
    let height = 0; // cm
    let waist = parseFloat(document.getElementById('waist').value) || 0;
    let neck = parseFloat(document.getElementById('neck').value) || 0;
    let hip = parseFloat(document.getElementById('hip').value) || 0;

    // Normalize to Metric (Navy Method uses metric internally often, or specific log formulas)
    // US Navy Formula uses standard units directly in one variation, but metric conversion is safer standard.
    // Let's use the Metric formula: 
    // Men: 495 / (1.0324 - 0.19077 * log10(waist-neck) + 0.15456 * log10(height)) - 450
    // Women: 495 / (1.29579 - 0.35004 * log10(waist+hip-neck) + 0.22100 * log10(height)) - 450
    // Inputs for formula must be in CM.

    if (state.unitSystem === 'us') {
        const ft = parseFloat(document.getElementById('heightFeet').value) || 0;
        const inch = parseFloat(document.getElementById('heightInches').value) || 0;
        height = (ft * 12 + inch) * 2.54;

        waist = waist * 2.54;
        neck = neck * 2.54;
        hip = hip * 2.54;
        weight = weight * 0.453592; // lbs to kg for mass results
    } else {
        height = parseFloat(document.getElementById('heightCm').value) || 0;
    }

    if (height <= 0 || weight <= 0 || waist <= 0 || neck <= 0) {
        alert("Please enter valid measurements.");
        return;
    }

    let bodyFat = 0;

    if (gender === 'male') {
        if (waist - neck <= 0) { alert("Waist must be larger than neck."); return; }
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
         if (waist + hip - neck <= 0) { alert("Invalid measurements."); return; }
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }

    // Clamp result
    if (bodyFat < 2) bodyFat = 2;

    const bfFixed = bodyFat.toFixed(1);
    const fatMass = (weight * (bodyFat / 100)).toFixed(1);
    const leanMass = (weight - (weight * (bodyFat / 100))).toFixed(1);
    const unit = state.unitSystem === 'us' ? 'lbs' : 'kg';

    // Categorize (ACE)
    let category = "";
    let color = "";
    let rowId = "";

    if (gender === 'male') {
        if (bodyFat < 6) { category = "Essential Fat"; color = "hsl(210, 80%, 60%)"; rowId = "row-essential"; }
        else if (bodyFat < 14) { category = "Athletes"; color = "hsl(160, 84%, 39%)"; rowId = "row-athletes"; }
        else if (bodyFat < 18) { category = "Fitness"; color = "hsl(85, 80%, 45%)"; rowId = "row-fitness"; }
        else if (bodyFat < 25) { category = "Average"; color = "hsl(45, 90%, 50%)"; rowId = "row-average"; }
        else { category = "Obese"; color = "hsl(350, 89%, 60%)"; rowId = "row-obese"; }
    } else {
        if (bodyFat < 14) { category = "Essential Fat"; color = "hsl(210, 80%, 60%)"; rowId = "row-essential"; }
        else if (bodyFat < 21) { category = "Athletes"; color = "hsl(160, 84%, 39%)"; rowId = "row-athletes"; }
        else if (bodyFat < 25) { category = "Fitness"; color = "hsl(85, 80%, 45%)"; rowId = "row-fitness"; }
        else if (bodyFat < 32) { category = "Average"; color = "hsl(45, 90%, 50%)"; rowId = "row-average"; }
        else { category = "Obese"; color = "hsl(350, 89%, 60%)"; rowId = "row-obese"; }
    }

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('bfValueDisplay').textContent = bfFixed + "%";

    const catEl = document.getElementById('bfCategoryDisplay');
    catEl.textContent = category;
    catEl.style.background = color;

    document.getElementById('fatMassDisplay').textContent = `${fatMass} ${unit}`;
    document.getElementById('leanMassDisplay').textContent = `${leanMass} ${unit}`;

    // Update Table
    document.querySelectorAll('.schedule-table tr').forEach(r => r.classList.remove('active-row'));
    document.getElementById(rowId).classList.add('active-row');

    // Update Gauge
    // Range 0 to 40% roughly
    let percent = (bodyFat / 40) * 100;
    if (percent > 100) percent = 100;
    document.getElementById('bfMarker').style.left = percent + '%';
}

function clearForm() {
  if (state.unitSystem === 'us') {
      document.getElementById('heightFeet').value = "";
      document.getElementById('heightInches').value = "";
      document.getElementById('weight').value = "";
      document.getElementById('waist').value = "";
      document.getElementById('neck').value = "";
      document.getElementById('hip').value = "";
  } else {
      document.getElementById('heightCm').value = "";
      document.getElementById('weight').value = "";
      document.getElementById('waist').value = "";
      document.getElementById('neck').value = "";
      document.getElementById('hip').value = "";
  }

  document.getElementById('age').value = 30;

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
