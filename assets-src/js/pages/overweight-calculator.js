(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var cm = HC.height('height'), kg = HC.weight('weight');
    if (!(cm >= 120 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 500)) return HC.err('Enter a valid weight.');
    var b = HC.bmi(kg, cm), m2 = Math.pow(cm / 100, 2), top = 24.9 * m2, over = kg - top, cat = HC.bmiCategory(b);
    var sub = over > 0 ? 'About ' + HC.massText(over) + ' above the top of the healthy range' : kg < 18.5 * m2 ? 'Below the healthy range' : 'Within the healthy range';
    return { hero: { label: 'Your BMI', value: f(b, 1), category: cat, sub: sub },
      rowsTitle: 'Details', rows: [['Healthy weight range', HC.massRange(18.5 * m2, top)], ['Upper healthy weight (BMI 24.9)', HC.massText(top)], ['Above upper healthy weight', over > 0 ? HC.massText(over) : 'None'], ['Your weight', HC.massText(kg)]],
      tables: [{ title: 'BMI categories (adults)', head: ['Category', 'BMI'], rows: [['Underweight', 'under 18.5'], ['Normal weight', '18.5 – 24.9'], ['Overweight', '25 – 29.9'], ['Obesity', '30 and over']], active: b < 18.5 ? 0 : b < 25 ? 1 : b < 30 ? 2 : 3 }],
      note: 'BMI is a screening tool for adults. It does not distinguish muscle from fat, so athletes may read high. Waist size and overall health matter too. Talk to a doctor before starting a weight-loss plan.' };
  });
})();
