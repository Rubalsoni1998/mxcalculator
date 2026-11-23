let mode = 'slab';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   // Defaults if needed
});

// Toggle Modes
function setMode(newMode) {
    mode = newMode;

    // Tab UI
    document.getElementById('tabSlab').className = mode === 'slab' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabColumn').className = mode === 'column' ? 'tab-btn active' : 'tab-btn';

    // Forms UI
    if(mode === 'slab') {
        document.getElementById('formSlab').classList.remove('hidden');
        document.getElementById('formColumn').classList.add('hidden');
    } else {
        document.getElementById('formSlab').classList.add('hidden');
        document.getElementById('formColumn').classList.remove('hidden');
    }

    // Reset Result
    document.getElementById('resultsContent').classList.add('hidden');
    document.getElementById('resultsPlaceholder').classList.remove('hidden');
}

// Calculation Logic
function calculate() {
    let cubicFeet = 0;

    if (mode === 'slab') {
        const l = parseFloat(document.getElementById('slabL').value);
        const w = parseFloat(document.getElementById('slabW').value);
        const h_in = parseFloat(document.getElementById('slabH').value);

        if (isNaN(l) || isNaN(w) || isNaN(h_in)) return;

        // L x W x H(ft)
        cubicFeet = l * w * (h_in / 12);
    } else {
        const d_in = parseFloat(document.getElementById('colD').value);
        const h = parseFloat(document.getElementById('colH').value);
        const qty = parseFloat(document.getElementById('colQty').value) || 1;

        if (isNaN(d_in) || isNaN(h)) return;

        // Radius in feet = (d_in / 2) / 12
        const r_ft = (d_in / 2) / 12;
        cubicFeet = Math.PI * Math.pow(r_ft, 2) * h * qty;
    }

    if (cubicFeet <= 0) {
        alert("Please enter valid positive dimensions.");
        return;
    }

    const cubicYards = cubicFeet / 27;

    // Bag Calc (Approximate yield)
    // 80lb bag ~= 0.6 cu ft
    // 60lb bag ~= 0.45 cu ft
    // 40lb bag ~= 0.30 cu ft
    // Or using density: ~133 lbs/cu ft usually assumed for premix
    // Let's use simple volume constants:
    const bags80 = Math.ceil(cubicFeet / 0.6);
    const bags60 = Math.ceil(cubicFeet / 0.45);

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('volYards').textContent = cubicYards.toFixed(2) + " cu yds";
    document.getElementById('volFeet').textContent = cubicFeet.toFixed(2) + " cu ft";

    document.getElementById('bags80').textContent = bags80;
    document.getElementById('bags60').textContent = bags60;
}

function clearForm() {
  // Slab
  document.getElementById('slabL').value = "";
  document.getElementById('slabW').value = "";
  document.getElementById('slabH').value = "";

  // Column
  document.getElementById('colD').value = "";
  document.getElementById('colH').value = "";
  document.getElementById('colQty').value = "1";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
