import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { simulatedDurableStore, resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
} from "@/lib/brain/persistence/layer-repository-factory";
import { setActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";
import type { ProjectBrainExecutionAdapter } from "@/lib/brain/project-runtime/types";
import type { BrainResult, BrainOutput } from "@/lib/brain/project-engine/brain-contract";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";

const ORG = "00000000-0000-4000-8000-000000000001";

function buildEpisodePostMiAtVersion5(
  projectId: string,
  resolvedGraphs: ProjectEpisodeRecord["resolvedGraphs"] = {}
): ProjectEpisodeRecord {
  const snapshot = createProjectEngineSnapshot({
    projectId,
    peerId: "demo",
    organizationId: ORG,
  });
  return {
    snapshot: {
      ...snapshot,
      state: "strategizing",
      completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
      activeBrain: null,
    },
    artifacts: createEmptyArtifacts({
      organizationId: ORG,
      projectId,
      episodeId: snapshot.episodeId,
      correlationId: `corr-${projectId}`,
    }),
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: { business: true, campaign: true, goals: true },
    approvalSatisfied: false,
    validationApprovalPending: false,
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: `corr-${projectId}`,
    startedAt: snapshot.startedAt,
    updatedAt: snapshot.updatedAt,
    completedAt: null,
    resolvedGraphs,
    durableVersion: 5,
  };
}

describe("PX-50.11 strategy readiness pause vs failure", () => {
  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("waiting_for_input pauses episode instead of terminal failure", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    let seeded = buildEpisodePostMiAtVersion5("proj-strategy-waiting");
    for (let expected = 0; expected < 5; expected += 1) {
      const { newVersion } = simulatedDurableStore.upsertEpisode(
        { ...seeded, durableVersion: expected === 0 ? undefined : expected },
        expected
      );
      seeded = { ...seeded, durableVersion: newVersion };
    }

    const adapter: ProjectBrainExecutionAdapter = {
      async execute(input) {
        if (input.brainId === "strategy") {
          return {
            brainId: "strategy",
            status: "waiting_for_input",
            output: null,
            events: [],
            confidence: null,
            durationMs: 12,
            errorCode: "readiness_insufficient",
            readinessReasonCodes: ["missing_uniqueValueProposition"],
            requiresApproval: false,
            approvalKind: null,
          } satisfies BrainResult<BrainOutput>;
        }
        return {
          brainId: input.brainId,
          status: "completed",
          output: {
            outputRef: `${input.brainId}:ref`,
            capabilityIds: ["test"],
            decisionIds: [],
            generatedAt: new Date().toISOString(),
          },
          events: [],
          confidence: null,
          durationMs: 1,
          errorCode: null,
          requiresApproval: false,
          approvalKind: null,
        };
      },
    };

    const runner = createProjectEpisodeRunner(undefined, durable, adapter);
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-strategy-waiting",
      peerId: "demo",
      maxSteps: 3,
    });

    expect(result.status).toBe("waiting_for_context");
    expect(result.episode.episodeStatus).toBe("waiting_for_context");
    expect(result.episode.snapshot.state).not.toBe("failed");
    expect(result.episode.lastError).toBe("missing_uniqueValueProposition");
    expect(simulatedDurableStore.getEpisode(ORG, "proj-strategy-waiting")?.episode.episodeStatus).toBe(
      "waiting_for_context"
    );

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string });
    expect(orchLines.some((line) => line.event === "episode_runner_brain_waiting_for_context")).toBe(true);
    infoSpy.mockRestore();
  });

  it("genuine strategy failure still ends episode failed", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    let seeded = buildEpisodePostMiAtVersion5("proj-strategy-failed");
    for (let expected = 0; expected < 5; expected += 1) {
      const { newVersion } = simulatedDurableStore.upsertEpisode(
        { ...seeded, durableVersion: expected === 0 ? undefined : expected },
        expected
      );
      seeded = { ...seeded, durableVersion: newVersion };
    }

    const adapter: ProjectBrainExecutionAdapter = {
      async execute(input) {
        if (input.brainId === "strategy") {
          return {
            brainId: "strategy",
            status: "failed",
            output: null,
            events: [],
            confidence: null,
            durationMs: 12,
            errorCode: "capability_failed",
            requiresApproval: false,
            approvalKind: null,
          };
        }
        return {
          brainId: input.brainId,
          status: "completed",
          output: {
            outputRef: `${input.brainId}:ref`,
            capabilityIds: ["test"],
            decisionIds: [],
            generatedAt: new Date().toISOString(),
          },
          events: [],
          confidence: null,
          durationMs: 1,
          errorCode: null,
          requiresApproval: false,
          approvalKind: null,
        };
      },
    };

    const runner = createProjectEpisodeRunner(undefined, durable, adapter);
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-strategy-failed",
      peerId: "demo",
      maxSteps: 3,
    });

    expect(result.status).toBe("failed");
    expect(result.episode.episodeStatus).toBe("failed");
    expect(result.episode.snapshot.state).toBe("failed");
    expect(result.episode.lastError).toBe("capability_failed");
  });

  it("I: enriched post-MI episode completes strategy without terminal failure", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const enrichedGraphs: ProjectEpisodeRecord["resolvedGraphs"] = {
      researchBrainGraph: {
        version: "1.0.0",
        organizationId: ORG,
        projectId: "proj-strategy-enriched",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        objective: {
          id: "obj-1",
          statement: "Understand market",
          domains: ["audience"],
          successCriteria: [],
          constraints: [],
          evidenceIds: [],
        },
        plan: {
          id: "plan-1",
          questions: [],
          domains: ["audience"],
          budget: {
            maxSources: 1,
            maxRequests: 1,
            maxPages: 1,
            maxCompetitors: 1,
            maxDurationMs: 1,
            costBudget: 1,
          },
          stopConditions: [],
        },
        sources: [],
        findings: [],
        evidence: [],
        citations: [],
        comparisons: [],
        patterns: [],
        contradictions: [],
        opportunities: [],
        risks: [],
        proposedUpdates: [],
        competitorProfiles: [{ id: "comp-1", name: "Legacy Agency Co", website: null, positioning: null, offer: null, pricingSignals: [], primaryMessages: [], proofPoints: [], confidence: "medium" }],
        marketSignals: [],
        audienceInsights: [{ id: "aud-1", segment: "Marketing leaders", painPoints: [], motivations: [], objections: [], purchaseTriggers: [], languageUsed: [], trustDrivers: [], confidence: "medium" }],
        positioningInsights: [],
        searchInsights: [],
        unresolvedQuestions: [],
        summary: {
          headline: "Research complete",
          findingCount: 1,
          evidenceCount: 1,
          contradictionCount: 0,
          proposalCount: 0,
          unresolvedCount: 0,
        },
        confidence: "medium",
        budgetState: {
          sourcesUsed: 1,
          requestsUsed: 1,
          pagesUsed: 1,
          competitorsUsed: 1,
          durationMs: 1,
          costUsed: 0,
        },
      },
      marketingIntelligenceBrainGraph: {
        version: "1.0.0",
        organizationId: ORG,
        projectId: "proj-strategy-enriched",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        companyGraphVersion: "1",
        researchGraphVersion: "1",
        reasoningGraphVersion: "1",
        evidence: [],
        businessContext: {
          organizationSummary: "Acme",
          goals: ["Generate leads"],
          constraints: [],
          projectObjective: "Launch",
          evidenceIds: [],
        },
        audienceIntelligence: [{ segment: "Marketing leaders", importance: "high", intentLevel: "high", coreProblem: "Growth", primaryMotivation: "Pipeline", keyObjections: [], trustBuilders: [], preferredChannels: [], messageSensitivity: "medium", evidenceIds: [], confidence: "medium" }],
        marketIntelligence: [],
        competitiveMarketing: [{ competitorId: "comp-1", name: "Legacy Agency Co", channelPresence: [], messagingShare: null, campaignThemes: [], positioningCluster: null, offerPatterns: [], ctaPatterns: [], contentThemes: [], creativePatterns: [], proofUsage: [], marketSaturation: "medium", visibleWeaknesses: [], visibleWhitespace: [], confidence: "medium", evidenceIds: [] }],
        channelIntelligence: [],
        messagingIntelligence: {
          dominantMarketMessages: [],
          saturatedClaims: [],
          underusedMessages: [],
          trustThemes: [],
          proofRequirements: [],
          objectionThemes: [],
          emotionalDrivers: [],
          rationalDrivers: [],
          messageDifferentiation: ["Faster onboarding"],
          messageRisks: [],
          confidence: "medium",
          evidenceIds: [],
        },
        offerIntelligence: {
          clarity: "high",
          differentiation: "high",
          proof: "medium",
          riskReversal: "medium",
          urgency: "low",
          pricingTransparency: "medium",
          valueCommunication: "high",
          entryOffer: null,
          primaryConversionAction: null,
          strengths: ["Advisory retainers"],
          weaknesses: [],
          opportunities: [],
          risks: [],
          confidence: "medium",
          evidenceIds: [],
        },
        funnelIntelligence: [],
        contentIntelligence: {
          contentThemes: [],
          coverageGaps: [],
          formatOpportunities: [],
          authorityGaps: [],
          educationGaps: [],
          objectionContentGaps: [],
          proofGaps: [],
          comparisonContentOpportunities: [],
          searchIntentContentGaps: [],
          confidence: "medium",
          evidenceIds: [],
        },
        searchIntelligence: {
          commercialIntentClusters: [],
          informationalClusters: [],
          searchOpportunityThemes: [],
          contentGaps: [],
          competitiveSearchPressure: "medium",
          brandDemand: "medium",
          nonBrandDemand: "medium",
          questionThemes: [],
          conversionIntentTopics: [],
          confidence: "medium",
          evidenceIds: [],
        },
        paidMediaIntelligence: {
          channelSaturation: [],
          cpcSignals: [],
          creativePatterns: [],
          audienceAvailability: "medium",
          budgetEfficiency: "medium",
          confidence: "medium",
          evidenceIds: [],
        },
        organicIntelligence: {
          contentAuthority: "medium",
          searchVisibility: "medium",
          communityPresence: "medium",
          shareability: "medium",
          confidence: "medium",
          evidenceIds: [],
        },
        opportunitySignals: [],
        riskSignals: [],
        benchmarkContext: [],
        marketingPriorities: [],
        strategyInputs: {
          topAudienceSignals: [],
          topChannelSignals: [],
          topMessagingSignals: [],
          topMarketSignals: [],
          topCompetitiveSignals: [],
          topFunnelGaps: [],
          topOpportunities: [],
          topRisks: [],
          benchmarkContext: [],
          constraints: [],
          unknowns: [],
          confidence: "medium",
        },
        summary: {
          headline: "MI complete",
          opportunityCount: 1,
          riskCount: 0,
          priorityCount: 1,
          insufficientDataFlags: [],
        },
        confidence: "medium",
      },
    };

    let seeded = buildEpisodePostMiAtVersion5("proj-strategy-enriched", enrichedGraphs);
    for (let expected = 0; expected < 5; expected += 1) {
      const { newVersion } = simulatedDurableStore.upsertEpisode(
        { ...seeded, durableVersion: expected === 0 ? undefined : expected },
        expected
      );
      seeded = { ...seeded, durableVersion: newVersion };
    }

    let strategyInvoked = false;
    const adapter: ProjectBrainExecutionAdapter = {
      async execute(input) {
        if (input.brainId === "strategy") {
          strategyInvoked = true;
          expect(input.episode.resolvedGraphs.researchBrainGraph).toBeTruthy();
          expect(input.episode.resolvedGraphs.marketingIntelligenceBrainGraph).toBeTruthy();
          return {
            brainId: "strategy",
            status: "completed",
            output: {
              outputRef: "strategy:ref",
              capabilityIds: ["strategy"],
              decisionIds: [],
              generatedAt: new Date().toISOString(),
            },
            events: [],
            confidence: { value: 0.7, label: "medium" },
            durationMs: 20,
            errorCode: null,
            requiresApproval: false,
            approvalKind: null,
          };
        }
        return {
          brainId: input.brainId,
          status: "completed",
          output: {
            outputRef: `${input.brainId}:ref`,
            capabilityIds: ["test"],
            decisionIds: [],
            generatedAt: new Date().toISOString(),
          },
          events: [],
          confidence: null,
          durationMs: 1,
          errorCode: null,
          requiresApproval: false,
          approvalKind: null,
        };
      },
    };

    const runner = createProjectEpisodeRunner(undefined, durable, adapter);
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-strategy-enriched",
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(strategyInvoked).toBe(true);
    expect(result.episode.snapshot.completedBrains).toContain("strategy");
    expect(result.episode.snapshot.state).not.toBe("failed");
    expect(result.episode.lastError).not.toBe("capability_failed");
    expect(result.episode.lastError).not.toBe("readiness_insufficient");
  });
});
