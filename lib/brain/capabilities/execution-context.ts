import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CompanySnapshot } from "../company/snapshot";
import type { BrainCapabilityId } from "./registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainMemoryCandidate } from "../memory/candidate";

/** Task-specific projection passed to capability executors — provider-neutral. */
export type CapabilityExecutionContext = {
  companySnapshot: CompanySnapshot;
  campaignContext?: CampaignContext | null;
  marketingUnderstanding?: MarketingUnderstanding | null;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
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
