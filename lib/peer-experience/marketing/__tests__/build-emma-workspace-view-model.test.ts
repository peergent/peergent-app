import { describe, expect, it } from "vitest";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
} from "@/lib/marketing-intelligence";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import { buildEmmaWorkspaceViewModel } from "@/lib/peer-experience/marketing/build-emma-workspace-view-model";
import { EMPLOYEE_WORKFLOW_STAGES } from "@/lib/peer-experience/marketing/emma-narrative";
import type { DeliverableViewModel, PrimaryAction } from "@/lib/peer-experience";

describe("buildEmmaWorkspaceViewModel", () => {
  const baseInput = {
    peerId: "peer-emma",
    userName: "Djemo",
    peerName: "Emma",
    campaignTitle: "AI Workforce Campaign",
    generating: null as GeneratingActivity | null,
    understanding: { available: true, completeness: 100, gaps: [], summary: "", lastUpdated: "" },
    drafts: [] as MarketingContentDraft[],
    plan: null as MarketingPlan | null,
    strategy: null as MarketingStrategy | null,
    publicationPackages: [],
    deliverable: { kind: "empty" as const, title: "", message: "" },
    primaryAction: null as PrimaryAction | null,
    activityFeed: [] as ActivityFeedItem[],
  };

  it("builds executive brief with user name", () => {
    const vm = buildEmmaWorkspaceViewModel(baseInput);
    expect(vm.executiveBrief.userName).toBe("Djemo");
    expect(vm.executiveBrief.greeting).toMatch(/Good (morning|afternoon|evening)/);
  });

  it("uses seven real workflow stages when generating", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      generating: "draft",
      generatingActivity: "LinkedIn post",
    });

    expect(vm.currentWork.stages).toHaveLength(EMPLOYEE_WORKFLOW_STAGES.length);
    expect(vm.currentWork.stages.some((s) => s.status === "active")).toBe(true);
    expect(vm.currentWork.statusLine).toMatch(/^I'm /);
  });

  it("shows honest empty approval state when nothing needs review", () => {
    const vm = buildEmmaWorkspaceViewModel(baseInput);
    expect(vm.needsApproval.hasItem).toBe(false);
    expect(vm.needsApproval.emptyMessage).toContain("doesn't need your approval");
    expect(vm.needsApproval.emptySupportingMessage).toContain("ready for review");
    expect(vm.needsApproval.deliverable).toBeNull();
  });

  it("surfaces one approval item with Approve label", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      drafts: [
        {
          id: "d1",
          planActivityReference: "Review me",
          contentType: "linkedin_post",
          status: "ready_for_review",
          title: "Draft title",
          body: "Draft body",
          objective: "",
          keywords: [],
          rationale: {
            why: "I chose this headline because your audience engages with problem-first messaging.",
            planActivityReference: "Review me",
            strategyLinks: [],
          },
          sourceReferences: [],
          confidence: "moderate",
          warnings: [],
          generatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(vm.needsApproval.hasItem).toBe(true);
    expect(vm.needsApproval.primaryLabel).toBe("Approve");
    expect(vm.needsApproval.rationalePreview).toContain("problem-first");
  });

  it("shows current work stages when plan exists without generating", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      strategy: {
        summary: "Strategy",
        confidence: "high",
        campaignIdeas: [],
        seoOpportunities: [],
        positioning: "",
        targetAudiences: [],
        messagingPillars: [],
        competitiveNotes: [],
      },
      plan: {
        summary: "Plan",
        confidence: "high",
        contentCalendar: [
          {
            title: "LinkedIn post",
            contentType: "linkedin_post",
            scheduledWeek: 1,
            objective: "Leads",
          },
        ],
        successMetrics: [],
        expectedOutcomes: [],
        distributionChannels: [],
      },
    });

    expect(vm.currentWork.stages.length).toBeGreaterThan(0);
  });

  it("deduplicates executive brief highlights", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      drafts: [
        {
          id: "a1",
          planActivityReference: "Post",
          contentType: "linkedin_post",
          status: "approved",
          title: "Post",
          body: "Body",
          objective: "",
          keywords: [],
          rationale: { why: "", planActivityReference: "Post", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          warnings: [],
          generatedAt: new Date().toISOString(),
        },
      ],
      activityFeed: [
        {
          id: "act-1",
          type: "draft_approved",
          title: "Draft approved",
          description: "Draft approved",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const normalized = vm.executiveBrief.highlights.map((line) => line.text.toLowerCase());
    const approvedLines = normalized.filter((line) => line.includes("approved"));
    expect(approvedLines.length).toBeLessThanOrEqual(1);
  });

  it("includes platform and time on recently finished items", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      drafts: [
        {
          id: "p1",
          planActivityReference: "Post",
          contentType: "linkedin_post",
          status: "published",
          title: "Launch post",
          body: "Body",
          objective: "",
          keywords: [],
          rationale: { why: "", planActivityReference: "Post", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          warnings: [],
          generatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(vm.recentlyFinished.items[0]?.platform).toBeTruthy();
    expect(vm.recentlyFinished.items[0]?.timeLabel).toBeTruthy();
  });

  it("maps meta ads to meta_ad preview kind", () => {
    const vm = buildEmmaWorkspaceViewModel({
      ...baseInput,
      drafts: [
        {
          id: "m1",
          planActivityReference: "Ad",
          contentType: "meta_ads_copy",
          status: "draft",
          title: "Meta ad",
          body: "Ad copy",
          objective: "",
          keywords: [],
          rationale: { why: "Test", planActivityReference: "Ad", strategyLinks: [] },
          sourceReferences: [],
          confidence: "high",
          warnings: [],
          generatedAt: "",
        },
      ],
    });

    expect(vm.needsApproval.preview.kind).toBe("meta_ad");
  });
});
