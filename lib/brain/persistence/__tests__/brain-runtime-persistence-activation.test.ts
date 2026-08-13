import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { BRAIN_RUNTIME_PERSISTENCE_TABLES } from "@/lib/brain/persistence/supabase/brain-runtime-persistence-tables";
import { SupabaseBrainIdempotencyRepository } from "@/lib/brain/persistence/supabase/supabase-idempotency-repository";
import { SupabaseBrainRunRepository } from "@/lib/brain/persistence/supabase/supabase-run-repository";
import { SupabaseBrainOutputRepository } from "@/lib/brain/persistence/supabase/supabase-output-repository";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { buildRunAuditRecord } from "@/lib/brain/runtime/audit-builder";
import { isUuidRunId } from "@/lib/brain/runtime/brain-runtime-diagnostics";
import type { BrainRunRecord } from "@/lib/brain/runtime/repositories/contracts";
import { createBrainRuntime } from "@/lib/brain";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import { createDeterministicBrainProvider } from "@/lib/brain/providers/deterministic-provider";
import { assembleCompanyContextSync, buildPeergentCompanyProfile, buildDemoWebsiteSnapshotSync } from "@/lib/brain";
import { createPersistentInMemoryRepositories } from "@/lib/brain/persistence/in-memory-persistent-repositories";

const ORG = "00000000-0000-4000-8000-000000000001";
const RUN_ID = "00000000-0000-4000-8000-0000000000a1";

function mockFromChain(result: { data: unknown; error: unknown }) {
  const terminal = {
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  const eq: ReturnType<typeof vi.fn> = vi.fn();
  eq.mockImplementation(() => ({ eq, ...terminal }));
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, upsert: vi.fn().mockResolvedValue({ error: null }), ...terminal };
}

function buildRun(): BrainRunRecord {
  const now = new Date().toISOString();
  return {
    id: RUN_ID,
    traceId: "trace-1",
    childRunIds: [],
    organizationId: ORG,
    peerId: "peer-live",
    campaignId: "proj-runtime",
    environment: "live",
    capabilityId: "company_understanding",
    status: "queued",
    usage: {},
    budget: {},
    startedAt: now,
    updatedAt: now,
    version: 1,
  };
}

describe("PX-50.6 BrainRuntime persistence activation", () => {
  beforeEach(() => {
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("A: idempotency repository queries brain_idempotency_keys", async () => {
    const chain = mockFromChain({ data: null, error: null });
    const from = vi.fn().mockReturnValue(chain);
    const supabase = { from } as unknown as AppSupabaseClient;
    const repo = new SupabaseBrainIdempotencyRepository(supabase);

    await repo.get(ORG, "company_understanding", "idem-key-1");

    expect(from).toHaveBeenCalledWith(BRAIN_RUNTIME_PERSISTENCE_TABLES.idempotency);
    expect(chain.select).toHaveBeenCalledWith("*");
  });

  it("B: idempotency row maps to runtime contract fields", async () => {
    const chain = mockFromChain({
      data: {
        organization_id: ORG,
        capability_id: "company_understanding",
        idempotency_key: "idem-key-1",
        run_id: RUN_ID,
        request_hash: "hash-1",
        expires_at: null,
        created_at: "2026-08-13T00:00:00.000Z",
      },
      error: null,
    });
    const from = vi.fn().mockReturnValue(chain);
    const supabase = { from } as unknown as AppSupabaseClient;
    const repo = new SupabaseBrainIdempotencyRepository(supabase);

    const record = await repo.get(ORG, "company_understanding", "idem-key-1");
    expect(record).toEqual({
      organizationId: ORG,
      capabilityId: "company_understanding",
      idempotencyKey: "idem-key-1",
      runId: RUN_ID,
      requestHash: "hash-1",
      createdAt: "2026-08-13T00:00:00.000Z",
    });
  });

  it("C: existing idempotency key returns stored record", async () => {
    const chain = mockFromChain({
      data: {
        organization_id: ORG,
        capability_id: "company_understanding",
        idempotency_key: "idem-existing",
        run_id: RUN_ID,
        request_hash: "hash-existing",
        expires_at: null,
        created_at: "2026-08-13T00:00:00.000Z",
      },
      error: null,
    });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new SupabaseBrainIdempotencyRepository({ from } as unknown as AppSupabaseClient);

    const record = await repo.get(ORG, "company_understanding", "idem-existing");
    expect(record?.runId).toBe(RUN_ID);
  });

  it("D: missing idempotency key returns null without throwing", async () => {
    const chain = mockFromChain({ data: null, error: null });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new SupabaseBrainIdempotencyRepository({ from } as unknown as AppSupabaseClient);

    await expect(repo.get(ORG, "company_understanding", "missing-key")).resolves.toBeNull();
  });

  it("E: run repository inserts into brain_runs with uuid id", async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: RUN_ID,
            organization_id: ORG,
            peer_id: "peer-live",
            campaign_id: "proj-runtime",
            environment: "live",
            capability_id: "company_understanding",
            status: "queued",
            trace_id: "trace-1",
            parent_run_id: null,
            policy_decision: null,
            readiness_state: null,
            context_hash: null,
            snapshot_version: null,
            output_id: null,
            error_code: null,
            error_message: null,
            usage: {},
            budget: {},
            version: 1,
            started_at: "2026-08-13T00:00:00.000Z",
            updated_at: "2026-08-13T00:00:00.000Z",
            completed_at: null,
          },
          error: null,
        }),
      }),
    });
    const from = vi.fn().mockReturnValue({ insert });
    const repo = new SupabaseBrainRunRepository({ from } as unknown as AppSupabaseClient);

    const created = await repo.create(buildRun());
    expect(from).toHaveBeenCalledWith("brain_runs");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: RUN_ID, organization_id: ORG }));
    expect(created.id).toBe(RUN_ID);
  });

  it("F: output repository stores into brain_outputs", async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "out-1" }, error: null }),
      }),
    });
    const from = vi.fn().mockReturnValue({ insert });
    const repo = new SupabaseBrainOutputRepository({ from } as unknown as AppSupabaseClient);

    const outputId = await repo.store({
      organizationId: ORG,
      runId: RUN_ID,
      output: emptyBrainStructuredOutput(),
      storedAt: new Date().toISOString(),
      capabilityId: "company_understanding",
      capabilityVersion: "1",
      contentHash: "hash-output",
    });

    expect(from).toHaveBeenCalledWith("brain_outputs");
    expect(outputId).toBe("out-1");
  });

  it("G: idempotency upsert uses org/capability/key conflict target", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const getChain = mockFromChain({ data: null, error: null });
    const from = vi.fn().mockReturnValue({ ...getChain, upsert });
    const repo = new SupabaseBrainIdempotencyRepository({ from } as unknown as AppSupabaseClient);

    await repo.set({
      organizationId: ORG,
      capabilityId: "company_understanding",
      idempotencyKey: "idem-upsert",
      runId: RUN_ID,
      requestHash: "hash-upsert",
      createdAt: new Date().toISOString(),
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG,
        capability_id: "company_understanding",
        idempotency_key: "idem-upsert",
        run_id: RUN_ID,
      }),
      { onConflict: "organization_id,capability_id,idempotency_key" }
    );
  });

  it("H: uses authenticated client from() — no service-role bypass in repositories", () => {
    expect(BRAIN_RUNTIME_PERSISTENCE_TABLES.idempotency).toBe("brain_idempotency_keys");
    expect(BRAIN_RUNTIME_PERSISTENCE_TABLES.runs).toBe("brain_runs");
  });

  it("run ids generated by BrainRuntime are UUIDs for Supabase schema", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const profile = buildPeergentCompanyProfile("en");
    const website = buildDemoWebsiteSnapshotSync({ organizationId: ORG, url: "https://example.com" });
    const assembly = assembleCompanyContextSync({
      organizationId: ORG,
      companyProfile: { ...profile, organizationId: ORG },
      websiteSnapshot: website,
    });

    const asyncRepos = createPersistentInMemoryRepositories();
    const createSpy = vi.spyOn(asyncRepos.runs, "create");

    const runtime = createBrainRuntime({
      runRepository: new InMemoryBrainRunRepository(),
      outputRepository: new InMemoryBrainOutputRepository(),
      auditRepository: new InMemoryBrainAuditRepository(),
      idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
      asyncRepositories: asyncRepos,
      storageMode: "supabase",
      cache: new InMemoryBrainCacheStore(),
      providers: [createDeterministicBrainProvider()],
      assembleContext: () => assembly,
    });

    await runtime.executeRun({
      organizationId: ORG,
      peerId: "peer-live",
      capabilityId: "company_understanding",
      actorId: "test",
      environment: "live",
      campaignId: "proj-uuid-run",
      idempotencyKey: "idem-uuid-test",
    });

    const createdRun = createSpy.mock.calls[0]?.[0] as BrainRunRecord;
    expect(isUuidRunId(createdRun.id)).toBe(true);

    const lines = [...infoSpy.mock.calls, ...errorSpy.mock.calls]
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_runtime"))
      .map((line) => JSON.parse(line) as { event?: string; runIdIsUuid?: boolean });

    const createStarted = lines.find((line) => line.event === "brain_runtime_run_create_started");
    expect(createStarted?.runIdIsUuid).toBe(true);

    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("audit records use UUID ids for brain_audit_events schema", () => {
    const run = buildRun();
    const audit = buildRunAuditRecord({
      run,
      assembly: assembleCompanyContextSync({
        organizationId: ORG,
        companyProfile: { ...buildPeergentCompanyProfile("en"), organizationId: ORG },
        websiteSnapshot: buildDemoWebsiteSnapshotSync({ organizationId: ORG, url: "https://example.com" }),
      }),
      projection: { estimatedTokens: 0, slices: {}, truncated: false },
      policy: { decision: "allow", reasons: [] },
      providerId: "deterministic",
      cacheHit: false,
      durationMs: 1,
    });
    expect(isUuidRunId(audit.id)).toBe(true);
  });
});
