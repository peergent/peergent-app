import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";

export function buildCapabilityExecutionContext(input: {
  assembly: ContextAssemblyResult;
  request: BrainRunRequestWithBudget;
  campaignContext?: CampaignContext | null;
  marketingUnderstanding?: MarketingUnderstanding | null;
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
}): CapabilityExecutionContext {
  return {
    companySnapshot: input.assembly.companySnapshot,
    campaignContext: input.campaignContext ?? input.request.campaignContext ?? null,
    marketingUnderstanding:
      input.marketingUnderstanding ?? input.request.marketingUnderstanding ?? null,
    upstreamOutputs: input.upstreamOutputs ?? input.request.upstreamOutputs ?? {},
    performanceMetrics: input.request.performanceMetrics,
    locale: input.request.locale === "nl" ? "nl" : "en",
  };
}

export function hashUpstreamOutputVersions(
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>
): string {
  if (!upstreamOutputs || Object.keys(upstreamOutputs).length === 0) return "none";
  return Object.entries(upstreamOutputs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, out]) => `${id}:${out?.capabilityVersion ?? "0"}:${out?.generatedAt ?? ""}`)
    .join("|");
}
