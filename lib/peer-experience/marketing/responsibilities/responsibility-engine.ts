import type { MarketingResponsibility } from "./types";
import type { ResponsibilityCatalogEntry } from "./responsibility-catalog";

function responsibilityId(): string {
  return `resp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMarketingResponsibility(
  peerId: string,
  entry: ResponsibilityCatalogEntry,
  opts?: { enabled?: boolean; organizationId?: string }
): MarketingResponsibility {
  const now = new Date().toISOString();
  const enabled = opts?.enabled ?? true;
  const evalDays = entry.defaultCadence.evaluationIntervalDays ?? 1;
  const nextEval = new Date();
  nextEval.setDate(nextEval.getDate() + evalDays);

  return {
    id: responsibilityId(),
    peerId,
    organizationId: opts?.organizationId,
    title: entry.title,
    description: entry.description,
    category: entry.category,
    goal: entry.defaultGoal,
    successMetric: entry.defaultSuccessMetric,
    cadence: entry.defaultCadence,
    autonomyLevel: entry.defaultAutonomy,
    approvalPolicy: entry.defaultGuardrails.approvalRequired
      ? "approval_required"
      : "prepare_only",
    priority: 50,
    status: enabled ? "enabled" : "disabled",
    enabled,
    guardrails: entry.defaultGuardrails,
    lastEvaluation: null,
    nextEvaluation: nextEval.toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}

export function approvalPolicyLabel(
  policy: MarketingResponsibility["approvalPolicy"]
): string {
  switch (policy) {
    case "approval_required":
      return "Required before publishing";
    case "fully_automatic":
      return "Fully automatic";
    default:
      return "Prepare only";
  }
}

export function cadenceLabel(cadence: MarketingResponsibility["cadence"]): string {
  if (cadence.label) return cadence.label;
  if (cadence.postsPerWeek) return `${cadence.postsPerWeek} posts/week`;
  return cadence.type.replace(/_/g, " ");
}

export function autonomyDisplayLabel(level: MarketingResponsibility["autonomyLevel"]): string {
  switch (level) {
    case "manual":
      return "Manual";
    case "suggest":
      return "Suggest";
    case "semi_autonomous":
      return "Semi-autonomous";
    case "autonomous":
      return "High";
    case "full":
      return "Full";
    default:
      return level;
  }
}

export function projectsForResponsibility(
  responsibilityId: string,
  projects: Array<{ responsibilityId?: string | null; archivedAt?: string | null }>
): typeof projects {
  return projects.filter(
    (p) => p.responsibilityId === responsibilityId && !p.archivedAt
  );
}

export function touchResponsibilityEvaluation(
  responsibility: MarketingResponsibility,
  evaluatedAt: string = new Date().toISOString()
): MarketingResponsibility {
  const evalDays = responsibility.cadence.evaluationIntervalDays ?? 1;
  const next = new Date(evaluatedAt);
  next.setDate(next.getDate() + evalDays);
  return {
    ...responsibility,
    lastEvaluation: evaluatedAt,
    nextEvaluation: next.toISOString(),
    updatedAt: evaluatedAt,
  };
}
