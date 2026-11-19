import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const { renderBlockToHtml } = require('../scripts/build/lib/blocks.js');
const { blockAudioUrl, resolveAudioUrl } = require('../scripts/build/lib/audio.js');

// The build used to keep these helpers in build-blog.js, where the block renderer
// could only reach them through module scope. Extracting the renderer without the
// helpers left a ReferenceError that no published post triggered, because no block
// uses `audioUrl` yet. These tests pin the seam shut.

test('blockAudioUrl resolves an absolute URL unchanged', () => {
  assert.equal(blockAudioUrl('https://example.com/a.mp3'), 'https://example.com/a.mp3');
});

test('blockAudioUrl returns null for a file that is not in the repo', () => {
  assert.equal(blockAudioUrl('audio/definitely-missing-file.mp3'), null);
});

test('blockAudioUrl returns null for empty input', () => {
  assert.equal(blockAudioUrl(null), null);
  assert.equal(blockAudioUrl(''), null);
});

test('a pronunciation block with a missing audio file renders no <audio> element', () => {
  const html = renderBlockToHtml({
    type: 'pronunciation',
    word: 'bonjour',
    ipa: 'bɔ̃ʒuʁ',
    audioUrl: 'audio/definitely-missing-file.mp3'
  });
  assert.match(html, /gazette-pronunciation-card/);
  assert.doesNotMatch(html, /<audio/);
});

test('a pronunciation block with a real audio URL renders a player', () => {
  const html = renderBlockToHtml({
    type: 'pronunciation',
    word: 'bonjour',
    ipa: 'bɔ̃ʒuʁ',
    audioUrl: 'https://example.com/a.mp3'
  });
  assert.match(html, /<audio controls/);
  assert.match(html, /https:\/\/example\.com\/a\.mp3/);
});

test('resolveAudioUrl ignores a missing local file but keeps an absolute URL', () => {
  assert.equal(resolveAudioUrl({ podcast: { audioUrl: 'audio/missing.mp3' } }), null);
  assert.equal(
    resolveAudioUrl({ podcast: { audioUrl: 'https://example.com/a.mp3' } }),
    'https://example.com/a.mp3'
  );
});

test('printable tables take slug and lang from the passed state, not module scope', () => {
  const html = renderBlockToHtml(
    { type: 'table', printable: true, listId: 'demo', headers: ['H'], rows: [['a']] },
    { isFirstParagraph: true, slug: 'my-post', lang: 'fr' }
  );
  assert.match(html, /my-post-demo/);
  assert.match(html, /La liste complète/);
});

test('renderBlockToHtml only applies the drop cap to the first paragraph', () => {
  const state = { isFirstParagraph: true, slug: 's', lang: 'en' };
  const first = renderBlockToHtml({ type: 'paragraph', text: 'One' }, state);
  const second = renderBlockToHtml({ type: 'paragraph', text: 'Two' }, state);
  assert.match(first, /gazette-drop-cap/);
  assert.doesNotMatch(second, /gazette-drop-cap/);
});
