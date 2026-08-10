import { beforeEach, describe, expect, it } from "vitest";
import {
  buildValidationGraph,
  collectValidationGraph,
  createFromBrainInputs,
  validationBrainContract,
  resetDefaultValidationRepository,
  validateValidationGraph,
  VALIDATION_LAYER_VERSION,
  VALIDATION_MODULE_SPECS,
  publishValidationOutput,
} from "@/lib/brain/layers/validation";
import { buildCreativeGraph, resetDefaultCreativeRepository } from "@/lib/brain/layers/creative";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  executeStrategy,
  buildResearchGraph,
  buildReasoningGraph,
  buildMarketingIntelligenceGraph,
  buildStrategyGraph,
  buildDecisionsFromStrategyGraph,
  buildPlanningGraph,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";

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
  selectedChannels: ["LinkedIn"] as const,
};

function pipelineValidationInput() {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });

  const companyOut = executeCompanyUnderstanding({ companySnapshot: assembly.companySnapshot, locale: "en" });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });
  const competitorOut = executeCompetitorUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const upstreamOutputs = {
    company_understanding: companyOut,
    website_understanding: websiteOut,
    competitor_understanding: competitorOut,
  };

  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
    },
    campaignContext,
    upstreamOutputs,
    locale: "en",
  });

  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const reasoningGraph = buildReasoningGraph({ researchGraph, campaignContext });
  const miGraph = buildMarketingIntelligenceGraph({
    reasoningGraph,
    researchGraph,
    campaignContext,
    locale: "en",
  });
  const sources = resolveStrategySources({
    ...execCtx,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
  });
  const strategyGraph = buildStrategyGraph({
    sources,
    companySnapshot: execCtx.companySnapshot,
    campaignContext,
    locale: "en",
  });
  const decisions = buildDecisionsFromStrategyGraph({
    graph: strategyGraph,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const planningGraph = buildPlanningGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignId: project.id,
    campaignContext,
    strategyGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    locale: "en",
  });

  const creativeInput = {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
  };

  const creativeGraph = buildCreativeGraph(creativeInput);

  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    creativeGraph,
  };
}

describe("Validation Brain", () => {
  beforeEach(() => {
    resetDefaultValidationRepository();
    resetDefaultCreativeRepository();
  });

  it("defines nineteen validation domain specs", () => {
    expect(VALIDATION_MODULE_SPECS).toHaveLength(19);
    expect(VALIDATION_LAYER_VERSION).toBe("1.0.0");
  });

  it("builds a validation graph across all domains", () => {
    const input = pipelineValidationInput();
    const graph = buildValidationGraph(input);

    expect(graph.phases.length).toBeGreaterThanOrEqual(19);
    expect(graph.report.categories.length).toBeGreaterThanOrEqual(19);
    expect(graph.report.publicationReadiness).toBeDefined();
    expect(graph.report.overallScore.value).toBeGreaterThan(0);
    expect(graph.creativeGraphRef).toMatch(/^creative:/);
  });

  it("validates a complete validation graph", () => {
    const graph = buildValidationGraph(pipelineValidationInput());
    const validation = validateValidationGraph(graph);
    expect(validation.valid).toBe(true);
    expect(validation.score).toBeGreaterThan(70);
  });

  it("produces structured brain output with validationGraph", () => {
    const output = createFromBrainInputs(pipelineValidationInput());
    expect(output.outputRef).toMatch(/^validation:/);
    expect(output.structuredOutput.validationGraph).toBeDefined();
    expect(output.structuredOutput.findings.length).toBeGreaterThan(3);
    expect(output.structuredOutput.capabilityId).toBe("validation");
  });

  it("implements ProjectBrainContract", async () => {
    const input = pipelineValidationInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: {
        business: true,
        brand: true,
        website: true,
        products: false,
        competitors: true,
        goals: true,
        campaign: true,
      },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const result = await validationBrainContract.execute({
      brainId: "validation",
      context,
      payload: input,
      idempotencyKey: "test-key",
      retryAttempt: 0,
    });

    expect(result.brainId).toBe("validation");
    expect(result.status).toBe("completed");
    expect(result.output?.capabilityIds).toContain("validation");
    expect(result.events.length).toBeGreaterThanOrEqual(19);
  });

  it("registers in default project brain registry", () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.validation?.id).toBe("validation");
    expect(registry.validation?.requiredContextSlices).toContain("brand");
    expect(registry.creative?.id).toBe("creative");
  });

  it("never returns paragraphs only — issues are structured", () => {
    const graph = collectValidationGraph(pipelineValidationInput());
    for (const issue of graph.report.issues) {
      expect(issue.category).toBeDefined();
      expect(issue.severity).toBeDefined();
      expect(issue.reason.length).toBeGreaterThan(0);
      expect(issue.businessImpact.length).toBeGreaterThan(0);
      expect(issue.suggestedResolution.length).toBeGreaterThan(0);
      expect(typeof issue.blocking).toBe("boolean");
    }
  });

  it("blocks unsupported legal claims", () => {
    const input = pipelineValidationInput();
    const creativeWithClaim = {
      ...input.creativeGraph,
      messaging: input.creativeGraph.messaging.map((m, i) =>
        i === 0
          ? {
              ...m,
              headline: "Best in the Netherlands — guaranteed results",
              supportingMessage: m.supportingMessage,
            }
          : m
      ),
    };

    const graph = buildValidationGraph({ ...input, creativeGraph: creativeWithClaim });
    expect(graph.report.publicationReadiness).toBe("BLOCKED");
    expect(graph.report.issues.some((i) => i.category === "legal_claims" && i.blocking)).toBe(true);
  });

  it("publishes structured payload for downstream consumers", () => {
    const graph = buildValidationGraph(pipelineValidationInput());
    const published = publishValidationOutput({ graph, locale: "en" });
    expect(published.readinessLabel.length).toBeGreaterThan(0);
    expect(published.summary.overallScore).toBeGreaterThan(0);
    expect(published.approvedDeliverableIds.length).toBeGreaterThan(0);
  });

  it("fails when creative graph is missing", async () => {
    const input = pipelineValidationInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: { business: true, brand: true, website: true, products: false, competitors: true, goals: true, campaign: true },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const { creativeGraph: _, ...payloadWithoutCreative } = input;
    const result = await validationBrainContract.execute({
      brainId: "validation",
      context,
      payload: payloadWithoutCreative,
      idempotencyKey: "test-key",
      retryAttempt: 0,
    });

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("missing_creative_graph");
  });
});
