import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('sign-in links return to the current page and bust the cached login HTML', () => {
  const cmsAuth = read('js/cms-auth.js');
  const flipbook = read('js/flipbook.js');
  const issueDownload = read('js/issue-download.js');

  assert.match(cmsAuth, /redirect=\$\{encodeURIComponent\(window\.location\.href\)\}&v=20261125-1/);
  assert.match(flipbook, /encodeURIComponent\(window\.location\.href\) \+ '&v=20261125-1'/);
  assert.match(issueDownload, /redirect=\$\{encodeURIComponent\(window\.location\.href\)\}&v=20261125-1/);
});
