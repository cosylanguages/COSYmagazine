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

/** Published posts for one issue + language, in print order. */
function loadEdition(volume, lang) {
  const dir = path.join(issueDir(volume), 'posts');
  if (!fs.existsSync(dir)) throw new Error(`No posts directory for ${volume}: ${dir}`);

  const posts = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))
    .filter((post) => !post.draft && post.language === lang);

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
@page { size: A5; margin: 14mm 15mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: __SERIF__;
  font-size: 9.6pt; line-height: 1.55; color: #1E1A17;
  background: #fff;
}
/* Reader-only chrome (print/save/CSV buttons) has no meaning on paper. Quiz options
   are real study content, so they are restyled as a list instead of hidden. */
.fulllist-btn, .flip-nav, .dog-ear, .podcast-box, .podcast-embed { display: none !important; }
.quiz-option-btn { display: list-item; list-style: upper-alpha; margin-left: 5mm; }

.page { page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }

.mast, .folio {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: __SANS__;
  font-size: 6.8pt; letter-spacing: .14em; text-transform: uppercase;
  color: #8A7A6D;
}
.mast { border-bottom: .6pt solid #D9CFC4; padding-bottom: 2.2mm; margin-bottom: 6mm; }
.folio { border-top: .6pt solid #D9CFC4; padding-top: 2.2mm; margin-top: 6mm; }

.kicker {
  font-family: __SANS__;
  font-size: 7.2pt; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: #A2532F; margin: 0 0 2mm;
}
h1 { font-size: 26pt; line-height: 1.08; margin: 0 0 5mm; font-weight: 400; letter-spacing: -.01em; }
h2 { font-size: 15pt; line-height: 1.2; margin: 0 0 4mm; font-weight: 400; }
h3 { font-size: 10.5pt; margin: 5mm 0 2mm; color: #0F6E56; }
h4 { font-size: 9.5pt; margin: 4mm 0 1.5mm; }
p { margin: 0 0 3.2mm; }
em { font-style: italic; }
strong { font-weight: 700; }
blockquote {
  margin: 5mm 0; padding: 0 0 0 5mm; border-left: 2.4pt solid #A2532F;
  font-style: italic; font-size: 11pt; line-height: 1.45; color: #3A2E26;
}
ul, ol { margin: 0 0 3.2mm; padding-left: 6mm; }
li { margin-bottom: 1.4mm; }
a { color: #0F6E56; text-decoration: none; }
img, svg { max-width: 100%; height: auto; }
table { width: 100%; border-collapse: collapse; font-size: 8.2pt; margin: 0 0 4mm; }
th, td { border: .5pt solid #D9CFC4; padding: 1.4mm 1.8mm; text-align: left; vertical-align: top; }
th { background: #F4EFE8; font-family: __SANS__; font-size: 7.4pt; }
hr { border: 0; border-top: .6pt solid #D9CFC4; margin: 5mm 0; }
code { font-family: 'SF Mono', Menlo, monospace; font-size: 8.6pt; background: #F4EFE8; padding: .3mm 1mm; }

/* Cover */
.cover { display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
.cover-art { text-align: center; }
.cover-art svg { width: 74%; height: auto; box-shadow: 0 6mm 14mm rgba(38,26,22,.22); }
.cover-foot {
  font-family: __SANS__; font-size: 7pt;
  letter-spacing: .16em; text-transform: uppercase; color: #8A7A6D; text-align: center;
}

/* Blueprint */
.bp-intro { font-size: 10.2pt; color: #4A3E35; margin-bottom: 6mm; }
.bp-item { margin-bottom: 4.6mm; break-inside: avoid; }
.bp-num {
  font-family: __SANS__; font-size: 7pt; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; color: #A2532F;
}
.bp-title { font-size: 10.6pt; font-weight: 700; margin: .6mm 0 1mm; }
.bp-desc { font-size: 9pt; line-height: 1.5; color: #3A2E26; margin: 0 0 1mm; }
.bp-tags { font-family: __SANS__; font-size: 6.8pt; letter-spacing: .1em; text-transform: uppercase; color: #9A8B7E; }

/* Contents */
.toc-zone { margin-bottom: 5mm; }
.toc-zone-head {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: __SANS__; font-size: 7.4pt; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; color: #A2532F;
  border-bottom: .9pt solid #1E1A17; padding-bottom: 1.4mm; margin-bottom: 1.2mm;
}
.toc-zone-pages { color: #8A7A6D; font-weight: 400; }
.toc-item { display: flex; gap: 3mm; padding: 2.2mm 0; border-bottom: .5pt dotted #D9CFC4; }
.toc-sec {
  font-family: __SANS__; font-size: 6.6pt; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #0F6E56; width: 26mm; flex-shrink: 0;
}
.toc-title { flex: 1; font-size: 9.4pt; }
.toc-pages { font-family: __SANS__; font-size: 7.6pt; color: #8A7A6D; }

/* Zone openers: a full page that is mostly air, so the change of pace is felt. */
.zone-open-body {
  display: flex; flex-direction: column; justify-content: center;
  height: 78%; text-align: center; padding: 0 8mm;
}
.zone-open-name { font-size: 30pt; line-height: 1.1; font-weight: 400; margin: 0 0 4mm; }
.zone-open-note { font-size: 11pt; font-style: italic; color: #4A3E35; margin: 0 0 6mm; }
.zone-open-count {
  font-family: __SANS__; font-size: 7.2pt; letter-spacing: .16em;
  text-transform: uppercase; color: #8A7A6D;
}

/* Articles */
.article { break-before: page; }
.article-head { border-bottom: 1.6pt solid #1E1A17; padding-bottom: 3mm; margin-bottom: 5mm; }
.article-meta {
  font-family: __SANS__; font-size: 6.8pt; letter-spacing: .12em;
  text-transform: uppercase; color: #8A7A6D; margin-top: 2mm;
}
.dek { font-size: 10.6pt; line-height: 1.45; color: #4A3E35; font-style: italic; margin: 0 0 4mm; }
.editorial-heading { color: #0F6E56; }
.gazette-quiz-card { border: .6pt solid #D9CFC4; padding: 3mm; margin: 4mm 0; break-inside: avoid; }
.quiz-option-btn { display: block; width: 100%; text-align: left; border: .5pt solid #D9CFC4; background: #FAF7F2; padding: 1.6mm 2mm; margin-bottom: 1.2mm; font: inherit; font-size: 9pt; }
.example, .culture-bite { border: .5pt solid #D9CFC4; background: #FAF7F2; padding: 2.6mm 3mm; margin: 3mm 0; font-size: 8.8pt; break-inside: avoid; }

/* The opener paragraph: an oversized drop cap spanning the first three lines,
   then small caps for the opening words, to anchor the eye at the top of a long
   read. blocks.js already emits .gazette-drop-cap, so style it rather than
   invent a second class. */
.gazette-drop-cap::first-letter {
  float: left;
  font-size: 3.05em;
  line-height: .84;
  padding: .06em .09em 0 0;
  font-weight: 700;
  color: #A2532F;
}
.gazette-drop-cap::first-line { font-variant: small-caps; letter-spacing: .02em; }

/* Pull quotes are the visual anchors of the Well. blocks.js emits
   .gazette-pullquote; the old .pullquote selector never matched anything. */
.gazette-pullquote, blockquote.gazette-pullquote {
  border: 0;
  border-top: .8pt solid #1E1A17;
  border-bottom: .8pt solid #1E1A17;
  margin: 7mm 0;
  padding: 4mm 0;
  font-size: 13.2pt;
  line-height: 1.3;
  font-style: italic;
  color: #1E1A17;
  text-align: center;
  break-inside: avoid;
}
.gazette-pullquote p { margin: 0; }
.gazette-pullquote cite {
  display: block;
  margin-top: 2.5mm;
  font-family: __SANS__;
  font-size: 6.8pt;
  font-style: normal;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #8A7A6D;
}

/* Long reads get a two-column grid with a wide outer margin, so the eye travels
   a comfortable measure and the page keeps its air. Headings and pull quotes
   span both columns. */
.long-read .article-body { column-count: 2; column-gap: 6mm; text-align: justify; hyphens: auto; }
.long-read .article-body > * { break-inside: avoid-column; }
.long-read .article-body > h2,
.long-read .article-body > h3,
.long-read .article-body > .gazette-pullquote,
.long-read .article-body > table,
.long-read .article-body > .gazette-quiz-card { column-span: all; break-inside: avoid; }
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
  return render({
    number: issueVolume(volume),
    title,
    tag: cover.tag || meta.tag || '',
    i18nKey: `catalog.covers.${volume.replace('.', '_')}`,
    hero: cover.hero || title,
    fitTexts
  });
}

// No emoji font is installed for the print browser, so emoji would print as empty
// boxes. Strip them from rendered article HTML rather than ship a broken PDF.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu;

function stripEmoji(html) {
  return String(html).replace(EMOJI_RE, '').replace(/[ \t]{2,}/g, ' ');
}

function renderBlocks(post) {
  const state = { isFirstParagraph: true, slug: post.slug, lang: post.language };
  return stripEmoji((post.blocks || []).map((block) => renderBlockToHtml(block, state)).join('\n'));
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

async function buildHtml(volume, lang) {
  const blueprint = blueprintFor(lang);
  const posts = loadEdition(volume, lang);
  if (!posts.length) throw new Error(`No published ${lang} posts for ${volume}`);

  const meta = issueMetaFor(issueVolume(volume)) || {};
  const title = localizedIssueTitle(volume, lang) || `${meta.month || ''} ${volume}`.trim();
  const langName = LANG_NAMES[lang] || lang.toUpperCase();
  const label = `${issueVolume(volume)} · ${langName} Edition`;
  const coverSvg = await renderIssueCover(volume, lang, title);

  const pages = [];

  pages.push(`<section class="page"><div class="cover">
  <div class="cover-art">${coverSvg}</div>
  <div class="cover-foot">COSYmagazine · ${escapeHtml(label)}</div>
</div></section>`);

  // Group the body into the three acts. Chromium's continuous layout cannot
  // predict where a column grid will break across printed pages, so the contents
  // page carries word counts rather than invented page numbers.
  const zones = pacing.groupByZone(posts);
  const zoneDict = ((i18nDict(lang).catalog || {}).zones) || {};
  const zoneName = (zone) => (zoneDict[zone] || {}).name || pacing.ZONE_LABELS[zone];
  const zoneNote = (zone) => (zoneDict[zone] || {}).note || '';

  const plan = zones.filter((group) => group.articles.length > 0);
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
  const wordsUnit = (i18nDict(lang).catalog || {}).words_unit || 'words';
  const countArticles = (i18nDict(lang).catalog || {}).count_article || {};
  const contentsLabel = (i18nDict(lang).catalog || {}).contents || 'Contents';
  const sectionDict = i18nDict(lang).section || {};
  const sectionName = (post) => sectionDict[post.section]
    || String(post.section || '').replace(/_/g, ' ');
  const blueprintLabel = (i18nDict(lang).catalog || {}).blueprint_label || 'Editorial blueprint';

  pages.push(`<section class="page">
  <div class="mast"><span>${escapeHtml(contentsLabel)}</span><span></span></div>
  <p class="kicker">${escapeHtml(label)}</p>
  <h2>${escapeHtml(title)}</h2>
  ${plan.map((group) => `<div class="toc-zone">
    <div class="toc-zone-head">
      <span class="toc-zone-name">${escapeHtml(zoneName(group.zone))}</span>
      <span class="toc-zone-pages">${group.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</span>
    </div>
    ${group.articles.map((item) => `<div class="toc-item">
      <span class="toc-sec">${escapeHtml(sectionName(item))}</span>
      <span class="toc-title">${escapeHtml(item.post.title)}</span>
      <span class="toc-pages">${item.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</span>
    </div>`).join('')}
  </div>`).join('')}
</section>`);

  pages.push(`<section class="page">
  <div class="mast"><span>${escapeHtml(blueprintLabel)}</span><span></span></div>
  <p class="kicker">${escapeHtml(blueprint.kicker)}</p>
  <h2>${escapeHtml(blueprint.title)}</h2>
  <p class="bp-intro">${escapeHtml(blueprint.lede)}</p>
  ${blueprint.elements.map((el) => `<div class="bp-item">
    <span class="bp-num">${escapeHtml(el.number)} · ${escapeHtml(el.label)}</span>
    <div class="bp-title">${escapeHtml(el.title)}</div>
    <p class="bp-desc">${escapeHtml(el.description)}</p>
    <span class="bp-tags">${escapeHtml(el.tags.join(' · '))}</span>
  </div>`).join('')}
</section>`);

  plan.forEach((group) => {
    pages.push(`<section class="page zone-opener">
  <div class="mast"><span>${escapeHtml(zoneName(group.zone))}</span><span></span></div>
  <div class="zone-open-body">
    <p class="kicker">${escapeHtml(label)}</p>
    <h2 class="zone-open-name">${escapeHtml(zoneName(group.zone))}</h2>
    <p class="zone-open-note">${escapeHtml(zoneNote(group.zone))}</p>
    <p class="zone-open-count">${group.articles.length} ${escapeHtml(countWord(group.articles.length, countArticles))} · ${group.words.toLocaleString('en-US')} ${escapeHtml(wordsUnit)}</p>
  </div>
</section>`);

    group.articles.forEach((item) => {
      const post = item.post;
      pages.push(`<section class="page article${item.longRead ? ' long-read' : ''}">
  <div class="mast"><span>${escapeHtml(sectionName(post))}</span><span></span></div>
  <header class="article-head">
    <p class="kicker">${escapeHtml(post.kicker || sectionName(post))}</p>
    <h1>${escapeHtml(post.title)}</h1>
    ${post.dek ? `<p class="dek">${escapeHtml(post.dek)}</p>` : ''}
    <p class="article-meta">${escapeHtml(label)} · ${item.words} words · ${escapeHtml(post.level || '')}</p>
  </header>
  <div class="article-body">${renderBlocks(post)}</div>
</section>`);
    });
  });

  return `<!doctype html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8">
<title>${escapeHtml(`${title} — ${label}`)}</title>
<style>${fontFaceCss()}</style>
<style>${printCss(lang)}</style>
</head><body>
${pages.join('\n')}
</body></html>`;
}

async function buildPdf(volume, lang, outPath, keepHtml) {
  const html = await buildHtml(volume, lang);
  const htmlPath = outPath.replace(/\.pdf$/i, '.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: outPath,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:6.5pt;letter-spacing:.14em;color:#8A7A6D;padding:0 15mm;display:flex;justify-content:space-between;text-transform:uppercase;"><span>COSYmagazine</span><span class="pageNumber"></span></div>',
      margin: { top: '14mm', bottom: '16mm', left: '15mm', right: '15mm' }
    });
  } finally {
    await browser.close();
  }

  if (!keepHtml) fs.unlinkSync(htmlPath);

  const pdf = fs.readFileSync(outPath);
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Output is not a valid PDF.');
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  return { bytes: pdf.length, pages };
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

module.exports = { buildHtml, buildPdf, loadEdition, editionLanguages };
