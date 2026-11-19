import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '..');
const { listPostFiles } = await import('../scripts/build/lib/content-paths.js');

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(str) {
  return decodeEntities(str)
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\d#*`_~|[\]()\\🎯📌❓✅⚪️•–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('Every JSON post builds to HTML and retains text content', () => {
  const jsonFiles = listPostFiles();
  assert.ok(jsonFiles.length > 0, 'Should find JSON post files.');

  let checkedCount = 0;

  jsonFiles.forEach(file => {
    const postData = JSON.parse(fs.readFileSync(file, 'utf-8'));

    // Skip drafts from HTML check
    if (postData.draft) {
      assert.equal(fs.existsSync(path.join(BLOG_DIR, `${postData.slug}.html`)), false, `Draft ${postData.slug}.html should not exist.`);
      return;
    }

    const htmlPath = path.join(BLOG_DIR, `${postData.slug}.html`);
    assert.ok(fs.existsSync(htmlPath), `Generated HTML file ${postData.slug}.html should exist.`);

    const htmlContent = decodeEntities(fs.readFileSync(htmlPath, 'utf-8'));
    assert.ok(htmlContent.includes(postData.title), `${postData.slug}.html should contain post title.`);

    // Extract text from blocks
    const blockTexts = [];
    (postData.blocks || []).forEach(block => {
      if (block.text) blockTexts.push(cleanText(block.text));
      if (block.targetText) blockTexts.push(cleanText(block.targetText));
      if (block.gloss) blockTexts.push(cleanText(block.gloss));
      if (block.quote) blockTexts.push(cleanText(block.quote));
      if (block.content) blockTexts.push(cleanText(block.content));
      if (block.items) block.items.forEach(it => blockTexts.push(cleanText(it)));
      if (block.headers) block.headers.forEach(h => blockTexts.push(cleanText(h)));
      if (block.rows) block.rows.forEach(r => r.forEach(c => blockTexts.push(cleanText(c))));
    });

    const cleanedHtmlText = cleanText(htmlContent);

    // Verify each block text sample is present in generated HTML
    blockTexts.forEach(txt => {
      if (txt.length > 15) {
        const sample = txt.slice(0, 25);
        assert.ok(
          cleanedHtmlText.includes(sample),
          `Expected sample "${sample}" from ${file} to be present in ${postData.slug}.html`
        );
      }
    });

    checkedCount++;
  });

  console.log(`✅ Text content equivalence verified for ${checkedCount} published posts across all JSON blocks.`);
});
