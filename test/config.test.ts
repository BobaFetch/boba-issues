import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const configPath = path.join(projectRoot, 'src/providers/jira/config.ts');

// getConfig() reads process.env once at module load, and config.ts calls
// dotenv.config() which would pick up this repo's real .env. Both scenarios
// are run in a fresh child process, cwd'd to an empty temp dir (no .env) with
// an explicit env object, so results don't depend on the developer's local .env.
const runInChildProcess = (env: NodeJS.ProcessEnv) => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'boba-issues-config-test-'));
  // Symlink node_modules so `--import tsx` still resolves from this cwd
  // (chosen specifically so it has no .env file of its own).
  symlinkSync(path.join(projectRoot, 'node_modules'), path.join(cwd, 'node_modules'), 'dir');
  const script = `
    import(${JSON.stringify(configPath)}).then((m) => {
      console.log(JSON.stringify(m.getConfig()));
    }).catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
  `;

  return spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
    cwd,
    env,
    encoding: 'utf8',
  });
};

test('getConfig throws when required env vars are missing', () => {
  const result = runInChildProcess({ PATH: process.env.PATH, DOTENV_CONFIG_QUIET: 'true' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required JIRA configuration/);
});

test('getConfig returns values from env vars when all are present', () => {
  const result = runInChildProcess({
    PATH: process.env.PATH,
    DOTENV_CONFIG_QUIET: 'true',
    JIRA_DOMAIN: 'my-domain',
    JIRA_API_KEY: 'my-api-key',
    JIRA_SERVICE_EMAIL: 'svc@example.com',
    JIRA_PROJECT_KEY: 'PROJ',
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    domain: 'my-domain',
    apiKey: 'my-api-key',
    email: 'svc@example.com',
    projectKey: 'PROJ',
  });
});

test('getConfig throws when only some required env vars are present', () => {
  const result = runInChildProcess({
    PATH: process.env.PATH,
    DOTENV_CONFIG_QUIET: 'true',
    JIRA_DOMAIN: 'my-domain',
    JIRA_API_KEY: 'my-api-key',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required JIRA configuration/);
});
