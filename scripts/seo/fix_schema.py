#!/usr/bin/env python3
"""Convert the WebApplication JSON-LD node on every page to WebPage.

Why: Google (and Semrush's "Invalid structured data items" check) requires aggregateRating or review on
WebApplication/SoftwareApplication. The site has no genuine ratings, and fabricating them breaks Google's
guidelines, so the pages are described as WebPage instead. BreadcrumbList and FAQPage nodes are untouched.
Idempotent: safe to run again after regenerating pages.
"""
import glob, json, os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'public')
SITE = 'https://mxcalculator.com'
PAT = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
DROP = {'applicationCategory', 'operatingSystem', 'browserRequirements', 'offers', 'aggregateRating', 'review'}

def convert(node):
    if node.get('@type') not in ('WebApplication', 'SoftwareApplication', 'MobileApplication'):
        return node, False
    out = {'@type': 'WebPage'}
    for k, v in node.items():
        if k == '@type' or k in DROP:
            continue
        out[k] = v
    out.setdefault('inLanguage', 'en-US')
    out['isPartOf'] = {'@type': 'WebSite', 'name': 'Mx Calculator', 'url': SITE + '/'}
    return out, True

def fix(html):
    changed = [False]
    def sub(m):
        try:
            data = json.loads(m.group(2))
        except ValueError:
            return m.group(0)
        graph = data.get('@graph')
        nodes = graph if isinstance(graph, list) else [data]
        for i, n in enumerate(nodes):
            nodes[i], c = convert(n)
            changed[0] |= c
        if isinstance(graph, list): data['@graph'] = nodes
        else: data = nodes[0]
        s = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
        return m.group(1) + s + m.group(3)
    return PAT.sub(sub, html), changed[0]

if __name__ == '__main__':
    n = 0
    for p in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        h = open(p, encoding='utf8').read()
        new, c = fix(h)
        if c:
            open(p, 'w', encoding='utf8').write(new); n += 1
    print(f'fix_schema: converted {n} pages')
