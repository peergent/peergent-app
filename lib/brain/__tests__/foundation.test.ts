import { describe, expect, it } from "vitest";
import {
  resolveBrainEnvironment,
  assertEnvironmentAllowsLiveAccess,
  BrainEnvironmentIsolationError,
  emptyBrainSnapshot,
  getBrainCapability,
  listBrainCapabilities,
  isCapabilityAllowedInEnvironment,
  WORKFLOW_STEP_BRAIN_MODULES,
  WORKFLOW_STEP_CAPABILITIES,
  capabilitiesForWorkflowStep,
  LEGACY_MODULE_TO_CAPABILITY,
  createTokenBudget,
  projectContextBudget,
  hashContextSlices,
  InMemoryBrainCacheStore,
  buildCacheKey,
  isMemoryExpired,
  evaluateBrainPolicy,
  assertOrganizationScoped,
  BrainOrganizationIsolationError,
  createDemoBrainProvider,
  presentBrainOutputForCampaign,
  emptyBrainStructuredOutput,
} from "@/lib/brain";
import type { BrainMemoryCandidate, BrainRunContext } from "@/lib/brain";

describe("Project Brain foundation", () => {
  describe("environment", () => {
    it("resolves live by default", () => {
      expect(resolveBrainEnvironment()).toBe("live");
    });

    it("resolves demo for demo peer", () => {
      expect(resolveBrainEnvironment({ peerId: "demo" })).toBe("demo");
    });

    it("resolves test in NODE_ENV=test", () => {
      expect(resolveBrainEnvironment({ nodeEnv: "test" })).toBe("test");
    });

    it("honors explicit environment override", () => {
      expect(resolveBrainEnvironment({ environment: "demo", peerId: "marketing" })).toBe("demo");
    });
  });

  describe("snapshot", () => {
    it("creates empty immutable snapshot with refs only", () => {
      const snapshot = emptyBrainSnapshot("2026-08-01T00:00:00.000Z");
      expect(snapshot.organization.available).toBe(false);
      expect(snapshot.knownFacts).toEqual([]);
      expect(snapshot.assembledAt).toBe("2026-08-01T00:00:00.000Z");
    });
  });

  describe("capability registry", () => {
    it("registers all sprint capabilities", () => {
      const ids = listBrainCapabilities().map((c) => c.id);
      expect(ids).toContain("company_understanding");
      expect(ids).toContain("optimization");
      expect(ids).toContain("validation");
      expect(ids).toContain("execution");
      expect(ids).toHaveLength(14);
      expect(new Set(ids).size).toBe(14);
    });

    it("allows capabilities in demo environment when configured", () => {
      expect(isCapabilityAllowedInEnvironment("strategy", "demo")).toBe(true);
    });
  });

  describe("workflow mapping", () => {
    it("derives capabilities from legacy module map without duplicating steps", () => {
      expect(WORKFLOW_STEP_CAPABILITIES.strategy_determined).toEqual([
        "strategy",
        "company_understanding",
        "competitor_understanding",
      ]);
    });

    it("keeps legacy module mapping as migration source", () => {
      expect(WORKFLOW_STEP_BRAIN_MODULES.website_analyzed).toEqual(["website", "seo"]);
      expect(LEGACY_MODULE_TO_CAPABILITY.seo).toBe("website_understanding");
    });

    it("returns capabilities for workflow step", () => {
      expect(capabilitiesForWorkflowStep("optimizing")).toContain("optimization");
    });
  });

  describe("token budget", () => {
    it("projects context within budget", () => {
      const budget = createTokenBudget(1000);
      const projection = {
        contextHash: hashContextSlices(["brand", "business"]),
        includedSlices: ["brand", "business"],
        excludedSlices: ["website"],
        estimatedTokens: 200,
      };
      expect(projectContextBudget(budget, projection)).toEqual({
        allowed: true,
        remaining: 1000,
      });
    });

    it("rejects projection exceeding remaining budget", () => {
      const budget = createTokenBudget(100);
      budget.consumedTokens = 90;
      const projection = {
        contextHash: hashContextSlices(["website"]),
        includedSlices: ["website"],
        excludedSlices: [],
        estimatedTokens: 50,
      };
      expect(projectContextBudget(budget, projection).allowed).toBe(false);
    });
  });

  describe("cache", () => {
    it("stores and retrieves entries by hash key", () => {
      const cache = new InMemoryBrainCacheStore();
      const key = buildCacheKey("org-1", "strategy", "ctx-brand|business");
      cache.set(key, { ok: true }, "hash-1", 60_000);
      expect(cache.get<{ ok: boolean }>(key)?.value.ok).toBe(true);
    });

    it("invalidates by prefix for organization isolation", () => {
      const cache = new InMemoryBrainCacheStore();
      cache.set(buildCacheKey("org-a", "strategy", "h1"), "a", "h1");
      cache.set(buildCacheKey("org-b", "strategy", "h1"), "b", "h1");
      cache.invalidateByPrefix("org-a:");
      expect(cache.get(buildCacheKey("org-a", "strategy", "h1"))).toBeNull();
      expect(cache.get(buildCacheKey("org-b", "strategy", "h1"))?.value).toBe("b");
    });
  });

  describe("memory", () => {
    it("detects expired candidates", () => {
      const candidate: BrainMemoryCandidate = {
        id: "m1",
        scope: "campaign",
        organizationId: "org-1",
        label: "Note",
        value: "Test",
        provenance: [],
        confidence: "medium",
        reviewState: "candidate",
        expiresAt: "2020-01-01T00:00:00.000Z",
        createdAt: "2020-01-01T00:00:00.000Z",
      };
      expect(isMemoryExpired(candidate, new Date("2026-01-01"))).toBe(true);
    });
  });

  describe("provenance", () => {
    it("requires provenance on structured findings", () => {
      const output = {
        ...emptyBrainStructuredOutput("strategy", "1.0.0", "2026-08-01T00:00:00.000Z"),
        findings: [
          {
            id: "f1",
            label: "Insight",
            value: "Value",
            confidence: "high" as const,
            provenance: [{ kind: "company_profile" as const, refId: "profile:1" }],
          },
        ],
      };
      expect(output.findings[0]?.provenance[0]?.kind).toBe("company_profile");
    });
  });

  describe("approval policy", () => {
    it("requires approval in manual mode", () => {
      expect(
        evaluateBrainPolicy({
          executionMode: "manual",
          approvalPolicy: "fully_automatic",
          capabilityApprovalRequirement: "before_action",
        }).decision
      ).toBe("require_approval");
    });

    it("allows fully automatic when policy permits", () => {
      expect(
        evaluateBrainPolicy({
          executionMode: "fully_automatic",
          approvalPolicy: "fully_automatic",
          capabilityApprovalRequirement: "before_action",
        }).decision
      ).toBe("allow");
    });
  });

  describe("organization isolation", () => {
    const context: BrainRunContext = {
      organizationId: "org-a",
      peerId: "marketing",
      environment: "live",
      actorId: "user-1",
      permissions: [],
      requestId: "req-1",
      correlationId: "corr-1",
    };

    it("passes when organization matches", () => {
      expect(() => assertOrganizationScoped(context, "org-a")).not.toThrow();
    });

    it("throws on cross-tenant access", () => {
      expect(() => assertOrganizationScoped(context, "org-b")).toThrow(
        BrainOrganizationIsolationError
      );
    });
  });

  describe("demo rejection", () => {
    it("demo provider rejects live environment", async () => {
      const provider = createDemoBrainProvider();
      await expect(
        provider.execute({
          context: {
            organizationId: "org-1",
            peerId: "marketing",
            environment: "live",
            actorId: "user-1",
            permissions: [],
            requestId: "req-1",
            correlationId: "corr-1",
          },
          snapshot: emptyBrainSnapshot("2026-08-01T00:00:00.000Z"),
          capabilityId: "strategy",
        })
      ).rejects.toThrow(BrainEnvironmentIsolationError);
    });

    it("live access guard rejects demo environment", () => {
      expect(() => assertEnvironmentAllowsLiveAccess("demo")).toThrow(
        BrainEnvironmentIsolationError
      );
    });

    it("returns deterministic demo output in demo environment", async () => {
      const { buildPeergentCompanyProfile } = await import("@/lib/brain/demo/peergent-company-profile");
      const { buildCompanySnapshot } = await import("@/lib/brain/company/snapshot-builder");
      const { buildCampaignContextFromCreateInput } = await import("@/lib/office/campaign/campaign-context");
      const { createMarketingCampaignProject } = await import("@/lib/peer-experience/marketing/projects/project-engine");
      const provider = createDemoBrainProvider();
      const profile = buildPeergentCompanyProfile("en");
      const { snapshot: companySnapshot } = buildCompanySnapshot({
        organizationId: profile.organizationId,
        companyProfile: profile,
      });
      const project = createMarketingCampaignProject({
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Peergent",
        goalLabel: "Leads",
        description: "Demo campaign for SMB owners.",
        primaryGoalId: "generate_leads",
        targetAudience: "SMB owners",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      });
      const campaignContext = buildCampaignContextFromCreateInput(project, {
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Peergent",
        goalLabel: "Leads",
        description: "Demo campaign for SMB owners.",
        primaryGoalId: "generate_leads",
        targetAudience: "SMB owners",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      }, "en");
      const output = await provider.execute({
        context: {
          organizationId: profile.organizationId,
          peerId: "demo",
          environment: "demo",
          actorId: "demo-user",
          permissions: [],
          requestId: "req-demo",
          correlationId: "corr-demo",
        },
        snapshot: emptyBrainSnapshot("2026-08-01T00:00:00.000Z"),
        capabilityId: "strategy",
        companySnapshot,
        executionContext: {
          companySnapshot,
          campaignContext,
          upstreamOutputs: {},
          locale: "en",
        },
      });
      expect(output.findings.length).toBeGreaterThan(0);
      expect(output.findings[0]?.provenance.length).toBeGreaterThan(0);
      expect(getBrainCapability("strategy").version).toBe(output.capabilityVersion);
    });
  });

  describe("presentation adapter", () => {
    it("maps structured output to CampaignEvidenceSection", () => {
      const output = emptyBrainStructuredOutput("strategy", "1.0.0", "2026-08-01T00:00:00.000Z");
      const presentation = presentBrainOutputForCampaign({
        title: "Strategy evidence",
        output: {
          ...output,
          findings: [
            {
              id: "f1",
              label: "Audience",
              value: "SMB marketers",
              confidence: "high",
              provenance: [{ kind: "customer_input", refId: "input:1" }],
            },
          ],
          recommendations: [
            {
              id: "r1",
              label: "Focus on LinkedIn",
              priority: "high",
              provenance: [{ kind: "market", refId: "market:1" }],
            },
          ],
        },
      });
      expect(presentation.sections.map((s) => s.id)).toEqual(["findings", "recommendations"]);
      expect(presentation.sections[0]?.items[0]).toContain("SMB marketers");
    });
  });
});
