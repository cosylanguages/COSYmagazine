import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLOG_DIR, listPostFiles } from '../scripts/build/lib/content-paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONTH_INDEX = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

// Expected repo-relative folder for a post, derived from its issue number alone.
function expectedFolder(post) {
  const raw = String(post.issue?.number || '');
  const explicit = raw.match(/(\d{4})\.(\d{2})/);
  if (explicit) return `content/issues/${explicit[1]}-${explicit[2]}/posts`;
  const written = raw.match(/(\d{4})\s*[—–-]\s*([A-Za-z]+)/);
  if (written && MONTH_INDEX[written[2].toLowerCase()]) {
    return `content/issues/${written[1]}-${MONTH_INDEX[written[2].toLowerCase()]}/posts`;
  }
  if (/podcast special/i.test(raw) || post.desk === 'Saturday Mistakes') {
    return 'content/website/saturday-mistakes/posts';
  }
  return 'content/website/front-page/posts';
}

test('every post source lives in the folder its issue implies', () => {
  const files = listPostFiles();
  assert.ok(files.length > 0, 'expected to find post sources');

  const misplaced = [];
  for (const file of files) {
    const post = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const actual = path.relative(BLOG_DIR, path.dirname(file)).split(path.sep).join('/');
    const expected = expectedFolder(post);
    if (actual !== expected) misplaced.push(`${post.slug}: in ${actual}, expected ${expected}`);
  }
  assert.deepEqual(misplaced, [], `misplaced post sources:\n${misplaced.join('\n')}`);
});

test('drafts are never discovered by the build', () => {
  const drafts = listPostFiles().filter((f) => path.relative(BLOG_DIR, f).split(path.sep).includes('drafts'));
  assert.deepEqual(drafts, [], 'listPostFiles() must skip drafts/ directories');
});

test('slug, filename and output page agree', () => {
  for (const file of listPostFiles()) {
    const post = JSON.parse(fs.readFileSync(file, 'utf-8'));
    assert.equal(
      path.basename(file, '.json'),
      post.slug,
      `${path.relative(BLOG_DIR, file)} must be named after its slug`
    );
  }
});
