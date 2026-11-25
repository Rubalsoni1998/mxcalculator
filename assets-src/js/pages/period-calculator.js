(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var lmp = HC.date('lmp'), cyc = HC.num('cycle'), pl = HC.num('plen');
    if (!lmp) return HC.err('Enter the first day of your last period.');
    if (!(cyc >= 21 && cyc <= 45)) return HC.err('Cycle length should be between 21 and 45 days.');
    if (!(pl >= 2 && pl <= 10)) return HC.err('Period length should be between 2 and 10 days.');
    var t = HC.today(), n = 0;
    while (n < 60 && HC.addDays(lmp, n * cyc) < t) n++;
    var s0 = HC.addDays(lmp, n * cyc), left = HC.daysBetween(t, s0), rows = [];
    for (var i = 0; i < 6; i++) { var s = HC.addDays(s0, i * cyc); rows.push([HC.shortDate(s) + ' – ' + HC.shortDate(HC.addDays(s, pl - 1)), HC.shortDate(HC.addDays(s, cyc - 14))]); }
    return { hero: { label: 'Next period starts', value: HC.fmtDate(s0), sub: left === 0 ? 'That is today' : 'In ' + left + ' day' + (left === 1 ? '' : 's') },
      rowsTitle: 'Your cycle', rows: [['Cycle length', cyc + ' days'], ['Period length', pl + ' days'], ['Estimated ovulation this cycle', HC.fmtDate(HC.addDays(s0, cyc - 14))]],
      tables: [{ title: 'Next 6 periods', head: ['Period dates', 'Ovulation'], rows: rows, active: 0 }],
      note: 'Cycles vary, so predictions are estimates. Stress, illness, travel and hormonal changes can shift your dates. See a doctor if your cycles are very irregular or you miss several periods.' };
  });
})();
