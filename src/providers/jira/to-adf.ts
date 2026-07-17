import type { AdfDocument } from './types.js';

export const toAdf = (text: string): AdfDocument => ({
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }],
    },
  ],
});
