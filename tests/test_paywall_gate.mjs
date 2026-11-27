import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flipbook = fs.readFileSync(path.join(ROOT, 'js/flipbook.js'), 'utf8');
const postPage = fs.readFileSync(path.join(ROOT, 'scripts/build/lib/post-page.js'), 'utf8');

test('flipbook asks the auth module instead of trusting client storage', () => {
  assert.ok(flipbook.includes('hasPaidAccess(this.issueId)'), 'gate must call hasPaidAccess');
  assert.ok(!flipbook.includes('cosy_user_role'), 'gate must not trust localStorage roles');
  assert.ok(!flipbook.includes('cosy_has_paid_access'), 'gate must not trust a sessionStorage override');
});

test('flipbook only gates monthly issue pages', () => {
  assert.ok(flipbook.includes('PAYWALL_ISSUES.has(issueKey)'), 'gate must be limited to issue pages');
  assert.ok(flipbook.includes('if (!this.paywallEnabled) return false;'), 'non-issue pages must not be gated');
});

test('post pages expose the issue volume for entitlement checks', () => {
  assert.ok(
    postPage.includes('data-issue-volume='),
    'post page body needs data-issue-volume so hasPaidAccess can match purchases'
  );
});
