import dotenv from 'dotenv';
dotenv.config();

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const JIRA_API_KEY = process.env.JIRA_API_KEY;
const JIRA_SERVICE_EMAIL = process.env.JIRA_SERVICE_EMAIL;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

export const getConfig = () => {
  if (
    !JIRA_DOMAIN ||
    !JIRA_API_KEY ||
    !JIRA_SERVICE_EMAIL ||
    !JIRA_PROJECT_KEY
  ) {
    throw new Error('Missing required JIRA configuration');
  }

  return {
    domain: JIRA_DOMAIN,
    apiKey: JIRA_API_KEY,
    email: JIRA_SERVICE_EMAIL,
    projectKey: JIRA_PROJECT_KEY,
  }
}