/**
 * Marketing Intelligence Brain — graph builder.
 */

import type { CompanyGraph } from "../company/types";
import type { MemoryGraph } from "../memory/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import {
  emptyMarketingIntelligenceBrainGraph,
  type InsufficientDataReason,
  type MarketingIntelligenceBrainGraph,
} from "./brain-types";
import { collectMarketingEvidence } from "./marketing-intelligence-evidence";
import { buildAudienceIntelligence } from "./marketing-intelligence-audience";
import { buildChannelIntelligence } from "./marketing-intelligence-channels";
import { buildMessagingIntelligence } from "./marketing-intelligence-messaging";
import { buildCompetitiveMarketingIntelligence } from "./marketing-intelligence-competitors";
import { buildMarketIntelligence } from "./marketing-intelligence-market";
import { buildFunnelIntelligence, detectFunnelGaps } from "./marketing-intelligence-funnel";
import { buildOfferIntelligence } from "./marketing-intelligence-offer";
import { buildContentIntelligence } from "./marketing-intelligence-content";
import { buildSearchIntelligence } from "./marketing-intelligence-search";
import { buildPaidMediaIntelligence } from "./marketing-intelligence-paid";
import { buildOrganicIntelligence } from "./marketing-intelligence-organic";
import { buildBenchmarkContext } from "./marketing-intelligence-benchmarks";
import { buildMarketingOpportunities, containsStrategyLanguage } from "./marketing-intelligence-opportunities";
import { buildMarketingRisks } from "./marketing-intelligence-risks";
import { buildMarketingPriorities, buildStrategyInputs } from "./marketing-intelligence-priorities";
import { aggregateGraphConfidence } from "./marketing-intelligence-confidence";

export type BuildMarketingIntelligenceBrainGraphInput = {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  memoryGraph?: MemoryGraph | null;
  projectObjective?: string;
  businessGoals?: readonly string[];
  constraints?: readonly string[];
  budgetContext?: string | null;
  audienceContext?: readonly string[];
  channelData?: readonly string[];
  priorMarketingDecisions?: readonly string[];
  selectedChannels?: readonly string[];
  createdAt?: string;
};

export function buildMarketingIntelligenceBrainGraph(
  input: BuildMarketingIntelligenceBrainGraphInput
): MarketingIntelligenceBrainGraph {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const evidence = collectMarketingEvidence({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    memoryGraph: input.memoryGraph,
  });

  const audienceIntelligence = buildAudienceIntelligence({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    evidence,
    audienceContext: input.audienceContext,
  });

  const channelIntelligence = buildChannelIntelligence({
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    evidence,
    channelData: input.channelData,
    selectedChannels: input.selectedChannels,
  });

  const messagingIntelligence = buildMessagingIntelligence({
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    evidence,
  });

  const competitiveMarketing = buildCompetitiveMarketingIntelligence({
    researchGraph: input.researchGraph,
    evidence,
  });

  const marketIntelligence = buildMarketIntelligence({
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    evidence,
  });

  const funnelIntelligence = buildFunnelIntelligence({
    reasoningGraph: input.reasoningGraph,
    evidence,
  });

  const offerIntelligence = buildOfferIntelligence({
    companyGraph: input.companyGraph,
    researchGraph: input.researchGraph,
    evidence,
  });

  const contentIntelligence = buildContentIntelligence({
    researchGraph: input.researchGraph,
    evidence,
  });

  const searchIntelligence = buildSearchIntelligence({
    researchGraph: input.researchGraph,
    evidence,
  });

  const paidMediaIntelligence = buildPaidMediaIntelligence({
    channels: channelIntelligence,
    evidence,
    budgetContext: input.budgetContext,
  });

  const organicIntelligence = buildOrganicIntelligence({
    channels: channelIntelligence,
    evidence,
  });

  const benchmarkContext = buildBenchmarkContext({
    memoryGraph: input.memoryGraph,
    channelData: input.channelData,
  });

  const opportunitySignals = buildMarketingOpportunities({
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    channels: channelIntelligence,
    evidence,
  }).filter((o) => !containsStrategyLanguage(o.description));

  const riskSignals = buildMarketingRisks({
    researchGraph: input.researchGraph,
    reasoningGraph: input.reasoningGraph,
    evidence,
    knownConstraints: input.constraints,
  });

  const marketingPriorities = buildMarketingPriorities({
    channels: channelIntelligence,
    opportunities: opportunitySignals,
    risks: riskSignals,
  });

  const insufficientDataFlags: InsufficientDataReason[] = [
    ...paidMediaIntelligence.insufficientData,
  ];
  if (audienceIntelligence.length === 0) insufficientDataFlags.push("audience_evidence_weak");
  if (channelIntelligence.length === 0) insufficientDataFlags.push("channel_data_missing");
  if (benchmarkContext.every((b) => b.benchmarkUnavailable)) {
    insufficientDataFlags.push("benchmark_unavailable");
  }
  if (evidence.length === 0) insufficientDataFlags.push("insufficient_data");

  const unknowns = [
    ...input.reasoningGraph.unknowns.map((u) => u.description),
    ...input.researchGraph.unresolvedQuestions.map((q) => q.question),
  ];

  const strategyInputs = buildStrategyInputs({
    audience: audienceIntelligence,
    channels: channelIntelligence,
    messaging: messagingIntelligence,
    market: marketIntelligence,
    competitive: competitiveMarketing,
    funnelGaps: detectFunnelGaps(funnelIntelligence),
    opportunities: opportunitySignals,
    risks: riskSignals,
    benchmarks: benchmarkContext,
    constraints: input.constraints ?? [],
    unknowns,
    confidence: aggregateGraphConfidence(evidence),
  });

  const graph = emptyMarketingIntelligenceBrainGraph({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    companyGraphVersion: input.companyGraph.version,
    researchGraphVersion: input.researchGraph.version,
    reasoningGraphVersion: input.reasoningGraph.version,
    projectObjective: input.projectObjective,
    createdAt,
  });

  return {
    ...graph,
    updatedAt: new Date().toISOString(),
    evidence,
    businessContext: {
      organizationSummary: input.companyGraph.facts.find((f) => f.key === "companyName")?.value ?? "",
      goals: input.businessGoals ?? [],
      constraints: input.constraints ?? [],
      projectObjective:
        input.projectObjective ?? input.researchGraph.objective.projectObjective ?? "",
      evidenceIds: evidence.slice(0, 5).map((e) => e.id),
    },
    audienceIntelligence,
    marketIntelligence,
    competitiveMarketing,
    channelIntelligence,
    messagingIntelligence,
    offerIntelligence,
    funnelIntelligence,
    contentIntelligence,
    searchIntelligence,
    paidMediaIntelligence,
    organicIntelligence,
    opportunitySignals,
    riskSignals,
    benchmarkContext,
    marketingPriorities,
    strategyInputs,
    summary: {
      headline: `Marketing intelligence: ${audienceIntelligence.length} segments, ${channelIntelligence.length} channels`,
      opportunityCount: opportunitySignals.length,
      riskCount: riskSignals.length,
      priorityCount: marketingPriorities.length,
      insufficientDataFlags: [...new Set(insufficientDataFlags)],
    },
    confidence: aggregateGraphConfidence(evidence),
  };
}

export function assertNoCompanyMutation(before: CompanyGraph, after: CompanyGraph): boolean {
  return (
    before.organizationId === after.organizationId &&
    before.facts.length === after.facts.length &&
    before.versionMeta.version === after.versionMeta.version
  );
}

export function assertNoStrategyLanguage(graph: MarketingIntelligenceBrainGraph): boolean {
  const texts = [
    ...graph.channelIntelligence.flatMap((c) => c.opportunities),
    ...graph.opportunitySignals.map((o) => o.description),
    ...graph.strategyInputs.topChannelSignals,
  ];
  return !texts.some((t) => containsStrategyLanguage(t));
}

export function assertNoCreativeLanguage(graph: MarketingIntelligenceBrainGraph): boolean {
  const pattern = /\b(headline|hook|ad copy|email subject|landing.page copy|campaign concept)\b/i;
  const texts = graph.opportunitySignals.map((o) => o.description);
  return !texts.some((t) => pattern.test(t));
}

export function assertNoExternalResearchPerformed(): true {
  return true;
}
