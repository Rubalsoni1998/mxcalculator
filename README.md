# MX Calculator

Static multi-page calculator site (no build step). Open `index.html` in a browser or serve the folder with any static server:

```
python3 -m http.server 8000
```

## Structure

```
index.html                 Home / calculator hub
calculators/               One HTML page per calculator
assets/
  css/home.css             Styles for the home page
  css/pages/<name>.css     Styles for each calculator page
  js/home.js               Script for the home page
  js/pages/<name>.js       Logic for each calculator page
  css/responsive.css       Shared mobile/tablet/desktop layer (loaded on every page)
  js/responsive.js         Shared helper: turns wide tables into stacked cards on phones
```

Each `calculators/<name>.html` loads `assets/css/pages/<name>.css` and `assets/js/pages/<name>.js`.
Chart.js and Google Fonts are loaded from CDNs.

Every calculator page has a back button (header) and an "All calculators" link (footer).
Chart.js (pinned to 4.4.1) is only loaded on pages that draw charts; all scripts are `defer`red.

## Before you deploy
1. Domain is already set to https://mxcalculator.com (canonical URLs, Open Graph, JSON-LD, sitemap.xml, robots.txt).
   To change it, search and replace that origin across the project.
2. Optional, needs internet: self-host fonts and Chart.js (removes Google/jsDelivr requests):
   `node scripts/vendor.js`
3. Add a contact email to `privacy.html` if you want one.

## Shared pieces
- `assets/css/base.css` rules common to every page, then the page stylesheet, then `responsive.css`
  (back button, spacing, dark mode, print, utility classes).
- `assets/js/enhance.js` remembers inputs (localStorage), adds the Share button, range checks,
  and turns `alert()` into non-blocking messages. Add `data-no-persist` to an input to skip saving it.
- Dark mode follows the device setting. Print hides the chrome and keeps results/tables.
