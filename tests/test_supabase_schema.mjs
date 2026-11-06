import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

test('Supabase Schema SQL - files exist in docs and supabase directories', () => {
  const docsSql = path.join(REPO_ROOT, 'docs', 'SUPABASE_SCHEMA.sql');
  const sbSql = path.join(REPO_ROOT, 'supabase', 'schema.sql');

  assert.ok(fs.existsSync(docsSql), 'docs/SUPABASE_SCHEMA.sql must exist');
  assert.ok(fs.existsSync(sbSql), 'supabase/schema.sql must exist');

  const content = fs.readFileSync(docsSql, 'utf-8');
  const sbContent = fs.readFileSync(sbSql, 'utf-8');
  assert.equal(content, sbContent, 'docs/SUPABASE_SCHEMA.sql and supabase/schema.sql must match');
});

test('Supabase Schema SQL - includes all required tables, constraints and triggers', () => {
  const sql = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'SUPABASE_SCHEMA.sql'), 'utf-8');

  // Verify core tables
  assert.match(sql, /create table if not exists public\.profiles/i);
  assert.match(sql, /create table if not exists public\.subscriptions/i);
  assert.match(sql, /create table if not exists public\.issue_purchases/i);
  assert.match(sql, /create table if not exists public\.magazine_issues/i);

  // Verify role constraints align with CosyCMSAuth
  assert.match(sql, /'student',\s*'subscriber',\s*'teacher',\s*'admin',\s*'founder',\s*'owner'/i);

  // Verify RLS is enabled for all tables
  assert.match(sql, /alter table public\.profiles enable row level security/i);
  assert.match(sql, /alter table public\.subscriptions enable row level security/i);
  assert.match(sql, /alter table public\.issue_purchases enable row level security/i);
  assert.match(sql, /alter table public\.magazine_issues enable row level security/i);

  // Verify profile trigger
  assert.match(sql, /create or replace function public\.handle_new_user\(\)/i);
  assert.match(sql, /create trigger on_auth_user_created/i);

  // Verify storage bucket definition & RLS
  assert.match(sql, /'magazine-editions'/i);
  assert.match(sql, /create policy "Paid subscribers and issue owners can access magazine PDFs"/i);

  // Verify seed data contains canonical August 2026 issue
  assert.match(sql, /'vol-2026-08'/i);
  assert.match(sql, /Get Ready for School/i);
});

test('Supabase Edge Function - get-issue-download-url exists and checks authorization', () => {
  const fnPath = path.join(REPO_ROOT, 'supabase', 'functions', 'get-issue-download-url', 'index.ts');
  assert.ok(fs.existsSync(fnPath), 'Edge function index.ts must exist');

  const tsContent = fs.readFileSync(fnPath, 'utf-8');

  // Check auth header check
  assert.match(tsContent, /req\.headers\.get\("Authorization"\)/i);
  assert.match(tsContent, /getUser\(\)/i);

  // Check role & subscription verification
  assert.match(tsContent, /from\("profiles"\)/i);
  assert.match(tsContent, /from\("subscriptions"\)/i);
  assert.match(tsContent, /from\("issue_purchases"\)/i);

  // Check signed URL creation from private storage bucket
  assert.match(tsContent, /createSignedUrl/i);
  assert.match(tsContent, /magazine-editions/i);
});
