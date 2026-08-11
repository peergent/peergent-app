import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCompanyGraph,
  collectCompanyGraph,
  createFromBrainInputs,
  companyBrainContract,
  resetDefaultCompanyRepository,
  validateCompanyGraph,
  COMPANY_LAYER_VERSION,
  COMPANY_DOMAIN_SPECS,
  getDefaultCompanyRepository,
  buildCompanyRelations,
} from "@/lib/brain/layers/company";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
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
  selectedChannels: ["LinkedIn"] as const,
};

function pipelineCompanyInput() {
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

  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: {},
  });

  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    author: "test",
    changeReason: "Initial company graph",
  };
}

describe("Company Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
  });

  it("defines company domain specs", () => {
    expect(COMPANY_DOMAIN_SPECS.length).toBeGreaterThanOrEqual(20);
    expect(COMPANY_LAYER_VERSION).toBe("1.0.0");
  });

  it("creates organization graph with facts", () => {
    const input = pipelineCompanyInput();
    const graph = buildCompanyGraph(input);

    expect(graph.organizationId).toBe(PEERGENT_DEMO_ORG_ID);
    expect(graph.facts.length).toBeGreaterThan(5);
    expect(graph.nodes.length).toBeGreaterThan(3);
    expect(graph.sources.length).toBeGreaterThan(0);
  });

  it("owns brand facts from brand graph", () => {
    const input = pipelineCompanyInput();
    const graph = buildCompanyGraph(input);
    const brandFacts = graph.facts.filter(
      (f) => f.domain === "brand" || f.domain === "tone_of_voice" || f.domain === "writing_style"
    );
    expect(brandFacts.length).toBeGreaterThan(0);
    for (const fact of brandFacts) {
      expect(fact.sourceIds.length).toBeGreaterThan(0);
      expect(fact.evidence.length).toBeGreaterThan(0);
    }
  });

  it("validates graph integrity", () => {
    const graph = buildCompanyGraph(pipelineCompanyInput());
    const validation = validateCompanyGraph(graph);
    expect(validation.valid).toBe(true);
    expect(validation.score).toBeGreaterThan(70);
  });

  it("creates versioned company output", async () => {
    const output = createFromBrainInputs(pipelineCompanyInput());
    expect(output.outputRef).toMatch(/^company:/);
    expect(output.graph.versionMeta.version).toBe(1);
    expect(output.structuredOutput.companyGraph).toBeDefined();
    expect(output.structuredOutput.capabilityId).toBe("company_understanding");
  });

  it("increments version on subsequent store", () => {
    const input = pipelineCompanyInput();
    createFromBrainInputs(input);
    const second = createFromBrainInputs({
      ...input,
      changeReason: "Profile update",
    });
    expect(second.graph.versionMeta.version).toBe(2);
  });

  it("creates relations between domains", () => {
    const graph = buildCompanyGraph(pipelineCompanyInput());
    expect(graph.relations.length).toBeGreaterThan(0);
    const rebuilt = buildCompanyRelations(graph.facts);
    expect(rebuilt.length).toBeGreaterThan(0);
  });

  it("links facts to knowledge sources", () => {
    const graph = buildCompanyGraph({
      ...pipelineCompanyInput(),
      knowledgeSources: [
        {
          id: "src-pdf-1",
          kind: "uploaded_pdf",
          refId: "pdf:brand-guide",
          label: "Brand guide PDF",
          capturedAt: new Date().toISOString(),
        },
      ],
    });
    expect(graph.sources.some((s) => s.kind === "uploaded_pdf")).toBe(true);
    expect(graph.facts.some((f) => f.domain === "knowledge_sources")).toBe(true);
  });

  it("calculates confidence from fact quality", () => {
    const graph = buildCompanyGraph(pipelineCompanyInput());
    expect(["low", "medium", "high"]).toContain(graph.confidence);
    for (const fact of graph.facts) {
      expect(fact.confidence).toBeDefined();
      expect(fact.evidence.length).toBeGreaterThan(0);
    }
  });

  it("persists to repository with history", () => {
    createFromBrainInputs(pipelineCompanyInput());
    const repo = getDefaultCompanyRepository();
    const latest = repo.getLatest(PEERGENT_DEMO_ORG_ID);
    expect(latest).not.toBeNull();
    expect(latest!.history.entries.length).toBe(1);
    expect(repo.getVersion({ organizationId: PEERGENT_DEMO_ORG_ID, version: 1 })).not.toBeNull();
  });

  it("implements ProjectBrainContract", async () => {
    const input = pipelineCompanyInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId!,
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

    const result = await companyBrainContract.execute({
      brainId: "company",
      context,
      payload: input,
      idempotencyKey: "company-test",
      retryAttempt: 0,
    });

    expect(result.brainId).toBe("company");
    expect(result.status).toBe("completed");
    expect(result.output?.capabilityIds).toContain("company_understanding");
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("registers in default project brain registry", () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.company?.id).toBe("company");
    expect(registry.company?.requiredContextSlices).toContain("business");
  });

  it("never fabricates facts without source evidence", () => {
    const graph = collectCompanyGraph(pipelineCompanyInput());
    for (const fact of graph.facts) {
      expect(fact.sourceIds.length).toBeGreaterThan(0);
      expect(fact.evidence.length).toBeGreaterThan(0);
      expect(fact.title.length).toBeGreaterThan(0);
      expect(fact.value.length).toBeGreaterThan(0);
    }
  });

  it("maps output without UI campaign text", () => {
    const output = createFromBrainInputs(pipelineCompanyInput());
    expect(output.structuredOutput.findings.length).toBeGreaterThan(0);
    expect(output.structuredOutput.recommendations.length).toBe(0);
    const serialized = JSON.stringify(output.structuredOutput);
    expect(serialized).not.toContain("headline");
    expect(serialized).not.toContain("Publish now");
  });
});
