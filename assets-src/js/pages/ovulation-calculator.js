(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var lmp = HC.date('lmp'), cyc = HC.num('cycle'), lut = HC.num('luteal');
    if (!lmp) return HC.err('Enter the first day of your last period.');
    if (!(cyc >= 21 && cyc <= 45)) return HC.err('Cycle length should be between 21 and 45 days.');
    if (!(lut >= 10 && lut <= 16)) return HC.err('Luteal phase should be between 10 and 16 days.');
    if (cyc - lut < 6) return HC.err('That luteal phase is too long for this cycle length.');
    var t = HC.today(), n = 0;
    while (n < 24 && HC.addDays(lmp, n * cyc + cyc - lut) < t) n++;
    var start = HC.addDays(lmp, n * cyc), ov = HC.addDays(start, cyc - lut), rows = [];
    for (var i = 0; i < 3; i++) { var s = HC.addDays(start, i * cyc), o = HC.addDays(s, cyc - lut); rows.push([HC.shortDate(s), HC.shortDate(HC.addDays(o, -5)) + ' – ' + HC.shortDate(HC.addDays(o, 1)), HC.shortDate(o)]); }
    return { hero: { label: n ? 'Next ovulation' : 'Estimated ovulation', value: HC.fmtDate(ov), sub: 'Fertile window: ' + HC.shortDate(HC.addDays(ov, -5)) + ' – ' + HC.shortDate(HC.addDays(ov, 1)) },
      rowsTitle: 'This cycle', rows: [['Most fertile days', HC.shortDate(HC.addDays(ov, -2)) + ' – ' + HC.shortDate(ov)], ['Next period expected', HC.fmtDate(HC.addDays(start, cyc))], ['Pregnancy test from', HC.fmtDate(HC.addDays(ov, lut))], ['Due date if you conceive', HC.fmtDate(HC.addDays(ov, 266))]],
      tables: [{ title: 'Upcoming cycles', head: ['Cycle starts', 'Fertile window', 'Ovulation'], rows: rows, active: 0 }],
      note: 'Ovulation usually happens about 14 days before the next period, but timing varies from cycle to cycle. Ovulation tests or tracking basal temperature can improve accuracy. This is not a contraception tool.' };
  });
})();
