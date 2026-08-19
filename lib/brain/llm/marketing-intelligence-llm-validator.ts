import { BrainLlmValidationError } from "./errors";
import type { MarketingIntelligenceLlmPayload } from "./marketing-intelligence-llm-schema";

function assertEvidenceRefs(ids: readonly string[], allowed: Set<string>, field: string): void {
  const invalid = ids.filter((id) => id && !allowed.has(id));
  if (invalid.length > 0) {
    throw new BrainLlmValidationError(
      `Invalid evidence reference in ${field}: ${invalid.join(", ")}`,
      [`invalid_evidence_ref:${field}`]
    );
  }
}

export function validateMarketingIntelligenceLlmPayload(
  parsed: unknown,
  input: { allowedEvidenceIds: Set<string> }
): MarketingIntelligenceLlmPayload {
  if (!parsed || typeof parsed !== "object") {
    throw new BrainLlmValidationError("MI LLM payload must be an object.", ["invalid_root"]);
  }

  const payload = parsed as MarketingIntelligenceLlmPayload;

  for (const item of payload.audienceIntelligence ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "audienceIntelligence");
  }
  for (const item of payload.competitorIntelligence ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "competitorIntelligence");
  }
  assertEvidenceRefs(
    payload.positioningIntelligence?.supportedEvidenceIds ?? [],
    input.allowedEvidenceIds,
    "positioningIntelligence"
  );
  assertEvidenceRefs(
    payload.messagingIntelligence?.supportedEvidenceIds ?? [],
    input.allowedEvidenceIds,
    "messagingIntelligence"
  );
  for (const item of payload.opportunities ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "opportunities");
  }
  for (const item of payload.risks ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "risks");
  }
  for (const item of payload.campaignRecommendations ?? []) {
    assertEvidenceRefs(item.supportedEvidenceIds ?? [], input.allowedEvidenceIds, "campaignRecommendations");
  }

  return payload;
}
