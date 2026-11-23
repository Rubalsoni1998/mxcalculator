// Which calculators exist (from the build step) and which are switched off (in D1).
import { CALCULATORS } from './generated.js';
import * as db from './db.js';

const DISABLED_TTL = 10000;   // a toggle reaches every edge location within about this many seconds

export const scan = () => CALCULATORS;

export async function disabledSlugs() {
  return db.cache.get('disabled', DISABLED_TTL, async () =>
    (await db.all('SELECT slug FROM calculators WHERE enabled = 0')).map((r) => r.slug).sort(), []);
}
export async function isDisabled(slug) {
  if (!slug) return false;
  return (await disabledSlugs()).includes(slug);
}

export async function setEnabled(slugs, enabled) {
  const known = new Set(CALCULATORS.map((c) => c.slug));
  const valid = [...new Set(slugs.filter((s) => known.has(s)))];
  const now = Date.now();
  if (valid.length) {
    await db.batch(valid.map((s) => db.stmt(
      'INSERT INTO calculators(slug, enabled, updated_at) VALUES(?,?,?) ON CONFLICT(slug) DO UPDATE SET enabled=excluded.enabled, updated_at=excluded.updated_at',
      s, enabled ? 1 : 0, now)));
    await db.audit(enabled ? 'enable' : 'disable', valid.length > 5 ? valid.length + ' calculators' : valid.join(', '));
  }
  db.cache.clear();
  return valid.length;
}

export function slugFromPath(p) {
  const m = /^\/calculators\/([a-z0-9-]+)(?:\.html)?\/?$/i.exec(p);
  return m ? m[1].toLowerCase() : null;
}
