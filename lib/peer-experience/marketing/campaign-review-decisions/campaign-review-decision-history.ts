import type {
  CampaignReviewDecision,
  CampaignReviewDecisionHistoryMap,
  CampaignReviewDecisionMap,
} from "./campaign-review-decision-types";

export function appendCampaignReviewDecisionHistory(
  history: CampaignReviewDecisionHistoryMap | undefined,
  workUnitId: string,
  decision: CampaignReviewDecision
): Record<string, readonly CampaignReviewDecision[]> {
  const existing = history?.[workUnitId] ?? [];
  return {
    ...(history ?? {}),
    [workUnitId]: [...existing, decision],
  };
}

export function resolveCurrentCampaignReviewDecision(input: {
  workUnitId: string;
  artifactVersion: number;
  decisions: CampaignReviewDecisionMap | undefined;
}): CampaignReviewDecision | null {
  const decision = input.decisions?.[input.workUnitId];
  if (!decision) return null;
  if (decision.artifactVersion !== input.artifactVersion) {
    return null;
  }
  return decision;
}

export function isCampaignReviewDecisionCurrent(input: {
  decision: CampaignReviewDecision;
  artifactVersion: number;
}): boolean {
  return input.decision.artifactVersion === input.artifactVersion;
}
