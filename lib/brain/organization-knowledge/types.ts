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

/** Durable organization competitor — materialized from Business Brain. */
export type MaterializedOrganizationCompetitor = {
  name: string;
  url?: string;
  source: "business_brain";
};

export type MaterializedOrganizationKnowledge = {
  organizationId: string;
  websiteSnapshot: WebsiteSnapshot | null;
  websiteSourceKind: OrganizationWebsiteSourceKind;
  websiteKnowledgeAvailable: boolean;
  websiteAnalysisAvailable: boolean;
  marketingUnderstanding: MarketingUnderstanding | null;
  /** Normalized durable organization competitors from Business Brain. */
  competitors: readonly MaterializedOrganizationCompetitor[];
  competitorRowCount: number;
  competitorNamedCount: number;
  competitorMaterializedCount: number;
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
  /** For privacy-safe diagnostics only — does not affect org load scope. */
  usesExternalBrand?: boolean;
  competitorsSkipped?: boolean;
};

export type OrganizationKnowledgeInjectionStats = {
  competitorsInjectedIntoSnapshot: boolean;
  usesExternalBrand: boolean;
};
