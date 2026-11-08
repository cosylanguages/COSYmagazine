import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validatePostSchema } = require('../scripts/validate-blog-schema.js');

test('validatePostSchema - Valid schema object passes validation', () => {
  const validPost = {
    id: 'post-test-001',
    slug: 'test-valid-post',
    language: 'en',
    translationOf: 'base-test-post',
    draft: false,
    desk: 'Words',
    format: 'essay',
    level: 'B1',
    issue: {
      number: 'Vol. 2026.10',
      title: "JY DM's birthday & His favs"
    },
    date: '2026-10-15',
    title: 'Test Valid Post Title',
    kicker: 'TEST KICKER',
    dek: 'This is a valid test post deck description.',
    tags: ['Test', 'Schema'],
    readingTime: 3,
    podcast: {
      episode: 1,
      audioUrl: 'audio/test-valid-post.mp3'
    },
    artDirection: {
      palette: ['#0d9488', '#faf7f2', '#1e293b'],
      fonts: {
        display: 'Fraunces',
        text: 'DM Sans',
        accent: 'Fraunces Italic'
      },
      layout: 'magazine-spread',
      motif: 'editorial-stars',
      seed: 'test-001',
      coverOverride: null
    },
    blocks: [
      {
        type: 'heading',
        level: 2,
        text: 'Test Heading',
        say: 'Test heading speech script',
        beat: { duration: 800, camera: 'zoom-in' }
      },
      {
        type: 'paragraph',
        text: 'Test paragraph content block.'
      },
      {
        type: 'table',
        headers: ['Column 1', 'Column 2'],
        rows: [['Cell 1', 'Cell 2']]
      }
    ]
  };

  const errors = validatePostSchema(validPost, 'test-valid-post');
  assert.equal(errors.length, 0, `Expected 0 errors, got: ${errors.join('; ')}`);
});

test('validatePostSchema - Invalid schema objects fail validation', () => {
  const invalidPost = {
    id: 'post-invalid',
    slug: 'invalid-post',
    language: 'unknown_lang',
    desk: 'Invalid Desk Name',
    format: 'unsupported_format',
    blocks: []
  };

  const errors = validatePostSchema(invalidPost, 'invalid-post');
  assert.ok(errors.length > 0, 'Expected validation errors for invalid schema object.');
});


const basePost = () => ({
  id: 'post-wf-001',
  slug: 'workflow-test-post',
  language: 'en',
  desk: 'Words',
  format: 'essay',
  level: 'B1',
  issue: { number: 'Vol. 2026.12', title: 'Winter Grammar' },
  date: '2026-11-08',
  title: 'Workflow test',
  kicker: 'TEST',
  dek: 'A test deck.',
  tags: ['Test'],
  readingTime: 2,
  artDirection: { palette: ['#0d9488'], fonts: { display: 'Fraunces', text: 'DM Sans' } },
  blocks: [{ type: 'paragraph', text: 'Hello.' }]
});

test('validatePostSchema - issue is required for issue articles but optional for evergreen posts', () => {
  const noIssue = basePost();
  delete noIssue.issue;
  assert.ok(validatePostSchema(noIssue, 'a').some(e => e.includes('"issue"')), 'legacy posts without an issue still fail');

  const asIssueArticle = { ...noIssue, contentType: 'issue-article' };
  assert.ok(validatePostSchema(asIssueArticle, 'b').some(e => e.includes('"issue"')));

  for (const contentType of ['evergreen', 'podcast-companion']) {
    assert.deepEqual(validatePostSchema({ ...noIssue, contentType }, 'c'), []);
  }

  assert.ok(validatePostSchema({ ...noIssue, contentType: 'blog' }, 'd').some(e => e.includes('contentType')));
  // A malformed issue is still rejected for evergreen posts
  assert.ok(validatePostSchema({ ...noIssue, contentType: 'evergreen', issue: { number: 5 } }, 'e').some(e => e.includes('"issue"')));
});

test('validatePostSchema - unfinished articles must stay drafts', () => {
  for (const status of ['idea', 'assigned', 'drafting', 'in-review', 'fact-checked', 'approved']) {
    const live = { ...basePost(), status, draft: false };
    assert.ok(validatePostSchema(live, 'x').some(e => e.includes('requires "draft": true')), `${status} + draft:false must fail`);
    assert.ok(validatePostSchema({ ...basePost(), status }, 'x').some(e => e.includes('requires "draft": true')), `${status} without draft must fail`);
    assert.deepEqual(validatePostSchema({ ...basePost(), status, draft: true }, 'x'), []);
  }
  assert.deepEqual(validatePostSchema({ ...basePost(), status: 'published', draft: false }, 'x'), []);
  assert.deepEqual(validatePostSchema({ ...basePost(), status: 'published' }, 'x'), []);
  assert.ok(validatePostSchema({ ...basePost(), status: 'published', draft: true }, 'x').some(e => e.includes('cannot also be')));
  assert.ok(validatePostSchema({ ...basePost(), status: 'shipped', draft: true }, 'x').some(e => e.includes('Invalid status')));
});

test('validatePostSchema - real people need consent on file before publication', () => {
  const published = (workflow) => ({ ...basePost(), status: 'published', draft: false, workflow });

  assert.ok(validatePostSchema(published({ featuresRealPerson: true }), 'x').some(e => e.includes('consentOnFile')));
  assert.ok(validatePostSchema(published({ featuresRealPerson: true, ledger: { consentOnFile: 'todo' } }), 'x').some(e => e.includes('consentOnFile')));
  assert.deepEqual(validatePostSchema(published({ featuresRealPerson: true, ledger: { consentOnFile: 'done' } }), 'x'), []);
  // Not about a real person: no consent needed
  assert.deepEqual(validatePostSchema(published({ featuresRealPerson: false }), 'x'), []);
  // The consent rule does not block drafts that are still being prepared
  assert.deepEqual(validatePostSchema({ ...basePost(), status: 'drafting', draft: true, workflow: { featuresRealPerson: true } }, 'x'), []);
});

test('validatePostSchema - workflow, print and block medium shapes', () => {
  assert.ok(validatePostSchema({ ...basePost(), workflow: 'me' }, 'x').some(e => e.includes('"workflow"')));
  assert.ok(validatePostSchema({ ...basePost(), workflow: { ledger: { typoCheck: 'done' } } }, 'x').some(e => e.includes('Unknown')));
  assert.ok(validatePostSchema({ ...basePost(), workflow: { ledger: { proofread: 'yes' } } }, 'x').some(e => e.includes('"todo", "done" or "na"')));
  assert.ok(validatePostSchema({ ...basePost(), workflow: { owner: 3 } }, 'x').some(e => e.includes('owner')));
  assert.deepEqual(validatePostSchema({ ...basePost(), workflow: { owner: 'JY DM', notes: 'n', ledger: { proofread: 'na' } } }, 'x'), []);

  assert.ok(validatePostSchema({ ...basePost(), print: { pages: 0 } }, 'x').some(e => e.includes('print.pages')));
  assert.deepEqual(validatePostSchema({ ...basePost(), print: { pages: 2 } }, 'x'), []);

  const withMedium = (medium) => ({ ...basePost(), blocks: [{ type: 'paragraph', text: 'Hi', medium }] });
  for (const m of ['both', 'digital', 'print']) assert.deepEqual(validatePostSchema(withMedium(m), 'x'), []);
  assert.ok(validatePostSchema(withMedium('radio'), 'x').some(e => e.includes('"medium"')));
});
