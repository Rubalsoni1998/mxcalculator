// Water Intake Calculator
// National Academies (IOM 2005) adequate total water: men 3.7 L (125 oz), women 2.7 L (91 oz); drinks about 81% (101 oz / 74 oz).
// Pregnancy about 3.0 L total, 10 cups from drinks; breastfeeding about 3.8 L total, 13 cups from drinks. Exercise +12 oz per 30 min (ACSM guidance). Hot weather +16 oz (our estimate).

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

function calculate() {
  const sex = $('sex').value;
  $('statusWrap').style.display = sex === 'f' ? '' : 'none';
  const status = sex === 'f' ? $('status').value : '0';
  const mins = nv('exercise'), awake = nv('awake') || 16, lb = nv('weight');
  const hot = $('climate').value === '1';
  let total, drinks, group;
  if (status === 'p') { total = 101; drinks = 80; group = 'Pregnant'; }
  else if (status === 'b') { total = 128; drinks = 104; group = 'Breastfeeding'; }
  else if (sex === 'm') { total = 125; drinks = 101; group = 'Adult man'; }
  else { total = 91; drinks = 74; group = 'Adult woman'; }
  const exOz = mins / 30 * 12;
  const heatOz = hot ? 16 : 0;
  const goalDrinks = drinks + exOz + heatOz;
  const goalTotal = total + exOz + heatOz;
  const food = goalTotal - goalDrinks;
  const perHour = goalDrinks / awake;

  $('resultLabel').textContent = 'Daily Drink Goal';
  $('resultValueDisplay').textContent = fmt(goalDrinks) + ' oz';
  $('resultNote').textContent = fmt(goalDrinks / 8, 1) + ' cups · ' + fmt(goalDrinks / 33.814, 1) + ' liters · about ' + fmt(perHour, 1) + ' oz per waking hour';

  const warn = $('warnBox');
  if (goalDrinks > 160) { warn.style.display = 'block'; warn.textContent = 'This is a very high amount. Spread it out, follow your thirst and talk to a doctor. Drinking far more than your body needs can be harmful.'; }
  else warn.style.display = 'none';

  const rows = [
    ['Group', group],
    ['Base fluids from drinks', fmt(drinks) + ' oz'],
    ['Base fluids from food (about 19%)', fmt(total - drinks) + ' oz'],
    ['Exercise allowance (' + fmt(mins) + ' min)', '+' + fmt(exOz, 0) + ' oz'],
    ['Hot or humid allowance', hot ? '+16 oz' : 'none'],
    ['SUB:Drink goal', fmt(goalDrinks) + ' oz'],
    ['In cups (8 oz)', fmt(goalDrinks / 8, 1)],
    ['In liters', fmt(goalDrinks / 33.814, 2) + ' L'],
    ['In 16.9 oz bottles', fmt(goalDrinks / 16.9, 1)],
    ['In 8 oz glasses', fmt(goalDrinks / 8, 1)],
    ['Per waking hour (' + fmt(awake) + ' h)', fmt(perHour, 1) + ' oz'],
    ['SUB:Total fluids including food', fmt(goalTotal) + ' oz (' + fmt(goalTotal / 33.814, 2) + ' L)']
  ];
  if (lb > 0) rows.push(['Half-ounce-per-pound rule of thumb', fmt(lb / 2) + ' oz']);
  if (mins > 0) {
    rows.push(['Around a workout: 2 to 3 hours before', '17 to 20 oz']);
    rows.push(['During exercise, every 10 to 20 min', '7 to 10 oz']);
  }
  renderRows(rows);
  showResults(true);
}

function clearForm() {
  ['weight', 'exercise', 'awake'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
