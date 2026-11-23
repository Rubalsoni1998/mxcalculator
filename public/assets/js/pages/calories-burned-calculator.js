(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var met = parseFloat(HC.val('activity')), min = HC.num('minutes'), kg = HC.weight('weight');
    if (!(min >= 1 && min <= 1440)) return HC.err('Enter a duration between 1 and 1,440 minutes.');
    if (!(kg >= 20 && kg <= 400)) return HC.err('Enter a valid weight.');
    var sel = document.getElementById('activity'), kcal = met * kg * min / 60, rows = [], act = 0;
    Array.prototype.forEach.call(sel.options, function (o, i) { rows.push([o.text, parseFloat(o.value) * kg * min / 60]); });
    rows = rows.map(function (r, i) { return { i: i, t: r[0], v: r[1] }; }).sort(function (a, b) { return b.v - a.v; });
    var shown = rows.map(function (r) { if (r.i === sel.selectedIndex) act = rows.indexOf(r); return [r.t, f(r.v, 0) + ' kcal']; });
    return { hero: { label: 'Calories burned', value: f(kcal, 0) + ' kcal', sub: sel.options[sel.selectedIndex].text + ' for ' + min + ' min' },
      rowsTitle: 'Summary', rows: [['Per minute', f(kcal / min, 1) + ' kcal'], ['Per hour', f(met * kg, 0) + ' kcal'], ['MET value', f(met, 1)]],
      tables: [{ title: 'Same time, other activities', head: ['Activity', 'Calories'], rows: shown, active: act }],
      note: 'Calories = MET × weight (kg) × hours. Real burn varies with fitness, terrain, technique and body composition, so treat this as an estimate.' };
  });
})();
