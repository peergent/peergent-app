import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-marketing-work-unit";
import { buildOfficeCampaignReviewViewModel } from "@/lib/office/campaign/build-office-campaign-review-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const repoRoot = join(process.cwd());
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), "utf8");

const peerId = "emma";
const projectId = "proj-office-briefing";

function strategyReadyDomainInput(): MarketingPeerDomainInput {
  let strategyUnit = createWorkUnit({
    peerId,
    projectId,
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
  strategyUnit = transitionWorkUnit(
    strategyUnit,
    "review_ready",
    "review_ready",
    CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
  );

  const project = {
    id: projectId,
    peerId,
    title: "Office launch",
    goal: "Grow pipeline",
    campaignType: "product_launch" as const,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    ownerLabel: "You",
    rawRequest: "Launch",
    campaignSetup: { approvalMode: "approval_before_publication" as const },
  };

  return {
    peerId,
    peerName: "Emma",
    userName: "Alex",
    campaignTitle: "Office launch",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: {
      summary: "Lead with founder POV.",
      generatedAt: "2026-07-24T12:00:00.000Z",
      positioningRecommendations: [{ recommendation: "Premium peer OS" }],
      contentPillars: [{ name: "Trust" }],
      campaignIdeas: [],
      socialMediaStrategy: [{ platform: "LinkedIn" }],
      targetAudiences: [{ segment: "SMB leaders", priority: "primary" }],
    } as never,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [strategyUnit],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

describe("office executive briefing UI integration", () => {
  it("buildOfficeCampaignReviewViewModel surfaces executive briefing when strategy is ready", () => {
    const domainInput = strategyReadyDomainInput();
    const vm = buildOfficeCampaignReviewViewModel({
      peerId,
      projectId,
      domainInput,
      localePreference: "nl",
    });

    expect(vm).not.toBeNull();
    expect(vm!.executiveBriefing).not.toBeNull();
    expect(vm!.executiveBriefingPendingApproval).toBe(true);
    expect(vm!.executiveBriefing!.sections.some((s) => s.id === "executive-summary")).toBe(true);
    expect(vm!.executiveBriefing!.sections.some((s) => s.id === "customer-needs")).toBe(true);
    expect(vm!.executiveBriefing!.sections.some((s) => s.id === "top-decisions")).toBe(true);
  });

  it("reuses cached planning via shared executive briefing builder (no office-only regeneration path)", () => {
    const briefingBuilder = read(
      "lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing.ts"
    );
    expect(briefingBuilder).toContain("ensureCampaignPlanning");
    expect(briefingBuilder).toContain("readPlanningGraphFromOutputs");

    const planningTests = read("lib/brain/__tests__/campaign-planning-integration.test.ts");
    expect(planningTests).toContain("reused");
    expect(planningTests).toContain("campaign_planning");
  });

  it("wires campaign experience into the office campaign page", () => {
    const page = read("app/office/[peerId]/work/campaigns/[campaignId]/page.tsx");
    expect(page).toContain("CampaignExperienceView");
    expect(page).toContain("buildCampaignDetailViewModel");
    expect(page).toContain("CampaignOptimizationPanel");
    expect(page).toContain("OfficeDeliverableReviewModal");
  });

  it("renders OfficeExecutiveCampaignReview with polished summary UX", () => {
    const view = read("features/office/campaign/VisionCampaignDetailView.tsx");
    expect(view).toContain("OfficeExecutiveCampaignReview");
    expect(view).toContain("executiveBriefingActive={showExecutiveBriefing}");

    const review = read("features/office/campaign/OfficeExecutiveCampaignReview.tsx");
    expect(review).toContain('data-testid="office-executive-campaign-review"');
    expect(review).toContain("OfficeExecutiveBriefingSummary");
    expect(review).toContain("presentOfficeExecutiveBriefingSummary");
  });

  it("demotes workflow timeline under technical reasoning disclosure", () => {
    const core = read("features/office/campaign/CampaignWorkspaceCore.tsx");
    expect(core).toContain("executiveBriefingActive");
    expect(core).toContain("hideLegacyApprovalCentre");
    expect(core).toContain("campaign-technical-reasoning");

    const timeline = read("features/office/campaign/CampaignWorkflowTimeline.tsx");
    expect(timeline).toContain("disclosure");
  });

  it("keeps progressive disclosure in the detailed inspector", () => {
    const inspector = read("features/office/campaign/OfficeExecutiveBriefingInspector.tsx");
    expect(inspector).toContain("ExecutiveCampaignBriefingPanel");
    expect(inspector).toContain("onWorkflowStepOpen");
  });
});
