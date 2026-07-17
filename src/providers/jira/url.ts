import { getConfig } from './config.js';

let cachedCloudId: string | undefined;

const fetchCloudId = async (domain: string): Promise<string> => {
  const res = await fetch(`https://${domain}.atlassian.net/_edge/tenant_info`);

  if (!res.ok) {
    throw new Error(
      `Failed to resolve Jira cloud ID for domain "${domain}": ${res.status} ${res.statusText}`,
    );
  }

  const { cloudId } = (await res.json()) as { cloudId: string };
  return cloudId;
};

export const getUrl = async (): Promise<string> => {
  const { domain } = getConfig();

  cachedCloudId ??= await fetchCloudId(domain);

  return `https://api.atlassian.com/ex/jira/${cachedCloudId}/rest/api/3/`;
};
