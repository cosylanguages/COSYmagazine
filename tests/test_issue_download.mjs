import test from 'node:test';
import assert from 'node:assert/strict';
import IssueDownload from '../js/issue-download.js';

test('IssueDownload: fails when issue ID is missing', async () => {
  const res = await IssueDownload.downloadIssue({}, null, {
    client: {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) }
    }
  });
  assert.equal(res.success, false);
  assert.equal(res.error, 'missing_issue_id');
});

test('IssueDownload: handles unauthenticated users gracefully', async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({ data: { user: null } })
    }
  };

  const res = await IssueDownload.downloadIssue({ id: 'Vol. 2026.08', title: 'August Issue' }, null, { client: fakeClient });
  assert.equal(res.success, false);
  assert.equal(res.error, 'unauthenticated');
});

test('IssueDownload: handles not-entitled / forbidden access (403)', async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-free' } } })
    },
    functions: {
      invoke: async (name, opts) => {
        assert.equal(name, 'get-issue-download-url');
        assert.equal(opts.body.volume_number, 'Vol. 2026.08');
        return {
          data: null,
          error: {
            status: 403,
            message: 'User does not hold an active subscription or entitlement for this issue'
          }
        };
      }
    }
  };

  const res = await IssueDownload.downloadIssue({ id: 'Vol. 2026.08', title: 'August Issue' }, null, { client: fakeClient });
  assert.equal(res.success, false);
  assert.equal(res.error, 'not_entitled');
});

test('IssueDownload: handles unconfigured / unpublished issue (404)', async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-pro' } } })
    },
    functions: {
      invoke: async () => ({
        data: null,
        error: {
          status: 404,
          message: 'Issue archive PDF not found or not yet published'
        }
      })
    }
  };

  const res = await IssueDownload.downloadIssue({ id: 'Vol. 2028.01', title: 'Future Issue' }, null, { client: fakeClient });
  assert.equal(res.success, false);
  assert.equal(res.error, 'issue_not_configured');
});

test('IssueDownload: handles network errors during edge function invocation', async () => {
  const fakeClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-pro' } } })
    },
    functions: {
      invoke: async () => {
        throw new Error('Failed to fetch');
      }
    }
  };

  const res = await IssueDownload.downloadIssue({ id: 'Vol. 2026.08', title: 'August Issue' }, null, { client: fakeClient });
  assert.equal(res.success, false);
  assert.equal(res.error, 'Failed to fetch');
});

test('IssueDownload: succeeds and returns signed_url for authorized download', async () => {
  let invokedBody = null;
  const fakeClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-vip' } } })
    },
    functions: {
      invoke: async (name, opts) => {
        invokedBody = opts.body;
        return {
          data: {
            signed_url: 'https://iajkejcmoykubthlwfra.supabase.co/storage/v1/object/sign/magazine-editions/Vol-2026-08.pdf?token=abc',
            filename: 'COSYmagazine-2026-08.pdf'
          },
          error: null
        };
      }
    }
  };

  const res = await IssueDownload.downloadIssue({ id: 'Vol. 2026.08', title: 'Get Ready for School' }, null, { client: fakeClient });
  assert.equal(res.success, true);
  assert.match(res.signed_url, /https:\/\/iajkejcmoykubthlwfra\.supabase\.co/);
  assert.equal(invokedBody.volume_number, 'Vol. 2026.08');
});
