(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var last = [];
  function rand() { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
  function generate() {
    var min = +$('min').value, max = +$('max').value, count = Math.floor(+$('count').value), dec = $('kind').value === 'dec', uniq = $('unique').checked;
    if (!isFinite(min) || !isFinite(max) || min > max) return fail('Minimum must be less than or equal to maximum.');
    if (!(count >= 1 && count <= 1000)) return fail('Choose between 1 and 1000 numbers.');
    var lo = dec ? min : Math.ceil(min), hi = dec ? max : Math.floor(max);
    if (!dec && uniq && hi - lo + 1 < count) return fail('That range has only ' + Math.max(0, hi - lo + 1) + ' different whole numbers.');
    var out = [], seen = new Set(), guard = 0;
    while (out.length < count && guard++ < 100000) {
      var v = dec ? Math.round((lo + rand() * (hi - lo)) * 100) / 100 : lo + Math.floor(rand() * (hi - lo + 1));
      if (uniq) { if (seen.has(v)) continue; seen.add(v); }
      out.push(v);
    }
    last = out; $('err').textContent = '';
    $('first').textContent = out[0];
    var list = $('list'); list.textContent = '';
    out.slice(1).forEach(function (v) { var s = document.createElement('span'); s.className = 'chip'; s.textContent = v; list.appendChild(s); });
  }
  function fail(m) { $('err').textContent = m; }
  function copy() {
    if (!last.length) return;
    var t = last.join(', ');
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { $('copyBtn').textContent = 'Copied'; setTimeout(function () { $('copyBtn').textContent = 'Copy'; }, 1200); });
  }
  $('genBtn').addEventListener('click', generate);
  $('copyBtn').addEventListener('click', copy);
  generate();
})();
