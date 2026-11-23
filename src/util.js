// Small helpers shared by the Worker modules. Pure functions, no Node APIs.

export function rid(bytes = 12) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let s = '';
  for (const b of a) s += b.toString(16).padStart(2, '0');
  return s;
}

// ---------- cookies ----------
export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k && !(k in out)) out[k] = part.slice(i + 1).trim();
  }
  return out;
}
export function cookie(name, value, opts = {}) {
  let s = `${name}=${value}; Path=${opts.path || '/'}; SameSite=${opts.sameSite || 'Lax'}`;
  if (opts.maxAge != null) s += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (opts.httpOnly) s += '; HttpOnly';
  if (opts.secure) s += '; Secure';
  return s;
}

// ---------- IP / country ----------
export function isIP(s) {
  s = String(s || '');
  if (/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s)) return s.split('.').every((n) => Number(n) <= 255);
  if (!s.includes(':') || !/^[0-9a-fA-F:.]+$/.test(s)) return false;
  try { new URL(`http://[${s}]/`); return true; } catch { return false; }
}
// Cloudflare always sets CF-Connecting-IP and it cannot be spoofed by visitors.
export function clientIp(request) {
  const ip = (request.headers.get('cf-connecting-ip') || '').trim();
  return isIP(ip) ? ip : 'unknown';
}
export function anonymizeIp(ip) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.replace(/\.\d+$/, '.0');
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::';
  return ip;
}
export function countryFrom(request) {
  const c = request.headers.get('cf-ipcountry') || (request.cf && request.cf.country) || '';
  const v = String(c).toUpperCase().trim();
  return /^[A-Z]{2}$/.test(v) && v !== 'XX' && v !== 'T1' ? v : '';
}

// ---------- user agent ----------
const BOT_RE = /bot|crawl|spider|slurp|archiver|fetcher|scraper|monitor|uptime|pingdom|lighthouse|pagespeed|gtmetrix|headless|phantom|selenium|puppeteer|playwright|preview|facebookexternalhit|facebot|embedly|quora link|whatsapp|telegram|discord|slack|curl\/|wget|python-|python\/|aiohttp|httpx|requests|java\/|okhttp|go-http|libwww|apache-http|axios|node-fetch|undici|postman|insomnia|scrapy|httrack|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|perplexity|ccbot|amazonbot|applebot|duckduckbot|baiduspider|yandex|sogou|exabot|ia_archiver|feedly|netcraft|nmap|masscan|zgrab|censys|shodan|expanse|nessus|go-resty|dataprovider|seokicks|blexbot|screaming frog|chrome-lighthouse|google-inspectiontool|storebot|adsbot|mediapartners|apis-google|feedfetcher|bingpreview|yahoo! slurp|vkshare|skypeuripreview|linkedinbot|twitterbot|redditbot|tumblr|wordpress|jetpack|site24x7|statuscake|betteruptime|newrelic|datadog|zabbix|nagios|k6\/|jmeter|locust|gatling|bingbot|headlesschrome/i;

const BOT_NAMES = [
  [/googlebot|google-inspectiontool|storebot|adsbot|apis-google|mediapartners|feedfetcher/i, 'Googlebot'],
  [/bingbot|bingpreview|msnbot/i, 'Bingbot'], [/duckduckbot/i, 'DuckDuckBot'], [/yandex/i, 'YandexBot'],
  [/baiduspider/i, 'Baidu'], [/applebot/i, 'Applebot'], [/gptbot|chatgpt|oai-searchbot/i, 'GPTBot'],
  [/claudebot|anthropic|claude-web/i, 'ClaudeBot'], [/perplexity/i, 'PerplexityBot'], [/ccbot/i, 'CCBot'],
  [/amazonbot/i, 'Amazonbot'], [/bytespider/i, 'Bytespider'], [/semrush/i, 'SemrushBot'], [/ahrefs/i, 'AhrefsBot'],
  [/mj12/i, 'MJ12bot'], [/petalbot/i, 'PetalBot'], [/facebookexternalhit|facebot/i, 'Facebook preview'],
  [/twitterbot/i, 'Twitterbot'], [/linkedinbot/i, 'LinkedInBot'], [/whatsapp/i, 'WhatsApp preview'],
  [/slack/i, 'Slack preview'], [/telegram/i, 'Telegram preview'], [/discord/i, 'Discord preview'],
  [/lighthouse|pagespeed|gtmetrix/i, 'Speed test'], [/uptime|pingdom|site24x7|statuscake|monitor/i, 'Uptime monitor'],
  [/headless|phantom|selenium|puppeteer|playwright/i, 'Headless browser'],
  [/curl\//i, 'curl'], [/wget/i, 'wget'], [/python/i, 'Python script'], [/go-http|go-resty/i, 'Go client'],
  [/java\/|okhttp|apache-http/i, 'Java client'], [/node-fetch|undici|axios/i, 'Node client'],
];

export function parseUA(ua) {
  ua = ua || '';
  const r = { browser: 'Unknown', browserVer: '', os: 'Unknown', device: 'desktop', isBot: false };
  if (!ua || BOT_RE.test(ua)) {
    r.isBot = true; r.device = 'bot';
    r.browser = !ua ? 'No user agent' : ((BOT_NAMES.find(([re]) => re.test(ua)) || [])[1] || 'Other bot');
    return r;
  }
  let m;
  const set = (name, ver) => { r.browser = name; r.browserVer = ver || ''; };
  if ((m = /(?:Edg|EdgA|EdgiOS)\/(\d+)/.exec(ua))) set('Edge', m[1]);
  else if ((m = /OPR\/(\d+)|Opera\/(\d+)/.exec(ua))) set('Opera', m[1] || m[2]);
  else if ((m = /SamsungBrowser\/(\d+)/.exec(ua))) set('Samsung Internet', m[1]);
  else if ((m = /(?:Firefox|FxiOS)\/(\d+)/.exec(ua))) set('Firefox', m[1]);
  else if ((m = /(?:Chrome|CriOS)\/(\d+)/.exec(ua))) set('Chrome', m[1]);
  else if ((m = /Version\/(\d+)[\d.]*.*Safari/.exec(ua))) set('Safari', m[1]);
  else if ((m = /MSIE (\d+)|Trident\/.*rv:(\d+)/.exec(ua))) set('Internet Explorer', m[1] || m[2]);
  else if (/Safari\//.test(ua)) set('Safari');

  if (/Windows/.test(ua)) r.os = 'Windows';
  else if (/Android/.test(ua)) r.os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) r.os = 'iOS';
  else if (/CrOS/.test(ua)) r.os = 'ChromeOS';
  else if (/Mac OS X|Macintosh/.test(ua)) r.os = 'macOS';
  else if (/Linux|X11/.test(ua)) r.os = 'Linux';

  if (/iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) r.device = 'tablet';
  else if (/Mobi|iPhone|iPod|Android/.test(ua)) r.device = 'mobile';
  return r;
}

// ---------- referrer / campaign ----------
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|brave|startpage|ask|aol|qwant|naver|seznam|kagi|perplexity)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|twitter|x|t|linkedin|lnkd|reddit|pinterest|youtube|youtu|tiktok|whatsapp|telegram|snapchat|tumblr|quora|medium|threads|bsky|mastodon)\.[a-z.]+$/i;
export function classifyReferrer(referer, selfHost, utm) {
  let host = '';
  if (referer) { try { host = new URL(referer).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* ignore */ } }
  const self = String(selfHost || '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
  let channel;
  if (host && self && host === self) channel = 'internal';
  else if (utm.medium && /cpc|ppc|paid|email|newsletter|banner|display|affiliate|social|sms/i.test(utm.medium)) channel = 'campaign';
  else if (utm.source || utm.campaign) channel = 'campaign';
  else if (!host) channel = 'direct';
  else if (SEARCH.test(host)) channel = 'search';
  else if (SOCIAL.test(host)) channel = 'social';
  else channel = 'referral';
  return { host: channel === 'internal' ? '' : host, channel };
}

// ---------- time zones ----------
export function validTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return tz; } catch { return 'UTC'; }
}
function tzOffsetMs(ms, tz) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(ms));
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(ms / 1000) * 1000;
}
// UTC ms of local midnight for a YYYY-MM-DD date in the given zone
export function startOfDay(ymd, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - tzOffsetMs(guess, tz);
  t = guess - tzOffsetMs(t, tz);
  return t;
}
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export function todayIn(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// ---------- best-effort in-memory limiter (per Worker isolate; the login limit uses D1) ----------
export function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now(), cut = now - windowMs;
    if (hits.size > 5000) { for (const [k, v] of hits) if (v[v.length - 1] < cut) hits.delete(k); }
    const arr = (hits.get(key) || []).filter((t) => t > cut);
    if (arr.length >= max) { hits.set(key, arr); return false; }
    arr.push(now); hits.set(key, arr); return true;
  };
}

// Small TTL cache for values every request needs but that change rarely.
// If the loader fails (for example D1's free daily quota is used up) the last good value keeps being
// served, or `fallback` when there is none, so visitor-facing pages never depend on the database.
export function ttlCache() {
  const m = new Map();
  return {
    async get(key, ttlMs, loader, fallback) {
      const hit = m.get(key);
      if (hit && hit.exp > Date.now()) return hit.v;
      try {
        const v = await loader();
        m.set(key, { v, exp: Date.now() + ttlMs });
        return v;
      } catch (e) {
        if (fallback === undefined) throw e;
        const v = hit ? hit.v : fallback;
        m.set(key, { v, exp: Date.now() + 30000 });      // retry in 30 s instead of hammering a failing database
        return v;
      }
    },
    clear() { m.clear(); },
  };
}
