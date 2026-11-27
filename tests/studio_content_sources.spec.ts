import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

// The studio loads post sources from content/ via content-manifest.json. These
// tests drive the real editor page so a broken source path fails here rather
// than in a browser console.

let port: number;
let server: any;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content-manifest.json'), 'utf-8'));

// One slug from an issue folder, one from a website folder.
function pickSlug(predicate: (p: string) => boolean) {
  const entry = Object.entries<string>(manifest.posts).find(([, p]) => predicate(p));
  if (!entry) throw new Error('no manifest entry matched');
  return { slug: entry[0], sourcePath: entry[1] };
}

const ISSUE_POST = pickSlug((p) => p.startsWith('content/issues/'));
const WEBSITE_POST = pickSlug((p) => p.startsWith('content/website/'));

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const safePath = path.normalize(decodeURIComponent(req.url?.split('?')[0] || '/'))
      .replace(/^(\.\.[/\\])+/, '');
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
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('manifest source paths all resolve over HTTP', async ({ request }) => {
  const entries = Object.entries<string>(manifest.posts);
  expect(entries.length).toBeGreaterThan(0);

  const failures: string[] = [];
  for (const [slug, rel] of entries) {
    const res = await request.get(`http://localhost:${port}/${rel}`);
    if (res.status() !== 200) failures.push(`${slug} -> ${rel} (${res.status()})`);
  }
  expect(failures, `unreachable post sources:\n${failures.join('\n')}`).toEqual([]);
});

test('studio loads an issue article from its content/ source', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('.json')) requested.push(new URL(r.url()).pathname);
  });

  await page.goto(`http://localhost:${port}/editor.html?slug=${ISSUE_POST.slug}`);

  await expect(page.locator('#meta-title')).not.toHaveValue('', { timeout: 15000 });
  await expect(page.locator('#meta-slug')).toHaveValue(ISSUE_POST.slug);

  // The fix under test: the source came from the manifest path, not posts/<slug>.json.
  expect(requested).toContain(`/${ISSUE_POST.sourcePath}`);
  expect(requested).not.toContain(`/posts/${ISSUE_POST.slug}.json`);

  // No load failure surfaced in the status bar.
  await expect(page.locator('#studio-status-bar')).not.toHaveClass(/status-error/);
});

test('studio loads a website article from its content/ source', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('.json')) requested.push(new URL(r.url()).pathname);
  });

  await page.goto(`http://localhost:${port}/editor.html?slug=${WEBSITE_POST.slug}`);

  await expect(page.locator('#meta-title')).not.toHaveValue('', { timeout: 15000 });
  await expect(page.locator('#meta-slug')).toHaveValue(WEBSITE_POST.slug);
  expect(requested).toContain(`/${WEBSITE_POST.sourcePath}`);
});

test('studio article picker is populated from the catalog and can load a post', async ({ page }) => {
  await page.goto(`http://localhost:${port}/editor.html`);

  const selector = page.locator('#studio-load-selector');
  await expect(selector.locator('option')).not.toHaveCount(0, { timeout: 15000 });

  const count = await selector.locator('option').count();
  expect(count).toBeGreaterThan(1);

  const targetSlug = ISSUE_POST.slug;
  await selector.selectOption(targetSlug);

  await expect(page.locator('#meta-slug')).toHaveValue(targetSlug, { timeout: 15000 });
  await expect(page.locator('#meta-title')).not.toHaveValue('');
});
