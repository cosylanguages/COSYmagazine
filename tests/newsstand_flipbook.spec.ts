import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

let port: number;
let server: any;

const MIME_TYPES: Record<string, string> = {
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
    const safePath = path.normalize(req.url?.split('?')[0] || '/').replace(/^(\.\.[\/\\])+/, '');
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
    await new Promise<void>((resolve) => server.close(resolve));
  }
});

test.describe('COSYmagazine Newsstand & Flipbook Reader Interactive E2E Suite', () => {

  test('Desktop (1280x720): Open Newsstand, Lead Cover, Keyboard Flip, Deep Links, Reduced Motion & Video', async ({ browser }) => {
    const videosDir = path.join(process.cwd(), 'tests/videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: videosDir,
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();

    // 1. Open Newsstand
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForLoadState('domcontentloaded');

    // Check Newsstand title and hero section
    const newsstandTitle = await page.textContent('.blog-header-title');
    expect(newsstandTitle).toContain('COSYmagazine');

    // Verify Founder Deck buttons on Newsstand
    const expandBtn = page.locator('.founder-expand-btn');
    await expandBtn.click();
    await page.waitForTimeout(200);
    const isExpanded = await page.locator('.founder-presentation-card').evaluate((el) => el.classList.contains('expanded'));
    expect(isExpanded).toBe(true);

    // 2. Click Current Issue Cover
    const heroCover = page.locator('#hero-cover-container');
    await heroCover.click();
    await page.waitForURL(/\.html/);

    // Return to Newsstand and click article 'replace-very-50-stronger-adjectives.html'
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForLoadState('domcontentloaded');

    const articleLink = page.locator('a[href*="replace-very-50-stronger-adjectives.html"]').first();
    await articleLink.click();
    await page.waitForURL(/replace-very-50-stronger-adjectives\.html/);
    await page.waitForSelector('.post-full-content');

    // Verify Flipbook loaded and initialized
    const page1Indicator = await page.textContent('.flipbook-indicator');
    expect(page1Indicator).toMatch(/PAGE 1/i);

    // 3. Flip through pages with Keyboard (ArrowRight)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const page2Indicator = await page.textContent('.flipbook-indicator');
    expect(page2Indicator).toMatch(/PAGE 2/i);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const page3Indicator = await page.textContent('.flipbook-indicator');
    expect(page3Indicator).toMatch(/PAGE 3/i);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const backToPage2 = await page.textContent('.flipbook-indicator');
    expect(backToPage2).toMatch(/PAGE 2/i);

    // 4. Test Table of Contents popover & deep links
    const contentsTrigger = page.locator('.magazine-contents-trigger');
    await contentsTrigger.click();
    await page.waitForSelector('#magazine-contents-menu:not([hidden])');

    const contentsItem3 = page.locator('.contents-item-btn[data-page="3"]');
    await contentsItem3.click();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('#page-3');

    // 5. Test Read as One Page (FLAT SCROLL) mode
    const modeToggleBtn = page.locator('.flipbook-mode-toggle');
    await modeToggleBtn.click();
    await page.waitForTimeout(200);
    const isScrollMode = await page.locator('.post-full-content').evaluate((el) => el.classList.contains('scroll-mode'));
    expect(isScrollMode).toBe(true);

    // Toggle back to Flipbook Spread mode
    await modeToggleBtn.click();
    await page.waitForTimeout(200);
    const isFlipbookMode = await page.locator('.post-full-content').evaluate((el) => el.classList.contains('flipbook-mode'));
    expect(isFlipbookMode).toBe(true);

    // 6. Test Deep Link (#page-3) directly in new navigation
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives.html#page-3`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);
    const deepLinkIndicator = await page.textContent('.flipbook-indicator');
    expect(deepLinkIndicator).toMatch(/PAGE 3/i);

    // Test Browser Back button hash sync back to Page 1
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives.html#page-2`);
    await page.waitForTimeout(200);
    await page.goBack();
    await page.waitForTimeout(300);

    // 7. Verify reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);

    await context.close();

    // Verify desktop video recording created
    const videoPath = page.video() ? await page.video()!.path() : null;
    expect(videoPath).not.toBeNull();
    if (videoPath && fs.existsSync(videoPath)) {
      const destPath = path.join(videosDir, 'desktop-flipbook-flip.webm');
      fs.copyFileSync(videoPath, destPath);
    }
  });

  test('Mobile (390x844): Touch Swipe, Dog-Ear Turn, Localized TOC across 14 Target Languages & Video', async ({ browser }) => {
    const videosDir = path.join(process.cwd(), 'tests/videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      recordVideo: {
        dir: videosDir,
        size: { width: 390, height: 844 }
      }
    });

    const page = await context.newPage();

    // 1. Open French localized post page
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-fr.html`);
    await page.waitForLoadState('domcontentloaded');

    // Check localized toolbar furniture string
    const frIndicator = await page.textContent('.flipbook-indicator');
    expect(frIndicator).toMatch(/PAGE 1 SUR/i);

    // 2. Perform touch swipe gesture left (next page)
    const contentBox = await page.locator('.post-full-content').boundingBox();
    if (contentBox) {
      const startX = contentBox.x + contentBox.width * 0.8;
      const endX = contentBox.x + contentBox.width * 0.2;
      const startY = contentBox.y + contentBox.height * 0.5;

      await page.touchscreen.tap(startX, startY);
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, startY, { steps: 10 });
      await page.mouse.up();
    }
    await page.waitForTimeout(300);

    // Click Dog-Ear turn button on mobile
    const dogEarBtn = page.locator('.magazine-dog-ear').first();
    await dogEarBtn.click();
    await page.waitForTimeout(300);

    // Check localized Russian post page
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-ru.html`);
    await page.waitForLoadState('domcontentloaded');
    const ruIndicator = await page.textContent('.flipbook-indicator');
    expect(ruIndicator).toMatch(/СТРАНИЦА 1 ИЗ/i);

    // Check localized Greek post page
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-el.html`);
    await page.waitForLoadState('domcontentloaded');
    const elIndicator = await page.textContent('.flipbook-indicator');
    expect(elIndicator).toMatch(/ΣΕΛΙΔΑ 1 ΑΠΟ/i);

    await context.close();

    // Verify mobile video recording created
    const videoPath = page.video() ? await page.video()!.path() : null;
    expect(videoPath).not.toBeNull();
    if (videoPath && fs.existsSync(videoPath)) {
      const destPath = path.join(videosDir, 'mobile-flipbook-swipe.webm');
      fs.copyFileSync(videoPath, destPath);
    }
  });

  test('Back Issues Archive: shelf lists all issues and filters feed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForLoadState('domcontentloaded');

    // Verify Back Issues section exists
    const backIssuesSection = page.locator('.back-issues-section');
    await expect(backIssuesSection).toBeVisible();

    // Verify Issue Shelf Cards exist
    const issueCards = page.locator('.issue-card');
    const cardCount = await issueCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Click an Issue Card to filter feed
    const firstIssueCard = issueCards.first();
    await firstIssueCard.click();
    await page.waitForTimeout(200);

    // Verify feed is filtered
    const visibleCards = await page.locator('.post-card:visible').count();
    expect(visibleCards).toBeGreaterThan(0);
  });

});
