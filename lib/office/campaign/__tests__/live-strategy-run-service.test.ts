import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import {
  enqueueLiveStrategyRunServer,
  resetLiveStrategyRunServerInFlightForTests,
} from "@/lib/office/campaign/live-strategy-run-execution";
import {
  shouldEnqueueLiveStrategyRun,
  strategyOutputCurrent,
} from "@/lib/office/campaign/live-strategy-run-service";
import { buildStrategyIdempotencyKey } from "@/lib/office/campaign/strategy-run-types";
import { orchestrationPrimaryActionToCta } from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";

const PEER = "emma";
const PROJECT_ID = "strategy-run-live-1";

const executeBrainMock = vi.hoisted(() => vi.fn());
const episodeControllerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/brain/project-runtime/campaign-episode-controller", () => ({
  startOrResumeCampaignEpisode: episodeControllerMock,
}));

vi.mock("@/lib/brain/integration/execute-brain-for-workflow-step", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/brain/integration/execute-brain-for-workflow-step")
  >();
  return {
    ...actual,
    executeBrainForWorkflowStep: executeBrainMock,
  };
});

vi.mock("@/lib/brain/persistence/repository-factory-server", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/brain/persistence/repository-factory-server")
  >();
  return actual;
});

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

function serverInput(project: MarketingProject, locale: "nl" | "en" = "nl") {
  return {
    peerId: PEER,
    projectId: PROJECT_ID,
    project,
    understanding: null,
    organizationId: "org-emma",
    locale,
  };
}

function brainSuccess(providerId = "deterministic") {
  return {
    run: {
      status: "completed",
      usage: { providerId },
    },
    assembly: { state: "ready" },
    output: {
      ...emptyBrainStructuredOutput("strategy", "1.0.0", "2026-08-01T00:00:00.000Z"),
      findings: [
        {
          id: "f1",
          label: "Positionering",
          value: "Focus op ondernemers met laadoplossingen op locatie.",
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
    policy: { requiresApproval: true },
    presentation: null,
    cacheHit: false,
  };
}

function workflowSuccess(providerId = "deterministic") {
  const result = brainSuccess(providerId);
  return {
    result,
    resolvedUpstreamOutputs: result.output ? { strategy: result.output } : {},
  };
}

function episodeSuccess(providerId = "deterministic") {
  const strategyRun = brainSuccess(providerId);
  return {
    orchestrationAuthority: "project_engine" as const,
    episodeResumed: false,
    status: "running" as const,
    episode: {
      snapshot: {
        completedBrains: ["strategy"],
        organizationId: "org-emma",
        projectId: PROJECT_ID,
        peerId: PEER,
        episodeId: "ep-test",
        state: "strategizing",
      },
      episodeStatus: "running",
      contextGaps: [],
    },
    missingContext: [],
    reason: null,
    events: [],
    observability: {
      episodeId: "ep-test",
      organizationId: "org-emma",
      projectId: PROJECT_ID,
      peerId: PEER,
      correlationId: "corr-test",
      currentProjectState: "strategizing",
      currentBrain: null,
      startedAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      completedAt: null,
      brainOutputRefs: {},
      eventCount: 0,
      approvalState: "none",
      observationState: "none",
      lastError: null,
    },
    strategyCapabilityRun: strategyRun,
    blockingContextGaps: [],
  };
}

describe("live strategy run service", () => {
  beforeEach(() => {
    installSessionStorageMock();
    resetLiveStrategyRunServerInFlightForTests();
    executeBrainMock.mockReset();
    episodeControllerMock.mockReset();
    saveMarketingWorkspaceState(PEER, { projects: [readyProject()], drafts: [], workUnits: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetLiveStrategyRunServerInFlightForTests();
  });

  it("enqueues when context is ready and no current output exists", () => {
    expect(shouldEnqueueLiveStrategyRun(readyProject(), domainInput(readyProject()), "nl")).toBe(true);
  });

  it("does not enqueue when strategy output matches context version", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyGeneratedAt: new Date().toISOString(),
        strategyRun: {
          status: "completed",
          contextVersion: 2,
        },
      },
    });
    expect(strategyOutputCurrent(project)).toBe(true);
    expect(shouldEnqueueLiveStrategyRun(project, domainInput(project), "nl")).toBe(false);
  });

  it("does not enqueue while an active run is in progress", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        strategyRun: {
          status: "running",
          startedAt: new Date().toISOString(),
          contextVersion: 2,
        },
      },
    });
    expect(shouldEnqueueLiveStrategyRun(project, domainInput(project), "nl")).toBe(false);
  });

  it("starts exactly one run for the same idempotency key", async () => {
    episodeControllerMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(episodeSuccess()), 30);
        })
    );

    const project = readyProject();
    const input = serverInput(project);

    const [first, second] = await Promise.all([
      enqueueLiveStrategyRunServer(input),
      enqueueLiveStrategyRunServer(input),
    ]);

    expect(episodeControllerMock).toHaveBeenCalledTimes(1);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.status).toBe("completed");
  });

  it("persists completed output and generated timestamp on success", async () => {
    episodeControllerMock.mockResolvedValue(episodeSuccess("deterministic"));

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
    expect(result.project?.campaignSetup?.strategyRun?.status).toBe("completed");
  });

  it("maps successful run to review strategy CTA", async () => {
    episodeControllerMock.mockResolvedValue(episodeSuccess("deterministic"));

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(result.ok).toBe(true);
    const completedProject = result.project ?? project;
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project: completedProject,
      domainInput: domainInput(completedProject),
      locale: "nl",
      isDemo: false,
    });

    expect(workflow.nextStepCta.action).toBe("continue");
    expect(workflow.nextStepCta.label.toLowerCase()).toContain("strategie");
  });

  it("leaves failed state instead of endless processing", async () => {
    episodeControllerMock.mockRejectedValue(new Error("provider_down"));

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    const cta = orchestrationPrimaryActionToCta(
      {
        kind: "retry_strategy",
        label: "Opnieuw proberen",
        failureMessageSafe: result.failureMessageSafe,
      },
      result.project?.campaignSetup?.strategyRun
    );
    expect(cta.action).toBe("retry_strategy");
    expect(cta.action).not.toBe("working");
  });

  it("treats waiting_for_input as non-processing primary action", async () => {
    episodeControllerMock.mockResolvedValue({
      ...episodeSuccess("llm"),
      status: "waiting_for_context",
      strategyCapabilityRun: null,
      blockingContextGaps: [{ kind: "business", requiredBy: "project_engine", reason: "x", blocking: true, resolutionType: "customer_input" }],
    });

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(result.status).toBe("waiting_for_input");
    expect(result.project?.campaignSetup?.strategyRun?.status).toBe("waiting_for_input");
  });

  it("invalidates stale output when context version increases", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        campaignContextVersion: 3,
        strategyGeneratedAt: new Date().toISOString(),
        strategyRun: {
          status: "completed",
          contextVersion: 2,
        },
      },
    });
    expect(strategyOutputCurrent(project)).toBe(false);
    expect(shouldEnqueueLiveStrategyRun(project, domainInput(project), "nl")).toBe(true);
  });

  it("builds stable idempotency keys from context version", () => {
    const key = buildStrategyIdempotencyKey({
      peerId: PEER,
      projectId: PROJECT_ID,
      contextVersion: 2,
      capabilityVersion: "v1",
    });
    expect(key).toContain("ctx2");
    expect(key).toContain(PROJECT_ID);
  });

  it("records native deterministic completion without marking fallback", async () => {
    episodeControllerMock.mockResolvedValue(episodeSuccess("deterministic"));

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(result.fallbackUsed).toBe(false);
    expect(result.project?.campaignSetup?.strategyRun?.fallbackUsed).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("times out long-running provider execution", async () => {
    vi.useFakeTimers();
    episodeControllerMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(episodeSuccess()), 200_000);
        })
    );

    const project = readyProject();
    const promise = enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    await vi.advanceTimersByTimeAsync(121_000);
    const result = await promise;

    expect(result.status).toBe("failed");
    expect(result.failureCode).toBe("timeout");
    vi.useRealTimers();
  });

  it("passes server repository bundle with llm provider when flag enabled", async () => {
    vi.stubEnv("BRAIN_USE_OPENAI", "true");
    episodeControllerMock.mockResolvedValue({
      ...episodeSuccess("llm"),
      strategyCapabilityRun: {
        ...brainSuccess("llm"),
        run: { status: "completed", usage: { providerId: "llm", inputTokens: 10, outputTokens: 5 } },
      },
    });

    const project = readyProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project, "nl"));

    expect(episodeControllerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repositories: expect.objectContaining({
          providers: expect.arrayContaining([
            expect.objectContaining({ id: "llm" }),
          ]),
        }),
        target: { targetBrain: "strategy" },
      })
    );
    expect(result.provider).toBe("llm");
    expect(result.fallbackUsed).toBe(false);
    expect(result.inputTokens).toBe(10);
    vi.unstubAllEnvs();
  });
});
