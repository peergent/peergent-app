import type { ResearchUnknown } from "./types";
import { RESEARCH_CONFIDENCE, RESEARCH_LAYER_VERSION } from "./types";

let unknownCounter = 0;

export function resetResearchUnknownCounter(): void {
  unknownCounter = 0;
}

export function createResearchUnknown(input: {
  id?: string;
  title: string;
  reason: string;
  collectedAt?: string;
  version?: string;
}): ResearchUnknown {
  unknownCounter += 1;
  return {
    id: input.id ?? `unknown-${unknownCounter}`,
    title: input.title,
    confidence: RESEARCH_CONFIDENCE.missing,
    reason: input.reason,
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    version: input.version ?? RESEARCH_LAYER_VERSION,
  };
}
