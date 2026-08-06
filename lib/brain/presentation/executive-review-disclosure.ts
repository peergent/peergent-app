/**
 * Sprint 10.2 + 11.1 — Unified progressive disclosure navigation.
 * Briefing → Decision → Execution Plan → Planning Decision → Dependency → Evidence → Research
 */

import type { Decision } from "../decision/decision-types";
import type { PlanningDecision, PlanningDependency, PlanningGraph } from "../layers/planning/types";
import { presentDecisionExplainability } from "../decision/decision-presentation";

export type ExecutiveReviewLayer =
  | "briefing"
  | "decision"
  | "execution_plan"
  | "planning_decision"
  | "dependency"
  | "reasoning"
  | "evidence"
  | "research";

export type ExecutiveReviewFrame = {
  layer: ExecutiveReviewLayer;
  decisionId?: string;
  planningDecisionId?: string;
  dependencyId?: string;
  evidenceId?: string;
  reasoningRef?: string;
  title: string;
};

export type ExecutiveReviewNavigation = {
  current: ExecutiveReviewFrame;
  previous?: ExecutiveReviewFrame;
  canGoBack: boolean;
  canGoForward: boolean;
  breadcrumb: readonly string[];
};

export function createBriefingFrame(nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "briefing",
    title: nl ? "Executive briefing" : "Executive briefing",
  };
}

export function createDecisionFrame(decision: Decision): ExecutiveReviewFrame {
  return {
    layer: "decision",
    decisionId: decision.id,
    title: decision.title,
  };
}

export function createExecutionPlanFrame(nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "execution_plan",
    title: nl ? "Executieplan" : "Execution plan",
  };
}

export function createPlanningDecisionFrame(decision: PlanningDecision): ExecutiveReviewFrame {
  return {
    layer: "planning_decision",
    planningDecisionId: decision.id,
    title: decision.title,
  };
}

export function createDependencyFrame(dependency: PlanningDependency, nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "dependency",
    dependencyId: dependency.id,
    planningDecisionId: dependency.toNodeId,
    title: nl ? "Afhankelijkheid" : "Dependency",
  };
}

export function createReasoningFrame(decision: Decision, nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "reasoning",
    decisionId: decision.id,
    title: nl ? `Redenering — ${decision.title}` : `Reasoning — ${decision.title}`,
  };
}

export function createEvidenceFrame(decision: Decision, evidenceId: string, nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "evidence",
    decisionId: decision.id,
    evidenceId,
    title: nl ? "Bewijs" : "Evidence",
  };
}

export function createResearchFrame(decision: Decision, nl: boolean): ExecutiveReviewFrame {
  return {
    layer: "research",
    decisionId: decision.id,
    title: nl ? "Research" : "Research",
  };
}

function canAdvanceFromLayer(layer: ExecutiveReviewLayer): boolean {
  return layer !== "research";
}

/** Build navigation state for progressive disclosure shell. */
export function buildExecutiveReviewNavigation(input: {
  stack: readonly ExecutiveReviewFrame[];
  nl: boolean;
}): ExecutiveReviewNavigation {
  const current = input.stack[input.stack.length - 1] ?? createBriefingFrame(input.nl);
  const previous = input.stack.length > 1 ? input.stack[input.stack.length - 2] : undefined;

  return {
    current,
    previous,
    canGoBack: input.stack.length > 1,
    canGoForward: canAdvanceFromLayer(current.layer),
    breadcrumb: input.stack.map((frame) => frame.title),
  };
}

export function pushReviewFrame(
  stack: readonly ExecutiveReviewFrame[],
  frame: ExecutiveReviewFrame
): ExecutiveReviewFrame[] {
  return [...stack, frame];
}

export function popReviewFrame(stack: readonly ExecutiveReviewFrame[]): ExecutiveReviewFrame[] {
  if (stack.length <= 1) return [...stack];
  return [...stack.slice(0, -1)];
}

export function getDecisionExplainabilityContent(decision: Decision) {
  return presentDecisionExplainability(decision);
}

export function findPlanningDecision(
  graph: PlanningGraph | undefined,
  id?: string
): PlanningDecision | undefined {
  if (!graph || !id) return undefined;
  return graph.planningDecisions.find((d) => d.id === id);
}

export function findPlanningDependency(
  graph: PlanningGraph | undefined,
  id?: string
): PlanningDependency | undefined {
  if (!graph || !id) return undefined;
  return graph.dependencies.find((d) => d.id === id);
}

/** Default drill-down path from a decision. */
export function defaultDecisionDrillDown(decision: Decision, nl: boolean): ExecutiveReviewFrame[] {
  return [
    createDecisionFrame(decision),
    createReasoningFrame(decision, nl),
    createEvidenceFrame(decision, decision.supportingEvidence[0] ?? "summary", nl),
    createResearchFrame(decision, nl),
  ];
}

/** Default drill-down from execution plan section. */
export function defaultExecutionPlanDrillDown(
  graph: PlanningGraph,
  nl: boolean
): ExecutiveReviewFrame[] {
  const firstDecision = graph.planningDecisions[0];
  const firstDependency = graph.dependencies[0];
  const frames: ExecutiveReviewFrame[] = [createExecutionPlanFrame(nl)];
  if (firstDecision) frames.push(createPlanningDecisionFrame(firstDecision));
  if (firstDependency) frames.push(createDependencyFrame(firstDependency, nl));
  return frames;
}
