import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JIRA_DOMAIN = 'my-domain';
process.env.JIRA_API_KEY = 'my-api-key';
process.env.JIRA_SERVICE_EMAIL = 'svc@example.com';
process.env.JIRA_PROJECT_KEY = 'PROJ';

const { getUrl } = await import('../src/providers/jira/url.ts');

// getUrl caches the resolved cloud id at module scope, so test order matters:
// the failure case must run first, while the cache is still empty.
test('getUrl throws a descriptive error when tenant_info resolution fails', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('nope', { status: 503, statusText: 'Service Unavailable' }));

  await assert.rejects(
    () => getUrl(),
    /Failed to resolve Jira cloud ID for domain "my-domain": 503 Service Unavailable/,
  );
});

test('getUrl resolves the cloud id via the tenant_info endpoint and builds the base url', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ cloudId: 'abc-123' }), { status: 200 });
  });

  const url = await getUrl();

  assert.equal(url, 'https://api.atlassian.com/ex/jira/abc-123/rest/api/3/');
  assert.deepEqual(calls, ['https://my-domain.atlassian.net/_edge/tenant_info']);
});

test('getUrl caches the cloud id across calls and only fetches tenant_info once', async (t) => {
  let callCount = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    callCount += 1;
    return new Response(JSON.stringify({ cloudId: 'should-not-be-used' }), { status: 200 });
  });

  const url = await getUrl();

  assert.equal(url, 'https://api.atlassian.com/ex/jira/abc-123/rest/api/3/');
  assert.equal(callCount, 0);
});
