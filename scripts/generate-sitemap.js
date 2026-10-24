#!/usr/bin/env node
/** Writes sitemap.xml for every published post plus the index and podcast pages. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { SITE_BASE: BASE } = require('./site-config');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf-8'));
const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: BASE, lastmod: today }, { loc: BASE + 'podcast.html', lastmod: today }]
  .concat(posts.map((p) => ({ loc: BASE + p.slug + '.html', lastmod: (p.updated || p.date || today).slice(0, 10) })));
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`✅ sitemap.xml (${urls.length} URLs)`);
