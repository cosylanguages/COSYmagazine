import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

// studio-core.js is vendored from COSYstudio. Fail if it was edited locally.
const lock = JSON.parse(fs.readFileSync(new URL('../js/studio-core.lock.json', import.meta.url), 'utf8'));
const file = fs.readFileSync(new URL('../js/studio-core.js', import.meta.url));

test('studio-core.js matches the COSYstudio copy pinned in studio-core.lock.json', () => {
  const actual = crypto.createHash('sha256').update(file).digest('hex');
  assert.equal(actual, lock.sha256,
    'studio-core.js differs from COSYstudio. Change it in COSYstudio (packages/studio-core), ' +
    're-copy it here and update js/studio-core.lock.json.');
  assert.match(lock.commit, /^[0-9a-f]{40}$/);
});
