import type { StrategyReadinessEnrichmentInput } from "./types";
import { evaluateEffectiveStrategyContextReadiness } from "./build-effective-campaign-context";

export type StrategyReadinessDiagnosticPayload = {
  event: "strategy_readiness_context_built";
  organizationId: string;
  projectId: string;
  episodeId?: string;
  explicitFieldCount: number;
  derivedFieldCount: number;
  missingRequirementCodes: readonly string[];
  websiteKnowledgeAvailable: boolean;
  competitorKnowledgeAvailable: boolean;
  sourceKinds: readonly string[];
  ready: boolean;
};

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
