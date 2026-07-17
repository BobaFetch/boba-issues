import { getConfig } from './config.js';
import { getUrl } from './url.js';

const buildAuthHeader = (email: string, apiKey: string): string =>
  `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

export const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const { email, apiKey } = getConfig();
  const baseUrl = await getUrl();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: buildAuthHeader(email, apiKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API error ${res.status} ${res.statusText}: ${body}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
};
