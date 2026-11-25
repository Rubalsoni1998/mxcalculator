// Countdown Calculator
// US holiday rules: OPM federal holidays (MLK 3rd Mon Jan, Presidents 3rd Mon Feb, Memorial last Mon May, Labor 1st Mon Sep, Columbus 2nd Mon Oct, Thanksgiving 4th Thu Nov);
// Mother's Day 2nd Sun May, Father's Day 3rd Sun Jun; Easter by the anonymous Gregorian computus.
function $(id) { return document.getElementById(id); }
function showResults(on) { $('resultsPlaceholder').style.display = on ? 'none' : 'flex'; $('resultsContent').style.display = on ? 'block' : 'none'; }
function nth(y, m, wd, k) { const d = new Date(y, m, 1); const off = (7 + wd - d.getDay()) % 7; return new Date(y, m, 1 + off + (k - 1) * 7); }
function lastWd(y, m, wd) { const d = new Date(y, m + 1, 0); return new Date(y, m, d.getDate() - ((7 + d.getDay() - wd) % 7)); }
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}
const HOL = {
  newyear: ["New Year's Day", function (y) { return new Date(y, 0, 1); }],
  mlk: ['Martin Luther King Jr. Day', function (y) { return nth(y, 0, 1, 3); }],
  valentine: ["Valentine's Day", function (y) { return new Date(y, 1, 14); }],
  presidents: ["Presidents' Day", function (y) { return nth(y, 1, 1, 3); }],
  easter: ['Easter Sunday', easter],
  mothers: ["Mother's Day", function (y) { return nth(y, 4, 0, 2); }],
  memorial: ['Memorial Day', function (y) { return lastWd(y, 4, 1); }],
  fathers: ["Father's Day", function (y) { return nth(y, 5, 0, 3); }],
  juneteenth: ['Juneteenth', function (y) { return new Date(y, 5, 19); }],
  july4: ['Independence Day', function (y) { return new Date(y, 6, 4); }],
  labor: ['Labor Day', function (y) { return nth(y, 8, 1, 1); }],
  halloween: ['Halloween', function (y) { return new Date(y, 9, 31); }],
  columbus: ['Columbus Day', function (y) { return nth(y, 9, 1, 2); }],
  veterans: ['Veterans Day', function (y) { return new Date(y, 10, 11); }],
  thanksgiving: ['Thanksgiving', function (y) { return nth(y, 10, 4, 4); }],
  blackfriday: ['Black Friday', function (y) { const t = nth(y, 10, 4, 4); return new Date(y, 10, t.getDate() + 1); }],
  christmas: ['Christmas Day', function (y) { return new Date(y, 11, 25); }],
  nye: ["New Year's Eve", function (y) { return new Date(y, 11, 31); }]
};
function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function nextOf(key) { const t = sod(new Date()); let d = HOL[key][1](t.getFullYear()); if (d < t) d = HOL[key][1](t.getFullYear() + 1); return d; }
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fmtDate(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
function pl(n, w) { return n.toLocaleString('en-US') + ' ' + w + (n === 1 ? '' : 's'); }

function ymd(a, b) {            // a <= b, calendar difference
  let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
  if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return [y, m, d];
}
function weekdaysBetween(from, to) {   // days after `from` up to and including `to`, Mon-Fri only
  let c = 0; const d = new Date(from); const dir = to >= from ? 1 : -1; const n = Math.round(Math.abs(to - from) / 86400000);
  for (let i = 0; i < n; i++) { d.setDate(d.getDate() + dir); const w = d.getDay(); if (w !== 0 && w !== 6) c++; }
  return c;
}

function calculate() {
  const val = $('eventDate').value;
  if (!val) { showResults(false); return; }
  const p = val.split('-').map(Number);
  const tm = ($('eventTime').value || '00:00').split(':').map(Number);
  const target = new Date(p[0], p[1] - 1, p[2], tm[0] || 0, tm[1] || 0, 0);
  if (isNaN(target.getTime())) { showResults(false); return; }
  const now = new Date();
  const diff = target - now, past = diff < 0, ad = Math.abs(diff);
  const t0 = sod(now), t1 = sod(target);
  const days = Math.round((t1 - t0) / 86400000), adays = Math.abs(days);
  const name = $('eventName').value.trim() || (HOL[$('quick').value] ? HOL[$('quick').value][0] : 'your date');
  const D = Math.floor(ad / 86400000), H = Math.floor(ad % 86400000 / 3600000), M = Math.floor(ad % 3600000 / 60000), S = Math.floor(ad % 60000 / 1000);

  $('resultLabel').textContent = past ? 'Days Since ' + name : 'Days Until ' + name;
  $('resultValueDisplay').textContent = pl(adays, 'day');
  $('resultNote').textContent = (past ? 'Happened ' : '') + fmtDate(target) + ' · ' + pl(D, 'day') + ' ' + H + ' h ' + M + ' m ' + S + ' s' + (past ? ' ago' : ' left');
  const a = past ? t1 : t0, b = past ? t0 : t1;
  const r = ymd(a, b), wk = Math.floor(adays / 7), wd = adays % 7;
  const wkd = weekdaysBetween(a, b);
  const dow = target.toLocaleDateString('en-US', { weekday: 'long' });
  const rows = [
    ['Date', fmtDate(target) + (tm[0] || tm[1] ? ' at ' + String(tm[0]).padStart(2, '0') + ':' + String(tm[1]).padStart(2, '0') : '')],
    ['SUB:' + (past ? 'Days since' : 'Days until'), pl(adays, 'day')],
    ['Weeks and days', pl(wk, 'week') + ' ' + pl(wd, 'day')],
    ['Years, months, days', r[0] + ' y ' + r[1] + ' m ' + r[2] + ' d'],
    ['Exact time', pl(D, 'day') + ', ' + H + ' h, ' + M + ' m, ' + S + ' s'],
    ['Total hours', Math.floor(ad / 3600000).toLocaleString('en-US')],
    ['Total minutes', Math.floor(ad / 60000).toLocaleString('en-US')],
    ['Total seconds', Math.floor(ad / 1000).toLocaleString('en-US')],
    ['Weekdays (Mon to Fri)', pl(wkd, 'day')],
    ['Weekend days', pl(adays - wkd, 'day')],
    ['Day of the week', dow]
  ];
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');
  const warn = $('warnBox'); warn.style.display = 'none';
  if (!past && adays === 0) { warn.style.display = 'block'; warn.textContent = 'That date is today.'; }
  showResults(true);
}

function buildHolidays() {
  const t0 = sod(new Date());
  const list = Object.keys(HOL).map(function (k) { const d = nextOf(k); return [HOL[k][0], d, Math.round((d - t0) / 86400000)]; }).sort(function (a, b) { return a[2] - b[2]; });
  $('holidayTable').innerHTML = list.map(function (x) {
    return '<tr><td>' + x[0] + '</td><td>' + x[1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</td><td>' + (x[2] === 0 ? 'Today' : x[2].toLocaleString('en-US')) + '</td></tr>';
  }).join('');
}
function applyQuick() {
  const k = $('quick').value;
  if (k !== 'custom') { $('eventDate').value = iso(nextOf(k)); $('eventTime').value = '00:00'; }
  calculate();
}
function clearForm() { $('quick').value = 'custom'; $('eventName').value = ''; $('eventDate').value = ''; $('eventTime').value = '00:00'; showResults(false); }
document.addEventListener('DOMContentLoaded', function () {
  $('quick').addEventListener('change', applyQuick);
  $('eventDate').addEventListener('input', function () { $('quick').value = 'custom'; calculate(); });
  ['eventTime', 'eventName'].forEach(function (id) { $(id).addEventListener('input', calculate); });
  $('quick').value = 'christmas'; applyQuick(); buildHolidays();
  setInterval(function () { if ($('resultsContent').style.display !== 'none') calculate(); }, 1000);
});
