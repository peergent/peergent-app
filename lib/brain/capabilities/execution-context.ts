import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CompanySnapshot } from "../company/snapshot";
import type { BrainCapabilityId } from "./registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainMemoryCandidate } from "../memory/candidate";
import type { ResearchGraph } from "../layers/research";
import type { ReasoningGraph } from "../layers/reasoning";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";

/** Task-specific projection passed to capability executors — provider-neutral. */
export type CapabilityExecutionContext = {
  companySnapshot: CompanySnapshot;
  campaignContext?: CampaignContext | null;
  marketingUnderstanding?: MarketingUnderstanding | null;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  /** Research Layer output — additional context for downstream capabilities. */
  researchGraph?: ResearchGraph | null;
  /** Reasoning Layer output — additional context for Strategy (future migration). */
  reasoningGraph?: ReasoningGraph | null;
  /** Marketing Intelligence Layer — marketing thinking for Strategy (Sprint 9.3). */
  marketingIntelligenceGraph?: MarketingIntelligenceGraph | null;
  performanceMetrics?: readonly DemoPerformanceMetric[];
  locale: "nl" | "en";
};

export type DemoPerformanceMetric = {
  id: string;
  channel: string;
  label: string;
  value: number;
  unit: string;
  window: string;
  provenanceRef: string;
};

export type CapabilityExecutionResult = BrainStructuredOutput & {
  memoryCandidates?: readonly BrainMemoryCandidate[];
};
