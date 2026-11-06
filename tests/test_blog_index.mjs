import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('blog/index.json structure and integrity', () => {
  const indexPath = path.join(__dirname, '..', 'index.json');
  assert.ok(fs.existsSync(indexPath), 'blog/index.json should exist');

  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  assert.equal(indexData.version, '2.0.0');
  assert.ok(Array.isArray(indexData.desks), 'desks should be an array');
  assert.equal(indexData.desks.length, 13, 'should contain exactly 13 desks');
  assert.ok(Array.isArray(indexData.issues), 'issues should be an array');
  assert.ok(Array.isArray(indexData.posts), 'posts should be an array');
  assert.ok(indexData.posts.length > 0, 'posts array should not be empty');

  // Verify a published reference post is present in index
  const referencePost = indexData.posts.find(p => p.slug === 'why-speaking-first');
  assert.ok(referencePost, 'why-speaking-first post should be present in index');
  assert.equal(referencePost.desk, 'Front Page');
  assert.equal(referencePost.format, 'essay');

  // Drafts must not leak into the public index
  assert.ok(!indexData.posts.some(p => p.draft), 'index.json must not contain drafts');
  // The index is lean: no block bodies
  assert.ok(indexData.posts.every(p => p.blocks === undefined), 'index.json should not carry post blocks');
});
