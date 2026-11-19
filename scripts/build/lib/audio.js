/**
 * scripts/build/lib/audio.js
 * Audio and podcast helpers.
 *
 * A post only advertises audio when a real player exists: a valid embed link or
 * an audio file that is really committed. Otherwise there is no episode badge,
 * no player box, and no entry on the Podcast page.
 */

const fs = require('fs');
const path = require('path');

const { escapeHtml } = require('./text.js');
const { tStrict } = require('./i18n.js');

const BLOG_DIR = path.join(__dirname, '..', '..', '..');

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

function makeHasPlayer(podcastEmbed) {
  return function hasPlayer(post) {
    if (!post || !post.podcast) return false;
    return Boolean(podcastEmbed.resolvePodcastEmbed(post.podcast) || resolveAudioUrl(post));
  };
}

function renderStaticPodcastBoxHtml(post, langDict, lang, podcastEmbed) {
  const podcast = post.podcast || {};
  const episodeNum = podcast.episode || 1;
  const audioUrl = resolveAudioUrl(post);

  const embed = podcastEmbed.resolvePodcastEmbed(podcast);
  const iframeUrl = embed ? embed.src : null;

  const epText = `${tStrict(langDict, 'blog.episode', lang)} ${episodeNum}`;
  const noticeText = tStrict(langDict, 'blog.podcast_in_production', lang);
  const stageViewText = tStrict(langDict, 'blog.stage_view', lang);
  const scriptPromptText = tStrict(langDict, 'blog.script_teleprompter', lang);

  let playerHtml = '';
  if (iframeUrl) {
    playerHtml = `
      <div class="podcast-iframe-player-wrapper" style="margin-top: 1rem; border-radius: 12px; overflow: hidden;">
        <iframe src="${escapeHtml(iframeUrl)}" style="width: 100%; border: none;" height="${embed.height}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="${escapeHtml(post.title || 'Podcast episode')}"></iframe>
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

module.exports = {
  blockAudioUrl,
  resolveAudioUrl,
  makeHasPlayer,
  renderStaticPodcastBoxHtml
};
