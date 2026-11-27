import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

const POST_SLUGS = [
  'replace-very-50-stronger-adjectives',
  'replace-very-50-stronger-adjectives-ru',
  'replace-very-50-stronger-adjectives-el',
  'replace-very-50-stronger-adjectives-fr'
];

let server;
let port: number;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const safePath = path.normalize(req.url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(process.cwd(), safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, () => {
    port = server.address().port;
    resolve();
  }));
});

test.afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test.describe('Stage Mode Camera & Viewport Bounding Box Verification', () => {
  for (const slug of POST_SLUGS) {
    test(`Verify all beats target elements remain inside viewport for post: ${slug}`, async ({ page }) => {
      const url = `http://localhost:${port}/${slug}.html?stage=1&render=1`;

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(url);

      // Wait for stage controller & render ready flag
      await page.waitForFunction(() => window.__stageRenderReady === true, { timeout: 10000 });

      const totalBeats = await page.evaluate(() => window.__stageTotalBeats);
      expect(totalBeats).toBeGreaterThan(0);

      const screenshotsDir = path.join(process.cwd(), 'tests/screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      for (let i = 0; i < totalBeats; i++) {
        // Seek to beat index
        await page.evaluate((beatIdx) => {
          const controller = window.stageController;
          if (controller && controller.timeline) {
            controller.timeline.jumpTo(beatIdx);
          }
        }, i);

        // Wait a bit for requestAnimationFrame / transform application
        await page.waitForTimeout(100);

        // Check target element bounding box against stage-viewport and caption band
        const boundingInfo = await page.evaluate((beatIdx) => {
          const viewport = document.querySelector('#stage-viewport');
          const lowerThird = document.querySelector('#stage-lower-third');
          const controller = window.stageController;
          if (!viewport || !controller || !controller.timeline) return null;

          const beat = controller.timeline.beats[beatIdx];
          if (!beat) return null;

          let targetEl = beat.targetSelector ? document.querySelector(beat.targetSelector) : null;

          if (!targetEl || targetEl.getBoundingClientRect().width === 0 || targetEl.getBoundingClientRect().height === 0) {
            targetEl = document.querySelector('.stage-card') || viewport;
          }

          const vpRect = viewport.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const ltRect = lowerThird ? lowerThird.getBoundingClientRect() : null;

          const isInsideViewport = (
            targetRect.left >= vpRect.left - 1 &&
            targetRect.right <= vpRect.right + 1 &&
            targetRect.top >= vpRect.top - 1 &&
            targetRect.bottom <= vpRect.bottom + 1
          );

          const isAboveCaption = ltRect
            ? targetRect.bottom <= ltRect.top + 1
            : true;

          return {
            beatIdx,
            targetSelector: beat.targetSelector,
            isInsideViewport,
            isAboveCaption,
            isInside: isInsideViewport && isAboveCaption,
            vpRect: { left: vpRect.left, right: vpRect.right, top: vpRect.top, bottom: vpRect.bottom, w: vpRect.width, h: vpRect.height },
            targetRect: { left: targetRect.left, right: targetRect.right, top: targetRect.top, bottom: targetRect.bottom, w: targetRect.width, h: targetRect.height },
            ltRect: ltRect ? { left: ltRect.left, right: ltRect.right, top: ltRect.top, bottom: ltRect.bottom } : null
          };
        }, i);

        expect(boundingInfo, `Beat index ${i}: Failed to get bounding info`).not.toBeNull();
        if (!boundingInfo.isInside) {
          throw new Error(
            `Beat index ${i} (${boundingInfo.targetSelector}) failed bounds check!\n` +
            `Viewport: ${JSON.stringify(boundingInfo.vpRect)}\n` +
            `Target: ${JSON.stringify(boundingInfo.targetRect)}\n` +
            `LowerThird: ${JSON.stringify(boundingInfo.ltRect)}\n` +
            `isInsideViewport: ${boundingInfo.isInsideViewport}, isAboveCaption: ${boundingInfo.isAboveCaption}`
          );
        }

        // Verify Clean View toggle & lower third caption quality
        const lowerThirdText = await page.evaluate(() => {
          return document.querySelector('#lower-third-text')?.textContent || '';
        });
        expect(lowerThirdText).not.toMatch(/[*_`#~]/);

        // Visual regression screenshots for beats 1, 5, 20, and last beat for 'replace-very-50-stronger-adjectives'
        if (slug === 'replace-very-50-stronger-adjectives') {
          const beatNum = i + 1;
          if (beatNum === 1 || beatNum === 5 || beatNum === 20 || beatNum === totalBeats) {
            // Standard View Screenshot
            const screenshotPath = path.join(screenshotsDir, `stage-beat-${beatNum}.png`);
            await page.screenshot({ path: screenshotPath });

            // Test Clean View by adding .hide-recording
            await page.evaluate(() => {
              document.querySelector('#stage-controls')?.classList.add('hide-recording');
              document.querySelector('#stage-progress-bar')?.classList.add('hide-recording');
              document.querySelector('#stage-lower-third')?.classList.add('hide-recording');
            });
            await page.waitForTimeout(50);

            const isCleanHidden = await page.evaluate(() => {
              const controls = document.querySelector('#stage-controls');
              const progress = document.querySelector('#stage-progress-bar');
              const lowerThird = document.querySelector('#stage-lower-third');
              const cDisp = window.getComputedStyle(controls).display;
              const pDisp = window.getComputedStyle(progress).display;
              const lDisp = window.getComputedStyle(lowerThird).display;
              return cDisp === 'none' && pDisp === 'none' && lDisp === 'none';
            });
            expect(isCleanHidden, `Beat ${beatNum}: Clean View should hide controls, progress bar, and lower third`).toBe(true);

            const cleanPath = path.join(screenshotsDir, `stage-clean-beat-${beatNum}.png`);
            await page.screenshot({ path: cleanPath });

            // Restore non-clean view
            await page.evaluate(() => {
              document.querySelector('#stage-controls')?.classList.remove('hide-recording');
              document.querySelector('#stage-progress-bar')?.classList.remove('hide-recording');
              document.querySelector('#stage-lower-third')?.classList.remove('hide-recording');
            });
            await page.waitForTimeout(50);
          }
        }
      }
    });
  }
});
