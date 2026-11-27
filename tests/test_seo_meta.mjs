import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { getDocumentTitle, getMetaDescription } = require('../scripts/build/lib/text.js');

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED[name] ?? match);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('document titles truncate at word boundaries and stay under 70 characters', () => {
  assert.equal(getDocumentTitle('Short'), 'Short — COSYmagazine');
  const long = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';
  const result = getDocumentTitle(long);
  assert.ok([...result].length <= 70);
  assert.ok(result.endsWith('…'));
  const stem = result.slice(0, -1);
  assert.ok(long.startsWith(stem));
  assert.ok(!stem.endsWith(' '));
  const next = long[stem.length];
  assert.ok(next === ' ' || next === undefined, `cut mid-word: ${stem.slice(-24)}`);
});

test('meta descriptions cap at 160 characters', () => {
  assert.equal(getMetaDescription('Short summary'), 'Short summary');
  const long = 'word '.repeat(50).trim();
  const result = getMetaDescription(long);
  assert.ok([...result].length <= 160);
  assert.ok(result.endsWith('…'));
});

test('every post page has a valid title, description, canonical and social image', () => {
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));
  assert.ok(fs.existsSync(path.join(ROOT, 'images/logo.png')));
  for (const post of posts) {
    const file = path.join(ROOT, `${post.slug}.html`);
    assert.ok(fs.existsSync(file), `missing ${post.slug}.html`);
    const html = fs.readFileSync(file, 'utf8');

    const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
    assert.ok([...title].length <= 70, `${post.slug}: title is ${[...title].length} chars`);

    const description = decodeEntities(html.match(/<meta name="description" content="([^"]*)">/)[1]);
    assert.ok([...description].length <= 160, `${post.slug}: description is ${[...description].length} chars`);

    assert.match(html, /<meta property="og:image" content="https:\/\/cosylanguages\.github\.io\/COSYmagazine\/images\/logo\.png">/);
    assert.match(html, /<meta name="twitter:card" content="summary">/);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://cosylanguages\\.github\\.io/COSYmagazine/${escapeRegExp(post.slug)}\\.html">`)
    );
  }
});

test('translated articles expose one hreflang per language plus x-default', () => {
  const html = fs.readFileSync(path.join(ROOT, 'top-10-verbs.html'), 'utf8');
  const links = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map((match) => ({ lang: match[1], href: match[2] }));
  const languages = new Set(links.map((link) => link.lang));

  for (const lang of ['en', 'fr', 'it', 'ru', 'el', 'es', 'de', 'pt', 'hy', 'ka', 'tt', 'ba', 'br', 'cv', 'x-default']) {
    assert.ok(languages.has(lang), `missing hreflang ${lang}`);
  }
  assert.equal(languages.size, links.length, 'duplicate hreflang language');
  for (const link of links) {
    const relative = link.href.replace('https://cosylanguages.github.io/COSYmagazine/', '');
    assert.ok(fs.existsSync(path.join(ROOT, relative)), `hreflang target missing: ${relative}`);
  }
});
