import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { BrainRunResult } from "@/lib/brain/runtime/run-result";
import {
  enqueueLiveStrategyRunServer,
  resetLiveStrategyRunServerInFlightForTests,
} from "@/lib/office/campaign/live-strategy-run-execution";

const PEER = "emma";
const ORG = "org-px5024";

const episodeControllerMock = vi.hoisted(() => vi.fn());
const continuationMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/brain/project-runtime/campaign-episode-controller", () => ({
  startOrResumeCampaignEpisode: episodeControllerMock,
}));

vi.mock("@/lib/brain/project-runtime/campaign-episode-continuation", () => ({
  shouldAutoContinueCampaignEpisode: vi.fn(() => true),
  continueCampaignEpisode: continuationMock,
}));

vi.mock("@/lib/brain/project-runtime/automatic-campaign-pipeline", () => ({
  resumeAutomaticCampaignPipeline: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/brain/project-runtime/campaign-episode-server-context", () => ({
  buildCampaignEpisodeServerExecutionContext: vi.fn().mockResolvedValue({
    repositories: {},
    contextAssembly: { state: "complete", gaps: [] },
    locale: "en",
  }),
}));

vi.mock("@/lib/brain/persistence/server/prepare-brain-server-persistence", () => ({
  prepareBrainServerPersistence: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/brain/persistence/repository-factory-server", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/brain/persistence/repository-factory-server")
  >();
  return actual;
});

vi.mock("@/lib/office/campaign/resolve-organization-name-server", () => ({
  resolveDurableOrganizationNameServer: vi.fn().mockResolvedValue("Peergent"),
}));

function automaticProject(): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "Continuation wiring",
    goalLabel: "Leads",
    description: "Verify strategy success triggers episode continuation.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
  });
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

function episodeAtPlanning(): Awaited<ReturnType<typeof episodeControllerMock>> {
  const brainResult: BrainRunResult = {
    run: {
      runId: "run-1",
      status: "completed",
      usage: { providerId: "deterministic", modelId: "test", inputTokens: 1, outputTokens: 1 },
    },
    output: emptyBrainStructuredOutput(),
    assembly: { state: "complete", gaps: [] },
  };
  return {
    status: "running",
    orchestrationAuthority: "project_engine",
    episodeResumed: false,
    strategyCapabilityRun: brainResult,
    episode: {
      episodeStatus: "running",
      snapshot: {
        episodeId: "ep-1",
        organizationId: ORG,
        projectId: "proj-x",
        state: "planning",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence", "strategy"],
        pendingBrains: ["planning", "creative", "validation", "execution", "memory", "learning"],
      },
      pendingBrains: ["planning"],
    },
    missingContext: [],
  };
}

describe("PX-50.24 live strategy run continuation wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLiveStrategyRunServerInFlightForTests();
    episodeControllerMock.mockResolvedValue(episodeAtPlanning());
    continuationMock.mockResolvedValue({
      status: "waiting_for_approval",
      orchestrationAuthority: "project_engine",
      episodeResumed: true,
    });
  });

  it("invokes continueCampaignEpisode after successful strategy target run", async () => {
    const project = automaticProject();
    const result = await enqueueLiveStrategyRunServer(serverInput(project));

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(episodeControllerMock).toHaveBeenCalledWith(
      expect.objectContaining({ target: { targetBrain: "strategy" } })
    );
    expect(continuationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: "strategy_target_complete",
        organizationId: ORG,
        projectId: project.id,
      })
    );
  });
});
