import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import { planCampaignExecution } from "@/lib/campaign/planner/plan-campaign-execution";
import type { CampaignPlannerSource } from "@/lib/campaign/planner/types";

import { applyCampaignExecutionPlan } from "../apply-campaign-execution-plan";
import type { CampaignExecutionResult, CampaignExecutionResultStatus } from "../types";

const assembledAt = "2026-07-20T12:00:00.000Z";

function plannerSource(overrides: Partial<CampaignPlannerSource> = {}): CampaignPlannerSource {
  const campaign = assembleCampaign({
    organizationId: "org-1",
    campaignId: "camp-1",
    name: "Test campaign",
    assembledAt,
  });
  return {
    organizationId: "org-1",
    peerId: "peer-1",
    campaign,
    assembledAt,
    ...overrides,
  };
}

function resultFromPlanner(overrides: Partial<CampaignPlannerSource> = {}): CampaignExecutionResult {
  const source = plannerSource(overrides);
  const plan = planCampaignExecution(source);
  return applyCampaignExecutionPlan({
    organizationId: source.organizationId,
    peerId: source.peerId,
    campaignId: plan.campaignId,
    currentCampaignStatus: "planning",
    executionPlan: plan,
    requestedBy: "user-1",
    assembledAt,
    version: plan.version,
  });
}

const RESULT_STATUSES: CampaignExecutionResultStatus[] = [
  "executable",
  "restricted",
  "blocked",
  "no_changes",
];

describe("CampaignExecutionResult shape", () => {
  it("includes required fields and recommended statuses", () => {
    const result = resultFromPlanner({ explicitChannels: ["LinkedIn"] });
    expect(result.id).toMatch(/^cer-/);
    expect(result.organizationId).toBe("org-1");
    expect(result.peerId).toBe("peer-1");
    expect(result.campaignId).toBe("camp-1");
    expect(result.sourcePlanId).toMatch(/^cep-/);
    expect(result.sourcePlanVersion).toBeGreaterThanOrEqual(1);
    expect(RESULT_STATUSES).toContain(result.status);
    expect(result.targetCampaignStatus).toBeTruthy();
    expect(Array.isArray(result.operations)).toBe(true);
    expect(Array.isArray(result.restrictions)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.nextActions)).toBe(true);
    expect(result.idempotencyKey.length).toBeGreaterThan(0);
    expect(result.assembledAt).toBe(assembledAt);
  });

  it("round-trips through JSON without losing structure", () => {
    const result = resultFromPlanner({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
    });
    const parsed = JSON.parse(JSON.stringify(result)) as CampaignExecutionResult;
    expect(parsed).toEqual(result);
  });

  it("exposes frozen operation lists on the result", () => {
    const result = resultFromPlanner({ explicitChannels: ["LinkedIn"] });
    expect(Object.isFrozen(result.operations)).toBe(true);
    expect(Object.isFrozen(result.restrictions)).toBe(true);
    expect(Object.isFrozen(result.warnings)).toBe(true);
    expect(Object.isFrozen(result.nextActions)).toBe(true);
  });
});
