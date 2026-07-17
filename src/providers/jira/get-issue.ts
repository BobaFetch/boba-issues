import { request } from './http.js';
import type { JiraIssue } from './types.js';

export const getIssue = (issueIdOrKey: string): Promise<JiraIssue> =>
  request<JiraIssue>(`issue/${encodeURIComponent(issueIdOrKey)}`);
