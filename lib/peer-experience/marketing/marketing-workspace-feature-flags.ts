/**
 * Marketing Workspace feature flags (env-backed, default off).
 * Server: MARKETING_CAMPAIGN_WORKSPACE_ENABLED=true
 * Client bundle: NEXT_PUBLIC_MARKETING_CAMPAIGN_WORKSPACE_ENABLED=true
 */

const ENV_SERVER = "MARKETING_CAMPAIGN_WORKSPACE_ENABLED";
const ENV_PUBLIC = "NEXT_PUBLIC_MARKETING_CAMPAIGN_WORKSPACE_ENABLED";

export function isMarketingCampaignWorkspaceEnabled(override?: boolean): boolean {
  if (override !== undefined) {
    return override;
  }
  if (process.env[ENV_SERVER] === "true") {
    return true;
  }
  if (process.env[ENV_PUBLIC] === "true") {
    return true;
  }
  return false;
}

export const marketingCampaignWorkspaceEnabled = {
  envKey: ENV_SERVER,
  publicEnvKey: ENV_PUBLIC,
  default: false,
} as const;
