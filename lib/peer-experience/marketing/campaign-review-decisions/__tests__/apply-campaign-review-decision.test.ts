import { describe, expect, it } from "vitest";

import { applyCampaignReviewDecision } from "../apply-campaign-review-decision";
import type { ApplyCampaignReviewDecisionContext } from "../apply-campaign-review-decision";
import { CAMPAIGN_STRATEGY_WORK_UNIT_TITLE } from "../../runtime/identify-work-unit";
import { createWorkUnit } from "@/lib/peer-workflow";

const projectId = "proj-1";
const workUnitId = "wu-strategy";

function baseContext(
  overrides?: Partial<ApplyCampaignReviewDecisionContext>
): ApplyCampaignReviewDecisionContext {
  const unit = createWorkUnit({
    peerId: "peer-1",
    projectId,
    role: "Marketing",
    title: CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
    deliverableKind: "strategy",
    channel: "multi",
    objective: "Grow",
    audience: "Leaders",
    rawRequest: "Strategy",
  });
  unit.status = "review_ready";
  return {
    approvalMode: "approval_before_generation",
    workUnits: [{ ...unit, id: workUnitId }],
    strategy: {
      summary: "Strategy summary",
      positioningRecommendations: [],
      messagingPillars: [],
      recommendedChannels: [],
      ctaGuidance: "Learn more",
    } as never,
    decisions: {},
    decisionHistory: {},
    artifactVersions: { [workUnitId]: 1 },
    ...overrides,
  };
}

describe("applyCampaignReviewDecision", () => {
  it("approves current artifact version", () => {
    let stored = {};
    const result = applyCampaignReviewDecision(
      {
        organizationId: "org",
        peerId: "peer-1",
        projectId,
        workUnitId,
        artifactType: "campaign_strategy",
        artifactVersion: 1,
        decision: "approved",
        decidedBy: "user-1",
        decidedAt: new Date().toISOString(),
      },
      baseContext(),
      (next) => {
        stored = next.decisions;
      }
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe("approved");
    expect(stored[workUnitId as keyof typeof stored]).toBeTruthy();
  });

  it("requires feedback for changes requested", () => {
    const result = applyCampaignReviewDecision(
      {
        organizationId: "org",
        peerId: "peer-1",
        projectId,
        workUnitId,
        artifactType: "campaign_strategy",
        artifactVersion: 1,
        decision: "changes_requested",
        decidedBy: "user-1",
        decidedAt: new Date().toISOString(),
      },
      baseContext(),
      () => undefined
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("feedback");
  });

  it("rejects stale artifact version", () => {
    const result = applyCampaignReviewDecision(
      {
        organizationId: "org",
        peerId: "peer-1",
        projectId,
        workUnitId,
        artifactType: "campaign_strategy",
        artifactVersion: 1,
        decision: "approved",
        decidedBy: "user-1",
        decidedAt: new Date().toISOString(),
      },
      baseContext({ artifactVersions: { [workUnitId]: 2 } }),
      () => undefined
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("newer version");
  });
});
