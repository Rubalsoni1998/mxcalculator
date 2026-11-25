// Road Trip Cost Calculator
// Reference data: AAA Your Driving Costs 2026 (maintenance, repair and tires 11.73 c/mile; $12,863 a year at 15,000 miles),
// IRS standard mileage rates (business 76 c/mile from July 1, 2026), EPA CO2 factors (8,887 g/gal gasoline, 10,180 g/gal diesel),
// AAA national average prices (regular $3.91, diesel $6.17, public EV charging $0.42/kWh, November 2026).
let state = { chart: null };

const WEAR_PER_MILE = 0.1173;
const AAA_FULL_PER_MILE = 12863 / 15000;
const IRS_BUSINESS_PER_MILE = 0.76;
const CO2_KG_PER_GAL = { gas: 8.887, diesel: 10.180 };
const PRESETS = {
  gas:    { economy: 28, price: 3.91, ecoUnit: 'mpg',        priceLabel: 'Gas Price per Gallon',    ecoLabel: 'Fuel Economy' },
  diesel: { economy: 30, price: 6.17, ecoUnit: 'mpg',        priceLabel: 'Diesel Price per Gallon', ecoLabel: 'Fuel Economy' },
  ev:     { economy: 30, price: 0.42, ecoUnit: 'kWh/100 mi', priceLabel: 'Charging Price per kWh',  ecoLabel: 'Energy Use' }
};
const COLORS = ['hsl(25,85%,52%)', 'hsl(215,70%,50%)', 'hsl(150,55%,42%)', 'hsl(38,90%,55%)', 'hsl(280,45%,58%)', 'hsl(190,65%,42%)', 'hsl(210,15%,55%)'];

document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select').forEach(function (el) {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });
  $('fuelType').addEventListener('change', applyPreset);
});

function $(id) { return document.getElementById(id); }
function num(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 0 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function hm(hours) {
  const h = Math.floor(hours), m = Math.round((hours - h) * 60);
  return (m === 60 ? h + 1 : h) + ' h ' + (m === 60 ? 0 : m) + ' min';
}

function applyPreset() {
  const p = PRESETS[$('fuelType').value];
  $('economy').value = p.economy;
  $('fuelPrice').value = p.price;
  $('economy').parentNode.querySelector('span').textContent = p.ecoUnit;
  setLabel('economy', p.ecoLabel);
  setLabel('fuelPrice', p.priceLabel);
  calculate();
}
function setLabel(id, text) {
  const label = document.querySelector('label[for="' + id + '"]');
  if (!label) return;
  label.firstChild.nodeValue = text;
}

function calculate() {
  const type = $('fuelType').value;
  const dist = num('distance');
  const trips = parseInt($('roundTrip').value, 10);
  const eco = num('economy');
  const price = num('fuelPrice');
  const speed = num('speed');
  const people = Math.max(1, Math.round(num('people')));
  const days = num('tripDays');
  const nights = num('nights');
  const hotel = num('hotel');
  const food = num('food');
  const tolls = num('tolls'), parking = num('parking'), other = num('other');
  const wearOn = $('wear').value === '1';

  if (!(dist > 0) || !(eco > 0) || price < 0) { showResults(false); return; }

  const miles = dist * trips;
  const units = type === 'ev' ? miles * eco / 100 : miles / eco;       // kWh or gallons
  const fuelCost = units * price;
  const wearCost = wearOn ? miles * WEAR_PER_MILE : 0;
  const lodging = nights * hotel;
  const meals = people * days * food;
  const total = fuelCost + wearCost + lodging + meals + tolls + parking + other;
  const perPerson = total / people;
  const perMile = total / miles;
  const driveHours = speed > 0 ? miles / speed : NaN;

  $('resultLabel').textContent = 'Total Trip Cost';
  $('resultValueDisplay').textContent = money(total);
  $('resultNote').textContent = money(perPerson) + ' per person · ' + miles.toLocaleString('en-US') + ' miles · ' + money(fuelCost) + ' for ' + (type === 'ev' ? 'charging' : 'fuel');

  const fuelWord = type === 'ev' ? 'Charging' : 'Fuel';
  const rows = [
    ['Total miles driven', miles.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' miles'],
    [type === 'ev' ? 'Electricity needed' : 'Fuel needed', units.toFixed(1) + (type === 'ev' ? ' kWh' : ' gallons')],
    [fuelWord + ' cost', money(fuelCost)]
  ];
  if (wearOn) rows.push(['Wear & tear (maintenance and tires, 11.7¢/mile)', money(wearCost)]);
  rows.push(['Lodging (' + nights + ' night' + (nights === 1 ? '' : 's') + ')', money(lodging)]);
  rows.push(['Food (' + people + ' × ' + days + ' days)', money(meals)]);
  rows.push(['Tolls', money(tolls)]);
  rows.push(['Parking', money(parking)]);
  rows.push(['Activities & other', money(other)]);
  rows.push(['SUB:Total trip cost', money(total)]);
  rows.push(['SUB:Cost per person (' + people + ')', money(perPerson)]);
  rows.push(['Cost per mile, all trip costs', money(perMile, 2)]);
  rows.push(['' + fuelWord + ' cost per mile', money(fuelCost / miles, 3)]);
  rows.push(['Estimated driving time', isFinite(driveHours) ? hm(driveHours) : '–']);
  if (type !== 'ev') {
    const kg = units * CO2_KG_PER_GAL[type];
    rows.push(['Estimated CO₂ from fuel', Math.round(kg).toLocaleString('en-US') + ' kg (' + Math.round(kg * 2.20462).toLocaleString('en-US') + ' lb)']);
  }
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');

  const warn = $('warnBox');
  const legHours = speed > 0 ? dist / speed : 0;
  if (legHours > 8) {
    warn.style.display = 'block';
    warn.textContent = 'Each one-way leg is about ' + hm(legHours) + ' of driving. Plan a rest stop about every two hours and consider splitting the drive over two days, which adds a hotel night.';
  } else warn.style.display = 'none';

  const ref = [
    [fuelWord + ' only (your numbers)', fuelCost / miles, fuelCost],
    [fuelWord + ' + AAA maintenance & tires', fuelCost / miles + WEAR_PER_MILE, fuelCost + miles * WEAR_PER_MILE],
    ['IRS business rate (from July 1, 2026)', IRS_BUSINESS_PER_MILE, miles * IRS_BUSINESS_PER_MILE],
    ['AAA full ownership cost (new vehicle average)', AAA_FULL_PER_MILE, miles * AAA_FULL_PER_MILE]
  ];
  $('refTable').innerHTML = ref.map(function (r) {
    return '<tr><td>' + r[0] + '</td><td>' + money(r[1], 3) + '</td><td>' + money(r[2]) + '</td></tr>';
  }).join('');

  showResults(true);
  drawChart([['Fuel / charging', fuelCost], ['Wear & tear', wearCost], ['Lodging', lodging], ['Food', meals], ['Tolls', tolls], ['Parking', parking], ['Activities & other', other]]);
}

function drawChart(items) {
  if (typeof Chart === 'undefined') { setTimeout(function () { drawChart(items); }, 200); return; }
  const labels = [], data = [], colors = [];
  items.forEach(function (x, i) { if (x[1] > 0) { labels.push(x[0]); data.push(x[1]); colors.push(COLORS[i]); } });
  const ctx = $('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();
  if (!data.length) return;
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function (c) {
        const tot = c.dataset.data.reduce(function (s, v) { return s + v; }, 0);
        return c.label + ': ' + money(c.raw) + ' (' + (c.raw / tot * 100).toFixed(1) + '%)';
      } } } }
    }
  });
}

function clearForm() {
  ['distance', 'economy', 'fuelPrice', 'speed', 'people', 'tripDays', 'nights', 'hotel', 'food', 'tolls', 'parking', 'other'].forEach(function (id) { $(id).value = ''; });
  showResults(false);
}
