import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  buildAllMarketingApprovalQueue,
  buildMarketingApprovalQueue,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import { buildMarketingOverviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-overview-view-model";
import {
  deriveProjectProgress,
  deriveProjectStatus,
  createMarketingProject,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import { syncWorkUnitsWithMarketingState } from "@/lib/peer-experience/marketing/sync-work-units";
import {
  applyPilotSafeAutonomy,
  applyRoutinePostingAutonomous,
  deriveRoutinePostingAutonomous,
} from "@/features/marketing-workspace/lib/marketing-settings-policy";
import { createMarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/responsibility-engine";
import { RESPONSIBILITY_CATALOG } from "@/lib/peer-experience/marketing/responsibilities/responsibility-catalog";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

const peerId = "peer-emma";
const root = join(process.cwd());

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const baseInput: MarketingPeerDomainInput = {
  peerId,
  userName: "Pilot",
  peerName: "Emma",
  campaignTitle: "Pilot",
  generating: null,
  generatingActivity: null,
  understanding: { available: true, completeness: 80, gaps: [], summary: "", lastUpdated: "" },
  strategy: null,
  plan: null,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
};

const reviewDraft: MarketingContentDraft = {
  id: "draft-1",
  planActivityReference: "A1",
  contentType: "social_media_post",
  channel: "linkedin",
  status: "ready_for_review",
  title: "Pilot post",
  body: "Body",
  objective: "",
  keywords: [],
  rationale: { why: "", planActivityReference: "A1", strategyLinks: [] },
  sourceReferences: [],
  confidence: "high",
  warnings: [],
  generatedAt: new Date().toISOString(),
};

describe("marketing pilot integration", () => {
  it("approval resolution removes item from full queue and overview slice", () => {
    const withDraft = { ...baseInput, drafts: [reviewDraft] };
    expect(buildAllMarketingApprovalQueue(withDraft)).toHaveLength(1);
    expect(buildMarketingApprovalQueue(withDraft)).toHaveLength(1);

    const approved = {
      ...withDraft,
      drafts: [{ ...reviewDraft, status: "approved" as const }],
    };
    expect(buildAllMarketingApprovalQueue(approved)).toHaveLength(0);
    const overview = buildMarketingOverviewViewModel(approved);
    expect(overview.attention.items).toHaveLength(0);
  });

  it("approving draft syncs linked WorkUnit lifecycle", () => {
    const unit = createWorkUnit({
      peerId,
      projectId: "proj-1",
      role: "Marketing",
      title: "Post",
      deliverableKind: "linkedin",
      channel: "linkedin",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "",
    });
    unit.draftId = "draft-1";
    unit.status = "review_ready";
    const approvedDraft = { ...reviewDraft, status: "approved" as const };
    const synced = syncWorkUnitsWithMarketingState({
      workUnits: [unit],
      activeWorkUnitId: unit.id,
      generating: null,
      generatingActivity: null,
      drafts: [approvedDraft],
    });
    expect(synced[0]?.status).not.toBe("review_ready");
  });

  it("work unit progress affects project progress", () => {
    const project = createMarketingProject({
      peerId,
      title: "Pilot project",
      goal: "Goal",
      channel: "linkedin",
      deliverableKind: "linkedin_post",
      rawRequest: "",
      ownerLabel: "Emma",
    });
    const unit = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: "Step",
      deliverableKind: "linkedin",
      channel: "linkedin",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "",
    });
    unit.status = "creating";
    const status = deriveProjectStatus(project, [unit], [], new Set());
    const progressEarly = deriveProjectProgress(project, [unit], status);
    const unitDone = { ...unit, status: "published" as const };
    const statusDone = deriveProjectStatus(project, [unitDone], [], new Set());
    const progressLate = deriveProjectProgress(project, [unitDone], statusDone);
    expect(progressLate).toBeGreaterThanOrEqual(progressEarly);
  });

  it("posting autonomy off requires approval before auto-publish policy", () => {
    const resp = createMarketingResponsibility(peerId, RESPONSIBILITY_CATALOG[0]!, {
      enabled: true,
    });
    const autonomous = applyRoutinePostingAutonomous([resp], true);
    expect(deriveRoutinePostingAutonomous(autonomous)).toBe(true);
    const safe = applyRoutinePostingAutonomous([resp], false);
    expect(deriveRoutinePostingAutonomous(safe)).toBe(false);
    expect(safe[0]?.approvalPolicy).toBe("approval_required");
  });

  it("pilot safe configuration forces always ask and approval required", () => {
    const adsEntry = RESPONSIBILITY_CATALOG.find((e) => e.category === "google_ads")!;
    const resp = createMarketingResponsibility(peerId, adsEntry, {
      enabled: true,
    });
    const pilot = applyPilotSafeAutonomy([{ ...resp, autonomyLevel: "full" }]);
    expect(pilot[0]?.autonomyLevel).toBe("suggest");
    expect(pilot[0]?.approvalPolicy).toBe("approval_required");
    expect(pilot[0]?.guardrails.approvalRequired).toBe(true);
    expect(pilot[0]?.guardrails.maxMonthlySpend).toBe(0);
  });

  it("detail route pages use mw detail tabs not legacy wrappers", () => {
    const projectPage = read("app/team/[peerId]/projects/[projectId]/page.tsx");
    expect(projectPage).toContain("ProjectDetailTab");
    expect(projectPage).not.toContain("MarketingProjectDetailPage");

    const contentPage = read("app/team/[peerId]/content/[contentId]/page.tsx");
    expect(contentPage).toContain("ContentDetailTab");
    expect(contentPage).not.toContain("MarketingContentDetailPage");

    const respPage = read("app/team/[peerId]/responsibilities/[responsibilityId]/page.tsx");
    expect(respPage).toContain("ResponsibilityDetailTab");
    expect(respPage).not.toContain("MarketingResponsibilityDetailPage");
  });

  it("active marketing detail components do not use mp- classes", () => {
    for (const file of [
      "features/marketing-workspace/details/ProjectDetailTab.tsx",
      "features/marketing-workspace/details/ContentDetailTab.tsx",
      "features/marketing-workspace/details/ResponsibilityDetailTab.tsx",
    ]) {
      const src = read(file);
      expect(src.includes('className="mp-')).toBe(false);
      expect(src.includes("mp-empty")).toBe(false);
    }
  });

  it("no active team route imports MarketingPeerShell", () => {
    const frame = read("features/studio/marketing-peer/MarketingPeerPageFrame.tsx");
    expect(frame).not.toContain("MarketingPeerShell");
    const teamRoutes = [
      "app/team/[peerId]/page.tsx",
      "app/team/[peerId]/review/page.tsx",
      "app/team/[peerId]/work/page.tsx",
    ];
    for (const route of teamRoutes) {
      expect(read(route)).not.toContain("MarketingPeerShell");
    }
  });
});
