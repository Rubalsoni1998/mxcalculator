// Math Logic
function calculate() {
    // Inputs
    const a = parseFloat(document.getElementById('sideA').value);
    const b = parseFloat(document.getElementById('sideB').value);
    const c = parseFloat(document.getElementById('sideC').value);
    const A = parseFloat(document.getElementById('angleA').value);
    const B = parseFloat(document.getElementById('angleB').value);
    const C = parseFloat(document.getElementById('angleC').value);

    const sides = [a, b, c];
    const angles = [A, B, C];

    const sideCount = sides.filter(s => !isNaN(s)).length;
    const angleCount = angles.filter(a => !isNaN(a)).length;

    if (sideCount + angleCount < 3) {
        alert("Please enter at least 3 values.");
        return;
    }
    if (sideCount === 0) {
        alert("Please enter at least 1 side length.");
        return;
    }

    // --- SOLVER LOGIC (Simplified for common cases) ---
    // Converts Degrees to Radians for calculation, back to Deg for display

    let sa = a, sb = b, sc = c;
    let aa = A, ab = B, ac = C;

    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;

    // 1. AAS or ASA (Two angles + One side)
    if (angleCount >= 2 && sideCount >= 1) {
        // Find missing angle
        if (isNaN(aa)) aa = 180 - ab - ac;
        if (isNaN(ab)) ab = 180 - aa - ac;
        if (isNaN(ac)) ac = 180 - aa - ab;

        // Check validity
        if (aa <= 0 || ab <= 0 || ac <= 0) { alert("Invalid angles sum."); return; }

        // Use Law of Sines to find sides
        // ratio = side / sin(angle)
        let ratio = 0;
        if (!isNaN(sa)) ratio = sa / Math.sin(toRad(aa));
        else if (!isNaN(sb)) ratio = sb / Math.sin(toRad(ab));
        else if (!isNaN(sc)) ratio = sc / Math.sin(toRad(ac));

        sa = ratio * Math.sin(toRad(aa));
        sb = ratio * Math.sin(toRad(ab));
        sc = ratio * Math.sin(toRad(ac));
    }
    // 2. SAS (Two sides + Included Angle) or SSS (Three sides) or SSA
    else {
         // For brevity in this demo, let's assume valid SSS logic or basic SAS
         // SSS Case
         if (sideCount === 3) {
             aa = toDeg(Math.acos((sb*sb + sc*sc - sa*sa)/(2*sb*sc)));
             ab = toDeg(Math.acos((sa*sa + sc*sc - sb*sb)/(2*sa*sc)));
             ac = 180 - aa - ab;
         }
         // SAS Case (e.g. a, b, Angle C)
         else if (!isNaN(sa) && !isNaN(sb) && !isNaN(ac)) {
             sc = Math.sqrt(sa*sa + sb*sb - 2*sa*sb*Math.cos(toRad(ac)));
             aa = toDeg(Math.asin(sa * Math.sin(toRad(ac)) / sc));
             ab = 180 - aa - ac;
         }
         // Fallback for demo simplicity on complex ambiguous cases
    }

    // Display Results
    if (isNaN(sa) || isNaN(sb) || isNaN(sc) || isNaN(aa) || isNaN(ab) || isNaN(ac)) {
        alert("Could not solve with provided values. Please check inputs.");
        return;
    }

    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    document.getElementById('resSideA').textContent = sa.toFixed(2);
    document.getElementById('resSideB').textContent = sb.toFixed(2);
    document.getElementById('resSideC').textContent = sc.toFixed(2);

    document.getElementById('resAngleA').textContent = aa.toFixed(2) + '°';
    document.getElementById('resAngleB').textContent = ab.toFixed(2) + '°';
    document.getElementById('resAngleC').textContent = ac.toFixed(2) + '°';

    // Properties
    const perimeter = sa + sb + sc;
    const s = perimeter / 2;
    const area = Math.sqrt(s * (s-sa) * (s-sb) * (s-sc));

    document.getElementById('resPerimeter').textContent = perimeter.toFixed(2);
    document.getElementById('resSemiP').textContent = s.toFixed(2);
    document.getElementById('resArea').textContent = area.toFixed(2);

    // Type
    let type = "Scalene";
    if (Math.abs(sa-sb) < 0.01 && Math.abs(sb-sc) < 0.01) type = "Equilateral";
    else if (Math.abs(sa-sb) < 0.01 || Math.abs(sb-sc) < 0.01 || Math.abs(sa-sc) < 0.01) type = "Isosceles";

    if (Math.abs(aa-90) < 0.01 || Math.abs(ab-90) < 0.01 || Math.abs(ac-90) < 0.01) type += " Right";
    else if (aa > 90 || ab > 90 || ac > 90) type += " Obtuse";
    else type += " Acute";

    document.getElementById('resType').textContent = type;
}

function clearForm() {
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(i => i.value = "");

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
