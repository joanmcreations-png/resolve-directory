// Fetches each resource's og:image at build time and stores it in previews.json.
// Run: node fetch-previews.js   (then: node generate.js)
const fs = require('fs');
const path = require('path');
const { grades } = require('./data.js');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const OUT = path.join(__dirname, 'previews.json');

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

function extractImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) {
      // force https: an http:// image would be blocked as mixed content on the live site
      try { return new URL(m[1], baseUrl).href.replace(/^http:\/\//, 'https://'); } catch (e) { /* skip */ }
    }
  }
  return null;
}

async function fetchImage(g) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(g.url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow', signal: ctrl.signal });
    clearTimeout(t);
    if (res.status >= 400) return null;
    const body = await res.text();
    return extractImage(body, res.url);
  } catch (e) {
    return null;
  }
}

(async () => {
  const out = {};
  for (let i = 0; i < grades.length; i += 6) {
    const batch = grades.slice(i, i + 6);
    const imgs = await Promise.all(batch.map(g => fetchImage(g)));
    batch.forEach((g, j) => {
      // keep a previously found image if this run failed (bot blocks are flaky)
      out[g.slug] = imgs[j] || existing[g.slug] || null;
    });
    process.stderr.write('.');
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const found = Object.values(out).filter(Boolean).length;
  console.log(`\npreviews.json: ${found}/${grades.length} images found`);
})();
