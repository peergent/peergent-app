import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { WebsiteSnapshot } from "../website/types";

/** Privacy-safe provenance for organization website knowledge. */
export type OrganizationWebsiteSourceKind =
  | "campaign_explicit"
  | "peer_configured"
  | "website_intelligence"
  | "brain_snapshot"
  | "business_brain_source"
  | "unknown";

export type OrganizationCompetitorSourceKind =
  | "business_brain"
  | "marketing_understanding"
  | "none";

export type MaterializedOrganizationKnowledge = {
  organizationId: string;
  websiteSnapshot: WebsiteSnapshot | null;
  websiteSourceKind: OrganizationWebsiteSourceKind;
  websiteKnowledgeAvailable: boolean;
  websiteAnalysisAvailable: boolean;
  marketingUnderstanding: MarketingUnderstanding | null;
  competitorCount: number;
  competitorSourceKind: OrganizationCompetitorSourceKind;
  companyProfileEnriched: boolean;
  durationMs: number;
};

export type MaterializeOrganizationKnowledgeInput = {
  supabase: import("@/lib/intelligence/api/org-context").AppSupabaseClient;
  organizationId: string;
  peerId?: string;
  peerRole?: string;
  campaignWebsiteSkipped?: boolean;
};
