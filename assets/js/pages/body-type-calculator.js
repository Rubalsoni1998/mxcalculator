(function () {
  'use strict';
  var f = HC.fmt;
  HC.init(function () {
    var b = HC.len('bust'), w = HC.len('waist'), h = HC.len('hips');
    if (!(b > 0 && w > 0 && h > 0)) return HC.err('Enter all three measurements.');
    if (!(b >= 50 && b <= 220 && w >= 40 && w <= 220 && h >= 50 && h <= 220)) return HC.err('Those measurements look unusual. Please re-check them.');
    var big = Math.max(b, h), near = Math.abs(b - h) / big <= 0.05, shape, text;
    if (w >= b * 0.98 && w >= h * 0.98) { shape = 'Apple'; text = 'Weight is carried around the middle, with a waist that is as wide as the bust and hips.'; }
    else if (near && w / big <= 0.75) { shape = 'Hourglass'; text = 'Bust and hips are about the same and the waist is clearly narrower.'; }
    else if (near) { shape = 'Rectangle'; text = 'Bust, waist and hips are fairly similar, with little waist definition.'; }
    else if (h > b) { shape = 'Pear'; text = 'Hips are wider than the bust, with a defined waist.'; }
    else { shape = 'Inverted triangle'; text = 'The bust is wider than the hips.'; }
    var whr = w / h, risk = whr >= 0.85 ? 'At or above the 0.85 level linked to higher health risk for women' : 'Below the 0.85 level linked to higher health risk for women';
    return { hero: { label: 'Your body shape', value: shape, sub: text },
      rowsTitle: 'Your ratios', rows: [['Bust', HC.lenText(b)], ['Waist', HC.lenText(w)], ['Hips', HC.lenText(h)], ['Waist-to-hip ratio', f(whr, 2)], ['Waist-to-bust ratio', f(w / b, 2)]],
      note: risk + '. Body shape is a descriptive category, not a measure of health or attractiveness. This tool uses the bust-waist-hip method commonly applied to women’s clothing and fitness advice.' };
  });
})();
