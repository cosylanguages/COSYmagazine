# 🎥 Stage Mode Podcast Video Exporter

The Stage Mode Video Exporter (`scripts/export-stage-video.js`) captures a 1920x1080 Stage Mode presentation and encodes it as an `.mp4`. The default output is 10 fps; the frame rate can be changed with `--fps`.

---

## 🌟 Architecture & Deterministic Clock Hook

Standard Stage Mode uses real-time wall-clock timers (`setTimeout`, `requestAnimationFrame`, CSS transitions) for interactive browser playback. For headless video export, the exporter uses a deterministic clock hook:

1. **`?stage=1&render=1` Query Parameters**:
   - Activates `.stage-render-mode` in CSS to hide UI control overlays and progress bars for clean frame capture.
   - Disables CSS transition and animation delays so DOM updates and camera position transforms update synchronously on every clock tick.

2. **Window Clock API**:
   - `window.__stageRenderReady`: Boolean flag set to `true` when DOM, post data, and assets are fully loaded.
   - `window.__stageTotalDurationMs`: Total presentation duration in milliseconds.
   - `window.__seekStageTime(timeMs)`: Seeks the camera, spotlight state, lower-third caption, and beat timeline synchronously to the exact timestamp `timeMs`.
   - `window.__advanceStageClock(dtMs)`: Advances internal timeline by `dtMs` milliseconds.
   - `window.__getStageState()`: Returns active beat index, elapsed time, and completion status.

---

## 🚀 CLI Usage

### Prerequisites
- **Node.js**: v18 or later
- **FFmpeg**: Must be installed and available in system `PATH` (`ffmpeg` and `ffprobe`).
- **Playwright Chromium**: Installed via `npx playwright install chromium`.

### Command Syntax

```bash
node scripts/export-stage-video.js <slug> [--audio <file>] [--out <dir>] [--fps <num>]
```

### Arguments & Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<slug>` | String | **Yes** | Post slug to render (e.g., `replace-very-50-stronger-adjectives`, `stage-demo-podcast`). |
| `--audio <file>` | Path | Optional | Path to audio narration file (e.g., `.mp3`). If omitted, checks `audio/`, `audio/blog/`, and `sounds/` for a matching file, then renders a silent MP4 if none exists. |
| `--out <dir>` | Path | Optional | Output directory for the `.mp4` video. Defaults to `dist/videos/`. |
| `--fps <num>` | Number | Optional | Target frame rate for video rendering. Defaults to `10` fps. |

---

## 💡 Examples

### 1. Render Sample Post (Silent Video)

```bash
node scripts/export-stage-video.js stage-demo-podcast --out dist/videos
```

Output: `dist/videos/stage-demo-podcast.mp4`

### 2. Render a Generated Article with Audio

```bash
node scripts/export-stage-video.js why-speaking-first --audio audio/voiceover.mp3 --out dist/videos
```
Output: `dist/videos/why-speaking-first.mp4` with synced AAC audio. Replace `audio/voiceover.mp3` with an existing audio file.

The exporter writes videos locally and does not upload them.
