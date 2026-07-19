import type { ContextLayerKey } from "@/lib/context-engine/types";

export type PromptContextSection = {
  key: string;
  title: string;
  body: string;
};

export type PromptPackageMetadata = {
  organizationId: string;
  peerId: string;
  peerRole: string;
  traceId: string;
  generatedAt: string;
  estimatedCharacterCount: number;
};

export type PromptPackage = {
  systemPrompt: string;
  taskPrompt: string;
  contextSections: PromptContextSection[];
  includedLayers: ContextLayerKey[];
  excludedLayers: ContextLayerKey[];
  warnings: string[];
  metadata: PromptPackageMetadata;
};

export type PromptBuilderOptions = {
  taskHint?: string;
};

export const PROMPT_LAYER_ORDER: ContextLayerKey[] = [
  "identity",
  "organization",
  "objective",
  "brain",
  "policy",
  "knowledge",
  "memory",
  "tools",
  "peer-type",
];

export const PROMPT_SECURITY_EXCLUDED_LAYERS: ContextLayerKey[] = ["telemetry"];
