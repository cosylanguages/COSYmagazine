import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';

const POSTS_DIR = path.join(process.cwd(), 'posts');
const POST_FILES = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));

// Core target languages with non-Latin scripts that must strictly be localized
const NON_LATIN_LANGS = new Set(['ru', 'el']);

// Allowlist of brand names, proper nouns, technical acronyms, and common untranslatable tokens
const ALLOWLIST = new Set([
  'COSY', 'COSYlanguages', 'COSYmagazine', 'COSYdata', 'COSYevents', 'COSYgames', 'COSYmanuals',
  'Gazette', 'JY', 'DM', 'CELTA', 'IELTS', 'TOEFL', 'CEFR', 'A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
  'EPISODE', 'VOL', 'Vol', 'IPA', 'WhatsApp', 'Telegram', 'Google', 'YouTube', 'PDF', 'MP3', 'HTML', 'CSS', 'JS',
  'https', 'http', 'com', 'org', 'vs', 'VS', 'Me', 'Plateau', 'Intermediate'
]);

// English UI dictionary words for non-script languages (fr, it)
const ENGLISH_UI_WORDS = [
  'Written by', 'min read', 'Back to Blog',
  'Expand Deck', 'Return to Blog Index'
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

test.describe('Blog Script & Target Language i18n Validation', () => {
  for (const file of POST_FILES) {
    const postData = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8'));
    if (postData.draft) continue;

    const lang = postData.language || 'en';
    const slug = postData.slug;

    test(`Verify visible text localization for [${lang.toUpperCase()}] ${slug}`, async ({ page }) => {
      const url = `http://localhost:${port}/${slug}.html`;
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');

      // Extract all visible UI texts
      const extractedTexts = await page.evaluate(() => {
        const results = [];

        const selectors = [
          '.byline-meta',
          '.gazette-folio',
          '.gazette-back-link',
          '.gazette-mode-link',
          '.read-more-link'
        ];

        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            const text = el.innerText || el.textContent;
            if (text) results.push({ source: sel, text: text.trim() });
          });
        });

        return results;
      });

      const offendingStrings = [];

      if (NON_LATIN_LANGS.has(lang)) {
        for (const item of extractedTexts) {
          const latinTokens = item.text.match(/[A-Za-z]+/g) || [];
          for (const token of latinTokens) {
            if (!ALLOWLIST.has(token) && token.length > 1) {
              offendingStrings.push(`[${item.source}] "${token}" in string: "${item.text}"`);
            }
          }
        }
      } else if (lang === 'fr' || lang === 'it') {
        for (const item of extractedTexts) {
          for (const uiWord of ENGLISH_UI_WORDS) {
            if (item.text.includes(uiWord) && !ALLOWLIST.has(uiWord)) {
              offendingStrings.push(`[${item.source}] Untranslated English UI phrase "${uiWord}" in string: "${item.text}"`);
            }
          }
        }
      }

      if (offendingStrings.length > 0) {
        console.error(`❌ Page blog/${slug}.html (${lang}) contains offending strings:\n` + offendingStrings.join('\n'));
      }

      expect(offendingStrings.length, `Found ${offendingStrings.length} offending untranslated strings on blog/${slug}.html`).toBe(0);
    });
  }
});
