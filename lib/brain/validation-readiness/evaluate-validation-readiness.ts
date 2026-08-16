import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ValidationReadinessEnrichmentInput, ValidationReadinessEvaluation, ValidationReadinessCriterion } from "./types";

const VALIDATION_READINESS_MINIMUM = 50;

function hasCreativeCapabilityOutput(
  outputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null | undefined
): boolean {
  const creative = outputs?.creative_generation;
  return Boolean(creative?.findings?.length || creative?.decisions?.length);
}

function hasBrandPipelineEvidence(input: ValidationReadinessEnrichmentInput): boolean {
  const completed = input.completedBrains ?? input.episode?.snapshot.completedBrains ?? [];
  if (completed.includes("creative")) return true;
  if (input.resolvedGraphs?.creativeGraph) return true;
  if (input.resolvedGraphs?.strategyBrainGraph) return true;
  const brandOut = input.upstreamCapabilityOutputs?.brand_understanding;
  if (brandOut?.findings?.length) return true;
  if (input.campaignContext?.brandContext?.tone?.trim()) return true;
  if (input.campaignContext?.brandContext?.brandName?.trim()) return true;
  return false;
}

/**
 * Validation evaluates pipeline-produced creative — not raw company profile completeness.
 * When the cognitive pipeline has completed creative, readiness derives from upstream artifacts.
 */
export function evaluateEffectiveValidationContextReadiness(
  input: ValidationReadinessEnrichmentInput
): ValidationReadinessEvaluation {
  const completed = input.completedBrains ?? input.episode?.snapshot.completedBrains ?? [];
  const creativeBrainDone = completed.includes("creative");
  const criteria: ValidationReadinessCriterion[] = [];

  const creativeOutput = hasCreativeCapabilityOutput(input.upstreamCapabilityOutputs);
  criteria.push({
    criterion: "creative_pipeline_output",
    satisfied: creativeBrainDone || creativeOutput,
    contribution: creativeBrainDone ? 30 : creativeOutput ? 20 : 0,
    sourceType: creativeOutput ? "upstream_capability" : "episode_artifact",
    producerBrain: "creative",
  });

  const creativeGraph = Boolean(input.resolvedGraphs?.creativeGraph);
  criteria.push({
    criterion: "creative_graph_materialized",
    satisfied: creativeGraph,
    contribution: creativeGraph ? 25 : 0,
    sourceType: "resolved_graph",
    producerBrain: "creative",
  });

  const brandEvidence = hasBrandPipelineEvidence(input);
  criteria.push({
    criterion: "brand_from_pipeline",
    satisfied: brandEvidence,
    contribution: brandEvidence ? 20 : 0,
    sourceType: input.resolvedGraphs?.creativeGraph ? "resolved_graph" : "campaign_context",
    producerBrain: "creative",
  });

  const campaignPresent = Boolean(input.campaignContext?.projectId);
  criteria.push({
    criterion: "campaign_context",
    satisfied: campaignPresent,
    contribution: campaignPresent ? 15 : 0,
    sourceType: "campaign_context",
    producerBrain: "campaign_setup",
  });

  const strategyDone = completed.includes("strategy");
  criteria.push({
    criterion: "strategy_upstream",
    satisfied: strategyDone || Boolean(input.resolvedGraphs?.strategyBrainGraph),
    contribution: strategyDone ? 10 : 0,
    sourceType: "resolved_graph",
    producerBrain: "strategy",
  });

  const score = criteria.reduce((sum, c) => sum + (c.satisfied ? c.contribution : 0), 0);
  const minimum = VALIDATION_READINESS_MINIMUM;

  const machineReasonCodes: string[] = [];
  if (!creativeBrainDone && !creativeOutput) {
    machineReasonCodes.push("missing_creative_pipeline_output");
  }
  if (creativeBrainDone && !creativeGraph && !creativeOutput) {
    machineReasonCodes.push("creative_graph_not_materialized");
  }
  if (!brandEvidence) {
    machineReasonCodes.push("missing_brand_pipeline_evidence");
  }
  if (!campaignPresent) {
    machineReasonCodes.push("missing_campaign_context");
  }

  const pipelineCreativeReady =
    (creativeBrainDone || creativeOutput) && brandEvidence && campaignPresent;

  const ready = pipelineCreativeReady && score >= minimum;

  return {
    ready,
    score,
    minimum,
    criteria,
    machineReasonCodes,
  };
}

export function buildValidationReadinessEnrichmentFromRequest(input: {
  campaignContext: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
  validationReadinessEnrichment?: import("./types").ValidationReadinessRequestEnrichment | null;
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
}): ValidationReadinessEnrichmentInput {
  return {
    campaignContext: input.campaignContext,
    episode: input.validationReadinessEnrichment?.episode ?? null,
    resolvedGraphs: input.validationReadinessEnrichment?.resolvedGraphs ?? null,
    upstreamCapabilityOutputs:
      input.validationReadinessEnrichment?.upstreamCapabilityOutputs ??
      input.upstreamOutputs ??
      null,
    completedBrains: input.validationReadinessEnrichment?.episode?.snapshot.completedBrains,
  };
}
