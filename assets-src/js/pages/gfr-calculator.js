(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var age = HC.num('age'), female = HC.val('gender') === 'female', scr = HC.creat('creat');
    if (!(age >= 18 && age <= 110)) return HC.err('This calculator is for adults aged 18 or older.');
    if (!(scr >= 0.2 && scr <= 20)) return HC.err('Enter a serum creatinine between 0.2 and 20 mg/dL (18–1,770 µmol/L).');
    var k = female ? 0.7 : 0.9, a = female ? -0.241 : -0.302, r = scr / k;
    var egfr = 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
    var mdrd = 175 * Math.pow(scr, -1.154) * Math.pow(age, -0.203) * (female ? 0.742 : 1);
    var st = [['G1', 'Normal or high', '90 or more'], ['G2', 'Mildly decreased', '60–89'], ['G3a', 'Mild to moderate decrease', '45–59'], ['G3b', 'Moderate to severe decrease', '30–44'], ['G4', 'Severely decreased', '15–29'], ['G5', 'Kidney failure', 'under 15']];
    var i = egfr >= 90 ? 0 : egfr >= 60 ? 1 : egfr >= 45 ? 2 : egfr >= 30 ? 3 : egfr >= 15 ? 4 : 5;
    return { hero: { label: 'eGFR (CKD-EPI 2021)', value: f(egfr, 0), category: 'Stage ' + st[i][0] + ': ' + st[i][1], sub: 'mL/min/1.73 m²' },
      rowsTitle: 'Results', rows: [['CKD-EPI 2021', f(egfr, 1) + ' mL/min/1.73 m²'], ['MDRD (no race factor)', f(mdrd, 1) + ' mL/min/1.73 m²'], ['Creatinine used', f(scr, 2) + ' mg/dL']],
      tables: [{ title: 'GFR categories', head: ['Stage', 'Description', 'eGFR'], rows: st.map(function (s) { return [s[0], s[1], s[2]]; }), active: i }],
      note: 'This is an estimate, not a diagnosis. Kidney disease is confirmed with repeated tests over at least three months and other markers such as urine albumin. Discuss results with your doctor.' };
  });
})();
