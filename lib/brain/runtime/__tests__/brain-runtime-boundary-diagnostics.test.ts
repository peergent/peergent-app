import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  createBrainRuntime,
  createDemoBrainProvider,
} from "@/lib/brain";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import { createDeterministicBrainProvider } from "@/lib/brain/providers/deterministic-provider";
import {
  createPersistentInMemoryRepositories,
  resetPersistentBrainStores,
} from "@/lib/brain/persistence/in-memory-persistent-repositories";
import { isUuidRunId } from "@/lib/brain/runtime/brain-runtime-diagnostics";
import { createProductionBrainExecutionAdapter } from "@/lib/brain/project-runtime/production-brain-adapter";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { AsyncBrainRepositories } from "@/lib/brain/persistence/contracts";

const ORG = "00000000-0000-4000-8000-000000000001";

function demoAssembly(orgId: string) {
  const profile = buildPeergentCompanyProfile("en");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: orgId,
    url: "https://example.com",
  });
  return assembleCompanyContextSync({
    organizationId: orgId,
    companyProfile: { ...profile, organizationId: orgId },
    websiteSnapshot: website,
  });
}

function parseRuntimeDiagnostics(
  infoSpy: ReturnType<typeof vi.spyOn>,
  errorSpy: ReturnType<typeof vi.spyOn>
) {
  return [...infoSpy.mock.calls, ...errorSpy.mock.calls]
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes('"domain":"brain_runtime"'))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function createRuntimeWithAsync(asyncRepositories: AsyncBrainRepositories) {
  return createBrainRuntime({
    runRepository: new InMemoryBrainRunRepository(),
    outputRepository: new InMemoryBrainOutputRepository(),
    auditRepository: new InMemoryBrainAuditRepository(),
    idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
    asyncRepositories,
    storageMode: "supabase",
    cache: new InMemoryBrainCacheStore(),
    providers: [createDeterministicBrainProvider(), createDemoBrainProvider()],
    assembleContext: (request) => demoAssembly(request.organizationId),
  });
}

function buildAdapterFixtures(projectId: string) {
  const project = createMarketingCampaignProject({
    peerId: "peer-live",
    ownerLabel: "Live",
    name: "Runtime diag",
    goalLabel: "Leads",
    description: "Test campaign",
    primaryGoalId: "generate_leads",
    targetAudience: "SMB",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    projectId,
  });
  const domainInput = {
    peerId: "peer-live" as const,
    organizationId: ORG,
    userName: "Test",
    peerName: "Live",
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
  return { project, domainInput };
}

describe("PX-50.3 BrainRuntime boundary diagnostics", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
    resetPersistentBrainStores();
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("executeRun entry diagnostic fires", async () => {
    const runtime = createRuntimeWithAsync(createPersistentInMemoryRepositories());

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-marketing",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-runtime-entry",
      correlationId: "corr-runtime-entry",
      runtimeDiagnosticBrainId: "company",
      runtimeDiagnosticEpisodeId: "ep-runtime-entry",
    });

    const events = parseRuntimeDiagnostics(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("brain_runtime_execute_started");
    expect(events.indexOf("brain_runtime_execute_started")).toBeLessThan(
      events.indexOf("brain_runtime_completed")
    );
  });

  it("idempotency lookup diagnostics fire when idempotencyKey is set", async () => {
    const baseRepos = createPersistentInMemoryRepositories();
    const getSpy = vi.spyOn(baseRepos.idempotency, "get");
    const runtime = createRuntimeWithAsync(baseRepos);

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-marketing",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-idempotency",
      idempotencyKey: "idem-runtime-test",
      correlationId: "corr-idempotency",
    });

    expect(getSpy).toHaveBeenCalled();
    const events = parseRuntimeDiagnostics(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("brain_runtime_idempotency_lookup_started");
    expect(events).toContain("brain_runtime_idempotency_lookup_completed");
    expect(events.indexOf("brain_runtime_idempotency_lookup_started")).toBeLessThan(
      events.indexOf("brain_runtime_idempotency_lookup_completed")
    );
  });

  it("runs.create started fires and logs non-UUID runId for current generator", async () => {
    const baseRepos = createPersistentInMemoryRepositories();
    const createSpy = vi.spyOn(baseRepos.runs, "create");
    const runtime = createRuntimeWithAsync(baseRepos);

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-marketing",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-run-create",
    });

    expect(createSpy).toHaveBeenCalled();
    const started = parseRuntimeDiagnostics(infoSpy, errorSpy).find(
      (line) => line.event === "brain_runtime_run_create_started"
    );
    expect(started).toBeDefined();
    expect(typeof started?.runId).toBe("string");
    expect(started?.runIdIsUuid).toBe(false);
    expect(isUuidRunId(String(started?.runId))).toBe(false);
  });

  it("runs.create rejection emits failed and rethrows", async () => {
    const failingRepos = createPersistentInMemoryRepositories();
    vi.spyOn(failingRepos.runs, "create").mockRejectedValue(
      new Error("invalid input syntax for type uuid")
    );
    const runtime = createRuntimeWithAsync(failingRepos);

    await expect(
      runtime.executeRun({
        organizationId: ORG,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
        campaignId: "proj-run-create-fail",
      })
    ).rejects.toThrow("invalid input syntax for type uuid");

    const failed = parseRuntimeDiagnostics(infoSpy, errorSpy).find(
      (line) => line.event === "brain_runtime_run_create_failed"
    );
    expect(failed).toBeDefined();
    expect(failed?.capabilityId).toBe("company_understanding");
    expect(String(failed?.reason)).toContain("invalid input syntax");
    expect(
      parseRuntimeDiagnostics(infoSpy, errorSpy).some((line) => line.event === "brain_runtime_run_create_completed")
    ).toBe(false);
  });

  it("successful runs.create emits completed", async () => {
    const runtime = createRuntimeWithAsync(createPersistentInMemoryRepositories());

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-marketing",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-run-create-ok",
    });

    const events = parseRuntimeDiagnostics(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("brain_runtime_run_create_started");
    expect(events).toContain("brain_runtime_run_create_completed");
    expect(events.indexOf("brain_runtime_run_create_started")).toBeLessThan(
      events.indexOf("brain_runtime_run_create_completed")
    );
  });

  it("does not log customer content in runtime diagnostics", async () => {
    const runtime = createRuntimeWithAsync(createPersistentInMemoryRepositories());

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-marketing",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-no-customer",
      campaignContext: {
        projectId: "proj-no-customer",
        goals: ["SECRET_GOAL"],
        description: "SECRET_DESCRIPTION",
      } as never,
    });

    const serialized = [...infoSpy.mock.calls, ...errorSpy.mock.calls]
      .map((call) => String(call[0]))
      .join("\n");
    expect(serialized).not.toContain("SECRET_GOAL");
    expect(serialized).not.toContain("SECRET_DESCRIPTION");
    expect(serialized).not.toContain('"findings"');
    expect(serialized).not.toContain('"episode":');
  });

  it("production adapter emits execution boundary diagnostics through executeBrainForProjectBrain", async () => {
    const { project, domainInput } = buildAdapterFixtures("proj-adapter-diag");
    const snapshot = createProjectEngineSnapshot({
      projectId: project.id,
      peerId: "peer-live",
      organizationId: ORG,
    });
    const episode = {
      snapshot,
      artifacts: createEmptyArtifacts({
        organizationId: ORG,
        projectId: project.id,
        episodeId: snapshot.episodeId,
        correlationId: "corr-adapter",
      }),
      episodeStatus: "running" as const,
      contextReady: true,
      sliceAvailability: { business: true, campaign: true },
      approvalSatisfied: false,
      validationApprovalPending: false,
      memoryCheckpoint1Complete: false,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      contextGaps: [],
      executedBrainKeys: [],
      lastError: null,
      correlationId: "corr-adapter",
      startedAt: snapshot.startedAt,
      updatedAt: snapshot.updatedAt,
      completedAt: null,
      resolvedGraphs: {},
    };

    const asyncRepos = createPersistentInMemoryRepositories();
    vi.spyOn(asyncRepos.runs, "create").mockRejectedValue(new Error("runs.create_blocked"));

    const adapter = createProductionBrainExecutionAdapter({
      peerId: "peer-live",
      project,
      domainInput,
      workflowOptions: {
        contextAssembly: demoAssembly(ORG),
        requireRealContext: true,
        repositories: {
          storageMode: "supabase",
          sync: {
            runs: new InMemoryBrainRunRepository(),
            outputs: new InMemoryBrainOutputRepository(),
            audit: new InMemoryBrainAuditRepository(),
            idempotency: new InMemoryBrainIdempotencyRepository(),
          },
          async: asyncRepos,
          cache: new InMemoryBrainCacheStore(),
          providers: [createDeterministicBrainProvider()],
        },
      },
    });

    await expect(
      adapter.execute({
        brainId: "company",
        episode,
        contextHandoff: {
          companySnapshot: demoAssembly(ORG).companySnapshot,
          brandGraph: null,
          campaignContext: { projectId: project.id, goals: ["Leads"], description: "Test" } as never,
          priorMemories: [],
        },
        locale: "en",
        idempotencyKey: "corr-adapter:company:collecting_context",
      })
    ).rejects.toThrow("runs.create_blocked");

    const events = parseRuntimeDiagnostics(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("brain_execution_adapter_started");
    expect(events).toContain("brain_execution_execute_project_brain_started");
    expect(events).toContain("brain_execution_execute_project_brain_failed");
    expect(events).toContain("brain_runtime_execute_started");
    expect(events).toContain("brain_runtime_run_create_failed");
    expect(events).not.toContain("brain_execution_execute_project_brain_completed");
    expect(events).not.toContain("brain_runtime_completed");
  });

  it("orchestration brain_completed does not fire when runtime run create fails", async () => {
    const { project, domainInput } = buildAdapterFixtures("proj-no-brain-completed");
    const snapshot = createProjectEngineSnapshot({
      projectId: project.id,
      peerId: "peer-live",
      organizationId: ORG,
    });
    const episode = {
      snapshot: { ...snapshot, state: "collecting_context" as const },
      artifacts: createEmptyArtifacts({
        organizationId: ORG,
        projectId: project.id,
        episodeId: snapshot.episodeId,
        correlationId: "corr-no-complete",
      }),
      episodeStatus: "running" as const,
      contextReady: true,
      sliceAvailability: { business: true, campaign: true, brand: true, website: true },
      approvalSatisfied: false,
      validationApprovalPending: false,
      memoryCheckpoint1Complete: false,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      contextGaps: [],
      executedBrainKeys: [],
      lastError: null,
      correlationId: "corr-no-complete",
      startedAt: snapshot.startedAt,
      updatedAt: snapshot.updatedAt,
      completedAt: null,
      resolvedGraphs: {},
    };

    const asyncRepos = createPersistentInMemoryRepositories();
    vi.spyOn(asyncRepos.runs, "create").mockImplementation(async () => {
      throw new Error("runs.create_blocked");
    });

    const adapter = createProductionBrainExecutionAdapter({
      peerId: "peer-live",
      project,
      domainInput,
      workflowOptions: {
        contextAssembly: demoAssembly(ORG),
        requireRealContext: true,
        repositories: {
          storageMode: "supabase",
          sync: {
            runs: new InMemoryBrainRunRepository(),
            outputs: new InMemoryBrainOutputRepository(),
            audit: new InMemoryBrainAuditRepository(),
            idempotency: new InMemoryBrainIdempotencyRepository(),
          },
          async: asyncRepos,
          cache: new InMemoryBrainCacheStore(),
          providers: [createDeterministicBrainProvider()],
        },
      },
    });

    await expect(
      adapter.execute({
        brainId: "company",
        episode,
        contextHandoff: {
          companySnapshot: demoAssembly(ORG).companySnapshot,
          brandGraph: null,
          campaignContext: {
            projectId: project.id,
            goals: ["Leads"],
            description: "Test",
          } as never,
          priorMemories: [],
        },
        locale: "en",
        idempotencyKey: "corr-no-complete:company:collecting_context",
      })
    ).rejects.toThrow("runs.create_blocked");

    const orchEvents = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => String((JSON.parse(line) as { event: string }).event));

    expect(orchEvents).not.toContain("brain_completed");
  });
});
