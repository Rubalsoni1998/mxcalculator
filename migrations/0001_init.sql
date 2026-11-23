-- Mx Calculator schema for Cloudflare D1.
-- Index choices are deliberate: on the free plan every index entry counts as an extra
-- "row written" per insert (100,000/day), so only the two indexes the queries truly need exist.

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- One row per calculator that has been switched on/off. Missing row = enabled.
CREATE TABLE calculators (
  slug TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

CREATE TABLE audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  action TEXT NOT NULL,
  detail TEXT
);

-- pwfp ties a session to the current ADMIN_PASSWORD secret: change the secret and every session dies.
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  pwfp TEXT NOT NULL
);

CREATE TABLE login_failures (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX lf_ip ON login_failures(ip, ts);

-- WITHOUT ROWID: the table itself is the primary-key index, so one fewer row written per insert.
CREATE TABLE pageviews (
  id TEXT PRIMARY KEY,            -- random id; the browser uses it to confirm/update this view
  ts INTEGER NOT NULL,            -- ms since epoch (UTC) when the page was requested
  path TEXT NOT NULL,
  calc_slug TEXT,
  visitor_id TEXT NOT NULL,       -- first-party cookie, 2 years
  session_id TEXT NOT NULL,       -- first-party cookie, 30 minutes of inactivity ends it
  is_new_visitor INTEGER NOT NULL DEFAULT 0,
  is_entry INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  country TEXT,
  ua TEXT,
  browser TEXT,
  browser_ver TEXT,
  os TEXT,
  device TEXT,                    -- desktop | mobile | tablet | bot
  is_bot INTEGER NOT NULL DEFAULT 0,
  referrer TEXT,
  ref_host TEXT,
  channel TEXT,                   -- direct | search | social | referral | internal | campaign
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  lang TEXT,
  tz TEXT,
  screen_w INTEGER,
  screen_h INTEGER,
  vp_w INTEGER,
  vp_h INTEGER,
  js INTEGER NOT NULL DEFAULT 0,
  dur_ms INTEGER NOT NULL DEFAULT 0,
  interacted INTEGER NOT NULL DEFAULT 0,
  last_seen INTEGER NOT NULL
) WITHOUT ROWID;
CREATE INDEX pv_ts ON pageviews(ts);
CREATE INDEX pv_visitor ON pageviews(visitor_id, ts);
