import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { selectEditionPosts } = require('../scripts/build/lib/print-edition.js');
const { listPostFiles } = await import('../scripts/build/lib/content-paths.js');

test('a hub and its same-language translation are one printed article', () => {
  const posts = [
    { slug: 'hub', language: 'en', printOrder: 1 },
    { slug: 'hub-en', language: 'en', printOrder: 2, translationOf: 'hub' },
    { slug: 'hub-fr', language: 'fr', printOrder: 2, translationOf: 'hub' }
  ];
  assert.deepEqual(selectEditionPosts(posts, 'en').map((p) => p.slug), ['hub']);
  assert.deepEqual(selectEditionPosts(posts, 'fr').map((p) => p.slug), ['hub-fr']);
});

test('August English edition does not print the twin deep dives twice', () => {
  const posts = listPostFiles()
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
    .filter((post) => /2026\.08/.test(String((post.issue && post.issue.number) || '')));

  const english = selectEditionPosts(posts, 'en');
  const slugs = english.map((post) => post.slug);

  assert.ok(slugs.includes('top-10-verbs'), 'the hub should print');
  assert.ok(slugs.includes('top-100-a0-a1'), 'the hub should print');
  assert.ok(!slugs.includes('top-10-verbs-en'), 'the -en twin must not print');
  assert.ok(!slugs.includes('top-100-a0-a1-english'), 'the -english twin must not print');

  const families = english.map((post) => post.translationOf || post.slug);
  assert.equal(new Set(families).size, families.length, 'one printed article per translation family');
});
