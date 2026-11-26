/* Mx Calculator – first-party visit measurement + switched-off calculators (no third parties).
   Pages are static files, so this script does the work the server used to do:
   1. sends ONE navigation beacon (path, referrer, UTM, screen size, time zone); the server records the
      view and answers with the list of switched-off calculators,
   2. hides those calculators (home page links, or the whole page if this IS a switched-off calculator),
   3. measures time on page and whether a control was used. */
(function () {
  'use strict';
  if (window.top !== window.self) return;            // not inside iframes

  var URL_ = '/_mx/e';
  var path = location.pathname;
  var id = rand();

  function rand() {
    var a = new Uint8Array(12), s = '';
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;
  }
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

  // ---------------------------------------------------------------- switched-off calculators
  function unavailable() {
    document.title = 'Calculator unavailable | Mx Calculator';
    var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
    var st = document.createElement('style');
    st.textContent = 'body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f6f8fa;color:#1b2430}' +
      '.mx-off{max-width:460px;padding:32px;text-align:center}.mx-off h1{font-size:1.6rem;margin:0 0 10px}.mx-off p{color:#5a6675;line-height:1.6;margin:0 0 22px}' +
      '.mx-off a{display:inline-block;background:#1dafa2;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:600}';
    document.head.appendChild(st);
    document.body.className = '';
    document.body.innerHTML = '<main class="mx-off"><h1>This calculator is temporarily unavailable</h1>' +
      '<p>We have switched this tool off for now. Please check back soon, or try one of our other free calculators.</p>' +
      '<a href="/">Browse all calculators</a></main>';
  }
  function hideLinks(off) {
    off.forEach(function (slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) return;
      var links = document.querySelectorAll('a[href$="calculators/' + slug + '.html"]');
      for (var i = 0; i < links.length; i++) {
        var li = links[i].closest('li');
        (li || links[i]).remove();
      }
    });
    var cards = document.querySelectorAll('article.card');          // a category card with nothing left disappears too
    for (var j = 0; j < cards.length; j++) if (!cards[j].querySelector('li')) cards[j].remove();
  }
  function applyOff(off) {
    if (!off || !off.length) return;
    var m = /^\/calculators\/([a-z0-9-]+)(?:\.html)?\/?$/i.exec(path);
    if (m && off.indexOf(m[1].toLowerCase()) > -1) { unavailable(); return; }
    if (path === '/' || path === '/index.html') hideLinks(off);
  }

  // ---------------------------------------------------------------- time on page + interaction
  var visibleMs = 0;                      // accumulated time the tab was actually visible
  var since = 0;
  var used = 0;
  var beat = null;
  var beats = 0;

  function total() { return visibleMs + (since ? Date.now() - since : 0); }
  function ping() { send({ t: 'p', id: id, d: Math.round(total()), i: used }); }
  // 30 s and capped at 40 beats (~20 min of visible time) to stay inside Cloudflare's free request/write allowances.
  function startBeat() { if (!beat) beat = setInterval(function () { if (++beats > 40) { stopBeat(); return; } ping(); }, 30000); }
  function stopBeat() { if (beat) { clearInterval(beat); beat = null; } }

  function hello() {
    since = document.visibilityState === 'visible' ? Date.now() : 0;
    var e = env(); e.t = 'n'; e.id = id; e.path = path; e.search = location.search.slice(0, 500); e.ref = document.referrer || ''; e.d = 0;
    try {
      fetch(URL_, { method: 'POST', body: JSON.stringify(e), keepalive: true, headers: { 'Content-Type': 'text/plain' }, credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j) applyOff(j.off); })
        .catch(function () { /* fail open: the page just stays as it is */ });
    } catch (err) { /* ignore */ }
    if (since) startBeat();
  }

  // A page being prerendered is not a view yet: wait until the visitor actually lands on it.
  if (document.prerendering) document.addEventListener('prerenderingchange', hello, { once: true });
  else hello();

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

  // Page restored from the back/forward cache = a new view.
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    id = rand(); visibleMs = 0; used = 0; beats = 0;
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
