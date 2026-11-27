import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { renderLanguageSwitcherHtml } = require('../scripts/build/lib/language-switcher.js');
const { listPostFiles } = await import('../scripts/build/lib/content-paths.js');

const langDict = { blog: { read_in: 'Read in' } };

function count(html, flag) {
  return (html.match(new RegExp(flag, 'g')) || []).length;
}

test('a hub and its English twin produce one EN pill', () => {
  const posts = [
    { slug: 'hub', language: 'en' },
    { slug: 'hub-en', language: 'en', translationOf: 'hub' },
    { slug: 'hub-fr', language: 'fr', translationOf: 'hub' },
    { slug: 'hub-ru', language: 'ru', translationOf: 'hub' }
  ];
  for (const current of posts) {
    const html = renderLanguageSwitcherHtml(current, posts, langDict);
    assert.equal(count(html, '🇬🇧 EN'), 1, `one EN pill for ${current.slug}`);
    assert.equal(count(html, '🇫🇷 FR'), 1, `one FR pill for ${current.slug}`);
    const active = html.match(/<span class="lang-switcher-active">([^<]+)<\/span>/);
    assert.ok(active, `active pill for ${current.slug}`);
    assert.ok(active[1].includes(current.language.toUpperCase()), `active pill matches ${current.language}`);
  }
});

test('real August hubs and twins have one pill per language', () => {
  const posts = listPostFiles().map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
  for (const slug of ['top-10-verbs', 'top-10-verbs-en', 'top-10-verbs-fr', 'top-100-a0-a1', 'top-100-a0-a1-english']) {
    const current = posts.find((post) => post.slug === slug);
    assert.ok(current, `missing fixture post ${slug}`);
    const html = renderLanguageSwitcherHtml(current, posts, langDict);
    assert.equal(count(html, '🇬🇧 EN'), 1, `one EN pill for ${slug}`);
  }
});
