import { describe, expect, it } from "vitest";
import { buildV17ResultsViewModel } from "@/lib/customer-v17/build-v17-results-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

function domain(overrides?: Partial<MarketingPeerDomainInput>): MarketingPeerDomainInput {
  return {
    peerId: "emma",
    userName: "Pilot",
    peerName: "Emma",
    campaignTitle: "Summer",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    projects: [],
    workUnits: [],
    drafts: [],
    publicationPackages: [],
    responsibilities: [],
    connections: [],
    activityFeed: [],
    automations: [],
    ...overrides,
  };
}

function project(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: "p1",
    peerId: "emma",
    title: "Launch",
    goal: "Grow awareness",
    campaignType: "product_launch",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "",
    ...overrides,
  };
}

function draft(overrides?: Partial<MarketingContentDraft>): MarketingContentDraft {
  return {
    id: "d1",
    planActivityReference: "a1",
    contentType: "linkedin_post",
    channel: "linkedin",
    objective: "awareness",
    title: "Summer launch post",
    body: "Body copy",
    keywords: [],
    rationale: {} as MarketingContentDraft["rationale"],
    sourceReferences: [],
    confidence: "medium" as MarketingContentDraft["confidence"],
    status: "ready_for_review",
    warnings: [],
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildV17ResultsViewModel — structure", () => {
  it("always renders exactly four KPI cards", () => {
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    expect(model.kpis).toHaveLength(4);
    expect(model.kpis.map((k) => k.id)).toEqual([
      "campaigns-completed",
      "campaigns-running",
      "estimated-reach",
      "qualified-leads",
    ]);
  });

  it("gives every KPI a plain-language explanation", () => {
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    for (const kpi of model.kpis) {
      expect(kpi.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it("reports no attention items when nothing needs action", () => {
    // Drives the view's hide-completely branch for Attention Needed.
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    expect(model.attention).toEqual([]);
  });

  it("passes through attention items when action is required", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain(),
      attention: [
        {
          id: "a1",
          title: "Approve campaign strategy",
          whyItMatters: "Your Peer needs a decision to continue.",
          primaryActionLabel: "Review",
          href: "/team/emma/waiting",
          kind: "single",
          icon: "approval",
        },
      ],
    });
    expect(model.attention).toHaveLength(1);
    expect(model.attention[0]?.primaryActionLabel).toBe("Review");
  });

  it("shows the onboarding card only when nothing exists yet", () => {
    const empty = buildV17ResultsViewModel({ domainInput: domain() });
    expect(empty.onboarding).not.toBeNull();

    const withWork = buildV17ResultsViewModel({
      domainInput: domain({ projects: [project()] }),
    });
    expect(withWork.onboarding).toBeNull();
  });
});

describe("buildV17ResultsViewModel — honest analytics", () => {
  it("never invents reach or leads without a connection", () => {
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    const reach = model.kpis.find((k) => k.id === "estimated-reach");
    const leads = model.kpis.find((k) => k.id === "qualified-leads");

    expect(reach?.value).toBeNull();
    expect(leads?.value).toBeNull();
    expect(reach?.unavailable?.ctaHref).toContain("connections");
    expect(leads?.unavailable?.ctaHref).toBeTruthy();
  });

  it("explains which connection each unavailable KPI needs", () => {
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    const leads = model.kpis.find((k) => k.id === "qualified-leads");
    expect(leads?.unavailable?.message.toLowerCase()).toContain("crm");
  });

  it("never fabricates a trend", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain({ projects: [project()] }),
    });
    const internal = model.kpis.filter((k) =>
      ["campaigns-completed", "campaigns-running"].includes(k.id)
    );
    for (const kpi of internal) {
      expect(kpi.trend).toBeNull();
    }
  });
});

describe("buildV17ResultsViewModel — counts and range", () => {
  it("counts running campaigns from real project status", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain({ projects: [project(), project({ id: "p2" })] }),
    });
    expect(model.kpis.find((k) => k.id === "campaigns-running")?.value).toBe("2");
  });

  it("defaults to this month and marks the active range", () => {
    const model = buildV17ResultsViewModel({ domainInput: domain() });
    expect(model.ranges.find((r) => r.active)?.id).toBe("month");
    expect(model.ranges).toHaveLength(4);
  });

  it("honours an explicit range from search params", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain(),
      searchParams: new URLSearchParams("range=week"),
    });
    expect(model.ranges.find((r) => r.active)?.id).toBe("week");
  });

  it("excludes work older than the selected range", () => {
    const old = draft({
      id: "old",
      generatedAt: "2020-01-01T00:00:00.000Z",
      status: "published",
    });
    const model = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [old] }),
      searchParams: new URLSearchParams("range=week"),
    });
    expect(model.deliverables).toHaveLength(0);

    const allTime = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [old] }),
      searchParams: new URLSearchParams("range=all"),
    });
    expect(allTime.deliverables).toHaveLength(1);
  });
});

describe("buildV17ResultsViewModel — deliverables", () => {
  it("maps draft status to customer-facing labels", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [draft()] }),
    });
    expect(model.deliverables[0]?.statusTone).toBe("needs_approval");
    expect(model.deliverables[0]?.statusLabel).toBe("Needs approval");
  });

  it("surfaces platform and a link for each deliverable", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [draft()] }),
    });
    expect(model.deliverables[0]?.platform).toBe("Linkedin");
    expect(model.deliverables[0]?.href).toBeTruthy();
  });

  it("lists newest deliverables first", () => {
    const older = draft({ id: "older", generatedAt: "2026-07-01T00:00:00.000Z" });
    const newer = draft({ id: "newer", generatedAt: "2026-07-27T00:00:00.000Z" });
    const model = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [older, newer] }),
      searchParams: new URLSearchParams("range=all"),
    });
    expect(model.deliverables.map((d) => d.id)).toEqual(["newer", "older"]);
  });
});

describe("buildV17ResultsViewModel — insights", () => {
  it("reports a publishing gap only when one genuinely exists", () => {
    const stale = draft({
      status: "published",
      generatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const model = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [stale] }),
      searchParams: new URLSearchParams("range=all"),
    });
    const gap = model.insights.find((i) => i.id === "insight-publish-gap");
    expect(gap?.observation).toMatch(/20 days/);

    const fresh = draft({ status: "published", generatedAt: new Date().toISOString() });
    const noGap = buildV17ResultsViewModel({
      domainInput: domain({ drafts: [fresh] }),
    });
    expect(noGap.insights.find((i) => i.id === "insight-publish-gap")).toBeUndefined();
  });

  it("flags two live campaigns sharing one audience", () => {
    const setup = {
      description: "d",
      primaryGoalId: "awareness",
      confirmedAudience: "Dutch SME founders",
    } as MarketingProject["campaignSetup"];

    const model = buildV17ResultsViewModel({
      domainInput: domain({
        projects: [
          project({ id: "p1", campaignSetup: setup }),
          project({ id: "p2", campaignSetup: setup }),
        ],
      }),
    });
    const overlap = model.insights.find((i) => i.id === "insight-shared-audience");
    expect(overlap?.observation).toContain("Dutch SME founders");
  });

  it("does not flag an audience used by only one campaign", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain({
        projects: [
          project({
            campaignSetup: {
              description: "d",
              primaryGoalId: "awareness",
              confirmedAudience: "Dutch SME founders",
            } as MarketingProject["campaignSetup"],
          }),
        ],
      }),
    });
    expect(
      model.insights.find((i) => i.id === "insight-shared-audience")
    ).toBeUndefined();
  });
});

describe("buildV17ResultsViewModel — localization", () => {
  it("renders Dutch copy", () => {
    const model = buildV17ResultsViewModel({
      domainInput: domain(),
      localePreference: "nl",
    });
    expect(model.title).toBe("Marketingresultaten");
    expect(model.kpis[0]?.label).toBe("Campagnes afgerond");
    expect(model.onboarding?.headline).toBe("Je Marketing Peer is klaar.");
  });

  it("phrases recommendations as colleague advice, not analytics", () => {
    expect(
      buildV17ResultsViewModel({ domainInput: domain() }).copy.recommendationLabel
    ).toBe("What I'd suggest");
    expect(
      buildV17ResultsViewModel({ domainInput: domain(), localePreference: "nl" }).copy
        .recommendationLabel
    ).toBe("Wat ik zou doen");
  });
});
