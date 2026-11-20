(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var cm = HC.height('height'), kg = HC.weight('weight'), wk = HC.num('weeks'), twins = HC.val('plurality') === 'twins', cur = HC.weight('current');
    if (!(cm >= 120 && cm <= 220)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 300)) return HC.err('Enter your pre-pregnancy weight.');
    if (!(wk >= 0 && wk <= 42)) return HC.err('Weeks pregnant must be between 0 and 42.');
    var b = HC.bmi(kg, cm), c = b < 18.5 ? 0 : b < 25 ? 1 : b < 30 ? 2 : 3, names = ['Underweight', 'Normal weight', 'Overweight', 'Obesity'];
    var one = [[12.5, 18], [11.5, 16], [7, 11.5], [5, 9]], two = [null, [17, 25], [14, 23], [11, 19]], rate = [[0.44, 0.58], [0.35, 0.5], [0.23, 0.33], [0.17, 0.27]];
    var T = twins ? two[c] : one[c], rows = [['Pre-pregnancy BMI', f(b, 1) + ' (' + names[c] + ')']];
    if (!T) return { hero: { label: 'Recommended total gain', value: 'Ask your provider', category: names[c], sub: 'There is no standard twin-pregnancy range for an underweight starting BMI. Your care team can set a personal goal.' }, rows: rows };
    function at(w) { if (w <= 13) return [0.5 * w / 13, 2 * w / 13]; var k = Math.min(1, (w - 13) / 27); return [0.5 + (T[0] - 0.5) * k, 2 + (T[1] - 2) * k]; }
    var g = at(wk);
    rows.push(['Recommended total gain', HC.massRange(T[0], T[1])]);
    rows.push(['Expected gain by week ' + wk, HC.massRange(g[0], g[1])]);
    rows.push(['Expected weight at week ' + wk, HC.massRange(kg + g[0], kg + g[1])]);
    if (!twins) rows.push(['Weekly gain after week 13', HC.massRange(rate[c][0], rate[c][1]) + ' per week']);
    if (!isNaN(cur)) {
      var gain = cur - kg, status = gain < g[0] - 0.05 ? 'Below the expected range' : gain > g[1] + 0.05 ? 'Above the expected range' : 'Within the expected range';
      rows.push(['Gain so far', HC.massText(gain)]); rows.push(['Status', status]);
    }
    return { hero: { label: 'Recommended total gain', value: HC.massRange(T[0], T[1]), category: names[c] + ' before pregnancy' }, rowsTitle: 'Your pregnancy', rows: rows,
      note: 'Ranges follow the Institute of Medicine (2009) guidelines. Gain in the first trimester is usually small (about 0.5–2 kg). The expected range at a given week is a straight-line estimate, so it is a guide rather than a target.' };
  });
})();
