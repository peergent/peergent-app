import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import type { CreativeBrief } from "@/lib/creative-brief";
import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "../storage";

const peerId = "peer-creative-brief-test";

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

function sampleBrief(projectId: string): CreativeBrief {
  return {
    id: "brief-1",
    organizationId: "org-1",
    title: "Creative direction",
    status: "ready",
    version: 1,
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    campaignGoal: { summary: "Campaign concept", successMetric: "Angle" },
    audience: { segmentLabel: "SMB" },
    channel: { channel: "email" },
    contentType: "newsletter",
    tone: { directive: "Confident" },
    cta: { primary: "Start trial" },
    messagingPriorities: { primaryMessage: "Primary", supportingMessages: ["Support"] },
    visualPriorities: { summary: "Minimal visuals" },
    requiredAssets: [],
    forbiddenClaims: [],
    forbiddenWords: [],
    requiredDisclaimers: [],
    platformConstraints: {},
    outputRequirements: { deliverableSummary: "Direction" },
    approvalRequirements: { legalReviewRequired: false, brandReviewRequired: true },
  };
}

describe("creative brief session persistence", () => {
  beforeEach(() => {
    installSessionStorageMock();
    saveMarketingWorkspaceState(peerId, {
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

  it("retains creativeBriefByCampaignId when a later patch only updates workUnits", () => {
    const projectId = "proj-1";
    patchMarketingWorkspaceState(peerId, {
      creativeBriefByCampaignId: { [projectId]: sampleBrief(projectId) },
    });

    patchMarketingWorkspaceState(peerId, {
      workUnits: [
        {
          id: "wu-creative",
          projectId,
        } as never,
      ],
    });

    const loaded = loadMarketingWorkspaceState(peerId);
    expect(loaded.creativeBriefByCampaignId?.[projectId]?.campaignGoal.summary).toBe(
      "Campaign concept"
    );
  });

  it("restores creative brief after reload from sessionStorage", () => {
    const projectId = "proj-1";
    patchMarketingWorkspaceState(peerId, {
      creativeBriefByCampaignId: { [projectId]: sampleBrief(projectId) },
    });

    const reloaded = loadMarketingWorkspaceState(peerId);
    expect(Object.keys(reloaded.creativeBriefByCampaignId ?? {})).toContain(projectId);
  });
});
