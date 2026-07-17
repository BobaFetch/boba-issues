# boba-issues

A lightweight, provider-namespaced SDK for issue trackers. Each provider is exposed as its own namespace (`jira`, and more to come) so you can use one or several from the same package.

## Install

```sh
npm install boba-issues
```

## Configure

Copy `.env.example` to `.env` and fill in your Jira credentials:

```sh
cp .env.example .env
```

| Variable              | Description                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `JIRA_DOMAIN`          | Your Jira Cloud subdomain, e.g. `your-team` for `https://your-team.atlassian.net` |
| `JIRA_API_KEY`         | API token from your [Atlassian account settings](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_SERVICE_EMAIL`   | Email address associated with the API token                                 |
| `JIRA_PROJECT_KEY`     | Default project key used when creating issues, e.g. `ENG`                   |

## Usage

```ts
import { jira } from 'boba-issues';

const issue = await jira.createIssue({
  summary: 'Something is broken',
  description: 'Steps to reproduce...',
});

const fetched = await jira.getIssue(issue.key);
```

### `jira.createIssue(input)`

| Field         | Type     | Required | Notes                                      |
| ------------- | -------- | -------- | ------------------------------------------- |
| `summary`     | `string` | yes      | Issue title                                 |
| `description` | `string` | no       | Plain text; converted to Jira's document format internally |
| `issueType`   | `string` | no       | Defaults to `"Task"`                        |
| `projectKey`  | `string` | no       | Defaults to `JIRA_PROJECT_KEY`               |

### `jira.getIssue(issueIdOrKey)`

Fetches a single issue by its ID or key (e.g. `"ENG-123"`).

## Roadmap

Additional providers (e.g. Linear) will be added as their own namespace exports alongside `jira`, without changing existing usage.

## License

MIT
