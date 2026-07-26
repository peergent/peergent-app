import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import type { CampaignSource } from "@/lib/campaign/campaign-source";

import { planCampaignExecution } from "../plan-campaign-execution";
import type { CampaignExecutionPlan } from "../types";

const assembledAt = "2026-07-20T12:00:00.000Z";

function minimalCampaignSource(overrides: Partial<CampaignSource> = {}): CampaignSource {
  return {
    organizationId: "org-1",
    campaignId: "campaign-wizard-1",
    name: "Summer launch",
    description: "Wizard campaign",
    assembledAt,
    audience: { targetAudience: "SMB founders" },
    approvalMode: "approval_before_publication",
    ...overrides,
  };
}

function planFromCampaignSource(
  source: CampaignSource,
  extras: Omit<Parameters<typeof planCampaignExecution>[0], "campaign" | "organizationId" | "peerId" | "assembledAt"> = {}
): CampaignExecutionPlan {
  const campaign = assembleCampaign(source);
  return planCampaignExecution({
    organizationId: source.organizationId,
    peerId: "peer-emma",
    campaign,
    assembledAt,
    ...extras,
  });
}

describe("CampaignExecutionPlan shape", () => {
  it("includes required top-level fields", () => {
    const plan = planFromCampaignSource(minimalCampaignSource());
    expect(plan.id).toBe("cep-campaign-wizard-1-v1");
    expect(plan.campaignId).toBe("campaign-wizard-1");
    expect(plan.organizationId).toBe("org-1");
    expect(plan.version).toBe(1);
    expect(plan.status).toBe("draft");
    expect(plan.objective.length).toBeGreaterThan(0);
    expect(plan.workPackages.length).toBeGreaterThan(0);
    expect(plan.executionOrder.length).toBe(plan.workPackages.length);
    expect(plan.approvals).toBeDefined();
    expect(plan.gaps.length).toBeGreaterThan(0);
    expect(plan.evidence.length).toBeGreaterThan(0);
    expect(plan.assembledAt).toBe(assembledAt);
  });

  it("round-trips through JSON serialization", () => {
    const plan = planFromCampaignSource(minimalCampaignSource());
    const roundTripped = JSON.parse(JSON.stringify(plan)) as CampaignExecutionPlan;
    expect(roundTripped).toEqual(plan);
  });

  it("does not embed full dependency domain objects in serialized plan", () => {
    const plan = planFromCampaignSource(
      minimalCampaignSource(),
      {
        strategySummary: {
          summary: "Inbound thought leadership for SMB founders.",
          confidence: "high",
          channelLabels: ["LinkedIn"],
        },
        planSummary: {
          summary: "Twelve-week launch plan.",
          confidence: "moderate",
          contentCalendar: [
            {
              title: "LinkedIn post",
              contentType: "linkedin_post",
              channel: "LinkedIn",
              scheduledWeek: 2,
              estimatedEffort: "medium",
            },
          ],
        },
        decisionSummary: {
          id: "dec-1",
          status: "ready",
          canExecute: true,
          canGenerateCreative: true,
          approvalMode: "approval_before_publication",
        },
        creativeBriefRefs: [{ id: "brief-1", contentType: "social_post", channel: "linkedin" }],
      }
    );
    const json = JSON.stringify(plan);
    expect(json).not.toContain("targetAudiences");
    expect(json).not.toContain("contentPillars");
    expect(json).not.toContain("MarketingDecisionRecord");
    expect(json).not.toContain("forbiddenWords");
    expect(json).not.toContain("messagingPriorities");
    expect(json).not.toContain('"workforce"');
  });
});
