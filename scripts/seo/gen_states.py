#!/usr/bin/env python3
"""Step 4: generate state sales-tax and property-tax pages (50 + 50), two state hubs and five topic hubs."""
import os, re, json, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meta import META

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
SITE = 'https://mxcalculator.com'
TODAY_ISO, TODAY_HUMAN = '2026-11-23', 'November 23, 2026'
os.makedirs(f'{ROOT}/states', exist_ok=True)
os.makedirs(f'{ROOT}/topics', exist_ok=True)
esc = html.escape

# ---------------------------------------------------------------- data
SALES_RAW = """Alabama|4.00|5.46|9.46|5
Louisiana|5.00|5.13|10.13|1
Colorado|2.90|4.99|7.89|16
Oklahoma|4.50|4.56|9.06|6
New York|4.00|4.54|8.54|10
Missouri|4.23|4.22|8.44|12
Georgia|4.00|3.56|7.56|18
Washington|6.50|3.07|9.57|3
Arkansas|6.50|2.98|9.48|4
Arizona|5.60|2.94|8.54|11
New Mexico|4.88|2.80|7.68|17
Illinois|6.25|2.73|8.98|8
Tennessee|7.00|2.61|9.61|2
North Carolina|4.75|2.35|7.10|22
Kansas|6.50|2.21|8.71|9
North Dakota|5.00|2.09|7.09|23
Texas|6.25|1.95|8.20|14
South Dakota|4.20|1.91|6.11|36
Alaska|0.00|1.82|1.82|46
California|7.25|1.78|9.03|7
Ohio|5.75|1.54|7.29|21
South Carolina|6.00|1.49|7.49|19
Nebraska|5.50|1.48|6.98|27
Wyoming|4.00|1.39|5.39|44
Nevada|6.85|1.39|8.24|13
Utah|6.10|1.32|7.42|20
Minnesota|6.88|1.26|8.14|15
Florida|6.00|0.98|6.98|28
Iowa|6.00|0.94|6.94|29
Wisconsin|5.00|0.72|5.72|42
West Virginia|6.00|0.60|6.60|31
Hawaii|4.00|0.50|4.50|45
Virginia|5.30|0.47|5.77|41
Vermont|6.00|0.43|6.43|32
Pennsylvania|6.00|0.34|6.34|34
Mississippi|7.00|0.06|7.06|24
Idaho|6.00|0.03|6.03|37
Indiana|7.00|0.00|7.00|25
Rhode Island|7.00|0.00|7.00|25
Connecticut|6.35|0.00|6.35|33
Massachusetts|6.25|0.00|6.25|35
Kentucky|6.00|0.00|6.00|38
Maryland|6.00|0.00|6.00|38
Michigan|6.00|0.00|6.00|38
Maine|5.50|0.00|5.50|43
Delaware|0.00|0.00|0.00|47
Montana|0.00|0.00|0.00|47
New Hampshire|0.00|0.00|0.00|47
Oregon|0.00|0.00|0.00|47
New Jersey|6.63|-0.02|6.60|30"""
SALES = {}
for line in SALES_RAW.splitlines():
    n, s, l, c, r = line.split('|')
    SALES[n] = dict(state=float(s), local=float(l), combined=float(c), rank=int(r))
assert len(SALES) == 50
NATIONAL_AVG = 7.53

# property tax data comes from the existing calculator script so the site stays consistent
js = open(f'{ROOT}/../assets-src/js/pages/property-tax-calculator.js', encoding='utf8').read()
PROP = {}
for n, r, v in re.findall(r"\['([A-Za-z ]+)', ([0-9.]+), (\d+)\]", js):
    PROP[n] = dict(rate=float(r), value=int(v))
assert len(PROP) == 50, len(PROP)
prop_sorted = sorted(PROP, key=lambda k: (-PROP[k]['rate'], k))
for i, n in enumerate(prop_sorted): PROP[n]['rank'] = i + 1
# ties get the same rank
last = None
for i, n in enumerate(prop_sorted):
    if last is not None and PROP[n]['rate'] == PROP[last]['rate']: PROP[n]['rank'] = PROP[last]['rank']
    last = n

ADJ = {
 'Alabama': 'FL GA MS TN', 'Arizona': 'CA NV UT CO NM', 'Arkansas': 'LA MS TN MO OK TX', 'California': 'OR NV AZ',
 'Colorado': 'WY NE KS OK NM UT', 'Connecticut': 'NY MA RI', 'Delaware': 'MD PA NJ', 'Florida': 'AL GA', 'Georgia': 'FL AL TN NC SC',
 'Idaho': 'WA OR NV UT WY MT', 'Illinois': 'WI IA MO KY IN', 'Indiana': 'MI OH KY IL', 'Iowa': 'MN WI IL MO NE SD',
 'Kansas': 'NE MO OK CO', 'Kentucky': 'IL IN OH WV VA TN MO', 'Louisiana': 'TX AR MS', 'Maine': 'NH', 'Maryland': 'PA DE VA WV',
 'Massachusetts': 'NH VT NY CT RI', 'Michigan': 'OH IN WI', 'Minnesota': 'ND SD IA WI', 'Mississippi': 'LA AR TN AL',
 'Missouri': 'IA IL KY TN AR OK KS NE', 'Montana': 'ID WY SD ND', 'Nebraska': 'SD IA MO KS CO WY', 'Nevada': 'OR ID UT AZ CA',
 'New Hampshire': 'ME VT MA', 'New Jersey': 'NY PA DE', 'New Mexico': 'AZ CO OK TX UT', 'New York': 'NJ PA CT MA VT',
 'North Carolina': 'SC GA TN VA', 'North Dakota': 'MN SD MT', 'Ohio': 'PA WV KY IN MI', 'Oklahoma': 'KS MO AR TX NM CO',
 'Oregon': 'WA ID NV CA', 'Pennsylvania': 'NY NJ DE MD WV OH', 'Rhode Island': 'CT MA', 'South Carolina': 'NC GA',
 'South Dakota': 'ND MN IA NE WY MT', 'Tennessee': 'KY VA NC GA AL MS AR MO', 'Texas': 'NM OK AR LA',
 'Utah': 'ID WY CO NM AZ NV', 'Vermont': 'NH MA NY', 'Virginia': 'MD WV KY TN NC', 'Washington': 'ID OR',
 'West Virginia': 'OH PA MD VA KY', 'Wisconsin': 'MI MN IA IL', 'Wyoming': 'MT SD NE CO UT ID',
}
ABBR = dict(AL='Alabama', AK='Alaska', AZ='Arizona', AR='Arkansas', CA='California', CO='Colorado', CT='Connecticut', DE='Delaware',
 FL='Florida', GA='Georgia', HI='Hawaii', ID='Idaho', IL='Illinois', IN='Indiana', IA='Iowa', KS='Kansas', KY='Kentucky', LA='Louisiana',
 ME='Maine', MD='Maryland', MA='Massachusetts', MI='Michigan', MN='Minnesota', MS='Mississippi', MO='Missouri', MT='Montana',
 NE='Nebraska', NV='Nevada', NH='New Hampshire', NJ='New Jersey', NM='New Mexico', NY='New York', NC='North Carolina', ND='North Dakota',
 OH='Ohio', OK='Oklahoma', OR='Oregon', PA='Pennsylvania', RI='Rhode Island', SC='South Carolina', SD='South Dakota', TN='Tennessee',
 TX='Texas', UT='Utah', VT='Vermont', VA='Virginia', WA='Washington', WV='West Virginia', WI='Wisconsin', WY='Wyoming')
assert len(ABBR) == 50
def slug(n): return n.lower().replace(' ', '-')
def neighbors(n, table, key):
    if n in ADJ: return [ABBR[a] for a in ADJ[n].split()][:6]
    # Alaska and Hawaii have no land neighbors: use the states with the closest value instead
    others = sorted((k for k in table if k != n), key=lambda k: abs(table[k][key] - table[n][key]))
    return others[:4]

def pct(x, d=2): return f'{x:.{d}f}%'
def usd(x): return f'${x:,.0f}'
def usd2(x): return f'${x:,.2f}'

# ---------------------------------------------------------------- shared page shell
def head(title, desc, url_path, depth, jsonld, extra_css='states.css', extra_js=None):
    up = '../' * depth
    return f'''<!DOCTYPE html>
<html lang="en-US">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YP02WGF13D"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-YP02WGF13D');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title, quote=False)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{SITE}/{url_path}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Mx Calculator">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{SITE}/{url_path}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(desc)}">
  <script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')}</script>
  <meta property="og:image" content="{SITE}/assets/img/og-image.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Mx Calculator logo">
  <meta name="twitter:image" content="{SITE}/assets/img/og-image.png">
  <meta name="theme-color" content="#14b8aa">
  <link rel="icon" href="{up}favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="{up}assets/img/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="{up}apple-touch-icon.png">
  <link rel="manifest" href="{up}site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"></noscript>
  <link rel="stylesheet" href="{up}assets/css/base.css">
  <link rel="stylesheet" href="{up}assets/css/seo-content.css">
  <link rel="stylesheet" href="{up}assets/css/{extra_css}">
  <link rel="stylesheet" href="{up}assets/css/responsive.css">
  <script defer src="{up}assets/js/enhance.js"></script>
{f'  <script defer src="{up}assets/js/{extra_js}"></script>' if extra_js else ''}
  <script defer src="{up}assets/js/responsive.js"></script>
</head>
'''

def header_html(h1, sub, back_href, back_text):
    return f'''<body>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <a href="{back_href}" class="back-link" aria-label="{esc(back_text)}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><span class="back-text">{esc(back_text)}</span></a>
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div>
          <h1>{esc(h1)}</h1>
          <p>{esc(sub)}</p>
        </div>
      </div>
    </div>
  </header>
'''

def footer_html(up, label):
    return f'''
  <footer class="footer">
    <div class="container">
      <p>{esc(label)}</p>
      <p><a class="footer-home" href="{up}index.html">&larr; All calculators</a></p>
      <p class="footer-legal">Estimates for general information only, not professional or tax advice. <a href="{up}privacy.html">Privacy</a> &middot; <a href="{up}terms.html">Terms</a></p>
    </div>
  </footer>
</body>
</html>
'''

BYLINE = f'<p class="byline">Maintained by the Mx Calculator editorial team · Last updated <time datetime="{TODAY_ISO}">{TODAY_HUMAN}</time></p>'

def faq_block(faqs):
    return '<h2>Frequently Asked Questions</h2>\n      <div class="faq">' + ''.join(
        f'<details class="faq-item"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in faqs) + '</div>'

def jsonld(name, desc, path, crumbs, faqs, app=True):
    g = []
    if app:
        # WebPage, not WebApplication: Google requires aggregateRating/review on app types and the site has no genuine ratings.
        g.append({"@type": "WebPage", "name": name, "description": desc, "url": f"{SITE}/{path}", "inLanguage": "en-US",
                  "dateModified": TODAY_ISO, "isPartOf": {"@type": "WebSite", "name": "Mx Calculator", "url": SITE + "/"},
                  "publisher": {"@type": "Organization", "name": "Mx Calculator", "url": SITE + "/"}})
    g.append({"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": f"{SITE}/{p}"} for i, (n, p) in enumerate(crumbs)]})
    if faqs:
        g.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]})
    return {"@context": "https://schema.org", "@graph": g}

def title_for(phrase):
    return phrase if len(phrase) + 16 > 62 else phrase + ' | Mx Calculator'

def neighbor_links(names, kind):
    return ' '.join(f'<a href="{slug(n)}-{kind}-calculator.html">{esc(n)}</a>' for n in names)

# ---------------------------------------------------------------- sales tax pages
def sales_page(n):
    d = SALES[n]; s, l, c, rk = d['state'], d['local'], d['combined'], d['rank']
    sl = slug(n); path = f'states/{sl}-sales-tax-calculator.html'
    diff = c - NATIONAL_AVG
    rel = 'above' if diff > 0.005 else 'below' if diff < -0.005 else 'equal to'
    notax = (s == 0 and l == 0)
    if notax:
        local_p = (f'{n} has no statewide sales tax, and Tax Foundation reports no local general sales tax either, so most purchases carry no general sales tax. '
                   'Other taxes can still apply to specific items such as lodging, meals or vehicles, and some localities add special taxes, so check with the state revenue department for your situation.')
    elif s == 0:
        local_p = (f'{n} has no statewide sales tax, but cities and boroughs can levy their own. Tax Foundation puts the average local rate at {pct(l)}, so the rate you pay depends entirely on where you buy.')
    elif l == 0:
        local_p = (f'Tax Foundation reports no local general sales tax in {n}, so the {pct(s)} state rate is the general rate everywhere in the state. Some items, such as meals, lodging or vehicles, can be taxed differently.')
    elif l < 0:
        local_p = (f'The state rate in {n} is {pct(s)}. The negative average local figure reflects Urban Enterprise Zones in some cities, where sellers collect half the statewide rate. Most purchases are taxed at the state rate.')
    else:
        local_p = (f'Cities, counties and special districts in {n} can add their own sales tax on top of the {pct(s)} state rate. Tax Foundation puts the average local rate at {pct(l)}, which makes the average combined rate {pct(c)}. Your real rate depends on where the sale is sourced, so use the exact combined rate for your address if you know it.')
    amounts = [10, 100, 500, 1000, 5000, 25000]
    rows = ''.join(f'<tr><td>{usd(a)}</td><td>{usd2(a*s/100)}</td><td>{usd2(a*c/100)}</td><td>{usd2(a*(1+c/100))}</td></tr>' for a in amounts)
    nb = neighbors(n, SALES, 'combined')
    nbl = 'Neighboring states' if n in ADJ else 'Closest states by combined rate'
    nbrows = ''.join(f'<tr><td><a href="{slug(x)}-sales-tax-calculator.html">{esc(x)}</a></td><td>{pct(SALES[x]["state"])}</td><td>{pct(SALES[x]["local"])}</td><td>{pct(SALES[x]["combined"])}</td></tr>' for x in nb)
    phrase = f'{n} Sales Tax Calculator (2026 Rates)'
    title = title_for(phrase)
    if s == 0 and l == 0:
        desc = f'{n} has no state or general local sales tax. See neighboring state rates, what that means at checkout, and use the calculator with any rate.'
    else:
        desc = f'{n} state sales tax is {pct(s)} and the average combined rate with local tax is {pct(c)}. Calculate tax on any purchase with 2026 rates.'
    if len(desc) > 160: desc = desc[:157].rsplit(' ', 1)[0] + '…'
    faqs = [
        (f'What is the sales tax rate in {n}?', (f'{n} has no statewide sales tax and no general local sales tax.' if notax else f'The {n} state sales tax rate is {pct(s)}. Including local taxes, the average combined rate is {pct(c)}, which ranks {rk} among the 50 states (1 is highest), according to Tax Foundation midyear 2026 data.')),
        (f'Does {n} have local sales tax?', local_p),
        (f'How much is sales tax on $1,000 in {n}?', (f'At the state rate of {pct(s)}, sales tax on $1,000 is {usd2(1000*s/100)}. At the average combined rate of {pct(c)}, it is {usd2(1000*c/100)}. Your actual amount depends on your local rate.' if not notax else f'There is no general sales tax on a $1,000 purchase in {n}, though specific items can be taxed.')),
        (f'Is the sales tax in {n} higher than the national average?', f'The average combined rate in {n} is {pct(c)}, which is {rel if rel == "equal to" else f"{abs(diff):.2f} points {rel}"} the {NATIONAL_AVG}% national average used by Tax Foundation.'),
    ]
    body = f'''  <main class="container">
    <div class="card animate-slide-up st-card">
      <div class="card-header"><div class="card-title">Sales Tax Calculator for {esc(n)}</div></div>
      <div class="card-content st-calc" data-st="sales" data-state-rate="{s}" data-local-rate="{max(l, 0)}">
        <div class="st-grid">
          <div class="form-group">
            <label class="form-label" for="stAmount">Purchase amount ($)</label>
            <input type="number" id="stAmount" value="100" min="0" step="0.01" inputmode="decimal">
          </div>
          <div class="form-group">
            <label class="form-label" for="stRateType">Tax rate</label>
            <select id="stRateType">
              <option value="state">{esc(n)} state rate ({pct(s)})</option>
              <option value="combined" selected>State + average local ({pct(s + max(l, 0))})</option>
              <option value="custom">My own rate</option>
            </select>
          </div>
          <div class="form-group" id="stCustomWrap" hidden>
            <label class="form-label" for="stCustom">Custom rate (%)</label>
            <input type="number" id="stCustom" value="{c}" min="0" step="0.001" inputmode="decimal">
          </div>
          <div class="form-group">
            <label class="form-label" for="stMode">I want to</label>
            <select id="stMode"><option value="add" selected>Add tax to a price</option><option value="remove">Find the price before tax</option></select>
          </div>
        </div>
        <div class="st-result" aria-live="polite">
          <div><span class="st-label" id="stL1">Sales tax</span><strong id="stR1">–</strong></div>
          <div><span class="st-label" id="stL2">Total</span><strong id="stR2">–</strong></div>
          <div><span class="st-label">Rate used</span><strong id="stR3">–</strong></div>
        </div>
      </div>
    </div>

    <div class="calc-description seo-content">
      {BYLINE}
      <h2>{esc(n)} sales tax rates at a glance</h2>
      <table><thead><tr><th>Measure</th><th>{esc(n)}</th></tr></thead><tbody>
        <tr><td>State sales tax rate</td><td>{pct(s)}</td></tr>
        <tr><td>Average local rate</td><td>{pct(l)}</td></tr>
        <tr><td>Average combined rate</td><td>{pct(c)}</td></tr>
        <tr><td>Rank among 50 states (1 = highest)</td><td>{rk}</td></tr>
        <tr><td>National average combined rate</td><td>{NATIONAL_AVG}%</td></tr>
      </tbody></table>
      <p>Rates are from Tax Foundation's midyear 2026 report (rates as of July 1, 2026). The average local rate is weighted by population, so it describes a typical purchase rather than any one city.</p>
      <h2>Local sales tax in {esc(n)}</h2>
      <p>{local_p}</p>
      <h2>How much tax will you pay in {esc(n)}?</h2>
      <table><thead><tr><th>Purchase</th><th>At state rate ({pct(s)})</th><th>Tax at avg. combined ({pct(c)})</th><th>Total at avg. combined</th></tr></thead><tbody>{rows}</tbody></table>
      <h2>{esc(n)} compared with {'its neighbors' if n in ADJ else 'states with similar rates'}</h2>
      <table><thead><tr><th>{nbl}</th><th>State rate</th><th>Avg. local</th><th>Avg. combined</th></tr></thead><tbody>{nbrows}</tbody></table>
      <p>See every state on the <a href="sales-tax-by-state.html">sales tax by state</a> page.</p>
      <h2>Before you rely on the number</h2>
      <ul>
        <li>Rates change. Check the state revenue department for the rate at your exact address.</li>
        <li>Many states exempt or reduce tax on some items, such as groceries, clothing or prescriptions, and the rules differ by state.</li>
        <li>Cars have their own rules in many states. Use the <a href="../calculators/car-sales-tax-calculator.html">car sales tax calculator</a> for vehicles.</li>
        <li>For a purchase in any state, use the general <a href="../calculators/sales-tax-calculator.html">sales tax calculator</a>.</li>
      </ul>
      {faq_block(faqs)}
      <h2>Related pages</h2>
      <ul class="related-list"><li><a href="{sl}-property-tax-calculator.html">{esc(n)} property tax calculator</a></li><li><a href="sales-tax-by-state.html">Sales tax by state</a></li><li><a href="../calculators/sales-tax-calculator.html">Sales Tax Calculator</a></li><li><a href="../calculators/car-sales-tax-calculator.html">Car Sales Tax Calculator</a></li><li><a href="../topics/tax-calculators.html">US Tax Calculators</a></li></ul>
      <p class="byline">Source: <a href="https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/" rel="noopener" target="_blank">Tax Foundation, State and Local Sales Tax Rates, Midyear 2026</a>.</p>
      <p class="disclaimer">Results are estimates from the rate you choose. Always confirm the rate with the seller or your state revenue department.</p>
    </div>
  </main>
'''
    page = head(title, desc, path, 1, jsonld(f'{n} Sales Tax Calculator', desc, path, [('Home', ''), ('Sales tax by state', 'states/sales-tax-by-state.html'), (n, path)], faqs), extra_js='state-calc.js')
    page += header_html(f'{n} Sales Tax Calculator', '2026 state and local rates', 'sales-tax-by-state.html', 'Sales tax by state') + body + footer_html('../', f'{n} Sales Tax Calculator | Tax Tool')
    return path, page

# ---------------------------------------------------------------- property tax pages
def property_page(n):
    d = PROP[n]; r, v, rk = d['rate'], d['value'], d['rank']
    sl = slug(n); path = f'states/{sl}-property-tax-calculator.html'
    med_tax = v * r / 100
    rates = sorted(p['rate'] for p in PROP.values()); avg_rate = sum(rates) / len(rates)
    level = 'among the highest' if rk <= 10 else 'above the middle of the pack' if rk <= 22 else 'below the middle of the pack' if rk <= 38 else 'among the lowest'
    homes = [200000, 300000, 400000, 500000, 750000]
    rows = ''.join(f'<tr><td>{usd(h)}</td><td>{usd(h*r/100)}</td><td>{usd(h*r/1200)}</td></tr>' for h in homes)
    nb = neighbors(n, PROP, 'rate')
    nbrows = ''.join(f'<tr><td><a href="{slug(x)}-property-tax-calculator.html">{esc(x)}</a></td><td>{pct(PROP[x]["rate"])}</td><td>{usd(PROP[x]["value"])}</td><td>{usd(PROP[x]["value"]*PROP[x]["rate"]/100)}</td></tr>' for x in nb)
    special = ''
    if n == 'California':
        special = '<p>California\'s Proposition 13 limits the base property tax rate to about 1% of assessed value and caps annual assessment increases at 2% until the property is sold or newly built. That is why long-time owners often pay much less than new buyers on similar homes, and why a home\'s effective rate on its market value can sit well below the rate on its assessed value.</p>'
    if n == 'Florida':
        special = '<p>Florida\'s Save Our Homes cap limits how much the assessed value of a homestead-exempt primary residence can rise each year (3% or inflation, whichever is lower). Non-homestead properties, such as second homes and rentals, are not covered by this cap, so their bills can rise faster.</p>'
    phrase = f'{n} Property Tax Calculator (Effective Rate {pct(r)})'
    title = title_for(phrase if len(phrase) <= 46 else f'{n} Property Tax Calculator')
    desc = f'The effective property tax rate in {n} is {pct(r)} (rank {rk} of 50). Estimate the annual and monthly tax on any home value, with exemptions.'
    faqs = [
        (f'What is the property tax rate in {n}?', f'The average effective property tax rate in {n} is {pct(r)} of home value, which ranks {rk} among the 50 states (1 is highest). Local rates vary by county, city and school district.'),
        (f'How much is property tax on a ${v:,.0f} home in {n}?', f'At the state average effective rate of {pct(r)}, property tax on a {usd(v)} home is about {usd(med_tax)} a year, or {usd(med_tax/12)} a month.'),
        (f'Is property tax high in {n}?', f'The {pct(r)} effective rate in {n} is {level} of the 50 states. For comparison, the simple average across states is {pct(avg_rate)}.'),
        (f'How is property tax calculated in {n}?', 'Local governments multiply the assessed value of your property by their tax rates (often expressed in mills, or dollars per $1,000). The effective rate is the tax bill divided by the home\'s market value, which makes states easier to compare.'),
    ]
    body = f'''  <main class="container">
    <div class="card animate-slide-up st-card">
      <div class="card-header"><div class="card-title">Property Tax Calculator for {esc(n)}</div></div>
      <div class="card-content st-calc" data-st="property" data-rate="{r}">
        <div class="st-grid">
          <div class="form-group">
            <label class="form-label" for="ptValue">Home value ($)</label>
            <input type="number" id="ptValue" value="{v}" min="0" step="1000" inputmode="decimal">
          </div>
          <div class="form-group">
            <label class="form-label" for="ptRate">Effective tax rate (%)</label>
            <input type="number" id="ptRate" value="{r}" min="0" step="0.01" inputmode="decimal">
          </div>
          <div class="form-group">
            <label class="form-label" for="ptExempt">Exemption or deduction ($)</label>
            <input type="number" id="ptExempt" value="0" min="0" step="1000" inputmode="decimal">
          </div>
        </div>
        <div class="st-result" aria-live="polite">
          <div><span class="st-label">Annual property tax</span><strong id="ptR1">–</strong></div>
          <div><span class="st-label">Monthly</span><strong id="ptR2">–</strong></div>
          <div><span class="st-label">Taxable value</span><strong id="ptR3">–</strong></div>
        </div>
      </div>
    </div>

    <div class="calc-description seo-content">
      {BYLINE}
      <h2>{esc(n)} property tax at a glance</h2>
      <table><thead><tr><th>Measure</th><th>{esc(n)}</th></tr></thead><tbody>
        <tr><td>Average effective property tax rate</td><td>{pct(r)}</td></tr>
        <tr><td>Rank among 50 states (1 = highest)</td><td>{rk}</td></tr>
        <tr><td>Median home value</td><td>{usd(v)}</td></tr>
        <tr><td>Estimated tax on a median-value home</td><td>{usd(med_tax)} a year ({usd(med_tax/12)} a month)</td></tr>
        <tr><td>Simple average across the 50 states</td><td>{pct(avg_rate)}</td></tr>
      </tbody></table>
      <p>The effective rate is property tax paid divided by home value, so it already reflects assessment practices and exemptions in {esc(n)}. Your own rate depends on your county, city and school district.</p>
      <h2>Property tax on common home values in {esc(n)}</h2>
      <table><thead><tr><th>Home value</th><th>Annual tax at {pct(r)}</th><th>Monthly</th></tr></thead><tbody>{rows}</tbody></table>
      {special}
      <h2>{esc(n)} compared with {'its neighbors' if n in ADJ else 'states with similar rates'}</h2>
      <table><thead><tr><th>State</th><th>Effective rate</th><th>Median home value</th><th>Tax on median home</th></tr></thead><tbody>{nbrows}</tbody></table>
      <p>See all states on the <a href="property-tax-by-state.html">property tax by state</a> page.</p>
      <h2>Getting a more exact estimate</h2>
      <ul>
        <li>Look up your property's assessed value and local levy on your county assessor's website.</li>
        <li>Subtract any exemption (for example a homestead exemption) in the calculator above; eligibility rules differ by state and county.</li>
        <li>Remember that a recent sale or a reassessment can raise your bill. New buyers often pay more than the state average suggests.</li>
        <li>Include property tax in your monthly budget with the <a href="../calculators/mortgage-calculator.html">mortgage calculator</a>.</li>
      </ul>
      {faq_block(faqs)}
      <h2>Related pages</h2>
      <ul class="related-list"><li><a href="{sl}-sales-tax-calculator.html">{esc(n)} sales tax calculator</a></li><li><a href="property-tax-by-state.html">Property tax by state</a></li><li><a href="../calculators/property-tax-calculator.html">Property Tax Calculator</a></li><li><a href="../calculators/mortgage-calculator.html">Mortgage Calculator</a></li><li><a href="../topics/home-buying-calculators.html">Home Buying Calculators</a></li></ul>
      <p class="byline">Source: Tax Foundation effective property tax rates (2024 data, the latest compiled), as published in Rocket Mortgage's "Property taxes by state" rankings.</p>
      <p class="disclaimer">Results are estimates based on an average rate. Your actual tax bill depends on local rates, assessments and exemptions.</p>
    </div>
  </main>
'''
    page = head(title, desc, path, 1, jsonld(f'{n} Property Tax Calculator', desc, path, [('Home', ''), ('Property tax by state', 'states/property-tax-by-state.html'), (n, path)], faqs), extra_js='state-calc.js')
    page += header_html(f'{n} Property Tax Calculator', 'Effective rates by state', 'property-tax-by-state.html', 'Property tax by state') + body + footer_html('../', f'{n} Property Tax Calculator | Tax Tool')
    return path, page

# ---------------------------------------------------------------- state hubs
def hub_sales():
    path = 'states/sales-tax-by-state.html'
    order = sorted(SALES, key=lambda k: (SALES[k]['rank'], k))
    rows = ''.join(f'<tr><td>{SALES[k]["rank"]}</td><td><a href="{slug(k)}-sales-tax-calculator.html">{esc(k)}</a></td><td>{pct(SALES[k]["state"])}</td><td>{pct(SALES[k]["local"])}</td><td>{pct(SALES[k]["combined"])}</td></tr>' for k in order)
    faqs = [('Which state has the highest sales tax?', f'By average combined state and local rate, {order[0]} is highest at {pct(SALES[order[0]]["combined"])} in Tax Foundation\'s midyear 2026 data.'),
            ('Which states have no sales tax?', 'Delaware, Montana, New Hampshire and Oregon have no statewide or general local sales tax. Alaska has no state sales tax but allows local taxes.'),
            ('What is the national average sales tax rate?', f'Tax Foundation reports a population-weighted national average combined rate of {NATIONAL_AVG}% for midyear 2026.')]
    desc = 'State and average local sales tax rates for all 50 states in 2026, ranked from highest to lowest, with a calculator for each state.'
    title = 'Sales Tax by State 2026: Rates & Calculators | Mx Calculator'
    body = f'''  <main class="container">
    <div class="calc-description seo-content">
      {BYLINE}
      <h2>2026 sales tax rates by state</h2>
      <p>This table ranks all 50 states by average combined sales tax rate (state plus average local), using Tax Foundation's midyear 2026 report with rates as of July 1, 2026. The national average is {NATIONAL_AVG}%. Select a state to open its calculator and see the local rate, example amounts and neighboring states.</p>
      <table><thead><tr><th>Rank</th><th>State</th><th>State rate</th><th>Avg. local</th><th>Avg. combined</th></tr></thead><tbody>{rows}</tbody></table>
      <h2>How to use this table</h2>
      <ul><li>The combined figure is an average. The rate where you shop can be higher or lower.</li><li>Four states have no general sales tax: Delaware, Montana, New Hampshire and Oregon.</li><li>Some states allow local taxes while others set one statewide rate.</li><li>For a purchase in any state, use the <a href="../calculators/sales-tax-calculator.html">sales tax calculator</a>; for vehicles, see the <a href="../calculators/car-sales-tax-calculator.html">car sales tax calculator</a>.</li></ul>
      {faq_block(faqs)}
      <h2>Related pages</h2>
      <ul class="related-list"><li><a href="property-tax-by-state.html">Property tax by state</a></li><li><a href="../topics/tax-calculators.html">US Tax Calculators</a></li><li><a href="../calculators/sales-tax-calculator.html">Sales Tax Calculator</a></li></ul>
      <p class="byline">Source: <a href="https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/" rel="noopener" target="_blank">Tax Foundation, State and Local Sales Tax Rates, Midyear 2026</a>.</p>
    </div>
  </main>
'''
    page = head(title, desc, path, 1, jsonld('Sales Tax by State', desc, path, [('Home', ''), ('Sales tax by state', path)], faqs, app=False))
    page += header_html('Sales Tax by State', '2026 rates for all 50 states', '../index.html', 'All calculators') + body + footer_html('../', 'Sales Tax by State | Tax Tool')
    return path, page

def hub_property():
    path = 'states/property-tax-by-state.html'
    order = sorted(PROP, key=lambda k: (PROP[k]['rank'], k))
    rows = ''.join(f'<tr><td>{PROP[k]["rank"]}</td><td><a href="{slug(k)}-property-tax-calculator.html">{esc(k)}</a></td><td>{pct(PROP[k]["rate"])}</td><td>{usd(PROP[k]["value"])}</td><td>{usd(PROP[k]["value"]*PROP[k]["rate"]/100)}</td></tr>' for k in order)
    faqs = [('Which state has the highest property taxes?', f'By effective rate, {order[0]} is highest at {pct(PROP[order[0]]["rate"])} in the data used here (Tax Foundation 2024).'),
            ('Which state has the lowest property taxes?', f'{order[-1]} has the lowest effective rate in this data at {pct(PROP[order[-1]]["rate"])}.'),
            ('What is an effective property tax rate?', 'It is the annual property tax paid divided by the home\'s market value. It makes states comparable even when their assessment methods differ.')]
    desc = 'Effective property tax rates for all 50 states, ranked from highest to lowest, with median home values and a calculator for each state.'
    title = 'Property Tax by State: Rates & Calculators | Mx Calculator'
    body = f'''  <main class="container">
    <div class="calc-description seo-content">
      {BYLINE}
      <h2>Effective property tax rates by state</h2>
      <p>Rank 1 is the highest effective rate. The last column estimates the annual tax on a home worth the state's median value. Select a state for its calculator, tax on common home values and comparison with neighboring states.</p>
      <table><thead><tr><th>Rank</th><th>State</th><th>Effective rate</th><th>Median home value</th><th>Tax on median home</th></tr></thead><tbody>{rows}</tbody></table>
      <h2>Reading the table</h2>
      <ul><li>Effective rates are averages. Counties and school districts within a state can differ a lot.</li><li>A high rate on a low-value home can mean a smaller bill than a low rate on an expensive home, which is why the last column matters.</li><li>Exemptions, caps and reassessment rules change what you actually pay.</li><li>Add property tax to your payment with the <a href="../calculators/mortgage-calculator.html">mortgage calculator</a>.</li></ul>
      {faq_block(faqs)}
      <h2>Related pages</h2>
      <ul class="related-list"><li><a href="sales-tax-by-state.html">Sales tax by state</a></li><li><a href="../topics/home-buying-calculators.html">Home Buying Calculators</a></li><li><a href="../calculators/property-tax-calculator.html">Property Tax Calculator</a></li></ul>
      <p class="byline">Source: Tax Foundation effective property tax rates (2024 data, the latest compiled), as published in Rocket Mortgage's "Property taxes by state" rankings.</p>
    </div>
  </main>
'''
    page = head(title, desc, path, 1, jsonld('Property Tax by State', desc, path, [('Home', ''), ('Property tax by state', path)], faqs, app=False))
    page += header_html('Property Tax by State', 'Effective rates for all 50 states', '../index.html', 'All calculators') + body + footer_html('../', 'Property Tax by State | Tax Tool')
    return path, page

# ---------------------------------------------------------------- topic hubs
labels = {}
for fn in os.listdir(f'{ROOT}/calculators'):
    s = fn[:-5]; h = open(f'{ROOT}/calculators/{fn}', encoding='utf8').read()
    labels[s] = re.sub(r'<[^>]+>', '', re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S).group(1)).strip()

TOPICS = {
 'home-buying-calculators': dict(
   title='Home Buying Calculators: Mortgage, PMI & Closing Costs', h1='Home Buying Calculators', sub='Payments, costs and taxes for US buyers',
   desc='Free home buying calculators for US buyers: monthly mortgage payment, PMI, closing costs, property tax and rental cap rate.',
   intro='Buying a home involves more than the price. The monthly payment, mortgage insurance, closing costs and property tax all affect what you can afford. These calculators let you test each piece with your own numbers before you talk to a lender.',
   groups=[('Estimate the payment', ['mortgage-calculator', 'amortization-calculator', 'pmi-calculator']), ('Plan the upfront and ongoing costs', ['closing-cost-calculator', 'property-tax-calculator']), ('Investment property', ['cap-rate-calculator', 'capital-gains-tax-calculator'])],
   tips=['Start with the total monthly payment, not just principal and interest: add property tax, insurance and PMI.', 'Run the numbers with a rate 0.5 to 1 point higher than today to see whether the budget still works.', 'Compare property tax across states on the <a href="../states/property-tax-by-state.html">property tax by state</a> page.'],
   extra=[('Property tax by state', '../states/property-tax-by-state.html')]),
 'tax-calculators': dict(
   title='US Tax Calculators 2026: Income, Credits & State Tax', h1='US Tax Calculators', sub='Federal, state and sales tax tools for 2026',
   desc='Free US tax calculators for 2026: federal income tax, tax brackets, refund, EITC, child tax credit, capital gains, sales tax and property tax by state.',
   intro='Taxes are easier to plan when you can see how brackets, credits and deductions fit together. Use these calculators to estimate your federal tax, see how credits change your refund, and look up sales and property tax for any state.',
   groups=[('Federal income tax', ['tax-calculator', 'tax-bracket-calculator', 'tax-refund-estimator']), ('Credits', ['eitc-calculator', 'child-tax-credit-calculator']), ('Investments and windfalls', ['capital-gains-tax-calculator', 'lottery-tax-calculator']), ('Sales and property tax', ['sales-tax-calculator', 'car-sales-tax-calculator', 'property-tax-calculator'])],
   tips=['Your marginal rate applies only to the income in the top bracket, not to all of it.', 'Credits reduce tax dollar for dollar, so they are usually worth more than deductions of the same size.', 'These are estimates. Use IRS guidance or a tax professional for filing decisions.'],
   extra=[('Sales tax by state', '../states/sales-tax-by-state.html'), ('Property tax by state', '../states/property-tax-by-state.html')]),
 'loans-and-investing-calculators': dict(
   title='Loan & Investment Calculators: Payments, Interest, Retirement', h1='Loan & Investing Calculators', sub='Borrow smarter and plan how money grows',
   desc='Free loan and investment calculators: monthly payment, amortization, auto loan, compound interest, investment growth, dividends, retirement and inflation.',
   intro='Whether you are comparing loan offers or planning for retirement, the same ideas apply: interest, time and regular payments. These calculators show how those inputs change the result.',
   groups=[('Loans and payments', ['loan-calculator', 'payment-calculator', 'amortization-calculator', 'auto-loan-calculator', 'car-affordability-calculator', 'interest-rate-calculator']), ('Saving and investing', ['compound-interest-calculator', 'investment-calculator', 'dividend-calculator', 'stock-profit-calculator', 'retirement-calculator', 'net-worth-calculator']), ('Interest and inflation', ['interest-calculator', 'inflation-calculator', 'finance-calculator']), ('Income', ['salary-calculator'])],
   tips=['Compare loans by total interest as well as monthly payment.', 'Small rate differences compound over long terms.', 'Test investment plans with a range of returns, not a single guess.'], extra=[]),
 'health-and-fitness-calculators': dict(
   title='Health & Fitness Calculators: BMI, Calories, Pregnancy', h1='Health & Fitness Calculators', sub='Body measures, nutrition, training and pregnancy',
   desc='Free health and fitness calculators: BMI, body fat, calories, TDEE, macros, heart rate, pace, one rep max, pregnancy due date and more.',
   intro='These calculators help you understand body measurements, set calorie and nutrition targets, plan training and track pregnancy dates. They give estimates for general information and do not replace advice from a clinician.',
   groups=[('Body measurements', ['bmi-calculator', 'healthy-weight-calculator', 'ideal-weight-calculator', 'overweight-calculator', 'body-fat-calculator', 'army-body-fat-calculator', 'lean-body-mass-calculator', 'body-type-calculator', 'body-surface-area-calculator']), ('Energy and nutrition', ['bmr-calculator', 'tdee-calculator', 'calorie-calculator', 'weight-loss-calculator', 'water-intake-calculator', 'calories-burned-calculator', 'macro-calculator', 'protein-calculator', 'carbohydrate-calculator', 'fat-intake-calculator']), ('Training', ['target-heart-rate-calculator', 'one-rep-max-calculator', 'pace-calculator']), ('Health checks', ['bac-calculator', 'gfr-calculator']), ('Pregnancy and cycles', ['pregnancy-calculator', 'due-date-calculator', 'conception-calculator', 'pregnancy-conception-calculator', 'ovulation-calculator', 'period-calculator', 'pregnancy-weight-gain-calculator'])],
   tips=['Use BMI as a screening number, then look at waist size, fitness and lab results.', 'Start calorie targets from your TDEE and adjust based on real results.', 'Talk to your doctor before major changes to diet, exercise or pregnancy care.'], extra=[]),
 'everyday-calculators': dict(
   title='Everyday Calculators: Math, Time, School & DIY', h1='Everyday Calculators', sub='Math, dates, school and handy utilities',
   desc='Free everyday calculators: percentages, fractions, unit conversion, dates and time, GPA and grades, password generator, concrete and more.',
   intro='Quick answers to common everyday questions: percentages, dates, grades, unit conversions and small projects around the house.',
   groups=[('Math', ['percent-calculator', 'percent-change-calculator', 'fraction-calculator', 'scientific-calculator', 'standard-deviation-calculator', 'triangle-calculator', 'conversion-calculator', 'temperature-converter', 'pounds-to-kg-converter', 'inches-to-cm-converter']), ('Dates and time', ['age-calculator', 'date-calculator', 'countdown-calculator', 'time-calculator', 'hours-calculator']), ('School', ['gpa-calculator', 'weighted-gpa-calculator', 'grade-calculator']), ('Tech and home', ['password-generator', 'random-number-generator', 'ip-subnet-calculator', 'concrete-calculator', 'cubic-yard-calculator', 'paint-calculator', 'flooring-calculator', 'dog-age-calculator', 'word-counter', 'cooking-measurement-converter', 'coin-flip', 'turkey-cooking-time-calculator']), ('Travel', ['road-trip-cost-calculator'])],
   tips=['Percent change and percent of a number are different questions; pick the right tool.', 'Check unit systems (US vs. metric) before converting.'], extra=[]),
}

def topic_page(slugname, t):
    path = f'topics/{slugname}.html'
    groups = ''
    for gname, items in t['groups']:
        lis = ''.join(f'<li><a href="../calculators/{s}.html"><strong>{esc(labels[s])}</strong></a><span>{esc(META[s][1])}</span></li>' for s in items)
        groups += f'<h2>{esc(gname)}</h2>\n      <ul class="hub-list">{lis}</ul>\n      '
    tips = '<ul>' + ''.join(f'<li>{x}</li>' for x in t['tips']) + '</ul>'
    extra = ''.join(f'<li><a href="{h}">{esc(n)}</a></li>' for n, h in t['extra'])
    others = ''.join(f'<li><a href="{k}.html">{esc(v["h1"])}</a></li>' for k, v in TOPICS.items() if k != slugname)
    title = t['title'] if len(t['title']) <= 62 else t['title']
    body = f'''  <main class="container">
    <div class="calc-description seo-content">
      {BYLINE}
      <p>{esc(t['intro'])}</p>
      {groups}<h2>Tips</h2>
      {tips}
      <h2>More to explore</h2>
      <ul class="related-list">{extra}{others}</ul>
    </div>
  </main>
'''
    page = head(title, t['desc'], path, 1, jsonld(t['h1'], t['desc'], path, [('Home', ''), (t['h1'], path)], [], app=False), extra_css='states.css')
    page += header_html(t['h1'], t['sub'], '../index.html', 'All calculators') + body + footer_html('../', f"{t['h1']} | Mx Calculator")
    return path, page

# ---------------------------------------------------------------- run
written = []
def w(path, content):
    open(f'{ROOT}/{path}', 'w', encoding='utf8').write(content); written.append(path)
for n in sorted(SALES):
    w(*sales_page(n)); w(*property_page(n))
w(*hub_sales()); w(*hub_property())
for k, t in TOPICS.items(): w(*topic_page(k, t))
print(len(written), 'pages written')
json.dump(written, open(f'{HERE}/new_pages.json', 'w'))
