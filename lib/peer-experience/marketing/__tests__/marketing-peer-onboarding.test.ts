import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { rawRequestWithExecutorOperationId } from "@/lib/peer-experience/marketing/campaign-execution";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  shouldShowCampaignExecutionPlan,
  shouldShowMarketingPeerWelcomeCard,
} from "@/features/marketing-workspace/lib/marketing-peer-onboarding-presenter";

const repoRoot = join(process.cwd());
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

const projectId = "project-onboard-1";

function baseCtx(overrides: Record<string, unknown> = {}) {
  return {
    campaignsEnabled: true,
    projectOrigin: "campaign_wizard" as const,
    projectId,
    workUnits: [] as readonly WorkUnit[],
    campaignStatus: "planning" as const,
    campaignSetup: { description: "d", primaryGoalId: "product_launch" },
    welcomeDismissed: false,
    ...overrides,
  };
}

function executorWorkUnit(id: string): WorkUnit {
  return {
    id,
    peerId: "peer-emma",
    projectId,
    role: "Marketing",
    title: "Step",
    status: "planning",
    deliverableKind: "social_post",
    channel: "LinkedIn",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    automationTrigger: null,
    draftId: null,
    planActivityReference: null,
    rawRequest: rawRequestWithExecutorOperationId(`op-${id}`, "body"),
    startedAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    estimatedCompletionAt: null,
    artifacts: [],
    eventLog: [],
    paused: false,
    cancelled: false,
  };
}

describe("shouldShowMarketingPeerWelcomeCard", () => {
  it("shows for campaign wizard in planning before execution starts", () => {
    expect(shouldShowMarketingPeerWelcomeCard(baseCtx())).toBe(true);
  });

  it("hides when campaign workspace feature flag is off", () => {
    expect(shouldShowMarketingPeerWelcomeCard(baseCtx({ campaignsEnabled: false }))).toBe(
      false
    );
  });

  it("hides for legacy manual projects", () => {
    expect(
      shouldShowMarketingPeerWelcomeCard(baseCtx({ projectOrigin: "manual_assignment" }))
    ).toBe(false);
  });

  it("hides after campaign execution work has started", () => {
    expect(
      shouldShowMarketingPeerWelcomeCard(
        baseCtx({ workUnits: [executorWorkUnit("wu-1")] })
      )
    ).toBe(false);
  });

  it("hides when welcome dismissed for session skip", () => {
    expect(shouldShowMarketingPeerWelcomeCard(baseCtx({ welcomeDismissed: true }))).toBe(
      false
    );
  });
});

describe("execution plan visibility", () => {
  it("stays hidden until onboardingCompletedAt is set", () => {
    expect(shouldShowCampaignExecutionPlan(baseCtx())).toBe(false);
    expect(
      shouldShowCampaignExecutionPlan(
        baseCtx({
          campaignSetup: {
            description: "d",
            primaryGoalId: "x",
            onboardingCompletedAt: "2026-07-24T12:00:00.000Z",
          },
        })
      )
    ).toBe(true);
  });
});

describe("Campaign detail onboarding integration", () => {
  const detail = read("features/marketing-workspace/components/CampaignDetailSections.tsx");

  it("wires conversational onboarding modal and incomplete state", () => {
    expect(detail).toContain("MarketingPeerCampaignOnboardingModal");
    expect(detail).toContain("MarketingPeerOnboardingIncompleteCard");
    expect(detail).toContain("shouldShowCampaignExecutionPlan");
    expect(detail).toContain("onCompleteCampaignOnboarding");
  });

  it("legacy ProjectDetailTab path unchanged for non-wizard projects", () => {
    const tab = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(tab).toContain("shouldRenderCampaignWizardDetailView");
    expect(tab).toMatch(/if \(showCampaignExperience && campaignDetail\)/);
  });
});

describe("MarketingPeerOnboardingCard copy", () => {
  const card = read("features/marketing-workspace/components/MarketingPeerOnboardingCard.tsx");

  it("uses Set up campaign primary action", () => {
    expect(card).toContain("Set up campaign");
    expect(card).toContain("Skip for now");
  });
});
