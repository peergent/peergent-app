import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { ResearchGraph } from "../layers/research";
import { buildResearchGraph } from "../layers/research";
import type { ReasoningGraph } from "../layers/reasoning";
import { buildReasoningGraph } from "../layers/reasoning";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";
import { buildMarketingIntelligenceGraph } from "../layers/marketing-intelligence";
import type { ResearchBrainGraph } from "../layers/research/brain-types";
import type { ReasoningBrainGraph } from "../layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/brain-types";
import type { CompanyGraph } from "../layers/company/types";
import {
  bridgeMarketingIntelligenceBrainGraphToLegacy,
  bridgeReasoningBrainGraphToLegacy,
  bridgeResearchBrainGraphToLegacy,
} from "./bridge-brain-graphs-to-legacy";

export function buildCapabilityExecutionContext(input: {
  assembly: ContextAssemblyResult;
  request: BrainRunRequestWithBudget;
  campaignContext?: CampaignContext | null;
  marketingUnderstanding?: MarketingUnderstanding | null;
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  researchGraph?: ResearchGraph | null;
  reasoningGraph?: ReasoningGraph | null;
  marketingIntelligenceGraph?: MarketingIntelligenceGraph | null;
  companyGraph?: CompanyGraph | null;
  researchBrainGraph?: ResearchBrainGraph | null;
  reasoningBrainGraph?: ReasoningBrainGraph | null;
  marketingIntelligenceBrainGraph?: MarketingIntelligenceBrainGraph | null;
}): CapabilityExecutionContext {
  const upstreamOutputs = input.upstreamOutputs ?? input.request.upstreamOutputs ?? {};
  const campaignContext = input.campaignContext ?? input.request.campaignContext ?? null;

  const researchBrainGraph = input.researchBrainGraph ?? null;
  const reasoningBrainGraph = input.reasoningBrainGraph ?? null;
  const marketingIntelligenceBrainGraph = input.marketingIntelligenceBrainGraph ?? null;

  const researchGraph =
    input.researchGraph ??
    input.request.researchGraph ??
    (researchBrainGraph ? bridgeResearchBrainGraphToLegacy(researchBrainGraph) : null) ??
    buildResearchGraphFromUpstream({
      companySnapshot: input.assembly.companySnapshot,
      campaignContext,
      upstreamOutputs,
      campaignId: input.request.campaignId,
    });

  const reasoningGraph =
    input.reasoningGraph ??
    input.request.reasoningGraph ??
    (reasoningBrainGraph ? bridgeReasoningBrainGraphToLegacy(reasoningBrainGraph) : null) ??
    buildReasoningGraphFromResearch(researchGraph);

  const marketingIntelligenceGraph =
    input.marketingIntelligenceGraph ??
    input.request.marketingIntelligenceGraph ??
    (marketingIntelligenceBrainGraph
      ? bridgeMarketingIntelligenceBrainGraphToLegacy(marketingIntelligenceBrainGraph)
      : null) ??
    buildMarketingIntelligenceFromReasoning(reasoningGraph, {
      researchGraph,
      campaignContext,
      locale: input.request.locale === "nl" ? "nl" : "en",
    });

  return {
    companySnapshot: input.assembly.companySnapshot,
    campaignContext,
    marketingUnderstanding:
      input.marketingUnderstanding ?? input.request.marketingUnderstanding ?? null,
    upstreamOutputs,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph,
    companyGraph: input.companyGraph ?? null,
    researchBrainGraph,
    reasoningBrainGraph,
    marketingIntelligenceBrainGraph,
    performanceMetrics: input.request.performanceMetrics,
    locale: input.request.locale === "nl" ? "nl" : "en",
  };
}

function buildReasoningGraphFromResearch(researchGraph: ResearchGraph | null): ReasoningGraph | null {
  if (!researchGraph) return null;
  return buildReasoningGraph({ researchGraph });
}

function buildMarketingIntelligenceFromReasoning(
  reasoningGraph: ReasoningGraph | null,
  input: {
    researchGraph: ResearchGraph | null;
    campaignContext: CampaignContext | null;
    locale: "nl" | "en";
  }
): MarketingIntelligenceGraph | null {
  if (!reasoningGraph) return null;
  return buildMarketingIntelligenceGraph({
    reasoningGraph,
    researchGraph: input.researchGraph,
    campaignContext: input.campaignContext,
    locale: input.locale,
  });
}

function buildResearchGraphFromUpstream(input: {
  companySnapshot: ContextAssemblyResult["companySnapshot"];
  campaignContext: CampaignContext | null;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  campaignId?: string;
}): ResearchGraph | null {
  if (Object.keys(input.upstreamOutputs).length === 0) return null;
  return buildResearchGraph({
    companySnapshot: input.companySnapshot,
    campaignContext: input.campaignContext,
    upstreamOutputs: input.upstreamOutputs,
    campaignId: input.campaignId,
  });
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
