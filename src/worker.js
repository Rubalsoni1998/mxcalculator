// Mx Calculator on Cloudflare Workers + D1.
// Pages and assets are static files served by Cloudflare itself (cached, no code). This Worker only
// runs for the paths listed under run_worker_first in wrangler.toml: / (home page), sitemap.xml, /admin and the
// tracking beacon /_mx/e (which also tells pages which calculators are switched off).
import { ADMIN_FILES } from './generated.js';
import * as db from './db.js';
import * as reg from './registry.js';
import * as auth from './auth.js';
import * as track from './track.js';
import * as stats from './stats.js';
import { clientIp, isIP, validTz, startOfDay } from './util.js';

const COMMON = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
const TEXT = 'text/plain; charset=utf-8';

function respond(body, status, type, extra = {}) {
  const h = new Headers({ 'Content-Type': type, ...COMMON });
  for (const [k, v] of Object.entries(extra)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => h.append(k, x)); else h.set(k, v);
  }
  return new Response(body, { status, headers: h });
}
const redirect = (location, status = 301) => respond(null, status, TEXT, { Location: location, 'Cache-Control': 'public, max-age=3600' });
const json = (status, obj, extra = {}) => respond(JSON.stringify(obj), status, 'application/json; charset=utf-8', { 'Cache-Control': 'no-store', ...extra });

async function readJson(request, max = 16384) {
  const raw = await request.text();
  if (raw.length > max) throw new SyntaxError('too large');
  return raw ? JSON.parse(raw) : {};
}

function filterSitemap(xml, off) {
  if (!off.length) return xml;
  const set = new Set(off);
  return xml.replace(/[ \t]*<url>[\s\S]*?<\/url>[ \t]*\n?/g, (block) => {
    const m = /calculators\/([a-z0-9-]+)\.html/.exec(block);
    return m && set.has(m[1]) ? '' : block;
  });
}

// Fetch a file from the static-assets store without conditional headers, so we always get the body.
const asset = (env, url, path) => env.ASSETS.fetch(new Request(new URL(path, url.origin).toString()));

// ------------------------------------------------------------------ admin
const ADMIN_CSP = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const ADMIN_HEADERS = { 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': ADMIN_CSP };

async function adminApi(env, ctx, request, url) {
  const route = url.pathname.slice('/admin/api/'.length);
  const q = Object.fromEntries(url.searchParams);
  const post = request.method === 'POST';
  const ip = clientIp(request);
  const J = (status, obj, extra = {}) => json(status, obj, { ...ADMIN_HEADERS, ...extra });

  if (post && !auth.sameOrigin(request)) return J(403, { error: 'Blocked: request did not come from the admin panel.' });

  if (route === 'login' && post) {
    const b = await readJson(request);
    const r = await auth.login(env, request, ip, b.username, b.password);
    return r.ok ? J(200, { ok: true }, { 'Set-Cookie': r.setCookie }) : J(r.status, { error: r.error });
  }
  if (!(await auth.isAdmin(env, request))) return J(401, { error: 'Not signed in.' });

  if (route === 'logout' && post) return J(200, { ok: true }, { 'Set-Cookie': await auth.logout(env, request) });
  if (route === 'me') return J(200, { user: auth.adminUser(env), passwordFromEnv: true });

  // ---- calculators ----
  if (route === 'calculators' && !post) {
    const [usage, off] = await Promise.all([stats.calculatorUsage(30), reg.disabledSlugs()]);
    const offSet = new Set(off);
    const items = reg.scan().map((c) => ({ ...c, enabled: !offSet.has(c.slug), views30: (usage[c.slug] || {}).views || 0, visitors30: (usage[c.slug] || {}).visitors || 0 }));
    const categories = [...new Set(items.map((i) => i.category))];
    return J(200, { items, categories, total: items.length, disabled: items.filter((i) => !i.enabled).length });
  }
  if (route === 'calculators' && post) {
    const b = await readJson(request);
    if (!Array.isArray(b.slugs) || typeof b.enabled !== 'boolean') return J(400, { error: 'slugs[] and enabled are required.' });
    const n = await reg.setEnabled(b.slugs.map(String).slice(0, 500), b.enabled);
    return J(200, { ok: true, changed: n, disabled: await reg.disabledSlugs() });
  }

  // ---- analytics ----
  if (route === 'overview') return J(200, await stats.overview(q));
  if (route === 'live') return J(200, await stats.live(q));
  if (route === 'visitors') return J(200, await stats.visitors(q));
  if (route.startsWith('visitor/')) {
    const d = await stats.visitorDetail(route.slice(8));
    return d ? J(200, d) : J(404, { error: 'Visitor not found.' });
  }
  if (route === 'export.csv') {
    const c = await stats.csv(q);
    return respond(c.body, 200, 'text/csv; charset=utf-8', { ...ADMIN_HEADERS, 'Content-Disposition': `attachment; filename="${c.name}"`, 'Cache-Control': 'no-store' });
  }

  // ---- settings ----
  if (route === 'settings' && !post) {
    const [settings, dbRows, auditRows] = await Promise.all([
      db.getSettings(), stats.storedRows(), db.all('SELECT ts, action, detail FROM audit ORDER BY id DESC LIMIT 25')]);
    return J(200, { settings, yourIp: ip, passwordFromEnv: true, dbRows, audit: auditRows });
  }
  if (route === 'settings' && post) {
    const b = await readJson(request);
    const patch = {};
    if ('tracking_enabled' in b) patch.tracking_enabled = !!b.tracking_enabled;
    if ('ip_mode' in b) { if (!['full', 'truncated', 'none'].includes(b.ip_mode)) return J(400, { error: 'Invalid IP mode.' }); patch.ip_mode = b.ip_mode; }
    if ('exclude_ips' in b) {
      const list = (Array.isArray(b.exclude_ips) ? b.exclude_ips : String(b.exclude_ips).split(/[\s,]+/)).map((s) => String(s).trim()).filter(Boolean);
      const bad = list.find((x) => !isIP(x));
      if (bad) return J(400, { error: `"${bad}" is not a valid IP address.` });
      patch.exclude_ips = [...new Set(list)].slice(0, 100);
    }
    if ('retention_days' in b) {
      const n = parseInt(b.retention_days, 10);
      if (!(n >= 0 && n <= 3650)) return J(400, { error: 'Retention must be 0-3650 days.' });
      patch.retention_days = n;
    }
    if ('report_tz' in b) patch.report_tz = b.report_tz ? validTz(String(b.report_tz)) : '';
    const s = await db.saveSettings(patch);
    await db.audit('settings', Object.keys(patch).join(', '));
    return J(200, { ok: true, settings: s });
  }
  if (route === 'password' && post) {
    return J(400, { error: 'The password is the ADMIN_PASSWORD secret. Change it with: npx wrangler secret put ADMIN_PASSWORD' });
  }
  if (route === 'purge' && post) {
    const b = await readJson(request);
    let where;
    let args = [];
    if (b.mode === 'bots') where = 'is_bot = 1';
    else if (b.mode === 'all') where = '1=1';
    else if (b.mode === 'before' && /^\d{4}-\d{2}-\d{2}$/.test(b.before || '')) { where = 'ts < ?'; args = [startOfDay(b.before, validTz(b.tz || 'UTC'))]; }
    else return J(400, { error: 'Invalid purge request.' });
    // Deleting is chunked: every deleted row counts toward D1's daily "rows written" allowance.
    let n = 0;
    for (let i = 0; i < 40; i++) {
      const r = await db.run(`DELETE FROM pageviews WHERE id IN (SELECT id FROM pageviews WHERE ${where} LIMIT 2000)`, ...args);
      const c = r.meta.changes || 0;
      n += c;
      if (c < 2000) break;
    }
    db.cache.clear();
    await db.audit('purge', `${b.mode}${b.before ? ' before ' + b.before : ''}: ${n} rows`);
    return J(200, { ok: true, deleted: n });
  }
  return J(404, { error: 'Unknown endpoint.' });
}

async function adminRoutes(env, ctx, request, url) {
  const p = url.pathname;
  if (p.startsWith('/admin/api/')) {
    try { return await adminApi(env, ctx, request, url); }
    catch (e) {
      console.error('admin api error:', e);
      const bad = e instanceof SyntaxError;
      return json(bad ? 400 : 500, { error: bad ? 'Bad request.' : 'Server error.' }, ADMIN_HEADERS);
    }
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return respond('Method not allowed', 405, TEXT, { ...ADMIN_HEADERS, Allow: 'GET, HEAD' });
  if (p === '/admin' || p === '/admin/' || p === '/admin/index.html' || p === '/admin/login.html') {
    let signedIn = false;
    try { signedIn = await auth.isAdmin(env, request); } catch { /* treat as signed out */ }
    const f = ADMIN_FILES[signedIn ? 'index.html' : 'login.html'];
    return respond(f.body, 200, f.type, { ...ADMIN_HEADERS, 'Cache-Control': 'no-store' });
  }
  const name = p.slice('/admin/'.length);
  const f = /^[\w.-]+$/.test(name) && !name.endsWith('.html') ? ADMIN_FILES[name] : null;
  if (!f) return respond('Not found', 404, TEXT, ADMIN_HEADERS);
  return respond(f.body, 200, f.type, { ...ADMIN_HEADERS, 'Cache-Control': 'no-cache' });
}

// ------------------------------------------------------------------ main handler
async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const p = url.pathname;

  if (p === '/_mx/health') return respond('ok', 200, TEXT, { 'Cache-Control': 'no-store' });
  if (p === '/_mx/e') {
    if (request.method !== 'POST') return respond('Method not allowed', 405, TEXT, { Allow: 'POST' });
    return track.handleBeacon(env, request, ctx);
  }
  if (p === '/admin' || p.startsWith('/admin/')) return adminRoutes(env, ctx, request, url);

  if (request.method !== 'GET' && request.method !== 'HEAD') return respond('Method not allowed', 405, TEXT, { Allow: 'GET, HEAD' });

  // www -> apex for the few paths that reach the Worker (page redirects live in public/_redirects; for the pages themselves add the
  // www redirect rule in the Cloudflare dashboard, see README)
  if (url.hostname.startsWith('www.')) { url.hostname = url.hostname.slice(4); return redirect(url.toString()); }

  // Home page: with html_handling = "none" the assets store does not serve index.html for "/".
  if (p === '/') {
    const a = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin).toString(), request));
    return a;
  }

  if (p === '/sitemap.xml') {
    const a = await asset(env, url, '/sitemap.xml');
    if (!a.ok) return a;
    return respond(filterSitemap(await a.text(), await reg.disabledSlugs()), 200, 'application/xml; charset=utf-8', { 'Cache-Control': 'no-cache' });
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env, ctx) {
    db.init(env);
    try { return await handle(request, env, ctx); }
    catch (e) {
      console.error('request error:', e);
      return respond('Server error', 500, TEXT, { 'Cache-Control': 'no-store' });
    }
  },
  async scheduled(event, env, ctx) {
    db.init(env);
    ctx.waitUntil(track.housekeeping());
  },
};
