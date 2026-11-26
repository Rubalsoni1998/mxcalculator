// Local smoke test: runs the real Worker code against a SQLite-backed stand-in for D1 and a
// folder-backed stand-in for static assets. Not a replacement for `wrangler dev`, but it catches
// SQL mistakes, routing mistakes and permission mistakes without needing a Cloudflare account.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(fs.readFileSync(path.join(root, 'migrations/0001_init.sql'), 'utf8'));

const bound = (sql, args) => ({
  sql, args,
  async all() { return { results: sqlite.prepare(sql).all(...args).map((r) => ({ ...r })), meta: {} }; },
  async first() { const r = sqlite.prepare(sql).get(...args); return r ? { ...r } : null; },
  async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
});
const DB = {
  prepare: (sql) => ({ bind: (...args) => bound(sql, args) }),
  async batch(list) {
    sqlite.exec('BEGIN');
    try {
      const out = [];
      for (const s of list) {
        if (/^\s*(SELECT|WITH)/i.test(s.sql)) out.push(await s.all()); else out.push(await s.run());
      }
      sqlite.exec('COMMIT');
      return out;
    } catch (e) { sqlite.exec('ROLLBACK'); throw e; }
  },
};
const PUB = path.join(root, 'dist');          // what Cloudflare serves (built by `npm run build`)
if (!fs.existsSync(PUB)) throw new Error('dist/ is missing - run `npm run build` first');
const ASSETS = {
  async fetch(req) {
    const u = new URL(typeof req === 'string' ? req : req.url);
    const f = path.join(PUB, decodeURIComponent(u.pathname));
    if (f.startsWith(PUB) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      const ext = path.extname(f);
      const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.xml' ? 'application/xml' : 'application/octet-stream';
      return new Response(fs.readFileSync(f), { status: 200, headers: { 'Content-Type': type } });
    }
    return new Response(fs.readFileSync(path.join(PUB, '404.html')), { status: 404, headers: { 'Content-Type': 'text/html' } });
  },
};

const worker = (await import('../src/worker.js')).default;
const env = { DB, ASSETS, ADMIN_USER: 'admin', ADMIN_PASSWORD: 'correct horse battery staple' };
let pending = [];
const ctx = { waitUntil: (p) => pending.push(p) };
const call = async (url, init = {}) => {
  const r = await worker.fetch(new Request('https://mxcalculator.test' + url, init), env, ctx);
  await Promise.all(pending); pending = [];
  return r;
};

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); } };
const cookiesOf = (r) => r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const nav = (extra = {}) => ({ headers: { 'user-agent': CHROME, 'sec-fetch-dest': 'document', 'cf-connecting-ip': '203.0.113.9', 'cf-ipcountry': 'IN', ...extra } });

console.log('Static build (dist/)');
const dist = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');
let html = dist('calculators/bmi-calculator.html');
ok('calculator page: CSS inlined, no render-blocking stylesheet links', html.includes('<style>') && !/rel="stylesheet"/.test(html));
ok('calculator page: Google Analytics loads after the page, not in <head> as a blocking tag', !html.includes('<script async src="https://www.googletagmanager.com') && html.includes("addEventListener('load'"));
ok('calculator page: fingerprinted JS + tracking script', /src="\/assets\/js\/mx-core\.[a-f0-9]{8}\.js"/.test(html) && /assets\/js\/enhance\.[a-f0-9]{8}\.js/.test(html));
ok('home page gets the tracking script too', /mx-core\.[a-f0-9]{8}\.js/.test(dist('index.html')));
ok('legal/404 pages are not tracked', !dist('privacy.html').includes('mx-core') && !dist('404.html').includes('mx-core'));
const redirects = dist('_redirects');
ok('_redirects: extensionless calculator URLs + /index.html', redirects.includes('/calculators/bmi-calculator /calculators/bmi-calculator.html 301') && redirects.includes('/index.html / 301'));
const wr = fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
ok('Worker does not run for pages (only sitemap, admin, beacon)', !/"\/calculators\/\*"/.test(wr) && !/"\/"/.test(wr) && wr.includes('"/_mx/*"') && wr.includes('directory = "./dist"'));

console.log('Navigation beacons (page views)');
const beacon = (o, extra = {}) => call('/_mx/e', { method: 'POST', body: JSON.stringify(o), headers: { 'user-agent': CHROME, 'cf-connecting-ip': '203.0.113.9', 'cf-ipcountry': 'IN', ...extra } });
const nb = (id, p, o = {}, extra = {}) => beacon({ t: 'n', id, path: p, search: '', ref: '', tz: 'Asia/Kolkata', w: 1920, h: 1080, vw: 1200, vh: 800, tp: 0, wd: 0, d: 0, ...o }, extra);
const count = () => sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n;
const get = (id) => sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(id);
const ID1 = '1'.repeat(24), pv2 = [null, '2'.repeat(24)];
let r = await nb(ID1, '/');
ok('navigation beacon -> 200 JSON with the switched-off list', r.status === 200 && r.headers.get('cache-control') === 'no-store' && Array.isArray((await r.json()).off));
const jar = cookiesOf(r);
ok('visitor + session cookies set', /mx_vid=/.test(jar) && /mx_sid=/.test(jar));
let row = get(ID1);
ok('page view stored with country/IP/entry/screen/tz', row && row.country === 'IN' && row.ip === '203.0.113.9' && row.is_entry === 1 && row.is_new_visitor === 1 && row.js === 1 && row.screen_w === 1920 && row.tz === 'Asia/Kolkata' && row.path === '/' && row.channel === 'direct');
r = await nb(pv2[1], '/calculators/bmi-calculator.html', { ref: 'https://www.google.com/', search: '?utm_source=news&utm_medium=email' }, { cookie: jar });
row = get(pv2[1]);
ok('calculator view: same visitor, same session, not an entry, slug set', row.is_entry === 0 && row.calc_slug === 'bmi-calculator' && row.is_new_visitor === 0 && row.visitor_id === get(ID1).visitor_id && row.session_id === get(ID1).session_id);
ok('UTM tags stored and win over the referrer', row.utm_source === 'news' && row.utm_medium === 'email' && row.channel === 'campaign' && row.referrer === 'https://www.google.com/');
r = await nb('3'.repeat(24), '/states/texas.html', { ref: 'https://www.google.com/search?q=x' }, { cookie: jar });
ok('search referrer classified', get('3'.repeat(24)).channel === 'search' && get('3'.repeat(24)).ref_host === 'google.com');
r = await nb('4'.repeat(24), '/calculators/loan-calculator.html', { ref: 'https://mxcalculator.test/' }, { cookie: jar });
ok('internal navigation classified', get('4'.repeat(24)).channel === 'internal');
await nb(ID1, '/');
ok('same view id never double counts', count() === 4);
r = await nb('5'.repeat(24), '/calculators/loan-calculator.html', {}, { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' });
ok('bot stored flagged is_bot=1, no cookies', get('5'.repeat(24)).is_bot === 1 && r.headers.getSetCookie().length === 0);
await nb('6'.repeat(24), '/', { wd: 1 });
ok('webdriver browser is a bot', get('6'.repeat(24)).is_bot === 1 && get('6'.repeat(24)).device === 'bot');
await nb('7'.repeat(24), '/', { tp: 5 }, { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' });
ok('iPad posing as a Mac is detected via touch points', get('7'.repeat(24)).os === 'iOS' && get('7'.repeat(24)).device === 'tablet');
const before0 = count();
await nb('8'.repeat(24), '/admin/x'); await nb('9'.repeat(24), '//evil.example/'); await nb('a1'.repeat(12), 'calculators/x.html');
ok('admin / protocol-relative / relative paths are not counted', count() === before0);

console.log('Heartbeats + bfcache');
await new Promise((res) => setTimeout(res, 30));
await beacon({ t: 'p', id: pv2[1], d: 20, i: 1 });
row = get(pv2[1]);
ok('heartbeat stores duration (capped by elapsed time) + interaction', row.interacted === 1 && row.dur_ms > 0 && row.dur_ms <= 20);
r = await beacon({ t: 'p', id: 'b'.repeat(24), d: 5 });
ok('beacon for unknown id is harmless', r.status === 204);
const newId = 'a'.repeat(24);
r = await beacon({ t: 'v', id: newId, path: '/calculators/bmi-calculator.html', tz: 'UTC', w: 1, h: 1, vw: 1, vh: 1 }, { cookie: jar });
ok('bfcache view creates a row', sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE id = ?').get(newId).n === 1 && r.headers.getSetCookie().some((c) => c.startsWith('mx_sid=')));
await beacon({ t: 'v', id: newId, path: '/' }, { cookie: jar });
ok('same bfcache id never double counts', sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE id = ?').get(newId).n === 1);
ok('www host 301s to apex (sitemap/admin paths)', (await worker.fetch(new Request('https://www.mxcalculator.test/sitemap.xml'), env, ctx)).status === 301);

console.log('Admin sign-in');
r = await call('/admin');
ok('/admin shows the login page when signed out', (await r.text()).includes('Sign in'));
ok('admin assets served', (await call('/admin/admin.js')).status === 200 && (await call('/admin/admin.css')).status === 200);
ok('admin html files are not served directly by name', (await call('/admin/nope.html')).status === 404);
ok('api needs a session', (await call('/admin/api/overview')).status === 401);
const post = (url, body, extra = {}) => call(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-mx-admin': '1', 'cf-connecting-ip': '198.51.100.5', ...extra } });
ok('POST without the admin header is blocked', (await call('/admin/api/login', { method: 'POST', body: '{}' })).status === 403);
ok('cross-site origin is blocked', (await post('/admin/api/login', {}, { origin: 'https://evil.example' })).status === 403);
r = await post('/admin/api/login', { username: 'admin', password: 'wrong' });
ok('wrong password -> 401', r.status === 401);
r = await post('/admin/api/login', { username: 'admin', password: env.ADMIN_PASSWORD });
ok('right password -> 200 + HttpOnly Secure cookie', r.status === 200 && /mx_admin=.*HttpOnly.*Secure/.test(r.headers.get('set-cookie')));
const admin = { cookie: cookiesOf(r) };
r = await call('/admin', { headers: admin });
ok('/admin shows the panel when signed in', (await r.text()).includes('Admin panel') && !(await call('/admin', { headers: admin })).headers.get('set-cookie'));
ok('admin pages carry CSP + noindex', (await call('/admin', { headers: admin })).headers.get('content-security-policy').includes("frame-ancestors 'none'"));
for (let i = 0; i < 8; i++) await post('/admin/api/login', { username: 'admin', password: 'x' + i }, { 'cf-connecting-ip': '192.0.2.77' });
ok('brute force is rate limited (429)', (await post('/admin/api/login', { username: 'admin', password: env.ADMIN_PASSWORD }, { 'cf-connecting-ip': '192.0.2.77' })).status === 429);
const nOwn = count();
await nb('c1'.repeat(12), '/', {}, { cookie: jar + '; ' + admin.cookie });
ok('admin browsing is not counted', count() === nOwn);

console.log('Calculator toggles');
const A = (url, init = {}) => call(url, { ...init, headers: { ...(init.headers || {}), ...admin } });
let d = await (await A('/admin/api/calculators')).json();
ok('lists all 92 calculators with categories', d.total === 92 && d.categories.length > 3 && d.disabled === 0);
r = await post('/admin/api/calculators', { slugs: ['bmi-calculator', 'mortgage-calculator', 'not-real'], enabled: false }, admin);
d = await r.json();
ok('switch off 2 (unknown slug ignored)', d.changed === 2 && d.disabled.join() === 'bmi-calculator,mortgage-calculator');
r = await nb('d1'.repeat(12), '/');
ok('beacon response lists the switched-off calculators', (await r.json()).off.join() === 'bmi-calculator,mortgage-calculator');
const before = count();
r = await nb('d2'.repeat(12), '/calculators/bmi-calculator.html', {}, { cookie: jar });
ok('views of a switched-off calculator are not counted (page is hidden by mx-core.js)', count() === before && (await r.json()).off.includes('bmi-calculator'));
await nb('d3'.repeat(12), '/calculators/loan-calculator.html', {}, { cookie: jar });
ok('other calculators unaffected and counted', count() === before + 1);
const sm = await (await call('/sitemap.xml')).text();
ok('sitemap drops it', !sm.includes('bmi-calculator') && sm.includes('loan-calculator'));
await post('/admin/api/calculators', { slugs: ['bmi-calculator', 'mortgage-calculator'], enabled: true }, admin);
r = await nb('d4'.repeat(12), '/calculators/bmi-calculator.html', {}, { cookie: jar });
ok('switching back on restores it', (await r.json()).off.length === 0 && get('d4'.repeat(12)));

console.log('Analytics endpoints');
// make some history on earlier days so the multi-day chart has something to show
const old = Date.now() - 3 * 86400000;
for (let i = 0; i < 5; i++) sqlite.prepare(`INSERT INTO pageviews (id, ts, path, calc_slug, visitor_id, session_id, is_new_visitor, is_entry, country, browser, os, device, is_bot, channel, js, last_seen) VALUES (?,?,?,?,?,?,1,1,'US','Chrome','Windows','desktop',0,'search',1,?)`)
  .run('c'.repeat(23) + i, old + i * 1000, '/calculators/loan-calculator.html', 'loan-calculator', 'd'.repeat(23) + i, 'e'.repeat(19) + i, old + i * 1000);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
d = await (await A(`/admin/api/overview?from=${iso(Date.now() - 4 * 86400000)}&to=${iso(Date.now())}&tz=UTC`)).json();
ok('overview: KPIs', d.kpis.pageviews >= 8 && d.kpis.visitors >= 6, JSON.stringify(d.kpis));
ok('overview: daily series has one point per day, totals match', d.series.points.length === 5 && d.series.points.reduce((a, p) => a + p.pageviews, 0) === d.kpis.pageviews, JSON.stringify(d.series.points.map((p) => p.pageviews)));
ok('overview: breakdowns present', d.breakdowns.calculators.length >= 2 && d.breakdowns.countries.some((c) => c.k === 'IN') && d.breakdowns.bots.length >= 1);
d = await (await A('/admin/api/overview?tz=Asia/Kolkata')).json();
ok('overview: today in hourly mode', d.series.granularity === 'hour' && d.series.points.length >= 23);
d = await (await A('/admin/api/live')).json();
ok('live: feed + active visitors', d.feed.length > 0 && d.active >= 1);
d = await (await A(`/admin/api/visitors?from=${iso(Date.now() - 4 * 86400000)}&to=${iso(Date.now())}&tz=UTC`)).json();
ok('visitors: list with per-visitor details', d.rows.length >= 5 && d.rows.every((v) => v.viewsEver >= 1 && 'browser' in v && 'landing' in v), JSON.stringify(d.rows[0]));
const vid = d.rows.find((v) => v.country === 'IN');
r = await A('/admin/api/visitor/' + (vid ? vid.visitor_id : d.rows[0].visitor_id));
ok('visitor journey', r.status === 200 && (await r.json()).rows.length >= 1);
d = await (await A(`/admin/api/visitors?q=IN&from=${iso(Date.now() - 4 * 86400000)}&to=${iso(Date.now())}&tz=UTC`)).json();
ok('visitor search by country', d.total >= 1);
r = await A(`/admin/api/export.csv?from=${iso(Date.now() - 4 * 86400000)}&to=${iso(Date.now())}&tz=UTC`);
const csv = await r.text();
ok('CSV export', r.headers.get('content-disposition').includes('visits_') && csv.split('\n')[0].startsWith('ts_utc,path') && csv.split('\n').length > 5);
d = await (await A('/admin/api/calculators')).json();
ok('calculator list shows 30-day views', d.items.find((i) => i.slug === 'loan-calculator').views30 >= 5);

console.log('Settings');
d = await (await A('/admin/api/settings')).json();
ok('settings read (rows, audit, your IP)', d.dbRows > 5 && d.audit.length > 0 && d.passwordFromEnv === true);
r = await post('/admin/api/settings', { tracking_enabled: true, ip_mode: 'truncated', exclude_ips: '198.51.100.20\n2001:db8::1', retention_days: 90, report_tz: 'Asia/Kolkata' }, admin);
d = await r.json();
ok('settings saved', r.status === 200 && d.settings.ip_mode === 'truncated' && d.settings.exclude_ips.length === 2 && d.settings.retention_days === 90);
ok('bad IP rejected', (await post('/admin/api/settings', { exclude_ips: 'not-an-ip' }, admin)).status === 400);
const id3 = 'e1'.repeat(12);
await nb(id3, '/', {}, { 'cf-connecting-ip': '203.0.113.50' });
ok('truncated IP mode is applied', sqlite.prepare('SELECT ip FROM pageviews WHERE id = ?').get(id3).ip === '203.0.113.0');
const n0 = sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n;
await post('/admin/api/settings', { exclude_ips: '203.0.113.50' }, admin);
await nb('e2'.repeat(12), '/', {}, { 'cf-connecting-ip': '203.0.113.50' });
ok('excluded IP is not recorded', sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === n0);
await post('/admin/api/settings', { tracking_enabled: false }, admin);
r = await nb('e3'.repeat(12), '/', {}, { 'cf-connecting-ip': '203.0.113.77' });
ok('tracking off: beacon still answers, nothing recorded, no cookies', r.status === 200 && r.headers.getSetCookie().length === 0 && sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === n0);
await post('/admin/api/settings', { tracking_enabled: true, exclude_ips: '' }, admin);
ok('password change is refused (it is a secret)', (await post('/admin/api/password', { current: 'a', new: 'bbbbbbbbbbbb' }, admin)).status === 400);

console.log('Housekeeping + purge');
await post('/admin/api/settings', { retention_days: 1 }, admin);
await worker.scheduled({}, env, ctx); await Promise.all(pending); pending = [];
ok('daily cron applies retention', sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE ts < ?').get(Date.now() - 86400000).n === 0);
r = await post('/admin/api/purge', { mode: 'bots' }, admin);
ok('purge bots', (await r.json()).deleted >= 1 && sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE is_bot = 1').get().n === 0);
r = await post('/admin/api/purge', { mode: 'before', before: '2000-01-01', tz: 'UTC' }, admin);
ok('purge before date', (await r.json()).deleted === 0);
r = await post('/admin/api/purge', { mode: 'all' }, admin);
ok('purge all', (await r.json()).deleted >= 1 && sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === 0);
ok('purge keeps calculator settings', sqlite.prepare('SELECT COUNT(*) n FROM calculators').get().n === 2);

console.log('Sessions');
r = await post('/admin/api/logout', {}, admin);
ok('logout kills the session', (await A('/admin/api/me')).status === 401);
r = await post('/admin/api/login', { username: 'admin', password: env.ADMIN_PASSWORD });
const admin2 = { cookie: cookiesOf(r) };
ok('new session works', (await call('/admin/api/me', { headers: admin2 })).status === 200);
env.ADMIN_PASSWORD = 'a brand new secret value';
ok('rotating the ADMIN_PASSWORD secret signs everyone out', (await call('/admin/api/me', { headers: admin2 })).status === 401);
const savedPw = env.ADMIN_PASSWORD; delete env.ADMIN_PASSWORD;
r = await post('/admin/api/login', { username: 'admin', password: 'anything' });
ok('no secret configured -> clear 503 message', r.status === 503 && (await r.json()).error.includes('wrangler secret put'));
env.ADMIN_PASSWORD = savedPw;

console.log('Database unavailable (free quota used up)');
const dbmod = await import('../src/db.js');
dbmod.cache.clear();
const goodDB = env.DB;
env.DB = { prepare: () => ({ bind: () => ({ all: async () => { throw new Error('D1 quota'); }, first: async () => { throw new Error('D1 quota'); }, run: async () => { throw new Error('D1 quota'); } }) }), batch: async () => { throw new Error('D1 quota'); } };
r = await nb('f1'.repeat(12), '/calculators/loan-calculator.html');
ok('navigation beacon still answers (fails open: nothing switched off, untracked)', r.status === 200 && (await r.json()).off.length === 0);
ok('beacons are swallowed quietly', (await beacon({ t: 'p', id: 'a'.repeat(24), d: 1 })).status === 204);
ok('sitemap still served', (await call('/sitemap.xml')).status === 200);
r = await post('/admin/api/login', { username: 'admin', password: env.ADMIN_PASSWORD });
ok('admin reports a clean error instead of crashing', r.status === 500 && (await r.json()).error === 'Server error.');
env.DB = goodDB; dbmod.cache.clear();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
