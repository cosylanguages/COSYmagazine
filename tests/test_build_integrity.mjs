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
  for (const page of ['podcast.html', 'issues.html', 'issues-catalog.html']) {
    assert.ok(
      xml.includes(`https://cosylanguages.github.io/COSYmagazine/${page}`),
      `sitemap must include ${page}`
    );
  }
});

test('issues-catalog.html lists every published post and every issue', () => {
  const html = fs.readFileSync(path.join(ROOT, 'issues-catalog.html'), 'utf-8');
  const index = readJson(path.join(ROOT, 'index.json'));
  const published = index.posts.filter((p) => !p.draft);

  const linked = new Set([...html.matchAll(/href="([a-z0-9-]+)\.html"/g)].map((m) => m[1]));
  const missing = published.filter((p) => !linked.has(p.slug)).map((p) => p.slug);
  assert.deepEqual(missing, [], `catalog must link every published post (missing: ${missing.join(', ')})`);

  const sections = new Set([...html.matchAll(/data-issue="([^"]+)"/g)].map((m) => m[1]));
  for (const issue of index.issues) {
    assert.ok(sections.has(issue.number), `catalog must have a section for ${issue.number}`);
  }
});

test('issues-catalog.html has no duplicate language pills within a card', () => {
  const html = fs.readFileSync(path.join(ROOT, 'issues-catalog.html'), 'utf-8');
  const cards = html.match(/<li class="cat-article">[\s\S]*?<\/li>/g) || [];
  assert.ok(cards.length > 0, 'catalog should render article cards');
  for (const card of cards) {
    const langs = [...card.matchAll(/class="cat-lang-pill[^"]*"[^>]*hreflang="([a-z]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(langs).size, langs.length, `a catalog card lists the same language twice: ${langs.join(', ')}`);
  }
});

test('issues.html and index.html use canonical volume identifiers for every issue', () => {
  const canonical = /^Vol\. \d{4}\.\d{2}$/;
  const issuesHtml = fs.readFileSync(path.join(ROOT, 'issues.html'), 'utf-8');

  const ids = [...issuesHtml.matchAll(/data-issue-(?:id|number)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 0, 'issues.html should offer PDF downloads');
  for (const id of ids) {
    assert.match(id, canonical, `issues.html PDF id "${id}" must be a canonical volume number`);
  }

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  assert.ok(
    !/—\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+Issue['"]/.test(indexHtml),
    'index.html issue metadata must be keyed by canonical "YYYY.MM", not free-text month labels'
  );
});

test('every catalog count has a plural form in every interface language', () => {
  const langs = ['en', 'fr', 'it', 'ru', 'el'];
  const counts = ['count_article', 'count_issue', 'count_language'];
  for (const lang of langs) {
    const dict = readJson(path.join(ROOT, 'js', 'i18n', `${lang}.json`));
    for (const key of counts) {
      const block = dict.catalog && dict.catalog[key];
      assert.ok(block && typeof block === 'object', `${lang}.json catalog.${key} must be a plural block`);
      assert.equal(typeof block.one, 'string', `${lang}.json catalog.${key}.one is required`);
      assert.equal(typeof block.other, 'string', `${lang}.json catalog.${key}.other is required`);
      if (lang === 'ru') {
        assert.equal(typeof block.few, 'string', 'ru plural block needs .few');
        assert.equal(typeof block.many, 'string', 'ru plural block needs .many');
      }
    }
  }
});

test('every issue heading has a localized title for its month', () => {
  const langs = ['en', 'fr', 'it', 'ru', 'el'];
  const index = readJson(path.join(ROOT, 'index.json'));
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  const needed = new Set();
  for (const issue of index.issues) {
    const m = /(\d{4})\.(\d{2})/.exec(issue.number || '');
    if (m) needed.add(`issue_${months[parseInt(m[2], 10) - 1]}_title`);
  }
  for (const lang of langs) {
    const dict = readJson(path.join(ROOT, 'js', 'i18n', `${lang}.json`));
    for (const key of needed) {
      assert.ok(
        typeof dict.blog?.[key] === 'string' && dict.blog[key].trim() !== '',
        `${lang}.json blog.${key} is missing, so English would leak onto the catalog`
      );
    }
  }
});

test('every data-i18n key on the listing pages resolves in every interface language', () => {
  const langs = ['en', 'fr', 'it', 'ru', 'el'];
  // issues.html is an English-only editorial blueprint with no translatable chrome,
  // so only the two localized listing pages are checked here.
  const pages = ['index.html', 'issues-catalog.html'];

  const flatten = (o, prefix = '', out = {}) => {
    for (const k of Object.keys(o)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (o[k] && typeof o[k] === 'object') flatten(o[k], key, out);
      else out[key] = o[k];
    }
    return out;
  };

  const attrNames = ['data-i18n', 'data-i18n-title', 'data-i18n-aria-label'];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf-8');
    const keys = new Set();
    for (const attr of attrNames) {
      for (const m of html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) keys.add(m[1]);
    }
    // Count keys resolve to a plural block (key.one / key.other), not a single string.
    const countKeys = new Set(
      [...html.matchAll(/data-i18n-count="([^"]+)"/g)].map((m) => m[1])
    );
    assert.ok(keys.size > 0, `${page} should carry translatable UI hooks`);

    for (const lang of langs) {
      const dict = flatten(readJson(path.join(ROOT, 'js', 'i18n', `${lang}.json`)));
      for (const key of keys) {
        assert.ok(dict[key], `${page} uses ${key}, missing from js/i18n/${lang}.json`);
      }
      for (const key of countKeys) {
        assert.ok(dict[`${key}.one`], `${page} uses ${key}.one, missing from js/i18n/${lang}.json`);
        assert.ok(dict[`${key}.other`], `${page} uses ${key}.other, missing from js/i18n/${lang}.json`);
      }
    }
  }
});

test('every issue has a localized tag and vibe in every interface language', () => {
  const langs = ['en', 'fr', 'it', 'ru', 'el'];
  const html = fs.readFileSync(path.join(ROOT, 'issues-catalog.html'), 'utf-8');

  // The catalog renders these keys; every one must resolve, or English leaks through.
  const keys = [...html.matchAll(/data-i18n="catalog\.issue_meta\.([^"]+)\.(tag|vibe)"/g)]
    .map((m) => ({ key: m[1], field: m[2] }));
  assert.ok(keys.length > 0, 'catalog should mark issue tag/vibe as translatable');

  for (const lang of langs) {
    const dict = readJson(path.join(ROOT, 'js', 'i18n', `${lang}.json`));
    const meta = dict.catalog && dict.catalog.issue_meta;
    assert.ok(meta, `${lang}.json catalog.issue_meta is required`);
    for (const { key, field } of keys) {
      assert.ok(
        typeof meta[key]?.[field] === 'string' && meta[key][field].trim() !== '',
        `${lang}.json catalog.issue_meta.${key}.${field} is missing`
      );
    }
  }

  // Dot-free keys only: shell.js flattens dictionaries on ".", so a dotted key can never resolve.
  const dotted = keys.filter((k) => k.key.includes('.'));
  assert.deepEqual(dotted, [], 'issue_meta i18n keys must not contain dots');
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
