(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var cm = HC.height('height'), kg = HC.weight('weight');
    if (!(cm >= 40 && cm <= 250)) return HC.err('Enter a valid height.');
    if (!(kg >= 2 && kg <= 400)) return HC.err('Enter a valid weight.');
    var m = Math.sqrt(cm * kg / 3600), d = 0.007184 * Math.pow(kg, 0.425) * Math.pow(cm, 0.725), h = 0.024265 * Math.pow(kg, 0.5378) * Math.pow(cm, 0.3964),
        g = 0.0235 * Math.pow(kg, 0.51456) * Math.pow(cm, 0.42246), fu = 0.008883 * Math.pow(kg, 0.444) * Math.pow(cm, 0.663);
    return { hero: { label: 'Body surface area (Mosteller)', value: f(m, 2) + ' m²', sub: 'Typical adult: 1.6–1.9 m²' },
      rowsTitle: 'By formula', rows: [['Mosteller', f(m, 2) + ' m²'], ['DuBois & DuBois', f(d, 2) + ' m²'], ['Haycock', f(h, 2) + ' m²'], ['Gehan & George', f(g, 2) + ' m²'], ['Fujimoto', f(fu, 2) + ' m²']],
      note: 'The formulas agree within a few percent for most adults. Medicine doses must always be set by a clinician, not by this calculator.' };
  });
})();
