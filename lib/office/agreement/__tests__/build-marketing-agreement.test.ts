import { describe, expect, it } from "vitest";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { IntegrationConnection } from "@/lib/integrations/types";

function responsibility(
  overrides?: Partial<MarketingResponsibility>
): MarketingResponsibility {
  return {
    id: "r1",
    peerId: "emma",
    title: "LinkedIn posting",
    description: "Writes and publishes LinkedIn posts.",
    category: "content" as MarketingResponsibility["category"],
    goal: "Awareness",
    cadence: { type: "weekly" } as MarketingResponsibility["cadence"],
    autonomyLevel: "semi_autonomous",
    approvalPolicy: "approval_required",
    priority: 1,
    status: "enabled",
    enabled: true,
    guardrails: {},
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
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

function build(input: MarketingPeerDomainInput, locale?: string) {
  return buildMarketingAgreementViewModel({
    domainInput: input,
    peerName: "Emma",
    peerRole: "Marketing",
    localePreference: locale,
  });
}

describe("Working agreement — the three boundaries are separated", () => {
  it("puts fully automatic work under what she handles alone", () => {
    const model = build(
      domain({
        responsibilities: [
          responsibility({ approvalPolicy: "fully_automatic", autonomyLevel: "autonomous" }),
        ],
      })
    );
    expect(model.autonomous).toHaveLength(1);
    expect(model.needsApproval).toHaveLength(0);
    expect(model.never).toHaveLength(0);
  });

  it("puts prepare-only work under what she always asks about", () => {
    const model = build(
      domain({ responsibilities: [responsibility({ approvalPolicy: "prepare_only" })] })
    );
    expect(model.needsApproval).toHaveLength(1);
  });

  it("treats a disabled responsibility as something she never does", () => {
    const model = build(
      domain({
        responsibilities: [
          responsibility({
            enabled: false,
            status: "disabled",
            approvalPolicy: "fully_automatic",
          }),
        ],
      })
    );
    // Disabled wins over a permissive policy.
    expect(model.never).toHaveLength(1);
    expect(model.autonomous).toHaveLength(0);
  });

  it("honours an explicit approval guardrail over a permissive autonomy level", () => {
    const model = build(
      domain({
        responsibilities: [
          responsibility({
            autonomyLevel: "full",
            approvalPolicy: "approval_required",
            guardrails: { approvalRequired: true },
          }),
        ],
      })
    );
    expect(model.needsApproval).toHaveLength(1);
  });
});

describe("Working agreement — consequence and reversibility", () => {
  it("states the consequence of every boundary", () => {
    const model = build(
      domain({
        responsibilities: [
          responsibility({ id: "a", approvalPolicy: "fully_automatic" }),
          responsibility({ id: "b", approvalPolicy: "approval_required" }),
          responsibility({ id: "c", enabled: false, status: "disabled" }),
        ],
      })
    );
    const all = [...model.autonomous, ...model.needsApproval, ...model.never];
    expect(all).toHaveLength(3);
    for (const boundary of all) {
      expect(boundary.consequence.trim().length).toBeGreaterThan(0);
      expect(boundary.reversal.trim().length).toBeGreaterThan(0);
    }
  });

  it("says autonomous work happens without asking", () => {
    const model = build(
      domain({
        responsibilities: [responsibility({ approvalPolicy: "fully_automatic" })],
      })
    );
    expect(model.autonomous[0]?.consequence.toLowerCase()).toContain("without asking");
  });

  it("says approval-required work stops until the customer says yes", () => {
    const model = build(domain({ responsibilities: [responsibility()] }));
    expect(model.needsApproval[0]?.consequence.toLowerCase()).toContain(
      "nothing happens until you say yes"
    );
  });

  it("tells the customer how to undo widening", () => {
    const model = build(
      domain({
        responsibilities: [responsibility({ approvalPolicy: "fully_automatic" })],
      })
    );
    expect(model.autonomous[0]?.reversal.toLowerCase()).toContain("ask me first");
    expect(model.autonomous[0]?.reversal.toLowerCase()).toContain("kept");
  });

  it("records when each boundary last moved", () => {
    const model = build(domain({ responsibilities: [responsibility()] }));
    expect(model.needsApproval[0]?.lastChangedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(model.needsApproval[0]?.lastChangedLabel).toContain("Changed");
  });
});

describe("Working agreement — provenance is never blurred", () => {
  const withBrand = domain({
    responsibilities: [
      responsibility({ guardrails: { maxMonthlySpend: 500, brandTone: "Direct" } }),
    ],
    understanding: {
      available: true,
      sparse: false,
      completeness: 70,
      gaps: [],
      brand: {
        values: [],
        toneOfVoice: { summary: "Plain and direct." },
        keyMessages: [],
        positioningStatement: "Specialist for Dutch SMEs.",
      },
      products: [],
      services: [],
      customerSegments: [],
      competitors: [],
      goals: [],
      existingContent: [],
      assembledAt: "2026-07-28T00:00:00.000Z",
    },
  });

  it("labels her own reading as understanding, and makes it correctable", () => {
    const model = build(withBrand);
    const tone = model.knowledge.find((k) => k.id === "tone");
    expect(tone?.provenance).toBe("emma_understanding");
    expect(tone?.correctable).toBe(true);
  });

  it("labels an explicit guardrail as a customer rule, and not correctable here", () => {
    const model = build(withBrand);
    const rule = model.knowledge.find((k) => k.provenance === "customer_rule");
    expect(rule).toBeDefined();
    // A rule the customer set is changed on its boundary, not corrected here.
    expect(rule?.correctable).toBe(false);
  });

  it("labels objective facts as system facts", () => {
    const model = build(withBrand);
    const fact = model.knowledge.find((k) => k.id === "role");
    expect(fact?.provenance).toBe("system_fact");
    expect(fact?.correctable).toBe(false);
  });

  it("only ever marks her own understanding as correctable", () => {
    const model = build(withBrand);
    for (const entry of model.knowledge) {
      if (entry.correctable) expect(entry.provenance).toBe("emma_understanding");
    }
  });

  it("says plainly when it has learned nothing yet", () => {
    const model = build(domain({ responsibilities: [responsibility()] }));
    expect(model.noLearnedUnderstanding).toBeTruthy();
    expect(
      model.knowledge.some((k) => k.provenance === "emma_understanding")
    ).toBe(false);
  });
});

describe("Working agreement — access and history", () => {
  it("shows only real connections and states what each unlocks", () => {
    const connection: IntegrationConnection = {
      id: "linkedin",
      label: "LinkedIn",
      status: "not_connected",
      settingsHref: "/settings",
      lastSyncedAt: null,
    };
    const model = build(
      domain({ responsibilities: [responsibility()], connections: [connection] })
    );
    expect(model.connections).toHaveLength(1);
    expect(model.connections[0]?.connected).toBe(false);
    expect(model.connections[0]?.unlocks.toLowerCase()).toContain("can't publish");
  });

  it("invents no connections when none exist", () => {
    const model = build(domain({ responsibilities: [responsibility()] }));
    expect(model.connections).toHaveLength(0);
  });

  it("builds history newest first from the records' own timestamps", () => {
    const model = build(
      domain({
        responsibilities: [
          responsibility({ id: "a", updatedAt: "2026-07-01T00:00:00.000Z" }),
          responsibility({ id: "b", updatedAt: "2026-07-28T00:00:00.000Z" }),
        ],
      })
    );
    expect(model.history[0]?.at).toBe("2026-07-28T00:00:00.000Z");
  });
});

describe("Working agreement — she never lobbies here", () => {
  it("states the current boundary without asking for more", () => {
    const model = build(
      domain({
        responsibilities: [responsibility({ approvalPolicy: "fully_automatic" })],
      })
    );
    const text = model.presence.text.toLowerCase();
    expect(text).not.toContain("want me to");
    expect(text).not.toContain("shall i");
    expect(model.presence.rung).toBe("observation");
  });

  it("orients when no agreement exists yet", () => {
    const model = build(domain());
    expect(model.presence.rung).toBe("orientation");
    expect(model.empty).not.toBeNull();
    expect(model.presence.text.toLowerCase()).toContain("ask about everything first");
  });
});

describe("Working agreement — localization", () => {
  it("renders Dutch copy", () => {
    const model = build(domain({ responsibilities: [responsibility()] }), "nl");
    expect(model.copy.title).toBe("Werkafspraak");
    expect(model.copy.provenanceEmma).toBe("Mijn beeld");
  });
});
