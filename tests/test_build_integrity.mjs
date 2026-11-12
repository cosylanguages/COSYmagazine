import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

const sourcePosts = new Map();
fs.readdirSync(path.join(ROOT, 'posts'))
  .filter((f) => f.endsWith('.json'))
  .forEach((f) => {
    const post = readJson(path.join(ROOT, 'posts', f));
    sourcePosts.set(post.slug, post);
  });

test('podcast.xml uses the Atom namespace and real enclosure metadata', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'podcast.xml'), 'utf-8');
  assert.ok(xml.includes('xmlns:atom="http://www.w3.org/2005/Atom"'), 'Atom namespace must be the Atom one, not the SVG one');
  assert.ok(!xml.includes('xmlns:atom="http://www.w3.org/2000/svg"'), 'Atom namespace must not be the SVG namespace');
  assert.ok(!xml.includes('length="3145728"'), 'enclosure must not declare a fabricated byte length');

  // Every enclosure MIME type must match the audio file extension.
  const enclosures = [...xml.matchAll(/<enclosure\s+url="([^"]+)"\s+type="([^"]+)"/g)];
  assert.ok(enclosures.length > 0, 'the feed should contain at least one enclosure');
  for (const [, url, type] of enclosures) {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const expected = ext === '.m4a' ? 'audio/mp4' : ext === '.ogg' ? 'audio/ogg' : 'audio/mpeg';
    assert.equal(type, expected, `enclosure type for ${ext} should be ${expected}`);
  }
});

test('posts.json artDirection matches the canonical source in posts/*.json', () => {
  const catalog = readJson(path.join(ROOT, 'posts.json'));
  for (const entry of catalog) {
    const source = sourcePosts.get(entry.slug);
    if (!source) continue; // guides have no source file
    assert.deepEqual(
      entry.artDirection,
      source.artDirection,
      `posts.json artDirection for ${entry.slug} must mirror posts/${entry.slug}.json`
    );
  }
});

test('index.json metadata stays in sync with the posts/*.json sources', () => {
  const index = readJson(path.join(ROOT, 'index.json'));
  for (const entry of index.posts) {
    const source = sourcePosts.get(entry.slug);
    if (!source) continue; // guides are index-only entries
    assert.equal(entry.title, source.title, `index.json title drifted for ${entry.slug}`);
    assert.equal(entry.dek, source.dek, `index.json dek drifted for ${entry.slug}`);
    assert.equal(entry.date, source.date, `index.json date drifted for ${entry.slug}`);
    assert.deepEqual(
      entry.artDirection,
      source.artDirection,
      `index.json artDirection drifted for ${entry.slug}`
    );
  }
});

test('desk catalog keys match raw post desk values (no HTML-escaped keys)', () => {
  const index = readJson(path.join(ROOT, 'index.json'));
  const desks = new Set(index.desks.map((d) => d.key));
  assert.ok(desks.has('Culture & Quotes'), 'desk key must be the raw "Culture & Quotes", not an escaped variant');
  assert.ok(![...desks].some((k) => k.includes('&amp;')), 'no desk key may contain a pre-escaped ampersand');
});

test('sitemap.xml never declares a future lastmod', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf-8');
  const today = new Date().toISOString().slice(0, 10);
  const dates = [...xml.matchAll(/<lastmod>([0-9]{4}-[0-9]{2}-[0-9]{2})<\/lastmod>/g)].map((m) => m[1]);
  assert.ok(dates.length > 0, 'sitemap should declare lastmod values');
  const future = dates.filter((d) => d > today);
  assert.deepEqual(future, [], `sitemap lastmod must not be in the future (found ${future.join(', ')})`);
});

test('sitemap.xml lists every static landing page', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf-8');
  for (const page of ['podcast.html', 'issues.html']) {
    assert.ok(
      xml.includes(`https://cosylanguages.github.io/COSYmagazine/${page}`),
      `sitemap must include ${page}`
    );
  }
});

test('non-English pages do not leak raw English issue labels', () => {
  const banned = [/—\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+Issue/, /Podcast Special/];
  for (const post of sourcePosts.values()) {
    const lang = post.language || 'en';
    if (lang === 'en' || post.draft) continue;
    const htmlPath = path.join(ROOT, `${post.slug}.html`);
    if (!fs.existsSync(htmlPath)) continue;
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const folio = (html.match(/<div class="gazette-folio">[\s\S]*?<\/div>/) || [''])[0];
    const meta = (html.match(/<div class="gazette-masthead-meta">[\s\S]*?<\/div>/) || [''])[0];
    for (const re of banned) {
      assert.ok(!re.test(folio), `folio of ${post.slug} (${lang}) leaks an English issue label`);
      assert.ok(!re.test(meta), `masthead of ${post.slug} (${lang}) leaks an English issue label`);
    }
  }
});
