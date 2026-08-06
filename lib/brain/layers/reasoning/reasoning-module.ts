import type { ResearchGraph } from "../research/types";
import type { ReasoningGraph } from "./types";

export type ReasoningModuleId =
  | "business_reasoning"
  | "customer_reasoning"
  | "competitor_reasoning"
  | "offer_reasoning"
  | "brand_reasoning"
  | "market_reasoning"
  | "positioning_reasoning"
  | "risk_reasoning"
  | "opportunity_reasoning"
  | "constraint_reasoning"
  | "pattern_recognition"
  | "contradiction_detection"
  | "unknown_resolution";

export type ReasoningModuleInput = {
  researchGraph: ResearchGraph;
  locale?: "nl" | "en";
};

export type ReasoningModuleOutput = {
  moduleId: ReasoningModuleId;
  version: string;
  nodesContributed: number;
  confidence: number;
  createdAt: string;
};

export type ReasoningModuleSpec = {
  id: ReasoningModuleId;
  version: string;
  purpose: string;
  implemented: boolean;
  inputDescription: string;
  outputDescription: string;
};

export type ReasoningModule = {
  spec: ReasoningModuleSpec;
  /** Build understanding — must not produce recommendations or strategy. */
  reason: (input: ReasoningModuleInput) => Partial<ReasoningGraph>;
};
