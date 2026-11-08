#!/usr/bin/env node
/**
 * scripts/generate-blog-art.js
 * 1. Assigns sensible default artDirection metadata across blog/posts.json and blog/posts/*.json.
 * 2. Generates static SVG cover files in blog/og/{slug}.svg for Open Graph and social media usage.
 *
 * Usage: node scripts/generate-blog-art.js
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..');
const POSTS_DIR = path.join(BLOG_DIR, 'posts');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const OG_DIR = path.join(BLOG_DIR, 'og');

const DESK_MOTIF_MAP = {
  'Front Page': 'paper-cut',
  'Words': 'riso-print',
  'Grammar Made Cosy': 'window-light',
  'Say It': 'gingham-knit',
  'Culture & Quotes': 'ticket-stub',
  'Long Reads': 'doodle-border',
  'Cosy Events': 'vintage-stamp',
  'The Podcast': 'tea-stain',
  'Back Issues': 'paper-cut'
};

const DEFAULT_PALETTES = {
  'Front Page': ['#1e293b', '#0d9488', '#f59e0b', '#faf7f2'],
  'Words': ['#2d3748', '#319795', '#d69e2e', '#f7fafc'],
  'Grammar Made Cosy': ['#1a365d', '#3182ce', '#dd6b20', '#ebf8ff'],
  'Say It': ['#742a2a', '#e53e3e', '#d69e2e', '#fff5f5'],
  'Culture & Quotes': ['#44337a', '#805ad5', '#b794f4', '#faf5ff'],
  'Long Reads': ['#22543d', '#38a169', '#d69e2e', '#f0fff4'],
  'Cosy Events': ['#702459', '#b83280', '#ed64a6', '#fff5f7'],
  'The Podcast': ['#1a202c', '#4a5568', '#a0aec0', '#f7fafc'],
  'Back Issues': ['#2c5282', '#4299e1', '#90cdf4', '#ebf8ff']
};

function determineDesk(category, tags, type) {
  if (type === 'guide') return 'Long Reads';
  if (!tags) return 'Words';
  const tagStr = tags.join(' ').toLowerCase();
  if (tagStr.includes('grammar')) return 'Grammar Made Cosy';
  if (tagStr.includes('phrases') || tagStr.includes('verbs') || tagStr.includes('adjectives') || tagStr.includes('vocabulary')) return 'Words';
  if (tagStr.includes('sentenceframes') || tagStr.includes('speaking')) return 'Say It';
  if (tagStr.includes('welcome') || tagStr.includes('ecosystem')) return 'Front Page';
  return 'Words';
}

async function generateBlogArt() {
  console.log('🎨 Generating blog artwork and updating post artDirection metadata...');

  if (!fs.existsSync(OG_DIR)) {
    fs.mkdirSync(OG_DIR, { recursive: true });
  }

  // Dynamic import for ES modules
  const generatorModule = await import('../js/art/generator.js');
  const { renderCover } = generatorModule;

  // 1. Update blog/posts.json
  if (fs.existsSync(POSTS_JSON)) {
    const posts = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf-8'));
    let updatedCount = 0;

    posts.forEach(post => {
      const desk = determineDesk(post.category, post.tags, post.type);
      const motif = DESK_MOTIF_MAP[desk] || 'paper-cut';
      const palette = DEFAULT_PALETTES[desk] || DEFAULT_PALETTES['Front Page'];

      post.artDirection = {
        palette,
        fonts: { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
        layout: 'standard-feed',
        motif,
        seed: post.slug,
        coverOverride: post.cover_image || null
      };

      // Generate OG SVG
      const svgContent = renderCover(
        {
          title: post.title,
          kicker: post.category ? post.category.toUpperCase() : 'EDITORIAL',
          desk,
          slug: post.slug,
          artDirection: post.artDirection,
          issue: { number: post.issue_volume || '', title: post.issue_title || '' }
        },
        { width: 1200, height: 630 }
      );

      const ogPath = path.join(OG_DIR, `${post.slug}.svg`);
      fs.writeFileSync(ogPath, svgContent, 'utf-8');
      updatedCount++;
    });

    fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf-8');

    const INDEX_JSON = path.join(BLOG_DIR, 'index.json');
    if (fs.existsSync(INDEX_JSON)) {
      const indexObj = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
      if (indexObj && Array.isArray(indexObj.posts)) {
        const postsMap = new Map(posts.map(p => [p.slug, p.artDirection]));
        indexObj.posts.forEach(p => {
          if (postsMap.has(p.slug)) {
            p.artDirection = postsMap.get(p.slug);
          }
        });
        fs.writeFileSync(INDEX_JSON, JSON.stringify(indexObj, null, 2), 'utf-8');
      }
    }

    console.log(`✅ Updated artDirection for ${updatedCount} posts in blog/posts.json and blog/index.json and generated Open Graph SVG covers in blog/og/`);
  }

  // 2. Update JSON posts in blog/posts/*.json
  if (fs.existsSync(POSTS_DIR)) {
    const jsonFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
    jsonFiles.forEach(file => {
      const filePath = path.join(POSTS_DIR, file);
      try {
        const postData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const desk = postData.desk || 'Front Page';
        const motif = postData.artDirection?.motif || DESK_MOTIF_MAP[desk] || 'paper-cut';
        const palette = postData.artDirection?.palette || DEFAULT_PALETTES[desk] || DEFAULT_PALETTES['Front Page'];

        postData.artDirection = {
          palette,
          fonts: postData.artDirection?.fonts || { display: 'Fraunces', text: 'DM Sans', accent: 'Fraunces Italic' },
          layout: postData.artDirection?.layout || 'magazine-spread',
          motif,
          seed: postData.artDirection?.seed || postData.slug,
          coverOverride: postData.artDirection?.coverOverride || null
        };

        fs.writeFileSync(filePath, JSON.stringify(postData, null, 2), 'utf-8');

        // Generate OG SVG
        const svgContent = renderCover(postData, { width: 1200, height: 630 });
        fs.writeFileSync(path.join(OG_DIR, `${postData.slug}.svg`), svgContent, 'utf-8');
      } catch (e) {
        console.error(`❌ Failed processing ${file}:`, e.message);
      }
    });
  }
}

if (require.main === module) {
  generateBlogArt().catch(err => {
    console.error('Fatal error in generateBlogArt:', err);
    process.exit(1);
  });
}

module.exports = { generateBlogArt };
