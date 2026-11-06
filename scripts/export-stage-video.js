#!/usr/bin/env node
/**
 * scripts/export-stage-video.js
 * Renders Stage Mode presentation to 1920x1080 30fps MP4 video frame-by-frame using Playwright and FFmpeg.
 *
 * Usage:
 *   node scripts/export-stage-video.js <slug> [--audio <file>] [--out <dir>]
 *
 * Example:
 *   node scripts/export-stage-video.js stage-demo-podcast --out dist/videos
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync, execSync } = require('child_process');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (_) {
  // Playwright is optional or only needed during actual video exports
}

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = null;
  let audioFile = null;
  let outDir = path.join(REPO_ROOT, 'dist', 'videos');
  let fps = 10;

  let maxDurationSec = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--audio' && i + 1 < args.length) {
      audioFile = args[++i];
    } else if (arg === '--out' && i + 1 < args.length) {
      outDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--fps' && i + 1 < args.length) {
      fps = parseInt(args[++i], 10) || 10;
    } else if (arg === '--max-duration' && i + 1 < args.length) {
      maxDurationSec = parseFloat(args[++i]);
    } else if (!arg.startsWith('--') && !slug) {
      slug = arg;
    }
  }

  if (!slug) {
    console.error('❌ Error: Missing required <slug> argument.');
    console.error('Usage: node scripts/export-stage-video.js <slug> [--audio file] [--out dir] [--fps num] [--max-duration sec]');
    process.exit(1);
  }

  return { slug, audioFile, outDir, fps, maxDurationSec };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2'
};

function createStaticServer(rootDir) {
  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    const filePath = path.join(rootDir, reqUrl);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

function getStageTargetPath(slug) {
  if (fs.existsSync(path.join(REPO_ROOT, `${slug}.html`))) {
    return `/${slug}.html`;
  }
  if (slug === 'stage-demo-podcast') {
    return '/dev/stage-demo.html';
  }
  throw new Error(`No generated HTML page found for "${slug}". Run npm run build first.`);
}

function getAudioDurationMs(audioPath) {
  if (!audioPath || !fs.existsSync(audioPath)) return 0;

  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const durationSec = parseFloat(output.trim());
    if (!isNaN(durationSec) && durationSec > 0) {
      return Math.ceil(durationSec * 1000);
    }
  } catch (e) {}

  try {
    const res = spawnSync('ffmpeg', ['-i', audioPath], { encoding: 'utf-8' });
    const stderr = res.stderr || '';
    const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      const totalSec = hours * 3600 + minutes * 60 + seconds;
      return Math.ceil(totalSec * 1000);
    }
  } catch (e) {}

  return 0;
}

function findAudioPath(slug, explicitAudio) {
  if (explicitAudio) {
    const resolved = path.resolve(process.cwd(), explicitAudio);
    if (fs.existsSync(resolved)) return resolved;
    console.warn(`⚠️ Warning: Specified audio file not found: ${explicitAudio}`);
  }

  const candidatePaths = [
    path.join(REPO_ROOT, 'audio', `${slug}.mp3`),
    path.join(REPO_ROOT, 'audio', 'blog', `${slug}.mp3`),
    path.join(REPO_ROOT, 'sounds', `${slug}.mp3`)
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

async function exportStageVideo() {
  const { slug, audioFile, outDir, fps, maxDurationSec } = parseArgs();

  console.log(`🎬 Exporting Stage Mode Video for slug: "${slug}"...`);

  // Ensure FFmpeg is available
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Error: ffmpeg is not installed or not available in PATH.');
    process.exit(1);
  }

  // Find audio file if any
  const resolvedAudio = findAudioPath(slug, audioFile);
  if (resolvedAudio) {
    console.log(`🎧 Audio source found: ${resolvedAudio}`);
  } else {
    console.log('ℹ️ No audio source found. Rendering silent video.');
  }

  // Start HTTP server on dynamic port
  const server = createStaticServer(REPO_ROOT);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`🌐 Local server running at http://127.0.0.1:${port}`);

  // Setup temporary frame directory
  const tempFramesDir = path.join(REPO_ROOT, 'tmp', `stage-frames-${slug}-${Date.now()}`);
  fs.mkdirSync(tempFramesDir, { recursive: true });

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    const targetUrl = `http://127.0.0.1:${port}${getStageTargetPath(slug)}?stage=1&render=1`;
    console.log(`🔗 Loading Stage Mode: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Wait for stage render ready hook
    await page.waitForFunction(() => window.__stageRenderReady === true, { timeout: 15000 });

    const stageDurationMs = await page.evaluate(() => window.__stageTotalDurationMs || 0);
    const audioDurationMs = getAudioDurationMs(resolvedAudio);

    let renderDurationMs = Math.max(stageDurationMs, audioDurationMs);
    if (maxDurationSec && !isNaN(maxDurationSec) && maxDurationSec > 0) {
      renderDurationMs = Math.min(renderDurationMs, maxDurationSec * 1000);
    }
    const totalFrames = Math.ceil((renderDurationMs / 1000) * fps);

    console.log(`📊 Presentation Duration: ${(stageDurationMs / 1000).toFixed(2)}s | Audio: ${(audioDurationMs / 1000).toFixed(2)}s | Target Render: ${(renderDurationMs / 1000).toFixed(2)}s (${totalFrames} frames @ ${fps}fps)`);

    console.log('📸 Capturing frames...');

    for (let f = 0; f < totalFrames; f++) {
      const timeMs = Math.round((f / fps) * 1000);
      await page.evaluate((t) => window.__seekStageTime(t), timeMs);

      const frameFilename = `frame_${String(f + 1).padStart(5, '0')}.jpg`;
      const framePath = path.join(tempFramesDir, frameFilename);

      await page.screenshot({ path: framePath, type: 'jpeg', quality: 85 });

      if ((f + 1) % 30 === 0 || f + 1 === totalFrames) {
        const percent = Math.round(((f + 1) / totalFrames) * 100);
        process.stdout.write(`  Frame ${f + 1}/${totalFrames} (${percent}%)\r`);
      }
    }
    console.log('\n✅ Frame capture complete.');

    // Ensure output directory exists
    fs.mkdirSync(outDir, { recursive: true });
    const outputVideoPath = path.join(outDir, `${slug}.mp4`);

    console.log(`🎥 Stitching video with FFmpeg -> ${outputVideoPath}`);

    const inputPattern = path.join(tempFramesDir, 'frame_%05d.jpg');
    let ffmpegCmd = '';

    if (resolvedAudio) {
      ffmpegCmd = `ffmpeg -y -r ${fps} -i "${inputPattern}" -i "${resolvedAudio}" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${outputVideoPath}"`;
    } else {
      ffmpegCmd = `ffmpeg -y -r ${fps} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p "${outputVideoPath}"`;
    }

    execSync(ffmpegCmd, { stdio: 'inherit' });

    console.log(`🎉 Successfully rendered video: ${outputVideoPath}`);
  } catch (err) {
    console.error('❌ Video rendering failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();

    // Clean up temporary frame folder
    if (fs.existsSync(tempFramesDir)) {
      fs.rmSync(tempFramesDir, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  exportStageVideo();
}

module.exports = { getStageTargetPath };
