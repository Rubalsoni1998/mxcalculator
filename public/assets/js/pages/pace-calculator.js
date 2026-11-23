// State
let state = {
  solveFor: 'pace' 
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  updateFormState();
});

// Toggle functions
function updateFormState() {
    const radios = document.getElementsByName('solveFor');
    radios.forEach(r => { if(r.checked) state.solveFor = r.value });

    const grpTime = document.getElementById('grp-time');
    const grpDist = document.getElementById('grp-distance');
    const grpPace = document.getElementById('grp-pace');

    const timeInputs = [document.getElementById('timeHrs'), document.getElementById('timeMin'), document.getElementById('timeSec')];
    const distInput = document.getElementById('distance');
    const paceInputs = [document.getElementById('paceMin'), document.getElementById('paceSec')];

    // Reset
    [grpTime, grpDist, grpPace].forEach(g => {
        g.classList.remove('opacity-50');
        g.querySelectorAll('input').forEach(i => i.disabled = false);
    });

    if (state.solveFor === 'time') {
        grpTime.classList.add('opacity-50');
        timeInputs.forEach(i => { i.disabled = true; i.value = ""; i.placeholder = "--"; });
    } else if (state.solveFor === 'distance') {
        grpDist.classList.add('opacity-50');
        distInput.disabled = true; distInput.value = ""; distInput.placeholder = "--";
    } else {
        grpPace.classList.add('opacity-50');
        paceInputs.forEach(i => { i.disabled = true; i.value = ""; i.placeholder = "--"; });
    }
}

// Calculation Logic
function calculate() {
    const hrs = parseFloat(document.getElementById('timeHrs').value) || 0;
    const min = parseFloat(document.getElementById('timeMin').value) || 0;
    const sec = parseFloat(document.getElementById('timeSec').value) || 0;

    const totalMinutes = (hrs * 60) + min + (sec / 60);

    // Distance in km (normalized)
    let distVal = parseFloat(document.getElementById('distance').value) || 0;
    const distUnit = document.getElementById('distUnit').value;
    let distKm = 0;

    if (distUnit === 'km') distKm = distVal;
    else if (distUnit === 'miles') distKm = distVal * 1.60934;
    else if (distUnit === 'meters') distKm = distVal / 1000;
    else if (distUnit === 'yards') distKm = distVal * 0.0009144;
    else if (distUnit === 'marathon') distKm = 42.195;
    else if (distUnit === 'half-marathon') distKm = 21.0975;

    // Pace in min/km (normalized)
    const pMin = parseFloat(document.getElementById('paceMin').value) || 0;
    const pSec = parseFloat(document.getElementById('paceSec').value) || 0;
    let paceVal = pMin + (pSec / 60); // raw pace value from input

    const paceUnit = document.getElementById('paceUnit').value;
    let pacePerKm = 0;

    // Convert input pace to min/km
    if (paceUnit === 'km') pacePerKm = paceVal;
    else if (paceUnit === 'mile') pacePerKm = paceVal / 1.60934;
    else if (paceUnit === '5k') pacePerKm = paceVal / 5;

    // Calculations based on target
    let resultMain = "";
    let resultSub = "";

    if (state.solveFor === 'pace') {
        if (distKm <= 0 || totalMinutes <= 0) return;
        pacePerKm = totalMinutes / distKm;

        // Format result
        resultMain = formatPace(pacePerKm * 1.60934, 'mile');
        resultSub = formatPace(pacePerKm, 'km');
        document.getElementById('resultLabel').textContent = "Pace";
    } 
    else if (state.solveFor === 'time') {
        if (distKm <= 0 || pacePerKm <= 0) return;
        const finalMinutes = distKm * pacePerKm;

        resultMain = formatTime(finalMinutes);
        resultSub = `at ${formatPace(pacePerKm * 1.60934, 'mile')}`;
        document.getElementById('resultLabel').textContent = "Time";
    }
    else if (state.solveFor === 'distance') {
        if (totalMinutes <= 0 || pacePerKm <= 0) return;
        distKm = totalMinutes / pacePerKm;

        resultMain = `${(distKm / 1.60934).toFixed(2)} miles`;
        resultSub = `${distKm.toFixed(2)} km`;
        document.getElementById('resultLabel').textContent = "Distance";
    }

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('resultValueDisplay').textContent = resultMain;
    document.getElementById('resultSubDisplay').textContent = resultSub;

    // Generate Splits Table (Standard: 1km, 1mi, 5k, 10k, Half, Full)
    // pacePerKm is the key rate
    const splits = [
        { label: "1 mile", km: 1.60934 },
        { label: "1 km", km: 1 },
        { label: "5k", km: 5 },
        { label: "10k", km: 10 },
        { label: "Half Marathon", km: 21.0975 },
        { label: "Marathon", km: 42.195 }
    ];

    const tableBody = document.getElementById('splitsTableBody');
    tableBody.innerHTML = '';

    splits.forEach(split => {
         const time = split.km * pacePerKm;
         const tr = document.createElement('tr');
         tr.innerHTML = `
            <td>${split.label}</td>
            <td>${formatTime(time)}</td>
         `;
         tableBody.appendChild(tr);
    });
}

function formatPace(minPerUnit, unit) {
    const min = Math.floor(minPerUnit);
    const sec = Math.round((minPerUnit - min) * 60);
    const secStr = sec < 10 ? `0${sec}` : sec;
    return `${min}:${secStr} / ${unit}`;
}

function formatTime(totalMinutes) {
    const hrs = Math.floor(totalMinutes / 60);
    const min = Math.floor(totalMinutes % 60);
    const sec = Math.round((totalMinutes - Math.floor(totalMinutes)) * 60);

    const hStr = hrs > 0 ? `${hrs}:` : '';
    const mStr = min < 10 && hrs > 0 ? `0${min}` : min;
    const sStr = sec < 10 ? `0${sec}` : sec;

    return `${hStr}${mStr}:${sStr}`;
}

function clearForm() {
  document.getElementById('timeHrs').value = "";
  document.getElementById('timeMin').value = "";
  document.getElementById('timeSec').value = "";
  document.getElementById('distance').value = "";
  document.getElementById('paceMin').value = "";
  document.getElementById('paceSec').value = "";

  // Default reset to Pace solver
  document.querySelector('input[value="pace"]').checked = true;
  updateFormState();

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
