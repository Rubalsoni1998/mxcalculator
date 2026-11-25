// Coin Flip: fair flips from crypto.getRandomValues; counts, streaks, calls and a normal-approximation check against 50/50.
function $(id) { return document.getElementById(id); }
function showResults(on) { $('resultsPlaceholder').style.display = on ? 'none' : 'flex'; $('resultsContent').style.display = on ? 'block' : 'none'; }
let S = { h: 0, t: 0, seq: '', cur: '', curLen: 0, bestH: 0, bestT: 0, wins: 0, losses: 0 };

function bits(n) {
  const out = new Array(n), bytes = new Uint8Array(Math.ceil(n / 8));
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < n; i++) out[i] = (bytes[i >> 3] >> (i & 7)) & 1;
  return out;
}
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
function f(x) { return x.toLocaleString('en-US'); }

function calculate() {
  const n = parseInt($('count').value, 10), call = $('call').value;
  const r = bits(n);
  let last = '';
  r.forEach(function (b) {
    const side = b ? 'H' : 'T'; last = side;
    if (side === 'H') S.h++; else S.t++;
    if (side === S.cur) S.curLen++; else { S.cur = side; S.curLen = 1; }
    if (side === 'H') S.bestH = Math.max(S.bestH, S.curLen); else S.bestT = Math.max(S.bestT, S.curLen);
    if (call !== 'none') { if (side === call) S.wins++; else S.losses++; }
  });
  S.seq = (S.seq + r.map(function (b) { return b ? 'H' : 'T'; }).join('')).slice(-60);

  const total = S.h + S.t;
  const coin = $('coin'), face = $('coinFace');
  coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip');
  coin.className = 'coin flip ' + (last === 'H' ? 'heads' : 'tails');
  face.textContent = last === 'H' ? 'H' : 'T';

  const batch = n > 1;
  const bh = r.reduce(function (s, b) { return s + b; }, 0), bt = n - bh;
  $('resultLabel').textContent = batch ? 'This Batch of ' + f(n) : 'Result';
  $('resultValueDisplay').textContent = batch ? f(bh) + ' H · ' + f(bt) + ' T' : (last === 'H' ? 'Heads' : 'Tails');
  $('resultNote').textContent = 'Running total: ' + f(S.h) + ' heads and ' + f(S.t) + ' tails in ' + f(total) + ' flip' + (total === 1 ? '' : 's');

  const ph = S.h / total * 100, pt = S.t / total * 100;
  const rows = [
    ['Total flips', f(total)],
    ['SUB:Heads', f(S.h) + ' (' + ph.toFixed(1) + '%)'],
    ['SUB:Tails', f(S.t) + ' (' + pt.toFixed(1) + '%)'],
    ['Last flip', last === 'H' ? 'Heads' : 'Tails'],
    ['Current streak', S.curLen + ' ' + (S.cur === 'H' ? 'heads' : 'tails')],
    ['Longest heads streak', S.bestH],
    ['Longest tails streak', S.bestT],
    ['Expected heads at 50%', f(total / 2)]
  ];
  if (total >= 20) {
    const z = (S.h - total / 2) / (Math.sqrt(total) / 2);
    const p = 1 - erf(Math.abs(z) / Math.SQRT2);
    rows.push(['z-score (distance from 50/50)', z.toFixed(2)]);
    rows.push(['Chance of a gap this big by luck', (p < 0.001 ? '<0.1' : (p * 100).toFixed(1)) + '%']);
  }
  if (S.wins + S.losses > 0) rows.push(['SUB:Your calls', S.wins + ' right, ' + S.losses + ' wrong (' + (S.wins / (S.wins + S.losses) * 100).toFixed(0) + '%)']);
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (String(x[0]).indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');
  $('history').innerHTML = S.seq.split('').map(function (c) { return '<span class="chip ' + (c === 'H' ? 'h' : 't') + '">' + c + '</span>'; }).join('');
  $('warnBox').style.display = 'none';
  showResults(true);
}
function clearForm() {
  S = { h: 0, t: 0, seq: '', cur: '', curLen: 0, bestH: 0, bestT: 0, wins: 0, losses: 0 };
  $('coin').className = 'coin'; $('coinFace').textContent = '?';
  $('history').textContent = 'Flip the coin to see results.';
  showResults(false);
}
