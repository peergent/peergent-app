import { BrainLlmValidationError } from "./errors";
import type { ReasoningLlmPayload } from "./reasoning-llm-schema";
import { validEvidenceIdSet, type PromptEvidenceItem } from "./intelligence-evidence-context";

function assertEvidenceRefs(ids: readonly string[], allowed: Set<string>, field: string): void {
  const invalid = ids.filter((id) => id && !allowed.has(id));
  if (invalid.length > 0) {
    throw new BrainLlmValidationError(
      `Invalid evidence reference in ${field}: ${invalid.join(", ")}`,
      [`invalid_evidence_ref:${field}`]
    );
  }
}

export function validateReasoningLlmPayload(
  parsed: unknown,
  input: { allowedEvidenceIds: Set<string> }
): ReasoningLlmPayload {
  if (!parsed || typeof parsed !== "object") {
    throw new BrainLlmValidationError("Reasoning LLM payload must be an object.", ["invalid_root"]);
  }

  const payload = parsed as ReasoningLlmPayload;
  if (!Array.isArray(payload.interpretations)) {
    throw new BrainLlmValidationError("Missing interpretations array.", ["missing_interpretations"]);
  }

  for (const item of payload.interpretations) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "interpretations");
  }
  for (const item of payload.opportunities ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "opportunities");
  }
  for (const item of payload.risks ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "risks");
  }
  for (const item of payload.hypotheses ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "hypotheses");
  }
  for (const item of payload.strategicImplications ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "strategicImplications");
  }

  return payload;
}

export function buildAllowedEvidenceIds(items: readonly PromptEvidenceItem[]): Set<string> {
  return validEvidenceIdSet(items);
}
