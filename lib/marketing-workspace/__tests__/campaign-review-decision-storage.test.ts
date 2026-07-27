import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";

const PEER = "peer-review-persist";

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
}

describe("campaign review decision persistence", () => {
  beforeEach(() => {
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, {
      drafts: [],
      creativeBriefByCampaignId: { "proj-1": { campaignGoal: { summary: "Brief" } } as never },
      campaignReviewDecisionByWorkUnitId: {
        "wu-1": {
          id: "crd-1",
          organizationId: "org",
          peerId: PEER,
          projectId: "proj-1",
          workUnitId: "wu-1",
          artifactType: "creative_direction",
          decision: "changes_requested",
          artifactVersion: 1,
          decidedBy: "user",
          decidedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves review decisions when patching unrelated work units", () => {
    patchMarketingWorkspaceState(PEER, {
      workUnits: [
        {
          id: "wu-2",
          peerId: PEER,
          projectId: "proj-1",
          role: "Marketing",
          title: "LinkedIn",
          status: "planning",
          deliverableKind: "social_post",
          channel: "linkedin",
          objective: "x",
          audience: "y",
          needsVisual: false,
          recurrence: "once",
          automationTrigger: null,
          draftId: null,
          planActivityReference: null,
          rawRequest: "post",
          startedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          estimatedCompletionAt: null,
          artifacts: [],
          eventLog: [],
          paused: false,
          cancelled: false,
        },
      ],
    });

    const stored = loadMarketingWorkspaceState(PEER);
    expect(stored.campaignReviewDecisionByWorkUnitId?.["wu-1"]?.decision).toBe(
      "changes_requested"
    );
    expect(stored.creativeBriefByCampaignId?.["proj-1"]).toBeTruthy();
  });
});
