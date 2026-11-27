#!/usr/bin/env node
/**
 * Renders the generated 1200x630 SVG social cards to JPEG for og:image.
 * Run after `npm run build` whenever a post or its cover art changes.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const OG_DIR = path.join(ROOT, 'og');
const POSTS_JSON = path.join(ROOT, 'posts.json');

async function generateOgJpgs() {
  const posts = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  let generated = 0;
  let missing = 0;

  try {
    for (const post of posts) {
      const svgPath = path.join(OG_DIR, `${post.slug}.svg`);
      const jpgPath = path.join(OG_DIR, `${post.slug}.jpg`);
      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️ Missing SVG for ${post.slug}; skipping JPEG`);
        missing++;
        continue;
      }

      const svg = fs.readFileSync(svgPath, 'utf8');
      const data = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      await page.setContent(`<!doctype html><style>html,body{margin:0;padding:0;width:1200px;height:630px;overflow:hidden;background:#faf7f2}img{display:block;width:1200px;height:630px;object-fit:cover}</style><img src="${data}" alt="">`);
      await page.evaluate(async () => {
        await document.querySelector('img').decode();
      });
      await page.waitForTimeout(50);
      await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1200, height: 630 } });
      generated++;
      if (generated % 25 === 0) console.log(`  ${generated}/${posts.length}`);
    }
  } finally {
    await browser.close();
  }

  const live = new Set(posts.map((post) => post.slug));
  let removed = 0;
  for (const name of fs.readdirSync(OG_DIR)) {
    if (!name.endsWith('.jpg')) continue;
    if (!live.has(name.slice(0, -4))) {
      fs.rmSync(path.join(OG_DIR, name));
      removed++;
    }
  }
  if (removed) console.log(`🧹 Removed ${removed} stale OG JPEG(s)`);

  console.log(`✅ Generated ${generated} OG JPEG(s)${missing ? `; ${missing} missing SVG(s)` : ''}`);
  if (missing) process.exitCode = 1;
  return { generated, missing };
}

if (require.main === module) {
  generateOgJpgs().catch((err) => {
    console.error('Fatal error generating OG JPEGs:', err);
    process.exit(1);
  });
}

module.exports = { generateOgJpgs };
