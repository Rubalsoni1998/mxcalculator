(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var lmp = HC.date('lmp'), cyc = HC.num('cycle');
    if (!lmp) return HC.err('Enter the first day of your last period.');
    if (!(cyc >= 21 && cyc <= 45)) return HC.err('Cycle length should be between 21 and 45 days.');
    var ov = HC.addDays(lmp, cyc - 14), due = HC.addDays(lmp, 280 + (cyc - 28)), t = HC.today(), d = HC.daysBetween(lmp, t), age = 'Not started yet';
    if (d >= 0 && d <= 294) age = Math.floor(d / 7) + ' weeks ' + (d % 7) + ' days'; else if (d > 294) age = 'Past the due date';
    return { hero: { label: 'Estimated conception date', value: HC.fmtDate(ov), sub: 'Intercourse from ' + HC.shortDate(HC.addDays(ov, -5)) + ' to ' + HC.shortDate(HC.addDays(ov, 1)) + ' could have led to conception' },
      rowsTitle: 'Key dates', rows: [['Implantation (about 6–12 days later)', HC.shortDate(HC.addDays(ov, 6)) + ' – ' + HC.shortDate(HC.addDays(ov, 12))], ['Pregnancy test from', HC.fmtDate(HC.addDays(ov, 14))], ['Estimated due date', HC.fmtDate(due)], ['Pregnancy age today', age], ['Second trimester starts', HC.fmtDate(HC.addDays(lmp, 98 + (cyc - 28)))], ['Third trimester starts', HC.fmtDate(HC.addDays(lmp, 189 + (cyc - 28)))]],
      note: 'Conception usually happens within a day of ovulation, and ovulation timing varies. An early ultrasound gives the most accurate dating.' };
  });
})();
