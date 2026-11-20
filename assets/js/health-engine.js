/* Shared engine for the Fitness & Health calculators.
   A page calls HC.init(compute). compute() reads the form through the HC helpers and returns
   { hero:{label,value,category,sub}, rows:[[k,v]], rowsTitle, tables:[{title,head,rows,active}], note } or HC.err(msg). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var LB = 0.45359237, IN = 2.54;
  var units = 'us', compute = null, started = false, timer;

  function round(n, d) { var p = Math.pow(10, d || 0); return Math.round(n * p) / p; }
  function fmt(n, d) { d = d == null ? 1 : d; return round(n, d).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }); }

  /* ---- reading the form (always returns metric values) ---- */
  function num(id) { var e = $(id); if (!e) return NaN; var s = e.value.trim(); return s === '' ? NaN : parseFloat(s); }
  function val(id) { return $(id).value; }
  function positive(n) { return n > 0 ? n : NaN; }
  function height(id) {
    if (units === 'us') { var ft = num(id + 'Ft'), inch = num(id + 'In'); if (isNaN(ft)) return NaN; return positive((ft * 12 + (isNaN(inch) ? 0 : inch)) * IN); }
    return positive(num(id + 'Cm'));
  }
  function weight(id) { var n = num(id); return positive(units === 'us' ? n * LB : n); }
  function len(id) { var n = num(id); return positive(units === 'us' ? n * IN : n); }
  function creat(id) { var n = num(id); return positive(units === 'us' ? n : n / 88.4); }   // mg/dL

  /* ---- dates (UTC based so time zones never shift a day) ---- */
  function date(id) { var s = $(id).value; if (!s) return null; var d = new Date(s + 'T00:00:00Z'); return isNaN(d) ? null : d; }
  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
  function fmtDate(d) { return d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  function shortDate(d) { return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }); }
  function today() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  /* ---- display text ---- */
  function massText(kg) { return units === 'us' ? fmt(kg / LB, 1) + ' lb (' + fmt(kg, 1) + ' kg)' : fmt(kg, 1) + ' kg (' + fmt(kg / LB, 1) + ' lb)'; }
  function massRange(a, b) { return units === 'us' ? fmt(a / LB, 1) + '–' + fmt(b / LB, 1) + ' lb (' + fmt(a, 1) + '–' + fmt(b, 1) + ' kg)' : fmt(a, 1) + '–' + fmt(b, 1) + ' kg (' + fmt(a / LB, 1) + '–' + fmt(b / LB, 1) + ' lb)'; }
  function lenText(cm) { return units === 'us' ? fmt(cm / IN, 1) + ' in (' + fmt(cm, 1) + ' cm)' : fmt(cm, 1) + ' cm (' + fmt(cm / IN, 1) + ' in)'; }

  /* ---- shared formulas ---- */
  function mifflin(sex, kg, cm, age) { return 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161); }
  function bmi(kg, cm) { return kg / Math.pow(cm / 100, 2); }
  function bmiCategory(b) { return b < 18.5 ? 'Underweight' : b < 25 ? 'Normal weight' : b < 30 ? 'Overweight' : 'Obesity'; }

  function err(msg) { return { error: msg }; }

  /* ---- units ---- */
  function readAllMetric() {
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-kind]'), function (g) {
      var id = g.getAttribute('data-id'), k = g.getAttribute('data-kind');
      out[id] = k === 'height' ? height(id) : k === 'weight' ? weight(id) : k === 'len' ? len(id) : creat(id);
    });
    return out;
  }
  function writeAll(m) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-kind]'), function (g) {
      var id = g.getAttribute('data-id'), k = g.getAttribute('data-kind'), v = m[id];
      var set = function (i, x) { var e = $(i); if (e) e.value = (x == null || isNaN(x)) ? '' : x; };
      if (k === 'height') {
        if (units === 'us') { var inch = v / IN, ft = Math.floor(inch / 12); set(id + 'Ft', isNaN(v) ? NaN : ft); set(id + 'In', isNaN(v) ? NaN : round(inch - ft * 12, 1)); }
        else set(id + 'Cm', round(v, 1));
      } else if (k === 'weight') set(id, round(units === 'us' ? v / LB : v, 2));
      else if (k === 'len') set(id, round(units === 'us' ? v / IN : v, 2));
      else set(id, units === 'us' ? round(v, 2) : round(v * 88.4, 0));
    });
  }
  function applyUnitUI() {
    Array.prototype.forEach.call(document.querySelectorAll('.u-us'), function (e) { e.classList.toggle('hidden', units !== 'us'); });
    Array.prototype.forEach.call(document.querySelectorAll('.u-metric'), function (e) { e.classList.toggle('hidden', units !== 'metric'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-us]'), function (e) { e.textContent = e.getAttribute(units === 'us' ? 'data-us' : 'data-metric'); });
    var a = $('tabUS'), b = $('tabMetric');
    if (a) { a.classList.toggle('active', units === 'us'); b.classList.toggle('active', units === 'metric'); }
  }
  function setUnits(u) {
    if (u === units) return;
    var m = readAllMetric(); units = u; writeAll(m); applyUnitUI(); live();
  }

  /* ---- conditional fields: data-when="fieldId=value" ---- */
  function applyWhen() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-when]'), function (e) {
      var p = e.getAttribute('data-when').split('='), src = $(p[0]);
      e.classList.toggle('hidden', !(src && src.value === p[1]));
    });
  }

  /* ---- rendering ---- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function tableCard(title, head, rows, active) {
    var card = el('div', 'card u-mt'), hd = el('div', 'card-header'), t = el('div', 'card-title u-fs1', title);
    hd.appendChild(t); card.appendChild(hd);
    var body = el('div', 'card-content'), wrap = el('div', 'schedule-table-wrapper u-mt0'), tbl = el('table', 'schedule-table');
    if (head) { var th = el('thead'), tr = el('tr'); head.forEach(function (h, i) { tr.appendChild(el('th', i === head.length - 1 && head.length > 1 ? 'rv' : '', h)); }); th.appendChild(tr); tbl.appendChild(th); }
    var tb = el('tbody');
    rows.forEach(function (r, ri) {
      var tr = el('tr', ri === active ? 'active-row' : '');
      r.forEach(function (c, i) { tr.appendChild(el('td', i === r.length - 1 && r.length > 1 ? 'rv' : '', c)); });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl); body.appendChild(wrap); card.appendChild(body);
    return card;
  }
  function render(r) {
    var box = $('resultsContent'); box.textContent = '';
    var hero = el('div', 'results-hero');
    hero.appendChild(el('div', 'result-subtitle', r.hero.label));
    hero.appendChild(el('div', 'result-value', r.hero.value));
    if (r.hero.category) hero.appendChild(el('div', 'result-category', r.hero.category));
    if (r.hero.sub) { var p = el('p', '', r.hero.sub); p.style.cssText = 'margin-top:1rem;font-size:0.9rem;color:var(--muted-foreground)'; hero.appendChild(p); }
    box.appendChild(hero);
    if (r.rows && r.rows.length) box.appendChild(tableCard(r.rowsTitle || 'Details', null, r.rows));
    (r.tables || []).forEach(function (t) { box.appendChild(tableCard(t.title, t.head, t.rows, t.active)); });
    if (r.note) box.appendChild(el('p', 'calc-note', r.note));
    $('resultsPlaceholder').classList.add('hidden'); box.classList.remove('hidden');
  }
  function showError(msg) { var e = $('formError'); if (e) e.textContent = msg || ''; }

  function run(loud) {
    if (!compute) return;
    var r;
    try { r = compute(); } catch (e) { r = err('Please check your entries.'); }
    if (r.error) {
      if (loud) { showError(r.error); $('resultsContent').classList.add('hidden'); $('resultsPlaceholder').classList.remove('hidden'); }
      else if (!$('resultsContent').classList.contains('hidden')) { /* keep last good result while typing */ }
      return;
    }
    showError(''); render(r);
  }
  function live() { clearTimeout(timer); timer = setTimeout(function () { applyWhen(); run(false); }, 120); }

  function clearForm() {
    Array.prototype.forEach.call(document.querySelectorAll('.card-content input'), function (i) { i.value = ''; i.removeAttribute('aria-invalid'); });
    Array.prototype.forEach.call(document.querySelectorAll('.field-error'), function (e) { e.remove(); });
    showError(''); $('resultsContent').classList.add('hidden'); $('resultsPlaceholder').classList.remove('hidden');
    var f = document.querySelector('.card-content input'); if (f) f.focus();
  }

  function init(fn) {
    compute = fn;
    if (started) return; started = true;
    // default dates: data-default-days="-14" means "today minus 14 days"
    Array.prototype.forEach.call(document.querySelectorAll('input[data-default-days]'), function (i) {
      var d = addDays(today(), parseInt(i.getAttribute('data-default-days'), 10)); i.value = d.toISOString().slice(0, 10);
    });
    var lang = (navigator.language || 'en-US');
    if (document.querySelector('[data-kind]') && lang !== 'en-US' && lang !== 'en-LR') setUnits('metric'); else applyUnitUI();
    applyWhen();
    var card = document.querySelector('.card');
    card.addEventListener('input', live); card.addEventListener('change', live);
    run(false);
  }

  window.HC = { init: init, num: num, val: val, height: height, weight: weight, len: len, creat: creat, date: date, addDays: addDays, fmtDate: fmtDate,
    shortDate: shortDate, today: today, daysBetween: daysBetween, fmt: fmt, round: round, massText: massText, massRange: massRange, lenText: lenText,
    mifflin: mifflin, bmi: bmi, bmiCategory: bmiCategory, err: err, units: function () { return units; }, LB: LB, IN: IN };
  window.setUnits = setUnits;
  window.calculate = function () { run(true); };
  window.clearForm = clearForm;
})();
