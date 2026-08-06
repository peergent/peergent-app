import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeBrandUnderstanding,
  executeWebsiteUnderstanding,
  PEERGENT_DEMO_ORG_ID,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  ALL_BRAND_CONCEPT_IDS,
  BRAND_CONCEPT_DEFINITIONS,
  BRAND_LAYER_VERSION,
  BRAND_RESEARCH_MODULE_SPECS,
  BrandLayer,
  InMemoryBrandRepository,
  brandModelHasConfidence,
  brandResearchGraphHasProvenance,
  buildBrandGraph,
  buildBrandResearchGraph,
  createBrandBoundary,
  createBrandResearchObservation,
  exposeBrandBrainToConsumer,
  getDefaultBrandRepository,
  queryBrandFactsByStatus,
  resetBrandFactCounter,
  resetBrandObservationCounter,
  resetBrandUnknownCounter,
  resetDefaultBrandRepository,
} from "@/lib/brain/layers/brand";

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

describe("Brand Brain Layer — Sprint 10.0", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    seedPeergentDemoWebsiteSnapshotSync();
    resetBrandObservationCounter();
    resetBrandUnknownCounter();
    resetBrandFactCounter();
    resetDefaultBrandRepository();
  });

  describe("brand concepts", () => {
    it("defines all required brand concepts", () => {
      expect(BRAND_CONCEPT_DEFINITIONS.length).toBe(24);
      expect(ALL_BRAND_CONCEPT_IDS).toContain("mission");
      expect(ALL_BRAND_CONCEPT_IDS).toContain("tone_of_voice");
      expect(ALL_BRAND_CONCEPT_IDS).toContain("color_system");
      expect(ALL_BRAND_CONCEPT_IDS).toContain("brand_rules");
      expect(ALL_BRAND_CONCEPT_IDS).not.toContain("pixel_density" as never);
    });
  });

  describe("brand research evidence model", () => {
    it("requires provenance on every observation", () => {
      const obs = createBrandResearchObservation({
        concept: "tone_of_voice",
        title: "Tone of voice",
        evidence: "Confident, calm, editorial.",
        source: { kind: "company_profile", refId: "org-1:tone" },
        confidence: 0.9,
      });
      expect(obs.source.refId).toBeTruthy();
      expect(obs.collectedAt).toBeTruthy();
      expect(obs.version).toBe(BRAND_LAYER_VERSION);
      expect(obs.evidence).toBe("Confident, calm, editorial.");
    });

    it("does not convert evidence directly into truth in research graph", () => {
      const { assembly, campaignContext } = demoAssembly();
      const brandOutput = executeBrandUnderstanding({
        companySnapshot: assembly.companySnapshot,
        marketingUnderstanding: assembly.marketingUnderstanding,
        locale: "en",
      });
      const research = buildBrandResearchGraph({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
        upstreamOutputs: { brand_understanding: brandOutput },
      });

      expect(research.observations.length).toBeGreaterThan(0);
      expect(brandResearchGraphHasProvenance(research)).toBe(true);
      expect(research.unknowns.length).toBeGreaterThan(0);
      expect(research.observations.every((o) => o.evidence.length > 0)).toBe(true);
    });
  });

  describe("brand model", () => {
    it("distinguishes observed from unknown knowledge status", () => {
      const { assembly, campaignContext } = demoAssembly();
      const brandOutput = executeBrandUnderstanding({
        companySnapshot: assembly.companySnapshot,
        marketingUnderstanding: assembly.marketingUnderstanding,
        locale: "en",
      });
      const research = buildBrandResearchGraph({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
        upstreamOutputs: { brand_understanding: brandOutput },
      });
      const graph = buildBrandGraph({ researchGraph: research });

      const observed = queryBrandFactsByStatus(graph, "observed");
      const unknown = queryBrandFactsByStatus(graph, "unknown");

      expect(observed.length).toBeGreaterThan(0);
      expect(unknown.length).toBeGreaterThan(0);
      expect(brandModelHasConfidence(graph)).toBe(true);
      expect(graph.model.facts).toHaveLength(ALL_BRAND_CONCEPT_IDS.length);
    });

    it("carries confidence on every brand fact", () => {
      const { assembly, campaignContext } = demoAssembly();
      const research = buildBrandResearchGraph({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
      });
      const graph = buildBrandGraph({ researchGraph: research });

      for (const fact of graph.model.facts) {
        expect(fact.confidence).toBeGreaterThanOrEqual(0);
        expect(fact.confidence).toBeLessThanOrEqual(1);
        expect(["observed", "inferred", "validated", "assumed", "unknown"]).toContain(
          fact.knowledgeStatus
        );
      }
    });
  });

  describe("repository", () => {
    it("stores and retrieves brand graphs by organization", () => {
      const { assembly, campaignContext, project } = demoAssembly();
      const repo = new InMemoryBrandRepository();
      const layer = new BrandLayer(repo);

      const result = layer.collectAndStore({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
      });

      const latest = layer.getLatestGraph({
        organizationId: PEERGENT_DEMO_ORG_ID,
        campaignId: project.id,
      });
      expect(latest?.version).toBe(BRAND_LAYER_VERSION);
      expect(latest?.research.observations.length).toBe(result.research.observations.length);
      expect(latest?.model.facts.length).toBe(ALL_BRAND_CONCEPT_IDS.length);
    });
  });

  describe("brand boundary", () => {
    it("exposes safe read-only views to consumer Brains", () => {
      const { assembly, campaignContext, website } = demoAssembly();
      const websiteOutput = executeWebsiteUnderstanding({
        companySnapshot: assembly.companySnapshot,
        websiteSnapshot: website,
        locale: "en",
      });
      const graph = buildBrandGraph({
        researchGraph: buildBrandResearchGraph({
          companySnapshot: assembly.companySnapshot,
          campaignContext,
          upstreamOutputs: { website_understanding: websiteOutput },
        }),
      });

      const boundary = createBrandBoundary(graph);
      const snapshot = boundary.toSnapshot();

      expect(snapshot.knownConceptCount).toBeGreaterThan(0);
      expect(snapshot.facts.every((f) => !("supportingObservationIds" in f))).toBe(true);

      const creative = boundary.forConsumer("creative");
      const pixel = boundary.forConsumer("pixel");

      expect(creative.some((f) => f.concept === "tone_of_voice" || f.concept === "messaging")).toBe(
        true
      );
      expect(pixel.every((f) =>
        ["visual_identity", "color_system", "typography", "spacing", "photography", "illustration", "motion", "buttons", "icons", "cta_style", "layouts"].includes(f.concept)
          ? f.knowledgeStatus === "unknown" || f.knowledgeStatus === "observed"
          : true
      )).toBe(true);
    });

    it("scopes consumer access without exposing internal implementation", () => {
      const { assembly, campaignContext } = demoAssembly();
      const graph = buildBrandGraph({
        researchGraph: buildBrandResearchGraph({
          companySnapshot: assembly.companySnapshot,
          campaignContext,
        }),
      });

      const creativeView = exposeBrandBrainToConsumer(graph, "creative");
      const validationView = exposeBrandBrainToConsumer(graph, "validation");

      expect(creativeView.facts.length).toBeLessThanOrEqual(validationView.facts.length);
      expect(creativeView.facts.every((f) => f.label.length > 0)).toBe(true);
    });
  });

  describe("module specs", () => {
    it("registers brand research modules with extension points", () => {
      const implemented = BRAND_RESEARCH_MODULE_SPECS.filter((s) => s.implemented);
      const future = BRAND_RESEARCH_MODULE_SPECS.filter((s) => !s.implemented);

      expect(implemented.length).toBeGreaterThanOrEqual(3);
      expect(future.some((s) => s.id === "visual_identity_research")).toBe(true);
      expect(future.some((s) => s.id === "channel_style_research")).toBe(true);
    });
  });

  describe("independence from creative generation", () => {
    it("produces knowledge model only — no creative assets", () => {
      const { assembly, campaignContext } = demoAssembly();
      const layer = new BrandLayer(getDefaultBrandRepository());
      const { graph } = layer.buildGraph({
        companySnapshot: assembly.companySnapshot,
        campaignContext,
      });

      expect(graph.research).toBeDefined();
      expect(graph.model).toBeDefined();
      expect(JSON.stringify(graph)).not.toContain("advertisement");
      expect(JSON.stringify(graph)).not.toContain("imageUrl");
      expect(JSON.stringify(graph)).not.toContain("template");
    });
  });
});
