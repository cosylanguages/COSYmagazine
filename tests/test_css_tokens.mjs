import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'private-issues']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (['.css', '.html', '.js'].includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const definitions = new Set();
const uses = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) definitions.add(match[1]);
  for (const match of text.matchAll(/setProperty\(\s*['"]--([a-zA-Z0-9_-]+)/g)) definitions.add(match[1]);
  for (const match of text.matchAll(/var\(--([a-zA-Z0-9_-]+)(\s*,)?/g)) {
    uses.push({ name: match[1], hasFallback: Boolean(match[2]), file: path.relative(ROOT, file) });
  }
}

test('every CSS variable use resolves or has an explicit fallback', () => {
  const missing = uses.filter((use) => !definitions.has(use.name) && !use.hasFallback);
  const unique = [...new Map(missing.map((use) => [use.name, use])).values()];
  assert.deepEqual(
    unique.map((use) => `${use.name} (${use.file})`),
    [],
    'define the token or add a fallback'
  );
});

test('blog typography uses the fonts the site actually loads', () => {
  const blog = fs.readFileSync(path.join(ROOT, 'css/blog.css'), 'utf8');
  const fonts = fs.readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8');
  assert.ok(blog.includes('var(--cosy-font-sans'), 'body font must resolve to the loaded sans face');
  assert.ok(blog.includes('var(--cosy-font-serif'), 'display font must resolve to the loaded serif face');
  assert.ok(fonts.includes("font-family: 'Commissioner'"));
  assert.ok(fonts.includes("font-family: 'Fraunces'"));
  assert.ok(fonts.includes("font-family: 'Literata'"));
  assert.ok(!blog.includes("--font-sans: 'DM Sans'"), 'DM Sans is not loaded by the site');
});
