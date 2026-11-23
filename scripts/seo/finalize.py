#!/usr/bin/env python3
"""Step 4 wiring: home page sections, hub/state links on calculators, sitemap. Idempotent."""
import os, re, glob, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
import importlib.util
spec = importlib.util.spec_from_file_location('gs', f'{HERE}/gen_states.py')
# reuse the TOPICS table without regenerating pages: parse it from source
src = open(f'{HERE}/gen_states.py', encoding='utf8').read()
topics_src = src[src.index('TOPICS = {'):src.index('def topic_page')]
ns = {}; exec(topics_src, {'__builtins__': __builtins__}, ns); TOPICS = ns['TOPICS']
slug2hub = {}
for hub, t in TOPICS.items():
    for _, items in t['groups']:
        for s in items: slug2hub[s] = hub
hub_label = {'home-buying-calculators': 'Home Buying Calculators', 'tax-calculators': 'US Tax Calculators', 'loans-and-investing-calculators': 'Loan & Investing Calculators',
             'health-and-fitness-calculators': 'Health & Fitness Calculators', 'everyday-calculators': 'Everyday Calculators'}
extra_by_slug = {'sales-tax-calculator': ('../states/sales-tax-by-state.html', 'Sales Tax by State'),
                 'car-sales-tax-calculator': ('../states/sales-tax-by-state.html', 'Sales Tax by State'),
                 'property-tax-calculator': ('../states/property-tax-by-state.html', 'Property Tax by State')}
# 1) calculator pages: hub link (+ state link) appended to the related list
n = 0
for f in glob.glob(f'{ROOT}/calculators/*.html'):
    s = os.path.basename(f)[:-5]; h = open(f, encoding='utf8').read()
    if '../topics/' in h: continue
    add = ''
    if s in extra_by_slug: add += f'<li><a href="{extra_by_slug[s][0]}">{extra_by_slug[s][1]}</a></li>'
    if s in slug2hub: add += f'<li><a href="../topics/{slug2hub[s]}.html">{hub_label[slug2hub[s]]}</a></li>'
    h2 = re.sub(r'(<ul class="related-list">.*?)(</ul>)', lambda m: m.group(1) + add + m.group(2), h, count=1, flags=re.S)
    if h2 != h: open(f, 'w', encoding='utf8').write(h2); n += 1
print('calculator pages linked:', n)
# 2) home page section
p = f'{ROOT}/index.html'; h = open(p, encoding='utf8').read()
if 'id="guides"' not in h:
    block = '''        <div class="category-section" id="guides">
            <h2 class="section-heading">Guides &amp; Taxes by State</h2>
            <div class="grid-layout">
                <article class="card">
                    <div class="card-icon">📚</div>
                    <h3>Topic Guides</h3>
                    <p class="card-desc">Every calculator on a subject, with short guidance on how to use them.</p>
                    <ul>
                        <li data-kw="home buying mortgage pmi closing"><a href="topics/home-buying-calculators.html">Home Buying Calculators</a></li>
                        <li data-kw="tax irs refund credits"><a href="topics/tax-calculators.html">US Tax Calculators</a></li>
                        <li data-kw="loans investing retirement"><a href="topics/loans-and-investing-calculators.html">Loan &amp; Investing Calculators</a></li>
                        <li data-kw="health fitness pregnancy bmi"><a href="topics/health-and-fitness-calculators.html">Health &amp; Fitness Calculators</a></li>
                        <li data-kw="math time school everyday"><a href="topics/everyday-calculators.html">Everyday Calculators</a></li>
                    </ul>
                </article>
                <article class="card">
                    <div class="card-icon">🗺️</div>
                    <h3>Taxes by State</h3>
                    <p class="card-desc">2026 sales tax and property tax for all 50 states, with a calculator for each.</p>
                    <ul>
                        <li data-kw="sales tax state rates"><a href="states/sales-tax-by-state.html">Sales Tax by State</a></li>
                        <li data-kw="property tax state rates"><a href="states/property-tax-by-state.html">Property Tax by State</a></li>
                        <li data-kw="texas"><a href="states/texas-sales-tax-calculator.html">Texas Sales Tax Calculator</a></li>
                        <li data-kw="california"><a href="states/california-sales-tax-calculator.html">California Sales Tax Calculator</a></li>
                        <li data-kw="florida"><a href="states/florida-property-tax-calculator.html">Florida Property Tax Calculator</a></li>
                        <li data-kw="new york"><a href="states/new-york-sales-tax-calculator.html">New York Sales Tax Calculator</a></li>
                    </ul>
                </article>
            </div>
        </div>
'''
    marker = '    </div>\n\n    <!-- Modal Overlay -->'
    assert marker in h
    h = h.replace(marker, block + marker, 1)
    h = h.replace('<a href="terms.html" style="color:var(--primary); text-decoration:none; margin:0 10px;">Terms</a>',
                  '<a href="terms.html" style="color:var(--primary); text-decoration:none; margin:0 10px;">Terms</a>\n            <a href="states/sales-tax-by-state.html" style="color:var(--primary); text-decoration:none; margin:0 10px;">Sales tax by state</a>\n            <a href="states/property-tax-by-state.html" style="color:var(--primary); text-decoration:none; margin:0 10px;">Property tax by state</a>', 1)
    open(p, 'w', encoding='utf8').write(h)
    print('home page updated')
# 3) sitemap
urls = [('', '2026-11-23')]
urls += [(f'calculators/{os.path.basename(f)}', '2026-11-22') for f in sorted(glob.glob(f'{ROOT}/calculators/*.html'))]
urls += [('privacy.html', '2026-11-18'), ('terms.html', '2026-11-18')]
urls += [(f'topics/{os.path.basename(f)}', '2026-11-23') for f in sorted(glob.glob(f'{ROOT}/topics/*.html'))]
hubs = ['states/sales-tax-by-state.html', 'states/property-tax-by-state.html']
urls += [(u, '2026-11-23') for u in hubs]
urls += [(f'states/{os.path.basename(f)}', '2026-11-23') for f in sorted(glob.glob(f'{ROOT}/states/*.html')) if f'states/{os.path.basename(f)}' not in hubs]
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>https://mxcalculator.com/{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls) + '</urlset>\n'
open(f'{ROOT}/sitemap.xml', 'w', encoding='utf8').write(xml)
print('sitemap urls:', len(urls))
