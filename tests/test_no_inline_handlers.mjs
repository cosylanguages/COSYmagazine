import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { listPostFiles } = require('../scripts/build/lib/content-paths.js');
const INLINE_HANDLER = /\son(?:click|load|error|submit|change|input|keydown|keyup|mouseover|mouseout|focus|blur)\s*=/i;

test('production pages contain no inline event handlers', () => {
  const pages = fs.readdirSync(ROOT).filter((file) => file.endsWith('.html'));
  const offenders = pages.filter((page) => INLINE_HANDLER.test(fs.readFileSync(path.join(ROOT, page), 'utf8')));
  assert.deepEqual(offenders, []);
});

test('content sources contain no inline event handlers or javascript: URLs', () => {
  const offenders = [];
  for (const file of listPostFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    if (INLINE_HANDLER.test(text) || /javascript\s*:/i.test(text)) {
      offenders.push(path.relative(ROOT, path.resolve(file)));
    }
  }
  assert.deepEqual(offenders, []);
});
