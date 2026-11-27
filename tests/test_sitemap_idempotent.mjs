import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { buildSitemap } = require('../scripts/build/generate-sitemap.js');

const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));

test('sitemap output is stable across build dates when content is unchanged', () => {
  const first = buildSitemap(posts, '2026-11-27');
  const second = buildSitemap(posts, '2026-11-28');
  assert.equal(first, second, 'a day-later build must not rewrite lastmod values');
});

test('sitemap never emits a future lastmod', () => {
  const today = '2026-11-27';
  const xml = buildSitemap(posts, today);
  const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  assert.ok(dates.length > 0);
  for (const date of dates) {
    assert.ok(date <= today, `lastmod ${date} is after ${today}`);
  }
});

test('committed sitemap matches the generator output', () => {
  const today = new Date().toISOString().slice(0, 10);
  const committed = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.equal(committed, buildSitemap(posts, today));
});
