import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseArgs,
  deriveVolumeFromFilename,
  validatePdfFile,
  getSupabaseConfig
} from '../scripts/upload-pdf-to-supabase.js';

test('parseArgs: extracts file, volume, title, storage-path, and draft correctly', () => {
  const args = [
    '--file', 'magazines/august-2026.pdf',
    '--volume', 'Vol. 2026.08',
    '--title', 'Get Ready for School',
    '--storage-path', 'issues/august.pdf',
    '--draft'
  ];
  const parsed = parseArgs(args);
  assert.equal(parsed.volume, 'Vol. 2026.08');
  assert.equal(parsed.title, 'Get Ready for School');
  assert.equal(parsed.storagePath, 'issues/august.pdf');
  assert.equal(parsed.publish, false);
  assert.match(parsed.file, /august-2026\.pdf$/);
});

test('deriveVolumeFromFilename: extracts standard Vol. YYYY.MM patterns', () => {
  assert.equal(deriveVolumeFromFilename('august-2026-08.pdf'), 'Vol. 2026.08');
  assert.equal(deriveVolumeFromFilename('vol-2026-11.pdf'), 'Vol. 2026.11');
  assert.equal(deriveVolumeFromFilename('COSYmagazine_2026.12_edition.pdf'), 'Vol. 2026.12');
  assert.equal(deriveVolumeFromFilename('random_document.pdf'), null);
});

test('validatePdfFile: rejects missing files or non-PDF files', () => {
  assert.throws(() => validatePdfFile('non-existent-file.pdf'), /does not exist/);

  const tmpDir = os.tmpdir();
  const invalidFile = path.join(tmpDir, `test-invalid-${Date.now()}.txt`);
  fs.writeFileSync(invalidFile, 'This is plain text not a pdf file and it is long enough to exceed one hundred bytes total length for validation.');

  try {
    assert.throws(() => validatePdfFile(invalidFile), /missing %PDF- magic bytes/);
  } finally {
    fs.unlinkSync(invalidFile);
  }
});

test('validatePdfFile: accepts valid PDF with header bytes', () => {
  const tmpDir = os.tmpdir();
  const validFile = path.join(tmpDir, `test-valid-${Date.now()}.pdf`);
  // %PDF-1.4 followed by dummy bytes > 100 bytes
  const dummyPdf = '%PDF-1.4\n' + '%'.repeat(120) + '\n%%EOF\n';
  fs.writeFileSync(validFile, dummyPdf);

  try {
    const buffer = validatePdfFile(validFile);
    assert.ok(buffer);
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
  } finally {
    fs.unlinkSync(validFile);
  }
});

test('getSupabaseConfig: throws when environment variables are missing', () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    assert.throws(() => getSupabaseConfig(), /Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/);
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
    if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  }
});
