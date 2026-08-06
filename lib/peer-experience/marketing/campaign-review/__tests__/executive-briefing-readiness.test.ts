import { describe, expect, it } from "vitest";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-marketing-work-unit";
import { isExecutiveBriefingReady } from "@/lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing";
import { mergeCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review/campaign-review-types";

const peerId = "emma";
const projectId = "proj-scheduled";

function strategyBrainOutput(): BrainStructuredOutput {
  return {
    capabilityId: "strategy",
    capabilityVersion: getBrainCapability("strategy").version,
    generatedAt: "2026-08-01T10:00:00.000Z",
    findings: [{ label: "Campaign objective", value: "Grow pipeline" }],
    decisions: [],
    decisionRecords: [
      {
        id: "dec-1",
        title: "Lead with founder POV",
        category: "strategy_direction",
        recommendation: "Founder-led LinkedIn narrative",
        summary: "Founder-led LinkedIn narrative",
        confidence: "high",
        confidenceScore: 0.9,
        approvalRequired: true,
        businessImpact: "Higher trust with SMB owners",
        expectedOutcome: "More demo requests",
        reasoning: "SMB owners trust founder voice.",
        knownRisks: [],
        unknowns: [],
        supportingEvidence: ["research-1"],
        customerChallenges: [],
        dependencies: [],
        assumptions: [],
        alternativesConsidered: [],
        alternativesRejected: [],
        reviewTriggers: [],
        createdAt: "2026-08-01T10:00:00.000Z",
        brainVersion: "1.0.0",
      },
    ],
    errors: [],
    warnings: [],
  };
}

function officeScheduledProject(): MarketingProject {
  return {
    id: projectId,
    peerId,
    title: "Scheduled launch",
    goal: "Grow pipeline",
    campaignType: "product_launch",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
    ownerLabel: "You",
    rawRequest: "Launch",
    campaignSetup: {
      description: "Scheduled campaign",
      primaryGoalId: "generate_leads",
      approvalMode: "approval_before_publication",
      campaignContextVersion: 1,
      campaignBrainOutputs: mergeCampaignBrainOutputs(undefined, { strategy: strategyBrainOutput() }, 1),
    },
  };
}

function reviewReadyStrategyUnit() {
  let unit = createWorkUnit({
    peerId,
    projectId: "team-proj",
    role: "Marketing",
    title: CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Strategy",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Strategy",
  });
  unit = transitionWorkUnit(
    unit,
    "review_ready",
    "review_ready",
    CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
  );
  return unit;
}

describe("isExecutiveBriefingReady", () => {
  it("returns true for office scheduled campaigns with persisted strategy brain output", () => {
    const project = officeScheduledProject();
    const ready = isExecutiveBriefingReady({
      allReviewItems: [
        {
          id: "li-1",
          artifactType: "linkedin_post",
          status: "in_progress",
          preview: { kind: "linkedin_post" },
        } as CampaignReviewItem,
      ],
      approvalMode: "approval_before_publication",
      project,
    });

    expect(ready).toBe(true);
  });

  it("does not block briefing when content work units are in progress", () => {
    const project = officeScheduledProject();
    expect(
      isExecutiveBriefingReady({
        allReviewItems: [
          { id: "a", artifactType: "linkedin_post", status: "in_progress", preview: null } as CampaignReviewItem,
          { id: "b", artifactType: "email_campaign", status: "blocked", preview: null } as CampaignReviewItem,
        ],
        approvalMode: "approval_before_publication",
        project,
      })
    ).toBe(true);
  });

  it("does not require waiting_for_approval lifecycle state", () => {
    const project = officeScheduledProject();
    expect(
      isExecutiveBriefingReady({
        allReviewItems: [],
        approvalMode: "approval_before_publication",
        project,
      })
    ).toBe(true);
  });

  it("still supports marketing work-unit strategy path", () => {
    const strategyUnit = reviewReadyStrategyUnit();
    const ready = isExecutiveBriefingReady({
      allReviewItems: [
        {
          id: strategyUnit.id,
          artifactType: "campaign_strategy",
          status: "prepared",
          preview: { kind: "campaign_strategy" },
        } as CampaignReviewItem,
      ],
      approvalMode: "approval_before_publication",
    });
    expect(ready).toBe(true);
  });

  it("returns false without strategy brain output or strategy review item", () => {
    const project: MarketingProject = {
      ...officeScheduledProject(),
      campaignSetup: {
        ...officeScheduledProject().campaignSetup!,
        campaignBrainOutputs: undefined,
      },
    };
    expect(
      isExecutiveBriefingReady({
        allReviewItems: [],
        approvalMode: "approval_before_publication",
        project,
      })
    ).toBe(false);
  });
});
