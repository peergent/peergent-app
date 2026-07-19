import type { BrainSnapshot } from "@/lib/context-engine/adapters/brain/business-brain-adapter";
import type { ContextLayerKey, PeerRole } from "@/lib/context-engine/types";

export type BrainFieldKey = keyof BrainSnapshot;

export type PeerPromptStrategy = {
  role: PeerRole;
  roleDescription: string;
  behavioralInstructions: readonly string[];
  relevantBrainFields: readonly BrainFieldKey[];
  excludedBrainFields: readonly BrainFieldKey[];
  defaultPriorities: readonly string[];
  promptLayers: readonly ContextLayerKey[];
  alwaysExcludeLayers: readonly ContextLayerKey[];
};

export const SHARED_BEHAVIORAL_INSTRUCTIONS = [
  "Use only the business context provided below.",
  "Do not invent company facts, products, customers, policies, or capabilities.",
  "When information is missing or uncertain, state what is unknown instead of guessing.",
  "Ask clarifying questions before making assumptions about the business.",
] as const;

export const ANTI_FABRICATION_INSTRUCTION =
  "Never fabricate facts about the company, its products, customers, or policies.";

export function getSharedBehavioralInstructions(): string[] {
  return [...SHARED_BEHAVIORAL_INSTRUCTIONS];
}

export function formatBulletList(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function joinParagraphs(paragraphs: readonly (string | null | undefined)[]): string {
  return paragraphs.filter(Boolean).join("\n\n");
}
