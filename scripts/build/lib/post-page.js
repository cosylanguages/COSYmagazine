/**
 * scripts/build/lib/post-page.js
 * Renders one article page: the Vogue Gazette spread served at <slug>.html.
 *
 * Pure: everything the page needs arrives in `ctx`, so the template can be read
 * without chasing module-level state. build-blog.js assembles `ctx`.
 */

const { escapeHtml, getDocumentTitle, getMetaDescription } = require('./text.js');
const { issueKey } = require('./issues.js');

function renderPostPage(ctx) {
  const {
    alternates = [], authorName, backToHubText, coverSvgHtml, deskKey, epBadgeText, fontAccent,
    fontDisplay, fontText, format, issueNum, issueTitle, kickerKey,
    langSwitcherHtml, minReadText, pageXofYText, palette, playerReady, post,
    postForScript, renderedBlocksHtml, returnToIndexText, scriptModeText,
    socialImage = 'images/logo.png', socialImageType = 'image/png',
    socialImageWidth = 1500, socialImageHeight = 1500,
    socialImageAlt = 'COSYmagazine', twitterCard = 'summary',
    stageModeText, staticPodcastBoxHtml, translatedDesk, translatedKicker,
    writtenByText
  } = ctx;

  const alternatesHtml = alternates.length > 1
    ? `\n${alternates.map((alt) => `    <link rel="alternate" hreflang="${escapeHtml(alt.language)}" href="https://cosylanguages.github.io/COSYmagazine/${escapeHtml(alt.slug)}.html">`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="https://cosylanguages.github.io/COSYmagazine/${escapeHtml((alternates.find((alt) => alt.language === 'en') || alternates[0]).slug)}.html">`
    : '';
  const metaDescription = getMetaDescription(post.dek);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(post.language)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(getDocumentTitle(post.title))}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <link rel="canonical" href="https://cosylanguages.github.io/COSYmagazine/${escapeHtml(post.slug)}.html">${alternatesHtml}
    <meta property="og:site_name" content="COSYmagazine">
    <meta property="og:title" content="${escapeHtml(getDocumentTitle(post.title))}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://cosylanguages.github.io/COSYmagazine/${escapeHtml(post.slug)}.html">
    <meta property="og:image" content="https://cosylanguages.github.io/COSYmagazine/${escapeHtml(socialImage)}">
    <meta property="og:image:type" content="${escapeHtml(socialImageType)}">
    <meta property="og:image:width" content="${escapeHtml(String(socialImageWidth))}">
    <meta property="og:image:height" content="${escapeHtml(String(socialImageHeight))}">
    <meta property="og:image:alt" content="${escapeHtml(socialImageAlt)}">
    <meta property="article:published_time" content="${escapeHtml(post.date)}">
    <meta name="twitter:card" content="${escapeHtml(twitterCard)}">
    <meta name="twitter:title" content="${escapeHtml(getDocumentTitle(post.title))}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
    <meta name="twitter:image" content="https://cosylanguages.github.io/COSYmagazine/${escapeHtml(socialImage)}">
    <meta name="twitter:image:alt" content="${escapeHtml(socialImageAlt)}">
    <link rel="icon" href="images/logo.png">
    <meta name="theme-color" content="${escapeHtml(palette[1] || '#faf7f2')}">
    <script src="js/theme-init.js"></script>
    <link rel="stylesheet" href="css/core.css">
    <link rel="stylesheet" href="css/blog.css">
    <link rel="stylesheet" href="css/tokens.css">
    <link rel="stylesheet" href="css/magazine-templates.css">
    <link rel="stylesheet" href="css/article-visuals.css">
    <link rel="stylesheet" href="css/dark-fixes.css">
    <link rel="stylesheet" href="css/stage.css">
    <link rel="stylesheet" href="css/shell.css">
    <link rel="stylesheet" href="css/book.css">
    <link rel="stylesheet" href="css/notebook.css">
    <link rel="stylesheet" href="https://cosylanguages.github.io/COSYlanguages/css/ecosystem-strip.css">

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
<body class="blog-page gazette-body" data-issue="${issueKey(post)}" data-issue-volume="${escapeHtml(issueNum || '')}" data-issue-label="${escapeHtml(issueTitle)}" data-slug="${escapeHtml(post.slug)}">

    <div data-ecosystem-strip data-self="magazine"></div>
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
                <span>${issueNum ? `${escapeHtml(issueNum)} • ${escapeHtml(issueTitle)}` : escapeHtml(issueTitle)}</span>
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

            ${playerReady ? `
            <div id="podcast-box-container" class="podcast-box-wrapper" style="margin-top: 2.5rem;">
                ${staticPodcastBoxHtml}
            </div>` : ''}

            ${post.tags && post.tags.length > 0 ? `
            <div class="post-tags-row" style="margin-top: 2rem;">
                ${post.tags.map(t => `<span class="post-tag-chip">#${escapeHtml(t)}</span>`).join(' ')}
            </div>` : ''}

            <div class="gazette-folio">
                <span>🗞️ COSYmagazine${issueNum ? ` • ${escapeHtml(issueNum)}` : ''}</span>
                <a href="index.html" class="read-more-link" data-i18n="blog.return_to_index">${escapeHtml(returnToIndexText)}</a>
                <span>${escapeHtml(pageXofYText)}</span>
            </div>
        </main>

    </div>

<footer id="cosy-footer"></footer>

    <script src="js/shell.js"></script>
    <script src="js/doodles.js"></script>
    <script src="js/fulllist.js"></script>
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
    <script src="https://cosylanguages.github.io/COSYlanguages/js/ecosystem-strip.js" defer></script>
</body>
</html>
`;
}

module.exports = { renderPostPage };
