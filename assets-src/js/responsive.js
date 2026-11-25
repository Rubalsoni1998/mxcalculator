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

  function prepareTable(table) {
    table.querySelectorAll('td').forEach(function (td) {
      var t = td.textContent.trim();
      td.classList.toggle('rt-num', t.length > 0 && NUMERIC.test(t));
    });
    var labels = headerTexts(table);
    if (labels.length <= MAX_TABLE_COLS) return;
    table.classList.add('rt-stack');
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) {
        if (td.tagName === 'TD' && labels[i] && td.getAttribute('data-label') !== labels[i]) {
          td.setAttribute('data-label', labels[i]);
        }
      });
    });
  }

  var scheduled = false;
  function run() {
    scheduled = false;
    document.querySelectorAll('table').forEach(prepareTable);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(run);
  }

  document.addEventListener('DOMContentLoaded', function () {
    run();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
})();
