import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { saveMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";
import {
  enqueueLiveStrategyRunServer,
  resetLiveStrategyRunServerInFlightForTests,
} from "@/lib/office/campaign/live-strategy-run-execution";
import {
  shouldExecuteStrategyOnServer,
  shouldEnqueueLiveStrategyRun,
} from "@/lib/office/campaign/live-strategy-run-service";
import { isTerminalStrategyRunStatus } from "@/lib/office/campaign/strategy-run-timing";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { BrainRunResult } from "@/lib/brain/runtime/run-result";

const episodeControllerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/brain/project-runtime/campaign-episode-controller", () => ({
  startOrResumeCampaignEpisode: episodeControllerMock,
}));

const PEER = "emma";
const PROJECT_ID = "early-return-proj";

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
    id: PROJECT_ID,
    peerId: PEER,
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
    projects: [project],
    drafts: [],
    workUnits: [],
    understanding: null,
  };
}

function brainSuccess(providerId = "llm", delayMs = 0): BrainRunResult {
  return {
    run: {
      runId: "run-early",
      status: "completed",
      usage: { providerId, inputTokens: 665, outputTokens: 1085, modelId: "gpt-4.1-mini" },
    },
    assembly: { state: "ready", gaps: [] },
    output: {
      ...emptyBrainStructuredOutput("strategy", "1.0.0", "2026-08-01T00:00:00.000Z"),
      findings: [
        {
          id: "f1",
          label: "Positionering",
          value: "Focus op ondernemers.",
          confidence: "high",
        },
      ],
      recommendations: [
        {
          id: "r1",
          label: "Kanaal",
          rationale: "LinkedIn voor B2B bereik.",
          priority: "high",
        },
      ],
    },
  };
}

function episodeSuccess(providerId = "llm", delayMs = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "completed",
        orchestrationAuthority: "project_engine",
        episodeResumed: false,
        strategyCapabilityRun: brainSuccess(providerId),
        episode: { snapshot: { episodeId: "ep-early" } },
        missingContext: [],
      });
    }, delayMs);
  });
}

function serverInput(project: MarketingProject) {
  return {
    peerId: PEER,
    projectId: PROJECT_ID,
    project,
    understanding: null,
    organizationId: "org-emma",
    locale: "nl" as const,
  };
}

describe("strategy run early-return regression", () => {
  beforeEach(() => {
    installSessionStorageMock();
    resetLiveStrategyRunServerInFlightForTests();
    episodeControllerMock.mockReset();
    saveMarketingWorkspaceState(PEER, { projects: [readyProject()], drafts: [], workUnits: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetLiveStrategyRunServerInFlightForTests();
  });

  it("shouldExecuteStrategyOnServer ignores client optimistic gathering_context", () => {
    const optimistic = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: {
          status: "gathering_context",
          startedAt: new Date().toISOString(),
          contextVersion: 2,
        },
      },
    });
    expect(shouldEnqueueLiveStrategyRun(optimistic, domainInput(optimistic), "nl")).toBe(false);
    expect(shouldExecuteStrategyOnServer(optimistic, domainInput(optimistic), "nl").execute).toBe(
      true
    );
  });

  it("executes Brain when server receives optimistic gathering_context project", async () => {
    episodeControllerMock.mockImplementation(() => episodeSuccess("llm"));

    const optimistic = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: {
          status: "gathering_context",
          startedAt: new Date().toISOString(),
          contextVersion: 2,
        },
      },
    });

    const result = await enqueueLiveStrategyRunServer(serverInput(optimistic));

    expect(episodeControllerMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("completed");
    expect(result.status).not.toBe("gathering_context");
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
    expect(isTerminalStrategyRunStatus(result.status)).toBe(true);
  });

  it("waits for mocked Brain delay before returning terminal state", async () => {
    episodeControllerMock.mockImplementation(() => episodeSuccess("llm", 80));

    const started = Date.now();
    const result = await enqueueLiveStrategyRunServer(serverInput(readyProject()));
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(70);
    expect(result.status).toBe("completed");
    expect(result.provider).toBe("llm");
    expect(result.inputTokens).toBe(665);
    expect(result.outputTokens).toBe(1085);
    expect(result.fallbackUsed).toBe(false);
  });

  it("concurrent enqueue calls share one Brain execution and clear in-flight in finally", async () => {
    episodeControllerMock.mockImplementation(() => episodeSuccess("llm", 40));

    const input = serverInput(readyProject());
    const [first, second] = await Promise.all([
      enqueueLiveStrategyRunServer(input),
      enqueueLiveStrategyRunServer(input),
    ]);

    expect(episodeControllerMock).toHaveBeenCalledTimes(1);
    expect(first.status).toBe("completed");
    expect(second.status).toBe("completed");
  });

  it("waiting_for_input and failed are terminal and do not re-execute on server gate", () => {
    const waiting = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: { status: "waiting_for_input", contextVersion: 2 },
      },
    });
    const failed = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: { status: "failed", contextVersion: 2 },
      },
    });
    expect(shouldExecuteStrategyOnServer(waiting, domainInput(waiting), "nl").execute).toBe(false);
    expect(shouldExecuteStrategyOnServer(failed, domainInput(failed), "nl").execute).toBe(false);
    expect(isTerminalStrategyRunStatus("waiting_for_input")).toBe(true);
    expect(isTerminalStrategyRunStatus("failed")).toBe(true);
  });
});
