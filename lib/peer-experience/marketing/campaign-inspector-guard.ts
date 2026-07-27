import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

/**
 * Campaign workflow inspector is available only in development until a production admin role exists.
 */
export function isMarketingCampaignInspectorEnabled(): boolean {
  return isDevPlaygroundEnabled();
}
