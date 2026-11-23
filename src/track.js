/*
 * How tracking stays exact (same rules as the Node version)
 * ---------------------------------------------------------
 * 1. The Worker records a page view the moment it serves an HTML page, so visitors who block
 *    JavaScript or leave instantly are still counted. It skips prefetch/prerender, non-navigations
 *    (iframes, fetches), the admin and excluded IPs. Bots are stored but flagged is_bot=1.
 * 2. The browser script then confirms the view (js=1) and reports screen size, time zone, visible
 *    time and whether a control was used.
 * 3. Page-view ids are random and unique, so a retried beacon can never double count.
 * 4. Visitor = cookie mx_vid (2 years). Session = cookie mx_sid (30 minutes, renewed on every page).
 *
 * Tracking must never break the site: every database call here is wrapped by the caller so a
 * failure (for example the free daily write quota being used up) only loses the statistic.
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

// Is this request a real page navigation worth recording?
export async function shouldTrackNavigation(env, request) {
  const s = await db.getSettings();
  if (!s.tracking_enabled) return false;
  if (request.method !== 'GET') return false;
  const h = request.headers;
  const purpose = String(h.get('sec-purpose') || h.get('purpose') || h.get('x-moz') || '').toLowerCase();
  if (purpose.includes('prefetch') || purpose.includes('prerender')) return false;
  const dest = h.get('sec-fetch-dest');
  if (dest && dest !== 'document') return false;
  if (await auth.isAdmin(env, request)) return false;
  return true;
}

const INSERT_SQL = `INSERT OR IGNORE INTO pageviews
  (id, ts, path, calc_slug, visitor_id, session_id, is_new_visitor, is_entry, ip, country, ua, browser, browser_ver, os, device, is_bot,
   referrer, ref_host, channel, utm_source, utm_medium, utm_campaign, lang, tz, screen_w, screen_h, vp_w, vp_h, js, last_seen)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

/**
 * Prepare a page-view record for an HTML request. Nothing is written yet: the caller runs
 * `write()` in the background (ctx.waitUntil) so the page is never delayed by the database.
 * Returns { pvId, cookies[], write } - pvId is null when the view is not worth confirming (bot).
 */
export async function prepareNavigation(request, url) {
  const settings = await db.getSettings();
  const ip = clientIp(request);
  if ((settings.exclude_ips || []).includes(ip)) return { pvId: null, cookies: [] };
  const ua = request.headers.get('user-agent') || '';
  const parsed = parseUA(ua);
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

  const q = url.searchParams;
  const utm = { source: clip(q.get('utm_source'), 100), medium: clip(q.get('utm_medium'), 100), campaign: clip(q.get('utm_campaign'), 150) };
  const ref = classifyReferrer(request.headers.get('referer'), url.host, utm);
  const now = Date.now();
  const pvId = rid(12);
  const sess = parsed.isBot ? { id: 'bot-' + rid(4), entry: true } : { id: sessionId, entry: !hadSession };
  const country = countryFrom(request) || null;
  const lang = clip(String(request.headers.get('accept-language') || '').split(',')[0], 20);
  const slug = reg.slugFromPath(url.pathname);

  const write = () => db.run(INSERT_SQL,
    pvId, now, clip(url.pathname, 300), slug, visitorId, sess.id,
    hadVisitor ? 0 : 1, sess.entry ? 1 : 0, storedIp(ip, settings.ip_mode), country, clip(ua, 400),
    parsed.browser, parsed.browserVer, parsed.os, parsed.device, parsed.isBot ? 1 : 0,
    clip(request.headers.get('referer'), 500), ref.host || null, ref.channel, utm.source, utm.medium, utm.campaign, lang,
    null, null, null, null, null, 0, now);

  return { pvId: parsed.isBot ? null : pvId, cookies, write };
}

// ---------- beacon endpoint: POST /_mx/e ----------
const beaconLimit = rateLimiter(240, 60 * 1000);   // best effort, per isolate

export async function handleBeacon(env, request, ctx) {
  const headers = new Headers();
  const done = (status = 204) => new Response(null, { status, headers });
  try {
    const ip = clientIp(request);
    if (!beaconLimit(ip)) return done(429);
    const settings = await db.getSettings();
    if (!settings.tracking_enabled) return done();
    const text = await request.text();
    if (text.length > 4096) return done();
    const b = JSON.parse(text);
    if (!b || !HEX24.test(b.id || '')) return done();
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

    // Hello ('h') and heartbeat/end ('p') are each ONE update statement, no read first.
    const wd = b.wd ? 1 : 0;
    const touch = Number(b.tp) > 1 ? 1 : 0;       // iPadOS pretends to be a Mac; touch support tells them apart
    if (b.t === 'h') {
      await db.run(`UPDATE pageviews SET js = 1, tz = ?, screen_w = ?, screen_h = ?, vp_w = ?, vp_h = ?,
          device = CASE WHEN is_bot = 1 OR ? = 1 THEN 'bot' WHEN os = 'macOS' AND ? = 1 THEN 'tablet' ELSE device END,
          os = CASE WHEN os = 'macOS' AND ? = 1 THEN 'iOS' ELSE os END,
          is_bot = CASE WHEN ? = 1 THEN 1 ELSE is_bot END,
          last_seen = ?
        WHERE id = ?`,
      clip(b.tz, 60), int(b.w), int(b.h), int(b.vw), int(b.vh), wd, touch, touch, wd, now, b.id);
    } else {
      const d = int(b.d, 6 * 3600 * 1000) || 0;
      await db.run(`UPDATE pageviews SET js = 1,
          dur_ms = MAX(dur_ms, MIN(?, ? - ts + 5000)),
          interacted = CASE WHEN ? = 1 THEN 1 ELSE interacted END,
          last_seen = ?
        WHERE id = ?`, d, now, b.i ? 1 : 0, now, b.id);
    }
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
