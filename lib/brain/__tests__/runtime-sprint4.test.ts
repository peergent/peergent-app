import { describe, expect, it, beforeEach } from "vitest";
import {
  BrainRuntime,
  createBrainRuntime,
  createDefaultBrainRuntime,
  resetDefaultBrainRuntime,
  assertValidTransition,
  BrainRunTransitionError,
  projectBrainContext,
  evaluateReadinessGate,
  validateBrainStructuredOutput,
  buildPeergentCompanyProfile,
  assembleCompanyContextSync,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
} from "@/lib/brain";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import { createDemoBrainProvider } from "@/lib/brain/demo/demo-provider";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";

function createTestRuntime() {
  return createBrainRuntime({
    runRepository: new InMemoryBrainRunRepository(),
    outputRepository: new InMemoryBrainOutputRepository(),
    auditRepository: new InMemoryBrainAuditRepository(),
    idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
    cache: new InMemoryBrainCacheStore(),
    providers: [createDemoBrainProvider()],
    assembleContext: (request) => {
      const profile = buildPeergentCompanyProfile("en");
      const website = buildDemoWebsiteSnapshotSync({
        organizationId: profile.organizationId,
        url: "https://peergent.com",
      });
      return assembleCompanyContextSync({
        organizationId: request.organizationId,
        companyProfile: profile,
        websiteSnapshot: website,
      });
    },
  });
}

describe("Project Brain Sprint 4 — Runtime", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetDefaultBrainRuntime();
  });

  describe("state machine", () => {
    it("allows legal transitions", () => {
      expect(() => assertValidTransition("queued", "gathering_context")).not.toThrow();
      expect(() => assertValidTransition("running", "completed")).not.toThrow();
    });

    it("throws on illegal transitions", () => {
      expect(() => assertValidTransition("completed", "running")).toThrow(BrainRunTransitionError);
    });
  });

  describe("context projection", () => {
    it("projects only required slices", () => {
      const profile = buildPeergentCompanyProfile("en");
      const assembly = assembleCompanyContextSync({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteSnapshot: buildDemoWebsiteSnapshotSync({
          organizationId: profile.organizationId,
          url: "https://peergent.com",
        }),
      });
      const def = getBrainCapability("website_understanding");
      const projected = projectBrainContext({
        fullSnapshot: assembly.brainSnapshot,
        companySnapshot: assembly.companySnapshot,
        requiredSlices: def.requiredContext,
        optionalSlices: def.optionalContext,
      });
      expect(projected.projection.includedSlices).toContain("website");
      expect(projected.projection.excludedSlices).not.toContain("website");
      expect(projected.projection.contextHash).toMatch(/^ctx-/);
    });
  });

  describe("readiness gate", () => {
    it("allows partial website capability without website snapshot", () => {
      const profile = buildPeergentCompanyProfile("en");
      const assembly = assembleCompanyContextSync({
        organizationId: profile.organizationId,
        companyProfile: profile,
      });
      const scores = Object.fromEntries(
        assembly.readiness.scores.map((s) => [s.dimension, s.score])
      ) as Record<string, number>;
      const gate = evaluateReadinessGate({
        capabilityId: "website_understanding",
        overallScore: assembly.readiness.overallScore,
        dimensionScores: scores as never,
        missingCriticalFields: ["website"],
        assemblyState: assembly.state,
      });
      expect(gate.ok).toBe(true);
      if (gate.ok) expect(gate.partial).toBe(true);
    });
  });

  describe("output validation", () => {
    it("requires provenance on findings", () => {
      const output = emptyBrainStructuredOutput("company_understanding", "1.0.0", new Date().toISOString());
      const issues = validateBrainStructuredOutput(output);
      expect(issues).toHaveLength(0);
    });
  });

  describe("BrainRuntime end-to-end", () => {
    it("executes company_understanding through full pipeline", () => {
      const runtime = createTestRuntime();
      const result = runtime.executeRunSync({
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "demo",
      });
      expect(["completed", "partial"]).toContain(result.run.status);
      expect(result.output?.findings.length).toBeGreaterThan(0);
      expect(result.output?.findings[0]?.provenance.length).toBeGreaterThan(0);
    });

    it("supports idempotent submit", () => {
      const runtime = createTestRuntime();
      const request = {
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "company_understanding" as const,
        actorId: "test",
        environment: "demo" as const,
        idempotencyKey: "idem-1",
      };
      const first = runtime.submitRun(request);
      const second = runtime.submitRun(request);
      expect(first.runId).toBe(second.runId);
      expect(second.idempotentReplay).toBe(true);
    });

    it("records zero cost for demo provider", () => {
      const runtime = createTestRuntime();
      const result = runtime.executeRunSync({
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "demo",
      });
      expect(result.run.usage.estimatedCostCents).toBe(0);
      expect(result.run.usage.inputTokens).toBe(0);
    });

    it("enforces organization isolation on lookup", () => {
      const runtime = createTestRuntime();
      const submitted = runtime.submitRun({
        organizationId: "org-a",
        peerId: "demo",
        capabilityId: "company_understanding",
        actorId: "test",
        environment: "demo",
      });
      expect(() => runtime.lookupRun("org-b", submitted.runId)).toThrow();
    });

    it("caches repeatable demo runs", () => {
      const runtime = createTestRuntime();
      const request = {
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "company_understanding" as const,
        actorId: "test",
        environment: "demo" as const,
      };
      const first = runtime.executeRunSync(request);
      const second = runtime.executeRunSync(request);
      expect(first.output?.findings.length).toBeGreaterThan(0);
      expect(second.output?.findings.length).toBeGreaterThan(0);
    });
  });

  describe("default runtime factory", () => {
    it("creates a reusable default runtime", () => {
      const runtime = createDefaultBrainRuntime();
      expect(runtime).toBeInstanceOf(BrainRuntime);
    });
  });
});
