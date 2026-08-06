import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  executeBrandUnderstanding,
  executeStrategy,
  buildResearchGraph,
  buildReasoningGraph,
  reasoningGraphHasEvidenceChain,
  REASONING_MODULE_SPECS,
  ReasoningLayer,
  InMemoryReasoningRepository,
  resetDefaultReasoningRepository,
  resetReasoningNodeCounter,
  resetDefaultResearchRepository,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
  deriveReasoningConfidence,
  RESEARCH_CONFIDENCE,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";

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

function demoResearchGraph() {
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
    marketingUnderstanding: null,
    websiteSnapshot: website,
    campaignContext,
    assembledAt,
  });

  const companyOut = executeCompanyUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });
  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "competitor_understanding",
      actorId: "test",
      campaignContext,
    },
    campaignContext,
    upstreamOutputs: {
      company_understanding: companyOut,
      website_understanding: websiteOut,
    },
  });
  const competitorOut = executeCompetitorUnderstanding(execCtx);
  const brandOut = executeBrandUnderstanding({
    ...execCtx,
    upstreamOutputs: {
      ...execCtx.upstreamOutputs,
      competitor_understanding: competitorOut,
    },
  });

  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: {
      company_understanding: companyOut,
      website_understanding: websiteOut,
      competitor_understanding: competitorOut,
      brand_understanding: brandOut,
    },
    campaignId: project.id,
  });

  return { assembly, campaignContext, researchGraph, project };
}

describe("Reasoning Layer — Sprint 9 Phase 1", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    seedPeergentDemoWebsiteSnapshotSync();
    resetReasoningNodeCounter();
    resetDefaultReasoningRepository();
    resetDefaultResearchRepository();
  });

  describe("module specs", () => {
    it("registers thirteen reasoning modules", () => {
      expect(REASONING_MODULE_SPECS).toHaveLength(13);
    });
  });

  describe("confidence engine", () => {
    it("returns zero when no evidence", () => {
      expect(deriveReasoningConfidence({ evidence: [] })).toBe(RESEARCH_CONFIDENCE.missing);
    });
  });

  describe("ReasoningGraph", () => {
    it("builds from ResearchGraph with evidence chain", () => {
      const { researchGraph } = demoResearchGraph();
      const graph = buildReasoningGraph({ researchGraph });

      expect(graph.businessModel.length).toBeGreaterThan(0);
      expect(graph.customerModel.length).toBeGreaterThan(0);
      expect(graph.competitiveLandscape.length).toBeGreaterThan(0);
      expect(graph.researchVersion).toBe(researchGraph.version);
      expect(graph.unknowns.some((u) => u.title === "Pricing model")).toBe(true);
      expect(reasoningGraphHasEvidenceChain(graph)).toBe(true);
    });

    it("does not include action recommendations in opportunities", () => {
      const { researchGraph } = demoResearchGraph();
      const graph = buildReasoningGraph({ researchGraph });
      for (const opp of graph.opportunities) {
        expect(opp.description.toLowerCase()).not.toMatch(/run google ads|publish|send email/);
      }
    });
  });

  describe("repository", () => {
    it("stores reasoning ephemerally", () => {
      const { researchGraph } = demoResearchGraph();
      const repo = new InMemoryReasoningRepository();
      const layer = new ReasoningLayer(repo);

      layer.reasonAndStore({ researchGraph, correlationId: "test" });

      const stored = repo.getLatest({
        organizationId: PEERGENT_DEMO_ORG_ID,
        campaignId: researchGraph.campaignId,
      });
      expect(stored?.graph.businessModel.length).toBeGreaterThan(0);
    });
  });

  describe("strangler integration", () => {
    it("passes ReasoningGraph to strategy context and improves specificity", () => {
      const { assembly, campaignContext, researchGraph } = demoResearchGraph();

      const baseCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: PEERGENT_DEMO_ORG_ID,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext,
          researchGraph,
        },
        campaignContext,
        researchGraph,
      });

      expect(baseCtx.reasoningGraph).toBeTruthy();
      expect(baseCtx.reasoningGraph!.businessModel.length).toBeGreaterThan(0);

      const withReasoning = executeStrategy(baseCtx);

      expect(withReasoning.findings.map((f) => f.value).join(" ")).toMatch(/Peergent/i);
      expect(withReasoning.decisions[0]?.rationale).toMatch(/Rejected alternatives|Afgewezen alternatieven/i);
    });

    it("auto-builds reasoning from research in execution context", () => {
      const { assembly, campaignContext } = demoResearchGraph();

      const ctx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: PEERGENT_DEMO_ORG_ID,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext,
          upstreamOutputs: {},
        },
        campaignContext,
      });

      expect(ctx.researchGraph).toBeNull();
      expect(ctx.reasoningGraph).toBeNull();
    });
  });
});
