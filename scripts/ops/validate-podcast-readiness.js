#!/usr/bin/env node
/**
 * scripts/ops/validate-podcast-readiness.js
 * Writer's tool to validate blog posts for podcast readiness.
 * Flags missing `say` and `beat` fields for each content block and reports
 * which posts are 100% podcast-ready.
 *
 * Usage: node scripts/ops/validate-podcast-readiness.js
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', '..');
const { listPostFiles } = require('../build/lib/content-paths.js');

function validatePodcastReadiness() {
  console.log('🎙️ Validating Blog Posts for Podcast Readiness...\n');

  const jsonFiles = listPostFiles();
  if (jsonFiles.length === 0) {
    console.error('❌ No blog post sources found under content/');
    process.exit(1);
  }
  let totalPosts = 0;
  let podcastReadyCount = 0;
  const reports = [];

  jsonFiles.forEach(filePath => {
    const file = path.basename(filePath);
    let post;
    try {
      post = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`❌ Could not parse ${file}:`, e.message);
      return;
    }

    totalPosts++;
    const blocks = post.blocks || [];
    const totalBlocks = blocks.length;

    let sayCount = 0;
    let beatCount = 0;
    const missingSayIndices = [];
    const missingBeatIndices = [];

    blocks.forEach((block, idx) => {
      const blockNum = idx + 1;
      if (block.say && typeof block.say === 'string' && block.say.trim().length > 0) {
        sayCount++;
      } else {
        missingSayIndices.push(blockNum);
      }

      if (block.beat && typeof block.beat === 'object') {
        beatCount++;
      } else {
        missingBeatIndices.push(blockNum);
      }
    });

    const sayReadinessPct = totalBlocks > 0 ? Math.round((sayCount / totalBlocks) * 100) : 0;
    const beatReadinessPct = totalBlocks > 0 ? Math.round((beatCount / totalBlocks) * 100) : 0;
    const isPodcastReady = totalBlocks > 0 && sayCount === totalBlocks;

    if (isPodcastReady) {
      podcastReadyCount++;
    }

    reports.push({
      file,
      path: path.relative(BLOG_DIR, filePath),
      slug: post.slug || file.replace('.json', ''),
      title: post.title || 'Untitled',
      language: post.language || 'en',
      level: post.level || 'A0–B2',
      totalBlocks,
      sayCount,
      beatCount,
      sayReadinessPct,
      beatReadinessPct,
      missingSayIndices,
      missingBeatIndices,
      isPodcastReady
    });
  });

  // Sort: non-ready first, then by lowest readiness percentage
  reports.sort((a, b) => {
    if (a.isPodcastReady !== b.isPodcastReady) {
      return a.isPodcastReady ? 1 : -1;
    }
    return a.sayReadinessPct - b.sayReadinessPct;
  });

  // Print Summary Table & Findings
  reports.forEach(r => {
    const statusIcon = r.isPodcastReady ? '✅ PODCAST READY' : '⚠️ NEEDS SCRIPT';
    console.log(`--------------------------------------------------`);
    console.log(`${statusIcon} | [${r.language.toUpperCase()}] ${r.file}`);
    console.log(`Title: "${r.title}"`);
    console.log(`Blocks: ${r.totalBlocks} | Spoken Scripts (say): ${r.sayCount}/${r.totalBlocks} (${r.sayReadinessPct}%) | Beat Directions: ${r.beatCount}/${r.totalBlocks} (${r.beatReadinessPct}%)`);

    if (r.missingSayIndices.length > 0) {
      console.log(`  └─ Missing 'say' on block(s): ${r.missingSayIndices.join(', ')} (will fall back to block text)`);
    }
    if (r.missingBeatIndices.length > 0) {
      console.log(`  └─ Missing 'beat' on block(s): ${r.missingBeatIndices.join(', ')} (auto-timing will be generated)`);
    }
  });

  const overallPct = Math.round((podcastReadyCount / totalPosts) * 100);
  console.log(`\n==================================================`);
  console.log(`📊 PODCAST READINESS SUMMARY`);
  console.log(`==================================================`);
  console.log(`Total Posts Examined: ${totalPosts}`);
  console.log(`100% Podcast-Ready Posts (all blocks have 'say'): ${podcastReadyCount} / ${totalPosts} (${overallPct}%)`);
  console.log(`==================================================\n`);

  return {
    totalPosts,
    podcastReadyCount,
    reports
  };
}

if (require.main === module) {
  validatePodcastReadiness();
}

module.exports = { validatePodcastReadiness };
