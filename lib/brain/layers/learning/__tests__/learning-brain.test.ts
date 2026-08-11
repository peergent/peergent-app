import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCompanyGraph, resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  buildResearchBrainGraph,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import {
  buildReasoningBrainGraph,
  resetDefaultReasoningBrainRepository,
} from "@/lib/brain/layers/reasoning";
import {
  buildMarketingIntelligenceBrainGraph,
  resetDefaultMarketingIntelligenceBrainRepository,
} from "@/lib/brain/layers/marketing-intelligence";
import {
  buildStrategyBrainGraph,
  resetDefaultStrategyBrainRepository,
} from "@/lib/brain/layers/strategy";
import {
  buildPlanningBrainGraph,
  resetDefaultPlanningBrainRepository,
} from "@/lib/brain/layers/planning";
import {
  buildLearningBrainGraph,
  buildLearningBrainGraphOutput,
  validateLearningBrainGraph,
  learningBrainContract,
  resetDefaultLearningBrainRepository,
  resetLearningBrainLayerCounters,
  getDefaultLearningBrainRepository,
  hasInsufficientOutcomeData,
  assertNoCausalOverclaim,
  assertNoCreativeGeneration,
  assertNoCrossCampaignFabrication,
  assertNoFabricatedMetrics,
  hypothesisAllowsStrongCausality,
  singleEventIsNotPattern,
  buildPatterns,
  buildHypotheses,
  detectAnomalies,
  buildMemoryWriteProposals,
  buildRecommendations,
  buildSystemProposals,
  InsufficientOutcomeDataError,
} from "@/lib/brain/layers/learning";
import { getDefaultMemoryRepository, resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { PerformanceObservation, LearningBrainInput } from "@/lib/brain/layers/learning/brain-types";
import type { StrategyBrainGraph } from "@/lib/brain/layers/strategy/brain-types";
import type { PlanningBrainGraph } from "@/lib/brain/layers/planning/brain-types";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";

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
  selectedChannels: ["LinkedIn", "Google Search"] as const,
};

function obs(partial: Partial<PerformanceObservation> & Pick<PerformanceObservation, "id" | "metric">): PerformanceObservation {
  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    value: partial.value ?? 4.8,
    unit: partial.unit ?? "percent",
    baseline: partial.baseline ?? 3.2,
    target: partial.target ?? null,
    comparisonValue: partial.comparisonValue ?? null,
    measurementWindow: partial.measurementWindow ?? "7d",
    observedAt: partial.observedAt ?? "2026-08-08T00:00:00.000Z",
    source: partial.source ?? "demo_observation",
    sourceRef: partial.sourceRef ?? null,
    attributionModel: partial.attributionModel ?? "last_touch",
    attributionConfidence: partial.attributionConfidence ?? "medium",
    dataQuality: partial.dataQuality ?? "good",
    sampleSize: partial.sampleSize ?? 100,
    segment: partial.segment ?? null,
    metadata: partial.metadata ?? {},
    channel: partial.channel,
    campaignId: partial.campaignId ?? "camp-1",
    deliverableId: partial.deliverableId,
    projectId: partial.projectId,
    ...partial,
  };
}

async function upstreamGraphs(): Promise<{
  companyGraph: CompanyGraph;
  strategyGraph: StrategyBrainGraph;
  planningGraph: PlanningBrainGraph;
}> {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const profile = buildPeergentCompanyProfile("en", "2026-08-01T00:00:00.000Z");
  const website = buildDemoWebsiteSnapshotSync({ organizationId: PEERGENT_DEMO_ORG_ID, url: "https://peergent.com" });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });
  const companyGraph = buildCompanyGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en",
    companySnapshot: assembly.companySnapshot,
    brandGraph: collectBrandGraph({ companySnapshot: assembly.companySnapshot, campaignContext, websiteSnapshot: website, upstreamOutputs: {} }),
    author: "test",
    changeReason: "Learning test",
  });
  const researchGraph = await buildResearchBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph });
  const reasoningGraph = buildReasoningBrainGraph({ organizationId: PEERGENT_DEMO_ORG_ID, companyGraph, researchGraph });
  const miGraph = buildMarketingIntelligenceBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
    reasoningGraph,
    selectedChannels: ["LinkedIn", "Google Search"],
  });
  const strategyGraph = buildStrategyBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
    availableBudget: { amount: 10000, currency: "EUR" },
  });
  const planningGraph = buildPlanningBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    strategyGraph,
  });
  return { companyGraph, strategyGraph, planningGraph };
}

function baseInput(
  observations: PerformanceObservation[],
  extras?: Partial<LearningBrainInput>
): LearningBrainInput {
  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    performanceObservations: observations,
    ...extras,
  };
}

describe("Learning Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
    resetDefaultStrategyBrainRepository();
    resetDefaultPlanningBrainRepository();
    resetDefaultLearningBrainRepository();
    resetDefaultMemoryRepository();
    resetLearningBrainLayerCounters();
  });

  it("consumes performance observations", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr", channel: "LinkedIn" })]))!;
    expect(graph.observations.length).toBe(1);
  });

  it("compares expected vs actual", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "conversion_rate", value: 2.1, target: 3.0, baseline: 2.5 })])
    )!;
    expect(graph.comparisons.some((c) => c.type === "target_vs_actual")).toBe(true);
  });

  it("target vs actual comparison", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "leads", value: 10, target: 8 })])!)!;
    expect(graph.comparisons.find((c) => c.type === "target_vs_actual")?.observed).toBe("10");
  });

  it("creative variant comparison", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "v1", metric: "ctr", metadata: { variant: "proof-led A" }, value: 5 }),
        obs({ id: "v2", metric: "ctr", metadata: { variant: "urgency-led B" }, value: 3 }),
      ])
    )!;
    expect(graph.comparisons.some((c) => c.type === "creative_vs_creative")).toBe(true);
  });

  it("channel comparison", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "c1", metric: "ctr", channel: "LinkedIn", value: 5 }),
        obs({ id: "c2", metric: "ctr", channel: "Google Search", value: 2 }),
      ])
    )!;
    expect(graph.comparisons.some((c) => c.type === "channel_vs_channel")).toBe(true);
  });

  it("audience comparison", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "a1", metric: "ctr", segment: "SMB owners", value: 5 }),
        obs({ id: "a2", metric: "ctr", segment: "Enterprise", value: 2 }),
      ])
    )!;
    expect(graph.comparisons.some((c) => c.type === "audience_vs_audience")).toBe(true);
  });

  it("multi-metric interpretation", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "m1", metric: "ctr", value: 5, baseline: 3 }),
        obs({ id: "m2", metric: "conversion_rate", value: 1, baseline: 2 }),
        obs({ id: "m3", metric: "qualified_lead_rate", value: 0.5, baseline: 1.2 }),
      ])
    )!;
    expect(graph.insights.some((i) => i.interpretation.includes("CTR"))).toBe(true);
  });

  it("anomaly detection", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "a1", metric: "ctr", value: 10, baseline: 3 })])!)!;
    expect(graph.anomalies.length).toBeGreaterThan(0);
  });

  it("insufficient data does not create pattern", () => {
    const patterns = buildPatterns({
      observations: [obs({ id: "o1", metric: "ctr", metadata: { messageTerritory: "proof" }, campaignId: "c1" })],
      durableMemoryAllowed: false,
    });
    expect(patterns.length).toBe(0);
    expect(singleEventIsNotPattern(1, 1)).toBe(true);
  });

  it("repeated evidence creates pattern candidate", () => {
    const observations = [
      obs({ id: "o1", metric: "ctr", metadata: { messageTerritory: "proof-led" }, campaignId: "c1" }),
      obs({ id: "o2", metric: "ctr", metadata: { messageTerritory: "proof-led" }, campaignId: "c2" }),
      obs({ id: "o3", metric: "ctr", metadata: { messageTerritory: "proof-led" }, campaignId: "c2" }),
    ];
    const patterns = buildPatterns({ observations, durableMemoryAllowed: true });
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("hypothesis lifecycle", () => {
    const hypotheses = buildHypotheses({
      observations: [obs({ id: "o1", metric: "ctr", value: 5, baseline: 3, metadata: { messageTerritory: "proof" } })],
      patterns: [],
      experimentValid: false,
      upstreamConfidence: "low",
      createdAt: new Date().toISOString(),
    });
    expect(hypotheses[0]?.status).toBe("proposed");
  });

  it("correlation does not become causal claim", () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    for (const h of graph.hypotheses) {
      expect(h.statement).not.toMatch(/caused by/i);
    }
    assertNoCausalOverclaim(graph);
  });

  it("valid experiment allows stronger causality", () => {
    const h = buildHypotheses({
      observations: [],
      patterns: [
        {
          id: "p1",
          category: "messaging",
          title: "Test",
          description: "Repeated proof-led wins",
          scope: "org",
          supportingObservations: ["o1", "o2", "o3", "o4"],
          supportingCampaigns: ["c1", "c2"],
          supportingDeliverables: [],
          sampleSize: 8,
          consistency: "medium",
          businessImpact: "high",
          confidence: "medium",
          firstObservedAt: "2026-01-01",
          lastObservedAt: "2026-02-01",
          contradictions: [],
        },
      ],
      experimentValid: true,
      upstreamConfidence: "medium",
      createdAt: new Date().toISOString(),
    })[0]!;
    expect(hypothesisAllowsStrongCausality(h, true)).toBe(true);
  });

  it("data quality assessment", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    expect(graph.dataQuality.usableForLearning).toBe(true);
  });

  it("weak attribution reduces confidence", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "ctr", attributionConfidence: "low" })])!
    )!;
    expect(graph.confidence).toBe("low");
  });

  it("execution failure recognized", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "e1", metric: "execution_status", value: 0, baseline: 1 })])!
    )!;
    expect(graph.outcomes.some((o) => o.classification === "execution_failure")).toBe(true);
  });

  it("measurement failure recognized", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "m1", metric: "ctr", value: null })])!)!;
    expect(graph.outcomes.some((o) => o.classification === "measurement_failure")).toBe(true);
  });

  it("strategy learning signal", async () => {
    const { strategyGraph } = await upstreamGraphs();
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "ctr", channel: "LinkedIn" })], { strategyGraph })!
    )!;
    expect(graph.strategySignals.length).toBeGreaterThan(0);
  });

  it("planning learning signal", async () => {
    const { strategyGraph, planningGraph } = await upstreamGraphs();
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "ctr" })], { strategyGraph, planningGraph })!
    )!;
    expect(graph.planningSignals.length).toBeGreaterThan(0);
  });

  it("creative learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "v1", metric: "ctr", metadata: { variant: "proof-led" }, deliverableId: "d1" })])!
    )!;
    expect(graph.creativeSignals.length).toBeGreaterThan(0);
  });

  it("validation learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "v1", metric: "validation_score", value: 94 }),
        obs({ id: "c1", metric: "conversion_rate", value: 1, baseline: 2 }),
      ])
    )!;
    expect(graph.validationSignals[0]?.finding).toMatch(/blind spot|aligned/i);
  });

  it("execution learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "e1", metric: "execution_status", value: 0 })])!
    )!;
    expect(graph.executionSignals.length).toBeGreaterThan(0);
  });

  it("audience learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "a1", metric: "ctr", segment: "SMB owners" })])!
    )!;
    expect(graph.audienceSignals.length).toBeGreaterThan(0);
  });

  it("channel learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "c1", metric: "ctr", channel: "LinkedIn" })])!
    )!;
    expect(graph.channelSignals.length).toBeGreaterThan(0);
  });

  it("messaging learning signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "m1", metric: "ctr", metadata: { messageTerritory: "proof-led", hookType: "proof" } })])!
    )!;
    expect(graph.messagingSignals.length).toBeGreaterThan(0);
  });

  it("customer feedback signal", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([], {
        performanceObservations: [obs({ id: "o1", metric: "ctr" })],
        customerFeedback: [
          {
            id: "fb1",
            kind: "rejected",
            subject: "Aggressive tone",
            reason: "Too salesy",
            deliverableId: "d1",
            observedAt: "2026-08-08",
          },
        ],
      })
    )!;
    expect(graph.approvalSignals.length).toBeGreaterThan(0);
  });

  it("approval learning", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "ctr" })], {
        customerFeedback: [{ id: "fb1", kind: "rejected", subject: "tone", reason: "too aggressive", deliverableId: null, observedAt: "2026-08-08" }],
      })!
    )!;
    expect(graph.approvalSignals[0]?.pattern).toBeTruthy();
  });

  it("business outcome beats vanity metric", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "ctr1", metric: "ctr", value: 8, baseline: 3 }),
        obs({ id: "ql1", metric: "qualified_lead_rate", value: 0.4, baseline: 1.0 }),
      ])
    )!;
    expect(graph.outcomes.some((o) => o.classification === "mixed")).toBe(true);
  });

  it("contradictions preserved", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([
        obs({ id: "p1", metric: "ctr", metadata: { messageTerritory: "proof-led" }, value: 6, baseline: 3 }),
        obs({ id: "u1", metric: "ctr", metadata: { messageTerritory: "urgency-led" }, value: 6, baseline: 3 }),
      ])
    )!;
    expect(graph.contradictions.length).toBeGreaterThan(0);
  });

  it("learning unknowns", async () => {
    const graph = buildLearningBrainGraph(
      baseInput([obs({ id: "o1", metric: "ctr", attributionConfidence: "low", sampleSize: 5 })])!
    )!;
    expect(graph.unknowns.length).toBeGreaterThan(0);
  });

  it("memory write proposal generated", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    expect(graph.memoryWriteProposals.length).toBeGreaterThan(0);
  });

  it("temporary vs durable candidate", () => {
    const proposals = buildMemoryWriteProposals({
      patterns: [
        {
          id: "p1",
          category: "messaging",
          title: "Pattern",
          description: "Repeated",
          scope: "org",
          supportingObservations: ["o1", "o2", "o3", "o4", "o5"],
          supportingCampaigns: ["c1", "c2"],
          supportingDeliverables: [],
          sampleSize: 5,
          consistency: "medium",
          businessImpact: "high",
          confidence: "medium",
          firstObservedAt: "2026-01-01",
          lastObservedAt: "2026-02-01",
          contradictions: [],
        },
      ],
      hypotheses: [],
      insights: [],
      durableMemoryAllowed: true,
      campaignIds: ["c1"],
      deliverableIds: [],
    });
    expect(proposals.some((p) => p.durability === "durable_candidate")).toBe(true);
    expect(proposals.some((p) => p.durability === "temporary")).toBe(false);
  });

  it("Learning does NOT write Memory", async () => {
    const memoryRepo = getDefaultMemoryRepository();
    const storeSpy = vi.spyOn(memoryRepo, "store");
    buildLearningBrainGraphOutput(baseInput([obs({ id: "o1", metric: "ctr" })]));
    expect(storeSpy).not.toHaveBeenCalled();
  });

  it("Learning does NOT mutate Company", async () => {
    const { companyGraph } = await upstreamGraphs();
    const versionBefore = companyGraph.version;
    buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })], { companyGraph })!);
    expect(companyGraph.version).toBe(versionBefore);
  });

  it("Learning does NOT mutate Strategy", async () => {
    const { strategyGraph } = await upstreamGraphs();
    const versionBefore = strategyGraph.version;
    buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })], { strategyGraph })!);
    expect(strategyGraph.version).toBe(versionBefore);
  });

  it("Learning does NOT mutate Planning", async () => {
    const { strategyGraph, planningGraph } = await upstreamGraphs();
    const versionBefore = planningGraph.version;
    buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })], { strategyGraph, planningGraph })!);
    expect(planningGraph.version).toBe(versionBefore);
  });

  it("future recommendation targets correct Brain", () => {
    const recs = buildRecommendations({
      patterns: [
        {
          id: "p1",
          category: "messaging",
          title: "Proof pattern",
          description: "Proof wins",
          scope: "org",
          supportingObservations: ["o1"],
          supportingCampaigns: ["c1"],
          supportingDeliverables: [],
          sampleSize: 5,
          consistency: "medium",
          businessImpact: "high",
          confidence: "medium",
          firstObservedAt: "2026-01-01",
          lastObservedAt: "2026-02-01",
          contradictions: [],
        },
      ],
      hypotheses: [],
    });
    expect(recs[0]?.targetBrain).toBe("creative");
  });

  it("system proposal does not self-modify", () => {
    const proposals = buildSystemProposals({ validationBlindSpot: true, planningGap: true });
    expect(proposals.every((p) => p.autoApply === false)).toBe(true);
  });

  it("incremental learning versioning", async () => {
    const o1 = buildLearningBrainGraphOutput(baseInput([obs({ id: "o1", metric: "ctr" })]));
    const o2 = buildLearningBrainGraphOutput({
      ...baseInput([obs({ id: "o2", metric: "ctr" })]),
      supersedesSnapshotId: o1.snapshot.id,
      priorHypotheses: o1.graph.hypotheses,
    });
    expect(o2.graph.supersedes).toBe(o1.snapshot.id);
    expect(getDefaultLearningBrainRepository().getHistory({ organizationId: PEERGENT_DEMO_ORG_ID }).entries.length).toBe(2);
  });

  it("no learning when outcome data insufficient", () => {
    expect(hasInsufficientOutcomeData(baseInput([]))).toBe(true);
    expect(() => buildLearningBrainGraphOutput(baseInput([]))).toThrow(InsufficientOutcomeDataError);
  });

  it("ProjectBrainContract integration", async () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.learning?.id).toBe("learning");
    const result = await learningBrainContract.execute({
      context: { organizationId: PEERGENT_DEMO_ORG_ID, projectId: "p1", episodeId: "e1", locale: "en", slices: {} },
      payload: { performanceObservations: [obs({ id: "o1", metric: "ctr" })] },
    });
    expect(result.status).toBe("completed");
  });

  it("repository history", async () => {
    buildLearningBrainGraphOutput(baseInput([obs({ id: "o1", metric: "ctr" })]));
    expect(getDefaultLearningBrainRepository().getLatestSnapshot({ organizationId: PEERGENT_DEMO_ORG_ID })).not.toBeNull();
  });

  it("no fabricated metrics", () => {
    assertNoFabricatedMetrics([obs({ id: "o1", metric: "ctr", value: 4.8 })]);
  });

  it("no fabricated causality in validator", () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    expect(() => assertNoCausalOverclaim(graph)).not.toThrow();
  });

  it("no fabricated cross-campaign evidence", () => {
    assertNoCrossCampaignFabrication(
      [{ supportingCampaigns: ["camp-1"] }],
      ["camp-1"]
    );
    expect(() =>
      assertNoCrossCampaignFabrication([{ supportingCampaigns: ["camp-fake"] }], ["camp-1"])
    ).toThrow();
  });

  it("no creative generation", () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    assertNoCreativeGeneration(graph);
  });

  it("contract skips when insufficient data", async () => {
    const result = await learningBrainContract.execute({
      context: { organizationId: PEERGENT_DEMO_ORG_ID, locale: "en", slices: {} },
      payload: { performanceObservations: [] },
    });
    expect(result.status).toBe("skipped");
    expect(result.errorCode).toBe("insufficient_outcome_data");
  });

  it("validates learning graph", async () => {
    const graph = buildLearningBrainGraph(baseInput([obs({ id: "o1", metric: "ctr" })])!)!;
    expect(validateLearningBrainGraph(graph).valid).toBe(true);
  });

  it("detectAnomalies for high CTR low CVR", () => {
    const anomalies = detectAnomalies([
      obs({ id: "c1", metric: "ctr", value: 6, baseline: 3 }),
      obs({ id: "c2", metric: "conversion_rate", value: 1, baseline: 2 }),
    ]);
    expect(anomalies.some((a) => a.metric === "ctr_vs_conversion")).toBe(true);
  });
});
