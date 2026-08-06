import type { ReasoningConfidenceScore, ReasoningNode } from "./types";
import { REASONING_LAYER_VERSION } from "./types";

let nodeCounter = 0;

export function resetReasoningNodeCounter(): void {
  nodeCounter = 0;
}

export function clampReasoningConfidence(value: ReasoningConfidenceScore): ReasoningConfidenceScore {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function createReasoningNode(input: {
  id?: string;
  title: string;
  description: string;
  confidence: ReasoningConfidenceScore;
  supportingEvidence?: readonly string[];
  relatedResearch?: readonly string[];
  reasoningVersion?: string;
  createdAt?: string;
}): ReasoningNode {
  nodeCounter += 1;
  return {
    id: input.id ?? `reasoning-${nodeCounter}`,
    title: input.title,
    description: input.description,
    confidence: clampReasoningConfidence(input.confidence),
    supportingEvidence: input.supportingEvidence ?? [],
    relatedResearch: input.relatedResearch ?? [],
    reasoningVersion: input.reasoningVersion ?? REASONING_LAYER_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
