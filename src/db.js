// D1 access + settings. One Worker isolate may serve many requests, so small values that every
// page view needs (settings, the list of switched-off calculators) are cached for a few seconds.
import { ttlCache } from './util.js';

let DB = null;
export const cache = ttlCache();
const SETTINGS_TTL = 15000;

export function init(env) { DB = env.DB; }
export const raw = () => DB;

export async function all(sql, ...p) { return (await DB.prepare(sql).bind(...p).all()).results; }
export async function get(sql, ...p) { return (await DB.prepare(sql).bind(...p).first()) || null; }
export async function run(sql, ...p) { return DB.prepare(sql).bind(...p).run(); }
export const stmt = (sql, ...p) => DB.prepare(sql).bind(...p);
// One round trip, atomic. Returns an array of row arrays (one per statement).
export async function batch(stmts) { return (await DB.batch(stmts)).map((r) => r.results); }

// ---- settings ----
export const DEFAULT_SETTINGS = {
  tracking_enabled: true,
  ip_mode: 'full',          // full | truncated (last octet / last 80 bits zeroed) | none
  exclude_ips: [],          // visits from these IPs are not recorded
  retention_days: 0,        // 0 = keep forever
  report_tz: '',            // '' = use the admin's browser time zone
};
export async function getSettings() {
  return cache.get('settings', SETTINGS_TTL, async () => {
    const out = { ...DEFAULT_SETTINGS };
    for (const r of await all('SELECT key, value FROM settings')) {
      try { if (r.key in out) out[r.key] = JSON.parse(r.value); } catch { /* ignore */ }
    }
    return out;
  }, { ...DEFAULT_SETTINGS });
}
export async function saveSettings(patch) {
  const keys = Object.keys(DEFAULT_SETTINGS).filter((k) => k in patch);
  if (keys.length) {
    await DB.batch(keys.map((k) => stmt('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, JSON.stringify(patch[k]))));
  }
  cache.clear();
  return getSettings();
}

export async function audit(action, detail) {
  await run('INSERT INTO audit(ts, action, detail) VALUES(?,?,?)', Date.now(), action, detail ? String(detail).slice(0, 500) : null);
}
