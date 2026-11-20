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

/* Search + full calculator list (built from the category cards) */
(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.category-section .card'));
    var input = document.getElementById('searchInput');
    var form = document.getElementById('searchForm');
    var modalList = document.getElementById('modalList');

    if (modalList) {
        modalList.innerHTML = cards.map(function (c) {
            return '<h3 style="margin:12px 0 6px">' + c.querySelector('h3').textContent + '</h3>' +
                '<ul style="list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 16px">' +
                Array.prototype.map.call(c.querySelectorAll('a'), function (a) {
                    return '<li><a href="' + a.getAttribute('href') + '">' + a.textContent + '</a></li>';
                }).join('') + '</ul>';
        }).join('');
    }

    function filter() {
        var q = input.value.trim().toLowerCase(), first = null;
        cards.forEach(function (card) {
            var shown = 0;
            card.querySelectorAll('li').forEach(function (li) {
                var ok = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
                li.hidden = !ok;
                if (ok) { shown++; if (!first && q) first = li.querySelector('a'); }
            });
            card.hidden = shown === 0;
        });
        return first;
    }
    if (input) {
        var q0 = new URLSearchParams(location.search).get('q');
        if (q0) { input.value = q0; filter(); }
        input.addEventListener('input', filter);
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var first = filter();
            if (first) window.location.href = first.getAttribute('href');
        });
    }
    document.addEventListener('keydown', function (e) {
        var m = document.getElementById('modalOverlay');
        if (e.key === 'Escape' && m && m.classList.contains('active')) toggleModal();
    });
})();
