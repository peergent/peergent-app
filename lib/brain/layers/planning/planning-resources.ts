import type { PlanningContextGap, ResourceAssumption } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";

export function buildResourceAssumptions(input: {
  ctx: StrategyPlanningContext;
  workPackageIds: readonly string[];
}): ResourceAssumption[] {
  const assumptions: Omit<ResourceAssumption, "id">[] = [
    res("Ad account connected", input.ctx.channelStrategy.some((c) => c.selected && c.paidOrOrganic === "paid")),
    res("CRM available", true),
    res("Website CMS access available", true),
    res("Tracking installed", false),
    res("Budget available", !input.ctx.budgetStrategy.budgetRequired),
    res("Creative asset source available", true),
  ];

  for (const ch of input.ctx.channelStrategy.filter((c) => c.selected)) {
    if (/linkedin/i.test(ch.channel)) {
      assumptions.push(
        res("Customer has LinkedIn company page", false, input.workPackageIds)
      );
    }
  }

  return assumptions.map((a, i) => ({ ...a, id: `res-${i + 1}` }));
}

function res(
  statement: string,
  available: boolean,
  requiredBy: readonly string[] = []
): Omit<ResourceAssumption, "id"> {
  return {
    statement,
    status: available ? "available" : "unknown",
    confidence: available ? "medium" : "low",
    requiredBy,
    blocking: !available && statement.includes("Budget"),
    resolution: available ? null : "Confirm availability with customer",
  };
}

export function buildContextGaps(input: {
  ctx: StrategyPlanningContext;
  resources: readonly ResourceAssumption[];
}): PlanningContextGap[] {
  const gaps: PlanningContextGap[] = [];

  if (input.ctx.budgetStrategy.budgetRequired) {
    gaps.push({
      id: "gap-budget",
      missingContext: "Confirmed marketing budget",
      whyNeeded: "Paid channel setup and execution require budget certainty",
      affectedWork: ["Paid channel work packages", "Execution preparation"],
      blocking: true,
      recommendedResolution: "Confirm budget with customer before paid launch",
    });
  }

  const tracking = input.resources.find((r) => r.statement.includes("Tracking"));
  if (tracking?.status !== "available") {
    gaps.push({
      id: "gap-analytics",
      missingContext: "Analytics / conversion tracking connected",
      whyNeeded: "Channel launch and KPI measurement depend on tracking",
      affectedWork: ["Tracking work package", "Channel launch deliverables"],
      blocking: true,
      recommendedResolution: "Install and verify conversion tracking",
    });
  }

  const adAccount = input.resources.find((r) => r.statement.includes("Ad account"));
  if (adAccount?.status !== "available") {
    gaps.push({
      id: "gap-ad-account",
      missingContext: "Ad account access",
      whyNeeded: "Paid acquisition channels require connected ad accounts",
      affectedWork: ["Paid channel setup"],
      blocking: true,
      recommendedResolution: "Connect ad platform account",
    });
  }

  return gaps;
}

export function buildPlanningEscalations(gaps: readonly PlanningContextGap[]): import("./brain-types").PlanningEscalation[] {
  return gaps.filter((g) => g.blocking).map((g) => ({
    id: `esc-${g.id}`,
    reason: g.whyNeeded,
    requiredInput: g.missingContext,
    blocking: g.blocking,
    recommendedQuestion: g.recommendedResolution,
  }));
}
