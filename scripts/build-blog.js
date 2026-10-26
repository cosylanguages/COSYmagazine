#!/usr/bin/env node
/**
 * scripts/build-blog.js
 * Builds static blog post HTML pages as Vogue Gazette editorial spreads
 * and generates blog/posts.json & blog/index.json directly from JSON source files.
 *
 * Usage: node scripts/build-blog.js
 */

const fs = require('fs');
const path = require('path');
let marked;
try {
  const markedModule = require('marked');
  marked = markedModule.marked || markedModule;
} catch (e) {
  // Graceful fallback if marked is not available
}

const { validatePostSchema } = require('./validate-blog-schema.js');
const { generatePodcastRss } = require('./generate-podcast-rss.js');

const BLOG_DIR = path.join(__dirname, '..');
const POSTS_DIR = path.join(BLOG_DIR, 'posts');
const GUIDES_FILE = path.join(BLOG_DIR, 'guides.json');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const INDEX_JSON = path.join(BLOG_DIR, 'index.json');

const DESKS_CATALOG = [
  { key: 'Front Page', i18n_key: 'desk_front_page', icon: '📰', order: 1 },
  { key: 'Saturday Mistakes', i18n_key: 'desk_saturday_mistakes', icon: '🗓️', order: 2 },
  { key: 'COSYtalks', i18n_key: 'desk_cosytalks', icon: '🎙️', order: 3 },
  { key: 'Grammar', i18n_key: 'desk_grammar', icon: '📐', order: 4 },
  { key: 'Words', i18n_key: 'desk_words', icon: '🔤', order: 5 },
  { key: 'Grammar Made Cosy', i18n_key: 'desk_grammar_made_cosy', icon: '📐', order: 6 },
  { key: 'Say It', i18n_key: 'desk_say_it', icon: '🗣️', order: 7 },
  { key: 'Culture &amp; Quotes', i18n_key: 'desk_culture_quotes', icon: '🎭', order: 8 },
  { key: 'Long Reads', i18n_key: 'desk_long_reads', icon: '📖', order: 9 },
  { key: 'Cosy Events', i18n_key: 'desk_cosy_events', icon: '🎉', order: 10 },
  { key: 'The Podcast', i18n_key: 'desk_the_podcast', icon: '🎙️', order: 11 },
  { key: 'Back Issues', i18n_key: 'desk_back_issues', icon: '🗄️', order: 12 },
  { key: 'Reflections', i18n_key: 'desk_reflections', icon: '💭', order: 13 }
];

const DESK_KEY_MAP = {
  'Front Page': 'front_page',
  'Saturday Mistakes': 'saturday_mistakes',
  'COSYtalks': 'cosytalks',
  'Grammar': 'grammar',
  'Words': 'words',
  'Grammar Made Cosy': 'grammar_made_cosy',
  'Say It': 'say_it',
  'Culture &amp; Quotes': 'culture_quotes',
  'Long Reads': 'long_reads',
  'Cosy Events': 'cosy_events',
  'The Podcast': 'the_podcast',
  'Back Issues': 'back_issues',
  'Reflections': 'reflections'
};

const translationsCache = {};
function getTranslationsForLang(lang) {
  if (!translationsCache[lang]) {
    const i18nPath = path.join(__dirname, '..', 'js', 'i18n', `${lang}.json`);
    if (fs.existsSync(i18nPath)) {
      translationsCache[lang] = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'));
    } else {
      // Fallback to English dictionary if specific UI translation dict is not present
      const fallbackPath = path.join(__dirname, '..', 'js', 'i18n', 'en.json');
      translationsCache[lang] = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
    }
  }
  return translationsCache[lang];
}

function tStrict(dict, key, lang) {
  if (!key) throw new Error(`[i18n] Key is required.`);
  const parts = key.split('.');
  let val = dict;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      throw new Error(`[i18n] Missing translation key "${key}" for language "${lang}". Core principle: No translation fallback.`);
    }
  }
  if (typeof val !== 'string' || !val) {
    throw new Error(`[i18n] Missing or empty translation string for key "${key}" in language "${lang}".`);
  }
  return val;
}

const RESERVED_SLUGS = new Set([
  'index',
  'posts',
  'guides'
]);

const LANG_FLAG_MAP = {
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  ru: '🇷🇺',
  el: '🇬🇷',
  es: '🇪🇸',
  de: '🇩🇪',
  pt: '🇵🇹',
  hy: '🇦🇲',
  ka: '🇬🇪',
  tt: '🌐',
  ba: '🌐',
  br: '🌐'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function parseFormattedText(text) {
  if (!text) return '';
  if (/^\s*<[a-zA-Z][\s\S]*>/i.test(text)) {
    return text;
  }
  if (marked && typeof marked.parseInline === 'function') {
    return marked.parseInline(text);
  }
  let html = escapeHtml(text);
  html = html.replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code>$1</code>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\\\*/g, '&#42;');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return html;
}

function getDocumentTitle(title) {
  const fullTitle = `${title} — COSYmagazine`;
  const characters = Array.from(fullTitle);
  let documentTitle = characters.length <= 70
    ? fullTitle
    : `${characters.slice(0, 69).join('').trimEnd()}…`;

  while (documentTitle.length > 70) {
    documentTitle = `${Array.from(documentTitle).slice(0, -2).join('').trimEnd()}…`;
  }
  return documentTitle;
}

function renderBlockToHtml(block, state = { isFirstParagraph: true }) {
  if (!block || typeof block !== 'object') return '';

  switch (block.type) {
    case 'heading': {
      const lvl = Math.min(6, Math.max(1, block.level || 2));
      return `<h${lvl} class="editorial-heading">${parseFormattedText(block.text)}</h${lvl}>`;
    }
    case 'paragraph': {
      const parsedText = parseFormattedText(block.text);
      const isBlockElement = /^\s*<(div|section|aside|blockquote|table|ul|ol|figure)/i.test(parsedText);
      if (isBlockElement) {
        return parsedText;
      }
      if (state.isFirstParagraph) {
        state.isFirstParagraph = false;
        return `<p class="gazette-drop-cap">${parsedText}</p>`;
      }
      return `<p>${parsedText}</p>`;
    }
    case 'list-item': {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = block.items || [];

      // Detect if items are phrase pairs / overused phrase upgrades
      const isUpgradeList = items.some(item =>
        item.includes('Overused') ||
        item.includes('Natural Upgrades') ||
        item.includes('Замены') ||
        item.includes('Согласие') ||
        item.includes('→') ||
        item.includes('↔')
      );

      if (isUpgradeList) {
        const upgradeItemsHtml = items.map(item => {
          const parsed = parseFormattedText(item);
          return `<div class="phrase-upgrade-card">${parsed}</div>`;
        }).join('\n');
        return `<div class="phrase-upgrade-grid">${upgradeItemsHtml}</div>`;
      }

      const itemsHtml = items.map(item => `<li>${parseFormattedText(item)}</li>`).join('\n');
      return `<${tag} class="editorial-list">\n${itemsHtml}\n</${tag}>`;
    }
    case 'table': {
      const headers = block.headers || [];
      const rows = block.rows || [];

      const headersHtml = headers.map(h => `<th>${parseFormattedText(h)}</th>`).join('');
      const rowsHtml = rows.map(row => {
        const cellsHtml = row.map(cell => `<td>${parseFormattedText(cell)}</td>`).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('\n');

      return `
<div class="table-responsive-container">
  <table class="gazette-editorial-table">
    ${headers.length > 0 ? `<thead><tr>${headersHtml}</tr></thead>` : ''}
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</div>`;
    }
    case 'example': {
      return `
<div class="gazette-example-box">
  <span class="example-target">${parseFormattedText(block.targetText)}</span>
  <p class="example-gloss">${parseFormattedText(block.gloss)}</p>
  ${block.context ? `<p class="example-context">Context: ${parseFormattedText(block.context)}</p>` : ''}
</div>`;
    }
    case 'pronunciation': {
      return `
<div class="gazette-pronunciation-card">
  <span class="pronunciation-word">${parseFormattedText(block.word)}</span>
  <span class="pronunciation-ipa">[${escapeHtml(block.ipa)}]</span>
  ${blockAudioUrl(block.audioUrl) ? `<audio controls src="${escapeHtml(blockAudioUrl(block.audioUrl))}"></audio>` : ''}
</div>`;
    }
    case 'pullquote': {
      return `
<blockquote class="gazette-pullquote">
  <p>“${parseFormattedText(block.quote)}”</p>
  ${block.attribution ? `<cite>— ${escapeHtml(block.attribution)}</cite>` : ''}
</blockquote>`;
    }
    case 'image': {
      return `
<figure class="gazette-figure">
  <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" class="gazette-figure-img">
  ${block.caption ? `<figcaption class="gazette-figure-caption">${parseFormattedText(block.caption)}</figcaption>` : ''}
</figure>`;
    }
    case 'quiz': {
      // Interactive: the answer is not revealed until the learner picks (see js/shell.js)
      const optionsHtml = (block.options || []).map((opt, i) => `
        <button type="button" class="quiz-option-btn" data-correct="${i === block.correctIndex ? 'true' : 'false'}">
          <span class="quiz-mark" aria-hidden="true">⚪</span> <span>${parseFormattedText(opt)}</span>
        </button>
      `).join('');
      return `
<div class="gazette-quiz-card" data-quiz>
  <h4 class="quiz-question">❓ ${parseFormattedText(block.question)}</h4>
  <div class="quiz-options-list" role="group">${optionsHtml}</div>
  ${block.explanation ? `<p class="quiz-explanation" hidden aria-live="polite">${parseFormattedText(block.explanation)}</p>` : ''}
</div>`;
    }
    case 'culture-bite': {
      return `
<aside class="gazette-marginalia">
  <div class="gazette-marginalia-title">📌 ${parseFormattedText(block.title)}</div>
  <p class="marginalia-body">${parseFormattedText(block.content)}</p>
</aside>`;
    }
    case 'quote-wall': {
      const quotesHtml = (block.quotes || []).map(q => `
        <div class="quote-tile">
          <p class="quote-tile-text">“${parseFormattedText(q.quote)}”</p>
          <div class="quote-tile-author">— ${escapeHtml(q.author)}</div>
        </div>
      `).join('');
      return `<div class="format-quote-wall">${quotesHtml}</div>`;
    }
    case 'links': {
      return `
<div class="gazette-link-block">
  <a href="${escapeHtml(block.url)}" class="read-more-link">${parseFormattedText(block.label)} ↗</a>
</div>`;
    }
    default:
      return '';
  }
}

function renderLanguageSwitcherHtml(currentPost, allPosts, langDict, lang) {
  const baseSlug = currentPost.translationOf || (currentPost.slug.replace(/-(fr|it|ru|el|tt|ba|br|pt|es|de|hy|ka|cv|en)$/, ''));
  const variants = allPosts.filter(p => p.slug === baseSlug || p.translationOf === baseSlug);

  if (variants.length <= 1) return '';

  const linksHtml = variants.map(v => {
    const flag = LANG_FLAG_MAP[v.language] || '🌐';
    const langCode = v.language.toUpperCase();
    if (v.slug === currentPost.slug) {
      return `<span class="lang-switcher-active">${flag} ${langCode}</span>`;
    }
    return `<a href="${v.slug}.html" class="lang-switcher-link">${flag} ${langCode}</a>`;
  }).join(' ');

  const readInLabel = (langDict && langDict.blog && langDict.blog.read_in) ? langDict.blog.read_in : 'Read in';

  return `
<div class="language-switcher-bar">
  <span class="lang-switcher-label" data-i18n="blog.read_in">${escapeHtml(readInLabel)}</span>
  ${linksHtml}
</div>`;
}

function blockAudioUrl(raw) {
  if (!raw) return null;
  if (/^https?:/.test(raw)) return raw;
  const rel = String(raw).replace(/^(\.\.\/)+/, '').replace(/^audio\/blog\//, 'audio/');
  return fs.existsSync(path.join(BLOG_DIR, rel)) ? rel : null;
}

// Audio is only linked when the file really exists in this repo (or is an absolute URL).
function resolveAudioUrl(post) {
  const raw = (post.podcast && post.podcast.audioUrl) || null;
  if (!raw) return null;
  if (/^https?:/.test(raw)) return raw;
  const rel = raw.replace(/^(\.\.\/)+/, '').replace(/^audio\/blog\//, 'audio/');
  return fs.existsSync(path.join(BLOG_DIR, rel)) ? rel : null;
}

function renderStaticPodcastBoxHtml(post, langDict, lang) {
  const podcast = post.podcast || {};
  const episodeNum = podcast.episode || 1;
  const audioUrl = resolveAudioUrl(post);

  let iframeUrl = podcast.iframeUrl || null;
  if (!iframeUrl && podcast.externalUrl && podcast.externalUrl.includes('spotify.com/episode/')) {
    const epIdMatch = podcast.externalUrl.match(/episode\/([a-zA-Z0-9]+)/);
    if (epIdMatch && epIdMatch[1]) {
      iframeUrl = `https://open.spotify.com/embed/episode/${epIdMatch[1]}?utm_source=generator`;
    }
  }

  const epText = `${tStrict(langDict, 'blog.episode', lang)} ${episodeNum}`;
  const noticeText = tStrict(langDict, 'blog.podcast_in_production', lang);
  const stageViewText = tStrict(langDict, 'blog.stage_view', lang);
  const scriptPromptText = tStrict(langDict, 'blog.script_teleprompter', lang);

  let playerHtml = '';
  if (iframeUrl) {
    playerHtml = `
      <div class="podcast-iframe-player-wrapper" style="margin-top: 1rem; border-radius: 12px; overflow: hidden;">
        <iframe src="${escapeHtml(iframeUrl)}" style="width: 100%; border: none;" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Podcast Episode Player"></iframe>
      </div>
    `;
  } else if (audioUrl) {
    playerHtml = `
      <div class="podcast-audio-player-wrapper">
        <audio class="podcast-audio-element" controls preload="metadata" src="${escapeHtml(audioUrl)}">
          Your browser does not support the audio element.
        </audio>
      </div>
    `;
  } else {
    playerHtml = `
      <div class="podcast-audio-notice">
        <span data-i18n="blog.podcast_in_production">${escapeHtml(noticeText)}</span>
      </div>
    `;
  }

  const externalBtn = podcast.externalUrl ? `<a href="${escapeHtml(podcast.externalUrl)}" target="_blank" rel="noopener" class="podcast-action-link" style="background: #1db954; color: #ffffff;" title="Listen on Spotify">🎧 Spotify</a>` : '';
  const appleBtn = podcast.appleUrl ? `<a href="${escapeHtml(podcast.appleUrl)}" target="_blank" rel="noopener" class="podcast-action-link" style="background: #9933ff; color: #ffffff;" title="Listen on Apple Podcasts">🍏 Apple Podcasts</a>` : '';

  return `
<section class="cosy-podcast-box" aria-label="Podcast Episode Controls">
  <div class="podcast-box-header">
    <div class="podcast-ep-meta">
      <span class="podcast-ep-badge">${escapeHtml(epText)}</span>
      <span class="podcast-show-name">cosylanguages / такиеязыки</span>
    </div>
    <div class="podcast-quick-links">
      ${externalBtn}
      ${appleBtn}
      <a href="?stage=1" class="podcast-action-link" title="Open in 16:9 Animated Presentation Deck" data-i18n="blog.stage_view">${escapeHtml(stageViewText)}</a>
      <a href="?script=1" class="podcast-action-link" title="Open in Teleprompter Script Mode" data-i18n="blog.script_teleprompter">${escapeHtml(scriptPromptText)}</a>
    </div>
  </div>

  <div class="podcast-box-body">
    <div class="podcast-title-row">
      <h3 class="podcast-box-title">🎙️ ${escapeHtml(post.title || 'COSY Podcast Episode')}</h3>
      <p class="podcast-box-dek">${escapeHtml(post.dek || post.summary || '')}</p>
    </div>

    ${playerHtml}
  </div>
</section>`;
}

async function buildBlog() {
  console.log('🚀 Starting COSYlanguages Vogue Gazette Build Pipeline...');

  // Dynamically import procedural SVG cover generator module
  let artModule;
  try {
    artModule = await import('./js/art/generator.js');
  } catch (e) {
    try {
      artModule = await import('../js/art/generator.js');
    } catch (err) {
      console.warn('⚠️ Could not import art generator module:', err.message);
    }
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // 1. Load Guides metadata
  let guides = [];
  if (fs.existsSync(GUIDES_FILE)) {
    try {
      guides = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf-8'));
    } catch (e) {
      console.error('❌ Failed to parse blog/guides.json:', e.message);
      process.exit(1);
    }
  }

  const guideSlugs = new Set(guides.map(g => g.slug));

  // 2. Load JSON post files from blog/posts/*.json
  const jsonFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
  const allPosts = [];
  const postSlugs = new Set();
  const errors = [];
  const issuesSet = new Map();

  jsonFiles.forEach(file => {
    const filePath = path.join(POSTS_DIR, file);
    let postData;
    try {
      postData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      errors.push(`[${file}] JSON Parse Error: ${e.message}`);
      return;
    }

    const valErrors = validatePostSchema(postData, file);
    if (valErrors.length > 0) {
      errors.push(...valErrors);
      return;
    }

    const slug = postData.slug;
    if (RESERVED_SLUGS.has(slug) || guideSlugs.has(slug)) {
      errors.push(`[${file}] Slug "${slug}" collides with a reserved system page or guide slug.`);
    }
    if (postSlugs.has(slug)) {
      errors.push(`[${file}] Duplicate slug "${slug}" detected.`);
    }
    postSlugs.add(slug);

    if (postData.issue && postData.issue.number) {
      if (postData.issue.number.includes('August')) postData.issue.number = 'Vol. 2026.08';
      issuesSet.set(postData.issue.number, {
        number: postData.issue.number,
        title: postData.issue.title
      });
    }

    allPosts.push(postData);
  });

  if (errors.length > 0) {
    console.error('❌ Blog Schema & Post Validation Failed:');
    errors.forEach(err => console.error('  - ' + err));
    process.exit(1);
  }

  // 3. Filter published posts
  const publishedPosts = allPosts.filter(p => !p.draft);
  console.log(`📝 Processing ${publishedPosts.length} published post(s) (${allPosts.length - publishedPosts.length} draft(s) skipped)...`);

  // Drafts must not stay online from an earlier build
  allPosts.filter(p => p.draft).forEach(p => fs.rmSync(path.join(BLOG_DIR, `${p.slug}.html`), { force: true }));

  // 4. Generate HTML pages for published posts
  publishedPosts.forEach(post => {
    const htmlPath = path.join(BLOG_DIR, `${post.slug}.html`);
    const lang = post.language || 'en';

    const langDict = getTranslationsForLang(lang);

    // Render blocks statefully to apply drop cap on the first paragraph
    const blockState = { isFirstParagraph: true };
    const renderedBlocksHtml = (post.blocks || []).map(b => renderBlockToHtml(b, blockState)).join('\n');
    const langSwitcherHtml = renderLanguageSwitcherHtml(post, publishedPosts, langDict, lang);

    // Inlined SVG cover art generated at build time
    let coverSvgHtml = '';
    if (artModule && typeof artModule.renderCover === 'function') {
      coverSvgHtml = artModule.renderCover(post, { width: 1200, height: 600, showText: false });
    }

    const authorName = 'JY DM';
    const format = post.format || 'essay';
    const desk = post.desk || 'Words';
    const kicker = post.kicker || desk;
    const issueNum = post.issue?.number || 'Vol. 2026.09';

    // Localize Issue Title per post language (No English fallback)
    let issueTitleKey = null;
    if (post.issue?.number === 'Vol. 2026.08' || post.issue?.number === 'Vol. 2026 — August Issue') issueTitleKey = 'blog.issue_august_title';
    else if (post.issue?.number === 'Vol. 2026.09' || post.issue?.number === 'Vol. 2026 — September Issue') issueTitleKey = 'blog.issue_september_title';
    else if (post.issue?.number === 'Vol. 2026.10' || post.issue?.number === 'Vol. 2026 — October Issue') issueTitleKey = 'blog.issue_october_title';
    else if (post.issue?.number === 'Vol. 2026.11' || post.issue?.number === 'Vol. 2026 — November Issue') issueTitleKey = 'blog.issue_november_title';
    else if (post.issue?.number === 'Vol. 2026.12' || post.issue?.number === 'Vol. 2026 — December Issue') issueTitleKey = 'blog.issue_december_title';

    const issueTitle = issueTitleKey
      ? tStrict(langDict, issueTitleKey, lang)
      : (post.issue?.title || 'COSY Editorial');

    const palette = post.artDirection?.palette || ['#0d9488', '#faf7f2', '#1e293b', '#d69e2e'];
    const fontDisplay = post.artDirection?.fonts?.display || 'Fraunces';
    const fontText = post.artDirection?.fonts?.text || 'DM Sans';
    const fontAccent = post.artDirection?.fonts?.accent || 'Fraunces';

    const staticPodcastBoxHtml = (post.podcast || post.audio_podcast) ? renderStaticPodcastBoxHtml(post, langDict, lang) : '';

    const backToHubText = tStrict(langDict, 'blog.back_to_hub', lang);
    const scriptModeText = tStrict(langDict, 'blog.script_mode', lang);
    const stageModeText = tStrict(langDict, 'blog.stage_mode', lang);
    const writtenByText = tStrict(langDict, 'blog.written_by', lang);
    const minReadText = tStrict(langDict, 'blog.min_read', lang);
    const returnToIndexText = tStrict(langDict, 'blog.return_to_index', lang);

    const deskKey = DESK_KEY_MAP[desk];
    const translatedDesk = deskKey ? tStrict(langDict, 'desk.' + deskKey, lang) : desk;

    const kickerKey = DESK_KEY_MAP[kicker];
    const translatedKicker = kickerKey ? tStrict(langDict, 'desk.' + kickerKey, lang) : kicker;

    const epBadgeText = post.podcast ? `${tStrict(langDict, 'blog.episode', lang)} ${post.podcast.episode}` : '';

    const founderDeckTitleText = tStrict(langDict, 'blog.founder_deck_title', lang);
    const expandDeckText = tStrict(langDict, 'blog.expand_deck', lang);
    const scriptViewModeText = tStrict(langDict, 'blog.teleprompter_script_view_mode', lang);
    const stageViewModeText = tStrict(langDict, 'blog.stage_view_mode', lang);
    const pageXofYText = tStrict(langDict, 'blog.page_x_of_y', lang).replace('{current}', '1').replace('{total}', '1');

    const postForScript = {
      ...post,
      podcast: { ...(post.podcast || {}), audioUrl: resolveAudioUrl(post) },
      audio_podcast: false,
      coverSvg: coverSvgHtml
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="${escapeHtml(post.language)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(getDocumentTitle(post.title))}</title>
    <meta name="description" content="${escapeHtml(post.dek)}">
    <link rel="canonical" href="https://cosylanguages.github.io/COSYblog/${escapeHtml(post.slug)}.html">
    <meta property="og:title" content="${escapeHtml(getDocumentTitle(post.title))}">
    <meta property="og:description" content="${escapeHtml(post.dek)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://cosylanguages.github.io/COSYblog/${escapeHtml(post.slug)}.html">
    <link rel="icon" href="images/logo.png">
    <meta name="theme-color" content="${escapeHtml(palette[1] || '#faf7f2')}">
    <script src="js/theme-init.js"></script>
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/blog.css">
    <link rel="stylesheet" href="css/tokens.css">
    <link rel="stylesheet" href="css/magazine-templates.css">
    <link rel="stylesheet" href="css/dark-fixes.css">
    <link rel="stylesheet" href="css/stage.css">
    <link rel="stylesheet" href="css/shell.css">

    <style>
      :root {
        --post-palette-accent: ${escapeHtml(palette[0] || '#0d9488')};
        --post-palette-bg: ${escapeHtml(palette[1] || '#faf7f2')};
        --post-palette-text: ${escapeHtml(palette[2] || '#1e293b')};
        --post-palette-highlight: ${escapeHtml(palette[3] || palette[0] || '#d69e2e')};
        --post-font-display: '${escapeHtml(fontDisplay)}', 'Lora', Georgia, serif;
        --post-font-body: '${escapeHtml(fontText)}', -apple-system, BlinkMacSystemFont, sans-serif;
        --post-font-accent: '${escapeHtml(fontAccent)}', Georgia, serif;
      }
    </style>
</head>
<body class="blog-page gazette-body">

    <nav id="cosy-nav"></nav>

    <!-- Interactive 16:9 Presentation Stage Root (Activated via ?stage=1 or ?script=1) -->
    <div id="gazette-stage-root"></div>

    <div class="gazette-wrapper gazette-container format-${escapeHtml(format)}">

        <!-- Vogue Gazette Slim Masthead -->
        <header class="gazette-masthead">
            <div class="gazette-masthead-top">
                <div class="gazette-masthead-left">
                    <a href="https://cosylanguages.github.io/COSYlanguages/" class="gazette-home-link" title="COSYlanguages Home">🏡 Home</a>
                    <span class="gazette-link-sep">•</span>
                    <a href="index.html" class="gazette-back-link" data-i18n="blog.back_to_hub">${escapeHtml(backToHubText)}</a>
                </div>
                <p class="gazette-masthead-title">COSYMAGAZINE</p>
                <div class="gazette-masthead-links">
                    <a href="?script=1" class="gazette-mode-link" title="Open Teleprompter Script View Mode" data-i18n="blog.script_mode">${escapeHtml(scriptModeText)}</a>
                    <a href="?stage=1" class="gazette-mode-link" title="Open 16:9 Stage View Mode" data-i18n="blog.stage_mode">${escapeHtml(stageModeText)}</a>
                </div>
            </div>
            <div class="gazette-masthead-meta">
                <span>${escapeHtml(issueNum)} • ${escapeHtml(issueTitle)}</span>
                <span class="stamp-sticker" ${deskKey ? `data-i18n="desk.${deskKey}"` : ''}>${escapeHtml(translatedDesk)}</span>
                <span>${escapeHtml(post.date)}</span>
            </div>
        </header>

        <!-- Full-Bleed Inlined Cover Art -->
        <div class="gazette-cover-hero">
            ${coverSvgHtml ? `<div class="gazette-cover-art-container">${coverSvgHtml}</div>` : ''}

            <div class="gazette-header-content">
                <span class="editorial-kicker" ${kickerKey ? `data-i18n="desk.${kickerKey}"` : ''}>${escapeHtml(translatedKicker)}</span>
                <h1 class="cover-headline">${escapeHtml(post.title)}</h1>
                <p class="editorial-dek">${escapeHtml(post.dek)}</p>

                ${langSwitcherHtml}

                <div class="post-byline-row">
                    <div class="byline-author">
                        <span class="post-author-avatar">J</span>
                        <span><span data-i18n="blog.written_by">${escapeHtml(writtenByText)}</span> <strong>${escapeHtml(authorName)}</strong></span>
                    </div>
                    <div class="byline-meta">
                        <span>📅 ${escapeHtml(post.date)}</span>
                        <span>⏱️ ${post.readingTime} <span data-i18n="blog.min_read">${escapeHtml(minReadText)}</span></span>
                        <span class="stamp-sticker">${escapeHtml(post.level || 'A0–B2')}</span>
                        ${post.podcast ? `<span class="stamp-sticker">${escapeHtml(epBadgeText)}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Gazette Content Spread -->
        <main class="gazette-reading-view">
            <article class="post-full-content gazette-article">
                ${renderedBlocksHtml}
            </article>

            ${(post.podcast || post.audio_podcast) ? `
            <div id="podcast-box-container" class="podcast-box-wrapper" style="margin-top: 2.5rem;">
                ${staticPodcastBoxHtml}
            </div>` : ''}

            ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags-row" style="margin-top: 2rem;">
                ${post.tags.map(t => `<span class="post-tag-chip">#${escapeHtml(t)}</span>`).join(' ')}
            </div>` : ''}

            <div class="gazette-folio">
                <span>🗞️ COSYmagazine • ${escapeHtml(issueNum)}</span>
                <a href="index.html" class="read-more-link" data-i18n="blog.return_to_index">${escapeHtml(returnToIndexText)}</a>
                <span>${escapeHtml(pageXofYText)}</span>
            </div>
        </main>

    </div>

<footer id="cosy-footer"></footer>

    <script src="js/shell.js"></script>
    <script src="js/flipbook.js"></script>
    <script type="module">
      import { PodcastBoxComponent } from './js/podcast-box.js';

      const postData = ${JSON.stringify(postForScript).replace(/</g, '\\u003c')};

      async function initStageOrPodcast() {
        const urlParams = new URLSearchParams(window.location.search);
        const isStage = urlParams.get('stage') === '1';
        const isScript = urlParams.get('script') === '1';

        if (isStage || isScript) {
          const { StageController } = await import('./js/stage/stage.js');
          new StageController(document.getElementById('gazette-stage-root'), postData);
        } else {
          const pBox = document.getElementById('podcast-box-container');
          if (pBox && (postData.podcast || postData.audio_podcast)) {
            new PodcastBoxComponent({ container: pBox, post: postData });
          }
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        initStageOrPodcast();

        document.querySelectorAll('a[href*="?stage=1"], a[href*="?script=1"]').forEach(link => {
          link.addEventListener('click', async (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('?')) {
              e.preventDefault();
              history.pushState(null, '', href);
              const { StageController } = await import('./js/stage/stage.js');
              new StageController(document.getElementById('gazette-stage-root'), postData);
            }
          });
        });
      });
    </script>
</body>
</html>
`;

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`  ✓ Generated ${post.slug}.html`);
  });

  // 5. Generate blog/posts.json
  const postsJsonList = [
    ...publishedPosts.map(p => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      updated: p.updated || null,
      category: p.desk || 'Words',
      summary: p.dek || '',
      author: 'JY DM',
      reading_time: p.readingTime || 5,
      cover_image: p.artDirection?.coverOverride || '',
      tags: p.tags || [],
      featured: Boolean(p.featured),
      type: 'post',
      url: `${p.slug}.html`,
      issue_volume: p.issue?.number || 'Vol. 2026.08',
      issue_title: p.issue?.title || 'COSY Editorial',
      cefr_level: p.level || 'A0–B2',
      vibe: 'Editorial Vibe',
      founder_notes: `Target-language guidance by JY DM for COSYmagazine ${p.issue?.title || 'COSY Editorial'} edition.`,
      audio_podcast: Boolean(p.podcast?.audioUrl),
      artDirection: p.artDirection
    })),
    ...guides.map(g => ({
      slug: g.slug,
      title: g.title,
      date: g.date,
      updated: g.updated || null,
      category: g.category || 'Resource List',
      summary: g.summary,
      author: g.author || 'JY DM',
      reading_time: g.reading_time || 10,
      cover_image: g.cover_image || '',
      tags: g.tags || [],
      featured: Boolean(g.featured),
      type: 'guide',
      url: g.url || `${g.slug}.html`,
      issue_volume: g.issue_volume || 'Vol. 2026 — August Issue',
      issue_title: g.issue_title || 'Get ready for school',
      cefr_level: g.cefr_level || 'A0–A1 / A2',
      vibe: g.vibe || 'Curriculum Vibe',
      founder_notes: g.founder_notes || 'A0–A1 / A2 target-language guidance by JY DM for COSYmagazine Get ready for school edition.',
      audio_podcast: Boolean(g.audio_podcast !== false)
    }))
  ];

  postsJsonList.sort((a, b) => {
    const dA = new Date(a.date).getTime() || 0;
    const dB = new Date(b.date).getTime() || 0;
    return dB - dA;
  });

  fs.writeFileSync(POSTS_JSON, JSON.stringify(postsJsonList), 'utf-8');
  console.log(`✅ Successfully generated blog/posts.json (${postsJsonList.length} total entries).`);

  // 6. Generate blog/index.json (including posts and guides)
  const guidesForIndex = guides.map(g => ({
    id: `guide-${g.slug}`,
    slug: g.slug,
    language: 'en',
    desk: 'Long Reads',
    format: 'essay',
    level: g.cefr_level || 'A0–A1 / A2',
    issue: {
      number: (g.issue_volume && g.issue_volume.includes('August')) ? 'Vol. 2026.08' : (g.issue_volume || 'Vol. 2026.08'),
      title: g.issue_title || 'Get ready for school'
    },
    date: g.date || '2026-08-01',
    title: g.title,
    kicker: 'GUIDE',
    dek: g.summary || '',
    tags: g.tags || [],
    readingTime: g.reading_time || 10,
    podcast: { episode: 1, audioUrl: null },
    artDirection: {
      palette: ['#0d9488', '#faf7f2', '#1e293b'],
      fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
      layout: 'magazine-spread',
      motif: 'editorial-stars',
      seed: g.slug,
      coverOverride: g.cover_image || null
    },
    blocks: [
      {
        type: 'paragraph',
        text: g.summary || g.title
      }
    ]
  }));

  const indexPostsList = [
    ...publishedPosts,
    ...guidesForIndex
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const issuesList = Array.from(issuesSet.values());
  const indexOutput = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    stats: {
      totalPosts: indexPostsList.length,
      totalDesks: DESKS_CATALOG.length,
      totalIssues: issuesList.length
    },
    desks: DESKS_CATALOG,
    issues: issuesList,
    posts: indexPostsList.map(({ blocks, ...meta }) => meta)
  };

  fs.writeFileSync(INDEX_JSON, JSON.stringify(indexOutput), 'utf-8');
  console.log(`✅ Successfully generated blog/index.json (${indexPostsList.length} total posts/guides, ${DESKS_CATALOG.length} desks).`);

  // 7. Generate podcast RSS feed
  generatePodcastRss();
}

if (require.main === module) {
  buildBlog();
}

module.exports = { buildBlog };
