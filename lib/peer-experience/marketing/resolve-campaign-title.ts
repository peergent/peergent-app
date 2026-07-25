import type { MarketingPlan, MarketingStrategy } from "@/lib/marketing-intelligence";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";

export function resolveCampaignTitle(
  plan: MarketingPlan | null,
  strategy: MarketingStrategy | null
): string {
  const fromPlan = plan?.campaigns?.[0]?.title?.trim();
  if (fromPlan) return fromPlan;

  const fromStrategy = strategy?.campaignIdeas?.[0]?.name?.trim();
  if (fromStrategy) return fromStrategy;

  return STUDIO_COPY.campaignFallback;
}
