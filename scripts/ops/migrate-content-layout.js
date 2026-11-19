#!/usr/bin/env node
/**
 * scripts/ops/migrate-content-layout.js
 * One-shot: move posts/*.json into content/issues/<YYYY-MM>/posts/ or
 * content/website/<desk>/posts/, and drafts-review/*.json into the matching
 * content/issues/<YYYY-MM>/drafts/.
 *
 * Dry run by default. Pass --apply to perform the moves with `git mv` so file
 * history follows the rename.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const DRAFTS_DIR = path.join(ROOT, 'drafts-review');
const CONTENT = path.join(ROOT, 'content');

const APPLY = process.argv.includes('--apply');

const MONTH_INDEX = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

/** Canonical issue folder ("2026-08") for a post, or a website folder for site-only series. */
function folderFor(post) {
  const raw = String((post.issue && post.issue.number) || '');
  const explicit = raw.match(/(\d{4})\.(\d{2})/);
  if (explicit) return path.join('issues', `${explicit[1]}-${explicit[2]}`);
  const written = raw.match(/(\d{4})\s*[—–-]\s*([A-Za-z]+)/);
  if (written && MONTH_INDEX[written[2].toLowerCase()]) {
    return path.join('issues', `${written[1]}-${MONTH_INDEX[written[2].toLowerCase()]}`);
  }
  if (/podcast special/i.test(raw) || post.desk === 'Saturday Mistakes') {
    return path.join('website', 'saturday-mistakes');
  }
  return path.join('website', 'front-page');
}

const moves = [];

function planDir(dir, kind) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const full = path.join(dir, file);
    const post = JSON.parse(fs.readFileSync(full, 'utf-8'));
    const target = path.join(CONTENT, folderFor(post), kind, file);
    moves.push({ from: full, to: target });
  }
}

planDir(POSTS_DIR, 'posts');
planDir(DRAFTS_DIR, 'drafts');

// Collapse identical targets (same folder + filename) — keep first, report the rest.
const seen = new Map();
const conflicts = [];
for (const m of moves) {
  if (seen.has(m.to)) conflicts.push({ kept: seen.get(m.to), dropped: m });
  else seen.set(m.to, m);
}

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${seen.size} moves, ${conflicts.length} conflicts\n`);
const byTarget = new Map();
for (const m of seen.values()) {
  const key = path.relative(CONTENT, path.dirname(m.to));
  if (!byTarget.has(key)) byTarget.set(key, 0);
  byTarget.set(key, byTarget.get(key) + 1);
}
for (const key of [...byTarget.keys()].sort()) {
  console.log(`  ${key.padEnd(42)} ${byTarget.get(key)} files`);
}
if (conflicts.length) {
  console.log('\n⚠️  Conflicting targets (would overwrite):');
  conflicts.forEach((c) => console.log(`  ${c.kept.from} vs ${c.dropped.from} -> ${c.dropped.to}`));
}

if (!APPLY) {
  console.log('\nRun with --apply to perform the moves.');
  process.exit(0);
}
if (conflicts.length) {
  console.error('\n❌ Refusing to apply while conflicts exist.');
  process.exit(1);
}

for (const m of seen.values()) {
  fs.mkdirSync(path.dirname(m.to), { recursive: true });
  const relFrom = path.relative(ROOT, m.from);
  const relTo = path.relative(ROOT, m.to);
  try {
    execFileSync('git', ['mv', relFrom, relTo], { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    fs.renameSync(m.from, m.to);
  }
}

// Remove now-empty source directories so the old layout does not linger.
for (const dir of [POSTS_DIR, DRAFTS_DIR]) {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

console.log(`\n✅ Moved ${seen.size} files.`);
