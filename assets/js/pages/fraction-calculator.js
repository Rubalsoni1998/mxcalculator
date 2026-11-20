(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function calculate() {
    var a = +$('n1').value, b = +$('d1').value, c = +$('n2').value, d = +$('d2').value, op = $('op').value;
    var ints = [a, b, c, d].every(Number.isInteger);
    if (!ints || !b || !d) return fail(!ints ? 'Enter whole numbers in every box.' : 'A denominator cannot be zero.');
    var n, m;
    if (op === '+') { n = a * d + c * b; m = b * d; }
    else if (op === '-') { n = a * d - c * b; m = b * d; }
    else if (op === '*') { n = a * c; m = b * d; }
    else { if (!c) return fail('You cannot divide by zero.'); n = a * d; m = b * c; }
    if (m < 0) { n = -n; m = -m; }
    var g = gcd(n, m); n /= g; m /= g;
    $('err').textContent = '';
    $('resFrac').textContent = m === 1 ? String(n) : n + '/' + m;
    var whole = Math.trunc(n / m), rem = Math.abs(n % m);
    $('resMixed').textContent = 'Mixed: ' + (rem && whole ? whole + ' ' + rem + '/' + m : rem ? (n < 0 ? '-' : '') + rem + '/' + m : whole);
    $('resDec').textContent = 'Decimal: ' + parseFloat((n / m).toFixed(6));
    $('resEq').textContent = a + '/' + b + ' ' + $('op').selectedOptions[0].textContent + ' ' + c + '/' + d;
  }
  function fail(msg) { $('err').textContent = msg; ['resFrac'].forEach(function (i) { $(i).textContent = '--'; }); $('resMixed').textContent = 'Mixed: --'; $('resDec').textContent = 'Decimal: --'; $('resEq').innerHTML = '&nbsp;'; }
  function clearAll() { ['n1', 'd1', 'n2', 'd2'].forEach(function (i) { $(i).value = ''; }); $('err').textContent = ''; fail(''); $('n1').focus(); }
  $('calcBtn').addEventListener('click', calculate);
  $('clearBtn').addEventListener('click', clearAll);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') calculate(); });
  calculate();
})();
