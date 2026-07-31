import { describe, expect, it } from "vitest";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingCompetitorSummary,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence/types/understanding";

const NOW = new Date("2026-07-30T12:00:00.000Z");

function competitor(
  overrides?: Partial<MarketingCompetitorSummary>
): MarketingCompetitorSummary {
  return {
    id: "c1",
    name: "Northwind",
    strengths: [],
    weaknesses: [],
    differentiators: [],
    ...overrides,
  };
}

function understanding(
  overrides?: Partial<MarketingUnderstanding>
): MarketingUnderstanding {
  return {
    available: true,
    sparse: false,
    completeness: 70,
    gaps: [],
    brand: { values: [], toneOfVoice: {}, keyMessages: [] },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: "2026-07-28T00:00:00.000Z",
    ...overrides,
  };
}

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

function build(input: MarketingPeerDomainInput, locale?: string, now = NOW) {
  return buildMarketingMarketViewModel({
    domainInput: input,
    peerName: "Emma",
    peerRole: "Marketing",
    localePreference: locale,
    now,
  });
}

describe("Market — fact and inference are never blurred", () => {
  const twoWeak = understanding({
    competitors: [
      competitor({
        id: "c1",
        name: "Northwind",
        differentiators: ["price"],
        weaknesses: ["support"],
      }),
      competitor({
        id: "c2",
        name: "Eastgate",
        differentiators: ["speed"],
        weaknesses: ["support"],
      }),
    ],
  });

  it("records what is on file as observed", () => {
    const model = build(domain({ understanding: twoWeak }));
    expect(model.observedFacts.length).toBeGreaterThan(0);
    for (const fact of model.observedFacts) {
      expect(fact.evidence).toBe("observed");
      expect(fact.sourceLabel).toBeTruthy();
    }
  });

  it("marks a derived reading as an inference, not a fact", () => {
    const model = build(domain({ understanding: twoWeak }));
    expect(model.inferences.length).toBeGreaterThan(0);
    for (const inference of model.inferences) {
      expect(inference.evidence).toBe("likely");
    }
    // The shared-weakness reading must never appear among observed facts.
    const observedIds = model.observedFacts.map((o) => o.id);
    expect(observedIds.some((id) => id.startsWith("inf:"))).toBe(false);
  });

  it("only infers a shared weakness when more than one competitor has it", () => {
    const single = understanding({
      competitors: [
        competitor({ id: "c1", differentiators: ["price"], weaknesses: ["support"] }),
        competitor({ id: "c2", name: "Eastgate", differentiators: ["speed"] }),
      ],
    });
    const model = build(domain({ understanding: single }));
    expect(model.inferences).toHaveLength(0);
  });

  it("ties every interpretation back to the observations it rests on", () => {
    const model = build(domain({ understanding: twoWeak }));
    expect(model.interpretation?.basedOn.length).toBeGreaterThan(0);
  });

  it("attaches every observation to a competitor by stable id, never by name", () => {
    const model = build(domain({ understanding: twoWeak }));
    const ids = new Set(model.competitors.map((c) => c.id));
    for (const fact of model.observedFacts) {
      if (fact.competitorId) expect(ids.has(fact.competitorId)).toBe(true);
    }
  });
});

describe("Market — positioning is grounded or absent", () => {
  it("compares stated positioning when the inputs are comparable", () => {
    const model = build(
      domain({
        understanding: understanding({
          brand: {
            values: [],
            toneOfVoice: {},
            keyMessages: ["expertise"],
            positioningStatement: "We are the specialist for Dutch SMEs.",
          },
          competitors: [
            competitor({ id: "c1", differentiators: ["price"] }),
            competitor({ id: "c2", name: "Eastgate", differentiators: ["speed"] }),
          ],
        }),
      })
    );

    expect(model.position).not.toBeNull();
    expect(model.position?.ownStatement).toContain("Dutch SMEs");
    expect(model.position?.competitors).toHaveLength(2);
    expect(model.positionUnavailable).toBeNull();
  });

  it("always states that this is stated positioning, not measured share", () => {
    const model = build(
      domain({
        understanding: understanding({
          brand: {
            values: [],
            toneOfVoice: {},
            keyMessages: [],
            positioningStatement: "Specialist.",
          },
          competitors: [
            competitor({ id: "c1", differentiators: ["price"] }),
            competitor({ id: "c2", name: "Eastgate", differentiators: ["speed"] }),
          ],
        }),
      })
    );
    expect(model.position?.caveat.toLowerCase()).toContain("not a measured");
  });

  it("refuses to compare when the customer's own position is unknown", () => {
    const model = build(
      domain({
        understanding: understanding({
          competitors: [
            competitor({ id: "c1", differentiators: ["price"] }),
            competitor({ id: "c2", name: "Eastgate", differentiators: ["speed"] }),
          ],
        }),
      })
    );
    expect(model.position).toBeNull();
    expect(model.positionUnavailable?.reason).toContain("position yourselves");
  });

  it("refuses to compare against too few comparable competitors", () => {
    const model = build(
      domain({
        understanding: understanding({
          brand: {
            values: [],
            toneOfVoice: {},
            keyMessages: [],
            positioningStatement: "Specialist.",
          },
          competitors: [competitor({ id: "c1", differentiators: ["price"] })],
        }),
      })
    );
    expect(model.position).toBeNull();
    expect(model.positionUnavailable).not.toBeNull();
  });
});

describe("Market — never fabricates", () => {
  it("invents no pricing, spend, share or results", () => {
    const model = build(
      domain({
        understanding: understanding({
          competitors: [
            competitor({ id: "c1", differentiators: ["price"], strengths: ["brand"] }),
          ],
        }),
      })
    );
    const allText = [
      model.presence.text,
      ...model.observedFacts.map((o) => o.statement),
      ...model.inferences.map((o) => o.statement),
      model.interpretation?.text ?? "",
    ].join(" ");

    expect(allText).not.toMatch(/€|\$|%/);
    expect(allText.toLowerCase()).not.toContain("market share");
    expect(allText.toLowerCase()).not.toContain("ad spend");
  });

  it("says a thin record is thin rather than padding it", () => {
    const model = build(
      domain({ understanding: understanding({ competitors: [competitor()] }) })
    );
    expect(model.competitors[0]?.isThin).toBe(true);
    expect(model.partialData).toBeTruthy();
    expect(model.observedFacts).toHaveLength(0);
  });
});

describe("Market — freshness and staleness", () => {
  it("flags knowledge older than the staleness window", () => {
    const model = build(
      domain({
        understanding: understanding({
          assembledAt: "2026-01-01T00:00:00.000Z",
          competitors: [
            competitor({ id: "c1", differentiators: ["price"] }),
            competitor({ id: "c2", name: "Eastgate", differentiators: ["speed"] }),
          ],
        }),
      })
    );
    expect(model.freshness.isStale).toBe(true);
    expect(model.freshness.staleNotice).toContain("days old");
    // Stale knowledge is never presented as a confident reading.
    expect(model.presence.rung).toBe("qualified");
  });

  it("does not flag recent knowledge", () => {
    const model = build(
      domain({
        understanding: understanding({
          competitors: [competitor({ id: "c1", differentiators: ["price"] })],
        }),
      })
    );
    expect(model.freshness.isStale).toBe(false);
    expect(model.freshness.staleNotice).toBeNull();
  });
});

describe("Market — states", () => {
  it("orients when no competitors are tracked", () => {
    const model = build(domain({ understanding: understanding() }));
    expect(model.noCompetitors).not.toBeNull();
    expect(model.presence.rung).toBe("orientation");
  });

  it("declares the gap when only names are known", () => {
    const model = build(
      domain({ understanding: understanding({ competitors: [competitor()] }) })
    );
    expect(model.presence.rung).toBe("gap");
  });

  it("handles missing understanding without throwing", () => {
    const model = build(domain());
    expect(model.competitors).toHaveLength(0);
    expect(model.noCompetitors).not.toBeNull();
  });
});

describe("Market — localization", () => {
  it("renders Dutch copy", () => {
    const model = build(
      domain({ understanding: understanding({ competitors: [competitor()] }) }),
      "nl"
    );
    expect(model.copy.title).toBe("Markt");
    expect(model.copy.evidenceLikely).toBe("Afgeleid");
  });
});
