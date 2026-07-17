import { request } from './http.js';
import { getConfig } from './config.js';
import { toAdf } from './to-adf.js';
import type { CreateIssueInput, CreateIssueResponse } from './types.js';

export const createIssue = async (input: CreateIssueInput): Promise<CreateIssueResponse> => {
  const { projectKey } = getConfig();

  const fields = {
    summary: input.summary,
    issuetype: { name: input.issueType ?? 'Task' },
    project: { key: input.projectKey ?? projectKey },
    ...(input.description ? { description: toAdf(input.description) } : {}),
  };

  return request<CreateIssueResponse>('issue', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
};
