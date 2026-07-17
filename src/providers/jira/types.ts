export type AdfText = {
  type: 'text';
  text: string;
};

export type AdfParagraph = {
  type: 'paragraph';
  content: AdfText[];
};

export type AdfDocument = {
  type: 'doc';
  version: 1;
  content: AdfParagraph[];
};

export type CreateIssueInput = {
  summary: string;
  description?: string;
  issueType?: string;
  projectKey?: string;
};

export type CreateIssueResponse = {
  id: string;
  key: string;
  self: string;
};

export type JiraIssue = {
  id: string;
  key: string;
  self: string;
  fields: Record<string, unknown>;
};
