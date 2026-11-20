(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var sex = HC.val('gender'), age = HC.num('age'), h = HC.height('height') / HC.IN, neck = HC.len('neck') / HC.IN, waist = HC.len('waist') / HC.IN, hip = HC.len('hip') / HC.IN, bf;
    if (!(age >= 17 && age <= 80)) return HC.err('Enter an age between 17 and 80.');
    if (!(h >= 48 && h <= 90)) return HC.err('Enter a valid height.');
    if (!(neck > 0 && waist > 0)) return HC.err('Enter your neck and waist measurements.');
    if (sex === 'male') {
      if (!(waist > neck)) return HC.err('Waist must be larger than neck.');
      bf = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(h) + 36.76;
    } else {
      if (!(hip > 0)) return HC.err('Enter your hip measurement.');
      if (!(waist + hip > neck)) return HC.err('Waist plus hips must be larger than neck.');
      bf = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(h) - 78.387;
    }
    if (!(bf >= 2 && bf <= 60)) return HC.err('Those measurements give an unrealistic result. Please re-check them.');
    var bands = [[17, 20, 20, 30], [21, 27, 22, 32], [28, 39, 24, 34], [40, 200, 26, 36]], lim = 0, rows = [], active = -1;
    bands.forEach(function (b, i) { var m = sex === 'male' ? b[2] : b[3]; rows.push([b[1] > 100 ? '40 and over' : b[0] + '–' + b[1], m + '%']); if (age >= b[0] && age <= b[1]) { lim = m; active = i; } });
    var ok = bf <= lim;
    return { hero: { label: 'Estimated body fat', value: f(bf, 1) + '%', category: ok ? 'Within the ' + lim + '% limit for your age' : 'Above the ' + lim + '% limit for your age', sub: ok ? (lim - bf).toFixed(1) + ' points below the limit' : (bf - lim).toFixed(1) + ' points above the limit' },
      tables: [{ title: 'Maximum body fat by age (AR 600-9, 2013 table)', head: ['Age group', 'Maximum'], rows: rows, active: active }],
      note: 'This is an estimate from the older Army tape-test formula and limits. Army standards have been revised since, so check current regulations for official assessments.' };
  });
})();
