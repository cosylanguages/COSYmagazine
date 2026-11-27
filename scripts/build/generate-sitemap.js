#!/usr/bin/env node
/** Writes sitemap.xml for every published post plus the index and podcast pages. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BASE = 'https://cosylanguages.github.io/COSYmagazine/';

function buildSitemap(posts, today = new Date().toISOString().slice(0, 10)) {
  const dates = posts
    .flatMap((post) => [post.updated, post.date])
    .filter(Boolean)
    .map((value) => String(value).slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));

  // Landing pages and future-dated posts use the newest real content date, not
  // the build date, so re-running the build does not rewrite every lastmod.
  const pastDates = dates.filter((value) => value <= today).sort();
  const latestContentDate = pastDates.length ? pastDates[pastDates.length - 1] : today;

  const lastmod = (value) => {
    const date = String(value || latestContentDate).slice(0, 10);
    return date > today ? latestContentDate : date;
  };

  const urls = [
    { loc: BASE, lastmod: latestContentDate },
    { loc: BASE + 'podcast.html', lastmod: latestContentDate },
    { loc: BASE + 'issues-catalog.html', lastmod: latestContentDate }
  ].concat(
    posts.map((post) => ({
      loc: BASE + post.slug + '.html',
      lastmod: lastmod(post.updated || post.date)
    }))
  );

  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((url) => `  <url><loc>${url.loc}</loc><lastmod>${url.lastmod}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';
}

if (require.main === module) {
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf-8'));
  const xml = buildSitemap(posts);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  const count = (xml.match(/<url>/g) || []).length;
  console.log(`✅ sitemap.xml (${count} URLs)`);
}

module.exports = { buildSitemap };
