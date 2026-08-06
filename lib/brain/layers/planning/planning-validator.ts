import type { PlanningGraph } from "./types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";

export type PlanningValidationIssue = {
  code: string;
  message: string;
};

export type PlanningValidationResult = {
  valid: boolean;
  issues: readonly PlanningValidationIssue[];
};

export type PlanningQualityDimension =
  | "businessSpecificity"
  | "decisionTraceability"
  | "dependencyQuality"
  | "readinessHonesty"
  | "customerEffortReduction"
  | "riskAwareness"
  | "learningDesign"
  | "outcomeOrientation";

export type PlanningQualityScores = Record<PlanningQualityDimension, number> & {
  overallQuality: number;
};

export type PlanningQualityResult = {
  valid: boolean;
  scores: PlanningQualityScores;
  issues: readonly PlanningValidationIssue[];
};

function containsGenericTaskLanguage(text: string): boolean {
  return /^(create|build|start|make|write|post)\s+(linkedin|google|meta|landing|email|ads?)/i.test(
    text.trim()
  );
}

export function validatePlanningGraph(graph: PlanningGraph): PlanningValidationResult {
  const issues: PlanningValidationIssue[] = [];

  if (graph.objectives.length === 0) {
    issues.push({ code: "missing_objectives", message: "PlanningGraph must include at least one objective." });
  }

  if (graph.executionStages.length === 0) {
    issues.push({ code: "missing_stages", message: "PlanningGraph must include execution stages." });
  }

  if (graph.planningDecisions.length === 0) {
    issues.push({ code: "missing_planning_decisions", message: "PlanningGraph must include planning decisions." });
  }

  for (const stage of graph.executionStages) {
    if (!stage.businessPurpose.trim() || stage.businessPurpose.length < 10) {
      issues.push({
        code: "weak_business_purpose",
        message: `Stage "${stage.id}" lacks business purpose.`,
      });
    }
    if (!stage.reason.trim()) {
      issues.push({ code: "missing_reason", message: `Stage "${stage.id}" lacks reason.` });
    }
    if (containsGenericTaskLanguage(stage.title) && stage.businessPurpose.length < 20) {
      issues.push({
        code: "generic_task_list",
        message: `Stage "${stage.title}" reads like a generic task without outcome context.`,
      });
    }
  }

  if (graph.dependencyAnalysis.circularDependencies.length > 0) {
    issues.push({
      code: "circular_dependency",
      message: "Circular dependencies detected in planning graph.",
    });
  }

  if (graph.dependencyAnalysis.missingDependencies.length > 0) {
    issues.push({
      code: "missing_dependency",
      message: `${graph.dependencyAnalysis.missingDependencies.length} missing dependency reference(s).`,
    });
  }

  if (!graph.readiness.summary.trim()) {
    issues.push({ code: "missing_readiness", message: "Readiness assessment must include summary." });
  }

  const rootStages = graph.executionStages.filter((s) => s.dependsOn.length === 0);
  if (rootStages.length === graph.executionStages.length && graph.executionStages.length > 2) {
    issues.push({
      code: "everything_starts_together",
      message: "All stages start simultaneously without justified dependency order.",
    });
  }

  const requirements = [
    ...graph.requiredAssets,
    ...graph.requiredCustomerInput,
    ...graph.requiredKnowledge,
    ...graph.requiredIntegrations,
  ];
  if (requirements.length === 0 && graph.readiness.level !== "ready") {
    issues.push({
      code: "missing_requirements",
      message: "Non-ready plan must identify customer input or asset requirements.",
    });
  }

  if (graph.risks.length === 0 && graph.unknowns.length > 0) {
    issues.push({
      code: "missing_risks",
      message: "Plan has unknowns but no identified risks.",
    });
  }

  if (graph.reviewMoments.length === 0) {
    issues.push({ code: "missing_review_moments", message: "Plan must include review moments." });
  }

  if (!graph.planningDecisions.some((d) => d.sourceDecisionId)) {
    issues.push({
      code: "ignores_decisions",
      message: "Planning decisions must trace to strategy decisions.",
    });
  }

  return { valid: issues.length === 0, issues };
}

export function scorePlanningQuality(
  graph: PlanningGraph,
  campaignContext?: CampaignContext | null
): PlanningQualityResult {
  const issues: PlanningValidationIssue[] = [];
  const companyName = campaignContext?.companyName?.trim() ?? "";

  const specificityText = [
    ...graph.objectives.map((o) => o.description),
    ...graph.planningDecisions.map((d) => d.summary),
  ].join(" ");

  const businessSpecificity =
    companyName && specificityText.toLowerCase().includes(companyName.toLowerCase()) ? 85 : 45;
  if (businessSpecificity < 50) {
    issues.push({
      code: "low_business_specificity",
      message: "Plan could apply to another company unchanged.",
    });
  }

  const decisionTraceability =
    graph.planningDecisions.filter((d) => d.sourceDecisionId).length > 0 ? 90 : 30;

  const dependencyQuality =
    graph.dependencies.length > 0 && graph.dependencyAnalysis.circularDependencies.length === 0 ? 85 : 40;

  const readinessHonesty = graph.readiness.checks.length >= 6 ? 80 : 50;

  const customerEffortReduction =
    graph.requiredCustomerInput.length + graph.requiredAssets.filter((a) => a.status === "missing").length <= 5
      ? 75
      : 45;

  const riskAwareness = graph.risks.length >= 1 ? 80 : 35;
  const learningDesign = graph.reviewMoments.length >= 2 ? 85 : 40;

  const outcomeOrientation =
    graph.executionStages.every((s) => s.businessPurpose.length >= 15) ? 90 : 40;

  const scores: PlanningQualityScores = {
    businessSpecificity,
    decisionTraceability,
    dependencyQuality,
    readinessHonesty,
    customerEffortReduction,
    riskAwareness,
    learningDesign,
    outcomeOrientation,
    overallQuality: Math.round(
      (businessSpecificity +
        decisionTraceability +
        dependencyQuality +
        readinessHonesty +
        customerEffortReduction +
        riskAwareness +
        learningDesign +
        outcomeOrientation) /
        8
    ),
  };

  const validation = validatePlanningGraph(graph);
  const valid = validation.valid && scores.overallQuality >= 55;

  return { valid, scores, issues: [...issues, ...validation.issues] };
}
