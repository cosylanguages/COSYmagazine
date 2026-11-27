import test from 'node:test';
import assert from 'node:assert/strict';

import { StageTimeline } from '../js/stage/timeline.js';

test('StageTimeline - Auto-generates beats for post without explicit beats', () => {
  const samplePost = {
    title: 'Sample Presentation Title',
    dek: 'Sample subheadline description',
    blocks: [
      { type: 'heading', level: 2, text: 'Introduction' },
      { type: 'paragraph', text: 'This is the first paragraph.' },
      { type: 'pullquote', quote: 'Language learning is journey.', attribution: 'JY DM' }
    ]
  };

  const mockCamera = {
    spotlight: () => {},
    pushIn: () => {},
    pullBack: () => {},
    focus: () => {},
    clearSpotlight: () => {}
  };

  const timeline = new StageTimeline(samplePost, mockCamera);

  // Title beat + 3 block beats + Outro beat = 5 beats total
  assert.strictEqual(timeline.beats.length, 5);
  assert.strictEqual(timeline.beats[0].id, 'beat-title');
  assert.strictEqual(timeline.beats[0].caption, 'Sample Presentation Title');
  assert.strictEqual(timeline.beats[4].id, 'beat-outro');
});

test('StageTimeline - Uses explicit beat properties when present', () => {
  const samplePost = {
    title: 'Explicit Beats Post',
    blocks: [
      {
        type: 'heading',
        text: 'Custom Beat Heading',
        say: 'Welcome to this custom beat.',
        beat: {
          duration: 1200,
          camera: 'push-in',
          reveal: 'fade-in'
        }
      }
    ]
  };

  const timeline = new StageTimeline(samplePost, null);
  const headingBeat = timeline.beats[1];

  assert.strictEqual(headingBeat.duration, 1200);
  assert.strictEqual(headingBeat.cameraPreset, 'push-in');
  assert.strictEqual(headingBeat.say, 'Welcome to this custom beat.');
});

test('StageTimeline - Playback controls (play, pause, togglePlay, jumpTo)', () => {
  const samplePost = {
    title: 'Playback Controls Post',
    blocks: [{ type: 'paragraph', text: 'Paragraph text' }]
  };

  let lastBeatIndex = -1;
  let playState = false;

  const timeline = new StageTimeline(samplePost, null, {
    onBeatChange: (beat, idx) => { lastBeatIndex = idx; },
    onPlayStateChange: (isPlaying) => { playState = isPlaying; }
  });

  assert.strictEqual(timeline.isPlaying, false);

  timeline.play();
  assert.strictEqual(timeline.isPlaying, true);
  assert.strictEqual(playState, true);
  assert.strictEqual(lastBeatIndex, 0);

  timeline.pause();
  assert.strictEqual(timeline.isPlaying, false);
  assert.strictEqual(playState, false);

  timeline.jumpTo(2);
  assert.strictEqual(timeline.currentIndex, 2);
  assert.strictEqual(lastBeatIndex, 2);
});

test('StageTimeline - Deterministic clock seeking (seekTime and advanceClock)', () => {
  const samplePost = {
    title: 'Clock Seeking Post',
    blocks: [
      { type: 'heading', text: 'Section 1', beat: { duration: 2000 } },
      { type: 'paragraph', text: 'Paragraph 1', beat: { duration: 3000 } }
    ]
  };

  let mockCameraTimeCall = null;
  const mockCamera = {
    setTransformForTime: (beats, activeIndex, localElapsed, duration) => {
      mockCameraTimeCall = { activeIndex, localElapsed, duration };
    }
  };

  let currentRatio = 0;
  const timeline = new StageTimeline(samplePost, mockCamera, {
    onProgress: (ratio) => { currentRatio = ratio; }
  });

  // Title beat: 4000ms
  // Section 1: 2000ms
  // Paragraph 1: 3000ms
  // Outro beat: 5200ms
  // Total = 4000 + 2000 + 3000 + 5200 = 14200ms
  assert.strictEqual(timeline.getTotalDuration(), 14200);

  // Seek to t = 0 (Title beat)
  let state = timeline.seekTime(0);
  assert.strictEqual(state.activeIndex, 0);
  assert.strictEqual(state.currentTimeMs, 0);
  assert.strictEqual(state.isFinished, false);
  assert.strictEqual(mockCameraTimeCall.activeIndex, 0);
  assert.strictEqual(mockCameraTimeCall.localElapsed, 0);

  // Seek to t = 5000ms (Section 1 beat, 1000ms into beat)
  state = timeline.seekTime(5000);
  assert.strictEqual(state.activeIndex, 1);
  assert.strictEqual(mockCameraTimeCall.activeIndex, 1);
  assert.strictEqual(mockCameraTimeCall.localElapsed, 1000);
  assert.strictEqual(currentRatio, 5000 / 14200);

  // Advance clock by 2000ms to t = 7000ms (Paragraph 1 beat, 1000ms into beat)
  state = timeline.advanceClock(2000);
  assert.strictEqual(state.currentTimeMs, 7000);
  assert.strictEqual(state.activeIndex, 2);
  assert.strictEqual(mockCameraTimeCall.activeIndex, 2);
  assert.strictEqual(mockCameraTimeCall.localElapsed, 1000);

  // Seek beyond end (t = 16000ms clamped to 14200ms)
  state = timeline.seekTime(16000);
  assert.strictEqual(state.currentTimeMs, 14200);
  assert.strictEqual(state.activeIndex, 3);
  assert.strictEqual(state.isFinished, true);
});
