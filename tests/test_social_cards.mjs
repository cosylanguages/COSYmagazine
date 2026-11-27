import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));
const slugs = new Set(posts.map((post) => post.slug));
const files = fs.readdirSync(path.join(ROOT, 'og'));
const svgs = new Set(files.filter((file) => file.endsWith('.svg')).map((file) => file.slice(0, -4)));
const jpgs = new Set(files.filter((file) => file.endsWith('.jpg')).map((file) => file.slice(0, -4)));

test('OG art exists only for live posts', () => {
  assert.deepEqual([...svgs].sort(), [...slugs].sort());
  assert.deepEqual([...jpgs].sort(), [...slugs].sort());
});

test('every live post has a valid JPEG social card', () => {
  for (const slug of slugs) {
    const file = path.join(ROOT, 'og', `${slug}.jpg`);
    const buffer = fs.readFileSync(file);
    assert.ok(buffer.length > 1024, `${slug}: social card is too small`);
    assert.deepEqual([...buffer.subarray(0, 3)], [0xff, 0xd8, 0xff], `${slug}: not a JPEG`);
  }
});
