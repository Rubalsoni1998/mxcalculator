#!/usr/bin/env python3
"""Step 3: insert expanded sections, extra FAQs (HTML + FAQPage JSON-LD) and sources into calculator pages. Idempotent."""
import re, os, json, glob, html
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
MARK = '<!--seo:expanded-->'
done, skipped = [], []
for jf in sorted(glob.glob(f'{HERE}/content/*.json')):
    d = json.load(open(jf, encoding='utf8'))
    slug = d['slug']; f = f'{ROOT}/calculators/{slug}.html'
    h = open(f, encoding='utf8').read()
    if MARK in h: skipped.append(slug); continue
    faq_html = ''.join(f'<details class="faq-item"><summary>{html.escape(q["q"])}</summary><p>{html.escape(q["a"])}</p></details>' for q in d['extra_faqs'])
    # 1) sections before the FAQ heading
    anchor = '<h2>Frequently Asked Questions</h2>'
    assert anchor in h, slug
    h = h.replace(anchor, f'{MARK}\n      {d["sections"]}\n      {anchor}', 1)
    # 2) extra FAQ items at the end of the FAQ list
    m = re.search(r'(<div class="faq">.*?)(</div>\s*)(?=<(?:h2|p class="disclaimer"|/div))', h[h.find(anchor):], re.S)
    start = h.find(anchor)
    seg = h[start:]
    m = re.search(r'<div class="faq">(.*?)</div>', seg, re.S)
    assert m, slug
    new_seg = seg[:m.end(1)] + faq_html + seg[m.end(1):]
    h = h[:start] + new_seg
    # 3) sources before related calculators
    if d.get('sources'):
        src = '<h2>Sources</h2>\n      <ul class="sources">' + ''.join(f'<li><a href="{html.escape(s["url"])}" rel="noopener" target="_blank">{html.escape(s["title"])}</a></li>' for s in d['sources']) + '</ul>\n      '
        h = h.replace('<h2>Related Calculators</h2>', src + '<h2>Related Calculators</h2>', 1)
    # 4) FAQPage JSON-LD
    def patch(m):
        try: obj = json.loads(m.group(1))
        except Exception: return m.group(0)
        nodes = obj['@graph'] if isinstance(obj, dict) and '@graph' in obj else [obj]
        hit = False
        for n in nodes:
            if isinstance(n, dict) and n.get('@type') == 'FAQPage':
                n['mainEntity'] += [{"@type": "Question", "name": q['q'], "acceptedAnswer": {"@type": "Answer", "text": q['a']}} for q in d['extra_faqs']]
                hit = True
        if not hit: return m.group(0)
        return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'
    h2 = re.sub(r'<script type="application/ld\+json">(.*?)</script>', patch, h, flags=re.S)
    assert h2 != h or True
    open(f, 'w', encoding='utf8').write(h2)
    done.append(slug)
print('applied', len(done), 'skipped', len(skipped))
