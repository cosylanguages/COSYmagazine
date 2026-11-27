import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'tests', 'dev']);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...walk(p));
    } else if (e.name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

// Pages that carry the injected shell (`<nav id="cosy-nav">`) must also mount the shared strip.
const shellPages = walk(ROOT).filter((f) => fs.readFileSync(f, 'utf-8').includes('<nav id="cosy-nav"></nav>'));

test('every shell page mounts the shared ecosystem strip', () => {
  assert.ok(shellPages.length > 0, 'expected magazine pages using the injected shell');
  const missing = shellPages.filter((f) => !fs.readFileSync(f, 'utf-8').includes('data-ecosystem-strip'));
  assert.deepEqual(missing, [], 'pages missing the ecosystem strip mount');
});

test('the strip mount identifies the host as COSYmagazine and loads the component', () => {
  for (const f of shellPages) {
    const html = fs.readFileSync(f, 'utf-8');
    assert.match(html, /<div data-ecosystem-strip data-self="magazine"><\/div>/, `${f}: wrong mount`);
    assert.match(html, /ecosystem-strip\.js/, `${f}: missing component script`);
    assert.match(html, /ecosystem-strip\.css/, `${f}: missing component stylesheet`);
  }
});
