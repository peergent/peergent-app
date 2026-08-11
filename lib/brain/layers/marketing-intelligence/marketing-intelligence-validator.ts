/**
 * Marketing Intelligence Brain — validation.
 */

import type { MarketingIntelligenceBrainGraph } from "./brain-types";
import {
  assertNoCreativeLanguage,
  assertNoStrategyLanguage,
} from "./marketing-intelligence-graph";

export type MarketingIntelligenceValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateMarketingIntelligenceBrainGraph(
  graph: MarketingIntelligenceBrainGraph
): MarketingIntelligenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!graph.organizationId) errors.push("missing_organization_id");
  if (!graph.companyGraphVersion) errors.push("missing_company_graph_version");
  if (!graph.researchGraphVersion) errors.push("missing_research_graph_version");
  if (!graph.reasoningGraphVersion) errors.push("missing_reasoning_graph_version");

  if (!assertNoStrategyLanguage(graph)) errors.push("strategy_language_detected");
  if (!assertNoCreativeLanguage(graph)) errors.push("creative_language_detected");

  for (const channel of graph.channelIntelligence) {
    if (/\b(spend|allocate)\s+\d+/i.test(channel.opportunities.join(" "))) {
      errors.push(`channel_budget_allocation:${channel.channel}`);
    }
  }

  const highWithoutEvidence = [
    ...graph.audienceIntelligence.filter((a) => a.confidence === "high" && a.evidenceIds.length === 0),
    ...graph.channelIntelligence.filter((c) => c.confidence === "high" && c.evidenceIds.length === 0),
  ];
  if (highWithoutEvidence.length > 0) {
    errors.push("high_confidence_without_evidence");
  }

  if (graph.benchmarkContext.some((b) => !b.benchmarkUnavailable && b.range && b.source === null)) {
    warnings.push("benchmark_without_source");
  }

  return { valid: errors.length === 0, errors, warnings };
}
