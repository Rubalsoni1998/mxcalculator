(function () {
  'use strict';

  /* ======================================================= helpers */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  // Tagged template: every interpolated value is HTML-escaped unless wrapped with raw().
  function raw(s) { return { __raw: String(s) }; }
  function val(v) {
    if (Array.isArray(v)) return v.map(val).join('');
    if (v && v.__raw !== undefined) return v.__raw;
    return esc(v);
  }
  function html(strings) {
    var out = strings[0];
    for (var i = 1; i < arguments.length; i++) out += val(arguments[i]) + strings[i];
    return raw(out);
  }
  function setHtml(el, h) { el.innerHTML = h.__raw; }

  var nf = new Intl.NumberFormat('en-US');
  var fmtNum = function (n) { return nf.format(n || 0); };
  function fmtDur(ms) {
    var s = Math.round((ms || 0) / 1000);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60); s = s % 60;
    if (m < 60) return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
    var h = Math.floor(m / 60); m = m % 60;
    return h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
  }
  var regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { /* old browser */ }
  function countryName(c) {
    if (!c || c === 'Unknown') return 'Unknown';
    try { return (regionNames && regionNames.of(c)) || c; } catch (e) { return c; }
  }

  var state = {
    tz: 'UTC', browserTz: 'UTC', settings: null,
    preset: '7d', from: '', to: '', traffic: 'humans'
  };
  try { state.browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { /* ignore */ }
  state.tz = state.browserTz;
  try {
    var saved = JSON.parse(sessionStorage.getItem('mx-admin-range') || 'null');
    if (saved) { state.preset = saved.preset || '7d'; state.from = saved.from || ''; state.to = saved.to || ''; state.traffic = saved.traffic || 'humans'; }
  } catch (e) { /* ignore */ }
  function saveRange() { try { sessionStorage.setItem('mx-admin-range', JSON.stringify({ preset: state.preset, from: state.from, to: state.to, traffic: state.traffic })); } catch (e) { /* ignore */ } }

  function dtf(opts) { return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: state.tz }, opts)); }
  var fmtDateTime = function (ts) { return dtf({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ts)); };
  var fmtDateTimeSec = function (ts) { return dtf({ month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(ts)); };
  var fmtClock = function (ts) { return dtf({ hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(ts)); };
  function ymd(ts) { return new Intl.DateTimeFormat('en-CA', { timeZone: state.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts)); }
  function addDays(s, n) { var p = s.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); }
  function rel(ts) {
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return 'just now';
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : ''); t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, isErr ? 5000 : 2600);
  }

  function api(path, body) {
    var opt = { credentials: 'same-origin', headers: { 'X-MX-Admin': '1' } };
    if (body !== undefined) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch('/admin/api/' + path, opt).then(function (r) {
      if (r.status === 401) { location.reload(); return new Promise(function () { }); }
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Request failed'); return j; });
    });
  }
  function qs(extra) {
    var r = rangeDates();
    var p = { tz: state.tz, from: r.from, to: r.to, traffic: state.traffic };
    for (var k in extra) p[k] = extra[k];
    return Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&');
  }
  function rangeDates() {
    var today = ymd(Date.now());
    switch (state.preset) {
      case 'today': return { from: today, to: today };
      case 'yesterday': var y = addDays(today, -1); return { from: y, to: y };
      case '7d': return { from: addDays(today, -6), to: today };
      case '30d': return { from: addDays(today, -29), to: today };
      case '90d': return { from: addDays(today, -89), to: today };
      default: return { from: state.from || today, to: state.to || today };
    }
  }

  var timers = [];
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  var viewEl = $('#view');

  /* ======================================================= shared UI: range bar */
  function rangeBar(opts) {
    var presets = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['custom', 'Custom']];
    var r = rangeDates();
    return html`<div class="toolbar" id="rangeBar">
      <div class="seg" role="group" aria-label="Date range">${presets.map(function (p) { return html`<button data-preset="${p[0]}" class="${state.preset === p[0] ? 'on' : ''}">${p[1]}</button>`; })}</div>
      <span class="${state.preset === 'custom' ? '' : 'hidden'}" id="customDates" style="display:inline-flex;gap:6px;align-items:center">
        <input type="date" id="dFrom" value="${r.from}" aria-label="From"> <span class="muted">to</span> <input type="date" id="dTo" value="${r.to}" aria-label="To">
        <button class="btn sm" id="dApply">Apply</button>
      </span>
      <select id="trafficSel" aria-label="Traffic filter" title="Which traffic to count">
        <option value="humans" ${state.traffic === 'humans' ? 'selected' : ''}>Real visitors (bots excluded)</option>
        <option value="verified" ${state.traffic === 'verified' ? 'selected' : ''}>Browser-verified only</option>
        <option value="all" ${state.traffic === 'all' ? 'selected' : ''}>Everything incl. bots</option>
      </select>
      ${opts && opts.extra ? opts.extra : ''}
    </div>`;
  }
  function wireRangeBar(reload) {
    var bar = $('#rangeBar');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]');
      if (b) {
        state.preset = b.getAttribute('data-preset');
        if (state.preset === 'custom') { var r = rangeDates(); state.from = r.from; state.to = r.to; }
        saveRange();
        if (state.preset === 'custom') { $$('[data-preset]', bar).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#customDates').classList.remove('hidden'); }
        else reload();
      }
      if (e.target.id === 'dApply') {
        state.from = $('#dFrom').value; state.to = $('#dTo').value; state.preset = 'custom'; saveRange(); reload();
      }
    });
    $('#trafficSel').addEventListener('change', function (e) { state.traffic = e.target.value; saveRange(); reload(); });
  }

  /* ======================================================= PAGE: calculators */
  var calc = { items: [], categories: [], filter: 'all', q: '' };

  function updateNavPill() {
    var off = calc.items.filter(function (i) { return !i.enabled; }).length;
    var pill = $('#navOff');
    pill.textContent = off + ' off'; pill.classList.toggle('hidden', !off);
  }

  function calcRow(i) {
    return html`<div class="calc-row ${i.enabled ? '' : 'off'}" data-row="${i.slug}">
      <label class="switch" title="${i.enabled ? 'Visible on website. Click to hide.' : 'Hidden from website. Click to show.'}">
        <input type="checkbox" data-slug="${i.slug}" ${i.enabled ? 'checked' : ''} aria-label="Show ${i.title} on the website"><span class="track"></span>
      </label>
      <div><div class="name">${i.title}</div><div class="path"><a href="${i.url}" target="_blank" rel="noopener">${i.url}</a></div></div>
      <span class="badge ${i.enabled ? 'live' : 'off'}">${i.enabled ? 'Visible' : 'Hidden'}</span>
      <div class="views"><b class="num">${fmtNum(i.views30)}</b><span>views / 30d</span></div>
    </div>`;
  }

  function renderCalcList() {
    var q = calc.q.toLowerCase();
    var vis = calc.items.filter(function (i) {
      if (calc.filter === 'on' && !i.enabled) return false;
      if (calc.filter === 'off' && i.enabled) return false;
      return !q || i.title.toLowerCase().indexOf(q) >= 0 || i.slug.indexOf(q) >= 0;
    });
    var on = calc.items.filter(function (i) { return i.enabled; }).length;
    setHtml($('#calcSummary'), html`<div><div class="big num">${on}<span class="muted" style="font-size:16px;font-weight:500"> / ${calc.items.length}</span></div><div class="muted">calculators visible on the website</div></div>
      <div><div class="big num" style="color:${calc.items.length - on ? 'var(--bad)' : 'var(--faint)'}">${calc.items.length - on}</div><div class="muted">hidden</div></div>`);
    if (!vis.length) { setHtml($('#calcList'), html`<div class="card cat"><div class="empty">No calculators match.</div></div>`); return; }
    var groups = calc.categories.map(function (c) { return { name: c, items: vis.filter(function (i) { return i.category === c; }) }; }).filter(function (g) { return g.items.length; });
    setHtml($('#calcList'), html`${groups.map(function (g) {
      var allOn = g.items.every(function (i) { return i.enabled; });
      return html`<section class="card cat">
        <div class="cat-head"><h2>${g.name} <span class="muted" style="font-weight:500">&middot; ${g.items.length}</span></h2>
          <button class="btn sm" data-bulk-cat="${g.name}" data-to="${allOn ? 'off' : 'on'}">${allOn ? 'Hide all in group' : 'Show all in group'}</button></div>
        ${g.items.map(calcRow)}</section>`;
    })}`);
  }

  function setEnabled(slugs, enabled) {
    return api('calculators', { slugs: slugs, enabled: enabled }).then(function () {
      calc.items.forEach(function (i) { if (slugs.indexOf(i.slug) >= 0) i.enabled = enabled; });
      updateNavPill();
    });
  }

  function pageCalculators() {
    setHtml(viewEl, html`
      <div class="page-head"><div><h1>Calculators</h1><div class="sub">Switch a calculator off to remove it from the home page, search and sitemap, and to block its direct link.</div></div>
        <div class="toolbar"><button class="btn" id="allOn">Show all</button><button class="btn danger" id="allOff">Hide all</button></div></div>
      <div class="card stat-strip" id="calcSummary"></div>
      <div class="toolbar" style="margin-bottom:4px">
        <input type="search" id="calcQ" class="grow" placeholder="Search calculators…" aria-label="Search calculators">
        <div class="seg" id="calcFilter"><button data-f="all" class="on">All</button><button data-f="on">Visible</button><button data-f="off">Hidden</button></div>
      </div>
      <div id="calcList"></div>`);
    api('calculators').then(function (d) {
      calc.items = d.items; calc.categories = d.categories; calc.filter = 'all'; calc.q = '';
      updateNavPill(); renderCalcList();
    }).catch(function (e) { toast(e.message, true); });

    $('#calcQ').addEventListener('input', function (e) { calc.q = e.target.value; renderCalcList(); });
    $('#calcFilter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return;
      calc.filter = b.getAttribute('data-f');
      $$('#calcFilter button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderCalcList();
    });
    $('#allOn').addEventListener('click', function () {
      setEnabled(calc.items.map(function (i) { return i.slug; }), true).then(function () { renderCalcList(); toast('All calculators are now visible.'); }).catch(function (e) { toast(e.message, true); });
    });
    $('#allOff').addEventListener('click', function () {
      if (!confirm('Hide ALL ' + calc.items.length + ' calculators from the website? Visitors will see no tools until you switch them back on.')) return;
      setEnabled(calc.items.map(function (i) { return i.slug; }), false).then(function () { renderCalcList(); toast('All calculators are now hidden.'); }).catch(function (e) { toast(e.message, true); });
    });
    $('#calcList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-bulk-cat]'); if (!b) return;
      var cat = b.getAttribute('data-bulk-cat'), on = b.getAttribute('data-to') === 'on';
      var slugs = calc.items.filter(function (i) { return i.category === cat; }).map(function (i) { return i.slug; });
      setEnabled(slugs, on).then(function () { renderCalcList(); toast(cat + ': ' + (on ? 'all visible' : 'all hidden')); }).catch(function (er) { toast(er.message, true); });
    });
    $('#calcList').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-slug]'); if (!input) return;
      var slug = input.getAttribute('data-slug'), want = input.checked, item = calc.items.filter(function (i) { return i.slug === slug; })[0];
      input.disabled = true; input.parentNode.classList.add('busy');
      setEnabled([slug], want).then(function () {
        var row = input.closest('.calc-row');
        row.classList.toggle('off', !want);
        var badge = $('.badge', row); badge.className = 'badge ' + (want ? 'live' : 'off'); badge.textContent = want ? 'Visible' : 'Hidden';
        input.disabled = false; input.parentNode.classList.remove('busy');
        renderSummaryOnly();
        toast(item.title + (want ? ' is now visible.' : ' is now hidden.'));
      }).catch(function (er) {
        input.checked = !want; input.disabled = false; input.parentNode.classList.remove('busy'); toast(er.message, true);
      });
    });
    function renderSummaryOnly() {
      var on = calc.items.filter(function (i) { return i.enabled; }).length;
      setHtml($('#calcSummary'), html`<div><div class="big num">${on}<span class="muted" style="font-size:16px;font-weight:500"> / ${calc.items.length}</span></div><div class="muted">calculators visible on the website</div></div>
        <div><div class="big num" style="color:${calc.items.length - on ? 'var(--bad)' : 'var(--faint)'}">${calc.items.length - on}</div><div class="muted">hidden</div></div>`);
    }
  }

  /* ======================================================= PAGE: analytics */
  function delta(cur, prev, invert) {
    if (!prev && !cur) return html`<div class="delta flat">no change</div>`;
    if (!prev) return html`<div class="delta up">new</div>`;
    var pct = ((cur - prev) / prev) * 100;
    if (Math.abs(pct) < 0.05) return html`<div class="delta flat">no change</div>`;
    var good = invert ? pct < 0 : pct > 0;
    return html`<div class="delta ${good ? 'up' : 'down'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}% <span class="muted" style="font-weight:500">vs previous</span></div>`;
  }
  function kpi(label, value, deltaHtml, note) {
    return html`<div class="card kpi"><div class="label">${label}</div><div class="value num">${value}</div>${deltaHtml || ''}${note ? html`<div class="note">${note}</div>` : ''}</div>`;
  }

  function niceMax(v) {
    if (v <= 5) return 5;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  function chartSvg(series) {
    var pts = series.points, n = pts.length;
    var W = 1000, H = 260, L = 44, R = 10, T = 12, B = 28, pw = W - L - R, ph = H - T - B;
    var max = niceMax(Math.max.apply(null, pts.map(function (p) { return Math.max(p.pageviews, p.visitors); }).concat([1])));
    var step = pw / n, bw = Math.max(2, Math.min(40, step * 0.66));
    var y = function (v) { return T + ph - (v / max) * ph; };
    var xc = function (i) { return L + step * i + step / 2; };
    var label = function (t) {
      return series.granularity === 'hour'
        ? dtf({ hour: 'numeric' }).format(new Date(t))
        : dtf({ month: 'short', day: 'numeric' }).format(new Date(t));
    };
    var s = '';
    for (var g = 0; g <= 4; g++) {
      var v = max * g / 4, yy = y(v);
      s += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmtNum(Math.round(v)) + '</text>';
    }
    var every = Math.ceil(n / 9);
    pts.forEach(function (p, i) {
      var h = (p.pageviews / max) * ph;
      s += '<rect x="' + (xc(i) - bw / 2) + '" y="' + (T + ph - h) + '" width="' + bw + '" height="' + h + '" rx="2" fill="var(--series-a-soft)"/>';
      if (i % every === 0) s += '<text x="' + xc(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(label(p.t)) + '</text>';
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + xc(i).toFixed(1) + ' ' + y(p.visitors).toFixed(1); }).join(' ');
    s += '<path d="' + line + '" fill="none" stroke="var(--series-b)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
    if (n <= 40) pts.forEach(function (p, i) { s += '<circle cx="' + xc(i) + '" cy="' + y(p.visitors) + '" r="3" fill="var(--panel)" stroke="var(--series-b)" stroke-width="2"/>'; });
    pts.forEach(function (p, i) { s += '<rect data-i="' + i + '" x="' + (L + step * i) + '" y="' + T + '" width="' + step + '" height="' + ph + '" fill="transparent"/>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Page views and visitors over time">' + s + '</svg>';
  }

  function wireChart(box, series) {
    var tip = document.createElement('div'); tip.className = 'tip hidden'; box.appendChild(tip);
    box.addEventListener('mousemove', function (e) {
      var r = e.target.closest('rect[data-i]');
      if (!r) { tip.classList.add('hidden'); return; }
      var p = series.points[+r.getAttribute('data-i')];
      var when = series.granularity === 'hour'
        ? dtf({ month: 'short', day: 'numeric', hour: 'numeric' }).format(new Date(p.t))
        : dtf({ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(p.t));
      setHtml(tip, html`<b>${when}</b>Visitors: ${fmtNum(p.visitors)}<br>Page views: ${fmtNum(p.pageviews)}<br>Sessions: ${fmtNum(p.sessions)}`);
      var b = box.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(e.clientX - b.left, 70), b.width - 70) + 'px'; tip.style.top = (e.clientY - b.top - 10) + 'px';
      tip.classList.remove('hidden');
    });
    box.addEventListener('mouseleave', function () { tip.classList.add('hidden'); });
  }

  function barList(rows, o) {
    if (!rows.length) return html`<div class="empty">No data in this period.</div>`;
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
    var total = o.total || 0;
    return html`<div class="col-head"><span>${o.head}</span><span>${o.vHead}</span><span style="min-width:52px;text-align:right">${o.v2Head || ''}</span></div>
      <div class="bars">${rows.map(function (r) {
        return html`<div class="bar" style="--w:${(r.v / max * 100).toFixed(1)}%"><span class="k" title="${r.title || r.label}">${r.link ? html`<a href="${r.link}" target="_blank" rel="noopener">${r.label}</a>` : r.label}</span>
          <span class="v num">${fmtNum(r.v)}</span><span class="v2 num">${r.v2 != null ? r.v2 : (total ? (r.v / total * 100).toFixed(1) + '%' : '')}</span></div>`;
      })}</div>`;
  }
  function card(title, body, sub) {
    return html`<section class="card"><div class="card-head"><h2>${title}</h2>${sub ? html`<span class="muted" style="font-size:12.5px">${sub}</span>` : ''}</div><div class="card-body">${body}</div></section>`;
  }
  var cap = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };

  function pageAnalytics() {
    setHtml(viewEl, html`
      <div class="page-head"><div><h1>Analytics</h1><div class="sub" id="aSub">Loading…</div></div>
        <div class="toolbar"><a class="btn" id="csvLink" href="#" download>Export CSV</a></div></div>
      ${rangeBar()}
      <div id="aBody" style="margin-top:16px"></div>`);
    wireRangeBar(pageAnalytics);
    $('#csvLink').href = '/admin/api/export.csv?' + qs({});
    api('overview?' + qs({})).then(function (d) {
      var k = d.kpis, p = d.previous, b = d.breakdowns, r = d.range;
      var sub = r.from === r.to ? r.from : r.from + ' → ' + r.to;
      $('#aSub').textContent = sub + ' · times in ' + r.tz + ' · compared with the previous ' + r.days + (r.days === 1 ? ' day' : ' days');
      var verifiedPct = k.pageviews ? Math.round(k.verifiedViews / k.pageviews * 100) : 0;
      var devTotal = b.devices.reduce(function (a, x) { return a + x.visitors; }, 0);
      var chanTotal = b.channels.reduce(function (a, x) { return a + x.sessions; }, 0);
      var ctyTotal = b.countries.reduce(function (a, x) { return a + x.visitors; }, 0);
      var brTotal = b.browsers.reduce(function (a, x) { return a + x.visitors; }, 0);
      var osTotal = b.os.reduce(function (a, x) { return a + x.visitors; }, 0);

      var calcRows = b.calculators.map(function (c) {
        return { label: c.title + (c.disabled ? ' (hidden)' : ''), title: c.k, v: c.views, v2: c.visitors + ' visitors · ' + (c.views ? Math.round(c.used / c.views * 100) : 0) + '% used', link: '/calculators/' + c.k + '.html' };
      });

      setHtml($('#aBody'), html`
        <div class="grid g-kpi">
          ${kpi('Visitors', fmtNum(k.visitors), delta(k.visitors, p.visitors), fmtNum(k.newVisitors) + ' new · ' + fmtNum(k.returningVisitors) + ' returning')}
          ${kpi('Page views', fmtNum(k.pageviews), delta(k.pageviews, p.pageviews), verifiedPct + '% confirmed by browser')}
          ${kpi('Sessions', fmtNum(k.sessions), delta(k.sessions, p.sessions), k.pagesPerSession + ' pages per session')}
          ${kpi('Avg. time on page', fmtDur(k.avgViewMs), delta(k.avgViewMs, p.avgViewMs), 'visible time, browser-verified views')}
          ${kpi('Avg. session time', fmtDur(k.avgSessionMs), delta(k.avgSessionMs, p.avgSessionMs))}
          ${kpi('Bounce rate', k.bounceRate + '%', delta(k.bounceRate, p.bounceRate, true), 'sessions with one page view')}
          ${kpi('Calculator used', fmtNum(k.interactedViews), delta(k.interactedViews, p.interactedViews), 'page views where an input/button was used')}
          ${kpi('Bot hits filtered', fmtNum(d.botViews), '', r.mode === 'all' ? 'included in totals above' : 'not in totals above')}
        </div>
        <section class="card" style="margin-bottom:16px">
          <div class="card-head"><h2>Traffic over time</h2><div class="legend"><span><i style="background:var(--series-a-soft)"></i>Page views</span><span><i style="background:var(--series-b)"></i>Visitors</span></div></div>
          <div class="chart" id="chartBox">${raw(chartSvg(d.series))}</div>
        </section>
        <div class="grid g-2">
          ${card('Top calculators', barList(calcRows, { head: 'Calculator', vHead: 'Views', v2Head: 'Visitors · used' }), 'by page views')}
          ${card('Top pages', barList(b.pages.map(function (x) { return { label: x.k, v: x.views, v2: x.visitors + ' visitors' }; }), { head: 'Page', vHead: 'Views', v2Head: 'Visitors' }))}
          ${card('Traffic sources', barList(b.channels.map(function (x) { return { label: cap(x.k), v: x.sessions }; }), { head: 'Channel', vHead: 'Sessions', v2Head: 'Share', total: chanTotal }), 'where sessions started')}
          ${card('Top referrers', barList(b.referrers.map(function (x) { return { label: x.k, v: x.sessions, v2: x.visitors + ' visitors' }; }), { head: 'Website', vHead: 'Sessions', v2Head: 'Visitors' }))}
          ${card('Landing pages', barList(b.entry.map(function (x) { return { label: x.k, v: x.sessions }; }), { head: 'Page', vHead: 'Sessions', v2Head: '' }), 'first page of a session')}
          ${card('Campaigns (UTM)', barList(b.campaigns.map(function (x) { return { label: x.k + (x.source ? ' · ' + x.source : '') + (x.medium ? ' / ' + x.medium : ''), v: x.sessions }; }), { head: 'Campaign', vHead: 'Sessions', v2Head: '' }), 'from ?utm_ links')}
          ${card('Countries', barList(b.countries.map(function (x) { return { label: countryName(x.k), v: x.visitors }; }), { head: 'Country', vHead: 'Visitors', v2Head: 'Share', total: ctyTotal }), 'needs a CDN country header')}
          ${card('Devices', barList(b.devices.map(function (x) { return { label: cap(x.k), v: x.visitors }; }), { head: 'Device', vHead: 'Visitors', v2Head: 'Share', total: devTotal }))}
          ${card('Browsers', barList(b.browsers.map(function (x) { return { label: x.k, v: x.visitors }; }), { head: 'Browser', vHead: 'Visitors', v2Head: 'Share', total: brTotal }))}
          ${card('Operating systems', barList(b.os.map(function (x) { return { label: x.k, v: x.visitors }; }), { head: 'System', vHead: 'Visitors', v2Head: 'Share', total: osTotal }))}
          ${card('Screen sizes', barList(b.screens.map(function (x) { return { label: x.k.replace('x', ' × '), v: x.visitors }; }), { head: 'Screen', vHead: 'Visitors', v2Head: '' }), 'browser-verified')}
          ${card('Visitor time zones', barList(b.timezones.map(function (x) { return { label: x.k, v: x.visitors }; }), { head: 'Time zone', vHead: 'Visitors', v2Head: '' }), 'browser-verified')}
          ${card('Languages', barList(b.languages.map(function (x) { return { label: x.k, v: x.visitors }; }), { head: 'Language', vHead: 'Visitors', v2Head: '' }))}
          ${card('Bots detected', barList(b.bots.map(function (x) { return { label: x.k, v: x.views }; }), { head: 'Bot', vHead: 'Hits', v2Head: '' }), 'excluded from visitor counts')}
        </div>`);
      wireChart($('#chartBox'), d.series);
    }).catch(function (e) { setHtml($('#aBody'), html`<div class="card"><div class="empty">${e.message}</div></div>`); });
  }

  /* ======================================================= PAGE: live */
  function pageLive() {
    setHtml(viewEl, html`
      <div class="page-head"><div><h1>Live</h1><div class="sub">Visitors on the site right now. Updates every 5 seconds.</div></div>
        <select id="trafficSel" aria-label="Traffic filter"><option value="humans">Real visitors</option><option value="verified">Browser-verified only</option><option value="all">Everything incl. bots</option></select></div>
      <div class="live-hero" id="liveHero"></div>
      <section class="card"><div class="card-head"><h2>Latest page views</h2></div><div class="tbl-wrap" id="liveFeed"></div></section>`);
    $('#trafficSel').value = state.traffic;
    $('#trafficSel').addEventListener('change', function (e) { state.traffic = e.target.value; saveRange(); tick(); });
    function tick() {
      if (document.hidden) return;
      api('live?traffic=' + state.traffic).then(function (d) {
        setHtml($('#liveHero'), html`
          <div class="card kpi"><div class="label"><span class="pulse"></span>Active right now</div><div class="value num">${fmtNum(d.active)}</div><div class="note">visitors with a page open in the last 90 seconds</div></div>
          <div class="card kpi"><div class="label">Last 30 minutes</div><div class="value num">${fmtNum(d.last30)}</div><div class="note">unique visitors</div></div>
          <div class="card kpi"><div class="label">Pages being viewed</div>${d.pages.length ? html`<div class="bars" style="margin-top:6px">${d.pages.map(function (p) { return html`<div class="bar" style="--w:100%"><span class="k">${p.k}</span><span class="v num">${p.visitors}</span><span class="v2"></span></div>`; })}</div>` : html`<div class="muted" style="margin-top:6px">Nobody right now.</div>`}</div>`);
        setHtml($('#liveFeed'), html`<table><thead><tr><th></th><th>Time</th><th>Page</th><th>Visitor</th><th>Location</th><th>Device</th><th>Source</th><th class="r">On page</th></tr></thead><tbody>
          ${d.feed.map(function (x) {
            return html`<tr class="click" data-visitor="${x.visitor_id}"><td>${x.active ? html`<span class="pulse" title="Active now" style="margin:0"></span>` : ''}</td>
              <td class="num" title="${fmtDateTimeSec(x.ts)}">${rel(x.ts)}</td><td style="overflow-wrap:anywhere">${x.path}${x.is_bot ? html` <span class="badge bot">bot</span>` : ''}</td>
              <td class="mono">${x.visitor_id.slice(0, 8)}</td><td>${x.ip || '—'}${x.country ? ' · ' + countryName(x.country) : ''}</td>
              <td>${x.browser}, ${x.os} <span class="muted">${x.device}</span></td><td>${cap(x.channel)}${x.ref_host ? ' · ' + x.ref_host : ''}</td>
              <td class="r num">${x.js ? fmtDur(x.dur_ms) : html`<span class="muted" title="No browser confirmation received">—</span>`}</td></tr>`;
          })}</tbody></table>${d.feed.length ? '' : html`<div class="empty">No visits recorded yet.</div>`}`);
        var dot = $('#navLive'); dot.classList.toggle('hidden', !d.active);
      }).catch(function () { /* transient */ });
    }
    tick(); timers.push(setInterval(tick, 5000));
    $('#liveFeed').addEventListener('click', function (e) { var tr = e.target.closest('[data-visitor]'); if (tr) openVisitor(tr.getAttribute('data-visitor')); });
  }

  /* ======================================================= PAGE: visitors */
  var vis = { page: 1, q: '' };
  function pageVisitors() {
    setHtml(viewEl, html`
      <div class="page-head"><div><h1>Visitors</h1><div class="sub" id="vSub"></div></div>
        <div class="toolbar"><a class="btn" id="csvLink" href="#" download>Export CSV</a></div></div>
      ${rangeBar({ extra: html`<input type="search" id="vq" class="grow" placeholder="Search IP, visitor ID, page, country, referrer…" aria-label="Search visitors" value="${vis.q}">` })}
      <section class="card" style="margin-top:16px"><div class="tbl-wrap" id="vTable"><div class="empty">Loading…</div></div>
        <div class="toolbar" style="padding:12px 16px;justify-content:space-between" id="vPager"></div></section>`);
    wireRangeBar(function () { vis.page = 1; pageVisitors(); });
    $('#csvLink').href = '/admin/api/export.csv?' + qs({});
    var t;
    $('#vq').addEventListener('input', function (e) { clearTimeout(t); t = setTimeout(function () { vis.q = e.target.value; vis.page = 1; load(); }, 300); });
    function load() {
      api('visitors?' + qs({ page: vis.page, q: vis.q })).then(function (d) {
        $('#vSub').textContent = fmtNum(d.total) + ' unique visitors in this period · times in ' + state.tz;
        setHtml($('#vTable'), html`<table><thead><tr><th>Visitor</th><th>IP / location</th><th>Device</th><th>Source</th><th class="r">Views</th><th class="r">Sessions</th><th class="r">Time</th><th>Last seen</th></tr></thead><tbody>
          ${d.rows.map(function (v) {
            return html`<tr class="click" data-visitor="${v.visitor_id}">
              <td><span class="mono">${v.visitor_id.slice(0, 8)}</span> ${v.is_bot ? html`<span class="badge bot">bot</span>` : v.viewsEver > v.views || v.firstEverTs < (v.first_ts - 1) ? html`<span class="badge plain">returning</span>` : html`<span class="badge new">new</span>`}</td>
              <td>${v.ip || '—'}<div class="muted" style="font-size:12px">${v.country ? countryName(v.country) : 'Unknown'}${v.tz ? ' · ' + v.tz : ''}</div></td>
              <td>${v.browser}${v.browser_ver ? ' ' + v.browser_ver : ''}<div class="muted" style="font-size:12px">${v.os} · ${v.device}${v.js ? '' : ' · no JS confirm'}</div></td>
              <td>${cap(v.firstChannel)}<div class="muted" style="font-size:12px">${v.firstRef || ''}</div></td>
              <td class="r num">${fmtNum(v.views)}</td><td class="r num">${fmtNum(v.sessions)}</td><td class="r num">${fmtDur(v.dur)}</td>
              <td class="num" title="${fmtDateTimeSec(v.last_ts)}">${fmtDateTime(v.last_ts)}<div class="muted" style="font-size:12px">${rel(v.last_ts)}</div></td></tr>`;
          })}</tbody></table>${d.rows.length ? '' : html`<div class="empty">No visitors match.</div>`}`);
        setHtml($('#vPager'), html`<span class="muted">Page ${d.page} of ${d.pages}</span><span class="toolbar"><button class="btn sm" id="vPrev" ${d.page <= 1 ? 'disabled' : ''}>Previous</button><button class="btn sm" id="vNext" ${d.page >= d.pages ? 'disabled' : ''}>Next</button></span>`);
        $('#vPrev').onclick = function () { vis.page--; load(); };
        $('#vNext').onclick = function () { vis.page++; load(); };
      }).catch(function (e) { toast(e.message, true); });
    }
    load();
    $('#vTable').addEventListener('click', function (e) { var tr = e.target.closest('[data-visitor]'); if (tr) openVisitor(tr.getAttribute('data-visitor')); });
  }

  /* ======================================================= visitor drawer */
  function closeDrawer() { $('#overlay').innerHTML = ''; document.removeEventListener('keydown', escClose); }
  function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
  function openVisitor(id) {
    var ov = $('#overlay');
    setHtml(ov, html`<div class="overlay" data-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Visitor details"><div class="drawer-body"><p class="muted" style="padding-top:20px">Loading…</p></div></aside>`);
    ov.onclick = function (e) { if (e.target.closest('[data-close]')) closeDrawer(); };
    document.addEventListener('keydown', escClose);
    api('visitor/' + id).then(function (d) {
      var rows = d.rows, newest = rows[0], oldest = rows[rows.length - 1];
      var ips = [], seen = {};
      rows.forEach(function (r) { if (r.ip && !seen[r.ip]) { seen[r.ip] = 1; ips.push(r.ip); } });
      var sessions = [], idx = {};
      rows.forEach(function (r) { if (!(r.session_id in idx)) { idx[r.session_id] = sessions.length; sessions.push({ id: r.session_id, hits: [] }); } sessions[idx[r.session_id]].hits.push(r); });
      sessions.forEach(function (s) { s.hits.reverse(); });
      var totalDur = rows.reduce(function (a, r) { return a + r.dur_ms; }, 0);
      var withScreen = rows.filter(function (r) { return r.screen_w; })[0];
      setHtml($('.drawer', ov), html`
        <div class="drawer-head"><div><h1 style="font-size:18px">Visitor <span class="mono">${id.slice(0, 8)}</span> ${newest.is_bot ? html`<span class="badge bot">bot</span>` : ''}</h1>
          <div class="muted mono" style="margin-top:2px">${id}</div></div><button class="btn sm" data-close>Close</button></div>
        <div class="drawer-body">
          <div class="kv">
            <div><span>First seen</span>${fmtDateTime(oldest.ts)}</div><div><span>Last seen</span>${fmtDateTime(newest.ts)}</div>
            <div><span>Page views</span>${fmtNum(rows.length)}${rows.length >= 1000 ? '+' : ''}</div><div><span>Sessions</span>${sessions.length}</div>
            <div><span>Time on site</span>${fmtDur(totalDur)}</div><div><span>IP address${ips.length > 1 ? 'es' : ''}</span>${ips.length ? ips.join(', ') : '—'}</div>
            <div><span>Country</span>${newest.country ? countryName(newest.country) : 'Unknown'}</div><div><span>Time zone</span>${(rows.filter(function (r) { return r.tz; })[0] || {}).tz || '—'}</div>
            <div><span>Browser</span>${newest.browser}${newest.browser_ver ? ' ' + newest.browser_ver : ''}</div><div><span>System</span>${newest.os} · ${newest.device}</div>
            <div><span>Screen</span>${withScreen ? withScreen.screen_w + ' × ' + withScreen.screen_h : '—'}</div><div><span>Language</span>${newest.lang || '—'}</div>
            <div><span>First source</span>${cap(oldest.channel)}${oldest.ref_host ? ' · ' + oldest.ref_host : ''}</div>
          </div>
          ${sessions.map(function (s, si) {
            var first = s.hits[0], last = s.hits[s.hits.length - 1];
            return html`<div class="sess"><div class="sess-head"><span>Session ${sessions.length - si} · ${fmtDateTime(first.ts)}</span>
              <span class="muted" style="font-weight:500">${s.hits.length} page${s.hits.length === 1 ? '' : 's'} · ${cap(first.channel)}${first.ref_host ? ' · ' + first.ref_host : ''}${first.utm_campaign ? ' · campaign ' + first.utm_campaign : ''}</span></div>
              ${s.hits.map(function (h) {
                return html`<div class="hit"><span class="t num">${fmtClock(h.ts)}</span><span class="p">${h.path}${h.interacted ? html` <span class="badge new">used</span>` : ''}${h.js ? '' : html` <span class="badge plain" title="No browser confirmation">no JS</span>`}</span><span class="t num">${h.js ? fmtDur(h.dur_ms) : '—'}</span></div>`;
              })}</div>`;
          })}
        </div>`);
    }).catch(function (e) { toast(e.message, true); closeDrawer(); });
  }

  /* ======================================================= PAGE: settings */
  function pageSettings() {
    setHtml(viewEl, html`<div class="page-head"><div><h1>Settings</h1><div class="sub">Tracking, privacy, data and security.</div></div></div><div id="sBody"><div class="empty">Loading…</div></div>`);
    api('settings').then(function (d) {
      var s = d.settings;
      var zones = []; try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = [state.browserTz, 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Asia/Kolkata']; }
      setHtml($('#sBody'), html`<div class="settings">
        <section class="card"><div class="card-head"><h2>Visitor tracking</h2></div><div class="card-body">
          <div class="setting"><div><b>Record visits</b><p>Turn off to stop recording new visits. Existing data is kept.</p></div>
            <label class="switch"><input type="checkbox" id="sTrack" ${s.tracking_enabled ? 'checked' : ''}><span class="track"></span></label></div>
          <div class="setting"><div><b>IP address storage</b><p>Full IPs give exact per-visitor audit trails. Truncated zeroes the last part; "Don't store" keeps no IP.</p></div>
            <select id="sIp"><option value="full" ${s.ip_mode === 'full' ? 'selected' : ''}>Store full IP</option><option value="truncated" ${s.ip_mode === 'truncated' ? 'selected' : ''}>Truncate IP</option><option value="none" ${s.ip_mode === 'none' ? 'selected' : ''}>Don't store</option></select></div>
          <div class="setting stack"><div><b>Ignore these IP addresses</b><p>Visits from these IPs are not recorded (your office, your home). Separate with spaces or new lines. <br>Your current IP: <span class="mono">${d.yourIp}</span> <button class="btn sm" id="addMyIp" style="margin-left:6px">Add my IP</button></p></div>
            <textarea id="sExcl" rows="3" placeholder="203.0.113.7">${(s.exclude_ips || []).join('\n')}</textarea></div>
          <div class="setting"><div><b>Keep data for</b><p>Older visits are deleted automatically. 0 = keep forever.</p></div>
            <span><input type="number" id="sRet" min="0" max="3650" value="${s.retention_days}" style="width:90px"> days</span></div>
          <div class="setting"><div><b>Report time zone</b><p>Days and hours in reports follow this zone. Currently: <span class="mono">${state.tz}</span></p></div>
            <select id="sTz"><option value="">Auto (this browser: ${state.browserTz})</option>${zones.map(function (z) { return html`<option value="${z}" ${s.report_tz === z ? 'selected' : ''}>${z}</option>`; })}</select></div>
          <div style="margin-top:14px"><button class="btn primary" id="sSave">Save settings</button></div>
        </div></section>

        <section class="card"><div class="card-head"><h2>How the numbers are counted</h2></div><div class="card-body"><div class="note-box">
          <ul>
            <li><b>Page view</b> is recorded by the server the moment a page is delivered, so it is counted even if the visitor blocks JavaScript or leaves instantly.</li>
            <li><b>Not counted:</b> bots and crawlers (by user agent and automated-browser flag), prefetch requests, iframes, your own admin sessions and excluded IPs.</li>
            <li><b>Visitor</b> = a first-party cookie that lasts 2 years. A person who clears cookies or switches browser or device counts as a new visitor.</li>
            <li><b>Session</b> = one visitor's activity; it ends after 30 minutes with no activity. <b>Bounce</b> = a session with one page view.</li>
            <li><b>Time on page</b> counts only time the tab is visible and is reported by the browser, so it covers browser-verified views only.</li>
            <li><b>Country</b> comes from the header your CDN or host adds (Cloudflare, Vercel, CloudFront…). Without one it shows Unknown.</li>
            <li>Every figure is a plain count over the stored rows, so you can verify it in <b>Visitors</b> or the CSV export.</li>
          </ul></div></div></section>

        <section class="card"><div class="card-head"><h2>Data</h2></div><div class="card-body">
          <div class="setting"><div><b>Stored page views</b><p class="num">${fmtNum(d.dbRows)} rows (including bot hits)</p></div></div>
          <div class="setting"><div><b>Delete bot hits</b><p>Removes every row flagged as a bot.</p></div><button class="btn danger sm" data-purge="bots">Delete bots</button></div>
          <div class="setting"><div><b>Delete data older than</b><p>Pick a date; everything before it is removed.</p></div><span class="toolbar"><input type="date" id="purgeDate"><button class="btn danger sm" data-purge="before">Delete</button></span></div>
          <div class="setting"><div><b>Delete all analytics data</b><p>Cannot be undone. Calculator on/off settings are not affected.</p></div><button class="btn danger sm" data-purge="all">Delete everything</button></div>
        </div></section>

        <section class="card"><div class="card-head"><h2>Security</h2></div><div class="card-body">
          ${d.passwordFromEnv ? html`<div class="note-box">The admin password is set by the <span class="mono">ADMIN_PASSWORD</span> environment variable. Change it by running <span class="mono">npx wrangler secret put ADMIN_PASSWORD</span>; everyone is signed out automatically.</div>` : html`
          <div class="field"><label for="pwCur">Current password</label><input type="password" id="pwCur" autocomplete="current-password"></div>
          <div class="field"><label for="pwNew">New password (10+ characters)</label><input type="password" id="pwNew" autocomplete="new-password"></div>
          <button class="btn" id="pwSave">Change password</button> <span class="muted" style="margin-left:8px">You will be signed out everywhere.</span>`}
        </div></section>

        <section class="card"><div class="card-head"><h2>Recent admin activity</h2></div><div class="card-body tbl-wrap">
          <table><tbody>${d.audit.map(function (a) { return html`<tr><td class="num muted" style="white-space:nowrap">${fmtDateTime(a.ts)}</td><td><b>${a.action}</b></td><td class="muted">${a.detail || ''}</td></tr>`; })}</tbody></table>
        </div></section>
      </div>`);

      $('#addMyIp').onclick = function () {
        var t = $('#sExcl'); var cur = t.value.split(/[\s,]+/).filter(Boolean);
        if (cur.indexOf(d.yourIp) < 0) cur.push(d.yourIp); t.value = cur.join('\n');
      };
      $('#sSave').onclick = function () {
        api('settings', {
          tracking_enabled: $('#sTrack').checked, ip_mode: $('#sIp').value, exclude_ips: $('#sExcl').value,
          retention_days: $('#sRet').value, report_tz: $('#sTz').value
        }).then(function (r) { state.settings = r.settings; state.tz = r.settings.report_tz || state.browserTz; toast('Settings saved.'); pageSettings(); })
          .catch(function (e) { toast(e.message, true); });
      };
      $$('[data-purge]').forEach(function (b) {
        b.onclick = function () {
          var mode = b.getAttribute('data-purge'), body = { mode: mode, tz: state.tz };
          if (mode === 'before') { body.before = $('#purgeDate').value; if (!body.before) { toast('Pick a date first.', true); return; } }
          var msg = mode === 'bots' ? 'Delete all bot hits?' : mode === 'before' ? 'Delete all analytics data before ' + body.before + '?' : 'Delete ALL analytics data? This cannot be undone.';
          if (!confirm(msg)) return;
          api('purge', body).then(function (r) { toast('Deleted ' + fmtNum(r.deleted) + ' rows.'); pageSettings(); }).catch(function (e) { toast(e.message, true); });
        };
      });
      var pw = $('#pwSave');
      if (pw) pw.onclick = function () {
        api('password', { current: $('#pwCur').value, new: $('#pwNew').value }).then(function () { toast('Password changed. Signing out…'); setTimeout(function () { location.reload(); }, 1200); }).catch(function (e) { toast(e.message, true); });
      };
    }).catch(function (e) { toast(e.message, true); });
  }

  /* ======================================================= router */
  var pages = { calculators: pageCalculators, analytics: pageAnalytics, live: pageLive, visitors: pageVisitors, settings: pageSettings };
  function route() {
    clearTimers(); closeDrawer();
    var name = (location.hash.replace(/^#\/?/, '') || 'calculators').split('?')[0];
    if (!pages[name]) name = 'calculators';
    $$('#nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-page') === name); });
    $('#side').classList.remove('open');
    window.scrollTo(0, 0);
    pages[name]();
  }
  window.addEventListener('hashchange', route);
  $('#menu').addEventListener('click', function () { $('#side').classList.toggle('open'); });
  $('#logout').addEventListener('click', function () { api('logout', {}).then(function () { location.href = '/admin/'; }); });

  api('settings').then(function (d) { state.settings = d.settings; state.tz = d.settings.report_tz || state.browserTz; }).catch(function () { }).then(function () {
    route();
    api('calculators').then(function (d) { calc.items = d.items; calc.categories = d.categories; updateNavPill(); }).catch(function () { });
  });
})();
