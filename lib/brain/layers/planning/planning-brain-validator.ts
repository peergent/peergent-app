/**
 * Planning Brain — validation and guardrails.
 */

import type { PlanningBrainGraph } from "./brain-types";
import { assertNoFabricatedDates } from "./planning-schedule";
import { assertNoInventedObjectives } from "./planning-objectives";
import { assertNoStrategicDecision } from "./planning-risks";

const CREATIVE_PATTERNS = [/\bad copy\b/i, /\bhook:\s/i, /\bemail subject line\b/i, /\bpost copy\b/i];
const EXECUTION_PATTERNS = [/\bpublish now\b/i, /\bposted to\b/i, /\blive campaign url\b/i];

function collectPlanningText(graph: PlanningBrainGraph): string {
  return [
    ...graph.planningDecisions.map((d) => d.decision),
    ...graph.deliverables.map((d) => d.purpose),
    ...graph.workPackages.map((w) => w.title),
  ].join("\n");
}

export function containsCreativeLanguage(text: string): boolean {
  return CREATIVE_PATTERNS.some((p) => p.test(text));
}

export function containsExecutionLanguage(text: string): boolean {
  return EXECUTION_PATTERNS.some((p) => p.test(text));
}

export function assertNoCreativeGeneration(graph: PlanningBrainGraph): void {
  if (containsCreativeLanguage(collectPlanningText(graph))) {
    throw new Error("Planning Brain must not generate creative content");
  }
}

export function assertNoExecution(graph: PlanningBrainGraph): void {
  if (containsExecutionLanguage(collectPlanningText(graph))) {
    throw new Error("Planning Brain must not execute or publish");
  }
}

export function assertNoFabricatedProgress(graph: PlanningBrainGraph): void {
  const entities = [
    ...graph.workPackages,
    ...graph.deliverables,
    ...graph.milestones,
    ...graph.campaignPlans,
  ];
  for (const e of entities) {
    if (e.status === "IN_PROGRESS" || e.status === "COMPLETED") {
      throw new Error("Planning Brain must not fabricate progress");
    }
  }
}

export function assertNoCompanyMutation(beforeVersion: string, afterVersion: string): void {
  if (beforeVersion !== afterVersion) {
    throw new Error("Planning Brain must not mutate CompanyGraph");
  }
}

export function validatePlanningBrainGraph(graph: PlanningBrainGraph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!graph.version) errors.push("missing version");
  if (graph.planningObjectives.length === 0) errors.push("expected planning objectives");
  if (graph.campaignPlans.length === 0) errors.push("expected campaign plans");

  const briefDeliverables = graph.deliverables.filter((d) => d.creativeBriefInputId);
  if (briefDeliverables.length > 0 && graph.creativeBriefInputs.length === 0) {
    errors.push("missing creative brief inputs");
  }

  for (const d of briefDeliverables) {
    const brief = graph.creativeBriefInputs.find((b) => b.id === d.creativeBriefInputId);
    if (!brief) errors.push(`missing brief for deliverable ${d.id}`);
    else if (!brief.positioningDirection || !brief.messagingDirection) {
      errors.push(`incomplete CreativeBriefInput ${brief.id}`);
    }
  }

  try {
    assertNoInventedObjectives(
      graph.planningObjectives,
      graph.strategyInput.selectedObjectives,
      graph.planningObjectives.map((o) => o.strategyObjectiveId)
    );
    assertNoCreativeGeneration(graph);
    assertNoExecution(graph);
    assertNoFabricatedProgress(graph);
    assertNoFabricatedDates(
      graph.scheduleWindows,
      graph.scheduleWindows.some((w) => w.source === "customer_deadline")
    );
    assertNoStrategicDecision(collectPlanningText(graph));
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "guardrail violation");
  }

  return { valid: errors.length === 0, errors };
}
