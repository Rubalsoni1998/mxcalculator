// Usage: node scripts/set-domain.js https://www.yoursite.com
// Replaces the YOUR-DOMAIN.com placeholder in canonical/OG/JSON-LD tags, sitemap.xml and robots.txt.
const fs = require('fs'), path = require('path');
const domain = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\/[^/\s]+$/.test(domain)) { console.error('Give a full origin, e.g. node scripts/set-domain.js https://www.example.com'); process.exit(1); }
const root = path.join(__dirname, '..', 'public');
let n = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name.startsWith('.')) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(html|xml|txt)$/.test(f.name)) {
      const s = fs.readFileSync(p, 'utf8');
      if (s.includes('https://YOUR-DOMAIN.com')) { fs.writeFileSync(p, s.split('https://YOUR-DOMAIN.com').join(domain)); n++; }
    }
  }
})(root);
console.log(`Updated ${n} files to ${domain}`);
