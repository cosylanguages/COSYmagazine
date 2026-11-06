import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getStageTargetPath } = require('../scripts/export-stage-video.js');

test('stage exporter resolves generated pages from the repository root', () => {
  assert.equal(getStageTargetPath('why-speaking-first'), '/why-speaking-first.html');
});

test('stage exporter uses the dev demo page for its draft sample', () => {
  assert.equal(getStageTargetPath('stage-demo-podcast'), '/dev/stage-demo.html');
});

test('stage exporter rejects missing generated pages', () => {
  assert.throws(() => getStageTargetPath('missing-post'), /No generated HTML page found/);
});