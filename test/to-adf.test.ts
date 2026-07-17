import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAdf } from '../src/providers/jira/to-adf.ts';

test('toAdf wraps plain text in an ADF document', () => {
  const doc = toAdf('hello world');

  assert.deepEqual(doc, {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'hello world' }],
      },
    ],
  });
});

test('toAdf preserves an empty string as the text node', () => {
  const doc = toAdf('');

  assert.equal(doc.content[0]?.content[0]?.text, '');
});
