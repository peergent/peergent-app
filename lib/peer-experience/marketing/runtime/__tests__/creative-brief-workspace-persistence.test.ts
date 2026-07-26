/**
 * Regression: saveCreativeBrief then updateWorkUnit must not wipe the brief map
 * when workspace refs are synced on commit (same pattern as useMarketingWorkspace).
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import { resolveContentExecutionArtifacts } from "../resolve-content-execution-artifacts";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "../execute-creative-direction-work-unit";
import { CREATIVE_DIRECTION_WORK_UNIT_TITLE } from "../identify-work-unit";

const peerId = "peer-workspace-commit-test";
const projectId = "proj-1";
const peerIdUnit = "peer-1";

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return store;
}

function sampleStrategy(): MarketingStrategy {
  return {
    summary: "Strategy ready",
    confidence: "high",
    confidenceReason: "x",
    targetAudiences: [],
    positioningRecommendations: [],
    contentPillars: [],
    campaignIdeas: [],
    seoOpportunities: [],
    socialMediaStrategy: [],
    customerJourneyRecommendations: [],
    leadGenerationOpportunities: [],
    marketingPriorities: [],
    knowledgeGaps: [],
    generatedAt: "2026-07-24T12:00:00.000Z",
  };
}

function sampleBrief(): CreativeBrief {
  return {
    id: "brief-1",
    organizationId: "org-1",
    title: "Creative direction",
    status: "ready",
    version: 1,
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    campaignGoal: { summary: "Concept", successMetric: "Angle" },
    audience: { segmentLabel: "SMB" },
    channel: { channel: "email" },
    contentType: "newsletter",
    tone: { directive: "Confident" },
    cta: { primary: "Demo" },
    messagingPriorities: { primaryMessage: "Primary", supportingMessages: [] },
    visualPriorities: { summary: "Visuals" },
    requiredAssets: [],
    forbiddenClaims: [],
    forbiddenWords: [],
    requiredDisclaimers: [],
    platformConstraints: {},
    outputRequirements: { deliverableSummary: "Dir" },
    approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
  };
}

type WorkspaceSnapshot = {
  workUnits: WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId: Record<string, CreativeBrief>;
};

function createCommitWithSyncedRefs(initial: WorkspaceSnapshot) {
  const refs = {
    workUnits: [...initial.workUnits],
    strategy: initial.strategy,
    creativeBriefByCampaignId: { ...initial.creativeBriefByCampaignId },
  };

  const getSnapshot = (): WorkspaceSnapshot => ({
    workUnits: refs.workUnits,
    strategy: refs.strategy,
    creativeBriefByCampaignId: refs.creativeBriefByCampaignId,
  });

  const commit = (next: WorkspaceSnapshot) => {
    refs.workUnits = [...next.workUnits];
    refs.strategy = next.strategy;
    refs.creativeBriefByCampaignId = { ...next.creativeBriefByCampaignId };
    patchMarketingWorkspaceState(peerId, {
      workUnits: refs.workUnits,
      strategy: refs.strategy ?? undefined,
      creativeBriefByCampaignId: refs.creativeBriefByCampaignId,
    });
  };

  return { getSnapshot, commit, refs };
}

describe("creative brief workspace commit persistence", () => {
  beforeEach(() => {
    installSessionStorageMock();
    patchMarketingWorkspaceState(peerId, {
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      conversation: [],
      workUnits: [],
      projects: [],
      responsibilities: [],
      automations: [],
      metrics: [],
      approvalOverlays: {},
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps brief after saveCreativeBrief then updateWorkUnit commits with synced refs", () => {
    const brief = sampleBrief();
    const { getSnapshot, commit } = createCommitWithSyncedRefs({
      workUnits: [],
      strategy: sampleStrategy(),
      creativeBriefByCampaignId: {},
    });

    commit({
      ...getSnapshot(),
      creativeBriefByCampaignId: {
        ...getSnapshot().creativeBriefByCampaignId,
        [projectId]: brief,
      },
    });

    let creativeUnit = createWorkUnit({
      peerId: peerIdUnit,
      projectId,
      role: "Marketing",
      title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
      deliverableKind: "generic",
      channel: "Campaign",
      objective: "Direction",
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Direction",
    });
    creativeUnit = transitionWorkUnit(
      creativeUnit,
      "review_ready",
      "review_ready",
      CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
    );

    commit({
      ...getSnapshot(),
      workUnits: [creativeUnit],
    });

    const snapshot = getSnapshot();
    expect(snapshot.creativeBriefByCampaignId[projectId]?.campaignGoal.summary).toBe("Concept");

    const loaded = loadMarketingWorkspaceState(peerId);
    expect(loaded.creativeBriefByCampaignId?.[projectId]?.campaignGoal.summary).toBe("Concept");

    const resolved = resolveContentExecutionArtifacts({
      projectId,
      workUnits: snapshot.workUnits,
      strategy: snapshot.strategy,
      creativeBriefByCampaignId: snapshot.creativeBriefByCampaignId,
    });
    expect(resolved.ok).toBe(true);
  });

  it("documents stale-ref wipe when refs are not synced on commit", () => {
    const brief = sampleBrief();
    let briefRef: Record<string, CreativeBrief> = {};
    const strategy = sampleStrategy();

    patchMarketingWorkspaceState(peerId, {
      creativeBriefByCampaignId: { [projectId]: brief },
    });

    patchMarketingWorkspaceState(peerId, {
      workUnits: [],
      strategy,
      creativeBriefByCampaignId: { ...briefRef },
    });

    const loaded = loadMarketingWorkspaceState(peerId);
    expect(loaded.creativeBriefByCampaignId?.[projectId]).toBeUndefined();
    expect(briefRef[projectId]).toBeUndefined();
  });
});
