/*
 * How tracking works (static pages + beacon)
 * ------------------------------------------
 * Pages are plain static files served straight from Cloudflare's cache, so the Worker never sees
 * them. Instead the tiny script /assets/js/mx-core.js (deferred, on every counted page) sends ONE
 * "navigation" beacon (t:'n') as soon as the page has loaded. The Worker records the view from that
 * beacon (IP, country, user agent and cookies come from the beacon request itself; path, referrer,
 * UTM tags and screen size come from the browser) and answers with the list of switched-off
 * calculators, which the script uses to hide them.
 * 1. Prefetch/prerender and iframe loads are not counted (the script waits / does nothing).
 * 2. Bots are stored but flagged is_bot=1; visitors that block JavaScript cannot be counted.
 * 3. View ids are random and unique, so a retried beacon can never double count.
 * 4. Visitor = cookie mx_vid (2 years). Session = cookie mx_sid (30 minutes, renewed on every page).
 *
 * Tracking must never break the site: every database call here is wrapped so a failure (for
 * example the free daily write quota being used up) only loses the statistic.
 */
import * as db from './db.js';
import * as reg from './registry.js';
import * as auth from './auth.js';
import {
  rid, parseCookies, cookie, clientIp, anonymizeIp, countryFrom, parseUA, classifyReferrer, rateLimiter,
} from './util.js';

const VID_COOKIE = 'mx_vid', SID_COOKIE = 'mx_sid';
const SESSION_S = 30 * 60;
const HEX24 = /^[a-f0-9]{24}$/;
const HEX20 = /^[a-f0-9]{20}$/;

const clip = (s, n) => (s == null ? null : String(s).slice(0, n));
const int = (v, max = 100000) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };
const isSecure = (request) => new URL(request.url).protocol === 'https:';

function storedIp(ip, mode) {
  if (mode === 'none') return null;
  if (mode === 'truncated') return anonymizeIp(ip);
  return ip;
}

const INSERT_SQL = `INSERT OR IGNORE INTO pageviews
  (id, ts, path, calc_slug, visitor_id, session_id, is_new_visitor, is_entry, ip, country, ua, browser, browser_ver, os, device, is_bot,
   referrer, ref_host, channel, utm_source, utm_medium, utm_campaign, lang, tz, screen_w, screen_h, vp_w, vp_h, js, last_seen)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

/**
 * Record a page view from a navigation beacon. Returns the cookies to set (a Set-Cookie list) and a
 * write() to run in the background, or null when the view should not be counted.
 */
async function prepareNavigation(env, request, settings, b, ip) {
  if ((settings.exclude_ips || []).includes(ip)) return null;
  const p = String(b.path || '/');
  if (!p.startsWith('/') || p.startsWith('//') || p.startsWith('/admin') || p.startsWith('/_mx')) return null;
  const path = p.split('?')[0];
  if (await auth.isAdmin(env, request)) return null;

  const ua = request.headers.get('user-agent') || '';
  const parsed = parseUA(ua);
  const url = new URL(request.url);
  const secure = isSecure(request);

  const jar = parseCookies(request.headers.get('cookie'));
  let visitorId = jar[VID_COOKIE];
  const hadVisitor = HEX24.test(visitorId || '');
  if (!hadVisitor) visitorId = rid(12);
  let sessionId = jar[SID_COOKIE];
  const hadSession = HEX20.test(sessionId || '');
  if (!hadSession) sessionId = rid(10);

  const cookies = [];
  if (!parsed.isBot) {
    if (!hadVisitor) cookies.push(cookie(VID_COOKIE, visitorId, { maxAge: 2 * 365 * 86400, secure, sameSite: 'Lax' }));
    cookies.push(cookie(SID_COOKIE, sessionId, { maxAge: SESSION_S, secure, sameSite: 'Lax' }));   // renews the 30 minutes
  }

  let q;
  try { q = new URLSearchParams(String(b.search || '').slice(0, 500)); } catch { q = new URLSearchParams(); }
  const utm = { source: clip(q.get('utm_source'), 100), medium: clip(q.get('utm_medium'), 100), campaign: clip(q.get('utm_campaign'), 150) };
  const referrer = clip(b.ref, 500) || null;
  const ref = classifyReferrer(referrer, url.host, utm);
  const now = Date.now();
  const sess = parsed.isBot ? { id: 'bot-' + rid(4), entry: true } : { id: sessionId, entry: !hadSession };
  const slug = reg.slugFromPath(path);
  const lang = clip(String(request.headers.get('accept-language') || '').split(',')[0], 20);

  // iPadOS pretends to be a Mac (touch support tells them apart); webdriver browsers are bots.
  const touch = Number(b.tp) > 1;
  let { os, device } = parsed;
  if (touch && os === 'macOS') { os = 'iOS'; device = 'tablet'; }
  const isBot = parsed.isBot || !!b.wd;
  if (isBot) device = 'bot';

  const write = () => db.run(INSERT_SQL,
    clip(b.id, 24), now, clip(path, 300), slug, visitorId, sess.id,
    hadVisitor ? 0 : 1, sess.entry ? 1 : 0, storedIp(ip, settings.ip_mode), countryFrom(request) || null, clip(ua, 400),
    parsed.browser, parsed.browserVer, os, device, isBot ? 1 : 0,
    referrer, ref.host || null, ref.channel, utm.source, utm.medium, utm.campaign, lang,
    clip(b.tz, 60), int(b.w), int(b.h), int(b.vw), int(b.vh), 1, now);

  return { cookies, write };
}

// ---------- beacon endpoint: POST /_mx/e ----------
const beaconLimit = rateLimiter(240, 60 * 1000);   // best effort, per isolate

export async function handleBeacon(env, request, ctx) {
  const headers = new Headers();
  const done = (status = 204) => new Response(null, { status, headers });
  try {
    const ip = clientIp(request);
    if (!beaconLimit(ip)) return done(429);
    const text = await request.text();
    if (text.length > 4096) return done();
    const b = JSON.parse(text);
    if (!b || !HEX24.test(b.id || '')) return done();

    if (b.t === 'n') {
      // Navigation: answer with the switched-off calculators (always, even when tracking is off), then record the view.
      const off = await reg.disabledSlugs();
      try {
        const settings = await db.getSettings();
        if (settings.tracking_enabled) {
          const slug = reg.slugFromPath(String(b.path || '').split('?')[0]);
          if (!(slug && off.includes(slug))) {        // views of switched-off calculators are not counted
            const rec = await prepareNavigation(env, request, settings, b, ip);
            if (rec) {
              rec.cookies.forEach((c) => headers.append('Set-Cookie', c));
              ctx.waitUntil(rec.write().catch((e) => console.error('track write failed:', e && e.message)));
            }
          }
        }
      } catch (e) { console.error('tracking skipped:', e && e.message); }   // never let analytics break a page
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      return new Response(JSON.stringify({ off }), { status: 200, headers });
    }

    const settings = await db.getSettings();
    if (!settings.tracking_enabled) return done();
    const now = Date.now();

    if (b.t === 'v') {
      // View restored from the browser's back/forward cache: the server never saw it, so create it here.
      if ((settings.exclude_ips || []).includes(ip)) return done();
      const ua = request.headers.get('user-agent') || '';
      const parsed = parseUA(ua);
      if (parsed.isBot) return done();
      const jar = parseCookies(request.headers.get('cookie'));
      if (!HEX24.test(jar[VID_COOKIE] || '')) return done();
      if (await auth.isAdmin(env, request)) return done();
      const p = String(b.path || '/');
      if (!p.startsWith('/') || p.startsWith('/admin') || p.startsWith('/_mx')) return done();
      const path = p.split('?')[0];
      const slug = reg.slugFromPath(path);
      if (slug && await reg.isDisabled(slug)) return done();
      const hadSession = HEX20.test(jar[SID_COOKIE] || '');
      const sessionId = hadSession ? jar[SID_COOKIE] : rid(10);
      headers.append('Set-Cookie', cookie(SID_COOKIE, sessionId, { maxAge: SESSION_S, secure: isSecure(request), sameSite: 'Lax' }));
      await db.run(`INSERT OR IGNORE INTO pageviews
        (id, ts, path, calc_slug, visitor_id, session_id, is_new_visitor, is_entry, ip, country, ua, browser, browser_ver, os, device, is_bot,
         referrer, ref_host, channel, lang, tz, screen_w, screen_h, vp_w, vp_h, js, last_seen)
        VALUES (?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,0,NULL,NULL,'internal',?,?,?,?,?,?,1,?)`,
      b.id, now, clip(path, 300), slug, jar[VID_COOKIE], sessionId, hadSession ? 0 : 1,
      storedIp(ip, settings.ip_mode), countryFrom(request) || null, clip(ua, 400), parsed.browser, parsed.browserVer, parsed.os, parsed.device,
      clip(String(request.headers.get('accept-language') || '').split(',')[0], 20), clip(b.tz, 60),
      int(b.w), int(b.h), int(b.vw), int(b.vh), now);
      return done();
    }

    // Heartbeat/end ('p') is ONE update statement, no read first.
    const d = int(b.d, 6 * 3600 * 1000) || 0;
    await db.run(`UPDATE pageviews SET js = 1,
        dur_ms = MAX(dur_ms, MIN(?, ? - ts + 5000)),
        interacted = CASE WHEN ? = 1 THEN 1 ELSE interacted END,
        last_seen = ?
      WHERE id = ?`, d, now, b.i ? 1 : 0, now, b.id);
  } catch { /* malformed beacons and database hiccups are ignored */ }
  return done();
}

// ---------- housekeeping (daily cron) ----------
export async function housekeeping() {
  const s = await db.getSettings();
  const days = Number(s.retention_days) || 0;
  if (days > 0) {
    const cut = Date.now() - days * 86400000;
    for (let i = 0; i < 40; i++) {        // deletes cost "rows written", so go in chunks and stop if the quota is hit
      const r = await db.run('DELETE FROM pageviews WHERE id IN (SELECT id FROM pageviews WHERE ts < ? LIMIT 2000)', cut);
      if ((r.meta.changes || 0) < 2000) break;
    }
  }
  await db.run('DELETE FROM admin_sessions WHERE expires_at < ?', Date.now());
  await db.run('DELETE FROM login_failures WHERE ts < ?', Date.now() - 24 * 3600 * 1000);
}
