import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  STRATEGY_CLIENT_ACTION_TIMEOUT_MS,
  STRATEGY_SERVER_ACTION_TIMEOUT_MS,
} from "@/lib/office/campaign/strategy-run-types";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import {
  assertJsonSerializable,
  serializeRunLiveStrategyActionResult,
} from "@/lib/office/campaign/live-strategy-run-serialization";
import {
  recoverStaleOptimisticStrategyRun,
  triggerLiveStrategyRunViaServer,
} from "@/lib/office/campaign/live-strategy-run-client";
import { saveMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";

const actionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/office/campaign/live-strategy-run-action", () => ({
  runLiveStrategyAction: actionMock,
}));

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

function readyProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: "proj-hang-1",
    peerId: "emma",
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Grow leads",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Grow leads",
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
        productsAndServices: ["Laadoplossingen"],
        uniqueSellingPoints: ["Snelle installatie"],
        targetAudience: "Ondernemers",
      },
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
  return {
    peerId: "emma",
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

describe("strategy run hang safeguards", () => {
  beforeEach(() => {
    installSessionStorageMock();
    actionMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("client timeout clears active state and returns failed", async () => {
    vi.useFakeTimers();
    actionMock.mockImplementation(
      () => new Promise(() => {
        /* never resolves */
      })
    );

    const project = readyProject();
    saveMarketingWorkspaceState("emma", {
      projects: [project],
      drafts: [],
      workUnits: [],
    });

    const promise = triggerLiveStrategyRunViaServer({
      peerId: "emma",
      projectId: project.id,
      domainInput: domainInput(project),
    });

    await vi.advanceTimersByTimeAsync(STRATEGY_CLIENT_ACTION_TIMEOUT_MS + 1);
    const result = await promise;

    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.failureCode).toBe("client_request_timeout");
    expect(result.project?.campaignSetup?.strategyRun?.status).toBe("failed");
  });

  it("serializes action results as plain JSON", () => {
    const payload = serializeRunLiveStrategyActionResult({
      ok: true,
      status: "completed",
      project: readyProject(),
      provider: "llm",
      model: "gpt-4.1-mini",
      inputTokens: 12,
      outputTokens: 8,
      fallbackUsed: false,
      traceLastStage: "server_action_returned",
      traceStages: ["server_action_entered", "server_action_returned"],
    });
    expect(() => assertJsonSerializable(payload)).not.toThrow();
    expect(JSON.stringify(payload)).not.toContain("OPENAI_API_KEY");
  });

  it("recovers stale optimistic active runs on reload", () => {
    const stale = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: {
          status: "gathering_context",
          startedAt: new Date(Date.now() - 200_000).toISOString(),
        },
      },
    });
    saveMarketingWorkspaceState("emma", {
      projects: [stale],
      drafts: [],
      workUnits: [],
    });
    const recovered = recoverStaleOptimisticStrategyRun(
      "emma",
      stale.id,
      stale,
      "nl"
    );
    expect(recovered?.campaignSetup?.strategyRun?.status).toBe("failed");
    expect(recovered?.campaignSetup?.strategyRun?.failureCode).toBe("timeout");
  });

  it("bounded timeout helper rejects with code", async () => {
    vi.useFakeTimers();
    const promise = runWithBoundedTimeout(
      new Promise<string>(() => {
        /* hang */
      }),
      1000,
      "test_timeout"
    );
    const rejection = expect(promise).rejects.toThrow("test_timeout");
    await vi.advanceTimersByTimeAsync(1001);
    await rejection;
  });
});

describe("triggerLiveStrategyRunViaServer reconciliation", () => {
  beforeEach(() => {
    installSessionStorageMock();
    actionMock.mockReset();
  });

  it("applies successful server project and trace metadata", async () => {
    const project = readyProject();
    actionMock.mockResolvedValue({
      ok: true,
      status: "completed",
      project: {
        ...project,
        campaignSetup: {
          ...project.campaignSetup!,
          strategyGeneratedAt: "2026-08-01T01:00:00.000Z",
          strategyRun: {
            status: "completed",
            provider: "llm",
            fallbackUsed: false,
          },
        },
      },
      provider: "llm",
      fallbackUsed: false,
      traceLastStage: "server_action_returned",
    });

    const updates: MarketingProject[] = [];
    const result = await triggerLiveStrategyRunViaServer({
      peerId: "emma",
      projectId: project.id,
      domainInput: domainInput(project),
      onProjectUpdate: (updated) => updates.push(updated),
    });

    expect(result.ok).toBe(true);
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
    expect(updates.at(-1)?.campaignSetup?.strategyRun?.traceLastStage).toBe(
      "server_action_returned"
    );
  });

  it("records LLM token metadata from server result", async () => {
    actionMock.mockResolvedValue({
      ok: true,
      status: "completed",
      project: readyProject(),
      provider: "llm",
      inputTokens: 120,
      outputTokens: 45,
      fallbackUsed: false,
    });

    const result = await triggerLiveStrategyRunViaServer({
      peerId: "emma",
      projectId: "proj-hang-1",
      domainInput: domainInput(readyProject()),
    });

    expect(result.provider).toBe("llm");
    expect(result.fallbackUsed).toBe(false);
  });
});
