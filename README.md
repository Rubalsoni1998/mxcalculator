# Mx Calculator on Cloudflare Workers + D1

Same site, same admin panel, now on Cloudflare. Static files are served by Cloudflare for free with no code running.
A small Worker handles only: the home page, calculator pages, `sitemap.xml`, `/admin` and the tracking beacon `/_mx/e`.
It hides switched-off calculators, records visits in D1, and gets the visitor's country from Cloudflare (`CF-IPCountry`).

```
public/            the website (unchanged except 404.html and a gentler heartbeat in mx-core.js)
admin/             admin panel front end (unchanged except the password hint text)
src/worker.js      routing, calculator on/off, admin API
src/track.js       visit recording + beacon        src/stats.js   analytics queries
src/auth.js        login/sessions                  src/registry.js, db.js, util.js
migrations/        D1 schema                       scripts/build.js   builds src/generated.js
test/smoke.mjs     local test (npm test)
```

## First-time setup

```
npm install
npx wrangler login
npx wrangler d1 create mx-calculator       # copy the database_id it prints into wrangler.toml
npm run db:migrate                         # creates the tables in D1
npm run deploy                             # builds, then deploys Worker + static files
npx wrangler secret put ADMIN_PASSWORD     # your admin password (long, random). Username is ADMIN_USER in wrangler.toml
```

Then open `https://mx-calculator.<your-subdomain>.workers.dev/admin`. To use your own domain, uncomment `routes` in
`wrangler.toml` (the domain must be on Cloudflare) or add it in the dashboard under Workers > Settings > Domains.

Try it locally first: copy `.dev.vars.example` to `.dev.vars`, then `npm run db:migrate:local` and `npm run dev`.

## Day to day

- **Deploy changes:** `npm run deploy`. It rebuilds the calculator list, so a new file in `public/calculators/` appears in the admin panel after a deploy (the Node version picked it up instantly).
- **Change the admin password:** run `npx wrangler secret put ADMIN_PASSWORD` again. Everyone is signed out automatically. The password lives only as a Cloudflare secret, never in the database, so the "change password" form in Settings is replaced by this instruction.
- **Toggling a calculator** reaches every Cloudflare location within about 10 seconds. Settings changes take up to about 15 seconds.
- `node scripts/set-domain.cjs https://www.yoursite.com` and `node scripts/vendor.cjs` still work (renamed `.cjs`).

## What changed from the Node version

| Before | Now |
|---|---|
| SQLite file on a server | Cloudflare D1 |
| Node process, Docker volume, backups to manage | No server. D1 has Time Travel restore; `wrangler d1 export` for a file backup |
| `TRUST_PROXY`, IP header guessing | `CF-Connecting-IP` is always correct |
| Country needed a CDN header | Always available |
| Session found by querying the last visit | Session cookie `mx_sid` (30 min), so no lookup per page |
| Heartbeat every 15 s | Every 30 s, stops after about 20 min (saves free-plan requests and writes) |
| Password in env var or file, changeable in panel | `ADMIN_PASSWORD` secret |
| `privacy.html` / `terms.html` counted as visits | **Not counted**: they are plain static files now. To count them, add `"/privacy.html"` and `"/terms.html"` to `run_worker_first` and to the page routing in `src/worker.js` |

If the database is ever unreachable (for example the free daily quota is used up), pages are still served normally; only the statistics for that period are lost.

## Free plan limits worth knowing (checked against Cloudflare's docs)

| Limit (free) | Effect here |
|---|---|
| Static asset requests | Free and unlimited |
| Worker requests: 100,000/day | Each tracked view costs the page itself plus 2 to 4 beacons |
| D1 rows written: 100,000/day | An insert writes the row plus one per index; each beacon is one more. Roughly 5 to 7 writes per view |
| D1 rows read: 5 million/day | Each Analytics load reads every row in the chosen range about 20 times (once per breakdown). Fine for a day or a week; a 30 day range gets heavy as traffic grows |
| 50 D1 queries per request | The analytics code is written to stay well under this |

Rule of thumb: roughly **10,000 to 15,000 tracked page views a day** fits the free plan. Beyond that, the $5/month Workers Paid plan raises all of these a lot.
Bots count too (they are stored and flagged). Deleting rows (retention, purge) also counts as writes, so retention defaults to "keep forever"; 5 GB of storage holds millions of rows.

## SEO tooling (scripts/seo)
- `meta.py` / `related.py` – titles, descriptions and related-link map for every calculator; `apply_step1.py` applies them.
- `content/*.json` + `apply_step3.py` – expanded sections, extra FAQs (HTML and FAQPage schema) and sources.
- `gen_states.py` – generates `public/states/*` (50 sales tax + 50 property tax pages, 2 hubs) and `public/topics/*` (5 hubs).
  Sales tax data: Tax Foundation, Midyear 2026 (rates as of July 1, 2026). Property tax data comes from `property-tax-calculator.js`.
- `finalize.py` – home-page sections, hub links on calculator pages, sitemap.xml.
All scripts are idempotent. After changing rates, edit `gen_states.py`, rerun it, then `finalize.py`.

## SEO maintenance scripts

- `python3 scripts/seo/fix_schema.py` converts any `WebApplication` JSON-LD node to `WebPage`. Google requires a rating or review on app types and the site has no genuine ratings, so pages use `WebPage` (Semrush "Invalid structured data items"). `gen_states.py` and `apply_step1.py` already emit `WebPage`.
- `python3 scripts/seo/gen_llms.py` rebuilds `public/llms.txt` from the topic hubs and `meta.py`. Run it after adding calculators.
- `Content-Signal` in the live `robots.txt` is injected by Cloudflare (managed robots.txt / AI Crawl Control), not by this repo. See `public/robots.txt` for the file the repo ships.

## Assets: edit `assets-src/`, not `public/assets/`
`assets-src/css` and `assets-src/js` hold the readable source. `scripts/minify.mjs` (run by `npm run build`, `dev`, `deploy`, `test`) writes
the minified copies into `public/assets/`. Run `npm install` once so `esbuild` is available. This fixes Semrush "Unminified JavaScript and CSS files".

## Speed architecture (static pages)

Pages are plain static files served from Cloudflare's edge (no Worker, no database on page load).
`npm run build` turns `public/` (what you edit) into `dist/` (what is deployed):

- every page's CSS is inlined into one `<style>` (no render-blocking requests),
- Google Analytics loads after the page has loaded,
- JS files get a content hash (`enhance.1a2b3c4d.js`) and are cached for a year,
- `_redirects` is generated (`/calculators/x` -> `/calculators/x.html`, `/index.html` -> `/`).

The Worker now only runs for `/sitemap.xml`, `/admin*` and the beacon `/_mx/e`.
`mx-core.js` (on home, calculator, state and topic pages) sends one beacon per page view; the server records
the view and replies with the list of switched-off calculators, which the script hides (home-page links, or
the whole page of a switched-off calculator). Consequences: visitors with JavaScript disabled are not counted,
and a switched-off calculator can be visible for a split second before it is hidden. To remove one for good,
delete its HTML file and redeploy.

**One-time Cloudflare setup:** pages no longer pass through the Worker, so create a Redirect Rule
(Rules > Redirect Rules) from `www.mxcalculator.com/*` to `https://mxcalculator.com/${1}` (301, keep query string).
