// Word Counter
// Reading rates: Brysbaert (2019) silent non-fiction 238 wpm, reading aloud 183 wpm; speech 130-150 wpm.

function $(id) { return document.getElementById(id); }
function nv(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function fmt(v, d) { return isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 0 : d }) : '–'; }
function money(v, d) {
  if (!isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function showResults(on) {
  $('resultsPlaceholder').style.display = on ? 'none' : 'flex';
  $('resultsContent').style.display = on ? 'block' : 'none';
}
function renderRows(rows) {
  $('breakdownTableBody').innerHTML = rows.map(function (x) {
    if (x[0].indexOf('SUB:') === 0) return '<tr class="sub-row"><td>' + x[0].slice(4) + '</td><td>' + x[1] + '</td></tr>';
    return '<tr><td class="muted">' + x[0] + '</td><td>' + x[1] + '</td></tr>';
  }).join('');
}

const STOP = new Set('a an and are as at be but by for from had has have he her his i if in into is it its me my no not of on or our she so that the their them then there these they this to us was we were what when which who will with you your'.split(' '));

function calculate() {
  const t = $('text').value;
  const limit = parseInt($('limit').value, 10);
  const wpm = parseInt($('wpm').value, 10);
  const trimmed = t.trim();
  if (!trimmed) { showResults(false); return; }
  const words = trimmed.split(/\s+/).filter(Boolean);
  const chars = t.length;
  const noSpaces = t.replace(/\s/g, '').length;
  const sentences = (trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).filter(function (s) { return /\w/.test(s); }).length;
  const paragraphs = trimmed.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
  const lines = t.split('\n').length;
  const letters = (trimmed.match(/[A-Za-z0-9\u00C0-\u024F]/g) || []).length;
  const avgLen = words.length ? letters / words.length : 0;
  const cleaned = words.map(function (w) { return w.toLowerCase().replace(/^[^a-z0-9\u00C0-\u024F]+|[^a-z0-9\u00C0-\u024F]+$/gi, ''); }).filter(Boolean);
  const unique = new Set(cleaned).size;
  const counts = {};
  cleaned.forEach(function (w) { if (w.length > 2 && !STOP.has(w)) counts[w] = (counts[w] || 0) + 1; });
  const top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || (a < b ? -1 : 1); }).slice(0, 10);

  function mins(w, rate) {
    const m = w / rate;
    if (m < 1) return Math.max(1, Math.round(m * 60)) + ' sec';
    const mm = Math.floor(m), ss = Math.round((m - mm) * 60);
    return (ss === 60 ? mm + 1 : mm) + ' min' + (ss && ss !== 60 ? ' ' + ss + ' sec' : '');
  }

  $('resultLabel').textContent = 'Word Count';
  $('resultValueDisplay').textContent = fmt(words.length);
  $('resultNote').textContent = fmt(chars) + ' characters · ' + fmt(sentences) + ' sentence' + (sentences === 1 ? '' : 's') + ' · ' + mins(words.length, wpm) + ' to read';

  const warn = $('warnBox');
  const rows = [
    ['Words', fmt(words.length)],
    ['Characters (with spaces)', fmt(chars)],
    ['Characters (no spaces)', fmt(noSpaces)],
    ['Sentences', fmt(sentences)],
    ['Paragraphs', fmt(paragraphs)],
    ['Lines', fmt(lines)],
    ['Unique words', fmt(unique)],
    ['Average word length', avgLen.toFixed(1) + ' letters'],
    ['Average sentence length', sentences ? (words.length / sentences).toFixed(1) + ' words' : '–'],
    ['SUB:Reading time (' + wpm + ' wpm)', mins(words.length, wpm)],
    ['Silent reading (238 wpm)', mins(words.length, 238)],
    ['Reading aloud (183 wpm)', mins(words.length, 183)],
    ['Speaking (130 to 150 wpm)', mins(words.length, 150) + ' to ' + mins(words.length, 130)]
  ];
  if (limit > 0) {
    const left = limit - chars;
    rows.push(['SUB:Characters left of ' + fmt(limit), (left >= 0 ? fmt(left) + ' left' : fmt(-left) + ' over the limit')]);
    if (left < 0) { warn.style.display = 'block'; warn.textContent = 'You are ' + fmt(-left) + ' characters over the ' + fmt(limit) + ' character limit.'; } else warn.style.display = 'none';
  } else warn.style.display = 'none';
  renderRows(rows);

  $('kwTable').innerHTML = top.length ? top.map(function (w) {
    return '<tr><td>' + w.replace(/</g, '&lt;') + '</td><td>' + counts[w] + '</td><td>' + (counts[w] / words.length * 100).toFixed(1) + '%</td></tr>';
  }).join('') : '<tr><td colspan="3">Not enough text yet</td></tr>';
  showResults(true);
}

function clearForm() { $('text').value = ''; showResults(false); $('text').focus(); }
document.addEventListener('DOMContentLoaded', function () {
  calculate();
  document.querySelectorAll('input, select, textarea').forEach(function (el) { el.addEventListener('input', calculate); el.addEventListener('change', calculate); });
});
