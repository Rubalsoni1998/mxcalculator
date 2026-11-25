(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var cm = HC.height('height'), kg = HC.weight('weight');
    if (!(cm >= 120 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 400)) return HC.err('Enter a valid weight.');
    var m2 = Math.pow(cm / 100, 2), lo = 18.5 * m2, hi = 24.9 * m2, b = HC.bmi(kg, cm), diff = kg < lo ? 'Gain ' + HC.massText(lo - kg) + ' to reach the range' : kg > hi ? 'Lose ' + HC.massText(kg - hi) + ' to reach the range' : 'You are within the healthy range';
    return { hero: { label: 'Healthy weight range', value: HC.massRange(lo, hi), category: HC.bmiCategory(b), sub: diff },
      rowsTitle: 'Details', rows: [['Your BMI', f(b, 1)], ['Healthy BMI range', '18.5 – 24.9'], ['Mid-range weight (BMI 22)', HC.massText(22 * m2)], ['Your weight', HC.massText(kg)]],
      note: 'For adults 18 and over. BMI does not separate muscle from fat, so very muscular people may fall outside the range while still being healthy.' };
  });
})();
