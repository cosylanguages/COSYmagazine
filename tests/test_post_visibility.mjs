import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isLive, isScheduledForFuture } = require('../scripts/post-visibility.js');
const { validatePostSchema } = require('../scripts/validate-blog-schema.js');

test('live unless draft or scheduled for a later day', () => {
  const today = '2026-11-08';
  assert.equal(isLive({ draft: false }, today), true);
  assert.equal(isLive({}, today), true);
  assert.equal(isLive({ draft: true }, today), false);
  assert.equal(isLive({ publishAt: '2026-11-08' }, today), true);   // due today
  assert.equal(isLive({ publishAt: '2026-11-01' }, today), true);   // overdue
  assert.equal(isLive({ publishAt: '2026-11-09' }, today), false);  // tomorrow
  assert.equal(isScheduledForFuture({ publishAt: '2026-11-09' }, today), true);
  assert.equal(isScheduledForFuture({ draft: true, publishAt: '2026-11-09' }, today), false);
});

test('validator: publishAt must be a date; on a draft it is simply ignored', () => {
  const base = { id: 'x', slug: 'x', language: 'en', date: '2026-11-08', title: 'T', kicker: 'k', dek: 'd', contentType: 'evergreen', blocks: [{ type: 'paragraph', text: 'x' }] };
  const bad = validatePostSchema({ ...base, publishAt: 'next week' }, 't');
  assert.ok(bad.some(e => e.includes('publishAt')));
  const onDraft = validatePostSchema({ ...base, draft: true, publishAt: '2026-12-01' }, 't');
  assert.ok(!onDraft.some(e => e.includes('publishAt')));
  const ok = validatePostSchema({ ...base, draft: false, publishAt: '2026-12-01' }, 't');
  assert.ok(!ok.some(e => e.includes('publishAt')));
});
