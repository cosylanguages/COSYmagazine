import test from 'node:test';
import assert from 'node:assert/strict';

import { createPRNG } from '../js/art/rng.js';
import { MOTIFS } from '../js/art/motifs.js';
import { renderCover, renderSectionDivider, renderPullQuoteCard, renderWordCard, resolveArtDirection } from '../js/art/generator.js';

test('createPRNG - Deterministic output from same seed', () => {
  const prng1 = createPRNG('test-seed-123');
  const prng2 = createPRNG('test-seed-123');

  const val1_a = prng1.random();
  const val1_b = prng1.rangeInt(1, 100);

  const val2_a = prng2.random();
  const val2_b = prng2.rangeInt(1, 100);

  assert.strictEqual(val1_a, val2_a);
  assert.strictEqual(val1_b, val2_b);
});

test('MOTIFS - All 8 required motifs exist and return valid SVG', () => {
  const requiredMotifs = [
    'paper-cut', 'riso-print', 'gingham-knit', 'tea-stain',
    'window-light', 'ticket-stub', 'doodle-border', 'vintage-stamp'
  ];

  requiredMotifs.forEach(key => {
    assert.ok(typeof MOTIFS[key] === 'function', `Motif ${key} should be a function`);
    const prng = createPRNG(`seed-${key}`);
    const svgStr = MOTIFS[key]({
      width: 400,
      height: 200,
      palette: ['#1e293b', '#0d9488', '#f59e0b', '#faf7f2'],
      prng
    });
    assert.ok(svgStr.includes('<rect') || svgStr.includes('<g') || svgStr.includes('<path'), `Motif ${key} output should contain SVG elements`);
  });
});

test('renderCover - Produces valid SVG cover with post metadata and handles coverOverride', () => {
  const samplePost = {
    title: 'Test Post Title',
    kicker: 'GRAMMAR CORNER',
    desk: 'Grammar Made Cosy',
    slug: 'test-post-title',
    artDirection: {
      seed: 'test-post-title',
      motif: 'window-light',
      palette: ['#1a365d', '#3182ce', '#dd6b20', '#ebf8ff']
    }
  };

  const coverSvg = renderCover(samplePost);
  assert.ok(coverSvg.startsWith('<svg'), 'Cover output should start with <svg');
  assert.ok(coverSvg.includes('Test Post Title'), 'Cover output should render post title');
  assert.ok(coverSvg.includes('GRAMMAR CORNER'), 'Cover output should render kicker');

  // Test coverOverride
  const overridePost = {
    ...samplePost,
    artDirection: {
      ...samplePost.artDirection,
      coverOverride: '../images/custom-cover.jpg'
    }
  };
  const overrideSvg = renderCover(overridePost);
  assert.ok(overrideSvg.includes('<image href="../images/custom-cover.jpg"'), 'Cover override should render image tag');
});

test('renderSectionDivider, renderPullQuoteCard, renderWordCard - Render valid SVG structures', () => {
  const post = { slug: 'sample-post', desk: 'Words' };

  const divider = renderSectionDivider(post);
  assert.ok(divider.includes('cosy-section-divider'), 'Section divider should have correct class');

  const pullquote = renderPullQuoteCard({ quote: 'Languages connect minds.', attribution: 'JY DM' }, post);
  assert.ok(pullquote.includes('Languages connect minds.'), 'Pullquote should render quote text');
  assert.ok(pullquote.includes('JY DM'), 'Pullquote should render attribution');

  const wordCard = renderWordCard({ word: 'Serendipity', pos: 'noun', definition: 'Finding good things by chance' }, post);
  assert.ok(wordCard.includes('Serendipity'), 'Word card should render word');
  assert.ok(wordCard.includes('Finding good things by chance'), 'Word card should render definition');
});
