#!/usr/bin/env node
/**
 * Builds a print-ready PDF for one issue edition (volume + language) from the same
 * JSON sources the site renders from:
 *
 *   content/blueprint.json            front matter: the 19-part anatomy
 *   content/issues/<volume>/posts/*   the published articles for that language
 *
 * One PDF per language, because the editions are sold separately.
 *
 * Usage:
 *   node scripts/ops/build-issue-pdf.js --volume 2026.08 --lang en [--out <file>]
 *   node scripts/ops/build-issue-pdf.js --volume 2026.08 --lang en --all-langs
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const { renderBlockToHtml } = require('../build/lib/blocks.js');
const { escapeHtml } = require('../build/lib/text.js');
const { issueMetaFor } = require('../build/lib/issues.js');
const pacing = require('../../js/pacing.js');

const ROOT = path.resolve(__dirname, '..', '..');
const BLUEPRINT_FILE = path.join(ROOT, 'content', 'blueprint.json');
const ISSUES_DIR = path.join(ROOT, 'content', 'issues');

const LANG_NAMES = {
  en: 'English', fr: 'French', ru: 'Russian', it: 'Italian', el: 'Greek',
  de: 'German', es: 'Spanish', pt: 'Portuguese', hy: 'Armenian', ka: 'Georgian',
  tt: 'Tatar', ba: 'Bashkir', br: 'Breton', cv: 'Chuvash'
};

// The editions that are actually sold. Other languages exist as article
// translations, but they are not printed or sold as their own edition.
const SOLD_EDITIONS = ['en', 'fr', 'ru'];

// Section order for the printed edition. Mirrors the 19-part blueprint: the
// founder opens, the desks follow, the reflective columns close. Unknown
// sections sort last rather than being dropped, so new desks still reach the PDF.
const SECTION_ORDER = [
  'founder_dispatch', 'founder_interview', 'in_conversation', 'debatable_relatable',
  'student_teacher_spotlight', 'mind_matters', 'words_desk', 'if_you_were',
  'grammar', 'grammar_made_cosy', 'science', 'science_expander',
  'wonder_contest_showcase', 'life_with_without', 'wonder', 'essay',
  'philosophy', 'culture', 'cultural_salon', 'culinary_salon', 'recipes',
  'fiction', 'poetry', 'greatest_quotes', 'quiz', 'crossword'
];

function parseArgs(argv) {
  const options = { volume: '', lang: '', out: '', allLangs: false, keepHtml: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--volume') options.volume = argv[++i];
    else if (arg === '--lang') options.lang = argv[++i];
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--all-langs') options.allLangs = true;
    else if (arg === '--keep-html') options.keepHtml = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^\d{4}\.\d{2}$/.test(options.volume)) {
    throw new Error('Usage: --volume YYYY.MM (e.g. 2026.08)');
  }
  if (!options.allLangs && !options.lang) {
    throw new Error('Pass --lang <code> or --all-langs');
  }
  return options;
}

function issueVolume(number) {
  return `Vol. ${number}`;
}

function i18nDict(lang) {
  const file = path.join(ROOT, 'js', 'i18n', `${lang}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

/** Canonical issue title, taken from the generated newsstand feed. */
function issueTitle(volume) {
  const file = path.join(ROOT, 'index.json');
  if (!fs.existsSync(file)) return '';
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  const issue = (index.issues || []).find((entry) => entry.number === issueVolume(volume));
  return issue ? String(issue.title || '') : '';
}

/**
 * `index.json` only carries the English issue title, so a French or Russian PDF
 * would print English front matter. Prefer the localized dictionary entry.
 */
function localizedIssueTitle(volume, lang) {
  const m = String(volume).match(/(\d{4})\.(\d{2})/);
  if (m) {
    const month = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1))
      .toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
    const localized = ((i18nDict(lang).blog || {})[`issue_${month}_title`] || '').trim();
    if (localized) return localized;
  }
  return issueTitle(volume);
}

// Volumes are keyed "2026.08" but the content directories are "2026-08".
function issueDir(volume) {
  return path.join(ISSUES_DIR, volume.replace('.', '-'));
}

/**
 * "Vol. 2026.08 · English Edition" and its localized equivalents. The old build
 * hardcoded "Edition", so every French and Russian PDF printed an English label in
 * the running head, the zone openers, the article meta line and the cover foot.
 */
function editionLabel(volume, lang) {
  const catalog = i18nDict(lang).catalog || {};
  const volumeLabel = catalog.volume_label || 'Vol.';
  const edition = catalog.edition || `${LANG_NAMES[lang] || lang.toUpperCase()} Edition`;
  return `${volumeLabel} ${volume} · ${edition}`;
}

/** Published posts for one issue + language, in print order. */
function loadEdition(volume, lang) {
  const dir = path.join(issueDir(volume), 'posts');
  if (!fs.existsSync(dir)) throw new Error(`No posts directory for ${volume}: ${dir}`);

  const posts = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))
    .filter((post) => !post.draft && post.language === lang);

  // An issue can author its own running order with `printOrder` on each post. Departments
  // then sit where the editor put them — an opener immediately before the piece it opens —
  // instead of being boxed into the three acts. The number is copied to every language
  // edition, so the same department lands in the same place in each.
  if (posts.some((post) => Number.isFinite(post.printOrder))) {
    return posts.sort((a, b) => (a.printOrder ?? Number.MAX_SAFE_INTEGER) - (b.printOrder ?? Number.MAX_SAFE_INTEGER)
      || String(a.title).localeCompare(String(b.title)));
  }

  const rank = (section) => {
    const index = SECTION_ORDER.indexOf(String(section || ''));
    return index === -1 ? SECTION_ORDER.length : index;
  };
  return posts.sort((a, b) => rank(a.section) - rank(b.section)
    || String(a.title).localeCompare(String(b.title)));
}

/** Sold editions that have at least one published post for the issue. */
function editionLanguages(volume) {
  const dir = path.join(issueDir(volume), 'posts');
  if (!fs.existsSync(dir)) return [];
  const available = new Set();
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const post = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    if (!post.draft) available.add(post.language);
  }
  return SOLD_EDITIONS.filter((lang) => available.has(lang));
}

// The sold PDFs should use the magazine's own type, not a system fallback. Fraunces
// only covers Latin, so every stack ends in a Cyrillic/Greek-capable face and
// Chromium falls back per glyph for the Russian and Greek editions.
// These are variable fonts. A "100 900" range makes Chromium's PDF writer pick the
// thinnest instance, so each face is registered at the weights the print CSS uses.
const FONT_WEIGHTS = [400, 600, 700, 900];
const FONT_FACES = [
  { family: 'Fraunces', files: ['fraunces-latin-soft-normal.woff2', 'fraunces-latin-ext-soft-normal.woff2'] },
  { family: 'Literata', files: [
    'literata-latin-wght-normal.woff2',
    'literata-cyrillic-wght-normal.woff2',
    'literata-greek-wght-normal.woff2'
  ] },
  { family: 'Commissioner', files: [
    'commissioner-latin-wght-normal.woff2',
    'commissioner-latin-ext-wght-normal.woff2',
    'commissioner-cyrillic-wght-normal.woff2',
    'commissioner-cyrillic-ext-wght-normal.woff2',
    'commissioner-greek-wght-normal.woff2'
  ] }
];

// Fraunces has no Cyrillic or Greek, so a Russian edition would mix two serifs in
// the same paragraph. Those editions use Literata, which covers all three scripts.
const LATIN_SERIF_STACK = "Fraunces, 'DejaVu Serif', Georgia, 'Times New Roman', serif";
const MULTISCRIPT_SERIF_STACK = "Literata, 'DejaVu Serif', Georgia, 'Times New Roman', serif";
const MULTISCRIPT_LANGS = new Set(['ru', 'el', 'uk', 'bg', 'sr']);

function fontFaceCss() {
  const rules = [];
  for (const { family, files } of FONT_FACES) {
    for (const file of files) {
      const filePath = path.join(ROOT, 'fonts', file);
      if (!fs.existsSync(filePath)) continue;
      const base64 = fs.readFileSync(filePath).toString('base64');
      for (const weight of FONT_WEIGHTS) {
        rules.push(`@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight};`
          + ` font-display: block; src: url(data:font/woff2;base64,${base64}) format('woff2'); }`);
      }
    }
  }
  return rules.join('\n');
}

const SANS_STACK = "Commissioner, 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif";

function printCss(lang) {
  const serif = MULTISCRIPT_LANGS.has(lang) ? MULTISCRIPT_SERIF_STACK : LATIN_SERIF_STACK;
  return PRINT_CSS.replaceAll('__SERIF__', serif).replaceAll('__SANS__', SANS_STACK);
}

const PRINT_CSS = `
@page { size: A4; margin: 16mm 18mm 18mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: __SERIF__;
  font-size: 9.5pt; line-height: 1.43; color: #1E1A17;
  background: #fff;
}

/* Reader-only chrome. Everything below is an affordance of the website (buttons,
   flip navigation, audio players, screen-reader captions, "continue on page N" hints
   and the web verb map) and has no meaning on paper. Quiz options are study content,
   so they are restyled as a list instead of hidden. */
.fulllist-btn, .flip-nav, .dog-ear, .podcast-box, .podcast-embed, audio,
.print-running-header, .page-break-hint, .verb-map-container, .sr-only,
.quiz-mark, .quiz-explanation { display: none !important; }

/* The fixed width is the printed text measure (A4 minus the page margins). It keeps
   on-screen measurement identical to the printed layout, which is what lets the
   contents page carry real page numbers. */
.page { width: 174mm; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
/* Articles run on: a piece that ends mid-page hands the rest of the page to the next one,
   instead of leaving three-quarters of a sheet blank. */
.page.article { break-after: auto; page-break-after: auto; }
.page.article + .page.article { margin-top: 10mm; }
.article-head { break-inside: avoid; break-after: avoid; }

/* ---- Running heads and folios ---- */
.mast, .folio {
  display: flex; justify-content: space-between; align-items: baseline; gap: 6mm;
  font-family: __SANS__;
  font-size: 6.8pt; letter-spacing: .14em; text-transform: uppercase;
  color: #8A7A6D;
}
.mast { border-bottom: .6pt solid #D9CFC4; padding-bottom: 2.2mm; margin-bottom: 7mm; }
.mast > span:last-child { text-align: right; }
.folio { border-top: .6pt solid #D9CFC4; padding-top: 2.2mm; margin-top: 6mm; }

/* ---- Base type ---- */
.kicker {
  font-family: __SANS__;
  font-size: 7.2pt; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: #A2532F; margin: 0 0 2.4mm;
}
h1 { font-size: 30pt; line-height: 1.04; margin: 0 0 5mm; font-weight: 400; letter-spacing: -.012em; }
h2 { font-size: 15pt; line-height: 1.18; margin: 0 0 3.4mm; font-weight: 400; }
h3 { font-size: 10.6pt; margin: 5mm 0 2mm; color: #0F6E56; }
h4 { font-size: 9.6pt; margin: 4mm 0 1.5mm; }
h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
p { margin: 0 0 3.1mm; orphans: 3; widows: 3; }
em { font-style: italic; }
strong { font-weight: 700; }
a { color: inherit; text-decoration: none; }
ul, ol { margin: 0 0 3.1mm; padding-left: 5.5mm; }
li { margin-bottom: 1.3mm; }
hr { border: 0; border-top: .6pt solid #D9CFC4; margin: 5mm 0; }
code { font-family: 'SF Mono', Menlo, monospace; font-size: 8.4pt; background: #F4EFE8; padding: .3mm 1mm; }
img, svg { max-width: 100%; height: auto; }
figure { margin: 5mm 0; }
figcaption { font-family: __SANS__; font-size: 7pt; color: #8A7A6D; margin-top: 1.6mm; }

/* Printed highlights carry meaning (the corrected form in a before/after pair), so
   they stay — but as a warm tint rather than a web highlighter. */
mark { background: #F3E3CC; color: inherit; padding: 0 .08em; }

/* ---- Tables: always full measure, never squeezed into a column ---- */
.table-responsive-container { margin: 4mm 0; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; line-height: 1.34; }
thead { display: table-header-group; }
tr { break-inside: avoid; page-break-inside: avoid; }
th, td { border: .5pt solid #D9CFC4; padding: 1.5mm 1.8mm; text-align: left; vertical-align: top; }
th { background: #F4EFE8; font-family: __SANS__; font-size: 7.2pt; letter-spacing: .02em; }
td { hyphens: auto; overflow-wrap: break-word; }
caption { caption-side: top; text-align: left; font-family: __SANS__; font-size: 7pt; color: #8A7A6D; padding-bottom: 1.4mm; }
.fulllist-bar {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: __SANS__; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase;
  color: #A2532F; border-bottom: .9pt solid #1E1A17; padding-bottom: 1.4mm; margin-bottom: 2mm;
}

/* ---- Contents ---- */
.contents-page { display: flex; flex-direction: column; min-height: 261mm; }
.contents-title { font-size: 26pt; margin: 0 0 4mm; }
.contents-intro { font-size: 10.2pt; line-height: 1.5; color: #4A3E35; margin: 0 0 7mm; max-width: 152mm; }
.toc-zone { margin-bottom: 8mm; break-inside: avoid; }
.toc-zone-note { font-size: 9.2pt; font-style: italic; color: #6B5B4E; margin: 1.6mm 0 0; }
.toc-zone-head {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: __SANS__; font-size: 7.4pt; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; color: #A2532F;
  border-bottom: .9pt solid #1E1A17; padding-bottom: 1.4mm; margin-bottom: 1.2mm;
}
.toc-zone-pages { color: #8A7A6D; font-weight: 400; }
.toc-item { display: flex; gap: 4mm; align-items: baseline; padding: 2.2mm 0; border-bottom: .5pt dotted #D9CFC4; }
.toc-sec {
  font-family: __SANS__; font-size: 6.6pt; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #0F6E56;
  width: 34mm; flex-shrink: 0;
}
.toc-title { flex: 1; font-size: 9.6pt; }
.toc-pages {
  font-family: __SANS__; font-size: 7.6pt; color: #1E1A17; text-align: right;
  width: 16mm; flex-shrink: 0;
}
.colophon {
  margin-top: auto; border-top: .6pt solid #D9CFC4; padding-top: 3mm;
  font-family: __SANS__; font-size: 6.6pt; line-height: 1.6;
  letter-spacing: .04em; color: #8A7A6D;
}

/* ---- Zone openers: a full page that is mostly air ---- */
.zone-opener { display: flex; flex-direction: column; height: 261mm; }
.zone-open-body {
  display: flex; flex: 1; flex-direction: column; justify-content: center;
  text-align: center; padding: 0 10mm;
}
.zone-open-name { font-size: 34pt; line-height: 1.06; font-weight: 400; margin: 0 0 4mm; }
.zone-open-note { font-size: 11.5pt; font-style: italic; color: #4A3E35; margin: 0 0 7mm; }
.zone-open-count {
  font-family: __SANS__; font-size: 7.2pt; letter-spacing: .16em;
  text-transform: uppercase; color: #8A7A6D;
}

/* ---- Articles: a two-column magazine grid ---- */
/* Zone openers, the contents page and the appendix open on a fresh page; articles run on. */
.article { break-before: auto; }
.article.print-new-page { break-before: page; page-break-before: always; }
.page:not(.article) { break-before: page; }
/* The appendix runs on too: the sheet the last article leaves half empty is the only
   place a two-column list of 19 entries can start without wasting paper. */
.page.back-matter { break-before: auto; page-break-before: auto; }
.article-head { border-bottom: 1.6pt solid #1E1A17; padding-bottom: 3.2mm; margin-bottom: 5mm;
  break-after: avoid; break-inside: avoid; }
.article-meta {
  font-family: __SANS__; font-size: 6.8pt; letter-spacing: .12em;
  text-transform: uppercase; color: #8A7A6D; margin-top: 2mm;
}
.dek { font-size: 11.4pt; line-height: 1.42; color: #4A3E35; font-style: italic; margin: 0 0 4mm; }
.editorial-heading { color: #0F6E56; }
.article-body { column-count: 2; column-gap: 7mm; text-align: justify; hyphens: auto; }
.article-body > * { break-inside: auto; }
.long-read .article-body { column-count: 2; }
/* A subhead at the foot of a column that continues in the next one reads as a mistake. */
.article-body h2, .article-body h3, .article-body h4 { break-after: avoid; }
.article-body > h2 { column-span: all; margin-top: 5mm; }
.article-body li { break-inside: avoid; }

/* A table that flows from the bottom of the left column to the top of the right one reads
   out of order, so any block carrying a table spans the gutter whatever its wrapper. */
.article-body > .print-wide,
.article-body > .list-section { column-span: all; }

/* Wide furniture spans the gutter; prose keeps its two-column measure. */
.article-body > .gazette-pullquote,
.article-body > blockquote.gazette-pullquote,
.article-body > .table-responsive-container,
.article-body > .gazette-figure,
.article-body > .gazette-quiz-card,
.article-body > .mc,
.article-body > .vcard,
.article-body > .instead-try-spread,
.article-body > .cosy-fig,
.article-body > .fulllist-bar,
.article-body > .ba,
.article-body > .flow,
.article-body > .flow3,
.article-body > .cards-grid,
.article-body > .chains-grid,
.article-body > .warning-callout { column-span: all; }

/* ---- Drop cap ---- */
.gazette-drop-cap::first-letter {
  float: left;
  font-size: 3.15em;
  line-height: .82;
  padding: .07em .1em 0 0;
  font-weight: 700;
  color: #A2532F;
}
.gazette-drop-cap::first-line { font-variant: small-caps; letter-spacing: .02em; }

/* ---- Pull quotes ---- */
.gazette-pullquote, blockquote.gazette-pullquote {
  border: 0;
  border-top: .9pt solid #1E1A17;
  border-bottom: .9pt solid #1E1A17;
  margin: 7mm 0;
  padding: 4.5mm 0;
  font-size: 16pt;
  line-height: 1.28;
  font-style: italic;
  color: #1E1A17;
  text-align: center;
  break-inside: avoid;
}
.gazette-pullquote p { margin: 0; }
.gazette-pullquote cite {
  display: block;
  margin-top: 2.6mm;
  font-family: __SANS__;
  font-size: 6.8pt;
  font-style: normal;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #8A7A6D;
}

/* ---- Example boxes, marginalia ---- */
.gazette-example-box, .gazette-marginalia, .example, .culture-bite {
  border: .5pt solid #D9CFC4; background: #FAF7F2;
  padding: 2.8mm 3.2mm; margin: 3.4mm 0;
  font-size: 8.8pt; break-inside: avoid;
}
.example-target { display: block; font-weight: 700; font-size: 10pt; margin-bottom: 1mm; }
.example-gloss { margin: 0 0 1.2mm; }
.example-context { margin: 0; font-size: 8pt; color: #6B5B4E; font-style: italic; }
.gazette-marginalia-title {
  font-family: __SANS__; font-size: 7pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #A2532F; margin-bottom: 1.4mm;
}
.marginalia-body { margin: 0; }

/* ---- Editorial blueprint (back matter) ---- */
.bp-intro { font-size: 9.6pt; line-height: 1.45; color: #4A3E35; margin: 0 0 5mm; max-width: 168mm; }
.bp-list { column-count: 3; column-gap: 6mm; }
.bp-item { break-inside: avoid; margin: 0 0 2.2mm; }
.bp-num {
  font-family: __SANS__; font-size: 6.4pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #A2532F;
}
.bp-title { font-size: 9.6pt; font-weight: 700; margin: .4mm 0 .5mm; }
.bp-desc { font-size: 7.7pt; line-height: 1.3; color: #4A3E35; margin: 0; }

/* ---- Lexicon cards (the A0-A1 vocabulary chains) ---- */
.lex-card {
  border-left: 1.6pt solid #0F6E56; padding: 1.4mm 0 1.4mm 2.6mm; margin: 2.2mm 0;
  break-inside: avoid; text-align: left;
}
.lex-theme {
  display: block; font-family: __SANS__; font-size: 6.4pt; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase; color: #8A7A6D; margin-bottom: .8mm;
}
.lex-pair {
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: flex-start;
  gap: 0 1.4mm; line-height: 1.35; text-align: left;
  /* The source sets 1.1rem inline on these pairs; the print measure is narrower. */
  font-size: 9.2pt !important;
}
.lex-pair span { font-size: inherit !important; }
.lex-arrow { color: #A2532F !important; font-size: 8pt; }
.lex-ex { font-size: 8pt; font-style: italic; color: #6B5B4E; margin-top: .8mm; text-align: left; }

/* ---- The source's "14 Official Languages Edition" banner, as a boxed opener ---- */
.august-issue-banner {
  column-span: all; display: flex; gap: 5mm; align-items: baseline;
  border-top: .9pt solid #1E1A17; border-bottom: .5pt solid #D9CFC4;
  padding: 2.4mm 0 2.6mm; margin: 0 0 4.5mm;
}
.august-banner-badge {
  flex: 0 0 52mm; font-family: __SANS__; font-size: 6.2pt; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase; color: #A2532F;
}
.august-banner-content { flex: 1; }
.august-banner-content h4 { font-family: __SERIF__; font-size: 9.8pt; font-weight: 500; margin: 0 0 .9mm; }
.august-banner-content p { margin: 0; font-size: 8.4pt; line-height: 1.45; }

/* A subhead that follows a full-width table needs air above it, or it reads as a caption. */
.article-body .print-wide + h2, .article-body .print-wide + h3,
.article-body table + h2, .article-body table + h3 { margin-top: 5mm; }

/* ---- Quiz: printed as a lettered list, answers never shown ---- */
.gazette-quiz-card { border: .6pt solid #D9CFC4; padding: 3.2mm 3.4mm; margin: 4mm 0; break-inside: avoid; }
.quiz-question {
  font-size: 9.6pt; margin: 0 0 2mm; color: #1E1A17;
  display: flex; gap: 2mm; align-items: baseline;
}
.quiz-question::before {
  content: ""; width: 2.2mm; height: 2.2mm; flex-shrink: 0;
  background: #A2532F; display: inline-block; transform: translateY(-.4mm);
}
/* Chromium draws no ::marker on a <button>, so the letters come from a counter with a
   hanging indent: the answer text wraps under itself, not under the letter. */
.quiz-options-list { counter-reset: quiz-option; margin: 0; padding: 0; }
.quiz-option-btn {
  display: list-item; list-style: none; counter-increment: quiz-option;
  text-align: left; border: 0; background: none;
  padding: 0 0 0 6mm; text-indent: -6mm;
  margin: 0 0 1.5mm; font: inherit; font-size: 9.2pt; line-height: 1.35;
}
.quiz-option-btn::before {
  content: counter(quiz-option, upper-alpha) ".";
  display: inline-block; width: 6mm; text-indent: 0;
  font-family: __SANS__; font-weight: 700; color: #A2532F;
}

/* ---- Saturday Mistakes card ---- */
.mc { border: .7pt solid #1E1A17; padding: 3.4mm 3.6mm; margin: 5mm 0; }
.mc-head { display: flex; gap: 3mm; align-items: baseline; margin-bottom: 2.6mm; }
.mc-num {
  font-family: __SANS__; font-size: 7pt; font-weight: 700; letter-spacing: .12em;
  color: #A2532F;
}
.mc-title { margin: 0; font-size: 11pt; color: #1E1A17; }
.mc-compare { display: flex; gap: 3mm; margin-bottom: 2.6mm; break-inside: avoid; }
.mc-side { flex: 1; border-top: 1.4pt solid; padding-top: 1.6mm; }
.mc-wrong { border-color: #A2532F; }
.mc-right { border-color: #0F6E56; }
.mc-label {
  display: block; font-family: __SANS__; font-size: 6.6pt; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; margin-bottom: 1mm;
}
.mc-wrong .mc-label { color: #A2532F; }
.mc-right .mc-label { color: #0F6E56; }
.mc-sentence { margin: 0; font-size: 9.4pt; }
.mc-why, .mc-rule { font-size: 8.8pt; margin: 0 0 1.6mm; }
.mc-more { font-size: 8.8pt; }
.mc-more-label {
  display: block; font-family: __SANS__; font-size: 6.6pt; letter-spacing: .12em;
  text-transform: uppercase; color: #8A7A6D; margin-bottom: .8mm;
}
.mc-more ul { margin: 0; padding-left: 4.5mm; }
.mc-turn { margin-top: 2.4mm; }
.mc-turn-label {
  display: block; font-family: __SANS__; font-size: 6.6pt; letter-spacing: .12em;
  text-transform: uppercase; color: #8A7A6D; margin-bottom: 1.2mm;
}

/* ---- Verb cards (top-10 synonym guides) ---- */
.vcard { border-top: 1.4pt solid #1E1A17; padding-top: 2.4mm; margin: 6mm 0; }
.vcard-head { display: flex; gap: 3mm; align-items: baseline; margin-bottom: 2.4mm; }
.vcard-num { font-family: __SANS__; font-size: 7pt; font-weight: 700; color: #A2532F; }
.vcard-title { margin: 0; font-size: 15pt; color: #1E1A17; }
.vcard-sub { margin: 0; font-size: 8.8pt; font-style: italic; color: #4A3E35; }
.vrows { list-style: none; margin: 0; padding: 0; }
.vrow {
  display: grid; grid-template-columns: 34mm 1fr; gap: 2mm 4mm;
  padding: 2mm 0; border-top: .4pt solid #E5DCD1; break-inside: avoid;
}
.vrow-meaning {
  font-family: __SANS__; font-size: 7pt; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: #6B5B4E; grid-row: span 2;
}
.vrow-verbs { display: flex; flex-wrap: wrap; gap: 1.4mm; }
.vtag {
  display: inline-block; font-family: __SANS__; font-size: 7.4pt; font-weight: 600;
  padding: .4mm 1.6mm; border: .4pt solid #D9CFC4; border-radius: 1mm; color: #1E1A17;
}
.vtag.is-work { border-color: #0F6E56; color: #0F6E56; }
.vtag.is-formal { border-color: #A2532F; color: #A2532F; }
.vtag.is-stretch { border-style: dashed; }
.vrow-ex { font-size: 8.8pt; }
.ex-from { color: #6B5B4E; }
.ex-arrow { color: #A2532F; margin: 0 1.4mm; }
.vrow-note { grid-column: 2; font-size: 8.2pt; color: #4A3E35; }

/* ---- Word chains / lexicon cards ---- */
.chains-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.4mm 5mm; margin: 4mm 0;
}
.cards-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.6mm 5mm; margin: 4mm 0;
}
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 4mm; }
.sec-head h2 { margin: 0 0 1.5mm; }
.cat-badge {
  font-family: __SANS__; font-size: 6.6pt; letter-spacing: .14em; text-transform: uppercase;
  color: #8A7A6D; white-space: nowrap;
}
.chain-card, .lex-card {
  border-top: .7pt solid #D9CFC4; padding-top: 1.8mm; break-inside: avoid;
}
.chain-head { display: flex; justify-content: space-between; gap: 2mm; font-family: __SANS__; font-size: 6.8pt; letter-spacing: .1em; text-transform: uppercase; color: #A2532F; }
.chain-badge { color: #8A7A6D; }
.chain-body { font-size: 9pt; margin-top: 1mm; }
.chain-rel { color: #A2532F; }

.lex-arrow { color: #A2532F; margin: 0 1mm; }

/* ---- Before / after, instead / try ---- */
.instead-try-spread, .ba { border: .6pt solid #D9CFC4; margin: 4.5mm 0; break-inside: avoid; }
.instead-try-headers { display: flex; }
.instead-try-header, .ba-label {
  flex: 1;
  font-family: __SANS__; font-size: 6.8pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #8A7A6D; padding: 2mm 3mm;
}
.instead-try-row, .ba-panel { display: flex; border-top: .4pt solid #D9CFC4; }
.instead-cell, .try-cell, .ba-before, .ba-after {
  flex: 1; padding: 2.2mm 3mm; font-size: 8.8pt;
}
.instead-cell, .ba-before { background: #FBF3EC; border-right: .4pt solid #D9CFC4; }
.try-cell, .ba-after { background: #F2F7F3; }
.instead-badge, .try-badge {
  display: block; font-family: __SANS__; font-size: 6.4pt; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; margin-bottom: 1mm;
}
.instead-badge { color: #A2532F; }
.try-badge { color: #0F6E56; }
.col-instead, .col-try { flex: 1; padding: 2mm 3mm; font-size: 8.8pt; }

/* ---- Scales, decision trees, plans, collocations ---- */
.scale-ends { display: flex; justify-content: space-between; font-family: __SANS__; font-size: 6.6pt; letter-spacing: .12em; text-transform: uppercase; color: #8A7A6D; margin: 3mm 0 1mm; }
.scale { list-style: none; margin: 0 0 4mm; padding: 0; }
.scale-step { display: flex; gap: 2.4mm; align-items: flex-start; padding: 1.4mm 0; border-top: .4pt solid #E5DCD1; break-inside: avoid; }
.scale-dot { width: 2.2mm; height: 2.2mm; border-radius: 50%; background: var(--scale-n, #A2532F); flex-shrink: 0; margin-top: 1.4mm; }
.scale-verb { font-weight: 700; }
.scale-desc { color: #4A3E35; }
.scale-ex { font-size: 8.4pt; font-style: italic; color: #6B5B4E; }
.dtree-q { font-family: __SANS__; font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #A2532F; margin: 3mm 0 1mm; }
.dtree { list-style: none; margin: 0 0 4mm; padding: 0; }
.dtree li { display: grid; grid-template-columns: 1fr 1.2fr; gap: 3mm; padding: 1.6mm 0; border-top: .4pt solid #E5DCD1; break-inside: avoid; font-size: 8.6pt; }
.dtree-if { color: #4A3E35; }
.dtree-then { display: flex; flex-wrap: wrap; gap: 1.2mm; align-items: center; }
.dtree-ex { grid-column: 1 / -1; font-size: 8.2pt; font-style: italic; color: #6B5B4E; }
.plan7 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 5mm; margin: 3mm 0; }
.plan-day { border-top: .5pt solid #D9CFC4; padding-top: 1.4mm; break-inside: avoid; font-size: 8.6pt; }
.plan-task { color: #4A3E35; }
.collo { display: flex; gap: 5mm; margin: 3mm 0 4mm; }
.collo-col { flex: 1; border-top: .9pt solid #1E1A17; padding-top: 1.6mm; break-inside: avoid; }
.collo-verb { font-weight: 700; font-size: 10pt; margin: 0 0 .8mm; }
.collo-hint { font-size: 8.2pt; color: #6B5B4E; margin: 0 0 1.2mm; }
.collo-chips { display: flex; flex-wrap: wrap; gap: 1.2mm; }
.chip { font-family: __SANS__; font-size: 7.4pt; border: .4pt solid #D9CFC4; padding: .3mm 1.4mm; border-radius: 1mm; }

/* ---- Figures and flows ---- */
.cosy-fig { margin: 5mm 0; break-inside: avoid; }
.cosy-fig-kicker { font-family: __SANS__; font-size: 6.6pt; letter-spacing: .14em; text-transform: uppercase; color: #A2532F; }
.cosy-fig-title { font-size: 11pt; font-weight: 700; margin: .6mm 0 1.2mm; }
.cosy-fig-cap { font-size: 8.4pt; color: #4A3E35; }
.flow, .flow3 { margin: 4mm 0; break-inside: avoid; }
.flow-step, .flow-row { display: flex; flex-wrap: wrap; gap: 1.6mm; align-items: center; padding: 1.4mm 0; border-top: .4pt solid #E5DCD1; font-size: 8.6pt; }
.flow-n { font-family: __SANS__; font-size: 6.6pt; font-weight: 700; color: #A2532F; }
.flow-title { font-weight: 700; }
.flow-arrow { color: #A2532F; }
.flow-step-bad { color: #8A3A22; }
.flow-step-good { color: #0F6E56; }
.warning-callout {
  border-left: 2.2pt solid #A2532F; background: #FAF7F2;
  padding: 2.2mm 3mm; margin: 3.4mm 0; font-size: 8.6pt; break-inside: avoid;
}
/* Source copy wraps example sentences in <mark class="example-chip"> inside running
   text and inside table cells. They must stay inline; as blocks they collapse the cell
   box and the sentence prints on top of itself. */
.example-chip, mark.hl-handwritten { display: inline; background: #F3E3CC; border: 0; padding: 0 .12em; }
.bad { color: #8A3A22; }
.good { color: #0F6E56; }
.weak { color: #6B5B4E; }

/* ---- Quote wall ---- */
.format-quote-wall { margin: 4mm 0; }
.quote-tile { border-top: .5pt solid #D9CFC4; padding: 2mm 0; break-inside: avoid; }
.quote-tile-text { font-style: italic; font-size: 9.2pt; margin: 0 0 1mm; }
.quote-tile-author { font-family: __SANS__; font-size: 6.6pt; letter-spacing: .12em; text-transform: uppercase; color: #8A7A6D; }

/* ---- Crossword: the grid is drawn from the letters, so it prints without JS ---- */
.crossword { column-span: all; margin: 0; max-width: 100%; }
.crossword-title {
  font-family: __SANS__; font-size: 7.4pt; font-weight: 700; letter-spacing: .16em;
  text-transform: uppercase; color: #A2532F; margin: 0 0 3mm;
}
.crossword-board { break-inside: avoid; }
.crossword-grid {
  break-inside: avoid;
  display: grid; grid-template-columns: repeat(var(--cw-cols, 13), minmax(0, 1fr));
  box-sizing: border-box; margin: 0 auto 6mm;
  width: min(140mm, calc(var(--cw-max-h, 122mm) * var(--cw-cols, 15) / var(--cw-rows, 15)));
}
.cw-cell {
  position: relative; aspect-ratio: 1 / 1; min-width: 0; display: flex;
  align-items: center; justify-content: center;
  border: .5pt solid #6B5B4E; font-size: 9.6pt; font-weight: 600; color: #1E1A17;
}
.cw-block { background: #1E1A17; border-color: #1E1A17; }
.cw-blank { border: 0; background: transparent; }
.cw-num { position: absolute; top: .3mm; left: .7mm; font-family: __SANS__; font-size: 5.2pt; color: #6B5B4E; }
.crossword-clues { column-count: 2; column-gap: 8mm; }
.crossword-clue-col { break-inside: avoid; }
.crossword-clue-head {
  font-family: __SANS__; font-size: 6.4pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #8A7A6D; margin: 0 0 1.4mm;
}
.crossword-clue-list { list-style: none; margin: 0 0 3mm; padding: 0; }
.crossword-clue-list li { font-size: 8.2pt; line-height: 1.34; margin: 0 0 1mm; }
.cw-clue-num { font-weight: 700; margin-right: .6mm; }
.crossword-answers { break-inside: avoid; border-top: .5pt solid #D9CFC4; padding-top: 2mm; margin-top: 2mm; }
.crossword-answers-title {
  font-family: __SANS__; font-size: 6.2pt; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; color: #8A7A6D; margin: 0 0 1mm;
}
.crossword-answers-body { font-size: 7.8pt; line-height: 1.55; color: #3A322C; margin: 0; letter-spacing: .01em; }

/* ---- Figures from blocks.js ---- */
.gazette-figure { margin: 5mm 0; }
.gazette-figure-img { display: block; width: 100%; }
.gazette-figure-caption { font-family: __SANS__; font-size: 7pt; color: #8A7A6D; margin-top: 1.6mm; }
.gazette-pronunciation-card { border: .5pt solid #D9CFC4; padding: 2.4mm 3mm; margin: 3mm 0; break-inside: avoid; }
.pronunciation-word { font-weight: 700; }
.pronunciation-ipa { font-family: __SANS__; color: #6B5B4E; margin-left: 2mm; }
.editorial-list { padding-left: 5.5mm; }
`;

async function renderIssueCover(volume, lang, title) {
  const { renderIssueCover: render } = await import(
    pathToFileURL(path.join(ROOT, 'js', 'art', 'vogue-cover.js')).href
  );
  const meta = issueMetaFor(issueVolume(volume)) || {};
  const dict = i18nDict(lang);
  const cover = (((dict.catalog || {}).covers || {})[volume.replace('.', '_')]) || {};
  const fitTexts = {};
  for (const [key, value] of Object.entries(cover)) {
    if (typeof value === 'string' && value) fitTexts[key] = [value];
  }
  // Size the hero from the issue name that is drawn, not from any cover copy.
  fitTexts.hero = [title];
  return render({
    number: issueVolume(volume),
    title,
    tag: cover.tag || meta.tag || '',
    i18nKey: `catalog.covers.${volume.replace('.', '_')}`,
    // The hero is the issue name, matching the web catalog.
    hero: title,
    heroI18nKey: '',
    fitTexts
  }, {
    // A4 portrait. The web cover is 3:4; the printed page is 1:1.414, so the viewBox
    // must match or the photograph and the type are cropped by the page box.
    width: 900,
    height: Math.round(900 * 297 / 210)
  });
}

// No emoji font is installed for the print browser, so emoji would print as empty
// boxes. The typographic marks the copy actually uses (✓, ✗, ➔) are in DejaVu Sans and
// carry meaning, so they are protected from the strip.
// The print fonts carry Latin, Greek, Cyrillic, Armenian and Georgian, the arrows the copy
// uses, and the tick/cross marks. Every other pictograph is drawn as a missing-glyph box,
// so it is dropped here — including the clock and hourglass symbols in Miscellaneous
// Technical, which are emoji in practice and were printing as tofu.
const EMOJI_RE = /([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{203C}\u{2049}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}])\s?/gu;
const KEPT_MARKS = new Set(['\u2713', '\u2717']);
// The copy uses dingbat arrows (➔ ➜ ➤ ➡) that no print font carries. They are the same
// editorial mark as →, so map them onto it instead of deleting the direction they carry.
const ARROW_MAP = {
  '\u2794': '\u2192', '\u279C': '\u2192', '\u27A1': '\u2192', '\u27A4': '\u2192',
  '\u2B05': '\u2190', '\u2B06': '\u2191', '\u2B07': '\u2193',
};

function stripEmoji(html) {
  return String(html)
    .replace(/[\u2794\u279C\u27A1\u27A4\u2B05\u2B06\u2B07]/g, (ch) => ARROW_MAP[ch])
    .replace(EMOJI_RE, (match, ch) => {
      if (KEPT_MARKS.has(ch)) return match;
      // A variation selector or keycap follows a character that stays; drop only the
      // selector so "▶️ Start" keeps the space after the arrow.
      if (ch === '\uFE0F' || ch === '\u20E3') return ' ';
      return '';
    })
    .replace(/[ \t]{2,}/g, ' ');
}

// Web-only blocks that carry no meaning on paper: `links` renders "Read more ↗"
// navigation, and `medium: 'digital'` marks quizzes and practice prompts that only work
// on the site. Both are excluded here so the printed edition matches the press spec.
const PRINT_SKIP_BLOCKS = new Set(['links']);

function renderBlocks(post) {
  const state = { isFirstParagraph: true, slug: post.slug, lang: post.language };
  return stripEmoji((post.blocks || [])
    .filter((block) => block && block.medium !== 'digital' && !PRINT_SKIP_BLOCKS.has(block.type))
    .map((block, index) => {
      // The drop cap belongs to the opening paragraph only. An article that opens with
      // a rich HTML block would otherwise drop-cap whichever paragraph came first.
      if (index > 0) state.isFirstParagraph = false;
      return renderBlockToHtml(block, state);
    })
    .join('\n'));
}

/**
 * Blueprint copy is authored in English; `translations[lang]` overrides it per
 * edition so a French or Russian PDF never prints English front matter.
 */
function blueprintFor(lang) {
  const base = JSON.parse(fs.readFileSync(BLUEPRINT_FILE, 'utf8'));
  const translationFile = path.join(ROOT, 'content', `blueprint.${lang}.json`);
  const override = fs.existsSync(translationFile)
    ? JSON.parse(fs.readFileSync(translationFile, 'utf8'))
    : {};

  const elements = base.elements.map((element, index) => {
    const translated = (override.elements || [])[index] || {};
    return {
      ...element,
      label: stripEmoji(translated.label || element.label),
      title: stripEmoji(translated.title || element.title),
      description: stripEmoji(translated.description || element.description),
      tags: (translated.tags || element.tags || []).map(stripEmoji)
    };
  });
  return {
    kicker: stripEmoji(override.kicker || base.kicker),
    title: stripEmoji(override.title || base.title),
    lede: stripEmoji(override.lede || base.lede),
    elements
  };
}

/**
 * The PDF is assembled as HTML in private-issues/ and loaded from a file:// URL, where a
 * relative "images/covers/..." href would resolve next to the PDF and miss. Inline the
 * photograph as a data URI so the print edition and the web edition draw the same cover.
 */
function inlineCoverPhoto(svg) {
  return svg.replace(/href="(images\/covers\/[^"]+)"/g, (match, rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return match;
    const mime = rel.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `href="data:${mime};base64,${fs.readFileSync(abs).toString('base64')}"`;
  });
}

/**
 * The cover is its own one-page document. Chromium shrinks a document whose widest
 * element overflows the printable area, so a full-bleed cover inside the body document
 * made every body page render at 91% scale. A separate document with zero page margins
 * prints the cover edge to edge and leaves the body at its true measure.
 */
async function buildCoverHtml(volume, lang, title) {
  const svg = inlineCoverPhoto(await renderIssueCover(volume, lang, title));

  return `<!doctype html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>${fontFaceCss()}</style>
<style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #1E1A17; }
.cover { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #1E1A17; }
.cover-art { position: absolute; inset: 0; }
.cover-art svg { display: block; width: 100%; height: 100%; }
.cover-foot {
  position: absolute; left: 18mm; right: 18mm; bottom: 7mm; z-index: 2;
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: ${SANS_STACK}; font-size: 6.4pt; letter-spacing: .18em;
  text-transform: uppercase; color: #FCF9F2; opacity: .88;
  text-shadow: 0 0 3px rgba(0,0,0,.65);
}
</style></head><body>
<div class="cover">
  <div class="cover-art">${svg}</div>
  <div class="cover-foot"><span>COSYmagazine</span><span>${escapeHtml(editionLabel(volume, lang))}</span></div>
</div>
</body></html>`;
}

async function buildHtml(volume, lang) {
  const blueprint = blueprintFor(lang);
  const posts = loadEdition(volume, lang);
  if (!posts.length) throw new Error(`No published ${lang} posts for ${volume}`);

  const dict = i18nDict(lang);
  const catalog = dict.catalog || {};
  const meta = issueMetaFor(issueVolume(volume)) || {};
  const title = localizedIssueTitle(volume, lang) || `${meta.month || ''} ${volume}`.trim();
  const label = editionLabel(volume, lang);

  const pages = [];

  // Group the body into the three acts. The contents page is printed with word counts
  // and the real page numbers are measured from the laid-out document at print time
  // (see `paginate`), then validated against the rendered PDF page count.
  const zones = pacing.groupByZone(posts);
  const zoneDict = catalog.zones || {};
  const zoneName = (zone) => (zoneDict[zone] || {}).name || pacing.ZONE_LABELS[zone];
  const zoneNote = (zone) => (zoneDict[zone] || {}).note || '';

  // An authored running order prints as one sequence: the departments are the structure,
  // so there are no act openers to print and no act bands to group the contents under.
  const sequenced = posts.some((post) => Number.isFinite(post.printOrder));
  const sequenceArticles = posts.map((post) => Object.assign({ post }, pacing.classify(post)));
  const plan = sequenced
    ? [{
      zone: 'sequence',
      label: '',
      articles: sequenceArticles,
      words: sequenceArticles.reduce((sum, item) => sum + item.words, 0)
    }]
    : zones.filter((group) => group.articles.length > 0);
  const countWord = (n, forms) => {
    if (n === 1 && forms.one) return forms.one;
    if (lang === 'ru' || lang === 'el') {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11 && forms.one) return forms.one;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) && forms.few) return forms.few;
      if (forms.many) return forms.many;
    }
    return forms.other || forms.one || '';
  };
  const wordsUnit = catalog.words_unit || 'words';
  const countArticles = catalog.count_article || {};
  const contentsLabel = catalog.contents || 'Contents';
  const sectionDict = dict.section || {};
  const sectionName = (post) => sectionDict[post.section]
    || String(post.section || '').replace(/_/g, ' ');
  const blueprintLabel = catalog.blueprint_label || 'Editorial blueprint';
  const methodLabel = catalog.about_edition || blueprintLabel;
  const articleCount = posts.length;
  const totalWords = plan.reduce((sum, group) => sum + group.words, 0);

  const issueVibe = ((((catalog.issue_meta || {})[volume.replace('.', '_')]) || {}).vibe) || '';

  pages.push(`<section class="page contents-page">
  <div class="mast"><span>${escapeHtml(contentsLabel)}</span><span>${escapeHtml(label)}</span></div>
  <h2 class="contents-title">${escapeHtml(title)}</h2>
  ${issueVibe ? `<p class="contents-intro">${escapeHtml(issueVibe)}</p>` : ''}
  ${plan.map((group) => `<div class="toc-zone">
    ${group.zone === 'sequence' ? '' : `<div class="toc-zone-head">
      <span class="toc-zone-name">${escapeHtml(zoneName(group.zone))}</span>
      <span class="toc-zone-pages">${group.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</span>
    </div>`}
    ${group.zone !== 'sequence' && zoneNote(group.zone) ? `<p class="toc-zone-note">${escapeHtml(zoneNote(group.zone))}</p>` : ''}
    ${group.articles.map((item) => `<div class="toc-item">
      <span class="toc-sec">${escapeHtml(sectionName(item.post))}</span>
      <span class="toc-title">${escapeHtml(item.post.title)}</span>
      <span data-toc-page="${escapeHtml(item.post.slug)}" class="toc-pages">${item.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</span>
    </div>`).join('')}
  </div>`).join('')}
  <div class="toc-item toc-backmatter">
    <span class="toc-sec">${escapeHtml(blueprintLabel)}</span>
    <span class="toc-title">${escapeHtml(blueprint.title)}</span>
    <span data-toc-page="__backmatter__" class="toc-pages">${blueprint.elements.length} ${escapeHtml(countWord(blueprint.elements.length, countArticles))}</span>
  </div>
  <div class="colophon">
    COSYmagazine · ${escapeHtml(label)} · ${escapeHtml(title)}<br>
    ${articleCount} ${escapeHtml(countWord(articleCount, countArticles))} · ${totalWords.toLocaleString('en-US')} ${escapeHtml(wordsUnit)} ·
    © ${escapeHtml(volume.slice(0, 4))} COSY Languages
  </div>
</section>`);

  plan.forEach((group) => {
    if (group.zone !== 'sequence') pages.push(`<section class="page zone-opener">
  <div class="mast"><span>${escapeHtml(zoneName(group.zone))}</span><span>${escapeHtml(label)}</span></div>
  <div class="zone-open-body">
    <h2 class="zone-open-name">${escapeHtml(zoneName(group.zone))}</h2>
    <p class="zone-open-note">${escapeHtml(zoneNote(group.zone))}</p>
    <p class="zone-open-count">${group.articles.length} ${escapeHtml(countWord(group.articles.length, countArticles))} · ${group.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</p>
  </div>
</section>`);

    group.articles.forEach((item) => {
      const post = item.post;
      pages.push(`<section class="page article${item.longRead ? ' long-read' : ''}${post.printPageBreak ? ' print-new-page' : ''}">
  <header class="article-head">
    <div class="mast"><span>${escapeHtml(sectionName(post))}</span><span>${escapeHtml(label)}</span></div>
    <p class="kicker">${escapeHtml(post.kicker || sectionName(post))}</p>
    <h1>${escapeHtml(post.title)}</h1>
    ${post.dek ? `<p class="dek">${escapeHtml(post.dek)}</p>` : ''}
    <p class="article-meta">${escapeHtml(label)} · ${item.words} ${escapeHtml(wordsUnit)}${post.level ? ` · ${escapeHtml(post.level)}` : ''}</p>
  </header>
  <div class="article-body">${renderBlocks(post)}</div>
</section>`);
    });
  });

  // The editorial charter closes the edition. It is production-facing copy, so it reads
  // as an appendix rather than opening the magazine, and the internal production tags
  // are left out of print.
  pages.push(`<section class="page back-matter" data-backmatter="true">
  <div class="mast"><span>${escapeHtml(blueprintLabel)}</span><span>${escapeHtml(label)}</span></div>
  <h2>${escapeHtml(blueprint.title)}</h2>
  <p class="bp-intro">${escapeHtml(blueprint.lede)}</p>
  <div class="bp-list">
  ${blueprint.elements.map((el) => `<div class="bp-item">
    <span class="bp-num">${escapeHtml(el.number)} · ${escapeHtml(el.label)}</span>
    <div class="bp-title">${escapeHtml(el.title)}</div>
    <p class="bp-desc">${escapeHtml(el.description)}</p>
  </div>`).join('')}
  </div>
</section>`);

  // Body copy carries its own volume strings ("Vol. 2026 — ..."), and a bare year would
  // print a different volume on every edition. Normalise them the way the web build does.
  const volumeMonth = volume.split('.')[1] || '';
  const bodyHtml = pages.join('\n').replace(/\bVol\.\s*(\d{4})(?!\.\d)/g,
    (m, year) => `Vol. ${year}.${volumeMonth}`);

  return `<!doctype html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8">
<title>${escapeHtml(`${title} — ${label}`)}</title>
<meta name="author" content="COSYmagazine · COSY Languages">
<meta name="description" content="${escapeHtml(`${title}. ${label}. ${articleCount} ${countWord(articleCount, countArticles)}, ${totalWords} ${wordsUnit}.`)}">
<meta name="keywords" content="${escapeHtml(`COSYmagazine, language learning, ${title}, ${label}`)}">
<meta name="generator" content="COSYmagazine print edition">
<style>${fontFaceCss()}</style>
<style>${printCss(lang)}</style>
</head><body>
${bodyHtml}
</body></html>`;
}

// A4 content box: 210 - 2*18 mm wide, 297 - 16 - 18 mm tall.
const PAGE_CONTENT_MM = { width: 174, height: 263 };
const MM_TO_PX = 96 / 25.4;

function countPdfPages(buffer) {
  return (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}

/**
 * Removes the parts of the article markup that only work on the website. Doing this in
 * the live DOM keeps the printed edition from depending on a regex over nested HTML,
 * and it runs before pagination so removed chrome does not skew the page numbers.
 */
function cleanPrintDom() {
  const drop = [
    '.print-running-header', '.page-break-hint', '.verb-map-container', '.sr-only',
    '.fulllist-btn', '.quiz-mark', '.podcast-box', '.podcast-embed',
    '.flip-nav', '.dog-ear', 'audio', '.read-more-link'
  ];
  document.querySelectorAll(drop.join(',')).forEach((el) => el.remove());
  // Source blocks are wrapped in unclassed layout divs. `column-span: all` only works on
  // a direct child of the two-column body, so unwrap those structural wrappers: a table
  // or figure then sits at the top level and can span the gutter. Boxes that paint a
  // background or a grid keep their box.
  document.querySelectorAll('.article-body').forEach((body) => {
    // Flipbook "page" sections and unclassed layout divs are web groupings; on paper they
    // only stand between a table and the column context that lets it span the gutter.
    for (const el of [...body.querySelectorAll('.gazette-page-spread, div:not([class])')]) {
      const style = el.getAttribute('style') || '';
      if (/background|border|display\s*:\s*grid/.test(style)) continue;
      el.replaceWith(...el.childNodes);
    }
  });
  document.querySelectorAll('.article-body').forEach((body) => {
    [...body.children].forEach((child) => {
      if (child.querySelector && child.querySelector('table')) child.classList.add('print-wide');
    });
  });
  // The edition banner is the article's opener, but the source embeds it after the first
  // block. Move it to the top so it prints as a full-width strip above the columns.
  document.querySelectorAll('.article-body').forEach((body) => {
    const banner = body.querySelector(':scope > .august-issue-banner');
    if (banner && body.firstElementChild !== banner) body.prepend(banner);
  });
  // Reader-only buttons ("Print this page", "Show all") do nothing on paper. Quiz
  // options are buttons too, and they are study content, so they stay.
  document.querySelectorAll('button:not(.quiz-option-btn)').forEach((button) => button.remove());
  // Cross-sell banners ("View the master guide") end in a call-to-action button that
  // does nothing on paper. Drop the whole banner rather than leave a dead button.
  document.querySelectorAll('.article-body a.button').forEach((link) => {
    const body = link.closest('.article-body');
    let box = link;
    while (box.parentElement && box.parentElement !== body) box = box.parentElement;
    if (box.parentElement === body) box.remove();
  });
  // Link grids ("open the guide in another language", "read more") are navigation for a
  // browser. A block that is almost nothing but links has no reading value on paper.
  document.querySelectorAll('.article-body section, .article-body div, .article-body nav').forEach((el) => {
    const links = el.querySelectorAll('a[href$=".html"], a[href^="http"]');
    if (links.length >= 4 && el.querySelectorAll('p').length <= 1) el.remove();
  });
  // Internal anchors (#page-2 and friends) are flipbook navigation. Keep the words,
  // drop the link so the printed page has no dead affordance.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const parent = a.parentNode;
    while (a.firstChild) parent.insertBefore(a.firstChild, a);
    parent.removeChild(a);
  });
}

/** Everything a title search must ignore: spacing is inserted by letter-spacing. */
function normaliseForSearch(text) {
  return String(text).toLowerCase().replace(/\s+/g, '').replace(/[\u2018\u2019]/g, "'");
}

/**
 * Finds the printed page of every article by reading the rendered PDF. Chromium cannot
 * report where a section broke, and measuring the DOM guesses wrong as soon as a
 * `break-inside` rule or a spanning block pushes content to another page. Reading the
 * actual text layer is exact: each article opens with its own headline.
 *
 * Returns `{ [slug]: page, __backmatter__: page }` in physical page numbers (the cover
 * is page 1), or null when any headline cannot be found.
 */
async function locateArticles(bodyBytes, articles, backTitle) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bodyBytes),
    useSystemFonts: true,
    isEvalSupported: false
  });
  const doc = await loadingTask.promise;
  try {
    const pages = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const content = await (await doc.getPage(i)).getTextContent();
      pages.push(normaliseForSearch(content.items.map((item) => item.str).join('')));
    }
    const located = {};
    let cursor = 1; // page 1 of the body is the contents page; never match it
    for (const article of [...articles, { slug: '__backmatter__', title: backTitle }]) {
      const needle = normaliseForSearch(article.title);
      let found = -1;
      for (let i = cursor; i < pages.length; i += 1) {
        if (pages[i].includes(needle)) { found = i; break; }
      }
      if (found === -1) return null;
      located[article.slug] = found + 2; // body index -> physical page (cover is 1)
      cursor = found;
    }
    // Zone openers are near-empty pages, and they name their own zone, so the running
    // foot must not repeat the previous article's desk over them.
    const sparse = pages.map((text) => text.length < 400);
    return { located, sparse };
  } finally {
    await loadingTask.destroy();
  }
}

function applyContentsPages(map) {
  document.querySelectorAll('[data-toc-page]').forEach((el) => {
    const target = map[el.dataset.tocPage];
    if (el.dataset.tocFallback == null) el.dataset.tocFallback = el.textContent;
    if (target) el.textContent = String(target);
  });
}

function restoreContentsFallback() {
  document.querySelectorAll('[data-toc-page]').forEach((el) => {
    if (el.dataset.tocFallback != null) el.textContent = el.dataset.tocFallback;
  });
}

/** A Unicode face for the desk names: the editions print in Cyrillic as well as Latin. */
const RUNNING_FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/TTF/DejaVuSans.ttf',
  '/Library/Fonts/Arial Unicode.ttf'
];

async function embedRunningFont(pdfDoc) {
  for (const file of RUNNING_FONT_CANDIDATES) {
    if (!fs.existsSync(file)) continue;
    try {
      const fontkit = require('@pdf-lib/fontkit');
      pdfDoc.registerFontkit(fontkit.default || fontkit);
      return await pdfDoc.embedFont(fs.readFileSync(file), { subset: true });
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Folios live in the bottom margin, drawn after the merge so the cover stays clean.
 * The desk name rides with them: Chromium cannot print a per-page running head, and a
 * continuation page of a long article would otherwise carry nothing but a number.
 */
async function drawFolios(pdfDoc, font, color, running) {
  const deskFont = running && running.font ? running.font : font;
  const tracking = 0.55;
  const size = 6.5;
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    if (index === 0) return; // the cover carries no folio
    const { width } = page.getSize();
    const baseline = 10 * (72 / 25.4);
    const inset = 18 * (72 / 25.4);
    const number = String(index + 1);
    page.drawLine({
      start: { x: inset, y: baseline + 4 * (72 / 25.4) },
      end: { x: width - inset, y: baseline + 4 * (72 / 25.4) },
      thickness: 0.4,
      color,
      opacity: 0.45
    });
    page.drawText('COSYmagazine', { x: inset, y: baseline, size, font, color });
    page.drawText(number, {
      x: width - inset - font.widthOfTextAtSize(number, size),
      y: baseline,
      size,
      font,
      color
    });
    const desk = running && running.desks.get(index + 1);
    if (!desk) return;
    const text = desk.toLocaleUpperCase();
    const deskWidth = deskFont.widthOfTextAtSize(text, size) + tracking * (text.length - 1);
    page.drawText(text, {
      x: (width - deskWidth) / 2,
      y: baseline,
      size,
      font: deskFont,
      color,
      characterSpacing: tracking
    });
  });
}

/**
 * Maps every printed page to the desk it belongs to, so the running foot can name it.
 * Pages between an article's headline and the next headline are that article's; the
 * appendix owns everything to the end. Near-empty opener pages are left unlabelled.
 */
function runningDesks(volume, lang, posts, located, sparse, pageCount) {
  const desks = new Map();
  if (!located) return desks;
  const dict = i18nDict(lang);
  const catalog = dict.catalog || {};
  const sectionDict = dict.section || {};
  const starts = [];
  for (const post of posts) {
    const page = located[post.slug];
    if (!page) continue;
    starts.push({
      page,
      desk: sectionDict[post.section] || String(post.section || '').replace(/_/g, ' ')
    });
  }
  if (located.__backmatter__) {
    starts.push({ page: located.__backmatter__, desk: catalog.blueprint_label || 'Editorial blueprint' });
  }
  starts.sort((a, b) => a.page - b.page);
  starts.forEach((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].page - 1 : pageCount;
    for (let page = start.page; page <= end; page += 1) {
      if (page > pageCount) break;
      if (sparse && sparse[page - 2]) continue;
      desks.set(page, start.desk);
    }
  });
  return desks;
}

async function buildPdf(volume, lang, outPath, keepHtml) {
  const title = localizedIssueTitle(volume, lang) || volume;
  const label = editionLabel(volume, lang);
  const html = await buildHtml(volume, lang);
  const coverHtml = await buildCoverHtml(volume, lang, title);
  const htmlPath = outPath.replace(/\.pdf$/i, '.html');
  const coverPath = outPath.replace(/\.pdf$/i, '.cover.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(coverPath, coverHtml);

  const posts = loadEdition(volume, lang);
  const backTitle = blueprintFor(lang).title;
  let locatedPages = null;
  let sparsePages = null;

  const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
  const browser = await chromium.launch({ headless: true });
  let coverBytes;
  let bodyBytes;
  try {
    const printOptions = { printBackground: true, preferCSSPageSize: true };

    const coverPage = await browser.newPage();
    await coverPage.goto(pathToFileURL(coverPath).href, { waitUntil: 'load' });
    await coverPage.evaluate(() => document.fonts.ready);
    coverBytes = await coverPage.pdf(printOptions);
    await coverPage.close();

    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(cleanPrintDom);
    await page.evaluate(() => document.fonts.ready);
    bodyBytes = await page.pdf(printOptions);

    // The contents page is printed once with word counts, then the real page numbers are
    // read back from that PDF and written in. The second print keeps the same pagination
    // because the numbers occupy a fixed-width column, and the page count is checked to
    // prove it; if anything moved, the word counts stay rather than print wrong numbers.
    const inspection = await locateArticles(bodyBytes, posts, backTitle);
    if (inspection) {
      const { located } = inspection;
      const before = countPdfPages(bodyBytes);
      await page.evaluate(applyContentsPages, located);
      const numbered = await page.pdf(printOptions);
      if (countPdfPages(numbered) === before) {
        bodyBytes = numbered;
      } else {
        await page.evaluate(restoreContentsFallback);
      }
      locatedPages = located;
      sparsePages = inspection.sparse;
    }
  } finally {
    await browser.close();
  }

  const merged = await PDFDocument.create();
  const coverDoc = await PDFDocument.load(coverBytes);
  const bodyDoc = await PDFDocument.load(bodyBytes);
  const [cover] = await merged.copyPages(coverDoc, [0]);
  merged.addPage(cover);
  for (const bodyPage of await merged.copyPages(bodyDoc, bodyDoc.getPageIndices())) {
    merged.addPage(bodyPage);
  }
  const folioFont = await merged.embedFont(StandardFonts.Helvetica);
  const runningFont = await embedRunningFont(merged);
  await drawFolios(merged, folioFont, rgb(0.54, 0.48, 0.43), {
    font: runningFont,
    desks: runningDesks(volume, lang, posts, locatedPages, sparsePages, merged.getPageCount())
  });

  merged.setTitle(`${title} — ${label}`);
  merged.setAuthor('COSYmagazine · COSY Languages');
  merged.setSubject(`${title}. ${label}.`);
  merged.setKeywords(['COSYmagazine', 'language learning', title, label]);
  merged.setCreator('COSYmagazine print edition');
  merged.setProducer('COSYmagazine print edition');

  const pdf = Buffer.from(await merged.save());
  fs.writeFileSync(outPath, pdf);

  if (!keepHtml) {
    fs.unlinkSync(htmlPath);
    fs.unlinkSync(coverPath);
  }

  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Output is not a valid PDF.');
  return { bytes: pdf.length, pages: merged.getPageCount() };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const langs = options.allLangs ? editionLanguages(options.volume) : [options.lang];

  for (const lang of langs) {
    const out = options.out && langs.length === 1
      ? path.resolve(options.out)
      : path.join(ROOT, 'private-issues', `cosymagazine-${options.volume}-${lang}.pdf`);
    const { bytes, pages } = await buildPdf(options.volume, lang, out, options.keepHtml);
    console.log(`✅ ${path.relative(ROOT, out)} — ${pages} pages, ${(bytes / 1024).toFixed(0)} KB`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  });
}

module.exports = { buildHtml, buildPdf, loadEdition, editionLanguages, runningDesks };
