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

    if (system === 'us') {
        usHeight.classList.remove('hidden');
        metricHeight.classList.add('hidden');
    } else {
        usHeight.classList.add('hidden');
        metricHeight.classList.remove('hidden');
    }
}

// Calculation Logic
function calculate() {
    let height = 0; // in meters for calculation convenience later
    let heightInches = 0; // Total inches for formulas
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;

    if (state.unitSystem === 'us') {
        const ft = parseFloat(document.getElementById('heightFeet').value) || 0;
        const inch = parseFloat(document.getElementById('heightInches').value) || 0;
        heightInches = (ft * 12) + inch;
        height = heightInches * 0.0254; 
    } else {
        const cm = parseFloat(document.getElementById('heightCm').value) || 0;
        height = cm / 100;
        heightInches = cm / 2.54;
    }

    if (height <= 0) {
        alert("Please enter a valid height.");
        return;
    }

    // Base calculation variables
    // Most formulas are based on height over 5 feet (60 inches)
    const baseHeight = 60; 
    const heightDiff = heightInches - baseHeight;

    // Avoid negative calculations for very short stature (formulas break down < 5ft usually)
    // We will allow negative diff for math but results might be odd, standard behavior for these formulas.

    let robinson = 0;
    let miller = 0;
    let devine = 0;
    let hamwi = 0;

    if (gender === 'male') {
        // Robinson: 52 kg + 1.9 kg per inch over 5ft
        robinson = 52 + 1.9 * heightDiff;
        // Miller: 56.2 kg + 1.41 kg per inch over 5ft
        miller = 56.2 + 1.41 * heightDiff;
        // Devine: 50 kg + 2.3 kg per inch over 5ft
        devine = 50 + 2.3 * heightDiff;
        // Hamwi: 106 lbs (48.08 kg) + 6 lbs (2.72 kg) per inch over 5ft
        hamwi = 48.08 + 2.72 * heightDiff;
    } else {
        // Robinson: 49 kg + 1.7 kg per inch over 5ft
        robinson = 49 + 1.7 * heightDiff;
        // Miller: 53.1 kg + 1.36 kg per inch over 5ft
        miller = 53.1 + 1.36 * heightDiff;
        // Devine: 45.5 kg + 2.3 kg per inch over 5ft
        devine = 45.5 + 2.3 * heightDiff;
        // Hamwi: 100 lbs (45.35 kg) + 5 lbs (2.26 kg) per inch over 5ft
        hamwi = 45.35 + 2.26 * heightDiff;
    }

    // Healthy BMI Range (18.5 - 25)
    // Weight = BMI * Height^2
    const minBMIWeight = 18.5 * (height * height);
    const maxBMIWeight = 25 * (height * height);

    // Convert results to preferred unit
    const isUS = state.unitSystem === 'us';
    const factor = isUS ? 2.20462 : 1; // kg to lbs
    const unit = isUS ? 'lbs' : 'kgs';

    const formatWeight = (w) => (w * factor).toFixed(1) + ' ' + unit;

    // Render Results
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    // Display Robinson as main "Estimate" (Common standard)
    document.getElementById('idealWeightDisplay').textContent = formatWeight(robinson);

    const tableBody = document.getElementById('formulaTableBody');
    tableBody.innerHTML = `
        <tr>
            <td>Robinson Formula</td>
            <td>${formatWeight(robinson)}</td>
        </tr>
        <tr>
            <td>Miller Formula</td>
            <td>${formatWeight(miller)}</td>
        </tr>
        <tr>
            <td>Devine Formula</td>
            <td>${formatWeight(devine)}</td>
        </tr>
         <tr>
            <td>Hamwi Formula</td>
            <td>${formatWeight(hamwi)}</td>
        </tr>
    `;

    document.getElementById('bmiRangeDisplay').textContent = `${formatWeight(minBMIWeight)} - ${formatWeight(maxBMIWeight)}`;
}

function clearForm() {
  if (state.unitSystem === 'us') {
      document.getElementById('heightFeet').value = "";
      document.getElementById('heightInches').value = "";
  } else {
      document.getElementById('heightCm').value = "";
  }

  document.getElementById('age').value = 25;

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
