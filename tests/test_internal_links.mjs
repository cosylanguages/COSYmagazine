import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pages() {
  const root = fs.readdirSync(ROOT).filter((file) => file.endsWith('.html')).map((file) => path.join(ROOT, file));
  const dev = fs.readdirSync(path.join(ROOT, 'dev')).filter((file) => file.endsWith('.html')).map((file) => path.join(ROOT, 'dev', file));
  return [...root, ...dev];
}

function references(html) {
  const refs = [];
  for (const match of html.matchAll(/\b(href|src|poster)\s*=\s*["']([^"']+)["']/gi)) refs.push(match[2]);
  for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const part of match[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }
  return refs;
}

test('internal links and assets resolve to real files', () => {
  const broken = [];
  for (const page of pages()) {
    const html = fs.readFileSync(page, 'utf8');
    const relative = path.relative(ROOT, page).split(path.sep).join('/');
    for (const ref of references(html)) {
      if (!ref || ref.startsWith('#') || ref.includes('${')) continue;
      let url;
      try {
        url = new URL(ref, `https://example.invalid/${relative}`);
      } catch {
        continue;
      }
      if (url.origin !== 'https://example.invalid') continue;
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        continue;
      }
      if (!pathname) continue;
      if (pathname.startsWith('/COSYmagazine/')) pathname = pathname.slice('/COSYmagazine/'.length);
      else if (pathname.startsWith('/')) continue;
      const target = path.resolve(ROOT, pathname);
      if (!fs.existsSync(target)) broken.push(`${relative} -> ${ref}`);
    }
  }
  assert.deepEqual(broken, []);
});
