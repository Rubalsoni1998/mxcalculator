/* Currency preference. The visitor picks it once on the home page; it is saved in localStorage ('mx:currency').
   Calculators read it synchronously at start-up: no network request, no extra file. USD when nothing is saved.
   To offer another currency: add it here AND as an <option> in index.html. */
window.mxCurrency = (function () {
  var LOCALES = { USD: 'en-US', INR: 'en-IN', EUR: 'en-IE', GBP: 'en-GB', CAD: 'en-CA', AUD: 'en-AU' };
  var code = 'USD';
  try { var saved = localStorage.getItem('mx:currency'); if (saved && LOCALES[saved]) code = saved; } catch (e) { /* private mode */ }
  var symbol = '$';
  try {
    var parts = new Intl.NumberFormat(LOCALES[code], { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
    for (var i = 0; i < parts.length; i++) if (parts[i].type === 'currency') symbol = parts[i].value;
  } catch (e) { symbol = code; }
  var info = { code: code, locale: LOCALES[code], symbol: symbol };
  return { get: function () { return info; } };
})();

/* Shared enhancements, loaded on every calculator page (deferred):
   1. remembers the last inputs (localStorage) and restores them next visit
   2. "Share" button that copies a link containing the current values
   3. range validation for number inputs that declare min / max */
(function () {
  'use strict';

  var page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  var KEY = 'mxc:' + page;
  var SKIP_TYPES = /^(password|file|hidden|button|submit|reset|image)$/;

  function fields() {
    return Array.prototype.filter.call(document.querySelectorAll('input[id], select[id], textarea[id]'), function (el) {
      return !SKIP_TYPES.test(el.type) && !el.disabled && !el.readOnly && !el.hasAttribute('data-no-persist');
    });
  }
  function activeToggles() {
    return Array.prototype.map.call(document.querySelectorAll('.tab-btn.active[id], .toggle-btn.active[id]'), function (b) { return b.id; });
  }
  function snapshot() {
    var vals = {};
    fields().forEach(function (el) { vals[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value; });
    return { v: vals, t: activeToggles() };
  }
  function fire(el, name) { el.dispatchEvent(new Event(name, { bubbles: true })); }
  function apply(state) {
    (state.t || []).forEach(function (id) {
      var b = document.getElementById(id);
      if (b && !b.classList.contains('active')) b.click();   // let the page switch its own tab/units first
    });
    var vals = state.v || {};
    fields().forEach(function (el) {
      if (!(el.id in vals)) return;
      var v = vals[el.id];
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!v; else el.value = v;
      fire(el, 'input'); fire(el, 'change');
    });
  }

  /* 2. persistence */
  var timer;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (e) { /* private mode / full */ }
  }
  function saveSoon() { clearTimeout(timer); timer = setTimeout(save, 250); }

  /* 3. share link */
  function shareUrl() {
    var json = JSON.stringify(snapshot());
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return location.origin + location.pathname + '?s=' + encodeURIComponent(b64);
  }
  function toast(msg, isError) {
    var t = document.createElement('div');
    t.className = 'mx-toast' + (isError ? ' error' : ''); t.setAttribute('role', isError ? 'alert' : 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 250); }, isError ? 4000 : 1800);
  }
  // Pages call alert() for bad input; show that as a non-blocking message instead.
  window.alert = function (msg) { toast(String(msg), true); };
  function addShareButton() {
    var bar = document.querySelector('.header-content');
    if (!bar || bar.querySelector('.share-btn') || !fields().length) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'share-btn'; b.setAttribute('aria-label', 'Copy a link with these values');
    b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line></svg><span class="share-text">Share</span>';
    b.addEventListener('click', function () {
      var url = shareUrl();
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { prompt('Copy this link', url); });
      } else { prompt('Copy this link', url); }
    });
    bar.appendChild(b);
  }

  /* 4. range validation (only inputs that declare min / max) */
  function checkRange(el) {
    if (el.type !== 'number' || el.value === '') return true;
    var v = parseFloat(el.value), min = el.min !== '' ? parseFloat(el.min) : null, max = el.max !== '' ? parseFloat(el.max) : null;
    var msg = '';
    if (isNaN(v)) msg = 'Enter a number';
    else if (min !== null && v < min) msg = 'Must be at least ' + min;
    else if (max !== null && v > max) msg = 'Must be at most ' + max;
    var hint = el.parentNode.querySelector('.field-error[data-for="' + el.id + '"]');
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      if (!hint) { hint = document.createElement('div'); hint.className = 'field-error'; hint.setAttribute('data-for', el.id); hint.setAttribute('role', 'alert'); el.parentNode.appendChild(hint); }
      hint.textContent = msg;
    } else {
      el.removeAttribute('aria-invalid');
      if (hint) hint.remove();
    }
    return !msg;
  }

  document.addEventListener('input', function (e) { saveSoon(); if (e.target.matches && e.target.matches('input[type=number]')) checkRange(e.target); });
  document.addEventListener('change', saveSoon);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button')) setTimeout(save, 60); });
  // Block "Calculate" clicks while a visible number field is out of its declared range.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button');
    if (!btn || !/calculate|generate/i.test((btn.getAttribute('onclick') || '') + ' ' + btn.id + ' ' + btn.textContent)) return;
    var bad = Array.prototype.filter.call(document.querySelectorAll('input[type=number][min], input[type=number][max]'), function (el) {
      return el.offsetParent !== null && !checkRange(el);
    });
    if (bad.length) { e.stopImmediatePropagation(); e.preventDefault(); bad[0].focus(); return; }
    var huge = Array.prototype.filter.call(document.querySelectorAll('input[type=number]'), function (el) {
      return el.offsetParent !== null && Math.abs(parseFloat(el.value)) > 1e12;
    });
    if (huge.length) {
      e.stopImmediatePropagation(); e.preventDefault();
      toast('That number is too large. Use a value below 1,000,000,000,000.', true); huge[0].focus();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    addShareButton();
    setTimeout(function () {            // after the page's own init code
      var shared = new URLSearchParams(location.search).get('s'), state = null, fromLink = false;
      try {
        if (shared) { state = JSON.parse(decodeURIComponent(escape(atob(shared)))); fromLink = true; }
        else { var raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); }
      } catch (e) { state = null; }
      if (state) {
        apply(state);
        if (fromLink) {
          history.replaceState(null, '', location.pathname);
          var go = document.querySelector('.btn-primary, button[onclick*="alculate"]');
          if (go) go.click();
        }
      }
    }, 0);
  });
})();
