/**
 * blog/js/podcast-box.js
 * Podcast Box Component for COSYlanguages Blog Posts.
 * Renders episode info, audio player, teleprompter script / stage presentation links,
 * and optional timestamp-synced "Listen while reading" read-along highlighting.
 */

import { resolvePodcastEmbed } from './podcast-embed.js';

export class PodcastBoxComponent {
  constructor(options = {}) {
    this.container = options.container || null;
    this.post = options.post || {};
    this.audioEl = null;
    this.isPlaying = false;
    this.highlightActive = false;

    if (this.container) {
      this.render();
      this.bindAudioSync();
    }
  }

  render() {
    const podcast = this.post.podcast || {};
    const episodeNum = podcast.episode || 1;
    const audioUrl = podcast.audioUrl || null;
    const externalUrl = podcast.externalUrl || null;
    const appleUrl = podcast.appleUrl || null;
    const embed = resolvePodcastEmbed(podcast);
    const iframeUrl = embed ? embed.src : null;
    const slug = this.post.slug || '';
    const scriptUrl = `${slug}.html?script=1`;
    const stageUrl = `${slug}.html?stage=1`;

    const getT = (key, fallback) => (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t(key) || fallback : fallback;

    const epText = `${getT('blog.episode', 'EPISODE')} ${episodeNum}`;
    const noticeText = getT('blog.podcast_in_production', '🎙️ Audio recording in production for this episode.');
    const stageViewText = getT('blog.stage_view', '📺 Stage View');
    const scriptPromptText = getT('blog.script_teleprompter', '📜 Script Teleprompter');
    const listenReadingText = getT('blog.listen_while_reading', '🎧 Listen While Reading');

    let playerHtml = '';
    if (iframeUrl) {
      playerHtml = `
        <div class="podcast-iframe-player-wrapper" style="margin-top: 1rem; border-radius: 12px; overflow: hidden;">
          <iframe src="${this.escapeHtml(iframeUrl)}" style="width: 100%; border: none;" height="${embed.height}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="${this.escapeHtml(this.post.title || 'Podcast episode')}"></iframe>
        </div>
      `;
    } else if (audioUrl) {
      playerHtml = `
        <div class="podcast-audio-player-wrapper">
          <audio class="podcast-audio-element" controls preload="metadata" src="${this.escapeHtml(audioUrl)}">
            Your browser does not support the audio element.
          </audio>
          <button type="button" class="podcast-readalong-btn" id="btn-readalong-toggle" title="Sync article text highlighting with audio playback">
            <span data-i18n="blog.listen_while_reading">${this.escapeHtml(listenReadingText)}</span>
          </button>
        </div>
      `;
    } else {
      playerHtml = `
        <div class="podcast-audio-notice">
          <span data-i18n="blog.podcast_in_production">${this.escapeHtml(noticeText)}</span>
        </div>
      `;
    }

    this.container.innerHTML = `
      <section class="cosy-podcast-box" aria-label="Podcast Episode Controls">
        <div class="podcast-box-header">
          <div class="podcast-ep-meta">
            <span class="podcast-ep-badge">${this.escapeHtml(epText)}</span>
            <span class="podcast-show-name">cosylanguages / такиеязыки</span>
          </div>
          <div class="podcast-quick-links">
            ${externalUrl ? `<a href="${this.escapeHtml(externalUrl)}" target="_blank" rel="noopener" class="podcast-action-link" style="background: #1db954; color: #ffffff;" title="Listen on Spotify">🎧 Spotify</a>` : ''}
            ${appleUrl ? `<a href="${this.escapeHtml(appleUrl)}" target="_blank" rel="noopener" class="podcast-action-link" style="background: #9933ff; color: #ffffff;" title="Listen on Apple Podcasts">🍏 Apple Podcasts</a>` : ''}
            <a href="${stageUrl}" class="podcast-action-link" title="Open in 16:9 Animated Presentation Deck" data-i18n="blog.stage_view">${this.escapeHtml(stageViewText)}</a>
            <a href="${scriptUrl}" class="podcast-action-link" title="Open in Teleprompter Script Mode" data-i18n="blog.script_teleprompter">${this.escapeHtml(scriptPromptText)}</a>
          </div>
        </div>

        <div class="podcast-box-body">
          <div class="podcast-title-row">
            <h3 class="podcast-box-title">🎙️ ${this.escapeHtml(this.post.title || 'COSY Podcast Episode')}</h3>
            <p class="podcast-box-dek">${this.escapeHtml(this.post.dek || this.post.summary || '')}</p>
          </div>

          ${playerHtml}
        </div>
      </section>
    `;

    this.audioEl = this.container.querySelector('.podcast-audio-element');
  }

  bindAudioSync() {
    if (!this.audioEl) return;

    const readalongBtn = this.container.querySelector('#btn-readalong-toggle');
    const getT = (key, fallback) => (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t(key) || fallback : fallback;

    readalongBtn?.addEventListener('click', () => {
      this.highlightActive = !this.highlightActive;
      readalongBtn.classList.toggle('active', this.highlightActive);
      const syncActiveText = getT('blog.readalong_active', '✨ Read-Along Sync Active');
      const listenReadingText = getT('blog.listen_while_reading', '🎧 Listen While Reading');
      readalongBtn.innerHTML = this.highlightActive
        ? `<span data-i18n="blog.readalong_active">${this.escapeHtml(syncActiveText)}</span>`
        : `<span data-i18n="blog.listen_while_reading">${this.escapeHtml(listenReadingText)}</span>`;

      if (this.highlightActive && this.audioEl.paused) {
        this.audioEl.play().catch(() => {});
      }
    });

    this.audioEl.addEventListener('timeupdate', () => {
      if (!this.highlightActive) return;

      const currentTime = this.audioEl.currentTime;
      const duration = this.audioEl.duration || 1;
      const progressRatio = currentTime / duration;

      // Find all content blocks/paragraphs in the post to highlight corresponding section
      const contentBlocks = document.querySelectorAll('.post-full-content p, .post-full-content blockquote, .post-full-content .flipbook-page');
      if (contentBlocks.length === 0) return;

      const activeIndex = Math.min(
        contentBlocks.length - 1,
        Math.floor(progressRatio * contentBlocks.length)
      );

      contentBlocks.forEach((block, idx) => {
        if (idx === activeIndex) {
          block.classList.add('podcast-readalong-active');
          if (this.highlightActive && block.scrollIntoView) {
            block.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          block.classList.remove('podcast-readalong-active');
        }
      });
    });

    this.audioEl.addEventListener('ended', () => {
      document.querySelectorAll('.podcast-readalong-active').forEach(el => el.classList.remove('podcast-readalong-active'));
      if (readalongBtn) {
        this.highlightActive = false;
        readalongBtn.classList.remove('active');
        readalongBtn.innerHTML = '<span>🎧 Listen While Reading</span>';
      }
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
