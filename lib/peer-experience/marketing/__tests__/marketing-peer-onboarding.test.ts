import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { rawRequestWithExecutorOperationId } from "@/lib/peer-experience/marketing/campaign-execution";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  shouldHideCampaignExecutionPlanWhileOnboarding,
  shouldShowMarketingPeerOnboarding,
} from "@/features/marketing-workspace/lib/marketing-peer-onboarding-presenter";

const repoRoot = join(process.cwd());
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

const projectId = "project-onboard-1";

function baseInput(
  overrides: Partial<Parameters<typeof shouldShowMarketingPeerOnboarding>[0]> = {}
) {
  return {
    campaignsEnabled: true,
    projectOrigin: "campaign_wizard" as const,
    projectId,
    workUnits: [] as readonly WorkUnit[],
    campaignStatus: "planning" as const,
    onboardingDismissed: false,
    ...overrides,
  };
}

function executorWorkUnit(id: string): WorkUnit {
  return {
    id,
    peerId: "peer-emma",
    projectId,
    role: "marketing",
    title: "Step",
    status: "pending",
    deliverableKind: "social_post",
    channel: "linkedin",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "none",
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

describe("shouldShowMarketingPeerOnboarding", () => {
  it("shows for campaign wizard in planning before execution starts", () => {
    expect(shouldShowMarketingPeerOnboarding(baseInput())).toBe(true);
  });

  it("hides when campaign workspace feature flag is off", () => {
    expect(shouldShowMarketingPeerOnboarding(baseInput({ campaignsEnabled: false }))).toBe(
      false
    );
  });

  it("hides for legacy manual projects", () => {
    expect(
      shouldShowMarketingPeerOnboarding(
        baseInput({ projectOrigin: "manual_assignment" })
      )
    ).toBe(false);
  });

  it("hides after campaign execution work has started", () => {
    expect(
      shouldShowMarketingPeerOnboarding(
        baseInput({ workUnits: [executorWorkUnit("wu-1")] })
      )
    ).toBe(false);
  });

  it("hides when campaign is no longer in planning status", () => {
    expect(
      shouldShowMarketingPeerOnboarding(baseInput({ campaignStatus: "active" }))
    ).toBe(false);
  });

  it("hides when customer skipped or continued (session dismiss)", () => {
    expect(
      shouldShowMarketingPeerOnboarding(baseInput({ onboardingDismissed: true }))
    ).toBe(false);
  });
});

describe("shouldHideCampaignExecutionPlanWhileOnboarding", () => {
  it("hides execution plan section while onboarding is active", () => {
    expect(shouldHideCampaignExecutionPlanWhileOnboarding(true)).toBe(true);
    expect(shouldHideCampaignExecutionPlanWhileOnboarding(false)).toBe(false);
  });
});

describe("Campaign detail onboarding integration", () => {
  const detail = read("features/marketing-workspace/components/CampaignDetailSections.tsx");

  it("renders MarketingPeerOnboardingCard when onboarding is active", () => {
    expect(detail).toContain("MarketingPeerOnboardingCard");
    expect(detail).toContain("shouldShowMarketingPeerOnboarding");
  });

  it("gates execution plan behind onboarding hide helper", () => {
    expect(detail).toContain("shouldHideCampaignExecutionPlanWhileOnboarding");
    expect(detail).toMatch(/executionPlan && !hideExecutionPlan/);
  });

  it("does not expose onboarding tasks as interactive controls", () => {
    const card = read("features/marketing-workspace/components/MarketingPeerOnboardingCard.tsx");
    const css = read("features/marketing-workspace/styles/marketing-workspace.css");
    expect(card).toContain("mw-marketing-peer-onboarding-task");
    expect(card).toMatch(/MARKETING_PEER_ONBOARDING_TASK_LABELS\.map/);
    expect(card).not.toMatch(/MARKETING_PEER_ONBOARDING_TASK_LABELS\.map[\s\S]*<button/);
    expect(css).toContain("pointer-events: none");
  });

  it("legacy ProjectDetailTab path unchanged for non-wizard projects", () => {
    const tab = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(tab).toContain("shouldRenderCampaignWizardDetailView");
    expect(tab).toMatch(/if \(showCampaignExperience && campaignDetail\)/);
  });
});

describe("MarketingPeerOnboardingCard copy", () => {
  const card = read("features/marketing-workspace/components/MarketingPeerOnboardingCard.tsx");

  it("includes Continue and Skip for now actions", () => {
    expect(card).toContain("Continue");
    expect(card).toContain("Skip for now");
    expect(card).toContain("MARKETING_PEER_ONBOARDING_PREP_ITEMS");
  });

  it("lists five onboarding task labels in presenter", () => {
    const presenter = read(
      "features/marketing-workspace/lib/marketing-peer-onboarding-presenter.ts"
    );
    expect(presenter).toContain("Understand your business");
    expect(presenter).toContain("Prepare content calendar");
  });
});
