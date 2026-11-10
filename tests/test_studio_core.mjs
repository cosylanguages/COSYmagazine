import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Core = require('../js/studio-core.js');
const Issues = require('../js/issue-studio.js');
const Auth = require('../js/cms-auth.js');

function memStorage() {
  const m = new Map();
  return { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

test('roles: founder aliases rank highest, unknown roles rank nowhere', () => {
  assert.ok(Core.roleAtLeast('owner', 'editor'));
  assert.ok(Core.roleAtLeast('editor', 'contributor'));
  assert.equal(Core.roleAtLeast('student', 'editor'), false);
  assert.equal(Core.roleAtLeast('hacker', 'student'), false);
});

test('verified user: ignores localStorage, needs a real session', async () => {
  globalThis.window = { localStorage: { getItem: () => 'founder' } };
  assert.equal(await Core.resolveVerifiedUser(null), null);
  const noSession = { auth: { getSession: async () => ({ data: { session: null }, error: null }) } };
  assert.equal(await Core.resolveVerifiedUser(noSession), null);
  const client = (role) => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@b.c' } } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role } : null }) }) }) })
  });
  assert.equal((await Core.resolveVerifiedUser(client('Founder'))).isFounder, true);
  assert.equal((await Core.resolveVerifiedUser(client(null))).role, 'student');
  delete globalThis.window;
});

test('cms-auth: checkAuth does not trust a role stored in the browser', async () => {
  globalThis.window = { localStorage: { getItem: k => (k === 'cosy_user_role' ? 'founder' : JSON.stringify({ role: 'founder' })), setItem() {}, removeItem() {} } };
  assert.equal(await Auth.checkAuth(), null);
  delete globalThis.window;
});

test('draft store: save, load, list, remove, and survives missing storage', () => {
  const d = Core.createDraftStore({ prefix: 't:', storage: memStorage() });
  assert.ok(d.save('a', { x: 1 }));
  assert.deepEqual(d.load('a').value, { x: 1 });
  assert.equal(d.list().length, 1);
  d.remove('a');
  assert.equal(d.load('a'), null);
  const none = Core.createDraftStore({ storage: null });
  assert.equal(none.save('a', 1), false);
  assert.deepEqual(none.list(), []);
});

test('summarizeChecks: errors block publishing, warnings do not', () => {
  const ok = Core.summarizeChecks([Core.makeCheck('a', 'ok', 'A'), Core.makeCheck('b', 'warn', 'B')]);
  assert.equal(ok.canPublish, true);
  assert.equal(Core.summarizeChecks([Core.makeCheck('a', 'error', 'A')]).canPublish, false);
  assert.equal(Core.summarizeChecks([]).canPublish, false);
});

test('issue: validation and id match the PDF uploader', () => {
  assert.equal(Issues.issueIdFromVolume('Vol. 2026.08'), 'vol-2026-08');
  assert.deepEqual(Issues.validateIssue({ number: 'Vol. 2026.08', title: 'T', date: '2026-08-15' }), []);
  assert.ok(Issues.validateIssue({ number: '2026-08', title: '' }).length >= 2);
});

test('issue: articles ordered by canonical running order, print.order wins', () => {
  const a = [{ slug: 'q', section: 'thematic_crossword' }, { slug: 'c', section: 'front_cover' },
    { slug: 'x', section: 'unknown' }, { slug: 'p', section: 'front_cover', print: { order: 999 } }];
  assert.deepEqual(Issues.orderArticles(a).map(p => p.slug), ['c', 'q', 'p', 'x']);
});

test('issue readiness: missing sections warn, two Words formats and open consent block', () => {
  const issue = { number: 'Vol. 2026.08', title: 'T' };
  const arts = [
    { slug: 'a-stop-translating', section: 'words_desk', tags: ['stop-translating'] },
    { slug: 'b-go-creative', section: 'words_desk', tags: ['go-creative'] },
    { slug: 'c', section: 'mind_matters', workflow: { featuresRealPerson: true, ledger: {} } }
  ];
  const checks = Issues.getIssueReadiness(issue, arts);
  const by = id => checks.find(c => c.id === id).level;
  assert.equal(by('sections'), 'warn');
  assert.equal(by('words-exclusive'), 'error');
  assert.equal(by('consent'), 'error');
  assert.equal(Core.summarizeChecks(checks).canPublish, false);
});

test('issue readiness: a complete clean issue can be published', () => {
  const arts = Issues.REQUIRED_SECTIONS.map(s => ({ slug: s, section: s, status: 'published', draft: false }));
  const checks = Issues.getIssueReadiness({ number: 'Vol. 2026.08', title: 'T' }, arts);
  assert.equal(Core.summarizeChecks(checks).canPublish, true);
});
