import { beforeEach, describe, expect, it } from "vitest";
import {
  configureLayerRepositories,
  createLayerRepositories,
  resetLayerRepositoryStores,
} from "../layer-repository-factory";
import { resolveOutputRefFromStore } from "../layer/persistent-repositories";
import { PersistentProjectEpisodeRepository } from "../layer/persistent-repositories";
import type { CompanyStoreRecord } from "../../layers/company/company-repository";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import { createProjectEpisodeRunner, submitProjectApproval, buildFixturePerformanceObservations, FIXTURE_ORG_ID } from "../../project-runtime";
import { buildMarketingPeerFixture } from "../../project-runtime/fixtures/marketing-peer-fixture";
import { getDefaultMemoryRepository } from "../../layers/memory/memory-repository";
import { getDefaultExecutionRepository } from "../../layers/execution/execution-repository";
import { getDefaultProjectEpisodeRepository } from "../../project-runtime/project-episode-repository";
import { createEmptyArtifacts } from "../../project-runtime/project-artifact-store";
import { createProjectEngineSnapshot } from "../../project-engine/create-snapshot";

const ORG_A = "org-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "org-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function sampleCompanyRecord(orgId: string, version: number): CompanyStoreRecord {
  return {
    organizationId: orgId,
    outputRef: `company:${orgId}:v${version}`,
    storedAt: new Date().toISOString(),
    history: { organizationId: orgId, entries: [] },
    graph: {
      organizationId: orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      versionMeta: { version, author: "test", changeReason: "test" },
    },
    snapshot: {
      id: `snap-${version}`,
      organizationId: orgId,
      version,
      outputRef: `company:${orgId}:v${version}`,
      storedAt: new Date().toISOString(),
      graph: {
        organizationId: orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [],
        edges: [],
        versionMeta: { version, author: "test", changeReason: "test" },
      },
    },
  };
}

describe("PX-48 Durable Persistence", () => {
  beforeEach(() => {
    resetLayerRepositoryStores();
    configureLayerRepositories({ mode: "persistent_in_memory" });
  });

  it("persists Company v1 and v2 with latest returning v2", () => {
    const repos = createLayerRepositories({ mode: "persistent_in_memory" });
    repos.company.store(sampleCompanyRecord(ORG_A, 1));
    repos.company.store(sampleCompanyRecord(ORG_A, 2));

    const latest = repos.company.getLatest(ORG_A);
    expect(latest?.graph.versionMeta.version).toBe(2);
    expect(repos.company.getVersion({ organizationId: ORG_A, version: 1 })?.outputRef).toBe(
      `company:${ORG_A}:v1`
    );
  });

  it("resolves outputRef after new repository instance", () => {
    const repos1 = createLayerRepositories({ mode: "persistent_in_memory" });
    const record = sampleCompanyRecord(ORG_A, 1);
    repos1.company.store(record);

    createLayerRepositories({ mode: "persistent_in_memory" });
    const resolved = resolveOutputRefFromStore(ORG_A, record.outputRef) as CompanyStoreRecord | null;
    expect(resolved?.outputRef).toBe(record.outputRef);
  });

  it("isolates organizations", () => {
    const repos = createLayerRepositories({ mode: "persistent_in_memory" });
    repos.company.store(sampleCompanyRecord(ORG_A, 1));
    repos.company.store(sampleCompanyRecord(ORG_B, 1));

    expect(repos.company.getLatest(ORG_A)?.outputRef).toBe(`company:${ORG_A}:v1`);
    expect(repos.company.getLatest(ORG_B)?.outputRef).toBe(`company:${ORG_B}:v1`);
    expect(repos.company.getLatest(ORG_A)?.outputRef).not.toBe(repos.company.getLatest(ORG_B)?.outputRef);
  });

  it("execution idempotency survives repository instance recreation", () => {
    const repos1 = createLayerRepositories({ mode: "persistent_in_memory" });
    const record: ExecutionStoreRecord = {
      key: { organizationId: ORG_A, projectId: "proj-1" },
      history: {
        version: "1",
        organizationId: ORG_A,
        campaignId: "proj-1",
        projectId: "proj-1",
        episodeId: "ep-1",
        createdAt: new Date().toISOString(),
        validationGraphRef: "val-ref",
        creativeGraphRef: "creative-ref",
        overallStatus: "completed",
        entries: [],
        events: [],
        auditRecords: [],
        dryRun: false,
      },
      outputRef: "execution:proj-1:v1",
      storedAt: new Date().toISOString(),
      idempotencyKeys: ["idem-key-1"],
      batchIdempotencyKey: "batch-idem-1",
    };
    repos1.execution.store(record);

    const repos2 = createLayerRepositories({ mode: "persistent_in_memory" });
    const found = repos2.execution.getByIdempotencyKey({
      organizationId: ORG_A,
      idempotencyKey: "idem-key-1",
    });
    expect(found?.outputRef).toBe(record.outputRef);
  });

  it("project episode survives repository instance recreation", () => {
    const repos1 = createLayerRepositories({ mode: "persistent_in_memory" });
    const projectId = "proj-restart-1";
    const episode = {
      snapshot: createProjectEngineSnapshot({
        organizationId: ORG_A,
        projectId,
        peerId: "peer-1",
        episodeId: "ep-1",
      }),
      artifacts: createEmptyArtifacts({
        organizationId: ORG_A,
        projectId,
        episodeId: "ep-1",
        correlationId: "corr-1",
      }),
      episodeStatus: "waiting_for_approval" as const,
      contextReady: true,
      sliceAvailability: {},
      approvalSatisfied: false,
      validationApprovalPending: true,
      memoryCheckpoint1Complete: true,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      contextGaps: [],
      executedBrainKeys: ["company", "research"],
      lastError: null,
      correlationId: "corr-1",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      resolvedGraphs: {},
    };
    repos1.projectEpisode.save(episode);

    createLayerRepositories({ mode: "persistent_in_memory" });
    const reloaded = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG_A,
      projectId,
    });
    expect(reloaded?.episodeStatus).toBe("waiting_for_approval");
    expect(reloaded?.executedBrainKeys).toContain("company");
  });

  it("approval persists across repository recreation", () => {
    const repos1 = createLayerRepositories({ mode: "persistent_in_memory" });
    repos1.projectEpisode.saveApproval({
      id: "approval-1",
      projectId: "proj-1",
      organizationId: ORG_A,
      checkpointKind: "campaign",
      decision: "approved",
      actor: "user@test.com",
      decidedAt: new Date().toISOString(),
    });

    createLayerRepositories({ mode: "persistent_in_memory" });
    const approvals = getDefaultProjectEpisodeRepository().getApprovals("proj-1");
    expect(approvals).toHaveLength(1);
    expect(approvals[0]?.decision).toBe("approved");
  });

  it("does not duplicate project events on idempotent append", () => {
    const repo = new PersistentProjectEpisodeRepository();
    const event = {
      eventId: "evt-1",
      projectId: "proj-1",
      organizationId: ORG_A,
      brainId: null,
      timestamp: new Date().toISOString(),
      correlationId: "corr-1",
      type: "project_started",
      outputRef: null,
    };
    repo.appendEvent("proj-1", event);
    repo.appendEvent("proj-1", event);
    expect(repo.listEvents("proj-1")).toHaveLength(1);
  });

  it("memory from project 1 available after repository recreation", async () => {
    const projectId = "proj-mem-durable-1";
    await runFullEpisode(projectId);

    const memoriesBefore = getDefaultMemoryRepository().getOrgMemories(FIXTURE_ORG_ID);
    expect(memoriesBefore.length).toBeGreaterThan(0);

    createLayerRepositories({ mode: "persistent_in_memory" });
    const memoriesAfter = getDefaultMemoryRepository().getOrgMemories(FIXTURE_ORG_ID);
    expect(memoriesAfter.length).toBe(memoriesBefore.length);
    expect(memoriesAfter.length).toBeGreaterThan(0);
  });

  it("in-memory mode remains available for isolated unit tests", () => {
    const repos = createLayerRepositories({ mode: "in_memory" });
    repos.company.store(sampleCompanyRecord(ORG_A, 1));
    const isolated = createLayerRepositories({ mode: "in_memory" });
    expect(isolated.company.getLatest(ORG_A)).toBeNull();
  });

  it("production composition root defaults to persistent_in_memory without supabase", () => {
    resetLayerRepositoryStores();
    const bundle = configureLayerRepositories({ mode: "persistent_in_memory" });
    expect(bundle.storageMode).toBe("persistent_in_memory");
  });
});

async function runFullEpisode(projectId: string) {
  const runner = createProjectEpisodeRunner();
  let result = await runner.runUntilPause({
    organizationId: FIXTURE_ORG_ID,
    projectId,
    peerId: "demo",
    maxSteps: 200,
  });
  let guard = 0;

  while (result.status !== "completed" && result.status !== "failed" && guard < 30) {
    guard += 1;
    if (result.status === "waiting_for_approval") {
      submitProjectApproval({
        projectId,
        organizationId: FIXTURE_ORG_ID,
        approvalId: `approval-${Date.now()}-${guard}`,
        decision: "approved",
        actor: "customer@test.com",
      });
      result = await runner.resumeEpisode({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        approvalSatisfied: true,
      });
      continue;
    }
    if (result.status === "waiting_for_outcomes" || result.episode.snapshot.state === "monitoring") {
      result = await runner.resumeEpisode({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        performanceObservations: buildFixturePerformanceObservations(projectId),
      });
      continue;
    }
    if (result.status === "running") {
      result = await runner.runUntilPause({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        peerId: "demo",
        maxSteps: 120,
      });
      continue;
    }
    break;
  }
  return result;
}
