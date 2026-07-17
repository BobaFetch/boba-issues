import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JIRA_DOMAIN = 'http-test-domain';
process.env.JIRA_API_KEY = 'my-api-key';
process.env.JIRA_SERVICE_EMAIL = 'svc@example.com';
process.env.JIRA_PROJECT_KEY = 'PROJ';

const { request } = await import('../src/providers/jira/http.ts');

// Every test needs the cloud-id lookup (`_edge/tenant_info`) satisfied before
// http.ts's own request goes through, since getUrl() runs first each call.
const mockFetch = (
  t: import('node:test').TestContext,
  handleRequest: (url: string, init: RequestInit) => Response,
) => {
  t.mock.method(globalThis, 'fetch', async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input);
    if (url.includes('_edge/tenant_info')) {
      return new Response(JSON.stringify({ cloudId: 'abc-123' }), { status: 200 });
    }
    return handleRequest(url, init);
  });
};

test('request sends a Basic auth header built from email and api key', async (t) => {
  let seenAuth: string | null = null;
  mockFetch(t, (_url, init) => {
    seenAuth = (init.headers as Record<string, string>).Authorization;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });

  await request('issue/FOO-1');

  const expected = `Basic ${Buffer.from('svc@example.com:my-api-key').toString('base64')}`;
  assert.equal(seenAuth, expected);
});

test('request builds the url from the resolved base url and given path', async (t) => {
  let seenUrl = '';
  mockFetch(t, (url) => {
    seenUrl = url;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });

  await request('issue/FOO-1');

  assert.equal(seenUrl, 'https://api.atlassian.com/ex/jira/abc-123/rest/api/3/issue/FOO-1');
});

test('request lets caller-supplied init override method/body while keeping default headers', async (t) => {
  let seenInit: RequestInit = {};
  mockFetch(t, (_url, init) => {
    seenInit = init;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });

  await request('issue', { method: 'POST', body: JSON.stringify({ a: 1 }) });

  assert.equal(seenInit.method, 'POST');
  assert.equal(seenInit.body, JSON.stringify({ a: 1 }));
  assert.equal((seenInit.headers as Record<string, string>).Accept, 'application/json');
});

test('request returns undefined for a 204 No Content response', async (t) => {
  mockFetch(t, () => new Response(null, { status: 204 }));

  const result = await request('issue/FOO-1', { method: 'DELETE' });

  assert.equal(result, undefined);
});

test('request parses and returns JSON for a successful response', async (t) => {
  mockFetch(t, () => new Response(JSON.stringify({ id: '10', key: 'FOO-1' }), { status: 200 }));

  const result = await request('issue/FOO-1');

  assert.deepEqual(result, { id: '10', key: 'FOO-1' });
});

test('request throws with status and body text for a non-ok response', async (t) => {
  mockFetch(t, () => new Response('project key is invalid', { status: 400, statusText: 'Bad Request' }));

  await assert.rejects(
    () => request('issue', { method: 'POST' }),
    /Jira API error 400 Bad Request: project key is invalid/,
  );
});
