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
  /** When set to marketing-plan, appends structured plan output instructions. */
  outputFormat?:
    | "default"
    | "marketing-strategy"
    | "marketing-plan"
    | "marketing-content-draft"
    | "marketing-creative-brief"
    | "marketing-linkedin-post"
    | "marketing-email-campaign";
  /** Required when outputFormat is marketing-plan — the strategy to transform into a plan. */
  marketingStrategy?: import("@/lib/marketing-intelligence/types/strategy").MarketingStrategy;
  /** Required when outputFormat is marketing-linkedin-post — approved creative direction. */
  marketingCreativeBrief?: import("@/lib/creative-brief").CreativeBrief;
  /** Required when outputFormat is marketing-content-draft — the approved plan. */
  marketingPlan?: import("@/lib/marketing-intelligence/types/plan").MarketingPlan;
  /** Required when outputFormat is marketing-content-draft — selected content-calendar activity title. */
  planActivityReference?: string;
};

export const PROMPT_LAYER_ORDER: ContextLayerKey[] = [
  "identity",
  "organization",
  "objective",
  "company-dna",
  "marketing-understanding",
  "business-brain",
  "policy",
  "knowledge",
  "memory",
  "tools",
  "peer-type",
];

export const PROMPT_SECURITY_EXCLUDED_LAYERS: ContextLayerKey[] = ["telemetry"];
