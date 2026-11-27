import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderIssueCover, ISSUE_COVERS } from '../js/art/vogue-cover.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREDITS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'images', 'covers', 'CREDITS.json'), 'utf-8')
);

// Only licences that carry no attribution obligation may ship inside a paid edition.
const SELLABLE = new Set(['cc0', 'public domain', 'public domain mark', 'pd']);

test('cover art - every issue cover points at a committed photograph', () => {
  for (const [key, art] of Object.entries(ISSUE_COVERS)) {
    assert.ok(art.photo, `${key} needs a photo`);
    const abs = path.join(ROOT, art.photo);
    assert.ok(fs.existsSync(abs), `${key} photo ${art.photo} is missing`);
    const stat = fs.statSync(abs);
    assert.ok(stat.size > 20_000, `${key} photo looks like a stub (${stat.size} bytes)`);
  }
});

test('cover art - every photograph is credited with a sellable licence', () => {
  const keyFor = (file) => path.basename(file, path.extname(file));
  for (const [key, art] of Object.entries(ISSUE_COVERS)) {
    const id = keyFor(art.photo);
    const credit = CREDITS.covers[id];
    assert.ok(credit, `${key} has no entry in images/covers/CREDITS.json`);
    assert.equal(credit.file, art.photo, `${id} credit points at ${credit.file}`);
    assert.ok(
      SELLABLE.has(String(credit.license).toLowerCase()),
      `${id} licence "${credit.license}" obliges attribution or share-alike; paid editions need CC0/PD`
    );
    assert.ok(/^https:\/\//.test(credit.source || ''), `${id} needs a source URL for provenance`);
  }
});

test('cover art - no orphaned credit entries', () => {
  const used = new Set(Object.values(ISSUE_COVERS).map((a) => path.basename(a.photo, '.jpg')));
  for (const id of Object.keys(CREDITS.covers)) {
    assert.ok(used.has(id), `${id} is credited but no issue uses it`);
  }
});

test('cover art - the cover draws a photograph, not a face', () => {
  // The previous parametric bust rendered ellipse eyes, which read as uncanny. A cover
  // must now be a photo layer and must not contain the drawn facial features.
  for (const key of Object.keys(ISSUE_COVERS)) {
    const number = key === 'podcast' ? 'Podcast Special' : key.replace('_', '.');
    const svg = renderIssueCover({
      number: number.startsWith('Vol.') ? number : `Vol. ${number}`,
      title: 'Test',
      tag: 'Tag',
      month: 'August'
    });
    assert.match(svg, /<image[^>]+href="images\/covers\//, `${key} must embed a photo`);
    assert.ok(!svg.includes('<ellipse'), `${key} must not draw ellipse eyes`);
  }
});
