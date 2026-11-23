// Read-side analytics. Every number is a plain SQL count over the raw page-view rows, so any figure
// can be audited against the Visitors tab or the CSV export. Same output shapes as the Node version.
//
// D1 notes: independent queries are sent together with batch() (one round trip), and the free plan
// allows 50 queries per Worker invocation, so nothing here loops over rows issuing queries.
import * as db from './db.js';
import * as reg from './registry.js';
import { validTz, startOfDay, addDays, todayIn } from './util.js';

const LIVE_WINDOW_MS = 90 * 1000;
const LIVE_LOOKBACK_MS = 3 * 3600 * 1000;      // lets the ts index bound the "active now" scans

// `a` is an optional table alias prefix such as 'p.'
function trafficSql(mode, a = '') {
  if (mode === 'all') return '1=1';
  if (mode === 'verified') return `${a}is_bot = 0 AND ${a}js = 1`;
  return `${a}is_bot = 0`;
}

export async function parseRange(q) {
  const settings = await db.getSettings();
  const tz = validTz(q.tz || settings.report_tz || 'UTC');
  const today = todayIn(tz);
  let from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') ? q.from : today;
  let to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || '') ? q.to : today;
  if (to < from) [from, to] = [to, from];
  if (addDays(from, 366) < to) from = addDays(to, -365);
  const start = startOfDay(from, tz);
  const end = startOfDay(addDays(to, 1), tz);
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const mode = ['humans', 'verified', 'all'].includes(q.traffic) ? q.traffic : 'humans';
  return { tz, from, to, start, end, days, mode, today };
}

async function kpis(start, end, mode) {
  const f = trafficSql(mode);
  const [a, s] = await Promise.all([
    db.get(`SELECT COUNT(*) pv, COUNT(DISTINCT visitor_id) visitors, COUNT(DISTINCT session_id) sessions,
        COUNT(DISTINCT CASE WHEN is_new_visitor = 1 THEN visitor_id END) new_visitors,
        SUM(js) confirmed, SUM(interacted) interacted,
        AVG(CASE WHEN dur_ms > 0 THEN dur_ms END) avg_dur
      FROM pageviews WHERE ts >= ? AND ts < ? AND ${f}`, start, end),
    db.get(`SELECT COUNT(*) n, SUM(CASE WHEN c = 1 THEN 1 ELSE 0 END) bounced, AVG(d) avg_sess_dur FROM (
        SELECT session_id, COUNT(*) c, SUM(dur_ms) d FROM pageviews WHERE ts >= ? AND ts < ? AND ${f} GROUP BY session_id)`, start, end),
  ]);
  const sessions = a.sessions || 0;
  return {
    pageviews: a.pv || 0,
    visitors: a.visitors || 0,
    sessions,
    newVisitors: a.new_visitors || 0,
    returningVisitors: Math.max(0, (a.visitors || 0) - (a.new_visitors || 0)),
    verifiedViews: a.confirmed || 0,
    interactedViews: a.interacted || 0,
    avgViewMs: Math.round(a.avg_dur || 0),
    avgSessionMs: Math.round(s.avg_sess_dur || 0),
    pagesPerSession: sessions ? +((a.pv || 0) / sessions).toFixed(2) : 0,
    bounceRate: sessions ? +(((s.bounced || 0) / sessions) * 100).toFixed(1) : 0,
  };
}

// One query for the whole chart: the bucket edges go in as a VALUES table (numbers we computed, not user input).
async function series(r) {
  const hourly = r.days <= 2;
  const edges = [];
  if (hourly) for (let t = r.start; t < r.end; t += 3600000) edges.push(t);
  else for (let d = r.from; d <= r.to; d = addDays(d, 1)) edges.push(startOfDay(d, r.tz));
  edges.push(r.end);
  const values = [];
  for (let i = 0; i < edges.length - 1; i++) values.push(`(${i},${Math.trunc(edges[i])},${Math.trunc(edges[i + 1])})`);
  const rows = await db.all(`WITH edges(i, s, e) AS (VALUES ${values.join(',')})
    SELECT edges.i i, COUNT(p.id) pv, COUNT(DISTINCT p.visitor_id) v, COUNT(DISTINCT p.session_id) s
    FROM edges LEFT JOIN pageviews p ON p.ts >= edges.s AND p.ts < edges.e AND ${trafficSql(r.mode, 'p.')}
    GROUP BY edges.i ORDER BY edges.i`);
  const byI = new Map(rows.map((x) => [x.i, x]));
  const points = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const row = byI.get(i) || { pv: 0, v: 0, s: 0 };
    points.push({ t: edges[i], pageviews: row.pv, visitors: row.v, sessions: row.s });
  }
  return { granularity: hourly ? 'hour' : 'day', points };
}

async function breakdowns(r) {
  const f = trafficSql(r.mode);
  const base = `FROM pageviews WHERE ts >= ? AND ts < ? AND ${f}`;
  const titles = new Map(reg.scan().map((c) => [c.slug, c.title]));
  const off = new Set(await reg.disabledSlugs());
  const S = (sql) => db.stmt(sql, r.start, r.end);
  const res = await db.batch([
    S(`SELECT path k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors, AVG(CASE WHEN dur_ms>0 THEN dur_ms END) avgMs ${base} GROUP BY path ORDER BY views DESC LIMIT 25`),
    S(`SELECT calc_slug k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors, SUM(interacted) used, AVG(CASE WHEN dur_ms>0 THEN dur_ms END) avgMs ${base} AND calc_slug IS NOT NULL GROUP BY calc_slug ORDER BY views DESC LIMIT 60`),
    S(`SELECT path k, COUNT(*) sessions ${base} AND is_entry = 1 GROUP BY path ORDER BY sessions DESC LIMIT 15`),
    S(`SELECT channel k, COUNT(*) sessions ${base} AND is_entry = 1 GROUP BY channel ORDER BY sessions DESC`),
    S(`SELECT ref_host k, COUNT(*) sessions, COUNT(DISTINCT visitor_id) visitors ${base} AND is_entry = 1 AND ref_host IS NOT NULL GROUP BY ref_host ORDER BY sessions DESC LIMIT 20`),
    S(`SELECT COALESCE(utm_campaign, '(none)') k, COALESCE(utm_source, '') source, COALESCE(utm_medium, '') medium, COUNT(*) sessions ${base} AND is_entry = 1 AND (utm_campaign IS NOT NULL OR utm_source IS NOT NULL) GROUP BY utm_campaign, utm_source, utm_medium ORDER BY sessions DESC LIMIT 15`),
    S(`SELECT COALESCE(country, 'Unknown') k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors ${base} GROUP BY country ORDER BY visitors DESC LIMIT 25`),
    S(`SELECT browser k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors ${base} GROUP BY browser ORDER BY visitors DESC LIMIT 12`),
    S(`SELECT os k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors ${base} GROUP BY os ORDER BY visitors DESC LIMIT 12`),
    S(`SELECT device k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors ${base} GROUP BY device ORDER BY visitors DESC`),
    S(`SELECT COALESCE(lang, 'Unknown') k, COUNT(DISTINCT visitor_id) visitors ${base} GROUP BY lang ORDER BY visitors DESC LIMIT 10`),
    S(`SELECT screen_w || 'x' || screen_h k, COUNT(DISTINCT visitor_id) visitors ${base} AND screen_w IS NOT NULL AND screen_w > 0 GROUP BY screen_w, screen_h ORDER BY visitors DESC LIMIT 10`),
    S(`SELECT tz k, COUNT(DISTINCT visitor_id) visitors ${base} AND tz IS NOT NULL GROUP BY tz ORDER BY visitors DESC LIMIT 10`),
    S(`SELECT browser k, COUNT(*) views FROM pageviews WHERE ts >= ? AND ts < ? AND is_bot = 1 GROUP BY browser ORDER BY views DESC LIMIT 15`),
  ]);
  const [pages, calcs, entry, channels, referrers, campaigns, countries, browsers, os, devices, languages, screens, timezones, bots] = res;
  const calculators = calcs.map((x) => ({ ...x, title: titles.get(x.k) || x.k, disabled: off.has(x.k) }));
  return { pages, calculators, entry, channels, referrers, campaigns, countries, browsers, os, devices, languages, screens, timezones, bots };
}

export async function overview(q) {
  const r = await parseRange(q);
  const span = r.end - r.start;
  const [prev, cur, botViews, ser, bd, totals] = await Promise.all([
    kpis(r.start - span, r.start, r.mode),
    kpis(r.start, r.end, r.mode),
    db.get('SELECT COUNT(*) n FROM pageviews WHERE ts >= ? AND ts < ? AND is_bot = 1', r.start, r.end),
    series(r),
    breakdowns(r),
    allTimeTotals(),
  ]);
  return {
    range: { from: r.from, to: r.to, tz: r.tz, days: r.days, mode: r.mode, start: r.start, end: r.end },
    kpis: cur, previous: prev, botViews: botViews.n, series: ser, breakdowns: bd, totals,
  };
}

// Counting every row on each page load would read the whole table, so these two are cached for a few minutes.
export async function allTimeTotals() {
  return db.cache.get('totals', 5 * 60 * 1000, async () => ({
    allTimeViews: (await db.get('SELECT COUNT(*) n FROM pageviews WHERE is_bot = 0')).n,
    firstRecordedAt: ((await db.get('SELECT MIN(ts) t FROM pageviews')) || {}).t || null,
  }));
}
export async function storedRows() {
  return db.cache.get('rows', 5 * 60 * 1000, async () => (await db.get('SELECT COUNT(*) n FROM pageviews')).n);
}

export async function live(q) {
  const now = Date.now();
  const f = trafficSql(['humans', 'verified', 'all'].includes(q.traffic) ? q.traffic : 'humans');
  const lookback = now - LIVE_LOOKBACK_MS;
  const [a, l, p, feed] = await db.batch([
    db.stmt(`SELECT COUNT(DISTINCT visitor_id) n FROM pageviews WHERE ts >= ? AND last_seen >= ? AND ${f}`, lookback, now - LIVE_WINDOW_MS),
    db.stmt(`SELECT COUNT(DISTINCT visitor_id) n FROM pageviews WHERE ts >= ? AND last_seen >= ? AND ${f}`, lookback, now - 30 * 60000),
    db.stmt(`SELECT path k, COUNT(DISTINCT visitor_id) visitors FROM pageviews WHERE ts >= ? AND last_seen >= ? AND ${f} GROUP BY path ORDER BY visitors DESC LIMIT 10`, lookback, now - LIVE_WINDOW_MS),
    db.stmt(`SELECT id, ts, path, visitor_id, ip, country, browser, os, device, channel, ref_host, js, dur_ms, interacted, is_bot, last_seen
      FROM pageviews WHERE ${f} ORDER BY ts DESC LIMIT 40`),
  ]);
  return { now, active: a[0].n, last30: l[0].n, pages: p, feed: feed.map((x) => ({ ...x, active: x.last_seen >= now - LIVE_WINDOW_MS })) };
}

export async function visitors(q) {
  const r = await parseRange(q);
  const f = trafficSql(r.mode);
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const per = 40;
  let where = `ts >= ? AND ts < ? AND ${f}`;
  const args = [r.start, r.end];
  const term = String(q.q || '').trim().slice(0, 80);
  if (term) {
    where += ' AND (ip LIKE ? OR visitor_id LIKE ? OR path LIKE ? OR ref_host LIKE ? OR country = ? OR browser LIKE ?)';
    const like = `%${term.replace(/[%_]/g, '')}%`;
    args.push(like, term.toLowerCase() + '%', like, like, term.toUpperCase(), like);
  }
  const [totalRow, rows] = await Promise.all([
    db.get(`SELECT COUNT(DISTINCT visitor_id) n FROM pageviews WHERE ${where}`, ...args),
    db.all(`SELECT visitor_id, MIN(ts) first_ts, MAX(ts) last_ts, COUNT(*) views, COUNT(DISTINCT session_id) sessions,
        SUM(dur_ms) dur, SUM(interacted) used
      FROM pageviews WHERE ${where} GROUP BY visitor_id ORDER BY last_ts DESC LIMIT ? OFFSET ?`, ...args, per, (page - 1) * per),
  ]);
  const total = totalRow.n;
  if (rows.length) {
    // Three set-based queries for the whole page instead of three per visitor (the free plan allows 50 queries per request).
    const ids = rows.map((v) => v.visitor_id);
    const ph = ids.map(() => '?').join(',');
    const latestSql = (agg) => `SELECT p.visitor_id, p.ip, p.country, p.browser, p.browser_ver, p.os, p.device, p.channel, p.ref_host, p.is_bot, p.js, p.tz, p.path, p.is_new_visitor
      FROM pageviews p JOIN (SELECT visitor_id, ${agg}(ts) t FROM pageviews WHERE visitor_id IN (${ph}) GROUP BY visitor_id) m
      ON p.visitor_id = m.visitor_id AND p.ts = m.t WHERE p.visitor_id IN (${ph})`;
    const [latest, first, ever] = await db.batch([
      db.stmt(latestSql('MAX'), ...ids, ...ids),
      db.stmt(latestSql('MIN'), ...ids, ...ids),
      db.stmt(`SELECT visitor_id, COUNT(*) n, MIN(ts) t FROM pageviews WHERE visitor_id IN (${ph}) GROUP BY visitor_id`, ...ids),
    ]);
    const firstOf = (list) => { const m = new Map(); for (const x of list) if (!m.has(x.visitor_id)) m.set(x.visitor_id, x); return m; };
    const L = firstOf(latest), F = firstOf(first), E = new Map(ever.map((x) => [x.visitor_id, x]));
    for (const v of rows) {
      const l = L.get(v.visitor_id) || {};
      Object.assign(v, { ip: l.ip, country: l.country, browser: l.browser, browser_ver: l.browser_ver, os: l.os, device: l.device, channel: l.channel, ref_host: l.ref_host, is_bot: l.is_bot, js: l.js, tz: l.tz });
      const fr = F.get(v.visitor_id) || {};
      const te = E.get(v.visitor_id) || {};
      v.firstEverTs = te.t; v.viewsEver = te.n;
      v.landing = fr.path; v.firstChannel = fr.channel; v.firstRef = fr.ref_host;
    }
  }
  return { page, per, total, pages: Math.max(1, Math.ceil(total / per)), rows };
}

export async function visitorDetail(id) {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const rows = await db.all(`SELECT id, ts, path, session_id, is_entry, ip, country, browser, browser_ver, os, device, is_bot, referrer, ref_host, channel,
      utm_source, utm_medium, utm_campaign, lang, tz, screen_w, screen_h, vp_w, vp_h, js, dur_ms, interacted
    FROM pageviews WHERE visitor_id = ? ORDER BY ts DESC LIMIT 1000`, id);
  return rows.length ? { id, rows } : null;
}

export async function csv(q) {
  const r = await parseRange(q);
  const f = trafficSql(r.mode);
  const cols = ['ts_utc', 'path', 'visitor_id', 'session_id', 'is_new_visitor', 'is_entry', 'ip', 'country', 'browser', 'browser_ver', 'os', 'device', 'is_bot',
    'channel', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'lang', 'tz', 'screen_w', 'screen_h', 'js', 'duration_seconds', 'interacted'];
  const esc = (v) => {
    if (v == null) return '';
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;          // block spreadsheet formula injection
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = await db.all(`SELECT * FROM pageviews WHERE ts >= ? AND ts < ? AND ${f} ORDER BY ts ASC`, r.start, r.end);
  const out = [cols.join(',')];
  for (const x of rows) {
    out.push([new Date(x.ts).toISOString(), x.path, x.visitor_id, x.session_id, x.is_new_visitor, x.is_entry, x.ip, x.country, x.browser, x.browser_ver, x.os, x.device,
      x.is_bot, x.channel, x.referrer, x.utm_source, x.utm_medium, x.utm_campaign, x.lang, x.tz, x.screen_w, x.screen_h, x.js, +(x.dur_ms / 1000).toFixed(1), x.interacted].map(esc).join(','));
  }
  return { name: `visits_${r.from}_to_${r.to}.csv`, body: out.join('\n') + '\n' };
}

// views per calculator over the last N days (for the Calculators tab)
export async function calculatorUsage(days = 30) {
  const since = Date.now() - days * 86400000;
  const out = {};
  for (const x of await db.all(`SELECT calc_slug k, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors, MAX(ts) lastTs FROM pageviews
    WHERE ts >= ? AND is_bot = 0 AND calc_slug IS NOT NULL GROUP BY calc_slug`, since)) out[x.k] = x;
  return out;
}
