import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JIRA_DOMAIN = 'create-issue-test-domain';
process.env.JIRA_API_KEY = 'my-api-key';
process.env.JIRA_SERVICE_EMAIL = 'svc@example.com';
process.env.JIRA_PROJECT_KEY = 'DEFAULT-PROJ';

const { createIssue } = await import('../src/providers/jira/create-issue.ts');

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

test('createIssue posts to the issue endpoint with summary and default issue type/project', async (t) => {
  let seenUrl = '';
  let seenBody: unknown;
  mockFetch(t, (url, init) => {
    seenUrl = url;
    seenBody = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ id: '10', key: 'DEFAULT-PROJ-1', self: 'https://x' }), { status: 201 });
  });

  const result = await createIssue({ summary: 'Fix the thing' });

  assert.match(seenUrl, /\/issue$/);
  assert.deepEqual(seenBody, {
    fields: {
      summary: 'Fix the thing',
      issuetype: { name: 'Task' },
      project: { key: 'DEFAULT-PROJ' },
    },
  });
  assert.deepEqual(result, { id: '10', key: 'DEFAULT-PROJ-1', self: 'https://x' });
});

test('createIssue honors an explicit issueType and projectKey over the defaults', async (t) => {
  let seenBody: unknown;
  mockFetch(t, (_url, init) => {
    seenBody = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ id: '10', key: 'OTHER-1', self: 'https://x' }), { status: 201 });
  });

  await createIssue({ summary: 'Fix the thing', issueType: 'Bug', projectKey: 'OTHER' });

  assert.deepEqual(seenBody, {
    fields: {
      summary: 'Fix the thing',
      issuetype: { name: 'Bug' },
      project: { key: 'OTHER' },
    },
  });
});

test('createIssue converts a provided description into an ADF document', async (t) => {
  let seenBody: any;
  mockFetch(t, (_url, init) => {
    seenBody = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ id: '10', key: 'DEFAULT-PROJ-1', self: 'https://x' }), { status: 201 });
  });

  await createIssue({ summary: 'Fix the thing', description: 'more details here' });

  assert.deepEqual(seenBody.fields.description, {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'more details here' }] }],
  });
});

test('createIssue omits the description field entirely when none is given', async (t) => {
  let seenBody: any;
  mockFetch(t, (_url, init) => {
    seenBody = JSON.parse(init.body as string);
    return new Response(JSON.stringify({ id: '10', key: 'DEFAULT-PROJ-1', self: 'https://x' }), { status: 201 });
  });

  await createIssue({ summary: 'Fix the thing' });

  assert.equal('description' in seenBody.fields, false);
});
