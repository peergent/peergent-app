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
  createResearchEvidence,
  createResearchUnknown,
  RESEARCH_CONFIDENCE,
  RESEARCH_MODULE_SPECS,
  researchGraphHasProvenance,
  ResearchLayer,
  InMemoryResearchRepository,
  resetDefaultResearchRepository,
  resetResearchEvidenceCounter,
  resetResearchUnknownCounter,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import {
  createResearchLayer,
  getDefaultResearchRepository,
} from "@/lib/brain/layers/research";

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

function demoAssembly() {
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
  return { assembly, website, campaignContext, project };
}

describe("Research Layer — Sprint 8 Phase 2", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    seedPeergentDemoWebsiteSnapshotSync();
    resetResearchEvidenceCounter();
    resetResearchUnknownCounter();
    resetDefaultResearchRepository();
  });

  describe("evidence model", () => {
    it("requires provenance on every evidence node", () => {
      const evidence = createResearchEvidence({
        title: "Company name",
        description: "Peergent",
        source: { kind: "company_profile", refId: "org-1" },
        confidence: RESEARCH_CONFIDENCE.websiteStatement,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1.0.0",
      });
      expect(evidence.source.refId).toBe("org-1");
      expect(evidence.validationStatus).toBe("pending");
      expect(evidence.confidence).toBe(0.95);
    });
  });

  describe("unknown model", () => {
    it("records missing knowledge with zero confidence", () => {
      const unknown = createResearchUnknown({
        title: "Pricing model",
        reason: "Website contains no pricing",
      });
      expect(unknown.confidence).toBe(RESEARCH_CONFIDENCE.missing);
      expect(unknown.title).toBe("Pricing model");
    });
  });

  describe("module specs", () => {
    it("registers nine research modules", () => {
      expect(RESEARCH_MODULE_SPECS).toHaveLength(9);
    });

    it("specifies purpose without recommendation outputs", () => {
      for (const spec of RESEARCH_MODULE_SPECS) {
        expect(spec.purpose.length).toBeGreaterThan(10);
      }
    });
  });

  describe("ResearchGraph", () => {
    it("builds from existing capability outputs with full provenance", () => {
      const { assembly, website, campaignContext, project } = demoAssembly();

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

      const graph = buildResearchGraph({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
        upstreamOutputs: {
          company_understanding: companyOut,
          website_understanding: websiteOut,
          competitor_understanding: competitorOut,
        },
        campaignId: project.id,
      });

      expect(graph.company.length).toBeGreaterThan(0);
      expect(graph.website.length).toBeGreaterThan(0);
      expect(graph.competitors.length).toBeGreaterThan(0);
      expect(graph.unknowns.some((u) => u.title === "Pricing model")).toBe(true);
      expect(researchGraphHasProvenance(graph)).toBe(true);
    });
  });

  describe("repository", () => {
    it("stores research independently from memory", () => {
      const repo = new InMemoryResearchRepository();
      const layer = new ResearchLayer(repo);
      const { assembly } = demoAssembly();
      const companyOut = executeCompanyUnderstanding({
        companySnapshot: assembly.companySnapshot,
        locale: "en",
      });

      layer.collectAndStore({
        companySnapshot: assembly.companySnapshot,
        upstreamOutputs: { company_understanding: companyOut },
        campaignId: "camp-1",
      });

      const stored = repo.getLatest({ organizationId: PEERGENT_DEMO_ORG_ID, campaignId: "camp-1" });
      expect(stored?.graph.company.length).toBeGreaterThan(0);
    });
  });

  describe("strangler integration", () => {
    it("passes ResearchGraph to strategy context", () => {
      const { assembly, website, campaignContext } = demoAssembly();

      const companyOut = executeCompanyUnderstanding({
        companySnapshot: assembly.companySnapshot,
        locale: "en",
      });
      const websiteOut = executeWebsiteUnderstanding({
        companySnapshot: assembly.companySnapshot,
        websiteSnapshot: website,
        locale: "en",
      });

      const baseCtx = buildCapabilityExecutionContext({
        assembly,
        request: {
          organizationId: PEERGENT_DEMO_ORG_ID,
          peerId: "demo",
          capabilityId: "strategy",
          actorId: "test",
          campaignContext,
        },
        campaignContext,
        upstreamOutputs: {
          company_understanding: companyOut,
          website_understanding: websiteOut,
        },
      });

      const brandOut = executeBrandUnderstanding(baseCtx);
      const upstreamOutputs = {
        company_understanding: companyOut,
        website_understanding: websiteOut,
        brand_understanding: brandOut,
      };

      const enrichedCtx = buildCapabilityExecutionContext({
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
      });

      expect(enrichedCtx.researchGraph).toBeTruthy();
      expect(enrichedCtx.researchGraph!.company.length).toBeGreaterThan(0);
      expect(enrichedCtx.reasoningGraph).toBeTruthy();

      const withGraph = executeStrategy(enrichedCtx);
      expect(withGraph.findings.length).toBe(19);
    });

    it("stores research graph in repository during collection", () => {
      const { assembly, campaignContext } = demoAssembly();
      const companyOut = executeCompanyUnderstanding({
        companySnapshot: assembly.companySnapshot,
        locale: "en",
      });

      const layer = createResearchLayer();
      const { graph } = layer.collectAndStore({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
        upstreamOutputs: { company_understanding: companyOut },
        campaignId: campaignContext.projectId,
        correlationId: "test-workflow",
      });

      const stored = getDefaultResearchRepository().getLatest({
        organizationId: PEERGENT_DEMO_ORG_ID,
        campaignId: campaignContext.projectId,
      });
      expect(stored?.graph.version).toBe(graph.version);
      expect(stored?.graph.company.length).toBeGreaterThan(0);
    });
  });
});
