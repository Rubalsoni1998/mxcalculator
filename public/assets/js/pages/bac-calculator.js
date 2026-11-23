(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var male = HC.val('gender') === 'male', d = HC.num('drinks'), kg = HC.weight('weight'), hrs = HC.num('hours'), grams = parseFloat(HC.val('size'));
    if (!(d >= 0 && d <= 40)) return HC.err('Enter between 0 and 40 drinks.');
    if (!(kg >= 30 && kg <= 300)) return HC.err('Enter a valid weight.');
    if (!(hrs >= 0 && hrs <= 48)) return HC.err('Enter hours between 0 and 48.');
    var r = male ? 0.68 : 0.55, bac = Math.max(0, d * grams / (kg * 1000 * r) * 100 - 0.015 * hrs), i = bac < 0.02 ? 0 : bac < 0.06 ? 1 : bac < 0.10 ? 2 : bac < 0.20 ? 3 : bac < 0.30 ? 4 : 5;
    var eff = [['Under 0.02', 'Little or no effect'], ['0.02 – 0.05', 'Relaxed, slightly slower reactions'], ['0.06 – 0.09', 'Impaired judgment and coordination'], ['0.10 – 0.19', 'Clear impairment, poor balance, slurred speech'], ['0.20 – 0.29', 'Confusion, nausea, memory blackouts'], ['0.30 and over', 'Danger of unconsciousness: seek emergency help']];
    return { hero: { label: 'Estimated BAC', value: f(bac, 3) + '%', category: eff[i][1], sub: bac > 0 ? 'About ' + f(bac / 0.015, 1) + ' hours until it reaches zero' : 'Estimated at zero' },
      rowsTitle: 'Details', rows: [['Alcohol consumed', f(d * grams, 0) + ' g'], ['Alcohol left to clear', f(bac / 0.015, 1) + ' hours'], ['Widmark factor used', r.toFixed(2)]],
      tables: [{ title: 'Typical effects at each BAC (%)', head: ['BAC', 'Effect'], rows: eff, active: i }],
      note: 'The Widmark formula assumes your body clears about 0.015% per hour. Food, medicines, health, body fat and tolerance change the result. Driving limits vary by place (often 0.05–0.08%), and any alcohol can impair driving. If someone has passed out or cannot be woken, call emergency services.' };
  });
})();
