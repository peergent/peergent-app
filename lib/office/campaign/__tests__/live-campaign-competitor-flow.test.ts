import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  validateCompetitorInputs,
  validateCompetitorRow,
} from "@/lib/office/campaign/competitor-input-validation";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { executeCompetitorUnderstanding } from "@/lib/brain/capabilities/competitor-understanding";
import { buildPeergentCompanyProfile } from "@/lib/brain/demo/peergent-company-profile";
import { detectMissingInformation } from "@/lib/brain/context/missing-information";
import {
  normalizeCampaignCompetitorUrl,
  persistLiveCampaignCompetitorSkip,
  persistLiveCampaignCompetitors,
} from "@/lib/office/campaign/live-campaign-context-store";
import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  addDemoCompetitors,
  createDemoCampaign,
  getDemoCampaignSnapshot,
  resetDemoCampaignStore,
} from "@/lib/office/demo/demo-campaign-store";

const PEER = "emma";
const PROJECT_ID = "live-camp-1";

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

function liveProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Meer demo-aanvragen voor You Charge.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Meer demo-aanvragen voor You Charge.",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
    ...overrides,
  };
}

describe("live campaign competitor context flow", () => {
  beforeEach(() => {
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, {
      drafts: [],
      projects: [liveProject()],
    });
    resetDemoCampaignStore();
  });

  it("saves valid competitor name without URL", () => {
    const updated = persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Duurzame Jongens" }]);
    expect(updated?.campaignSetup?.campaignCompetitors).toEqual([{ name: "Duurzame Jongens" }]);
    expect(updated?.campaignSetup?.competitorsSkipped).toBe(false);
    expect(updated?.campaignSetup?.competitorsDecisionSource).toBe("customer_supplied");
  });

  it("normalizes bare domain to https", () => {
    expect(normalizeCampaignCompetitorUrl("duurzame-jongens.nl")).toBe("https://duurzame-jongens.nl");
    const updated = persistLiveCampaignCompetitors(PEER, PROJECT_ID, [
      { name: "Duurzame Jongens", url: "duurzame-jongens.nl" },
    ]);
    expect(updated?.campaignSetup?.campaignCompetitors?.[0]?.url).toBe("https://duurzame-jongens.nl");
  });

  it("shows inline validation error for malformed URL", () => {
    const result = validateCompetitorRow("Duurzame Jongens", "-duurzame-jongens.nl", true);
    expect(result.urlError).toMatch(/niet geldig/i);
  });

  it("blocks submit when validation errors exist", () => {
    const { hasErrors, validEntries } = validateCompetitorInputs(
      [{ name: "Duurzame Jongens", url: "-duurzame-jongens.nl" }],
      true
    );
    expect(hasErrors).toBe(true);
    expect(validEntries).toHaveLength(0);
  });

  it("persists live competitor list to workspace project setup", () => {
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [
      { name: "Concurrent A" },
      { name: "Concurrent B", url: "https://concurrent-b.nl" },
    ]);
    const stored = loadMarketingWorkspaceState(PEER).projects?.[0];
    expect(stored?.campaignSetup?.campaignCompetitors).toHaveLength(2);
    expect(stored?.campaignSetup?.competitorsDecisionAt).toBeDefined();
  });

  it("builds available competitor context after persist (workflow refresh input)", () => {
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Concurrent A" }]);
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    expect(ctx.competitorContextState).toBe("available");
    expect(ctx.competitors).toEqual([{ name: "Concurrent A" }]);
  });

  it("auto-approves competitors_analyzed workflow step after live persist", () => {
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Concurrent A" }]);
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: { projects: [project], drafts: [], workUnits: [] } as never,
      locale: "nl",
    });
    const competitorsStep = workflow.steps.find((s) => s.id === "competitors_analyzed");
    expect(competitorsStep?.state).toBe("done");
  });

  it("brain capability receives persisted competitor names", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        campaignCompetitors: [{ name: "Concurrent A" }],
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    const profile = buildPeergentCompanyProfile("nl", new Date().toISOString());
    const result = executeCompetitorUnderstanding({
      locale: "nl",
      companySnapshot: {
        organizationId: "org-emma",
        profile,
        website: null,
        knownFacts: [],
        unknowns: [],
        sources: [],
        assembledAt: new Date().toISOString(),
      },
      campaignContext: ctx,
      upstreamOutputs: {},
    });
    expect(result.findings.some((f) => f.value.includes("Concurrent A"))).toBe(true);
  });

  it("does not invent competitors beyond customer entries", () => {
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Only One" }]);
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const ctx = buildCampaignContext({
      project,
      domainInput: {
        projects: [project],
        understanding: { competitors: [{ name: "Profile Competitor" }] },
      } as never,
    });
    expect(ctx.competitors).toEqual([{ name: "Only One" }]);
  });

  it("uses truthful limitation copy and single merged recommendation", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        campaignCompetitors: [{ name: "A" }, { name: "B" }],
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    const profile = buildPeergentCompanyProfile("nl", new Date().toISOString());
    const result = executeCompetitorUnderstanding({
      locale: "nl",
      companySnapshot: {
        organizationId: "org-emma",
        profile,
        website: null,
        knownFacts: [],
        unknowns: [],
        sources: [],
        assembledAt: new Date().toISOString(),
      },
      campaignContext: ctx,
      upstreamOutputs: {},
    });
    expect(result.findings.some((f) => f.id === "competitor-limitation")).toBe(true);
    expect(result.recommendations.filter((r) => r.id === "rec-diff-merged")).toHaveLength(1);
  });

  it("persists explicit skipped competitor state", () => {
    const updated = persistLiveCampaignCompetitorSkip(PEER, PROJECT_ID);
    expect(updated?.campaignSetup?.competitorsSkipped).toBe(true);
    expect(updated?.campaignSetup?.competitorsDecisionSource).toBe("customer_skipped");
    expect(updated?.campaignSetup?.campaignCompetitors).toEqual([]);
  });

  it("does not flag missing competitors after explicit skip during assembly", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        competitorsSkipped: true,
        competitorsDecisionSource: "customer_skipped",
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    const profile = buildPeergentCompanyProfile("nl", new Date().toISOString());
    const missing = detectMissingInformation({
      profile,
      website: null,
      competitorsSkipped: ctx.competitorsSkipped,
    });
    expect(missing.some((m) => m.fieldKey === "mainCompetitors")).toBe(false);
  });

  it("never writes live competitor decisions into demo store", () => {
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Concurrent A" }]);
    expect(getDemoCampaignSnapshot().campaignContexts[PROJECT_ID]).toBeUndefined();
  });

  it("isolates live persistence per peer workspace key", () => {
    saveMarketingWorkspaceState("other-peer", { drafts: [], projects: [liveProject({ id: "other" })] });
    persistLiveCampaignCompetitors(PEER, PROJECT_ID, [{ name: "Concurrent A" }]);
    const other = loadMarketingWorkspaceState("other-peer").projects?.[0];
    expect(other?.campaignSetup?.campaignCompetitors).toBeUndefined();
  });

  it("rejects demo peer in live competitor store", () => {
    patchMarketingWorkspaceState("demo", { projects: [liveProject({ peerId: "demo" })] });
    expect(() =>
      persistLiveCampaignCompetitors("demo", PROJECT_ID, [{ name: "Concurrent A" }])
    ).toThrow();
  });

  it("prevents duplicate empty persist calls from creating phantom entries", () => {
    expect(persistLiveCampaignCompetitors(PEER, PROJECT_ID, [])).toBeNull();
    expect(loadMarketingWorkspaceState(PEER).projects?.[0]?.campaignSetup?.campaignCompetitors).toBeUndefined();
  });
});

describe("demo competitor handlers unchanged", () => {
  beforeEach(() => {
    resetDemoCampaignStore();
  });

  it("demo store still handles competitors separately from live workspace", () => {
    const project = createDemoCampaign(
      "demo",
      {
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Peergent",
        goalLabel: "Demo-aanvragen",
        description: "Demo campagne",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "nl"
    );
    addDemoCompetitors("demo", project.id, [{ name: "Demo Concurrent" }]);
    expect(getDemoCampaignSnapshot().campaignContexts[project.id]?.competitors).toEqual([
      { name: "Demo Concurrent" },
    ]);
  });
});
