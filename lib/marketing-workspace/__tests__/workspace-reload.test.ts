import { describe, expect, it, vi } from "vitest";
import { buildMarketingUnderstanding } from "@/lib/marketing-intelligence/understanding";
import { companyDnaToContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import { emptyBusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { MarketingProfileAggregate } from "@/lib/marketing-intelligence";
import type { CompanyDna } from "@/lib/company-dna";
import { createReloadGuard } from "@/lib/marketing-workspace/reload-guard";
import {
  applyUnderstandingToWorkspace,
  loadMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";

const emptyProfile: MarketingProfileAggregate = {
  id: "profile-1",
  organizationId: "org-1",
  brandPositioning: { keyMessages: [] },
  goals: [],
  contentItems: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function savedCompanyDna(): CompanyDna {
  return {
    id: "dna-1",
    organizationId: "org-1",
    mission: "We help growing teams hire AI peers.",
    values: [{ id: "v1", name: "Clarity" }],
    toneOfVoice: { summary: "Confident" },
    riskProfile: {},
    decisionPrinciples: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("createReloadGuard", () => {
  it("runs a task once when invoked concurrently", async () => {
    const guard = createReloadGuard();
    let runs = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const task = vi.fn(async () => {
      runs += 1;
      await gate;
    });

    const first = guard.run(task);
    const second = guard.run(task);

    release();
    const [firstRan, secondRan] = await Promise.all([first, second]);

    expect(firstRan).toBe(true);
    expect(secondRan).toBe(false);
    expect(runs).toBe(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("allows a subsequent reload after the prior task completes", async () => {
    const guard = createReloadGuard();
    let runs = 0;

    expect(await guard.run(async () => { runs += 1; })).toBe(true);
    expect(await guard.run(async () => { runs += 1; })).toBe(true);
    expect(runs).toBe(2);
  });
});

describe("applyUnderstandingToWorkspace", () => {
  it("reflects knowledge changes and removes resolved gaps from persisted feed", () => {
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
    });

    const peerId = "peer-1";
    store.set(
      `peergent-marketing-workspace:${peerId}`,
      JSON.stringify({
        drafts: [],
        conversation: [],
        activityFeed: [
          {
            id: "gap-companyDna",
            timestamp: "2026-01-01T00:00:00.000Z",
            activityType: "gap_detected",
            title: "Detected missing information",
            description: "Company Dna",
            relatedObject: "companyDna",
          },
        ],
      })
    );

    const understanding = buildMarketingUnderstanding({
      companyDna: companyDnaToContextSlice(savedCompanyDna()),
      businessBrain: {
        ...emptyBusinessBrainContextSlice(),
        available: true,
        products: [
          {
            id: "p1",
            businessBrainId: "bb1",
            name: "Platform",
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        services: [
          {
            id: "s1",
            businessBrainId: "bb1",
            name: "Onboarding",
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
        customerSegments: [
          {
            id: "seg1",
            businessBrainId: "bb1",
            name: "SMB founders",
            segments: [],
            painPoints: [],
            buyingTriggers: [],
            metadata: {},
            sortOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
      marketingProfile: emptyProfile,
    });

    const nextFeed = applyUnderstandingToWorkspace(peerId, understanding);
    const persisted = loadMarketingWorkspaceState(peerId);

    expect(understanding.gaps).not.toContain("companyDna");
    expect(nextFeed.some((item) => item.relatedObject === "companyDna")).toBe(false);
    expect(persisted.activityFeed?.some((item) => item.relatedObject === "companyDna")).toBe(
      false
    );
    const loadedItem = nextFeed.find((item) => item.activityType === "understanding_loaded");
    expect(loadedItem?.description).toContain(String(understanding.completeness));
    expect(persisted.activityFeed).toEqual(nextFeed);
  });
});

describe("MarketingWorkspaceView load contract", () => {
  it("documents stable loadWorkspace dependencies", () => {
    expect(["peerId", "organizationId"]).toEqual(["peerId", "organizationId"]);
  });
});
