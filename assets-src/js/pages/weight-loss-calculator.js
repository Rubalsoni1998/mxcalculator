// Weight Loss (Calorie Deficit) Calculator
// Mifflin-St Jeor BMR; 3,500 kcal per lb; weekly goals 0.5-2 lb (CDC, Harvard Health); floors 1,200 (women) / 1,500 (men); weekly recalculation for shrinking body.
let state = { chart: null };

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

const FLOOR = { m: 1500, f: 1200 };
function mifflin(lb, cm, age, male) { return 10 * (lb / 2.20462) + 6.25 * cm - 5 * age + (male ? 5 : -161); }
function bmi(lb, cm) { const m = cm / 100; return (lb / 2.20462) / (m * m); }
function fmtDate(d) { return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
function stop(msg) { const w = $('warnBox'); w.style.display = 'block'; w.textContent = msg; showResults(false); $('resultsPlaceholder').style.display = 'none'; $('resultsContent').style.display = 'block'; $('resultLabel').textContent = 'Check your entries'; $('resultValueDisplay').textContent = '–'; $('resultNote').textContent = ''; $('breakdownTableBody').innerHTML = ''; $('stepTable').innerHTML = ''; if (state.chart) { state.chart.destroy(); state.chart = null; } }

function calculate() {
  const male = $('sex').value === 'm';
  const age = nv('age');
  const cm = (nv('feet') * 12 + nv('inches')) * 2.54;
  const w0 = nv('weight'), goal = nv('goal');
  const act = parseFloat($('activity').value);
  const rate = parseFloat($('rate').value);
  const warn = $('warnBox'); warn.style.display = 'none';

  if (!(age > 0) || !(cm > 0) || !(w0 > 0) || !(goal > 0)) { showResults(false); return; }
  if (age < 18) return stop('This calculator is for adults 18 and over. For children and teens, talk to a pediatrician.');
  if (cm < 122 || cm > 241) return stop('Enter a height between 4 ft and 7 ft 11 in.');
  if (w0 < 80 || w0 > 700) return stop('Enter a current weight between 80 and 700 lb.');
  const bmi0 = bmi(w0, cm), bmiG = bmi(goal, cm);
  if (bmi0 < 18.5) return stop('Your current BMI is below 18.5, so a weight loss plan is not appropriate. Please talk to a doctor.');
  if (goal >= w0) return stop('Enter a goal weight below your current weight. This calculator is for weight loss.');
  if (bmiG < 18.5) return stop('That goal weight would be a BMI of ' + bmiG.toFixed(1) + ', below the healthy range (18.5 to 24.9). Please choose a higher goal and ask a doctor what is right for you.');

  const bmr = mifflin(w0, cm, age, male);
  const tdee = bmr * act;
  const floor = FLOOR[male ? 'm' : 'f'];
  let target = tdee - rate * 500;
  let floored = false;
  if (target < floor) { target = floor; floored = true; }
  const deficit = tdee - target;
  if (deficit <= 0) return stop('Your estimated maintenance calories are at or below the safe minimum of ' + fmt(floor) + ' per day, so a calorie deficit is not advised here. Talk to a doctor or dietitian about a plan.');
  const weeklyLoss = deficit * 7 / 3500;
  const toLose = w0 - goal;
  const simpleWeeks = toLose / weeklyLoss;

  // adjusted projection: recalculate maintenance each week at the same intake
  const pts = [[0, w0]]; let w = w0, wk = 0, plateau = false;
  while (w > goal && wk < 600) {
    const d = mifflin(w, cm, age, male) * act - target;
    if (d <= 0.5) { plateau = true; break; }
    const next = w - d * 7 / 3500;
    wk++;
    if (next <= goal) { wk = wk - 1 + (w - goal) / (w - next); pts.push([wk, goal]); w = goal; break; }
    w = next; pts.push([wk, w]);
  }
  const reached = w <= goal + 0.001;
  const adjWeeks = wk;
  // weight where maintenance equals intake (plateau)
  const kgPlat = (target / act - 6.25 * cm + 5 * age - (male ? 5 : -161)) / 10;
  const lbPlat = kgPlat * 2.20462;

  if (floored) { warn.style.display = 'block'; warn.textContent = 'Your chosen pace would drop below ' + fmt(floor) + ' calories a day, so the target was raised to that minimum. Your loss will be slower than requested.'; }
  else if (!reached) { warn.style.display = 'block'; warn.textContent = 'At ' + fmt(target) + ' calories you would level off near ' + fmt(lbPlat) + ' lb as your body burns fewer calories. To reach ' + fmt(goal) + ' lb, add activity or recalculate with your lower weight later.'; }

  $('resultLabel').textContent = 'Daily Calorie Target';
  $('resultValueDisplay').textContent = fmt(target) + ' kcal';
  const date = new Date(); date.setDate(date.getDate() + Math.round((reached ? adjWeeks : simpleWeeks) * 7));
  $('resultNote').textContent = 'About ' + weeklyLoss.toFixed(1) + ' lb per week · ' + (reached ? 'goal in about ' + Math.ceil(adjWeeks) + ' weeks (' + fmtDate(date) + ')' : 'goal not reached at this intake');

  renderRows([
    ['BMR (calories at rest)', fmt(bmr) + ' kcal'],
    ['Maintenance calories (BMR × ' + act + ')', fmt(tdee) + ' kcal'],
    ['Daily deficit', fmt(deficit) + ' kcal'],
    ['SUB:Daily calorie target', fmt(target) + ' kcal'],
    ['Safe minimum for ' + (male ? 'men' : 'women'), fmt(floor) + ' kcal'],
    ['Weight to lose', toLose.toFixed(0) + ' lb'],
    ['Expected loss per week', weeklyLoss.toFixed(2) + ' lb'],
    ['Time to goal, simple estimate', simpleWeeks.toFixed(0) + ' weeks'],
    ['SUB:Time to goal, adjusted', reached ? Math.ceil(adjWeeks) + ' weeks (' + fmtDate(date) + ')' : 'Plateau near ' + fmt(lbPlat) + ' lb'],
    ['BMI now', bmi0.toFixed(1)],
    ['BMI at goal', bmiG.toFixed(1)]
  ]);

  // projection table every 4 weeks + final
  let rows = '';
  const shown = pts.filter(function (p) { return p[0] % 4 === 0 || p === pts[pts.length - 1]; });
  shown.forEach(function (p) {
    rows += '<tr><td>' + (Number.isInteger(p[0]) ? p[0] : p[0].toFixed(0)) + '</td><td>' + p[1].toFixed(1) + ' lb</td><td>' + fmt(mifflin(p[1], cm, age, male) * act) + ' kcal</td></tr>';
  });
  $('stepTable').innerHTML = rows;
  showResults(true);
  drawChart(pts, w0, weeklyLoss, goal);
}

function drawChart(pts, w0, weeklyLoss, goal) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(pts, w0, weeklyLoss, goal); }, 200); return; }
  const maxWk = Math.ceil(pts[pts.length - 1][0]);
  const labels = []; for (let i = 0; i <= maxWk; i++) labels.push(i);
  const adj = labels.map(function (i) {
    let best = null; for (let k = 0; k < pts.length; k++) { if (pts[k][0] <= i) best = pts[k][1]; }
    return best === null ? null : Math.round(best * 10) / 10;
  });
  const simple = labels.map(function (i) { return Math.max(goal, Math.round((w0 - weeklyLoss * i) * 10) / 10); });
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: [
      { label: 'Adjusted projection', data: adj, borderColor: 'hsl(165, 65%, 38%)', backgroundColor: 'hsla(165, 65%, 38%, 0.12)', fill: true, pointRadius: 0, tension: 0.25, borderWidth: 3 },
      { label: 'Simple estimate', data: simple, borderColor: 'hsl(215, 15%, 55%)', borderDash: [6, 4], pointRadius: 0, borderWidth: 2 }
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: function (it) { return 'Week ' + it[0].label; }, label: function (c) { return c.dataset.label + ': ' + c.raw + ' lb'; } } } },
      scales: { x: { title: { display: true, text: 'Weeks' }, ticks: { maxTicksLimit: 10 } }, y: { title: { display: true, text: 'Weight (lb)' } } } }
  });
}

function clearForm() {
  ['age', 'feet', 'inches', 'weight', 'goal'].forEach(function (id) { $(id).value = ''; });
  $('warnBox').style.display = 'none';
  showResults(false);
}
