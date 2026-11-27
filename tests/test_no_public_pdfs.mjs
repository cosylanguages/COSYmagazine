import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('no PDF files are tracked in the public repository', () => {
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', '*.pdf'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    // Git is unavailable (for example, when the tests run from a package tarball).
    return;
  }

  const files = tracked ? tracked.split('\n') : [];
  assert.deepEqual(
    files,
    [],
    `Sold PDFs must be uploaded to Supabase, not committed. Tracked PDFs: ${files.join(', ')}`
  );
});
