// Builds dist/ (what Cloudflare serves) from public/ (what you edit).
//   - inlines every page's stylesheets into one <style> (no render-blocking CSS requests)
//   - loads Google Analytics after the page has loaded (off the critical path)
//   - adds the first-party tracking script to counted pages
//   - fingerprints JS files (name.<hash>.js) so they can be cached for a year
//   - writes _redirects (extensionless calculator URLs, /index.html)
// public/ is never modified. Runs automatically from `npm run build`, after minify.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(root, 'public');
const DIST = path.join(root, 'dist');
const MAX_INLINE_CSS = 80 * 1024;     // a page whose CSS is bigger than this keeps <link> tags
const COUNTED = /^(index\.html|calculators\/[^/]+\.html|states\/[^/]+\.html|topics\/[^/]+\.html)$/;

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const rel = (p) => path.relative(DIST, p).split(path.sep).join('/');
// site path of a reference found in an HTML file (relative, root-relative, or with query/hash)
const resolveRef = (htmlRel, ref) => {
  const clean = ref.split(/[?#]/)[0];
  if (/^([a-z]+:)?\/\//i.test(clean)) return null;
  const abs = clean.startsWith('/') ? clean : '/' + path.posix.normalize(path.posix.join(path.posix.dirname(htmlRel), clean));
  return abs;
};

// ---- 1. fingerprint JS (assets/js/**), remembering old path -> new path
const jsMap = new Map();
for (const f of walk(path.join(DIST, 'assets', 'js'))) {
  if (!f.endsWith('.js')) continue;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
  const next = f.replace(/\.js$/, `.${hash}.js`);
  fs.renameSync(f, next);
  jsMap.set('/' + rel(f), '/' + rel(next));
}

// ---- 2. rewrite every HTML page
const stats = { pages: 0, inlined: 0, kept: 0, gtag: 0, core: 0, bytes: 0 };
const GTAG = /(?:<!-- Google tag \(gtag\.js\) -->\s*)?<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([A-Za-z0-9-]+)"><\/script>\s*<script>[\s\S]*?<\/script>/;

for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const r = rel(file);
  let html = fs.readFileSync(file, 'utf8');
  stats.pages++;

  // 2a. stylesheets -> one <style>
  const links = [...html.matchAll(/[ \t]*<link\b[^>]*\brel="stylesheet"[^>]*>[ \t]*\n?/g)];
  const parsed = links.map((m) => {
    const tag = m[0];
    const href = (/\bhref="([^"]+)"/.exec(tag) || [])[1];
    const local = href && resolveRef(r, href);
    const hasMedia = /\bmedia=/.test(tag);
    const f = local && !hasMedia ? path.join(DIST, local) : null;
    return { tag, f: f && fs.existsSync(f) ? f : null };
  });
  const inlinable = parsed.filter((x) => x.f);
  const css = inlinable.map((x) => fs.readFileSync(x.f, 'utf8')).join('\n');
  if (inlinable.length && css.length <= MAX_INLINE_CSS) {
    let first = true;
    for (const x of inlinable) {
      html = html.replace(x.tag, first ? `<style>${css}</style>\n` : '');
      first = false;
    }
    stats.inlined++;
  } else if (inlinable.length) stats.kept++;

  // 2b. Google Analytics after load
  html = html.replace(GTAG, (_, gid) => {
    stats.gtag++;
    return `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gid}');` +
      `addEventListener('load',function(){(window.requestIdleCallback||setTimeout)(function(){var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id=${gid}';document.head.appendChild(s)},{timeout:2000})})</script>`;
  });

  // 2c. first-party tracking script on counted pages
  if (COUNTED.test(r) && !html.includes('/assets/js/mx-core.')) {
    html = html.replace(/<\/head>/i, '<script defer src="/assets/js/mx-core.js"></script></head>');
    stats.core++;
  }

  // 2c2. light theme only (browsers must not auto-darken the page)
  if (!/name="color-scheme"/.test(html)) html = html.replace(/<\/head>/i, '<meta name="color-scheme" content="light"></head>');

  // 2d. script src -> fingerprinted name
  html = html.replace(/(<script\b[^>]*\bsrc=")([^"]+)(")/g, (m, a, src, c) => {
    const abs = resolveRef(r, src);
    return abs && jsMap.has(abs) ? a + jsMap.get(abs) + c : m;
  });

  fs.writeFileSync(file, html);
  stats.bytes += html.length;
}

// ---- 3. redirects
const slugs = fs.readdirSync(path.join(DIST, 'calculators')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
const lines = ['/index.html / 301'];
for (const s of slugs) lines.push(`/calculators/${s} /calculators/${s}.html 301`, `/calculators/${s}/ /calculators/${s}.html 301`);
fs.writeFileSync(path.join(DIST, '_redirects'), lines.join('\n') + '\n');

// ---- 4. check: every local reference in every page must exist in dist/
const missing = [];
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const r = rel(file);
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    const abs = resolveRef(r, m[1]);
    if (!abs || abs === '/' || /\.html$/.test(abs)) continue;
    if (!fs.existsSync(path.join(DIST, abs))) missing.push(`${r}: ${m[1]}`);
  }
}
if (missing.length) { console.error('build-dist: missing files:\n  ' + [...new Set(missing)].slice(0, 20).join('\n  ')); process.exit(1); }

console.log(`build-dist: ${stats.pages} pages (CSS inlined in ${stats.inlined}, kept as links in ${stats.kept}), gtag deferred in ${stats.gtag}, ` +
  `tracking script added to ${stats.core}, ${jsMap.size} JS files fingerprinted, ${slugs.length * 2 + 1} redirects -> dist/`);
