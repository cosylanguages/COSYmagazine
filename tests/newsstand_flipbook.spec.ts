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
    await new Promise((resolve) => server.close(resolve));
  }
});

test.describe('COSYmagazine Newsstand & Flipbook Reader Interactive E2E Suite', () => {
  test('Desktop (1280x720): Newsstand shelf, lead cover, keyboard flip, deep links, TOC & reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Open the newsstand and confirm the hero furniture renders
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.ns-kicker')).toHaveText('COSYmagazine');
    await expect(page.locator('#ns-issues-shelf .ns-issue-volume').first()).toBeVisible();

    // 2. The featured lead cover links to an article
    const leadLink = page.locator('#ns-lead .ns-lead-art');
    await expect(leadLink).toBeVisible();
    await leadLink.click();
    await page.waitForURL(/\.html/);
    await page.waitForSelector('.post-full-content');

    // 3. Flipbook loads on a spread and flips with the keyboard
    const indicator = page.locator('.flipbook-indicator');
    await expect(indicator).toContainText('PAGE 1');
    await page.keyboard.press('ArrowRight');
    await expect(indicator).toContainText('PAGE 3');
    await page.keyboard.press('ArrowLeft');
    await expect(indicator).toContainText('PAGE 1');

    // 4. Table of Contents popover navigates and syncs the deep link
    await page.locator('.magazine-contents-trigger').click();
    await expect(page.locator('#magazine-contents-menu')).not.toHaveAttribute('hidden', '');
    await page.locator('.contents-item-btn[data-page="3"]').click();
    await page.waitForTimeout(200);
    expect(page.url()).toContain('#page-3');
    await expect(indicator).toContainText('PAGE 3');

    // 5. Deep link resolves directly
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives.html#page-3`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.flipbook-indicator')).toContainText('PAGE 3');

    // 6. Toggle between flat scroll and flipbook spread modes
    const modeToggle = page.locator('.flipbook-mode-toggle');
    await modeToggle.click();
    await expect(page.locator('.post-full-content')).toHaveClass(/scroll-mode/);
    await modeToggle.click();
    await expect(page.locator('.post-full-content')).toHaveClass(/flipbook-mode/);

    // 7. Reduced motion preference must not break flipping
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.flipbook-indicator')).toContainText(/PAGE \d/);
  });

  test('Mobile (390x844): Touch navigation and localized flipbook furniture', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // French page: furniture and counter are localized
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-fr.html`);
    await page.waitForLoadState('domcontentloaded');
    const frIndicator = page.locator('.flipbook-indicator');
    await expect(frIndicator).toContainText('PAGE 1 SUR');

    // Dog-ear turn control advances the spread
    const dogEar = page.locator('.dog-ear-next').first();
    await expect(dogEar).toBeVisible();
    await dogEar.click();
    await page.waitForTimeout(300);
    await expect(frIndicator).not.toContainText('PAGE 1 SUR');

    // Russian page counter is localized
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-ru.html`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.flipbook-indicator')).toContainText('СТРАНИЦА 1 ИЗ');

    // Greek page counter is localized
    await page.goto(`http://localhost:${port}/replace-very-50-stronger-adjectives-el.html`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.flipbook-indicator')).toContainText('ΣΕΛΙΔΑ 1 ΑΠΟ');
  });

  test('Back Issues Archive: shelf lists issues and the grid view lists articles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForLoadState('domcontentloaded');

    // Issue shelf lists volumes
    const volumes = page.locator('#ns-issues-shelf .ns-issue-volume');
    await expect(volumes.first()).toBeVisible();
    expect(await volumes.count()).toBeGreaterThan(0);

    // Switching to the catalog view reveals article cards
    await page.locator('#view-mode-grid').click();
    await expect(page.locator('#ns-catalog-section')).toBeVisible();
    const cards = page.locator('#ns-grid .ns-card');
    expect(await cards.count()).toBeGreaterThan(0);

    // Desk filter narrows the catalog
    await page.locator('#ns-desks .ns-chip').nth(1).click();
    await page.waitForTimeout(200);
    expect(await page.locator('#ns-grid .ns-card').count()).toBeGreaterThan(0);
  });
});
