// Minifies assets-src/{css,js} -> public/assets/{css,js} (fixes Semrush "Unminified JavaScript and CSS files").
// Edit the readable files in assets-src/, never the output in public/assets/. Runs automatically from `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets-src');
const OUT = path.join(root, 'public', 'assets');
let files = 0, before = 0, after = 0;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const ext = path.extname(e.name);
    if (ext !== '.css' && ext !== '.js') continue;
    const code = fs.readFileSync(p, 'utf8');
    const out = transformSync(code, {
      loader: ext === '.css' ? 'css' : 'js',
      minify: true,
      legalComments: 'none',
      // Plain <script> files: top-level names stay as written (inline onclick handlers and other scripts may use them).
      target: ext === '.css' ? 'chrome90' : 'es2018',
    }).code;
    const dest = path.join(OUT, path.relative(SRC, p));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    files++; before += code.length; after += out.length;
  }
}
walk(SRC);
console.log(`minify: ${files} files, ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
