import { beforeEach, describe, expect, it, vi } from "vitest";
import { assembleCompanyContextSync } from "@/lib/brain/context/company-context-assembler";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  campaignUsesExternalBrand,
  filterLeakedOrganizationFacts,
  inferCampaignBrandName,
  shouldUseOrganizationIntelligence,
} from "@/lib/office/campaign/campaign-brand-boundary";
import {
  evidenceBlocksWorkflowAdvance,
  buildEvidenceMissingCtas,
} from "@/lib/office/campaign/evidence-readiness";
import { evidencePrimaryActionLabel } from "@/lib/office/campaign/campaign-workflow-status";
import { formatMissingInformationMessage, localizeUnknownFieldKeys } from "@/lib/brain/context/missing-information";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import {
  persistLiveCampaignBrandContext,
  persistLiveCampaignBusinessAnalysisApproval,
} from "@/lib/office/campaign/live-campaign-context-store";
import {
  loadMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { buildPeergentCompanyProfile } from "@/lib/brain/demo/peergent-company-profile";
import { getDemoCampaignSnapshot, resetDemoCampaignStore } from "@/lib/office/demo/demo-campaign-store";
import { buildCompanySnapshot } from "@/lib/brain/company/snapshot-builder";

const PEER = "emma";
const PROJECT_ID = "live-camp-1";

function peergentUnderstanding(): MarketingUnderstanding {
  return {
    available: true,
    sparse: false,
    completeness: 0.9,
    gaps: [],
    brand: {
      positioningStatement: "Peergent positioneert AI-collega's voor marketingteams.",
      toneOfVoice: { summary: "Peergent tone: helder en premium.", traits: [], examples: [] },
      values: [],
      keyMessages: [],
    },
    products: [{ id: "p1", name: "Marketing Peer", description: "AI marketing colleague" }],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: new Date().toISOString(),
  };
}

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

function liveProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Meer demo-aanvragen voor You Charge.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Meer demo-aanvragen voor You Charge.",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
    ...overrides,
  };
}

describe("live campaign business analysis boundary", () => {
  beforeEach(() => {
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, { drafts: [], projects: [liveProject()] });
    resetDemoCampaignStore();
  });

  it("infers You Charge brand from campaign title", () => {
    expect(inferCampaignBrandName("You Charge Launch", liveProject().campaignSetup)).toBe("You Charge");
  });

  it("detects external brand for You Charge under Peergent account", () => {
    expect(
      campaignUsesExternalBrand({
        brandName: "You Charge",
        accountOrganizationName: "Peergent",
        isSeedCampaign: false,
      })
    ).toBe(true);
  });

  it("does not use organization intelligence for external-brand campaigns", () => {
    expect(
      shouldUseOrganizationIntelligence({ usesExternalBrand: true, isSeedCampaign: false })
    ).toBe(false);
  });

  it("does not merge Peergent MarketingUnderstanding into You Charge snapshot", () => {
    const project = liveProject();
    const ctx = buildCampaignContext({
      project,
      domainInput: { projects: [project], understanding: peergentUnderstanding() } as never,
    });

    const assembly = assembleCompanyContextSync({
      organizationId: "org-emma",
      marketingUnderstanding: peergentUnderstanding(),
      campaignContext: ctx,
      locale: "nl",
    });

    expect(assembly.companySnapshot.profile.companyName.value).toBe("You Charge");
    expect(assembly.companySnapshot.profile.positioning.value).toBeNull();
    expect(assembly.companySnapshot.profile.products.value).not.toContain("Marketing Peer");
  });

  it("uses saved campaign brand context instead of Peergent defaults", () => {
    persistLiveCampaignBrandContext(PEER, PROJECT_ID, {
      brandName: "You Charge",
      industry: "Energie",
      mission: "Duurzaam laden voor iedereen",
      uniqueSellingPoints: ["Snelle installatie"],
      productsAndServices: ["Laadpalen"],
      positioning: "Premium laadoplossingen",
      tone: "Betrouwbaar en toegankelijk",
      targetAudience: "Ondernemers met wagenpark",
    });

    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const ctx = buildCampaignContext({
      project,
      domainInput: { projects: [project], understanding: peergentUnderstanding() } as never,
    });
    const assembly = assembleCompanyContextSync({
      organizationId: "org-emma",
      marketingUnderstanding: peergentUnderstanding(),
      campaignContext: ctx,
      locale: "nl",
    });

    expect(assembly.companySnapshot.profile.industry.value).toBe("Energie");
    expect(assembly.companySnapshot.profile.positioning.value).toBe("Premium laadoplossingen");
    expect(assembly.companySnapshot.knownFacts.some((f) => f.value.includes("Marketing Peer"))).toBe(
      false
    );
  });

  it("localizes missing field labels in Dutch", () => {
    const message = formatMissingInformationMessage(
      [
        {
          id: "missing-industry",
          fieldKey: "industry",
          label: "Industry",
          priority: "high",
          reason: "",
          recommendedAction: "",
          customerImpact: "",
        },
        {
          id: "missing-usp",
          fieldKey: "uniqueSellingPoints",
          label: "Unique selling points",
          priority: "medium",
          reason: "",
          recommendedAction: "",
          customerImpact: "",
        },
      ],
      true
    );
    expect(message).toMatch(/branche/);
    expect(message).toMatch(/unieke voordelen/);
  });

  it("localizes raw unknown keys for customer-facing warnings", () => {
    expect(localizeUnknownFieldKeys(["industry", "mission"], true)).toBe("branche, missie");
  });

  it("blocks workflow advance when needs-info evidence is shown", () => {
    expect(
      evidenceBlocksWorkflowAdvance([
        { id: "needs-info", title: "Nog nodig", items: ["Ik heb nog nodig: branche, missie."] },
      ])
    ).toBe(true);
  });

  it("offers Campagnecontext aanvullen CTA while blocked", () => {
    const ctx = buildCampaignContext({
      project: liveProject(),
      domainInput: { projects: [liveProject()] } as never,
    });
    const ctas = buildEvidenceMissingCtas({
      sections: [{ id: "needs-info", title: "Nog nodig", items: ["Ik heb nog nodig: branche."] }],
      campaignContext: ctx,
      locale: "nl",
    });
    expect(ctas.find((c) => c.action === "add_context")?.label).toBe("Campagnecontext aanvullen");
    expect(ctas.find((c) => c.action === "later")?.label).toBe("Later aanvullen");
  });

  it("uses read-only close label for informational business step", () => {
    expect(evidencePrimaryActionLabel("business_analyzed", "semi_automatic", true)).toBe(
      "Sluiten"
    );
  });

  it("marks business_analyzed done when essential brand context exists", () => {
    persistLiveCampaignBrandContext(PEER, PROJECT_ID, {
      brandName: "You Charge",
      industry: "Energie",
      productsAndServices: ["Laadoplossingen"],
      uniqueSellingPoints: ["Snelle installatie"],
      targetAudience: "Ondernemers",
    });
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    project.campaignSetup = {
      ...project.campaignSetup!,
      websiteUrl: "https://you-charge.nl",
      competitorsSkipped: true,
    };
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: { projects: [project], drafts: [], workUnits: [] } as never,
      locale: "nl",
    });
    expect(workflow.steps.find((s) => s.id === "business_analyzed")?.state).toBe("done");
  });

  it("filters leaked Peergent facts defensively from evidence items", () => {
    const filtered = filterLeakedOrganizationFacts(
      ["Positioning: Peergent AI-werkplek", "Products: Marketing Peer", "Industry: Energie"],
      { usesExternalBrand: true, accountOrganizationName: "Peergent" }
    );
    expect(filtered).toEqual(["Industry: Energie"]);
  });

  it("never writes live brand context into demo store", () => {
    persistLiveCampaignBrandContext(PEER, PROJECT_ID, { brandName: "You Charge", industry: "Energie" });
    expect(getDemoCampaignSnapshot().campaignContexts[PROJECT_ID]).toBeUndefined();
  });
});

describe("organization vs campaign brand isolation", () => {
  it("campaign-specific brand context overrides unrelated organization defaults", () => {
    const orgProfile = buildPeergentCompanyProfile("nl");
    const ctx = buildCampaignContext({
      project: liveProject({
        campaignSetup: {
          ...liveProject().campaignSetup!,
          campaignBrandName: "You Charge",
          campaignBrandContext: {
            brandName: "You Charge",
            industry: "Energie",
          },
        },
      }),
      domainInput: { projects: [] } as never,
    });

    const result = buildCompanySnapshot({
      organizationId: "org-emma",
      companyProfile: orgProfile,
      marketingUnderstanding: null,
      campaignContext: ctx,
    });

    expect(result.snapshot.profile.companyName.value).toBe("You Charge");
    expect(result.snapshot.profile.industry.value).toBe("Energie");
  });
});
