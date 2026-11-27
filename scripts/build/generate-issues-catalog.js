#!/usr/bin/env node
/**
 * scripts/build/generate-issues-catalog.js
 * Builds issues-catalog.html: one section per published volume, and within it one
 * subsection per language edition (English, French, Russian). Each edition lists only
 * the articles written in its own language; the language pills on every card still link
 * all the variants that exist.
 *
 * Source is index.json (itself generated from posts/*.json), so the catalog can never
 * drift from the article sources. Run after scripts/build-blog.js.
 *
 * Usage: node scripts/build/generate-issues-catalog.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const INDEX_JSON = path.join(ROOT, 'index.json');
const OUTPUT = path.join(ROOT, 'issues-catalog.html');
const BASE = 'https://cosylanguages.github.io/COSYmagazine/';

const UI_LANGS = ['en', 'fr', 'it', 'ru', 'el'];

// Languages that get a full monthly edition of their own. Other languages (es, de, pt,
// hy, ka, tt, ba, br, cv) publish individual articles that live inside the edition whose
// language they are written in — they are not separate issues.
const EDITION_LANGS = ['en', 'fr', 'ru'];

const LANG_NAMES = {
  en: 'English', fr: 'Français', it: 'Italiano', ru: 'Русский', el: 'Ελληνικά',
  es: 'Español', de: 'Deutsch', pt: 'Português', hy: 'Հայերեն', ka: 'ქართული',
  tt: 'Татарча', ba: 'Башҡортса', br: 'Brezhoneg', cv: 'Чӑвашла'
};

const LANG_FLAGS = {
  en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', ru: '🇷🇺', el: '🇬🇷',
  es: '🇪🇸', de: '🇩🇪', pt: '🇵🇹', hy: '🇦🇲', ka: '🇬🇪',
  tt: '🌐', ba: '🌐', br: '🌐', cv: '🌐'
};

// Desk labels are localized in js/i18n/*.json under the `desk` object.
const DESK_KEYS = {
  'Front Page': 'front_page', 'Saturday Mistakes': 'saturday_mistakes',
  'COSYtalks': 'cosytalks', 'Grammar': 'grammar', 'Words': 'words',
  'Grammar Made Cosy': 'grammar_made_cosy', 'Say It': 'say_it',
  'Culture & Quotes': 'culture_quotes', 'Long Reads': 'long_reads',
  'Cosy Events': 'cosy_events', 'The Podcast': 'the_podcast',
  'Back Issues': 'back_issues', 'Reflections': 'reflections'
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function loadDict(lang) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'js', 'i18n', `${lang}.json`), 'utf-8'));
  } catch (e) {
    return {};
  }
}

function t(dict, key, fallback) {
  const value = key.split('.').reduce((cur, part) => (cur && cur[part] !== undefined ? cur[part] : undefined), dict);
  return typeof value === 'string' ? value : fallback;
}

/** Groups posts into one entry per article, with all its language variants. */
function groupArticles(posts) {
  const map = new Map();
  for (const post of posts) {
    const key = post.translationOf || post.slug;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(post);
  }
  return [...map.entries()].map(([key, variants]) => {
    const base = variants.find((v) => v.slug === key)
      || variants.find((v) => !v.translationOf)
      || variants[0];
    // One entry per language. A dedicated language edition wins over a hub page that
    // also declares that language (e.g. top-10-verbs vs top-10-verbs-en).
    const byLanguage = new Map();
    for (const v of variants) {
      const current = byLanguage.get(v.language);
      if (!current || (v.translationOf && !current.translationOf)) byLanguage.set(v.language, v);
    }
    const editions = [...byLanguage.values()].sort((a, b) => a.language.localeCompare(b.language));
    return { base, variants: editions };
  });
}

function renderLanguagePills(article, readInLabel, allLanguagesLabel) {
  const hub = article.variants.includes(article.base)
    ? ''
    : `<a class="cat-lang-pill is-hub" href="${esc(article.base.slug)}.html" data-i18n-title="catalog.all_languages" title="${esc(allLanguagesLabel)}">🌐 <span data-i18n="catalog.hub">Hub</span> <span class="visually-hidden" data-i18n="catalog.hub_hint"> — ${esc(allLanguagesLabel ? readInLabel + ' ' + allLanguagesLabel.toLowerCase() : readInLabel)}</span></a>`;
  return hub + article.variants.map((v) => {
    const name = LANG_NAMES[v.language] || v.language.toUpperCase();
    const flag = LANG_FLAGS[v.language] || '🌐';
    return `<a class="cat-lang-pill${v === article.base ? ' is-base' : ''}" href="${esc(v.slug)}.html" lang="${esc(v.language)}" hreflang="${esc(v.language)}" title="${esc(name)}">${flag} ${esc(v.language.toUpperCase())}<span class="visually-hidden"> — <span data-i18n="catalog.read_in">${esc(readInLabel)}</span> ${esc(name)}</span></a>`;
  }).join('');
}

function renderArticle(article, display, readInLabel, allLanguagesLabel) {
  const p = display;
  const langCount = article.variants.length;
  return `
        <li class="cat-article">
          <a class="cat-article-title" href="${esc(p.slug)}.html" lang="${esc(p.language)}">${esc(p.title)}</a>
          <p class="cat-article-dek" lang="${esc(p.language)}">${esc(p.dek)}</p>
          <div class="cat-article-meta">
            <span class="cat-article-desk"${DESK_KEYS[p.desk] ? ` data-i18n="desk.${DESK_KEYS[p.desk]}"` : ''}>${esc(p.desk || '')}</span>
            <span aria-hidden="true">·</span>
            <span>${esc(p.level || '')}</span>
            <span aria-hidden="true">·</span>
            <span data-i18n-count="catalog.count_language" data-count="${langCount}">${langCount} languages</span>
          </div>
          <div class="cat-lang-pills" data-i18n-aria-label="catalog.read_in" aria-label="${esc(readInLabel)}">${renderLanguagePills(article, readInLabel, allLanguagesLabel)}</div>
        </li>`;
}

function issueTitleFor(issue, dict) {
  const m = /(\d{4})\.(\d{2})/.exec(issue.number || '');
  const monthKey = m ? `issue_${MONTHS[parseInt(m[2], 10) - 1]}_title` : '';
  const localized = monthKey ? t(dict, `blog.${monthKey}`, '') : '';
  return localized || issue.title || '';
}

async function build() {
  if (!fs.existsSync(INDEX_JSON)) {
    console.error('❌ index.json is missing. Run `node scripts/build/build-blog.js` first.');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
  const enDict = loadDict('en');
  // The cover renderer is an ES module while this script is CommonJS.
  const { renderIssueCover } = await import('../../js/art/vogue-cover.js');

  // Cover text is localized at runtime by shell.js, so the renderer has to size each
  // line for the longest translation, not just the English one it is built with.
  const dicts = UI_LANGS.map((l) => loadDict(l));
  // Every translation of each key, not just the longest: translations wrap at different
  // points, so a shorter string can still produce a wider first line.
  function allCoverTexts(coverKey) {
    const all = {};
    for (const dict of dicts) {
      const cover = (((dict.catalog || {}).covers) || {})[coverKey] || {};
      for (const [k, v] of Object.entries(cover)) {
        if (typeof v !== 'string' || !v) continue;
        (all[k] = all[k] || []).push(v);
      }
    }
    return all;
  }
  const c = (key, fallback) => t(enDict, `catalog.${key}`, fallback);

  // Every translation of the issue's name. The cover hero and the section heading share
  // this one key, so the cover can never advertise a headline the issue does not have.
  function allIssueTitleTexts(monthKey) {
    const out = [];
    for (const dict of dicts) {
      const v = t(dict, `blog.issue_${monthKey}_title`, '');
      if (v) out.push(v);
    }
    return out;
  }

  // Saturday Mistakes is podcast content, not a monthly volume, but it is still published
  // material, so it gets its own section instead of being dropped from the catalog.
  const isPodcast = (number) => number === 'Podcast Special';
  const issues = (index.issues || [])
    .slice()
    .sort((a, b) => {
      if (isPodcast(a.number)) return 1;
      if (isPodcast(b.number)) return -1;
      return b.number.localeCompare(a.number);
    });

  const publishedPosts = (index.posts || []).filter((p) => !p.draft);
  const totalArticles = groupArticles(publishedPosts).length;


  const sections = issues.map((issue) => {
    const issuePosts = publishedPosts.filter((p) => p.issue && p.issue.number === issue.number);
    const articles = groupArticles(issuePosts)
      .sort((a, b) => new Date(b.base.date) - new Date(a.base.date));
    if (!articles.length) return '';
    const anchor = isPodcast(issue.number) ? 'podcast-special' : (issue.anchor || 'blueprint');
    const heading = isPodcast(issue.number)
      ? c('podcast_series', issue.title || 'Saturday Mistakes')
      : issueTitleFor(issue, enDict);
    // Lets shell.js re-localize the heading when the reader switches interface language.
    const monthMatch = /(\d{4})\.(\d{2})/.exec(issue.number || '');
    // i18n keys cannot contain dots, so the volume becomes 2026_08.
    const metaKey = monthMatch ? `${monthMatch[1]}_${monthMatch[2]}` : '';
    const headingKey = isPodcast(issue.number)
      ? ' data-i18n="catalog.podcast_series"'
      : (monthMatch ? ` data-i18n="blog.issue_${MONTHS[parseInt(monthMatch[2], 10) - 1]}_title"` : '');

    // An issue ships as one edition per edition language. An article belongs to the
    // edition written in its own language, so the English edition holds English articles
    // only, and a reader never sees another language's text mixed in.
    // The podcast is a series rather than a monthly volume, so it stays a flat list.
    const editions = isPodcast(issue.number)
      ? []
      : EDITION_LANGS
        .map((lang) => {
          const editionArticles = articles
            .map((a) => ({ article: a, display: a.variants.find((v) => v.language === lang) }))
            .filter((entry) => entry.display);
          return { lang, articles: editionArticles };
        })
        .filter((edition) => edition.articles.length);

    const editionBlocks = editions.map(({ lang, articles: editionArticles }) => {
      // Only multi-edition issues need per-edition anchors; a single edition would
      // otherwise duplicate the parent section's id.
      const editionId = editions.length > 1 ? ` id="${esc(anchor)}-${esc(lang)}"` : '';
      const langName = LANG_NAMES[lang] || lang.toUpperCase();
      return `
        <section class="cat-edition"${editionId} data-edition-lang="${esc(lang)}">
          <h3 class="cat-edition-head">
            <span class="cat-edition-flag" aria-hidden="true">${LANG_FLAGS[lang] || '🌐'}</span>
            <span class="cat-edition-lang">${esc(langName)}</span>
            <span class="cat-edition-count"><span data-i18n-count="catalog.count_article" data-count="${editionArticles.length}">${editionArticles.length} articles</span></span>
            ${isPodcast(issue.number) ? '' : `<button type="button" class="cat-btn cat-btn-edition" data-action="download-issue-pdf" data-issue-id="${esc(issue.number)}" data-issue-number="${esc(issue.number)}" data-issue-language="${esc(lang)}" data-issue-title="${esc(heading)} (${esc(langName)})">📥 ${esc(langName)} PDF</button>`}
          </h3>
          <ul class="cat-article-list">
            ${editionArticles.map(({ article, display }) => renderArticle(article, display, c('read_in', 'Read in'), c('all_languages', 'All languages'))).join('')}
          </ul>
        </section>`;
    }).join('');

    const articleList = editions.length
      ? editionBlocks
      : `<ul class="cat-article-list">
          ${articles.map((a) => renderArticle(a, a.base, c('read_in', 'Read in'), c('all_languages', 'All languages'))).join('')}
        </ul>`;

    const languages = [...new Set(articles.flatMap((a) => a.variants.map((v) => v.language)))];
    const editionCount = editions.length
      ? `<span data-i18n-count="catalog.count_edition" data-count="${editions.length}">${editions.length} editions</span> · `
      : '';
    return `
      <section class="cat-issue" id="${esc(anchor)}" data-issue="${esc(issue.number)}">
        <div class="cat-issue-cover">${renderIssueCover({
          number: issue.number,
          title: heading,
          tag: issue.tag || '',
          month: monthMatch ? MONTHS[parseInt(monthMatch[2], 10) - 1] : '',
          i18nKey: `catalog.covers.${isPodcast(issue.number) ? 'podcast' : metaKey}`,
          // The hero is the issue's own name, not an invented headline, and it comes from
          // the same key as the heading below it.
          hero: heading,
          heroI18nKey: isPodcast(issue.number)
            ? 'catalog.podcast_series'
            : (metaKey ? `blog.issue_${MONTHS[parseInt(monthMatch[2], 10) - 1]}_title` : ''),
          fitTexts: {
            ...allCoverTexts(isPodcast(issue.number) ? 'podcast' : metaKey),
            hero: isPodcast(issue.number)
              ? dicts.map((d) => t(d, 'catalog.podcast_series', '')).filter(Boolean)
              : allIssueTitleTexts(MONTHS[parseInt(monthMatch[2], 10) - 1])
          }
        })}</div>
        <header class="cat-issue-head">
          <div>
            <span class="cat-issue-tag">${isPodcast(issue.number)
              ? `<span data-i18n="catalog.podcast">${esc(c('podcast', 'Podcast'))}</span> • <span data-i18n="catalog.special_issue">${esc(c('special_issue', 'Special Issue'))}</span>`
              : `${esc(issue.number)}${issue.tag ? ` • <span data-i18n="catalog.issue_meta.${esc(metaKey)}.tag">${esc(issue.tag)}</span>` : ''}`}</span>
            <h2 class="cat-issue-title"${headingKey}>${esc(heading)}</h2>
            ${issue.vibe ? `<p class="cat-issue-vibe" data-i18n="catalog.issue_meta.${esc(metaKey)}.vibe">${esc(issue.vibe)}</p>` : ''}
          </div>
          <div class="cat-issue-actions">
            <span class="cat-issue-count">${editionCount}<span data-i18n-count="catalog.count_article" data-count="${articles.length}">${articles.length} articles</span> · <span data-i18n-count="catalog.count_language" data-count="${languages.length}">${languages.length} languages</span></span>
            ${isPodcast(issue.number) ? `<a class="cat-btn" href="podcast.html">🎙️ <span data-i18n="catalog.blueprint">${esc(c('blueprint', 'Issue blueprint →'))}</span></a>` : ''}
          </div>
        </header>
        ${articleList}
      </section>`;
  }).join('');

  const navPills = issues.map((issue) => {
    const anchor = isPodcast(issue.number) ? 'podcast-special' : (issue.anchor || 'blueprint');
    const label = isPodcast(issue.number)
      ? c('podcast_series', issue.title || 'Saturday Mistakes')
      : issueTitleFor(issue, enDict);
    const short = isPodcast(issue.number) ? c('podcast', 'Podcast') : issue.number.replace('Vol. ', '');
    const m = /(\d{4})\.(\d{2})/.exec(issue.number || '');
    const labelKey = isPodcast(issue.number) || !m
      ? ''
      : ` data-i18n="blog.issue_${MONTHS[parseInt(m[2], 10) - 1]}_title"`;
    return `<a class="cat-nav-pill" href="#${esc(anchor)}">${esc(short)} · <span${labelKey}>${esc(label)}</span></a>`;
  }).join('');

  const body = sections.trim()
    ? sections
    : `<p class="cat-empty">${esc(c('empty', 'No published issues yet.'))}</p>`;

  // The catalog lists whatever is published, which can reach past December. Deriving the
  // span keeps the document title honest instead of hardcoding a year that goes stale.
  const years = [...new Set(issues
    .map((i) => (/(\d{4})\.\d{2}/.exec(i.number || '') || [])[1])
    .filter(Boolean))].sort();
  const span = !years.length ? '' : (years.length === 1 ? years[0] : `${years[0]}–${years[years.length - 1]}`);
  const titleSuffix = span ? ` | Every ${span} issue and every article` : ' | Every issue and every article';

  const html = `<!DOCTYPE html>
<html lang="en" data-ui-lang="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>COSYmagazine Issue Catalog${esc(titleSuffix)}</title>
  <meta name="description" content="The complete catalog of COSYmagazine issues: every article of every${span ? ` ${span}` : ''} issue, in every language it is published in.">
  <link rel="icon" href="images/logo.png">
  <link rel="canonical" href="${BASE}issues-catalog.html">
  <meta property="og:title" content="COSYmagazine Issue Catalog">
  <meta property="og:description" content="Every article of every COSYmagazine issue, in every language it is published in.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}issues-catalog.html">
  <meta property="og:image" content="${BASE}images/logo.png">
  <meta name="theme-color" content="#FAF7F2">
  <script src="js/theme-init.js"></script>
  <link rel="preload" href="fonts/fraunces-latin-soft-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/commissioner-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/core.css">
  <link rel="stylesheet" href="css/shell.css">
  <link rel="stylesheet" href="css/newsstand.css">
  <link rel="stylesheet" href="css/dark-fixes.css">
  <link rel="stylesheet" href="css/issues-catalog.css">
  <link rel="stylesheet" href="https://cosylanguages.github.io/COSYlanguages/css/ecosystem-strip.css">
</head>
<body class="ns-page cat-page" data-product="editorial">
  <div data-ecosystem-strip data-self="magazine"></div>
  <nav id="cosy-nav"></nav>

  <main class="ns" id="main">
    <header class="ns-head cat-hero">
      <p class="ns-kicker" data-i18n="catalog.kicker">${esc(c('kicker', 'Issue Catalog'))}</p>
      <h1 data-i18n="catalog.title">${esc(c('title', 'Every 2026 issue, in one place.'))}</h1>
      <p class="ns-lede" data-i18n="catalog.lede">${esc(c('lede', ''))}</p>
      <div class="ns-head-links">
        <a class="ns-pill" href="index.html" data-i18n="catalog.back">${esc(c('back', '← Back to Newsstand'))}</a>
        <a class="ns-pill" href="podcast.html">🎙️ <span data-i18n="catalog.podcast">${esc(c('podcast', 'Podcast'))}</span></a>
      </div>
    </header>

    <nav class="cat-nav" aria-label="${esc(c('all_issues', 'All issues'))}">
      ${navPills}
    </nav>

    <p class="cat-summary"><span data-i18n-count="catalog.count_article" data-count="${totalArticles}">${totalArticles} articles</span> · <span data-i18n-count="catalog.count_issue" data-count="${issues.length}">${issues.length} issues</span></p>

    ${body}
  </main>

  <footer id="cosy-footer"></footer>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1" integrity="sha384-YieCqqg9gQufX7+5HcFvCEg/n3KUEdl8/Jb+A6J0npf1mB740VayvwKjTrtCeUoy" crossorigin="anonymous"></script>
  <script src="js/cms-auth.js"></script>
  <script src="js/issue-download.js"></script>
  <script src="js/shell.js"></script>
  <script src="https://cosylanguages.github.io/COSYlanguages/js/ecosystem-strip.js" defer></script>
</body>
</html>
`;

  fs.writeFileSync(OUTPUT, html, 'utf-8');
  console.log(`✅ issues-catalog.html (${issues.length} issues, ${totalArticles} articles)`);
}

if (require.main === module) {
  build().catch((err) => {
    console.error('❌ Failed to build issues catalog:', err);
    process.exit(1);
  });
}

module.exports = { groupArticles, build };
