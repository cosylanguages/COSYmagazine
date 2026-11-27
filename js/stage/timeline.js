/**
 * js/stage/timeline.js
 * Beat timeline playback engine for COSY Stage Mode.
 *
 * Sequenced playback of beats defined in post blocks or auto-generated defaults.
 */

export class StageTimeline {
  constructor(post, camera, callbacks = {}) {
    this.post = post;
    this.camera = camera;
    this.callbacks = callbacks; // { onBeatChange, onPlayStateChange, onProgress }

    this.beats = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.timerId = null;

    this.extractOrGenerateBeats();
  }

  /** Extracts explicit block beats or auto-generates default presentation beats */
  extractOrGenerateBeats() {
    this.beats = [];

    const stripMarkdown = (str) => {
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
    };

    const calculateWpmDuration = (sayText, minMs = 3000) => {
      if (!sayText) return minMs;
      const clean = stripMarkdown(sayText).replace(/<[^>]*>/g, ' ');
      const words = clean.trim().split(/\s+/).filter(Boolean).length;
      if (words === 0) return minMs;
      const derivedMs = Math.round((words / 150) * 60 * 1000);
      return Math.max(minMs, derivedMs);
    };

    // 1. Title beat
    const titleSay = this.post.dek || this.post.title || 'COSYmagazine';
    this.beats.push({
      id: 'beat-title',
      targetSelector: '#stage-title-card',
      duration: calculateWpmDuration(titleSay, 4000),
      cameraPreset: 'pull-back',
      caption: this.post.title || 'COSYmagazine',
      say: titleSay
    });

    const blocks = this.post.blocks || [];

    // 2. Process body blocks
    blocks.forEach((block, idx) => {
      const blockId = `#block-${idx}`;

      if (block.beat) {
        // Hand-written beat fields always win
        const sayText = block.beat.say || block.say || block.text || block.title || block.quote || '';
        this.beats.push({
          id: `beat-block-${idx}`,
          targetSelector: blockId,
          duration: block.beat.duration || calculateWpmDuration(sayText, 3500),
          cameraPreset: block.beat.camera || 'focus',
          reveal: block.beat.reveal || 'fade-in',
          caption: block.beat.caption || block.text || block.title || block.quote || '',
          say: sayText
        });
      } else {
        // Auto-generate default beats based on block type
        if (block.type === 'heading') {
          const headingSay = stripMarkdown(block.text || block.title || '');
          this.beats.push({
            id: `beat-block-${idx}`,
            targetSelector: blockId,
            duration: calculateWpmDuration(headingSay, 3500),
            cameraPreset: 'push-in',
            reveal: 'fade-in',
            caption: headingSay,
            say: headingSay
          });
        } else if (block.type === 'pullquote') {
          const quoteSay = stripMarkdown(block.quote || block.text || '');
          this.beats.push({
            id: `beat-block-${idx}`,
            targetSelector: blockId,
            duration: calculateWpmDuration(quoteSay, 4000),
            cameraPreset: 'spotlight',
            reveal: 'fade-in',
            caption: quoteSay,
            say: quoteSay
          });
        } else if (block.type === 'table') {
          const rows = block.rows || [];
          if (rows.length === 0) {
            const tableSay = stripMarkdown(block.title || 'Vocabulary Table');
            this.beats.push({
              id: `beat-block-${idx}`,
              targetSelector: blockId,
              duration: 3500,
              cameraPreset: 'focus',
              reveal: 'fade-in',
              caption: tableSay,
              say: tableSay
            });
          } else {
            const groupSize = rows.length > 6 ? 5 : 3;
            const totalGroups = Math.ceil(rows.length / groupSize);

            const h0 = block.headers?.[0] ? stripMarkdown(block.headers[0]).replace(/\.*$/, '').trim() : 'Instead of';
            const h1 = block.headers?.[1] ? stripMarkdown(block.headers[1]).replace(/\.*$/, '').trim() : 'try';

            for (let g = 0; g < totalGroups; g++) {
              const groupRows = rows.slice(g * groupSize, (g + 1) * groupSize);
              const groupSayParts = groupRows.map(r => {
                const col0 = stripMarkdown(r[0] || '').trim();
                const col1 = stripMarkdown(r[1] || '').trim();
                if (col0 && col1) {
                  return `${h0} '${col0}', ${h1.toLowerCase()} ${col1}.`;
                }
                return col0 || col1 || '';
              }).filter(Boolean);

              const groupSay = groupSayParts.join(' ');
              this.beats.push({
                id: `beat-block-${idx}-group-${g}`,
                targetSelector: `#block-${idx}-group-${g}`,
                duration: calculateWpmDuration(groupSay, 3500),
                cameraPreset: 'focus',
                reveal: 'fade-in',
                caption: groupSay,
                say: groupSay
              });
            }
          }
        } else if (block.type === 'list-item') {
          const items = block.items || [];
          const listSay = items.map(it => stripMarkdown(it)).join('. ');
          this.beats.push({
            id: `beat-block-${idx}`,
            targetSelector: blockId,
            duration: calculateWpmDuration(listSay, 3500),
            cameraPreset: 'focus',
            reveal: 'fade-in',
            caption: listSay,
            say: listSay
          });
        } else {
          const htmlText = block.text || block.content || block.question || block.title || '';

          // Check if this block is a complex guide container (e.g. top-10-verbs or top-100-a0-a1 HTML spreads)
          const verbSections = Array.from(htmlText.matchAll(/<section class="verb-section" id="([^"]+)"[\s\S]*?<\/section>/g));
          const listSections = Array.from(htmlText.matchAll(/<section class="list-section"[\s\S]*?<\/section>/g));
          const chainCards = Array.from(htmlText.matchAll(/<div class="chain-card"[\s\S]*?<\/div>\s*<\/div>/g));

          if (verbSections.length > 0) {
            verbSections.forEach((m, sIdx) => {
              const secHtml = m[0];
              const secId = m[1];
              const num = secHtml.match(/<div class="verb-num">([^<]+)<\/div>/)?.[1]?.trim() || '';
              const h2 = secHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
              const tagline = secHtml.match(/<p class="verb-tagline">([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

              const verbSay = stripMarkdown(`${num} ${h2}. ${tagline}`);
              this.beats.push({
                id: `beat-verb-${secId}`,
                targetSelector: `#${secId}`,
                duration: calculateWpmDuration(verbSay, 4000),
                cameraPreset: 'push-in',
                reveal: 'fade-in',
                caption: verbSay,
                say: verbSay
              });
            });
          } else if (listSections.length > 0) {
            listSections.forEach((m, lIdx) => {
              const secHtml = m[0];
              const headText = secHtml.match(/<div class="sec-head"[\s\S]*?<\/div>/)?.[0]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || `Section ${lIdx + 1}`;
              const cardCount = (secHtml.match(/<div class="lex-card"/g) || []).length;
              const secSay = stripMarkdown(`${headText}. ${cardCount} vocabulary entries.`);

              this.beats.push({
                id: `beat-list-sec-${lIdx}`,
                targetSelector: blockId,
                duration: calculateWpmDuration(secSay, 3500),
                cameraPreset: 'focus',
                reveal: 'fade-in',
                caption: secSay,
                say: secSay
              });
            });
          } else if (chainCards.length > 0) {
            const groupSize = 10;
            const totalGroups = Math.ceil(chainCards.length / groupSize);
            for (let g = 0; g < totalGroups; g++) {
              const groupSay = `Chains ${g * groupSize + 1} to ${Math.min((g + 1) * groupSize, chainCards.length)} of 100 A0-A1 knowledge chains.`;
              this.beats.push({
                id: `beat-chains-group-${g}`,
                targetSelector: blockId,
                duration: calculateWpmDuration(groupSay, 3500),
                cameraPreset: 'focus',
                reveal: 'fade-in',
                caption: groupSay,
                say: groupSay
              });
            }
          } else {
            const textSay = stripMarkdown(htmlText);
            const preset = block.type === 'culture-bite' ? 'push-in' : 'focus';
            this.beats.push({
              id: `beat-block-${idx}`,
              targetSelector: blockId,
              duration: calculateWpmDuration(textSay, 3000),
              cameraPreset: preset,
              reveal: 'fade-in',
              caption: textSay,
              say: textSay
            });
          }
        }
      }
    });

    // 3. Final outro beat
    const outroSay = 'Thanks for learning with us! COSYlanguages — learn languages naturally, conversationally, and beautifully.';
    this.beats.push({
      id: 'beat-outro',
      targetSelector: '#stage-outro-card',
      duration: calculateWpmDuration(outroSay, 4000),
      cameraPreset: 'pull-back',
      caption: 'COSYlanguages • Thanks for learning with us!',
      say: outroSay
    });
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.callbacks.onPlayStateChange) {
      this.callbacks.onPlayStateChange(true);
    }

    if (this.currentIndex < 0) {
      this.jumpTo(0);
    } else {
      this.scheduleNextBeat();
    }
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (this.callbacks.onPlayStateChange) {
      this.callbacks.onPlayStateChange(false);
    }
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  jumpTo(index) {
    if (index < 0 || index >= this.beats.length) return;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.currentIndex = index;
    const beat = this.beats[index];

    // Trigger camera movement
    if (this.camera && beat.targetSelector) {
      const targetEl = document.querySelector(beat.targetSelector);

      if (beat.cameraPreset === 'spotlight' && targetEl) {
        this.camera.spotlight(targetEl);
      } else if (beat.cameraPreset === 'push-in' && targetEl) {
        this.camera.pushIn(targetEl);
      } else if (beat.cameraPreset === 'pull-back') {
        this.camera.clearSpotlight();
        this.camera.pullBack(targetEl);
      } else if (targetEl) {
        this.camera.clearSpotlight();
        this.camera.focus(targetEl);
      }
    }

    if (this.callbacks.onBeatChange) {
      this.callbacks.onBeatChange(beat, index, this.beats.length);
    }

    if (this.callbacks.onProgress) {
      this.callbacks.onProgress((index + 1) / this.beats.length);
    }

    if (this.isPlaying) {
      this.scheduleNextBeat();
    }
  }

  scheduleNextBeat() {
    if (!this.isPlaying) return;

    const currentBeat = this.beats[this.currentIndex];
    const delay = (currentBeat ? currentBeat.duration : 3000) / this.playbackSpeed;

    this.timerId = setTimeout(() => {
      if (this.currentIndex < this.beats.length - 1) {
        this.jumpTo(this.currentIndex + 1);
      } else {
        this.pause(); // Finished timeline
      }
    }, delay);
  }

  next() {
    if (this.currentIndex < this.beats.length - 1) {
      this.jumpTo(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.jumpTo(this.currentIndex - 1);
    }
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  /** Total duration of all beats in milliseconds */
  getTotalDuration() {
    return this.beats.reduce((sum, b) => sum + (b.duration || 3500), 0);
  }

  /** Deterministically seeks stage presentation state to an exact millisecond timestamp */
  seekTime(timeMs) {
    const totalDuration = this.getTotalDuration();
    const clampedTime = Math.max(0, Math.min(timeMs, totalDuration));
    this.currentTimeMs = clampedTime;

    let cumulativeTime = 0;
    let activeIndex = 0;
    let beatStartTime = 0;

    for (let i = 0; i < this.beats.length; i++) {
      const beatDuration = this.beats[i].duration || 3500;
      if (clampedTime >= cumulativeTime && (clampedTime < cumulativeTime + beatDuration || i === this.beats.length - 1)) {
        activeIndex = i;
        beatStartTime = cumulativeTime;
        break;
      }
      cumulativeTime += beatDuration;
    }

    const currentBeat = this.beats[activeIndex];
    const localElapsed = clampedTime - beatStartTime;
    const beatDuration = currentBeat.duration || 3500;

    this.currentIndex = activeIndex;

    if (this.camera && typeof this.camera.setTransformForTime === 'function') {
      this.camera.setTransformForTime(this.beats, activeIndex, localElapsed, beatDuration);
    }

    if (this.callbacks.onBeatChange) {
      this.callbacks.onBeatChange(currentBeat, activeIndex, this.beats.length);
    }

    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(totalDuration > 0 ? clampedTime / totalDuration : 0);
    }

    return {
      currentTimeMs: clampedTime,
      activeIndex,
      totalBeats: this.beats.length,
      isFinished: clampedTime >= totalDuration
    };
  }

  /** Advances clock deterministically by dtMs milliseconds */
  advanceClock(dtMs) {
    const nextTime = (this.currentTimeMs || 0) + dtMs;
    return this.seekTime(nextTime);
  }

  /** Returns current timeline state */
  getState() {
    const totalDuration = this.getTotalDuration();
    return {
      currentTimeMs: this.currentTimeMs || 0,
      activeIndex: this.currentIndex,
      totalBeats: this.beats.length,
      isFinished: (this.currentTimeMs || 0) >= totalDuration
    };
  }
}
