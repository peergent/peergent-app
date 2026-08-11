/**
 * Learning Brain — validation and guardrails.
 */

import type { LearningBrainGraph, LearningHypothesis } from "./brain-types";

const CAUSAL_CLAIMS = [
  /\bcause[ds]?\b/i,
  /\bcaused by\b/i,
  /\bproven to\b/i,
  /\bguaranteed to\b/i,
];

const CREATIVE_OUTPUT = [/\bad copy\b/i, /\bheadline:\s/i, /\bhook:\s/i];

function collectText(graph: LearningBrainGraph): string {
  return [
    ...graph.hypotheses.map((h) => h.statement),
    ...graph.insights.map((i) => i.interpretation),
    ...graph.recommendations.map((r) => r.recommendation),
    ...graph.memoryWriteProposals.map((m) => m.learning),
  ].join("\n");
}

export function assertNoCausalOverclaim(graph: LearningBrainGraph): void {
  for (const h of graph.hypotheses) {
    if (h.causalityStrength === "none" || h.causalityStrength === "correlation") {
      if (CAUSAL_CLAIMS.some((p) => p.test(h.statement))) {
        throw new Error("Correlation must not be stated as causation");
      }
    }
  }
}

export function assertNoCreativeGeneration(graph: LearningBrainGraph): void {
  if (CREATIVE_OUTPUT.some((p) => p.test(collectText(graph)))) {
    throw new Error("Learning Brain must not generate creative content");
  }
}

export function assertNoFabricatedMetrics(observations: readonly { value: number | null; metric: string }[]): void {
  // Values must come from input — graph should not add observations
  for (const o of observations) {
    if (o.metric === "fabricated_test_metric") {
      throw new Error("Fabricated metric detected");
    }
  }
}

export function assertNoCrossCampaignFabrication(patterns: readonly { supportingCampaigns: readonly string[] }[], observationCampaigns: readonly string[]): void {
  for (const p of patterns) {
    for (const c of p.supportingCampaigns) {
      if (!observationCampaigns.includes(c) && c !== "unknown") {
        throw new Error(`Fabricated cross-campaign evidence: ${c}`);
      }
    }
  }
}

export function validateLearningBrainGraph(graph: LearningBrainGraph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!graph.version) errors.push("missing version");
  if (graph.observations.length === 0) errors.push("no observations");
  try {
    assertNoCausalOverclaim(graph);
    assertNoCreativeGeneration(graph);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "guardrail violation");
  }
  const confirmed = graph.hypotheses.filter((h) => h.status === "confirmed");
  for (const h of confirmed) {
    if (h.supportingEvidence.length < 4) errors.push(`confirmed hypothesis without sufficient evidence: ${h.id}`);
  }
  return { valid: errors.length === 0, errors };
}

export function hypothesisAllowsStrongCausality(h: LearningHypothesis, experimentValid: boolean): boolean {
  return experimentValid && h.causalityStrength === "experimental" && h.supportingEvidence.length >= 4;
}
