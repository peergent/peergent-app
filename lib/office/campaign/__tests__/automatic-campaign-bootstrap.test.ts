import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  resetAutomaticCampaignBootstrapInFlightForTests,
} from "@/lib/office/campaign/automatic-campaign-bootstrap-inflight";
import {
  startAutomaticCampaignAction,
} from "@/lib/office/campaign/start-automatic-campaign-action";
import {
  enqueueLiveStrategyRunServer,
  resetLiveStrategyRunServerInFlightForTests,
} from "@/lib/office/campaign/live-strategy-run-execution";
import {
  shouldEnqueueLiveStrategyRun,
  usesProjectEngineLifecycleAuthority,
} from "@/lib/office/campaign/live-strategy-run-service";
import {
  isAutomaticCampaignSetup,
  shouldBootstrapAutomaticEpisode,
} from "@/lib/office/campaign/automatic-campaign-lifecycle";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { emitOrchestrationDiagnostic } from "@/lib/brain/project-runtime/orchestration-diagnostics";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { BrainRunResult } from "@/lib/brain/runtime/run-result";

const PEER = "emma";
const ORG = "org-px501";

const episodeControllerMock = vi.hoisted(() => vi.fn());
const requireAuthMock = vi.hoisted(() => vi.fn());
const fetchPeerMock = vi.hoisted(() => vi.fn());
const preparePersistenceMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/brain/project-runtime/campaign-episode-controller", () => ({
  startOrResumeCampaignEpisode: episodeControllerMock,
}));

vi.mock("@/lib/brain/project-runtime/automatic-campaign-pipeline", () => ({
  resumeAutomaticCampaignPipeline: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/intelligence/api/require-org-context", () => ({
  OrgContextError: class OrgContextError extends Error {
    code = "unauthorized";
  },
  requireAuthenticatedOrgContext: requireAuthMock,
}));

vi.mock("@/lib/peers/server-queries", () => ({
  fetchOrganizationPeerByIdServer: fetchPeerMock,
}));

vi.mock("@/lib/brain/persistence/server/prepare-brain-server-persistence", () => ({
  prepareBrainServerPersistence: preparePersistenceMock,
}));

vi.mock("@/lib/brain/persistence/repository-factory-server", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/brain/persistence/repository-factory-server")
  >();
  return actual;
});

function automaticWizardInput() {
  return {
    peerId: PEER,
    ownerLabel: "Emma",
    name: "Summer Launch",
    goalLabel: "Generate leads",
    description: "Drive demo requests for our EV charging platform.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
    selectedChannels: ["linkedin" as const],
  };
}

function automaticProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    ...createMarketingCampaignProject(automaticWizardInput()),
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    organizationId: ORG,
    userName: "",
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

function episodeSuccess(provider = "deterministic"): Awaited<ReturnType<typeof episodeControllerMock>> {
  const brainResult: BrainRunResult = {
    run: {
      runId: "run-1",
      status: "completed",
      usage: { providerId: provider, modelId: "test", inputTokens: 1, outputTokens: 1 },
    },
    output: emptyBrainStructuredOutput(),
    assembly: { state: "complete", gaps: [] },
  };
  return {
    status: "completed",
    orchestrationAuthority: "project_engine",
    episodeResumed: false,
    strategyCapabilityRun: brainResult,
    episode: {
      snapshot: { episodeId: "ep-1", organizationId: ORG, projectId: "proj-x", state: "planning" },
    },
    missingContext: [],
  };
}

function serverInput(project: MarketingProject) {
  return {
    peerId: PEER,
    projectId: project.id,
    project,
    understanding: null,
    organizationId: ORG,
    supabase: {} as never,
    peerRole: "Marketing",
    locale: "en",
  };
}

describe("PX-50.1 Automatic Campaign Bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLiveStrategyRunServerInFlightForTests();
    resetAutomaticCampaignBootstrapInFlightForTests();
    requireAuthMock.mockResolvedValue({
      organizationId: ORG,
      supabase: {},
    });
    fetchPeerMock.mockResolvedValue({ id: PEER, role: "Marketing" });
    preparePersistenceMock.mockResolvedValue({});
    episodeControllerMock.mockResolvedValue(episodeSuccess());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("A — automatic campaign creation enters canonical ProjectEpisode lifecycle", async () => {
    const result = await startAutomaticCampaignAction(automaticWizardInput());

    expect(result.ok).toBe(true);
    expect(result.project).toBeTruthy();
    expect(preparePersistenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        projectId: result.project!.id,
      })
    );
    expect(episodeControllerMock).toHaveBeenCalled();
    expect(episodeControllerMock.mock.calls[0]?.[0]).toMatchObject({
      organizationId: ORG,
      peerId: PEER,
      target: { targetBrain: "strategy" },
    });
  });

  it("B — manual campaign creation does NOT auto-start episode execution", () => {
    const manual = createMarketingCampaignProject({
      ...automaticWizardInput(),
      setupMode: "manual",
    });
    expect(isAutomaticCampaignSetup(manual)).toBe(false);
    expect(shouldEnqueueLiveStrategyRun(manual, domainInput(manual), "en")).toBe(false);
    expect(shouldBootstrapAutomaticEpisode(manual)).toBe(false);
  });

  it("C — automatic campaign with sufficient acquired context reaches Strategy Brain", async () => {
    episodeControllerMock.mockResolvedValue(episodeSuccess("llm"));

    const project = automaticProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project));

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(episodeControllerMock).toHaveBeenCalled();
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeTruthy();
  });

  it("D — automatic campaign with missing blocking context pauses before Strategy Brain", async () => {
    episodeControllerMock.mockResolvedValue({
      status: "waiting_for_context",
      orchestrationAuthority: "project_engine",
      episodeResumed: false,
      strategyCapabilityRun: null,
      episode: {
        snapshot: { episodeId: "ep-wait", organizationId: ORG, projectId: "p", state: "collecting_context" },
      },
      missingContext: [
        {
          kind: "business",
          requiredBy: "project_engine",
          reason: "Target audience is required for relevant campaigns.",
          blocking: true,
          resolutionType: "customer_input",
        },
      ],
      blockingContextGaps: [
        {
          kind: "business",
          requiredBy: "project_engine",
          reason: "Target audience is required for relevant campaigns.",
          blocking: true,
          resolutionType: "customer_input",
        },
      ],
    });

    const project = automaticProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project));

    expect(result.ok).toBe(false);
    expect(result.status).toBe("waiting_for_input");
    expect(result.project?.campaignSetup?.strategyRun?.status).toBe("waiting_for_input");
    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeFalsy();
  });

  it("E — repeated automatic-start request resumes same durable episode (single orchestration)", async () => {
    episodeControllerMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(episodeSuccess()), 20))
    );

    const project = automaticProject({ id: "proj-idempotent-automatic" });
    const input = serverInput(project);
    const [first, second] = await Promise.all([
      enqueueLiveStrategyRunServer(input),
      enqueueLiveStrategyRunServer(input),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(episodeControllerMock).toHaveBeenCalledTimes(1);
  });

  it("F — cross-org project/episode access fails closed", async () => {
    fetchPeerMock.mockResolvedValue(null);

    const result = await startAutomaticCampaignAction(automaticWizardInput());

    expect(result.ok).toBe(false);
    expect(result.failureCode).toBe("peer_not_found");
    expect(episodeControllerMock).not.toHaveBeenCalled();
  });

  it("G — shouldEnqueueLiveStrategyRun is not lifecycle authority for automatic bootstrap", () => {
    const project = automaticProject({
      campaignSetup: {
        ...automaticProject().campaignSetup!,
        campaignBrandContext: undefined,
        targetAudience: undefined,
        websiteUrl: undefined,
        campaignCompetitors: undefined,
      },
    });

    expect(usesProjectEngineLifecycleAuthority(project)).toBe(true);
    expect(shouldEnqueueLiveStrategyRun(project, domainInput(project), "en")).toBe(true);
    expect(shouldBootstrapAutomaticEpisode(project)).toBe(true);
  });

  it("H — automatic bootstrap does not require frontend website/competitor decisions", async () => {
    const project = automaticProject({
      campaignSetup: {
        ...automaticProject().campaignSetup!,
        websiteUrl: undefined,
        campaignCompetitors: undefined,
      },
    });

    const result = await enqueueLiveStrategyRunServer(serverInput(project));
    expect(episodeControllerMock).toHaveBeenCalled();
    expect(result.status).not.toBe("waiting_for_input");
  });

  it("I — no strategy executes when blocking context remains", async () => {
    episodeControllerMock.mockResolvedValue({
      status: "waiting_for_context",
      orchestrationAuthority: "project_engine",
      episodeResumed: false,
      strategyCapabilityRun: null,
      episode: { snapshot: { episodeId: "ep-block" } },
      missingContext: [],
      blockingContextGaps: [
        {
          kind: "business",
          requiredBy: "project_engine",
          reason: "blocking",
          blocking: true,
          resolutionType: "customer_input",
        },
      ],
    });

    const project = automaticProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project));

    expect(result.project?.campaignSetup?.strategyGeneratedAt).toBeFalsy();
    expect(result.status).toBe("waiting_for_input");
  });

  it("J — diagnostics contain orchestration metadata but no raw customer context", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    emitOrchestrationDiagnostic({
      event: "automatic_campaign_started",
      organizationId: ORG,
      projectId: "proj-diag",
      peerId: PEER,
    });
    const line = String(infoSpy.mock.calls[0]?.[0]);
    expect(line).toContain("automatic_campaign_started");
    expect(line).not.toMatch(/Drive demo requests|charging platform/i);
  });
});
