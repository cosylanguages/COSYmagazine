/**
 * blog/js/stage/stage.js
 * Main controller for Stage Mode, Teleprompter Script Mode, and Reading Mode word card magnification.
 */

import { StageCamera } from './camera.js';
import { StageTimeline } from './timeline.js';
import { ScriptController } from './script.js';

export class StageController {
  constructor(containerElement, postData) {
    this.container = containerElement;
    this.post = postData;
    this.isStageMode = false;
    this.isScriptMode = false;
    this.isRecordingMode = false;

    if (typeof window !== 'undefined') {
      window.stageController = this;
    }

    this.initModeDetection();
    this.renderStage();
    this.bindEvents();
  }

  initModeDetection() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      this.isStageMode = urlParams.get('stage') === '1';
      this.isScriptMode = urlParams.get('script') === '1';
      this.isRenderMode = urlParams.get('render') === '1';
    }
  }

  renderStage() {
    if (!this.container) return;

    if (this.isScriptMode) {
      this.scriptController = new ScriptController(this.container, this.post);
    } else if (this.isStageMode || this.isRenderMode) {
      document.body.classList.add('stage-mode-active');
      if (this.isRenderMode) {
        document.body.classList.add('stage-render-mode');
      }
      const palette = this.post.artDirection?.palette || ['#0d9488', '#faf7f2', '#1e293b', '#d69e2e'];
      const fontDisplay = this.post.artDirection?.fonts?.display || 'Fraunces';
      const fontText = this.post.artDirection?.fonts?.text || 'DM Sans';

      const coverArtHtml = this.post.coverSvg
        ? `<div class="stage-title-cover-art">${this.post.coverSvg}</div>`
        : '';

      const getT = (key, fallback) => (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t(key) || fallback : fallback;

      const readyText = getT('blog.ready_to_start', 'Ready to start presentation...');
      const outroTitle = getT('blog.outro_title', 'COSYlanguages');
      const outroSub = getT('blog.outro_subtitle', 'Learn languages naturally, conversationally, and beautifully.');
      const cleanViewText = getT('blog.clean_view', '🔴 Clean View');

      const podcastInfo = this.post.podcast || this.post.audio_podcast;
      const podcastAudioUrl = podcastInfo?.audioUrl || podcastInfo?.audio_url || '';
      const podcastCtaHtml = podcastAudioUrl ? `
        <div class="stage-outro-podcast-box">
          <a href="${this.escapeHtml(podcastAudioUrl)}" target="_blank" rel="noopener" class="stage-outro-podcast-btn">
            🎙️ Listen to the Podcast Episode
          </a>
        </div>
      ` : '';

      const bylineHtml = `
        <div class="stage-byline-row">
          <span class="stage-badge-level">${this.escapeHtml(this.post.level || 'B1–B2')}</span>
          <span class="stage-author-tag">Written by <strong>JY DM</strong></span>
          <span class="stage-date">${this.escapeHtml(this.post.date || '')}</span>
        </div>
      `;

      this.container.innerHTML = `
        <div class="stage-frame-16-9">
          <div class="stage-viewport" id="stage-viewport" style="--post-palette-accent: ${palette[0]}; --post-palette-bg: ${palette[1]}; --post-palette-text: ${palette[2]}; --post-palette-highlight: ${palette[3] || palette[0]}; --post-font-display: '${fontDisplay}', serif; --post-font-body: '${fontText}', sans-serif;">
            <div class="stage-content" id="stage-content">
              <!-- Title Card -->
              <div id="stage-title-card" class="stage-card stage-title-card">
                ${coverArtHtml}
                <span class="stage-kicker">${this.escapeHtml(this.post.kicker || 'COSYMAGAZINE')}</span>
                <h1 class="stage-main-title">${this.parseMarkdown(this.post.title)}</h1>
                <p class="stage-dek">${this.parseMarkdown(this.post.dek || '')}</p>
                ${bylineHtml}
              </div>

              <!-- Blocks -->
              <div class="stage-blocks-container">
                ${(this.post.blocks || []).map((b, i) => this.renderBlockHtml(b, i)).join('')}
              </div>

              <!-- Outro Card -->
              <div id="stage-outro-card" class="stage-card stage-outro-card">
                <div class="stage-outro-badge">COSYMAGAZINE • OUTRO</div>
                <h2 class="stage-outro-title" data-i18n="blog.outro_title">${this.escapeHtml(outroTitle)}</h2>
                <p class="stage-outro-sub" data-i18n="blog.outro_subtitle">${this.escapeHtml(outroSub)}</p>
                ${podcastCtaHtml}
                <div class="stage-outro-footer">
                  <a href="../index.html" class="stage-home-link">🏡 Return to COSYlanguages</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Lower Third Captions -->
          <div class="stage-lower-third" id="stage-lower-third">
            <span class="lower-third-text" id="lower-third-text" data-i18n="blog.ready_to_start">${this.escapeHtml(readyText)}</span>
          </div>

          <!-- Progress Bar -->
          <div class="stage-progress-bar" id="stage-progress-bar">
            <div class="stage-progress-fill" id="stage-progress-fill" style="width: 0%;"></div>
          </div>

          <!-- Stage Controls Overlay -->
          <div class="stage-controls" id="stage-controls">
            <button id="btn-play-pause" class="stage-btn" title="Play/Pause (Space)">▶</button>
            <button id="btn-prev" class="stage-btn" title="Previous (Left Arrow)">⏮</button>
            <button id="btn-next" class="stage-btn" title="Next (Right Arrow)">⏭</button>
            <span class="beat-counter" id="beat-counter">0 / 0</span>
            <button id="btn-speed" class="stage-btn">1.0x</button>
            <button id="btn-rec-toggle" class="stage-btn" title="Toggle Clean Recording View (H)" data-i18n="blog.clean_view">${this.escapeHtml(cleanViewText)}</button>
            <button id="btn-fullscreen" class="stage-btn" title="Toggle Fullscreen (F)">⛶</button>
          </div>
        </div>
      `;

      this.initCameraAndTimeline();
    } else {
      // Standard Reading Mode with Word Magnification
      this.initReadingModeMagnifier();
    }
  }

  renderBlockHtml(block, index) {
    const id = `block-${index}`;
    if (block.type === 'heading') {
      const lvl = Math.min(6, Math.max(1, block.level || 2));
      return `
        <div id="${id}" class="stage-card stage-block stage-heading-card">
          <h${lvl} class="stage-heading">${this.parseMarkdown(block.text)}</h${lvl}>
        </div>
      `;
    } else if (block.type === 'paragraph') {
      return `
        <div id="${id}" class="stage-card stage-block stage-paragraph-card">
          <p class="stage-paragraph">${this.parseMarkdown(block.text)}</p>
        </div>
      `;
    } else if (block.type === 'list-item') {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = (block.items || []).map(item => `<li>${this.parseMarkdown(item)}</li>`).join('');
      return `
        <div id="${id}" class="stage-card stage-block stage-list-card">
          <${tag} class="stage-list">${items}</${tag}>
        </div>
      `;
    } else if (block.type === 'table') {
      const headers = block.headers || [];
      const rows = block.rows || [];
      const groupSize = rows.length > 6 ? 5 : 3;
      const totalGroups = Math.ceil(rows.length / groupSize);

      let groupsHtml = '';
      const headersHtml = headers.map((h, i) => `<div class="stage-table-header col-${i}">${this.parseMarkdown(h)}</div>`).join('');

      for (let g = 0; g < totalGroups; g++) {
        const groupRows = rows.slice(g * groupSize, (g + 1) * groupSize);
        const rowsHtml = groupRows.map(row => {
          const cellsHtml = row.map((cell, cIdx) => `<div class="stage-table-cell col-${cIdx}">${this.parseMarkdown(cell)}</div>`).join('');
          return `<div class="stage-table-row">${cellsHtml}</div>`;
        }).join('');

        groupsHtml += `
          <div id="${id}-group-${g}" class="stage-card stage-block stage-table-row-group">
            <div class="stage-table-group-header">
              <span class="stage-table-badge">VOCABULARY SPREAD (${g * groupSize + 1}–${Math.min((g + 1) * groupSize, rows.length)} of ${rows.length})</span>
            </div>
            <div class="stage-table-headers">${headersHtml}</div>
            <div class="stage-table-rows">${rowsHtml}</div>
          </div>
        `;
      }

      return `
        <div id="${id}" class="stage-table-container">
          ${groupsHtml}
        </div>
      `;
    } else if (block.type === 'pullquote') {
      return `
        <blockquote id="${id}" class="stage-card stage-block stage-pullquote">
          <p class="pullquote-text">“${this.parseMarkdown(block.quote)}”</p>
          ${block.attribution ? `<cite class="pullquote-cite">— ${this.parseMarkdown(block.attribution)}</cite>` : ''}
        </blockquote>
      `;
    } else if (block.type === 'culture-bite') {
      return `
        <div id="${id}" class="stage-card stage-block stage-culture-bite">
          <h3>📌 ${this.parseMarkdown(block.title)}</h3>
          <p>${this.parseMarkdown(block.content)}</p>
        </div>
      `;
    } else if (block.type === 'mistake-card') {
      const num = block.number !== undefined && block.number !== null ? String(block.number).padStart(2, '0') + ' ' : '';
      return `
        <div id="${id}" class="stage-card stage-block stage-mistake-card">
          <h3>${num}${this.parseMarkdown(block.title)}</h3>
          <p class="stage-mc-wrong">✗ ${this.parseMarkdown(block.wrong)}</p>
          <p class="stage-mc-right">✓ ${this.parseMarkdown(block.right)}</p>
          <p class="stage-mc-rule">${this.parseMarkdown(block.rule)}</p>
        </div>
      `;
    } else if (block.type === 'pronunciation' || block.word) {
      return `
        <div id="${id}" class="stage-card stage-block stage-vocab-card" data-word="${this.escapeHtml(block.word)}">
          <span class="vocab-term">${this.escapeHtml(block.word)}</span>
          <span class="vocab-ipa">${this.escapeHtml(block.ipa || '')}</span>
        </div>
      `;
    }
    return `<div id="${id}" class="stage-card stage-block">${this.parseMarkdown(block.text || block.content || '')}</div>`;
  }

  initCameraAndTimeline() {
    const stageEl = this.container.querySelector('.stage-frame-16-9');
    const viewportEl = this.container.querySelector('#stage-viewport');

    this.camera = new StageCamera(stageEl, viewportEl);
    this.timeline = new StageTimeline(this.post, this.camera, {
      onBeatChange: (beat, idx, total) => {
        const lowerThird = this.container.querySelector('#lower-third-text');
        const counter = this.container.querySelector('#beat-counter');
        if (lowerThird) {
          const rawText = beat.say || beat.caption || '';
          lowerThird.textContent = this.stripMarkdown(rawText);
        }
        if (counter) counter.textContent = `${idx + 1} / ${total}`;
      },
      onPlayStateChange: (isPlaying) => {
        const btn = this.container.querySelector('#btn-play-pause');
        if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
      },
      onProgress: (ratio) => {
        const fill = this.container.querySelector('#stage-progress-fill');
        if (fill) fill.style.width = `${Math.round(ratio * 100)}%`;
      }
    });

    // Control buttons & interactions
    this.container.querySelector('#btn-play-pause')?.addEventListener('click', () => this.timeline.togglePlay());
    this.container.querySelector('#btn-prev')?.addEventListener('click', () => this.timeline.prev());
    this.container.querySelector('#btn-next')?.addEventListener('click', () => this.timeline.next());

    // Speed cycling
    const speedBtn = this.container.querySelector('#btn-speed');
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    let speedIdx = 0;
    speedBtn?.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % speeds.length;
      const nextSpeed = speeds[speedIdx];
      this.timeline.setSpeed(nextSpeed);
      if (speedBtn) speedBtn.textContent = `${nextSpeed}x`;
    });

    // Fullscreen toggle
    this.container.querySelector('#btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        this.container.requestFullscreen?.() || stageEl.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    // Clean recording view
    this.container.querySelector('#btn-rec-toggle')?.addEventListener('click', () => {
      this.isRecordingMode = !this.isRecordingMode;
      const controls = this.container.querySelector('#stage-controls');
      const progress = this.container.querySelector('#stage-progress-bar');
        const lowerThird = this.container.querySelector('#stage-lower-third');
      if (this.isRecordingMode) {
        controls?.classList.add('hide-recording');
        progress?.classList.add('hide-recording');
          lowerThird?.classList.add('hide-recording');
      } else {
        controls?.classList.remove('hide-recording');
        progress?.classList.remove('hide-recording');
          lowerThird?.classList.remove('hide-recording');
      }
    });

    // Interactive progress bar scrubbing
    const progressBar = this.container.querySelector('#stage-progress-bar');
    if (progressBar) {
      let isScrubbing = false;

      const handleScrub = (e) => {
        const rect = progressBar.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const totalDuration = this.timeline.getTotalDuration();
        this.timeline.seekTime(ratio * totalDuration);
      };

      progressBar.addEventListener('mousedown', (e) => {
        isScrubbing = true;
        handleScrub(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isScrubbing) handleScrub(e);
      });

      window.addEventListener('mouseup', () => {
        isScrubbing = false;
      });
    }

    // Expose deterministic clock hooks on window for video rendering & tests
    if (typeof window !== 'undefined') {
      this.timeline.seekTime(0);
      window.__stageRenderReady = true;
      window.__stageTotalDurationMs = this.timeline.getTotalDuration();
      window.__stageTotalBeats = this.timeline.beats.length;
      window.__seekStageTime = (t) => this.timeline.seekTime(t);
      window.__advanceStageClock = (dt) => this.timeline.advanceClock(dt);
      window.__getStageState = () => this.timeline.getState();
    }
  }

  initReadingModeMagnifier() {
    // Clickable vocabulary word cards in reading mode
    const clickableWords = document.querySelectorAll('.vocab-word, [data-cosydata-word]');
    clickableWords.forEach(wordEl => {
      wordEl.addEventListener('click', (e) => {
        const word = wordEl.dataset.cosydataWord || wordEl.textContent.trim();
        this.showMagnifiedWordModal(word);
      });
    });
  }

  showMagnifiedWordModal(word) {
    const existing = document.querySelector('#cosy-word-magnifier-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cosy-word-magnifier-modal';
    modal.className = 'cosy-word-magnifier-modal';
    modal.innerHTML = `
      <div class="magnifier-card">
        <button class="magnifier-close">&times;</button>
        <span class="magnifier-kicker">VOCABULARY CARD</span>
        <h2 class="magnifier-word">${this.escapeHtml(word)}</h2>
        <p class="magnifier-def">Explore canonical definitions, audio pronunciation, and example sentences in COSYdata.</p>
        <a href="https://cosylanguages.github.io/COSYdata/vocabulary/index.html?word=${encodeURIComponent(word)}" target="_blank" rel="noopener" class="magnifier-link">
          Open in COSYdata ↗
        </a>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.magnifier-close').addEventListener('click', () => modal.remove());
  }

  bindEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (!this.isStageMode) return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.timeline?.togglePlay();
      } else if (e.key === 'ArrowRight') {
        this.timeline?.next();
      } else if (e.key === 'ArrowLeft') {
        this.timeline?.prev();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          this.container.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        this.container.querySelector('#btn-rec-toggle')?.click();
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

  parseMarkdown(str) {
    if (!str) return '';
    let escaped = this.escapeHtml(str);
    // Code blocks / inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');
    return escaped;
  }

  stripMarkdown(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\([*_`\\])/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/[*_`#~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
