import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JIRA_DOMAIN = 'get-issue-test-domain';
process.env.JIRA_API_KEY = 'my-api-key';
process.env.JIRA_SERVICE_EMAIL = 'svc@example.com';
process.env.JIRA_PROJECT_KEY = 'PROJ';

const { getIssue } = await import('../src/providers/jira/get-issue.ts');

const mockFetch = (
  t: import('node:test').TestContext,
  handleRequest: (url: string) => Response,
) => {
  t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
    const url = String(input);
    if (url.includes('_edge/tenant_info')) {
      return new Response(JSON.stringify({ cloudId: 'abc-123' }), { status: 200 });
    }
    return handleRequest(url);
  });
};

test('getIssue requests issue/<key> and returns the parsed issue', async (t) => {
  let seenUrl = '';
  mockFetch(t, (url) => {
    seenUrl = url;
    return new Response(
      JSON.stringify({ id: '10', key: 'FOO-1', self: 'https://x', fields: { summary: 'hi' } }),
      { status: 200 },
    );
  });

  const issue = await getIssue('FOO-1');

  assert.match(seenUrl, /\/issue\/FOO-1$/);
  assert.deepEqual(issue, { id: '10', key: 'FOO-1', self: 'https://x', fields: { summary: 'hi' } });
});

test('getIssue URL-encodes the issue id or key', async (t) => {
  let seenUrl = '';
  mockFetch(t, (url) => {
    seenUrl = url;
    return new Response(JSON.stringify({ id: '10', key: 'FOO-1', self: 'https://x', fields: {} }), { status: 200 });
  });

  await getIssue('weird key/with slash');

  assert.match(seenUrl, /\/issue\/weird%20key%2Fwith%20slash$/);
});

test('getIssue surfaces a not-found error from the underlying request', async (t) => {
  mockFetch(t, () => new Response('issue does not exist', { status: 404, statusText: 'Not Found' }));

  await assert.rejects(
    () => getIssue('MISSING-1'),
    /Jira API error 404 Not Found: issue does not exist/,
  );
});
