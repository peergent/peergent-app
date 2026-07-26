import { describe, expect, it } from "vitest";

import { planCampaignExecution } from "@/lib/campaign/planner/plan-campaign-execution";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCampaignPlannerSourceFromDomainInput } from "@/lib/peer-experience/marketing/campaign-planning/build-campaign-planner-source-from-domain-input";
import {
  applyCampaignOnboardingToProject,
  isCampaignOnboardingComplete,
  resolveCampaignSetupAudience,
  validateCampaignOnboardingInput,
} from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  shouldHideStartCampaignDuringSetup,
  shouldShowCampaignExecutionPlan,
  shouldShowMarketingPeerIncompleteSetup,
  shouldShowMarketingPeerWelcomeCard,
} from "@/features/marketing-workspace/lib/marketing-peer-onboarding-presenter";
import {
  toCampaignOnboardingInput,
  validateCampaignOnboardingStep,
  createCampaignOnboardingFormState,
} from "@/features/marketing-workspace/lib/campaign-onboarding-form";

const assembledAt = "2026-07-24T12:00:00.000Z";

function wizardProject() {
  return createMarketingCampaignProject({
    peerId: "peer-emma",
    ownerLabel: "Alex",
    name: "Launch",
    goalLabel: "Grow signups",
    description: "Summer push",
    primaryGoalId: "product_launch",
    targetAudience: "Founders",
    approvalMode: "approval_before_publication",
  });
}

describe("campaign onboarding persistence", () => {
  it("prefers confirmedAudience over targetAudience", () => {
    expect(
      resolveCampaignSetupAudience({
        description: "x",
        primaryGoalId: "product_launch",
        targetAudience: "Old",
        confirmedAudience: "New ICP",
      })
    ).toBe("New ICP");
  });

  it("marks onboarding complete with onboardingCompletedAt", () => {
    const project = wizardProject();
    const updated = applyCampaignOnboardingToProject(
      project,
      {
        audience: "SMB marketers",
        selectedChannels: ["linkedin"],
        customChannelLabels: [],
        selectedDeliverables: ["social_post"],
        customDeliverableLabels: [],
        timingDecision: "no_deadline",
      },
      assembledAt
    );
    expect(isCampaignOnboardingComplete(updated.campaignSetup)).toBe(true);
    expect(updated.campaignSetup?.confirmedAudience).toBe("SMB marketers");
    expect(updated.campaignSetup?.selectedChannels).toEqual(["linkedin"]);
  });

  it("rejects decide_later mixed with real channels", () => {
    expect(() =>
      validateCampaignOnboardingInput({
        audience: "A",
        selectedChannels: ["linkedin", "decide_later"],
        customChannelLabels: [],
        selectedDeliverables: ["social_post"],
        customDeliverableLabels: [],
        timingDecision: "no_deadline",
      })
    ).toThrow();
  });
});

describe("planner source after onboarding", () => {
  it("feeds explicit deliverables from campaignSetup without work units", () => {
    let project = wizardProject();
    project = applyCampaignOnboardingToProject(
      project,
      {
        audience: "Founders",
        selectedChannels: ["linkedin"],
        customChannelLabels: [],
        selectedDeliverables: ["social_post"],
        customDeliverableLabels: [],
        timingDecision: "no_deadline",
      },
      assembledAt
    );

    const domainInput: MarketingPeerDomainInput = {
      peerId: "peer-emma",
      userName: "Alex",
      peerName: "Emma",
      campaignTitle: "Launch",
      generating: null,
      generatingActivity: null,
      understanding: null,
      strategy: null,
      plan: null,
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      workUnits: [],
      projects: [project],
      responsibilities: [],
      automations: [],
      connections: [],
    };

    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput,
      assembledAt,
    });

    expect(source.explicitDeliverables?.length).toBeGreaterThan(0);
    expect(source.explicitChannels).toContain("LinkedIn");

    const plan = planCampaignExecution(source);
    expect(plan.gaps.some((g) => g.id === "gap-channels-deliverables")).toBe(false);
  });
});

describe("onboarding UI visibility", () => {
  const baseCtx = {
    campaignsEnabled: true,
    projectOrigin: "campaign_wizard" as const,
    projectId: "p1",
    workUnits: [],
    campaignStatus: "planning" as const,
    campaignSetup: wizardProject().campaignSetup,
    welcomeDismissed: false,
  };

  it("shows welcome before completion", () => {
    expect(shouldShowMarketingPeerWelcomeCard(baseCtx)).toBe(true);
    expect(shouldShowCampaignExecutionPlan(baseCtx)).toBe(false);
    expect(shouldHideStartCampaignDuringSetup(baseCtx)).toBe(true);
  });

  it("shows incomplete state after skip without revealing plan", () => {
    const skipped = { ...baseCtx, welcomeDismissed: true };
    expect(shouldShowMarketingPeerWelcomeCard(skipped)).toBe(false);
    expect(shouldShowMarketingPeerIncompleteSetup(skipped)).toBe(true);
    expect(shouldShowCampaignExecutionPlan(skipped)).toBe(false);
  });

  it("reveals plan after onboarding saved", () => {
    const project = applyCampaignOnboardingToProject(
      wizardProject(),
      {
        audience: "A",
        selectedChannels: ["email"],
        customChannelLabels: [],
        selectedDeliverables: ["email"],
        customDeliverableLabels: [],
        timingDecision: "no_deadline",
      },
      assembledAt
    );
    const complete = { ...baseCtx, campaignSetup: project.campaignSetup };
    expect(shouldShowCampaignExecutionPlan(complete)).toBe(true);
    expect(shouldHideStartCampaignDuringSetup(complete)).toBe(false);
  });
});

describe("campaign onboarding form steps", () => {
  it("requires audience on step 1", () => {
    const state = createCampaignOnboardingFormState(wizardProject());
    const errors = validateCampaignOnboardingStep(1, { ...state, audience: "  " });
    expect(errors.audience).toBeTruthy();
  });

  it("maps form state to onboarding input", () => {
    const state = createCampaignOnboardingFormState(wizardProject());
    const input = toCampaignOnboardingInput({
      ...state,
      audience: "Developers",
      selectedChannels: ["linkedin"],
      selectedDeliverables: ["social_post"],
      timingDecision: "no_deadline",
    });
    expect(input.audience).toBe("Developers");
    expect(input.selectedChannels).toEqual(["linkedin"]);
  });
});
