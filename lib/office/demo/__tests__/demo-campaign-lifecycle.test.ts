import { describe, expect, it, beforeEach, vi } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  approveAllDemoDrafts,
  canPublishDemoCampaign,
  canScheduleDemoCampaign,
  createDemoCampaign,
  getDemoCampaignSnapshot,
  publishDemoCampaign,
  resetDemoCampaignStore,
  scheduleDemoCampaign,
  setDemoStepApproval,
} from "@/lib/office/demo/demo-campaign-store";
import { DemoIsolationError } from "@/lib/office/demo/demo-workspace-state";
import {
  clearPersistedDemoCampaignSnapshot,
  loadPersistedDemoCampaignSnapshot,
  persistDemoCampaignSnapshot,
  DEMO_CAMPAIGN_STORAGE_VERSION,
} from "@/lib/office/demo/demo-campaign-persistence";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";

beforeEach(() => {
  resetDemoCampaignStore();
  clearPersistedDemoCampaignSnapshot();
});

describe("demo campaign lifecycle", () => {
  function prepareApprovedCampaign() {
    const project = createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Lifecycle",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
    });
    setDemoStepApproval("demo", project.id, "strategy_determined", "approved");
    setDemoStepApproval("demo", project.id, "channels_selected", "approved");
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    const pending = domain.drafts.filter(
      (d) => d.status === "ready_for_review" && d.id.startsWith(project.id)
    );
    approveAllDemoDrafts(
      "demo",
      pending.map((d) => d.id),
      "Jij"
    );
    return project;
  }

  it("requires schedule before publish", () => {
    const project = prepareApprovedCampaign();
    expect(canScheduleDemoCampaign("demo", project.id)).toBe(true);
    expect(canPublishDemoCampaign("demo", project.id)).toBe(false);
    expect(publishDemoCampaign("demo", project.id)).toBe(false);

    expect(scheduleDemoCampaign("demo", project.id)).toBe(true);
    expect(canPublishDemoCampaign("demo", project.id)).toBe(true);
    expect(publishDemoCampaign("demo", project.id)).toBe(true);

    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    expect(domain.drafts.filter((d) => d.id.startsWith(project.id) && d.status === "published")).toHaveLength(
      domain.drafts.filter((d) => d.id.startsWith(project.id)).length
    );
  });

  it("blocks publish while approvals remain", () => {
    const project = createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Partial",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
    });
    setDemoStepApproval("demo", project.id, "channels_selected", "approved");
    expect(publishDemoCampaign("demo", project.id)).toBe(false);
    expect(scheduleDemoCampaign("demo", project.id)).toBe(false);
  });

  it("exposes separate schedule and publish CTAs", () => {
    const project = prepareApprovedCampaign();
    let domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    let workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(workflow.nextStepCta.action).toBe("schedule");
    expect(workflow.nextStepCta.label).toMatch(/inplannen/i);

    scheduleDemoCampaign("demo", project.id);
    domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(workflow.nextStepCta.action).toBe("publish_demo");

    publishDemoCampaign("demo", project.id);
    domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(workflow.nextStepCta.action).toBe("open_optimization");
    expect(workflow.steps.filter((s) => s.state === "active")).toHaveLength(1);
  });

  it("merges published drafts into Content", () => {
    const project = prepareApprovedCampaign();
    scheduleDemoCampaign("demo", project.id);
    publishDemoCampaign("demo", project.id);
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    const content = buildMarketingContentViewModel({
      domainInput: domain,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
    });
    const published = content.groups.flatMap((g) => g.items).filter((i) => i.campaignId === project.id);
    expect(published.length).toBeGreaterThanOrEqual(3);
  });
});

describe("demo campaign persistence", () => {
  it("serializes and deserializes snapshot", () => {
    const store = new Map<string, string>();
    const sessionStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("window", { sessionStorage: sessionStorageMock });

    createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Persist",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
    });
    const snapshot = getDemoCampaignSnapshot();
    persistDemoCampaignSnapshot(snapshot);
    const loaded = loadPersistedDemoCampaignSnapshot();
    expect(loaded?.extraProjects.length).toBe(1);
    expect(loaded?.extraProjects[0]?.title).toBe("Persist");
    vi.unstubAllGlobals();
  });

  it("discards incompatible storage version", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: vi.fn(() =>
          JSON.stringify({ version: DEMO_CAMPAIGN_STORAGE_VERSION + 1, peerId: "demo", snapshot: {} })
        ),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });
    expect(loadPersistedDemoCampaignSnapshot()).toBeNull();
    vi.unstubAllGlobals();
  });

  it("clears storage on reset", () => {
    createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Reset me",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
    });
    persistDemoCampaignSnapshot(getDemoCampaignSnapshot());
    resetDemoCampaignStore();
    expect(loadPersistedDemoCampaignSnapshot()).toBeNull();
  });

  it("blocks demo persistence and publish actions for live peer ids", () => {
    expect(() => scheduleDemoCampaign("emma", "camp-x")).toThrow(DemoIsolationError);
    expect(() => publishDemoCampaign("emma", "camp-x")).toThrow(DemoIsolationError);
  });
});
