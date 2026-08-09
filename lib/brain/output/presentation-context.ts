import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

/** Immutable context for deriving customer-facing brain intelligence. */
export type BrainPresentationContext = {
  peerId: string;
  locale: "nl" | "en";
  isDemo: boolean;
  now: Date;
};

export type CampaignBrainPresentationContext = BrainPresentationContext & {
  project: MarketingProject;
  campaignContext: CampaignContext;
  domainInput: MarketingPeerDomainInput;
};

export function resolveBrainPresentationContext(input: {
  peerId: string;
  locale?: string | null;
  isDemo?: boolean;
  now?: Date;
}): BrainPresentationContext {
  return {
    peerId: input.peerId,
    locale: input.locale === "nl" ? "nl" : "en",
    isDemo: input.isDemo ?? input.peerId === "demo",
    now: input.now ?? new Date(),
  };
}
