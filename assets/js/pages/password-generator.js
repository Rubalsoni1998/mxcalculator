// Constants
const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Escaped string for safety
const AMBIGUOUS = '{}[]()/\\\'"`~,;:.<>';
const SIMILAR = 'il1Lo0O';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   generate();
});

function syncLength(val) {
    document.getElementById('lengthDisplay').textContent = val;
    generate();
}

function generate() {
    const length = parseInt(document.getElementById('lengthRange').value);
    const useUpper = document.getElementById('chkUpper').checked;
    const useLower = document.getElementById('chkLower').checked;
    const useNumbers = document.getElementById('chkNumbers').checked;
    const useSymbols = document.getElementById('chkSymbols').checked;
    const excludeAmbiguous = document.getElementById('chkAmbiguous').checked;
    const excludeSimilar = document.getElementById('chkSimilar').checked;

    let charSet = "";
    if (useUpper) charSet += CHARS.upper;
    if (useLower) charSet += CHARS.lower;
    if (useNumbers) charSet += CHARS.number;
    if (useSymbols) charSet += CHARS.symbol;

    if (charSet === "") {
        document.getElementById('passwordOutput').textContent = "Select Options";
        updateStrength(0);
        return;
    }

    // Filter exclusions
    if (excludeAmbiguous) {
        for (let c of AMBIGUOUS) charSet = charSet.split(c).join('');
    }
    if (excludeSimilar) {
        for (let c of SIMILAR) charSet = charSet.split(c).join('');
    }

    if (charSet === "") {
        document.getElementById('passwordOutput').textContent = "Too Restrictive";
        updateStrength(0);
        return;
    }

    // Generate
    let password = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
        password += charSet[array[i] % charSet.length];
    }

    document.getElementById('passwordOutput').textContent = password;
    calculateStrength(password);
}

function calculateStrength(pwd) {
    let score = 0;
    if (pwd.length > 8) score += 10;
    if (pwd.length > 12) score += 15;
    if (pwd.length > 16) score += 20;

    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;

    updateStrength(score);
}

function updateStrength(score) {
    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');

    let color = "var(--border)";
    let label = "Weak";
    let width = "10%";

    if (score > 80) {
        color = "var(--strength-strong)";
        label = "Very Strong";
        width = "100%";
    } else if (score > 60) {
        color = "var(--strength-good)";
        label = "Strong";
        width = "75%";
    } else if (score > 40) {
        color = "var(--strength-fair)";
        label = "Fair";
        width = "50%";
    } else if (score > 20) {
        color = "var(--strength-weak)";
        label = "Weak";
        width = "25%";
    }

    bar.style.width = width;
    bar.style.backgroundColor = color;
    text.textContent = label;
    text.style.color = color;
}

function copyToClipboard() {
    const text = document.getElementById('passwordOutput').textContent;
    if (!text || text === "Select Options" || text === "Too Restrictive" || text === "Generating...") return;

    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("Copy");
    textArea.remove();

    // Provide feedback on the button, not the result text
    const btn = document.getElementById('copyBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `Copied!`;
    btn.classList.add('active'); // Optional visual state

    setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('active');
    }, 1500);
}
