/**
 * blog/js/stage/script.js
 * Controller for Teleprompter Script Mode (?script=1).
 * Renders post `say` fields (falling back to block text), font size adjustments,
 * auto-scroll speed controls, mirror mode, per-beat timing markers, estimated duration,
 * foreign-word highlights, and downloadable .md / .txt script files.
 */

export class ScriptController {
  constructor(containerElement, postData) {
    this.container = containerElement;
    this.post = postData || {};
    this.fontSize = 32; // Default teleprompter font size in px
    this.scrollSpeed = 2; // Default scroll speed multiplier (1 to 5)
    this.isScrolling = false;
    this.isMirrored = false;
    this.scrollAnimationId = null;

    this.processScriptBeats();
    this.renderScriptView();
    this.bindEvents();
  }

  processScriptBeats() {
    const blocks = this.post.blocks || [];
    let currentTimeMs = 0;
    this.beats = [];

    if (blocks.length === 0 && this.post.title) {
      // Fallback if blocks array is empty
      const text = this.post.dek || this.post.title;
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const durationMs = Math.max(3000, Math.round((wordCount / 140) * 60 * 1000));
      this.beats.push({
        index: 1,
        type: 'paragraph',
        say: text,
        rawText: text,
        durationMs,
        startTimeMs: 0,
        formattedTime: '00:00',
        wordCount
      });
      currentTimeMs += durationMs;
    } else {
      blocks.forEach((block, idx) => {
        // Fallback: say -> text -> quote -> content -> title -> word
        let sayText = block.say;
        if (!sayText || typeof sayText !== 'string' || sayText.trim() === '') {
          sayText = block.text || block.quote || block.content || block.title || block.word || '';
        }
        sayText = String(sayText).trim();

        if (!sayText) return;

        const words = sayText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        // Duration from beat object or estimated at 140 WPM
        let durationMs = block.beat?.duration;
        if (!durationMs || typeof durationMs !== 'number') {
          durationMs = Math.max(2500, Math.round((wordCount / 140) * 60 * 1000));
        }

        const formattedTime = this.formatTimestamp(currentTimeMs);

        this.beats.push({
          index: idx + 1,
          type: block.type || 'paragraph',
          say: sayText,
          rawText: block.text || block.quote || sayText,
          durationMs,
          startTimeMs: currentTimeMs,
          formattedTime,
          wordCount,
          beatDirection: block.beat || null,
          ipa: block.ipa || null
        });

        currentTimeMs += durationMs;
      });
    }

    this.totalDurationMs = currentTimeMs;
    this.totalWords = this.beats.reduce((acc, b) => acc + b.wordCount, 0);
  }

  formatTimestamp(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  renderScriptView() {
    if (!this.container) return;

    document.body.classList.add('script-mode-active');

    const estDurationFormatted = this.formatTimestamp(this.totalDurationMs);
    const getT = (key, fallback) => (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t(key) || fallback : fallback;

    const exitViewText = getT('blog.exit_script_view', '← Exit Script View');
    const podcastScriptModeText = getT('blog.podcast_script_mode', '🎙️ Podcast Script Mode');
    const estDurationText = getT('blog.est_duration', '⏱️ Est. Duration:');
    const wordsCountText = getT('blog.words_count', 'words');
    const levelLabelText = getT('blog.level_label', 'Level:');
    const fontSizeText = getT('blog.font_size', 'Font Size');
    const autoScrollText = getT('blog.auto_scroll', 'Auto-Scroll');
    const mirrorGlassText = getT('blog.mirror_glass', 'Mirror Glass');
    const flipMirrorText = getT('blog.flip_mirror', '🪞 Flip Mirror');
    const exportScriptText = getT('blog.export_script', 'Export Script');
    const endOfScriptText = getT('blog.end_of_script', '--- END OF PODCAST SCRIPT ---');

    this.container.innerHTML = `
      <div class="teleprompter-wrapper" id="teleprompter-wrapper">
        <!-- Teleprompter Header Toolbar -->
        <header class="teleprompter-header" id="teleprompter-header">
          <div class="teleprompter-meta-col">
            <a href="?" class="teleprompter-back-btn" data-i18n="blog.exit_script_view">${this.escapeHtml(exitViewText)}</a>
            <h1 class="teleprompter-title">${this.escapeHtml(this.post.title || 'Podcast Script')}</h1>
            <div class="teleprompter-stats">
              <span class="teleprompter-badge" data-i18n="blog.podcast_script_mode">${this.escapeHtml(podcastScriptModeText)}</span>
              <span><span data-i18n="blog.est_duration">${this.escapeHtml(estDurationText)}</span> <strong>${estDurationFormatted}</strong></span>
              <span>•</span>
              <span>📝 <strong>${this.totalWords}</strong> <span data-i18n="blog.words_count">${this.escapeHtml(wordsCountText)}</span></span>
              <span>•</span>
              <span>🌐 <span data-i18n="blog.level_label">${this.escapeHtml(levelLabelText)}</span> <strong>${this.escapeHtml(this.post.level || 'A0–B2')}</strong></span>
            </div>
          </div>

          <!-- Controls Bar -->
          <div class="teleprompter-controls">
            <!-- Font Size -->
            <div class="ctrl-group">
              <label data-i18n="blog.font_size">${this.escapeHtml(fontSizeText)}</label>
              <div class="btn-cluster">
                <button type="button" id="tp-font-dec" class="tp-btn" title="Decrease font size">A-</button>
                <span id="tp-font-val" class="ctrl-val">${this.fontSize}px</span>
                <button type="button" id="tp-font-inc" class="tp-btn" title="Increase font size">A+</button>
              </div>
            </div>

            <!-- Auto Scroll -->
            <div class="ctrl-group">
              <label data-i18n="blog.auto_scroll">${this.escapeHtml(autoScrollText)}</label>
              <div class="btn-cluster">
                <button type="button" id="tp-scroll-toggle" class="tp-btn tp-btn-primary">▶ Play</button>
                <button type="button" id="tp-speed-dec" class="tp-btn">-</button>
                <span id="tp-speed-val" class="ctrl-val">${this.scrollSpeed}x</span>
                <button type="button" id="tp-speed-inc" class="tp-btn">+</button>
              </div>
            </div>

            <!-- Mirror Mode -->
            <div class="ctrl-group">
              <label data-i18n="blog.mirror_glass">${this.escapeHtml(mirrorGlassText)}</label>
              <button type="button" id="tp-mirror-toggle" class="tp-btn" title="Flip text horizontally for teleprompter glass reflection" data-i18n="blog.flip_mirror">${this.escapeHtml(flipMirrorText)}</button>
            </div>

            <!-- Downloads & Print -->
            <div class="ctrl-group">
              <label data-i18n="blog.export_script">${this.escapeHtml(exportScriptText)}</label>
              <div class="btn-cluster">
                <button type="button" id="tp-download-md" class="tp-btn tp-btn-accent">📥 .MD</button>
                <button type="button" id="tp-download-txt" class="tp-btn tp-btn-accent">📥 .TXT</button>
                <button type="button" id="tp-print" class="tp-btn">🖨️ Print</button>
              </div>
            </div>
          </div>
        </header>

        <!-- Reading Focus Overlay Line -->
        <div class="teleprompter-focus-line"></div>

        <!-- Teleprompter Script Content Viewport -->
        <main class="teleprompter-viewport" id="teleprompter-viewport">
          <div class="teleprompter-content" id="teleprompter-content" style="font-size: ${this.fontSize}px;">
            <div class="teleprompter-padding-top"></div>

            ${this.beats.map(beat => this.renderBeatHtml(beat)).join('')}

            <div class="teleprompter-outro">
              <span data-i18n="blog.end_of_script">${this.escapeHtml(endOfScriptText)}</span>
            </div>
            <div class="teleprompter-padding-bottom"></div>
          </div>
        </main>
      </div>
    `;

    this.initControls();
  }

  renderBeatHtml(beat) {
    const highlightedSay = this.highlightForeignWords(beat.say);
    const directionBadge = beat.beatDirection?.camera
      ? `<span class="beat-dir-badge">🎥 ${beat.beatDirection.camera}</span>`
      : '';
    const ipaBadge = beat.ipa
      ? `<span class="beat-ipa-badge">🗣️ /${this.escapeHtml(beat.ipa)}/</span>`
      : '';

    return `
      <article class="teleprompter-beat" id="tp-beat-${beat.index}" data-beat="${beat.index}">
        <div class="beat-header">
          <span class="beat-time-marker">[${beat.formattedTime}]</span>
          <span class="beat-num-badge">Beat ${beat.index}</span>
          ${directionBadge}
          ${ipaBadge}
        </div>
        <div class="beat-body">
          <p class="beat-text">${highlightedSay}</p>
        </div>
      </article>
    `;
  }

  highlightForeignWords(text) {
    if (!text) return '';

    // First escape HTML
    let safeText = this.escapeHtml(text);

    // Highlight text wrapped in <em>, non-English terms, or quotes
    // 1. Unescape <em> tags if present
    safeText = safeText.replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<mark class="teleprompter-foreign-word" title="Pronunciation / Foreign Term">$1</mark>');
    safeText = safeText.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<mark class="teleprompter-foreign-word" title="Pronunciation / Foreign Term">$1</mark>');

    // 2. Identify quoted words or non-ASCII phrases (e.g. French, Greek, Russian, Italian terms)
    safeText = safeText.replace(/“([^”]+)”/g, '“<mark class="teleprompter-foreign-word">$1</mark>”');
    safeText = safeText.replace(/"([^"]+)"/g, '"<mark class="teleprompter-foreign-word">$1</mark>"');

    return safeText;
  }

  initControls() {
    const viewport = this.container.querySelector('#teleprompter-viewport');
    const content = this.container.querySelector('#teleprompter-content');

    // Font Size
    const fontVal = this.container.querySelector('#tp-font-val');
    this.container.querySelector('#tp-font-dec')?.addEventListener('click', () => {
      this.fontSize = Math.max(18, this.fontSize - 4);
      if (content) content.style.fontSize = `${this.fontSize}px`;
      if (fontVal) fontVal.textContent = `${this.fontSize}px`;
    });
    this.container.querySelector('#tp-font-inc')?.addEventListener('click', () => {
      this.fontSize = Math.min(64, this.fontSize + 4);
      if (content) content.style.fontSize = `${this.fontSize}px`;
      if (fontVal) fontVal.textContent = `${this.fontSize}px`;
    });

    // Auto-Scroll Toggle & Speed
    const scrollBtn = this.container.querySelector('#tp-scroll-toggle');
    const speedVal = this.container.querySelector('#tp-speed-val');

    const toggleScroll = () => {
      this.isScrolling = !this.isScrolling;
      if (scrollBtn) {
        scrollBtn.textContent = this.isScrolling ? '⏸ Pause' : '▶ Play';
        scrollBtn.classList.toggle('active', this.isScrolling);
      }
      if (this.isScrolling) {
        this.startAutoScroll();
      } else {
        this.stopAutoScroll();
      }
    };

    scrollBtn?.addEventListener('click', toggleScroll);

    this.container.querySelector('#tp-speed-dec')?.addEventListener('click', () => {
      this.scrollSpeed = Math.max(1, this.scrollSpeed - 0.5);
      if (speedVal) speedVal.textContent = `${this.scrollSpeed}x`;
    });
    this.container.querySelector('#tp-speed-inc')?.addEventListener('click', () => {
      this.scrollSpeed = Math.min(8, this.scrollSpeed + 0.5);
      if (speedVal) speedVal.textContent = `${this.scrollSpeed}x`;
    });

    // Mirror Toggle
    const mirrorBtn = this.container.querySelector('#tp-mirror-toggle');
    mirrorBtn?.addEventListener('click', () => {
      this.isMirrored = !this.isMirrored;
      if (viewport) {
        viewport.classList.toggle('teleprompter-mirrored', this.isMirrored);
      }
      mirrorBtn.classList.toggle('active', this.isMirrored);
    });

    // Exports
    this.container.querySelector('#tp-download-md')?.addEventListener('click', () => this.downloadMarkdownScript());
    this.container.querySelector('#tp-download-txt')?.addEventListener('click', () => this.downloadTextScript());
    this.container.querySelector('#tp-print')?.addEventListener('click', () => window.print());
  }

  startAutoScroll() {
    const viewport = this.container.querySelector('#teleprompter-viewport');
    if (!viewport) return;

    let lastTime = performance.now();

    const scrollStep = (now) => {
      if (!this.isScrolling) return;

      const delta = now - lastTime;
      lastTime = now;

      // Scroll px per frame based on speed multiplier
      const pxPerSec = this.scrollSpeed * 35;
      const movePx = (pxPerSec * delta) / 1000;

      viewport.scrollTop += movePx;

      if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10) {
        this.stopAutoScroll();
        this.isScrolling = false;
        const scrollBtn = this.container.querySelector('#tp-scroll-toggle');
        if (scrollBtn) {
          scrollBtn.textContent = '▶ Replay';
          scrollBtn.classList.remove('active');
        }
        return;
      }

      this.scrollAnimationId = requestAnimationFrame(scrollStep);
    };

    this.scrollAnimationId = requestAnimationFrame(scrollStep);
  }

  stopAutoScroll() {
    if (this.scrollAnimationId) {
      cancelAnimationFrame(this.scrollAnimationId);
      this.scrollAnimationId = null;
    }
  }

  generateMarkdownScript() {
    const slug = this.post.slug || 'cosy-podcast';
    const title = this.post.title || 'COSY Podcast Script';
    const date = this.post.date || new Date().toISOString().split('T')[0];
    const level = this.post.level || 'A0–B2';
    const estTime = this.formatTimestamp(this.totalDurationMs);

    let md = `# ${title}\n\n`;
    if (this.post.podcast?.episode) md += `**Podcast Episode**: Episode ${this.post.podcast.episode}\n`;
    md += `**Language**: ${this.post.language || 'en'} | **Level**: ${level} | **Date**: ${date}\n`;
    md += `**Estimated Spoken Duration**: ${estTime} | **Total Words**: ${this.totalWords}\n\n`;
    md += `---\n\n`;
    md += `## Teleprompter Spoken Script\n\n`;

    this.beats.forEach(beat => {
      md += `### [${beat.formattedTime}] Beat ${beat.index}\n`;
      if (beat.beatDirection?.camera) {
        md += `*Camera Direction: ${beat.beatDirection.camera}*\n`;
      }
      if (beat.ipa) {
        md += `*Pronunciation: /${beat.ipa}/*\n`;
      }
      md += `\n> ${beat.say}\n\n`;
    });

    md += `---\n*Generated by COSYlanguages Teleprompter Engine*\n`;
    return { filename: `${slug}-script.md`, content: md };
  }

  generateTextScript() {
    const slug = this.post.slug || 'cosy-podcast';
    const title = this.post.title || 'COSY Podcast Script';
    const date = this.post.date || new Date().toISOString().split('T')[0];
    const level = this.post.level || 'A0–B2';
    const estTime = this.formatTimestamp(this.totalDurationMs);

    let txt = `==================================================\n`;
    txt += `${title.toUpperCase()} — PODCAST TELEPROMPTER SCRIPT\n`;
    txt += `==================================================\n`;
    txt += `${this.post.podcast?.episode ? `Episode: Episode ${this.post.podcast.episode} | ` : ''}Date: ${date}\n`;
    txt += `Language: ${this.post.language || 'en'} | Level: ${level}\n`;
    txt += `Estimated Spoken Duration: ${estTime} | Words: ${this.totalWords}\n`;
    txt += `--------------------------------------------------\n\n`;

    this.beats.forEach(beat => {
      txt += `[${beat.formattedTime}] BEAT ${beat.index}\n`;
      if (beat.beatDirection?.camera) {
        txt += `(Camera: ${beat.beatDirection.camera})\n`;
      }
      if (beat.ipa) {
        txt += `(IPA: /${beat.ipa}/)\n`;
      }
      txt += `${beat.say}\n\n`;
    });

    txt += `--------------------------------------------------\n`;
    txt += `End of Script — COSYlanguages\n`;
    return { filename: `${slug}-script.txt`, content: txt };
  }

  downloadMarkdownScript() {
    const { filename, content } = this.generateMarkdownScript();
    this.downloadFile(filename, content, 'text/markdown');
  }

  downloadTextScript() {
    const { filename, content } = this.generateTextScript();
    this.downloadFile(filename, content, 'text/plain');
  }

  downloadFile(filename, text, mimeType) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  bindEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('script-mode-active')) return;

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.container.querySelector('#tp-scroll-toggle')?.click();
      } else if (e.key === 'm' || e.key === 'M') {
        this.container.querySelector('#tp-mirror-toggle')?.click();
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
