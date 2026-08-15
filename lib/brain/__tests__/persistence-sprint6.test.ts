import { describe, expect, it, beforeEach } from "vitest";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  createBrainRuntime,
  createDemoBrainProvider,
  BrainRuntimeError,
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
import {
  assertDemoNeverUsesLiveStorage,
  assertLiveNeverUsesDemoStorage,
  createBrainRepositories,
} from "@/lib/brain/persistence/repository-factory";
import { BrainInvalidationService } from "@/lib/brain/persistence/invalidation-service";
import { UpstreamOutputResolver } from "@/lib/brain/persistence/upstream-output-resolver";
import { classifyBrainRunRecovery } from "@/lib/brain/persistence/run-recovery";
import { hashIdempotencyRequest } from "@/lib/brain/persistence/sync-async-adapters";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import {
  getBrainRunDetail,
  listBrainRuns,
  toCustomerSafeRunSummary,
} from "@/lib/brain/admin/persistence-read-models";
import type { CustomerCorrection } from "@/lib/brain/company/corrections";
import { buildCompanySnapshot } from "@/lib/brain/company/snapshot-builder";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";

const ORG_A = "org-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "org-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

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

function createPersistentRuntime(repos = createPersistentInMemoryRepositories()) {
  return createBrainRuntime({
    runRepository: new InMemoryBrainRunRepository(),
    outputRepository: new InMemoryBrainOutputRepository(),
    auditRepository: new InMemoryBrainAuditRepository(),
    idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
    asyncRepositories: repos,
    storageMode: "persistent_in_memory",
    cache: new InMemoryBrainCacheStore(),
    providers: [createDeterministicBrainProvider(), createDemoBrainProvider()],
    assembleContext: (request) => demoAssembly(request.organizationId),
  });
}

describe("Project Brain Sprint 6 — Persistence", () => {
  beforeEach(() => {
    resetPersistentBrainStores();
  });

  describe("repository factory isolation", () => {
    it("live factory never selects demo storage", () => {
      const bundle = createBrainRepositories({ environment: "live" });
      expect(bundle.storageMode).not.toBe("in_memory");
      expect(() => assertLiveNeverUsesDemoStorage(bundle)).not.toThrow();
    });

    it("demo factory never selects live storage", () => {
      const bundle = createBrainRepositories({ environment: "demo" });
      expect(bundle.storageMode).toBe("in_memory");
      expect(() => assertDemoNeverUsesLiveStorage(bundle)).not.toThrow();
    });
  });

  describe("run persistence", () => {
    it("survives repository re-instantiation", async () => {
      const repos = createPersistentInMemoryRepositories();
      const runtime = createPersistentRuntime(repos);
      const result = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
      });
      const reloaded = await repos.runs.getById(ORG_A, result.run.id);
      expect(["completed", "partial"]).toContain(reloaded?.status);
    });

    it("persists audit records in order", async () => {
      const repos = createPersistentInMemoryRepositories();
      const runtime = createPersistentRuntime(repos);
      const result = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "website_understanding",
        actorId: "test",
        environment: "live",
      });
      const audit = await repos.audit.listByTrace(ORG_A, result.run.traceId);
      expect(audit.length).toBeGreaterThan(0);
    });
  });

  describe("idempotency", () => {
    it("reuses run for same key and request", async () => {
      const repos = createPersistentInMemoryRepositories();
      const runtime = createPersistentRuntime(repos);
      const key = "idem-1";
      const first = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
        idempotencyKey: key,
      });
      const second = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
        idempotencyKey: key,
      });
      expect(second.run.id).toBe(first.run.id);
    });

    it("rejects same key with different request", async () => {
      const repos = createPersistentInMemoryRepositories();
      const runtime = createPersistentRuntime(repos);
      const key = "idem-mismatch";
      await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
        idempotencyKey: key,
        campaignId: "camp-1",
      });
      await expect(
        runtime.executeRun({
          organizationId: ORG_A,
          peerId: "peer-marketing",
          capabilityId: "company_understanding",
          actorId: "test",
          environment: "live",
          idempotencyKey: key,
          campaignId: "camp-2",
        })
      ).rejects.toThrow(BrainRuntimeError);
    });
  });

  describe("organization isolation", () => {
    it("blocks cross-org run lookup", async () => {
      const repos = createPersistentInMemoryRepositories();
      await repos.runs.create({
        id: "run-org-a",
        traceId: "trace-a",
        childRunIds: [],
        organizationId: ORG_A,
        peerId: "peer",
        environment: "live",
        capabilityId: "company_understanding",
        status: "completed",
        usage: {},
        budget: { tokensUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const cross = await repos.runs.getById(ORG_B, "run-org-a");
      expect(cross).toBeNull();
    });

    it("isolates outputs by organization", async () => {
      const repos = createPersistentInMemoryRepositories();
      const cap = getBrainCapability("company_understanding");
      await repos.outputs.store({
        organizationId: ORG_A,
        runId: "run-a",
        output: emptyBrainStructuredOutput(),
        storedAt: new Date().toISOString(),
        capabilityId: "company_understanding",
        capabilityVersion: cap.version,
        contentHash: "hash-a",
      });
      const other = await repos.outputs.getByRunId(ORG_B, "run-a");
      expect(other).toBeNull();
    });
  });

  describe("snapshots", () => {
    it("versions immutably", async () => {
      const repos = createPersistentInMemoryRepositories();
      const v1 = await repos.snapshots.store({
        id: "snap-1",
        organizationId: ORG_A,
        snapshotKind: "website",
        schemaVersion: "1",
        versionNumber: 1,
        contextHash: "hash-1",
        freshness: "fresh",
        payload: { url: "https://example.com" },
        createdAt: new Date().toISOString(),
      });
      const v2 = await repos.snapshots.store({
        id: "snap-2",
        organizationId: ORG_A,
        snapshotKind: "website",
        schemaVersion: "1",
        versionNumber: 2,
        contextHash: "hash-2",
        freshness: "fresh",
        payload: { url: "https://example.com/v2" },
        createdAt: new Date().toISOString(),
      });
      expect(v1.versionNumber).toBe(1);
      expect(v2.versionNumber).toBe(2);
      const latest = await repos.snapshots.getLatest(ORG_A, "website");
      expect(latest?.id).toBe("snap-2");
    });
  });

  describe("customer corrections", () => {
    it("applies correction source priority", () => {
      const correction: CustomerCorrection = {
        id: "corr-1",
        organizationId: ORG_A,
        fieldKey: "industry",
        action: "replace",
        correctedValue: "SaaS",
        correctedAt: new Date().toISOString(),
        correctedBy: "user-1",
        source: "customer_confirmed",
      };
      const result = buildCompanySnapshot({
        organizationId: ORG_A,
        companyProfile: buildPeergentCompanyProfile("en"),
        marketingUnderstanding: null,
        websiteSnapshot: null,
        campaignContext: null,
        corrections: [correction],
        assembledAt: new Date().toISOString(),
      });
      expect(result.snapshot.profile.industry.value).toBe("SaaS");
    });

    it("retains correction history on supersede", async () => {
      const repos = createPersistentInMemoryRepositories();
      const c1: CustomerCorrection = {
        id: "corr-old",
        organizationId: ORG_A,
        fieldKey: "industry",
        action: "replace",
        correctedValue: "SaaS",
        correctedAt: new Date().toISOString(),
        correctedBy: "user-1",
        source: "customer_confirmed",
      };
      await repos.corrections.create(c1);
      await repos.corrections.supersede(ORG_A, "corr-old", "corr-new");
      const stored = await repos.corrections.listActive(ORG_A);
      expect(stored.find((c) => c.id === "corr-old")).toBeUndefined();
    });
  });

  describe("invalidation", () => {
    it("website change invalidates downstream without deleting outputs", async () => {
      const repos = createPersistentInMemoryRepositories();
      const cap = getBrainCapability("company_understanding");
      const outputId = await repos.outputs.store({
        organizationId: ORG_A,
        runId: "run-1",
        output: emptyBrainStructuredOutput(),
        storedAt: new Date().toISOString(),
        capabilityId: "company_understanding",
        capabilityVersion: cap.version,
        contentHash: "hash",
        contextHash: "ctx-hash",
      });
      const service = new BrainInvalidationService(repos);
      await service.executeForTrigger({
        organizationId: ORG_A,
        trigger: "website_snapshot",
        reason: "Website updated",
        contextHash: "ctx-hash",
      });
      const record = await repos.outputs.getRecordById(ORG_A, outputId);
      expect(record).not.toBeNull();
      const stale = await repos.dependencyStates.listByOrganization(ORG_A, "stale");
      expect(stale.length).toBeGreaterThan(0);
    });

    it("invalidates cache metadata by context hash", async () => {
      const repos = createPersistentInMemoryRepositories();
      await repos.cacheMetadata.upsert({
        organizationId: ORG_A,
        cacheKey: "cache-1",
        capabilityId: "company_understanding",
        capabilityVersion: "1.0.0",
        contextHash: "ctx-1",
        payloadHash: "payload-1",
        providerClass: "deterministic",
        freshness: "fresh",
        hitCount: 0,
      });
      const service = new BrainInvalidationService(repos);
      const result = await service.executeForTrigger({
        organizationId: ORG_A,
        trigger: "website_snapshot",
        reason: "Website updated",
        contextHash: "ctx-1",
      });
      expect(result.cacheInvalidatedCount).toBe(1);
    });
  });

  describe("upstream output resolution", () => {
    it("reuses fresh upstream output", async () => {
      const repos = createPersistentInMemoryRepositories();
      const cap = getBrainCapability("strategy");
      const outputId = await repos.outputs.store({
        organizationId: ORG_A,
        runId: "run-strategy",
        output: emptyBrainStructuredOutput(),
        storedAt: new Date().toISOString(),
        capabilityId: "strategy",
        capabilityVersion: cap.version,
        contentHash: "hash",
      });
      const resolver = new UpstreamOutputResolver(repos.outputs);
      const resolution = await resolver.resolve({
        organizationId: ORG_A,
        capabilityId: "strategy",
        capabilityVersion: cap.version,
        requireFresh: true,
      });
      expect(resolution.accepted).toBe(true);
      expect(resolution.output?.id).toBe(outputId);
    });

    it("rejects stale upstream output when fresh required", async () => {
      const repos = createPersistentInMemoryRepositories();
      const cap = getBrainCapability("strategy");
      const outputId = await repos.outputs.store({
        organizationId: ORG_A,
        runId: "run-strategy",
        output: emptyBrainStructuredOutput(),
        storedAt: new Date().toISOString(),
        capabilityId: "strategy",
        capabilityVersion: cap.version,
        contentHash: "hash",
      });
      await repos.outputs.markSuperseded(ORG_A, outputId, "out-new");
      const resolver = new UpstreamOutputResolver(repos.outputs);
      const resolution = await resolver.resolve({
        organizationId: ORG_A,
        capabilityId: "strategy",
        capabilityVersion: cap.version,
        requireFresh: true,
      });
      expect(resolution.accepted).toBe(false);
    });

    it("rejects capability version mismatch", async () => {
      const repos = createPersistentInMemoryRepositories();
      await repos.outputs.store({
        organizationId: ORG_A,
        runId: "run-strategy",
        output: emptyBrainStructuredOutput(),
        storedAt: new Date().toISOString(),
        capabilityId: "strategy",
        capabilityVersion: "0.9.0",
        contentHash: "hash",
      });
      const resolver = new UpstreamOutputResolver(repos.outputs);
      const resolution = await resolver.resolve({
        organizationId: ORG_A,
        capabilityId: "strategy",
        capabilityVersion: getBrainCapability("strategy").version,
        requireFresh: true,
      });
      expect(resolution.accepted).toBe(false);
    });
  });

  describe("memory candidates", () => {
    it("persists without auto-approval", async () => {
      const repos = createPersistentInMemoryRepositories();
      await repos.memoryCandidates.store({
        id: "mem-1",
        organizationId: ORG_A,
        scope: "organization",
        label: "Preferred channel",
        value: "LinkedIn",
        confidence: "medium",
        reviewState: "candidate",
        provenance: [{ kind: "assumption", refId: "run-1" }],
        createdAt: new Date().toISOString(),
      });
      const list = await repos.memoryCandidates.listByOrganization(ORG_A);
      expect(list[0]?.reviewState).toBe("candidate");
    });
  });

  describe("admin read services", () => {
    it("requires admin permission", async () => {
      const repos = createPersistentInMemoryRepositories();
      await expect(
        getBrainRunDetail(repos, { isAdmin: false }, ORG_A, "run-1")
      ).rejects.toThrow(/Admin permission required/);
    });

    it("lists runs for admin", async () => {
      const repos = createPersistentInMemoryRepositories();
      await repos.runs.create({
        id: "run-admin",
        traceId: "trace",
        childRunIds: [],
        organizationId: ORG_A,
        peerId: "peer",
        environment: "live",
        capabilityId: "company_understanding",
        status: "completed",
        usage: {},
        budget: { tokensUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const runs = await listBrainRuns(repos, { isAdmin: true }, ORG_A);
      expect(runs.length).toBe(1);
    });
  });

  describe("customer-safe reads", () => {
    it("does not expose provider or audit details", () => {
      const summary = toCustomerSafeRunSummary({
        id: "run-1",
        traceId: "trace",
        childRunIds: [],
        organizationId: ORG_A,
        peerId: "peer",
        environment: "live",
        capabilityId: "company_understanding",
        status: "completed",
        usage: { providerId: "secret-provider", inputTokens: 9999 },
        budget: { tokensUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      expect(summary).not.toHaveProperty("usage");
      expect(summary.capabilityId).toBe("company_understanding");
    });
  });

  describe("live context assembly", () => {
    it("returns needs_information without demo profile fallback", () => {
      const result = assembleCompanyContextSync({
        organizationId: ORG_A,
        companyProfile: null,
        marketingUnderstanding: null,
        websiteSnapshot: null,
        locale: "en",
      });
      expect(result.state).toBe("needs_information");
      expect(result.companySnapshot.profile.companyName.value).toBeNull();
    });
  });

  describe("run recovery", () => {
    it("classifies waiting_for_input", () => {
      const assessment = classifyBrainRunRecovery({
        id: "run-1",
        traceId: "trace",
        childRunIds: [],
        organizationId: ORG_A,
        peerId: "peer",
        environment: "live",
        capabilityId: "company_understanding",
        status: "waiting_for_input",
        usage: {},
        budget: { tokensUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      expect(assessment.classification).toBe("requires_customer_input");
    });

    it("keeps completed runs terminal", () => {
      const assessment = classifyBrainRunRecovery({
        id: "run-1",
        traceId: "trace",
        childRunIds: [],
        organizationId: ORG_A,
        peerId: "peer",
        environment: "live",
        capabilityId: "company_understanding",
        status: "completed",
        usage: {},
        budget: { tokensUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      expect(assessment.classification).toBe("terminal");
    });
  });

  describe("live end-to-end capabilities", () => {
    it("runs company_understanding with persistent storage", async () => {
      const runtime = createPersistentRuntime();
      const result = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "live",
      });
      expect(["completed", "partial"]).toContain(result.run.status);
      expect(result.output).not.toBeNull();
    });

    it("runs website_understanding with persistent storage", async () => {
      const repos = createPersistentInMemoryRepositories();
      const runtime = createBrainRuntime({
        runRepository: new InMemoryBrainRunRepository(),
        outputRepository: new InMemoryBrainOutputRepository(),
        auditRepository: new InMemoryBrainAuditRepository(),
        idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
        asyncRepositories: repos,
        storageMode: "persistent_in_memory",
        cache: new InMemoryBrainCacheStore(),
        providers: [createDeterministicBrainProvider(), createDemoBrainProvider()],
        assembleContext: (request) => demoAssembly(request.organizationId),
      });
      const result = await runtime.executeRun({
        organizationId: ORG_A,
        peerId: "peer-marketing",
        capabilityId: "website_understanding",
        actorId: "test",
        environment: "live",
      });
      expect(result.run.status).toBe("partial");
      expect(result.output).not.toBeNull();
      const reloaded = await repos.runs.getById(ORG_A, result.run.id);
      expect(reloaded?.status).toBe("partial");
    });
  });

  describe("idempotency hash helper", () => {
    it("changes when campaign changes", () => {
      const a = hashIdempotencyRequest({
        organizationId: ORG_A,
        capabilityId: "company_understanding",
        campaignId: "c1",
      });
      const b = hashIdempotencyRequest({
        organizationId: ORG_A,
        capabilityId: "company_understanding",
        campaignId: "c2",
      });
      expect(a).not.toBe(b);
    });
  });
});
