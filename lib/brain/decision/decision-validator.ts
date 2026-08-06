import type { Decision, DecisionCollection } from "./decision-types";

export type DecisionValidationIssue = {
  code: string;
  message: string;
  decisionId?: string;
};

export type DecisionValidationResult = {
  valid: boolean;
  issues: readonly DecisionValidationIssue[];
};

const REQUIRED_FIELDS: (keyof Decision)[] = [
  "id",
  "title",
  "summary",
  "recommendation",
  "reasoning",
  "businessImpact",
  "expectedOutcome",
];

/** Validate decision quality — every decision must be consultant-grade. */
export function validateDecision(decision: Decision): DecisionValidationResult {
  const issues: DecisionValidationIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = decision[field];
    if (typeof value !== "string" || value.trim().length < 8) {
      issues.push({
        code: "missing_field",
        message: `Decision ${decision.id} missing or weak ${field}`,
        decisionId: decision.id,
      });
    }
  }

  if (decision.recommendation.length < 40) {
    issues.push({
      code: "weak_recommendation",
      message: `Decision ${decision.id} recommendation too short for consultant voice`,
      decisionId: decision.id,
    });
  }

  if (decision.approvalRequired && decision.alternativesRejected.length === 0 && decision.category === "channel_choice") {
    issues.push({
      code: "missing_rejected_alternatives",
      message: `Channel decision ${decision.id} should document rejected alternatives`,
      decisionId: decision.id,
    });
  }

  return { valid: issues.length === 0, issues };
}

export function validateDecisionCollection(collection: DecisionCollection): DecisionValidationResult {
  const issues: DecisionValidationIssue[] = [];

  if (collection.decisions.length === 0) {
    issues.push({ code: "empty_collection", message: "Decision collection is empty" });
    return { valid: false, issues };
  }

  const ids = new Set<string>();
  for (const decision of collection.decisions) {
    if (ids.has(decision.id)) {
      issues.push({ code: "duplicate_id", message: `Duplicate decision id: ${decision.id}`, decisionId: decision.id });
    }
    ids.add(decision.id);

    const result = validateDecision(decision);
    issues.push(...result.issues);

    if (decision.dependencies.some((dep) => dep.decisionId === decision.id)) {
      issues.push({
        code: "self_dependency",
        message: `Decision ${decision.id} depends on itself`,
        decisionId: decision.id,
      });
    }
  }

  for (const decision of collection.decisions) {
    for (const dep of decision.dependencies) {
      if (!ids.has(dep.decisionId)) {
        issues.push({
          code: "missing_dependency",
          message: `Decision ${decision.id} references missing dependency ${dep.decisionId}`,
          decisionId: decision.id,
        });
      }
    }
  }

  const hasStrategy = collection.decisions.some((d) => d.category === "strategy_direction");
  if (!hasStrategy) {
    issues.push({ code: "missing_strategy_decision", message: "Collection must include a strategy direction decision" });
  }

  return { valid: issues.length === 0, issues };
}
