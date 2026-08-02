import { describe, expect, it, beforeEach } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  approveAllDemoDrafts,
  createDemoCampaign,
  getDemoCampaignSnapshot,
  resetDemoCampaignStore,
  setDemoDraftStatus,
} from "@/lib/office/demo/demo-campaign-store";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { DemoIsolationError } from "@/lib/office/demo/demo-workspace-state";

beforeEach(() => {
  resetDemoCampaignStore();
});

describe("demo campaign store isolation", () => {
  it("refuses live peer ids", () => {
    expect(() =>
      createDemoCampaign("live-peer", {
        peerId: "live-peer",
        ownerLabel: "Emma",
        name: "Test",
        goalLabel: "Leads",
        description: "Desc",
        primaryGoalId: "generate_leads",
      })
    ).toThrow(DemoIsolationError);
  });

  it("creates campaigns in memory and merges into demo domain input", () => {
    createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Nieuwe campagne",
      goalLabel: "Leads genereren",
      description: "Meer demo-aanvragen",
      primaryGoalId: "generate_leads",
      selectedChannels: ["linkedin"],
    });

    const base = buildDemoDomainInput();
    const merged = mergeDemoCampaignSnapshot(base, getDemoCampaignSnapshot());
    expect(merged.projects.some((p) => p.title === "Nieuwe campagne")).toBe(true);
  });

  it("approves pending drafts in demo only", () => {
    setDemoDraftStatus("demo", "draft-hp-1", "approved", {
      action: "approved",
      by: "Jij",
    });
    const merged = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    const draft = merged.drafts.find((d) => d.id === "draft-hp-1");
    expect(draft?.status).toBe("approved");
  });

  it("bulk approves all pending draft ids", () => {
    approveAllDemoDrafts("demo", ["draft-hp-1", "draft-hp-2"], "Jij");
    const snapshot = getDemoCampaignSnapshot();
    expect(snapshot.draftStatus["draft-hp-1"]).toBe("approved");
    expect(snapshot.draftStatus["draft-hp-2"]).toBe("approved");
    expect(snapshot.approvalHistory.length).toBe(2);
  });
});
