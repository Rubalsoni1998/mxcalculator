(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var age = HC.num('age'), rest = HC.num('rest'), fo = HC.val('formula');
    if (!(age >= 10 && age <= 100)) return HC.err('Enter an age between 10 and 100.');
    if (!(rest >= 30 && rest <= 120)) return HC.err('Resting heart rate should be between 30 and 120 bpm.');
    var max = fo === 'fox' ? 220 - age : fo === 'gulati' ? 206 - 0.88 * age : 208 - 0.7 * age, hrr = max - rest;
    if (!(hrr > 0)) return HC.err('Resting heart rate must be lower than your maximum.');
    var k = function (p) { return Math.round(rest + hrr * p); }, mp = function (p) { return Math.round(max * p); };
    var zones = [['Recovery (50–60%)', 0.5, 0.6], ['Aerobic base (60–70%)', 0.6, 0.7], ['Aerobic (70–80%)', 0.7, 0.8], ['Threshold (80–90%)', 0.8, 0.9], ['Maximum effort (90–100%)', 0.9, 1]];
    return { hero: { label: 'Maximum heart rate', value: Math.round(max) + ' bpm', sub: 'Moderate exercise: ' + mp(0.5) + '–' + mp(0.7) + ' bpm · Vigorous: ' + mp(0.7) + '–' + mp(0.85) + ' bpm (% of max)' },
      rowsTitle: 'Key numbers', rows: [['Heart rate reserve', Math.round(hrr) + ' bpm'], ['Moderate (50–70% of max)', mp(0.5) + '–' + mp(0.7) + ' bpm'], ['Vigorous (70–85% of max)', mp(0.7) + '–' + mp(0.85) + ' bpm']],
      tables: [{ title: 'Karvonen zones (uses resting heart rate)', head: ['Zone', 'Beats per minute'], rows: zones.map(function (z) { return [z[0], k(z[1]) + '–' + k(z[2])]; }) }],
      note: 'Maximum heart rate formulas are averages and can be off by 10 bpm or more. Medicines such as beta blockers lower heart rate, so ask your doctor for personal targets if you have a heart condition.' };
  });
})();
