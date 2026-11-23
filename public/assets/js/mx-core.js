/* Mx Calculator – first-party visit measurement (no third parties, no cookies set from here).
   The server already counted this page view; this script confirms it and adds
   screen size, time zone, time spent on the page and whether a control was used. */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="mx-pv"]');
  var id = meta && meta.getAttribute('content');
  if (!id || !/^[a-f0-9]{24}$/.test(id)) return;

  var URL_ = '/_mx/e';
  function send(o) {
    var body = JSON.stringify(o);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) { /* fall through */ }
    try { fetch(URL_, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' }, credentials: 'same-origin' }); } catch (e) { /* ignore */ }
  }
  function env() {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
    return {
      tz: tz, w: screen.width, h: screen.height, vw: window.innerWidth, vh: window.innerHeight,
      tp: navigator.maxTouchPoints || 0, wd: navigator.webdriver ? 1 : 0
    };
  }
  function rand() {
    var a = new Uint8Array(12), s = '';
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;
  }

  var visibleMs = 0;                      // accumulated time the tab was actually visible
  var since = document.visibilityState === 'visible' ? Date.now() : 0;
  var used = 0;
  var beat = null;

  function total() { return visibleMs + (since ? Date.now() - since : 0); }
  function ping() { send({ t: 'p', id: id, d: Math.round(total()), i: used }); }
  // 30 s (was 15 s) and capped at 40 beats (~20 min of visible time) to stay inside Cloudflare's free request/write allowances.
  var beats = 0;
  function startBeat() { if (!beat) beat = setInterval(function () { if (++beats > 40) { stopBeat(); return; } ping(); }, 30000); }
  function stopBeat() { if (beat) { clearInterval(beat); beat = null; } }

  var e = env(); e.t = 'h'; e.id = id; e.d = 0;
  send(e);
  if (since) startBeat();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (since) { visibleMs += Date.now() - since; since = 0; }
      stopBeat(); ping();
    } else {
      since = Date.now(); startBeat();
    }
  });
  window.addEventListener('pagehide', function () {
    if (since) { visibleMs += Date.now() - since; since = 0; }
    stopBeat(); ping();
  });

  // Page restored from the back/forward cache = a new view the server never saw.
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    id = rand(); visibleMs = 0; used = 0;
    since = document.visibilityState === 'visible' ? Date.now() : 0;
    var v = env(); v.t = 'v'; v.id = id; v.path = location.pathname; v.d = 0;
    send(v);
    if (since) startBeat();
  });

  // "Used" = the visitor touched a form control or button on the page.
  function touched(ev) {
    var t = ev.target;
    if (used || !t || !t.closest) return;
    if (t.closest('input,select,textarea,button,[role="button"]')) { used = 1; ping(); }
  }
  document.addEventListener('input', touched, true);
  document.addEventListener('change', touched, true);
  document.addEventListener('click', touched, true);
})();
