/**
 * Strategy Brain — validation and guardrails.
 */

import type { StrategyBrainGraph } from "./brain-types";

const CREATIVE_PATTERNS = [
  /\bad copy\b/i,
  /\bemail subject line\b/i,
  /\bpost copy\b/i,
  /\bcreative concept\b/i,
  /\bvisual concept\b/i,
  /\bhook:\s/i,
];

function collectStrategyText(graph: StrategyBrainGraph): string {
  return [
    graph.selectedStrategy,
    graph.positioningStrategy.positioningStatement,
    graph.messagingStrategyDirection.primaryMessageTerritory,
    ...graph.messagingStrategyDirection.secondaryMessageTerritories,
    ...graph.campaignObjectives.map((o) => o.objective),
    ...graph.strategicDecisions.map((d) => d.decision),
  ].join("\n");
}

const PLANNING_PATTERNS = [
  /\btimeline\b/i,
  /\bmilestone\b/i,
  /\bcontent calendar\b/i,
  /\bpublishing schedule\b/i,
  /\btask list\b/i,
  /\bweek \d+\b/i,
  /\bdue date\b/i,
];

const RESEARCH_PATTERNS = [/\bcrawl\b/i, /\bfetch external\b/i, /\bscrape\b/i];

export function containsCreativeLanguage(text: string): boolean {
  return CREATIVE_PATTERNS.some((p) => p.test(text));
}

export function containsPlanningLanguage(text: string): boolean {
  return PLANNING_PATTERNS.some((p) => p.test(text));
}

export function containsResearchLanguage(text: string): boolean {
  return RESEARCH_PATTERNS.some((p) => p.test(text));
}

export function assertNoCreativeLanguage(graph: StrategyBrainGraph): void {
  const blob = collectStrategyText(graph);
  if (containsCreativeLanguage(blob)) {
    throw new Error("Strategy Brain must not produce creative copy");
  }
}

export function assertNoPlanningLanguage(graph: StrategyBrainGraph): void {
  const blob = collectStrategyText(graph);
  if (containsPlanningLanguage(blob)) {
    throw new Error("Strategy Brain must not produce planning artifacts");
  }
}

export function assertNoResearchCalls(graph: StrategyBrainGraph): void {
  const blob = collectStrategyText(graph);
  if (containsResearchLanguage(blob)) {
    throw new Error("Strategy Brain must not perform research");
  }
}

export function assertNoCompanyMutation(
  beforeVersion: string,
  afterVersion: string
): void {
  if (beforeVersion !== afterVersion) {
    throw new Error("Strategy Brain must not mutate CompanyGraph");
  }
}

export function validateStrategyBrainGraph(graph: StrategyBrainGraph): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!graph.version) errors.push("missing version");
  if (!graph.organizationId) errors.push("missing organizationId");
  if (graph.strategicDecisions.length === 0 && graph.escalations.every((e) => !e.blocking)) {
    errors.push("expected at least one strategic decision when not blocked");
  }
  if (graph.planningInputs.selectedChannels.length === 0 && graph.channelStrategy.some((c) => c.selected)) {
    errors.push("planning inputs missing selected channels");
  }
  if (
    graph.budgetStrategy.totalBudget !== null &&
    graph.budgetStrategy.budgetRequired
  ) {
    errors.push("budgetRequired conflicts with totalBudget");
  }

  for (const k of graph.kpiFramework) {
    if (k.target && /\d/.test(k.target) && !k.baseline) {
      errors.push(`fabricated KPI target for ${k.name}`);
    }
  }

  try {
    assertNoCreativeLanguage(graph);
    assertNoPlanningLanguage(graph);
    assertNoResearchCalls(graph);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "guardrail violation");
  }

  return { valid: errors.length === 0, errors };
}
