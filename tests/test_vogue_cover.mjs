import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderIssueCover, ISSUE_COVERS } from '../js/art/vogue-cover.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['en', 'fr', 'it', 'ru', 'el'];

const loadDict = (lang) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'js', 'i18n', `${lang}.json`), 'utf-8'));

const coverKeyFor = (issueNumber) =>
  issueNumber === 'Podcast Special' ? 'podcast' : issueNumber.replace('Vol. ', '').replace('.', '_');

test('renderIssueCover - portrait 3:4 canvas', () => {
  const svg = renderIssueCover({ number: 'Vol. 2026.09', title: 'Test', tag: 'Tag', month: 'September' });
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  assert.ok(m, 'cover must declare a viewBox');
  const [, w, h] = m.map(Number);
  assert.equal(w, 900);
  assert.equal(h, 1200);
  assert.ok(svg.startsWith('<svg'), 'must emit an svg element');
});

test('renderIssueCover - every cover key has artwork', () => {
  for (const [key, art] of Object.entries(ISSUE_COVERS)) {
    assert.ok(art.accent, `${key} needs an accent`);
    assert.ok(art.backdrop, `${key} needs a backdrop`);
    assert.ok(art.subjectTone, `${key} needs a subject tone`);
    assert.equal(art.coverLines.left.length, 2, `${key} needs two left cover lines`);
    assert.equal(art.coverLines.right.length, 2, `${key} needs two right cover lines`);
    for (const [kicker, sub] of [...art.coverLines.left, ...art.coverLines.right]) {
      assert.equal(typeof kicker, 'string');
      assert.equal(typeof sub, 'string');
      assert.ok(kicker.length > 0 && sub.length > 0);
    }
  }
});

test('renderIssueCover - subject contrasts with the backdrop', () => {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (c) => {
    const s = c.map((v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  for (const [key, art] of Object.entries(ISSUE_COVERS)) {
    const a = lum(hex(art.subjectTone));
    const b = lum(hex(art.backdrop));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(ratio >= 2.0, `${key} subject/backdrop contrast ${ratio.toFixed(2)} is too low`);
  }
});

test('renderIssueCover - text is localized, not hardcoded English', () => {
  for (const lang of LANGS) {
    const dict = loadDict(lang);
    const covers = dict.catalog && dict.catalog.covers;
    assert.ok(covers, `${lang}.json needs catalog.covers`);
  }

  // Every key used by the renderer must exist in every dictionary, or a reader sees a
  // blank or English line after switching language.
  const requiredKeys = ['kicker1', 'kicker2', 'kicker3', 'kicker4', 'sub1', 'sub2', 'sub3', 'sub4', 'hero', 'tag', 'month'];
  for (const lang of LANGS) {
    const covers = loadDict(lang).catalog.covers;
    for (const [key, cover] of Object.entries(covers)) {
      for (const k of requiredKeys) {
        if (k === 'month' && key === 'podcast') continue;
        assert.ok(
          typeof cover[k] === 'string',
          `${lang}.json catalog.covers.${key}.${k} is missing`
        );
      }
    }
  }
});

test('renderIssueCover - emits data-i18n hooks for runtime translation', () => {
  const svg = renderIssueCover({
    number: 'Vol. 2026.09',
    title: 'Test',
    tag: 'Tag',
    month: 'September',
    i18nKey: 'catalog.covers.2026_09',
    hero: 'THE PLATEAU ISSUE'
  });
  for (const suffix of ['kicker1', 'kicker2', 'kicker3', 'kicker4', 'hero', 'tag', 'month']) {
    assert.ok(
      svg.includes(`data-i18n="catalog.covers.2026_09.${suffix}"`),
      `cover must expose data-i18n for ${suffix}`
    );
  }
});

test('renderIssueCover - masthead is pinned to its span', () => {
  const svg = renderIssueCover({ number: 'Vol. 2026.09', title: 'Test' });
  // textLength is what keeps the logo from bleeding off the canvas when the serif font
  // resolves differently on the reader's machine.
  assert.match(svg, /textLength="792"/, 'masthead must pin textLength to 88% of 900px');
});

test('renderIssueCover - cover lines never reach the centre band', () => {
  // The centre band belongs to the subject. Cover lines are placed in the side columns,
  // so their anchors must stay outside it.
  for (const key of Object.keys(ISSUE_COVERS)) {
    const svg = renderIssueCover({
      number: key === 'podcast' ? 'Podcast Special' : `Vol. ${key.replace('_', '.')}`,
      title: 'Test',
      tag: 'Tag',
      month: 'September'
    });
    const lineBlock = svg.slice(svg.indexOf('vc-cover-line'));
    const xValues = [...lineBlock.matchAll(/<text x="([\d.]+)"[^>]*text-anchor="(start|end)"/g)]
      .map((m) => Number(m[1]));
    assert.ok(xValues.length >= 4, `${key} should have at least four cover-line text nodes`);
    for (const x of xValues) {
      const inLeft = x <= 900 * 0.42;
      const inRight = x >= 900 * 0.58;
      assert.ok(inLeft || inRight, `${key} cover line anchored at ${x} inside the centre band`);
    }
  }
});

test('renderIssueCover - the tag sits in the gutter between the cover-line blocks', () => {
  // The tag is centred, so a long Russian or Greek tag spans most of the width. It must sit
  // in the empty band between the upper-left and lower-right cover lines; anywhere else it
  // lands on top of a cover line. The old "just below the chin" position collided with the
  // second left cover line in ru and el.
  for (const lang of LANGS) {
    const covers = loadDict(lang).catalog.covers;
    for (const [key, cover] of Object.entries(covers)) {
      if (key === 'podcast') continue;
      const fitTexts = {};
      for (const [k, v] of Object.entries(cover)) if (typeof v === 'string' && v) fitTexts[k] = [v];
      const svg = renderIssueCover({
        number: `Vol. ${key.replace('_', '.')}`,
        title: cover.hero,
        tag: cover.tag,
        hero: cover.hero,
        i18nKey: `catalog.covers.${key}`,
        fitTexts
      });

      const tagY = Number(/<text x="450" y="([\d.]+)"[^>]*data-i18n="[^"]*\.tag"/.exec(svg)?.[1]);
      assert.ok(Number.isFinite(tagY), `${lang}/${key} must emit a centred tag line`);

      // Baselines of the four cover-line kickers, split by side.
      const ys = [...svg.matchAll(/<text x="[\d.]+" y="([\d.]+)"[^>]*font-weight="700"[^>]*data-i18n="[^"]*\.kicker(\d)"/g)]
        .map((m) => ({ y: Number(m[1]), idx: Number(m[2]) }));
      const left = ys.filter((l) => l.idx <= 2).map((l) => l.y);
      const right = ys.filter((l) => l.idx >= 3).map((l) => l.y);
      assert.equal(left.length, 2, `${lang}/${key} needs two left kickers`);
      assert.equal(right.length, 2, `${lang}/${key} needs two right kickers`);

      assert.ok(tagY > Math.max(...left), `${lang}/${key} tag at ${tagY} overlaps the left cover lines`);
      assert.ok(tagY < Math.min(...right), `${lang}/${key} tag at ${tagY} overlaps the right cover lines`);
    }
  }
});

test('renderIssueCover - every i18n key is a single text node', () => {
  // shell.js swaps textContent on the element carrying data-i18n. If a string is split
  // across several nodes, only the first is translated and the rest keep the built
  // language, which renders mixed-language covers. Each key must therefore appear once.
  for (const lang of LANGS) {
    const covers = loadDict(lang).catalog.covers;
    for (const [key, cover] of Object.entries(covers)) {
      const svg = renderIssueCover({
        number: key === 'podcast' ? 'Podcast Special' : `Vol. ${key.replace('_', '.')}`,
        title: 'Test',
        i18nKey: `catalog.covers.${key}`,
        fitTexts: Object.fromEntries(
          Object.entries(cover).map(([k, v]) => [k, [v]])
        )
      });
      const keys = [...svg.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
      const counts = keys.reduce((acc, k) => ((acc[k] = (acc[k] || 0) + 1), acc), {});
      for (const [k, n] of Object.entries(counts)) {
        assert.equal(n, 1, `${lang}/${key}: ${k} is rendered ${n} times, must be once`);
      }
    }
  }
});

test('renderIssueCover - the drawn copy is the copy that was measured', () => {
  // Sizing runs over fitTexts, so the first variant (English) must also be what is
  // drawn. Otherwise long copy is drawn at a size fitted for shorter copy and overflows.
  const svg = renderIssueCover({
    number: 'Vol. 2026.09',
    title: 'Test',
    i18nKey: 'catalog.covers.2026_09',
    fitTexts: {
      kicker1: ['KICKER FROM DICT'],
      sub1: ['Sub from dict'],
      kicker2: ['K2'], sub2: ['S2'],
      kicker3: ['K3'], sub3: ['S3'],
      kicker4: ['K4'], sub4: ['S4']
    }
  });
  assert.ok(svg.includes('KICKER FROM DICT'), 'cover must draw the dictionary copy');
  assert.ok(svg.includes('Sub from dict'));
});

test('renderIssueCover - long translations shrink the type instead of overflowing', () => {
  const short = renderIssueCover({
    number: 'Vol. 2026.09', title: 'Test', fitTexts: { sub1: ['Short'] }
  });
  const long = renderIssueCover({
    number: 'Vol. 2026.09', title: 'Test',
    fitTexts: { sub1: ['An extremely long subheadline that cannot possibly fit the column'] }
  });
  const sizeOf = (svg) => {
    const block = svg.slice(svg.indexOf('vc-cover-line'));
    const all = [...block.matchAll(/font-size="([\d.]+)" font-style="italic"/g)].map((x) => Number(x[1]));
    return Math.min(...all);
  };
  assert.ok(sizeOf(long) < sizeOf(short), 'longer copy must be set smaller');
});
