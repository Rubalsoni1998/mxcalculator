/* Shared responsive helper.
   Adds data-label attributes to table cells (from the header row) so that
   wide tables can be shown as stacked cards on phones. Works for tables that
   are generated dynamically, too. */
(function () {
  'use strict';

  var MAX_TABLE_COLS = 3; // tables with more columns than this get stacked on phones

  function headerTexts(table) {
    var ths = table.querySelectorAll('thead th');
    if (!ths.length) ths = table.querySelectorAll('tr:first-child th');
    return Array.prototype.map.call(ths, function (th) { return th.textContent.trim(); });
  }

  var NUMERIC = /^[$€£¥₹+\-–−(]*[\d.,]+[%)]?[A-Za-z%]{0,3}$/; // single number token, no spaces

  // Everything below only has a visual effect at phone width (see the 640px block in responsive.css),
  // so wider screens skip the per-cell work completely. It runs when the screen is (or becomes) phone-sized.
  var phone = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: true };

  function prepareTable(table) {
    if (!phone.matches) return;
    var labels = headerTexts(table);
    var stack = labels.length > MAX_TABLE_COLS;
    if (stack) table.classList.add('rt-stack');
    var rows = table.rows;
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r].cells, inBody = rows[r].parentNode.tagName === 'TBODY';
      for (var i = 0; i < cells.length; i++) {
        var td = cells[i];
        if (td.tagName !== 'TD') continue;
        var t = td.textContent.trim();
        var num = t.length > 0 && NUMERIC.test(t);
        if (num !== td.classList.contains('rt-num')) td.classList.toggle('rt-num', num);
        if (stack && inBody && labels[i] && td.getAttribute('data-label') !== labels[i]) td.setAttribute('data-label', labels[i]);
      }
    }
  }
  function prepareAll() { document.querySelectorAll('table').forEach(prepareTable); }

  // Only tables that were added or whose rows changed are re-processed (not every table on the page),
  // so rendering a 360-row schedule no longer triggers a second full pass over all tables.
  var pending = new Set();
  var scheduled = false;
  function run() {
    scheduled = false;
    pending.forEach(function (t) { if (t.isConnected) prepareTable(t); });
    pending.clear();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(run);
  }
  function collect(records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i], t = r.target;
      var host = t.nodeType === 1 ? t.closest('table') : (t.parentElement && t.parentElement.closest('table'));
      if (host) { pending.add(host); continue; }
      for (var j = 0; j < r.addedNodes.length; j++) {
        var n = r.addedNodes[j];
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'TABLE') pending.add(n);
        else if (n.querySelector) n.querySelectorAll('table').forEach(function (x) { pending.add(x); });
      }
    }
    if (pending.size) schedule();
  }

  document.addEventListener('DOMContentLoaded', function () {
    prepareAll();
    if (phone.addEventListener) phone.addEventListener('change', function (e) { if (e.matches) prepareAll(); });
    new MutationObserver(collect).observe(document.body, { childList: true, subtree: true });
  });
})();
