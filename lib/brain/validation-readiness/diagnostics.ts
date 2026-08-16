import type { ValidationReadinessDiagnosticPayload, ValidationReadinessEnrichmentInput } from "./types";
import { evaluateEffectiveValidationContextReadiness } from "./evaluate-validation-readiness";

export function emitValidationReadinessDiagnostic(
  payload: ValidationReadinessDiagnosticPayload
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

export function buildValidationReadinessDiagnostic(
  input: ValidationReadinessEnrichmentInput & {
    organizationId: string;
    projectId: string;
    episodeId?: string;
  }
): ValidationReadinessDiagnosticPayload {
  const evaluation = evaluateEffectiveValidationContextReadiness(input);
  return {
    event: "validation_readiness_evaluated",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    score: evaluation.score,
    minimum: evaluation.minimum,
    ready: evaluation.ready,
    criteria: evaluation.criteria,
    missingRequirementCodes: evaluation.machineReasonCodes,
  };
}
