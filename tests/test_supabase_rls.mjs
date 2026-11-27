import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');

test('signup metadata cannot choose a privileged role', () => {
  assert.ok(
    !sql.includes("raw_user_meta_data->>'role'"),
    'handle_new_user must ignore role supplied in signup metadata'
  );
  assert.ok(
    sql.includes("'student'"),
    'handle_new_user should insert the student role explicitly'
  );
});

test('users cannot grant themselves purchases or roles', () => {
  assert.ok(
    !sql.includes('auth.uid() = user_id or exists'),
    'issue_purchases insert must not allow a user to insert their own entitlement'
  );
  assert.ok(
    sql.includes('protect_profile_role'),
    'profiles must have a trigger that blocks non-admin role changes'
  );
  assert.ok(
    sql.includes('cosy_is_privileged'),
    'RLS must use a security-definer privileged-role helper'
  );
});

test('storage entitlements match the exact PDF path, not a substring', () => {
  assert.ok(
    !sql.includes('storage.objects.name like'),
    'purchase entitlement must not use a LIKE substring match'
  );
  assert.ok(
    sql.includes('cosy_owns_issue(storage.objects.name)'),
    'purchase entitlement should use the exact-path ownership helper'
  );
});

test('every create policy has a matching drop policy for re-runs', () => {
  const creates = [...sql.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(creates.length > 0, 'schema should define policies');
  for (const name of creates) {
    assert.ok(
      sql.includes(`drop policy if exists "${name}"`),
      `policy "${name}" needs a drop policy if exists before create`
    );
  }
});

test('documented schema copy stays identical to the live schema', () => {
  const copy = fs.readFileSync(path.join(ROOT, 'docs/reference/SUPABASE_SCHEMA.sql'), 'utf8');
  assert.equal(copy, sql, 'docs/reference/SUPABASE_SCHEMA.sql must match supabase/schema.sql');
});
