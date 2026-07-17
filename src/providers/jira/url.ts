import { getConfig } from './config.js';

export const getUrl = () => {
  const { domain } = getConfig();

  return `https://${domain}.atlassian.net/rest/api/3/`;
};