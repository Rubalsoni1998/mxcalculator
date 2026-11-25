#!/usr/bin/env python3
"""Generate public/llms.txt (llmstxt.org format) from the topic hubs and the SEO meta table.
Run after adding calculators:  python3 scripts/seo/gen_llms.py
"""
import glob, html, os, re, sys
HERE = os.path.dirname(__file__)
sys.path.insert(0, HERE)
from meta import META
ROOT = os.path.join(HERE, '..', '..', 'public')
SITE = 'https://mxcalculator.com'
PAGE = re.compile(r'calculators/([a-z0-9-]+)\.html')

def tag(h, pat):
    m = re.search(pat, h, re.S)
    return html.unescape(m.group(1)).strip() if m else ''

hubs = []
for p in sorted(glob.glob(os.path.join(ROOT, 'topics', '*.html'))):
    h = open(p, encoding='utf8').read()
    title = re.sub(r'\s*\|\s*Mx Calculator\s*$', '', tag(h, r'<title>(.*?)</title>'))
    desc = tag(h, r'<meta name="description" content="(.*?)"')
    slugs = []
    for s in PAGE.findall(h):
        if s not in slugs and os.path.exists(os.path.join(ROOT, 'calculators', s + '.html')):
            slugs.append(s)
    hubs.append((os.path.basename(p), title, desc, slugs))

def entry(slug):
    h = open(os.path.join(ROOT, 'calculators', slug + '.html'), encoding='utf8').read()
    title = META.get(slug, (None, None))[0] or re.sub(r'\s*\|\s*Mx Calculator\s*$', '', tag(h, r'<title>(.*?)</title>'))
    desc = META.get(slug, (None, None))[1] or tag(h, r'<meta name="description" content="(.*?)"')
    return f'- [{title}]({SITE}/calculators/{slug}.html): {desc}'

all_calcs = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(ROOT, 'calculators', '*.html')))
lines = ['# Mx Calculator', '',
 '> Mx Calculator offers free, private online calculators for US users: tax, mortgage and loans, investing, health and fitness, pregnancy, math, dates and time, school, and everyday conversions. Calculations run in the browser and nothing is stored. Each page explains the formula, gives a worked example, answers common questions and cites its sources.', '',
 'Rates, tax brackets and limits are US figures and are labeled with their tax year. Results are estimates for general information, not financial, tax, legal or medical advice.', '',
 '## Calculator categories', '']
for f, title, desc, slugs in hubs:
    lines.append(f'- [{title}]({SITE}/topics/{f}): {desc}')
seen = set()
for f, title, desc, slugs in hubs:
    lines += ['', f'## {title}', '']
    for s in slugs:
        lines.append(entry(s)); seen.add(s)
rest = [s for s in all_calcs if s not in seen]
if rest:
    lines += ['', '## More calculators', '']
    lines += [entry(s) for s in rest]
lines += ['', '## State calculators', '',
 f'- [Sales tax and property tax by state]({SITE}/calculators/sales-tax-calculator.html): State pages for sales tax, property tax and car sales tax live under {SITE}/states/ and are linked from the calculators above.', '',
 '## Optional', '',
 f'- [Sitemap]({SITE}/sitemap.xml): every public page',
 f'- [Privacy policy]({SITE}/privacy.html)',
 f'- [Terms of use]({SITE}/terms.html)', '']
out = os.path.join(ROOT, 'llms.txt')
open(out, 'w', encoding='utf8').write('\n'.join(lines))
print(f'llms.txt: {len(all_calcs)} calculators, {len(hubs)} hubs, {sum(1 for l in lines if l.startswith("- ["))} links')
