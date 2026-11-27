import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['en', 'fr', 'it', 'ru', 'el'];
const dicts = Object.fromEntries(
  LANGS.map((lang) => [lang, JSON.parse(fs.readFileSync(path.join(ROOT, `js/i18n/${lang}.json`), 'utf8'))])
);

function flatten(value, prefix = '', out = {}) {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object') flatten(child, full, out);
    else out[full] = child;
  }
  return out;
}

test('landing pages only use keys that exist in every dictionary', () => {
  for (const file of ['404.html', 'podcast.html']) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(html.includes('data-ui-lang="auto"'), `${file} must opt into interface translations`);
    const keys = [...html.matchAll(/data-i18n(?:-title|-aria-label|-content)?="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 0, `${file} has no i18n keys`);
    for (const lang of LANGS) {
      const flat = flatten(dicts[lang]);
      for (const key of keys) assert.ok(key in flat, `${file}: ${lang} is missing ${key}`);
    }
  }
});

test('podcast and not-found translations keep key parity', () => {
  for (const section of ['notFound', 'podcastDesk']) {
    const reference = new Set(Object.keys(dicts.en[section]));
    for (const lang of LANGS.slice(1)) {
      assert.deepEqual(new Set(Object.keys(dicts[lang][section])), reference, `${lang}.${section} keys drifted`);
    }
  }
});

test('podcast brand names contain no Cyrillic homoglyphs', () => {
  const html = fs.readFileSync(path.join(ROOT, 'podcast.html'), 'utf8');
  assert.ok(!/cО/.test(html), 'brand names must use Latin O');
});
