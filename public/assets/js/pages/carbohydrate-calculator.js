(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var age = HC.num('age'), sex = HC.val('gender'), cm = HC.height('height'), kg = HC.weight('weight');
    if (!(age >= 15 && age <= 100)) return HC.err('Enter an age between 15 and 100.');
    if (!(cm >= 100 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 400)) return HC.err('Enter a valid weight.');
    var bmr = HC.mifflin(sex, kg, cm, age), tdee = bmr * parseFloat(HC.val('activity')), cal = tdee * (1 + parseFloat(HC.val('goal')));
    var low = cal < (sex === 'male' ? 1500 : 1200) ? ' Your target is below the minimum usually advised without medical supervision, so consider a smaller calorie deficit.' : '';

    var lo = cal * 0.45 / 4, hi = cal * 0.65 / 4;
    return { hero: { label: 'Daily carbohydrates', value: f(lo, 0) + '–' + f(hi, 0) + ' g', sub: 'Based on ' + f(cal, 0) + ' kcal per day' },
      rowsTitle: 'Breakdown', rows: [['Daily calories', f(cal, 0) + ' kcal'], ['Carbs at 45% of calories', f(lo, 0) + ' g'], ['Carbs at 65% of calories', f(hi, 0) + ' g'], ['Per meal (3 meals)', f(lo / 3, 0) + '–' + f(hi / 3, 0) + ' g'], ['Minimum recommended (RDA)', '130 g'], ['Fiber target', f(cal / 1000 * 14, 0) + ' g']],
      note: 'The 45–65% range is the Acceptable Macronutrient Distribution Range from the Dietary Reference Intakes. People with diabetes or other conditions should follow their care team advice.' + low };
  });
})();
