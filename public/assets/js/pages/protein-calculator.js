(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var kg = HC.weight('weight'), g = HC.val('goal').split('-').map(Number), meals = parseInt(HC.val('meals'), 10);
    if (!(kg >= 20 && kg <= 400)) return HC.err('Enter a valid weight.');
    var lo = kg * g[0], hi = kg * g[1], same = g[0] === g[1];
    return { hero: { label: 'Daily protein', value: same ? f(lo, 0) + ' g' : f(lo, 0) + '–' + f(hi, 0) + ' g', sub: same ? f(g[0], 1) + ' g per kg of body weight' : f(g[0], 1) + '–' + f(g[1], 1) + ' g per kg of body weight' },
      rowsTitle: 'Breakdown', rows: [['Per meal (' + meals + ' meals)', same ? f(lo / meals, 0) + ' g' : f(lo / meals, 0) + '–' + f(hi / meals, 0) + ' g'], ['Calories from protein', same ? f(lo * 4, 0) + ' kcal' : f(lo * 4, 0) + '–' + f(hi * 4, 0) + ' kcal'], ['Body weight', HC.massText(kg)]],
      note: 'The general-health figure is the Recommended Dietary Allowance (0.8 g/kg). Higher ranges come from sports nutrition and clinical guidance. People with kidney disease should ask their doctor before raising protein.' };
  });
})();
