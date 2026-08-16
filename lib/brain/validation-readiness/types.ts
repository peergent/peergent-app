import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { ProjectBrainId } from "../project-engine/types";
import type { ResolvedBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { ProjectEpisodeRecord } from "../project-runtime/types";

export type ValidationReadinessCriterionId =
  | "creative_pipeline_output"
  | "creative_graph_materialized"
  | "brand_from_pipeline"
  | "campaign_context"
  | "strategy_upstream";

export type ValidationReadinessCriterion = {
  criterion: ValidationReadinessCriterionId;
  satisfied: boolean;
  contribution: number;
  sourceType: "episode_artifact" | "resolved_graph" | "upstream_capability" | "campaign_context" | "company_profile";
  producerBrain: ProjectBrainId | "campaign_setup" | "company";
};

export type ValidationReadinessEnrichmentInput = {
  campaignContext: CampaignContext | null;
  episode: ProjectEpisodeRecord | null;
  resolvedGraphs?: Partial<ResolvedBrainOutputs> | null;
  upstreamCapabilityOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null;
  completedBrains?: readonly ProjectBrainId[];
};

export type ValidationReadinessEvaluation = {
  ready: boolean;
  score: number;
  minimum: number;
  criteria: readonly ValidationReadinessCriterion[];
  machineReasonCodes: readonly string[];
};

export type ValidationReadinessRequestEnrichment = {
  resolvedGraphs?: Partial<ResolvedBrainOutputs> | null;
  upstreamCapabilityOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null;
  episode?: ProjectEpisodeRecord | null;
};

export type ValidationReadinessDiagnosticPayload = {
  event: "validation_readiness_evaluated";
  organizationId: string;
  projectId: string;
  episodeId?: string;
  score: number;
  minimum: number;
  ready: boolean;
  criteria: readonly ValidationReadinessCriterion[];
  missingRequirementCodes: readonly string[];
};
