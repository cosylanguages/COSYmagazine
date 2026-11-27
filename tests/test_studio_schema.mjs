import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const editor = fs.readFileSync(path.join(ROOT, 'js/editor.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'editor.html'), 'utf8');
const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');

test('Studio save targets exist in the schema', () => {
  for (const table of ['magazine_article_overrides', 'cms_page_overrides']) {
    assert.ok(editor.includes(`.from('${table}')`), `editor must use ${table}`);
    assert.ok(sql.includes(`create table if not exists public.${table}`), `schema must create ${table}`);
    assert.ok(sql.includes(`on public.${table}`), `schema must enable RLS/policies for ${table}`);
  }
});

test('Studio makes the DB-only boundary explicit', () => {
  assert.ok(html.includes('Save to the content database'), 'modal must say what the action does');
  assert.ok(html.includes('does <strong>not</strong> change the static site files'), 'modal must say it does not publish the static site');
  assert.ok(html.includes('commit it to <code>content/</code>'), 'modal must point at the real content root');
});
