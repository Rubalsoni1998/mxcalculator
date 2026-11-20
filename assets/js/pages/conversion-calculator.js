// Data Definitions
const unitData = {
    length: {
        base: 'meter',
        units: {
            meter: 1,
            kilometer: 0.001,
            centimeter: 100,
            millimeter: 1000,
            micrometer: 1e6,
            nanometer: 1e9,
            mile: 0.000621371,
            yard: 1.09361,
            foot: 3.28084,
            inch: 39.3701,
            nautical_mile: 0.000539957
        }
    },
    area: {
        base: 'square_meter',
        units: {
            square_meter: 1,
            square_kilometer: 1e-6,
            square_centimeter: 10000,
            square_millimeter: 1e6,
            hectare: 1e-4,
            acre: 0.000247105,
            square_mile: 3.861e-7,
            square_yard: 1.19599,
            square_foot: 10.7639,
            square_inch: 1550.0031
        }
    },
    volume: {
        base: 'liter',
        units: {
            liter: 1,
            milliliter: 1000,
            cubic_meter: 0.001,
            cubic_centimeter: 1000,
            gallon_us: 0.264172,
            quart_us: 1.05669,
            pint_us: 2.11338,
            cup_us: 4.22675,
            fluid_ounce_us: 33.814,
            tablespoon_us: 67.628,
            teaspoon_us: 202.884,
            cubic_foot: 0.0353147,
            cubic_inch: 61.0237
        }
    },
    weight: {
        base: 'kilogram',
        units: {
            kilogram: 1,
            gram: 1000,
            milligram: 1e6,
            metric_ton: 0.001,
            pound: 2.20462,
            ounce: 35.274,
            stone: 0.157473,
            short_ton_us: 0.00110231
        }
    },
    time: {
        base: 'second',
        units: {
            second: 1,
            millisecond: 1000,
            microsecond: 1e6,
            nanosecond: 1e9,
            minute: 1/60,
            hour: 1/3600,
            day: 1/86400,
            week: 1/604800,
            month: 1/2.628e+6, // approx
            year: 1/3.154e+7 // approx
        }
    },
    temp: {
        // Temperature is special, handled via formulas
        units: {
            celsius: 'Celsius',
            fahrenheit: 'Fahrenheit',
            kelvin: 'Kelvin'
        }
    }
};

let currentCat = 'length';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   setCategory('length');
});

// Switch Category
function setCategory(cat) {
    currentCat = cat;

    // Update Tabs
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    // Simple way to find active btn without ID unique for each
    const btns = document.querySelectorAll('.cat-btn');
    const cats = ['length', 'temp', 'area', 'volume', 'weight', 'time'];
    btns[cats.indexOf(cat)].classList.add('active');

    // Populate Selects
    const fromSel = document.getElementById('unitFrom');
    const toSel = document.getElementById('unitTo');

    fromSel.innerHTML = '';
    toSel.innerHTML = '';

    const units = Object.keys(unitData[cat].units);

    units.forEach(u => {
        const label = u.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        fromSel.add(new Option(label, u));
        toSel.add(new Option(label, u));
    });

    // Default selection logic (first vs second item)
    if (units.length > 1) {
        toSel.selectedIndex = 1;
    }

    calculate();
}

function swapUnits() {
    const from = document.getElementById('unitFrom');
    const to = document.getElementById('unitTo');

    const temp = from.value;
    from.value = to.value;
    to.value = temp;

    calculate();
}

// Calculation Logic
function calculate() {
    const val = parseFloat(document.getElementById('inputValue').value);
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;

    if (isNaN(val)) {
        document.getElementById('resultValueDisplay').textContent = "--";
        return;
    }

    let result = 0;
    let formula = "";

    if (currentCat === 'temp') {
        result = convertTemp(val, from, to);
        formula = getTempFormula(from, to);
    } else {
        // Factor based conversion
        // To Base: val / unit_factor
        // From Base: base_val * target_factor

        // Wait, my structure defines: 1 Base = X Units
        // e.g. 1 Meter = 1000 mm. 
        // Convert mm to Meter: val / 1000
        // Convert Meter to mm: val * 1000

        // Step 1: Convert FROM unit to BASE
        const fromFactor = unitData[currentCat].units[from];
        const baseVal = val / fromFactor;

        // Step 2: Convert BASE to TO unit
        const toFactor = unitData[currentCat].units[to];
        result = baseVal * toFactor;

        formula = `Multiply by ${toFactor / fromFactor}`;
        if (from === to) formula = "No conversion needed";
    }

    // Formatting
    // Handle very small or large numbers
    let displayResult = result;
    if (Math.abs(result) < 0.0001 || Math.abs(result) > 1000000) {
        displayResult = result.toExponential(4);
    } else {
        displayResult = parseFloat(result.toPrecision(6)); // Clean floating point noise
    }

    document.getElementById('resultValueDisplay').textContent = `${displayResult} ${formatUnitLabel(to)}`;
    document.getElementById('resultLabel').textContent = `${val} ${formatUnitLabel(from)} =`;
    document.getElementById('formulaDisplay').textContent = formula;
}

function convertTemp(val, from, to) {
    if (from === to) return val;

    let celsius = val;

    // Convert to Celsius first
    if (from === 'fahrenheit') celsius = (val - 32) * 5/9;
    if (from === 'kelvin') celsius = val - 273.15;

    // Convert Celsius to Target
    if (to === 'celsius') return celsius;
    if (to === 'fahrenheit') return (celsius * 9/5) + 32;
    if (to === 'kelvin') return celsius + 273.15;

    return 0;
}

function getTempFormula(from, to) {
    if (from === to) return "No conversion";
    if (from === 'celsius' && to === 'fahrenheit') return "(°C × 9/5) + 32 = °F";
    if (from === 'fahrenheit' && to === 'celsius') return "(°F − 32) × 5/9 = °C";
    if (from === 'celsius' && to === 'kelvin') return "°C + 273.15 = K";
    if (from === 'kelvin' && to === 'celsius') return "K − 273.15 = °C";
    // ... simplified list
    return "Complex conversion";
}

function formatUnitLabel(u) {
    // Simple abbreviations could be added here
    return u.replace(/_/g, ' ');
}

function clearForm() {
  document.getElementById('inputValue').value = "1";
  calculate();
}
