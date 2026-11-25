// Calculator State
let currentExp = '0';
let isRadians = false; // Default to Degrees
const history = [];

const displayEl = document.getElementById('calcDisplay');
const historyEl = document.getElementById('calcHistory');
const historyListEl = document.getElementById('historyList');

// Initialization
document.addEventListener('keydown', handleKeyboard);

// Modes
function setAngleMode(mode) {
    isRadians = (mode === 'RAD');
    document.getElementById('modeDeg').className = !isRadians ? 'mode-opt active' : 'mode-opt';
    document.getElementById('modeRad').className = isRadians ? 'mode-opt active' : 'mode-opt';
}

// Input Handling
function inputNum(num) {
    if (currentExp === '0' && num !== '.') {
        currentExp = num.toString();
    } else {
        // Prevent multiple decimals in one number segment (simple check)
        // A robust regex would be better for complex expressions
        if (num === '.') {
            const parts = currentExp.split(/[\+\-\*\/\(\)]/);
            const lastPart = parts[parts.length - 1];
            if (lastPart.includes('.')) return;
        }
        currentExp += num.toString();
    }
    updateDisplay();
}

function inputOperator(op) {
    // Prevent stacking operators
    const lastChar = currentExp.slice(-1);
    if (['+', '-', '*', '/', '^', 'E'].includes(lastChar)) {
        currentExp = currentExp.slice(0, -1) + op;
    } else {
        currentExp += op;
    }
    updateDisplay();
}

function inputParen(p) {
    if (currentExp === '0') currentExp = p;
    else currentExp += p;
    updateDisplay();
}

function inputConst(c) {
    const val = (c === 'PI') ? 'π' : 'e';
    if (currentExp === '0') currentExp = val;
    else currentExp += val;
    updateDisplay();
}

function inputFunc(fn) {
    let text = '';
    switch(fn) {
        case 'sin': text = 'sin('; break;
        case 'cos': text = 'cos('; break;
        case 'tan': text = 'tan('; break;
        case 'asin': text = 'asin('; break;
        case 'acos': text = 'acos('; break;
        case 'atan': text = 'atan('; break;
        case 'ln': text = 'ln('; break;
        case 'log': text = 'log('; break;
        case 'sqrt': text = '√('; break;
        case 'sq': 
            currentExp += '^2'; 
            updateDisplay();
            return;
        case 'inv':
            currentExp += '^(-1)';
            updateDisplay();
            return;
    }

    if (currentExp === '0') currentExp = text;
    else currentExp += text;
    updateDisplay();
}

function backspace() {
    if (currentExp.length === 1) {
        currentExp = '0';
    } else {
        // Logic to remove whole function names if at end? 
        // Simplified: just remove last char.
        currentExp = currentExp.slice(0, -1);
    }
    updateDisplay();
}

function clearAll() {
    currentExp = '0';
    historyEl.textContent = '';
    updateDisplay();
}

function updateDisplay() {
    displayEl.textContent = currentExp;
}

// Safe expression evaluator (no eval / new Function).
// Supports + - * / ^, parentheses, unary +/-, constants π and e, 2E3 exponents,
// and the functions sin cos tan asin acos atan ln log sqrt (√).
function evaluateExpression(src, radians) {
    const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    const toRad = radians ? 1 : Math.PI / 180;
    const fromRad = radians ? 1 : 180 / Math.PI;
    const FUNCS = {
        sin: (x) => Math.sin(x * toRad), cos: (x) => Math.cos(x * toRad), tan: (x) => Math.tan(x * toRad),
        asin: (x) => Math.asin(x) * fromRad, acos: (x) => Math.acos(x) * fromRad, atan: (x) => Math.atan(x) * fromRad,
        ln: Math.log, log: Math.log10, sqrt: Math.sqrt, '√': Math.sqrt
    };
    let i = 0;
    const peek = () => s[i];
    function primary() {
        const c = peek();
        if (c === '(') { i++; const v = sum(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
        if (c === '-') { i++; return -power(); }
        if (c === '+') { i++; return power(); }
        if (c === 'π') { i++; return Math.PI; }
        if (c === 'e') { i++; return Math.E; }
        const f = /^(asin|acos|atan|sin|cos|tan|sqrt|ln|log|√)\(/.exec(s.slice(i));
        if (f) { i += f[0].length; const v = sum(); if (peek() !== ')') throw new Error('paren'); i++; return FUNCS[f[1]](v); }
        const m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(s.slice(i));
        if (!m) throw new Error('syntax');
        i += m[0].length;
        return parseFloat(m[0]);
    }
    function power() { const b = primary(); if (peek() === '^') { i++; return Math.pow(b, power()); } return b; }
    function product() {
        let v = power();
        while (peek() === '*' || peek() === '/') { const op = s[i++], r = power(); v = op === '*' ? v * r : v / r; }
        return v;
    }
    function sum() {
        let v = product();
        while (peek() === '+' || peek() === '-') { const op = s[i++], r = product(); v = op === '+' ? v + r : v - r; }
        return v;
    }
    const out = sum();
    if (i !== s.length) throw new Error('syntax');
    return out;
}

// Calculation Engine
function calculate() {
    const originalExp = currentExp;
    try {
        const result = evaluateExpression(originalExp, isRadians);

        if (!isFinite(result) || isNaN(result)) throw new Error("Invalid");

        // Format Result
        // Avoid floating point errors like 0.1 + 0.2 = 0.300000004
        const finalResult = parseFloat(result.toPrecision(12)).toString();

        // Update State
        historyEl.textContent = `${originalExp} =`;
        currentExp = finalResult;
        updateDisplay();
        addToHistory(originalExp, finalResult);

    } catch (e) {
        displayEl.textContent = "Error";
        setTimeout(() => { updateDisplay(); }, 1500);
    }
}

function addToHistory(exp, res) {
    history.push({ exp, res });
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyListEl.innerHTML = `
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:0.5rem; opacity:0.5">
               <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
               <path d="M12 6v6l4 2"></path>
            </svg>
            <p>Calculations will appear here</p>
        </div>`;
        return;
    }

    historyListEl.innerHTML = '';
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => { currentExp = item.res; updateDisplay(); };
        div.innerHTML = `
            <div class="history-expression">${item.exp} =</div>
            <div class="history-result">${item.res}</div>
        `;
        historyListEl.prepend(div); // Newest top
    });
}

function clearHistory() {
    history.length = 0;
    renderHistory();
}

// Keyboard support
function handleKeyboard(e) {
    const key = e.key;
    if (/[0-9.]/.test(key)) inputNum(key);
    if (['+', '-', '*', '/'].includes(key)) inputOperator(key);
    if (key === 'Enter') { e.preventDefault(); calculate(); }
    if (key === 'Backspace') backspace();
    if (key === 'Escape') clearAll();
    if (key === '(' || key === ')') inputParen(key);
    if (key === '^') inputOperator('^');
}
