#!/usr/bin/env node
/**
 * scripts/build/build-blog.js
 * Builds static blog post HTML pages as Vogue Gazette editorial spreads
 * and generates posts.json & index.json directly from JSON source files.
 *
 * Usage: node scripts/build/build-blog.js
 */

const fs = require('fs');
const path = require('path');

const { validatePostSchema } = require('./validate-blog-schema.js');
const { generatePodcastRss } = require('./generate-podcast-rss.js');
const { escapeHtml } = require('./lib/text.js');
const { getTranslationsForLang, tStrict } = require('./lib/i18n.js');
const { renderBlockToHtml } = require('./lib/blocks.js');
const {
  resolveAudioUrl,
  makeHasPlayer,
  renderStaticPodcastBoxHtml
} = require('./lib/audio.js');
const { renderPostPage } = require('./lib/post-page.js');
const { renderLanguageSwitcherHtml, uniqueLanguageVariants, baseSlugFor } = require('./lib/language-switcher.js');
const {
  DESKS_CATALOG,
  DESK_KEY_MAP,
  buildPostsCatalog,
  buildIndexFeed
} = require('./lib/catalog.js');
const {
  MONTH_INDEX,
  normalizeIssueNumber,
  issueMetaFor,
  issueVolumeLabel
} = require('./lib/issues.js');

const { listPostFiles } = require('./lib/content-paths.js');

const BLOG_DIR = path.join(__dirname, '..', '..');
const GUIDES_FILE = path.join(BLOG_DIR, 'guides.json');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const INDEX_JSON = path.join(BLOG_DIR, 'index.json');

const RESERVED_SLUGS = new Set([
  'index',
  'posts',
  'guides'
]);

async function buildBlog() {
  console.log('🚀 Starting COSYlanguages Vogue Gazette Build Pipeline...');

  // Shared podcast embed resolver (same module the browser uses)
  let podcastEmbed = { resolvePodcastEmbed: () => null };
  try {
    podcastEmbed = await import(require('url').pathToFileURL(path.join(__dirname, '..', '..', 'js', 'podcast-embed.js')).href);
  } catch (e) {
    console.warn('⚠️ Could not import podcast embed resolver:', e.message);
  }
  const hasPlayer = makeHasPlayer(podcastEmbed);

  // Dynamically import procedural SVG cover generator module
  let artModule;
  try {
    artModule = await import('../../js/art/generator.js');
  } catch (e) {
    console.warn('⚠️ Could not import art generator module:', e.message);
  }

  // 1. Load Guides metadata
  let guides = [];
  if (fs.existsSync(GUIDES_FILE)) {
    try {
      guides = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf-8'));
    } catch (e) {
      console.error('❌ Failed to parse guides.json:', e.message);
      process.exit(1);
    }
  }

  const guideSlugs = new Set(guides.map(g => g.slug));

  // 2. Load JSON post sources from content/issues/** and content/website/**
  const jsonFiles = listPostFiles();
  const allPosts = [];
  const postSlugs = new Set();
  const errors = [];
  const issuesSet = new Map();

  jsonFiles.forEach(filePath => {
    const file = path.relative(BLOG_DIR, filePath);
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
      postData.issue.number = normalizeIssueNumber(postData.issue.number);
      const meta = issueMetaFor(postData.issue.number);
      issuesSet.set(postData.issue.number, {
        number: postData.issue.number,
        title: postData.issue.title,
        tag: meta.tag,
        month: meta.month,
        anchor: meta.anchor,
        vibe: meta.vibe
      });
    }

    allPosts.push(postData);
  });

  if (errors.length > 0) {
    console.error('❌ Blog Schema & Post Validation Failed:');
    errors.forEach(err => console.error('  - ' + err));
    process.exit(1);
  }

  // 3. Filter published posts (drafts and posts scheduled for a later date are held back)
  const { isLive, isScheduledForFuture, todayUTC } = require('./post-visibility');
  const today = todayUTC();
  const publishedPosts = allPosts.filter(p => isLive(p, today));
  const scheduledPosts = allPosts.filter(p => isScheduledForFuture(p, today));
  console.log(`📝 Processing ${publishedPosts.length} published post(s) (${allPosts.length - publishedPosts.length} held back: ${allPosts.filter(p => p.draft).length} draft(s), ${scheduledPosts.length} scheduled)...`);
  scheduledPosts.forEach(p => console.log(`   ⏰ ${p.slug} goes live on ${p.publishAt}`));

  // Held-back posts must not stay online from an earlier build
  allPosts.filter(p => !isLive(p, today)).forEach(p => fs.rmSync(path.join(BLOG_DIR, `${p.slug}.html`), { force: true }));

  // 4. Generate HTML pages for published posts
  publishedPosts.forEach(post => {
    const htmlPath = path.join(BLOG_DIR, `${post.slug}.html`);
    const lang = post.language || 'en';

    const langDict = getTranslationsForLang(lang);

    // Render blocks statefully to apply drop cap on the first paragraph
    const blockState = { isFirstParagraph: true, slug: post.slug, lang };
    // Print-only blocks (medium: "print") never appear on the website
    const renderedBlocksHtml = (post.blocks || []).filter(b => b.medium !== 'print').map(b => renderBlockToHtml(b, blockState)).join('\n');
    const langSwitcherHtml = renderLanguageSwitcherHtml(post, publishedPosts, langDict);
    const baseSlug = baseSlugFor(post);
    const alternates = uniqueLanguageVariants(
      publishedPosts.filter(p => p.slug === baseSlug || p.translationOf === baseSlug),
      post.slug
    ).map(({ language, slug }) => ({ language, slug }));

    // Inlined SVG cover art generated at build time
    let coverSvgHtml = '';
    if (artModule && typeof artModule.renderCover === 'function') {
      coverSvgHtml = artModule.renderCover(post, { width: 1200, height: 600, showText: false });
    }

    const authorName = 'JY DM';
    const format = post.format || 'essay';
    const desk = post.desk || 'Words';
    const kicker = post.kicker || desk;
    // Standalone articles (no issue) are never filed under a volume.
    // The volume is normalised and rendered without language-specific words
    // (or with a translated name for special editions) so no English leaks
    // onto non-English pages.
    const issueNum = issueVolumeLabel(post, langDict, lang);

    // Localize Issue Title per post language (No English fallback)
    const issueMonth = (String(post.issue?.number || '').match(/(\d{4})\.(\d{2})/) || [])[2];
    const issueMonthName = issueMonth
      ? Object.keys(MONTH_INDEX).find(k => MONTH_INDEX[k] === issueMonth)
      : null;
    const issueTitleKey = issueMonthName ? `blog.issue_${issueMonthName}_title` : null;

    const issueTitle = (issueTitleKey && langDict.blog && langDict.blog[`issue_${issueMonthName}_title`] !== undefined)
      ? tStrict(langDict, issueTitleKey, lang)
      : (post.issue?.title || 'COSY Editorial');

    const palette = post.artDirection?.palette || ['#0d9488', '#faf7f2', '#1e293b', '#d69e2e'];
    const fontDisplay = post.artDirection?.fonts?.display || 'Fraunces';
    const fontText = post.artDirection?.fonts?.text || 'DM Sans';
    const fontAccent = post.artDirection?.fonts?.accent || 'Fraunces';

    const playerReady = hasPlayer(post);
    if (post.podcast && !playerReady) {
      console.warn(`  ⚠️ ${post.slug}: podcast hidden (no working embed/audio; add podcast.externalUrl or podcast.iframeUrl)`);
    }
    const staticPodcastBoxHtml = playerReady ? renderStaticPodcastBoxHtml(post, langDict, lang, podcastEmbed) : '';

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

    const epBadgeText = playerReady ? `${tStrict(langDict, 'blog.episode', lang)} ${post.podcast.episode}` : '';

    const founderDeckTitleText = tStrict(langDict, 'blog.founder_deck_title', lang);
    const expandDeckText = tStrict(langDict, 'blog.expand_deck', lang);
    const scriptViewModeText = tStrict(langDict, 'blog.teleprompter_script_view_mode', lang);
    const stageViewModeText = tStrict(langDict, 'blog.stage_view_mode', lang);
    const pageXofYText = tStrict(langDict, 'blog.page_x_of_y', lang).replace('{current}', '1').replace('{total}', '1');

    const postForScript = {
      ...post,
      blocks: (post.blocks || []).filter(b => !b.webOnly && b.medium !== 'print'),
      podcast: { ...(post.podcast || {}), audioUrl: resolveAudioUrl(post) },
      audio_podcast: false,
      coverSvg: coverSvgHtml
    };

    const htmlContent = renderPostPage({
      alternates, authorName, backToHubText, coverSvgHtml, deskKey, epBadgeText, fontAccent,
      fontDisplay, fontText, format, issueNum, issueTitle, kickerKey,
      langSwitcherHtml, minReadText, pageXofYText, palette, playerReady, post,
      postForScript, renderedBlocksHtml, returnToIndexText, scriptModeText,
      stageModeText, staticPodcastBoxHtml, translatedDesk, translatedKicker,
      writtenByText
    });

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`  ✓ Generated ${post.slug}.html`);
  });

  // 5. Generate posts.json (flat catalog for js/editor.js)
  const postsJsonList = buildPostsCatalog(publishedPosts, guides, hasPlayer);
  fs.writeFileSync(POSTS_JSON, JSON.stringify(postsJsonList), 'utf-8');
  console.log(`✅ Successfully generated posts.json (${postsJsonList.length} total entries).`);

  // 6. Generate index.json (newsstand feed: posts and guides)
  const indexOutput = buildIndexFeed({
    publishedPosts,
    guides,
    issues: issuesSet,
    hasPlayer
  });
  fs.writeFileSync(INDEX_JSON, JSON.stringify(indexOutput), 'utf-8');
  console.log(`✅ Successfully generated index.json (${indexOutput.stats.totalPosts} total posts/guides, ${DESKS_CATALOG.length} desks).`);

  // 7. Generate podcast RSS feed
  generatePodcastRss();
}

if (require.main === module) {
  buildBlog();
}

module.exports = { buildBlog };
