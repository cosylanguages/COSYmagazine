import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../js/pacing.js');

const words = (n) => Array.from({ length: n }, () => 'word').join(' ');
const para = (n) => ({ type: 'paragraph', text: words(n) });
const post = (section, n, extra = {}) => ({
  slug: `${section}-${n}`,
  language: 'en',
  section,
  blocks: [para(n)],
  ...extra
});

test('zones are the three acts, in print order', () => {
  assert.deepEqual([...P.ZONES], ['fob', 'well', 'bob']);
  assert.deepEqual({ ...P.ZONE_LABELS }, {
    fob: 'Front of Book',
    well: 'The Well',
    bob: 'Back of Book'
  });
});

test('explicit zone wins over section and length', () => {
  assert.equal(P.zoneFor(post('words_desk', 5000, { zone: 'bob' })), 'bob');
  assert.equal(P.zoneFor(post('front_cover', 50, { zone: 'well' })), 'well');
});

test('an unknown zone value is ignored rather than trusted', () => {
  assert.equal(P.zoneFor(post('words_desk', 5000, { zone: 'middle' })), 'well');
});

test('section intent beats length for short front-of-book desks', () => {
  assert.equal(P.zoneFor(post('founder_dispatch', 500)), 'fob');
  assert.equal(P.zoneFor(post('debatable_relatable', 400)), 'fob');
});

test('a long piece in a front-of-book desk is promoted to the Well', () => {
  // A "dispatch" that runs 3,000 words is no longer a quick front piece.
  assert.equal(P.zoneFor(post('founder_dispatch', 3000)), 'well');
});

test('back-of-book sections stay at the back regardless of length', () => {
  assert.equal(P.zoneFor(post('essay', 300)), 'bob');
  assert.equal(P.zoneFor(post('life_with_without', 1200)), 'bob');
});

test('length decides when the section says nothing useful', () => {
  assert.equal(P.zoneFor(post('unknown_desk', 300)), 'fob');
  assert.equal(P.zoneFor(post('unknown_desk', 3000)), 'well');
  assert.equal(P.zoneFor(post('unknown_desk', 1000)), 'well');
});

test('the fob threshold is exclusive: 600 words is not a front piece', () => {
  assert.equal(P.zoneFor(post('unknown_desk', 599)), 'fob');
  assert.equal(P.zoneFor(post('unknown_desk', 600)), 'well');
});

test('long read starts at the Well minimum', () => {
  assert.equal(P.isLongRead(post('words_desk', 2499)), false);
  assert.equal(P.isLongRead(post('words_desk', 2500)), true);
});

test('groupByZone keeps caller order inside a zone and returns empty zones', () => {
  const groups = P.groupByZone([
    post('words_desk', 3000, { slug: 'a' }),
    post('founder_dispatch', 400, { slug: 'b' }),
    post('words_desk', 3000, { slug: 'c' })
  ]);
  assert.deepEqual(groups.map((g) => g.zone), ['fob', 'well', 'bob']);
  assert.deepEqual(groups[0].articles.map((i) => i.slug), ['b']);
  assert.deepEqual(groups[1].articles.map((i) => i.slug), ['a', 'c']);
  assert.equal(groups[2].articles.length, 0, 'an empty zone is reported, not hidden');
});

test('groupByZone reports word totals per zone', () => {
  const groups = P.groupByZone([
    post('founder_dispatch', 400),
    post('words_desk', 3000)
  ]);
  assert.equal(groups[0].words, 400);
  assert.equal(groups[1].words, 3000);
});

test('pacingReport names every missing act', () => {
  const report = P.pacingReport([post('words_desk', 3000)]);
  assert.equal(report.ok, false);
  assert.equal(report.longReads, 1);
  assert.ok(report.gaps.some((g) => g.includes('front-of-book')));
  assert.ok(report.gaps.some((g) => g.includes('back-of-book')));
});

test('pacingReport flags an issue with no long read', () => {
  const report = P.pacingReport([
    post('founder_dispatch', 400),
    post('words_desk', 1200),
    post('essay', 800)
  ]);
  assert.equal(report.longReads, 0);
  assert.ok(report.gaps.some((g) => g.includes('no long read')));
});

test('pacingReport is clean for a well-paced issue', () => {
  const report = P.pacingReport([
    post('founder_dispatch', 400),
    post('words_desk', 3200),
    post('essay', 700)
  ]);
  assert.equal(report.ok, true);
  assert.deepEqual(report.gaps, []);
});

test('pacingReport flags a front of book that swallowed the issue', () => {
  const report = P.pacingReport([
    post('founder_dispatch', 600),
    post('greatest_quotes', 600),
    post('words_desk', 400)
  ]);
  assert.ok(report.gaps.some((g) => g.includes('over half the words')));
});

test('pacingReport counts articles and words across the edition', () => {
  const report = P.pacingReport([
    post('founder_dispatch', 400),
    post('words_desk', 3000),
    post('essay', 600)
  ]);
  assert.equal(report.totalArticles, 3);
  assert.equal(report.totalWords, 4000);
});
