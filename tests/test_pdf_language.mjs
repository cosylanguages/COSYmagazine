import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { parseArgs, deriveLanguageFromFilename } = require('../scripts/ops/upload-pdf-to-supabase.js');

test('the upload CLI accepts and infers edition languages', () => {
  assert.equal(parseArgs(['--file', 'x.pdf', '--language', 'fr']).language, 'fr');
  assert.equal(parseArgs(['--file', 'x.pdf', '--lang', 'ru']).language, 'ru');
  assert.equal(deriveLanguageFromFilename('cosymagazine-2026-08-fr.pdf'), 'fr');
  assert.equal(deriveLanguageFromFilename('cosymagazine-2026-08.pdf'), null);
  assert.throws(() => parseArgs(['--file', 'x.pdf', '--language', 'all']));
});

test('the workflow passes one language to the existing-file upload', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/upload-magazine-pdf.yml'), 'utf8');
  assert.ok(workflow.includes('LANGUAGE_INPUT: ${{ inputs.language }}'));
  assert.ok(workflow.includes('--language "$LANGUAGE_INPUT"'));
  assert.ok(!workflow.includes('magazines/august-2026.pdf'));
});

test('the Studio upload stores a per-language PDF and row', () => {
  const editor = fs.readFileSync(path.join(ROOT, 'js/editor.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'editor.html'), 'utf8');
  assert.ok(html.includes('studio-pdf-language-input'));
  assert.ok(editor.includes('issues/cosymagazine-${volumeSlug}-${language}.pdf'));
  assert.ok(editor.includes('language,'));
  assert.ok(editor.includes(".eq('language', language)"));
});
