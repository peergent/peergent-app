import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CompanyProfile } from "../company/profile";
import type { WebsiteSnapshot } from "../website/types";
import type { ResolvedBrainOutputs } from "../project-runtime/brain-output-resolver";

/** Inputs for merging explicit campaign setup with Peergent-discovered knowledge. */
export type StrategyReadinessEnrichmentInput = {
  campaignContext: CampaignContext;
  companyProfile?: CompanyProfile | null;
  companyWebsiteSnapshot?: WebsiteSnapshot | null;
  resolvedGraphs?: Partial<ResolvedBrainOutputs> | null;
};

/** Request-scoped enrichment overlay — campaignContext comes from the run request. */
export type StrategyReadinessRequestEnrichment = Pick<
  StrategyReadinessEnrichmentInput,
  "resolvedGraphs"
>;

export type StrategyReadinessFieldSource =
  | "explicit_campaign"
  | "company_profile"
  | "company_graph"
  | "research_graph"
  | "marketing_intelligence_graph"
  | "website_snapshot";

export type EffectiveStrategyReadinessBuildResult = {
  /** Campaign context enriched for readiness evaluation — explicit values preserved. */
  effectiveContext: CampaignContext;
  explicitFieldCount: number;
  derivedFieldCount: number;
  derivedFields: readonly string[];
  sourceKinds: readonly StrategyReadinessFieldSource[];
};

export type EffectiveStrategyReadinessEvaluation = {
  ready: boolean;
  machineReasonCodes: readonly string[];
  build: EffectiveStrategyReadinessBuildResult;
};
