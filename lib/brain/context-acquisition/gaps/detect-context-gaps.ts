import type { ProjectBrainId } from "../../project-engine/types";
import type { ContextGap } from "../../project-runtime/types";
import type {
  AcquiredContextItem,
  ContextAcquisitionGap,
  ContextRequirement,
} from "../types";
import type { ContextAdapterResult } from "../adapters/types";
import { itemSatisfiesRequirement } from "../derive-slice-availability";

function mapRequirementToGapKind(key: string): ContextGap["kind"] {
  if (key.startsWith("website")) return "website";
  if (key.startsWith("business") || key.startsWith("organization") || key.startsWith("dna")) {
    return "business";
  }
  if (key.startsWith("project.goals") || key.includes("budget")) return "budget";
  if (key.startsWith("memory")) return "measurement";
  return "integration";
}

export function detectContextAcquisitionGaps(input: {
  requirements: readonly ContextRequirement[];
  items: readonly AcquiredContextItem[];
  adapterResults: readonly ContextAdapterResult[];
}): ContextAcquisitionGap[] {
  const gaps: ContextAcquisitionGap[] = [];
  const failedAdapters = new Map(
    input.adapterResults
      .filter((r) => r.status === "failed")
      .map((r) => [r.adapterId, r] as const)
  );

  for (const requirement of input.requirements) {
    const satisfied = itemSatisfiesRequirement(input.items, requirement.key);
    if (satisfied) continue;

    const adapterFailure = [...failedAdapters.values()].find((result) =>
      result.failureCode === "authorization_violation"
        ? requirement.scope === "organization"
        : false
    );

    gaps.push({
      requirement,
      reason: requirement.reason,
      severity: requirement.required ? "blocking" : "informational",
      recoverable: requirement.required,
      suggestedSource: requirement.category,
      sourceFailure: failedAdapters.size > 0,
      sourceMisconfigured: adapterFailure?.failureCode === "peer_not_found",
      authorizationViolation: adapterFailure?.failureCode === "authorization_violation",
    });
  }

  return gaps;
}

export function mapAcquisitionGapsToProjectGaps(
  gaps: readonly ContextAcquisitionGap[],
  requiredBy: ProjectBrainId | "project_engine" = "project_engine"
): ContextGap[] {
  return gaps
    .filter((gap) => gap.severity === "blocking" || gap.requirement.required)
    .map((gap) => ({
      kind: mapRequirementToGapKind(gap.requirement.key),
      requiredBy,
      reason: gap.reason,
      blocking: gap.requirement.required,
      resolutionType:
        gap.requirement.category === "knowledge" || gap.requirement.category === "company_dna"
          ? ("customer_input" as const)
          : gap.sourceFailure
            ? ("integration" as const)
            : ("customer_input" as const),
    }));
}
