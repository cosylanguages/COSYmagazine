import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

// Interview scaffolds for Sept-Dec live in content/issues/<YYYY-MM>/posts with
// draft: true. They must be openable in the studio via ?slug= (they are in the
// manifest) while producing no page and staying out of the catalog.

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
  '.svg': 'image/svg+xml'
};

const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content-manifest.json'), 'utf-8'));

const SCAFFOLDS = [
  { month: '2026-09', slug: 'in-conversation-founder-september-plateau', theme: 'plateau' },
  { month: '2026-10', slug: 'in-conversation-founder-october-favourites', theme: 'play' },
  { month: '2026-11', slug: 'in-conversation-founder-november-cognitive-immersion', theme: 'brain' },
  { month: '2026-12', slug: 'in-conversation-founder-december-winter-solstice', theme: 'winter' }
];

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const safePath = path.normalize(decodeURIComponent(req.url?.split('?')[0] || '/'))
      .replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(process.cwd(), safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, () => { port = server.address().port; resolve(); }));
});

test.afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
});

test('all four interview scaffolds are present in the manifest', () => {
  for (const s of SCAFFOLDS) {
    expect(manifest.posts[s.slug], `${s.slug} missing from manifest`).toBe(
      `content/issues/${s.month}/posts/${s.slug}.json`
    );
  }
});

test('scaffolds stay out of the built catalog and generate no page', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'posts.json'), 'utf-8'));
  const items = Array.isArray(catalog) ? catalog : catalog.posts || [];
  const slugs = new Set(items.map((p: any) => p.slug));

  for (const s of SCAFFOLDS) {
    expect(slugs.has(s.slug), `${s.slug} leaked into posts.json`).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), `${s.slug}.html`)), `${s.slug} generated a page`).toBe(false);
  }
});

for (const s of SCAFFOLDS) {
  test(`studio opens ${s.month} interview scaffold`, async ({ page }) => {
    await page.goto(`http://localhost:${port}/editor.html?slug=${s.slug}`);

    await expect(page.locator('#meta-slug')).toHaveValue(s.slug, { timeout: 15000 });
    await expect(page.locator('#meta-title')).not.toHaveValue('');

    // Every scaffold must actually carry questions for the writer to answer.
    const source = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `content/issues/${s.month}/posts/${s.slug}.json`), 'utf-8')
    );
    const questions = source.blocks.filter(
      (b: any) => b.type === 'paragraph' && typeof b.text === 'string' && b.text.startsWith('<strong>COSYmagazine:</strong>')
    );
    expect(questions.length, `${s.slug} has no questions`).toBeGreaterThanOrEqual(6);
    expect(source.draft).toBe(true);
    expect(source.section).toBe('founder_interview');
  });
}
