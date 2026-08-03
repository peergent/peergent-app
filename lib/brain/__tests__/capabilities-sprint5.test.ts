import { beforeEach, describe, expect, it } from "vitest";
import {
  BRAIN_CAPABILITY_DEFINITIONS,
  listBrainCapabilities,
  getBrainCapability,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  createBrainRuntime,
  createDemoBrainProvider,
  evaluateBrainPolicy,
  presentBrainOutputForCampaign,
  clearDemoWebsiteSnapshots,
  resetDefaultBrainRuntime,
} from "@/lib/brain";
import { InMemoryBrainRunRepository } from "@/lib/brain/runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "@/lib/brain/runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "@/lib/brain/runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "@/lib/brain/runtime/repositories/in-memory-idempotency-repository";
import { InMemoryBrainCacheStore } from "@/lib/brain/cache/store";
import {
  CAPABILITY_DEPENDENCIES,
  validateCapabilityDependencyGraphAcyclic,
  resolveCapabilityExecutionOrder,
} from "@/lib/brain/capabilities/capability-dependencies";
import { executeBrandUnderstanding } from "@/lib/brain/capabilities/brand-understanding";
import { executeCompetitorUnderstanding } from "@/lib/brain/capabilities/competitor-understanding";
import { executeStrategy } from "@/lib/brain/capabilities/strategy";
import { executeChannelPlanning } from "@/lib/brain/capabilities/channel-planning";
import { executeCreativeGeneration } from "@/lib/brain/capabilities/creative-generation";
import { executePerformanceInterpretation } from "@/lib/brain/capabilities/performance-interpretation";
import { executeOptimization } from "@/lib/brain/capabilities/optimization";
import { buildCapabilityExecutionContext, hashUpstreamOutputVersions } from "@/lib/brain/integration/build-capability-execution-context";
import {
  validateCapabilityOutputQuality,
  collapseDuplicateFindings,
} from "@/lib/brain/capabilities/shared/output-quality";
import { buildCapabilityInspectionReadModel } from "@/lib/brain/admin/capability-read-models";
import { buildCampaignContextFromCreateInput, SEED_CAMPAIGN_ID } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCacheKeyParts } from "@/lib/brain/runtime/context-projection";
import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";

const peergentInput = {
  peerId: "demo" as const,
  ownerLabel: "Emma",
  name: "Peergent",
  goalLabel: "Demo requests",
  description: "More demo requests from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
};

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
      const project = createMarketingCampaignProject(peergentInput);
      const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
      return assembleCompanyContextSync({
        organizationId: request.organizationId,
        companyProfile: profile,
        websiteSnapshot: website,
        campaignContext,
      });
    },
  });
}

function campaignCtx(overrides: Record<string, unknown> = {}) {
  const project = createMarketingCampaignProject(peergentInput);
  return {
    ...buildCampaignContextFromCreateInput(project, peergentInput, "en"),
    ...overrides,
  };
}

function execCtx(overrides: Partial<Parameters<typeof buildCapabilityExecutionContext>[0]> = {}) {
  const profile = buildPeergentCompanyProfile("en");
  const assembly = assembleCompanyContextSync({
    organizationId: profile.organizationId,
    companyProfile: profile,
    websiteSnapshot: buildDemoWebsiteSnapshotSync({
      organizationId: profile.organizationId,
      url: "https://peergent.com",
    }),
    campaignContext: campaignCtx(),
  });
  return buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: profile.organizationId,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext: campaignCtx(),
      locale: "en",
    },
    ...overrides,
  });
}

describe("Project Brain Sprint 5 — Capabilities", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetDefaultBrainRuntime();
  });

  it("registers all new capability definitions", () => {
    const ids = listBrainCapabilities().map((c) => c.id);
    for (const id of [
      "brand_understanding",
      "competitor_understanding",
      "strategy",
      "channel_planning",
      "creative_generation",
      "performance_interpretation",
      "optimization",
    ] as const) {
      expect(ids).toContain(id);
    }
  });

  it("has explicit capability versions", () => {
    for (const def of BRAIN_CAPABILITY_DEFINITIONS) {
      expect(def.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(def.dependencies).toEqual(CAPABILITY_DEPENDENCIES[def.id]);
    }
  });

  it("validates dependency graph is acyclic", () => {
    expect(validateCapabilityDependencyGraphAcyclic()).toBe(true);
  });

  it("returns partial brand understanding when brand info incomplete", () => {
    const profile = buildPeergentCompanyProfile("en");
    profile.positioning = { ...profile.positioning, value: null };
    profile.tone = { ...profile.tone, value: null };
    const ctx = execCtx({
      assembly: assembleCompanyContextSync({
        organizationId: profile.organizationId,
        companyProfile: profile,
      }),
    });
    ctx.companySnapshot = { ...ctx.companySnapshot, profile };
    const out = executeBrandUnderstanding(ctx);
    expect(out.warnings.some((w) => w.code === "insufficient_brand_context")).toBe(true);
  });

  it("keeps brand unknowns unknown without inventing voice", () => {
    const profile = buildPeergentCompanyProfile("en");
    profile.tone = { ...profile.tone, value: null };
    profile.positioning = { ...profile.positioning, value: null };
    const ctx = execCtx();
    ctx.companySnapshot = { ...ctx.companySnapshot, profile };
    ctx.marketingUnderstanding = null;
    const out = executeBrandUnderstanding(ctx);
    expect(out.findings.some((f) => f.label.toLowerCase().includes("tone"))).toBe(false);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it("never invents competitor names", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({ competitors: [], competitorsSkipped: false });
    ctx.companySnapshot = {
      ...ctx.companySnapshot,
      profile: {
        ...ctx.companySnapshot.profile,
        mainCompetitors: { ...ctx.companySnapshot.profile.mainCompetitors, value: [] },
      },
    };
    const out = executeCompetitorUnderstanding(ctx);
    expect(out.findings).toHaveLength(0);
    expect(out.warnings.some((w) => w.code === "competitors_missing")).toBe(true);
  });

  it("handles missing competitors with waiting-style warning", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({ competitors: [], competitorsSkipped: false });
    ctx.companySnapshot = {
      ...ctx.companySnapshot,
      profile: {
        ...ctx.companySnapshot.profile,
        mainCompetitors: { ...ctx.companySnapshot.profile.mainCompetitors, value: [] },
      },
    };
    const out = executeCompetitorUnderstanding(ctx);
    expect(out.warnings.some((w) => w.code === "competitors_missing")).toBe(true);
    expect(out.warnings[0]?.message).toMatch(/need competitors|concurrenten/i);
  });

  it("requires campaign goal for strategy output", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({ goals: [], description: "" });
    const out = executeStrategy(ctx);
    expect(out.warnings.some((w) => w.code === "missing_campaign_goal")).toBe(true);
  });

  it("keeps strategy sections semantically distinct", () => {
    const ctx = execCtx();
    const brand = executeBrandUnderstanding(ctx);
    ctx.upstreamOutputs = { brand_understanding: brand };
    const out = executeStrategy(ctx);
    const labels = out.findings.map((f) => f.label.toLowerCase());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes provenance on strategy findings", () => {
    const out = executeStrategy(execCtx());
    expect(out.findings.every((f) => f.provenance.length > 0)).toBe(true);
  });

  it("channel plan references strategy upstream", () => {
    const ctx = execCtx();
    const strategy = executeStrategy(ctx);
    ctx.upstreamOutputs = { strategy };
    const out = executeChannelPlanning(ctx);
    expect(out.findings.length).toBeGreaterThan(0);
    expect(out.findings[0]?.provenance.some((p) => p.refId.includes("strategy"))).toBe(true);
  });

  it("respects manual channel choices", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({
      campaignMode: "manual",
      selectedChannels: ["linkedin"],
    });
    const strategy = executeStrategy(ctx);
    ctx.upstreamOutputs = { strategy };
    const out = executeChannelPlanning(ctx);
    const linkedin = out.findings.find((f) => f.id === "channel-linkedin");
    expect(linkedin?.value).toMatch(/selected|geselecteerd/i);
    expect(linkedin?.value).toMatch(/constraint|klantkeuze/i);
  });

  it("includes selected and rejected channel rationale", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({ selectedChannels: ["linkedin", "email"] });
    ctx.upstreamOutputs = { strategy: executeStrategy(ctx) };
    const out = executeChannelPlanning(ctx);
    expect(out.findings.some((f) => /selected|geselecteerd/i.test(f.value))).toBe(true);
    expect(out.findings.some((f) => /rejected|afgewezen/i.test(f.value))).toBe(true);
  });

  it("deliverables reference selected channels", () => {
    const ctx = execCtx();
    const strategy = executeStrategy(ctx);
    ctx.upstreamOutputs = {
      strategy,
      channel_planning: executeChannelPlanning({ ...ctx, upstreamOutputs: { strategy } }),
      brand_understanding: executeBrandUnderstanding(ctx),
    };
    const out = executeCreativeGeneration(ctx);
    expect(out.findings.length).toBeGreaterThan(0);
    expect(out.findings[0]?.value).toMatch(/channel:/i);
  });

  it("deliverable plan contains no final generated copy", () => {
    const ctx = execCtx();
    const strategy = executeStrategy(ctx);
    ctx.upstreamOutputs = {
      strategy,
      channel_planning: executeChannelPlanning({ ...ctx, upstreamOutputs: { strategy } }),
    };
    const out = executeCreativeGeneration(ctx);
    for (const f of out.findings) {
      expect(f.value.length).toBeLessThan(400);
    }
  });

  it("performance with no data is honest", () => {
    const out = executePerformanceInterpretation(execCtx());
    expect(out.warnings.some((w) => w.code === "insufficient_performance_data")).toBe(true);
    expect(out.findings.some((f) => /insufficient|onvoldoende/i.test(f.value))).toBe(true);
  });

  it("distinguishes performance facts and hypotheses", () => {
    const ctx = execCtx({
      request: {
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "performance_interpretation",
        actorId: "test",
        performanceMetrics: [
          {
            id: "m1",
            channel: "linkedin",
            label: "Clicks",
            value: 120,
            unit: "count",
            window: "7d",
            provenanceRef: "demo:perf:1",
          },
        ],
      },
    });
    const out = executePerformanceInterpretation(ctx);
    expect(out.findings.some((f) => /fact|feit/i.test(f.label))).toBe(true);
    expect(out.findings.some((f) => /hypothesis|hypothese/i.test(f.label))).toBe(true);
  });

  it("blocks optimization on insufficient performance", () => {
    const ctx = execCtx();
    ctx.upstreamOutputs = {
      performance_interpretation: executePerformanceInterpretation(ctx),
    };
    const out = executeOptimization(ctx);
    expect(out.warnings.some((w) => w.code === "insufficient_performance_for_optimization")).toBe(true);
    expect(out.actionProposals).toHaveLength(0);
  });

  it("optimization proposals reference performance evidence when data exists", () => {
    const ctx = execCtx({
      request: {
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "optimization",
        actorId: "test",
        performanceMetrics: [
          {
            id: "m1",
            channel: "email",
            label: "Opens",
            value: 10,
            unit: "%",
            window: "7d",
            provenanceRef: "demo:perf:email",
          },
          {
            id: "m2",
            channel: "linkedin",
            label: "Clicks",
            value: 2,
            unit: "count",
            window: "7d",
            provenanceRef: "demo:perf:linkedin",
          },
        ],
      },
    });
    const perf = executePerformanceInterpretation(ctx);
    ctx.upstreamOutputs = {
      strategy: executeStrategy(ctx),
      channel_planning: executeChannelPlanning({
        ...ctx,
        upstreamOutputs: { strategy: executeStrategy(ctx) },
      }),
      creative_generation: executeCreativeGeneration({
        ...ctx,
        upstreamOutputs: {
          strategy: executeStrategy(ctx),
          channel_planning: executeChannelPlanning({
            ...ctx,
            upstreamOutputs: { strategy: executeStrategy(ctx) },
          }),
        },
      }),
      performance_interpretation: perf,
    };
    const out = executeOptimization(ctx);
    expect(out.actionProposals.length).toBeGreaterThan(0);
    expect(
      out.actionProposals.every((p) =>
        p.provenance.some((pr) => pr.kind === "capability_output" || pr.refId.includes("performance"))
      )
    ).toBe(true);
  });

  it("action proposals include reversibility via approval requirement", () => {
    const ctx = execCtx({
      request: {
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId: "optimization",
        actorId: "test",
        performanceMetrics: [
          {
            id: "m1",
            channel: "linkedin",
            label: "Clicks",
            value: 5,
            unit: "count",
            window: "7d",
            provenanceRef: "demo:perf:1",
          },
        ],
      },
    });
    ctx.upstreamOutputs = { performance_interpretation: executePerformanceInterpretation(ctx) };
    const out = executeOptimization(ctx);
    expect(out.actionProposals.every((p) => p.requiresApproval)).toBe(true);
  });

  it("policy differs for manual vs automatic execution modes", () => {
    const manual = evaluateBrainPolicy({
      executionMode: "manual",
      approvalPolicy: "approval_required",
      capabilityApprovalRequirement: "before_action",
    });
    const automatic = evaluateBrainPolicy({
      executionMode: "fully_automatic",
      approvalPolicy: "fully_automatic",
      capabilityApprovalRequirement: "before_action",
    });
    expect(manual.decision).not.toBe(automatic.decision);
  });

  it("deterministic provider records zero tokens and cost", () => {
    const runtime = createTestRuntime();
    const result = runtime.executeRunSync({
      organizationId: "org-demo-peergent",
      peerId: "demo",
      capabilityId: "brand_understanding",
      actorId: "test",
      environment: "demo",
      campaignContext: campaignCtx(),
    });
    expect(result.run.usage.inputTokens).toBe(0);
    expect(result.run.usage.estimatedCostCents).toBe(0);
  });

  it("prevents cross-organization output retrieval", () => {
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

  it("does not leak fixtures across campaigns in strategy output", () => {
    const ctx = execCtx();
    ctx.campaignContext = campaignCtx({
      projectId: "camp-custom-123",
      description: "Launch Peergent for SMB teams",
      goals: ["Generate qualified demos"],
    });
    const out = executeStrategy(ctx);
    const text = out.findings.map((f) => f.value).join(" ");
    expect(text).not.toMatch(/heat pump|warmtepomp|installer/i);
  });

  const runtimeCapabilities: BrainCapabilityId[] = [
    "brand_understanding",
    "competitor_understanding",
    "strategy",
    "channel_planning",
    "creative_generation",
    "performance_interpretation",
    "optimization",
  ];

  for (const capabilityId of runtimeCapabilities) {
    it(`executes ${capabilityId} through BrainRuntime`, () => {
      const runtime = createTestRuntime();
      const result = runtime.executeRunSync({
        organizationId: "org-demo-peergent",
        peerId: "demo",
        capabilityId,
        actorId: "test",
        environment: "demo",
        campaignContext: campaignCtx({ projectId: SEED_CAMPAIGN_ID }),
        performanceMetrics:
          capabilityId === "performance_interpretation" || capabilityId === "optimization"
            ? [
                {
                  id: "m1",
                  channel: "linkedin",
                  label: "Impressions",
                  value: 100,
                  unit: "count",
                  window: "7d",
                  provenanceRef: `demo:${SEED_CAMPAIGN_ID}:linkedin`,
                },
              ]
            : undefined,
        upstreamOutputs:
          capabilityId === "channel_planning"
            ? { strategy: executeStrategy(execCtx()) }
            : capabilityId === "creative_generation"
              ? {
                  strategy: executeStrategy(execCtx()),
                  channel_planning: executeChannelPlanning({
                    ...execCtx(),
                    upstreamOutputs: { strategy: executeStrategy(execCtx()) },
                  }),
                  brand_understanding: executeBrandUnderstanding(execCtx()),
                }
              : capabilityId === "optimization"
                ? {
                    performance_interpretation: executePerformanceInterpretation(
                      execCtx({
                        request: {
                          organizationId: "org-demo-peergent",
                          peerId: "demo",
                          capabilityId: "performance_interpretation",
                          actorId: "test",
                          performanceMetrics: [
                            {
                              id: "m1",
                              channel: "linkedin",
                              label: "Clicks",
                              value: 3,
                              unit: "count",
                              window: "7d",
                              provenanceRef: "demo:perf",
                            },
                          ],
                        },
                      })
                    ),
                  }
                : undefined,
      });
      expect(["completed", "partial", "waiting_for_approval", "waiting_for_input"]).toContain(
        result.run.status
      );
      if (result.output) {
        expect(result.output.capabilityId).toBe(capabilityId);
      }
    });
  }

  it("changes cache key when upstream capability version changes", () => {
    const v1 = hashUpstreamOutputVersions({
      strategy: emptyBrainStructuredOutput("strategy", "1.0.0", "2026-01-01"),
    });
    const v2 = hashUpstreamOutputVersions({
      strategy: emptyBrainStructuredOutput("strategy", "2.0.0", "2026-01-01"),
    });
    expect(v1).not.toBe(v2);
    const key1 = buildCacheKeyParts({
      organizationId: "org",
      capabilityId: "channel_planning",
      contextHash: "ctx-1",
      payloadHash: v1,
      providerId: "demo",
      capabilityVersion: "1.0.0",
      freshness: "fresh",
    });
    const key2 = buildCacheKeyParts({
      organizationId: "org",
      capabilityId: "channel_planning",
      contextHash: "ctx-1",
      payloadHash: v2,
      providerId: "demo",
      capabilityVersion: "1.0.0",
      freshness: "fresh",
    });
    expect(key1).not.toBe(key2);
  });

  it("marks dependents stale when upstream version changes", () => {
    const stale = buildCapabilityInspectionReadModel({
      organizationId: "org-demo-peergent",
      capabilityId: "channel_planning",
      assembly: assembleCompanyContextSync({
        organizationId: "org-demo-peergent",
        companyProfile: buildPeergentCompanyProfile("en"),
      }),
      storedOutputs: {
        strategy: emptyBrainStructuredOutput("strategy", "0.9.0", new Date().toISOString()),
      },
    });
    expect(stale.dependencies.some((d) => d.capabilityId === "strategy" && d.stale)).toBe(true);
  });

  it("presentation hides internal metadata", () => {
    const out = executeBrandUnderstanding(execCtx());
    const presented = presentBrainOutputForCampaign({
      output: out,
      title: "Brand",
      locale: "en",
    });
    const text = presented.sections.flatMap((s) => s.items).join(" ");
    expect(text).not.toMatch(/capabilityId|provider|cache_hit|ctx-[a-f0-9]/i);
  });

  it("CampaignEvidenceSection compatibility", () => {
    const presented = presentBrainOutputForCampaign({
      output: executeStrategy(execCtx()),
      title: "Strategy",
      locale: "en",
    });
    expect(presented.sections.every((s) => s.id && s.title && Array.isArray(s.items))).toBe(true);
  });

  it("quality validator catches duplicate output", () => {
    const output = executeStrategy(execCtx());
    const dup = {
      ...output,
      findings: [...output.findings, output.findings[0]!],
    };
    const issues = validateCapabilityOutputQuality({ capabilityId: "strategy", output: dup });
    expect(issues.some((i) => i.code === "duplicate_finding" || i.code === "duplicate_strategy_section")).toBe(
      true
    );
  });

  it("quality validator catches unsupported competitor claim", () => {
    const output = executeCompetitorUnderstanding(execCtx());
    const bad = {
      ...output,
      findings: [
        {
          id: "bad",
          label: "Competitor X",
          value: "Invented Co",
          confidence: "high" as const,
          provenance: [{ kind: "assumption" as const, refId: "only-assumption" }],
        },
      ],
    };
    const issues = validateCapabilityOutputQuality({ capabilityId: "competitor_understanding", output: bad });
    expect(issues.some((i) => i.code === "unsupported_competitor")).toBe(true);
  });

  it("quality validator catches ungrounded numerical promise", () => {
    const output = executeStrategy(execCtx());
    const bad = {
      ...output,
      findings: [
        ...output.findings,
        {
          id: "num",
          label: "ROI",
          value: "Expect 300% ROI",
          confidence: "high" as const,
          provenance: [{ kind: "customer_confirmed" as const, refId: "x" }],
        },
      ],
    };
    const issues = validateCapabilityOutputQuality({ capabilityId: "strategy", output: bad });
    expect(issues.some((i) => i.code === "ungrounded_numeric_promise")).toBe(true);
  });

  it("memory candidate includes provenance", () => {
    const out = executeBrandUnderstanding(execCtx());
    expect(out.memoryCandidates?.every((m) => m.provenance.length > 0)).toBe(true);
  });

  it("admin capability read model exposes readiness and dependencies", () => {
    const assembly = assembleCompanyContextSync({
      organizationId: "org-demo-peergent",
      companyProfile: buildPeergentCompanyProfile("en"),
      campaignContext: campaignCtx(),
    });
    const model = buildCapabilityInspectionReadModel({
      organizationId: "org-demo-peergent",
      capabilityId: "strategy",
      assembly,
    });
    expect(model.version).toBe(getBrainCapability("strategy").version);
    expect(model.dependencies.length).toBeGreaterThan(0);
    expect(model.costClass).toBe("high");
  });

  it("resolves capability execution order for channel_planning", () => {
    const order = resolveCapabilityExecutionOrder("channel_planning");
    expect(order).toContain("strategy");
    expect(order.indexOf("strategy")).toBeGreaterThan(order.indexOf("company_understanding"));
  });

  it("collapseDuplicateFindings removes duplicates", () => {
    const base = executeStrategy(execCtx());
    const collapsed = collapseDuplicateFindings({
      ...base,
      findings: [...base.findings, base.findings[0]!],
    });
    expect(collapsed.findings.length).toBe(base.findings.length);
  });
});
