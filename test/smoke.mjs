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
const PUB = path.join(root, 'public');
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

console.log('Public pages');
let r = await call('/', nav());
let html = await r.text();
ok('home page 200', r.status === 200);
const pv = /name="mx-pv" content="([a-f0-9]{24})"/.exec(html);
ok('tracking meta + script injected', !!pv && html.includes('/assets/js/mx-core.js'));
ok('visitor + session cookies set', /mx_vid=/.test(cookiesOf(r)) && /mx_sid=/.test(cookiesOf(r)));
let jar = cookiesOf(r);
let row = sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(pv[1]);
ok('page view stored with country/IP/entry', row && row.country === 'IN' && row.ip === '203.0.113.9' && row.is_entry === 1 && row.is_new_visitor === 1);

r = await call('/calculators/bmi-calculator.html', nav({ cookie: jar, referer: 'https://www.google.com/' }));
html = await r.text();
const pv2 = /name="mx-pv" content="([a-f0-9]{24})"/.exec(html);
row = sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(pv2[1]);
ok('calculator page: same visitor, same session, not an entry', row.is_entry === 0 && row.calc_slug === 'bmi-calculator' && row.is_new_visitor === 0);
{ const x = await call('/calculators/bmi-calculator', nav({ cookie: jar }));
  ok('extensionless URL 301s to the .html page', x.status === 301 && x.headers.get('location') === 'https://mxcalculator.test/calculators/bmi-calculator.html'); }
{ const x = await call('/index.html', nav({ cookie: jar }));
  ok('/index.html 301s to /', x.status === 301 && x.headers.get('location') === 'https://mxcalculator.test/'); }
{ const x = await worker.fetch(new Request('https://www.mxcalculator.test/calculators/bmi-calculator.html', nav()), env, ctx);
  ok('www host 301s to apex', x.status === 301 && x.headers.get('location') === 'https://mxcalculator.test/calculators/bmi-calculator.html'); }
r = await call('/calculators/does-not-exist.html', nav());
ok('unknown calculator -> 404', r.status === 404);
r = await call('/calculators/bmi-calculator.html', { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)', 'sec-fetch-dest': 'document' } });
html = await r.text();
ok('bot served the page but not given the beacon', r.status === 200 && !html.includes('mx-pv'));
ok('bot stored flagged is_bot=1', sqlite.prepare("SELECT COUNT(*) n FROM pageviews WHERE is_bot = 1").get().n === 1);
await call('/', { headers: { 'user-agent': CHROME, 'sec-fetch-dest': 'document', purpose: 'prefetch' } });
await call('/', { headers: { 'user-agent': CHROME, 'sec-fetch-dest': 'iframe' } });
ok('prefetch and iframe loads are not counted', sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === 3);   // home + 1 calculator load + 1 bot (the extensionless request is now a redirect, not a view)

console.log('Beacons');
const beacon = (o, extra = {}) => call('/_mx/e', { method: 'POST', body: JSON.stringify(o), headers: { 'user-agent': CHROME, 'cf-connecting-ip': '203.0.113.9', ...extra } });
r = await beacon({ t: 'h', id: pv2[1], tz: 'Asia/Kolkata', w: 1920, h: 1080, vw: 1200, vh: 800, tp: 0, wd: 0, d: 0 });
ok('hello beacon 204', r.status === 204);
row = sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(pv2[1]);
ok('hello confirms view + stores screen/tz', row.js === 1 && row.tz === 'Asia/Kolkata' && row.screen_w === 1920);
await new Promise((res) => setTimeout(res, 30));
await beacon({ t: 'p', id: pv2[1], d: 20, i: 1 });
row = sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(pv2[1]);
ok('heartbeat stores duration (capped by elapsed time) + interaction', row.interacted === 1 && row.dur_ms > 0 && row.dur_ms <= 20);
await beacon({ t: 'h', id: pv2[1], wd: 1 });
row = sqlite.prepare('SELECT * FROM pageviews WHERE id = ?').get(pv2[1]);
ok('webdriver flag turns a view into a bot', row.is_bot === 1 && row.device === 'bot');
await beacon({ t: 'h', id: pv2[1], wd: 0 }); // can't un-bot
ok('bot flag is sticky', sqlite.prepare('SELECT is_bot FROM pageviews WHERE id = ?').get(pv2[1]).is_bot === 1);
const newId = 'a'.repeat(24);
r = await beacon({ t: 'v', id: newId, path: '/calculators/bmi-calculator.html', tz: 'UTC', w: 1, h: 1, vw: 1, vh: 1 }, { cookie: jar });
ok('bfcache view creates a row', sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE id = ?').get(newId).n === 1 && r.headers.getSetCookie().some((c) => c.startsWith('mx_sid=')));
await beacon({ t: 'v', id: newId, path: '/' }, { cookie: jar });
ok('same view id never double counts', sqlite.prepare('SELECT COUNT(*) n FROM pageviews WHERE id = ?').get(newId).n === 1);
r = await beacon({ t: 'p', id: 'b'.repeat(24), d: 5 });
ok('beacon for unknown id is harmless', r.status === 204);

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
const own = await call('/', nav({ cookie: jar + '; ' + admin.cookie }));
ok('admin browsing is not counted', !(await own.text()).includes('mx-pv'));

console.log('Calculator toggles');
const A = (url, init = {}) => call(url, { ...init, headers: { ...(init.headers || {}), ...admin } });
let d = await (await A('/admin/api/calculators')).json();
ok('lists all 75 calculators with categories', d.total === 75 && d.categories.length > 3 && d.disabled === 0);
r = await post('/admin/api/calculators', { slugs: ['bmi-calculator', 'mortgage-calculator', 'not-real'], enabled: false }, admin);
d = await r.json();
ok('switch off 2 (unknown slug ignored)', d.changed === 2 && d.disabled.join() === 'bmi-calculator,mortgage-calculator');
r = await call('/calculators/bmi-calculator.html', nav());
ok('disabled calculator -> 503 page', r.status === 503 && (await r.text()).includes('temporarily unavailable'));
{ const x = await call('/calculators/bmi-calculator', nav());
  ok('disabled calculator without .html redirects to the (blocked) .html URL', x.status === 301 && x.headers.get('location').endsWith('/calculators/bmi-calculator.html')); }
ok('other calculators unaffected', (await call('/calculators/loan-calculator.html', nav())).status === 200);
html = await (await call('/', nav())).text();
ok('home page no longer links to it', !html.includes('calculators/bmi-calculator.html') && !html.includes('calculators/mortgage-calculator.html') && html.includes('calculators/loan-calculator.html'));
const sm = await (await call('/sitemap.xml')).text();
ok('sitemap drops it', !sm.includes('bmi-calculator') && sm.includes('loan-calculator'));
const before = sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n;
await call('/calculators/bmi-calculator.html', nav());
ok('503 hits are not counted as visits', sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === before);
await post('/admin/api/calculators', { slugs: ['bmi-calculator', 'mortgage-calculator'], enabled: true }, admin);
ok('switching back on restores it', (await call('/calculators/bmi-calculator.html', nav())).status === 200);

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
r = await call('/', nav({ cookie: '', 'cf-connecting-ip': '203.0.113.50' }));
const id3 = /content="([a-f0-9]{24})"/.exec(await r.text())[1];
ok('truncated IP mode is applied', sqlite.prepare('SELECT ip FROM pageviews WHERE id = ?').get(id3).ip === '203.0.113.0');
const n0 = sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n;
await post('/admin/api/settings', { exclude_ips: '203.0.113.50' }, admin);
await call('/', nav({ 'cf-connecting-ip': '203.0.113.50' }));
ok('excluded IP is not recorded', sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === n0);
await post('/admin/api/settings', { tracking_enabled: false }, admin);
r = await call('/', nav({ 'cf-connecting-ip': '203.0.113.77' }));
ok('tracking off: page works, nothing recorded', r.status === 200 && !(await r.text()).includes('mx-pv') && sqlite.prepare('SELECT COUNT(*) n FROM pageviews').get().n === n0);
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
r = await call('/calculators/loan-calculator.html', nav());
ok('calculator page still served (fails open, untracked)', r.status === 200 && (await r.text()).includes('<html'));
ok('home page still served', (await call('/', nav())).status === 200);
ok('beacons are swallowed quietly', (await beacon({ t: 'p', id: 'a'.repeat(24), d: 1 })).status === 204);
ok('sitemap still served', (await call('/sitemap.xml')).status === 200);
r = await post('/admin/api/login', { username: 'admin', password: env.ADMIN_PASSWORD });
ok('admin reports a clean error instead of crashing', r.status === 500 && (await r.json()).error === 'Server error.');
env.DB = goodDB; dbmod.cache.clear();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
