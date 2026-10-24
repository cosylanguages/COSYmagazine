import fs from 'fs';
import assert from 'assert';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { SITE_BASE } = require('../scripts/site-config.js');
const { getDocumentTitle } = require('../scripts/build-blog.js');

console.log('Running site URL and title regression tests...');
assert.strictEqual(SITE_BASE, 'https://cosylanguages.github.io/COSYmagazine/');

// Generated pages: canonical and og:url use the real deployed address
const pages = fs.readdirSync('.').filter((f) => f.endsWith('.html') && !['index.html', '404.html', 'podcast.html'].includes(f));
assert.ok(pages.length > 0);
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  const slug = f.replace(/\.html$/, '');
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_BASE}${slug}.html">`), `${f}: wrong canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="${SITE_BASE}${slug}.html">`), `${f}: wrong og:url`);
  assert.ok(!html.includes('/COSYblog/'), `${f}: still references /COSYblog/`);
}
// Sitemap, robots, podcast feed
for (const f of ['sitemap.xml', 'robots.txt', 'podcast.xml']) {
  assert.ok(!fs.readFileSync(f, 'utf8').includes('/COSYblog/'), `${f}: still references /COSYblog/`);
}
console.log('OK: canonical, og:url, sitemap, robots and podcast feed use', SITE_BASE);

// Titles: kept whole when they fit, never cut in the middle of a word, escaped by the caller only
assert.strictEqual(getDocumentTitle('Short title'), 'Short title \u2014 COSYmagazine');
const long = 'Stop Saying \u2018Very\u2019! 50 Stronger Words Every Intermediate English Learner Needs';
const t = getDocumentTitle(long);
assert.ok(Array.from(t).length <= 70);
assert.ok(t.endsWith('\u2026'));
const prefix = t.slice(0, -1);
assert.ok(long.startsWith(prefix) && /\s/.test(long[prefix.length]), 'title must be cut at a word boundary');
assert.ok(!getDocumentTitle('Tom & Jerry <b>"quoted"</b>').includes('&amp;'), 'title must not be pre-escaped');
assert.ok(Array.from(getDocumentTitle('A'.repeat(120))).length <= 70);
console.log('OK: title length and word-boundary behaviour');
