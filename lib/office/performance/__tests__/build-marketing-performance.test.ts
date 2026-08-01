import { describe, expect, it } from "vitest";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

const NOW = new Date("2026-07-30T12:00:00.000Z");

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

function draft(overrides?: Partial<MarketingContentDraft>): MarketingContentDraft {
  return {
    id: "d1",
    planActivityReference: "a1",
    contentType: "linkedin_post",
    channel: "linkedin",
    objective: "awareness",
    title: "Post",
    body: "Body",
    keywords: [],
    rationale: {} as MarketingContentDraft["rationale"],
    sourceReferences: [],
    confidence: "medium" as MarketingContentDraft["confidence"],
    status: "published",
    warnings: [],
    generatedAt: "2026-07-20T00:00:00.000Z",
    ...overrides,
  };
}

function build(
  input: MarketingPeerDomainInput,
  searchParams?: string,
  locale?: string
) {
  return buildMarketingPerformanceViewModelForOffice({
    domainInput: input,
    peerName: "Emma",
    peerRole: "Marketing",
    localePreference: locale,
    searchParams: searchParams ? new URLSearchParams(searchParams) : undefined,
    now: NOW,
  });
}

describe("Performance — never fabricates", () => {
  it("shows no channel metric when nothing is connected", () => {
    const model = build(domain({ drafts: [draft()] }));
    expect(model.metrics.every((m) => m.source === "counted")).toBe(true);
  });

  it("turns an unavailable metric into a named gap, never a zero", () => {
    const model = build(domain({ drafts: [draft()] }));
    expect(model.gaps.length).toBeGreaterThan(0);
    for (const gap of model.gaps) {
      expect(gap.missing.trim()).not.toBe("");
      expect(gap.unlocks.trim()).not.toBe("");
      expect(gap.ctaHref).toContain("/office/emma");
    }
    // A gap must never appear as a metric with a value.
    const gapIds = new Set(model.gaps.map((g) => g.id));
    expect(model.metrics.some((m) => gapIds.has(m.id))).toBe(false);
  });

  it("declares methodology on every metric it shows", () => {
    const model = build(domain({ drafts: [draft()] }));
    for (const metric of model.metrics) {
      expect(metric.methodology.trim().length).toBeGreaterThan(0);
    }
  });

  it("never shows more than four metrics", () => {
    const model = build(
      domain({
        drafts: Array.from({ length: 20 }, (_, i) =>
          draft({ id: `d${i}`, generatedAt: "2026-07-20T00:00:00.000Z" })
        ),
      })
    );
    expect(model.metrics.length).toBeLessThanOrEqual(4);
  });

  it("draws no trend from a single point", () => {
    const model = build(domain({ drafts: [draft()] }));
    expect(model.trend).toBeNull();
  });

  it("draws a trend once there is a real shape", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", generatedAt: "2026-07-10T00:00:00.000Z" }),
          draft({ id: "b", generatedAt: "2026-07-20T00:00:00.000Z" }),
        ],
      })
    );
    expect(model.trend?.points.length).toBe(2);
    expect(model.trend?.methodology).toBeTruthy();
  });
});

describe("Performance — interpretation stability", () => {
  it("produces identical text for identical input", () => {
    const input = domain({
      drafts: [
        draft({ id: "a", generatedAt: "2026-07-10T00:00:00.000Z" }),
        draft({ id: "b", generatedAt: "2026-07-20T00:00:00.000Z" }),
      ],
    });

    const first = build(input);
    const second = build(input);

    // §8.1 When the conclusion has not changed the sentence stays
    // byte-identical — she does not rephrase.
    expect(first.presence.text).toBe(second.presence.text);
    expect(first.presence.rung).toBe(second.presence.rung);
  });

  it("holds the sentence when the data changes but the conclusion does not", () => {
    // Older work falls outside the 7-day window but inside the 90-day one, so
    // the counted numbers genuinely differ between the two views.
    const input = domain({
      drafts: [
        draft({ id: "old-a", generatedAt: "2026-05-02T00:00:00.000Z" }),
        draft({ id: "old-b", generatedAt: "2026-05-04T00:00:00.000Z" }),
        draft({ id: "recent", generatedAt: "2026-07-29T00:00:00.000Z" }),
      ],
    });

    const wide = build(input, "period=365d");
    const narrow = build(input, "period=7d");

    const publishedIn = (m: ReturnType<typeof build>) =>
      m.metrics.find((metric) => metric.id === "published")?.value;

    // The evidence differs...
    expect(publishedIn(wide)).toBe("3");
    expect(publishedIn(narrow)).toBe("1");

    // ...but with nothing connected the honest conclusion is the same in both
    // views, so §8.1 requires the sentence to stay byte-identical rather than
    // be reworded to look responsive.
    expect(wide.presence.rung).toBe("gap");
    expect(narrow.presence.rung).toBe("gap");
    expect(wide.presence.text).toBe(narrow.presence.text);
  });

  it("moves off the gap rung only when a source actually reports", () => {
    const model = build(domain({ drafts: [draft()] }));
    // No connection, so an interpretation must be unreachable regardless of
    // how much work has been published.
    expect(model.presence.rung).toBe("gap");
    expect(model.signals.every((s) => s.fact.length > 0)).toBe(true);
  });

  it("separates observed fact from interpretation on every signal", () => {
    const input = domain({
      drafts: Array.from({ length: 6 }, (_, i) =>
        draft({ id: `d${i}`, generatedAt: "2026-07-25T00:00:00.000Z" })
      ),
    });
    const model = build(input, "period=30d");
    for (const signal of model.signals) {
      expect(signal.fact.trim()).not.toBe("");
      expect(signal.interpretation.trim()).not.toBe("");
      expect(signal.fact).not.toBe(signal.interpretation);
    }
  });
});

describe("Performance — integration health", () => {
  it("treats a source needing reconnection as a fault she owns", () => {
    const model = build(
      domain({
        drafts: [draft()],
        connections: [
          {
            id: "linkedin",
            label: "LinkedIn",
            status: "needs_reconnect",
            settingsHref: "/settings",
            lastSyncedAt: null,
          },
        ],
      })
    );
    expect(model.presence.rung).toBe("fault");
    expect(model.presence.text).toContain("LinkedIn");
    expect(model.presence.text).toContain("their end, not yours");
  });

  it("does not raise a fault for a source that was simply never connected", () => {
    const model = build(
      domain({
        drafts: [draft()],
        connections: [
          {
            id: "linkedin",
            label: "LinkedIn",
            status: "not_connected",
            settingsHref: "/settings",
            lastSyncedAt: null,
          },
        ],
      })
    );
    expect(model.presence.rung).not.toBe("fault");
  });
});

describe("Performance — campaign attribution", () => {
  it("counts content linked only by plan reference", () => {
    const model = build(
      domain({
        drafts: [draft({ id: "orphan", planActivityReference: "a9" })],
        workUnits: [
          {
            id: "u1",
            peerId: "emma",
            projectId: "p1",
            role: "Marketing",
            title: "Post",
            status: "published",
            deliverableKind: "linkedin",
            channel: "linkedin",
            objective: null,
            audience: null,
            needsVisual: false,
            recurrence: "once",
            automationTrigger: null,
            // No draftId — the link exists only through the plan reference.
            draftId: null,
            planActivityReference: "a9",
            rawRequest: "",
            startedAt: "2026-07-20T00:00:00.000Z",
            updatedAt: "2026-07-20T00:00:00.000Z",
            estimatedCompletionAt: null,
            artifacts: [],
            eventLog: [],
            paused: false,
            cancelled: false,
          },
        ],
        projects: [
          {
            id: "p1",
            peerId: "emma",
            title: "Launch",
            goal: "g",
            campaignType: "product_launch",
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
            ownerLabel: "Pilot",
            rawRequest: "",
          },
        ],
      }),
      "period=90d"
    );

    const cut = model.cuts.find((c) => c.id === "by-campaign");
    expect(cut?.rows[0]?.label).toBe("Launch");
    expect(cut?.rows[0]?.value).toBe("1");
  });
});

describe("Performance — filters", () => {
  it("defaults to 30 days and marks it active", () => {
    const model = build(domain());
    expect(model.filters.period).toBe("30d");
    const period = model.filterGroups.find((g) => g.id === "period");
    expect(period?.options.find((o) => o.active)?.id).toBe("30d");
  });

  it("reflects filters in the URL so a view is shareable", () => {
    const model = build(domain({ drafts: [draft()] }), "period=7d");
    const period = model.filterGroups.find((g) => g.id === "period");
    const year = period?.options.find((o) => o.id === "365d");
    expect(year?.href).toContain("period=365d");
    expect(model.filters.period).toBe("7d");
  });

  it("scopes counted output to the selected channel", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", channel: "linkedin" }),
          draft({ id: "b", channel: "instagram" }),
        ],
      }),
      "period=365d&channel=linkedin"
    );
    expect(model.filters.channel).toBe("linkedin");
    expect(model.metrics.find((m) => m.id === "published")?.value).toBe("1");
  });

  it("ignores an unknown period rather than breaking", () => {
    const model = build(domain(), "period=banana");
    expect(model.filters.period).toBe("30d");
  });
});

describe("Performance — localization", () => {
  it("renders Dutch copy and a Dutch reading", () => {
    const model = build(domain({ drafts: [draft()] }), undefined, "nl");
    expect(model.copy.title).toBe("Prestaties");
    expect(model.presence.text.length).toBeGreaterThan(0);
  });
});
