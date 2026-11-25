// Downloads Chart.js once into public/assets/vendor/ so calculator pages load it from our own domain.
// Runs automatically before `npm run build`. If the download fails the build continues and pages
// fall back to the jsDelivr CDN, so this never blocks a deploy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '4.4.1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'public', 'assets', 'vendor', `chart-${VERSION}.umd.js`);

if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
  console.log(`chart.js ${VERSION}: already vendored`);
} else {
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/chart.js@${VERSION}/dist/chart.umd.js`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100000 || !buf.toString('utf8', 0, 400).includes('Chart.js')) throw new Error('unexpected file contents');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    console.log(`chart.js ${VERSION}: saved (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.warn(`chart.js ${VERSION}: download failed (${e.message}). Pages will use the CDN fallback until this succeeds.`);
  }
}
