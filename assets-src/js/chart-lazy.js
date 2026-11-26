/* Lazy Chart.js loader (replaces the old third-party <script> tag on calculator pages).
   - Pages keep calling `new Chart(ctx, config)` and `chart.destroy()` exactly as before.
   - The real Chart.js (~200 KB) is downloaded only when a chart canvas is on or near the screen,
     so it no longer competes with the page's own files while it loads.
   - Served from our own domain (assets/vendor/chart-4.4.1.umd.js); falls back to jsDelivr if that file is missing. */
(function () {
  'use strict';
  var VERSION = '4.4.1';
  var self = document.currentScript && document.currentScript.src;
  var LOCAL = self ? self.replace(/js\/chart-lazy[^\/]*$/, 'vendor/chart-' + VERSION + '.umd.js') : '';
  var CDN = 'https://cdn.jsdelivr.net/npm/chart.js@' + VERSION + '/dist/chart.umd.js';

  var Real = null, loading = null;
  // Charts are rebuilt on every Calculate click; Chart.js's default 1 s animation keeps the page busy, so use a short one.
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var defaults = { animation: { duration: calm ? 0 : 250 } };

  function inject(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { s.remove(); reject(new Error('load failed: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function load() {
    if (Real) return Promise.resolve(Real);
    if (loading) return loading;
    var shim = window.Chart;                       // the UMD build overwrites window.Chart
    loading = (LOCAL ? inject(LOCAL).catch(function () { return inject(CDN); }) : inject(CDN))
      .then(function () {
        Real = window.Chart;
        if (!Real || Real === shim) throw new Error('Chart.js did not initialise');
        copy(defaults, Real.defaults);             // e.g. dark-mode colours set by enhance.js before load
        return Real;
      })
      .catch(function (e) { loading = null; window.Chart = shim; if (window.console) console.warn(e.message); throw e; });
    return loading;
  }
  function copy(from, to) {
    Object.keys(from).forEach(function (k) {
      if (from[k] && typeof from[k] === 'object' && to[k] && typeof to[k] === 'object') copy(from[k], to[k]);
      else to[k] = from[k];
    });
  }
  function whenVisible(el, fn) {
    if (!el || !('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); fn(); return; }
      }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return io;
  }

  /* Stand-in with the small part of the Chart API the pages use */
  function LazyChart(ctx, config) {
    if (!(this instanceof LazyChart)) return new LazyChart(ctx, config);
    var me = this;
    me.config = config; me.chart = null; me.dead = false;
    me._io = whenVisible(ctx && ctx.canvas ? ctx.canvas : ctx, function () {
      if (me.dead) return;
      load().then(function (C) {
        if (!me.dead && !me.chart) me.chart = new C(ctx, config);
      }, function () { /* leave the chart blank if the library cannot load */ });
    });
  }
  LazyChart.prototype.destroy = function () {
    this.dead = true;
    if (this._io) this._io.disconnect();
    if (this.chart) { this.chart.destroy(); this.chart = null; }
  };
  LazyChart.prototype.update = function (mode) { if (this.chart) this.chart.update(mode); };
  Object.defineProperty(LazyChart.prototype, 'data', { get: function () { return this.chart ? this.chart.data : this.config.data; } });
  Object.defineProperty(LazyChart.prototype, 'options', { get: function () { return this.chart ? this.chart.options : this.config.options; } });
  LazyChart.defaults = defaults;                   // pages/enhance.js may set Chart.defaults.* before the library exists

  window.Chart = LazyChart;
})();
