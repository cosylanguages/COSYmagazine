import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { listPostFiles } = require('../scripts/build/lib/content-paths.js');

const xml = fs.readFileSync(path.join(ROOT, 'podcast.xml'), 'utf8');
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);

test('every feed item has a playable enclosure and a known duration', () => {
  assert.ok(items.length >= 2, 'the feed should contain the hosted episodes');
  for (const item of items) {
    const enclosure = item.match(/<enclosure\s+url="([^"]+)"\s+type="([^"]+)"(?:\s+length="(\d+)")?\s*\/>/);
    assert.ok(enclosure, `item has no enclosure: ${item.slice(0, 80)}`);
    assert.match(enclosure[2], /^audio\/(mpeg|mp4|ogg)$/);
    assert.ok(enclosure[3] && Number(enclosure[3]) > 0, 'enclosure length is required');
    const duration = item.match(/<itunes:duration>(\d+)<\/itunes:duration>/);
    assert.ok(duration && Number(duration[1]) > 0, 'itunes:duration is required');
  }
});

test('feed item GUIDs are unique', () => {
  const guids = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((match) => match[1]);
  assert.equal(new Set(guids).size, guids.length);
});

test('every post with a direct audio URL appears in the feed', () => {
  const direct = [];
  for (const file of listPostFiles()) {
    const post = JSON.parse(fs.readFileSync(file, 'utf8'));
    const audio = post.podcast && post.podcast.audioUrl;
    if (!audio) continue;
    if (/^https?:/.test(audio) && /\.(mp3|m4a|ogg)(\?|$)/i.test(audio)) {
      direct.push(audio);
    } else {
      const rel = audio.replace(/^(\.\.\/)+/, '').replace(/^audio\/blog\//, 'audio/');
      if (fs.existsSync(path.join(ROOT, rel))) {
        direct.push(`https://cosylanguages.github.io/COSYmagazine/${rel}`);
      }
    }
  }
  assert.ok(direct.length >= 2);
  for (const url of direct) assert.ok(xml.includes(url), `feed is missing ${url}`);
});

test('known episodes keep their authored durations', () => {
  assert.match(xml, /<itunes:duration>750<\/itunes:duration>/);
  assert.match(xml, /<itunes:duration>1264<\/itunes:duration>/);
});
