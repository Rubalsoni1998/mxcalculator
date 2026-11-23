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

    var s = HC.val('diet').split('-').map(Number), p = cal * s[0] / 400, c = cal * s[1] / 400, fa = cal * s[2] / 900;
    return { hero: { label: 'Daily calorie target', value: f(cal, 0) + ' kcal', sub: 'Maintenance (TDEE): ' + f(tdee, 0) + ' kcal per day' },
      rowsTitle: 'Daily macros', rows: [['Protein', f(p, 0) + ' g (' + s[0] + '%)'], ['Carbohydrates', f(c, 0) + ' g (' + s[1] + '%)'], ['Fat', f(fa, 0) + ' g (' + s[2] + '%)'], ['Resting energy (BMR)', f(bmr, 0) + ' kcal']],
      note: 'Calories come from the Mifflin-St Jeor equation multiplied by your activity level. Protein and carbs provide 4 kcal per gram and fat 9 kcal per gram.' + low };
  });
})();
