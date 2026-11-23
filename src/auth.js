// Admin login. The password is the ADMIN_PASSWORD secret (never stored in the database).
// Sessions are random tokens whose hashes live in D1; each session is bound to a fingerprint of the
// current secret, so rotating the secret signs everyone out.
import * as db from './db.js';
import { parseCookies, cookie, rid } from './util.js';

const COOKIE = 'mx_admin';
const SESSION_MS = 12 * 3600 * 1000;
const MAX_FAILS = 8, FAIL_WINDOW_MS = 15 * 60 * 1000;
const enc = new TextEncoder();

async function sha(s) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {            // constant-time compare of two equal-length hex strings
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
export const adminUser = (env) => env.ADMIN_USER || 'admin';
export const configured = (env) => typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length > 0;
const fingerprint = async (env) => (await sha('mx-pw-fp:' + env.ADMIN_PASSWORD)).slice(0, 16);

export async function verifyPassword(env, user, password) {
  if (!configured(env)) return false;
  // Hash both sides first so the comparison time does not depend on the password's length.
  const okPw = safeEqual(await sha('pw:' + String(password || '')), await sha('pw:' + env.ADMIN_PASSWORD));
  const okUser = String(user || '').toLowerCase() === String(adminUser(env)).toLowerCase();
  return okPw && okUser;
}

export async function login(env, request, ip, user, password) {
  if (!configured(env)) {
    return { ok: false, status: 503, error: 'Admin password is not set. Run: npx wrangler secret put ADMIN_PASSWORD' };
  }
  const recent = await db.get('SELECT COUNT(*) n FROM login_failures WHERE ip = ? AND ts > ?', ip, Date.now() - FAIL_WINDOW_MS);
  if (recent.n >= MAX_FAILS) return { ok: false, status: 429, error: 'Too many attempts. Try again in 15 minutes.' };
  if (!(await verifyPassword(env, user, password))) {
    await db.run('INSERT INTO login_failures(ip, ts) VALUES(?,?)', ip, Date.now());
    await db.audit('login_failed', ip);
    return { ok: false, status: 401, error: 'Wrong username or password.' };
  }
  const token = rid(32);
  const now = Date.now();
  await db.batch([
    db.stmt('DELETE FROM admin_sessions WHERE expires_at < ?', now),
    db.stmt('INSERT INTO admin_sessions(token_hash, expires_at, pwfp) VALUES(?,?,?)', await sha(token), now + SESSION_MS, await fingerprint(env)),
    db.stmt('DELETE FROM login_failures WHERE ip = ?', ip),
  ]);
  await db.audit('login', ip);
  const secure = new URL(request.url).protocol === 'https:';
  return { ok: true, setCookie: cookie(COOKIE, token, { maxAge: SESSION_MS / 1000, httpOnly: true, secure, sameSite: 'Lax' }) };
}

export async function logout(env, request) {
  const t = parseCookies(request.headers.get('cookie'))[COOKIE];
  if (t) await db.run('DELETE FROM admin_sessions WHERE token_hash = ?', await sha(t));
  const secure = new URL(request.url).protocol === 'https:';
  return cookie(COOKIE, '', { maxAge: 0, httpOnly: true, secure });
}

export async function isAdmin(env, request) {
  const t = parseCookies(request.headers.get('cookie'))[COOKIE];
  if (!t || t.length > 100 || !configured(env)) return false;       // no cookie = no database read
  const row = await db.get('SELECT expires_at, pwfp FROM admin_sessions WHERE token_hash = ?', await sha(t));
  return !!row && row.expires_at > Date.now() && safeEqual(row.pwfp, await fingerprint(env));
}

// State-changing requests must come from our own admin pages.
export function sameOrigin(request) {
  if (request.headers.get('x-mx-admin') !== '1') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
