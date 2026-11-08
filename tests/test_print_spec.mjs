import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../js/print-spec.js');
const Editor = require('../js/editor.js');

const words = (n) => Array.from({ length: n }, () => 'word').join(' ');
const para = (n) => ({ type: 'paragraph', text: words(n) });

test('press spec: A4 with 3 mm bleed, 300 dpi, multiples of 4', () => {
  assert.deepEqual({ ...P.PRESS_SPEC.trimMm }, { width: 210, height: 297 });
  assert.equal(P.PRESS_SPEC.bleedMm, 3);
  assert.equal(P.PRESS_SPEC.dpi, 300);
  assert.equal(P.requiredPixels(216, 300), 2552); // full-bleed width (rounded up)
  assert.equal(P.requiredPixels(185, 300), 2186); // text-frame width (rounded up)
});

test('estimateArticlePages: grows with words, skips digital-only blocks and spoken script', () => {
  const small = P.estimateArticlePages({ blocks: [para(200)] });
  const big = P.estimateArticlePages({ blocks: [para(4000)] });
  assert.equal(small.pages, 1);
  assert.ok(big.pages >= 5 && big.pages <= 7, `got ${big.pages}`);

  const digital = P.estimateArticlePages({ blocks: [para(200), { ...para(4000), medium: 'digital' }] });
  assert.equal(digital.pages, small.pages);
  assert.equal(digital.digitalOnlyBlocks, 1);

  const spoken = P.estimateArticlePages({ blocks: [{ ...para(100), say: words(5000), beat: words(500) }] });
  assert.equal(spoken.words, 100);

  const printOnly = P.estimateArticlePages({ blocks: [para(100), { ...para(4000), medium: 'print' }] });
  assert.ok(printOnly.pages > small.pages);
  assert.equal(printOnly.printOnlyBlocks, 1);
});

test('estimateArticlePages: print.pages overrides the estimate', () => {
  const e = P.estimateArticlePages({ blocks: [para(200)], print: { pages: 6 } });
  assert.equal(e.pages, 6);
  assert.equal(e.estimatedPages, 1);
  assert.equal(e.source, 'override');
});

test('raster images in print are flagged, SVG and digital-only images are not', () => {
  const e = P.estimateArticlePages({ blocks: [
    { type: 'image', url: 'a.jpg', alt: 'x' },
    { type: 'image', url: 'b.svg', alt: 'x' },
    { type: 'image', url: 'c.png', alt: 'x', medium: 'digital' }
  ] });
  assert.equal(e.rasterImages.length, 1);
  assert.equal(e.rasterImages[0].minPixelsFrameWidth, 2186);
});

test('planIssue: inside pages are a multiple of 4, with fill and cover totals', () => {
  const plan = P.planIssue([{ pages: 3 }, { pages: 2 }, { pages: 1 }]);
  assert.equal(plan.contentPages, 6);
  assert.equal(plan.insidePages, 8);
  assert.equal(plan.fillPages, 2);
  assert.equal(plan.totalWithCover, 12);
  assert.equal(plan.efficientInsidePages, 16);
  assert.equal(P.planIssue([{ pages: 16 }]).fillPages, 0);
  assert.equal(P.planIssue([{ pages: 17 }]).insidePages, 20);
  assert.equal(P.planIssue([]).insidePages, 4);
});

test('role limits: only a founder can reach "published"', () => {
  assert.equal(Editor.maxStatusFor(null), 'drafting');
  assert.equal(Editor.maxStatusFor({ role: 'contributor' }), 'in-review');
  assert.equal(Editor.maxStatusFor({ role: 'editor' }), 'approved');
  assert.equal(Editor.maxStatusFor({ isFounder: true }), 'published');
  assert.equal(Editor.getCapabilities({ role: 'editor' }).publishLive, false);
});

test('status and draft stay in sync, and roles cannot exceed their limit', () => {
  Editor.setCurrentPost({ title: 'T', slug: 't', blocks: [], draft: true });
  assert.equal(Editor.setPostStatus('in-review', { isFounder: true }), true);
  assert.equal(Editor.getCurrentPost().draft, true);
  assert.equal(Editor.setPostStatus('published', { role: 'editor' }), false);
  assert.equal(Editor.getCurrentPost().status, 'in-review');
  assert.equal(Editor.setPostStatus('published', { isFounder: true }), true);
  assert.equal(Editor.getCurrentPost().draft, false);
});

test('readiness: standalone needs no issue; real-person article needs consent', () => {
  const base = { title: 'T', slug: 't', kicker: 'k', dek: 'd', date: '2026-11-08', blocks: [{ type: 'paragraph', text: 'x' }], tags: ['a'] };
  const standalone = Editor.getReadiness({ ...base, contentType: 'evergreen' });
  assert.equal(standalone.find(c => c.id === 'issue'), undefined);
  assert.equal(standalone.filter(c => c.level === 'error').length, 0);

  const issueless = Editor.getReadiness({ ...base, contentType: 'issue-article' });
  assert.equal(issueless.find(c => c.id === 'issue').level, 'error');

  const real = Editor.getReadiness({ ...base, contentType: 'evergreen', workflow: { featuresRealPerson: true, ledger: {} } });
  assert.equal(real.find(c => c.id === 'consent').level, 'error');
  const ok = Editor.getReadiness({ ...base, contentType: 'evergreen', workflow: { featuresRealPerson: true, ledger: { consentOnFile: 'done' } } });
  assert.equal(ok.find(c => c.id === 'consent'), undefined);
});
