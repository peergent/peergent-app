import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence/types";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { assembleCompanyContextSync } from "@/lib/brain/context/company-context-assembler";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { executeWebsiteUnderstanding } from "@/lib/brain/capabilities/website-understanding";
import { executeCompetitorUnderstanding } from "@/lib/brain/capabilities/competitor-understanding";
import { campaignUsesExternalBrand, shouldUseOrganizationIntelligence } from "@/lib/office/campaign/campaign-brand-boundary";
import { emptyCompanyProfile } from "@/lib/brain/company/profile";
import { fieldFromListValue, fieldFromValue } from "@/lib/brain/company/source-priority";
import { evaluateEffectiveStrategyContextReadiness } from "@/lib/brain/strategy-readiness";
import { buildWebsiteSnapshotFromAssessment } from "../build-website-snapshot-from-assessment";
import { materializeOrganizationKnowledge } from "../materialize-organization-knowledge";
import { normalizeOrganizationCompetitors } from "../materialize-organization-competitors";
import { resolveOrganizationWebsiteSnapshot } from "../resolve-organization-website";

const materializedRival = [{ name: "Rival One", source: "business_brain" as const }];

const ORG_A = "00000000-0000-4000-8000-000000000101";
const ORG_B = "00000000-0000-4000-8000-000000000102";

const wiMocks = vi.hoisted(() => ({
  fetchLatestWebsiteIntelligenceAssessment: vi.fn(),
}));

const marketingMocks = vi.hoisted(() => ({
  loadMarketingUnderstandingContext: vi.fn(),
}));

const bbMocks = vi.hoisted(() => ({
  getAggregate: vi.fn(),
}));

vi.mock("@/lib/website-intelligence/persistence", () => ({
  fetchLatestWebsiteIntelligenceAssessment: wiMocks.fetchLatestWebsiteIntelligenceAssessment,
}));

vi.mock("@/lib/intelligence/adapters/marketing-understanding-adapter", () => ({
  loadMarketingUnderstandingContext: marketingMocks.loadMarketingUnderstandingContext,
}));

vi.mock("@/lib/business-brain", () => ({
  createBusinessBrainService: () => ({
    getAggregate: bbMocks.getAggregate,
  }),
}));

function sampleAssessment(url: string): WebsiteIntelligenceAssessment {
  return {
    meta: {
      url,
      companyName: "Sample Co",
      industry: "Software",
      analyzedAt: "2026-08-01T00:00:00.000Z",
      analysisVersion: "1",
    },
    confidenceSnapshot: {
      observed: 1,
      likely: 0,
      unknown: 0,
      requiresMoreData: 0,
      overall: "high",
      overallReason: "Observed website content",
    },
    executiveSummary: {
      conclusion: "Clear positioning on homepage",
      rationale: "Hero states value proposition",
      confidence: { level: "high", reason: "Direct observation" },
    },
    companyDna: {
      businessType: "B2B SaaS",
      targetCustomers: "SMBs",
      brandPresentation: "Professional",
      findings: [],
      confidence: { level: "moderate", reason: "Partial" },
    },
    customerJourney: {
      frictionPoints: [],
      opportunities: [],
      confidence: { level: "moderate", reason: "Partial" },
    },
    marketingGrowth: {
      observed: [],
      likely: [],
      unknown: [],
      enrichmentSlots: [],
      confidence: { level: "moderate", reason: "Partial" },
    },
    operations: {
      areas: [],
      enrichmentSlots: [],
      confidence: { level: "low", reason: "Limited" },
    },
    workforceRecommendations: {
      recommendations: [],
      confidence: { level: "low", reason: "Limited" },
    },
    businessBrainConclusion: {
      statement: "Ready for marketing",
      primaryAction: { label: "Continue" },
      confidence: { level: "moderate", reason: "Partial" },
    },
  };
}

function understandingWithCompetitors(): MarketingUnderstanding {
  return {
    available: true,
    sparse: false,
    completeness: 25,
    gaps: [],
    brand: { values: [], toneOfVoice: {}, keyMessages: [] },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [
      {
        id: "comp-1",
        name: "Rival One",
        strengths: [],
        weaknesses: [],
        differentiators: [],
      },
    ],
    goals: [],
    existingContent: [],
    assembledAt: "2026-08-01T00:00:00.000Z",
    roleApplicable: true,
  } as MarketingUnderstanding & { roleApplicable?: boolean };
}

function createSupabaseMock(input: {
  organizationId: string;
  peerId?: string;
  peerWebsite?: string | null;
  brainSnapshot?: Record<string, unknown> | null;
}) {
  const peerWebsite = input.peerWebsite ?? null;

  return {
    from: (table: string) => {
      if (table === "peers") {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              if (col === "id") {
                return {
                  eq: (_col2: string, orgId: string) => ({
                    maybeSingle: async () => ({
                      data:
                        orgId === input.organizationId && val === (input.peerId ?? "emma") && peerWebsite
                          ? { website: peerWebsite }
                          : null,
                      error: null,
                    }),
                  }),
                };
              }
              if (col === "organization_id") {
                return {
                  not: () => ({
                    limit: async () => ({
                      data:
                        val === input.organizationId && peerWebsite
                          ? [{ website: peerWebsite }]
                          : [],
                      error: null,
                    }),
                  }),
                };
              }
              throw new Error(`Unexpected peers.eq column ${col}`);
            },
          }),
        };
      }
      if (table === "brain_snapshots") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data:
                        val === input.organizationId && input.brainSnapshot
                          ? { payload: input.brainSnapshot, freshness: "fresh", created_at: "2026-08-01T00:00:00.000Z" }
                          : null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
  } as unknown as import("@/lib/intelligence/api/org-context").AppSupabaseClient;
}

describe("PX-50.16 OrgKnowledgeMaterializer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bbMocks.getAggregate.mockResolvedValue({
      knowledgeSources: [],
      competitors: [],
    });
    marketingMocks.loadMarketingUnderstandingContext.mockResolvedValue({
      slice: { available: false, competitors: [] },
      sources: [],
    });
  });

  it("A: Website Intelligence assessment materializes CompanySnapshot.website", async () => {
    wiMocks.fetchLatestWebsiteIntelligenceAssessment.mockResolvedValue({
      assessment: sampleAssessment("https://org-a.example"),
      analyzedAt: "2026-08-01T00:00:00.000Z",
      source: "supabase",
    });

    const supabase = createSupabaseMock({ organizationId: ORG_A, peerWebsite: null });
    const resolved = await resolveOrganizationWebsiteSnapshot({
      supabase,
      organizationId: ORG_A,
    });

    expect(resolved.sourceKind).toBe("website_intelligence");
    expect(resolved.snapshot?.source.url).toBe("https://org-a.example");
    expect(resolved.analysisAvailable).toBe(true);

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      websiteSnapshot: resolved.snapshot,
      locale: "en",
    });

    expect(assembly.companySnapshot.website?.source.url).toBe("https://org-a.example");
  });

  it("B: website_understanding does not emit website_unavailable when org WI exists", () => {
    const snapshot = buildWebsiteSnapshotFromAssessment({
      organizationId: ORG_A,
      assessment: sampleAssessment("https://org-a.example"),
      analyzedAt: "2026-08-01T00:00:00.000Z",
      sourceUrl: "https://org-a.example",
    });

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      websiteSnapshot: snapshot,
      locale: "en",
    });

    const output = executeWebsiteUnderstanding({
      companySnapshot: assembly.companySnapshot,
      websiteSnapshot: assembly.companySnapshot.website,
      locale: "en",
    });

    expect(output.warnings.some((w) => w.code === "website_unavailable")).toBe(false);
    expect(output.findings.length).toBeGreaterThan(0);
  });

  it("C: peer website fallback materializes when WI absent", async () => {
    wiMocks.fetchLatestWebsiteIntelligenceAssessment.mockResolvedValue(null);
    const supabase = createSupabaseMock({
      organizationId: ORG_A,
      peerId: "emma",
      peerWebsite: "https://peer.example",
    });

    const resolved = await resolveOrganizationWebsiteSnapshot({
      supabase,
      organizationId: ORG_A,
      peerId: "emma",
    });

    expect(resolved.sourceKind).toBe("peer_configured");
    expect(resolved.snapshot?.source.url).toBe("https://peer.example");
  });

  it("D: unknown website remains unknown without durable sources", async () => {
    wiMocks.fetchLatestWebsiteIntelligenceAssessment.mockResolvedValue(null);
    const supabase = createSupabaseMock({ organizationId: ORG_A, peerWebsite: null });

    const resolved = await resolveOrganizationWebsiteSnapshot({
      supabase,
      organizationId: ORG_A,
    });

    expect(resolved.snapshot).toBeNull();
    expect(resolved.sourceKind).toBe("unknown");
  });

  it("E: Business Brain competitors populate profile.mainCompetitors", () => {
    const understanding = understandingWithCompetitors();
    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: understanding,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value).toEqual(["Rival One"]);
  });

  it("F: competitor_understanding emits findings from Business Brain competitors", () => {
    const understanding = understandingWithCompetitors();
    const campaignContext = buildCampaignContextFromCreateInput(
      createMarketingCampaignProject({
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Launch",
        goalLabel: "Leads",
        description: "Grow pipeline",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      }),
      {
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Launch",
        goalLabel: "Leads",
        description: "Grow pipeline",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "en"
    );

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: understanding,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext,
      locale: "en",
    });

    const output = executeCompetitorUnderstanding({
      companySnapshot: assembly.companySnapshot,
      campaignContext,
      locale: "en",
    });

    expect(output.warnings.some((w) => w.code === "competitors_missing")).toBe(false);
    expect(output.findings.some((f) => f.value.includes("Rival One"))).toBe(true);
  });

  it("G: external-brand isolation blocks org competitors when brand differs from org", () => {
    expect(
      campaignUsesExternalBrand({
        brandName: "External Client",
        accountOrganizationName: "Peergent",
        isSeedCampaign: false,
      })
    ).toBe(true);

    expect(
      shouldUseOrganizationIntelligence({
        usesExternalBrand: true,
        isSeedCampaign: false,
      })
    ).toBe(false);

    const understanding = understandingWithCompetitors();
    const campaignContext = {
      ...buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "External Client Campaign",
          goalLabel: "Leads",
          description: "Campaign for another brand",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "External Client Campaign",
          goalLabel: "Leads",
          description: "Campaign for another brand",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      usesExternalBrand: true,
      accountOrganizationName: "Peergent",
    };

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: understanding,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext,
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value ?? []).toEqual([]);
  });

  it("PX-50.18 A: materialized competitors populate profile without Marketing Understanding", () => {
    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value).toEqual(["Rival One"]);
  });

  it("PX-50.18 E: explicit campaign competitors win over materialized org competitors", () => {
    const campaignContext = {
      ...buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      competitors: [{ name: "Campaign Rival" }],
    };

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext,
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value).toEqual(["Campaign Rival"]);
  });

  it("PX-50.18 F: whitespace Business Brain competitor names are not materialized", () => {
    expect(normalizeOrganizationCompetitors([{ name: "   " }, { name: "Valid Rival" }])).toEqual([
      { name: "Valid Rival", source: "business_brain" },
    ]);

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      materializedOrganizationCompetitors: normalizeOrganizationCompetitors([{ name: "   " }]),
      websiteSnapshot: null,
      campaignContext: buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value ?? []).toEqual([]);
  });

  it("PX-50.18 G: multi-tenant competitor isolation", () => {
    const assemblyA = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Org A Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Org A Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      locale: "en",
    });

    const assemblyB = assembleCompanyContextSync({
      organizationId: ORG_B,
      marketingUnderstanding: null,
      materializedOrganizationCompetitors: [{ name: "Other Org Rival", source: "business_brain" }],
      websiteSnapshot: null,
      campaignContext: buildCampaignContextFromCreateInput(
        createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Org B Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        }),
        {
          peerId: "emma",
          ownerLabel: "Owner",
          name: "Org B Launch",
          goalLabel: "Leads",
          description: "Grow pipeline",
          primaryGoalId: "generate_leads",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
        },
        "en"
      ),
      locale: "en",
    });

    expect(assemblyA.companySnapshot.profile.mainCompetitors.value).toEqual(["Rival One"]);
    expect(assemblyB.companySnapshot.profile.mainCompetitors.value).toEqual(["Other Org Rival"]);
    expect(assemblyA.companySnapshot.organizationId).toBe(ORG_A);
    expect(assemblyB.companySnapshot.organizationId).toBe(ORG_B);
  });

  it("H: multi-tenant isolation — org A website never hydrates org B", async () => {
    wiMocks.fetchLatestWebsiteIntelligenceAssessment.mockImplementation(
      async (_supabase, organizationId: string) =>
        organizationId === ORG_A
          ? {
              assessment: sampleAssessment("https://org-a.example"),
              analyzedAt: "2026-08-01T00:00:00.000Z",
              source: "supabase",
            }
          : null
    );

    const supabaseA = createSupabaseMock({ organizationId: ORG_A, peerWebsite: null });
    const supabaseB = createSupabaseMock({ organizationId: ORG_B, peerWebsite: null });

    const a = await resolveOrganizationWebsiteSnapshot({ supabase: supabaseA, organizationId: ORG_A });
    const b = await resolveOrganizationWebsiteSnapshot({ supabase: supabaseB, organizationId: ORG_B });

    expect(a.snapshot?.source.url).toBe("https://org-a.example");
    expect(b.snapshot).toBeNull();
  });

  it("I: strategy readiness passes website/competitor dimensions with durable org knowledge", () => {
    const snapshot = buildWebsiteSnapshotFromAssessment({
      organizationId: ORG_A,
      assessment: sampleAssessment("https://org-a.example"),
      analyzedAt: "2026-08-01T00:00:00.000Z",
      sourceUrl: "https://org-a.example",
    });

    const campaignContext = buildCampaignContextFromCreateInput(
      createMarketingCampaignProject({
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Automatic Launch",
        goalLabel: "Leads",
        description: "Grow qualified leads for Dutch SMEs.",
        primaryGoalId: "generate_leads",
        targetAudience: "Dutch SMEs",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      }),
      {
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Automatic Launch",
        goalLabel: "Leads",
        description: "Grow qualified leads for Dutch SMEs.",
        primaryGoalId: "generate_leads",
        targetAudience: "Dutch SMEs",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "en"
    );

    const understanding = {
      ...understandingWithCompetitors(),
      customerSegments: [
        {
          id: "seg-1",
          name: "Dutch SMEs",
          description: "Small businesses",
          painPoints: [],
          buyingTriggers: [],
        },
      ],
      brand: {
        values: [],
        toneOfVoice: {},
        keyMessages: [],
        positioningStatement: "AI workforce platform",
        valueProposition: "Hire AI colleagues",
      },
      products: [{ id: "p1", name: "Platform", description: "Core product" }],
    } as MarketingUnderstanding;

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: understanding,
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: snapshot,
      campaignContext,
      locale: "en",
    });

    const at = new Date().toISOString();
    const enrichedProfile = {
      ...assembly.companySnapshot.profile,
      industry: fieldFromValue("Software", "integration", { lastUpdatedAt: at }),
      uniqueSellingPoints: fieldFromListValue(["AI colleagues"], "integration", { lastUpdatedAt: at }),
    };

    const readiness = evaluateEffectiveStrategyContextReadiness({
      campaignContext,
      companyProfile: enrichedProfile,
      companyWebsiteSnapshot: assembly.companySnapshot.website,
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        website_understanding: executeWebsiteUnderstanding({
          companySnapshot: assembly.companySnapshot,
          websiteSnapshot: assembly.companySnapshot.website,
          locale: "en",
        }),
        competitor_understanding: executeCompetitorUnderstanding({
          companySnapshot: assembly.companySnapshot,
          campaignContext,
          locale: "en",
        }),
      },
    });

    expect(readiness.machineReasonCodes).not.toContain("website_decision_missing");
    expect(readiness.machineReasonCodes).not.toContain("competitor_decision_missing");
  });

  it("J: genuine missing knowledge still blocks strategy readiness", () => {
    const campaignContext = buildCampaignContextFromCreateInput(
      createMarketingCampaignProject({
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Sparse Launch",
        goalLabel: "Leads",
        description: "Grow pipeline",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      }),
      {
        peerId: "emma",
        ownerLabel: "Owner",
        name: "Sparse Launch",
        goalLabel: "Leads",
        description: "Grow pipeline",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "en"
    );

    const assembly = assembleCompanyContextSync({
      organizationId: ORG_A,
      marketingUnderstanding: null,
      websiteSnapshot: null,
      campaignContext,
      locale: "en",
    });

    const readiness = evaluateEffectiveStrategyContextReadiness({
      campaignContext,
      companyProfile: assembly.companySnapshot.profile,
      companyWebsiteSnapshot: null,
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        website_understanding: executeWebsiteUnderstanding({
          companySnapshot: assembly.companySnapshot,
          websiteSnapshot: null,
          locale: "en",
        }),
        competitor_understanding: executeCompetitorUnderstanding({
          companySnapshot: assembly.companySnapshot,
          campaignContext,
          locale: "en",
        }),
      },
    });

    expect(readiness.machineReasonCodes).toContain("website_decision_missing");
    expect(readiness.machineReasonCodes).toContain("competitor_decision_missing");
  });

  it("materializer combines website intelligence and Business Brain competitors", async () => {
    wiMocks.fetchLatestWebsiteIntelligenceAssessment.mockResolvedValue({
      assessment: sampleAssessment("https://org-a.example"),
      analyzedAt: "2026-08-01T00:00:00.000Z",
      source: "supabase",
    });
    bbMocks.getAggregate.mockResolvedValue({
      knowledgeSources: [],
      competitors: [{ name: "Rival One", website: null }],
    });
    marketingMocks.loadMarketingUnderstandingContext.mockResolvedValue({
      slice: { available: false, competitors: [] },
      sources: [],
    });

    const supabase = createSupabaseMock({ organizationId: ORG_A, peerWebsite: null });
    const materialized = await materializeOrganizationKnowledge({
      supabase,
      organizationId: ORG_A,
      peerRole: "marketing",
    });

    expect(materialized.websiteSourceKind).toBe("website_intelligence");
    expect(materialized.websiteKnowledgeAvailable).toBe(true);
    expect(materialized.competitorRowCount).toBe(1);
    expect(materialized.competitorNamedCount).toBe(1);
    expect(materialized.competitorMaterializedCount).toBe(1);
    expect(materialized.competitors[0]?.name).toBe("Rival One");
  });

  it("unknown account org name does not force external-brand isolation", () => {
    expect(
      campaignUsesExternalBrand({
        brandName: "Automatic Campaign",
        accountOrganizationName: null,
        isSeedCampaign: false,
      })
    ).toBe(false);
  });
});
