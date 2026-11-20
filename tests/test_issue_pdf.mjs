import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const { buildHtml, loadEdition, editionLanguages, runningDesks } = require(path.join(ROOT, 'scripts/ops/build-issue-pdf.js'));
const { escapeHtml } = require(path.join(ROOT, 'scripts/build/lib/text.js'));

const BLUEPRINT = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/blueprint.json'), 'utf8'));

test('blueprint carries every editorial element out of the retired page', () => {
  assert.equal(BLUEPRINT.elements.length, 19);
  assert.ok(BLUEPRINT.title.includes('19'), 'the blueprint title must state the real element count');
  for (const element of BLUEPRINT.elements) {
    assert.ok(element.number, 'every element needs a number');
    assert.ok(element.title, `element ${element.number} needs a title`);
    assert.ok(element.description.length > 20, `element ${element.number} needs a description`);
  }
  const numbers = BLUEPRINT.elements.map((e) => e.number);
  assert.equal(new Set(numbers).size, numbers.length, 'element numbers must be unique');
});

test('the August issue publishes the three sold editions', () => {
  const langs = editionLanguages('2026.08');
  assert.deepEqual(langs, ['en', 'fr', 'ru']);
});

test('an edition contains only published posts in its own language', () => {
  for (const lang of ['en', 'fr', 'ru']) {
    const posts = loadEdition('2026.08', lang);
    assert.ok(posts.length > 0, `${lang} edition must not be empty`);
    for (const post of posts) {
      assert.equal(post.language, lang, `${post.slug} leaked into the ${lang} edition`);
      assert.ok(!post.draft, `${post.slug} is a draft and must not be printed`);
    }
    const slugs = posts.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length, `${lang} edition repeats an article`);
  }
});

const blueprintTitle = (lang) => {
  const file = path.join(ROOT, `content/blueprint.${lang}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).title : BLUEPRINT.title;
};

test('the rendered edition carries the blueprint and no draft placeholders', async () => {
  for (const lang of ['en', 'fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    assert.ok(html.includes(blueprintTitle(lang)), `${lang} edition is missing the blueprint`);
    assert.ok(html.includes('id="blueprint"') === false, 'no anchor ids are needed in print');
    assert.ok(!/RESPONSE PENDING|NOT FOR RELEASE|SETTING TO CONFIRM/.test(html),
      `${lang} edition leaks an editorial placeholder`);

    const posts = loadEdition('2026.08', lang);
    for (const post of posts) {
      assert.ok(html.includes(escapeHtml(post.title)), `${lang} edition is missing "${post.title}"`);
    }
  }
});

test('every edition is self-contained, with no cross-language article text', async () => {
  for (const lang of ['fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    for (const other of ['en', 'fr', 'ru']) {
      if (other === lang) continue;
      for (const post of loadEdition('2026.08', other)) {
        assert.ok(!html.includes(post.title),
          `the ${lang} edition contains ${other} article "${post.title}"`);
      }
    }
  }
});

test('front matter is localized, so no edition prints an English blueprint', async () => {
  const english = await buildHtml('2026.08', 'en');
  for (const lang of ['fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    assert.ok(!html.includes(BLUEPRINT.title), `the ${lang} edition still prints the English blueprint title`);
    assert.ok(!html.includes(BLUEPRINT.elements[0].description),
      `the ${lang} edition still prints an English blueprint element`);
    assert.notEqual(html, english);
  }
});

test('no edition prints emoji, which would render as empty boxes', async () => {
  // No emoji font is installed in the print browser, so an emoji reaches the page as
  // tofu. The blueprint copy is emoji-rich, so this guards the strip at assembly time.
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu;
  // The tick and cross are dingbats, not emoji: DejaVu Sans carries them and the
  // "instead of / try this" cards use them as the right/wrong marks.
  const TYPOGRAPHIC_MARKS = /[\u2713\u2717]/g;
  for (const lang of ['en', 'fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    const body = html.slice(html.indexOf('</head>')).replace(TYPOGRAPHIC_MARKS, '');
    assert.ok(!EMOJI.test(body), `the ${lang} edition still prints an emoji`);
  }
});

test('front matter uses the localized issue title, not the English newsstand one', async () => {
  const readTitle = (lang) =>
    JSON.parse(fs.readFileSync(path.join(ROOT, `js/i18n/${lang}.json`), 'utf8')).blog.issue_august_title;
  const englishTitle = readTitle('en');
  for (const lang of ['fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    const localized = readTitle(lang);
    assert.ok(localized && localized !== englishTitle, `${lang} needs its own August title`);
    // The title lands in <title> and in the front matter, both HTML-escaped (e.g. "&#39;").
    const decoded = html
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    assert.ok(decoded.includes(localized), `the ${lang} edition should print "${localized}"`);
    assert.ok(!decoded.includes(englishTitle), `the ${lang} edition still prints the English issue title`);
  }
});

test('quiz options print as a list instead of being hidden as interactive chrome', async () => {
  const html = await buildHtml('2026.08', 'en');
  assert.ok(/\.quiz-option-btn\s*\{[^}]*display:\s*list-item/.test(html),
    'quiz options are study content and must survive print');
  const hidden = /([^{}]+)\{[^}]*display:\s*none[^}]*\}/g;
  for (const [, selectors] of html.matchAll(hidden)) {
    assert.ok(!/(^|,)\s*button\b/.test(selectors),
      `print CSS must not hide every <button>: ${selectors.trim()}`);
  }
});

test('the body is grouped into zone opener pages, in print order', async () => {
  const html = await buildHtml('2026.08', 'en');
  const openers = [...html.matchAll(/zone-open-name">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(openers, ['Front of Book', 'The Well'],
    'August has no back-of-book piece, so it must not print an empty Back of Book opener');
  const contents = [...html.matchAll(/toc-zone-name">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(contents, openers, 'the contents page must group in the same order as the body');
});

test('the contents page never invents page numbers', async () => {
  // Chromium cannot predict where a column grid breaks across printed pages, so a page
  // number written at assembly time would be a guess. Assembly therefore prints word
  // counts, and `buildPdf` reads the real numbers back out of the printed pages and
  // only keeps them when the second print has the same page count.
  const html = await buildHtml('2026.08', 'en');
  assert.ok(!/class="toc-pages">\d+</.test(html), 'contents entries must not carry fabricated page numbers');
  assert.ok(/class="toc-pages">[\d,]+ words</.test(html), 'contents entries carry word counts instead');
  assert.ok(!/class="folio"/.test(html), 'page numbers come from the printed pages, not an in-flow folio');
  const source = fs.readFileSync(path.join(ROOT, 'scripts/ops/build-issue-pdf.js'), 'utf8');
  assert.ok(/locateArticles\(/.test(source), 'the build must read the real page numbers back from the PDF');
  assert.ok(/applyContentsPages\(/.test(source), 'the measured numbers are written into the contents page');
  assert.ok(/countPdfPages\(numbered\) === before/.test(source),
    'the numbered contents page is only kept when pagination did not move');
  assert.ok(/drawFolios\(/.test(source), 'every printed page carries its own folio');
});

test('body copy never prints a bare volume year', async () => {
  // Post bodies carry their own volume strings ("Vol. 2026 — Master Editorial Hub"). Printing
  // them unchanged would name a different volume on every edition of the same year.
  for (const lang of ['en', 'fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    assert.ok(!/\bVol\.\s*\d{4}(?!\.\d)/.test(html),
      `the ${lang} edition prints a volume without its month`);
  }
});

test('articles run on, while the contents page and openers start a fresh page', async () => {
  const html = await buildHtml('2026.08', 'en');
  assert.ok(/\.article\s*\{[^}]*break-before:\s*auto/.test(html),
    'an article must not force a page break, or a short piece leaves three-quarters of a sheet blank');
  assert.ok(/\.page:not\(\.article\)\s*\{[^}]*break-before:\s*page/.test(html),
    'zone openers and the contents page still open on a new page');
  assert.ok(/\.page\.back-matter\s*\{[^}]*break-before:\s*auto/.test(html),
    'the appendix runs on into the sheet the last article leaves empty');
});

test('the appendix prints every element once, in order', async () => {
  const html = await buildHtml('2026.08', 'en');
  const sections = html.match(/<section class="page back-matter"[^>]*>/g) || [];
  assert.equal(sections.length, 1, 'one flowing appendix, not hand-split pages');
  const numbers = [...html.matchAll(/class="bp-num">(\d+)/g)].map((m) => Number(m[1]));
  assert.deepEqual(numbers, BLUEPRINT.elements.map((e) => Number(e.number)),
    'the appendix must print every element once, in order');
  assert.equal((html.match(/class="bp-intro"/g) || []).length, 1, 'the lede is printed once');
});

test('the running foot names the desk, in the edition language', () => {
  const posts = loadEdition('2026.08', 'ru');
  const located = {};
  posts.forEach((post, index) => { located[post.slug] = 4 + index * 3; });
  located.__backmatter__ = 4 + posts.length * 3;
  const sparse = new Array(80).fill(false);
  const pageCount = 4 + posts.length * 3 + 2;
  const desks = runningDesks('2026.08', 'ru', posts, located, sparse, pageCount);
  const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'js/i18n/ru.json'), 'utf8'));
  const first = dict.section[posts[0].section] || posts[0].section;
  assert.equal(desks.get(4), first, 'the article start page carries its desk');
  assert.equal(desks.get(6), first, 'so does the continuation page, which has no mast of its own');
  assert.ok(/[^\x00-\x7F]/.test(first), 'Russian desks must print in Cyrillic, not the raw id');
  assert.equal(desks.get(pageCount), dict.catalog.blueprint_label, 'the appendix owns the tail');
  assert.equal(desks.get(1), undefined, 'the cover carries no running foot');
  const withOpener = runningDesks('2026.08', 'ru', posts, located, sparse.map((_, i) => i === 4), pageCount);
  assert.equal(withOpener.get(6), undefined, 'a near-empty zone opener names its own zone and gets no desk');
});

test('long reads get the long-read treatment and everything else does not', async () => {
  const html = await buildHtml('2026.08', 'en');
  const longReadSections = html.match(/<section class="page article long-read">/g) || [];
  assert.equal(longReadSections.length, 1, 'August has exactly one 2,500+ word piece');
  assert.ok(/\.long-read \.article-body\s*\{[^}]*column-count:\s*2/.test(html),
    'long reads print in two columns');
});

test('drop caps and pull quotes are styled, not just emitted', async () => {
  const html = await buildHtml('2026.08', 'en');
  assert.ok(html.includes('gazette-drop-cap'), 'the renderer emits drop caps');
  assert.ok(/\.gazette-drop-cap::first-letter\s*\{/.test(html), 'the drop cap has a real rule');
  assert.ok(html.includes('gazette-pullquote'), 'the renderer emits pull quotes');
  assert.ok(/\.gazette-pullquote\s*\{/.test(html), 'the pull quote has a real rule');
  assert.ok(!/\.pullquote\s*\{/.test(html), 'no dead CSS for a class nothing emits');
});

test('zone and section names are localized, so no edition prints an English desk', async () => {
  for (const lang of ['fr', 'ru']) {
    const html = await buildHtml('2026.08', lang);
    const dict = JSON.parse(fs.readFileSync(path.join(ROOT, `js/i18n/${lang}.json`), 'utf8'));
    const words = dict.catalog.words_unit;
    assert.ok(words && words !== 'words', `${lang} needs its own word unit`);
    assert.ok(html.includes(words), `${lang} edition should print "${words}"`);
    assert.ok(!/class="toc-sec">words desk</.test(html), `the ${lang} edition still prints the raw "words desk" id`);
    assert.ok(!/class="toc-zone-name">The Well</.test(html), `the ${lang} edition still prints "The Well" in English`);
    for (const [id, name] of Object.entries(dict.section)) {
      if (name === id) continue;
      assert.ok(!new RegExp(`class="toc-sec">${id.replace(/_/g, ' ')}<`).test(html),
        `the ${lang} edition printed the raw "${id}" id instead of "${name}"`);
    }
  }
});

