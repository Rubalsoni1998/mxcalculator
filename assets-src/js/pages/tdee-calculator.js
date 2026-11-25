(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var age = HC.num('age'), sex = HC.val('gender'), cm = HC.height('height'), kg = HC.weight('weight'), fo = HC.val('formula'), bf = HC.num('bf'), male = sex === 'male';
    if (!(age >= 15 && age <= 100)) return HC.err('Enter an age between 15 and 100.');
    if (!(cm >= 100 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 400)) return HC.err('Enter a valid weight.');
    var bmr;
    if (fo === 'harris') bmr = male ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age : 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * age;
    else if (fo === 'katch') { if (!(bf >= 3 && bf <= 60)) return HC.err('Enter your body fat percentage (3–60%).'); bmr = 370 + 21.6 * kg * (1 - bf / 100); }
    else bmr = HC.mifflin(sex, kg, cm, age);
    var tdee = bmr * parseFloat(HC.val('activity')), us = HC.units() === 'us';
    var steps = us ? [['Mild weight loss (0.5 lb/week)', -250], ['Weight loss (1 lb/week)', -500], ['Fast weight loss (2 lb/week)', -1000], ['Mild weight gain (0.5 lb/week)', 250], ['Weight gain (1 lb/week)', 500]]
                   : [['Mild weight loss (0.25 kg/week)', -275], ['Weight loss (0.5 kg/week)', -550], ['Fast weight loss (1 kg/week)', -1100], ['Mild weight gain (0.25 kg/week)', 275], ['Weight gain (0.5 kg/week)', 550]];
    var rows = [['Maintain weight', f(tdee, 0) + ' kcal']].concat(steps.map(function (s) { return [s[0], f(Math.max(0, tdee + s[1]), 0) + ' kcal']; }));
    return { hero: { label: 'Your TDEE', value: f(tdee, 0) + ' kcal', sub: 'BMR: ' + f(bmr, 0) + ' kcal per day' }, tables: [{ title: 'Daily calories by goal', head: ['Goal', 'Calories'], rows: rows, active: 0 }],
      note: 'Losing more than about 1% of body weight per week, or eating under 1,200–1,500 kcal per day, is not advised without medical supervision.' };
  });
})();
