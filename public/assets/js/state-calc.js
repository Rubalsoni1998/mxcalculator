// Shared calculator for the state sales-tax and property-tax pages. No dependencies.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var box = document.querySelector('.st-calc');
  if (!box) return;
  var fmt = function (v, d) {
    if (!isFinite(v)) return '–';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d }).format(v);
  };
  var num = function (id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };

  function sales() {
    var stateRate = parseFloat(box.getAttribute('data-state-rate')) || 0;
    var localRate = parseFloat(box.getAttribute('data-local-rate')) || 0;
    var type = $('stRateType').value, mode = $('stMode').value;
    $('stCustomWrap').hidden = type !== 'custom';
    var rate = type === 'state' ? stateRate : type === 'combined' ? stateRate + localRate : num('stCustom');
    var amt = num('stAmount'), tax, total, pre;
    if (mode === 'add') { pre = amt; tax = amt * rate / 100; total = pre + tax; $('stL1').textContent = 'Sales tax'; $('stL2').textContent = 'Total'; $('stR1').textContent = fmt(tax); $('stR2').textContent = fmt(total); }
    else { total = amt; pre = total / (1 + rate / 100); tax = total - pre; $('stL1').textContent = 'Price before tax'; $('stL2').textContent = 'Sales tax included'; $('stR1').textContent = fmt(pre); $('stR2').textContent = fmt(tax); }
    $('stR3').textContent = rate.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%';
  }

  function property() {
    var value = num('ptValue'), rate = num('ptRate'), ex = num('ptExempt');
    var taxable = Math.max(0, value - ex), tax = taxable * rate / 100;
    $('ptR1').textContent = fmt(tax, 0); $('ptR2').textContent = fmt(tax / 12, 0); $('ptR3').textContent = fmt(taxable, 0);
  }

  var run = box.getAttribute('data-st') === 'sales' ? sales : property;
  box.addEventListener('input', run); box.addEventListener('change', run);
  run();
})();
