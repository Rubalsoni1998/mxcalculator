(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var m = HC.val('gender') === 'male', cm = HC.height('height'), kg = HC.weight('weight');
    if (!(cm >= 100 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 30 && kg <= 400)) return HC.err('Enter a valid weight.');
    var boer = m ? 0.407 * kg + 0.267 * cm - 19.2 : 0.252 * kg + 0.473 * cm - 48.3;
    var james = m ? 1.1 * kg - 128 * Math.pow(kg / cm, 2) : 1.07 * kg - 148 * Math.pow(kg / cm, 2);
    var hume = m ? 0.3281 * kg + 0.33929 * cm - 29.5336 : 0.29569 * kg + 0.41813 * cm - 43.2933;
    var avg = (boer + james + hume) / 3, bf = Math.max(0, (1 - avg / kg) * 100);
    return { hero: { label: 'Lean body mass (average)', value: HC.massText(avg), sub: 'About ' + f(100 - bf, 0) + '% of your body weight' },
      rowsTitle: 'By formula', rows: [['Boer', HC.massText(boer)], ['James', HC.massText(james)], ['Hume', HC.massText(hume)], ['Estimated body fat mass', HC.massText(Math.max(0, kg - avg))], ['Estimated body fat', f(bf, 1) + '%']],
      note: 'These formulas use only height, weight and sex, so they cannot tell muscle from fat directly. Body scans or skinfold measurements are more precise.' };
  });
})();
