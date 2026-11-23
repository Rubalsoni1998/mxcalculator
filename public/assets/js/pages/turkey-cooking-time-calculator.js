// Turkey Cooking Time Calculator
// Anchor points (weight lb, min minutes, max minutes) for a 325°F oven, from the USDA whole-turkey timetable
const ANCHORS = {
  no:  [[6, 120, 150], [10, 165, 180], [13, 180, 225], [16, 225, 255], [19, 255, 270], [22, 270, 300]],
  yes: [[6, 135, 165], [10, 180, 210], [13, 210, 240], [16, 240, 255], [19, 255, 285], [22, 285, 315]]
};
const TEMP_FACTOR = { '325': 1, '350': 0.90, '375': 0.82 };

document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

function $(id) { return document.getElementById(id); }
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function dur(mins) {
  mins = Math.round(mins / 5) * 5;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return m + ' min';
  return h + ' hr' + (m ? ' ' + m + ' min' : '');
}
function clock(totalMins) {
  let day = '';
  if (totalMins < 0) { totalMins += 1440; day = ' (day before)'; }
  totalMins = ((Math.round(totalMins / 5) * 5) % 1440 + 1440) % 1440;
  const h = Math.floor(totalMins / 60), m = totalMins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap + day;
}
function interp(table, w) {
  const first = table[0], last = table[table.length - 1];
  if (w <= first[0]) { const f = w / first[0]; return [first[1] * f, first[2] * f]; }
  if (w >= last[0]) { const f = w / last[0]; return [last[1] * f, last[2] * f]; }
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
    if (w >= a[0] && w <= b[0]) {
      const t = (w - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  return [first[1], first[2]];
}

function calculate() {
  let w = parseFloat($('weight').value);
  if (!(w > 0)) { showResults(false); return; }
  const kg = $('unit').value === 'kg';
  const lb = kg ? w * 2.20462 : w;
  const frozen = $('state').value === 'frozen';
  const stuffed = $('stuffed').value === 'yes';
  const method = $('method').value;
  const rest = Math.max(0, parseFloat($('rest').value) || 0);
  const dinner = $('dinnerTime').value;
  const warns = [];
  const wtxt = kg ? w.toFixed(1) + ' kg (' + lb.toFixed(1) + ' lb)' : lb.toFixed(1) + ' lb';

  const resLabel = $('resultLabel'), resVal = $('resultValueDisplay'), resNote = $('resultNote');

  if (method === 'fry') {
    if (frozen) {
      resLabel.textContent = 'Deep Frying';
      resVal.textContent = 'Not safe';
      resNote.textContent = 'Never deep-fry a frozen or partly frozen turkey';
      $('warnBox').style.display = 'block';
      $('warnBox').textContent = 'Ice and hot oil can cause a violent boil-over and fire. Thaw the turkey completely and pat it dry, or choose oven roasting.';
      $('breakdownTableBody').innerHTML = '';
      showResults(true);
      return;
    }
    if (stuffed) {
      resLabel.textContent = 'Deep Frying';
      resVal.textContent = 'Not possible';
      resNote.textContent = 'A turkey cannot be stuffed for deep frying';
      $('warnBox').style.display = 'block';
      $('warnBox').textContent = 'Choose "Unstuffed" to deep fry, or switch to oven roasting.';
      $('breakdownTableBody').innerHTML = '';
      showResults(true);
      return;
    }
    if (lb > 14) warns.push('Turkeys over 14 lb are not recommended for deep frying. They cook unevenly and are hard to lower into the oil safely.');
  } else {
    if (lb < 8) warns.push('Whole turkeys under 8 lb are outside the USDA table. This is an estimate, so check the temperature early.');
    if (lb > 24) warns.push('Turkeys over 24 lb are outside the USDA table. Times are extended from the table, so check the temperature early and consider cooking two smaller birds.');
    if (frozen && stuffed) warns.push('Stuffing a frozen turkey is not recommended. Thaw the bird fully first.');
  }

  let lo, hi, perLb, methodTxt, tempTxt;
  if (method === 'fry') {
    lo = lb * 3; hi = lb * 4;
    methodTxt = 'Deep fry'; tempTxt = '350°F oil';
  } else {
    const base = interp(ANCHORS[stuffed ? 'yes' : 'no'], lb);
    const f = TEMP_FACTOR[method] * (frozen ? 1.5 : 1);
    lo = base[0] * f; hi = base[1] * f;
    methodTxt = 'Oven roast'; tempTxt = method + '°F';
  }
  const mid = (lo + hi) / 2;
  perLb = mid / lb;

  resLabel.textContent = (method === 'fry' ? 'Frying' : 'Roasting') + ' Time';
  resVal.textContent = dur(lo) + ' – ' + dur(hi);
  resNote.textContent = 'About ' + perLb.toFixed(1) + ' min per lb';
  const box = $('warnBox');
  if (warns.length) { box.style.display = 'block'; box.innerHTML = warns.join('<br>'); } else box.style.display = 'none';

  const rows = [
    ['Turkey weight', wtxt],
    ['Condition', (frozen ? 'Frozen (not thawed)' : 'Fresh or thawed') + (method === 'fry' ? '' : stuffed ? ', stuffed' : ', unstuffed')],
    ['Method and temperature', methodTxt + ' at ' + tempTxt],
    ['SUB:Estimated cook time', dur(lo) + ' – ' + dur(hi)],
    ['Safe internal temperature', '165°F (74°C) in breast, thigh and wing'],
    ['Resting time', rest + ' min, loosely covered'],
    ['Servings (1 – 1.5 lb each)', Math.floor(lb / 1.5) + ' – ' + Math.floor(lb / 1) + ' people']
  ];

  if (dinner) {
    const parts = dinner.split(':');
    const d = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    const done = d - rest;                       // turkey must be out of the oven/fryer by then
    const startEarly = done - hi, startLate = done - lo;
    rows.push(['SUB:Dinner plan', 'Serve at ' + clock(d)]);
    if (method !== 'fry') rows.push(['Start preheating the oven', clock(startEarly - 25)]);
    rows.push(['Put the turkey in (safest start)', clock(startEarly)]);
    rows.push(['Latest start if cooking fast', clock(startLate)]);
    rows.push(['Take out between', clock(startEarly + lo) + ' and ' + clock(done)]);
    rows.push(['Start carving', clock(d)]);
  }

  if (frozen) {
    const dMin = Math.ceil(lb / 5), dMax = Math.ceil(lb / 4);
    rows.push(['SUB:Thawing', '']);
    rows.push(['In the refrigerator', (dMin === dMax ? dMin : dMin + ' – ' + dMax) + (dMax === 1 ? ' day' : ' days')]);
    rows.push(['In cold water (change water every 30 min)', dur(lb * 30)]);
  }

  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  showResults(true);
}

function clearForm() {
  $('weight').value = '';
  showResults(false);
}
