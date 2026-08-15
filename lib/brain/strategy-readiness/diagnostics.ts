import type { StrategyReadinessEnrichmentInput } from "./types";
import {
  evaluateEffectiveStrategyContextReadiness,
  buildEffectiveCampaignContextForStrategyReadiness,
} from "./build-effective-campaign-context";
import type {
  StrategyReadinessKnowledgeResolvedDiagnostic,
  StrategyReadinessDiagnosticPayload,
} from "./types";

export type { StrategyReadinessDiagnosticPayload };

export function emitStrategyReadinessDiagnostic(
  payload: StrategyReadinessDiagnosticPayload
): void {
  if (process.env.BRAIN_ORCHESTRATION_DIAGNOSTICS === "0") return;
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      domain: "brain_orchestration",
      ...payload,
    })
  );
}

export function emitStrategyReadinessKnowledgeResolvedDiagnostic(
  payload: StrategyReadinessKnowledgeResolvedDiagnostic
): void {
  if (process.env.BRAIN_ORCHESTRATION_DIAGNOSTICS === "0") return;
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      domain: "brain_orchestration",
      ...payload,
    })
  );
}

export function buildStrategyReadinessDiagnostic(
  input: StrategyReadinessEnrichmentInput & {
    organizationId: string;
    projectId: string;
    episodeId?: string;
  }
): StrategyReadinessDiagnosticPayload {
  const evaluation = evaluateEffectiveStrategyContextReadiness(input);
  const websiteKnowledgeAvailable =
    evaluation.readiness.optionalContextStates.websiteDecision !== "missing";
  const competitorKnowledgeAvailable =
    evaluation.readiness.optionalContextStates.competitorDecision !== "missing";

  return {
    event: "strategy_readiness_context_built",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    explicitFieldCount: evaluation.build.explicitFieldCount,
    derivedFieldCount: evaluation.build.derivedFieldCount,
    missingRequirementCodes: evaluation.readiness.machineReasonCodes,
    websiteKnowledgeAvailable,
    competitorKnowledgeAvailable,
    sourceKinds: evaluation.build.sourceKinds,
    ready: evaluation.ready,
  };
}

export function buildStrategyReadinessKnowledgeResolvedDiagnostic(
  input: StrategyReadinessEnrichmentInput & {
    organizationId: string;
    projectId: string;
    episodeId?: string;
  }
): StrategyReadinessKnowledgeResolvedDiagnostic {
  const build = buildEffectiveCampaignContextForStrategyReadiness(input);
  const evaluation = evaluateEffectiveStrategyContextReadiness(input);
  const sources = build.knowledgeSources;

  return {
    event: "strategy_readiness_knowledge_resolved",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    targetAudienceSource: sources.targetAudience.source,
    industrySource: sources.industry.source,
    uniqueValuePropositionSource: sources.uniqueValueProposition.source,
    productOrServiceSource: sources.productOrService.source,
    websiteDecisionSource: sources.website.source,
    competitorDecisionSource: sources.competitors.source,
    unresolved: build.unresolved,
    ready: evaluation.ready,
  };
}
