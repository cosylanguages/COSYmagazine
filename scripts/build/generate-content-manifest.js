#!/usr/bin/env node
/**
 * scripts/build/generate-content-manifest.js
 * Writes content-manifest.json: slug -> repository path of the post source.
 * Deliberately carries no timestamp, so re-running the build leaves it byte-identical.
 *
 * The studio (js/editor.js) fetches post sources at runtime. Sources now live under
 * content/, so the studio cannot guess a path from the slug; it reads this manifest
 * instead. Generated during the build, never hand-edited.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { BLOG_DIR, listPostFiles } = require('./lib/content-paths.js');

const OUT = path.join(BLOG_DIR, 'content-manifest.json');

function generate() {
  const posts = {};
  for (const file of listPostFiles()) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!data.slug) continue;
    posts[data.slug] = path.relative(BLOG_DIR, file).split(path.sep).join('/');
  }
  const manifest = { posts };
  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`✅ content-manifest.json (${Object.keys(posts).length} posts)`);
  return manifest;
}

if (require.main === module) generate();

module.exports = { generate };
