import type { ValidationGraph, ValidationReport } from "./types";

export type ValidationMetaIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationMetaResult = {
  valid: boolean;
  score: number;
  issues: readonly ValidationMetaIssue[];
};

/** Meta-validation — ensures ValidationReport completeness before persistence. */
export function validateValidationGraph(graph: ValidationGraph): ValidationMetaResult {
  const issues: ValidationMetaIssue[] = [];
  const report: ValidationReport = graph.report;

  if (graph.phases.length < 10) {
    issues.push({
      code: "incomplete_domains",
      message: "Validation Brain must evaluate all required domains.",
      severity: "error",
    });
  }

  if (!report.publicationReadiness) {
    issues.push({
      code: "missing_readiness",
      message: "Publication readiness verdict is required.",
      severity: "error",
    });
  }

  if (report.categories.length === 0) {
    issues.push({
      code: "missing_categories",
      message: "At least one validation category is required.",
      severity: "error",
    });
  }

  for (const issue of report.issues) {
    if (!issue.category || !issue.reason || !issue.businessImpact || !issue.suggestedResolution) {
      issues.push({
        code: "incomplete_issue",
        message: `Issue ${issue.id} missing required fields.`,
        severity: "error",
      });
    }
  }

  if (!report.reasoningSummary) {
    issues.push({
      code: "missing_reasoning",
      message: "Reasoning summary is required.",
      severity: "warning",
    });
  }

  if (!graph.creativeGraphRef) {
    issues.push({
      code: "missing_creative_ref",
      message: "Creative graph reference is required for audit trail.",
      severity: "error",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 10);

  return {
    valid: errors.length === 0,
    score,
    issues,
  };
}

export function scoreValidationQuality(graph: ValidationGraph): number {
  return validateValidationGraph(graph).score;
}
