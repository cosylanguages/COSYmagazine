// Structure guard for the long-form lesson "Top 10 verbs, part 1", one run per language edition.
// It catches the mistakes that are easy to make when editing a 250-block article by hand:
// broken deep links, quizzes with an invalid answer index, leaked template syntax, bad HTML.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const EDITIONS = ['en', 'fr', 'it', 'ru'];           // add 'el' when that edition is rewritten
const VERBS = ['be', 'have', 'think', 'know', 'like', 'want', 'go', 'can', 'eat', 'drink'];
const text = (b) => JSON.stringify(b);
const load = (lang) => JSON.parse(fs.readFileSync(new URL(`../posts/top-10-verbs-${lang}.json`, import.meta.url), 'utf8'));

for (const lang of EDITIONS) {
  const post = load(lang);
  const ids = () => post.blocks.filter((b) => b.type === 'heading' && b.id).map((b) => b.id);

  test(`[${lang}] every verb has its own anchored section, plus the intro and the wrap-up`, () => {
    for (const id of ['start', ...VERBS.map((v) => `verb-${v}`), 'verb-together']) {
      assert.ok(ids().includes(id), `missing heading id "${id}"`);
    }
    assert.equal(new Set(ids()).size, ids().length, 'heading ids must be unique');
  });

  test(`[${lang}] every #anchor linked from the article exists`, () => {
    const known = new Set(ids());
    const links = [...text(post.blocks).matchAll(/href=\\"#([a-z0-9-]+)\\"/g)].map((m) => m[1]);
    assert.ok(links.length >= 10, 'the verb map should link to every verb');
    for (const l of links) assert.ok(known.has(l), `link to #${l} has no matching heading id`);
  });

  test(`[${lang}] every verb section has a quiz with valid answers`, () => {
    const quizzes = post.blocks.filter((b) => b.type === 'quiz');
    assert.ok(quizzes.length >= 30, `expected a quiz per verb (got ${quizzes.length})`);
    for (const q of quizzes) {
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `quiz needs options: ${q.question}`);
      assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length, `bad correctIndex: ${q.question}`);
      assert.ok(q.explanation && q.explanation.length > 10, `quiz needs an explanation: ${q.question}`);
      assert.equal(new Set(q.options).size, q.options.length, `duplicate options: ${q.question}`);
    }
    let current = null;
    const seen = new Set();
    for (const b of post.blocks) {
      if (b.type === 'heading' && b.id) current = b.id;
      if (b.type === 'quiz' && current) seen.add(current);
    }
    for (const v of VERBS) assert.ok(seen.has(`verb-${v}`), `verb-${v} has no quiz`);
  });

  test(`[${lang}] no leaked template syntax or placeholders`, () => {
    const all = text(post.blocks);
    for (const bad of ['undefined', '[object', 'NaN', '${', 'TODO', 'lorem']) {
      assert.ok(!all.includes(bad), `found "${bad}" in the article`);
    }
  });

  test(`[${lang}] HTML blocks are balanced and diagrams carry a spoken description`, () => {
    const count = (s, re) => (s.match(re) || []).length;
    for (const b of post.blocks.filter((x) => x.type === 'paragraph' && /^</.test(x.text) && x.text !== '<hr>')) {
      for (const tag of ['div', 'figure', 'table', 'ul', 'ol']) {
        assert.equal(count(b.text, new RegExp(`<${tag}[\\s>]`, 'g')), count(b.text, new RegExp(`</${tag}>`, 'g')), `unbalanced <${tag}> in: ${b.text.slice(0, 70)}`);
      }
      if (/<figure/.test(b.text)) assert.ok(b.say && b.say.length > 20, `diagram without a "say" description: ${b.text.slice(0, 70)}`);
    }
  });
}

test('[en] the English edition carries the podcast episode so the page can embed it', () => {
  const post = load('en');
  assert.ok(post.podcast && post.podcast.externalUrl, 'podcast.externalUrl is required for the embedded player');
});

test('[fr] French punctuation uses non-breaking spaces before ? ! ; : and no plain-space gaps', () => {
  const post = load('fr');
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  const strings = [];
  const walk = (v, k) => {
    if (typeof v === 'string') { if (['text', 'question', 'explanation', 'headers', 'rows', 'items', 'options'].includes(k)) strings.push(plain(v)); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, ['text', 'question', 'explanation', 'headers', 'rows', 'items', 'options'].includes(k) ? k : kk));
  };
  walk(post.blocks, 'blocks');
  const bad = strings.filter((s) => / [?!;:]/.test(s) && !/https?:/.test(s));
  assert.equal(bad.length, 0, `plain space before a French punctuation mark in: ${bad.slice(0, 2).join(' | ').slice(0, 160)}`);
  assert.ok(!strings.some((s) => /\p{L}'\p{L}/u.test(s)), 'use the curly apostrophe (’) in French text');
});

test('[it] Italian punctuation has no space before ? ! ; : and uses curly apostrophes', () => {
  const post = load('it');
  const keys = ['text', 'question', 'explanation', 'headers', 'rows', 'items', 'options'];
  const strings = [];
  const walk = (v, k) => {
    if (typeof v === 'string') { if (keys.includes(k)) strings.push(v.replace(/<[^>]+>/g, '')); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, keys.includes(k) ? k : kk));
  };
  walk(post.blocks, 'blocks');
  const spaced = strings.filter((s) => / [?!;:]/.test(s) && !/https?:/.test(s));
  assert.equal(spaced.length, 0, `space before punctuation in: ${spaced.slice(0, 2).join(' | ').slice(0, 160)}`);
  const straight = strings.filter((s) => /\p{L}'\p{L}/u.test(s) || /\p{L}'$/u.test(s));
  assert.equal(straight.length, 0, `use the curly apostrophe in: ${straight.slice(0, 2).join(' | ').slice(0, 160)}`);
});

test('[ru] Russian typography: guillemets without inner spaces, no space before ? ! ; :, stress marks present', () => {
  const post = load('ru');
  const keys = ['text', 'question', 'explanation', 'headers', 'rows', 'items', 'options'];
  const strings = [];
  const walk = (v, k) => {
    if (typeof v === 'string') { if (keys.includes(k)) strings.push(v.replace(/<[^>]+>/g, '')); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, keys.includes(k) ? k : kk));
  };
  walk(post.blocks, 'blocks');
  const spaced = strings.filter((s) => / [?!;:]/.test(s) && !/https?:/.test(s));
  assert.equal(spaced.length, 0, `space before punctuation in: ${spaced.slice(0, 2).join(' | ').slice(0, 160)}`);
  assert.ok(!strings.some((s) => /« | »/.test(s)), 'no spaces inside « »');
  assert.ok(!strings.some((s) => s.includes('^')), 'a raw ^ stress marker leaked into the text');
  const accents = strings.join('').split('\u0301').length - 1;
  assert.ok(accents >= 150, `expected stress marks on verb forms and vocabulary (found ${accents})`);
});
