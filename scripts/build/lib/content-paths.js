/**
 * scripts/build/lib/content-paths.js
 * Single source of truth for where post sources live.
 *
 * Content is grouped by role:
 *   content/issues/<YYYY-MM>/posts/*.json   — articles that belong to a magazine issue
 *   content/issues/<YYYY-MM>/drafts/*.json  — staged variants for that issue (never built)
 *   content/website/<desk>/posts/*.json     — site-only series (e.g. Saturday Mistakes)
 *
 * Output paths are derived from `slug`, never from the source location, so reorganising
 * the tree cannot change the generated site.
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', '..', '..');
const CONTENT_DIR = path.join(BLOG_DIR, 'content');

// Folders under content/ whose posts are compiled into the site.
const POST_GLOBS = [
  path.join(CONTENT_DIR, 'issues'),
  path.join(CONTENT_DIR, 'website')
];

/** Recursively collects *.json files, skipping any directory named `drafts`. */
function walkJson(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'drafts') continue;
      walkJson(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

/** Every published-source JSON file across issues/ and website/. */
function listPostFiles() {
  const files = [];
  for (const root of POST_GLOBS) {
    if (fs.existsSync(root)) walkJson(root, files);
  }
  // Sort by filename, not path: filenames are slugs, so this reproduces the stable
  // alphabetical order the flat posts/ directory used to give, keeping catalog
  // ordering independent of which folder a post now lives in.
  return files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

/**
 * All post sources keyed by slug. Later duplicates are ignored so a stray copy cannot
 * silently shadow the canonical one; `duplicates` reports them for validation.
 */
function loadPosts() {
  const posts = new Map();
  const duplicates = [];
  for (const file of listPostFiles()) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
      duplicates.push({ file, error: e.message });
      continue;
    }
    const slug = data.slug || path.basename(file, '.json');
    if (posts.has(slug)) {
      duplicates.push({ file, slug, existing: posts.get(slug).__file });
      continue;
    }
    data.__file = file;
    posts.set(slug, data);
  }
  return { posts, duplicates };
}

module.exports = { BLOG_DIR, CONTENT_DIR, listPostFiles, loadPosts };
