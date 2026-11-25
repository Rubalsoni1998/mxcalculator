// Dog Age Calculator
// Size-based chart (15 / +9 / then +4, +5, +6, +7 per year) and UC San Diego epigenetic formula 16 ln(age) + 31 (Wang et al., Cell Systems 2020, Labrador Retrievers).

function $(id) { return document.getElementById(id); }
function nv(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function fmt(v, d) { return isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 0 : d }) : '–'; }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function renderRows(rows) {
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');
}
document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
});

const ADD = { s: 4, m: 5, l: 6, g: 7 };
const SENIOR = { s: [8, 11], m: [8, 10], l: [8, 9], g: [6, 8] };
const SIZE = { s: 'small', m: 'medium', l: 'large', g: 'giant' };
function human(age, size) {
  if (age <= 1) return 15 * age;
  if (age <= 2) return 15 + 9 * (age - 1);
  return 24 + (age - 2) * ADD[size];
}
function ucsd(age) { return age >= 1 ? 16 * Math.log(age) + 31 : NaN; }
function stage(age, size) {
  const s = SENIOR[size][0];
  if (age < 1) return 'Puppy';
  if (age < 3) return 'Young adult';
  if (age < s - 2) return 'Adult';
  if (age < s) return 'Mature adult';
  return 'Senior';
}

function calculate() {
  const years = nv('years'), months = Math.min(11, nv('months'));
  const size = $('size').value;
  const age = years + months / 12;
  if (!(age > 0) || age > 30) { showResults(false); return; }

  const h = human(age, size), u = ucsd(age);
  const range = SENIOR[size];
  $('resultLabel').textContent = 'Age in Human Years';
  $('resultValueDisplay').textContent = Math.round(h) + ' years';
  $('resultNote').textContent = (years ? years + (years === 1 ? ' year' : ' years') : '') + (years && months ? ' ' : '') + (months ? months + (months === 1 ? ' month' : ' months') : '') + ' old ' + SIZE[size] + ' dog · ' + stage(age, size);

  const warn = $('warnBox'); warn.style.display = 'none';
  if (age >= range[0] && age >= 1) { warn.style.display = 'block'; warn.textContent = 'Your dog is in the senior range for a ' + SIZE[size] + ' dog. Ask your veterinarian about senior wellness exams and joint, dental and weight care.'; }

  renderRows([
    ['Dog age', fmt(age, 1) + ' years'],
    ['SUB:Human age, size-based chart', Math.round(h) + ' years'],
    ['Human age, UCSD formula', isFinite(u) ? Math.round(u) + ' years' : 'n/a (needs age 1 or older)'],
    ['Old "7×" rule (for comparison)', Math.round(age * 7) + ' years'],
    ['Life stage', stage(age, size)],
    ['Senior from about', range[0] + ' to ' + range[1] + ' years'],
    ['Next birthday', 'Age ' + (Math.floor(age) + 1) + ' = ' + Math.round(human(Math.floor(age) + 1, size)) + ' human years']
  ]);

  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16];
  $('ageTable').innerHTML = list.map(function (a) {
    const hit = Math.floor(age) === a;
    return '<tr' + (hit ? ' class="sub-row"' : '') + '><td>' + a + '</td><td>' + Math.round(human(a, size)) + '</td><td>' + Math.round(ucsd(a)) + '</td><td>' + a * 7 + '</td></tr>';
  }).join('');
  showResults(true);
}

function clearForm() {
  ['years', 'months'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
