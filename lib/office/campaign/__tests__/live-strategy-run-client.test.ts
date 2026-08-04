import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { saveMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";
import { triggerLiveStrategyRunViaServer } from "@/lib/office/campaign/live-strategy-run-client";

const actionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/office/campaign/live-strategy-run-action", () => ({
  runLiveStrategyAction: actionMock,
}));

const PEER = "emma";

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

function readyProject(): MarketingProject {
  return {
    id: "proj-client-1",
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
      websiteUrl: "https://you-charge.nl",
      campaignCompetitors: [{ name: "ChargePoint" }],
      campaignContextVersion: 2,
      campaignBrandContext: {
        brandName: "You Charge",
        industry: "EV",
        productsAndServices: ["Laadoplossingen voor ondernemers"],
        uniqueSellingPoints: ["Snelle installatie"],
        targetAudience: "Ondernemers",
      },
    },
  };
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    userName: "User",
    peerName: "Emma",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

describe("triggerLiveStrategyRunViaServer", () => {
  beforeEach(() => {
    installSessionStorageMock();
    actionMock.mockReset();
    saveMarketingWorkspaceState(PEER, {
      projects: [readyProject()],
      drafts: [],
      workUnits: [],
    });
  });

  it("refreshes project state after successful server completion", async () => {
    const project = readyProject();
    const completed = {
      ...project,
      campaignSetup: {
        ...project.campaignSetup!,
        strategyGeneratedAt: "2026-08-01T01:00:00.000Z",
        strategyRun: {
          status: "completed" as const,
          provider: "llm",
          fallbackUsed: false,
          contextVersion: 2,
        },
      },
    };
    actionMock.mockResolvedValue({
      ok: true,
      status: "completed",
      project: completed,
      provider: "llm",
      fallbackUsed: false,
    });

    const updates: MarketingProject[] = [];
    const result = await triggerLiveStrategyRunViaServer({
      peerId: PEER,
      projectId: project.id,
      domainInput: domainInput(project),
      onProjectUpdate: (updated) => updates.push(updated),
    });

    expect(result.ok).toBe(true);
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.at(-1)?.campaignSetup?.strategyRun?.status).toBe("completed");
  });

  it("uses server action boundary for retry path", async () => {
    actionMock.mockResolvedValue({
      ok: false,
      status: "failed",
      project: readyProject(),
      failureCode: "execution_error",
    });

    const project = readyProject();
    await triggerLiveStrategyRunViaServer({
      peerId: PEER,
      projectId: project.id,
      domainInput: domainInput(project),
    });

    expect(actionMock).toHaveBeenCalledTimes(1);
  });

  it("sends pre-optimistic project snapshot without gathering_context to server action", async () => {
    const project = readyProject();
    actionMock.mockResolvedValue({
      ok: true,
      status: "completed",
      project: {
        ...project,
        campaignSetup: {
          ...project.campaignSetup!,
          strategyGeneratedAt: "2026-08-01T01:00:00.000Z",
          strategyRun: { status: "completed", provider: "llm" },
        },
      },
      provider: "llm",
      fallbackUsed: false,
    });

    await triggerLiveStrategyRunViaServer({
      peerId: PEER,
      projectId: project.id,
      domainInput: domainInput(project),
    });

    const sentProject = actionMock.mock.calls[0]?.[0]?.project as MarketingProject;
    expect(sentProject.campaignSetup?.strategyRun?.status).not.toBe("gathering_context");
  });
});
