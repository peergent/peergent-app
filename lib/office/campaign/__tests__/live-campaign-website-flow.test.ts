import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  buildEvidenceMissingCtas,
  evidenceBlocksWorkflowAdvance,
} from "@/lib/office/campaign/evidence-readiness";
import {
  normalizeCampaignWebsiteUrl,
  persistLiveCampaignWebsiteSkip,
  persistLiveCampaignWebsiteUrl,
} from "@/lib/office/campaign/live-campaign-context-store";
import { detectMissingInformation } from "@/lib/brain/context/missing-information";
import { buildCustomerSuppliedWebsiteSnapshot } from "@/lib/brain/website/build-customer-supplied-snapshot";
import { assembleCompanyContextSync } from "@/lib/brain/context/company-context-assembler";
import { buildPeergentCompanyProfile } from "@/lib/brain/demo/peergent-company-profile";
import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
  saveMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { resetDemoCampaignStore, addDemoWebsiteUrl, createDemoCampaign } from "@/lib/office/demo/demo-campaign-store";
import { getDemoCampaignSnapshot } from "@/lib/office/demo/demo-campaign-store";

const PEER = "emma";
const PROJECT_ID = "live-camp-1";

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
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

describe("live campaign website context flow", () => {
  beforeEach(() => {
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, {
      drafts: [],
      projects: [liveProject()],
    });
    resetDemoCampaignStore();
  });

  it("normalizes bare domains to https URLs", () => {
    expect(normalizeCampaignWebsiteUrl("you-charge.nl")).toBe("https://you-charge.nl");
    expect(normalizeCampaignWebsiteUrl("not-a-url")).toBeNull();
  });

  it("persists live website URL on marketing workspace project setup", () => {
    const updated = persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "you-charge.nl");
    expect(updated?.campaignSetup?.websiteUrl).toBe("https://you-charge.nl");
    expect(updated?.campaignSetup?.websiteSkipped).toBe(false);
    expect(updated?.campaignSetup?.websiteDecisionSource).toBe("customer_supplied");

    const stored = loadMarketingWorkspaceState(PEER).projects?.[0];
    expect(stored?.campaignSetup?.websiteUrl).toBe("https://you-charge.nl");
  });

  it("persists explicit skipped website decision for live campaigns", () => {
    const updated = persistLiveCampaignWebsiteSkip(PEER, PROJECT_ID);
    expect(updated?.campaignSetup?.websiteSkipped).toBe(true);
    expect(updated?.campaignSetup?.websiteDecisionSource).toBe("customer_skipped");
    expect(updated?.campaignSetup?.websiteUrl).toBeUndefined();
  });

  it("builds campaign context with available website state after URL persist", () => {
    persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "https://you-charge.nl");
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    expect(ctx.websiteState).toBe("available");
    expect(ctx.websiteUrl).toBe("https://you-charge.nl");
  });

  it("builds skipped website context distinct from missing", () => {
    persistLiveCampaignWebsiteSkip(PEER, PROJECT_ID);
    const project = loadMarketingWorkspaceState(PEER).projects![0]!;
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    expect(ctx.websiteState).toBe("skipped");
    expect(ctx.websiteSource).toBe("skipped");
  });

  it("does not flag missing website after explicit skip during assembly", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteSkipped: true,
        websiteDecisionSource: "customer_skipped",
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: { projects: [project] } as never });
    const profile = buildPeergentCompanyProfile("nl", new Date().toISOString());
    const missing = detectMissingInformation({
      profile: profile,
      website: null,
      websiteSkipped: ctx.websiteState === "skipped",
    });
    expect(missing.some((m) => m.fieldKey === "website")).toBe(false);
  });

  it("assembles customer-supplied website snapshot without crawl findings", () => {
    const snapshot = buildCustomerSuppliedWebsiteSnapshot({
      organizationId: "org-emma",
      url: "https://you-charge.nl",
      companyName: "You Charge",
    });
    expect(snapshot.source.method).toBe("customer_supplied");
    expect(snapshot.findings).toHaveLength(0);

    const assembly = assembleCompanyContextSync({
      organizationId: "org-emma",
      websiteUrl: "https://you-charge.nl",
      campaignContext: buildCampaignContext({
        project: liveProject({
          campaignSetup: {
            ...liveProject().campaignSetup!,
            websiteUrl: "https://you-charge.nl",
          },
        }),
        domainInput: { projects: [] } as never,
      }),
      locale: "nl",
    });
    expect(assembly.companySnapshot.website?.source.method).toBe("customer_supplied");
    expect(assembly.missingInformation.some((m) => m.fieldKey === "website")).toBe(false);
  });

  it("blocks workflow advance when evidence needs input", () => {
    expect(
      evidenceBlocksWorkflowAdvance([
        { id: "needs-info", title: "Nog nodig", items: ["Ik heb nog nodig: doelgroep."] },
      ])
    ).toBe(true);
  });

  it("does not offer website CTA after explicit skip in strategy needs-info", () => {
    const ctx = buildCampaignContext({
      project: liveProject({
        campaignSetup: {
          ...liveProject().campaignSetup!,
          websiteSkipped: true,
        },
      }),
      domainInput: { projects: [] } as never,
      websiteSkipped: true,
    });
    const ctas = buildEvidenceMissingCtas({
      sections: [{ id: "needs-info", title: "Nog nodig", items: ["Ik heb nog nodig: doelgroep."] }],
      campaignContext: ctx,
      locale: "nl",
    });
    expect(ctas.some((c) => c.action === "add_website")).toBe(false);
  });

  it("never writes live website decisions into demo store", () => {
    persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "https://you-charge.nl");
    expect(getDemoCampaignSnapshot().campaignContexts[PROJECT_ID]).toBeUndefined();
  });

  it("isolates live persistence per peer workspace key", () => {
    saveMarketingWorkspaceState("other-peer", { drafts: [], projects: [liveProject({ id: "other" })] });
    persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "https://you-charge.nl");
    const other = loadMarketingWorkspaceState("other-peer").projects?.[0];
    expect(other?.campaignSetup?.websiteUrl).toBeUndefined();
  });

  it("does not duplicate writes when persist is called twice with same URL", () => {
    persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "https://you-charge.nl");
    const first = loadMarketingWorkspaceState(PEER).projects?.[0]?.campaignSetup?.websiteDecisionAt;
    persistLiveCampaignWebsiteUrl(PEER, PROJECT_ID, "https://you-charge.nl");
    const second = loadMarketingWorkspaceState(PEER).projects?.[0]?.campaignSetup?.websiteDecisionAt;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(loadMarketingWorkspaceState(PEER).projects).toHaveLength(1);
  });

  it("rejects demo peer in live store", () => {
    patchMarketingWorkspaceState("demo", { projects: [liveProject({ peerId: "demo" })] });
    expect(() => persistLiveCampaignWebsiteUrl("demo", PROJECT_ID, "https://peergent.com")).toThrow();
  });
});

describe("demo website handlers unchanged", () => {
  beforeEach(() => {
    resetDemoCampaignStore();
  });

  it("demo store still handles website URL separately from live workspace", () => {
    const project = createDemoCampaign(
      "demo",
      {
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Peergent",
        goalLabel: "Demo-aanvragen",
        description: "Demo campagne",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "nl"
    );
    addDemoWebsiteUrl("demo", project.id, "https://peergent.com");
    expect(getDemoCampaignSnapshot().campaignContexts[project.id]?.websiteUrl).toBe(
      "https://peergent.com"
    );
  });
});
