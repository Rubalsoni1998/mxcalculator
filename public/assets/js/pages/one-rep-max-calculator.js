(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var kg = HC.weight('lift'), r = HC.num('reps');
    if (!(kg > 0)) return HC.err('Enter the weight you lifted.');
    if (!(r >= 1 && r <= 20) || Math.floor(r) !== r) return HC.err('Enter a whole number of reps from 1 to 20.');
    var fm = [['Epley', kg * (1 + r / 30)], ['Brzycki', kg * 36 / (37 - r)], ['Lander', 100 * kg / (101.3 - 2.67123 * r)], ['Lombardi', kg * Math.pow(r, 0.10)],
      ['Mayhew', 100 * kg / (52.2 + 41.9 * Math.exp(-0.055 * r))], ["O'Conner", kg * (1 + 0.025 * r)], ['Wathan', 100 * kg / (48.8 + 53.8 * Math.exp(-0.075 * r))]];
    if (r === 1) fm = fm.map(function (x) { return [x[0], kg]; });
    var avg = fm.reduce(function (s, x) { return s + x[1]; }, 0) / fm.length, us = HC.units() === 'us';
    var t = function (v) { return us ? f(v / HC.LB, 1) + ' lb' : f(v, 1) + ' kg'; };
    var pct = [[100, '1'], [95, '2'], [90, '4'], [85, '6'], [80, '8'], [75, '10'], [70, '12'], [65, '15'], [60, '20'], [55, '–'], [50, '–']];
    return { hero: { label: 'Estimated one-rep max', value: t(avg), sub: 'Average of 7 formulas' },
      rowsTitle: 'By formula', rows: fm.map(function (x) { return [x[0], t(x[1])]; }),
      tables: [{ title: 'Training percentages', head: ['% of 1RM', 'Typical reps', 'Weight'], rows: pct.map(function (p) { return [p[0] + '%', p[1], t(avg * p[0] / 100)]; }) }],
      note: 'Estimates are most reliable for sets of 10 reps or fewer. Test a true max only with a spotter and good technique.' };
  });
})();
