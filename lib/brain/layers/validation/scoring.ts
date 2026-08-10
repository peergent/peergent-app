import type {
  PublicationReadiness,
  ValidationCategory,
  ValidationIssue,
  ValidationScore,
  ValidationWarning,
} from "./types";
import { VALIDATION_DOMAIN_WEIGHTS } from "./modules/specs";

export function scoreLabel(value: number): ValidationScore["label"] {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "fair";
  return "poor";
}

export function buildScore(value: number): ValidationScore {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return { value: clamped, max: 100, label: scoreLabel(clamped) };
}

export function weightedOverallScore(categories: readonly ValidationCategory[]): ValidationScore {
  if (categories.length === 0) return buildScore(0);

  let totalWeight = 0;
  let weightedSum = 0;

  for (const category of categories) {
    const weight = VALIDATION_DOMAIN_WEIGHTS[category.id] ?? 1;
    totalWeight += weight;
    weightedSum += category.score.value * weight;
  }

  return buildScore(totalWeight > 0 ? weightedSum / totalWeight : 0);
}

export function resolvePublicationReadiness(input: {
  overallScore: number;
  issues: readonly ValidationIssue[];
  categories: readonly ValidationCategory[];
}): PublicationReadiness {
  const blockingIssues = input.issues.filter((i) => i.blocking);
  const legalFail = input.categories.some(
    (c) => c.id === "legal_claims" && c.status === "fail"
  );
  const failCount = input.categories.filter((c) => c.status === "fail").length;

  if (blockingIssues.length > 0 || legalFail || input.overallScore < 45) {
    return "BLOCKED";
  }

  if (failCount >= 2 || input.overallScore < 65) {
    return "CHANGES_REQUIRED";
  }

  if (input.overallScore >= 85 && failCount === 0) {
    const warningCount = input.categories.filter((c) => c.status === "warning").length;
    return warningCount === 0 ? "READY" : "READY_WITH_SUGGESTIONS";
  }

  return "READY_WITH_SUGGESTIONS";
}

export function estimateConversionScore(input: {
  overallScore: number;
  issues: readonly ValidationIssue[];
  warnings: readonly ValidationWarning[];
  ctaScore: number;
  trustScore: number;
}): ValidationScore {
  const penalty =
    input.issues.filter((i) => i.blocking).length * 15 +
    input.issues.filter((i) => !i.blocking).length * 5 +
    input.warnings.length * 2;

  const composite =
    input.overallScore * 0.4 + input.ctaScore * 0.25 + input.trustScore * 0.25 - penalty;

  return buildScore(composite);
}

export function confidenceFromScore(
  overallScore: number,
  issueCount: number
): "low" | "medium" | "high" {
  if (overallScore >= 80 && issueCount <= 2) return "high";
  if (overallScore >= 60) return "medium";
  return "low";
}
