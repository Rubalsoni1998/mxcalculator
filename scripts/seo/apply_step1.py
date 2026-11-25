#!/usr/bin/env python3
"""Step 1: titles/descriptions, related links, byline + dates. Safe to re-run (idempotent)."""
import re, sys, glob, html, os
sys.path.insert(0, os.path.dirname(__file__))
from meta import META, BRAND
from related import RELATED

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public'))
UPDATED_ISO, UPDATED_HUMAN = '2026-11-22', 'November 22, 2026'

def full_title(slug):
    phrase = META[slug][0]
    return phrase if len(phrase) + len(BRAND) > 62 else phrase + BRAND

def esc_attr(s):
    return html.escape(s, quote=True).replace('&#x27;', '&#x27;')

# page label (h1) per slug for related links
labels = {}
for f in glob.glob(f'{ROOT}/calculators/*.html'):
    slug = os.path.basename(f)[:-5]
    h = open(f, encoding='utf8').read()
    m = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
    labels[slug] = re.sub(r'<[^>]+>', '', m.group(1)).strip()
labels['pregnancy-conception-calculator'] = 'Conception Date to Due Date Calculator'
labels['conception-calculator'] = 'Conception Calculator'
labels['percent-calculator'] = 'Percentage Calculator'
labels['tax-calculator'] = 'Federal Income Tax Calculator'

def related_block(slug):
    items = ''.join(f'<li><a href="{s}.html">{html.escape(labels[s])}</a></li>' for s in RELATED[slug])
    return f'<h2>Related Calculators</h2>\n      <ul class="related-list">{items}</ul>'

problems = []
for f in sorted(glob.glob(f'{ROOT}/calculators/*.html')):
    slug = os.path.basename(f)[:-5]
    h = open(f, encoding='utf8').read()
    o = h
    # ---- title + description (meta, og, twitter, json-ld)
    old_t = re.search(r'<title>(.*?)</title>', h, re.S).group(1).strip()
    old_d_m = re.search(r'<meta name="description" content="(.*?)">', h)
    old_d = old_d_m.group(1)
    new_t, new_d = full_title(slug), META[slug][1]
    new_t_e, new_d_e = html.escape(new_t, quote=False), html.escape(new_d, quote=True)
    h = h.replace(f'<title>{old_t}</title>', f'<title>{new_t_e}</title>')
    h = h.replace(f'content="{old_t}"', f'content="{new_t_e}"')
    h = h.replace(f'content="{old_d}"', f'content="{new_d_e}"')
    # json-ld description (unescaped quotes / apostrophes)
    old_d_plain = html.unescape(old_d)
    h = h.replace(f'"description":"{old_d_plain}"', '"description":"' + new_d.replace('"', '\\"') + '"')
    if new_d not in h and new_d_e not in h:
        problems.append((slug, 'description not applied'))
    # ---- drop the keywords meta (ignored by Google and Bing)
    h = re.sub(r'\n?\s*<meta name="keywords" content=".*?">', '', h)
    # ---- JSON-LD: modified date + publisher on the WebPage node
    if '"dateModified"' not in h:
        h = h.replace('"@type":"WebPage",', f'"@type":"WebPage","dateModified":"{UPDATED_ISO}","publisher":{{"@type":"Organization","name":"Mx Calculator","url":"https://mxcalculator.com/"}},', 1)
    # ---- byline
    if '<!--seo:byline-->' not in h:
        byline = (f'<p class="byline"><!--seo:byline-->Maintained by the Mx Calculator editorial team · '
                  f'Last updated <time datetime="{UPDATED_ISO}">{UPDATED_HUMAN}</time></p>')
        h, n = re.subn(r'(<div class="calc-description[^"]*">)', r'\1\n      ' + byline.replace('\\', '\\\\'), h, count=1)
        if n != 1: problems.append((slug, 'no calc-description div'))
    # ---- related calculators (replace existing or insert before disclaimer)
    block = related_block(slug)
    pat = re.compile(r'<h2>Related Calculators</h2>\s*<ul class="related-list">.*?</ul>', re.S)
    if pat.search(h):
        h = pat.sub(lambda m: block, h, count=1)
    else:
        h, n = re.subn(r'(\s*)(<p class="disclaimer">)', lambda m: f'{m.group(1)}{block}{m.group(1)}{m.group(2)}', h, count=1)
        if n != 1: problems.append((slug, 'no disclaimer anchor for related block'))
    if h != o:
        open(f, 'w', encoding='utf8').write(h)

print('problems:', problems or 'none')
