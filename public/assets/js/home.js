function toggleModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.toggle('active');
    if(modal.classList.contains('active')) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
}

const output = document.getElementById('output');
const history = document.getElementById('history');
let currentExp = '';

function insert(val) {
    if (val === '.' && currentExp.slice(-1) === '.') return;
    if (currentExp === '0' && val !== '.') currentExp = val.toString();
    else currentExp += val.toString();
    updateDisplay();
}

function clearCalc() {
    currentExp = '0';
    history.innerText = '';
    updateDisplay();
}

function backspace() {
    currentExp = currentExp.toString().slice(0, -1);
    if (currentExp === '') currentExp = '0';
    updateDisplay();
}

function updateDisplay() {
    output.innerText = currentExp;
}

// Safe expression evaluator (no eval): + - * / ^, parentheses, unary minus, and 2E3 style exponents.
function evaluate(src) {
    var s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, ''), i = 0;
    function peek() { return s[i]; }
    function number() {
        var m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(s.slice(i));
        if (!m) throw new Error('number');
        i += m[0].length; return parseFloat(m[0]);
    }
    function primary() {
        if (peek() === '(') { i++; var v = sum(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
        if (peek() === '-') { i++; return -power(); }
        if (peek() === '+') { i++; return power(); }
        return number();
    }
    function power() { var b = primary(); if (peek() === '^') { i++; return Math.pow(b, power()); } return b; }
    function product() {
        var v = power();
        while (peek() === '*' || peek() === '/') { var op = s[i++], r = power(); v = op === '*' ? v * r : v / r; }
        return v;
    }
    function sum() {
        var v = product();
        while (peek() === '+' || peek() === '-') { var op = s[i++], r = product(); v = op === '+' ? v + r : v - r; }
        return v;
    }
    var out = sum();
    if (i !== s.length) throw new Error('syntax');
    return out;
}

function calculate() {
    try {
        var result = evaluate(currentExp);
        if (!isFinite(result)) throw new Error('math');
        history.innerText = currentExp + ' =';
        currentExp = parseFloat(result.toFixed(10)).toString();
        updateDisplay();
    } catch (e) {
        output.innerText = 'Error';
        setTimeout(function () { clearCalc(); }, 1500);
    }
}

function calcFunc(fn) {
    let val = parseFloat(currentExp);
    if (isNaN(val)) return;
    const isDeg = document.querySelector('input[name="angle"]:checked').value === 'deg';
    const toRad = (deg) => deg * (Math.PI / 180);
    const toDeg = (rad) => rad * (180 / Math.PI);
    let res = 0;

    switch(fn) {
        case 'sin': res = Math.sin(isDeg ? toRad(val) : val); break;
        case 'cos': res = Math.cos(isDeg ? toRad(val) : val); break;
        case 'tan': res = Math.tan(isDeg ? toRad(val) : val); break;
        case 'asin': res = isDeg ? toDeg(Math.asin(val)) : Math.asin(val); break;
        case 'acos': res = isDeg ? toDeg(Math.acos(val)) : Math.acos(val); break;
        case 'atan': res = isDeg ? toDeg(Math.atan(val)) : Math.atan(val); break;
        case 'sqrt': res = Math.sqrt(val); break;
        case 'sq': res = Math.pow(val, 2); break;
        case 'log': res = Math.log10(val); break;
        case 'ln': res = Math.log(val); break;
        case '1/x': res = 1 / val; break;
        case 'pi': currentExp = Math.PI.toString(); updateDisplay(); return;
        case 'e': currentExp = Math.E.toString(); updateDisplay(); return;
        default: return;
    }
    res = parseFloat(res.toFixed(10));
    currentExp = res.toString();
    updateDisplay();
}

/* Search (live dropdown suggestions) + full calculator list, built from the category cards */
(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.category-section .card'));
    var input = document.getElementById('searchInput');
    var form = document.getElementById('searchForm');
    var modalList = document.getElementById('modalList');

    /* ---- Full list popup ---- */
    if (modalList) {
        modalList.innerHTML = cards.map(function (c) {
            return '<h3 class="modal-group-title">' + c.querySelector('h3').textContent + '</h3>' +
                '<ul class="modal-group-list">' +
                Array.prototype.map.call(c.querySelectorAll('a'), function (a) {
                    return '<li><a href="' + a.getAttribute('href') + '">' + a.textContent + '</a></li>';
                }).join('') + '</ul>';
        }).join('');
    }

    /* ---- Search index ---- */
    var index = [];
    cards.forEach(function (card) {
        var cat = card.querySelector('h3').textContent.trim();
        var iconEl = card.querySelector('.card-icon');
        var icon = iconEl ? iconEl.textContent.trim() : '🧮';
        card.querySelectorAll('li').forEach(function (li) {
            var a = li.querySelector('a');
            if (!a) return;
            var title = a.textContent.trim();
            var kw = (li.getAttribute('data-kw') || '').toLowerCase();
            index.push({
                title: title, lower: title.toLowerCase(), kw: kw, cat: cat,
                catLower: cat.toLowerCase(), icon: icon, href: a.getAttribute('href'), li: li
            });
        });
    });

    function wordStart(hay, t) {
        return hay.indexOf(t) === 0 || hay.indexOf(' ' + t) !== -1 || hay.indexOf('(' + t) !== -1;
    }
    /* Higher = better. 0 = no match. Every typed word must match somewhere. */
    function score(item, tokens, whole) {
        var s = 0;
        if (item.lower === whole) s += 200;
        else if (item.lower.indexOf(whole) === 0) s += 120;
        else if (item.lower.indexOf(whole) !== -1) s += 70;
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i], p = 0;
            if (wordStart(item.lower, t)) p = 40;
            else if (item.lower.indexOf(t) !== -1) p = 25;
            else if (wordStart(item.kw, t)) p = 18;
            else if (item.kw.indexOf(t) !== -1) p = 10;
            else if (item.catLower.indexOf(t) !== -1) p = 4;
            else return 0;
            s += p;
        }
        return s;
    }
    function search(q) {
        var whole = q.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!whole) return [];
        var tokens = whole.split(' ');
        return index.map(function (it) { return { it: it, s: score(it, tokens, whole) }; })
            .filter(function (r) { return r.s > 0; })
            .sort(function (a, b) { return b.s - a.s || a.it.title.length - b.it.title.length; })
            .slice(0, 8)
            .map(function (r) { return r.it; });
    }

    /* ---- Dropdown ---- */
    if (input && form) {
        var list = document.createElement('ul');
        list.id = 'searchSuggest';
        list.className = 'suggest';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', 'Calculator suggestions');
        list.hidden = true;
        form.appendChild(list);

        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', 'searchSuggest');
        input.setAttribute('aria-expanded', 'false');

        var popular = Array.prototype.slice.call(document.querySelectorAll('.popular a')).map(function (a) {
            var href = a.getAttribute('href');
            var hit = index.filter(function (i) { return i.href === href; })[0];
            return hit || { title: a.textContent, cat: 'Popular', icon: '⭐', href: href, kw: '' };
        });

        var current = [], active = -1, lastQuery = null;

        function esc(s) {
            return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
        }
        function highlight(text, tokens) {
            var safe = esc(text);
            if (!tokens.length) return safe;
            var parts = tokens.filter(Boolean).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
            if (!parts.length) return safe;
            return safe.replace(new RegExp('(' + parts.join('|') + ')', 'ig'), '<mark>$1</mark>');
        }
        function open() { list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
        function close() {
            list.hidden = true; active = -1;
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
        }
        function setActive(i, scroll) {
            var rows = list.querySelectorAll('.suggest-item');
            if (!rows.length) return;
            active = (i + rows.length) % rows.length;
            Array.prototype.forEach.call(rows, function (r, n) {
                var on = n === active;
                r.classList.toggle('active', on);
                r.setAttribute('aria-selected', on ? 'true' : 'false');
                if (on) {
                    input.setAttribute('aria-activedescendant', r.id);
                    if (scroll) r.scrollIntoView({ block: 'nearest' });
                }
            });
        }
        function render() {
            var q = input.value.trim();
            if (q === lastQuery && !list.hidden) return;
            lastQuery = q;
            var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
            var empty = !q;
            current = empty ? popular : search(q);
            active = -1;
            var html = '';
            if (current.length) {
                if (empty) html += '<li class="suggest-label" role="presentation">Popular calculators</li>';
                html += current.map(function (it, n) {
                    return '<li class="suggest-item" role="option" id="sg' + n + '" aria-selected="false" data-i="' + n + '">' +
                        '<span class="suggest-icon" aria-hidden="true">' + esc(it.icon) + '</span>' +
                        '<span class="suggest-text"><span class="suggest-title">' + highlight(it.title, empty ? [] : tokens) + '</span>' +
                        '<span class="suggest-cat">' + esc(it.cat) + '</span></span>' +
                        '<span class="suggest-go" aria-hidden="true">↵</span></li>';
                }).join('');
                if (!empty) setActive(0, false);
            } else {
                html = '<li class="suggest-empty" role="presentation"><strong>No calculators found</strong>' +
                    '<span>Try “mortgage”, “tax” or “BMI”</span></li>';
            }
            list.innerHTML = html;
            open();
        }
        function go(it) { if (it) window.location.href = it.href; }

        input.addEventListener('input', render);
        input.addEventListener('focus', render);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (list.hidden) render();
                if (current.length) setActive(active + 1, true);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (current.length) setActive(active < 0 ? current.length - 1 : active - 1, true);
            } else if (e.key === 'Escape') {
                if (!list.hidden) { e.preventDefault(); close(); }
            } else if (e.key === 'Tab') {
                close();
            }
        });
        list.addEventListener('mousedown', function (e) { e.preventDefault(); });  /* keep focus in the input */
        list.addEventListener('click', function (e) {
            var row = e.target.closest ? e.target.closest('.suggest-item') : null;
            if (row) go(current[+row.getAttribute('data-i')]);
        });
        list.addEventListener('mousemove', function (e) {
            var row = e.target.closest ? e.target.closest('.suggest-item') : null;
            if (row && +row.getAttribute('data-i') !== active) setActive(+row.getAttribute('data-i'), false);
        });
        document.addEventListener('mousedown', function (e) { if (!form.contains(e.target)) close(); });
        document.addEventListener('touchstart', function (e) { if (!form.contains(e.target)) close(); }, { passive: true });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = input.value.trim();
            if (!q) return;
            var hit = (active >= 0 && current[active]) || search(q)[0];
            if (hit) go(hit);
            else render();
        });

        /* ?q=term (used by the site's search action): pre-fill and show matches */
        var q0 = new URLSearchParams(location.search).get('q');
        if (q0) {
            input.value = q0;
            var first = search(q0)[0];
            if (first) cards.forEach(function (card) {
                var shown = 0;
                card.querySelectorAll('li').forEach(function (li) {
                    var ok = search(q0).some(function (r) { return r.li === li; });
                    li.hidden = !ok; if (ok) shown++;
                });
                card.hidden = shown === 0;
            });
        }
    }

    document.addEventListener('keydown', function (e) {
        var m = document.getElementById('modalOverlay');
        if (e.key === 'Escape' && m && m.classList.contains('active')) toggleModal();
    });
})();

/* Smooth scrolling helpers: fade cards in as they arrive, and pause hover effects while the page is moving */
(function () {
    var root = document.documentElement;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* 1. Pause hover work (shadows, lifts) during scroll so frames stay fast */
    var timer = 0, ticking = false;
    function stop() { root.classList.remove('is-scrolling'); timer = 0; }
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            if (!root.classList.contains('is-scrolling')) root.classList.add('is-scrolling');
            clearTimeout(timer);
            timer = setTimeout(stop, 120);
        });
    }, { passive: true });

    /* 2. Reveal cards smoothly on scroll (content stays visible if JS or IntersectionObserver is missing) */
    if (reduce || !('IntersectionObserver' in window)) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('.grid-layout .card, .section-heading'));
    var vh = window.innerHeight || 800;
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var el = en.target;
            el.classList.add('in');
            io.unobserve(el);
            setTimeout(function () {                           /* hand control back to normal hover transitions */
                el.classList.remove('reveal', 'in');
                el.style.transitionDelay = '';
            }, 800);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el, i) {
        if (el.getBoundingClientRect().top < vh) return;      /* already on screen: leave alone */
        el.classList.add('reveal');
        el.style.transitionDelay = (i % 4) * 50 + 'ms';       /* gentle stagger across a row */
        io.observe(el);
    });
})();
